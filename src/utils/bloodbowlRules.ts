import {
  BLOOD_BOWL_TEAMS,
  KICKOFF_EVENTS_TABLE,
  PRAYERS_TO_NUFFLE,
  WEATHER_TABLE,
} from '../data/bloodbowlRulesData';
import {
  KickoffEventEntry,
  MatchSheetState,
  PlayerMatchRow,
  PrayerEntry,
  SpecialRuleTag,
  TeamSheetState,
  TeamSide,
  TeamTurnMarkers,
  TurnAnnotation,
  WeatherEntry,
} from '../types/bloodbowl';

export function formatGold(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function getTeamDef(teamId: string | null) {
  if (!teamId) return null;
  return BLOOD_BOWL_TEAMS.find((t) => t.id === teamId) ?? null;
}

export function getTeamSpecialRules(team: TeamSheetState): SpecialRuleTag[] {
  const def = getTeamDef(team.teamId);
  if (team.specialRulesOverride.length > 0) {
    return team.specialRulesOverride;
  }
  return def ? def.specialRules : [];
}

export function calculateAdjustedTV(team: TeamSheetState): number {
  return Math.max(0, team.vea) + Math.max(0, team.journaliersCost);
}

export interface InducementBudgetSummary {
  adjustedTvA: number;
  adjustedTvB: number;
  status: 'equal' | 'A_higher' | 'B_higher';
  petiteCaisseA: number;
  petiteCaisseB: number;
  treasuryAddedA: number;
  treasuryAddedB: number;
  totalBudgetA: number;
  totalBudgetB: number;
  spentA: number;
  spentB: number;
  remainingA: number;
  remainingB: number;
}

export function calculateInducementBudgets(
  teamA: TeamSheetState,
  teamB: TeamSheetState
): InducementBudgetSummary {
  const adjustedTvA = calculateAdjustedTV(teamA);
  const adjustedTvB = calculateAdjustedTV(teamB);

  const spentA = teamA.inducements.reduce((sum, item) => sum + Math.max(0, item.cost || 0), 0);
  const spentB = teamB.inducements.reduce((sum, item) => sum + Math.max(0, item.cost || 0), 0);

  let status: 'equal' | 'A_higher' | 'B_higher' = 'equal';
  let petiteCaisseA = 0;
  let petiteCaisseB = 0;
  let treasuryAddedA = 0;
  let treasuryAddedB = 0;

  if (adjustedTvA > adjustedTvB) {
    status = 'A_higher';
    treasuryAddedA = Math.min(Math.max(0, teamA.treasurySpentOnInducements), Math.max(0, teamA.treasury));
    petiteCaisseB = adjustedTvA - adjustedTvB + treasuryAddedA;
    treasuryAddedB = Math.min(
      50000,
      Math.max(0, teamB.treasurySpentOnInducements),
      Math.max(0, teamB.treasury)
    );
  } else if (adjustedTvB > adjustedTvA) {
    status = 'B_higher';
    treasuryAddedB = Math.min(Math.max(0, teamB.treasurySpentOnInducements), Math.max(0, teamB.treasury));
    petiteCaisseA = adjustedTvB - adjustedTvA + treasuryAddedB;
    treasuryAddedA = Math.min(
      50000,
      Math.max(0, teamA.treasurySpentOnInducements),
      Math.max(0, teamA.treasury)
    );
  }

  const totalBudgetA = petiteCaisseA + treasuryAddedA;
  const totalBudgetB = petiteCaisseB + treasuryAddedB;

  return {
    adjustedTvA,
    adjustedTvB,
    status,
    petiteCaisseA,
    petiteCaisseB,
    treasuryAddedA,
    treasuryAddedB,
    totalBudgetA,
    totalBudgetB,
    spentA,
    spentB,
    remainingA: totalBudgetA - spentA,
    remainingB: totalBudgetB - spentB,
  };
}

export function calculatePopularityFactor(team: TeamSheetState): number {
  const fd = Math.max(0, team.dedicatedFans);
  const d3 = team.fanRollD3 !== null ? Math.max(1, Math.min(3, team.fanRollD3)) : 0;
  return fd + d3;
}

export function calculatePlayerPsp(
  player: PlayerMatchRow,
  team: TeamSheetState
): number {
  const rules = getTeamSpecialRules(team);
  const isBagarreursBrutaux = rules.includes('Bagarreurs Brutaux');

  const reuValue = team.hasPasseParfaitePrayer ? 2 : 1;
  const eliValue = isBagarreursBrutaux ? 3 : 2;
  const tdValue = isBagarreursBrutaux ? 2 : 3;
  const agroValue = team.hasFrenesieAgressionPrayer ? 2 : 0;

  return (
    Math.max(0, player.reu) * reuValue +
    Math.max(0, player.eli) * eliValue +
    Math.max(0, player.int) * 2 +
    Math.max(0, player.td) * tdValue +
    (player.mvp ? 4 : 0) +
    Math.max(0, player.agro) * agroValue
  );
}

export function getPlayerTdSum(team: TeamSheetState): number {
  return team.players.reduce((sum, p) => sum + Math.max(0, p.td), 0);
}

export function calculateTeamScore(team: TeamSheetState): number {
  if (team.manualScoreOverride !== null) {
    return Math.max(0, team.manualScoreOverride);
  }
  return getPlayerTdSum(team);
}

export function stepTeamScore(
  team: TeamSheetState,
  delta: -1 | 1
): TeamSheetState {
  const current = calculateTeamScore(team);
  const next = Math.max(0, current + delta);
  const playerSum = getPlayerTdSum(team);
  return {
    ...team,
    manualScoreOverride: next === playerSum ? null : next,
  };
}

export interface GainsBreakdown {
  baseGain: number;
  touchdownGain: number;
  nonStallGain: number;
  totalGains: number;
  concessionNote: string | null;
}

export function calculatePostMatchGains(
  team: TeamSheetState,
  opponent: TeamSheetState,
  teamScore: number,
  teamFP: number,
  opponentFP: number
): GainsBreakdown {
  if (team.conceded && !team.concededWithoutPenalty) {
    return {
      baseGain: 0,
      touchdownGain: 0,
      nonStallGain: 0,
      totalGains: 0,
      concessionNote: 'Abandon : aucun gain perçu.',
    };
  }

  if (opponent.conceded && !opponent.concededWithoutPenalty) {
    const fanAttendance = (teamFP + opponentFP) * 10000;
    const tdGain = teamScore * 10000;
    return {
      baseGain: fanAttendance,
      touchdownGain: tdGain,
      nonStallGain: 0,
      totalGains: fanAttendance + tdGain,
      concessionNote: 'Adversaire ayant concédé : affluence totale + TD × 10 000 po.',
    };
  }

  const baseGain = ((teamFP + opponentFP) / 2) * 10000;
  const touchdownGain = teamScore * 10000;
  const nonStallGain = team.nonStallBonus === true ? 10000 : 0;

  return {
    baseGain,
    touchdownGain,
    nonStallGain,
    totalGains: baseGain + touchdownGain + nonStallGain,
    concessionNote: null,
  };
}

export type MatchOutcome = 'WIN' | 'LOSS' | 'DRAW';

export function getMatchOutcome(scoreA: number, scoreB: number, side: 'A' | 'B'): MatchOutcome {
  if (scoreA === scoreB) return 'DRAW';
  if (side === 'A') return scoreA > scoreB ? 'WIN' : 'LOSS';
  return scoreB > scoreA ? 'WIN' : 'LOSS';
}

export function evaluateDedicatedFansChange(
  currentFD: number,
  rollD6: number | null,
  outcome: MatchOutcome,
  conceded = false
): { change: -1 | 0 | 1; nextFD: number } {
  if (conceded) {
    return { change: -1, nextFD: Math.max(1, currentFD - 1) };
  }
  if (outcome === 'DRAW' || rollD6 === null) {
    return { change: 0, nextFD: currentFD };
  }
  if (outcome === 'WIN') {
    if (rollD6 >= currentFD && currentFD < 7) {
      return { change: 1, nextFD: Math.min(7, currentFD + 1) };
    }
    return { change: 0, nextFD: currentFD };
  }
  // LOSS
  if (rollD6 < currentFD && currentFD > 1) {
    return { change: -1, nextFD: Math.max(1, currentFD - 1) };
  }
  return { change: 0, nextFD: currentFD };
}

export type ExpensiveMistakeSeverity =
  | 'Exempt'
  | 'Crise évitée'
  | 'Incident mineur'
  | 'Incident majeur'
  | 'Catastrophe';

export interface ExpensiveMistakeOutcome {
  triggered: boolean;
  bracketLabel: string;
  severity: ExpensiveMistakeSeverity;
  loss: number;
  finalTreasury: number;
  ruleDetail: string;
}

const MISTAKE_MATRIX: Array<
  [
    ExpensiveMistakeSeverity,
    ExpensiveMistakeSeverity,
    ExpensiveMistakeSeverity,
    ExpensiveMistakeSeverity,
    ExpensiveMistakeSeverity,
    ExpensiveMistakeSeverity
  ]
> = [
  // D6 = 1
  ['Incident mineur', 'Incident mineur', 'Incident majeur', 'Incident majeur', 'Catastrophe', 'Catastrophe'],
  // D6 = 2
  ['Crise évitée', 'Incident mineur', 'Incident mineur', 'Incident majeur', 'Incident majeur', 'Catastrophe'],
  // D6 = 3
  ['Crise évitée', 'Crise évitée', 'Incident mineur', 'Incident mineur', 'Incident majeur', 'Incident majeur'],
  // D6 = 4
  ['Crise évitée', 'Crise évitée', 'Crise évitée', 'Incident mineur', 'Incident mineur', 'Incident majeur'],
  // D6 = 5
  ['Crise évitée', 'Crise évitée', 'Crise évitée', 'Crise évitée', 'Incident mineur', 'Incident mineur'],
  // D6 = 6
  ['Crise évitée', 'Crise évitée', 'Crise évitée', 'Crise évitée', 'Crise évitée', 'Incident mineur'],
];

export function evaluateExpensiveMistakes(
  treasuryBefore: number,
  rollD6: number | null,
  subRoll?: number | null
): ExpensiveMistakeOutcome {
  const safeTreasury = Math.max(0, treasuryBefore);
  if (safeTreasury < 100000) {
    return {
      triggered: false,
      bracketLabel: '< 100 000 po',
      severity: 'Exempt',
      loss: 0,
      finalTreasury: safeTreasury,
      ruleDetail: 'Aucune erreur coûteuse sous 100 000 po en trésorerie.',
    };
  }

  let col = 0;
  let bracketLabel = '100 000 – 195 000 po';
  if (safeTreasury >= 600000) {
    col = 5;
    bracketLabel = '600 000 po et +';
  } else if (safeTreasury >= 500000) {
    col = 4;
    bracketLabel = '500 000 – 595 000 po';
  } else if (safeTreasury >= 400000) {
    col = 3;
    bracketLabel = '400 000 – 495 000 po';
  } else if (safeTreasury >= 300000) {
    col = 2;
    bracketLabel = '300 000 – 395 000 po';
  } else if (safeTreasury >= 200000) {
    col = 1;
    bracketLabel = '200 000 – 295 000 po';
  }

  if (rollD6 === null || rollD6 < 1 || rollD6 > 6) {
    return {
      triggered: true,
      bracketLabel,
      severity: 'Crise évitée',
      loss: 0,
      finalTreasury: safeTreasury,
      ruleDetail: `Trésorerie ≥ 100 000 po (${bracketLabel}) : lancez 1D6.`,
    };
  }

  const severity = MISTAKE_MATRIX[rollD6 - 1][col];

  if (severity === 'Crise évitée') {
    return {
      triggered: true,
      bracketLabel,
      severity,
      loss: 0,
      finalTreasury: safeTreasury,
      ruleDetail: 'Crise évitée : rien ne se passe.',
    };
  }

  if (severity === 'Incident mineur') {
    const d3 = Math.max(1, Math.min(3, subRoll ?? 2));
    const loss = Math.min(safeTreasury, d3 * 10000);
    return {
      triggered: true,
      bracketLabel,
      severity,
      loss,
      finalTreasury: safeTreasury - loss,
      ruleDetail: `Incident mineur : perte de ${d3} × 10 000 po (${formatGold(loss)} po).`,
    };
  }

  if (severity === 'Incident majeur') {
    const kept = Math.floor(safeTreasury / 2 / 5000) * 5000;
    const loss = safeTreasury - kept;
    return {
      triggered: true,
      bracketLabel,
      severity,
      loss,
      finalTreasury: kept,
      ruleDetail: `Incident majeur : trésorerie divisée par 2 (arrondi aux 5 000 po inférieurs).`,
    };
  }

  // Catastrophe
  const twoD6 = Math.max(2, Math.min(12, subRoll ?? 7));
  const kept = Math.min(safeTreasury, twoD6 * 10000);
  const loss = safeTreasury - kept;
  return {
    triggered: true,
    bracketLabel,
    severity,
    loss,
    finalTreasury: kept,
    ruleDetail: `Catastrophe : vous ne conservez que ${twoD6} × 10 000 po (${formatGold(kept)} po).`,
  };
}

export function getWeatherByRoll(roll2D6: number): WeatherEntry {
  return (
    WEATHER_TABLE.find((w) => roll2D6 >= w.min && roll2D6 <= w.max) ?? WEATHER_TABLE[2]
  );
}

export function getKickoffEventByRoll(roll2D6: number): KickoffEventEntry {
  return (
    KICKOFF_EVENTS_TABLE.find((e) => e.roll === roll2D6) ?? KICKOFF_EVENTS_TABLE[5]
  );
}

export function getPrayerByRoll(rollD16: number): PrayerEntry {
  return PRAYERS_TO_NUFFLE.find((p) => p.roll === rollD16) ?? PRAYERS_TO_NUFFLE[0];
}

export function createEmptyPlayers(): PlayerMatchRow[] {
  return Array.from({ length: 16 }, (_, idx) => ({
    number: idx + 1,
    name: '',
    position: '',
    reu: 0,
    eli: 0,
    int: 0,
    td: 0,
    mvp: false,
    agro: 0,
    sequelles: '',
    rpm: false,
    retireTemp: false,
    bp: 0,
  }));
}

export function createEmptyTurnMarkers(): TeamTurnMarkers {
  return {
    blitz: false,
    pass: false,
    handoff: false,
    foul: false,
  };
}

export function clampTurnMarker(turn: number): number {
  if (!Number.isFinite(turn)) return 0;
  return Math.max(0, Math.min(8, Math.round(turn)));
}

export function stepTeamTurn(currentTurn: number, delta: -1 | 1): number {
  return clampTurnMarker(clampTurnMarker(currentTurn) + delta);
}

export function getGlobalTurnNumber(half: 1 | 2, turnInHalf: number): number {
  const safeTurn = clampTurnMarker(turnInHalf);
  if (safeTurn === 0) return 0;
  return (half - 1) * 8 + safeTurn;
}

export function clampRerolls(rerolls: number): number {
  if (!Number.isFinite(rerolls)) return 0;
  return Math.max(0, Math.min(16, Math.round(rerolls)));
}

export function stepTeamRerolls(currentRerolls: number, delta: -1 | 1): number {
  return clampRerolls(clampRerolls(currentRerolls) + delta);
}

export function normalizeUsedRerolls(
  usedRerolls: unknown,
  totalRerolls: number
): boolean[] {
  const count = clampRerolls(totalRerolls);
  const source = Array.isArray(usedRerolls) ? usedRerolls : [];
  return Array.from({ length: count }, (_, idx) => Boolean(source[idx]));
}

export function setUsedReroll(
  usedRerolls: boolean[],
  index: number,
  used: boolean,
  totalRerolls: number
): boolean[] {
  const next = normalizeUsedRerolls(usedRerolls, totalRerolls);
  if (index < 0 || index >= next.length) return next;
  next[index] = Boolean(used);
  return next;
}

export function toggleUsedReroll(
  usedRerolls: boolean[],
  index: number,
  totalRerolls: number
): boolean[] {
  const next = normalizeUsedRerolls(usedRerolls, totalRerolls);
  if (index < 0 || index >= next.length) return next;
  next[index] = !next[index];
  return next;
}

export function getUsedRerollsCount(
  totalRerolls: number,
  usedRerolls: boolean[]
): number {
  return normalizeUsedRerolls(usedRerolls, totalRerolls).filter(Boolean).length;
}

export function getRemainingRerolls(
  totalRerolls: number,
  usedRerolls: boolean[]
): number {
  const total = clampRerolls(totalRerolls);
  return Math.max(0, total - getUsedRerollsCount(total, usedRerolls));
}

export function normalizeMatchState(
  raw: Partial<MatchSheetState> | null | undefined
): MatchSheetState {
  const base = createInitialMatchState();
  if (!raw || typeof raw !== 'object') return base;

  const normalizeTeam = (
    rawTeam: Partial<TeamSheetState> | undefined
  ): TeamSheetState => {
    const empty = createEmptyTeamState();
    if (!rawTeam || typeof rawTeam !== 'object') return empty;
    const normalizedRerolls = clampRerolls(rawTeam.rerolls ?? empty.rerolls);
    return {
      ...empty,
      ...rawTeam,
      currentTurn: clampTurnMarker(rawTeam.currentTurn ?? 0),
      turnMarkers: {
        ...createEmptyTurnMarkers(),
        ...(rawTeam.turnMarkers ?? {}),
      },
      rerolls: normalizedRerolls,
      usedRerolls: normalizeUsedRerolls(rawTeam.usedRerolls, normalizedRerolls),
      players: Array.isArray(rawTeam.players)
        ? empty.players.map((defaultRow, idx) => ({
            ...defaultRow,
            ...(rawTeam.players?.[idx] ?? {}),
            number: idx + 1,
          }))
        : empty.players,
      inducements: Array.isArray(rawTeam.inducements)
        ? empty.inducements.map((defaultLine, idx) => ({
            ...defaultLine,
            ...(rawTeam.inducements?.[idx] ?? {}),
          }))
        : empty.inducements,
    };
  };

  return {
    ...base,
    ...raw,
    half: raw.half === 2 ? 2 : 1,
    activeTurnSide:
      raw.activeTurnSide === 'A' || raw.activeTurnSide === 'B'
        ? raw.activeTurnSide
        : null,
    teamA: normalizeTeam(raw.teamA),
    teamB: normalizeTeam(raw.teamB),
    turns: Array.isArray(raw.turns)
      ? base.turns.map((defaultTurn, idx) => ({
          ...defaultTurn,
          ...(raw.turns?.[idx] ?? {}),
          turn: idx + 1,
        }))
      : base.turns,
    kickoffEventsLog: Array.isArray(raw.kickoffEventsLog)
      ? raw.kickoffEventsLog
      : [],
  };
}

export type MatchBackupParseResult =
  | { ok: true; match: MatchSheetState }
  | { ok: false; error: string };

export function parseMatchBackupJson(jsonText: string): MatchBackupParseResult {
  const trimmed = jsonText.replace(/^\uFEFF/, '').trim();
  if (!trimmed) {
    return {
      ok: false,
      error: 'Le fichier sélectionné est vide.',
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return {
      ok: false,
      error: 'Format JSON invalide : impossible de lire la sauvegarde.',
    };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      ok: false,
      error:
        'Cette sauvegarde ne correspond pas à une feuille de match Blood Bowl.',
    };
  }

  const candidate =
    'match' in parsed &&
    parsed.match &&
    typeof parsed.match === 'object' &&
    !Array.isArray(parsed.match)
      ? (parsed.match as Record<string, unknown>)
      : (parsed as Record<string, unknown>);

  const hasTeamA =
    'teamA' in candidate &&
    candidate.teamA !== null &&
    typeof candidate.teamA === 'object' &&
    !Array.isArray(candidate.teamA);
  const hasTeamB =
    'teamB' in candidate &&
    candidate.teamB !== null &&
    typeof candidate.teamB === 'object' &&
    !Array.isArray(candidate.teamB);

  if (!hasTeamA || !hasTeamB) {
    return {
      ok: false,
      error:
        'Sauvegarde non reconnue : les données d’Équipe A et d’Équipe B sont manquantes.',
    };
  }

  const normalized = normalizeMatchState(candidate as Partial<MatchSheetState>);
  return {
    ok: true,
    match: {
      ...normalized,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function createEmptyTeamState(): TeamSheetState {
  return {
    teamId: null,
    name: '',
    coach: '',
    tve: 1000000,
    vea: 1000000,
    journaliersCost: 0,
    treasury: 0,
    treasurySpentOnInducements: 0,
    useMax50kTreasury: false,
    dedicatedFans: 1,
    fanRollD3: null,
    hasJournaliers: false,
    inducements: Array.from({ length: 5 }, () => ({ name: '', cost: 0 })),
    prayers: ['', ''],
    kickoffChoice: null,
    players: createEmptyPlayers(),
    manualScoreOverride: null,
    nonStallBonus: true,
    conceded: false,
    concededWithoutPenalty: false,
    fdPostMatchRoll: null,
    fdManualChange: null,
    pspSpentNotes: ['', ''],
    rosterMovesNotes: ['', ''],
    postMatchPurchasesCost: 0,
    expensiveMistakeRoll: null,
    expensiveMistakeSubRoll: null,
    specialRulesOverride: [],
    hasPasseParfaitePrayer: false,
    hasReceptionEtourdissantePrayer: false,
    hasFrenesieAgressionPrayer: false,
    currentTurn: 0,
    turnMarkers: createEmptyTurnMarkers(),
    rerolls: 3,
    usedRerolls: [false, false, false],
  };
}

export function createInitialMatchState(): MatchSheetState {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: `bb-${Date.now()}`,
    date: today,
    location: 'Stade de l’Empereur, Altdorf',
    stadium: 'Gazon Standard',
    stadiumAttribute: 'Aucun attribut spécial',
    weatherRoll: 7,
    weatherName: 'Conditions Idéales',
    teamA: createEmptyTeamState(),
    teamB: createEmptyTeamState(),
    turns: Array.from({ length: 16 }, (_, idx) => ({
      turn: idx + 1,
      teamA: '',
      teamB: '',
    })),
    half: 1,
    activeTurnSide: null,
    kickoffEventsLog: [],
    updatedAt: new Date().toISOString(),
  };
}

export function createDemoMatchState(): MatchSheetState {
  const base = createInitialMatchState();
  base.date = '2026-11-18';
  base.location = 'Stade Mémoriel Luitpold I';
  base.stadium = 'Pelouse Sacrée';
  base.stadiumAttribute = 'Foule survoltée';
  base.weatherRoll = 7;
  base.weatherName = 'Conditions Idéales';

  const playersA = createEmptyPlayers();
  playersA[0] = { ...playersA[0], name: 'Griff Oberwald Jr', position: 'Blitzer', td: 1, eli: 1 };
  playersA[1] = { ...playersA[1], name: 'Konrad Von Stark', position: 'Lanceur', reu: 2 };
  playersA[2] = { ...playersA[2], name: 'Heinrich Blitz', position: 'Blitzer', eli: 1, mvp: true };
  playersA[3] = { ...playersA[3], name: 'Lukas Schnell', position: 'Receveur', td: 1 };
  playersA[4] = { ...playersA[4], name: 'Bram le Mur', position: 'Ogre', eli: 1 };
  playersA[5] = { ...playersA[5], name: 'Otto Dietrich', position: 'Trois-quart Humain', agro: 1, rpm: true, sequelles: '-1 AR' };

  const playersB = createEmptyPlayers();
  playersB[0] = { ...playersB[0], name: 'Varag Kogn’Dur', position: 'Blitzer Orque', eli: 2, td: 1 };
  playersB[1] = { ...playersB[1], name: 'Gorgutz Krazeur', position: 'Bloqueur Kosto', eli: 1, mvp: true };
  playersB[2] = { ...playersB[2], name: 'Zog Passe-Vite', position: 'Lanceur Orque', reu: 1 };
  playersB[3] = { ...playersB[3], name: 'Snaga Gobelin', position: 'Trois-quart Gobelin', agro: 1 };
  playersB[4] = { ...playersB[4], name: 'Grishnak le Kosto', position: 'Bloqueur Kosto', bp: 1, rpm: true, sequelles: '-1 M' };

  base.teamA = {
    ...createEmptyTeamState(),
    teamId: 'humains',
    name: 'Reikland Reavers',
    coach: 'Marc-Antoine',
    tve: 1240000,
    vea: 1240000,
    journaliersCost: 0,
    treasury: 110000,
    treasurySpentOnInducements: 50000,
    dedicatedFans: 4,
    fanRollD3: 2,
    hasJournaliers: false,
    inducements: [
      { name: 'Fût de Blitz Premium', cost: 50000 },
      { name: '', cost: 0 },
      { name: '', cost: 0 },
      { name: '', cost: 0 },
      { name: '', cost: 0 },
    ],
    prayers: ['', ''],
    kickoffChoice: 'receive',
    players: playersA,
    nonStallBonus: true,
    fdPostMatchRoll: 5,
    pspSpentNotes: ['Heinrich Blitz (6 PSP) : Esquive (Principale)', ''],
    rosterMovesNotes: ['Otto Dietrich rate le prochain match (-1 AR)', ''],
    expensiveMistakeRoll: 4,
  };

  base.teamB = {
    ...createEmptyTeamState(),
    teamId: 'orques',
    name: 'Orcland Raiders',
    coach: 'Grégory',
    tve: 1250000,
    vea: 1160000,
    journaliersCost: 0,
    treasury: 85000,
    treasurySpentOnInducements: 10000,
    useMax50kTreasury: true,
    dedicatedFans: 3,
    fanRollD3: 2,
    hasJournaliers: false,
    inducements: [
      { name: 'Pot-de-vin', cost: 100000 },
      { name: 'Prières à Nuffle (x3)', cost: 30000 },
      { name: 'Cheerleaders Intérimaires (x2)', cost: 10000 },
      { name: '', cost: 0 },
      { name: '', cost: 0 },
    ],
    prayers: ['5. Gants Cloutés (Varag Kogn’Dur)', '13. Frénésie d’Agression'],
    kickoffChoice: 'kick',
    players: playersB,
    nonStallBonus: true,
    fdPostMatchRoll: 2,
    pspSpentNotes: ['Varag Kogn’Dur (8 PSP) : Châtaigne', ''],
    rosterMovesNotes: ['Grishnak (-1 M + BP) -> Retraite envisagée', ''],
    expensiveMistakeRoll: 3,
    hasFrenesieAgressionPrayer: true,
    currentTurn: 8,
    turnMarkers: createEmptyTurnMarkers(),
    rerolls: 2,
    usedRerolls: [true, false],
  };

  base.half = 2;
  base.activeTurnSide = 'A';
  base.teamA.currentTurn = 8;
  base.teamA.rerolls = 3;
  base.teamA.usedRerolls = [true, false, false];
  base.turns[0] = { turn: 1, teamA: 'Réception propre, cage au centre', teamB: 'Blitz sur aile gauche' };
  base.turns[2] = { turn: 3, teamA: 'Passe de Konrad -> TD de Lukas !', teamB: 'Varag élimine Otto (-1 AR)' };
  base.turns[7] = { turn: 8, teamA: 'Défense solide', teamB: 'Varag égalise sur le fil (1-1)' };
  base.turns[11] = { turn: 12, teamA: 'Percée de Griff Jr -> TD (2-1)', teamB: 'Pot-de-vin utilisé après agression de Snaga' };

  return base;
}

export interface ActivePlayerSummary {
  number: number;
  name: string;
  position: string;
  reu: number;
  eli: number;
  int: number;
  td: number;
  mvp: boolean;
  agro: number;
  bp: number;
  rpm: boolean;
  retireTemp: boolean;
  sequelles: string;
  psp: number;
}

export interface TeamPlayerTotals {
  reu: number;
  eli: number;
  int: number;
  td: number;
  agro: number;
  mvp: number;
  bp: number;
  psp: number;
}

export interface TeamMatchSummaryData {
  side: TeamSide;
  name: string;
  factionName: string | null;
  coach: string;
  specialRules: SpecialRuleTag[];
  score: number;
  tve: number;
  vea: number;
  journaliersCost: number;
  adjustedTv: number;
  petiteCaisse: number;
  treasuryAdded: number;
  inducementBudgetTotal: number;
  inducementItems: Array<{ name: string; cost: number }>;
  inducementsSpent: number;
  dedicatedFansBefore: number;
  fanRollD3: number | null;
  popularityFactor: number;
  kickoffChoice: 'kick' | 'receive' | null;
  prayers: string[];
  activePlayers: ActivePlayerSummary[];
  totals: TeamPlayerTotals;
  injuredPlayers: ActivePlayerSummary[];
  pspEligiblePlayers: ActivePlayerSummary[];
  gains: GainsBreakdown;
  fdPostMatchRoll: number | null;
  fdChange: -1 | 0 | 1;
  dedicatedFansAfter: number;
  treasuryBefore: number;
  postMatchPurchasesCost: number;
  treasuryBeforeMistakes: number;
  expensiveMistake: ExpensiveMistakeOutcome;
  finalTreasury: number;
  pspSpentNotes: string[];
  rosterMovesNotes: string[];
  rerolls: number;
  usedRerollsCount: number;
  remainingRerolls: number;
  currentTurn: number;
  conceded: boolean;
  concededWithoutPenalty: boolean;
}

export interface MatchSummaryData {
  date: string;
  location: string;
  stadium: string;
  stadiumAttribute: string;
  weatherRoll: number | null;
  weatherName: string;
  half: 1 | 2;
  activeTurnSide: TeamSide | null;
  outcomeLabel: string;
  teamA: TeamMatchSummaryData;
  teamB: TeamMatchSummaryData;
  highlightedTurns: TurnAnnotation[];
  kickoffEventsLog: MatchSheetState['kickoffEventsLog'];
}

function isPlayerRowActive(player: PlayerMatchRow): boolean {
  return (
    player.name.trim() !== '' ||
    (player.position ?? '').trim() !== '' ||
    player.reu > 0 ||
    player.eli > 0 ||
    player.int > 0 ||
    player.td > 0 ||
    player.mvp ||
    player.agro > 0 ||
    player.bp > 0 ||
    player.rpm ||
    player.retireTemp ||
    player.sequelles.trim() !== ''
  );
}

export function buildMatchSummaryData(match: MatchSheetState): MatchSummaryData {
  const scoreA = calculateTeamScore(match.teamA);
  const scoreB = calculateTeamScore(match.teamB);
  const fpA = calculatePopularityFactor(match.teamA);
  const fpB = calculatePopularityFactor(match.teamB);
  const budgets = calculateInducementBudgets(match.teamA, match.teamB);

  const buildTeamSummary = (
    side: TeamSide,
    team: TeamSheetState,
    opponent: TeamSheetState,
    teamScore: number,
    oppScore: number,
    teamFP: number,
    oppFP: number
  ): TeamMatchSummaryData => {
    const def = getTeamDef(team.teamId);
    const specialRules = getTeamSpecialRules(team);
    const activePlayers: ActivePlayerSummary[] = team.players
      .filter(isPlayerRowActive)
      .map((p) => ({
        number: p.number,
        name: p.name.trim() || `Joueur #${p.number}`,
        position: (p.position ?? '').trim(),
        reu: Math.max(0, p.reu),
        eli: Math.max(0, p.eli),
        int: Math.max(0, p.int),
        td: Math.max(0, p.td),
        mvp: Boolean(p.mvp),
        agro: Math.max(0, p.agro),
        bp: Math.max(0, p.bp),
        rpm: Boolean(p.rpm),
        retireTemp: Boolean(p.retireTemp),
        sequelles: p.sequelles.trim(),
        psp: calculatePlayerPsp(p, team),
      }));

    const totals = activePlayers.reduce<TeamPlayerTotals>(
      (acc, p) => ({
        reu: acc.reu + p.reu,
        eli: acc.eli + p.eli,
        int: acc.int + p.int,
        td: acc.td + p.td,
        agro: acc.agro + p.agro,
        mvp: acc.mvp + (p.mvp ? 1 : 0),
        bp: acc.bp + p.bp,
        psp: acc.psp + p.psp,
      }),
      { reu: 0, eli: 0, int: 0, td: 0, agro: 0, mvp: 0, bp: 0, psp: 0 }
    );

    const injuredPlayers = activePlayers.filter(
      (p) => p.rpm || p.retireTemp || p.bp > 0 || p.sequelles !== ''
    );
    const pspEligiblePlayers = activePlayers.filter((p) => p.psp >= 3);

    const gains = calculatePostMatchGains(
      team,
      opponent,
      teamScore,
      teamFP,
      oppFP
    );

    const outcome = getMatchOutcome(
      side === 'A' ? teamScore : oppScore,
      side === 'A' ? oppScore : teamScore,
      side
    );
    const autoFd = evaluateDedicatedFansChange(
      team.dedicatedFans,
      team.fdPostMatchRoll,
      outcome,
      team.conceded && !team.concededWithoutPenalty
    );
    const fdChange = team.fdManualChange ?? autoFd.change;
    const dedicatedFansAfter = Math.max(
      1,
      Math.min(7, team.dedicatedFans + fdChange)
    );

    const treasuryAdded =
      side === 'A' ? budgets.treasuryAddedA : budgets.treasuryAddedB;
    const petiteCaisse =
      side === 'A' ? budgets.petiteCaisseA : budgets.petiteCaisseB;
    const inducementBudgetTotal =
      side === 'A' ? budgets.totalBudgetA : budgets.totalBudgetB;
    const inducementsSpent =
      side === 'A' ? budgets.spentA : budgets.spentB;

    const treasuryBeforeMistakes = Math.max(
      0,
      team.treasury -
        treasuryAdded +
        gains.totalGains -
        Math.max(0, team.postMatchPurchasesCost)
    );
    const expensiveMistake = evaluateExpensiveMistakes(
      treasuryBeforeMistakes,
      team.expensiveMistakeRoll,
      team.expensiveMistakeSubRoll
    );

    return {
      side,
      name: team.name.trim() || (side === 'A' ? 'Équipe A' : 'Équipe B'),
      factionName: def ? def.name : null,
      coach: team.coach.trim(),
      specialRules,
      score: teamScore,
      tve: Math.max(0, team.tve),
      vea: Math.max(0, team.vea),
      journaliersCost: Math.max(0, team.journaliersCost),
      adjustedTv: calculateAdjustedTV(team),
      petiteCaisse,
      treasuryAdded,
      inducementBudgetTotal,
      inducementItems: team.inducements
        .map((item) => ({ name: item.name.trim(), cost: Math.max(0, item.cost || 0) }))
        .filter((item) => item.name !== '' || item.cost > 0),
      inducementsSpent,
      dedicatedFansBefore: Math.max(1, team.dedicatedFans),
      fanRollD3: team.fanRollD3,
      popularityFactor: teamFP,
      kickoffChoice: team.kickoffChoice,
      prayers: team.prayers.map((p) => p.trim()).filter(Boolean),
      activePlayers,
      totals,
      injuredPlayers,
      pspEligiblePlayers,
      gains,
      fdPostMatchRoll: team.fdPostMatchRoll,
      fdChange,
      dedicatedFansAfter,
      treasuryBefore: Math.max(0, team.treasury),
      postMatchPurchasesCost: Math.max(0, team.postMatchPurchasesCost),
      treasuryBeforeMistakes,
      expensiveMistake,
      finalTreasury: expensiveMistake.finalTreasury,
      pspSpentNotes: team.pspSpentNotes.map((s) => s.trim()).filter(Boolean),
      rosterMovesNotes: team.rosterMovesNotes.map((s) => s.trim()).filter(Boolean),
      rerolls: clampRerolls(team.rerolls),
      usedRerollsCount: getUsedRerollsCount(team.rerolls, team.usedRerolls),
      remainingRerolls: getRemainingRerolls(team.rerolls, team.usedRerolls),
      currentTurn: clampTurnMarker(team.currentTurn),
      conceded: team.conceded,
      concededWithoutPenalty: team.concededWithoutPenalty,
    };
  };

  const teamA = buildTeamSummary('A', match.teamA, match.teamB, scoreA, scoreB, fpA, fpB);
  const teamB = buildTeamSummary('B', match.teamB, match.teamA, scoreB, scoreA, fpB, fpA);

  let outcomeLabel = 'Match Nul';
  if (scoreA > scoreB) {
    outcomeLabel = `Victoire ${teamA.name}`;
  } else if (scoreB > scoreA) {
    outcomeLabel = `Victoire ${teamB.name}`;
  }

  return {
    date: match.date,
    location: match.location.trim(),
    stadium: match.stadium.trim(),
    stadiumAttribute: match.stadiumAttribute.trim(),
    weatherRoll: match.weatherRoll,
    weatherName: match.weatherName.trim(),
    half: match.half,
    activeTurnSide: match.activeTurnSide,
    outcomeLabel,
    teamA,
    teamB,
    highlightedTurns: match.turns.filter(
      (t) => t.teamA.trim() !== '' || t.teamB.trim() !== ''
    ),
    kickoffEventsLog: match.kickoffEventsLog,
  };
}

