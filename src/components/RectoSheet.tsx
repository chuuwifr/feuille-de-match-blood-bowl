import React from 'react';
import { BookOpen, Dices, FileSpreadsheet, Shield, Sparkles } from 'lucide-react';
import { SEQUELLE_OPTIONS, WEATHER_TABLE } from '../data/bloodbowlRulesData';
import {
  MatchSheetState,
  PlayerMatchRow,
  TeamSheetState,
  TeamSide,
} from '../types/bloodbowl';
import {
  calculateInducementBudgets,
  calculatePlayerPsp,
  calculatePopularityFactor,
  formatGold,
  getPrayerByRoll,
  getTeamDef,
  getTeamSpecialRules,
  getWeatherByRoll,
} from '../utils/bloodbowlRules';
import {
  CrimsonBanner,
  HelmetIllustration,
  SheetFrame,
  SpikedBallIllustration,
} from './SheetFrame';
import { TouchdownScoreboard } from './TouchdownScoreboard';
import { TurnCounter } from './TurnCounter';

interface RectoSheetProps {
  match: MatchSheetState;
  onUpdateMatch: (updater: (prev: MatchSheetState) => MatchSheetState) => void;
  onOpenTeamModal: (side: TeamSide, initialTab?: 'catalog' | 'import') => void;
  onOpenInducementModal: (side: TeamSide) => void;
}

