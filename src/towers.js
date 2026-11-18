import * as THREE from 'three';
import { TOWER_TYPES, GAME_CONFIG } from './config.js';
import { sound } from './audio.js';

function createPersonMesh(shirtColor, skinColor = 0xd4a373, hatColor = null) {
  const group = new THREE.Group();

  const legs = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.45, 0.28),
    new THREE.MeshStandardMaterial({ color: 0x1d3557 })
  );
  legs.position.y = 0.23;
  group.add(legs);

  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.56, 0.32),
    new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.7 })
  );
  torso.position.y = 0.73;
  torso.castShadow = true;
  group.add(torso);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 12, 12),
    new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.6 })
  );
  head.position.y = 1.24;
  group.add(head);

  if (hatColor !== null) {
    const hat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.26, 0.18, 12),
      new THREE.MeshStandardMaterial({ color: hatColor })
    );
    hat.position.y = 1.44;
    group.add(hat);
  }

  // Right throwing arm pivot
  const armPivot = new THREE.Group();
  armPivot.position.set(0.32, 0.94, 0);
  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.44, 0.16),
    new THREE.MeshStandardMaterial({ color: skinColor })
  );
  arm.position.y = -0.16;
  armPivot.add(arm);
  group.add(armPivot);

  return { group, armPivot };
}

function buildTowerVisual(typeId) {
  const root = new THREE.Group();
  const turret = new THREE.Group();
  root.add(turret);

  let armPivot = null;
  let dishSpin = null;

  // Pedestal base
  const ped = new THREE.Mesh(
    new THREE.CylinderGeometry(1.02, 1.15, 0.28, 18),
    new THREE.MeshStandardMaterial({ color: 0x22273b, roughness: 0.7, metalness: 0.2 })
  );
  ped.position.y = 0.14;
  ped.receiveShadow = true;
  root.add(ped);

  if (typeId === 'chinelo') {
    const person = createPersonMesh(0xf8fafc, 0xc68642, 0xffd166);
    person.group.position.y = 0.28;
    turret.add(person.group);
    armPivot = person.armPivot;

    // Flip-flop in hand
    const sandal = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.06, 0.36),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    sandal.position.set(0, -0.36, 0.14);
    armPivot.add(sandal);
  } else if (typeId === 'balde') {
    // Dona Neide in pink robe + curlers + blue bucket
    const veranda = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.35, 1.4),
      new THREE.MeshStandardMaterial({ color: 0x5c4033 })
    );
    veranda.position.y = 0.42;
    root.add(veranda);

    const person = createPersonMesh(0xf472b6, 0xe0ac69, 0xec4899);
    person.group.position.y = 0.58;
    turret.add(person.group);
    armPivot = person.armPivot;

    const bucket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.16, 0.28, 12),
      new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.3 })
    );
    bucket.position.set(0, -0.34, 0.2);
    armPivot.add(bucket);
  } else if (typeId === 'ovo') {
    // Wooden crate barricade + two students with egg cartons
    const crate = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.52, 0.65),
      new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.9 })
    );
    crate.position.set(0, 0.52, 0.38);
    turret.add(crate);

    const p1 = createPersonMesh(0xfbbf24, 0xf1c27d, null);
    p1.group.scale.setScalar(0.88);
    p1.group.position.set(-0.34, 0.28, -0.15);
    turret.add(p1.group);

    const p2 = createPersonMesh(0x10b981, 0x8d5524, 0x111827);
    p2.group.scale.setScalar(0.88);
    p2.group.position.set(0.34, 0.28, -0.15);
    turret.add(p2.group);
    armPivot = p1.armPivot;
  } else if (typeId === 'jammer') {
    // Tripod + Microwave transformer + Rotating Parabolic Dish + Glowing EMP Coil
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.72, 0.85),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.5, roughness: 0.35 })
    );
    box.position.y = 0.64;
    box.castShadow = true;
    turret.add(box);

    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.58, 0.42),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    screen.position.set(-0.12, 0.65, 0.43);
    turret.add(screen);

    dishSpin = new THREE.Group();
    dishSpin.position.set(0, 1.35, 0);

    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.12, 0.65, 10),
      new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 })
    );
    dishSpin.add(mast);

    const dish = new THREE.Mesh(
      new THREE.ConeGeometry(0.62, 0.32, 16, 1, true),
      new THREE.MeshStandardMaterial({
        color: 0xc084fc,
        emissive: 0x6b21a8,
        emissiveIntensity: 0.5,
        side: THREE.DoubleSide,
        metalness: 0.6
      })
    );
    dish.rotation.x = Math.PI / 2;
    dish.position.set(0, 0.32, 0.22);
    dishSpin.add(dish);

    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xe879f9 })
    );
    orb.position.set(0, 0.32, 0.45);
    dishSpin.add(orb);

    turret.add(dishSpin);
  }

  // Upgrade stars container floating around pedestal
  const starsGroup = new THREE.Group();
  root.add(starsGroup);

  return { root, turret, armPivot, dishSpin, starsGroup };
}

