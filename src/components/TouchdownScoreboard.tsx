import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { TeamSheetState, TeamSide } from '../types/bloodbowl';
import {
  calculateTeamScore,
  getPlayerTdSum,
  stepTeamScore,
} from '../utils/bloodbowlRules';

interface TouchdownScoreboardProps {
  teamA: TeamSheetState;
  teamB: TeamSheetState;
  onUpdateTeam: (
    side: TeamSide,
    updater: (team: TeamSheetState) => TeamSheetState
  ) => void;
  onResetManualScores: () => void;
}

export const TouchdownScoreboard: React.FC<TouchdownScoreboardProps> = ({
  teamA,
  teamB,
  onUpdateTeam,
  onResetManualScores,
}) => {
  const scoreA = calculateTeamScore(teamA);
  const scoreB = calculateTeamScore(teamB);
  const playerSumA = getPlayerTdSum(teamA);
  const playerSumB = getPlayerTdSum(teamB);

  const hasManualOverride =
    teamA.manualScoreOverride !== null || teamB.manualScoreOverride !== null;

  const parseIntOrZero = (raw: string) => {
    const n = parseInt(raw.replace(/\s+/g, ''), 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };

  const renderTeamControl = (
    side: TeamSide,
    score: number,
    inputId: string
  ) => (
    <div className="flex flex-col items-center gap-1">
      <label htmlFor={inputId} className="sr-only">
        Score Équipe {side}
      </label>
      <input
        id={inputId}
        type="number"
        min={0}
        value={score}
        onChange={(e) => {
          const val = parseIntOrZero(e.target.value);
          onUpdateTeam(side, (t) => ({
            ...t,
            manualScoreOverride: val === getPlayerTdSum(t) ? null : val,
          }));
        }}
        className="w-12 h-11 text-center font-display text-xl font-black bg-white border-2 border-[#1E1915] rounded shadow-inner font-mono-num focus:outline-none focus:ring-2 focus:ring-[#9d1717]"
      />
      <div className="no-print flex items-center gap-1">
        <button
          type="button"
          disabled={score <= 0}
          onClick={() => onUpdateTeam(side, (t) => stepTeamScore(t, -1))}
          aria-label={`Retirer un touchdown Équipe ${side}`}
          title={`-1 TD Équipe ${side}`}
          className="w-6 h-6 flex items-center justify-center rounded-sm border border-[#1E1915] bg-[#efe2c0] hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-[#1E1915] cursor-pointer transition-colors"
        >
          <Minus className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => onUpdateTeam(side, (t) => stepTeamScore(t, 1))}
          aria-label={`Ajouter un touchdown Équipe ${side}`}
          title={`+1 TD Équipe ${side}`}
          className="h-6 px-1.5 flex items-center justify-center gap-0.5 rounded-sm border border-[#1E1915] bg-[#750d0d] hover:bg-[#9d1717] text-[#FDE047] font-mono-num text-[10px] font-bold cursor-pointer transition-colors"
        >
          <Plus className="w-3 h-3" />
          <span>TD</span>
        </button>
      </div>
    </div>
  );

  return (
    <div
      data-testid="touchdown-scoreboard"
      className="lg:col-span-2 flex flex-col items-center justify-center py-1 gap-1"
    >
      <div className="font-display text-2xl sm:text-3xl font-black italic tracking-tight text-[#9d1717] drop-shadow-[0_2px_0_#facc15]">
        VS
      </div>
      <div className="font-display text-[10px] font-extrabold tracking-widest uppercase text-stone-700">
        Touchdowns
      </div>

      <div className="flex items-start gap-1.5">
        {renderTeamControl('A', scoreA, 'recto-score-a')}
        <span className="font-black text-xl text-[#9d1717] mt-2">-</span>
        {renderTeamControl('B', scoreB, 'recto-score-b')}
      </div>

      {hasManualOverride && (
        <button
          type="button"
          onClick={onResetManualScores}
          title={`Somme des TD joueurs : ${playerSumA} - ${playerSumB}`}
          className="no-print text-[10px] underline text-[#750d0d] hover:text-[#9d1717] cursor-pointer mt-0.5"
        >
          Auto (joueurs : {playerSumA}-{playerSumB})
        </button>
      )}
    </div>
  );
};
