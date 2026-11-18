import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GAME_CONFIG, TOWER_TYPES, getWaveDefinition } from './config.js';
import { BaixoMap } from './map.js';
import { EffectsManager } from './effects.js';
import { Enemy } from './enemies.js';
import { Tower } from './towers.js';
import { sound } from './audio.js';

class MadrugadaGame {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.labelsContainer = document.getElementById('floating-labels');

    // Core Three.js setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070914);
    this.scene.fog = new THREE.FogExp2(0x070914, 0.012);

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 160);
    this.resetCameraTransform();

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.07;
    this.controls.maxPolarAngle = Math.PI * 0.44;
    this.controls.minPolarAngle = Math.PI * 0.14;
    this.controls.minDistance = 15;
    this.controls.maxDistance = 58;
    this.controls.target.set(0, 0, 0);

    // Subsystems
    this.map = new BaixoMap(this.scene);
    this.effects = new EffectsManager(this.scene, this.camera, this.labelsContainer);

    // Range indicator ring (shared for placement preview & selected tower)
    this.rangeRingMat = new THREE.MeshBasicMaterial({
      color: 0x2ec4b6,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.24,
      depthWrite: false
    });
    this.rangeRingBorderMat = new THREE.MeshBasicMaterial({
      color: 0x2ec4b6,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.78,
      depthWrite: false
    });
    this.rangeGroup = new THREE.Group();
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1, 48), this.rangeRingMat);
    disc.rotation.x = -Math.PI / 2;
    const border = new THREE.Mesh(new THREE.RingGeometry(0.97, 1.0, 48), this.rangeRingBorderMat);
    border.rotation.x = -Math.PI / 2;
    border.position.y = 0.01;
    this.rangeGroup.add(disc, border);
    this.rangeGroup.visible = false;
    this.scene.add(this.rangeGroup);

    // Raycasting
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.pointerDownPos = { x: 0, y: 0 };
    this.hoveredPad = null;

    // Game state
    this.money = GAME_CONFIG.startingMoney;
    this.sleep = GAME_CONFIG.startingSleep;
    this.wave = 0;
    this.endlessMode = false;
    this.gameSpeed = 1;
    this.isWaveActive = false;
    this.gameOver = false;
    this.started = false;

    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.spawnQueue = [];
    this.enemiesDefeated = 0;

    this.selectedBuildType = TOWER_TYPES[0]; // Default select Seu Jorge for immediate fun!
    this.selectedTower = null;

    this.clock = new THREE.Clock();
    this.elapsed = 0;

    this.initUI();
    this.bindEvents();
    this.refreshHUD();

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  resetCameraTransform() {
    this.camera.position.set(0, 30, 31);
    if (this.controls) {
      this.controls.target.set(0, 0, 0.5);
      this.controls.update();
    }
  }

  initUI() {
    const cardsContainer = document.getElementById('tower-cards');
    cardsContainer.innerHTML = '';

    TOWER_TYPES.forEach((t) => {
      const btn = document.createElement('button');
      btn.className = 'tower-card';
      btn.dataset.id = t.id;
      btn.innerHTML = `
        <span class="card-hotkey">${t.hotkey}</span>
        <span class="card-emoji">${t.emoji}</span>
        <div class="card-body">
          <span class="card-name">${t.shortName}</span>
          <span class="card-role">${t.role}</span>
          <span class="card-cost">R$ ${t.cost}</span>
        </div>
      `;
      btn.addEventListener('click', () => {
        sound.init();
        if (this.selectedBuildType && this.selectedBuildType.id === t.id) {
          this.selectBuildType(null);
        } else {
          this.selectBuildType(t);
        }
      });
      cardsContainer.appendChild(btn);
    });

    document.getElementById('btn-start-game').addEventListener('click', () => {
      sound.init();
      document.getElementById('modal-overlay').classList.add('hidden');
      this.started = true;
      this.selectBuildType(TOWER_TYPES[0]);
    });

    document.getElementById('btn-next-wave').addEventListener('click', () => {
      sound.init();
      this.startNextWave();
    });

    document.getElementById('btn-speed').addEventListener('click', (e) => {
      this.gameSpeed = this.gameSpeed === 1 ? 2 : 1;
      e.currentTarget.textContent = `${this.gameSpeed}x`;
      e.currentTarget.classList.toggle('active-speed', this.gameSpeed === 2);
    });

    document.getElementById('btn-audio').addEventListener('click', (e) => {
      sound.init();
      const muted = sound.toggleMute();
      e.currentTarget.textContent = muted ? '🔇' : '🔊';
    });

    document.getElementById('btn-camera').addEventListener('click', () => {
      this.resetCameraTransform();
    });

    // Inspector actions
    document.getElementById('insp-close').addEventListener('click', () => {
      this.selectTower(null);
    });

    document.getElementById('btn-upgrade').addEventListener('click', () => {
      if (!this.selectedTower || !this.selectedTower.canUpgrade) return;
      const cost = this.selectedTower.stats.upgradeCost;
      if (this.money < cost) return;
      this.money -= cost;
      this.selectedTower.upgrade();
      this.refreshHUD();
      this.refreshInspector();
    });

    document.getElementById('btn-sell').addEventListener('click', () => {
      if (!this.selectedTower) return;
      const refund = this.selectedTower.sellValue;
      this.money += refund;
      const pos = this.selectedTower.mesh.position.clone();
      pos.y += 1.6;
      this.effects.spawnFloatingText(pos, `+R$ ${refund} 😴`, '#38d399');

      this.selectedTower.pad.tower = null;
      this.selectedTower.dispose();
      this.towers = this.towers.filter((tw) => tw !== this.selectedTower);
      this.selectTower(null);
      this.refreshHUD();
    });

    document.querySelectorAll('.mode-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!this.selectedTower) return;
        this.selectedTower.targetMode = btn.dataset.mode;
        this.refreshInspector();
      });
    });

    // Endgame buttons
    document.getElementById('btn-restart').addEventListener('click', () => {
      this.restartGame();
    });

    document.getElementById('btn-endless').addEventListener('click', () => {
      this.endlessMode = true;
      this.gameOver = false;
      document.getElementById('end-overlay').classList.add('hidden');
      this.refreshHUD();
    });
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    const dom = this.renderer.domElement;

    dom.addEventListener('pointerdown', (e) => {
      this.pointerDownPos.x = e.clientX;
      this.pointerDownPos.y = e.clientY;
    });

    dom.addEventListener('pointermove', (e) => {
      this.updatePointer(e);
      this.handleHover();
    });

    dom.addEventListener('pointerup', (e) => {
      if (e.button !== 0) return;
      const moved = Math.hypot(e.clientX - this.pointerDownPos.x, e.clientY - this.pointerDownPos.y);
      if (moved > 6) return; // Ignore camera orbit drags
      this.updatePointer(e);
      this.handleClick();
    });

    window.addEventListener('keydown', (e) => {
      if (!this.started || this.gameOver) return;
      if (e.key === 'Escape') {
        this.selectBuildType(null);
        this.selectTower(null);
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        const found = TOWER_TYPES.find((t) => t.hotkey === e.key);
        if (found) this.selectBuildType(found);
      } else if (e.code === 'Space') {
        e.preventDefault();
        if (!this.isWaveActive) this.startNextWave();
      }
    });
  }

  updatePointer(e) {
    this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  getIntersectedPadOrTower() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const targets = [];
    for (const pad of this.map.pads) {
      targets.push(pad.baseMesh);
      if (pad.tower) targets.push(pad.tower.mesh);
    }
    const hits = this.raycaster.intersectObjects(targets, true);
    if (hits.length === 0) return null;

    const hitObj = hits[0].object;
    if (hitObj.userData && hitObj.userData.tower) {
      return { tower: hitObj.userData.tower, pad: hitObj.userData.tower.pad };
    }
    if (hitObj.userData && hitObj.userData.padIndex !== undefined) {
      const pad = this.map.pads[hitObj.userData.padIndex];
      return { tower: pad.tower, pad };
    }
    return null;
  }

  handleHover() {
    if (this.hoveredPad) {
      this.hoveredPad.baseMesh.material.emissive.setHex(0x000000);
      this.hoveredPad = null;
    }

    const hit = this.getIntersectedPadOrTower();
    if (!hit) {
      document.body.style.cursor = 'default';
      if (!this.selectedTower) this.rangeGroup.visible = false;
      return;
    }

    document.body.style.cursor = 'pointer';
    const { pad, tower } = hit;

    if (!tower && this.selectedBuildType) {
      this.hoveredPad = pad;
      const canAfford = this.money >= this.selectedBuildType.cost;
      pad.baseMesh.material.emissive.setHex(canAfford ? 0x1e4d3b : 0x5c1922);

      const range = this.selectedBuildType.levels[0].range;
      this.showRangeRing(pad.x, pad.z, range, canAfford ? 0x2ec4b6 : 0xff5964);
    } else if (!this.selectedTower) {
      this.rangeGroup.visible = false;
    }
  }

  handleClick() {
    sound.init();
    const hit = this.getIntersectedPadOrTower();
    if (!hit) {
      this.selectTower(null);
      return;
    }

    const { pad, tower } = hit;
    if (tower) {
      this.selectBuildType(null);
      this.selectTower(tower);
      return;
    }

    // Empty pad clicked -> try building selected neighbor!
    if (!this.selectedBuildType) return;

    if (this.money < this.selectedBuildType.cost) {
      this.effects.spawnFloatingText(
        new THREE.Vector3(pad.x, 1.5, pad.z),
        'Falta grana na caixinha!',
        '#ff5964'
      );
      return;
    }

    this.money -= this.selectedBuildType.cost;
    const newTower = new Tower(this.selectedBuildType, pad, this.scene, this.effects);
    pad.tower = newTower;
    this.towers.push(newTower);

    sound.playBuild();
    this.effects.spawnParticles(new THREE.Vector3(pad.x, 0.5, pad.z), this.selectedBuildType.color, 14, 4.0, 3.0);
    this.effects.spawnFloatingText(
      new THREE.Vector3(pad.x, 2.0, pad.z),
      `${this.selectedBuildType.shortName} na área!`,
      '#ffd166'
    );

    this.refreshHUD();
    this.selectTower(newTower);
  }

  showRangeRing(x, z, radius, colorHex = 0x2ec4b6) {
    this.rangeGroup.position.set(x, 0.16, z);
    this.rangeGroup.scale.setScalar(radius);
    this.rangeRingMat.color.setHex(colorHex);
    this.rangeRingBorderMat.color.setHex(colorHex);
    this.rangeGroup.visible = true;
  }

  selectBuildType(typeDef) {
    this.selectedBuildType = typeDef;
    if (typeDef) {
      this.selectTower(null);
      document.getElementById('build-hint').innerHTML =
        `Posicionando <strong>${typeDef.emoji} ${typeDef.name}</strong> (R$ ${typeDef.cost}) — clique em uma calçada livre ou <kbd>ESC</kbd> para cancelar.`;
    } else {
      document.getElementById('build-hint').innerHTML =
        `Clique em um vizinho abaixo (ou teclas <kbd>1</kbd>-<kbd>4</kbd>) ou selecione um morador na rua para evoluir!`;
    }
    this.refreshBuildCards();
  }

  selectTower(tower) {
    this.selectedTower = tower;
    const panel = document.getElementById('inspector-panel');
    if (!tower) {
      panel.classList.add('hidden');
      this.rangeGroup.visible = false;
      return;
    }

    panel.classList.remove('hidden');
    this.refreshInspector();
  }

  refreshInspector() {
    const t = this.selectedTower;
    if (!t) return;

    const st = t.stats;
    document.getElementById('insp-level').textContent = `Nível ${t.levelIndex + 1} / 3 • ${st.title}`;
    document.getElementById('insp-name').textContent = `${t.def.emoji} ${t.def.name}`;
    document.getElementById('insp-desc').textContent = t.def.description;
    document.getElementById('insp-dmg').textContent = st.damage;
    document.getElementById('insp-range').textContent = `${st.range.toFixed(1)}m`;
    document.getElementById('insp-rate').textContent = `${st.fireRate.toFixed(1)}/s`;

    document.querySelectorAll('.mode-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.mode === t.targetMode);
    });

    const upgBtn = document.getElementById('btn-upgrade');
    const upgCostEl = document.getElementById('insp-upgrade-cost');
    if (t.canUpgrade) {
      upgCostEl.textContent = `R$ ${st.upgradeCost}`;
      upgBtn.disabled = this.money < st.upgradeCost;
    } else {
      upgCostEl.textContent = 'MÁXIMO';
      upgBtn.disabled = true;
    }

    document.getElementById('insp-sell-val').textContent = `+R$ ${t.sellValue}`;
    this.showRangeRing(t.pad.x, t.pad.z, st.range, t.def.color);
  }

  refreshBuildCards() {
    document.querySelectorAll('.tower-card').forEach((card) => {
      const def = TOWER_TYPES.find((t) => t.id === card.dataset.id);
      card.classList.toggle('selected', this.selectedBuildType?.id === def.id);
      card.classList.toggle('cant-afford', this.money < def.cost);
    });
  }

  refreshHUD() {
    document.getElementById('hud-money').textContent = `R$ ${this.money}`;
    document.getElementById('hud-sleep-text').textContent = `${this.sleep}%`;

    const sleepBar = document.getElementById('hud-sleep-bar');
    sleepBar.style.width = `${Math.max(0, this.sleep)}%`;
    if (this.sleep > 55) {
      sleepBar.style.background = 'linear-gradient(90deg, #2ec4b6, #38d399)';
    } else if (this.sleep > 25) {
      sleepBar.style.background = 'linear-gradient(90deg, #ff9f1c, #ffd166)';
    } else {
      sleepBar.style.background = 'linear-gradient(90deg, #ff3b7f, #ff5964)';
    }

    const totalWavesLabel = this.endlessMode ? '∞' : GAME_CONFIG.totalStoryWaves;
    document.getElementById('hud-wave').textContent = `Onda ${this.wave} / ${totalWavesLabel}`;

    const waveBtn = document.getElementById('btn-next-wave');
    if (this.isWaveActive) {
      waveBtn.disabled = true;
      waveBtn.classList.remove('pulse-ready');
      waveBtn.innerHTML = `<span>🛵 Onda ${this.wave} em curso...</span>`;
    } else {
      waveBtn.disabled = false;
      waveBtn.classList.add('pulse-ready');
      waveBtn.innerHTML = `<span>🚨 Chamar Onda ${this.wave + 1}</span>`;
    }

    this.refreshBuildCards();
    if (this.selectedTower) this.refreshInspector();
  }

  startNextWave() {
    if (this.isWaveActive || this.gameOver) return;

    this.wave += 1;
    this.isWaveActive = true;
    const waveDef = getWaveDefinition(this.wave);

    document.getElementById('hud-clock').textContent = waveDef.clock;
    this.map.setDawnProgress(Math.min(0.92, (this.wave - 1) / GAME_CONFIG.totalStoryWaves));

    // Queue enemy spawns
    this.spawnQueue = [];
    let timeCursor = 0;
    for (const grp of waveDef.groups) {
      timeCursor += grp.delay || 0;
      for (let i = 0; i < grp.count; i++) {
        this.spawnQueue.push({
          spawnAt: timeCursor,
          type: grp.type,
          hpMult: waveDef.hpMult
        });
        timeCursor += grp.interval;
      }
    }
    this.waveClock = 0;

    // Show wave banner
    const banner = document.getElementById('wave-banner');
    document.getElementById('wave-banner-title').textContent = `ONDA ${this.wave} • ${waveDef.clock}`;
    document.getElementById('wave-banner-sub').textContent = waveDef.subtitle;
    banner.classList.remove('hidden');
    clearTimeout(this.bannerTimeout);
    this.bannerTimeout = setTimeout(() => banner.classList.add('hidden'), 4200);

    sound.playWaveStart();
    this.refreshHUD();
  }

  spawnEnemy(typeId, hpMult) {
    const enemy = new Enemy(typeId, hpMult, this.map, this.effects);
    this.scene.add(enemy.mesh);
    this.enemies.push(enemy);
  }

  onWaveCleared() {
    this.isWaveActive = false;
    const waveBonus = 25 + this.wave * 8;
    this.money += waveBonus;

    this.effects.spawnFloatingText(
      new THREE.Vector3(0, 3.5, 0),
      `Onda ${this.wave} contida! Vaquinha +R$ ${waveBonus}`,
      '#38d399'
    );

    if (!this.endlessMode && this.wave >= GAME_CONFIG.totalStoryWaves) {
      // 06:00 AM Sunrise Victory!
      document.getElementById('hud-clock').textContent = '06:00';
      this.map.setDawnProgress(1.0);
      sound.playVictory();
      this.showEndModal(true);
      return;
    }

    this.refreshHUD();
  }

  showEndModal(victory) {
    this.gameOver = true;
    const overlay = document.getElementById('end-overlay');
    overlay.classList.remove('hidden');

    const badge = document.getElementById('end-badge');
    const title = document.getElementById('end-title');
    const desc = document.getElementById('end-desc');
    const endlessBtn = document.getElementById('btn-endless');

    if (victory) {
      badge.textContent = '06:00 DA MANHÃ • PAZ RESTAURADA!';
      title.textContent = '🌅 O SOL NASCEU NO BAIXO!';
      desc.textContent =
        'Graças aos chinelos do Seu Jorge, os baldes da Dona Neide e o Jammer do Síndico, nenhum paredão ou escapamento aberto derrotou o sono do bairro!';
      endlessBtn.classList.remove('hidden');
    } else {
      badge.textContent = 'INSÔNIA COLETIVA';
      title.textContent = '😵 A RUA INTEIRA ACORDOU!';
      desc.textContent =
        'O barulho do randandandan e dos subwoofers venceu a paciência do bairro antes do amanhecer. Reorganize a vizinhança e tente de novo!';
      endlessBtn.classList.add('hidden');
    }

    document.getElementById('end-stats').innerHTML = `
      <div class="end-stat-box"><span>Ondas Superadas</span><strong>${victory ? this.wave : Math.max(0, this.wave - 1)}</strong></div>
      <div class="end-stat-box"><span>Barulhentos Silenciados</span><strong>${this.enemiesDefeated}</strong></div>
      <div class="end-stat-box"><span>Sossego Restante</span><strong>${this.sleep}%</strong></div>
    `;
  }

  restartGame() {
    for (const t of this.towers) {
      t.pad.tower = null;
      t.dispose();
    }
    for (const e of this.enemies) {
      this.scene.remove(e.mesh);
    }
    for (const p of this.projectiles) {
      p.dispose();
    }
    this.effects.clearAll();

    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.spawnQueue = [];
    this.enemiesDefeated = 0;

    this.money = GAME_CONFIG.startingMoney;
    this.sleep = GAME_CONFIG.startingSleep;
    this.wave = 0;
    this.endlessMode = false;
    this.isWaveActive = false;
    this.gameOver = false;

    document.getElementById('hud-clock').textContent = '02:00';
    document.getElementById('end-overlay').classList.add('hidden');
    this.map.setDawnProgress(0);
    this.selectTower(null);
    this.selectBuildType(TOWER_TYPES[0]);
    this.refreshHUD();
  }

  updateGame(dt) {
    if (!this.started || this.gameOver) return;

    // Spawn queued enemies
    if (this.isWaveActive && this.spawnQueue.length > 0) {
      this.waveClock += dt;
      while (this.spawnQueue.length > 0 && this.waveClock >= this.spawnQueue[0].spawnAt) {
        const next = this.spawnQueue.shift();
        this.spawnEnemy(next.type, next.hpMult);
      }
    }

    // Update towers
    for (const tower of this.towers) {
      tower.update(dt, this.enemies, this.projectiles);
    }

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.update(dt, this.enemies);
      if (proj.done) {
        this.projectiles.splice(i, 1);
      }
    }

    // Update enemies
    let hudDirty = false;
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(dt, this.camera);

      if (e.dead) {
        this.money += e.def.reward;
        this.enemiesDefeated += 1;
        hudDirty = true;

        const pos = e.mesh.position.clone();
        pos.y += 1.4;
        this.effects.spawnParticles(pos, 0xff9f1c, 14, 5.0, 3.5, 1.15);
        this.effects.spawnFloatingText(pos, `+R$ ${e.def.reward}`, '#38d399');
        sound.playCoin();

        this.scene.remove(e.mesh);
        this.enemies.splice(i, 1);
      } else if (e.reachedEnd) {
        this.sleep = Math.max(0, this.sleep - e.def.sleepDamage);
        hudDirty = true;

        const exitPos = e.mesh.position.clone();
        exitPos.y += 2.0;
        this.effects.spawnFloatingText(exitPos, `-${e.def.sleepDamage}% SOSSEGO! 😡`, '#ff5964');
        sound.playLoseSleep();

        this.scene.remove(e.mesh);
        this.enemies.splice(i, 1);

        if (this.sleep <= 0) {
          this.refreshHUD();
          this.showEndModal(false);
          return;
        }
      }
    }

    if (hudDirty) {
      this.refreshHUD();
    }

    // Check if active wave finished
    if (this.isWaveActive && this.spawnQueue.length === 0 && this.enemies.length === 0) {
      this.onWaveCleared();
    }
  }

  animate() {
    requestAnimationFrame(this.animate);

    const rawDt = Math.min(this.clock.getDelta(), 0.08);
    const dt = rawDt * this.gameSpeed;
    this.elapsed += rawDt;

    this.controls.update();
    this.map.update(rawDt, this.elapsed);
    this.updateGame(dt);
    this.effects.update(rawDt);

    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new MadrugadaGame();
});
