import React from 'react';
import { Coins, Plus, X } from 'lucide-react';
import { INDUCEMENTS_CATALOG } from '../data/bloodbowlRulesData';
import { InducementCatalogEntry, TeamSheetState, TeamSide } from '../types/bloodbowl';
import { formatGold, getTeamDef, getTeamSpecialRules } from '../utils/bloodbowlRules';

interface InducementPickerModalProps {
  side: TeamSide;
  team: TeamSheetState;
  totalBudget: number;
  spent: number;
  onAddInducement: (name: string, cost: number) => void;
  onClose: () => void;
}

export const InducementPickerModal: React.FC<InducementPickerModalProps> = ({
  side,
  team,
  totalBudget,
  spent,
  onAddInducement,
  onClose,
}) => {
  const rules = getTeamSpecialRules(team);
  const teamDef = getTeamDef(team.teamId);
  const remaining = totalBudget - spent;

  const getEffectiveCostAndEligibility = (item: InducementCatalogEntry) => {
    let eligible = true;
    let reason = '';

    if (item.requiredRule && !rules.includes(item.requiredRule)) {
      eligible = false;
      reason = `Requiert : ${item.requiredRule}`;
    }
    if (item.requiresApothecary && teamDef && !teamDef.apothecary) {
      eligible = false;
      reason = 'Équipe sans Apothicaire';
    }

    let cost = item.baseCost;
    let maxQty = item.maxQty;
    if (item.discountRule === 'Halflings' && teamDef?.id === 'halflings') {
      cost = item.discountCost ?? item.baseCost;
      maxQty = item.discountMaxQty ?? item.maxQty;
    } else if (
      item.discountRule &&
      item.discountRule !== 'Halflings' &&
      rules.includes(item.discountRule)
    ) {
      cost = item.discountCost ?? item.baseCost;
      maxQty = item.discountMaxQty ?? item.maxQty;
    }

    return { eligible, reason, cost, maxQty };
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Catalogue des Coups de Pouce — Équipe ${side}`}
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
    >
      <div className="bg-[#f6eed8] border-2 border-[#1E1915] rounded-lg shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="crimson-banner px-5 py-3 flex items-center justify-between border-b-2 border-[#EAB308]">
          <div className="flex items-center gap-2 text-white">
            <Coins className="w-5 h-5 text-amber-300" />
            <h3 className="font-display text-base sm:text-lg font-bold tracking-wide">
              Coups de Pouce (Saison 3) · Équipe {side}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le catalogue des coups de pouce"
            className="p-1.5 rounded text-amber-100 hover:bg-black/25 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-2.5 bg-[#efe2c0] border-b border-[#c8b791] flex flex-wrap items-center justify-between gap-3 text-xs font-mono-num">
          <span>
            Budget autorisé : <strong>{formatGold(totalBudget)} po</strong>
          </span>
          <span>
            Dépensé : <strong>{formatGold(spent)} po</strong>
          </span>
          <span className={remaining < 0 ? 'text-red-700 font-bold' : 'text-emerald-800 font-bold'}>
            Restant : {formatGold(remaining)} po
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 divide-y divide-[#d8c8a6]">
          {INDUCEMENTS_CATALOG.map((item) => {
            const { eligible, reason, cost, maxQty } = getEffectiveCostAndEligibility(item);
            return (
              <div
                key={item.id}
                className={`py-2.5 flex items-center justify-between gap-4 ${
                  !eligible ? 'opacity-55' : ''
                }`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-bold text-sm text-[#1E1915]">{item.name}</span>
                    <span className="text-xs font-mono-num text-[#750d0d] font-semibold">
                      0–{maxQty} · {formatGold(cost)} po
                    </span>
                    {!eligible && (
                      <span className="text-xs font-semibold text-red-700">({reason})</span>
                    )}
                  </div>
                  <p className="text-xs text-stone-700 mt-0.5">{item.description}</p>
                </div>
                <button
                  type="button"
                  disabled={!eligible}
                  onClick={() => onAddInducement(item.name, cost)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-[#0D2042] hover:bg-[#16315e] disabled:bg-stone-400 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter</span>
                </button>
              </div>
            );
          })}
        </div>

        <div className="px-5 py-3 bg-[#efe2c0] border-t border-[#c8b791] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#750d0d] hover:bg-[#9d1717] rounded cursor-pointer"
          >
            Terminer
          </button>
        </div>
      </div>
    </div>
  );
};
