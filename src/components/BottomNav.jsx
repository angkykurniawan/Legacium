import React from 'react';
import { Map, Home, Compass, GitBranch, User } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'world', label: 'Dunia 3D', icon: Map },
  { id: 'home', label: 'Menu', icon: Home },
  { id: 'quests', label: 'Quest', icon: Compass },
  { id: 'techtree', label: 'Sejarah', icon: GitBranch },
  { id: 'profile', label: 'Profil', icon: User }
];

export function BottomNav({ activeTab, onChange }) {
  return (
    <div className="md:hidden fixed bottom-4 inset-x-0 z-40 flex justify-center px-3 pointer-events-none">
      <nav
        aria-label="Navigasi Utama"
        className="pointer-events-auto w-full max-w-[420px] bg-white border-[2.5px] border-[#0F242D] rounded-full shadow-neo-lg px-1.5 py-1.5 grid grid-cols-5 gap-0.5"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 rounded-full transition-all duration-150 ${
                isActive
                  ? 'bg-[#F7C948] border-[2px] border-[#0F242D] text-[#0F242D]'
                  : 'text-[#334E58] hover:bg-slate-100/80 border-[2px] border-transparent'
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] mt-0.5 ${isActive ? 'font-extrabold' : 'font-semibold'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