export class Tower {
  constructor(typeDef, pad, scene, effects) {
    this.def = typeDef;
    this.pad = pad;
    this.scene = scene;
    this.effects = effects;

    this.levelIndex = 0;
    this.totalInvested = typeDef.cost;
    this.targetMode = 'first'; // 'first' | 'strong' | 'fast'
    this.cooldown = 0;
    this.recoilTimer = 0;

    const built = buildTowerVisual(typeDef.id);
    this.mesh = built.root;
    this.turret = built.turret;
    this.armPivot = built.armPivot;
    this.dishSpin = built.dishSpin;
    this.starsGroup = built.starsGroup;

    this.mesh.position.set(pad.x, 0.18, pad.z);
    this.mesh.userData = { tower: this };
    this.mesh.traverse((child) => {
      child.userData = { tower: this, padIndex: pad.index };
    });

    this.scene.add(this.mesh);
    this.refreshLevelVisuals();
  }

  get stats() {
    return this.def.levels[this.levelIndex];
  }

  get canUpgrade() {
    return this.stats.upgradeCost !== null;
  }

  get sellValue() {
    return Math.round(this.totalInvested * GAME_CONFIG.sellRefundRatio);
  }

  upgrade() {
    if (!this.canUpgrade) return false;
    this.totalInvested += this.stats.upgradeCost;
    this.levelIndex += 1;
    this.refreshLevelVisuals();

    const pos = this.mesh.position.clone();
    pos.y += 2.2;
    this.effects.spawnParticles(this.mesh.position, 0xffd166, 16, 4.5, 4.0, 1.2);
    this.effects.spawnFloatingText(pos, `NÍVEL ${this.levelIndex + 1}!`, '#2ec4b6');
    sound.playUpgrade();
    return true;
  }

