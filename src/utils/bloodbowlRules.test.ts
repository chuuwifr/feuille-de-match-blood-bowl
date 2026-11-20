import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMatchSummaryData,
  calculateAdjustedTV,
  calculateInducementBudgets,
  calculatePlayerPsp,
  calculatePopularityFactor,
  calculatePostMatchGains,
  clampRerolls,
  clampTurnMarker,
  createDemoMatchState,
  createEmptyPlayers,
  createEmptyTeamState,
  createInitialMatchState,
  evaluateDedicatedFansChange,
  evaluateExpensiveMistakes,
  getGlobalTurnNumber,
  getPlayerTdSum,
  getRemainingRerolls,
  getUsedRerollsCount,
  getWeatherByRoll,
  normalizeMatchState,
  normalizeUsedRerolls,
  parseMatchBackupJson,
  setUsedReroll,
  stepTeamRerolls,
  stepTeamScore,
  stepTeamTurn,
  toggleUsedReroll,
} from './bloodbowlRules';

test('Season 3 inducement budget matches rulebook Jay vs Dan example', () => {
  const jay = createEmptyTeamState();
  jay.vea = 1240000;
  jay.treasury = 100000;
  jay.treasurySpentOnInducements = 50000;

  const dan = createEmptyTeamState();
  dan.vea = 1160000;
  dan.treasury = 40000;
  dan.treasurySpentOnInducements = 10000;
  dan.useMax50kTreasury = true;

  const summary = calculateInducementBudgets(jay, dan);
  assert.equal(summary.status, 'A_higher');
  assert.equal(summary.petiteCaisseA, 0);
  assert.equal(summary.petiteCaisseB, 130000); // 80k diff + 50k spent by Jay
  assert.equal(summary.treasuryAddedB, 10000);
  assert.equal(summary.totalBudgetB, 140000);
});

test('Equal VEA allows neither team to receive petite caisse or spend treasury', () => {
  const a = createEmptyTeamState();
  a.vea = 1000000;
  a.treasury = 100000;
  a.treasurySpentOnInducements = 50000;

  const b = createEmptyTeamState();
  b.vea = 1000000;
  b.treasury = 100000;
  b.treasurySpentOnInducements = 50000;

  const summary = calculateInducementBudgets(a, b);
  assert.equal(summary.status, 'equal');
  assert.equal(summary.totalBudgetA, 0);
  assert.equal(summary.totalBudgetB, 0);
});

test('Adjusted TV adds Journaliers cost', () => {
  const team = createEmptyTeamState();
  team.vea = 950000;
  team.journaliersCost = 100000;
  assert.equal(calculateAdjustedTV(team), 1050000);
});

test('Popularity factor sums Dedicated Fans + 1D3 roll', () => {
  const team = createEmptyTeamState();
  team.dedicatedFans = 4;
  team.fanRollD3 = 2;
  assert.equal(calculatePopularityFactor(team), 6);
});

test('Post-match gains follow Season 3 formula ((FP_A + FP_B)/2 + TD + nonStall) * 10000', () => {
  const jay = createEmptyTeamState();
  const dan = createEmptyTeamState();
  jay.nonStallBonus = true;

  const gains = calculatePostMatchGains(jay, dan, 2, 4, 3);
  assert.equal(gains.baseGain, 35000);
  assert.equal(gains.touchdownGain, 20000);
  assert.equal(gains.nonStallGain, 10000);
  assert.equal(gains.totalGains, 65000);
});

test('PSP calculation respects Bagarreurs Brutaux and Passe Parfaite', () => {
  const player = createEmptyPlayers()[0];
  player.reu = 1;
  player.eli = 1;
  player.int = 1;
  player.td = 1;
  player.mvp = true;

  const standardTeam = createEmptyTeamState();
  standardTeam.teamId = 'humains';
  // 1 + 2 + 2 + 3 + 4 = 12
  assert.equal(calculatePlayerPsp(player, standardTeam), 12);

  const brutalTeam = createEmptyTeamState();
  brutalTeam.teamId = 'orques'; // Bagarreurs Brutaux: ELI=3, TD=2
  brutalTeam.hasPasseParfaitePrayer = true; // REU=2
  // 2 + 3 + 2 + 2 + 4 = 13
  assert.equal(calculatePlayerPsp(player, brutalTeam), 13);
});

