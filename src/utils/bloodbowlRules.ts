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
  TeamTurnMarkers,
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

export function calculateTeamScore(team: TeamSheetState): number {
  if (team.manualScoreOverride !== null) {
    return Math.max(0, team.manualScoreOverride);
  }
  return team.players.reduce((sum, p) => sum + Math.max(0, p.td), 0);
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
    return {
      ...empty,
      ...rawTeam,
      currentTurn: clampTurnMarker(rawTeam.currentTurn ?? 0),
      turnMarkers: {
        ...createEmptyTurnMarkers(),
        ...(rawTeam.turnMarkers ?? {}),
      },
      players:
        Array.isArray(rawTeam.players) && rawTeam.players.length === 16
          ? rawTeam.players
          : empty.players,
      inducements:
        Array.isArray(rawTeam.inducements) && rawTeam.inducements.length === 5
          ? rawTeam.inducements
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
    turns:
      Array.isArray(raw.turns) && raw.turns.length === 16
        ? raw.turns
        : base.turns,
    kickoffEventsLog: Array.isArray(raw.kickoffEventsLog)
      ? raw.kickoffEventsLog
      : [],
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
  };

  base.half = 2;
  base.activeTurnSide = 'A';
  base.teamA.currentTurn = 8;
  base.turns[0] = { turn: 1, teamA: 'Réception propre, cage au centre', teamB: 'Blitz sur aile gauche' };
  base.turns[2] = { turn: 3, teamA: 'Passe de Konrad -> TD de Lukas !', teamB: 'Varag élimine Otto (-1 AR)' };
  base.turns[7] = { turn: 8, teamA: 'Défense solide', teamB: 'Varag égalise sur le fil (1-1)' };
  base.turns[11] = { turn: 12, teamA: 'Percée de Griff Jr -> TD (2-1)', teamB: 'Pot-de-vin utilisé après agression de Snaga' };

  return base;
}
