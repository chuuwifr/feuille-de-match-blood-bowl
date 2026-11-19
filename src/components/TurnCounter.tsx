import React from 'react';
import { ArrowRightLeft, Clock, Minus, Plus, RotateCcw } from 'lucide-react';
import { MatchSheetState, TeamSheetState, TeamSide, TeamTurnMarkers } from '../types/bloodbowl';
import {
  createEmptyTurnMarkers,
  getGlobalTurnNumber,
  stepTeamTurn,
} from '../utils/bloodbowlRules';

interface TurnCounterProps {
  match: MatchSheetState;
  onUpdateMatch: (updater: (prev: MatchSheetState) => MatchSheetState) => void;
}

const ACTION_MARKER_ITEMS: Array<{
  key: keyof TeamTurnMarkers;
  label: string;
  title: string;
}> = [
  { key: 'blitz', label: 'Blitz', title: 'Action de Blitz (1 par tour)' },
  { key: 'pass', label: 'Passe', title: 'Action de Passe (1 par tour)' },
  { key: 'handoff', label: 'Transm.', title: 'Transmission (1 par tour)' },
  { key: 'foul', label: 'Agro', title: 'Action d’Agression (1 par tour)' },
];

export const TurnCounter: React.FC<TurnCounterProps> = ({
  match,
  onUpdateMatch,
}) => {
  const half = match.half ?? 1;
  const activeTurnSide = match.activeTurnSide ?? null;

  const updateTeamTurn = (
    side: TeamSide,
    updater: (team: TeamSheetState) => TeamSheetState
  ) => {
    onUpdateMatch((prev) => ({
      ...prev,
      [side === 'A' ? 'teamA' : 'teamB']: updater(
        side === 'A' ? prev.teamA : prev.teamB
      ),
    }));
  };

  const handleStepTurn = (side: TeamSide, delta: -1 | 1) => {
    onUpdateMatch((prev) => {
      const key = side === 'A' ? 'teamA' : 'teamB';
      const team = prev[key];
      const nextTurn = stepTeamTurn(team.currentTurn, delta);
      return {
        ...prev,
        activeTurnSide: delta > 0 ? side : prev.activeTurnSide,
        [key]: {
          ...team,
          currentTurn: nextTurn,
          // Reset once-per-turn action markers when advancing into a new turn
          turnMarkers: delta > 0 ? createEmptyTurnMarkers() : team.turnMarkers,
        },
      };
    });
  };

  const handleSetTurnMarker = (side: TeamSide, markerTurn: number) => {
    onUpdateMatch((prev) => {
      const key = side === 'A' ? 'teamA' : 'teamB';
      const team = prev[key];
      const nextTurn = team.currentTurn === markerTurn ? markerTurn - 1 : markerTurn;
      return {
        ...prev,
        activeTurnSide: nextTurn > 0 ? side : prev.activeTurnSide,
        [key]: {
          ...team,
          currentTurn: nextTurn,
        },
      };
    });
  };

  const handleToggleActionMarker = (
    side: TeamSide,
    markerKey: keyof TeamTurnMarkers
  ) => {
    updateTeamTurn(side, (team) => ({
      ...team,
      turnMarkers: {
        ...team.turnMarkers,
        [markerKey]: !team.turnMarkers[markerKey],
      },
    }));
  };

  const handleSwitchHalf = (targetHalf: 1 | 2) => {
    onUpdateMatch((prev) => ({
      ...prev,
      half: targetHalf,
    }));
  };

  const handleResetTurnTrack = () => {
    onUpdateMatch((prev) => ({
      ...prev,
      activeTurnSide: null,
      teamA: {
        ...prev.teamA,
        currentTurn: 0,
        turnMarkers: createEmptyTurnMarkers(),
      },
      teamB: {
        ...prev.teamB,
        currentTurn: 0,
        turnMarkers: createEmptyTurnMarkers(),
      },
    }));
  };

  const handleNextActiveTurn = () => {
    onUpdateMatch((prev) => {
      const nextSide: TeamSide = prev.activeTurnSide === 'A' ? 'B' : 'A';
      const targetKey = nextSide === 'A' ? 'teamA' : 'teamB';
      const targetTeam = prev[targetKey];
      const nextTurn = stepTeamTurn(targetTeam.currentTurn, 1);

      return {
        ...prev,
        activeTurnSide: nextSide,
        [targetKey]: {
          ...targetTeam,
          currentTurn: nextTurn,
          turnMarkers: createEmptyTurnMarkers(),
        },
      };
    });
  };

  const renderTeamTurnPanel = (side: TeamSide, team: TeamSheetState) => {
    const isActive = activeTurnSide === side;
    const globalTurn = getGlobalTurnNumber(half, team.currentTurn);
    const labelName = team.name.trim() || `Équipe ${side}`;

    return (
      <div
        data-testid={`turn-panel-${side.toLowerCase()}`}
        className={`p-2.5 flex flex-col gap-2 transition-colors ${
          isActive ? 'bg-[#fff9e6]' : 'bg-white/85'
        }`}
      >
        {/* Top row: Team name + Active turn toggle + - / current / + */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() =>
                onUpdateMatch((p) => ({
                  ...p,
                  activeTurnSide: p.activeTurnSide === side ? null : side,
                }))
              }
              aria-pressed={isActive}
              aria-label={`Marquer le tour actif pour Équipe ${side}`}
              className={`px-2 py-0.5 text-[10px] font-display font-bold uppercase tracking-wide rounded border cursor-pointer transition-colors shrink-0 ${
                isActive
                  ? 'bg-[#750d0d] text-amber-200 border-[#EAB308]'
                  : 'bg-[#0D2042] text-white border-[#1E1915] hover:bg-[#16315e]'
              }`}
            >
              {isActive ? `Tour actif · ${side}` : `Équipe ${side}`}
            </button>
            <span className="font-semibold text-xs text-[#1E1915] truncate">
              {labelName}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => handleStepTurn(side, -1)}
              disabled={team.currentTurn <= 0}
              aria-label={`Décrémenter tour Équipe ${side}`}
              className="w-7 h-7 flex items-center justify-center rounded border border-[#1E1915] bg-[#efe2c0] hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-[#1E1915] cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            <div
              data-testid={`turn-value-${side.toLowerCase()}`}
              className="px-2.5 h-7 flex items-center justify-center rounded border border-[#1E1915] bg-white font-mono-num text-xs font-bold text-[#0D2042] min-w-[74px]"
            >
              {team.currentTurn === 0
                ? '0 / 8'
                : half === 2
                  ? `${team.currentTurn}/8 (T${globalTurn})`
                  : `Tour ${team.currentTurn}/8`}
            </div>

            <button
              type="button"
              onClick={() => handleStepTurn(side, 1)}
              disabled={team.currentTurn >= 8}
              aria-label={`Incrémenter tour Équipe ${side}`}
              className="w-7 h-7 flex items-center justify-center rounded border border-[#1E1915] bg-[#0D2042] hover:bg-[#16315e] disabled:opacity-40 disabled:cursor-not-allowed text-white cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Turn Markers 1..8 (Dugout track) */}
        <div
          role="group"
          aria-label={`Marqueurs de tour 1 à 8 Équipe ${side}`}
          className="grid grid-cols-8 gap-1"
        >
          {Array.from({ length: 8 }, (_, idx) => {
            const marker = idx + 1;
            const displayNumber = half === 2 ? marker + 8 : marker;
            const isCurrent = team.currentTurn === marker;
            const isCompleted = team.currentTurn > marker;

            return (
              <button
                key={marker}
                type="button"
                onClick={() => handleSetTurnMarker(side, marker)}
                aria-pressed={isCurrent}
                aria-label={`Équipe ${side} Tour ${displayNumber}`}
                className={`h-7 rounded-sm border font-mono-num text-xs font-bold transition-colors cursor-pointer ${
                  isCurrent
                    ? 'bg-[#750d0d] text-[#FDE047] border-[#EAB308] shadow-inner ring-1 ring-[#1E1915]'
                    : isCompleted
                      ? 'bg-[#d8c498] text-[#1E1915]/75 border-[#8c7853]'
                      : 'bg-white hover:bg-amber-50 text-[#1E1915] border-[#8c7853]'
                }`}
              >
                {displayNumber}
              </button>
            );
          })}
        </div>

        {/* Per-turn action markers (1/tour) */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5 text-[11px]">
          <span className="font-semibold text-stone-700">Actions du tour :</span>
          <div className="flex flex-wrap items-center gap-1">
            {ACTION_MARKER_ITEMS.map((item) => {
              const used = team.turnMarkers[item.key];
              return (
                <button
                  key={item.key}
                  type="button"
                  title={item.title}
                  aria-pressed={used}
                  aria-label={`Équipe ${side} marqueur ${item.label}`}
                  onClick={() => handleToggleActionMarker(side, item.key)}
                  className={`px-2 py-0.5 rounded-sm border font-semibold transition-colors cursor-pointer ${
                    used
                      ? 'bg-[#0D2042] text-amber-300 border-[#1E1915] line-through'
                      : 'bg-[#faf4e4] hover:bg-amber-100 text-[#1E1915] border-[#8c7853]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      data-testid="turn-counter"
      aria-label="Compteur de tours"
      className="border-2 border-[#1E1915] bg-[#f8f0da] rounded-sm overflow-hidden mb-2.5"
    >
      {/* Top control bar */}
      <div className="navy-header text-white px-2.5 py-1.5 flex flex-wrap items-center justify-between gap-2 border-b border-[#1E1915]">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-300 shrink-0" />
          <span className="font-display text-xs font-extrabold tracking-wider uppercase">
            Compteur de tours
          </span>
        </div>

        {/* Half selector */}
        <div className="flex items-center gap-1 text-[11px]" role="group" aria-label="Mi-temps">
          <button
            type="button"
            onClick={() => handleSwitchHalf(1)}
            aria-pressed={half === 1}
            className={`px-2 py-0.5 rounded-sm font-semibold cursor-pointer transition-colors ${
              half === 1
                ? 'bg-amber-400 text-amber-950'
                : 'bg-white/10 text-stone-200 hover:bg-white/20'
            }`}
          >
            1re Mi-temps (1–8)
          </button>
          <button
            type="button"
            onClick={() => handleSwitchHalf(2)}
            aria-pressed={half === 2}
            className={`px-2 py-0.5 rounded-sm font-semibold cursor-pointer transition-colors ${
              half === 2
                ? 'bg-amber-400 text-amber-950'
                : 'bg-white/10 text-stone-200 hover:bg-white/20'
            }`}
          >
            2e Mi-temps (9–16)
          </button>
        </div>

        {/* Game management quick actions */}
        <div className="no-print flex items-center gap-1.5 text-[11px]">
          <button
            type="button"
            onClick={handleNextActiveTurn}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-[#750d0d] hover:bg-[#9d1717] text-white border border-[#EAB308]/70 font-semibold cursor-pointer transition-colors"
          >
            <ArrowRightLeft className="w-3 h-3" />
            <span>Tour suivant</span>
          </button>
          <button
            type="button"
            onClick={handleResetTurnTrack}
            title="Remettre les marqueurs de tour et d’actions à zéro"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-white/15 hover:bg-white/25 text-stone-100 font-semibold cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>RAZ tours</span>
          </button>
        </div>
      </div>

      {/* Mirrored Team A & Team B turn panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#1E1915]">
        {renderTeamTurnPanel('A', match.teamA)}
        {renderTeamTurnPanel('B', match.teamB)}
      </div>
    </div>
  );
};
