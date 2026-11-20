import * as XLSX from 'xlsx';
import { BLOOD_BOWL_TEAMS } from '../data/bloodbowlRulesData';
import {
  BloodBowlTeamDef,
  PlayerMatchRow,
  SpecialRuleTag,
} from '../types/bloodbowl';
import { clampRerolls, createEmptyPlayers } from './bloodbowlRules';

export interface ImportedPlayerSummary {
  number: number; // 1..16
  name: string;
  position: string;
  keywords: string;
  ma: string;
  st: string;
  ag: string;
  pa: string;
  av: string;
  skills: string;
  cost: number;
  rpm: boolean;
  bp: number;
}

export interface ImportedTeamRoster {
  sheetName: string;
  teamName: string;
  faction: string;
  matchedTeamDef: BloodBowlTeamDef | null;
  coach: string;
  league: string;
  specialRules: SpecialRuleTag[];
  rawSpecialRules: string;
  treasury: number;
  dedicatedFans: number;
  rerolls: number;
  rerollCost: number;
  assistants: number;
  cheerleaders: number;
  journaliersCount: number;
  tve: number;
  vea: number;
  players: ImportedPlayerSummary[];
  warnings: string[];
}

export interface ParsedWorkbookResult {
  fileName: string;
  sheets: ImportedTeamRoster[];
}

const ALL_SPECIAL_RULES: SpecialRuleTag[] = [
  'Bagarreurs Brutaux',
  'Chantage & Corruption',
  'Trois-quarts à Vil Prix',
  'Maîtres de la Non-Vie',
  'Déferlement',
  'Capitaine',
  'Favoris de Khorne',
  'Favoris de Nurgle',
  'Favoris de Hashut',
  'Favoris de Slaanesh',
  'Favoris de Tzeentch',
  'Favoris du Chaos Universel',
];

const FACTION_ALIASES: Record<string, string> = {
  alliancevieuxmonde: 'alliance-vieux-monde',
  oldworldalliance: 'alliance-vieux-monde',
  amazones: 'amazones',
  amazon: 'amazones',
  amazons: 'amazones',
  basfonds: 'bas-fonds',
  underworld: 'bas-fonds',
  underworlddenizens: 'bas-fonds',
  bretonniens: 'bretonniens',
  bretonnia: 'bretonniens',
  elfesnoirs: 'elfes-noirs',
  darkelves: 'elfes-noirs',
  elfessylvains: 'elfes-sylvains',
  woodelves: 'elfes-sylvains',
  elusduchaos: 'elus-du-chaos',
  chaoschosen: 'elus-du-chaos',
  gnomes: 'gnomes',
  gnome: 'gnomes',
  gobelins: 'gobelins',
  goblins: 'gobelins',
  halflings: 'halflings',
  halfling: 'halflings',
  hautselfes: 'hauts-elfes',
  highelves: 'hauts-elfes',
  hommeslezards: 'hommes-lezards',
  lizardmen: 'hommes-lezards',
  horreursnecromantiques: 'horreurs-necromantiques',
  necromantichorrors: 'horreurs-necromantiques',
  necromantique: 'horreurs-necromantiques',
  humains: 'humains',
  humans: 'humains',
  human: 'humains',
  khorne: 'khorne',
  mortsambulants: 'morts-ambulants',
  mortsvivants: 'morts-ambulants',
  shamblingundead: 'morts-ambulants',
  undead: 'morts-ambulants',
  nains: 'nains',
  dwarfs: 'nains',
  dwarves: 'nains',
  nainsduchaos: 'nains-du-chaos',
  chaosdwarfs: 'nains-du-chaos',
  noblesseimperiale: 'noblesse-imperiale',
  imperialnobility: 'noblesse-imperiale',
  nordiques: 'nordiques',
  norse: 'nordiques',
  nurgle: 'nurgle',
  ogres: 'ogres',
  ogre: 'ogres',
  orques: 'orques',
  orcs: 'orques',
  orquesnoirs: 'orques-noirs',
  blackorcs: 'orques-noirs',
  renegatsduchaos: 'renegats-du-chaos',
  chaosrenegades: 'renegats-du-chaos',
  roisdestombes: 'rois-des-tombes',
  tombkings: 'rois-des-tombes',
  khemri: 'rois-des-tombes',
  skavens: 'skavens',
  skaven: 'skavens',
  snotlings: 'snotlings',
  snotling: 'snotlings',
  unionelfique: 'union-elfique',
  elvenunion: 'union-elfique',
  vampires: 'vampires',
  vampire: 'vampires',
};

