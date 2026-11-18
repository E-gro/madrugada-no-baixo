import * as THREE from 'three';
import { ENEMY_TYPES } from './config.js';
import { sound } from './audio.js';

function buildMotoMesh(isGrau = false) {
  const root = new THREE.Group();
  const pivot = new THREE.Group(); // Used for wheelie ("grau") tilt
  root.add(pivot);

  const wheelGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.16, 14);
  wheelGeo.rotateZ(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x15171e, roughness: 0.9 });
  const rimMat = new THREE.MeshStandardMaterial({ color: isGrau ? 0xff3b7f : 0xcbd5e1, metalness: 0.7, roughness: 0.3 });

  for (const dz of [-0.58, 0.58]) {
    const w = new THREE.Mesh(wheelGeo, tireMat);
    w.position.set(0, 0.34, dz);
    pivot.add(w);

    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.18, 10).rotateZ(Math.PI / 2), rimMat);
    rim.position.set(0, 0.34, dz);
    pivot.add(rim);
  }

  // Frame & fuel tank
  const bodyCol = isGrau ? 0x9b5de5 : 0xe63946;
  const tank = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.32, 0.95),
    new THREE.MeshStandardMaterial({ color: bodyCol, roughness: 0.4, metalness: 0.3 })
  );
  tank.position.set(0, 0.68, 0);
  tank.castShadow = true;
  pivot.add(tank);

  // Open noisy exhaust pipe ("só o cano!")
  const pipe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.08, 0.75, 8).rotateX(Math.PI / 2.2),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.25 })
  );
  pipe.position.set(0.2, 0.42, -0.45);
  pivot.add(pipe);

  // Headlight
  const headlight = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xfef08a })
  );
  headlight.position.set(0, 0.82, 0.55);
  pivot.add(headlight);

  // Rider
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.52, 0.3),
    new THREE.MeshStandardMaterial({ color: isGrau ? 0x111827 : 0x1e293b })
  );
  torso.position.set(0, 1.08, -0.06);
  torso.rotation.x = 0.32;
  pivot.add(torso);

  const helmet = new THREE.Mesh(
    new THREE.SphereGeometry(0.21, 12, 12),
    new THREE.MeshStandardMaterial({ color: isGrau ? 0x00f5d4 : 0xfacc15, roughness: 0.25 })
  );
  helmet.position.set(0, 1.44, 0.06);
  pivot.add(helmet);

  if (isGrau) {
    // Delivery bag on back + neon underglow
    const bag = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.44, 0.42),
      new THREE.MeshStandardMaterial({ color: 0xef233c, roughness: 0.6 })
    );
    bag.position.set(0, 1.16, -0.42);
    pivot.add(bag);

    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 1.6),
      new THREE.MeshBasicMaterial({ color: 0xff3b7f, transparent: true, opacity: 0.42, depthWrite: false })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.06;
    root.add(glow);
  }

  return { root, pivot, woofers: [] };
}

