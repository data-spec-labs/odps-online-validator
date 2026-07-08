import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import {
  KIND_LABELS,
  LATEST_VERSION,
  SCHEMA_REGISTRY,
  type DocKind,
} from './schema-registry';

export interface ValidationError {
  path: string;
  message: string;
  keyword: string;
  params?: Record<string, unknown>;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  kind: DocKind;
  resolvedVersion: string;
  versionWarning?: string;
  kindWarning?: string;
}

function resolveSchema(
  kind: DocKind,
  version: string | undefined,
): {
  schema: object;
  resolvedVersion: string;
  warning?: string;
} {
  const versions = SCHEMA_REGISTRY[kind];
  const latest = LATEST_VERSION[kind];

  if (!version) {
    return {
      schema: versions[latest] as object,
      resolvedVersion: latest,
      warning: `No version found — validating against latest ${KIND_LABELS[kind]} (${latest}).`,
    };
  }

  if (version in versions) {
    return { schema: versions[version] as object, resolvedVersion: version };
  }

  // ODPV uses semver in documents (e.g. 1.0.0) while registry key may be 1.0
  if (kind === 'odpv' && version.startsWith('1.0')) {
    return { schema: versions['1.0'] as object, resolvedVersion: '1.0' };
  }

  return {
    schema: versions[latest] as object,
    resolvedVersion: latest,
    warning: `Unknown version "${version}" for ${KIND_LABELS[kind]} — validating against latest (${latest}).`,
  };
}

const ajvCache = new Map<string, { validate: ReturnType<Ajv['compile']> }>();

function getValidator(cacheKey: string, schema: object) {
  if (ajvCache.has(cacheKey)) return ajvCache.get(cacheKey)!;
  const ajv = new Ajv({ allErrors: true, strict: false, validateSchema: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const entry = { validate };
  ajvCache.set(cacheKey, entry);
  return entry;
}

/** Convert AJV instancePath (/product/details/en/name) to a readable form. */
function prettifyPath(instancePath: string): string {
  if (!instancePath) return '(root)';
  return instancePath
    .replace(/^\//, '')
    .replace(/\/(\d+)/g, '[$1]')
    .replace(/\//g, '.');
}

export function validateDocument(
  data: unknown,
  kind: DocKind | undefined,
  version: string | undefined,
): ValidationResult {
  if (!kind) {
    return {
      valid: false,
      errors: [
        {
          path: '(root)',
          message:
            'Could not detect document kind. Expected ODPS (product), ODPC (kind: Catalog), ODPG (kind: Graph), or ODPV (id: ODPV).',
          keyword: 'documentKind',
        },
      ],
      kind: 'odps',
      resolvedVersion: LATEST_VERSION.odps,
      kindWarning: 'Unknown document kind — could not select a schema.',
    };
  }

  const { schema, resolvedVersion, warning } = resolveSchema(kind, version);
  const cacheKey = `${kind}:${resolvedVersion}`;
  const { validate } = getValidator(cacheKey, schema);

  const valid = validate(data) as boolean;

  const errors: ValidationError[] = valid
    ? []
    : (validate.errors ?? []).map((e) => ({
        path: prettifyPath(e.instancePath),
        message: e.message ?? 'Validation error',
        keyword: e.keyword,
        params: e.params as Record<string, unknown>,
      }));

  return {
    valid,
    errors,
    kind,
    resolvedVersion,
    versionWarning: warning,
  };
}
