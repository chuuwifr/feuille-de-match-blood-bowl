import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Search,
  Shield,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { BLOOD_BOWL_TEAMS } from '../data/bloodbowlRulesData';
import { BloodBowlTeamDef, TeamSide } from '../types/bloodbowl';
import { formatGold } from '../utils/bloodbowlRules';
import {
  createSampleTeamWorkbookBuffer,
  ImportedTeamRoster,
  ParsedWorkbookResult,
  parseTeamSpreadsheetBuffer,
} from '../utils/teamExcelParser';

export interface ExcelImportOptions {
  importFinancesAndRerolls: boolean;
  replacePlayers: boolean;
}

interface TeamRosterModalProps {
  side: TeamSide;
  currentTeamId: string | null;
  initialTab?: 'catalog' | 'import';
  onSelectTeam: (team: BloodBowlTeamDef, populateStarterPlayers: boolean) => void;
  onImportExcelTeam: (
    roster: ImportedTeamRoster,
    options: ExcelImportOptions
  ) => void;
  onClose: () => void;
}

export const TeamRosterModal: React.FC<TeamRosterModalProps> = ({
  side,
  currentTeamId,
  initialTab = 'catalog',
  onSelectTeam,
  onImportExcelTeam,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'import'>(initialTab);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<BloodBowlTeamDef>(
    () =>
      BLOOD_BOWL_TEAMS.find((t) => t.id === currentTeamId) ??
      BLOOD_BOWL_TEAMS[13]
  );
  const [populatePlayers, setPopulatePlayers] = useState(true);

  // Excel / CSV import state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [workbookResult, setWorkbookResult] =
    useState<ParsedWorkbookResult | null>(null);
  const [selectedSheetIndex, setSelectedSheetIndex] = useState(0);
  const [importFinancesAndRerolls, setImportFinancesAndRerolls] =
    useState(true);
  const [replacePlayers, setReplacePlayers] = useState(true);

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

  const activeImportedRoster =
    workbookResult && workbookResult.sheets[selectedSheetIndex]
      ? workbookResult.sheets[selectedSheetIndex]
      : null;

  const handleSpreadsheetFile = async (file: File) => {
    setParseError(null);
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseTeamSpreadsheetBuffer(buffer, file.name);
      if (parsed.sheets.length === 0) {
        setWorkbookResult(null);
        setParseError(
          `Aucune feuille d'équipe Blood Bowl valide détectée dans « ${file.name} ». Vérifiez que le fichier contient un en-tête de joueurs (# / Nom / Poste) ou « NOM DE L'EQUIPE ».`
        );
        return;
      }
      setWorkbookResult(parsed);
      setSelectedSheetIndex(0);
    } catch {
      setWorkbookResult(null);
      setParseError(
        `Impossible de lire « ${file.name} ». Utilisez un classeur Excel (.xlsx, .xlsm, .xls, .ods) ou un export CSV.`
      );
    }
  };

  const handleDownloadSample = () => {
    const buffer = createSampleTeamWorkbookBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modele-equipe-bloodbowl.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Sélectionner ou importer une équipe Blood Bowl pour l'Équipe ${side}`}
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
    >
      <div className="bg-[#f6eed8] border-2 border-[#1E1915] rounded-lg shadow-2xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="crimson-banner px-5 py-3 flex items-center justify-between border-b-2 border-[#EAB308]">
          <div className="flex items-center gap-2 text-white">
            {activeTab === 'import' ? (
              <FileSpreadsheet className="w-5 h-5 text-amber-300" />
            ) : (
              <Shield className="w-5 h-5 text-amber-300" />
            )}
            <h3 className="font-display text-base sm:text-lg font-bold tracking-wide">
              {activeTab === 'import'
                ? `Importer une équipe Excel / CSV · Équipe ${side}`
                : `Fiches d’Équipe Saison 3 · Équipe ${side}`}
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

        {/* Mode Switch Tabs */}
        <div
          role="tablist"
          aria-label="Mode de chargement de l'équipe"
          className="px-4 pt-2.5 bg-[#efe2c0] border-b border-[#c8b791] flex items-center gap-2"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'catalog'}
            onClick={() => setActiveTab('catalog')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-t border border-b-0 transition-colors cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-[#f6eed8] text-[#750d0d] border-[#8c7853]'
                : 'bg-[#e3d3ab]/70 text-stone-700 border-transparent hover:bg-[#e3d3ab]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Fiches Saison 3 (30 races)</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'import'}
            onClick={() => setActiveTab('import')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-t border border-b-0 transition-colors cursor-pointer ${
              activeTab === 'import'
                ? 'bg-[#f6eed8] text-[#0D2042] border-[#8c7853]'
                : 'bg-[#e3d3ab]/70 text-stone-700 border-transparent hover:bg-[#e3d3ab]'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Importer Excel / CSV</span>
          </button>
        </div>

        {/* Body */}
        {activeTab === 'catalog' ? (
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
                  Journalier disponible : {selected.linemanName} (
                  {formatGold(selected.linemanCost)} po, Solitaire 4+)
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
                        <td className="py-1.5 px-2 font-mono-num whitespace-nowrap">
                          {pos.qty}
                        </td>
                        <td className="py-1.5 px-2">
                          <div className="font-semibold text-[#1E1915]">
                            {pos.role}
                          </div>
                          {pos.skills && (
                            <div className="text-[11px] text-stone-600 leading-tight">
                              {pos.skills}
                            </div>
                          )}
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono-num whitespace-nowrap">
                          {formatGold(pos.cost)}
                        </td>
                        <td className="py-1.5 px-1.5 text-center font-mono-num">
                          {pos.ma}
                        </td>
                        <td className="py-1.5 px-1.5 text-center font-mono-num">
                          {pos.st}
                        </td>
                        <td className="py-1.5 px-1.5 text-center font-mono-num">
                          {pos.ag}
                        </td>
                        <td className="py-1.5 px-1.5 text-center font-mono-num">
                          {pos.pa}
                        </td>
                        <td className="py-1.5 px-1.5 text-center font-mono-num">
                          {pos.av}
                        </td>
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
        ) : (
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3.5 min-h-0">
            {/* Upload Dropzone + Template Download */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    void handleSpreadsheetFile(file);
                  }
                }}
                className={`flex-1 border-2 border-dashed rounded-md p-4 text-center transition-colors flex flex-col items-center justify-center gap-1.5 ${
                  isDragging
                    ? 'border-[#750d0d] bg-amber-100/70'
                    : 'border-[#8c7853] bg-white/75 hover:bg-white'
                }`}
              >
                <Upload className="w-6 h-6 text-[#0D2042]" />
                <div className="text-xs sm:text-sm font-bold text-[#1E1915]">
                  Déposez votre feuille d’équipe Excel ou CSV ici
                </div>
                <p className="text-[11px] text-stone-600">
                  Formats supportés : <strong>.xlsx</strong>, <strong>.xlsm</strong>,{' '}
                  <strong>.xls</strong>, <strong>.ods</strong>, <strong>.csv</strong> (modèles BBLH ou tableaux simples)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  data-testid="excel-team-file-input"
                  accept=".xlsx,.xlsm,.xls,.ods,.csv,.tsv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      void handleSpreadsheetFile(file);
                    }
                    e.target.value = '';
                  }}
                  className="sr-only"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0D2042] hover:bg-[#16315e] rounded shadow-sm transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-amber-300" />
                  <span>Choisir un fichier</span>
                </button>
              </div>

              <div className="sm:w-56 border border-[#c8b791] rounded-md bg-[#efe2c0]/75 p-3 flex flex-col justify-between gap-2 text-xs">
                <div>
                  <div className="font-bold text-[#1E1915]">
                    Besoin d’un modèle ?
                  </div>
                  <p className="text-[11px] text-stone-700 mt-1 leading-relaxed">
                    Téléchargez un classeur Excel prêt à remplir ou exportez directement votre feuille BBLH en .xlsx / .csv.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1E1915] bg-white hover:bg-amber-50 border border-[#8c7853] rounded transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#750d0d]" />
                  <span>Modèle .xlsx</span>
                </button>
              </div>
            </div>

            {parseError && (
              <div
                role="alert"
                className="flex items-start gap-2 p-3 rounded border border-red-400 bg-red-50 text-red-900 text-xs"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-700" />
                <span>{parseError}</span>
              </div>
            )}

            {workbookResult && activeImportedRoster && (
              <div
                data-testid="excel-import-preview"
                className="border border-[#8c7853] rounded-md bg-white/90 overflow-hidden flex flex-col gap-3 p-3.5"
              >
                {/* Sheet selector if multiple team tabs */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e2d4b7] pb-2.5">
                  <div className="flex items-center gap-2 text-xs text-stone-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>
                      Fichier analysé :{' '}
                      <strong className="text-[#1E1915]">
                        {workbookResult.fileName}
                      </strong>
                    </span>
                  </div>
                  {workbookResult.sheets.length > 1 && (
                    <div className="flex items-center gap-2 text-xs">
                      <label
                        htmlFor="excel-sheet-select"
                        className="font-semibold text-stone-700"
                      >
                        Onglet :
                      </label>
                      <select
                        id="excel-sheet-select"
                        value={selectedSheetIndex}
                        onChange={(e) =>
                          setSelectedSheetIndex(Number(e.target.value))
                        }
                        className="px-2 py-1 border border-[#8c7853] rounded bg-[#faf4e4] font-semibold text-[#1E1915]"
                      >
                        {workbookResult.sheets.map((sheet, idx) => (
                          <option key={sheet.sheetName} value={idx}>
                            {sheet.sheetName} — {sheet.teamName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Team header summary */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="font-display text-lg font-extrabold text-[#750d0d]">
                      {activeImportedRoster.teamName}
                    </h4>
                    <div className="text-xs text-stone-700 mt-0.5 flex flex-wrap gap-x-3 gap-y-1">
                      {activeImportedRoster.faction && (
                        <span>
                          Faction :{' '}
                          <strong className="text-[#0D2042]">
                            {activeImportedRoster.matchedTeamDef
                              ? activeImportedRoster.matchedTeamDef.name
                              : activeImportedRoster.faction}
                          </strong>
                        </span>
                      )}
                      {activeImportedRoster.coach && (
                        <span>
                          Coach : <strong>{activeImportedRoster.coach}</strong>
                        </span>
                      )}
                      {activeImportedRoster.league && (
                        <span>
                          Ligue : <strong>{activeImportedRoster.league}</strong>
                        </span>
                      )}
                    </div>
                    {activeImportedRoster.specialRules.length > 0 && (
                      <div className="text-[11px] font-semibold text-[#750d0d] mt-1">
                        Règles spéciales :{' '}
                        {activeImportedRoster.specialRules.join(', ')}
                      </div>
                    )}
                  </div>

                  {/* Financial & dugout KPIs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="px-2.5 py-1.5 rounded bg-[#faf4e4] border border-[#d8c8a6]">
                      <div className="text-[10px] uppercase font-semibold text-stone-600">
                        VEA / TVE
                      </div>
                      <div className="font-mono-num font-bold text-[#0D2042]">
                        {formatGold(activeImportedRoster.vea)} po
                      </div>
                    </div>
                    <div className="px-2.5 py-1.5 rounded bg-[#faf4e4] border border-[#d8c8a6]">
                      <div className="text-[10px] uppercase font-semibold text-stone-600">
                        Trésorerie
                      </div>
                      <div className="font-mono-num font-bold text-[#1E1915]">
                        {formatGold(activeImportedRoster.treasury)} po
                      </div>
                    </div>
                    <div className="px-2.5 py-1.5 rounded bg-[#faf4e4] border border-[#d8c8a6]">
                      <div className="text-[10px] uppercase font-semibold text-stone-600">
                        Fans dévoués
                      </div>
                      <div className="font-mono-num font-bold text-[#1E1915]">
                        {activeImportedRoster.dedicatedFans}
                      </div>
                    </div>
                    <div className="px-2.5 py-1.5 rounded bg-[#faf4e4] border border-[#d8c8a6]">
                      <div className="text-[10px] uppercase font-semibold text-stone-600">
                        Relances
                      </div>
                      <div className="font-mono-num font-bold text-[#750d0d]">
                        {activeImportedRoster.rerolls}
                      </div>
                    </div>
                  </div>
                </div>

                {activeImportedRoster.warnings.length > 0 && (
                  <div className="p-2.5 rounded border border-amber-400 bg-amber-50 text-amber-950 text-[11px] space-y-0.5">
                    {activeImportedRoster.warnings.map((w, idx) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-700" />
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Players Preview Table */}
                {activeImportedRoster.players.length > 0 && (
                  <div className="border border-[#c8b791] rounded overflow-x-auto max-h-56 overflow-y-auto">
                    <table className="w-full text-[11px]">
                      <thead className="navy-header text-white sticky top-0">
                        <tr>
                          <th className="py-1.5 px-2 text-center w-8">#</th>
                          <th className="py-1.5 px-2 text-left">Nom</th>
                          <th className="py-1.5 px-2 text-left">Poste</th>
                          <th className="py-1.5 px-1.5 text-center">M/F/AG/CP/AR</th>
                          <th className="py-1.5 px-2 text-left">Compétences</th>
                          <th className="py-1.5 px-1.5 text-center">RPM</th>
                          <th className="py-1.5 px-1.5 text-center">BP</th>
                          <th className="py-1.5 px-2 text-right">Coût</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e2d4b7]">
                        {activeImportedRoster.players.map((p) => (
                          <tr
                            key={`${p.number}-${p.name}`}
                            className="hover:bg-amber-50/70"
                          >
                            <td className="py-1 px-2 text-center font-mono-num font-bold text-[#0D2042]">
                              {p.number}
                            </td>
                            <td className="py-1 px-2 font-semibold text-[#1E1915] whitespace-nowrap">
                              {p.name || '—'}
                            </td>
                            <td className="py-1 px-2 text-stone-700 whitespace-nowrap">
                              {p.position || '—'}
                            </td>
                            <td className="py-1 px-1.5 text-center font-mono-num whitespace-nowrap text-stone-700">
                              {[p.ma, p.st, p.ag, p.pa, p.av]
                                .filter(Boolean)
                                .join('/') || '—'}
                            </td>
                            <td className="py-1 px-2 text-stone-600 max-w-[200px] truncate" title={p.skills}>
                              {p.skills || '—'}
                            </td>
                            <td className="py-1 px-1.5 text-center font-mono-num">
                              {p.rpm ? 'Oui' : '—'}
                            </td>
                            <td className="py-1 px-1.5 text-center font-mono-num">
                              {p.bp || '0'}
                            </td>
                            <td className="py-1 px-2 text-right font-mono-num whitespace-nowrap font-semibold">
                              {p.cost > 0 ? `${formatGold(p.cost)} po` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Import options */}
                <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-1 text-xs text-stone-800">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={importFinancesAndRerolls}
                      onChange={(e) =>
                        setImportFinancesAndRerolls(e.target.checked)
                      }
                      className="w-4 h-4 accent-[#0D2042]"
                    />
                    <span>
                      Importer VEA, TVE, Trésorerie, Fans dévoués et Relances
                    </span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={replacePlayers}
                      onChange={(e) => setReplacePlayers(e.target.checked)}
                      className="w-4 h-4 accent-[#750d0d]"
                    />
                    <span>
                      Remplacer les joueurs de l’Équipe {side} (
                      {activeImportedRoster.players.length} joueurs)
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 bg-[#efe2c0] border-t border-[#c8b791] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-800 bg-white border border-stone-400 rounded hover:bg-stone-100 transition-colors cursor-pointer"
          >
            Annuler
          </button>
          {activeTab === 'catalog' ? (
            <button
              type="button"
              onClick={() => onSelectTeam(selected, populatePlayers)}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#750d0d] hover:bg-[#9d1717] rounded shadow transition-colors cursor-pointer"
            >
              Appliquer à l’Équipe {side}
            </button>
          ) : (
            <button
              type="button"
              disabled={!activeImportedRoster}
              onClick={() => {
                if (activeImportedRoster) {
                  onImportExcelTeam(activeImportedRoster, {
                    importFinancesAndRerolls,
                    replacePlayers,
                  });
                }
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0D2042] hover:bg-[#16315e] disabled:opacity-40 disabled:cursor-not-allowed rounded shadow transition-colors cursor-pointer"
            >
              Importer dans l’Équipe {side}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