export function compactLabel(input: unknown): string {
  const raw = String(input ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[–—−]/g, '-')
    .toLowerCase();
  return raw.replace(/[^a-z0-9]/g, '');
}

export function cleanCellText(input: unknown): string {
  return String(input ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseGoldValue(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return Math.max(0, Math.round(raw));
  }
  const text = cleanCellText(raw);
  if (!text) return 0;

  const isKilo = /\d\s*k(?:\s*po)?\b/i.test(text) || /kpo\b/i.test(text);
  const numericText = text
    .replace(/(?:k\s*po|kpo|po|gp|k)\b/gi, '')
    .replace(/\s+/g, '')
    .replace(/,/g, '.');

  const match = numericText.match(/-?\d+(?:\.\d+)?/);
  if (!match) return 0;
  const parsed = Number.parseFloat(match[0]);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(isKilo ? parsed * 1000 : parsed);
}

function parseIntegerCell(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return Math.round(raw);
  }
  const text = cleanCellText(raw);
  if (!text) return null;
  const normalized = text.replace(/\s+/g, '');
  if (!/^-?\d+$/.test(normalized)) return null;
  return Number.parseInt(normalized, 10);
}

function parseBooleanMarker(raw: unknown): boolean {
  const text = cleanCellText(raw).toLowerCase();
  if (!text) return false;
  if (['0', 'non', 'no', 'false', '-', '—', 'n'].includes(text)) return false;
  return true;
}

export function matchFactionToTeamDef(factionRaw: string): BloodBowlTeamDef | null {
  const key = compactLabel(factionRaw);
  if (!key) return null;

  const aliasId = FACTION_ALIASES[key];
  if (aliasId) {
    const found = BLOOD_BOWL_TEAMS.find((t) => t.id === aliasId);
    if (found) return found;
  }

  for (const team of BLOOD_BOWL_TEAMS) {
    const teamKey = compactLabel(team.name);
    if (teamKey === key || teamKey.includes(key) || key.includes(teamKey)) {
      return team;
    }
  }
  return null;
}

export function matchSpecialRules(
  rawRules: string,
  fallbackDef: BloodBowlTeamDef | null
): SpecialRuleTag[] {
  const cleaned = cleanCellText(rawRules);
  if (!cleaned) {
    return fallbackDef ? [...fallbackDef.specialRules] : [];
  }

  const parts = cleaned
    .split(/[,/;·|]+/)
    .map((part) => compactLabel(part))
    .filter(Boolean);

  const matched: SpecialRuleTag[] = [];
  for (const part of parts) {
    for (const rule of ALL_SPECIAL_RULES) {
      const ruleKey = compactLabel(rule);
      if (part === ruleKey || part.includes(ruleKey) || ruleKey.includes(part)) {
        if (!matched.includes(rule)) {
          matched.push(rule);
        }
      }
    }
  }

  if (matched.length > 0) return matched;
  return fallbackDef ? [...fallbackDef.specialRules] : [];
}

function findNextNonEmptyRight(row: string[], colIdx: number): string {
  for (let c = colIdx + 1; c < row.length; c++) {
    const val = cleanCellText(row[c]);
    if (val) return val;
  }
  return '';
}

function findLabelRightValue(
  rows: string[][],
  matcher: (compact: string) => boolean,
  startRow = 0
): { rowIdx: number; colIdx: number; value: string } | null {
  for (let r = startRow; r < rows.length; r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      const key = compactLabel(row[c]);
      if (key && matcher(key)) {
        const value = findNextNonEmptyRight(row, c);
        if (value) {
          return { rowIdx: r, colIdx: c, value };
        }
      }
    }
  }
  return null;
}

