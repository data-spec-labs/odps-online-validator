import { parse as parseYaml, stringify as stringifyYaml, YAMLParseError } from 'yaml';
import type { DocKind } from './schema-registry';

export type ParseResult =
  | { ok: true; data: unknown; format: 'yaml' | 'json' }
  | { ok: false; error: string; format: 'yaml' | 'json' | 'unknown' };

export type DocumentFormat = 'yaml' | 'json' | 'unknown';

/** Detect likely input format before parsing (for editor language mode). */
export function detectFormat(input: string): DocumentFormat {
  const trimmed = input.trim();
  if (!trimmed) return 'unknown';
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';
  return 'yaml';
}

export function parseDocument(input: string): ParseResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, error: 'Input is empty.', format: 'unknown' };
  }

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const data = JSON.parse(trimmed);
      return { ok: true, data, format: 'json' };
    } catch (e) {
      return {
        ok: false,
        error: `Invalid JSON: ${(e as SyntaxError).message}`,
        format: 'json',
      };
    }
  }

  try {
    const data = parseYaml(trimmed);
    if (data === null || data === undefined) {
      return { ok: false, error: 'YAML parsed to empty document.', format: 'yaml' };
    }
    return { ok: true, data, format: 'yaml' };
  } catch (e) {
    const msg = e instanceof YAMLParseError ? e.message : String(e);
    return { ok: false, error: `Invalid YAML: ${msg}`, format: 'yaml' };
  }
}

function isRecord(data: unknown): data is Record<string, unknown> {
  return typeof data === 'object' && data !== null && !Array.isArray(data);
}

/** Normalize version strings like "v4.1" or 4.1 to "4.1". */
export function normalizeVersion(version: unknown): string | undefined {
  if (typeof version === 'number') return String(version);
  if (typeof version !== 'string') return undefined;
  const trimmed = version.trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/^v/i, '');
}

/** Extract root version from a parsed document. */
export function extractVersion(data: unknown): string | undefined {
  if (!isRecord(data)) return undefined;
  return normalizeVersion(data.version);
}

/** Detect which ODPS-family standard a parsed document belongs to. */
export function detectDocumentKind(data: unknown): DocKind | undefined {
  if (!isRecord(data)) return undefined;

  const kind = data.kind;
  if (kind === 'Catalog') return 'odpc';
  if (kind === 'Graph') return 'odpg';
  if (kind === 'Vocabulary') return 'odpv';

  if (data.id === 'ODPV' || (Array.isArray(data.sections) && 'publisher' in data)) {
    return 'odpv';
  }

  if ('product' in data) return 'odps';

  return undefined;
}

/** Pretty-print parsed document data, preserving key insertion order. */
export function prettyDocument(data: unknown, format: 'yaml' | 'json'): string {
  if (format === 'json') {
    return JSON.stringify(data, null, 2);
  }
  return stringifyYaml(data, {
    indent: 2,
    lineWidth: 0,
  });
}

/** True when input should be reformatted (minified or missing indentation). */
export function needsPrettyPrint(
  text: string,
  data: unknown,
  format: 'yaml' | 'json',
): boolean {
  const trimmed = text.trimEnd();

  if (format === 'json') {
    return prettyDocument(data, 'json') !== trimmed;
  }

  if (!trimmed.includes('\n')) return true;

  const pretty = prettyDocument(data, 'yaml');
  if (pretty === trimmed) return false;

  const hasNestedIndent = trimmed.split('\n').some((line) => /^  \S/.test(line) || /^  - /.test(line));
  return !hasNestedIndent;
}
