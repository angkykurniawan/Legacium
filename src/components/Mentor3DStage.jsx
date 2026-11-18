import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Rotate3d, Sparkles, Volume2, Users } from 'lucide-react';
import { getFieldMeta } from '../data/fields.js';
import { resolveCharacterPreset, buildCharacterRig } from '../utils/character3d.js';

const FORMATIONS = {
  1: { camZ: 4.7, fov: 36, orbPos: null, slots: [{ x: 0, z: 0, rotY: 0, scale: 1 }] },
  2: {
    camZ: 5.9,
    fov: 38,
    orbPos: [0, 0.25, 0.15],
    slots: [
      { x: -1.18, z: 0, rotY: 0.28, scale: 0.85 },
      { x: 1.18, z: 0, rotY: -0.28, scale: 0.85 }
    ]
  },
  3: {
    camZ: 6.9,
    fov: 39,
    orbPos: [0, 0.18, 0.55],
    slots: [
      { x: -1.7, z: 0.35, rotY: 0.36, scale: 0.76 },
      { x: 0, z: -0.6, rotY: 0, scale: 0.78 },
      { x: 1.7, z: 0.35, rotY: -0.36, scale: 0.76 }
    ]
  },
  4: {
    camZ: 8.1,
    fov: 40,
    orbPos: [0, 0.18, 0.65],
    slots: [
      { x: -2.25, z: 0.55, rotY: 0.42, scale: 0.68 },
      { x: -0.78, z: -0.45, rotY: 0.14, scale: 0.7 },
      { x: 0.78, z: -0.45, rotY: -0.14, scale: 0.7 },
      { x: 2.25, z: 0.55, rotY: -0.42, scale: 0.68 }
    ]
  }
};

