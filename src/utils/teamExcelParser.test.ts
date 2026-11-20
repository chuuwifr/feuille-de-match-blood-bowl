import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import * as XLSX from 'xlsx';
import {
  buildImportedPlayersGrid,
  parseGoldValue,
  parseTeamSpreadsheetBuffer,
} from './teamExcelParser.ts';

test('parseGoldValue handles kPo, spaced po, plain integers, and empty values', () => {
  assert.equal(parseGoldValue('20 Kpo'), 20000);
  assert.equal(parseGoldValue('40 kPo'), 40000);
  assert.equal(parseGoldValue('70 kPo'), 70000);
  assert.equal(parseGoldValue('1 170 000  po'), 1170000);
  assert.equal(parseGoldValue('85000'), 85000);
  assert.equal(parseGoldValue(120000), 120000);
  assert.equal(parseGoldValue(''), 0);
});

test('Parses attached BBLH team spreadsheet accurately', () => {
  const filePath = path.resolve(
    process.cwd(),
    'public/assets/aistudio/2027_-_BBLH_e9765617'
  );
  const fileBytes = fs.readFileSync(filePath);
  const arrayBuffer = fileBytes.buffer.slice(
    fileBytes.byteOffset,
    fileBytes.byteOffset + fileBytes.byteLength
  );

  const result = parseTeamSpreadsheetBuffer(arrayBuffer, '2027_-_BBLH_e9765617');
  assert.equal(result.sheets.length, 1);

  const team = result.sheets[0];
  assert.equal(team.teamName, 'Les tentacules nécrosés de carcosa');
  assert.equal(team.coach, 'Lovecraft');
  assert.equal(team.league, 'Spot de Sylvanie');
  assert.equal(team.faction, 'HORREURS NÉCROMANTIQUES');
  assert.equal(team.matchedTeamDef?.id, 'horreurs-necromantiques');
  assert.deepEqual(team.specialRules, ['Maîtres de la Non-Vie']);
  assert.equal(team.treasury, 20000);
  assert.equal(team.dedicatedFans, 4);
  assert.equal(team.rerolls, 2);
  assert.equal(team.rerollCost, 70000);
  assert.equal(team.tve, 1170000);
  assert.equal(team.vea, 1170000);
  assert.equal(team.players.length, 12);

  assert.equal(team.players[0].number, 1);
  assert.equal(team.players[0].name, 'Abner Watheley');
  assert.equal(team.players[0].position, 'Trois-Quart Zombie Nécromantique');
  assert.equal(team.players[0].cost, 40000);

  assert.equal(team.players[8].number, 9);
  assert.equal(team.players[8].name, 'Showgoth');
  assert.equal(team.players[8].position, 'Loup-Garou');
  assert.equal(team.players[8].cost, 150000);

  assert.equal(team.players[11].number, 12);
  assert.equal(team.players[11].name, 'Kingu');
});

test('Parses multi-sheet XLSX workbook with RPM, BP, and custom roster rows', () => {
  const wb = XLSX.utils.book_new();

  const teamASheet = XLSX.utils.aoa_to_sheet([
    ['', 'NOM DE L\'EQUIPE', 'Reikland Crushers'],
    ['', 'FACTION', 'Humains'],
    ['', 'COACH', 'Karl'],
    ['#', 'Nom', 'Poste', 'M', 'F', 'AG', 'CP', 'AR', 'Compétences', 'RPM', 'BP', 'Coût actuel'],
    [1, 'Griff Jr', 'Blitzer', 7, 3, '3+', '4+', '9+', 'Blocage, Tacle', '', 0, '85 kPo'],
    [2, 'Otto', 'Trois-quart Humain', 6, 3, '3+', '4+', '9+', '', 'X', 1, '50 kPo'],
    ['Trésorerie', '45 Kpo', '', 'Fans dévoués', 3, '', 'Relances d\'équipe', 3, 'x', '50 kPo', 'VAE', '1 050 000 po'],
  ]);
  XLSX.utils.book_append_sheet(wb, teamASheet, 'Humains Karl');

  const notesSheet = XLSX.utils.aoa_to_sheet([['Calendrier de ligue'], ['Journée 1']]);
  XLSX.utils.book_append_sheet(wb, notesSheet, 'Calendrier');

  const xlsxBytes = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  const result = parseTeamSpreadsheetBuffer(xlsxBytes, 'ligue.xlsx');

  assert.equal(result.sheets.length, 1);
  const parsed = result.sheets[0];
  assert.equal(parsed.sheetName, 'Humains Karl');
  assert.equal(parsed.teamName, 'Reikland Crushers');
  assert.equal(parsed.matchedTeamDef?.id, 'humains');
  assert.equal(parsed.coach, 'Karl');
  assert.equal(parsed.treasury, 45000);
  assert.equal(parsed.dedicatedFans, 3);
  assert.equal(parsed.rerolls, 3);
  assert.equal(parsed.vea, 1050000);
  assert.equal(parsed.players.length, 2);
  assert.equal(parsed.players[1].rpm, true);
  assert.equal(parsed.players[1].bp, 1);

  const grid = buildImportedPlayersGrid(parsed.players);
  assert.equal(grid.length, 16);
  assert.equal(grid[0].name, 'Griff Jr');
  assert.equal(grid[0].position, 'Blitzer');
  assert.equal(grid[1].rpm, true);
  assert.equal(grid[1].bp, 1);
  assert.equal(grid[1].td, 0);
});
