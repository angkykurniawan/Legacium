import React from 'react';

/**
 * Logo resmi Legacium:
 * - Simpul Infinity Kiri (Biru Langit)  = Warisan & Memori Tokoh Sejarah
 * - Simpul Infinity Kanan (Mint Teal)   = Inovasi Lintas Disiplin STEAM
 * - Bintang Emas di Tengah              = Sintesis Pengetahuan & Penemuan
 */
export function LegaciumLogo({ size = 'md', showWordmark = false, subtitle = '' }) {
  const dimMap = {
    xs: 'w-7 h-7',
    sm: 'w-9 h-9',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className="inline-flex items-center gap-2.5 shrink-0">
      <svg
        viewBox="0 0 128 128"
        fill="none"
        className={`${dimMap[size] || dimMap.md} shrink-0`}
        aria-label="Logo Legacium"
      >
        <rect x="12" y="18" width="104" height="100" rx="30" fill="#0F242D" />
        <rect
          x="12"
          y="10"
          width="104"
          height="100"
          rx="30"
          fill="#EEF8FA"
          stroke="#0F242D"
          strokeWidth="6"
        />
        <ellipse
          cx="64"
          cy="60"
          rx="42"
          ry="18"
          transform="rotate(-18 64 60)"
          stroke="#0E6BA8"
          strokeWidth="3"
          strokeDasharray="6 6"
          opacity="0.5"
        />
        <path
          d="M44 78C31.8 78 24 70 24 60C24 50 31.8 42 44 42C53.6 42 59.4 49 64 60C59.4 71 53.6 78 44 78Z"
          fill="#59B8F7"
          stroke="#0F242D"
          strokeWidth="5.5"
          strokeLinejoin="round"
        />
        <path
          d="M84 78C96.2 78 104 70 104 60C104 50 96.2 42 84 42C74.4 42 68.6 49 64 60C68.6 71 74.4 78 84 78Z"
          fill="#3CC9B8"
          stroke="#0F242D"
          strokeWidth="5.5"
          strokeLinejoin="round"
        />
        <circle cx="42" cy="60" r="6" fill="#FFFFFF" stroke="#0F242D" strokeWidth="3.5" />
        <circle cx="86" cy="60" r="6" fill="#FFFFFF" stroke="#0F242D" strokeWidth="3.5" />
        <path
          d="M64 26L70 50L88 60L70 70L64 94L58 70L40 60L58 50L64 26Z"
          fill="#F7C948"
          stroke="#0F242D"
          strokeWidth="4.5"
          strokeLinejoin="round"
        />
        <circle cx="64" cy="60" r="5" fill="#0F242D" />
      </svg>

      {showWordmark && (
        <div className="leading-tight">
          {subtitle && (
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              {subtitle}
            </p>
          )}
          <span className="text-xl font-extrabold tracking-tight text-[#0F242D]">Legacium</span>
        </div>
      )}
    </div>
  );
}
