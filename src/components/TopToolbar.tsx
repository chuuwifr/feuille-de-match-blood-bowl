import React from 'react';
import { BookOpen, Download, Printer, RotateCcw, Sparkles } from 'lucide-react';
import { SheetViewMode } from '../types/bloodbowl';

interface TopToolbarProps {
  viewMode: SheetViewMode;
  onChangeViewMode: (mode: SheetViewMode) => void;
  onOpenRulesDice: () => void;
  onLoadDemo: () => void;
  onReset: () => void;
  onPrint: () => void;
  onExportJson: () => void;
  scoreA: number;
  scoreB: number;
  teamAName: string;
  teamBName: string;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  viewMode,
  onChangeViewMode,
  onOpenRulesDice,
  onLoadDemo,
  onReset,
  onPrint,
  onExportJson,
  scoreA,
  scoreB,
  teamAName,
  teamBName,
}) => {
  return (
    <div className="no-print sticky top-0 z-30 bg-[#181412]/95 backdrop-blur-md border-b border-amber-900/40 shadow-lg">
      {/* Zone 1 / 2 / 3 Top Bar Contract */}
      <header className="max-w-[1280px] mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-2 sm:gap-6">
        <span className="font-display text-sm sm:text-lg font-extrabold tracking-wider text-amber-100 whitespace-nowrap shrink-0">
          Blood Bowl
        </span>

        <nav
          aria-label="Affichage de la feuille"
          className="flex items-center gap-3 sm:gap-5 text-xs sm:text-sm font-medium"
        >
          <button
            type="button"
            onClick={() => onChangeViewMode('recto')}
            aria-pressed={viewMode === 'recto'}
            className={`whitespace-nowrap shrink-0 pb-1 transition-colors border-b-2 ${
              viewMode === 'recto'
                ? 'border-amber-400 text-amber-300 font-semibold'
                : 'border-transparent text-stone-300 hover:text-white'
            }`}
          >
            Recto
          </button>
          <button
            type="button"
            onClick={() => onChangeViewMode('verso')}
            aria-pressed={viewMode === 'verso'}
            className={`whitespace-nowrap shrink-0 pb-1 transition-colors border-b-2 ${
              viewMode === 'verso'
                ? 'border-amber-400 text-amber-300 font-semibold'
                : 'border-transparent text-stone-300 hover:text-white'
            }`}
          >
            Verso
          </button>
          <button
            type="button"
            onClick={() => onChangeViewMode('both')}
            aria-pressed={viewMode === 'both'}
            className={`hidden md:inline-block whitespace-nowrap shrink-0 pb-1 transition-colors border-b-2 ${
              viewMode === 'both'
                ? 'border-amber-400 text-amber-300 font-semibold'
                : 'border-transparent text-stone-300 hover:text-white'
            }`}
          >
            Recto &amp; Verso
          </button>
        </nav>

        <div className="shrink-0">
          <button
            type="button"
            onClick={onOpenRulesDice}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors whitespace-nowrap shrink-0 shadow cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Règles &amp; Dés</span>
          </button>
        </div>
      </header>

      {/* Secondary Workspace Toolbar (below header) */}
      <div className="bg-[#221c18] border-t border-stone-800/80">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-300">
          <div className="flex items-center gap-2 font-mono-num">
            <span className="text-stone-400">Match :</span>
            <span className="font-semibold text-stone-100 truncate max-w-[140px]">
              {teamAName.trim() || 'Équipe A'}
            </span>
            <span className="text-amber-400 font-bold">
              {scoreA} - {scoreB}
            </span>
            <span className="font-semibold text-stone-100 truncate max-w-[140px]">
              {teamBName.trim() || 'Équipe B'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onLoadDemo}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Charger exemple</span>
            </button>
            <button
              type="button"
              onClick={onExportJson}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exporter JSON</span>
            </button>
            <button
              type="button"
              onClick={onPrint}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer</span>
            </button>
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-red-950/70 hover:bg-red-900 text-red-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réinitialiser</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