export function parseCsvRows(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, '');
  const lines = clean.split(/\r?\n/);

  // Detect delimiter from first 12 non-empty lines (; vs , vs \t)
  const sample = lines.slice(0, 12).join('\n');
  const commaCount = (sample.match(/,/g) ?? []).length;
  const semiCount = (sample.match(/;/g) ?? []).length;
  const tabCount = (sample.match(/\t/g) ?? []).length;
  let delimiter = ',';
  if (tabCount > commaCount && tabCount > semiCount) delimiter = '\t';
  else if (semiCount > commaCount) delimiter = ';';

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    const next = clean[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        currentCell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        currentCell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      currentRow.push(currentCell);
      currentCell = '';
    } else if (ch === '\r' && next === '\n') {
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = '';
      i++;
    } else if (ch === '\n' || ch === '\r') {
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += ch;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows;
}

export function parseRosterGrid(
  rawRows: string[][],
  sheetName: string
): ImportedTeamRoster | null {
  const rows = rawRows.map((r) => r.map((cell) => cleanCellText(cell)));

  // 1. Locate player table header row
  let headerRowIdx = -1;
  let numCol = -1;
  let nameCol = -1;
  let posCol = -1;
  let keywordsCol = -1;
  let maCol = -1;
  let stCol = -1;
  let agCol = -1;
  let paCol = -1;
  let avCol = -1;
  let skillsCol = -1;
  let rpmCol = -1;
  let bpCol = -1;
  let costCol = -1;

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const keys = row.map((cell) => compactLabel(cell));
    const foundNameIdx = keys.findIndex((k) =>
      ['nom', 'nomdujoueur', 'joueur', 'player', 'name'].includes(k)
    );
    const hasRosterHint = keys.some((k, idx) => {
      if (idx === foundNameIdx) return false;
      return (
        row[idx] === '#' ||
        ['poste', 'position', 'role', 'competences', 'skills', 'coutactuel'].includes(k)
      );
    });

    if (foundNameIdx >= 0 && hasRosterHint) {
      headerRowIdx = r;
      nameCol = foundNameIdx;
      for (let c = 0; c < row.length; c++) {
        const raw = row[c];
        const k = keys[c];
        if (raw === '#' || k === 'no' || k === 'num' || k === 'numero') {
          if (numCol === -1) numCol = c;
        } else if (['poste', 'position', 'role'].includes(k)) {
          if (posCol === -1) posCol = c;
        } else if (k === 'm' || k === 'ma') {
          if (maCol === -1) maCol = c;
        } else if (k === 'f' || k === 'st') {
          if (stCol === -1) stCol = c;
        } else if (k === 'ag') {
          if (agCol === -1) agCol = c;
        } else if (k === 'cp' || k === 'pa') {
          if (paCol === -1) paCol = c;
        } else if (k === 'ar' || k === 'av') {
          if (avCol === -1) avCol = c;
        } else if (k === 'competences' || k === 'skills') {
          if (skillsCol === -1) skillsCol = c;
        } else if (k === 'rpm' || k === 'mng') {
          rpmCol = c;
        } else if (k === 'bp' || k === 'ni') {
          bpCol = c;
        } else if (k === 'coutactuel' || k === 'currentcost' || k === 'valeur') {
          costCol = c;
        } else if (
          (k === 'cout' || k === 'cost' || k === 'coutdembauche') &&
          costCol === -1
        ) {
          costCol = c;
        }
      }
      if (
        posCol >= 0 &&
        maCol > posCol + 1 &&
        !compactLabel(row[posCol + 1])
      ) {
        keywordsCol = posCol + 1;
      }
      break;
    }
  }

  // 2. Metadata (header section before player table, or whole sheet fallback)
  const metaLimit = headerRowIdx > 0 ? headerRowIdx : Math.min(rows.length, 15);
  const metaRows = rows.slice(0, metaLimit);

  const teamNameMatch = findLabelRightValue(
    metaRows,
    (k) => k === 'nomdelequipe' || k === 'nomequipe' || k === 'teamname' || k === 'equipe'
  );
  const factionMatch = findLabelRightValue(
    metaRows,
    (k) => k === 'faction' || k === 'race' || k === 'roster'
  );
  const coachMatch = findLabelRightValue(
    metaRows,
    (k) => k === 'coach' || k === 'entraineur'
  );
  const leagueMatch = findLabelRightValue(
    metaRows,
    (k) => k === 'ligue' || k === 'league'
  );

  // Special rules in BBLH are often placed in the cell right below "R E G L E S  S P E C I A L E S"
  let rawSpecialRules = '';
  for (let r = 0; r < metaRows.length; r++) {
    for (let c = 0; c < metaRows[r].length; c++) {
      const k = compactLabel(metaRows[r][c]);
      if (k === 'reglesspeciales' || k === 'reglesspeciale' || k === 'specialrules') {
        const right = findNextNonEmptyRight(metaRows[r], c);
        if (right && !['modeentrainement', 'options'].includes(compactLabel(right))) {
          rawSpecialRules = right;
        } else if (r + 1 < metaRows.length) {
          for (let colOffset = Math.max(0, c - 2); colOffset < Math.min(metaRows[r + 1].length, c + 6); colOffset++) {
            const below = cleanCellText(metaRows[r + 1][colOffset]);
            if (below) {
              rawSpecialRules = below;
              break;
            }
          }
        }
        break;
      }
    }
    if (rawSpecialRules) break;
  }

  const teamName = teamNameMatch?.value ?? '';
  const faction = factionMatch?.value ?? '';
  const coach = coachMatch?.value ?? '';
  const league = leagueMatch?.value ?? '';
  const matchedTeamDef = matchFactionToTeamDef(faction);
  const specialRules = matchSpecialRules(rawSpecialRules, matchedTeamDef);

  // 3. Parse player rows (up to 16)
  const players: ImportedPlayerSummary[] = [];
  let summaryStartRow = headerRowIdx >= 0 ? headerRowIdx + 1 : 0;

  if (headerRowIdx >= 0 && nameCol >= 0) {
    let sequentialNum = 1;
    for (let r = headerRowIdx + 1; r < rows.length; r++) {
      const row = rows[r];
      const rowCompact = row.map((c) => compactLabel(c));
      if (
        rowCompact.some(
          (k) =>
            k === 'tresorerie' ||
            k === 'fansdevoues' ||
            k === 'relancesdequipe' ||
            k === 'titulaires'
        )
      ) {
        summaryStartRow = r;
        break;
      }

      const rawNum = numCol >= 0 ? parseIntegerCell(row[numCol]) : null;
      const slotNum =
        rawNum !== null && rawNum >= 1 && rawNum <= 16 ? rawNum : sequentialNum;
      const name = cleanCellText(row[nameCol]);
      const position = posCol >= 0 ? cleanCellText(row[posCol]) : '';

      if (name || position) {
        const keywords = keywordsCol >= 0 ? cleanCellText(row[keywordsCol]) : '';
        const ma = maCol >= 0 ? cleanCellText(row[maCol]) : '';
        const st = stCol >= 0 ? cleanCellText(row[stCol]) : '';
        const ag = agCol >= 0 ? cleanCellText(row[agCol]) : '';
        const pa = paCol >= 0 ? cleanCellText(row[paCol]) : '';
        const av = avCol >= 0 ? cleanCellText(row[avCol]) : '';
        const skills = skillsCol >= 0 ? cleanCellText(row[skillsCol]) : '';
        const rpm = rpmCol >= 0 ? parseBooleanMarker(row[rpmCol]) : false;
        const bp = bpCol >= 0 ? Math.max(0, parseIntegerCell(row[bpCol]) ?? 0) : 0;
        const cost = costCol >= 0 ? parseGoldValue(row[costCol]) : 0;

        if (slotNum >= 1 && slotNum <= 16) {
          players.push({
            number: slotNum,
            name,
            position,
            keywords,
            ma,
            st,
            ag,
            pa,
            av,
            skills,
            cost,
            rpm,
            bp,
          });
        }
      }

      if (rawNum !== null && rawNum >= 1 && rawNum <= 16) {
        sequentialNum = rawNum + 1;
      } else if (name || position) {
        sequentialNum++;
      }

      summaryStartRow = r + 1;
      if (rawNum === 16) {
        break;
      }
    }
  }

  // 4. Parse summary section (Trésorerie, Fans dévoués, Relances, Staff, Journaliers, VAE)
  let treasury = 0;
  let dedicatedFans = 1;
  let rerolls = matchedTeamDef ? 3 : 2;
  let hasExplicitRerolls = false;
  let rerollCost = matchedTeamDef?.rerollCost ?? 60000;
  let assistants = 0;
  let cheerleaders = 0;
  let journaliersCount = 0;
  let explicitVae = 0;

  for (let r = summaryStartRow; r < rows.length; r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      const k = compactLabel(row[c]);
      if (!k) continue;

      if (k === 'tresorerie' || k === 'treasury') {
        treasury = parseGoldValue(findNextNonEmptyRight(row, c));
      } else if (k === 'fansdevoues' || k === 'dedicatedfans' || k === 'fd') {
        const nextVal = findNextNonEmptyRight(row, c);
        const parsed = parseIntegerCell(nextVal);
        if (parsed !== null) {
          dedicatedFans = Math.max(1, Math.min(7, parsed));
        }
      } else if (
        k === 'relancesdequipe' ||
        k === 'relances' ||
        k === 'rerolls' ||
        k === 'teamrerolls'
      ) {
        for (let cc = c + 1; cc < row.length; cc++) {
          const val = cleanCellText(row[cc]);
          if (!val) continue;
          const count = parseIntegerCell(val);
          if (count !== null && !hasExplicitRerolls) {
            rerolls = clampRerolls(count);
            hasExplicitRerolls = true;
          } else if (/po|k/i.test(val)) {
            const parsedCost = parseGoldValue(val);
            if (parsedCost > 0 && rerollCost === (matchedTeamDef?.rerollCost ?? 60000)) {
              rerollCost = parsedCost;
            }
            break;
          }
        }
      } else if (k === 'assistants' || k === 'assistantcoaches') {
        const count = parseIntegerCell(findNextNonEmptyRight(row, c));
        if (count !== null) assistants = Math.max(0, count);
      } else if (k === 'pompomgirls' || k === 'cheerleaders') {
        const count = parseIntegerCell(findNextNonEmptyRight(row, c));
        if (count !== null) cheerleaders = Math.max(0, count);
      } else if (k === 'journaliers' || k === 'journeymen') {
        // In BBLH, "NB" / "Journaliers" is on row N and the count is directly below "NB" on row N+1
        if (c > 0 && compactLabel(row[c - 1]) === 'nb' && r + 1 < rows.length) {
          const count = parseIntegerCell(rows[r + 1][c - 1]);
          if (count !== null) journaliersCount = Math.max(0, count);
        }
      } else if (k === 'vae' || k === 'vea' || k === 'tve' || k === 'tv') {
        const parsed = parseGoldValue(findNextNonEmptyRight(row, c));
        if (parsed > 0) explicitVae = parsed;
      }
    }
  }

  // Fallback calculation if explicit VAE is absent
  const activePlayersCost = players
    .filter((p) => !p.rpm)
    .reduce((sum, p) => sum + p.cost, 0);
  const allPlayersCost = players.reduce((sum, p) => sum + p.cost, 0);
  const staffAndRerollsCost =
    rerolls * rerollCost + (assistants + cheerleaders) * 10000;

  const computedVea =
    explicitVae > 0 ? explicitVae : activePlayersCost + staffAndRerollsCost;
  const computedTve =
    explicitVae > 0 && allPlayersCost === activePlayersCost
      ? explicitVae
      : allPlayersCost + staffAndRerollsCost || explicitVae;

  // Determine whether this sheet actually holds a Blood Bowl roster
  if (!teamName && !faction && players.length === 0) {
    return null;
  }

  const warnings: string[] = [];
  if (faction && !matchedTeamDef) {
    warnings.push(
      `Faction « ${faction} » non reconnue automatiquement dans les 30 fiches Saison 3 — importée en équipe personnalisée.`
    );
  }
  if (players.length === 0) {
    warnings.push('Aucun joueur nommé détecté dans le tableau.');
  }

  return {
    sheetName,
    teamName: teamName || matchedTeamDef?.name || sheetName,
    faction,
    matchedTeamDef,
    coach,
    league,
    specialRules,
    rawSpecialRules,
    treasury,
    dedicatedFans,
    rerolls,
    rerollCost,
    assistants,
    cheerleaders,
    journaliersCount,
    tve: computedTve,
    vea: computedVea,
    players,
    warnings,
  };
}

function decodeTextBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const utf8 = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  if (!utf8.includes('\uFFFD')) {
    return utf8;
  }
  try {
    return new TextDecoder('windows-1252').decode(bytes);
  } catch {
    return utf8;
  }
}

function isBinarySpreadsheetBuffer(bytes: Uint8Array, fileName: string): boolean {
  const lower = fileName.toLowerCase();
  if (/\.(xlsx|xlsm|xlsb|xls|ods)$/i.test(lower)) {
    return true;
  }
  // ZIP magic bytes (PK\x03\x04) for .xlsx/.xlsm/.ods or OLE2 header (\xD0\xCF\x11\xE0) for .xls
  if (bytes.length >= 4) {
    if (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
      return true;
    }
    if (
      bytes[0] === 0xd0 &&
      bytes[1] === 0xcf &&
      bytes[2] === 0x11 &&
      bytes[3] === 0xe0
    ) {
      return true;
    }
  }
  return false;
}

export function parseTeamSpreadsheetBuffer(
  buffer: ArrayBuffer,
  fileName: string
): ParsedWorkbookResult {
  const bytes = new Uint8Array(buffer);
  const sheets: ImportedTeamRoster[] = [];

  if (isBinarySpreadsheetBuffer(bytes, fileName)) {
    const workbook = XLSX.read(bytes, { type: 'array' });
    for (const sheetName of workbook.SheetNames) {
      const ws = workbook.Sheets[sheetName];
      if (!ws) continue;
      const rows = XLSX.utils.sheet_to_json<string[]>(ws, {
        header: 1,
        raw: false,
        defval: '',
      });
      const parsed = parseRosterGrid(rows, sheetName);
      if (parsed) {
        sheets.push(parsed);
      }
    }
  } else {
    const text = decodeTextBuffer(buffer);
    const rows = parseCsvRows(text);
    const baseName = fileName.replace(/\.[^.]+$/, '') || 'Import CSV';
    const parsed = parseRosterGrid(rows, baseName);
    if (parsed) {
      sheets.push(parsed);
    }
  }

  // Prioritize sheets that look like complete teams (with players or team name)
  sheets.sort((a, b) => {
    const scoreA = (a.players.length > 0 ? 100 : 0) + (a.teamName ? 10 : 0) + (a.matchedTeamDef ? 5 : 0);
    const scoreB = (b.players.length > 0 ? 100 : 0) + (b.teamName ? 10 : 0) + (b.matchedTeamDef ? 5 : 0);
    return scoreB - scoreA;
  });

  return { fileName, sheets };
}