export function Mentor3DStage({
  mentor = null,
  mentorsList = null,
  isThinking = false,
  isSpeaking = false,
  activeSpeakerIndex = -1
}) {
  const containerRef = useRef(null);
  const stateRef = useRef({ isThinking, isSpeaking, activeSpeakerIndex });
  const [webglError, setWebglError] = useState(false);

  const activeList = (
    Array.isArray(mentorsList) && mentorsList.length > 0
      ? mentorsList
      : mentor
        ? [mentor]
        : []
  ).slice(0, 4);

  const isMulti = activeList.length > 1;
  const listKey = activeList.map((m) => `${m.id}:${m.name}:${m.field}`).join('|');
  stateRef.current = { isThinking, isSpeaking, activeSpeakerIndex };

  useEffect(() => {
    const container = containerRef.current;
    if (!container || activeList.length === 0) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setWebglError(true);
      return;
    }

    setWebglError(false);
    const width = container.clientWidth || 360;
    const height = container.clientHeight || 250;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const formation = FORMATIONS[activeList.length] || FORMATIONS[4];
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(formation.fov, width / height, 0.1, 100);
    camera.position.set(0, 0.42, formation.camZ);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xc9ece4, 1.3));
    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.35);
    keyLight.position.set(3.2, 4.5, 4);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x59b8f7, 0.9);
    rimLight.position.set(-3.5, 2, -2.5);
    scene.add(rimLight);

    const root = new THREE.Group();
    scene.add(root);

    const rigs = activeList.map((m, idx) => {
      const slot = formation.slots[idx] || formation.slots[0];
      const rig = buildCharacterRig(resolveCharacterPreset(m), !isMulti, false);
      rig.container.position.set(slot.x, 0, slot.z);
      rig.container.rotation.y = slot.rotY;
      rig.container.scale.setScalar(slot.scale);
      root.add(rig.container);
      return rig;
    });

    let bridgeOrb = null;
    if (isMulti && formation.orbPos) {
      const bridgeGroup = new THREE.Group();
      bridgeGroup.position.set(...formation.orbPos);
      const core = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.24, 0),
        new THREE.MeshStandardMaterial({
          color: 0xf7c948,
          emissive: 0xf7c948,
          emissiveIntensity: 0.35,
          roughness: 0.25,
          metalness: 0.4
        })
      );
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.46, 0.025, 10, 36),
        new THREE.MeshStandardMaterial({ color: 0x0e6ba8, roughness: 0.3 })
      );
      ring.rotation.x = Math.PI / 3;
      bridgeGroup.add(core, ring);
      root.add(bridgeGroup);
      bridgeOrb = bridgeGroup;
    }

    let isDragging = false;
    let prevX = 0;
    let userRotationY = 0;

    const onPointerDown = (e) => {
      isDragging = true;
      prevX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    };
    const onPointerMove = (e) => {
      if (!isDragging) return;
      const currX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      const dx = currX - prevX;
      prevX = currX;
      userRotationY += dx * 0.011;
    };
    const onPointerUp = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.style.cursor = 'grab';
    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 360;
      const h = container.clientHeight || 250;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();
    let frameId = 0;

    const animateRig = (rig, t, offset, thinking, speaking) => {
      rig.character.position.y = Math.sin(t * 2.1 + offset) * 0.045;
      if (thinking) {
        rig.headGroup.rotation.z = Math.sin(t * 2.5 + offset) * 0.11;
        rig.headGroup.rotation.x = -0.05 + Math.sin(t * 1.8) * 0.04;
      } else if (speaking) {
        rig.headGroup.rotation.z = Math.sin(t * 4.6 + offset) * 0.06;
        rig.headGroup.rotation.x = Math.sin(t * 7.2 + offset) * 0.05;
      } else {
        rig.headGroup.rotation.z = Math.sin(t * 1.1 + offset) * 0.03;
        rig.headGroup.rotation.x = Math.sin(t * 0.9 + offset) * 0.025;
      }

      if (speaking) {
        const openAmt = 0.65 + Math.abs(Math.sin(t * 16 + offset)) * 1.6;
        rig.mouth.scale.set(openAmt, 1, 0.7);
      } else if (thinking) {
        rig.mouth.scale.set(0.45, 0.75, 0.6);
      } else {
        rig.mouth.scale.set(0.6, 1, 0.6);
      }

      const blinkCycle = (t + offset) % 3.7;
      const blinkScale = blinkCycle > 3.55 ? 0.12 : 1;
      rig.leftEye.scale.y = blinkScale;
      rig.rightEye.scale.y = blinkScale;

      rig.orbitGroup.rotation.y += thinking ? 0.036 : speaking ? 0.022 : 0.011;
      const pulse = 1 + Math.sin(t * (thinking ? 7 : speaking ? 5 : 2) + offset) * 0.035;
      rig.auraRing.scale.set(pulse, pulse, 1);
    };

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const {
        isThinking: thinking,
        isSpeaking: speaking,
        activeSpeakerIndex: spIdx
      } = stateRef.current;

      root.rotation.y = userRotationY + Math.sin(t * 0.55) * (isMulti ? 0.07 : 0.14);

      rigs.forEach((rig, idx) => {
        const rigSpeaking = isMulti
          ? spIdx === 'all' || Number(spIdx) === idx
          : speaking;
        animateRig(rig, t, idx * 1.15, thinking, rigSpeaking);
      });

      if (bridgeOrb) {
        bridgeOrb.rotation.y += thinking ? 0.06 : 0.02;
        bridgeOrb.rotation.x += 0.012;
        const bScale = thinking || spIdx === 'all' ? 1.18 + Math.sin(t * 6) * 0.1 : 1;
        bridgeOrb.scale.setScalar(bScale);
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
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
  }, [listKey, isMulti]);

  const primaryMentor = activeList[0];
  const fieldMeta = getFieldMeta(primaryMentor?.field);

  const badgeText = isMulti
    ? isThinking
      ? `${activeList.length} tokoh 3D sedang berdiskusi...`
      : activeSpeakerIndex === 'all'
        ? 'Sintesis Lintas Era Terbentuk!'
        : Number(activeSpeakerIndex) >= 0 && activeList[Number(activeSpeakerIndex)]
          ? `${activeList[Number(activeSpeakerIndex)].name} berbicara...`
          : `Meja Bundar 3D (${activeList.length} Tokoh)`
    : isThinking
      ? `${primaryMentor?.name} sedang berpikir...`
      : isSpeaking
        ? `${primaryMentor?.name} berbicara`
        : `Avatar 3D · ${primaryMentor?.name}`;

  return (
    <div
      className="neo-card relative overflow-hidden"
      style={{
        background: `radial-gradient(circle at 50% 35%, #FFFFFF 0%, ${fieldMeta.badgeBg} 68%, #D9F1EA 100%)`
      }}
    >
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-2 pointer-events-none">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 border-[2px] border-[#0F242D] text-[10px] font-extrabold shadow-neo-sm max-w-[74%] truncate">
          {isThinking ? (
            <Sparkles size={12} className="text-[#E55827] animate-spin shrink-0" />
          ) : isSpeaking || activeSpeakerIndex !== -1 ? (
            <Volume2 size={12} className="text-[#0E6BA8] animate-pulse shrink-0" />
          ) : isMulti ? (
            <Users size={12} className="text-[#0E6BA8] shrink-0" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-emerald-500 border border-[#0F242D] shrink-0" />
          )}
          <span className="truncate">{badgeText}</span>
        </span>

        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 border-[1.5px] border-[#0F242D] text-[10px] font-extrabold text-slate-600 shrink-0">
          <Rotate3d size={12} />
          <span>Putar 3D</span>
        </span>
      </div>

      {webglError ? (
        <div className="h-[240px] md:h-[285px] flex flex-col items-center justify-center p-4 text-center">
          <p className="text-xs font-extrabold">{activeList.map((m) => m.name).join(' × ')}</p>
          <p className="text-[11px] font-semibold text-slate-500">Mode 2D Fallback</p>
        </div>
      ) : (
        <div ref={containerRef} className="w-full h-[240px] md:h-[285px] touch-none select-none" />
      )}
    </div>
  );
}