test('Dedicated Fans post-match update obeys win/loss/draw and 1..7 bounds', () => {
  assert.deepEqual(evaluateDedicatedFansChange(4, 4, 'WIN'), { change: 1, nextFD: 5 });
  assert.deepEqual(evaluateDedicatedFansChange(7, 6, 'WIN'), { change: 0, nextFD: 7 });
  assert.deepEqual(evaluateDedicatedFansChange(3, 2, 'LOSS'), { change: -1, nextFD: 2 });
  assert.deepEqual(evaluateDedicatedFansChange(1, 1, 'LOSS'), { change: 0, nextFD: 1 });
  assert.deepEqual(evaluateDedicatedFansChange(4, 1, 'DRAW'), { change: 0, nextFD: 4 });
});

test('Expensive Mistakes table calculates brackets and rounding accurately', () => {
  const exempt = evaluateExpensiveMistakes(95000, 1);
  assert.equal(exempt.triggered, false);
  assert.equal(exempt.finalTreasury, 95000);

  const minor = evaluateExpensiveMistakes(150000, 1, 3);
  assert.equal(minor.severity, 'Incident mineur');
  assert.equal(minor.loss, 30000);
  assert.equal(minor.finalTreasury, 120000);

  const major = evaluateExpensiveMistakes(315000, 1);
  assert.equal(major.severity, 'Incident majeur');
  // 315000 / 2 = 157500 -> rounded down to nearest 5000 = 155000
  assert.equal(major.finalTreasury, 155000);
  assert.equal(major.loss, 160000);

  const catastrophe = evaluateExpensiveMistakes(550000, 1, 7);
  assert.equal(catastrophe.severity, 'Catastrophe');
  assert.equal(catastrophe.finalTreasury, 70000);
  assert.equal(catastrophe.loss, 480000);
});

test('Weather table maps 2D6 rolls cleanly', () => {
  assert.equal(getWeatherByRoll(2).name, 'Canicule');
  assert.equal(getWeatherByRoll(3).name, 'Très Ensoleillé');
  assert.equal(getWeatherByRoll(7).name, 'Conditions Idéales');
  assert.equal(getWeatherByRoll(11).name, 'Averse');
  assert.equal(getWeatherByRoll(12).name, 'Blizzard');
});

test('Turn counter helpers clamp 0..8, step turns, and compute global half turn numbers', () => {
  assert.equal(clampTurnMarker(-3), 0);
  assert.equal(clampTurnMarker(12), 8);
  assert.equal(stepTeamTurn(0, -1), 0);
  assert.equal(stepTeamTurn(0, 1), 1);
  assert.equal(stepTeamTurn(8, 1), 8);
  assert.equal(stepTeamTurn(5, -1), 4);
  assert.equal(getGlobalTurnNumber(1, 0), 0);
  assert.equal(getGlobalTurnNumber(1, 5), 5);
  assert.equal(getGlobalTurnNumber(2, 3), 11);
});

test('normalizeMatchState safely upgrades legacy saved matches without turn counter fields', () => {
  const legacyTeam = createEmptyTeamState();
  const { currentTurn: _ct, turnMarkers: _tm, ...legacyWithoutTurn } = legacyTeam;
  const upgraded = normalizeMatchState({
    teamA: legacyWithoutTurn as never,
    teamB: legacyWithoutTurn as never,
  });
  assert.equal(upgraded.half, 1);
  assert.equal(upgraded.activeTurnSide, null);
  assert.equal(upgraded.teamA.currentTurn, 0);
  assert.deepEqual(upgraded.teamA.turnMarkers, {
    blitz: false,
    pass: false,
    handoff: false,
    foul: false,
  });
});

