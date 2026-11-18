import * as THREE from 'three';

export function resolveCharacterPreset(mentor) {
  const name = (mentor?.name || '').toLowerCase();
  const field = mentor?.field || 'fisika';

  if (name.includes('einstein')) {
    return {
      skin: 0xf4cfb4,
      coat: 0x4b5563,
      innerShirt: 0xf8fafc,
      hairColor: 0xe5e7eb,
      hairStyle: 'einstein',
      beard: 'mustache',
      glasses: false,
      hat: 'none',
      prop: 'atom',
      accent: 0x0e6ba8
    };
  }
  if (name.includes('curie')) {
    return {
      skin: 0xf6d5be,
      coat: 0xf1f5f9,
      innerShirt: 0x1e293b,
      hairColor: 0x4a3428,
      hairStyle: 'bun',
      beard: 'none',
      glasses: false,
      hat: 'none',
      prop: 'molecule',
      accent: 0x3cc9b8
    };
  }
  if (name.includes('franklin')) {
    return {
      skin: 0xf3cfb6,
      coat: 0xf8fafc,
      innerShirt: 0x0e6ba8,
      hairColor: 0x2b1e19,
      hairStyle: 'bob',
      beard: 'none',
      glasses: false,
      hat: 'none',
      prop: 'dna',
      accent: 0x60a5fa
    };
  }
  if (name.includes('vinci') || name.includes('leonardo')) {
    return {
      skin: 0xefc6a6,
      coat: 0x9a3412,
      innerShirt: 0xfef3c7,
      hairColor: 0xd1d5db,
      hairStyle: 'long',
      beard: 'full',
      glasses: false,
      hat: 'beret',
      prop: 'vitruvian',
      accent: 0xe55827
    };
  }
  if (
    name.includes('khawarizmi') ||
    name.includes('ibnu') ||
    name.includes('sina') ||
    name.includes('jabir')
  ) {
    return {
      skin: 0xdfae86,
      coat: name.includes('sina') ? 0x065f46 : 0x1e3a5f,
      innerShirt: 0xf7c948,
      hairColor: 0x1f2937,
      hairStyle: 'short',
      beard: 'full',
      glasses: false,
      hat: 'turban',
      prop: name.includes('sina') ? 'dna' : 'polyhedron',
      accent: 0xf7c948
    };
  }
  if (name.includes('habibie')) {
    return {
      skin: 0xdfa980,
      coat: 0x1f2937,
      innerShirt: 0xffffff,
      hairColor: 0x1f2937,
      hairStyle: 'short',
      beard: 'none',
      glasses: true,
      hat: 'peci',
      prop: 'rocket',
      accent: 0x66d7c5
    };
  }
  if (name.includes('ki hajar') || name.includes('dewantara')) {
    return {
      skin: 0xd9a077,
      coat: 0x78350f,
      innerShirt: 0xfef3c7,
      hairColor: 0x1f2937,
      hairStyle: 'short',
      beard: 'mustache',
      glasses: true,
      hat: 'blangkon',
      prop: 'vitruvian',
      accent: 0xf7c948
    };
  }
  if (name.includes('tesla')) {
    return {
      skin: 0xf3cfb6,
      coat: 0x1e293b,
      innerShirt: 0xffffff,
      hairColor: 0x1f2937,
      hairStyle: 'short',
      beard: 'mustache',
      glasses: false,
      hat: 'none',
      prop: 'atom',
      accent: 0x38bdf8
    };
  }
  if (name.includes('lovelace') || name.includes('ada')) {
    return {
      skin: 0xf6d5be,
      coat: 0x312e81,
      innerShirt: 0xfef3c7,
      hairColor: 0x3b2314,
      hairStyle: 'bun',
      beard: 'none',
      glasses: false,
      hat: 'none',
      prop: 'polyhedron',
      accent: 0xf7c948
    };
  }

  const fieldPresets = {
    fisika: { coat: 0x0e6ba8, prop: 'atom', glasses: true, hat: 'none', accent: 0x0e6ba8 },
    kimia: { coat: 0xf8fafc, prop: 'molecule', glasses: true, hat: 'none', accent: 0x3cc9b8 },
    biologi: { coat: 0xe0f2fe, prop: 'dna', glasses: false, hat: 'none', accent: 0x38bdf8 },
    arsitektur: { coat: 0x9a3412, prop: 'vitruvian', glasses: false, hat: 'beret', accent: 0xe55827 },
    matematika: { coat: 0x1e3a5f, prop: 'polyhedron', glasses: true, hat: 'none', accent: 0xf7c948 },
    dirgantara: { coat: 0x1f2937, prop: 'rocket', glasses: false, hat: 'none', accent: 0x66d7c5 }
  };
  const fp = fieldPresets[field] || fieldPresets.fisika;

  return {
    skin: 0xefc6a6,
    coat: fp.coat,
    innerShirt: 0xf8fafc,
    hairColor: 0x374151,
    hairStyle: 'short',
    beard: 'none',
    glasses: fp.glasses,
    hat: fp.hat,
    prop: fp.prop,
    accent: fp.accent
  };
}

