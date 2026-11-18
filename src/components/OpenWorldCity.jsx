import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Compass,
  Users,
  GitBranch,
  Sparkles,
  LayoutGrid,
  User as UserIcon,
  ShieldCheck,
  ArrowUp,
  HelpCircle,
  X
} from 'lucide-react';
import { DEFAULT_RESEARCH_FIELDS, getFieldMeta } from '../data/fields.js';
import { LegaciumLogo } from './LegaciumLogo.jsx';
import {
  resolveCharacterPreset,
  buildCharacterRig,
  buildPlayerAvatar,
  createFloatingLabel
} from '../utils/character3d.js';

/**
 * Hitung koordinat gedung Paviliun 3D secara dinamis untuk SEMUA bidang riset
 * (6 bidang bawaan + bidang baru apa pun yang ditambahkan Admin!).
 * Membagi merata di busur Barat & Timur agar koridor Utara (World Quest) & Selatan (Tech Tree) selalu lapang.
 */
function computeDistrictCoords(fieldsList) {
  const list = Array.isArray(fieldsList) && fieldsList.length > 0 ? fieldsList : DEFAULT_RESEARCH_FIELDS;
  const maxPerSide = Math.max(1, Math.ceil(list.length / 2));
  // Pastikan jarak antar paviliun minimal ~12 unit seberapa pun banyak bidang yang ditambahkan Admin
  const arcRad = (116 * Math.PI) / 180;
  const minRingForSpacing = maxPerSide > 1 ? ((maxPerSide - 1) * 12.2) / arcRad : 23.5;
  const ringR = Math.max(23.5, minRingForSpacing);
  const coords = {};

  const westFields = [];
  const eastFields = [];
  list.forEach((f, idx) => {
    if (idx % 2 === 0) westFields.push(f);
    else eastFields.push(f);
  });

  const placeArc = (items, isWest) => {
    const n = items.length;
    items.forEach((f, i) => {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const angleDeg = -58 + t * 116;
      const rad = (angleDeg * Math.PI) / 180;
      const x = (isWest ? -1 : 1) * Math.cos(rad) * ringR;
      const z = Math.sin(rad) * ringR;
      coords[f.id] = { x, z };
    });
  };

  placeArc(westFields, true);
  placeArc(eastFields, false);

  return { coords, ringR, worldRadius: Math.max(45, ringR + 21) };
}

