import React, { useMemo, useState } from 'react';
import { Search, Shield, Users, X } from 'lucide-react';
import { BLOOD_BOWL_TEAMS } from '../data/bloodbowlRulesData';
import { BloodBowlTeamDef, TeamSide } from '../types/bloodbowl';
import { formatGold } from '../utils/bloodbowlRules';

interface TeamRosterModalProps {
  side: TeamSide;
  currentTeamId: string | null;
  onSelectTeam: (team: BloodBowlTeamDef, populateStarterPlayers: boolean) => void;
  onClose: () => void;
}

export const TeamRosterModal: React.FC<TeamRosterModalProps> = ({
  side,
  currentTeamId,
  onSelectTeam,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<BloodBowlTeamDef>(
    () => BLOOD_BOWL_TEAMS.find((t) => t.id === currentTeamId) ?? BLOOD_BOWL_TEAMS[13] // Humains default preview
  );
  const [populatePlayers, setPopulatePlayers] = useState(true);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return BLOOD_BOWL_TEAMS;
    return BLOOD_BOWL_TEAMS.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.league.toLowerCase().includes(q) ||
        t.specialRules.some((r) => r.toLowerCase().includes(q))
    );
  }, [query]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Sélectionner une équipe Blood Bowl pour l'Équipe ${side}`}
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
    >
      <div className="bg-[#f6eed8] border-2 border-[#1E1915] rounded-lg shadow-2xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="crimson-banner px-5 py-3 flex items-center justify-between border-b-2 border-[#EAB308]">
          <div className="flex items-center gap-2 text-white">
            <Shield className="w-5 h-5 text-amber-300" />
            <h3 className="font-display text-base sm:text-lg font-bold tracking-wide">
              Fiches d’Équipe Saison 3 · Équipe {side}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la sélection d'équipe"
            className="p-1.5 rounded text-amber-100 hover:bg-black/25 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-hidden">
          {/* Team list */}
          <div className="md:col-span-5 border-b md:border-b-0 md:border-r border-[#c8b791] flex flex-col min-h-0 bg-[#efe2c0]/60">
            <div className="p-3 border-b border-[#c8b791]">
              <label htmlFor="team-search" className="sr-only">
                Rechercher une équipe
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-stone-600 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="team-search"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher race, ligue ou règle..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#8c7853] rounded focus:outline-none focus:ring-2 focus:ring-[#9D1717]"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-[#d8c8a6] max-h-[240px] md:max-h-none">
              {filtered.map((team) => {
                const isActive = selected.id === team.id;
                return (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => setSelected(team)}
                    className={`w-full text-left px-3.5 py-2.5 transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#0D2042] text-white'
                        : 'hover:bg-[#e5d4ac] text-[#1E1915]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm">{team.name}</span>
                      <span
                        className={`text-xs font-mono-num ${
                          isActive ? 'text-amber-300' : 'text-stone-600'
                        }`}
                      >
                        Cat. {team.tier}
                      </span>
                    </div>
                    <div
                      className={`text-xs mt-0.5 truncate ${
                        isActive ? 'text-slate-300' : 'text-stone-600'
                      }`}
                    >
                      {team.league}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Team detail */}
          <div className="md:col-span-7 p-4 overflow-y-auto flex flex-col gap-3">
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h4 className="font-display text-xl font-extrabold text-[#750d0d]">
                  {selected.name}
                </h4>
                <span className="text-xs font-semibold text-stone-700 font-mono-num">
                  Relances : {formatGold(selected.rerollCost)} po · Apothicaire :{' '}
                  {selected.apothecary ? 'Oui' : 'Non'}
                </span>
              </div>
              <p className="text-xs text-stone-700 mt-1">
                Ligue : <span className="font-semibold">{selected.league}</span>
                {selected.specialRules.length > 0 && (
                  <>
                    {' · '}Règles spéciales :{' '}
                    <span className="font-semibold text-[#750d0d]">
                      {selected.specialRules.join(', ')}
                    </span>
                  </>
                )}
              </p>
              <p className="text-xs text-stone-700 mt-0.5 font-mono-num">
                Journalier disponible : {selected.linemanName} ({formatGold(selected.linemanCost)} po, Solitaire 4+)
              </p>
            </div>

            <div className="border border-[#8c7853] rounded overflow-x-auto bg-white/80">
              <table className="w-full text-xs">
                <thead className="navy-header text-white">
                  <tr>
                    <th className="py-1.5 px-2 text-left">Qté</th>
                    <th className="py-1.5 px-2 text-left">Poste</th>
                    <th className="py-1.5 px-2 text-right">Coût</th>
                    <th className="py-1.5 px-1.5 text-center">M</th>
                    <th className="py-1.5 px-1.5 text-center">F</th>
                    <th className="py-1.5 px-1.5 text-center">AG</th>
                    <th className="py-1.5 px-1.5 text-center">CP</th>
                    <th className="py-1.5 px-1.5 text-center">AR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2d4b7]">
                  {selected.positions.map((pos) => (
                    <tr key={pos.role} className="hover:bg-amber-50/70">
                      <td className="py-1.5 px-2 font-mono-num whitespace-nowrap">{pos.qty}</td>
                      <td className="py-1.5 px-2">
                        <div className="font-semibold text-[#1E1915]">{pos.role}</div>
                        {pos.skills && (
                          <div className="text-[11px] text-stone-600 leading-tight">{pos.skills}</div>
                        )}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono-num whitespace-nowrap">
                        {formatGold(pos.cost)}
                      </td>
                      <td className="py-1.5 px-1.5 text-center font-mono-num">{pos.ma}</td>
                      <td className="py-1.5 px-1.5 text-center font-mono-num">{pos.st}</td>
                      <td className="py-1.5 px-1.5 text-center font-mono-num">{pos.ag}</td>
                      <td className="py-1.5 px-1.5 text-center font-mono-num">{pos.pa}</td>
                      <td className="py-1.5 px-1.5 text-center font-mono-num">{pos.av}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <label className="flex items-center gap-2 text-xs text-stone-800 cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={populatePlayers}
                onChange={(e) => setPopulatePlayers(e.target.checked)}
                className="w-4 h-4 accent-[#750d0d]"
              />
              <Users className="w-4 h-4 text-[#750d0d]" />
              <span>
                Pré-remplir les 11 premiers postes types dans le tableau de match (si vides)
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#efe2c0] border-t border-[#c8b791] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-800 bg-white border border-stone-400 rounded hover:bg-stone-100 transition-colors cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => onSelectTeam(selected, populatePlayers)}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#750d0d] hover:bg-[#9d1717] rounded shadow transition-colors cursor-pointer"
          >
            Appliquer à l’Équipe {side}
          </button>
        </div>
      </div>
    </div>
  );
};
