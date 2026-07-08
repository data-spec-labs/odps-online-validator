import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  parseDocument,
  detectDocumentKind,
  extractVersion,
  detectFormat,
  needsPrettyPrint,
  prettyDocument,
} from '../lib/parse';
import { validateDocument, type ValidationResult } from '../lib/validate';
import { KIND_LABELS } from '../lib/schema-registry';
import DocumentEditor, { type DocumentEditorHandle } from './DocumentEditor';

const EXAMPLE_ODPS_MINIMAL = `schema: https://opendataproducts.org/v4.1/schema/odps.yaml
version: "4.1"
product:
  details:
    en:
      name: UrbanPulse Events
      productID: urbanpulse-events-001
      visibility: organisation
      status: draft
      type: dataset
`;

const EXAMPLE_ODPS_FULL = `schema: https://opendataproducts.org/v4.1/schema/odps.yaml
version: "4.1"
product:
  productStrategy:
    objectives:
      - en: Reduce emergency response time
    contributesToKPI:
      id: bizkpi-city-response-time
      name: City Emergency Response Time
      unit: minutes
      target: 5
      direction: at_most
    productKPIs:
      - id: kpi-detection-coverage
        name: Event Detection Coverage
        unit: percentage
        calculation: kpi-detection-coverage*100
        target: 95
        direction: at_least
  details:
    en:
      name: UrbanPulse Events
      productID: urbanpulse-events-001
      valueProposition: Real-time public event data for smart city services.
      description: Aggregated public events for travel apps and tourism platforms.
      visibility: organisation
      status: production
      type: dataset
      portfolioPriority: high
      governanceProfile: structured
`;

const EXAMPLE_ODPC = `schema: https://opendataproducts.org/odpc-v1.0/schema/odpc.yaml
version: "1.0"
kind: Catalog
catalog:
  metadata:
    id: CAT-001
    name:
      en: Urban Mobility Data Product Catalog
    description:
      en: Catalog of data products, use cases, and objectives for urban mobility.
`;

const EXAMPLE_ODPG = `schema: https://opendataproducts.org/odpg-v1.0/schema/odpg.yaml
version: "1.0"
kind: Graph
graph:
  metadata:
    id: GRAPH-001
    name:
      en: Urban Mobility Value Graph
    description:
      en: How mobility data products connect to use cases and objectives.
    status: draft
    visibility: public
  nodes: []
  edges: []
`;

const EXAMPLE_ODPV = `schema: https://opendataproducts.org/odpv-v1.0/schema/odpv.schema.json
version: "1.0.0"
id: ODPV
name:
  en: Open Data Product Vocabulary
description:
  en: Shared vocabulary for the Open Data Products standards family.
license:
  name: Apache 2.0
  url: https://www.apache.org/licenses/LICENSE-2.0
publisher:
  name: Open Data Product Initiative
sections:
  - id: core
    name:
      en: Core Terms
    description:
      en: Foundational terms used across the standards family.
    terms:
      - id: DataProduct
        uri: https://opendataproducts.org/odpv-v1.0/terms/DataProduct
        type: object
        status: stable
        preferredLabel:
          en: Data Product
        definition:
          en: A managed data offering designed for reuse, with defined ownership and quality.
        alsoKnownAs:
          en:
            - data product
        relatedTerms:
          - Dataset
        usedIn:
          - ODPS
`;

const EXAMPLE_INVALID = `schema: https://opendataproducts.org/v4.1/schema/odps.yaml
version: "4.1"
product:
  details:
    en:
      name: Broken Product
      # Missing required fields: productID, visibility, status, type
`;

const EXAMPLES = [
  { label: 'ODPS — minimal valid (4.1)', value: EXAMPLE_ODPS_MINIMAL },
  { label: 'ODPS — full with productStrategy', value: EXAMPLE_ODPS_FULL },
  { label: 'ODPC — catalog', value: EXAMPLE_ODPC },
  { label: 'ODPG — graph', value: EXAMPLE_ODPG },
  { label: 'ODPV — vocabulary', value: EXAMPLE_ODPV },
  { label: 'Invalid ODPS (to see errors)', value: EXAMPLE_INVALID },
];