function buildSoundCarMesh(type) {
  const root = new THREE.Group();
  const woofers = [];

  if (type === 'carro_som') {
    // Slammed Golzinho hatchback with neon underglow + open trunk subwoofers
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.9, 3.1),
      new THREE.MeshBasicMaterial({ color: 0x00f5d4, transparent: true, opacity: 0.45, depthWrite: false })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.06;
    root.add(glow);

    const chassis = new THREE.Mesh(
      new THREE.BoxGeometry(1.38, 0.52, 2.55),
      new THREE.MeshStandardMaterial({ color: 0x00bbf9, metalness: 0.45, roughness: 0.32 })
    );
    chassis.position.y = 0.42;
    chassis.castShadow = true;
    root.add(chassis);

    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(1.22, 0.48, 1.35),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.2, metalness: 0.6 })
    );
    cabin.position.set(0, 0.88, 0.15);
    root.add(cabin);

    // Open trunk lid
    const lid = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.08, 0.75),
      new THREE.MeshStandardMaterial({ color: 0x00bbf9, metalness: 0.4 })
    );
    lid.position.set(0, 1.05, -1.05);
    lid.rotation.x = -0.75;
    root.add(lid);

    // Subwoofer box in rear
    const subBox = new THREE.Mesh(
      new THREE.BoxGeometry(1.18, 0.48, 0.55),
      new THREE.MeshStandardMaterial({ color: 0x11131f })
    );
    subBox.position.set(0, 0.72, -0.95);
    root.add(subBox);

    for (const dx of [-0.32, 0.32]) {
      const cone = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.12, 0.14, 14).rotateX(Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0xff3b7f })
      );
      cone.position.set(dx, 0.74, -1.24);
      root.add(cone);
      woofers.push(cone);
    }

    addWheels(root, 0.68, 0.28, [-0.82, 0.82]);
  } else if (type === 'paredao') {
    // Heavy Pickup + Giant LED Speaker Wall
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(2.3, 3.8),
      new THREE.MeshBasicMaterial({ color: 0xff9f1c, transparent: true, opacity: 0.42, depthWrite: false })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.06;
    root.add(glow);

    const chassis = new THREE.Mesh(
      new THREE.BoxGeometry(1.65, 0.62, 3.2),
      new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4, metalness: 0.3 })
    );
    chassis.position.y = 0.52;
    chassis.castShadow = true;
    root.add(chassis);

    const cab = new THREE.Mesh(
      new THREE.BoxGeometry(1.52, 0.68, 1.15),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 })
    );
    cab.position.set(0, 1.12, 0.82);
    root.add(cab);

    // Giant Speaker Wall ("Paredão")
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(1.75, 1.45, 1.35),
      new THREE.MeshStandardMaterial({ color: 0x181826, roughness: 0.6 })
    );
    wall.position.set(0, 1.48, -0.58);
    wall.castShadow = true;
    root.add(wall);

    const speakerColors = [0xff3b7f, 0x00f5d4, 0xfee440];
    for (let row = 0; row < 2; row++) {
      for (let col = -1; col <= 1; col++) {
        const cone = new THREE.Mesh(
          new THREE.CylinderGeometry(0.23, 0.12, 0.16, 12).rotateX(Math.PI / 2),
          new THREE.MeshBasicMaterial({ color: speakerColors[(row + col + 2) % 3] })
        );
        cone.position.set(col * 0.52, 1.15 + row * 0.62, -1.28);
        root.add(cone);
        woofers.push(cone);
      }
    }

    addWheels(root, 0.82, 0.36, [-1.05, 1.05]);
  } else {
    // BOSS: Trio Elétrico Clandestino 3AM
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 5.4),
      new THREE.MeshBasicMaterial({ color: 0xff007f, transparent: true, opacity: 0.55, depthWrite: false })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.07;
    root.add(glow);

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 1.85, 4.4),
      new THREE.MeshStandardMaterial({ color: 0x5b21b6, roughness: 0.35, metalness: 0.4 })
    );
    body.position.y = 1.25;
    body.castShadow = true;
    root.add(body);

    // Neon trim top stage
    const stageTop = new THREE.Mesh(
      new THREE.BoxGeometry(2.28, 0.28, 4.55),
      new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    );
    stageTop.position.y = 2.25;
    root.add(stageTop);

    // Side & rear mega speakers
    const spkColors = [0xff3b7f, 0x00f5d4, 0xfee440, 0xc084fc];
    let idx = 0;
    for (const side of [-1.08, 1.08]) {
      for (const zOff of [-1.3, 0, 1.3]) {
        const cone = new THREE.Mesh(
          new THREE.CylinderGeometry(0.32, 0.16, 0.16, 14).rotateZ(Math.PI / 2),
          new THREE.MeshBasicMaterial({ color: spkColors[idx++ % spkColors.length] })
        );
        cone.position.set(side, 1.35, zOff);
        root.add(cone);
        woofers.push(cone);
      }
    }

    addWheels(root, 1.05, 0.42, [-1.5, 0, 1.5]);
  }

  // Headlights for all cars
  for (const dx of [-0.52, 0.52]) {
    const hl = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.16, 0.1),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    hl.position.set(dx, 0.5, type === 'trio_boss' ? 2.22 : (type === 'paredao' ? 1.62 : 1.28));
    root.add(hl);
  }

  return { root, pivot: root, woofers };
}