test('stepTeamScore increments, decrements, clamps at zero, and restores auto-sync', () => {
  let team = createEmptyTeamState();
  team.players[0].td = 1;
  assert.equal(getPlayerTdSum(team), 1);

  // Decrement below 0 is prevented; 1 -> 0 sets manual override to 0
  team = stepTeamScore(team, -1);
  assert.equal(team.manualScoreOverride, 0);
  team = stepTeamScore(team, -1);
  assert.equal(team.manualScoreOverride, 0);

  // Increment back to 1 restores auto-sync (null)
  team = stepTeamScore(team, 1);
  assert.equal(team.manualScoreOverride, null);

  // Increment to 2 sets manual override to 2
  team = stepTeamScore(team, 1);
  assert.equal(team.manualScoreOverride, 2);
});

test('Reroll helpers clamp 0..16, step stock cleanly, and upgrade legacy matches', () => {
  assert.equal(clampRerolls(-2), 0);
  assert.equal(clampRerolls(25), 16);
  assert.equal(stepTeamRerolls(0, -1), 0);
  assert.equal(stepTeamRerolls(3, -1), 2);
  assert.equal(stepTeamRerolls(2, 1), 3);
  assert.equal(stepTeamRerolls(16, 1), 16);

  const legacy = createEmptyTeamState();
  const { rerolls: _rr, ...withoutRerolls } = legacy;
  const upgraded = normalizeMatchState({
    teamA: withoutRerolls as never,
    teamB: withoutRerolls as never,
  });
  assert.equal(upgraded.teamA.rerolls, 3);
  assert.equal(upgraded.teamB.rerolls, 3);
});

test('parseMatchBackupJson restores exported match JSON, upgrades partial saves, and rejects invalid files', () => {
  const demo = createDemoMatchState();
  const serialized = JSON.stringify(demo);
  const res = parseMatchBackupJson(serialized);
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.match.teamA.name, 'Reikland Reavers');
    assert.equal(res.match.teamB.name, 'Orcland Raiders');
    assert.equal(res.match.teamA.rerolls, 3);
    assert.equal(res.match.teamB.rerolls, 2);
    assert.equal(res.match.teamA.players[0].name, 'Griff Oberwald Jr');
  }

  // Partial legacy save with truncated players array still normalizes to 16 slots
  const partial = parseMatchBackupJson(
    JSON.stringify({
      teamA: { name: 'Altdorf Stars', players: [{ name: 'Karl', td: 2 }] },
      teamB: { name: 'Middenheim Marauders' },
    })
  );
  assert.equal(partial.ok, true);
  if (partial.ok) {
    assert.equal(partial.match.teamA.players.length, 16);
    assert.equal(partial.match.teamA.players[0].name, 'Karl');
    assert.equal(partial.match.teamA.players[0].td, 2);
    assert.equal(partial.match.teamA.rerolls, 3);
  }

  // Invalid inputs rejected cleanly
  assert.equal(parseMatchBackupJson('').ok, false);
  assert.equal(parseMatchBackupJson('{invalid json').ok, false);
  assert.equal(parseMatchBackupJson('[1,2,3]').ok, false);
  assert.equal(parseMatchBackupJson('{"foo":"bar"}').ok, false);
});