export function buildCharacterRig(preset, includeFullOrbit = true, withLegs = false) {
  const container = new THREE.Group();

  const pedestalMat = new THREE.MeshStandardMaterial({
    color: preset.accent,
    roughness: 0.35,
    metalness: 0.15
  });
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.08, 0.15, 28), pedestalMat);
  pedestal.position.y = withLegs ? -1.85 : -1.26;
  container.add(pedestal);

  const auraRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.08, 0.03, 12, 42),
    new THREE.MeshBasicMaterial({ color: 0x0f242d, transparent: true, opacity: 0.72 })
  );
  auraRing.rotation.x = Math.PI / 2;
  auraRing.position.y = withLegs ? -1.76 : -1.18;
  container.add(auraRing);

  const character = new THREE.Group();
  container.add(character);

  const skinMat = new THREE.MeshStandardMaterial({ color: preset.skin, roughness: 0.65 });
  const coatMat = new THREE.MeshStandardMaterial({ color: preset.coat, roughness: 0.6 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: preset.innerShirt, roughness: 0.55 });
  const hairMat = new THREE.MeshStandardMaterial({ color: preset.hairColor, roughness: 0.75 });
  const inkMat = new THREE.MeshStandardMaterial({ color: 0x0f242d, roughness: 0.4 });

  if (withLegs) {
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
    const legGeo = new THREE.CapsuleGeometry(0.15, 0.42, 8, 12);
    const lLeg = new THREE.Mesh(legGeo, pantsMat);
    lLeg.position.set(-0.22, -1.42, 0);
    const rLeg = new THREE.Mesh(legGeo, pantsMat);
    rLeg.position.set(0.22, -1.42, 0);
    character.add(lLeg, rLeg);

    const armGeo = new THREE.CapsuleGeometry(0.12, 0.46, 8, 12);
    const lArm = new THREE.Mesh(armGeo, coatMat);
    lArm.position.set(-0.68, -0.68, 0);
    lArm.rotation.z = 0.15;
    const rArm = new THREE.Mesh(armGeo, coatMat);
    rArm.position.set(0.68, -0.68, 0);
    rArm.rotation.z = -0.15;
    character.add(lArm, rArm);
  }

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.75, 1.02, 24), coatMat);
  torso.position.y = -0.68;
  character.add(torso);

  const innerChest = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.52, 16), shirtMat);
  innerChest.rotation.x = Math.PI;
  innerChest.position.set(0, -0.45, 0.46);
  character.add(innerChest);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.28, 16), skinMat);
  neck.position.y = -0.06;
  character.add(neck);

  const headGroup = new THREE.Group();
  headGroup.position.y = 0.46;
  character.add(headGroup);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 24), skinMat);
  head.scale.set(0.95, 1.05, 0.96);
  headGroup.add(head);

  const earGeo = new THREE.SphereGeometry(0.095, 10, 10);
  const leftEar = new THREE.Mesh(earGeo, skinMat);
  leftEar.position.set(-0.46, -0.02, 0);
  const rightEar = leftEar.clone();
  rightEar.position.x = 0.46;
  headGroup.add(leftEar, rightEar);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.13, 10), skinMat);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, -0.03, 0.49);
  headGroup.add(nose);

  const eyeGeo = new THREE.SphereGeometry(0.06, 12, 12);
  const leftEye = new THREE.Mesh(eyeGeo, inkMat);
  leftEye.position.set(-0.16, 0.08, 0.43);
  const rightEye = new THREE.Mesh(eyeGeo, inkMat);
  rightEye.position.set(0.16, 0.08, 0.43);

  const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const glintGeo = new THREE.SphereGeometry(0.018, 8, 8);
  const lGlint = new THREE.Mesh(glintGeo, glintMat);
  lGlint.position.set(-0.14, 0.1, 0.48);
  const rGlint = new THREE.Mesh(glintGeo, glintMat);
  rGlint.position.set(0.18, 0.1, 0.48);
  headGroup.add(leftEye, rightEye, lGlint, rGlint);

  const browGeo = new THREE.BoxGeometry(0.15, 0.033, 0.04);
  const lBrow = new THREE.Mesh(browGeo, hairMat);
  lBrow.position.set(-0.16, 0.19, 0.43);
  const rBrow = new THREE.Mesh(browGeo, hairMat);
  rBrow.position.set(0.16, 0.19, 0.43);
  headGroup.add(lBrow, rBrow);

  const mouth = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.038, 0.11, 8, 12),
    new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.4 })
  );
  mouth.rotation.z = Math.PI / 2;
  mouth.position.set(0, -0.19, 0.44);
  mouth.scale.set(0.62, 1, 0.6);
  headGroup.add(mouth);

  if (preset.glasses) {
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      metalness: 0.5,
      roughness: 0.3
    });
    const lensGeo = new THREE.TorusGeometry(0.125, 0.019, 10, 20);
    const lLens = new THREE.Mesh(lensGeo, frameMat);
    lLens.position.set(-0.16, 0.08, 0.47);
    const rLens = new THREE.Mesh(lensGeo, frameMat);
    rLens.position.set(0.16, 0.08, 0.47);
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.02, 0.02), frameMat);
    bridge.position.set(0, 0.09, 0.47);
    headGroup.add(lLens, rLens, bridge);
  }

  if (preset.hairStyle === 'einstein') {
    [
      [-0.44, 0.22, -0.05, 0.23],
      [0.44, 0.22, -0.05, 0.23],
      [-0.36, 0.44, -0.08, 0.22],
      [0.36, 0.44, -0.08, 0.22],
      [0, 0.52, -0.1, 0.24],
      [-0.46, 0.03, -0.14, 0.2],
      [0.46, 0.03, -0.14, 0.2],
      [0, 0.24, -0.43, 0.34]
    ].forEach(([x, y, z, r]) => {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 12), hairMat);
      puff.position.set(x, y, z);
      headGroup.add(puff);
    });
  } else if (preset.hairStyle === 'bun') {
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.52, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.58),
      hairMat
    );
    cap.position.y = 0.04;
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.21, 14, 14), hairMat);
    bun.position.set(0, 0.44, -0.32);
    headGroup.add(cap, bun);
  } else if (preset.hairStyle === 'bob') {
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.53, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.62),
      hairMat
    );
    cap.position.y = 0.03;
    const lWave = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.32, 8, 12), hairMat);
    lWave.position.set(-0.44, -0.05, -0.06);
    const rWave = lWave.clone();
    rWave.position.x = 0.44;
    headGroup.add(cap, lWave, rWave);
  } else if (preset.hairStyle === 'long') {
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.52, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.55),
      hairMat
    );
    const lLock = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.56, 8, 12), hairMat);
    lLock.position.set(-0.44, -0.2, -0.08);
    const rLock = lLock.clone();
    rLock.position.x = 0.44;
    headGroup.add(cap, lLock, rLock);
  } else {
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.51, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.52),
      hairMat
    );
    cap.position.y = 0.04;
    headGroup.add(cap);
  }

  if (preset.beard === 'mustache') {
    const stache = new THREE.Mesh(new THREE.CapsuleGeometry(0.052, 0.21, 8, 12), hairMat);
    stache.rotation.z = Math.PI / 2;
    stache.position.set(0, -0.11, 0.47);
    headGroup.add(stache);
  } else if (preset.beard === 'full') {
    const beard = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.55, 16), hairMat);
    beard.rotation.x = Math.PI;
    beard.position.set(0, -0.43, 0.24);
    headGroup.add(beard);
  }

  if (preset.hat === 'peci') {
    const peci = new THREE.Mesh(
      new THREE.CylinderGeometry(0.43, 0.46, 0.32, 20),
      new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.85 })
    );
    peci.scale.set(0.95, 1, 1.08);
    peci.position.set(0, 0.54, 0);
    headGroup.add(peci);
  } else if (preset.hat === 'blangkon') {
    const batikMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.1, 10, 22), batikMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.36;
    const crown = new THREE.Mesh(new THREE.SphereGeometry(0.47, 16, 12), batikMat);
    crown.scale.set(1, 0.65, 1);
    crown.position.y = 0.4;
    const mondolan = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), batikMat);
    mondolan.position.set(0, 0.28, -0.46);
    headGroup.add(rim, crown, mondolan);
  } else if (preset.hat === 'turban') {
    const turbanMat = new THREE.MeshStandardMaterial({ color: 0xfef9c3, roughness: 0.7 });
    const goldBand = new THREE.MeshStandardMaterial({
      color: 0xf7c948,
      metalness: 0.35,
      roughness: 0.35
    });
    const wrap1 = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.15, 12, 24), turbanMat);
    wrap1.rotation.x = Math.PI / 2;
    wrap1.position.y = 0.44;
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.44, 16, 16), turbanMat);
    dome.position.y = 0.46;
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.085), goldBand);
    gem.position.set(0, 0.48, 0.52);
    headGroup.add(wrap1, dome, gem);
  } else if (preset.hat === 'beret') {
    const beret = new THREE.Mesh(
      new THREE.SphereGeometry(0.52, 18, 12),
      new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.7 })
    );
    beret.scale.set(1.14, 0.42, 1.1);
    beret.position.set(0.04, 0.5, -0.02);
    beret.rotation.z = -0.14;
    headGroup.add(beret);
  }

  const orbitGroup = new THREE.Group();
  orbitGroup.position.set(0, 0.15, 0);
  container.add(orbitGroup);

  if (includeFullOrbit) {
    const accentMat = new THREE.MeshStandardMaterial({
      color: preset.accent,
      roughness: 0.3,
      metalness: 0.25,
      emissive: preset.accent,
      emissiveIntensity: 0.18
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf7c948,
      roughness: 0.3,
      metalness: 0.4
    });

    if (preset.prop === 'atom') {
      for (let i = 0; i < 3; i++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.024, 10, 44), accentMat);
        ring.rotation.set(i * 1.05, i * 0.85, 0.4);
        orbitGroup.add(ring);
        const electron = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), goldMat);
        electron.position.set(Math.cos(i * 2) * 1.32, Math.sin(i * 2) * 0.65, 0.35);
        orbitGroup.add(electron);
      }
    } else if (preset.prop === 'molecule') {
      [
        [1.28, 0.42, 0.2],
        [-1.28, 0.22, -0.2],
        [1.05, -0.4, 0.45],
        [-1.05, -0.32, 0.5]
      ].forEach(([x, y, z], idx) => {
        const atom = new THREE.Mesh(
          new THREE.SphereGeometry(idx % 2 === 0 ? 0.14 : 0.1, 14, 14),
          idx % 2 === 0 ? accentMat : goldMat
        );
        atom.position.set(x, y, z);
        orbitGroup.add(atom);
      });
      const halo = new THREE.Mesh(new THREE.TorusGeometry(1.28, 0.02, 10, 44), accentMat);
      halo.rotation.x = Math.PI / 2.2;
      orbitGroup.add(halo);
    } else if (preset.prop === 'dna') {
      const dnaGroup = new THREE.Group();
      dnaGroup.position.set(1.25, 0.1, 0);
      for (let i = -4; i <= 4; i++) {
        const angle = i * 0.65;
        const y = i * 0.15;
        const b1 = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), accentMat);
        b1.position.set(Math.cos(angle) * 0.2, y, Math.sin(angle) * 0.2);
        const b2 = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), goldMat);
        b2.position.set(-Math.cos(angle) * 0.2, y, -Math.sin(angle) * 0.2);
        dnaGroup.add(b1, b2);
      }
      orbitGroup.add(dnaGroup);
    } else if (preset.prop === 'vitruvian') {
      const circle = new THREE.Mesh(new THREE.TorusGeometry(1.36, 0.025, 10, 52), goldMat);
      const square = new THREE.Mesh(new THREE.TorusGeometry(1.36, 0.02, 6, 4), accentMat);
      square.rotation.z = Math.PI / 4;
      orbitGroup.add(circle, square);
    } else if (preset.prop === 'polyhedron') {
      const ico1 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 0), goldMat);
      ico1.position.set(1.26, 0.32, 0.2);
      const ico2 = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), accentMat);
      ico2.position.set(-1.26, 0.1, 0.25);
      orbitGroup.add(ico1, ico2);
    } else if (preset.prop === 'rocket') {
      const ship = new THREE.Group();
      const body = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.38, 12), accentMat);
      body.rotation.z = -Math.PI / 2;
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.02, 0.38), goldMat);
      ship.add(body, wing);
      ship.position.set(1.3, 0.32, 0);
      const track = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.02, 10, 44), goldMat);
      track.rotation.x = Math.PI / 2.4;
      orbitGroup.add(ship, track);
    }
  }

  return { container, character, headGroup, mouth, leftEye, rightEye, orbitGroup, auraRing };
}