function addWheels(parent, halfX, radius, zPositions) {
  const geo = new THREE.CylinderGeometry(radius, radius, 0.24, 12).rotateZ(Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({ color: 0x11131a, roughness: 0.85 });
  for (const z of zPositions) {
    for (const s of [-1, 1]) {
      const w = new THREE.Mesh(geo, mat);
      w.position.set(s * halfX, radius, z);
      parent.add(w);
    }
  }
}

export class Enemy {
  constructor(typeId, hpMult, map, effects) {
    this.def = ENEMY_TYPES[typeId];
    this.typeId = typeId;
    this.map = map;
    this.effects = effects;

    this.maxHp = Math.round(this.def.hp * hpMult);
    this.hp = this.maxHp;
    this.baseSpeed = this.def.speed;
    this.distance = 0;
    this.laneOffset = (Math.random() - 0.5) * 1.35;
    this.dead = false;
    this.reachedEnd = false;

    // Status effects
    this.slowFactor = 1.0;
    this.slowTimer = 0;
    this.vulnBonus = 0;
    this.vulnTimer = 0;

    // Timers for animations & street noise
    this.animTime = Math.random() * 10;
    this.noiseTimer = 0.8 + Math.random() * 2.2;
    this.bassWaveTimer = 0.5;

    // Build 3D visual
    const built = this.def.category === 'moto'
      ? buildMotoMesh(typeId === 'moto_grau')
      : buildSoundCarMesh(typeId);

    this.mesh = built.root;
    this.pivot = built.pivot;
    this.woofers = built.woofers;
    this.mesh.scale.setScalar(this.def.scale);

    // Build overhead HP bar
    this.hpBarGroup = new THREE.Group();
    const barWidth = this.def.isBoss ? 2.6 : 1.35;
    this.barWidth = barWidth;
    const bgGeo = new THREE.PlaneGeometry(barWidth, 0.17);
    const bgMat = new THREE.MeshBasicMaterial({ color: 0x090d16, side: THREE.DoubleSide });
    this.hpBarBg = new THREE.Mesh(bgGeo, bgMat);
    this.hpBarGroup.add(this.hpBarBg);

    const fgGeo = new THREE.PlaneGeometry(barWidth - 0.04, 0.12);
    this.hpBarMat = new THREE.MeshBasicMaterial({ color: 0x38d399, side: THREE.DoubleSide });
    this.hpBarFill = new THREE.Mesh(fgGeo, this.hpBarMat);
    this.hpBarFill.position.z = 0.01;
    this.hpBarGroup.add(this.hpBarFill);

    // Status dots (blue = soaked/slowed, yellow = egged/vulnerable)
    this.slowBadge = new THREE.Mesh(
      new THREE.CircleGeometry(0.11, 10),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
    );
    this.slowBadge.position.set(-barWidth / 2 - 0.18, 0, 0.01);
    this.slowBadge.visible = false;
    this.hpBarGroup.add(this.slowBadge);

    this.vulnBadge = new THREE.Mesh(
      new THREE.CircleGeometry(0.11, 10),
      new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
    );
    this.vulnBadge.position.set(barWidth / 2 + 0.18, 0, 0.01);
    this.vulnBadge.visible = false;
    this.hpBarGroup.add(this.vulnBadge);

    const barHeight = this.def.isBoss ? 2.9 : (this.def.category === 'som' ? 2.35 : 1.95);
    this.hpBarGroup.position.y = barHeight;
    this.mesh.add(this.hpBarGroup);

    // Set initial position
    this.updateTransform(0);
  }

  applySlow(factor, duration) {
    if (factor < this.slowFactor || this.slowTimer <= 0) {
      this.slowFactor = factor;
    }
    this.slowTimer = Math.max(this.slowTimer, duration);
  }

  applyVulnerability(bonus, duration) {
    this.vulnBonus = Math.max(this.vulnBonus, bonus);
    this.vulnTimer = Math.max(this.vulnTimer, duration);
  }

  takeDamage(rawAmount) {
    if (this.dead) return false;
    const mult = 1 + (this.vulnTimer > 0 ? this.vulnBonus : 0);
    const dmg = rawAmount * mult;
    this.hp -= dmg;

    const ratio = Math.max(0, this.hp / this.maxHp);
    this.hpBarFill.scale.x = Math.max(0.001, ratio);
    this.hpBarFill.position.x = -((1 - ratio) * (this.barWidth - 0.04)) * 0.5;

    if (ratio > 0.55) this.hpBarMat.color.setHex(0x38d399);
    else if (ratio > 0.28) this.hpBarMat.color.setHex(0xffd166);
    else this.hpBarMat.color.setHex(0xff5964);

    if (this.hp <= 0) {
      this.dead = true;
      return true;
    }
    return false;
  }

  updateTransform(dt) {
    const sample = this.map.samplePath(this.distance);
    const perp = new THREE.Vector3(-sample.dir.z, 0, sample.dir.x);
    this.mesh.position.copy(sample.pos).addScaledVector(perp, this.laneOffset);
    this.mesh.position.y = 0.08;

    const targetAngle = Math.atan2(sample.dir.x, sample.dir.z);
    this.mesh.rotation.y = targetAngle;

    // Moto wheelie ("grau") animation or sound-car speaker bounce
    if (this.typeId === 'moto_grau') {
      const wheelie = Math.max(0, Math.sin(this.animTime * 3.2)) * 0.42;
      this.pivot.rotation.x = -wheelie;
    } else if (this.typeId === 'moto_cg') {
      this.pivot.position.y = Math.abs(Math.sin(this.animTime * 18)) * 0.03;
    }

    if (this.woofers.length > 0) {
      const pulse = 1 + Math.abs(Math.sin(this.animTime * 9.5)) * 0.32;
      for (const w of this.woofers) {
        w.scale.set(pulse, pulse, pulse);
      }
    }
  }

  update(dt, camera) {
    if (this.dead || this.reachedEnd) return;
    this.animTime += dt;

    // Tick debuffs
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) this.slowFactor = 1.0;
    }
    if (this.vulnTimer > 0) {
      this.vulnTimer -= dt;
      if (this.vulnTimer <= 0) this.vulnBonus = 0;
    }

    this.slowBadge.visible = this.slowTimer > 0;
    this.vulnBadge.visible = this.vulnTimer > 0;

    // Advance along road
    const currentSpeed = this.baseSpeed * (this.slowTimer > 0 ? this.slowFactor : 1.0);
    this.distance += currentSpeed * dt;

    if (this.distance >= this.map.totalPathLength) {
      this.reachedEnd = true;
      return;
    }

    this.updateTransform(dt);

    // Billboard HP bar to camera cleanly regardless of vehicle yaw
    this.hpBarGroup.lookAt(camera.position);

    // Sound cars emit bass rings + wake up windows!
    if (this.def.category === 'som') {
      this.bassWaveTimer -= dt;
      if (this.bassWaveTimer <= 0) {
        this.bassWaveTimer = this.def.isBoss ? 0.55 : 0.85;
        this.effects.spawnShockwaveRing(
          this.mesh.position,
          this.def.isBoss ? 0xff3b7f : 0x00f5d4,
          this.def.isBoss ? 3.8 : 2.2,
          0.5
        );
        sound.playBassBeat();
        this.map.awakenWindowsNear(this.mesh.position, 11);
      }
    }

    // Periodic comic street noise callout
    this.noiseTimer -= dt;
    if (this.noiseTimer <= 0) {
      this.noiseTimer = 3.6 + Math.random() * 4.2;
      if (Math.random() < 0.42) {
        const phrase = this.def.shout[Math.floor(Math.random() * this.def.shout.length)];
        const labelPos = this.mesh.position.clone();
        labelPos.y += 2.2;
        this.effects.spawnFloatingText(
          labelPos,
          phrase,
          this.def.category === 'som' ? '#ff3b7f' : '#ff9f1c'
        );
        if (this.def.category === 'moto') sound.playMotoRev();
        this.map.awakenWindowsNear(this.mesh.position, 9);
      }
    }
  }
}
