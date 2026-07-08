import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemasDir = join(__dirname, '..', 'src', 'schemas');

const SCHEMAS = [
  {
    file: 'odps-4.1.json',
    url: 'https://raw.githubusercontent.com/Open-Data-Product-Initiative/v4.1/main/source/schema/odps.json',
  },
  {
    file: 'odps-4.0.json',
    url: 'https://raw.githubusercontent.com/Open-Data-Product-Initiative/v4.0/main/source/schema/odps.json',
  },
  {
    file: 'odpc-1.0.json',
    url: 'https://raw.githubusercontent.com/Open-Data-Product-Initiative/odpc-v1.0/main/source/schema/odpc.json',
  },
  {
    file: 'odpg-1.0.json',
    url: 'https://raw.githubusercontent.com/Open-Data-Product-Initiative/odpg-v1.0/main/source/schema/odpg.json',
  },
  {
    file: 'odpv-1.0.json',
    url: 'https://raw.githubusercontent.com/Open-Data-Product-Initiative/odpv-v1.0/main/source/schema/odpv.schema.json',
  },
];

await mkdir(schemasDir, { recursive: true });

for (const { file, url } of SCHEMAS) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }
  const json = await res.json();
  const outPath = join(schemasDir, file);
  await writeFile(outPath, JSON.stringify(json, null, 2) + '\n');
  console.log(`Wrote ${file}`);
}
