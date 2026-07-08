import odps41 from '../schemas/odps-4.1.json';
import odps40 from '../schemas/odps-4.0.json';
import odpc10 from '../schemas/odpc-1.0.json';
import odpg10 from '../schemas/odpg-1.0.json';
import odpv10 from '../schemas/odpv-1.0.json';

export type DocKind = 'odps' | 'odpc' | 'odpg' | 'odpv';

export const SCHEMA_REGISTRY: Record<DocKind, Record<string, object>> = {
  odps: { '4.1': odps41, '4.0': odps40 },
  odpc: { '1.0': odpc10 },
  odpg: { '1.0': odpg10 },
  odpv: { '1.0': odpv10, '1.0.0': odpv10 },
};

export const LATEST_VERSION: Record<DocKind, string> = {
  odps: '4.1',
  odpc: '1.0',
  odpg: '1.0',
  odpv: '1.0',
};

export const KIND_LABELS: Record<DocKind, string> = {
  odps: 'ODPS',
  odpc: 'ODPC',
  odpg: 'ODPG',
  odpv: 'ODPV',
};