  refreshLevelVisuals() {
    while (this.starsGroup.children.length > 0) {
      this.starsGroup.remove(this.starsGroup.children[0]);
    }
    // Scale slightly with level + add glowing level badges on pedestal
    const s = 1 + this.levelIndex * 0.1;
    this.turret.scale.setScalar(s);

    for (let i = 0; i <= this.levelIndex; i++) {
      const badge = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.15, 0),
        new THREE.MeshBasicMaterial({ color: i === 2 ? 0x00f5d4 : 0xffd166 })
      );
      const angle = (i - this.levelIndex / 2) * 0.45;
      badge.position.set(Math.sin(angle) * 1.08, 0.36, Math.cos(angle) * 1.08);
      this.starsGroup.add(badge);
    }
  }

  selectTarget(enemies) {
    const range = this.stats.range;
    const candidates = [];

    for (const e of enemies) {
      if (e.dead || e.reachedEnd) continue;
      const d = Math.hypot(e.mesh.position.x - this.pad.x, e.mesh.position.z - this.pad.z);
      if (d <= range) {
        candidates.push(e);
      }
    }

    if (candidates.length === 0) return null;

    if (this.targetMode === 'strong') {
      candidates.sort((a, b) => b.hp - a.hp);
    } else if (this.targetMode === 'fast') {
      candidates.sort((a, b) => b.baseSpeed - a.baseSpeed);
    } else {
      // 'first' -> furthest along the road
      candidates.sort((a, b) => b.distance - a.distance);
    }
    return candidates[0];
  }

  update(dt, enemies, projectiles) {
    if (this.cooldown > 0) this.cooldown -= dt;

    if (this.dishSpin) {
      this.dishSpin.rotation.y += dt * (1.8 + this.levelIndex * 0.9);
    }

    if (this.recoilTimer > 0) {
      this.recoilTimer -= dt;
      if (this.armPivot) {
        this.armPivot.rotation.x = -Math.sin((this.recoilTimer / 0.22) * Math.PI) * 1.35;
      }
    } else if (this.armPivot) {
      this.armPivot.rotation.x = 0;
    }

    const target = this.selectTarget(enemies);
    if (!target) return;

    // Face target smoothly
    const dx = target.mesh.position.x - this.pad.x;
    const dz = target.mesh.position.z - this.pad.z;
    this.turret.rotation.y = Math.atan2(dx, dz);

    if (this.cooldown <= 0) {
      this.cooldown = 1 / this.stats.fireRate;
      this.recoilTimer = 0.22;
      this.fireAt(target, enemies, projectiles);
    }
  }

  fireAt(target, enemies, projectiles) {
    const origin = new THREE.Vector3(this.pad.x, 1.55, this.pad.z);

    if (this.def.id === 'jammer') {
      // Instant chain EMP lightning!
      const hitChain = [target];
      let current = target;

      while (hitChain.length < this.stats.chainCount) {
        let bestNext = null;
        let bestDist = 5.0;
        for (const e of enemies) {
          if (e.dead || e.reachedEnd || hitChain.includes(e)) continue;
          const d = current.mesh.position.distanceTo(e.mesh.position);
          if (d < bestDist) {
            bestDist = d;
            bestNext = e;
          }
        }
        if (!bestNext) break;
        hitChain.push(bestNext);
        current = bestNext;
      }

      const beamPoints = [new THREE.Vector3(this.pad.x, 1.85, this.pad.z)];
      hitChain.forEach((enemy, idx) => {
        const p = enemy.mesh.position.clone();
        p.y += 1.0;
        beamPoints.push(p);

        const falloff = Math.pow(0.82, idx);
        const catMult = enemy.def.category === 'som' ? this.stats.bonusSom : 1.0;
        enemy.takeDamage(this.stats.damage * falloff * catMult);
        this.effects.spawnParticles(p, 0xc084fc, 6, 3.2, 2.0, 0.9);
      });

      this.effects.spawnElectricBeam(beamPoints, 0xe879f9);
      sound.playJammerZap();
      if (Math.random() < 0.22) {
        this.effects.spawnFloatingText(origin, 'CORTA O BLUETOOTH!', '#c084fc');
      }
      return;
    }

    // Spawn 3D projectile for Chinelo, Balde, or Ovo
    projectiles.push(new Projectile(this.def.id, this.stats, this.levelIndex, origin, target, this.scene, this.effects));
  }

  dispose() {
    this.scene.remove(this.mesh);
  }
}

