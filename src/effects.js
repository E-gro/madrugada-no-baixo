import * as THREE from 'three';

export class EffectsManager {
  constructor(scene, camera, labelsContainer) {
    this.scene = scene;
    this.camera = camera;
    this.labelsContainer = labelsContainer;

    this.particles = [];
    this.rings = [];
    this.beams = [];
    this.labels = [];

    this.sharedSphereGeo = new THREE.SphereGeometry(0.12, 6, 6);
    this.sharedRingGeo = new THREE.RingGeometry(0.35, 0.52, 24);
  }

  spawnParticles(pos, colorHex, count = 10, speed = 4.0, upward = 2.5, scale = 1.0) {
    const mat = new THREE.MeshBasicMaterial({ color: colorHex });
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.sharedSphereGeo, mat);
      mesh.position.copy(pos);
      mesh.scale.setScalar(scale * (0.7 + Math.random() * 0.7));
      const angle = Math.random() * Math.PI * 2;
      const spd = (0.35 + Math.random() * 0.65) * speed;
      const vel = new THREE.Vector3(
        Math.cos(angle) * spd,
        upward * (0.4 + Math.random() * 0.8),
        Math.sin(angle) * spd
      );
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vel,
        life: 0.45 + Math.random() * 0.3,
        maxLife: 0.75
      });
    }
  }

  spawnShockwaveRing(pos, colorHex, maxRadius = 2.8, duration = 0.45) {
    const mat = new THREE.MeshBasicMaterial({
      color: colorHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(this.sharedRingGeo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(pos.x, 0.14, pos.z);
    this.scene.add(mesh);
    this.rings.push({
      mesh,
      mat,
      elapsed: 0,
      duration,
      maxRadius
    });
  }

  spawnElectricBeam(points, colorHex = 0xc084fc) {
    // Jagged lightning polyline through target chain
    const jagged = [];
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      const steps = 6;
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const p = new THREE.Vector3().lerpVectors(a, b, t);
        if (s > 0 && s < steps) {
          p.x += (Math.random() - 0.5) * 0.45;
          p.y += (Math.random() - 0.5) * 0.45;
          p.z += (Math.random() - 0.5) * 0.45;
        }
        jagged.push(p);
      }
    }
    const geo = new THREE.BufferGeometry().setFromPoints(jagged);
    const mat = new THREE.LineBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 1.0
    });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);
    this.beams.push({ line, geo, mat, life: 0.22, maxLife: 0.22 });
  }

  spawnFloatingText(worldPos, text, color = '#ffd166', bg = 'rgba(10,13,26,0.82)') {
    if (this.labels.length > 26) return; // Keep DOM snappy
    const el = document.createElement('div');
    el.className = 'float-tag';
    el.textContent = text;
    el.style.color = color;
    el.style.background = bg;
    el.style.border = `1px solid ${color}55`;
    this.labelsContainer.appendChild(el);

    this.labels.push({
      el,
      pos: worldPos.clone(),
      life: 1.05,
      maxLife: 1.05
    });
  }

  update(dt) {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }
      p.vel.y -= 9.8 * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      if (p.mesh.position.y < 0.08) {
        p.mesh.position.y = 0.08;
        p.vel.y *= -0.3;
      }
      p.mesh.scale.multiplyScalar(0.96);
    }

    // Update shockwave rings
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.elapsed += dt;
      const t = r.elapsed / r.duration;
      if (t >= 1) {
        this.scene.remove(r.mesh);
        r.mat.dispose();
        this.rings.splice(i, 1);
        continue;
      }
      const scale = 0.4 + t * (r.maxRadius * 2);
      r.mesh.scale.setScalar(scale);
      r.mat.opacity = (1 - t) * 0.8;
    }

    // Update electric beams
    for (let i = this.beams.length - 1; i >= 0; i--) {
      const b = this.beams[i];
      b.life -= dt;
      if (b.life <= 0) {
        this.scene.remove(b.line);
        b.geo.dispose();
        b.mat.dispose();
        this.beams.splice(i, 1);
        continue;
      }
      b.mat.opacity = b.life / b.maxLife;
    }

    // Project floating world labels to screen
    const widthHalf = window.innerWidth / 2;
    const heightHalf = window.innerHeight / 2;

    for (let i = this.labels.length - 1; i >= 0; i--) {
      const lbl = this.labels[i];
      lbl.life -= dt;
      if (lbl.life <= 0) {
        lbl.el.remove();
        this.labels.splice(i, 1);
        continue;
      }
      lbl.pos.y += dt * 1.15;
      const projected = lbl.pos.clone().project(this.camera);
      if (projected.z > 1) {
        lbl.el.style.opacity = '0';
        continue;
      }
      const x = projected.x * widthHalf + widthHalf;
      const y = -(projected.y * heightHalf) + heightHalf;
      lbl.el.style.left = `${x}px`;
      lbl.el.style.top = `${y}px`;
      lbl.el.style.opacity = String(Math.min(1, (lbl.life / lbl.maxLife) * 1.5));
    }
  }

  clearAll() {
    for (const p of this.particles) this.scene.remove(p.mesh);
    for (const r of this.rings) { this.scene.remove(r.mesh); r.mat.dispose(); }
    for (const b of this.beams) { this.scene.remove(b.line); b.geo.dispose(); b.mat.dispose(); }
    for (const l of this.labels) l.el.remove();
    this.particles = [];
    this.rings = [];
    this.beams = [];
    this.labels = [];
  }
}