/**
 * Avatar 3D Peneliti (Player) yang bisa berjalan, berlari, dan melompat di Open World
 */
export function buildPlayerAvatar(accentHex = '#0E6BA8') {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf0c7a5, roughness: 0.6 });
  const coatMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
  const accentMat = new THREE.MeshStandardMaterial({ color: accentHex, roughness: 0.45 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x0f242d, roughness: 0.7 });
  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xf7c948, roughness: 0.4 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.8 });

  // Kaki kiri & kanan (pivot di pinggul)
  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.18, 0.72, 0);
  const legGeo = new THREE.CapsuleGeometry(0.12, 0.42, 8, 12);
  const leftLegMesh = new THREE.Mesh(legGeo, pantsMat);
  leftLegMesh.position.y = -0.32;
  leftLegPivot.add(leftLegMesh);

  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.18, 0.72, 0);
  const rightLegMesh = new THREE.Mesh(legGeo, pantsMat);
  rightLegMesh.position.y = -0.32;
  rightLegPivot.add(rightLegMesh);
  body.add(leftLegPivot, rightLegPivot);

  // Torso (Jas Lab Peneliti)
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.4, 0.82, 18), coatMat);
  torso.position.y = 1.12;
  body.add(torso);

  // Syal / Aksen bidang
  const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.075, 10, 22), accentMat);
  scarf.rotation.x = Math.PI / 2;
  scarf.position.y = 1.48;
  body.add(scarf);

  // Ransel Riset Kuning Neo-Brutalist di punggung
  const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.48, 0.24), yellowMat);
  backpack.position.set(0, 1.16, -0.35);
  body.add(backpack);

  // Lengan kiri & kanan (pivot di bahu)
  const armGeo = new THREE.CapsuleGeometry(0.095, 0.38, 8, 10);
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.44, 1.42, 0);
  const lArm = new THREE.Mesh(armGeo, coatMat);
  lArm.position.y = -0.24;
  leftArmPivot.add(lArm);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.44, 1.42, 0);
  const rArm = new THREE.Mesh(armGeo, coatMat);
  rArm.position.y = -0.24;
  rightArmPivot.add(rArm);
  body.add(leftArmPivot, rightArmPivot);

  // Kepala
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 20, 20), skinMat);
  head.position.y = 1.84;
  body.add(head);

  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.38, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.56),
    hairMat
  );
  hairCap.position.y = 1.87;
  body.add(hairCap);

  // Mata
  const eyeGeo = new THREE.SphereGeometry(0.045, 10, 10);
  const lEye = new THREE.Mesh(eyeGeo, pantsMat);
  lEye.position.set(-0.12, 1.86, 0.32);
  const rEye = new THREE.Mesh(eyeGeo, pantsMat);
  rEye.position.set(0.12, 1.86, 0.32);
  body.add(lEye, rEye);

  // Cincin bayangan di tanah
  const shadowDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.58, 24),
    new THREE.MeshBasicMaterial({ color: 0x0f242d, transparent: true, opacity: 0.24 })
  );
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = 0.03;
  root.add(shadowDisc);

  return { root, body, leftLegPivot, rightLegPivot, leftArmPivot, rightArmPivot };
}

/**
 * Helper membuat label papan nama melayang (Canvas Sprite) di atas NPC & Landmark 3D
 */
export function createFloatingLabel(title, subtitle = '', badgeColor = '#F7C948') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 148;
  const ctx = canvas.getContext('2d');

  // Shadow
  ctx.fillStyle = '#0F242D';
  roundRect(ctx, 18, 22, 476, 114, 28);
  ctx.fill();

  // Main Pill Card
  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, 14, 12, 476, 114, 28);
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#0F242D';
  ctx.stroke();

  // Color Strip Top/Left
  ctx.fillStyle = badgeColor;
  roundRect(ctx, 26, 24, 24, 90, 12);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#0F242D';
  ctx.stroke();

  // Title
  ctx.fillStyle = '#0F242D';
  ctx.font = '800 36px "Plus Jakarta Sans", sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(title.slice(0, 22), 68, subtitle ? 54 : 70);

  if (subtitle) {
    ctx.fillStyle = '#475569';
    ctx.font = '700 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(subtitle.slice(0, 30), 68, 96);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(3.8, 1.1, 1);
  return sprite;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
