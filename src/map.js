import * as THREE from 'three';

export const ROAD_WAYPOINTS = [
  new THREE.Vector3(-27, 0, -9),
  new THREE.Vector3(-10, 0, -9),
  new THREE.Vector3(-10, 0, 8),
  new THREE.Vector3(9, 0, 8),
  new THREE.Vector3(9, 0, -7),
  new THREE.Vector3(27, 0, -7)
];

// Tactical sidewalk spots around corners & straightaways (carefully placed outside road width 4.2)
export const PAD_COORDS = [
  { x: -20.5, z: -13.2 },
  { x: -14.5, z: -4.8 },
  { x: -5.8, z: -9.5 },
  { x: -14.2, z: 1.5 },
  { x: -5.8, z: 3.6 },
  { x: -14.2, z: 11.8 },
  { x: -3.2, z: 12.2 },
  { x: 2.8, z: 3.8 },
  { x: 4.5, z: 12.2 },
  { x: 13.2, z: 8.5 },
  { x: 13.2, z: 0.8 },
  { x: 4.8, z: -2.8 },
  { x: 13.5, z: -11.2 },
  { x: 20.5, z: -2.8 }
];

function createPortugueseSidewalkTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#252838';
  ctx.fillRect(0, 0, 256, 256);

  // Subtle mosaic stone grid + wave motif
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 2;
  const step = 16;
  for (let x = 0; x < 256; x += step) {
    for (let y = 0; y < 256; y += step) {
      const wave = Math.sin((x / 256) * Math.PI * 4) * 18;
      const isDark = ((y + wave + 256) % 64) < 20;
      ctx.fillStyle = isDark ? '#191c28' : '#2c3044';
      ctx.fillRect(x + 1, y + 1, step - 2, step - 2);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(18, 14);
  return tex;
}

function createNeonSignTexture(text, colorHex) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#090b14';
  ctx.fillRect(0, 0, 256, 64);

  ctx.strokeStyle = colorHex;
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, 244, 52);

  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = colorHex;
  ctx.shadowBlur = 14;
  ctx.fillStyle = colorHex;
  ctx.fillText(text, 128, 34);

  return new THREE.CanvasTexture(canvas);
}

export class BaixoMap {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.pads = [];
    this.windows = [];
    this.neonSigns = [];
    this.streetLights = [];

    this.pathSegments = [];
    this.totalPathLength = 0;