export function buildImportedPlayersGrid(
  importedPlayers: ImportedPlayerSummary[]
): PlayerMatchRow[] {
  const rows = createEmptyPlayers();
  for (const player of importedPlayers) {
    const idx = player.number - 1;
    if (idx < 0 || idx >= 16) continue;
    rows[idx] = {
      ...rows[idx],
      name: player.name,
      position: player.position,
      rpm: player.rpm,
      bp: player.bp,
    };
  }
  return rows;
}

export function createSampleTeamWorkbookBuffer(): ArrayBuffer {
  const wb = XLSX.utils.book_new();
  const rows: (string | number)[][] = [
    ['', '', '', "NOM DE L'EQUIPE", '', 'Les Reikland Reavers'],
    ['', '', '', 'LIGUE :', '', 'Classique du Vieux Monde'],
    ['', '', '', 'FACTION', '', 'Humains'],
    ['', '', '', 'COACH', '', 'Coach Exemple'],
    ['', '', '', 'REGLES SPECIALES', '', 'Capitaine'],
    [],
    ['#', 'Nom', 'Poste', 'M', 'F', 'AG', 'CP', 'AR', 'Compétences', 'RPM', 'BP', 'Coût actuel'],
    [1, 'Griff Oberwald Jr', 'Blitzer', 7, 3, '3+', '4+', '9+', 'Blocage, Tacle', '', 0, '85 kPo'],
    [2, 'Helmut', 'Lanceur', 6, 3, '3+', '3+', '9+', 'Passe, Prise Sûre', '', 0, '75 kPo'],
    [3, 'Otto', 'Trois-quart Humain', 6, 3, '3+', '4+', '9+', '', '', 0, '50 kPo'],
    [4, 'Lukas', 'Trois-quart Humain', 6, 3, '3+', '4+', '9+', '', '', 0, '50 kPo'],
    [5, 'Bram', 'Receveur', 8, 3, '3+', '4+', '8+', 'Réception, Esquive', '', 0, '75 kPo'],
    [],
    ['Trésorerie', '30 Kpo', '', 'Fans dévoués', 3, '', "Relances d'équipe", 3, 'x', '50 kPo', 'VAE', '485 000 po'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Équipe');
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
}

