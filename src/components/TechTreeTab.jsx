import React from 'react';
import {
  GitBranch,
  Lock,
  CheckCircle2,
  Clock,
  Users,
  Sparkles,
  ArrowRight,
  MessageSquareMore
} from 'lucide-react';
import { getFieldMeta } from '../data/fields.js';
import { LegaciumLogo } from './LegaciumLogo.jsx';

export function TechTreeTab({ techTree, onOpenQuestById }) {
  const { season = 'ERA 01 · SEASON GENESIS', nodes = [], stats = {} } = techTree || {};

  const statusMeta = {
    unlocked: {
      label: 'Terbuka & Terarsip',
      bg: 'bg-[#66D7C5]',
      icon: CheckCircle2
    },
    in_progress: {
      label: 'Sedang Berevolusi',
      bg: 'bg-[#F7C948]',
      icon: Clock
    },
    locked: {
      label: 'Menunggu Era Sebelumnya',
      bg: 'bg-slate-200',
      icon: Lock
    }
  };

  return (
    <div className="space-y-5 pb-28 md:pb-10">
      <div className="pt-1 flex items-center gap-3">
        <div className="md:hidden">
          <LegaciumLogo size="sm" />
        </div>
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            {season} · Evolusi Kolektif Komunitas
          </p>
          <h1 className="text-[22px] md:text-[26px] font-extrabold text-[#0F242D] leading-tight">
            Pohon Sejarah (Tech Tree)
          </h1>
        </div>
      </div>

      {/* Ringkasan Statistik Memori Kolektif */}
      <div className="grid grid-cols-4 gap-2">
        <div className="neo-card p-2.5 bg-white text-center">
          <Users size={16} className="mx-auto text-[#0E6BA8]" />
          <p className="text-base font-extrabold mt-0.5">{stats.total_researchers ?? 0}</p>
          <p className="text-[9px] font-extrabold uppercase text-slate-500">Peneliti</p>
        </div>
        <div className="neo-card p-2.5 bg-[#A8D8F5] text-center">
          <Sparkles size={16} className="mx-auto text-[#0F242D]" />
          <p className="text-base font-extrabold mt-0.5">{stats.total_blueprints ?? 0}</p>
          <p className="text-[9px] font-extrabold uppercase text-slate-700">Blueprint</p>
        </div>
        <div className="neo-card p-2.5 bg-[#F7C948] text-center">
          <MessageSquareMore size={16} className="mx-auto text-[#0F242D]" />
          <p className="text-base font-extrabold mt-0.5">{stats.total_roundtables ?? 0}</p>
          <p className="text-[9px] font-extrabold uppercase text-slate-800">Sintesis</p>
        </div>
        <div className="neo-card p-2.5 bg-[#E5F5F1] text-center">
          <CheckCircle2 size={16} className="mx-auto text-emerald-700" />
          <p className="text-base font-extrabold mt-0.5">{stats.unlocked_nodes ?? 1}</p>
          <p className="text-[9px] font-extrabold uppercase text-slate-600">Era Terbuka</p>
        </div>
      </div>

      {/* Timeline Pohon Sejarah: 1 kolom di mobile, 2 kolom grid rapi di desktop */}
      <div className="relative pl-6 md:pl-0 space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
        <div className="md:hidden absolute left-[11px] top-3 bottom-3 w-[3px] bg-[#0F242D] rounded-full" />

        {nodes.map((node) => {
          const st = statusMeta[node.status] || statusMeta.locked;
          const StatusIcon = st.icon;
          const pct = node.collective_percent ?? (node.status === 'unlocked' ? 100 : 0);
          const breakdown = node.field_breakdown;
          const contributors = node.contributors || [];

          return (
            <div key={node.id} className="relative">
              <div
                className={`md:hidden absolute -left-[22px] top-4 w-5 h-5 rounded-full border-[2.5px] border-[#0F242D] flex items-center justify-center ${st.bg}`}
              >
                <GitBranch size={10} strokeWidth={3} />
              </div>

              <div
                className={`neo-card p-4 space-y-2.5 ${
                  node.status === 'locked' ? 'bg-white/80' : 'bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#EEF8FA] border border-[#0F242D]">
                    Tier {node.era_tier} · {node.field_combo}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-[#0F242D] ${st.bg}`}
                  >
                    <StatusIcon size={11} />
                    {st.label}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-[#0F242D]">{node.title}</h3>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5 leading-relaxed">
                    {node.description}
                  </p>
                </div>

                {breakdown && (
                  <div className="p-2.5 rounded-xl bg-[#EEF8FA] border-[1.5px] border-[#0F242D] space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-extrabold">
                      <span>Evolusi Kolektif Server</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-white border border-[#0F242D] overflow-hidden">
                      <div
                        className="h-full bg-[#3CC9B8] transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(breakdown.required || {}).map(([fk, target]) => {
                        const fm = getFieldMeta(fk);
                        const val = breakdown.progress?.[fk] || 0;
                        const fpct = Math.min(100, Math.round((val / target) * 100));
                        return (
                          <span
                            key={fk}
                            className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg border border-[#0F242D]"
                            style={{ backgroundColor: fm.badgeBg }}
                          >
                            {fm.label}: {fpct}%
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {contributors.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-extrabold uppercase text-slate-500">
                      Kontributor:
                    </span>
                    {contributors.map((c, idx) => (
                      <span
                        key={`${c.name}_${idx}`}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-[#0F242D]"
                      >
                        {c.name} ({getFieldMeta(c.field).shortLabel})
                      </span>
                    ))}
                  </div>
                )}

                {node.linked_quest_id && node.status !== 'unlocked' && (
                  <button
                    type="button"
                    onClick={() => onOpenQuestById?.(node.linked_quest_id)}
                    className="neo-btn bg-[#F7C948] w-full py-2 text-xs flex items-center justify-center gap-1.5"
                  >
                    <span>Bantu Buka Era Ini di World Quest</span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