export function OpenWorldCity({
  user,
  fields = DEFAULT_RESEARCH_FIELDS,
  mentors,
  quests,
  playerPosRef,
  onTalkToMentor,
  onOpenRoundtable,
  onOpenQuests,
  onOpenTechTree,
  onOpenDashboard,
  onOpenProfile,
  onOpenAdmin
}) {
  const mountRef = useRef(null);
  const keysRef = useRef({});
  const joyVecRef = useRef({ x: 0, z: 0 });
  const jumpQueuedRef = useRef(false);
  const walkTargetRef = useRef(null);
  const nearestRef = useRef(null);

  const [nearby, setNearby] = useState(null);
  const [radarPlayer, setRadarPlayer] = useState({ x: 0, z: 9, yaw: Math.PI });
  const [showHelp, setShowHelp] = useState(true);
  const [webglFailed, setWebglFailed] = useState(false);

  const activeQuest = quests[0] || null;
  const activeFields = useMemo(
    () => (Array.isArray(fields) && fields.length > 0 ? fields : DEFAULT_RESEARCH_FIELDS),
    [fields]
  );

  const { coords: districtCoords, worldRadius } = useMemo(
    () => computeDistrictCoords(activeFields),
    [activeFields]
  );

  const worldEntities = useMemo(() => {
    const fieldCounts = {};
    const npcs = mentors.map((m) => {
      const base = districtCoords[m.field] || { x: 0, z: -16 };
      const idxInField = fieldCounts[m.field] || 0;
      fieldCounts[m.field] = idxInField + 1;

      const toCenterLen = Math.hypot(base.x, base.z) || 1;
      const nx = -base.x / toCenterLen;
      const nz = -base.z / toCenterLen;
      const tx = -nz;
      const tz = nx;
      const lateralOffset =
        idxInField === 0
          ? 0
          : (idxInField % 2 === 1 ? 1 : -1) * Math.ceil(idxInField / 2) * 3.2;

      const x = base.x + nx * 5.2 + tx * lateralOffset;
      const z = base.z + nz * 5.2 + tz * lateralOffset;
      const facing = Math.atan2(nx, nz);
      const fm = getFieldMeta(m.field, activeFields);

      return {
        id: `mentor_${m.id}`,
        type: 'mentor',
        mentor: m,
        label: m.name,
        sublabel: `${fm.label} · ${m.specialty || 'Mentor'}`,
        color: fm.bgColor,
        x,
        z,
        facing,
        radius: 4.3
      };
    });

    const landmarks = [
      {
        id: 'roundtable',
        type: 'roundtable',
        label: 'Meja Bundar Lintas Era',
        sublabel: 'Diskusi 2–4 Tokoh 3D',
        color: '#F7C948',
        x: 0,
        z: 0,
        radius: 5.2
      },
      {
        id: 'quests',
        type: 'quests',
        label: 'Monumen World Quest',
        sublabel: `${quests.length} Proyek STEAM Aktif`,
        color: '#0E6BA8',
        x: 0,
        z: -25,
        radius: 5.4
      },
      {
        id: 'techtree',
        type: 'techtree',
        label: 'Pohon Sejarah',
        sublabel: 'Evolusi Tech Tree Kolektif',
        color: '#3CC9B8',
        x: 0,
        z: 25,
        radius: 5.4
      }
    ];

    return { npcs, landmarks, fieldCounts, all: [...landmarks, ...npcs] };
  }, [mentors, quests.length, districtCoords, activeFields]);

  const callbacksRef = useRef({});
  callbacksRef.current = {
    onTalkToMentor,
    onOpenRoundtable,
    onOpenQuests,
    onOpenTechTree,
    onOpenDashboard,
    onOpenProfile,
    onOpenAdmin
  };

  function triggerInteraction(entity) {
    if (!entity) return;
    if (entity.type === 'mentor') callbacksRef.current.onTalkToMentor?.(entity.mentor);
    else if (entity.type === 'roundtable') callbacksRef.current.onOpenRoundtable?.();
    else if (entity.type === 'quests') callbacksRef.current.onOpenQuests?.();
    else if (entity.type === 'techtree') callbacksRef.current.onOpenTechTree?.();
  }

  function walkToLocation(x, z, entity = null) {
    const dist = Math.hypot(x, z);
    let tx = x;
    let tz = z;
    if (entity && dist < 1) {
      tx = 0;
      tz = 4.4;
    } else if (entity) {
      const nx = x / dist;
      const nz = z / dist;
      tx = x - nx * 3.1;
      tz = z - nz * 3.1;
    }
    walkTargetRef.current = { x: tx, z: tz, entity };
  }

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      setWebglFailed(true);
      return;
    }

    setWebglFailed(false);
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#D5EFF8');
    scene.fog = new THREE.Fog('#D5EFF8', worldRadius + 12, worldRadius * 2.8);

    const camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 220);

    // Pencahayaan cerah ala game adventure open world
    scene.add(new THREE.HemisphereLight(0xffffff, 0xa8e0cf, 1.2));

    const sun = new THREE.DirectionalLight(0xfffbeb, 1.4);
    sun.position.set(32, 52, 26);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 5;
    sun.shadow.camera.far = 140;
    const d = 50;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    scene.add(sun);

    // === 1. PULAU OPEN WORLD, PANTAI & LAUTAN (RADIUS DINAMIS SESUAI JUMLAH BIDANG) ===
    const ground = new THREE.Mesh(
      new THREE.CylinderGeometry(worldRadius + 2, worldRadius + 6, 2.4, 56),
      new THREE.MeshStandardMaterial({ color: 0xb7e8cf, roughness: 0.9 })
    );
    ground.position.y = -1.2;
    ground.receiveShadow = true;
    scene.add(ground);

    const beach = new THREE.Mesh(
      new THREE.CylinderGeometry(worldRadius + 6.5, worldRadius + 9, 1.4, 56),
      new THREE.MeshStandardMaterial({ color: 0xf7e7b4, roughness: 0.95 })
    );
    beach.position.y = -1.65;
    beach.receiveShadow = true;
    scene.add(beach);

    const water = new THREE.Mesh(
      new THREE.CircleGeometry(190, 48),
      new THREE.MeshStandardMaterial({ color: 0x8bcbf2, roughness: 0.3, metalness: 0.05 })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.y = -1.9;
    scene.add(water);

    const hillMat = new THREE.MeshStandardMaterial({ color: 0x9edec2, roughness: 0.9 });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + 0.22;
      const hill = new THREE.Mesh(new THREE.SphereGeometry(6 + (i % 3) * 2, 16, 12), hillMat);
      hill.scale.set(1.4, 0.42, 1.1);
      hill.position.set(Math.cos(a) * (worldRadius - 3), -0.6, Math.sin(a) * (worldRadius - 3));
      scene.add(hill);
    }

    // Alun-alun Tengah
    const plaza = new THREE.Mesh(
      new THREE.CylinderGeometry(7.6, 8.0, 0.16, 40),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.8 })
    );
    plaza.position.y = 0.08;
    plaza.receiveShadow = true;
    scene.add(plaza);

    const plazaOutline = new THREE.Mesh(
      new THREE.TorusGeometry(7.8, 0.15, 10, 48),
      new THREE.MeshStandardMaterial({ color: 0x0f242d, roughness: 0.6 })
    );
    plazaOutline.rotation.x = Math.PI / 2;
    plazaOutline.position.y = 0.14;
    scene.add(plazaOutline);

    // Jalur Jalan Batu + Lentera Taman di Sepanjang Jalan
    const pathMat = new THREE.MeshStandardMaterial({ color: 0xeef8fa, roughness: 0.85 });
    const postMat = new THREE.MeshStandardMaterial({ color: 0x0f242d, roughness: 0.5 });
    const lampBulbMat = new THREE.MeshStandardMaterial({
      color: 0xf7c948,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.55
    });

    const pathTargets = [
      ...Object.values(districtCoords),
      { x: 0, z: -25 },
      { x: 0, z: 25 }
    ];
    pathTargets.forEach((pt) => {
      const len = Math.hypot(pt.x, pt.z);
      const road = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.08, len), pathMat);
      road.position.set(pt.x / 2, 0.04, pt.z / 2);
      road.rotation.y = Math.atan2(pt.x, pt.z);
      road.receiveShadow = true;
      scene.add(road);

      // Lentera di tengah jalan (sisi samping)
      const nx = pt.x / len;
      const nz = pt.z / len;
      const lx = pt.x * 0.52 - nz * 2.1;
      const lz = pt.z * 0.52 + nx * 2.1;
      const lamp = new THREE.Group();
      lamp.position.set(lx, 0, lz);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 2.5, 8), postMat);
      pole.position.y = 1.25;
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), lampBulbMat);
      bulb.position.y = 2.6;
      lamp.add(pole, bulb);
      scene.add(lamp);
    });

    // === 2. MEJA BUNDAR LINTAS ERA DI TENGAH (0, 0) ===
    const rtGroup = new THREE.Group();
    const rtTable = new THREE.Mesh(
      new THREE.CylinderGeometry(2.3, 1.85, 1.1, 24),
      new THREE.MeshStandardMaterial({ color: 0xf7c948, roughness: 0.45 })
    );
    rtTable.position.y = 0.65;
    rtTable.castShadow = true;
    rtGroup.add(rtTable);

    const seatMat = new THREE.MeshStandardMaterial({ color: 0x0f242d, roughness: 0.5 });
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + Math.PI / 4;
      const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 0.68, 16), seatMat);
      seat.position.set(Math.cos(a) * 3.6, 0.4, Math.sin(a) * 3.6);
      seat.castShadow = true;
      rtGroup.add(seat);
    }

    const rtCrystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.8, 0),
      new THREE.MeshStandardMaterial({
        color: 0xf7c948,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.4,
        roughness: 0.25,
        metalness: 0.35
      })
    );
    rtCrystal.position.y = 2.65;
    rtGroup.add(rtCrystal);

    const rtRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.38, 0.06, 10, 36),
      new THREE.MeshStandardMaterial({ color: 0x0e6ba8 })
    );
    rtRing.position.y = 2.65;
    rtRing.rotation.x = Math.PI / 3;
    rtGroup.add(rtRing);

    const rtLabel = createFloatingLabel('Meja Bundar Lintas Era', 'Diskusi 2–4 Tokoh 3D', '#F7C948');
    rtLabel.position.set(0, 4.9, 0);
    rtGroup.add(rtLabel);
    scene.add(rtGroup);

    // === 3. MONUMEN WORLD QUEST (UTARA: 0, -25) ===
    const wqGroup = new THREE.Group();
    wqGroup.position.set(0, 0, -25);
    const wqBase = new THREE.Mesh(
      new THREE.CylinderGeometry(3.8, 4.3, 0.75, 24),
      new THREE.MeshStandardMaterial({ color: 0x0f242d, roughness: 0.5 })
    );
    wqBase.position.y = 0.37;
    const wqTower = new THREE.Mesh(
      new THREE.CylinderGeometry(1.15, 2.0, 5.5, 12),
      new THREE.MeshStandardMaterial({ color: 0x0e6ba8, roughness: 0.4 })
    );
    wqTower.position.y = 3.1;
    wqTower.castShadow = true;
    const wqHoloRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.45, 0.13, 12, 42),
      new THREE.MeshStandardMaterial({
        color: 0x59b8f7,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.45
      })
    );
    wqHoloRing.position.y = 4.8;
    wqHoloRing.rotation.x = Math.PI / 2.5;
    const wqLabel = createFloatingLabel('Monumen World Quest', 'Kolaborasi Proyek STEAM', '#0E6BA8');
    wqLabel.position.set(0, 7.5, 0);
    wqGroup.add(wqBase, wqTower, wqHoloRing, wqLabel);
    scene.add(wqGroup);

    // === 4. POHON SEJARAH 3D (SELATAN: 0, 25) ===
    const ttGroup = new THREE.Group();
    ttGroup.position.set(0, 0, 25);
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 1.2, 4.4, 12),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 })
    );
    trunk.position.y = 2.2;
    trunk.castShadow = true;
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0x3cc9b8, roughness: 0.6 });
    const c1 = new THREE.Mesh(new THREE.DodecahedronGeometry(2.9, 1), canopyMat);
    c1.position.set(0, 5.4, 0);
    c1.castShadow = true;
    const c2 = new THREE.Mesh(new THREE.DodecahedronGeometry(2.0, 1), canopyMat);
    c2.position.set(-1.8, 4.5, 0.8);
    const c3 = new THREE.Mesh(new THREE.DodecahedronGeometry(2.0, 1), canopyMat);
    c3.position.set(1.8, 4.6, -0.6);

    const orbMat = new THREE.MeshStandardMaterial({
      color: 0xf7c948,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.45
    });
    const eraOrbs = [
      [-1.5, 5.3, 1.7],
      [1.7, 5.6, 1.3],
      [0, 7.0, 1.5],
      [-0.8, 4.0, -1.7]
    ].map(([ox, oy, oz]) => {
      const o = new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 14), orbMat);
      o.position.set(ox, oy, oz);
      ttGroup.add(o);
      return o;
    });

    const ttLabel = createFloatingLabel('Pohon Sejarah', 'Evolusi Tech Tree Kolektif', '#3CC9B8');
    ttLabel.position.set(0, 9.0, 0);
    ttGroup.add(trunk, c1, c2, c3, ttLabel);
    scene.add(ttGroup);

    // === 5. PAVILIUN 3D DINAMIS UNTUK SEMUA BIDANG RISET (OTOMATIS NAIK LANTAI SESUAI JUMLAH TOKOH!) ===
    const roofProps = [];
    const windowMat = new THREE.MeshStandardMaterial({
      color: 0xfef9c3,
      emissive: 0xf7c948,
      emissiveIntensity: 0.3
    });

    activeFields.forEach((f) => {
      const pos = districtCoords[f.id];
      if (!pos) return;
      const mentorCount = worldEntities.fieldCounts[f.id] || 0;
      const tiers = mentorCount >= 3 ? 3 : mentorCount >= 2 ? 2 : 1;

      const pav = new THREE.Group();
      pav.position.set(pos.x, 0, pos.z);
      pav.rotation.y = Math.atan2(-pos.x, -pos.z);

      const baseScale = tiers >= 2 ? 1.14 : 1;
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(4.6 * baseScale, 4.9 * baseScale, 0.42, 8),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75 })
      );
      base.position.y = 0.21;
      base.receiveShadow = true;

      const bodyMat = new THREE.MeshStandardMaterial({ color: f.bgColor, roughness: 0.55 });
      const darkRoofMat = new THREE.MeshStandardMaterial({ color: 0x0f242d, roughness: 0.5 });

      const body = new THREE.Mesh(new THREE.BoxGeometry(5.4, 3.6, 4.4), bodyMat);
      body.position.set(0, 2.1, -0.4);
      body.castShadow = true;
      body.receiveShadow = true;

      const roof = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.48, 5.0), darkRoofMat);
      roof.position.set(0, 4.0, -0.4);
      roof.castShadow = true;

      const door = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 2.3, 0.16),
        new THREE.MeshStandardMaterial({ color: 0xeef8fa, roughness: 0.3 })
      );
      door.position.set(0, 1.45, 1.82);

      let topY = 4.25;

      // Lantai 2 otomatis jika >= 2 tokoh di bidang ini
      if (tiers >= 2) {
        const floor2 = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.2, 3.4), bodyMat);
        floor2.position.set(0, 5.3, -0.4);
        floor2.castShadow = true;
        const win2 = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.8, 0.14), windowMat);
        win2.position.set(0, 5.4, 1.32);
        const roof2 = new THREE.Mesh(new THREE.BoxGeometry(4.7, 0.4, 3.9), darkRoofMat);
        roof2.position.set(0, 6.55, -0.4);
        pav.add(floor2, win2, roof2);
        topY = 6.8;
      }

      // Kubah / Lantai 3 otomatis jika >= 3 tokoh di bidang ini
      if (tiers >= 3) {
        const dome = new THREE.Mesh(
          new THREE.SphereGeometry(1.75, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55),
          new THREE.MeshStandardMaterial({ color: 0xf7c948, roughness: 0.35, metalness: 0.25 })
        );
        dome.position.set(0, 6.75, -0.4);
        pav.add(dome);
        topY = 8.4;
      }

      const roofEmblem = new THREE.Mesh(
        f.iconName === 'atom'
          ? new THREE.TorusKnotGeometry(0.74, 0.17, 42, 8)
          : f.iconName === 'rocket'
            ? new THREE.ConeGeometry(0.68, 2.0, 12)
            : new THREE.IcosahedronGeometry(0.95, 0),
        new THREE.MeshStandardMaterial({
          color: 0xf7c948,
          emissive: 0xf59e0b,
          emissiveIntensity: 0.25,
          roughness: 0.3
        })
      );
      roofEmblem.position.set(0, topY + 1.3, -0.4);
      roofEmblem.userData.baseY = topY + 1.3;
      roofProps.push(roofEmblem);

      const pLabel = createFloatingLabel(
        `Lab ${f.label}`,
        mentorCount > 0 ? `${mentorCount} Tokoh · Lv.${tiers}` : f.description.slice(0, 26),
        f.bgColor
      );
      pLabel.position.set(0, topY + 3.1, -0.4);

      pav.add(base, body, roof, door, roofEmblem, pLabel);
      scene.add(pav);
    });

    // === 6. NPC 3D SEMUA TOKOH DUNIA DARI DATABASE ===
    const npcRigs = worldEntities.npcs.map((entity) => {
      const preset = resolveCharacterPreset(entity.mentor);
      const rig = buildCharacterRig(preset, false, true);
      rig.container.scale.setScalar(0.92);
      rig.container.position.set(entity.x, 1.68, entity.z);
      rig.container.rotation.y = entity.facing;

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(1.2, 1.48, 28),
        new THREE.MeshBasicMaterial({
          color: entity.color,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8
        })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(entity.x, 0.06, entity.z);
      scene.add(ring);

      const nameTag = createFloatingLabel(
        entity.label,
        getFieldMeta(entity.mentor.field).label,
        entity.color
      );
      nameTag.position.set(entity.x, 3.65, entity.z);
      scene.add(nameTag);

      scene.add(rig.container);
      return { entity, rig, ring };
    });

    // === 7. POHON, BUNGA, AWAN & PARTIKEL CAHAYA ===
    const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.85 });
    const pineMat1 = new THREE.MeshStandardMaterial({ color: 0x66d7c5, roughness: 0.75 });
    const pineMat2 = new THREE.MeshStandardMaterial({ color: 0x3cc9b8, roughness: 0.75 });

    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2 + (i % 3) * 0.06;
      const r = worldRadius - 11 + (i % 4) * 2.2;
      const tx = Math.cos(a) * r;
      const tz = Math.sin(a) * r;

      const tree = new THREE.Group();
      tree.position.set(tx, 0, tz);
      const tTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.36, 1.5, 8), treeTrunkMat);
      tTrunk.position.y = 0.75;
      const cone1 = new THREE.Mesh(
        new THREE.ConeGeometry(1.4, 2.7, 8),
        i % 2 === 0 ? pineMat1 : pineMat2
      );
      cone1.position.y = 2.4;
      cone1.castShadow = true;
      const cone2 = new THREE.Mesh(
        new THREE.ConeGeometry(0.95, 2.0, 8),
        i % 2 === 0 ? pineMat2 : pineMat1
      );
      cone2.position.y = 3.7;
      tree.add(tTrunk, cone1, cone2);
      scene.add(tree);
    }

    // Partikel kunang-kunang emas melayang di seluruh kota
    const particleCount = 65;
    const pGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pPositions[i * 3] = (Math.random() - 0.5) * 72;
      pPositions[i * 3 + 1] = 1.5 + Math.random() * 9;
      pPositions[i * 3 + 2] = (Math.random() - 0.5) * 72;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    const particles = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({ color: 0xf7c948, size: 0.28, transparent: true, opacity: 0.85 })
    );
    scene.add(particles);

    const clouds = [];
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
    for (let i = 0; i < 10; i++) {
      const cloud = new THREE.Group();
      const s1 = new THREE.Mesh(new THREE.SphereGeometry(2.4, 12, 12), cloudMat);
      const s2 = new THREE.Mesh(new THREE.SphereGeometry(1.7, 12, 12), cloudMat);
      s2.position.set(2.2, -0.3, 0.2);
      const s3 = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 12), cloudMat);
      s3.position.set(-2.0, -0.4, -0.2);
      cloud.add(s1, s2, s3);
      cloud.position.set((i - 5) * 14, 21 + (i % 3) * 3.5, -42 + (i % 4) * 24);
      scene.add(cloud);
      clouds.push(cloud);
    }

    // Penanda tujuan klik-untuk-berjalan (Click-to-Walk Target Marker)
    const targetMarker = new THREE.Mesh(
      new THREE.RingGeometry(0.45, 0.72, 24),
      new THREE.MeshBasicMaterial({
        color: 0xf7c948,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
      })
    );
    targetMarker.rotation.x = -Math.PI / 2;
    targetMarker.position.y = 0.09;
    targetMarker.visible = false;
    scene.add(targetMarker);

    // === 8. AVATAR PLAYER YANG DAPAT BERJALAN ===
    const playerAccent = getFieldMeta(user?.specialty_field).bgColor;
    const player = buildPlayerAvatar(playerAccent);
    const saved = playerPosRef?.current || { x: 0, z: 9, yaw: Math.PI };
    player.root.position.set(saved.x, 0, saved.z);
    player.root.rotation.y = saved.yaw;
    scene.add(player.root);

    let camYaw = 0;
    let camPitch = 0.38;
    let velocityY = 0;
    let isGrounded = true;
    let walkPhase = 0;

    // Input Keyboard + Hotkeys Game (1-5)
    const onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const code = e.code;
      keysRef.current[code] = true;

      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
        walkTargetRef.current = null; // Manual movement cancels auto-walk
      }
      if (code === 'Space') {
        e.preventDefault();
        jumpQueuedRef.current = true;
      }
      if (code === 'KeyE' || code === 'Enter') {
        if (nearestRef.current) {
          e.preventDefault();
          triggerInteraction(nearestRef.current);
        }
      }
      if (code === 'Digit1') callbacksRef.current.onOpenDashboard?.();
      if (code === 'Digit2') callbacksRef.current.onOpenRoundtable?.();
      if (code === 'Digit3') callbacksRef.current.onOpenQuests?.();
      if (code === 'Digit4') callbacksRef.current.onOpenTechTree?.();
      if (code === 'Digit5') callbacksRef.current.onOpenProfile?.();
    };
    const onKeyUp = (e) => {
      keysRef.current[e.code] = false;
    };

    // Drag Mouse untuk Putar Kamera + Klik Tanah untuk Jalan ke Titik Tersebut (Raycaster!)
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    let draggingCam = false;
    let ptrDownX = 0;
    let ptrDownY = 0;
    let lastPtrX = 0;
    let lastPtrY = 0;
    let movedPixels = 0;

    const dom = renderer.domElement;
    dom.style.cursor = 'grab';

    const onPtrDown = (e) => {
      draggingCam = true;
      ptrDownX = e.clientX;
      ptrDownY = e.clientY;
      lastPtrX = e.clientX;
      lastPtrY = e.clientY;
      movedPixels = 0;
    };
    const onPtrMove = (e) => {
      if (!draggingCam) return;
      const dx = e.clientX - lastPtrX;
      const dy = e.clientY - lastPtrY;
      movedPixels += Math.hypot(dx, dy);
      lastPtrX = e.clientX;
      lastPtrY = e.clientY;
      camYaw -= dx * 0.007;
      camPitch = Math.max(0.18, Math.min(0.92, camPitch + dy * 0.0045));
    };
    const onPtrUp = (e) => {
      if (!draggingCam) return;
      draggingCam = false;
      // Jika klik singkat (bukan drag kamera) -> jalan otomatis ke titik tanah yang diklik!
      if (movedPixels < 6) {
        const rect = dom.getBoundingClientRect();
        pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointerNdc, camera);
        const hit = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(groundPlane, hit)) {
          const r = Math.hypot(hit.x, hit.z);
          if (r < worldRadius - 1) {
            // Cek apakah klik dekat salah satu NPC/Landmark
            let clickedEntity = null;
            for (const ent of worldEntities.all) {
              if (Math.hypot(hit.x - ent.x, hit.z - ent.z) < 3.6) {
                clickedEntity = ent;
                break;
              }
            }
            walkTargetRef.current = { x: hit.x, z: hit.z, entity: clickedEntity };
          }
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    dom.addEventListener('pointerdown', onPtrDown);
    window.addEventListener('pointermove', onPtrMove);
    window.addEventListener('pointerup', onPtrUp);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Loop 60FPS
    const clock = new THREE.Clock();
    let frameId = 0;
    let hudTimer = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      const keys = keysRef.current;

      if (keys.KeyQ) camYaw += 1.9 * dt;
      if (keys.KeyR) camYaw -= 1.9 * dt;

      let moveForward = 0;
      let moveRight = 0;
      if (keys.KeyW || keys.ArrowUp) moveForward += 1;
      if (keys.KeyS || keys.ArrowDown) moveForward -= 1;
      if (keys.KeyD || keys.ArrowRight) moveRight += 1;
      if (keys.KeyA || keys.ArrowLeft) moveRight -= 1;

      if (Math.hypot(joyVecRef.current.x, joyVecRef.current.z) > 0.08) {
        walkTargetRef.current = null;
        moveRight += joyVecRef.current.x;
        moveForward -= joyVecRef.current.z;
      }

      const isSprinting = Boolean(keys.ShiftLeft || keys.ShiftRight);
      const speed = (isSprinting ? 15.0 : 10.0) * dt;
      let vx = 0;
      let vz = 0;
      let isMoving = false;

      const mag = Math.hypot(moveForward, moveRight);
      if (mag > 0.08) {
        const nf = moveForward / Math.max(1, mag);
        const nr = moveRight / Math.max(1, mag);
        const forwardX = -Math.sin(camYaw);
        const forwardZ = -Math.cos(camYaw);
        const rightX = Math.cos(camYaw);
        const rightZ = -Math.sin(camYaw);
        vx = forwardX * nf + rightX * nr;
        vz = forwardZ * nf + rightZ * nr;
        isMoving = true;
      } else if (walkTargetRef.current) {
        const tgt = walkTargetRef.current;
        const dx = tgt.x - player.root.position.x;
        const dz = tgt.z - player.root.position.z;
        const distToTgt = Math.hypot(dx, dz);
        if (distToTgt > 0.9) {
          vx = dx / distToTgt;
          vz = dz / distToTgt;
          isMoving = true;
          targetMarker.visible = true;
          targetMarker.position.x = tgt.x;
          targetMarker.position.z = tgt.z;
          targetMarker.scale.setScalar(1 + Math.sin(t * 7) * 0.14);
        } else {
          const autoEnt = tgt.entity;
          walkTargetRef.current = null;
          targetMarker.visible = false;
          if (autoEnt) triggerInteraction(autoEnt);
        }
      } else {
        targetMarker.visible = false;
      }

      if (isMoving) {
        let nextX = player.root.position.x + vx * speed;
        let nextZ = player.root.position.z + vz * speed;

        const r = Math.hypot(nextX, nextZ);
        if (r > worldRadius - 1.5) {
          nextX = (nextX / r) * (worldRadius - 1.5);
          nextZ = (nextZ / r) * (worldRadius - 1.5);
        }
        const rCenter = Math.hypot(nextX, nextZ);
        if (rCenter < 2.7 && rCenter > 0.01) {
          nextX = (nextX / rCenter) * 2.7;
          nextZ = (nextZ / rCenter) * 2.7;
        }

        player.root.position.x = nextX;
        player.root.position.z = nextZ;

        const targetYaw = Math.atan2(vx, vz);
        let diff = targetYaw - player.root.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        player.root.rotation.y += diff * Math.min(1, dt * 12);

        walkPhase += dt * (isSprinting ? 15 : 10.8);
        const swing = Math.sin(walkPhase) * 0.74;
        player.leftLegPivot.rotation.x = swing;
        player.rightLegPivot.rotation.x = -swing;
        player.leftArmPivot.rotation.x = -swing * 0.72;
        player.rightArmPivot.rotation.x = swing * 0.72;
        player.body.position.y = Math.abs(Math.cos(walkPhase)) * 0.09;
      } else {
        player.leftLegPivot.rotation.x *= 0.82;
        player.rightLegPivot.rotation.x *= 0.82;
        player.leftArmPivot.rotation.x *= 0.82;
        player.rightArmPivot.rotation.x *= 0.82;
        player.body.position.y *= 0.85;
      }

      if (jumpQueuedRef.current && isGrounded) {
        velocityY = 10.8;
        isGrounded = false;
      }
      jumpQueuedRef.current = false;

      if (!isGrounded) {
        velocityY -= 28 * dt;
        player.root.position.y += velocityY * dt;
        if (player.root.position.y <= 0) {
          player.root.position.y = 0;
          velocityY = 0;
          isGrounded = true;
        }
      }

      if (playerPosRef?.current) {
        playerPosRef.current.x = player.root.position.x;
        playerPosRef.current.z = player.root.position.z;
        playerPosRef.current.yaw = player.root.rotation.y;
      }

      // Third-Person Follow Camera
      const camDist = 11.8;
      const desiredCamX = player.root.position.x + Math.sin(camYaw) * Math.cos(camPitch) * camDist;
      const desiredCamY = player.root.position.y + 2.5 + Math.sin(camPitch) * camDist;
      const desiredCamZ = player.root.position.z + Math.cos(camYaw) * Math.cos(camPitch) * camDist;
      camera.position.lerp(new THREE.Vector3(desiredCamX, desiredCamY, desiredCamZ), Math.min(1, dt * 8));
      camera.lookAt(player.root.position.x, player.root.position.y + 1.65, player.root.position.z);

      // Animasi Dunia Hidup
      rtCrystal.rotation.y += dt * 1.4;
      rtCrystal.position.y = 2.65 + Math.sin(t * 2.2) * 0.16;
      rtRing.rotation.z += dt * 0.9;
      wqHoloRing.rotation.z -= dt * 1.1;
      particles.rotation.y += dt * 0.04;
      roofProps.forEach((rp, idx) => {
        rp.rotation.y += dt * (0.9 + idx * 0.1);
        rp.position.y = (rp.userData.baseY || 5.6) + Math.sin(t * 2 + idx) * 0.18;
      });
      eraOrbs.forEach((orb, idx) => {
        orb.scale.setScalar(1 + Math.sin(t * 2.8 + idx) * 0.12);
      });
      clouds.forEach((c) => {
        c.position.x += dt * 0.55;
        if (c.position.x > 70) c.position.x = -70;
      });

      // NPC menoleh ke arah pemain ketika pemain mendekat!
      const px = player.root.position.x;
      const pz = player.root.position.z;
      npcRigs.forEach(({ entity, rig }, idx) => {
        rig.character.position.y = Math.sin(t * 2 + idx) * 0.04;
        const dist = Math.hypot(px - entity.x, pz - entity.z);
        if (dist < 9) {
          const lookYaw = Math.atan2(px - entity.x, pz - entity.z);
          let diff = lookYaw - rig.container.rotation.y;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          rig.container.rotation.y += diff * Math.min(1, dt * 5);
        } else {
          rig.headGroup.rotation.y = Math.sin(t * 0.9 + idx) * 0.18;
        }
      });

      hudTimer += dt;
      if (hudTimer > 0.08) {
        hudTimer = 0;
        let closest = null;
        let closestDist = Infinity;
        for (const ent of worldEntities.all) {
          const dist = Math.hypot(px - ent.x, pz - ent.z);
          if (dist < ent.radius && dist < closestDist) {
            closest = ent;
            closestDist = dist;
          }
        }
        if (nearestRef.current?.id !== closest?.id) {
          nearestRef.current = closest;
          setNearby(closest);
        }
        setRadarPlayer({ x: px, z: pz, yaw: player.root.rotation.y });
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      dom.removeEventListener('pointerdown', onPtrDown);
      window.removeEventListener('pointermove', onPtrMove);
      window.removeEventListener('pointerup', onPtrUp);
      window.removeEventListener('resize', onResize);
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
      renderer.dispose();
    };
  }, [worldEntities, user?.specialty_field, activeFields, districtCoords, worldRadius]);

  // Virtual Joystick (Touch & Mouse)
  const joyBaseRef = useRef(null);
  const [joyKnob, setJoyKnob] = useState({ x: 0, y: 0 });
  const joyActiveRef = useRef(false);

  function updateJoystick(clientX, clientY) {
    const rect = joyBaseRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width / 2 - 14;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    setJoyKnob({ x: dx, y: dy });
    joyVecRef.current = { x: dx / maxR, z: dy / maxR };
  }

  function resetJoystick() {
    joyActiveRef.current = false;
    setJoyKnob({ x: 0, y: 0 });
    joyVecRef.current = { x: 0, z: 0 };
  }

  const toRadarPct = (val) => `${Math.max(6, Math.min(94, 50 + (val / worldRadius) * 44))}%`;

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#D5EFF8] select-none">
      {/* FULLSCREEN 3D GAME VIEWPORT */}
      {webglFailed ? (
        <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-3">
          <p className="text-base font-extrabold">WebGL tidak tersedia di browser ini.</p>
          <button type="button" onClick={onOpenDashboard} className="neo-btn-dark text-xs">
            Masuk Mode Menu Ringkas
          </button>
        </div>
      ) : (
        <div ref={mountRef} className="w-full h-full touch-none" />
      )}

      {/* === HUD KIRI ATAS: Profil Game Player + Tombol Admin === */}
      <div className="fixed top-3 left-3 md:top-4 md:left-4 z-20 flex flex-col gap-2 max-w-[65vw]">
        <div className="bg-white/95 border-[2.5px] border-[#0F242D] rounded-2xl px-3 py-2 shadow-neo-sm flex items-center gap-2.5">
          <LegaciumLogo size="sm" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-xs md:text-sm font-extrabold truncate">{user?.name}</p>
              <span className="px-1.5 py-0.5 rounded-md bg-[#F7C948] border border-[#0F242D] text-[10px] font-extrabold shrink-0">
                Lv.{user?.city_level}
              </span>
            </div>
            <p className="text-[10px] font-bold text-slate-600 truncate">
              {user?.city_name} · {user?.research_points} RP
            </p>
          </div>
          {user?.role === 'admin' && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="neo-btn bg-[#F7C948] px-2.5 py-1.5 text-[11px] flex items-center gap-1 shrink-0"
            >
              <ShieldCheck size={14} />
              <span className="hidden sm:inline">Admin</span>
            </button>
          )}
        </div>

        {/* Kotak Panduan Kontrol (bisa ditutup/buka) */}
        {showHelp ? (
          <div className="hidden sm:block bg-white/92 border-[2px] border-[#0F242D] rounded-2xl px-3 py-2 shadow-neo-sm text-[11px] font-bold max-w-[300px]">
            <div className="flex items-center justify-between mb-1">
              <span className="font-extrabold text-[#0E6BA8]">Kontrol Open World</span>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="text-slate-500 hover:text-[#0F242D]"
                aria-label="Tutup panduan"
              >
                <X size={13} />
              </button>
            </div>
            <p>
              <strong>WASD / Panah / Klik Tanah:</strong> Berjalan
            </p>
            <p>
              <strong>Shift:</strong> Lari · <strong>Space:</strong> Lompat ·{' '}
              <strong>E:</strong> Bicara / Buka
            </p>
            <p>
              <strong>Geser Mouse / Q-R:</strong> Putar Kamera 360°
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowHelp(true)}
            className="hidden sm:inline-flex self-start items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 border-[2px] border-[#0F242D] text-[11px] font-extrabold shadow-neo-sm"
          >
            <HelpCircle size={13} /> Kontrol
          </button>
        )}
      </div>

      {/* === HUD KANAN ATAS: Live Radar Mini-Map + Quest Tracker === */}
      <div className="fixed top-3 right-3 md:top-4 md:right-4 z-20 flex flex-col items-end gap-2">
        <div className="w-[114px] h-[114px] md:w-[144px] md:h-[144px] rounded-2xl bg-[#EEF8FA]/95 border-[2.5px] border-[#0F242D] shadow-neo-sm relative overflow-hidden">
          <div className="absolute inset-2 rounded-full border border-dashed border-[#0F242D]/30" />
          <span className="absolute top-1 left-2 text-[9px] font-extrabold text-slate-500">
            PETA KOTA
          </span>

          {worldEntities.all.map((ent) => (
            <button
              key={ent.id}
              type="button"
              title={`Jalan ke ${ent.label}`}
              onClick={() => walkToLocation(ent.x, ent.z, ent)}
              style={{
                left: toRadarPct(ent.x),
                top: toRadarPct(ent.z),
                backgroundColor: ent.color
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 border border-[#0F242D] transition hover:scale-125 ${
                ent.type === 'mentor' ? 'w-2.5 h-2.5 rounded-full' : 'w-3 h-3 rounded-sm'
              }`}
            />
          ))}

          <div
            style={{
              left: toRadarPct(radarPlayer.x),
              top: toRadarPct(radarPlayer.z)
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#E55827] border-[2px] border-white ring-2 ring-[#0F242D] pointer-events-none"
          />
        </div>

        {/* RPG Active World Quest Tracker */}
        {activeQuest && (
          <button
            type="button"
            onClick={onOpenQuests}
            className="hidden md:block text-left bg-white/95 border-[2px] border-[#0F242D] rounded-2xl px-3 py-2 shadow-neo-sm max-w-[210px] hover:bg-[#A8D8F5]/60 transition"
          >
            <p className="text-[9px] font-extrabold uppercase tracking-wider text-[#0E6BA8]">
              World Quest Aktif
            </p>
            <p className="text-xs font-extrabold truncate mt-0.5">{activeQuest.title}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(activeQuest.required_fields || {}).map(([fk, tv]) => (
                <span
                  key={fk}
                  className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-[#EEF8FA] border border-[#0F242D]"
                >
                  {getFieldMeta(fk).shortLabel}{' '}
                  {Math.min(100, Math.round(((activeQuest.progress?.[fk] || 0) / tv) * 100))}%
                </span>
              ))}
            </div>
          </button>
        )}
      </div>

      {/* === HUD TENGAH BAWAH: Prompt Interaksi [E] + RPG Hotbar === */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2.5 w-full max-w-[540px] px-3 pointer-events-none">
        {nearby && (
          <button
            type="button"
            onClick={() => triggerInteraction(nearby)}
            className="pointer-events-auto w-full max-w-[360px] neo-card bg-[#F7C948] px-4 py-2.5 flex items-center justify-between gap-3 text-left animate-bounce hover:animate-none"
            style={{ animationDuration: '1.8s' }}
          >
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#0F242D]/75">
                Dekat {nearby.type === 'mentor' ? 'Tokoh 3D' : 'Landmark Kota'}
              </p>
              <p className="text-sm font-extrabold text-[#0F242D] truncate">{nearby.label}</p>
              <p className="text-[11px] font-bold text-[#183846] truncate">{nearby.sublabel}</p>
            </div>
            <span className="shrink-0 px-3 py-1.5 rounded-xl bg-[#0F242D] text-white text-xs font-extrabold">
              [E] Buka
            </span>
          </button>
        )}

        {/* Game Hotbar (Tombol 1–5) */}
        <div className="pointer-events-auto bg-white/95 border-[2.5px] border-[#0F242D] rounded-full shadow-neo-lg px-2 py-1.5 flex items-center gap-1">
          {[
            { key: '1', label: 'Menu', icon: LayoutGrid, action: onOpenDashboard },
            { key: '2', label: 'Meja Bundar', icon: Users, action: onOpenRoundtable, highlight: true },
            { key: '3', label: 'Quest', icon: Compass, action: onOpenQuests },
            { key: '4', label: 'Sejarah', icon: GitBranch, action: onOpenTechTree },
            { key: '5', label: 'Profil', icon: UserIcon, action: onOpenProfile }
          ].map((btn) => {
            const Icon = btn.icon;
            return (
              <button
                key={btn.key}
                type="button"
                onClick={btn.action}
                className={`px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] font-extrabold flex items-center gap-1.5 transition border-[1.8px] ${
                  btn.highlight
                    ? 'bg-[#F7C948] border-[#0F242D]'
                    : 'bg-transparent border-transparent hover:bg-[#EEF8FA]'
                }`}
              >
                <Icon size={15} strokeWidth={2.4} />
                <span className="hidden sm:inline">{btn.label}</span>
                <span className="hidden md:inline text-[9px] opacity-60">[{btn.key}]</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* === HUD KIRI BAWAH: Virtual Joystick (Mobile & Sentuh) === */}
      <div className="fixed bottom-20 left-4 md:bottom-6 md:left-6 z-20">
        <div
          ref={joyBaseRef}
          onPointerDown={(e) => {
            e.stopPropagation();
            joyActiveRef.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            updateJoystick(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => {
            if (!joyActiveRef.current) return;
            e.stopPropagation();
            updateJoystick(e.clientX, e.clientY);
          }}
          onPointerUp={(e) => {
            e.stopPropagation();
            resetJoystick();
          }}
          onPointerCancel={resetJoystick}
          className="w-24 h-24 rounded-full bg-white/75 border-[2.5px] border-[#0F242D] shadow-neo-sm relative flex items-center justify-center touch-none cursor-pointer"
          title="Geser untuk berjalan"
        >
          <div
            style={{ transform: `translate(${joyKnob.x}px, ${joyKnob.y}px)` }}
            className="w-10 h-10 rounded-full bg-[#F7C948] border-[2.5px] border-[#0F242D] shadow-neo-sm pointer-events-none"
          />
        </div>
      </div>

      {/* === HUD KANAN BAWAH: Tombol Lompat & Pintasan Cepat NPC === */}
      <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-20 flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={() => {
            jumpQueuedRef.current = true;
          }}
          className="w-12 h-12 rounded-full bg-white/95 border-[2.5px] border-[#0F242D] shadow-neo-sm flex items-center justify-center active:translate-y-[2px]"
          title="Lompat (Space)"
        >
          <ArrowUp size={20} strokeWidth={2.8} />
        </button>

        {/* Pintasan cepat jalan ke tokoh terdekat di desktop */}
        <div className="hidden lg:flex items-center gap-1.5 bg-white/92 border-[2px] border-[#0F242D] rounded-2xl p-1.5 shadow-neo-sm max-w-[300px] overflow-x-auto">
          {worldEntities.npcs.slice(0, 4).map((npc) => (
            <button
              key={npc.id}
              type="button"
              onClick={() => walkToLocation(npc.x, npc.z, npc)}
              className="px-2 py-1 rounded-xl bg-[#EEF8FA] hover:bg-[#F7C948] border border-[#0F242D] text-[10px] font-extrabold whitespace-nowrap flex items-center gap-1 transition"
            >
              <Sparkles size={10} />
              <span>{npc.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
