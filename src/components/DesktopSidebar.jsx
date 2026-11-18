import React from 'react';
import {
  Map,
  Home,
  Sparkles,
  Users,
  Compass,
  GitBranch,
  User,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { LegaciumLogo } from './LegaciumLogo.jsx';

export function DesktopSidebar({ user, meta, activeTab, onChange, onLogout }) {
  const navItems = [
    { id: 'world', label: 'Dunia 3D (Open World)', icon: Map },
    { id: 'home', label: 'Menu Ringkas', icon: Home },
    { id: 'mentors', label: 'Studio 3D Tokoh', icon: Sparkles },
    { id: 'roundtable', label: 'Meja Bundar (2–4)', icon: Users },
    { id: 'quests', label: 'World Quest', icon: Compass },
    { id: 'techtree', label: 'Pohon Sejarah', icon: GitBranch },
    { id: 'profile', label: 'Profil Kota', icon: User }
  ];

  if (user?.role === 'admin') {
    navItems.push({ id: 'admin', label: 'Panel Admin', icon: ShieldCheck });
  }

  return (
    <aside className="hidden md:flex flex-col w-[250px] shrink-0 sticky top-5 self-start space-y-4">
      {/* Brand Card */}
      <div className="neo-card p-4 bg-white">
        <LegaciumLogo
          size="md"
          showWordmark
          subtitle={meta?.season || 'ERA 01 · SEASON GENESIS'}
        />
        <div className="mt-3 pt-3 border-t-2 border-dashed border-slate-200 flex items-center justify-between text-xs font-extrabold">
          <span className="truncate">{user?.city_name}</span>
          <span className="px-2 py-0.5 rounded-lg bg-[#F7C948] border-[1.5px] border-[#0F242D] shrink-0">
            Lv. {user?.city_level}
          </span>
        </div>
      </div>

      {/* Navigation Card */}
      <nav aria-label="Navigasi Desktop" className="neo-card p-2.5 bg-white space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-extrabold transition ${
                isActive
                  ? 'bg-[#F7C948] border-[2px] border-[#0F242D] shadow-neo-sm text-[#0F242D]'
                  : 'text-[#334E58] hover:bg-[#EEF8FA] border-[2px] border-transparent'
              }`}
            >
              <Icon size={17} strokeWidth={isActive ? 2.5 : 2.1} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Role & Logout Card */}
      <div className="neo-card p-3.5 bg-[#E5F5F1] space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-extrabold truncate">{user?.name}</p>
            <p className="text-[10px] font-bold text-slate-600">{user?.research_points} Research Pts</p>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full border-[1.5px] border-[#0F242D] text-[10px] font-extrabold uppercase shrink-0 ${
              user?.role === 'admin' ? 'bg-[#F7C948]' : 'bg-[#9AD1F5]'
            }`}
          >
            {user?.role}
          </span>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="w-full neo-btn bg-white py-2 text-xs text-red-700 flex items-center justify-center gap-1.5"
        >
          <LogOut size={14} />
          <span>Keluar Akun</span>
        </button>
      </div>
    </aside>
  );
}
