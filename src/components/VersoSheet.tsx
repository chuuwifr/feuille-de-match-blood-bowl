import React from 'react';
import { Award, Dices, Plus, Trash2 } from 'lucide-react';
import { MatchSheetState, TeamSheetState, TeamSide } from '../types/bloodbowl';
import {
  calculateInducementBudgets,
  calculatePlayerPsp,
  calculatePopularityFactor,
  calculatePostMatchGains,
  calculateTeamScore,
  evaluateDedicatedFansChange,
  evaluateExpensiveMistakes,
  formatGold,
  getKickoffEventByRoll,
  getMatchOutcome,
} from '../utils/bloodbowlRules';
import {
  CrimsonBanner,
  HelmetIllustration,
  SheetFrame,
  SpikedBallIllustration,
} from './SheetFrame';

interface VersoSheetProps {
  match: MatchSheetState;
  onUpdateMatch: (updater: (prev: MatchSheetState) => MatchSheetState) => void;
}

const LaurelScoreBadge: React.FC<{ scoreA: number; scoreB: number }> = ({
  scoreA,
  scoreB,
}) => (
  <div className="relative w-full bg-[#101824] border-2 border-[#EAB308] rounded-md p-2 text-center shadow-inner flex flex-col items-center justify-center">
    <div className="crimson-banner px-2.5 py-0.5 rounded-sm border border-[#EAB308] mb-2">
      <span className="font-display text-[10px] font-extrabold tracking-wider text-white uppercase whitespace-nowrap">
        SCORE DU MATCH
      </span>
    </div>
    <div className="relative flex items-center justify-center gap-1.5 my-1">
      {/* Left laurel accent */}
      <svg viewBox="0 0 28 48" className="w-4 h-8 text-amber-400 shrink-0" aria-hidden="true" fill="currentColor">
        <path d="M22 44C10 38 6 24 12 8c2 6 2 11 0 16 4-4 7-9 7-15 3 6 2 14-2 20 4-2 7-5 9-9-1 7-4 15-4 24z" />
      </svg>
      <div className="flex items-center gap-1">
        <span
          data-testid="verso-score-a"
          className="w-9 h-10 flex items-center justify-center bg-white border-2 border-[#EAB308] rounded font-display text-xl font-black text-[#1E1915] font-mono-num"
        >
          {scoreA}
        </span>
        <span className="text-amber-400 font-black text-lg">-</span>
        <span
          data-testid="verso-score-b"
          className="w-9 h-10 flex items-center justify-center bg-white border-2 border-[#EAB308] rounded font-display text-xl font-black text-[#1E1915] font-mono-num"
        >
          {scoreB}
        </span>
      </div>
      {/* Right laurel accent */}
      <svg viewBox="0 0 28 48" className="w-4 h-8 text-amber-400 shrink-0 scale-x-[-1]" aria-hidden="true" fill="currentColor">
        <path d="M22 44C10 38 6 24 12 8c2 6 2 11 0 16 4-4 7-9 7-15 3 6 2 14-2 20 4-2 7-5 9-9-1 7-4 15-4 24z" />
      </svg>
    </div>
    <div className="text-[11px] font-semibold text-amber-200 mt-1">
      {scoreA > scoreB
        ? 'Victoire Équipe A'
        : scoreB > scoreA
          ? 'Victoire Équipe B'
          : 'Match Nul'}
    </div>
  </div>
);

