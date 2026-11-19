import React, { useState } from 'react';
import { BookOpen, Dices, ShieldAlert, Sparkles, Swords, X } from 'lucide-react';
import {
  KICKOFF_EVENTS_TABLE,
  PRAYERS_TO_NUFFLE,
  UPGRADE_COST_TABLE,
  WEATHER_TABLE,
} from '../data/bloodbowlRulesData';
import { TeamSide } from '../types/bloodbowl';
import { getKickoffEventByRoll, getPrayerByRoll, getWeatherByRoll } from '../utils/bloodbowlRules';

interface RulesDiceDrawerProps {
  onClose: () => void;
  onApplyWeather: (roll2D6: number, weatherName: string) => void;
  onLogKickoff: (phase: string, roll2D6: number, title: string) => void;
  onApplyPrayer: (side: TeamSide, prayerText: string, rollD16: number) => void;
}

type DrawerTab = 'dice' | 'tables' | 'rules';

const BLOCK_FACES = [
  { id: 'skull', label: 'Crâne', short: 'CRÂNE', desc: 'L’attaquant est Plaqué (Turnover).' },
  { id: 'both', label: 'Les Deux Plaqués', short: '2 PLAQUÉS', desc: 'Les deux joueurs sont Plaqués (sauf Blocage).' },
  { id: 'push', label: 'Repoussé', short: 'REPOUSSÉ', desc: 'Le défenseur est repoussé d’1 case.' },
  { id: 'stumble', label: 'Bousculé', short: 'BOUSCULÉ', desc: 'Repoussé si Esquive, sinon Plaqué.' },
  { id: 'pow', label: 'Défenseur Plaqué', short: 'POW !', desc: 'Le défenseur est repoussé puis Plaqué.' },
  { id: 'push2', label: 'Repoussé', short: 'REPOUSSÉ', desc: 'Le défenseur est repoussé d’1 case.' },
];