export class Projectile {
  constructor(typeId, stats, levelIndex, startPos, target, scene, effects) {
    this.typeId = typeId;
    this.stats = stats;
    this.levelIndex = levelIndex;
    this.startPos = startPos.clone();
    this.pos = startPos.clone();
    this.target = target;
    this.lastKnownTargetPos = target.mesh.position.clone().add(new THREE.Vector3(0, 0.8, 0));
    this.scene = scene;
    this.effects = effects;

    this.done = false;
    this.progress = 0;

    if (typeId === 'chinelo') {
      this.speed = 19.0;
      this.mesh = new THREE.Group();
      const sole = new THREE.Mesh(
        new THREE.BoxGeometry(0.26, 0.07, 0.52),
        new THREE.MeshBasicMaterial({ color: levelIndex === 2 ? 0xffd166 : 0xf8fafc })
      );
      const strap = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.09, 0.18),
        new THREE.MeshBasicMaterial({ color: 0x0284c7 })
      );
      strap.position.y = 0.04;
      this.mesh.add(sole, strap);
    } else if (typeId === 'balde') {
      this.speed = 11.5;
      this.mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.32, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.88 })
      );
    } else {
      // 'ovo' (egg or tomato)
      this.speed = 16.5;
      const isTomato = levelIndex >= 1 && Math.random() < 0.45;
      this.isTomato = isTomato;
      this.mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 8, 8),
        new THREE.MeshBasicMaterial({ color: isTomato ? 0xef4444 : 0xfef3c7 })
      );
      this.mesh.scale.set(0.85, 1.15, 0.85);
    }

    this.mesh.position.copy(this.pos);
    this.scene.add(this.mesh);
  }

  update(dt, enemies) {
    if (this.done) return;

    if (this.target && !this.target.dead && !this.target.reachedEnd) {
      this.lastKnownTargetPos.copy(this.target.mesh.position);
      this.lastKnownTargetPos.y += 0.8;
    }

    const totalDist = Math.max(0.5, this.startPos.distanceTo(this.lastKnownTargetPos));
    this.progress += (this.speed * dt) / totalDist;

    if (this.progress >= 1.0) {
      this.onImpact(enemies);
      this.dispose();
      return;
    }

    this.pos.lerpVectors(this.startPos, this.lastKnownTargetPos, this.progress);
    // Add nice arc height for water bucket & eggs
    const arcHeight = this.typeId === 'balde' ? 2.4 : (this.typeId === 'ovo' ? 1.1 : 0.35);
    this.pos.y += Math.sin(this.progress * Math.PI) * arcHeight;
    this.mesh.position.copy(this.pos);

    if (this.typeId === 'chinelo') {
      this.mesh.rotation.x += dt * 22;
      this.mesh.rotation.y += dt * 14;
    }
  }

  onImpact(enemies) {
    const hitPos = this.lastKnownTargetPos.clone();

    if (this.typeId === 'chinelo') {
      if (this.target && !this.target.dead && !this.target.reachedEnd) {
        const motoMult = this.target.def.category === 'moto' ? this.stats.bonusMoto : 1.0;
        this.target.takeDamage(this.stats.damage * motoMult);
        this.effects.spawnParticles(hitPos, 0xffd166, 8, 3.8, 2.2, 0.9);
        sound.playChineloHit();
        if (Math.random() < 0.24) {
          this.effects.spawnFloatingText(hitPos, 'PLAF! 🩴', '#ffd166');
        }
      }
    } else if (this.typeId === 'balde') {
      // AoE splash + slow!
      const radius = this.stats.splashRadius;
      this.effects.spawnShockwaveRing(hitPos, 0x38bdf8, radius, 0.42);
      this.effects.spawnParticles(hitPos, 0x38bdf8, 16, 4.8, 3.4, 1.1);
      sound.playWaterSplash();

      for (const e of enemies) {
        if (e.dead || e.reachedEnd) continue;
        const d = Math.hypot(e.mesh.position.x - hitPos.x, e.mesh.position.z - hitPos.z);
        if (d <= radius) {
          e.takeDamage(this.stats.damage);
          e.applySlow(this.stats.slowFactor, this.stats.slowDuration);
        }
      }
      if (Math.random() < 0.2) {
        this.effects.spawnFloatingText(hitPos, 'CHUAÁÁ! 🪣', '#38bdf8');
      }
    } else if (this.typeId === 'ovo') {
      if (this.target && !this.target.dead && !this.target.reachedEnd) {
        this.target.takeDamage(this.stats.damage);
        this.target.applyVulnerability(this.stats.vulnBonus, this.stats.vulnDuration);
        this.effects.spawnParticles(hitPos, this.isTomato ? 0xef4444 : 0xfacc15, 7, 3.2, 2.0, 0.85);
        sound.playEggSplat();
      }
    }
  }

  dispose() {
    this.done = true;
    this.scene.remove(this.mesh);
  }
}
