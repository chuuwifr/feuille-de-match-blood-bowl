import { useEffect, useState } from 'react';
import { InducementPickerModal } from './components/InducementPickerModal';
import { RectoSheet } from './components/RectoSheet';
import { RulesDiceDrawer } from './components/RulesDiceDrawer';
import { TeamRosterModal } from './components/TeamRosterModal';
import { TopToolbar } from './components/TopToolbar';
import { VersoSheet } from './components/VersoSheet';
import {
  BloodBowlTeamDef,
  MatchSheetState,
  SheetViewMode,
  TeamSide,
} from './types/bloodbowl';
import {
  calculateInducementBudgets,
  calculateTeamScore,
  createDemoMatchState,
  createEmptyPlayers,
  createInitialMatchState,
  normalizeMatchState,
} from './utils/bloodbowlRules';

const STORAGE_KEY = 'bloodbowl-match-sheet-v3';

function loadSavedMatch(): MatchSheetState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialMatchState();
    const parsed = JSON.parse(raw) as Partial<MatchSheetState>;
    return normalizeMatchState(parsed);
  } catch {
    return createInitialMatchState();
  }
}

export default function App() {
  const [match, setMatch] = useState<MatchSheetState>(loadSavedMatch);
  const [viewMode, setViewMode] = useState<SheetViewMode>('recto');
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [teamModalSide, setTeamModalSide] = useState<TeamSide | null>(null);
  const [inducementModalSide, setInducementModalSide] =
    useState<TeamSide | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(match));
    } catch {
      // Ignore quota errors cleanly
    }
  }, [match]);

  const updateMatch = (
    updater: (prev: MatchSheetState) => MatchSheetState
  ) => {
    setMatch((prev) => ({
      ...updater(prev),
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleSelectTeam = (
    side: TeamSide,
    teamDef: BloodBowlTeamDef,
    populateStarterPlayers: boolean
  ) => {
    updateMatch((prev) => {
      const targetKey = side === 'A' ? 'teamA' : 'teamB';
      const currentTeam = prev[targetKey];
      const nextPlayers = [...currentTeam.players];

      if (populateStarterPlayers) {
        const hasAnyNamed = currentTeam.players.some((p) => p.name.trim() !== '');
        if (!hasAnyNamed) {
          const starterRoles: string[] = [];
          for (const pos of teamDef.positions) {
            if (starterRoles.length >= 11) break;
            if (!pos.isLineman) {
              starterRoles.push(pos.role);
            }
          }
          while (starterRoles.length < 11) {
            starterRoles.push(teamDef.linemanName);
          }
          const empty = createEmptyPlayers();
          for (let i = 0; i < 11; i++) {
            empty[i] = {
              ...empty[i],
              position: starterRoles[i],
            };
          }
          for (let i = 0; i < 16; i++) {
            nextPlayers[i] = empty[i];
          }
        }
      }

      return {
        ...prev,
        [targetKey]: {
          ...currentTeam,
          teamId: teamDef.id,
          name: currentTeam.name.trim() ? currentTeam.name : teamDef.name,
          specialRulesOverride: teamDef.specialRules,
          players: nextPlayers,
        },
      };
    });
    setTeamModalSide(null);
  };

  const handleAddInducement = (
    side: TeamSide,
    name: string,
    cost: number
  ) => {
    updateMatch((prev) => {
      const targetKey = side === 'A' ? 'teamA' : 'teamB';
      const team = prev[targetKey];
      const nextInducements = [...team.inducements];
      const emptyIdx = nextInducements.findIndex(
        (i) => i.name.trim() === '' && (i.cost || 0) === 0
      );
      if (emptyIdx >= 0) {
        nextInducements[emptyIdx] = { name, cost };
      } else {
        const lastIdx = nextInducements.length - 1;
        nextInducements[lastIdx] = { name, cost };
      }
      return {
        ...prev,
        [targetKey]: {
          ...team,
          inducements: nextInducements,
        },
      };
    });
  };

  const handleApplyWeather = (roll2D6: number, weatherName: string) => {
    updateMatch((prev) => ({
      ...prev,
      weatherRoll: roll2D6,
      weatherName,
    }));
  };

  const handleLogKickoff = (phase: string, roll2d6: number, title: string) => {
    updateMatch((prev) => ({
      ...prev,
      kickoffEventsLog: [...prev.kickoffEventsLog, { phase, roll2d6, title }],
    }));
  };

  const handleApplyPrayer = (
    side: TeamSide,
    prayerText: string,
    rollD16: number
  ) => {
    updateMatch((prev) => {
      const targetKey = side === 'A' ? 'teamA' : 'teamB';
      const team = prev[targetKey];
      const nextPrayers: [string, string] = [...team.prayers] as [string, string];
      if (!nextPrayers[0].trim()) {
        nextPrayers[0] = prayerText;
      } else {
        nextPrayers[1] = prayerText;
      }
      return {
        ...prev,
        [targetKey]: {
          ...team,
          prayers: nextPrayers,
          hasPasseParfaitePrayer: team.hasPasseParfaitePrayer || rollD16 === 10,
          hasReceptionEtourdissantePrayer:
            team.hasReceptionEtourdissantePrayer || rollD16 === 11,
          hasFrenesieAgressionPrayer:
            team.hasFrenesieAgressionPrayer || rollD16 === 13,
        },
      };
    });
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(match, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bloodbowl-match-${match.date || 'feuille'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const scoreA = calculateTeamScore(match.teamA);
  const scoreB = calculateTeamScore(match.teamB);
  const budgets = calculateInducementBudgets(match.teamA, match.teamB);

  return (
    <div className="min-h-screen flex flex-col">
      <TopToolbar
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        onOpenRulesDice={() => setIsRulesOpen(true)}
        onLoadDemo={() => setMatch(createDemoMatchState())}
        onReset={() => setMatch(createInitialMatchState())}
        onPrint={() => window.print()}
        onExportJson={handleExportJson}
        scoreA={scoreA}
        scoreB={scoreB}
        teamAName={match.teamA.name}
        teamBName={match.teamB.name}
      />

      <main className="flex-1 py-4 sm:py-6 px-2 sm:px-4">
        <div
          className={`mx-auto ${
            viewMode === 'both'
              ? 'max-w-[2160px] grid grid-cols-1 2xl:grid-cols-2 gap-6 items-start'
              : 'max-w-[1080px]'
          }`}
        >
          {(viewMode === 'recto' || viewMode === 'both') && (
            <RectoSheet
              match={match}
              onUpdateMatch={updateMatch}
              onOpenTeamModal={(side) => setTeamModalSide(side)}
              onOpenInducementModal={(side) => setInducementModalSide(side)}
            />
          )}

          {(viewMode === 'verso' || viewMode === 'both') && (
            <VersoSheet match={match} onUpdateMatch={updateMatch} />
          )}
        </div>
      </main>

      {isRulesOpen && (
        <RulesDiceDrawer
          onClose={() => setIsRulesOpen(false)}
          onApplyWeather={handleApplyWeather}
          onLogKickoff={handleLogKickoff}
          onApplyPrayer={handleApplyPrayer}
        />
      )}

      {teamModalSide && (
        <TeamRosterModal
          side={teamModalSide}
          currentTeamId={
            teamModalSide === 'A' ? match.teamA.teamId : match.teamB.teamId
          }
          onSelectTeam={(teamDef, populate) =>
            handleSelectTeam(teamModalSide, teamDef, populate)
          }
          onClose={() => setTeamModalSide(null)}
        />
      )}

      {inducementModalSide && (
        <InducementPickerModal
          side={inducementModalSide}
          team={
            inducementModalSide === 'A' ? match.teamA : match.teamB
          }
          totalBudget={
            inducementModalSide === 'A'
              ? budgets.totalBudgetA
              : budgets.totalBudgetB
          }
          spent={
            inducementModalSide === 'A' ? budgets.spentA : budgets.spentB
          }
          onAddInducement={(name, cost) =>
            handleAddInducement(inducementModalSide, name, cost)
          }
          onClose={() => setInducementModalSide(null)}
        />
      )}
    </div>
  );
}
