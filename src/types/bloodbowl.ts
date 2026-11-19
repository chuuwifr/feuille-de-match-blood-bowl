export type TeamSide = 'A' | 'B';

export type SheetViewMode = 'recto' | 'verso' | 'both';

export type SpecialRuleTag =
  | 'Bagarreurs Brutaux'
  | 'Chantage & Corruption'
  | 'Trois-quarts à Vil Prix'
  | 'Maîtres de la Non-Vie'
  | 'Déferlement'
  | 'Capitaine'
  | 'Favoris de Khorne'
  | 'Favoris de Nurgle'
  | 'Favoris de Hashut'
  | 'Favoris de Slaanesh'
  | 'Favoris de Tzeentch'
  | 'Favoris du Chaos Universel';

export interface PlayerPositionDef {
  qty: string;
  role: string;
  cost: number;
  ma: number;
  st: number;
  ag: string;
  pa: string;
  av: string;
  skills: string;
  primary: string;
  secondary: string;
  isLineman?: boolean;
}

export interface BloodBowlTeamDef {
  id: string;
  name: string;
  league: string;
  tier: 1 | 2 | 3 | 4;
  rerollCost: number;
  apothecary: boolean;
  specialRules: SpecialRuleTag[];
  linemanCost: number;
  linemanName: string;
  positions: PlayerPositionDef[];
}

export interface InducementLine {
  name: string;
  cost: number;
}

export interface PlayerMatchRow {
  number: number; // 1..16
  name: string;
  position?: string;
  reu: number; // Réussite (+1 PSP, or +2 with Passe Parfaite)
  eli: number; // Élimination (+2 PSP, or +3 with Bagarreurs Brutaux)
  int: number; // Interception (+2 PSP)
  td: number; // Touchdown (+3 PSP, or +2 with Bagarreurs Brutaux)
  mvp: boolean; // Joueur du Match (+4 PSP)
  agro: number; // Agression
  sequelles: string; // e.g., '', '-1 AR', '-1 M', '-1 CP', '-1 AG', '-1 F', 'Mort'
  rpm: boolean; // Rate le prochain match (or RT)
  retireTemp: boolean; // RT - Retraite Temporaire
  bp: number; // Blessures Persistantes
}

export interface TeamTurnMarkers {
  blitz: boolean;
  pass: boolean;
  handoff: boolean;
  foul: boolean;
}

export interface TeamSheetState {
  teamId: string | null; // Optional preset ID from BloodBowlTeamDef
  name: string;
  coach: string;
  tve: number; // Valeur d'équipe totale (TV)
  vea: number; // Valeur d'équipe actuelle (CVA / CTV)
  journaliersCost: number; // Coût des journaliers ajoutés avant-match
  treasury: number; // Trésorerie disponible avant-match
  treasurySpentOnInducements: number; // Montant de trésorerie dépensé en coups de pouce
  useMax50kTreasury: boolean; // Case "+ 50 000 po max" (pour l'équipe la plus faible)
  dedicatedFans: number; // FD (1..7)
  fanRollD3: number | null; // Jet 1D3 Fans Occasionnels
  hasJournaliers: boolean | null; // Oui / Non
  inducements: InducementLine[]; // 5 lignes sur la feuille
  prayers: [string, string]; // 2 lignes de Prières de Nuffle
  kickoffChoice: 'kick' | 'receive' | null; // Toast du coup d'envoi
  players: PlayerMatchRow[]; // 16 lignes (1..16)
  manualScoreOverride: number | null; // Si null, somme des TD joueurs
  nonStallBonus: boolean | null; // Bonus de non-temporisation (+10 000 po)
  conceded: boolean; // A concédé le match
  concededWithoutPenalty: boolean; // Concédé sans pénalité
  fdPostMatchRoll: number | null; // Jet 1D6 pour Fans Dévoués après-match
  fdManualChange: -1 | 0 | 1 | null; // Si null, auto-calculé selon victoire/défaite/nul
  pspSpentNotes: [string, string];
  rosterMovesNotes: [string, string];
  postMatchPurchasesCost: number; // Achats / ajustements manuels de trésorerie post-match
  expensiveMistakeRoll: number | null; // Jet d'erreur 1D6
  expensiveMistakeSubRoll: number | null; // 1D3 (Mineur) ou 2D6 (Catastrophe)
  specialRulesOverride: SpecialRuleTag[];
  hasPasseParfaitePrayer: boolean;
  hasReceptionEtourdissantePrayer: boolean;
  hasFrenesieAgressionPrayer: boolean;
  currentTurn: number; // 0..8 dans la mi-temps active
  turnMarkers: TeamTurnMarkers;
  rerolls: number; // Stock de relances restantes (0..16)
}

export interface TurnAnnotation {
  turn: number; // 1..16
  teamA: string;
  teamB: string;
}

export interface MatchSheetState {
  id: string;
  date: string;
  location: string;
  stadium: string;
  stadiumAttribute: string;
  weatherRoll: number | null; // 2D6
  weatherName: string;
  teamA: TeamSheetState;
  teamB: TeamSheetState;
  turns: TurnAnnotation[]; // 16 tours
  half: 1 | 2;
  activeTurnSide: TeamSide | null;
  kickoffEventsLog: Array<{
    phase: string;
    roll2d6: number;
    title: string;
  }>;
  updatedAt: string;
}

export interface WeatherEntry {
  min: number;
  max: number;
  name: string;
  effect: string;
}

export interface KickoffEventEntry {
  roll: number;
  title: string;
  description: string;
}

export interface PrayerEntry {
  roll: number;
  title: string;
  description: string;
}

export interface InducementCatalogEntry {
  id: string;
  name: string;
  baseCost: number;
  maxQty: number;
  description: string;
  discountRule?: SpecialRuleTag | 'Halflings';
  discountCost?: number;
  discountMaxQty?: number;
  requiredRule?: SpecialRuleTag;
  requiresApothecary?: boolean;
}
