import React from 'react';
import { Printer } from 'lucide-react';
import { MatchSheetState } from '../types/bloodbowl';
import {
  ActivePlayerSummary,
  buildMatchSummaryData,
  formatGold,
  TeamMatchSummaryData,
} from '../utils/bloodbowlRules';

interface PrintSummarySheetProps {
  match: MatchSheetState;
  isPreview: boolean;
  onPrint: () => void;
}

function formatPlayerStatus(player: ActivePlayerSummary): string {
  const flags: string[] = [];
  if (player.sequelles) flags.push(player.sequelles);
  if (player.rpm) flags.push('RPM');
  if (player.retireTemp) flags.push('RT');
  if (player.bp > 0) flags.push(`${player.bp} BP`);
  return flags.join(' · ') || '—';
}

const TeamStatsTable: React.FC<{ team: TeamMatchSummaryData }> = ({ team }) => {
  return (
    <div className="border border-[#1E1915] rounded-sm overflow-hidden bg-white">
      <div className="bg-[#142b54] text-white px-2.5 py-1 flex items-center justify-between gap-2 text-[11px] font-bold">
        <span className="font-display tracking-wide truncate">
          ÉQUIPE {team.side} — {team.name}
        </span>
        <span className="font-mono-num text-amber-200 whitespace-nowrap shrink-0">
          {team.activePlayers.length} actif(s)
        </span>
      </div>
      {team.activePlayers.length === 0 ? (
        <div className="px-3 py-2.5 text-[11px] text-stone-500 italic text-center">
          Aucun joueur saisi ou statistiqué pour cette équipe.
        </div>
      ) : (
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full border-collapse text-[10px] print:text-[9px] leading-tight">
            <thead>
              <tr className="bg-[#efe4c8] text-[#1a1410] border-b border-[#1E1915] font-bold">
                <th className="py-1 px-1 print:px-0.5 text-center w-6 print:w-4">#</th>
                <th className="py-1 px-1.5 print:px-1 text-left">Joueur</th>
                <th className="py-1 px-1 print:px-0.5 text-center w-7 print:w-5" title="Réussites">REU</th>
                <th className="py-1 px-1 print:px-0.5 text-center w-7 print:w-5" title="Éliminations">ÉLI</th>
                <th className="py-1 px-1 print:px-0.5 text-center w-7 print:w-5" title="Interceptions">INT</th>
                <th className="py-1 px-1 print:px-0.5 text-center w-7 print:w-5" title="Touchdowns">TD</th>
                <th className="py-1 px-1 print:px-0.5 text-center w-7 print:w-5" title="Agressions">AG</th>
                <th className="py-1 px-1 print:px-0.5 text-center w-7 print:w-5" title="Joueur du Match">MVP</th>
                <th className="py-1 px-1 print:px-0.5 text-center w-8 print:w-6 bg-[#e5d2a4]" title="Points Star Player">PSP</th>
                <th className="py-1 px-1.5 print:px-1 text-left">État</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-300">
              {team.activePlayers.map((player) => {
                const isInjured =
                  player.rpm ||
                  player.retireTemp ||
                  player.bp > 0 ||
                  player.sequelles !== '';
                return (
                  <tr
                    key={player.number}
                    className={player.sequelles === 'Mort' ? 'bg-red-50/70' : 'bg-white'}
                  >
                    <td className="py-0.5 px-1 print:px-0.5 text-center font-mono-num font-semibold text-stone-600">
                      {player.number}
                    </td>
                    <td className="py-0.5 px-1.5 print:px-1">
                      <div className="font-semibold text-[#1a1410] truncate max-w-[140px] print:max-w-[112px]">
                        {player.name}
                        {player.position && (
                          <span className="hidden print:inline font-normal text-[8px] text-stone-500">
                            {' '}· {player.position}
                          </span>
                        )}
                      </div>
                      {player.position && (
                        <div className="print:hidden text-[9px] text-stone-500 truncate max-w-[140px]">
                          {player.position}
                        </div>
                      )}
                    </td>
                    <td className="py-0.5 px-1 print:px-0.5 text-center font-mono-num">
                      {player.reu || '·'}
                    </td>
                    <td className="py-0.5 px-1 print:px-0.5 text-center font-mono-num">
                      {player.eli || '·'}
                    </td>
                    <td className="py-0.5 px-1 print:px-0.5 text-center font-mono-num">
                      {player.int || '·'}
                    </td>
                    <td className="py-0.5 px-1 print:px-0.5 text-center font-mono-num font-bold">
                      {player.td || '·'}
                    </td>
                    <td className="py-0.5 px-1 print:px-0.5 text-center font-mono-num">
                      {player.agro || '·'}
                    </td>
                    <td className="py-0.5 px-1 print:px-0.5 text-center font-bold text-[#8a1414]">
                      {player.mvp ? '★' : '·'}
                    </td>
                    <td className="py-0.5 px-1 print:px-0.5 text-center font-mono-num font-bold bg-[#faf3e0]">
                      {player.psp}
                    </td>
                    <td
                      className={`py-0.5 px-1.5 print:px-1 text-[9.5px] print:text-[8.5px] whitespace-nowrap print:whitespace-normal leading-tight ${
                        isInjured ? 'text-[#8a1414] font-semibold' : 'text-stone-400'
                      }`}
                    >
                      {formatPlayerStatus(player)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-[#f4ebd2] border-t border-[#1E1915] font-bold text-[#1a1410]">
                <td className="py-1 px-1 print:px-0.5 text-center font-mono-num">Σ</td>
                <td className="py-1 px-1.5 print:px-1">Totaux</td>
                <td className="py-1 px-1 print:px-0.5 text-center font-mono-num">{team.totals.reu}</td>
                <td className="py-1 px-1 print:px-0.5 text-center font-mono-num">{team.totals.eli}</td>
                <td className="py-1 px-1 print:px-0.5 text-center font-mono-num">{team.totals.int}</td>
                <td className="py-1 px-1 print:px-0.5 text-center font-mono-num">{team.totals.td}</td>
                <td className="py-1 px-1 print:px-0.5 text-center font-mono-num">{team.totals.agro}</td>
                <td className="py-1 px-1 print:px-0.5 text-center font-mono-num">{team.totals.mvp}</td>
                <td className="py-1 px-1 print:px-0.5 text-center font-mono-num bg-[#ead8aa]">
                  {team.totals.psp}
                </td>
                <td className="py-1 px-1.5 print:px-1 text-[9.5px] print:text-[8.5px] text-stone-700 whitespace-nowrap print:whitespace-normal">
                  {team.injuredPlayers.length > 0
                    ? `${team.injuredPlayers.length} blessé(s)`
                    : 'RAS'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

export const PrintSummarySheet: React.FC<PrintSummarySheetProps> = ({
  match,
  isPreview,
  onPrint,
}) => {
  const summary = buildMatchSummaryData(match);

  const renderTeamHeaderCard = (team: TeamMatchSummaryData) => (
    <div className="border border-[#1E1915] rounded-sm bg-white p-2.5 space-y-1">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#8a1414]">
            Équipe {team.side}
            {team.factionName && team.factionName !== team.name
              ? ` · ${team.factionName}`
              : ''}
          </div>
          <div className="font-display font-extrabold text-sm text-[#142b54] truncate">
            {team.name}
          </div>
        </div>
        <div className="text-right text-[10px] text-stone-600 shrink-0">
          <div>
            Coach :{' '}
            <strong className="text-[#1a1410]">{team.coach || '—'}</strong>
          </div>
          <div className="font-mono-num">
            Relances :{' '}
            <strong>
              {team.remainingRerolls}/{team.rerolls}
            </strong>{' '}
            rest.
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-2.5 gap-y-0.5 pt-1 border-t border-stone-200 text-[10px] text-stone-700">
        <div className="whitespace-nowrap">
          VEA aj. :{' '}
          <strong className="font-mono-num text-[#1a1410]">
            {formatGold(team.adjustedTv)} po
          </strong>
        </div>
        <div className="whitespace-nowrap">
          FP :{' '}
          <strong className="font-mono-num text-[#1a1410]">
            {team.popularityFactor}
          </strong>{' '}
          <span className="text-stone-500 font-mono-num">
            ({team.dedicatedFansBefore}+{team.fanRollD3 ?? '?'})
          </span>
        </div>
        <div className="whitespace-nowrap">
          Coup d’envoi :{' '}
          <strong className="text-[#1a1410]">
            {team.kickoffChoice === 'receive'
              ? 'Réceptionne'
              : team.kickoffChoice === 'kick'
                ? 'Engage'
                : '—'}
          </strong>
        </div>
      </div>

      {team.conceded && (
        <div className="text-[10px] font-bold text-[#8a1414] bg-red-50 border border-red-200 rounded px-1.5 py-0.5">
          {team.concededWithoutPenalty
            ? 'Match concédé (sans pénalité)'
            : 'Match concédé'}
        </div>
      )}
    </div>
  );

  const renderPreMatchSide = (team: TeamMatchSummaryData) => (
    <div className="border border-[#1E1915]/70 rounded-sm bg-[#faf6eb] p-2 space-y-1 text-[10px]">
      <div className="flex items-center justify-between font-bold text-[#142b54] border-b border-stone-300 pb-0.5">
        <span>{team.name}</span>
        <span className="font-mono-num">
          Budget CdP : {formatGold(team.inducementBudgetTotal)} po
        </span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-stone-700 font-mono-num">
        <span>TVE : {formatGold(team.tve)} po</span>
        <span>Petite caisse : {formatGold(team.petiteCaisse)} po</span>
        {team.treasuryAdded > 0 && (
          <span>Trésorerie engagée : {formatGold(team.treasuryAdded)} po</span>
        )}
        {team.journaliersCost > 0 && (
          <span>Journaliers : {formatGold(team.journaliersCost)} po</span>
        )}
      </div>
      <div>
        <span className="font-semibold text-[#1a1410]">Coups de pouce :</span>{' '}
        {team.inducementItems.length > 0 ? (
          <span>
            {team.inducementItems
              .map((i) => `${i.name || 'Divers'} (${formatGold(i.cost)} po)`)
              .join(' · ')}
            {' — '}
            <strong className="font-mono-num">
              Total {formatGold(team.inducementsSpent)} po
            </strong>
          </span>
        ) : (
          <span className="text-stone-500">Aucun</span>
        )}
      </div>
      {team.prayers.length > 0 && (
        <div>
          <span className="font-semibold text-[#8a1414]">Prières de Nuffle :</span>{' '}
          {team.prayers.join(' · ')}
        </div>
      )}
    </div>
  );

  const renderPostMatchCard = (team: TeamMatchSummaryData) => {
    const fdDeltaLabel =
      team.fdChange > 0 ? `+${team.fdChange}` : `${team.fdChange}`;

    return (
      <div className="border border-[#1E1915] rounded-sm bg-white p-2 space-y-1 text-[10px] leading-snug">
        <div className="flex items-center justify-between border-b border-stone-300 pb-1">
          <span className="font-display font-bold text-[#142b54]">
            {team.name}
          </span>
          <span className="font-mono-num font-bold text-[#8a1414]">
            Gains : {formatGold(team.gains.totalGains)} po
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-stone-700">
          <div>
            Base affluence :{' '}
            <strong className="font-mono-num text-[#1a1410]">
              {formatGold(team.gains.baseGain)} po
            </strong>
          </div>
          <div>
            TD ({team.score}×10k) :{' '}
            <strong className="font-mono-num text-[#1a1410]">
              {formatGold(team.gains.touchdownGain)} po
            </strong>
          </div>
          <div>
            Non-tempo :{' '}
            <strong className="font-mono-num text-[#1a1410]">
              {formatGold(team.gains.nonStallGain)} po
            </strong>
          </div>
          <div>
            Fans (FD) :{' '}
            <strong className="font-mono-num text-[#1a1410]">
              {team.dedicatedFansBefore} → {team.dedicatedFansAfter}
            </strong>{' '}
            <span className="text-stone-500">
              ({fdDeltaLabel}
              {team.fdPostMatchRoll ? `, 1D6=${team.fdPostMatchRoll}` : ''})
            </span>
          </div>
        </div>

        <div className="border-t border-stone-200 pt-1 flex flex-wrap items-center justify-between gap-2 bg-[#faf6eb] px-2 py-1 rounded-sm">
          <div className="text-stone-700">
            Trésorerie :{' '}
            <span className="font-mono-num">{formatGold(team.treasuryBefore)}</span>
            {team.treasuryAdded > 0 && (
              <span className="font-mono-num text-stone-600">
                {' '}− {formatGold(team.treasuryAdded)} (CdP)
              </span>
            )}
            <span className="font-mono-num">
              {' '}+ {formatGold(team.gains.totalGains)}
            </span>
            {team.postMatchPurchasesCost > 0 && (
              <span className="font-mono-num text-stone-600">
                {' '}− {formatGold(team.postMatchPurchasesCost)}
              </span>
            )}
          </div>
          <div className="font-mono-num font-bold text-[#142b54]">
            Finale : {formatGold(team.finalTreasury)} po
          </div>
        </div>

        <div className="text-[10px] text-stone-600">
          Erreurs coûteuses :{' '}
          <strong className="text-[#1a1410]">
            {team.expensiveMistake.severity}
          </strong>
          {team.expensiveMistake.loss > 0 && (
            <span className="font-mono-num text-[#8a1414]">
              {' '}(−{formatGold(team.expensiveMistake.loss)} po)
            </span>
          )}
          <span className="text-stone-500">
            {' '}— {team.expensiveMistake.ruleDetail}
          </span>
        </div>

        {team.pspEligiblePlayers.length > 0 && (
          <div className="text-[10px] text-stone-700">
            <span className="font-semibold text-[#142b54]">Éligibles ≥ 3 PSP :</span>{' '}
            {team.pspEligiblePlayers
              .map((p) => `${p.name} (${p.psp})`)
              .join(', ')}
          </div>
        )}

        {team.injuredPlayers.length > 0 && (
          <div className="text-[10px] text-[#8a1414]">
            <span className="font-semibold">À reporter :</span>{' '}
            {team.injuredPlayers
              .map((p) => `${p.name} (${formatPlayerStatus(p)})`)
              .join(', ')}
          </div>
        )}

        {(team.pspSpentNotes.length > 0 || team.rosterMovesNotes.length > 0) && (
          <div className="text-[10px] text-stone-700 border-t border-stone-200 pt-1 space-y-0.5">
            {team.pspSpentNotes.map((note, idx) => (
              <div key={`psp-${idx}`}>• PSP : {note}</div>
            ))}
            {team.rosterMovesNotes.map((note, idx) => (
              <div key={`move-${idx}`}>• Effectif : {note}</div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={isPreview ? 'block' : 'hidden print:block'}>
      {isPreview && (
        <div className="no-print max-w-[900px] mx-auto mb-3 px-3 py-2 rounded-md bg-stone-900/90 border border-amber-700/50 text-stone-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span>
            Aperçu de la <strong>fiche synthétique de match</strong> destinée à
            l’impression A4 / export PDF.
          </span>
          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-400 hover:bg-amber-300 text-amber-950 font-semibold transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimer / Exporter en PDF</span>
          </button>
        </div>
      )}

      <article
        aria-label="Fiche synthétique de match pour impression PDF"
        data-testid="print-summary-sheet"
        className="print-summary-sheet max-w-[900px] mx-auto bg-white text-[#1a1410] border-2 border-[#1E1915] shadow-2xl rounded-sm overflow-hidden"
      >
        {/* Top Banner */}
        <header className="bg-[#142b54] text-white px-3.5 py-2 print:px-3 print:py-1.5 border-b-2 border-[#EAB308] flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="font-display text-base print:text-sm font-black tracking-wider uppercase leading-tight">
              BLOOD BOWL — FICHE SYNTHÉTIQUE DE MATCH
            </div>
            <div className="text-[10.5px] print:text-[9.5px] text-amber-200">
              Compte-rendu officiel Saison 3 • Avant-match, statistiques &amp; après-match
            </div>
          </div>
          <div className="text-left sm:text-right print:text-right text-[10px] print:text-[9.5px] leading-tight text-stone-100">
            <div>
              <strong>Date :</strong> {summary.date || '—'} ·{' '}
              <strong>Lieu :</strong> {summary.location || '—'}
            </div>
            <div>
              <strong>Stade :</strong> {summary.stadium || 'Standard'}
              {summary.stadiumAttribute ? ` (${summary.stadiumAttribute})` : ''} ·{' '}
              <strong>Météo :</strong> {summary.weatherName || '—'}
              {summary.weatherRoll ? ` (2D6=${summary.weatherRoll})` : ''}
            </div>
          </div>
        </header>

        <div className="p-2.5 sm:p-3.5 print:p-2 space-y-2 print:space-y-1.5 bg-[#fffdf8]">
          {/* Scoreboard + Team Overview */}
          <section className="grid grid-cols-1 md:grid-cols-12 print:grid-cols-12 gap-2 items-stretch">
            <div className="md:col-span-5 print:col-span-5">
              {renderTeamHeaderCard(summary.teamA)}
            </div>

            <div className="md:col-span-2 print:col-span-2 border-2 border-[#8a1414] rounded-sm bg-[#faf3e0] px-2 py-2 flex flex-col items-center justify-center text-center">
              <span className="text-[9px] font-display font-bold uppercase tracking-widest text-[#8a1414]">
                Score Final
              </span>
              <div
                data-testid="summary-score"
                className="font-display font-black text-2xl text-[#142b54] font-mono-num my-0.5"
              >
                {summary.teamA.score} - {summary.teamB.score}
              </div>
              <span className="text-[10px] font-bold text-[#1a1410] leading-tight">
                {summary.outcomeLabel}
              </span>
              <span className="text-[9.5px] text-stone-600 font-mono-num mt-0.5">
                {summary.half === 1 ? '1re' : '2e'} MT · T{summary.teamA.currentTurn}/T{summary.teamB.currentTurn}
              </span>
            </div>

            <div className="md:col-span-5 print:col-span-5">
              {renderTeamHeaderCard(summary.teamB)}
            </div>
          </section>

          {/* Pre-match & Inducements */}
          <section className="break-inside-avoid">
            <div className="bg-[#8a1414] text-white font-display font-bold text-[10.5px] tracking-wider uppercase px-2.5 py-0.5 rounded-t-sm">
              Avant-match, budgets &amp; coups de pouce
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-2 pt-1.5">
              {renderPreMatchSide(summary.teamA)}
              {renderPreMatchSide(summary.teamB)}
            </div>
          </section>

          {/* Active Players Statistics */}
          <section className="break-inside-avoid">
            <div className="bg-[#8a1414] text-white font-display font-bold text-[10.5px] tracking-wider uppercase px-2.5 py-0.5 rounded-t-sm">
              Statistiques synthétiques des joueurs actifs
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-2 pt-1.5">
              <TeamStatsTable team={summary.teamA} />
              <TeamStatsTable team={summary.teamB} />
            </div>
          </section>

          {/* Key Events & Turn Highlights */}
          {(summary.highlightedTurns.length > 0 ||
            summary.kickoffEventsLog.length > 0) && (
            <section className="break-inside-avoid">
              <div className="bg-[#8a1414] text-white font-display font-bold text-[10.5px] tracking-wider uppercase px-2.5 py-0.5 rounded-t-sm">
                Faits marquants du match
              </div>
              <div className="border border-[#1E1915] rounded-b-sm bg-white p-2 space-y-1.5 text-[10px]">
                {summary.kickoffEventsLog.length > 0 && (
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-stone-700 border-b border-stone-200 pb-1">
                    <span className="font-bold text-[#142b54]">Coups d’envoi :</span>
                    {summary.kickoffEventsLog.map((ev, idx) => (
                      <span key={`${ev.phase}-${idx}`}>
                        {ev.phase} (2D6={ev.roll2d6} : <strong>{ev.title}</strong>)
                      </span>
                    ))}
                  </div>
                )}

                {summary.highlightedTurns.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-x-4 gap-y-1">
                    {summary.highlightedTurns.map((t) => (
                      <div key={t.turn} className="leading-snug">
                        <span className="font-mono-num font-bold text-[#8a1414]">
                          T{t.turn} :
                        </span>{' '}
                        {t.teamA.trim() && (
                          <span>
                            <strong>A</strong> {t.teamA.trim()}
                          </span>
                        )}
                        {t.teamA.trim() && t.teamB.trim() && (
                          <span className="text-stone-400"> | </span>
                        )}
                        {t.teamB.trim() && (
                          <span>
                            <strong>B</strong> {t.teamB.trim()}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Post-match Summary */}
          <section className="break-inside-avoid">
            <div className="bg-[#8a1414] text-white font-display font-bold text-[10.5px] tracking-wider uppercase px-2.5 py-0.5 rounded-t-sm">
              Bilan d’après-match (gains, fans, trésorerie &amp; séquelles)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-2 pt-1.5">
              {renderPostMatchCard(summary.teamA)}
              {renderPostMatchCard(summary.teamB)}
            </div>
          </section>

          {/* Footer Signatures */}
          <footer className="break-inside-avoid pt-1 border-t border-stone-300 grid grid-cols-3 gap-3 text-[9.5px] text-stone-600">
            <div className="border-b border-stone-400 pb-2">
              Signature Coach A ({summary.teamA.coach || '—'}) :
            </div>
            <div className="border-b border-stone-400 pb-2">
              Signature Coach B ({summary.teamB.coach || '—'}) :
            </div>
            <div className="border-b border-stone-400 pb-2">
              Validation Commissaire / Ligue :
            </div>
          </footer>
        </div>
      </article>
    </div>
  );
};