type UIState =
  | { kind: 'empty' }
  | { kind: 'parsing-error'; message: string; format: string }
  | { kind: 'valid'; result: ValidationResult; format: string }
  | { kind: 'invalid'; result: ValidationResult; format: string };

export default function Validator() {
  const [input, setInput] = useState('');
  const [uiState, setUiState] = useState<UIState>({ kind: 'empty' });
  const [copied, setCopied] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<DocumentEditorHandle>(null);

  const editorFormat = useMemo(() => detectFormat(input), [input]);

  const runValidation = useCallback((text: string) => {
    if (!text.trim()) {
      setUiState({ kind: 'empty' });
      return;
    }
    const parseResult = parseDocument(text);
    if (!parseResult.ok) {
      setUiState({ kind: 'parsing-error', message: parseResult.error, format: parseResult.format });
      return;
    }

    if (needsPrettyPrint(text, parseResult.data, parseResult.format)) {
      const pretty = prettyDocument(parseResult.data, parseResult.format);
      if (pretty !== text) {
        setInput(pretty);
      }
    }

    const docKind = detectDocumentKind(parseResult.data);
    const version = extractVersion(parseResult.data);
    const result = validateDocument(parseResult.data, docKind, version);
    setUiState(result.valid
      ? { kind: 'valid', result, format: parseResult.format }
      : { kind: 'invalid', result, format: parseResult.format }
    );
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runValidation(input), 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [input, runValidation]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        runValidation(input);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [input, runValidation]);

  const handleCopy = () => {
    navigator.clipboard.writeText(input).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleLoadExample = (value: string) => {
    setInput(value);
    editorRef.current?.focus();
  };

  const handleClear = () => {
    setInput('');
    setCopied(false);
    setUiState({ kind: 'empty' });
    editorRef.current?.focus();
  };

  const PANEL_HEIGHT = 'h-72 md:h-full md:min-h-[12rem]';

  return (
    <div className="w-full flex-1 flex flex-col min-h-0">
      <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-3 md:gap-4 flex-1 min-h-0 md:items-stretch">
        <div className="flex flex-col gap-2 min-h-0 md:h-full">
          <div className="flex items-center justify-between flex-wrap gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-700">Your Document</span>
              {uiState.kind !== 'empty' && (
                <FormatBadge format={
                  uiState.kind === 'parsing-error' ? uiState.format :
                  uiState.kind === 'valid' || uiState.kind === 'invalid' ? uiState.format : 'unknown'
                } />
              )}
            </div>
            <div className="flex items-center gap-2">
              <ExamplesDropdown onSelect={handleLoadExample} />
              <button
                onClick={handleCopy}
                disabled={!input}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
              <button
                onClick={handleClear}
                disabled={!input}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          <div className={`relative flex-1 min-h-0 ${PANEL_HEIGHT}`}>
            <DocumentEditor
              ref={editorRef}
              value={input}
              onChange={setInput}
              format={editorFormat}
              placeholder={`Paste your ODPS-family document here…\n\nschema: https://opendataproducts.org/v4.1/schema/odps.yaml\nversion: "4.1"\nproduct:\n  details:\n    en:\n      name: My Data Product\n      productID: my-product-001\n      visibility: organisation\n      status: draft\n      type: dataset`}
              className="h-full"
            />
          </div>
          <p className="text-[11px] text-slate-400 shrink-0 hidden md:block">
            Auto-validates · Cmd/Ctrl+Enter
          </p>
        </div>

        <div className="flex flex-col gap-2 min-h-0 md:h-full">
          <span className="text-sm font-semibold text-slate-700 shrink-0">Validation Results</span>
          <div className={`flex-1 min-h-0 ${PANEL_HEIGHT}`}>
            <ResultsPanel state={uiState} />
          </div>
        </div>
      </div>
    </div>
  );
}

function FormatBadge({ format }: { format: string }) {
  if (format === 'unknown') return null;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
      {format.toUpperCase()}
    </span>
  );
}

function ExamplesDropdown({ onSelect }: { onSelect: (val: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-xs px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors font-medium"
      >
        Load example ▾
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 w-72 rounded-xl bg-white shadow-lg border border-slate-200 overflow-hidden">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              onClick={() => { onSelect(ex.value); setOpen(false); }}
              className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-indigo-50 transition-colors border-b border-slate-100 last:border-0"
            >
              {ex.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ResultsPanel({ state }: { state: UIState }) {
  const panelClass = 'h-full min-h-[12rem] rounded-xl overflow-auto';

  if (state.kind === 'empty') {
    return (
      <div className={`${panelClass} border-2 border-dashed border-slate-300 bg-slate-100 flex flex-col items-center justify-center gap-3 text-slate-600`}>
        <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm text-slate-700 text-center px-6">Paste an ODPS-family document on the left to see validation results here.</p>
      </div>
    );
  }

  if (state.kind === 'parsing-error') {
    return (
      <div className={`${panelClass} border border-amber-200 bg-amber-50 p-5`}>
        <div className="flex items-start gap-3">
          <span className="text-amber-500 text-xl mt-0.5 shrink-0">⚠</span>
          <div>
            <p className="font-semibold text-amber-800 text-sm">Syntax Error</p>
            <p className="text-amber-700 text-sm mt-1">Could not parse as {state.format !== 'unknown' ? state.format.toUpperCase() : 'YAML or JSON'}.</p>
            <pre className="mt-3 text-xs font-mono text-amber-800 bg-amber-100 rounded-lg p-3 whitespace-pre-wrap break-all">{state.message}</pre>
          </div>
        </div>
      </div>
    );
  }

  if (state.kind === 'valid') {
    const { result } = state;
    return (
      <div className={`${panelClass} border border-emerald-200 bg-emerald-50 p-5 flex flex-col gap-4`}>
        {(result.versionWarning || result.kindWarning) && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <span className="text-amber-500 text-sm shrink-0">⚠</span>
            <p className="text-xs text-amber-700">{result.versionWarning ?? result.kindWarning}</p>
          </div>
        )}
        <div className="flex items-start gap-3">
          <span className="text-emerald-500 text-2xl shrink-0">✓</span>
          <div>
            <p className="font-bold text-emerald-800 text-base">Valid {KIND_LABELS[result.kind]} Document!</p>
            <p className="text-emerald-700 text-sm mt-0.5">Your document passes all schema checks.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <DocStat label="Standard" value={KIND_LABELS[result.kind]} />
          <DocStat label="Version" value={result.resolvedVersion} />
          <DocStat label="Format" value={state.format.toUpperCase()} />
        </div>
      </div>
    );
  }

  const { result } = state;
  return (
    <div className={`${panelClass} border border-red-200 bg-red-50 flex flex-col`}>
      <div className="sticky top-0 bg-red-50 border-b border-red-200 px-5 py-4 flex items-center gap-3">
        <span className="text-red-500 text-2xl shrink-0">✗</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-red-800 text-base">
            {result.errors.length} error{result.errors.length !== 1 ? 's' : ''} found
          </p>
          <p className="text-red-600 text-xs mt-0.5">
            {KIND_LABELS[result.kind]} {result.resolvedVersion}
            {result.versionWarning ? ' · ' + result.versionWarning : ''}
            {result.kindWarning ? ' · ' + result.kindWarning : ''}
          </p>
        </div>
      </div>

      <ul className="divide-y divide-red-100 flex-1 overflow-auto">
        {result.errors.map((err, i) => (
          <li key={i} className="px-5 py-3">
            <div className="flex items-start gap-2">
              <span className="text-red-400 mt-0.5 shrink-0 text-xs font-bold">{String(i + 1).padStart(2, '0')}</span>
              <div className="min-w-0">
                <p className="font-mono text-xs text-red-700 bg-red-100 inline-block px-1.5 py-0.5 rounded mb-1 break-all">
                  {err.path}
                </p>
                <p className="text-sm text-red-800">{err.message}</p>
                <p className="text-xs text-red-500 mt-0.5 font-mono">rule: {err.keyword}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DocStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg border border-emerald-100 px-3 py-2">
      <p className="text-xs text-emerald-600 font-medium">{label}</p>
      <p className="text-sm font-semibold text-emerald-800 font-mono mt-0.5">{value}</p>
    </div>
  );
}