export const RectoSheet: React.FC<RectoSheetProps> = ({
  match,
  onUpdateMatch,
  onOpenTeamModal,
  onOpenInducementModal,
}) => {
  const budgets = calculateInducementBudgets(match.teamA, match.teamB);
  const fpA = calculatePopularityFactor(match.teamA);
  const fpB = calculatePopularityFactor(match.teamB);

  const weatherInfo =
    WEATHER_TABLE.find((w) => w.name === match.weatherName) ??
    (match.weatherRoll ? getWeatherByRoll(match.weatherRoll) : WEATHER_TABLE[2]);

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

  const updatePlayer = (
    side: TeamSide,
    index: number,
    updater: (player: PlayerMatchRow) => PlayerMatchRow
  ) => {
    updateTeam(side, (team) => {
      const nextPlayers = [...team.players];
      nextPlayers[index] = updater(nextPlayers[index]);
      return { ...team, players: nextPlayers };
    });
  };

  const rollFanD3 = (side: TeamSide) => {
    const roll = Math.floor(Math.random() * 3) + 1;
    updateTeam(side, (t) => ({ ...t, fanRollD3: roll }));
  };

  const rollWeather2D6 = () => {
    const roll =
      Math.floor(Math.random() * 6) + 1 + (Math.floor(Math.random() * 6) + 1);
    const entry = getWeatherByRoll(roll);
    onUpdateMatch((prev) => ({
      ...prev,
      weatherRoll: roll,
      weatherName: entry.name,
    }));
  };

  const rollPrayerForSide = (side: TeamSide, slotIndex: 0 | 1) => {
    const roll = Math.floor(Math.random() * 16) + 1;
    const prayer = getPrayerByRoll(roll);
    updateTeam(side, (t) => {
      const nextPrayers: [string, string] = [...t.prayers] as [string, string];
      nextPrayers[slotIndex] = `${prayer.roll}. ${prayer.title}`;
      return {
        ...t,
        prayers: nextPrayers,
        hasPasseParfaitePrayer: t.hasPasseParfaitePrayer || prayer.roll === 10,
        hasReceptionEtourdissantePrayer:
          t.hasReceptionEtourdissantePrayer || prayer.roll === 11,
        hasFrenesieAgressionPrayer:
          t.hasFrenesieAgressionPrayer || prayer.roll === 13,
      };
    });
  };

  const parseIntOrZero = (raw: string) => {
    const cleaned = raw.replace(/\s+/g, '');
    const n = parseInt(cleaned, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };

  const rulesA = getTeamSpecialRules(match.teamA);
  const rulesB = getTeamSpecialRules(match.teamB);
  const defA = getTeamDef(match.teamA.teamId);
  const defB = getTeamDef(match.teamB.teamId);

  const totalsA = match.teamA.players.reduce(
    (acc, p) => ({
      reu: acc.reu + p.reu,
      eli: acc.eli + p.eli,
      int: acc.int + p.int,
      td: acc.td + p.td,
      mvp: acc.mvp + (p.mvp ? 1 : 0),
      agro: acc.agro + p.agro,
      bp: acc.bp + p.bp,
      psp: acc.psp + calculatePlayerPsp(p, match.teamA),
    }),
    { reu: 0, eli: 0, int: 0, td: 0, mvp: 0, agro: 0, bp: 0, psp: 0 }
  );

  const totalsB = match.teamB.players.reduce(
    (acc, p) => ({
      reu: acc.reu + p.reu,
      eli: acc.eli + p.eli,
      int: acc.int + p.int,
      td: acc.td + p.td,
      mvp: acc.mvp + (p.mvp ? 1 : 0),
      agro: acc.agro + p.agro,
      bp: acc.bp + p.bp,
      psp: acc.psp + calculatePlayerPsp(p, match.teamB),
    }),
    { reu: 0, eli: 0, int: 0, td: 0, mvp: 0, agro: 0, bp: 0, psp: 0 }
  );

  return (
    <SheetFrame testId="recto-sheet">
      {/* Top Blood Bowl Header */}
      <div className="relative navy-header border-b-[3px] border-[#1E1915] px-3 py-2.5 overflow-hidden">
        <div className="checker-strip absolute top-0 left-0 w-24 h-full opacity-90 border-r-2 border-[#1E1915]" />
        <div className="checker-strip absolute top-0 right-0 w-24 h-full opacity-90 border-l-2 border-[#1E1915]" />

        <div className="relative z-10 flex items-center justify-between gap-2 max-w-[960px] mx-auto">
          <div className="shrink-0">
            <HelmetIllustration className="w-14 h-14 sm:w-20 sm:h-20 drop-shadow-lg" />
          </div>

          <div className="text-center flex-1 min-w-0">
            <h1 className="font-display text-2xl sm:text-4xl font-black tracking-wider text-white drop-shadow-[0_3px_2px_rgba(0,0,0,0.85)]">
              BLOOD BOWL<sup className="text-xs sm:text-sm ml-0.5">®</sup>
            </h1>
            <div className="crimson-banner inline-flex items-center gap-2 px-4 py-0.5 mt-1 border border-[#EAB308] rounded-sm">
              <span className="text-[#FDE047] text-[10px]" aria-hidden="true">★</span>
              <span className="font-display text-[10px] sm:text-xs font-bold tracking-widest text-white uppercase">
                LE JEU DE FOOTBALL FANTASTIQUE
              </span>
              <span className="text-[#FDE047] text-[10px]" aria-hidden="true">★</span>
            </div>
          </div>

          <div className="shrink-0">
            <SpikedBallIllustration className="w-14 h-14 sm:w-20 sm:h-20 drop-shadow-lg" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-2.5 sm:p-4 space-y-2.5 text-[#1E1915]">
        {/* Team Headers + VS Score */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-stretch">
          {/* Équipe A */}
          <div className="lg:col-span-5 border-2 border-[#1E1915] bg-white/75 rounded-sm overflow-hidden flex flex-col">
            <div className="navy-header px-2.5 py-1 flex flex-wrap items-center justify-between gap-1.5 border-b-2 border-[#EAB308]">
              <div className="flex items-center gap-1.5 text-white font-display font-bold text-xs sm:text-sm tracking-wider whitespace-nowrap shrink-0">
                <span className="text-[#FDE047]" aria-hidden="true">★</span>
                <span>ÉQUIPE A</span>
                <span className="text-[#FDE047]" aria-hidden="true">★</span>
              </div>
              <div className="no-print flex items-center gap-1.5 min-w-0">
                <button
                  type="button"
                  onClick={() => onOpenTeamModal('A', 'import')}
                  aria-label="Importer l'Équipe A depuis un fichier Excel ou CSV"
                  title="Importer un roster Excel (.xlsx, .xls, .ods) ou CSV"
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-[#efe2c0] hover:bg-white text-[#0D2042] rounded cursor-pointer transition-colors whitespace-nowrap shrink-0"
                >
                  <FileSpreadsheet className="w-3 h-3 shrink-0" />
                  <span>Excel</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenTeamModal('A', 'catalog')}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-amber-400 hover:bg-amber-300 text-amber-950 rounded cursor-pointer transition-colors min-w-0 max-w-[165px] sm:max-w-none"
                >
                  <Shield className="w-3 h-3 shrink-0" />
                  <span className="truncate">{defA ? defA.name : 'Choisir équipe'}</span>
                </button>
              </div>
            </div>
            <div className="px-2.5 py-1.5 border-b border-[#1E1915]/40 bg-[#fffdf7]">
              <label htmlFor="team-a-name" className="sr-only">
                Nom de l’Équipe A
              </label>
              <input
                id="team-a-name"
                type="text"
                value={match.teamA.name}
                onChange={(e) => updateTeam('A', (t) => ({ ...t, name: e.target.value }))}
                placeholder="Nom de l’Équipe A..."
                className="w-full font-display font-bold text-sm sm:text-base bg-transparent focus:outline-none text-[#1E1915]"
              />
              {rulesA.length > 0 && (
                <div className="text-[10px] font-semibold text-[#750d0d] mt-0.5">
                  Règles : {rulesA.join(' · ')}
                </div>
              )}
            </div>
            <div className="grid grid-cols-[76px_1fr] text-xs divide-y divide-[#1E1915]/30">
              <label htmlFor="match-date" className="crimson-banner text-white font-semibold px-2 py-1 flex items-center">
                Date :
              </label>
              <input
                id="match-date"
                type="date"
                value={match.date}
                onChange={(e) => onUpdateMatch((p) => ({ ...p, date: e.target.value }))}
                className="px-2 py-1 bg-white/85 font-mono-num focus:outline-none"
              />
              <label htmlFor="coach-a" className="crimson-banner text-white font-semibold px-2 py-1 flex items-center">
                Coach :
              </label>
              <input
                id="coach-a"
                type="text"
                value={match.teamA.coach}
                onChange={(e) => updateTeam('A', (t) => ({ ...t, coach: e.target.value }))}
                placeholder="Nom du coach A"
                className="px-2 py-1 bg-white/85 focus:outline-none"
              />
              <label htmlFor="tve-a" className="crimson-banner text-white font-semibold px-2 py-1 flex items-center">
                TVE :
              </label>
              <div className="flex items-center bg-white/85 px-2 py-1">
                <input
                  id="tve-a"
                  type="number"
                  step={5000}
                  min={0}
                  value={match.teamA.tve}
                  onChange={(e) =>
                    updateTeam('A', (t) => ({ ...t, tve: parseIntOrZero(e.target.value) }))
                  }
                  className="w-full font-mono-num text-right pr-1.5 bg-transparent focus:outline-none"
                />
                <span className="font-semibold text-xs">po</span>
              </div>
            </div>
          </div>

          {/* Center VS & Touchdown Scoreboard */}
          <TouchdownScoreboard
            teamA={match.teamA}
            teamB={match.teamB}
            onUpdateTeam={updateTeam}
            onResetManualScores={() =>
              onUpdateMatch((p) => ({
                ...p,
                teamA: { ...p.teamA, manualScoreOverride: null },
                teamB: { ...p.teamB, manualScoreOverride: null },
              }))
            }
          />

          {/* Équipe B */}
          <div className="lg:col-span-5 border-2 border-[#1E1915] bg-white/75 rounded-sm overflow-hidden flex flex-col">
            <div className="navy-header px-2.5 py-1 flex flex-wrap items-center justify-between gap-1.5 border-b-2 border-[#EAB308]">
              <div className="flex items-center gap-1.5 text-white font-display font-bold text-xs sm:text-sm tracking-wider whitespace-nowrap shrink-0">
                <span className="text-[#FDE047]" aria-hidden="true">★</span>
                <span>ÉQUIPE B</span>
                <span className="text-[#FDE047]" aria-hidden="true">★</span>
              </div>
              <div className="no-print flex items-center gap-1.5 min-w-0">
                <button
                  type="button"
                  onClick={() => onOpenTeamModal('B', 'import')}
                  aria-label="Importer l'Équipe B depuis un fichier Excel ou CSV"
                  title="Importer un roster Excel (.xlsx, .xls, .ods) ou CSV"
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-[#efe2c0] hover:bg-white text-[#0D2042] rounded cursor-pointer transition-colors whitespace-nowrap shrink-0"
                >
                  <FileSpreadsheet className="w-3 h-3 shrink-0" />
                  <span>Excel</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenTeamModal('B', 'catalog')}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-amber-400 hover:bg-amber-300 text-amber-950 rounded cursor-pointer transition-colors min-w-0 max-w-[165px] sm:max-w-none"
                >
                  <Shield className="w-3 h-3 shrink-0" />
                  <span className="truncate">{defB ? defB.name : 'Choisir équipe'}</span>
                </button>
              </div>
            </div>
            <div className="px-2.5 py-1.5 border-b border-[#1E1915]/40 bg-[#fffdf7]">
              <label htmlFor="team-b-name" className="sr-only">
                Nom de l’Équipe B
              </label>
              <input
                id="team-b-name"
                type="text"
                value={match.teamB.name}
                onChange={(e) => updateTeam('B', (t) => ({ ...t, name: e.target.value }))}
                placeholder="Nom de l’Équipe B..."
                className="w-full font-display font-bold text-sm sm:text-base bg-transparent focus:outline-none text-[#1E1915]"
              />
              {rulesB.length > 0 && (
                <div className="text-[10px] font-semibold text-[#750d0d] mt-0.5">
                  Règles : {rulesB.join(' · ')}
                </div>
              )}
            </div>
            <div className="grid grid-cols-[76px_1fr] text-xs divide-y divide-[#1E1915]/30">
              <label htmlFor="match-location" className="crimson-banner text-white font-semibold px-2 py-1 flex items-center">
                Lieu :
              </label>
              <input
                id="match-location"
                type="text"
                value={match.location}
                onChange={(e) => onUpdateMatch((p) => ({ ...p, location: e.target.value }))}
                placeholder="Stade / Ligue"
                className="px-2 py-1 bg-white/85 focus:outline-none"
              />
              <label htmlFor="coach-b" className="crimson-banner text-white font-semibold px-2 py-1 flex items-center">
                Coach :
              </label>
              <input
                id="coach-b"
                type="text"
                value={match.teamB.coach}
                onChange={(e) => updateTeam('B', (t) => ({ ...t, coach: e.target.value }))}
                placeholder="Nom du coach B"
                className="px-2 py-1 bg-white/85 focus:outline-none"
              />
              <label htmlFor="tve-b" className="crimson-banner text-white font-semibold px-2 py-1 flex items-center">
                TVE :
              </label>
              <div className="flex items-center bg-white/85 px-2 py-1">
                <input
                  id="tve-b"
                  type="number"
                  step={5000}
                  min={0}
                  value={match.teamB.tve}
                  onChange={(e) =>
                    updateTeam('B', (t) => ({ ...t, tve: parseIntOrZero(e.target.value) }))
                  }
                  className="w-full font-mono-num text-right pr-1.5 bg-transparent focus:outline-none"
                />
                <span className="font-semibold text-xs">po</span>
              </div>
            </div>
          </div>
        </div>

        {/* CALCUL DES VALEURS D'ÉQUIPE */}
        <section aria-labelledby="heading-tv">
          <CrimsonBanner title="CALCUL DES VALEURS D’ÉQUIPE" />
          <div className="border-2 border-[#1E1915] bg-white/80 rounded-sm overflow-hidden text-xs">
            <div className="hidden md:grid md:grid-cols-12 navy-header text-white font-display font-bold text-center border-b border-[#1E1915]">
              <div className="md:col-span-4 py-1">ÉQUIPE A</div>
              <div className="md:col-span-4 py-1 bg-[#121822]">PARAMÈTRE</div>
              <div className="md:col-span-4 py-1">ÉQUIPE B</div>
            </div>

            {/* Row 1: VEA */}
            <div className="grid grid-cols-1 md:grid-cols-12 border-b border-[#1E1915]/40 items-center">
              <div className="md:col-span-4 flex items-center justify-between gap-2 px-2.5 py-1 bg-white/70">
                <span className="md:hidden font-semibold text-stone-700 whitespace-nowrap shrink-0">VEA A :</span>
                <div className="flex items-center flex-1 min-w-0 justify-end gap-1.5">
                  <label htmlFor="vea-a" className="sr-only">
                    VEA Équipe A
                  </label>
                  <input
                    id="vea-a"
                    type="number"
                    step={5000}
                    min={0}
                    value={match.teamA.vea}
                    onChange={(e) =>
                      updateTeam('A', (t) => ({ ...t, vea: parseIntOrZero(e.target.value) }))
                    }
                    className="w-full min-w-0 text-right font-mono-num font-semibold bg-transparent focus:outline-none"
                  />
                  <span className="font-semibold shrink-0">po</span>
                </div>
              </div>
              <div className="md:col-span-4 crimson-banner text-white font-bold text-center py-1 px-2">
                VEA – Valeur d’équipe actuelle
              </div>
              <div className="md:col-span-4 flex items-center justify-between gap-2 px-2.5 py-1 bg-white/70">
                <span className="md:hidden font-semibold text-stone-700 whitespace-nowrap shrink-0">VEA B :</span>
                <div className="flex items-center flex-1 min-w-0 justify-end gap-1.5">
                  <label htmlFor="vea-b" className="sr-only">
                    VEA Équipe B
                  </label>
                  <input
                    id="vea-b"
                    type="number"
                    step={5000}
                    min={0}
                    value={match.teamB.vea}
                    onChange={(e) =>
                      updateTeam('B', (t) => ({ ...t, vea: parseIntOrZero(e.target.value) }))
                    }
                    className="w-full min-w-0 text-right font-mono-num font-semibold bg-transparent focus:outline-none"
                  />
                  <span className="font-semibold shrink-0">po</span>
                </div>
              </div>
            </div>

            {/* Row 2: + Journalier(s) */}
            <div className="grid grid-cols-1 md:grid-cols-12 border-b border-[#1E1915]/40 items-center">
              <div className="md:col-span-4 flex items-center justify-between gap-2 px-2.5 py-1 bg-[#faf4e4]">
                <span className="md:hidden font-semibold text-stone-700 whitespace-nowrap shrink-0">+ Journaliers A :</span>
                <div className="flex items-center flex-1 min-w-0 justify-end gap-1.5">
                  <label htmlFor="journaliers-a" className="sr-only">
                    Coût des journaliers Équipe A
                  </label>
                  <input
                    id="journaliers-a"
                    type="number"
                    step={5000}
                    min={0}
                    value={match.teamA.journaliersCost}
                    onChange={(e) =>
                      updateTeam('A', (t) => ({
                        ...t,
                        journaliersCost: parseIntOrZero(e.target.value),
                      }))
                    }
                    className="w-full min-w-0 text-right font-mono-num bg-transparent focus:outline-none"
                  />
                  <span className="font-semibold shrink-0">po</span>
                </div>
              </div>
              <div className="md:col-span-4 bg-[#f3e4b8] text-[#1E1915] font-bold text-center py-1 px-2 border-x border-[#1E1915]/25">
                + Journalier(s)
              </div>
              <div className="md:col-span-4 flex items-center justify-between gap-2 px-2.5 py-1 bg-[#faf4e4]">
                <span className="md:hidden font-semibold text-stone-700 whitespace-nowrap shrink-0">+ Journaliers B :</span>
                <div className="flex items-center flex-1 min-w-0 justify-end gap-1.5">
                  <label htmlFor="journaliers-b" className="sr-only">
                    Coût des journaliers Équipe B
                  </label>
                  <input
                    id="journaliers-b"
                    type="number"
                    step={5000}
                    min={0}
                    value={match.teamB.journaliersCost}
                    onChange={(e) =>
                      updateTeam('B', (t) => ({
                        ...t,
                        journaliersCost: parseIntOrZero(e.target.value),
                      }))
                    }
                    className="w-full min-w-0 text-right font-mono-num bg-transparent focus:outline-none"
                  />
                  <span className="font-semibold shrink-0">po</span>
                </div>
              </div>
            </div>

            {/* Row 3: VEA ajustée */}
            <div className="grid grid-cols-1 md:grid-cols-12 border-b border-[#1E1915]/40 items-center">
              <div
                data-testid="adjusted-tv-a"
                className="md:col-span-4 px-2.5 py-1 flex items-center justify-between md:justify-end font-mono-num font-bold text-[#0D2042] bg-white/85"
              >
                <span className="md:hidden font-sans font-semibold text-stone-700">VEA ajustée A :</span>
                <span>{formatGold(budgets.adjustedTvA)} po</span>
              </div>
              <div className="md:col-span-4 crimson-banner text-white font-bold text-center py-1 px-2">
                VEA ajustée
              </div>
              <div
                data-testid="adjusted-tv-b"
                className="md:col-span-4 px-2.5 py-1 flex items-center justify-between md:justify-end font-mono-num font-bold text-[#0D2042] bg-white/85"
              >
                <span className="md:hidden font-sans font-semibold text-stone-700">VEA ajustée B :</span>
                <span>{formatGold(budgets.adjustedTvB)} po</span>
              </div>
            </div>

            {/* Row 4: Petite caisse */}
            <div className="grid grid-cols-1 md:grid-cols-12 border-b border-[#1E1915]/40 items-center">
              <div
                data-testid="petite-caisse-a"
                className="md:col-span-4 px-2.5 py-1 flex items-center justify-between md:justify-end font-mono-num font-bold text-[#750d0d] bg-[#faf4e4]"
              >
                <span className="md:hidden font-sans font-semibold text-stone-700">Petite caisse A :</span>
                <span>{formatGold(budgets.petiteCaisseA)} po</span>
              </div>
              <div className="md:col-span-4 crimson-banner text-white text-center py-1 px-2 leading-tight">
                <div className="font-bold">Petite caisse</div>
                <div className="text-[10px] text-amber-200">(Budgets de coups de pouce)</div>
              </div>
              <div
                data-testid="petite-caisse-b"
                className="md:col-span-4 px-2.5 py-1 flex items-center justify-between md:justify-end font-mono-num font-bold text-[#750d0d] bg-[#faf4e4]"
              >
                <span className="md:hidden font-sans font-semibold text-stone-700">Petite caisse B :</span>
                <span>{formatGold(budgets.petiteCaisseB)} po</span>
              </div>
            </div>

            {/* Row 5: Trésorerie */}
            <div className="grid grid-cols-1 md:grid-cols-12 border-b border-[#1E1915]/40 items-center">
              <div className="md:col-span-4 flex items-center justify-between gap-2 px-2.5 py-1 bg-white/70">
                <span className="md:hidden font-semibold text-stone-700 whitespace-nowrap shrink-0">Trésorerie A :</span>
                <div className="flex items-center flex-1 min-w-0 justify-end gap-1.5">
                  <label htmlFor="treasury-a" className="sr-only">
                    Trésorerie Équipe A
                  </label>
                  <input
                    id="treasury-a"
                    type="number"
                    step={5000}
                    min={0}
                    value={match.teamA.treasury}
                    onChange={(e) =>
                      updateTeam('A', (t) => ({
                        ...t,
                        treasury: parseIntOrZero(e.target.value),
                      }))
                    }
                    className="w-full min-w-0 text-right font-mono-num bg-transparent focus:outline-none"
                  />
                  <span className="font-semibold shrink-0">po</span>
                </div>
              </div>
              <div className="md:col-span-4 crimson-banner text-white font-bold text-center py-1 px-2">
                Trésorerie
              </div>
              <div className="md:col-span-4 flex items-center justify-between gap-2 px-2.5 py-1 bg-white/70">
                <span className="md:hidden font-semibold text-stone-700 whitespace-nowrap shrink-0">Trésorerie B :</span>
                <div className="flex items-center flex-1 min-w-0 justify-end gap-1.5">
                  <label htmlFor="treasury-b" className="sr-only">
                    Trésorerie Équipe B
                  </label>
                  <input
                    id="treasury-b"
                    type="number"
                    step={5000}
                    min={0}
                    value={match.teamB.treasury}
                    onChange={(e) =>
                      updateTeam('B', (t) => ({
                        ...t,
                        treasury: parseIntOrZero(e.target.value),
                      }))
                    }
                    className="w-full min-w-0 text-right font-mono-num bg-transparent focus:outline-none"
                  />
                  <span className="font-semibold shrink-0">po</span>
                </div>
              </div>
            </div>

            {/* Row 6: + 50 000 po max / Trésorerie dépensée en CdP */}
            <div className="grid grid-cols-1 md:grid-cols-12 items-center bg-[#f8f0da]">
              {/* Team A */}
              <div className="md:col-span-4 px-2.5 py-1.5 flex items-center justify-between gap-2 border-b md:border-b-0 md:border-r border-[#1E1915]/25">
                <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={match.teamA.useMax50kTreasury}
                    onChange={(e) =>
                      updateTeam('A', (t) => ({
                        ...t,
                        useMax50kTreasury: e.target.checked,
                        treasurySpentOnInducements:
                          e.target.checked && budgets.status === 'B_higher'
                            ? Math.min(50000, t.treasury)
                            : e.target.checked
                              ? t.treasurySpentOnInducements
                              : 0,
                      }))
                    }
                    className="w-4 h-4 accent-[#750d0d]"
                  />
                  <span className="font-semibold text-[11px]">
                    {budgets.status === 'A_higher' ? 'Trésor CdP' : '+ 50 000 po max'}
                  </span>
                </label>
                <div className="flex items-center gap-1">
                  <label htmlFor="treasury-spent-a" className="sr-only">
                    Trésorerie dépensée en coups de pouce Équipe A
                  </label>
                  <input
                    id="treasury-spent-a"
                    type="number"
                    step={5000}
                    min={0}
                    max={budgets.status === 'B_higher' ? 50000 : match.teamA.treasury}
                    value={match.teamA.treasurySpentOnInducements}
                    onChange={(e) =>
                      updateTeam('A', (t) => ({
                        ...t,
                        treasurySpentOnInducements: parseIntOrZero(e.target.value),
                      }))
                    }
                    className="w-20 text-right font-mono-num px-1 py-0.5 bg-white border border-stone-400 rounded text-[11px]"
                  />
                  <span className="text-[11px] font-semibold">po</span>
                </div>
              </div>

              <div className="md:col-span-4 text-center px-2 py-1 text-[11px] font-semibold text-stone-700">
                {budgets.status === 'equal' && 'VEA ajustées égales — pas de petite caisse'}
                {budgets.status === 'A_higher' &&
                  `Équipe B reçoit ${formatGold(budgets.petiteCaisseB)} po (+ ${formatGold(budgets.treasuryAddedB)} po trésor)`}
                {budgets.status === 'B_higher' &&
                  `Équipe A reçoit ${formatGold(budgets.petiteCaisseA)} po (+ ${formatGold(budgets.treasuryAddedA)} po trésor)`}
              </div>

              {/* Team B */}
              <div className="md:col-span-4 px-2.5 py-1.5 flex items-center justify-between gap-2 border-t md:border-t-0 md:border-l border-[#1E1915]/25">
                <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={match.teamB.useMax50kTreasury}
                    onChange={(e) =>
                      updateTeam('B', (t) => ({
                        ...t,
                        useMax50kTreasury: e.target.checked,
                        treasurySpentOnInducements:
                          e.target.checked && budgets.status === 'A_higher'
                            ? Math.min(50000, t.treasury)
                            : e.target.checked
                              ? t.treasurySpentOnInducements
                              : 0,
                      }))
                    }
                    className="w-4 h-4 accent-[#750d0d]"
                  />
                  <span className="font-semibold text-[11px]">
                    {budgets.status === 'B_higher' ? 'Trésor CdP' : '+ 50 000 po max'}
                  </span>
                </label>
                <div className="flex items-center gap-1">
                  <label htmlFor="treasury-spent-b" className="sr-only">
                    Trésorerie dépensée en coups de pouce Équipe B
                  </label>
                  <input
                    id="treasury-spent-b"
                    type="number"
                    step={5000}
                    min={0}
                    max={budgets.status === 'A_higher' ? 50000 : match.teamB.treasury}
                    value={match.teamB.treasurySpentOnInducements}
                    onChange={(e) =>
                      updateTeam('B', (t) => ({
                        ...t,
                        treasurySpentOnInducements: parseIntOrZero(e.target.value),
                      }))
                    }
                    className="w-20 text-right font-mono-num px-1 py-0.5 bg-white border border-stone-400 rounded text-[11px]"
                  />
                  <span className="text-[11px] font-semibold">po</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AVANT-MATCH */}
        <section aria-label="Avant-Match">
          <CrimsonBanner title="AVANT-MATCH" />
          <div className="border-2 border-[#1E1915] bg-white/80 rounded-sm overflow-hidden text-xs">
            {/* Row 1: FP */}
            <div className="grid grid-cols-1 md:grid-cols-12 border-b border-[#1E1915]/40 items-center">
              <div className="md:col-span-4 navy-header text-white px-2.5 py-1.5 flex items-center justify-between gap-1.5 flex-wrap">
                <span className="font-bold">FP :</span>
                <span data-testid="fp-a" className="px-2 py-0.5 bg-white text-[#1E1915] font-mono-num font-bold rounded-sm min-w-[28px] text-center">
                  {fpA}
                </span>
                <span>=</span>
                <label htmlFor="fd-a" className="sr-only">
                  Fans dévoués Équipe A
                </label>
                <input
                  id="fd-a"
                  type="number"
                  min={1}
                  max={7}
                  value={match.teamA.dedicatedFans}
                  onChange={(e) =>
                    updateTeam('A', (t) => ({
                      ...t,
                      dedicatedFans: Math.max(1, Math.min(7, parseIntOrZero(e.target.value) || 1)),
                    }))
                  }
                  className="w-10 text-center font-mono-num font-bold bg-white text-[#1E1915] rounded-sm py-0.5"
                />
                <span>FD +</span>
                <label htmlFor="d3-a" className="sr-only">
                  Jet 1D3 Équipe A
                </label>
                <input
                  id="d3-a"
                  type="number"
                  min={1}
                  max={3}
                  value={match.teamA.fanRollD3 ?? ''}
                  placeholder="?"
                  onChange={(e) => {
                    const v = e.target.value === '' ? null : Math.max(1, Math.min(3, parseIntOrZero(e.target.value) || 1));
                    updateTeam('A', (t) => ({ ...t, fanRollD3: v }));
                  }}
                  className="w-9 text-center font-mono-num font-bold bg-white text-[#1E1915] rounded-sm py-0.5"
                />
                <button
                  type="button"
                  onClick={() => rollFanD3('A')}
                  aria-label="Lancer 1D3 de popularité pour Équipe A"
                  className="no-print inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-semibold rounded text-[10px] cursor-pointer"
                >
                  <Dices className="w-3 h-3" />
                  <span>1D3</span>
                </button>
              </div>
              <div className="md:col-span-4 crimson-banner text-white font-bold text-center py-1.5 px-2">
                FACTEUR DE POPULARITÉ
              </div>
              <div className="md:col-span-4 navy-header text-white px-2.5 py-1.5 flex items-center justify-between gap-1.5 flex-wrap">
                <span className="font-bold">FP :</span>
                <span data-testid="fp-b" className="px-2 py-0.5 bg-white text-[#1E1915] font-mono-num font-bold rounded-sm min-w-[28px] text-center">
                  {fpB}
                </span>
                <span>=</span>
                <label htmlFor="fd-b" className="sr-only">
                  Fans dévoués Équipe B
                </label>
                <input
                  id="fd-b"
                  type="number"
                  min={1}
                  max={7}
                  value={match.teamB.dedicatedFans}
                  onChange={(e) =>
                    updateTeam('B', (t) => ({
                      ...t,
                      dedicatedFans: Math.max(1, Math.min(7, parseIntOrZero(e.target.value) || 1)),
                    }))
                  }
                  className="w-10 text-center font-mono-num font-bold bg-white text-[#1E1915] rounded-sm py-0.5"
                />
                <span>FD +</span>
                <label htmlFor="d3-b" className="sr-only">
                  Jet 1D3 Équipe B
                </label>
                <input
                  id="d3-b"
                  type="number"
                  min={1}
                  max={3}
                  value={match.teamB.fanRollD3 ?? ''}
                  placeholder="?"
                  onChange={(e) => {
                    const v = e.target.value === '' ? null : Math.max(1, Math.min(3, parseIntOrZero(e.target.value) || 1));
                    updateTeam('B', (t) => ({ ...t, fanRollD3: v }));
                  }}
                  className="w-9 text-center font-mono-num font-bold bg-white text-[#1E1915] rounded-sm py-0.5"
                />
                <button
                  type="button"
                  onClick={() => rollFanD3('B')}
                  aria-label="Lancer 1D3 de popularité pour Équipe B"
                  className="no-print inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-semibold rounded text-[10px] cursor-pointer"
                >
                  <Dices className="w-3 h-3" />
                  <span>1D3</span>
                </button>
              </div>
            </div>

            {/* Row 2: Stade */}
            <div className="grid grid-cols-1 md:grid-cols-12 border-b border-[#1E1915]/40 items-center">
              <div className="md:col-span-4 flex items-center gap-2 px-2.5 py-1 bg-[#0D2042] text-white">
                <label htmlFor="stadium-name" className="font-semibold shrink-0">
                  Stade :
                </label>
                <input
                  id="stadium-name"
                  type="text"
                  value={match.stadium}
                  onChange={(e) => onUpdateMatch((p) => ({ ...p, stadium: e.target.value }))}
                  className="w-full px-1.5 py-0.5 bg-white text-[#1E1915] rounded-sm focus:outline-none"
                />
              </div>
              <div className="md:col-span-4 crimson-banner text-white font-bold text-center py-1 px-2">
                LE STADE
              </div>
              <div className="md:col-span-4 flex items-center gap-2 px-2.5 py-1 bg-[#0D2042] text-white">
                <label htmlFor="stadium-attr" className="font-semibold shrink-0">
                  Attribut :
                </label>
                <input
                  id="stadium-attr"
                  type="text"
                  value={match.stadiumAttribute}
                  onChange={(e) =>
                    onUpdateMatch((p) => ({ ...p, stadiumAttribute: e.target.value }))
                  }
                  className="w-full px-1.5 py-0.5 bg-white text-[#1E1915] rounded-sm focus:outline-none"
                />
              </div>
            </div>

            {/* Row 3: Météo */}
            <div className="grid grid-cols-1 md:grid-cols-12 border-b border-[#1E1915]/40 items-center">
              <div className="md:col-span-4 flex items-center gap-2 px-2.5 py-1 bg-[#0D2042] text-white">
                <label htmlFor="weather-select" className="font-semibold shrink-0">
                  Météo :
                </label>
                <select
                  id="weather-select"
                  value={match.weatherName}
                  onChange={(e) =>
                    onUpdateMatch((p) => ({ ...p, weatherName: e.target.value }))
                  }
                  className="w-full px-1.5 py-0.5 bg-white text-[#1E1915] rounded-sm focus:outline-none font-semibold"
                >
                  {WEATHER_TABLE.map((w) => (
                    <option key={w.name} value={w.name}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-4 crimson-banner text-white font-bold text-center py-1 px-2">
                LA MÉTÉO
              </div>
              <div className="md:col-span-4 flex items-center justify-between gap-2 px-2.5 py-1 bg-[#0D2042] text-white">
                <div className="flex items-center gap-2">
                  <label htmlFor="weather-roll" className="font-semibold shrink-0">
                    Tirage :
                  </label>
                  <input
                    id="weather-roll"
                    type="number"
                    min={2}
                    max={12}
                    value={match.weatherRoll ?? ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? null : Math.max(2, Math.min(12, parseIntOrZero(e.target.value) || 7));
                      const w = val ? getWeatherByRoll(val) : null;
                      onUpdateMatch((p) => ({
                        ...p,
                        weatherRoll: val,
                        weatherName: w ? w.name : p.weatherName,
                      }));
                    }}
                    className="w-14 text-center font-mono-num font-bold bg-white text-[#1E1915] rounded-sm py-0.5"
                  />
                </div>
                <button
                  type="button"
                  onClick={rollWeather2D6}
                  className="no-print inline-flex items-center gap-1 px-2 py-0.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-semibold rounded text-[11px] cursor-pointer"
                >
                  <Dices className="w-3.5 h-3.5" />
                  <span>2D6 Météo</span>
                </button>
              </div>
            </div>
            <div className="px-3 py-1 bg-[#faf4e4] border-b border-[#1E1915]/30 text-[11px] text-stone-700 text-center">
              Effet météo actif : <strong>{weatherInfo.name}</strong> — {weatherInfo.effect}
            </div>

            {/* Row 4: Recrutement de Journaliers */}
            <div className="grid grid-cols-1 md:grid-cols-12 border-b border-[#1E1915]/40 items-center">
              <div className="md:col-span-4 navy-header text-white px-2.5 py-1 flex items-center justify-between">
                <span className="font-semibold">Journaliers :</span>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={match.teamA.hasJournaliers === true}
                      onChange={() =>
                        updateTeam('A', (t) => ({
                          ...t,
                          hasJournaliers: t.hasJournaliers === true ? null : true,
                        }))
                      }
                      className="accent-amber-400"
                    />
                    <span>Oui</span>
                  </label>
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={match.teamA.hasJournaliers === false}
                      onChange={() =>
                        updateTeam('A', (t) => ({
                          ...t,
                          hasJournaliers: t.hasJournaliers === false ? null : false,
                        }))
                      }
                      className="accent-amber-400"
                    />
                    <span>Non</span>
                  </label>
                </div>
              </div>
              <div className="md:col-span-4 crimson-banner text-white font-bold text-center py-1 px-2 text-[11px]">
                RECRUTEMENT DE JOURNALIERS
              </div>
              <div className="md:col-span-4 navy-header text-white px-2.5 py-1 flex items-center justify-between">
                <span className="font-semibold">Journaliers :</span>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={match.teamB.hasJournaliers === true}
                      onChange={() =>
                        updateTeam('B', (t) => ({
                          ...t,
                          hasJournaliers: t.hasJournaliers === true ? null : true,
                        }))
                      }
                      className="accent-amber-400"
                    />
                    <span>Oui</span>
                  </label>
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={match.teamB.hasJournaliers === false}
                      onChange={() =>
                        updateTeam('B', (t) => ({
                          ...t,
                          hasJournaliers: t.hasJournaliers === false ? null : false,
                        }))
                      }
                      className="accent-amber-400"
                    />
                    <span>Non</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Coups de pouce (Inducements) - 5 rows per team */}
            <div className="grid grid-cols-1 md:grid-cols-12 border-b border-[#1E1915]/40">
              {/* Left 5 lines */}
              <div className="md:col-span-4 divide-y divide-[#1E1915]/25">
                {match.teamA.inducements.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 px-2 py-1 bg-white/85">
                    <input
                      type="text"
                      aria-label={`Coup de pouce ${idx + 1} Équipe A`}
                      value={item.name}
                      onChange={(e) =>
                        updateTeam('A', (t) => {
                          const next = [...t.inducements];
                          next[idx] = { ...next[idx], name: e.target.value };
                          return { ...t, inducements: next };
                        })
                      }
                      placeholder={`Coup de pouce ${idx + 1}...`}
                      className="flex-1 min-w-0 bg-transparent focus:outline-none text-xs"
                    />
                    <input
                      type="number"
                      step={5000}
                      min={0}
                      aria-label={`Coût coup de pouce ${idx + 1} Équipe A`}
                      value={item.cost || ''}
                      onChange={(e) =>
                        updateTeam('A', (t) => {
                          const next = [...t.inducements];
                          next[idx] = { ...next[idx], cost: parseIntOrZero(e.target.value) };
                          return { ...t, inducements: next };
                        })
                      }
                      placeholder="0"
                      className="w-16 text-right font-mono-num bg-transparent focus:outline-none text-xs"
                    />
                    <span className="font-bold text-[11px]">po</span>
                  </div>
                ))}
              </div>

              {/* Center label & Catalog buttons */}
              <div className="md:col-span-4 bg-[#f3e4b8] flex flex-col items-center justify-center p-2 border-y md:border-y-0 md:border-x border-[#1E1915]/30 text-center gap-1.5">
                <div>
                  <div className="font-display font-extrabold text-sm text-[#750d0d]">
                    COUPS DE POUCE
                  </div>
                  <div className="text-[11px] font-semibold text-stone-700">(Inducements)</div>
                </div>
                <div className="font-mono-num text-[11px] space-y-0.5">
                  <div>
                    A : <strong>{formatGold(budgets.spentA)}</strong> / {formatGold(budgets.totalBudgetA)} po
                  </div>
                  <div>
                    B : <strong>{formatGold(budgets.spentB)}</strong> / {formatGold(budgets.totalBudgetB)} po
                  </div>
                </div>
                <div className="no-print flex items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => onOpenInducementModal('A')}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold bg-[#0D2042] hover:bg-[#16315e] text-white rounded cursor-pointer"
                  >
                    <BookOpen className="w-3 h-3" />
                    <span>Catalogue A</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenInducementModal('B')}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold bg-[#0D2042] hover:bg-[#16315e] text-white rounded cursor-pointer"
                  >
                    <BookOpen className="w-3 h-3" />
                    <span>Catalogue B</span>
                  </button>
                </div>
              </div>

              {/* Right 5 lines */}
              <div className="md:col-span-4 divide-y divide-[#1E1915]/25">
                {match.teamB.inducements.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 px-2 py-1 bg-white/85">
                    <input
                      type="text"
                      aria-label={`Coup de pouce ${idx + 1} Équipe B`}
                      value={item.name}
                      onChange={(e) =>
                        updateTeam('B', (t) => {
                          const next = [...t.inducements];
                          next[idx] = { ...next[idx], name: e.target.value };
                          return { ...t, inducements: next };
                        })
                      }
                      placeholder={`Coup de pouce ${idx + 1}...`}
                      className="flex-1 min-w-0 bg-transparent focus:outline-none text-xs"
                    />
                    <input
                      type="number"
                      step={5000}
                      min={0}
                      aria-label={`Coût coup de pouce ${idx + 1} Équipe B`}
                      value={item.cost || ''}
                      onChange={(e) =>
                        updateTeam('B', (t) => {
                          const next = [...t.inducements];
                          next[idx] = { ...next[idx], cost: parseIntOrZero(e.target.value) };
                          return { ...t, inducements: next };
                        })
                      }
                      placeholder="0"
                      className="w-16 text-right font-mono-num bg-transparent focus:outline-none text-xs"
                    />
                    <span className="font-bold text-[11px]">po</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Prières de Nuffle - 2 rows per team */}
            <div className="grid grid-cols-1 md:grid-cols-12 border-b border-[#1E1915]/40">
              <div className="md:col-span-4 divide-y divide-[#1E1915]/25">
                {([0, 1] as const).map((slot) => (
                  <div key={slot} className="flex items-center gap-1 px-2 py-1 bg-white/85">
                    <input
                      type="text"
                      aria-label={`Prière de Nuffle ${slot + 1} Équipe A`}
                      value={match.teamA.prayers[slot]}
                      onChange={(e) =>
                        updateTeam('A', (t) => {
                          const next: [string, string] = [...t.prayers] as [string, string];
                          next[slot] = e.target.value;
                          return { ...t, prayers: next };
                        })
                      }
                      placeholder={`Prière ${slot + 1}...`}
                      className="flex-1 min-w-0 bg-transparent focus:outline-none text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => rollPrayerForSide('A', slot)}
                      aria-label={`Tirer Prière ${slot + 1} (1D16) pour Équipe A`}
                      className="no-print px-1.5 py-0.5 bg-amber-200 hover:bg-amber-300 text-amber-950 font-semibold rounded text-[10px] cursor-pointer"
                    >
                      1D16
                    </button>
                  </div>
                ))}
              </div>
              <div className="md:col-span-4 bg-[#f3e4b8] flex flex-col items-center justify-center px-2 py-1.5 border-y md:border-y-0 md:border-x border-[#1E1915]/30 text-center">
                <div className="font-display font-extrabold text-sm text-[#750d0d] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>PRIÈRES DE NUFFLE</span>
                </div>
                <div className="no-print flex flex-wrap items-center justify-center gap-2 mt-1 text-[10px]">
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={match.teamA.hasPasseParfaitePrayer}
                      onChange={(e) =>
                        updateTeam('A', (t) => ({
                          ...t,
                          hasPasseParfaitePrayer: e.target.checked,
                        }))
                      }
                      className="accent-[#750d0d]"
                    />
                    <span>A: Passe Parfaite</span>
                  </label>
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={match.teamB.hasPasseParfaitePrayer}
                      onChange={(e) =>
                        updateTeam('B', (t) => ({
                          ...t,
                          hasPasseParfaitePrayer: e.target.checked,
                        }))
                      }
                      className="accent-[#750d0d]"
                    />
                    <span>B: Passe Parfaite</span>
                  </label>
                </div>
              </div>
              <div className="md:col-span-4 divide-y divide-[#1E1915]/25">
                {([0, 1] as const).map((slot) => (
                  <div key={slot} className="flex items-center gap-1 px-2 py-1 bg-white/85">
                    <input
                      type="text"
                      aria-label={`Prière de Nuffle ${slot + 1} Équipe B`}
                      value={match.teamB.prayers[slot]}
                      onChange={(e) =>
                        updateTeam('B', (t) => {
                          const next: [string, string] = [...t.prayers] as [string, string];
                          next[slot] = e.target.value;
                          return { ...t, prayers: next };
                        })
                      }
                      placeholder={`Prière ${slot + 1}...`}
                      className="flex-1 min-w-0 bg-transparent focus:outline-none text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => rollPrayerForSide('B', slot)}
                      aria-label={`Tirer Prière ${slot + 1} (1D16) pour Équipe B`}
                      className="no-print px-1.5 py-0.5 bg-amber-200 hover:bg-amber-300 text-amber-950 font-semibold rounded text-[10px] cursor-pointer"
                    >
                      1D16
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Toast du coup d'envoi */}
            <div className="grid grid-cols-1 md:grid-cols-12 items-center bg-[#f8f0da]">
              <div className="md:col-span-4 px-2.5 py-1 flex items-center justify-between gap-2">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={match.teamA.kickoffChoice === 'receive'}
                    onChange={() =>
                      onUpdateMatch((p) => ({
                        ...p,
                        teamA: { ...p.teamA, kickoffChoice: 'receive' },
                        teamB: { ...p.teamB, kickoffChoice: 'kick' },
                      }))
                    }
                    className="w-4 h-4 accent-[#750d0d]"
                  />
                  <span className="font-semibold text-[11px]">Réceptionne</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={match.teamA.kickoffChoice === 'kick'}
                    onChange={() =>
                      onUpdateMatch((p) => ({
                        ...p,
                        teamA: { ...p.teamA, kickoffChoice: 'kick' },
                        teamB: { ...p.teamB, kickoffChoice: 'receive' },
                      }))
                    }
                    className="w-4 h-4 accent-[#0D2042]"
                  />
                  <span className="font-semibold text-[11px]">Engage</span>
                </label>
              </div>
              <div className="md:col-span-4 crimson-banner text-white font-display font-bold text-center py-1 px-2 text-xs">
                TOAST DU COUP D’ENVOI
              </div>
              <div className="md:col-span-4 px-2.5 py-1 flex items-center justify-between gap-2">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={match.teamB.kickoffChoice === 'receive'}
                    onChange={() =>
                      onUpdateMatch((p) => ({
                        ...p,
                        teamB: { ...p.teamB, kickoffChoice: 'receive' },
                        teamA: { ...p.teamA, kickoffChoice: 'kick' },
                      }))
                    }
                    className="w-4 h-4 accent-[#750d0d]"
                  />
                  <span className="font-semibold text-[11px]">Réceptionne</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={match.teamB.kickoffChoice === 'kick'}
                    onChange={() =>
                      onUpdateMatch((p) => ({
                        ...p,
                        teamB: { ...p.teamB, kickoffChoice: 'kick' },
                        teamA: { ...p.teamA, kickoffChoice: 'receive' },
                      }))
                    }
                    className="w-4 h-4 accent-[#0D2042]"
                  />
                  <span className="font-semibold text-[11px]">Engage</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* LE MATCH — Turn Counter + 16-row Mirrored Roster Grid */}
        <section aria-label="Feuille des Joueurs — Le Match">
          <CrimsonBanner title="LE MATCH" />
          <TurnCounter match={match} onUpdateMatch={onUpdateMatch} />
          <div className="border-2 border-[#1E1915] bg-white/85 rounded-sm overflow-x-auto">
            <table className="w-full min-w-[940px] border-collapse text-[11px]">
              <thead>
                <tr className="navy-header text-white font-display text-xs">
                  <th colSpan={10} className="py-1 border-r border-amber-400/50">
                    ÉQUIPE A {match.teamA.name ? `— ${match.teamA.name}` : ''}
                  </th>
                  <th className="py-1 px-1.5 bg-[#121822] text-amber-300 border-x border-amber-400/50">
                    N°
                  </th>
                  <th colSpan={10} className="py-1 border-l border-amber-400/50">
                    ÉQUIPE B {match.teamB.name ? `— ${match.teamB.name}` : ''}
                  </th>
                </tr>
                <tr className="crimson-banner text-white font-bold text-[10px]">
                  <th className="py-1 px-0.5 w-8 border-r border-black/30" title="Réussite (+1 PSP)">REU</th>
                  <th className="py-1 px-0.5 w-8 border-r border-black/30" title="Élimination (+2 PSP, +3 Bagarreurs Brutaux)">ELI</th>
                  <th className="py-1 px-0.5 w-8 border-r border-black/30" title="Interception (+2 PSP)">INT</th>
                  <th className="py-1 px-0.5 w-8 border-r border-black/30" title="Touchdown (+3 PSP, +2 Bagarreurs Brutaux)">TD</th>
                  <th className="py-1 px-0.5 w-8 border-r border-black/30" title="Joueur du Match (+4 PSP)">MVP</th>
                  <th className="py-1 px-0.5 w-9 border-r border-black/30" title="Agression">AGRO</th>
                  <th className="py-1 px-1 w-20 border-r border-black/30">Séquelles</th>
                  <th className="py-1 px-0.5 w-8 border-r border-black/30" title="Rate le prochain match">RPM</th>
                  <th className="py-1 px-0.5 w-8 border-r border-black/30" title="Blessure Persistante">BP</th>
                  <th className="py-1 px-1.5 text-left min-w-[125px] border-r border-black/40">Nom du joueur</th>

                  <th className="py-1 px-1 w-7 bg-[#0D2042] text-amber-300 border-x border-black/50">#</th>

                  <th className="py-1 px-1.5 text-left min-w-[125px] border-l border-black/40 border-r border-black/30">Nom du joueur</th>
                  <th className="py-1 px-0.5 w-8 border-r border-black/30" title="Blessure Persistante">BP</th>
                  <th className="py-1 px-0.5 w-8 border-r border-black/30" title="Rate le prochain match">RPM</th>
                  <th className="py-1 px-1 w-20 border-r border-black/30">Séquelles</th>
                  <th className="py-1 px-0.5 w-8 border-r border-black/30">REU</th>
                  <th className="py-1 px-0.5 w-8 border-r border-black/30">ELI</th>
                  <th className="py-1 px-0.5 w-8 border-r border-black/30">INT</th>
                  <th className="py-1 px-0.5 w-8 border-r border-black/30">TD</th>
                  <th className="py-1 px-0.5 w-8 border-r border-black/30">MVP</th>
                  <th className="py-1 px-0.5 w-9">AGRO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E1915]/25">
                {Array.from({ length: 16 }, (_, idx) => {
                  const pA = match.teamA.players[idx];
                  const pB = match.teamB.players[idx];
                  const pspA = calculatePlayerPsp(pA, match.teamA);
                  const pspB = calculatePlayerPsp(pB, match.teamB);
                  const rowBg = idx % 2 === 0 ? 'bg-white/90' : 'bg-[#faf3df]/85';

                  return (
                    <tr key={idx} className={`${rowBg} hover:bg-amber-50`}>
                      {/* TEAM A */}
                      <td className="border-r border-[#1E1915]/20 p-0">
                        <input
                          type="number"
                          min={0}
                          aria-label={`A Joueur ${idx + 1} REU`}
                          value={pA.reu || ''}
                          onChange={(e) =>
                            updatePlayer('A', idx, (p) => ({ ...p, reu: parseIntOrZero(e.target.value) }))
                          }
                          className="w-full py-1 text-center font-mono-num bg-transparent focus:outline-none focus:bg-white"
                        />
                      </td>
                      <td className="border-r border-[#1E1915]/20 p-0">
                        <input
                          type="number"
                          min={0}
                          aria-label={`A Joueur ${idx + 1} ELI`}
                          value={pA.eli || ''}
                          onChange={(e) =>
                            updatePlayer('A', idx, (p) => ({ ...p, eli: parseIntOrZero(e.target.value) }))
                          }
                          className="w-full py-1 text-center font-mono-num bg-transparent focus:outline-none focus:bg-white"
                        />
                      </td>
                      <td className="border-r border-[#1E1915]/20 p-0">
                        <input
                          type="number"
                          min={0}
                          aria-label={`A Joueur ${idx + 1} INT`}
                          value={pA.int || ''}
                          onChange={(e) =>
                            updatePlayer('A', idx, (p) => ({ ...p, int: parseIntOrZero(e.target.value) }))
                          }
                          className="w-full py-1 text-center font-mono-num bg-transparent focus:outline-none focus:bg-white"
                        />
                      </td>
                      <td className="border-r border-[#1E1915]/20 p-0">
                        <input
                          type="number"
                          min={0}
                          aria-label={`A Joueur ${idx + 1} TD`}
                          value={pA.td || ''}
                          onChange={(e) =>
                            updatePlayer('A', idx, (p) => ({ ...p, td: parseIntOrZero(e.target.value) }))
                          }
                          className="w-full py-1 text-center font-mono-num font-bold text-[#750d0d] bg-transparent focus:outline-none focus:bg-white"
                        />
                      </td>
                      <td className="border-r border-[#1E1915]/20 text-center">
                        <input
                          type="checkbox"
                          aria-label={`A Joueur ${idx + 1} MVP`}
                          checked={pA.mvp}
                          onChange={(e) =>
                            updatePlayer('A', idx, (p) => ({ ...p, mvp: e.target.checked }))
                          }
                          className="accent-[#750d0d] align-middle cursor-pointer"
                        />
                      </td>
                      <td className="border-r border-[#1E1915]/20 p-0">
                        <input
                          type="number"
                          min={0}
                          aria-label={`A Joueur ${idx + 1} AGRO`}
                          value={pA.agro || ''}
                          onChange={(e) =>
                            updatePlayer('A', idx, (p) => ({ ...p, agro: parseIntOrZero(e.target.value) }))
                          }
                          className="w-full py-1 text-center font-mono-num bg-transparent focus:outline-none focus:bg-white"
                        />
                      </td>
                      <td className="border-r border-[#1E1915]/20 p-0">
                        <select
                          aria-label={`A Joueur ${idx + 1} Séquelles`}
                          value={pA.sequelles}
                          onChange={(e) =>
                            updatePlayer('A', idx, (p) => ({ ...p, sequelles: e.target.value }))
                          }
                          className="w-full py-1 px-0.5 text-[10px] bg-transparent focus:outline-none focus:bg-white"
                        >
                          {SEQUELLE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.value || '—'}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="border-r border-[#1E1915]/20 text-center">
                        <input
                          type="checkbox"
                          aria-label={`A Joueur ${idx + 1} RPM`}
                          checked={pA.rpm}
                          onChange={(e) =>
                            updatePlayer('A', idx, (p) => ({ ...p, rpm: e.target.checked }))
                          }
                          className="accent-[#0D2042] align-middle cursor-pointer"
                        />
                      </td>
                      <td className="border-r border-[#1E1915]/20 p-0">
                        <input
                          type="number"
                          min={0}
                          aria-label={`A Joueur ${idx + 1} BP`}
                          value={pA.bp || ''}
                          onChange={(e) =>
                            updatePlayer('A', idx, (p) => ({ ...p, bp: parseIntOrZero(e.target.value) }))
                          }
                          className="w-full py-1 text-center font-mono-num bg-transparent focus:outline-none focus:bg-white"
                        />
                      </td>
                      <td className="border-r border-[#1E1915]/40 px-1 py-0.5">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            aria-label={`Nom joueur A #${idx + 1}`}
                            value={pA.name}
                            onChange={(e) =>
                              updatePlayer('A', idx, (p) => ({ ...p, name: e.target.value }))
                            }
                            placeholder={pA.position || ''}
                            title={
                              pA.position
                                ? `${pA.name || pA.position} (${pA.position})`
                                : pA.name
                            }
                            className="w-full bg-transparent focus:outline-none text-[11px] font-medium"
                          />
                          {pspA > 0 && (
                            <span
                              title={`Total PSP : ${pspA}`}
                              className="font-mono-num text-[10px] font-bold text-[#750d0d] shrink-0"
                            >
                              {pspA}p
                            </span>
                          )}
                        </div>
                      </td>

                      {/* CENTER NUMBER */}
                      <td className="navy-header text-white font-mono-num font-bold text-center border-x border-[#1E1915]">
                        {idx + 1}
                      </td>

                      {/* TEAM B */}
                      <td className="border-r border-[#1E1915]/20 px-1 py-0.5">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            aria-label={`Nom joueur B #${idx + 1}`}
                            value={pB.name}
                            onChange={(e) =>
                              updatePlayer('B', idx, (p) => ({ ...p, name: e.target.value }))
                            }
                            placeholder={pB.position || ''}
                            title={
                              pB.position
                                ? `${pB.name || pB.position} (${pB.position})`
                                : pB.name
                            }
                            className="w-full bg-transparent focus:outline-none text-[11px] font-medium"
                          />
                          {pspB > 0 && (
                            <span
                              title={`Total PSP : ${pspB}`}
                              className="font-mono-num text-[10px] font-bold text-[#750d0d] shrink-0"
                            >
                              {pspB}p
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="border-r border-[#1E1915]/20 p-0">
                        <input
                          type="number"
                          min={0}
                          aria-label={`B Joueur ${idx + 1} BP`}
                          value={pB.bp || ''}
                          onChange={(e) =>
                            updatePlayer('B', idx, (p) => ({ ...p, bp: parseIntOrZero(e.target.value) }))
                          }
                          className="w-full py-1 text-center font-mono-num bg-transparent focus:outline-none focus:bg-white"
                        />
                      </td>
                      <td className="border-r border-[#1E1915]/20 text-center">
                        <input
                          type="checkbox"
                          aria-label={`B Joueur ${idx + 1} RPM`}
                          checked={pB.rpm}
                          onChange={(e) =>
                            updatePlayer('B', idx, (p) => ({ ...p, rpm: e.target.checked }))
                          }
                          className="accent-[#0D2042] align-middle cursor-pointer"
                        />
                      </td>
                      <td className="border-r border-[#1E1915]/20 p-0">
                        <select
                          aria-label={`B Joueur ${idx + 1} Séquelles`}
                          value={pB.sequelles}
                          onChange={(e) =>
                            updatePlayer('B', idx, (p) => ({ ...p, sequelles: e.target.value }))
                          }
                          className="w-full py-1 px-0.5 text-[10px] bg-transparent focus:outline-none focus:bg-white"
                        >
                          {SEQUELLE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.value || '—'}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="border-r border-[#1E1915]/20 p-0">
                        <input
                          type="number"
                          min={0}
                          aria-label={`B Joueur ${idx + 1} REU`}
                          value={pB.reu || ''}
                          onChange={(e) =>
                            updatePlayer('B', idx, (p) => ({ ...p, reu: parseIntOrZero(e.target.value) }))
                          }
                          className="w-full py-1 text-center font-mono-num bg-transparent focus:outline-none focus:bg-white"
                        />
                      </td>
                      <td className="border-r border-[#1E1915]/20 p-0">
                        <input
                          type="number"
                          min={0}
                          aria-label={`B Joueur ${idx + 1} ELI`}
                          value={pB.eli || ''}
                          onChange={(e) =>
                            updatePlayer('B', idx, (p) => ({ ...p, eli: parseIntOrZero(e.target.value) }))
                          }
                          className="w-full py-1 text-center font-mono-num bg-transparent focus:outline-none focus:bg-white"
                        />
                      </td>
                      <td className="border-r border-[#1E1915]/20 p-0">
                        <input
                          type="number"
                          min={0}
                          aria-label={`B Joueur ${idx + 1} INT`}
                          value={pB.int || ''}
                          onChange={(e) =>
                            updatePlayer('B', idx, (p) => ({ ...p, int: parseIntOrZero(e.target.value) }))
                          }
                          className="w-full py-1 text-center font-mono-num bg-transparent focus:outline-none focus:bg-white"
                        />
                      </td>
                      <td className="border-r border-[#1E1915]/20 p-0">
                        <input
                          type="number"
                          min={0}
                          aria-label={`B Joueur ${idx + 1} TD`}
                          value={pB.td || ''}
                          onChange={(e) =>
                            updatePlayer('B', idx, (p) => ({ ...p, td: parseIntOrZero(e.target.value) }))
                          }
                          className="w-full py-1 text-center font-mono-num font-bold text-[#750d0d] bg-transparent focus:outline-none focus:bg-white"
                        />
                      </td>
                      <td className="border-r border-[#1E1915]/20 text-center">
                        <input
                          type="checkbox"
                          aria-label={`B Joueur ${idx + 1} MVP`}
                          checked={pB.mvp}
                          onChange={(e) =>
                            updatePlayer('B', idx, (p) => ({ ...p, mvp: e.target.checked }))
                          }
                          className="accent-[#750d0d] align-middle cursor-pointer"
                        />
                      </td>
                      <td className="p-0">
                        <input
                          type="number"
                          min={0}
                          aria-label={`B Joueur ${idx + 1} AGRO`}
                          value={pB.agro || ''}
                          onChange={(e) =>
                            updatePlayer('B', idx, (p) => ({ ...p, agro: parseIntOrZero(e.target.value) }))
                          }
                          className="w-full py-1 text-center font-mono-num bg-transparent focus:outline-none focus:bg-white"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#efe2c0] border-t-2 border-[#1E1915] font-mono-num font-bold text-[11px]">
                  <td className="py-1 text-center border-r border-[#1E1915]/25">{totalsA.reu}</td>
                  <td className="py-1 text-center border-r border-[#1E1915]/25">{totalsA.eli}</td>
                  <td className="py-1 text-center border-r border-[#1E1915]/25">{totalsA.int}</td>
                  <td className="py-1 text-center text-[#750d0d] border-r border-[#1E1915]/25">{totalsA.td}</td>
                  <td className="py-1 text-center border-r border-[#1E1915]/25">{totalsA.mvp}</td>
                  <td className="py-1 text-center border-r border-[#1E1915]/25">{totalsA.agro}</td>
                  <td className="py-1 text-center border-r border-[#1E1915]/25">—</td>
                  <td className="py-1 text-center border-r border-[#1E1915]/25">—</td>
                  <td className="py-1 text-center border-r border-[#1E1915]/25">{totalsA.bp}</td>
                  <td className="py-1 px-1.5 text-right border-r border-[#1E1915]/40 text-[#750d0d]">
                    Total PSP : {totalsA.psp}
                  </td>

                  <td className="navy-header text-amber-300 text-center font-sans">Σ</td>

                  <td className="py-1 px-1.5 text-right border-r border-[#1E1915]/25 text-[#750d0d]">
                    Total PSP : {totalsB.psp}
                  </td>
                  <td className="py-1 text-center border-r border-[#1E1915]/25">{totalsB.bp}</td>
                  <td className="py-1 text-center border-r border-[#1E1915]/25">—</td>
                  <td className="py-1 text-center border-r border-[#1E1915]/25">—</td>
                  <td className="py-1 text-center border-r border-[#1E1915]/25">{totalsB.reu}</td>
                  <td className="py-1 text-center border-r border-[#1E1915]/25">{totalsB.eli}</td>
                  <td className="py-1 text-center border-r border-[#1E1915]/25">{totalsB.int}</td>
                  <td className="py-1 text-center text-[#750d0d] border-r border-[#1E1915]/25">{totalsB.td}</td>
                  <td className="py-1 text-center border-r border-[#1E1915]/25">{totalsB.mvp}</td>
                  <td className="py-1 text-center">{totalsB.agro}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      </div>
    </SheetFrame>
  );
};