    this.buildPathData();
    this.buildGroundAndRoad();
    this.buildPads();
    this.buildBuildings();
    this.buildStreetFurniture();
    this.buildSkyStars();
    this.setupLighting();
  }

  buildPathData() {
    this.totalPathLength = 0;
    for (let i = 0; i < ROAD_WAYPOINTS.length - 1; i++) {
      const a = ROAD_WAYPOINTS[i];
      const b = ROAD_WAYPOINTS[i + 1];
      const len = a.distanceTo(b);
      this.pathSegments.push({
        start: a.clone(),
        end: b.clone(),
        length: len,
        accumStart: this.totalPathLength
      });
      this.totalPathLength += len;
    }
  }

  // Sample position and tangent direction along road (dist in [0, totalPathLength])
  samplePath(dist) {
    const clamped = Math.max(0, Math.min(this.totalPathLength, dist));
    for (let i = 0; i < this.pathSegments.length; i++) {
      const seg = this.pathSegments[i];
      if (clamped <= seg.accumStart + seg.length || i === this.pathSegments.length - 1) {
        const localT = Math.min(1, Math.max(0, (clamped - seg.accumStart) / seg.length));
        const pos = new THREE.Vector3().lerpVectors(seg.start, seg.end, localT);
        const dir = new THREE.Vector3().subVectors(seg.end, seg.start).normalize();
        return { pos, dir };
      }
    }
    return { pos: ROAD_WAYPOINTS[0].clone(), dir: new THREE.Vector3(1, 0, 0) };
  }

  distanceToRoad2D(x, z) {
    let minD = Infinity;
    for (const seg of this.pathSegments) {
      const vx = seg.end.x - seg.start.x;
      const vz = seg.end.z - seg.start.z;
      const wx = x - seg.start.x;
      const wz = z - seg.start.z;
      const c1 = vx * wx + vz * wz;
      const c2 = vx * vx + vz * vz;
      const b = Math.max(0, Math.min(1, c1 / c2));
      const px = seg.start.x + b * vx;
      const pz = seg.start.z + b * vz;
      const d = Math.hypot(x - px, z - pz);
      if (d < minD) minD = d;
    }
    return minD;
  }

  buildGroundAndRoad() {
    // Base city block sidewalk
    const sidewalkTex = createPortugueseSidewalkTexture();
    const groundGeo = new THREE.BoxGeometry(64, 0.6, 46);
    const groundMat = new THREE.MeshStandardMaterial({
      map: sidewalkTex,
      roughness: 0.88,
      metalness: 0.05
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.3;
    ground.receiveShadow = true;
    this.group.add(ground);

    // Asphalt road bed + curbs
    const roadWidth = 4.4;
    const curbWidth = 5.1;
    const asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x151722,
      roughness: 0.82,
      metalness: 0.12
    });
    const curbMat = new THREE.MeshStandardMaterial({
      color: 0x3b4056,
      roughness: 0.9
    });
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xeab308 });
    const crosswalkMat = new THREE.MeshBasicMaterial({ color: 0xdbeafe });

    for (const seg of this.pathSegments) {
      const mid = new THREE.Vector3().addVectors(seg.start, seg.end).multiplyScalar(0.5);
      const isHorizontal = Math.abs(seg.end.x - seg.start.x) > Math.abs(seg.end.z - seg.start.z);
      const sx = isHorizontal ? seg.length + roadWidth : roadWidth;
      const sz = isHorizontal ? roadWidth : seg.length + roadWidth;

      const cx = isHorizontal ? seg.length + curbWidth : curbWidth;
      const cz = isHorizontal ? curbWidth : seg.length + curbWidth;

      const curb = new THREE.Mesh(new THREE.BoxGeometry(cx, 0.08, cz), curbMat);
      curb.position.set(mid.x, 0.02, mid.z);
      curb.receiveShadow = true;
      this.group.add(curb);

      const road = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.09, sz), asphaltMat);
      road.position.set(mid.x, 0.035, mid.z);
      road.receiveShadow = true;
      this.group.add(road);

      // Center yellow dashes
      const dashCount = Math.floor(seg.length / 2.2);
      for (let d = 1; d < dashCount; d++) {
        const p = new THREE.Vector3().lerpVectors(seg.start, seg.end, d / dashCount);
        const dashGeo = isHorizontal
          ? new THREE.PlaneGeometry(1.0, 0.14)
          : new THREE.PlaneGeometry(0.14, 1.0);
        const dash = new THREE.Mesh(dashGeo, dashMat);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(p.x, 0.09, p.z);
        this.group.add(dash);
      }
    }

    // Add crosswalks near entry, middle & exit
    const crosswalkSpots = [
      { x: -22, z: -9, horiz: true },
      { x: -1, z: 8, horiz: true },
      { x: 21, z: -7, horiz: true }
    ];
    for (const cw of crosswalkSpots) {
      for (let s = -1.5; s <= 1.5; s += 0.6) {
        const stripe = new THREE.Mesh(
          cw.horiz ? new THREE.PlaneGeometry(1.5, 0.28) : new THREE.PlaneGeometry(0.28, 1.5),
          crosswalkMat
        );
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(cw.x, 0.092, cw.z + s);
        this.group.add(stripe);
      }
    }

    // Spawn & Exit portals/banners
    this.buildStreetGate(-25.5, -9, 'ENTRADA DO BARULHO', 0xff3b7f);
    this.buildStreetGate(25.5, -7, 'SONO DOS MORADORES', 0x38d399);
  }

  buildStreetGate(x, z, label, colorHex) {
    const postMat = new THREE.MeshStandardMaterial({ color: 0x2c3248, metalness: 0.5, roughness: 0.5 });
    for (const dz of [-2.5, 2.5]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 4.2, 8), postMat);
      post.position.set(x, 2.1, z + dz);
      this.group.add(post);
    }
    const signTex = createNeonSignTexture(label, '#' + colorHex.toString(16).padStart(6, '0'));
    const banner = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.95, 5.2),
      new THREE.MeshBasicMaterial({ map: signTex })
    );
    banner.position.set(x, 3.85, z);
    this.group.add(banner);
  }

  buildPads() {
    const padBaseGeo = new THREE.CylinderGeometry(1.32, 1.45, 0.22, 24);
    const padRingGeo = new THREE.RingGeometry(1.12, 1.3, 28);

    PAD_COORDS.forEach((coord, idx) => {
      const padGroup = new THREE.Group();
      padGroup.position.set(coord.x, 0.08, coord.z);

      const baseMat = new THREE.MeshStandardMaterial({
        color: 0x323954,
        roughness: 0.72,
        metalness: 0.15
      });
      const baseMesh = new THREE.Mesh(padBaseGeo, baseMat);
      baseMesh.receiveShadow = true;
      baseMesh.userData = { padIndex: idx };
      padGroup.add(baseMesh);

      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffd166,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.55
      });
      const ringMesh = new THREE.Mesh(padRingGeo, ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.y = 0.12;
      padGroup.add(ringMesh);

      this.group.add(padGroup);
      this.pads.push({
        index: idx,
        x: coord.x,
        z: coord.z,
        group: padGroup,
        baseMesh,
        ringMesh,
        ringMat,
        tower: null
      });
    });
  }

  buildBuildings() {
    // Curated positions for Sobrados & Botecos do Baixo around the street
    const facadePalette = [
      0xb55239, // Terracota
      0x3b6990, // Azul colonial
      0xc28d38, // Ocre / mostarda
      0x457b6d, // Verde antigo
      0x8b4a6b, // Rosa queimado
      0x58627a, // Cinza urbano
      0x9b5de5  // Roxo boêmio
    ];

    const candidateBlocks = [
      // North row
      { x: -23, z: -17.5, w: 5.2, d: 4.6, floors: 2, neon: 'SINUCA 24H' },
      { x: -16.8, z: -17.8, w: 5.4, d: 4.5, floors: 3 },
      { x: -10.5, z: -17.5, w: 5.2, d: 4.6, floors: 2 },
      { x: -4.2, z: -17.5, w: 5.4, d: 4.8, floors: 3, neon: 'BAR DO BAIXO' },
      { x: 2.2, z: -16.5, w: 5.5, d: 4.8, floors: 2 },
      { x: 8.6, z: -16.5, w: 5.2, d: 4.6, floors: 3 },
      { x: 15.0, z: -16.8, w: 5.4, d: 4.5, floors: 2, neon: 'PASTEL & CALDO' },
      { x: 21.5, z: -16.5, w: 5.5, d: 4.8, floors: 3 },

      // Inner central courtyard sobrados
      { x: -3.6, z: -2.2, w: 4.6, d: 4.4, floors: 2 },
      { x: 2.2, z: -9.5, w: 4.6, d: 4.2, floors: 3 },

      // West & South-West blocks
      { x: -22.5, z: -1.5, w: 5.6, d: 5.0, floors: 3, neon: 'ADEGA' },
      { x: -22.5, z: 5.2, w: 5.4, d: 4.8, floors: 2 },
      { x: -22.2, z: 12.2, w: 5.6, d: 5.0, floors: 3 },
      { x: -22.0, z: 18.0, w: 5.5, d: 4.4, floors: 2 },

      // South row
      { x: -15.0, z: 17.6, w: 5.4, d: 4.5, floors: 3 },
      { x: -8.6, z: 17.6, w: 5.2, d: 4.6, floors: 2, neon: 'LANCHES' },
      { x: -2.2, z: 17.8, w: 5.4, d: 4.5, floors: 3 },
      { x: 4.2, z: 17.8, w: 5.2, d: 4.6, floors: 2 },
      { x: 10.8, z: 17.5, w: 5.4, d: 4.6, floors: 3 },
      { x: 17.4, z: 17.2, w: 5.5, d: 4.8, floors: 2 },

      // East blocks
      { x: 21.5, z: 4.5, w: 5.4, d: 5.0, floors: 3, neon: 'BOTECO' },
      { x: 21.5, z: 11.2, w: 5.4, d: 4.8, floors: 2 },
      { x: 22.8, z: -1.2, w: 4.2, d: 3.8, floors: 2 }
    ];

    const darkWinMat = new THREE.MeshStandardMaterial({
      color: 0x121626,
      emissive: 0x000000,
      roughness: 0.4
    });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x26293a, roughness: 0.9 });
    const shutterDoorMat = new THREE.MeshStandardMaterial({ color: 0x394158, metalness: 0.6, roughness: 0.45 });

    candidateBlocks.forEach((b, idx) => {
      // Safety check so no building overlaps pads or road
      if (this.distanceToRoad2D(b.x, b.z) < 5.0) return;
      for (const pad of PAD_COORDS) {
        if (Math.hypot(b.x - pad.x, b.z - pad.z) < 3.6) return;
      }

      const h = b.floors * 2.55;
      const color = facadePalette[idx % facadePalette.length];
      const bGroup = new THREE.Group();
      bGroup.position.set(b.x, 0, b.z);

      const body = new THREE.Mesh(
        new THREE.BoxGeometry(b.w, h, b.d),
        new THREE.MeshStandardMaterial({ color, roughness: 0.85 })
      );
      body.position.y = h / 2;
      body.castShadow = true;
      body.receiveShadow = true;
      bGroup.add(body);

      // Roof cornice
      const roof = new THREE.Mesh(new THREE.BoxGeometry(b.w + 0.35, 0.3, b.d + 0.35), roofMat);
      roof.position.y = h + 0.15;
      bGroup.add(roof);

      // Ground floor rolled steel door (boteco fechado)
      const door = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.9, b.d + 0.08), shutterDoorMat);
      door.position.y = 0.95;
      bGroup.add(door);

      // Upper floor windows on front & back
      for (let f = 1; f < b.floors; f++) {
        for (const wx of [-b.w * 0.26, b.w * 0.26]) {
          const winMat = darkWinMat.clone();
          // A few night-owl windows start dimly lit
          if ((idx + f) % 5 === 0) {
            winMat.emissive.setHex(0xffb703);
            winMat.emissiveIntensity = 0.35;
          }
          const win = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.15, b.d + 0.1), winMat);
          win.position.set(wx, f * 2.5 + 1.1, 0);
          bGroup.add(win);

          this.windows.push({
            mesh: win,
            mat: winMat,
            worldPos: new THREE.Vector3(b.x + wx, f * 2.5 + 1.1, b.z),
            awakeTimer: 0
          });
        }
      }

      // Optional flickering neon bar sign
      if (b.neon) {
        const neonColor = idx % 2 === 0 ? '#ff3b7f' : '#2ec4b6';
        const signTex = createNeonSignTexture(b.neon, neonColor);
        const signMat = new THREE.MeshBasicMaterial({ map: signTex });
        const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.65), signMat);
        const faceSouth = b.z < 0;
        sign.position.set(0, 2.35, faceSouth ? b.d / 2 + 0.08 : -b.d / 2 - 0.08);
        if (!faceSouth) sign.rotation.y = Math.PI;
        bGroup.add(sign);
        this.neonSigns.push(signMat);
      }

      this.group.add(bGroup);
    });
  }

  buildStreetFurniture() {
    // Brazilian utility poles with sodium lamps + catenary wires
    const poleCoords = [
      { x: -18.5, z: -6.2 },
      { x: -7.2, z: -5.5 },
      { x: -7.2, z: 5.2 },
      { x: 5.8, z: 5.2 },
      { x: 5.8, z: -4.2 },
      { x: 18.0, z: -4.2 }
    ];

    const poleMat = new THREE.MeshStandardMaterial({ color: 0x4a4e69, roughness: 0.9 });
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffd166 });
    const wireMat = new THREE.LineBasicMaterial({ color: 0x0c0e18, transparent: true, opacity: 0.75 });

    const poleTips = [];

    poleCoords.forEach((p, idx) => {
      const pGroup = new THREE.Group();
      pGroup.position.set(p.x, 0, p.z);

      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, 5.4, 8), poleMat);
      post.position.y = 2.7;
      post.castShadow = true;
      pGroup.add(post);

      // Crossarm
      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.08), poleMat);
      arm.position.y = 5.1;
      pGroup.add(arm);

      // Lamp fixture
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), bulbMat);
      bulb.position.set(0, 4.85, 0);
      pGroup.add(bulb);

      // Volumetric light cone illusion
      const coneGeo = new THREE.ConeGeometry(2.6, 4.8, 16, 1, true);
      const coneMat = new THREE.MeshBasicMaterial({
        color: 0xffb703,
        transparent: true,
        opacity: 0.055,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.y = 2.45;
      pGroup.add(cone);

      // Warm PointLight on alternate poles for high FPS + cozy glow
      if (idx % 2 === 0 || idx === poleCoords.length - 1) {
        const pl = new THREE.PointLight(0xffb703, 14, 17, 1.6);
        pl.position.set(p.x, 4.7, p.z);
        this.group.add(pl);
        this.streetLights.push(pl);
      }

      this.group.add(pGroup);
      poleTips.push(new THREE.Vector3(p.x, 5.1, p.z));
    });

    // Connect utility poles with sagging power wires
    for (let i = 0; i < poleTips.length - 1; i++) {
      const a = poleTips[i];
      const b = poleTips[i + 1];
      for (const offset of [-0.35, 0.35]) {
        const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
        mid.y -= 0.48;
        const curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(a.x + offset, a.y, a.z),
          new THREE.Vector3(mid.x + offset, mid.y, mid.z),
          new THREE.Vector3(b.x + offset, b.y, b.z)
        );
        const pts = curve.getPoints(14);
        const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
        this.group.add(new THREE.Line(lineGeo, wireMat));
      }
    }

    // Street trees along outer sidewalks
    const treeSpots = [
      { x: -16, z: -13.2 }, { x: -1, z: -12.8 }, { x: 17.5, z: -11.5 },
      { x: -16.5, z: 12.8 }, { x: 0.5, z: 13.0 }, { x: 16.5, z: 12.2 },
      { x: 16.5, z: 4.5 }, { x: -17.5, z: -4.2 }
    ];
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3525, roughness: 0.95 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x1e4638, roughness: 0.85 });

    for (const t of treeSpots) {
      if (this.distanceToRoad2D(t.x, t.z) < 3.6) continue;
      let nearPad = false;
      for (const pad of PAD_COORDS) {
        if (Math.hypot(t.x - pad.x, t.z - pad.z) < 2.5) nearPad = true;
      }
      if (nearPad) continue;

      const tg = new THREE.Group();
      tg.position.set(t.x, 0, t.z);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 1.6, 7), trunkMat);
      trunk.position.y = 0.8;
      tg.add(trunk);

      const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(1.15, 1), leafMat);
      crown.position.y = 2.2;
      crown.castShadow = true;
      tg.add(crown);
      this.group.add(tg);
    }
  }

  buildSkyStars() {
    const starCount = 320;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 65 + Math.random() * 35;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.42;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = Math.max(12, r * Math.cos(phi));
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.starMat = new THREE.PointsMaterial({
      color: 0xe2e8f0,
      size: 0.45,
      transparent: true,
      opacity: 0.85
    });
    const stars = new THREE.Points(geo, this.starMat);
    this.scene.add(stars);
  }

  setupLighting() {
    this.hemiLight = new THREE.HemisphereLight(0x3a4e8c, 0x181726, 0.95);
    this.scene.add(this.hemiLight);

    this.moonLight = new THREE.DirectionalLight(0x8da9fc, 1.15);
    this.moonLight.position.set(-18, 28, -14);
    this.moonLight.castShadow = true;
    this.moonLight.shadow.mapSize.set(1024, 1024);
    this.moonLight.shadow.camera.near = 2;
    this.moonLight.shadow.camera.far = 75;
    const d = 28;
    this.moonLight.shadow.camera.left = -d;
    this.moonLight.shadow.camera.right = d;
    this.moonLight.shadow.camera.top = d;
    this.moonLight.shadow.camera.bottom = -d;
    this.scene.add(this.moonLight);
  }

  // Progress 0.0 (02:00 AM deep night) -> 1.0 (06:00 AM sunrise!)
  setDawnProgress(p) {
    const clamped = Math.max(0, Math.min(1, p));
    const nightBg = new THREE.Color(0x070914);
    const preDawnBg = new THREE.Color(0x1d1b3a);
    const sunriseBg = new THREE.Color(0xd97757);

    const skyColor = new THREE.Color();
    if (clamped < 0.75) {
      skyColor.lerpColors(nightBg, preDawnBg, clamped / 0.75);
    } else {
      skyColor.lerpColors(preDawnBg, sunriseBg, (clamped - 0.75) / 0.25);
    }
    this.scene.background = skyColor;
    if (this.scene.fog) {
      this.scene.fog.color.copy(skyColor);
    }

    if (this.starMat) {
      this.starMat.opacity = Math.max(0.05, 0.85 * (1 - clamped));
    }

    const moonCol = new THREE.Color(0x8da9fc);
    const sunCol = new THREE.Color(0xffbe76);
    this.moonLight.color.lerpColors(moonCol, sunCol, clamped);
    this.moonLight.intensity = 1.15 + clamped * 0.75;
  }

  // Light up nearby building windows when loud vehicles pass!
  awakenWindowsNear(pos, radius = 9.5) {
    for (const w of this.windows) {
      const dist = Math.hypot(w.worldPos.x - pos.x, w.worldPos.z - pos.z);
      if (dist < radius && Math.random() < 0.15) {
        w.awakeTimer = 3.5 + Math.random() * 3.0;
        w.mat.emissive.setHex(0xffc300);
        w.mat.emissiveIntensity = 0.85;
      }
    }
  }

  update(dt, elapsed) {
    // Animate pad rings softly
    for (const pad of this.pads) {
      if (!pad.tower) {
        pad.ringMat.opacity = 0.35 + Math.sin(elapsed * 2.8 + pad.index) * 0.18;
      } else {
        pad.ringMat.opacity = 0.15;
      }
    }

    // Cool down awakened windows back to sleep
    for (const w of this.windows) {
      if (w.awakeTimer > 0) {
        w.awakeTimer -= dt;
        if (w.awakeTimer <= 0) {
          w.mat.emissiveIntensity = 0;
        }
      }
    }
  }
}
