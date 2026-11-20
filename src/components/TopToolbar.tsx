import React, { useRef } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Download,
  FileText,
  Printer,
  RotateCcw,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { SheetViewMode } from '../types/bloodbowl';

export interface BackupFeedback {
  type: 'success' | 'error';
  message: string;
}

interface TopToolbarProps {
  viewMode: SheetViewMode;
  onChangeViewMode: (mode: SheetViewMode) => void;
  onOpenRulesDice: () => void;
  onLoadDemo: () => void;
  onReset: () => void;
  onPrint: () => void;
  onExportJson: () => void;
  onImportJson: (jsonText: string, fileName: string) => void;
  importFeedback: BackupFeedback | null;
  onClearImportFeedback: () => void;
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
  onImportJson,
  importFeedback,
  onClearImportFeedback,
  scoreA,
  scoreB,
  teamAName,
  teamBName,
}) => {
  const backupInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      onImportJson(text, file.name);
    } catch {
      onImportJson('', file.name);
    }
  };

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
            className={`whitespace-nowrap shrink-0 pb-1 transition-colors border-b-2 cursor-pointer ${
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
            className={`whitespace-nowrap shrink-0 pb-1 transition-colors border-b-2 cursor-pointer ${
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
            className={`hidden md:inline-block whitespace-nowrap shrink-0 pb-1 transition-colors border-b-2 cursor-pointer ${
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
          <div className="flex items-center gap-1.5 sm:gap-2 font-mono-num min-w-0 max-w-full">
            <span className="text-stone-400 whitespace-nowrap shrink-0">Match :</span>
            <span className="font-semibold text-stone-100 truncate max-w-[96px] sm:max-w-[160px]">
              {teamAName.trim() || 'Équipe A'}
            </span>
            <span className="text-amber-400 font-bold whitespace-nowrap shrink-0">
              {scoreA} - {scoreB}
            </span>
            <span className="font-semibold text-stone-100 truncate max-w-[96px] sm:max-w-[160px]">
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

            <input
              ref={backupInputRef}
              type="file"
              data-testid="import-backup-input"
              accept=".json,application/json"
              onChange={(e) => {
                void handleFileChange(e);
              }}
              className="sr-only"
            />
            <button
              type="button"
              onClick={() => backupInputRef.current?.click()}
              title="Restaurer une sauvegarde de match (.json)"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-amber-300" />
              <span>Importer JSON</span>
            </button>

            <button
              type="button"
              onClick={onExportJson}
              title="Télécharger une sauvegarde complète du match (.json)"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exporter JSON</span>
            </button>
            <button
              type="button"
              onClick={() =>
                onChangeViewMode(viewMode === 'summary' ? 'recto' : 'summary')
              }
              aria-pressed={viewMode === 'summary'}
              title="Afficher l’aperçu de la fiche synthétique pour export PDF"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                viewMode === 'summary'
                  ? 'bg-amber-400 text-amber-950 font-semibold'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Synthèse PDF</span>
            </button>
            <button
              type="button"
              onClick={onPrint}
              title="Imprimer ou enregistrer la fiche synthétique du match en PDF"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer PDF</span>
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

        {importFeedback && (
          <div
            role={importFeedback.type === 'error' ? 'alert' : 'status'}
            data-testid="backup-import-feedback"
            className={`border-t px-4 sm:px-6 py-1.5 text-xs ${
              importFeedback.type === 'error'
                ? 'bg-red-950/90 border-red-800 text-red-100'
                : 'bg-emerald-950/90 border-emerald-800 text-emerald-100'
            }`}
          >
            <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {importFeedback.type === 'error' ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-red-300 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                )}
                <span className="truncate">{importFeedback.message}</span>
              </div>
              <button
                type="button"
                onClick={onClearImportFeedback}
                aria-label="Fermer le message d'import"
                className="p-0.5 rounded hover:bg-white/10 shrink-0 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