export const VersoSheet: React.FC<VersoSheetProps> = ({
  match,
  onUpdateMatch,
}) => {
  const scoreA = calculateTeamScore(match.teamA);
  const scoreB = calculateTeamScore(match.teamB);
  const fpA = calculatePopularityFactor(match.teamA);
  const fpB = calculatePopularityFactor(match.teamB);
  const budgets = calculateInducementBudgets(match.teamA, match.teamB);

  const gainsA = calculatePostMatchGains(
    match.teamA,
    match.teamB,
    scoreA,
    fpA,
    fpB
  );
  const gainsB = calculatePostMatchGains(
    match.teamB,
    match.teamA,
    scoreB,
    fpB,
    fpA
  );

  const outcomeA = getMatchOutcome(scoreA, scoreB, 'A');
  const outcomeB = getMatchOutcome(scoreA, scoreB, 'B');

  const autoFdA = evaluateDedicatedFansChange(
    match.teamA.dedicatedFans,
    match.teamA.fdPostMatchRoll,
    outcomeA,
    match.teamA.conceded && !match.teamA.concededWithoutPenalty
  );
  const autoFdB = evaluateDedicatedFansChange(
    match.teamB.dedicatedFans,
    match.teamB.fdPostMatchRoll,
    outcomeB,
    match.teamB.conceded && !match.teamB.concededWithoutPenalty
  );

  const effectiveFdChangeA = match.teamA.fdManualChange ?? autoFdA.change;
  const effectiveFdChangeB = match.teamB.fdManualChange ?? autoFdB.change;

  const treasuryBeforeMistakesA = Math.max(
    0,
    match.teamA.treasury -
      budgets.treasuryAddedA +
      gainsA.totalGains -
      match.teamA.postMatchPurchasesCost
  );
  const treasuryBeforeMistakesB = Math.max(
    0,
    match.teamB.treasury -
      budgets.treasuryAddedB +
      gainsB.totalGains -
      match.teamB.postMatchPurchasesCost
  );

  const mistakeA = evaluateExpensiveMistakes(
    treasuryBeforeMistakesA,
    match.teamA.expensiveMistakeRoll,
    match.teamA.expensiveMistakeSubRoll
  );
  const mistakeB = evaluateExpensiveMistakes(
    treasuryBeforeMistakesB,
    match.teamB.expensiveMistakeRoll,
    match.teamB.expensiveMistakeSubRoll
  );

  const updateTeam = (
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

  const updateTurn = (
    turnNumber: number,
    side: 'teamA' | 'teamB',
    value: string
  ) => {
    onUpdateMatch((prev) => ({
      ...prev,
      turns: prev.turns.map((t) =>
        t.turn === turnNumber ? { ...t, [side]: value } : t
      ),
    }));
  };

  const parseIntOrZero = (raw: string) => {
    const n = parseInt(raw.replace(/\s+/g, ''), 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };

  const rollFdD6 = (side: TeamSide) => {
    const roll = Math.floor(Math.random() * 6) + 1;
    updateTeam(side, (t) => ({
      ...t,
      fdPostMatchRoll: roll,
      fdManualChange: null,
    }));
  };

  const rollMistakeForTeam = (side: TeamSide) => {
    const rollD6 = Math.floor(Math.random() * 6) + 1;
    const d3 = Math.floor(Math.random() * 3) + 1;
    const twoD6 =
      Math.floor(Math.random() * 6) + 1 + (Math.floor(Math.random() * 6) + 1);
    updateTeam(side, (t) => ({
      ...t,
      expensiveMistakeRoll: rollD6,
      expensiveMistakeSubRoll: rollD6 === 1 ? twoD6 : d3,
    }));
  };

  const quickRollKickoff = () => {
    const roll =
      Math.floor(Math.random() * 6) + 1 + (Math.floor(Math.random() * 6) + 1);
    const ev = getKickoffEventByRoll(roll);
    onUpdateMatch((prev) => ({
      ...prev,
      kickoffEventsLog: [
        ...prev.kickoffEventsLog,
        {
          phase: `Engagement #${prev.kickoffEventsLog.length + 1}`,
          roll2d6: roll,
          title: ev.title,
        },
      ],
    }));
  };

  const pspEligibleA = match.teamA.players
    .map((p) => ({ player: p, psp: calculatePlayerPsp(p, match.teamA) }))
    .filter((x) => x.psp >= 3);
  const pspEligibleB = match.teamB.players
    .map((p) => ({ player: p, psp: calculatePlayerPsp(p, match.teamB) }))
    .filter((x) => x.psp >= 3);

  const injuredA = match.teamA.players.filter(
    (p) => p.rpm || p.sequelles || p.bp > 0
  );
  const injuredB = match.teamB.players.filter(
    (p) => p.rpm || p.sequelles || p.bp > 0
  );

  const renderHalfTable = (title: string, startTurn: number, endTurn: number) => {
    const rows = match.turns.filter(
      (t) => t.turn >= startTurn && t.turn <= endTurn
    );
    return (
      <section aria-label={title}>
        <CrimsonBanner title={title} />
        <div className="border-2 border-[#1E1915] bg-white/85 rounded-sm overflow-hidden">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="navy-header text-white font-display">
                <th className="py-1.5 px-2 w-12 bg-[#750d0d] border-r border-[#1E1915]">
                  Tour
                </th>
                <th className="py-1.5 px-3 border-r border-[#1E1915] text-center">
                  ÉQUIPE A {match.teamA.name ? `— ${match.teamA.name}` : ''}
                </th>
                <th className="py-1.5 px-3 text-center">
                  ÉQUIPE B {match.teamB.name ? `— ${match.teamB.name}` : ''}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E1915]/30">
              {rows.map((row, idx) => (
                <tr
                  key={row.turn}
                  className={idx % 2 === 0 ? 'bg-white/90' : 'bg-[#faf3df]/85'}
                >
                  <td className="navy-header text-white font-mono-num font-bold text-center py-1.5 border-r border-[#1E1915]">
                    {row.turn}
                  </td>
                  <td className="p-0 border-r border-[#1E1915]/40">
                    <input
                      type="text"
                      aria-label={`Tour ${row.turn} Équipe A`}
                      value={row.teamA}
                      onChange={(e) => updateTurn(row.turn, 'teamA', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-transparent focus:outline-none focus:bg-white text-xs"
                    />
                  </td>
                  <td className="p-0">
                    <input
                      type="text"
                      aria-label={`Tour ${row.turn} Équipe B`}
                      value={row.teamB}
                      onChange={(e) => updateTurn(row.turn, 'teamB', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-transparent focus:outline-none focus:bg-white text-xs"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  };

  return (
    <SheetFrame testId="verso-sheet">
      {/* Top Header */}
      <div className="relative navy-header border-b-[3px] border-[#1E1915] px-3 py-2 overflow-hidden">
        <div className="checker-strip absolute top-0 left-0 w-20 h-full opacity-90 border-r-2 border-[#1E1915]" />
        <div className="checker-strip absolute top-0 right-0 w-20 h-full opacity-90 border-l-2 border-[#1E1915]" />

        <div className="relative z-10 flex items-center justify-between gap-2 max-w-[960px] mx-auto">
          <HelmetIllustration className="w-12 h-12 sm:w-16 sm:h-16 drop-shadow-lg shrink-0" />
          <div className="flex-1 px-2">
            <div className="crimson-banner py-1.5 px-4 border-y-2 border-[#EAB308] text-center shadow-md rounded-sm">
              <div className="flex items-center justify-center gap-2">
                <span className="text-[#FDE047] text-xs" aria-hidden="true">★</span>
                <h2 className="font-display text-base sm:text-xl font-extrabold tracking-wider text-white uppercase">
                  ANNOTATIONS DU MATCH
                </h2>
                <span className="text-[#FDE047] text-xs" aria-hidden="true">★</span>
              </div>
            </div>
          </div>
          <SpikedBallIllustration className="w-12 h-12 sm:w-16 sm:h-16 drop-shadow-lg shrink-0" />
        </div>
      </div>

      {/* Main Content */}
      <div className="p-2.5 sm:p-4 space-y-3 text-[#1E1915]">
        {/* First Half */}
        {renderHalfTable('PREMIÈRE MI-TEMPS (Tours 1 à 8)', 1, 8)}

        {/* Second Half */}
        {renderHalfTable('DEUXIÈME MI-TEMPS (Tours 9 à 16)', 9, 16)}

        {/* Quick Kickoff Events Bar */}
        <div className="no-print border border-[#8c7853] bg-[#efe2c0]/75 rounded-sm px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display font-bold text-[#750d0d]">
              Coups d’envoi enregistrés :
            </span>
            {match.kickoffEventsLog.length === 0 ? (
              <span className="text-stone-600">Aucun événement journalisé</span>
            ) : (
              match.kickoffEventsLog.map((ev, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-stone-400 rounded font-mono-num"
                >
                  <strong>{ev.roll2d6}</strong> · {ev.title}
                  <button
                    type="button"
                    aria-label={`Supprimer l'événement ${ev.title}`}
                    onClick={() =>
                      onUpdateMatch((p) => ({
                        ...p,
                        kickoffEventsLog: p.kickoffEventsLog.filter((_, idx) => idx !== i),
                      }))
                    }
                    className="text-red-700 hover:text-red-900 ml-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))
            )}
          </div>
          <button
            type="button"
            onClick={quickRollKickoff}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0D2042] hover:bg-[#16315e] text-white font-semibold rounded cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tirer Coup d’envoi (2D6)</span>
          </button>
        </div>

        {/* APRÈS-MATCH */}
        <section aria-label="Après-Match">
          <CrimsonBanner title="APRÈS-MATCH" />

          <div className="border-2 border-[#1E1915] bg-white/85 rounded-sm overflow-hidden text-xs">
            {/* Top Gains + Score du Match */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_196px_minmax(0,1fr)] border-b-2 border-[#1E1915]">
              {/* ÉQUIPE A GAINS */}
              <div className="min-w-0 flex flex-col">
                <div className="navy-header text-white font-display font-bold text-center py-1 border-b border-[#1E1915] truncate px-2">
                  ÉQUIPE A {match.teamA.name ? `— ${match.teamA.name}` : ''}
                </div>
                <div className="divide-y divide-[#1E1915]/25 flex-1">
                  <div className="flex items-center justify-between gap-2 px-2.5 py-1.5">
                    <span className="truncate">Gain de base (FP moyen des 2 équipes) :</span>
                    <span className="font-mono-num font-bold whitespace-nowrap shrink-0">
                      {formatGold(gainsA.baseGain)} po
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 px-2.5 py-1.5">
                    <span>
                      Touchdowns ( <strong className="font-mono-num">{scoreA}</strong> × 10 000 po) :
                    </span>
                    <span className="font-mono-num font-bold whitespace-nowrap shrink-0">
                      {formatGold(gainsA.touchdownGain)} po
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-1.5">
                    <span>Bonus de non-temporisation :</span>
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1 cursor-pointer whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={match.teamA.nonStallBonus === true}
                          onChange={() =>
                            updateTeam('A', (t) => ({
                              ...t,
                              nonStallBonus: t.nonStallBonus === true ? null : true,
                            }))
                          }
                          className="accent-[#750d0d]"
                        />
                        <span>Oui (+10 000 po)</span>
                      </label>
                      <label className="inline-flex items-center gap-1 cursor-pointer whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={match.teamA.nonStallBonus === false}
                          onChange={() =>
                            updateTeam('A', (t) => ({
                              ...t,
                              nonStallBonus: t.nonStallBonus === false ? null : false,
                            }))
                          }
                          className="accent-[#0D2042]"
                        />
                        <span>Non (0 po)</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-[#f3e4b8] font-bold">
                    <span>TOTAL DES GAINS :</span>
                    <span
                      data-testid="total-gains-a"
                      className="font-mono-num text-sm text-[#750d0d] whitespace-nowrap shrink-0"
                    >
                      {formatGold(gainsA.totalGains)} po
                    </span>
                  </div>
                </div>
                <div className="no-print px-2.5 py-1 bg-[#faf4e4] border-t border-[#1E1915]/25 flex flex-wrap items-center gap-3 text-[11px]">
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={match.teamA.conceded}
                      onChange={(e) =>
                        updateTeam('A', (t) => ({ ...t, conceded: e.target.checked }))
                      }
                      className="accent-[#750d0d]"
                    />
                    <span>A concédé</span>
                  </label>
                  {match.teamA.conceded && (
                    <label className="inline-flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={match.teamA.concededWithoutPenalty}
                        onChange={(e) =>
                          updateTeam('A', (t) => ({
                            ...t,
                            concededWithoutPenalty: e.target.checked,
                          }))
                        }
                        className="accent-[#0D2042]"
                      />
                      <span>Sans pénalité</span>
                    </label>
                  )}
                  {gainsA.concessionNote && (
                    <span className="text-red-800 font-semibold">{gainsA.concessionNote}</span>
                  )}
                </div>
              </div>

              {/* CENTER SCORE BADGE */}
              <div className="p-2 bg-[#efe2c0] flex items-center justify-center border-y lg:border-y-0 lg:border-x border-[#1E1915]">
                <LaurelScoreBadge scoreA={scoreA} scoreB={scoreB} />
              </div>

              {/* ÉQUIPE B GAINS */}
              <div className="min-w-0 flex flex-col">
                <div className="navy-header text-white font-display font-bold text-center py-1 border-b border-[#1E1915] truncate px-2">
                  ÉQUIPE B {match.teamB.name ? `— ${match.teamB.name}` : ''}
                </div>
                <div className="divide-y divide-[#1E1915]/25 flex-1">
                  <div className="flex items-center justify-between gap-2 px-2.5 py-1.5">
                    <span className="truncate">Gain de base (FP moyen des 2 équipes) :</span>
                    <span className="font-mono-num font-bold whitespace-nowrap shrink-0">
                      {formatGold(gainsB.baseGain)} po
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 px-2.5 py-1.5">
                    <span>
                      Touchdowns ( <strong className="font-mono-num">{scoreB}</strong> × 10 000 po) :
                    </span>
                    <span className="font-mono-num font-bold whitespace-nowrap shrink-0">
                      {formatGold(gainsB.touchdownGain)} po
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-1.5">
                    <span>Bonus de non-temporisation :</span>
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1 cursor-pointer whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={match.teamB.nonStallBonus === true}
                          onChange={() =>
                            updateTeam('B', (t) => ({
                              ...t,
                              nonStallBonus: t.nonStallBonus === true ? null : true,
                            }))
                          }
                          className="accent-[#750d0d]"
                        />
                        <span>Oui (+10 000 po)</span>
                      </label>
                      <label className="inline-flex items-center gap-1 cursor-pointer whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={match.teamB.nonStallBonus === false}
                          onChange={() =>
                            updateTeam('B', (t) => ({
                              ...t,
                              nonStallBonus: t.nonStallBonus === false ? null : false,
                            }))
                          }
                          className="accent-[#0D2042]"
                        />
                        <span>Non (0 po)</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-[#f3e4b8] font-bold">
                    <span>TOTAL DES GAINS :</span>
                    <span
                      data-testid="total-gains-b"
                      className="font-mono-num text-sm text-[#750d0d] whitespace-nowrap shrink-0"
                    >
                      {formatGold(gainsB.totalGains)} po
                    </span>
                  </div>
                </div>
                <div className="no-print px-2.5 py-1 bg-[#faf4e4] border-t border-[#1E1915]/25 flex flex-wrap items-center gap-3 text-[11px]">
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={match.teamB.conceded}
                      onChange={(e) =>
                        updateTeam('B', (t) => ({ ...t, conceded: e.target.checked }))
                      }
                      className="accent-[#750d0d]"
                    />
                    <span>A concédé</span>
                  </label>
                  {match.teamB.conceded && (
                    <label className="inline-flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={match.teamB.concededWithoutPenalty}
                        onChange={(e) =>
                          updateTeam('B', (t) => ({
                            ...t,
                            concededWithoutPenalty: e.target.checked,
                          }))
                        }
                        className="accent-[#0D2042]"
                      />
                      <span>Sans pénalité</span>
                    </label>
                  )}
                  {gainsB.concessionNote && (
                    <span className="text-red-800 font-semibold">{gainsB.concessionNote}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Fans Dévoués (FD) */}
            <div className="grid grid-cols-1 md:grid-cols-2 border-b border-[#1E1915] divide-y md:divide-y-0 md:divide-x divide-[#1E1915]">
              {/* FD A */}
              <div className="px-2.5 py-2 bg-[#faf4e4] flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold">Fans dévoués (FD) : Jet (1D6) :</span>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    aria-label="Jet 1D6 Fans dévoués Équipe A"
                    value={match.teamA.fdPostMatchRoll ?? ''}
                    onChange={(e) => {
                      const val =
                        e.target.value === ''
                          ? null
                          : Math.max(1, Math.min(6, parseIntOrZero(e.target.value) || 1));
                      updateTeam('A', (t) => ({
                        ...t,
                        fdPostMatchRoll: val,
                        fdManualChange: null,
                      }));
                    }}
                    className="w-10 text-center font-mono-num font-bold bg-white border border-stone-500 rounded py-0.5"
                  />
                  <button
                    type="button"
                    onClick={() => rollFdD6('A')}
                    className="no-print inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-300 hover:bg-amber-400 text-amber-950 font-semibold rounded text-[10px] cursor-pointer"
                  >
                    <Dices className="w-3 h-3" />
                    <span>1D6</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Changement :</span>
                  {([1, 0, -1] as const).map((delta) => (
                    <label key={delta} className="inline-flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={effectiveFdChangeA === delta}
                        onChange={() =>
                          updateTeam('A', (t) => ({ ...t, fdManualChange: delta }))
                        }
                        className="accent-[#750d0d]"
                      />
                      <span className="font-mono-num">
                        {delta > 0 ? `+${delta}` : delta}
                      </span>
                    </label>
                  ))}
                  <span className="font-mono-num text-[11px] font-bold text-[#0D2042]">
                    ({match.teamA.dedicatedFans}→
                    {Math.max(1, Math.min(7, match.teamA.dedicatedFans + effectiveFdChangeA))})
                  </span>
                </div>
              </div>

              {/* FD B */}
              <div className="px-2.5 py-2 bg-[#faf4e4] flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold">Fans dévoués (FD) : Jet (1D6) :</span>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    aria-label="Jet 1D6 Fans dévoués Équipe B"
                    value={match.teamB.fdPostMatchRoll ?? ''}
                    onChange={(e) => {
                      const val =
                        e.target.value === ''
                          ? null
                          : Math.max(1, Math.min(6, parseIntOrZero(e.target.value) || 1));
                      updateTeam('B', (t) => ({
                        ...t,
                        fdPostMatchRoll: val,
                        fdManualChange: null,
                      }));
                    }}
                    className="w-10 text-center font-mono-num font-bold bg-white border border-stone-500 rounded py-0.5"
                  />
                  <button
                    type="button"
                    onClick={() => rollFdD6('B')}
                    className="no-print inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-300 hover:bg-amber-400 text-amber-950 font-semibold rounded text-[10px] cursor-pointer"
                  >
                    <Dices className="w-3 h-3" />
                    <span>1D6</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Changement :</span>
                  {([1, 0, -1] as const).map((delta) => (
                    <label key={delta} className="inline-flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={effectiveFdChangeB === delta}
                        onChange={() =>
                          updateTeam('B', (t) => ({ ...t, fdManualChange: delta }))
                        }
                        className="accent-[#750d0d]"
                      />
                      <span className="font-mono-num">
                        {delta > 0 ? `+${delta}` : delta}
                      </span>
                    </label>
                  ))}
                  <span className="font-mono-num text-[11px] font-bold text-[#0D2042]">
                    ({match.teamB.dedicatedFans}→
                    {Math.max(1, Math.min(7, match.teamB.dedicatedFans + effectiveFdChangeB))})
                  </span>
                </div>
              </div>
            </div>

            {/* DÉPENSE DES PSP */}
            <div className="grid grid-cols-1 md:grid-cols-12 border-b border-[#1E1915]">
              <div className="md:col-span-4 divide-y divide-[#1E1915]/25">
                {([0, 1] as const).map((slot) => (
                  <input
                    key={slot}
                    type="text"
                    aria-label={`Dépense des PSP ligne ${slot + 1} Équipe A`}
                    value={match.teamA.pspSpentNotes[slot]}
                    onChange={(e) =>
                      updateTeam('A', (t) => {
                        const next: [string, string] = [...t.pspSpentNotes] as [string, string];
                        next[slot] = e.target.value;
                        return { ...t, pspSpentNotes: next };
                      })
                    }
                    placeholder={`Amélioration A #${slot + 1}...`}
                    className="w-full px-2.5 py-1.5 bg-white/90 focus:outline-none focus:bg-white"
                  />
                ))}
              </div>
              <div className="md:col-span-4 bg-[#f3e4b8] border-y md:border-y-0 md:border-x border-[#1E1915] flex flex-col items-center justify-center p-2 text-center">
                <div className="font-display font-extrabold text-sm text-[#750d0d] flex items-center gap-1">
                  <Award className="w-4 h-4" />
                  <span>DÉPENSE DES PSP</span>
                </div>
                {(pspEligibleA.length > 0 || pspEligibleB.length > 0) && (
                  <div className="no-print text-[10px] text-stone-700 mt-1 leading-snug">
                    {pspEligibleA.length > 0 && (
                      <div>
                        A (≥3 PSP) :{' '}
                        {pspEligibleA
                          .map((x) => `${x.player.name || `#${x.player.number}`} (${x.psp})`)
                          .join(', ')}
                      </div>
                    )}
                    {pspEligibleB.length > 0 && (
                      <div>
                        B (≥3 PSP) :{' '}
                        {pspEligibleB
                          .map((x) => `${x.player.name || `#${x.player.number}`} (${x.psp})`)
                          .join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="md:col-span-4 divide-y divide-[#1E1915]/25">
                {([0, 1] as const).map((slot) => (
                  <input
                    key={slot}
                    type="text"
                    aria-label={`Dépense des PSP ligne ${slot + 1} Équipe B`}
                    value={match.teamB.pspSpentNotes[slot]}
                    onChange={(e) =>
                      updateTeam('B', (t) => {
                        const next: [string, string] = [...t.pspSpentNotes] as [string, string];
                        next[slot] = e.target.value;
                        return { ...t, pspSpentNotes: next };
                      })
                    }
                    placeholder={`Amélioration B #${slot + 1}...`}
                    className="w-full px-2.5 py-1.5 bg-white/90 focus:outline-none focus:bg-white"
                  />
                ))}
              </div>
            </div>

            {/* RECRUTEMENTS, LICENCIEMENTS ET RETRAITES TEMPORAIRES */}
            <div className="grid grid-cols-1 md:grid-cols-12 border-b border-[#1E1915]">
              <div className="md:col-span-4 divide-y divide-[#1E1915]/25">
                {([0, 1] as const).map((slot) => (
                  <input
                    key={slot}
                    type="text"
                    aria-label={`Mouvements effectif ligne ${slot + 1} Équipe A`}
                    value={match.teamA.rosterMovesNotes[slot]}
                    onChange={(e) =>
                      updateTeam('A', (t) => {
                        const next: [string, string] = [...t.rosterMovesNotes] as [string, string];
                        next[slot] = e.target.value;
                        return { ...t, rosterMovesNotes: next };
                      })
                    }
                    placeholder={`Recrutement / licenciement A #${slot + 1}...`}
                    className="w-full px-2.5 py-1.5 bg-white/90 focus:outline-none focus:bg-white"
                  />
                ))}
              </div>
              <div className="md:col-span-4 bg-[#f3e4b8] border-y md:border-y-0 md:border-x border-[#1E1915] flex flex-col items-center justify-center p-2 text-center">
                <div className="font-display font-extrabold text-xs text-[#750d0d] leading-tight">
                  RECRUTEMENTS, LICENCIEMENTS
                  <br />
                  ET RETRAITES TEMPORAIRES
                </div>
                {(injuredA.length > 0 || injuredB.length > 0) && (
                  <div className="no-print text-[10px] text-red-900 mt-1 leading-snug">
                    {injuredA.length > 0 && (
                      <div>
                        A blessés :{' '}
                        {injuredA
                          .map(
                            (p) =>
                              `${p.name || `#${p.number}`} (${[
                                p.sequelles,
                                p.rpm ? 'RPM' : '',
                                p.bp ? `${p.bp} BP` : '',
                              ]
                                .filter(Boolean)
                                .join(' ')})`
                          )
                          .join(', ')}
                      </div>
                    )}
                    {injuredB.length > 0 && (
                      <div>
                        B blessés :{' '}
                        {injuredB
                          .map(
                            (p) =>
                              `${p.name || `#${p.number}`} (${[
                                p.sequelles,
                                p.rpm ? 'RPM' : '',
                                p.bp ? `${p.bp} BP` : '',
                              ]
                                .filter(Boolean)
                                .join(' ')})`
                          )
                          .join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="md:col-span-4 divide-y divide-[#1E1915]/25">
                {([0, 1] as const).map((slot) => (
                  <input
                    key={slot}
                    type="text"
                    aria-label={`Mouvements effectif ligne ${slot + 1} Équipe B`}
                    value={match.teamB.rosterMovesNotes[slot]}
                    onChange={(e) =>
                      updateTeam('B', (t) => {
                        const next: [string, string] = [...t.rosterMovesNotes] as [string, string];
                        next[slot] = e.target.value;
                        return { ...t, rosterMovesNotes: next };
                      })
                    }
                    placeholder={`Recrutement / licenciement B #${slot + 1}...`}
                    className="w-full px-2.5 py-1.5 bg-white/90 focus:outline-none focus:bg-white"
                  />
                ))}
              </div>
            </div>

            {/* Bottom Treasury & ERREURS COÛTEUSES */}
            <div className="grid grid-cols-1 md:grid-cols-12 items-stretch">
              {/* Treasury A */}
              <div className="md:col-span-4 divide-y divide-[#1E1915]/25 bg-white/90 flex flex-col justify-between">
                <div className="flex items-center justify-between px-2.5 py-1.5">
                  <span className="font-semibold">Trésorerie d’équipe :</span>
                  <span className="font-mono-num font-bold">
                    {formatGold(treasuryBeforeMistakesA)} po
                  </span>
                </div>
                <div className="no-print flex items-center justify-between gap-2 px-2.5 py-1 bg-[#faf4e4] text-[11px]">
                  <label htmlFor="purchases-a" className="text-stone-700">
                    Achats post-match :
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      id="purchases-a"
                      type="number"
                      step={5000}
                      min={0}
                      value={match.teamA.postMatchPurchasesCost || ''}
                      placeholder="0"
                      onChange={(e) =>
                        updateTeam('A', (t) => ({
                          ...t,
                          postMatchPurchasesCost: parseIntOrZero(e.target.value),
                        }))
                      }
                      className="w-20 text-right font-mono-num px-1 py-0.5 bg-white border border-stone-400 rounded"
                    />
                    <span>po</span>
                  </div>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#f3e4b8] font-bold">
                  <span>Trésorerie finale :</span>
                  <span
                    data-testid="final-treasury-a"
                    className="font-mono-num text-sm text-[#0D2042]"
                  >
                    {formatGold(mistakeA.finalTreasury)} po
                  </span>
                </div>
              </div>

              {/* Center ERREURS COÛTEUSES */}
              <div className="md:col-span-4 border-y md:border-y-0 md:border-x border-[#1E1915] bg-[#faf4e4] flex flex-col">
                <div className="crimson-banner text-white font-display font-bold text-center py-1 text-xs border-b border-[#1E1915]">
                  ERREURS COÛTEUSES
                </div>
                <div className="p-2 space-y-1.5 flex-1 flex flex-col justify-center">
                  {/* Roll A */}
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-semibold">Jet A (1D6) :</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        max={6}
                        aria-label="Jet d'erreur coûteuse Équipe A"
                        value={match.teamA.expensiveMistakeRoll ?? ''}
                        onChange={(e) =>
                          updateTeam('A', (t) => ({
                            ...t,
                            expensiveMistakeRoll:
                              e.target.value === ''
                                ? null
                                : Math.max(1, Math.min(6, parseIntOrZero(e.target.value) || 1)),
                          }))
                        }
                        className="w-10 text-center font-mono-num font-bold bg-white border border-stone-500 rounded py-0.5"
                      />
                      <button
                        type="button"
                        onClick={() => rollMistakeForTeam('A')}
                        className="no-print px-1.5 py-0.5 bg-[#0D2042] hover:bg-[#16315e] text-white rounded text-[10px] font-semibold cursor-pointer"
                      >
                        1D6
                      </button>
                    </div>
                  </div>
                  <div className="text-[10px] text-stone-700 leading-tight">
                    A : <strong>{mistakeA.severity}</strong> — {mistakeA.ruleDetail}
                  </div>

                  {/* Roll B */}
                  <div className="flex items-center justify-between gap-2 text-[11px] pt-1 border-t border-[#1E1915]/20">
                    <span className="font-semibold">Jet B (1D6) :</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        max={6}
                        aria-label="Jet d'erreur coûteuse Équipe B"
                        value={match.teamB.expensiveMistakeRoll ?? ''}
                        onChange={(e) =>
                          updateTeam('B', (t) => ({
                            ...t,
                            expensiveMistakeRoll:
                              e.target.value === ''
                                ? null
                                : Math.max(1, Math.min(6, parseIntOrZero(e.target.value) || 1)),
                          }))
                        }
                        className="w-10 text-center font-mono-num font-bold bg-white border border-stone-500 rounded py-0.5"
                      />
                      <button
                        type="button"
                        onClick={() => rollMistakeForTeam('B')}
                        className="no-print px-1.5 py-0.5 bg-[#0D2042] hover:bg-[#16315e] text-white rounded text-[10px] font-semibold cursor-pointer"
                      >
                        1D6
                      </button>
                    </div>
                  </div>
                  <div className="text-[10px] text-stone-700 leading-tight">
                    B : <strong>{mistakeB.severity}</strong> — {mistakeB.ruleDetail}
                  </div>
                </div>
              </div>

              {/* Treasury B */}
              <div className="md:col-span-4 divide-y divide-[#1E1915]/25 bg-white/90 flex flex-col justify-between">
                <div className="flex items-center justify-between px-2.5 py-1.5">
                  <span className="font-semibold">Trésorerie d’équipe :</span>
                  <span className="font-mono-num font-bold">
                    {formatGold(treasuryBeforeMistakesB)} po
                  </span>
                </div>
                <div className="no-print flex items-center justify-between gap-2 px-2.5 py-1 bg-[#faf4e4] text-[11px]">
                  <label htmlFor="purchases-b" className="text-stone-700">
                    Achats post-match :
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      id="purchases-b"
                      type="number"
                      step={5000}
                      min={0}
                      value={match.teamB.postMatchPurchasesCost || ''}
                      placeholder="0"
                      onChange={(e) =>
                        updateTeam('B', (t) => ({
                          ...t,
                          postMatchPurchasesCost: parseIntOrZero(e.target.value),
                        }))
                      }
                      className="w-20 text-right font-mono-num px-1 py-0.5 bg-white border border-stone-400 rounded"
                    />
                    <span>po</span>
                  </div>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#f3e4b8] font-bold">
                  <span>Trésorerie finale :</span>
                  <span
                    data-testid="final-treasury-b"
                    className="font-mono-num text-sm text-[#0D2042]"
                  >
                    {formatGold(mistakeB.finalTreasury)} po
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Ribbon */}
        <div className="pt-1">
          <CrimsonBanner title="VERSO – TOURS & APRÈS-MATCH" />
        </div>
      </div>
    </SheetFrame>
  );
};