test('buildMatchSummaryData aggregates active players, inducements, turn notes, and post-match finances accurately', () => {
  const demo = createDemoMatchState();
  const summary = buildMatchSummaryData(demo);

  assert.equal(summary.outcomeLabel, 'Victoire Reikland Reavers');
  assert.equal(summary.teamA.score, 2);
  assert.equal(summary.teamB.score, 1);

  // Active players exclude empty 7..16 slots
  assert.equal(summary.teamA.activePlayers.length, 6);
  assert.equal(summary.teamB.activePlayers.length, 5);

  // Totals & PSP: Orques have Bagarreurs Brutaux (ELI=3, TD=2)
  assert.equal(summary.teamA.totals.td, 2);
  assert.equal(summary.teamB.totals.td, 1);
  // Varag Kogn'Dur: 2 ELI * 3 + 1 TD * 2 = 8 PSP
  assert.equal(summary.teamB.activePlayers[0].psp, 8);
  assert.equal(summary.teamA.injuredPlayers.length, 1);
  assert.equal(summary.teamB.injuredPlayers.length, 1);

  // Inducements filter out empty slots
  assert.equal(summary.teamA.inducementItems.length, 1);
  assert.equal(summary.teamB.inducementItems.length, 3);
  assert.equal(summary.teamB.inducementsSpent, 140000);

  // Turn annotations filter out empty turns
  assert.equal(summary.highlightedTurns.length, 4);
  assert.equal(summary.highlightedTurns[0].turn, 1);
  assert.equal(summary.highlightedTurns[3].turn, 12);

  // Post-match FD & treasury
  assert.equal(summary.teamA.fdChange, 1);
  assert.equal(summary.teamA.dedicatedFansAfter, 5);
  assert.equal(summary.teamB.fdChange, -1);
  assert.equal(summary.teamB.dedicatedFansAfter, 2);

  // Empty match yields clean zeroed summary with no active players or turn notes
  const emptySummary = buildMatchSummaryData(createInitialMatchState());
  assert.equal(emptySummary.outcomeLabel, 'Match Nul');
  assert.equal(emptySummary.teamA.activePlayers.length, 0);
  assert.equal(emptySummary.highlightedTurns.length, 0);
  assert.equal(emptySummary.teamA.rerolls, 3);
  assert.equal(emptySummary.teamA.remainingRerolls, 3);
  assert.equal(emptySummary.teamA.usedRerollsCount, 0);
});

test('Tactical reroll checkbox helpers normalize, toggle, count remaining, and upgrade legacy saves', () => {
  assert.deepEqual(normalizeUsedRerolls(undefined, 3), [false, false, false]);
  assert.deepEqual(normalizeUsedRerolls([true, false, true, true], 2), [true, false]);

  let slots = normalizeUsedRerolls([], 3);
  slots = setUsedReroll(slots, 0, true, 3);
  slots = toggleUsedReroll(slots, 2, 3);
  assert.deepEqual(slots, [true, false, true]);
  assert.equal(getUsedRerollsCount(3, slots), 2);
  assert.equal(getRemainingRerolls(3, slots), 1);

  // Unchecking restores availability
  slots = setUsedReroll(slots, 0, false, 3);
  assert.deepEqual(slots, [false, false, true]);
  assert.equal(getRemainingRerolls(3, slots), 2);

  // Increasing stock appends unchecked slots; decreasing trims cleanly
  const expanded = normalizeUsedRerolls(slots, 5);
  assert.deepEqual(expanded, [false, false, true, false, false]);
  assert.equal(getRemainingRerolls(5, expanded), 4);

  const shrunk = normalizeUsedRerolls(expanded, 2);
  assert.deepEqual(shrunk, [false, false]);
  assert.equal(getUsedRerollsCount(2, shrunk), 0);

  // Legacy saved team missing usedRerolls upgrades cleanly
  const legacy = createEmptyTeamState();
  const { usedRerolls: _ur, ...withoutUsedRerolls } = legacy;
  const upgraded = normalizeMatchState({
    teamA: { ...withoutUsedRerolls, rerolls: 4 } as never,
    teamB: { ...withoutUsedRerolls, rerolls: 1 } as never,
  });
  assert.deepEqual(upgraded.teamA.usedRerolls, [false, false, false, false]);
  assert.deepEqual(upgraded.teamB.usedRerolls, [false]);

  // Demo summary reflects tactical reroll counts
  const demoSummary = buildMatchSummaryData(createDemoMatchState());
  assert.equal(demoSummary.teamA.rerolls, 3);
  assert.equal(demoSummary.teamA.usedRerollsCount, 1);
  assert.equal(demoSummary.teamA.remainingRerolls, 2);
  assert.equal(demoSummary.teamB.rerolls, 2);
  assert.equal(demoSummary.teamB.usedRerollsCount, 1);
  assert.equal(demoSummary.teamB.remainingRerolls, 1);
});


