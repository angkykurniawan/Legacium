import React from 'react';

/**
 * Latar belakang perbukitan pastel & siluet kota riset lembut
 * mengikuti nuansa tenang pada referensi UI.
 */
export function SceneryBg() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10" aria-hidden="true">
      {/* Soft warm sun glow on upper right */}
      <div
        className="absolute right-[10%] top-[24%] h-44 w-44 rounded-full opacity-45 blur-2xl"
        style={{ background: 'radial-gradient(circle, #F9E5A0 0%, rgba(249,229,160,0) 70%)' }}
      />

      {/* Soft curved mist ribbons */}
      <svg
        className="absolute inset-x-0 top-0 w-full h-64 opacity-40"
        viewBox="0 0 430 220"
        fill="none"
        preserveAspectRatio="none"
      >
        <path
          d="M-20 75 C 90 40, 175 110, 290 65 C 350 40, 400 70, 460 50"
          stroke="#F7ECD0"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M-30 160 C 80 120, 210 185, 340 130 C 390 110, 420 125, 460 115"
          stroke="#D7EEF7"
          strokeWidth="12"
          strokeLinecap="round"
        />
      </svg>

      {/* Rolling pastel hills & pine silhouettes at bottom */}
      <svg
        className="absolute bottom-0 inset-x-0 w-full h-72"
        viewBox="0 0 430 260"
        fill="none"
        preserveAspectRatio="none"
      >
        <path d="M0 165 Q 110 105 220 155 T 430 140 L 430 260 L 0 260 Z" fill="#D5EEF3" opacity="0.7" />
        <path d="M0 200 Q 130 150 260 195 T 430 180 L 430 260 L 0 260 Z" fill="#C9ECE4" opacity="0.75" />
        {/* Tiny decorative trees */}
        <polygon points="36,162 28,184 44,184" fill="#B5DFD6" />
        <polygon points="54,168 48,186 60,186" fill="#C2E6DE" />
        <polygon points="382,150 374,174 390,174" fill="#B5DFD6" />
        <polygon points="402,158 396,176 408,176" fill="#C2E6DE" />
      </svg>
    </div>
  );
}