export const RulesDiceDrawer: React.FC<RulesDiceDrawerProps> = ({
  onClose,
  onApplyWeather,
  onLogKickoff,
  onApplyPrayer,
}) => {
  const [tab, setTab] = useState<DrawerTab>('dice');

  // Weather 2D6
  const [weatherDice, setWeatherDice] = useState<[number, number]>([3, 4]);
  const weatherTotal = weatherDice[0] + weatherDice[1];
  const weatherResult = getWeatherByRoll(weatherTotal);

  // Kickoff 2D6
  const [kickoffDice, setKickoffDice] = useState<[number, number]>([4, 3]);
  const [kickoffPhase, setKickoffPhase] = useState('Coup d’envoi 1re mi-temps');
  const kickoffTotal = kickoffDice[0] + kickoffDice[1];
  const kickoffResult = getKickoffEventByRoll(kickoffTotal);

  // Prayer 1D16
  const [prayerRoll, setPrayerRoll] = useState<number>(10);
  const prayerResult = getPrayerByRoll(prayerRoll);

  // Block dice
  const [blockCount, setBlockCount] = useState<1 | 2 | 3>(2);
  const [blockResults, setBlockResults] = useState<number[]>([4, 2]);

  // Injury 2D6 + Casualty 1D16
  const [isMinus, setIsMinus] = useState(false);
  const [injuryDice, setInjuryDice] = useState<[number, number]>([4, 4]);
  const [casualtyRoll, setCasualtyRoll] = useState<number | null>(null);
  const [sequelleRoll, setSequelleRoll] = useState<number | null>(null);

  const rollWeather = () => {
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    setWeatherDice([d1, d2]);
  };

  const rollKickoff = () => {
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    setKickoffDice([d1, d2]);
  };

  const rollPrayer = () => {
    setPrayerRoll(Math.floor(Math.random() * 16) + 1);
  };

  const rollBlock = (count: 1 | 2 | 3) => {
    setBlockCount(count);
    setBlockResults(
      Array.from({ length: count }, () => Math.floor(Math.random() * 6))
    );
  };

  const rollInjury = () => {
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    setInjuryDice([d1, d2]);
    const total = d1 + d2;
    const casThreshold = isMinus ? 9 : 10;
    if (total >= casThreshold) {
      const cas = Math.floor(Math.random() * 16) + 1;
      setCasualtyRoll(cas);
      if (cas >= 10 && cas <= 12) {
        setSequelleRoll(Math.floor(Math.random() * 6) + 1);
      } else {
        setSequelleRoll(null);
      }
    } else {
      setCasualtyRoll(null);
      setSequelleRoll(null);
    }
  };

  const injuryTotal = injuryDice[0] + injuryDice[1];
  const getInjuryLabel = (total: number) => {
    if (isMinus) {
      if (total <= 6) return 'Sonné';
      if (total <= 8) return 'K.-O.';
      return 'Élimination (Minus 9+)';
    }
    if (total <= 7) return 'Sonné';
    if (total <= 9) return 'K.-O.';
    return 'Élimination (10+)';
  };

  const getCasualtyLabel = (roll: number) => {
    if (roll <= 6) return 'Blessure Légère (RPM)';
    if (roll <= 9) return 'Blessure Grave (RPM + BP)';
    if (roll <= 12) return 'Blessure Permanente (RPM + Séquelle)';
    return 'Mort !';
  };

  const getSequelleLabel = (roll: number) => {
    switch (roll) {
      case 1:
      case 2:
        return '1–2 : Traumatisme Crânien (-1 AR)';
      case 3:
        return '3 : Genou Déboîté (-1 M)';
      case 4:
        return '4 : Bras Cassé (-1 CP)';
      case 5:
        return '5 : Hanche Disloquée (-1 AG)';
      default:
        return '6 : Cou Brisé (-1 F)';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Règles et simulateur de dés Blood Bowl"
      className="no-print fixed inset-0 z-50 flex justify-end bg-black/70"
    >
      <div className="w-full max-w-xl bg-[#f6eed8] border-l-2 border-[#1E1915] h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="crimson-banner px-5 py-3.5 flex items-center justify-between border-b-2 border-[#EAB308]">
          <div className="flex items-center gap-2 text-white">
            <Dices className="w-5 h-5 text-amber-300" />
            <h3 className="font-display text-base sm:text-lg font-bold tracking-wide">
              Règles Saison 3 &amp; Dés
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le panneau Règles et Dés"
            className="p-1.5 rounded text-amber-100 hover:bg-black/25 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation tabs */}
        <div className="bg-[#0D2042] px-4 py-2 flex items-center gap-2 border-b border-amber-500/40">
          <button
            type="button"
            onClick={() => setTab('dice')}
            aria-pressed={tab === 'dice'}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
              tab === 'dice' ? 'bg-amber-400 text-amber-950' : 'text-stone-200 hover:bg-white/10'
            }`}
          >
            Simulateur de dés
          </button>
          <button
            type="button"
            onClick={() => setTab('tables')}
            aria-pressed={tab === 'tables'}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
              tab === 'tables' ? 'bg-amber-400 text-amber-950' : 'text-stone-200 hover:bg-white/10'
            }`}
          >
            Tables officielles
          </button>
          <button
            type="button"
            onClick={() => setTab('rules')}
            aria-pressed={tab === 'rules'}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
              tab === 'rules' ? 'bg-amber-400 text-amber-950' : 'text-stone-200 hover:bg-white/10'
            }`}
          >
            PSP &amp; Règles 2026
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-[#1E1915]">
          {tab === 'dice' && (
            <>
              {/* Météo 2D6 */}
              <section className="bg-white/85 border border-[#8c7853] rounded-md p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-display text-sm font-bold text-[#750d0d] uppercase">
                    Tableau de Météo (2D6)
                  </h4>
                  <button
                    type="button"
                    onClick={rollWeather}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#0D2042] hover:bg-[#16315e] text-white rounded cursor-pointer"
                  >
                    <Dices className="w-3.5 h-3.5" />
                    <span>Lancer 2D6</span>
                  </button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="font-mono-num">
                    <span className="font-bold text-base text-[#0D2042]">{weatherTotal}</span>{' '}
                    <span className="text-stone-600">
                      ({weatherDice[0]} + {weatherDice[1]})
                    </span>{' '}
                    — <span className="font-bold">{weatherResult.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onApplyWeather(weatherTotal, weatherResult.name)}
                    className="px-2.5 py-1 text-xs font-semibold bg-amber-200 hover:bg-amber-300 text-amber-950 border border-amber-600/40 rounded cursor-pointer"
                  >
                    Appliquer au Recto
                  </button>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed">{weatherResult.effect}</p>
              </section>

              {/* Coup d'envoi 2D6 */}
              <section className="bg-white/85 border border-[#8c7853] rounded-md p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-display text-sm font-bold text-[#750d0d] uppercase">
                    Événement de Coup d’Envoi (2D6)
                  </h4>
                  <button
                    type="button"
                    onClick={rollKickoff}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#0D2042] hover:bg-[#16315e] text-white rounded cursor-pointer"
                  >
                    <Dices className="w-3.5 h-3.5" />
                    <span>Lancer 2D6</span>
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <label htmlFor="kickoff-phase-input" className="text-stone-700 font-semibold">
                    Phase :
                  </label>
                  <input
                    id="kickoff-phase-input"
                    type="text"
                    value={kickoffPhase}
                    onChange={(e) => setKickoffPhase(e.target.value)}
                    className="flex-1 min-w-[160px] px-2 py-1 text-xs bg-white border border-stone-400 rounded"
                  />
                  <button
                    type="button"
                    onClick={() => onLogKickoff(kickoffPhase, kickoffTotal, kickoffResult.title)}
                    className="px-2.5 py-1 text-xs font-semibold bg-amber-200 hover:bg-amber-300 text-amber-950 border border-amber-600/40 rounded cursor-pointer"
                  >
                    Ajouter au Verso
                  </button>
                </div>
                <div className="text-xs font-mono-num">
                  <span className="font-bold text-base text-[#0D2042]">{kickoffTotal}</span>{' '}
                  <span className="text-stone-600">
                    ({kickoffDice[0]} + {kickoffDice[1]})
                  </span>{' '}
                  — <span className="font-bold text-[#750d0d]">{kickoffResult.title}</span>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed">{kickoffResult.description}</p>
              </section>

              {/* Prières à Nuffle 1D16 */}
              <section className="bg-white/85 border border-[#8c7853] rounded-md p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-display text-sm font-bold text-[#750d0d] uppercase flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>Prières à Nuffle (1D16)</span>
                  </h4>
                  <button
                    type="button"
                    onClick={rollPrayer}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#0D2042] hover:bg-[#16315e] text-white rounded cursor-pointer"
                  >
                    <Dices className="w-3.5 h-3.5" />
                    <span>Lancer 1D16</span>
                  </button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-mono-num font-bold text-base text-[#0D2042]">
                      {prayerResult.roll}.
                    </span>{' '}
                    <span className="font-bold">{prayerResult.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        onApplyPrayer('A', `${prayerResult.roll}. ${prayerResult.title}`, prayerResult.roll)
                      }
                      className="px-2 py-1 text-xs font-semibold bg-amber-200 hover:bg-amber-300 text-amber-950 border border-amber-600/40 rounded cursor-pointer"
                    >
                      + Équipe A
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onApplyPrayer('B', `${prayerResult.roll}. ${prayerResult.title}`, prayerResult.roll)
                      }
                      className="px-2 py-1 text-xs font-semibold bg-amber-200 hover:bg-amber-300 text-amber-950 border border-amber-600/40 rounded cursor-pointer"
                    >
                      + Équipe B
                    </button>
                  </div>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed">{prayerResult.description}</p>
              </section>

              {/* Dés de blocage */}
              <section className="bg-white/85 border border-[#8c7853] rounded-md p-3.5 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-display text-sm font-bold text-[#750d0d] uppercase flex items-center gap-1.5">
                    <Swords className="w-4 h-4" />
                    <span>Dés de Blocage</span>
                  </h4>
                  <div className="flex items-center gap-1.5">
                    {([1, 2, 3] as const).map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => rollBlock(cnt)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
                          blockCount === cnt
                            ? 'bg-[#750d0d] text-white'
                            : 'bg-[#0D2042] text-white hover:bg-[#16315e]'
                        }`}
                      >
                        {cnt} {cnt === 1 ? 'Dé' : 'Dés'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {blockResults.map((faceIdx, i) => {
                    const face = BLOCK_FACES[faceIdx];
                    const isDanger = face.id === 'skull' || face.id === 'both';
                    return (
                      <div
                        key={i}
                        className={`p-2 rounded border text-center ${
                          isDanger
                            ? 'bg-red-50 border-red-300'
                            : 'bg-amber-50 border-amber-300'
                        }`}
                      >
                        <div className="font-display text-xs font-extrabold text-[#1E1915]">
                          {face.short}
                        </div>
                        <div className="text-[11px] text-stone-700 mt-0.5">{face.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Blessures 2D6 + Éliminations 1D16 */}
              <section className="bg-white/85 border border-[#8c7853] rounded-md p-3.5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-display text-sm font-bold text-[#750d0d] uppercase flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Blessures (2D6) &amp; Éliminations (1D16)</span>
                  </h4>
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isMinus}
                        onChange={(e) => setIsMinus(e.target.checked)}
                        className="accent-[#750d0d]"
                      />
                      <span>Minus</span>
                    </label>
                    <button
                      type="button"
                      onClick={rollInjury}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#0D2042] hover:bg-[#16315e] text-white rounded cursor-pointer"
                    >
                      <Dices className="w-3.5 h-3.5" />
                      <span>Lancer Blessure</span>
                    </button>
                  </div>
                </div>
                <div className="text-xs space-y-1">
                  <div className="font-mono-num">
                    Jet 2D6 : <strong className="text-base text-[#0D2042]">{injuryTotal}</strong> ({injuryDice[0]} + {injuryDice[1]}) —{' '}
                    <strong className="text-[#750d0d]">{getInjuryLabel(injuryTotal)}</strong>
                  </div>
                  {casualtyRoll !== null && (
                    <div className="font-mono-num text-red-900 font-semibold">
                      Tableau des Éliminations (1D16 = {casualtyRoll}) : {getCasualtyLabel(casualtyRoll)}
                      {sequelleRoll !== null && ` — 1D6 Séquelle (${sequelleRoll}) : ${getSequelleLabel(sequelleRoll)}`}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}

          {tab === 'tables' && (
            <div className="space-y-4 text-xs">
              <section className="bg-white/85 border border-[#8c7853] rounded-md overflow-hidden">
                <div className="navy-header text-white px-3 py-2 font-display font-bold">
                  Tableau de Météo (2D6)
                </div>
                <table className="w-full">
                  <tbody className="divide-y divide-[#e2d4b7]">
                    {WEATHER_TABLE.map((w) => (
                      <tr key={w.name}>
                        <td className="p-2 font-mono-num font-bold whitespace-nowrap w-16">
                          {w.min === w.max ? w.min : `${w.min}–${w.max}`}
                        </td>
                        <td className="p-2 font-semibold whitespace-nowrap">{w.name}</td>
                        <td className="p-2 text-stone-700">{w.effect}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <section className="bg-white/85 border border-[#8c7853] rounded-md overflow-hidden">
                <div className="navy-header text-white px-3 py-2 font-display font-bold">
                  Événements de Coup d’Envoi (2D6)
                </div>
                <table className="w-full">
                  <tbody className="divide-y divide-[#e2d4b7]">
                    {KICKOFF_EVENTS_TABLE.map((ev) => (
                      <tr key={ev.roll}>
                        <td className="p-2 font-mono-num font-bold w-10 text-center">{ev.roll}</td>
                        <td className="p-2 font-semibold whitespace-nowrap">{ev.title}</td>
                        <td className="p-2 text-stone-700">{ev.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <section className="bg-white/85 border border-[#8c7853] rounded-md overflow-hidden">
                <div className="navy-header text-white px-3 py-2 font-display font-bold">
                  Prières à Nuffle (1D16)
                </div>
                <table className="w-full">
                  <tbody className="divide-y divide-[#e2d4b7]">
                    {PRAYERS_TO_NUFFLE.map((pr) => (
                      <tr key={pr.roll}>
                        <td className="p-2 font-mono-num font-bold w-10 text-center">{pr.roll}</td>
                        <td className="p-2 font-semibold whitespace-nowrap">{pr.title}</td>
                        <td className="p-2 text-stone-700">{pr.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </div>
          )}

          {tab === 'rules' && (
            <div className="space-y-4 text-xs">
              <section className="bg-white/85 border border-[#8c7853] rounded-md p-3.5 space-y-1.5">
                <h4 className="font-display text-sm font-bold text-[#750d0d] flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  <span>Gains de PSP (Saison 3)</span>
                </h4>
                <ul className="space-y-1 text-stone-800 list-disc pl-4">
                  <li><strong>Réussite (REU) :</strong> +1 PSP (+2 PSP avec la prière Passe Parfaite).</li>
                  <li><strong>Élimination (ELI) :</strong> +2 PSP (+3 PSP avec <em>Bagarreurs Brutaux</em>).</li>
                  <li><strong>Interception (INT) :</strong> +2 PSP.</li>
                  <li><strong>Touchdown (TD) :</strong> +3 PSP (+2 PSP avec <em>Bagarreurs Brutaux</em>).</li>
                  <li><strong>Joueur du Match (MVP) :</strong> +4 PSP (désigné parmi vos joueurs éligibles).</li>
                  <li><strong>Agression (AGRO) :</strong> 0 PSP par défaut (+2 PSP si Élimination avec <em>Frénésie d’Agression</em>).</li>
                </ul>
              </section>

              <section className="bg-white/85 border border-[#8c7853] rounded-md overflow-hidden">
                <div className="navy-header text-white px-3 py-2 font-display font-bold">
                  Tableau d’Amélioration des Joueurs (PSP)
                </div>
                <table className="w-full font-mono-num">
                  <thead className="bg-[#efe2c0] text-[#1E1915]">
                    <tr>
                      <th className="p-2 text-left">Niveau</th>
                      <th className="p-2 text-center">Aléat. (P)</th>
                      <th className="p-2 text-center">Choix (P)</th>
                      <th className="p-2 text-center">Choix (S)</th>
                      <th className="p-2 text-center">Carac.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2d4b7]">
                    {UPGRADE_COST_TABLE.map((row) => (
                      <tr key={row.level}>
                        <td className="p-2 font-sans font-semibold">{row.level}</td>
                        <td className="p-2 text-center">{row.randomP}</td>
                        <td className="p-2 text-center">{row.chooseP}</td>
                        <td className="p-2 text-center">{row.chooseS}</td>
                        <td className="p-2 text-center">{row.carac}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <section className="bg-white/85 border border-[#8c7853] rounded-md p-3.5 space-y-1.5">
                <h4 className="font-display text-sm font-bold text-[#750d0d]">
                  Rappel Saison 3 (2026)
                </h4>
                <ul className="space-y-1 text-stone-800 list-disc pl-4">
                  <li><strong>Bonus de non-temporisation :</strong> +10 000 po si vous n’avez jamais temporisé durant le match.</li>
                  <li><strong>Gains d’après-match :</strong> ((FP A + FP B) / 2 + TD) × 10 000 po + 10 000 po (si non-temporisation).</li>
                  <li><strong>Petite caisse (Coups de Pouce) :</strong> L’équipe à VEA ajustée supérieure peut dépenser sa Trésorerie en premier ; l’équipe inférieure reçoit la différence + ce que l’équipe supérieure a dépensé, et peut ajouter jusqu’à <strong>50 000 po max</strong> de sa trésorerie.</li>
                  <li><strong>Erreurs Coûteuses :</strong> Déclenchées uniquement si la trésorerie atteint au moins <strong>100 000 po</strong> en fin d’après-match.</li>
                </ul>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
