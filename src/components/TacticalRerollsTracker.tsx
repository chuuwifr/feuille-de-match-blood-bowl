import React from 'react';
import { CheckSquare, Minus, Plus, RotateCcw, RotateCw } from 'lucide-react';
import { MatchSheetState, TeamSheetState, TeamSide } from '../types/bloodbowl';
import {
  clampRerolls,
  formatGold,
  getRemainingRerolls,
  getTeamDef,
  getUsedRerollsCount,
  normalizeUsedRerolls,
  setUsedReroll,
  stepTeamRerolls,
} from '../utils/bloodbowlRules';

interface TacticalRerollsTrackerProps {
  match: MatchSheetState;
  onUpdateMatch: (updater: (prev: MatchSheetState) => MatchSheetState) => void;
}

export const TacticalRerollsTracker: React.FC<TacticalRerollsTrackerProps> = ({
  match,
  onUpdateMatch,
}) => {
  const updateTeam = (
    side: TeamSide,
    updater: (team: TeamSheetState) => TeamSheetState
  ) => {
    const key = side === 'A' ? 'teamA' : 'teamB';
    onUpdateMatch((prev) => ({
      ...prev,
      [key]: updater(prev[key]),
    }));
  };

  const handleSetRerollUsed = (
    side: TeamSide,
    index: number,
    used: boolean
  ) => {
    updateTeam(side, (team) => {
      const total = clampRerolls(team.rerolls);
      return {
        ...team,
        usedRerolls: setUsedReroll(team.usedRerolls, index, used, total),
      };
    });
  };

  const handleStepStock = (side: TeamSide, delta: -1 | 1) => {
    updateTeam(side, (team) => {
      const nextTotal = stepTeamRerolls(team.rerolls, delta);
      return {
        ...team,
        rerolls: nextTotal,
        usedRerolls: normalizeUsedRerolls(team.usedRerolls, nextTotal),
      };
    });
  };

  const handleResetTeamRerolls = (side: TeamSide) => {
    updateTeam(side, (team) => {
      const total = clampRerolls(team.rerolls);
      return {
        ...team,
        usedRerolls: normalizeUsedRerolls([], total),
      };
    });
  };

  const handleResetAllHalfTime = () => {
    onUpdateMatch((prev) => ({
      ...prev,
      teamA: {
        ...prev.teamA,
        usedRerolls: normalizeUsedRerolls([], clampRerolls(prev.teamA.rerolls)),
      },
      teamB: {
        ...prev.teamB,
        usedRerolls: normalizeUsedRerolls([], clampRerolls(prev.teamB.rerolls)),
      },
    }));
  };

  const totalUsedBoth =
    getUsedRerollsCount(match.teamA.rerolls, match.teamA.usedRerolls) +
    getUsedRerollsCount(match.teamB.rerolls, match.teamB.usedRerolls);

  const renderTeamPanel = (side: TeamSide, team: TeamSheetState) => {
    const total = clampRerolls(team.rerolls);
    const slots = normalizeUsedRerolls(team.usedRerolls, total);
    const usedCount = getUsedRerollsCount(total, slots);
    const remaining = getRemainingRerolls(total, slots);
    const labelName = team.name.trim() || `Équipe ${side}`;
    const teamDef = getTeamDef(team.teamId);

    return (
      <div
        data-testid={`tactical-rerolls-panel-${side.toLowerCase()}`}
        className="p-2.5 bg-white/85 flex flex-col gap-2"
      >
        {/* Top bar: Team label + remaining counter + stock controls */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={`px-2 py-0.5 text-[10px] font-display font-bold uppercase tracking-wide rounded border border-[#1E1915] shrink-0 ${
                side === 'A'
                  ? 'bg-[#0D2042] text-white'
                  : 'bg-[#750d0d] text-white'
              }`}
            >
              Équipe {side}
            </span>
            <span className="font-semibold text-xs text-[#1E1915] truncate">
              {labelName}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span
              data-testid={`tactical-rerolls-remaining-${side.toLowerCase()}`}
              className={`px-2 py-0.5 rounded-sm border font-mono-num text-[11px] font-extrabold ${
                total > 0 && remaining === 0
                  ? 'bg-red-50 text-[#750d0d] border-[#750d0d]'
                  : 'bg-[#faf3df] text-[#0D2042] border-[#1E1915]'
              }`}
            >
              {remaining} / {total} rest.
            </span>

            <div className="no-print flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleStepStock(side, -1)}
                disabled={total <= 0}
                title="Réduire le stock de relances"
                aria-label={`Réduire stock relances tactiques Équipe ${side}`}
                className="w-6 h-6 flex items-center justify-center rounded-sm border border-[#1E1915] bg-[#efe2c0] hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-[#1E1915] cursor-pointer"
              >
                <Minus className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => handleStepStock(side, 1)}
                disabled={total >= 16}
                title="Ajouter une relance au stock"
                aria-label={`Ajouter stock relances tactiques Équipe ${side}`}
                className="w-6 h-6 flex items-center justify-center rounded-sm border border-[#1E1915] bg-[#0D2042] hover:bg-[#16315e] disabled:opacity-40 disabled:cursor-not-allowed text-white cursor-pointer"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Reroll Checkboxes */}
        {total === 0 ? (
          <div className="px-2.5 py-2 rounded-sm border border-dashed border-[#8c7853] bg-[#faf4e4]/70 text-[11px] text-stone-600 italic">
            Aucune relance tactique en stock pour cette équipe.
          </div>
        ) : (
          <div
            role="group"
            aria-label={`Cases de relances tactiques Équipe ${side}`}
            className="flex flex-wrap gap-1.5"
          >
            {slots.map((isUsed, idx) => (
              <label
                key={idx}
                data-testid={`reroll-slot-${side.toLowerCase()}-${idx + 1}`}
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-sm border text-[11px] font-semibold select-none cursor-pointer transition-colors ${
                  isUsed
                    ? 'bg-[#e7d8b5] border-[#750d0d]/70 text-[#750d0d]'
                    : 'bg-white hover:bg-amber-50 border-[#1E1915] text-[#0D2042] shadow-[1px_1px_0px_rgba(30,25,21,0.18)]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isUsed}
                  onChange={(e) =>
                    handleSetRerollUsed(side, idx, e.target.checked)
                  }
                  aria-label={`Relance tactique ${idx + 1} Équipe ${side}`}
                  className="w-3.5 h-3.5 accent-[#750d0d] cursor-pointer"
                />
                <span
                  className={`font-mono-num font-bold ${
                    isUsed ? 'line-through opacity-80' : ''
                  }`}
                >
                  R{idx + 1}
                </span>
                <span className="text-[10px] font-normal">
                  {isUsed ? 'Utilisée' : 'Dispo'}
                </span>
              </label>
            ))}
          </div>
        )}

        {/* Footer metadata & team reset */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#1E1915]/20 text-[10.5px] text-stone-700">
          <span>
            <strong className="font-mono-num text-[#750d0d]">{usedCount}</strong>{' '}
            {usedCount > 1 ? 'utilisées' : 'utilisée'} ·{' '}
            <strong className="font-mono-num text-[#0D2042]">{remaining}</strong>{' '}
            {remaining > 1 ? 'disponibles' : 'disponible'}
            {teamDef ? ` · Coût ${formatGold(teamDef.rerollCost)} po` : ''}
          </span>

          <button
            type="button"
            onClick={() => handleResetTeamRerolls(side)}
            disabled={usedCount === 0}
            aria-label={`Réarmer relances Équipe ${side}`}
            className="no-print inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border border-[#8c7853] bg-[#faf4e4] hover:bg-amber-200 disabled:opacity-40 disabled:cursor-not-allowed text-[#1E1915] font-semibold text-[10px] cursor-pointer transition-colors"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>Réarmer</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      data-testid="tactical-rerolls-tracker"
      aria-label="Suivi des relances tactiques"
      className="border-2 border-[#1E1915] bg-[#f8f0da] rounded-sm overflow-hidden mb-2.5"
    >
      {/* Top header bar */}
      <div className="navy-header text-white px-2.5 py-1.5 flex flex-wrap items-center justify-between gap-2 border-b border-[#1E1915]">
        <div className="flex items-center gap-2">
          <RotateCw className="w-4 h-4 text-amber-300 shrink-0" />
          <span className="font-display text-xs font-extrabold tracking-wider uppercase">
            Suivi des relances tactiques
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-amber-200/90 font-medium">
            <CheckSquare className="w-3 h-3" />
            <span>Cocher une case lorsque la relance est dépensée</span>
          </span>
        </div>

        <button
          type="button"
          onClick={handleResetAllHalfTime}
          disabled={totalUsedBoth === 0}
          title="Décocher toutes les relances utilisées (nouvelle mi-temps)"
          aria-label="Réarmer les relances des deux équipes pour la mi-temps"
          className="no-print inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-[#750d0d] hover:bg-[#9d1717] disabled:opacity-45 disabled:cursor-not-allowed text-white border border-[#EAB308]/70 font-semibold text-[11px] cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Réarmer mi-temps</span>
        </button>
      </div>

      {/* Mirrored Team A & Team B tactical reroll slots */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#1E1915]">
        {renderTeamPanel('A', match.teamA)}
        {renderTeamPanel('B', match.teamB)}
      </div>
    </div>
  );
};
