# ODPS Family Validator

[![Built with Astro](https://img.shields.io/badge/Built__with-Astro-ff5d01?style=flat-square&logo=astro)](https://astro.build)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind__CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg?style=flat-square)](https://opensource.org/licenses/Apache-2.0)

Free online validator for the [Open Data Products standards family](https://opendataproducts.org/). Paste a YAML or JSON document and get instant schema validation with clear error paths.

Supports **ODPS 4.1**, **ODPS 4.0**, **ODPC 1.0**, **ODPG 1.0**, and **ODPV 1.0**.

## Features

- Validates ODPS-family documents in **YAML** or **JSON**
- Auto-detects document kind (ODPS, ODPC, ODPG, ODPV) and **version**
- Runs entirely in the browser — your document is never sent to a server
- Built-in example documents for each standard

## Local development

Requires Node.js ≥ 22.12.

```sh
npm install
npm run dev
```

| Command | Description |
| --- | --- |
| `npm run dev` | Start dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run schemas` | Refresh bundled JSON schemas from upstream repos |

## Stack

Astro 7 · React · Tailwind CSS · AJV · official JSON Schemas from [Open-Data-Product-Initiative](https://github.com/Open-Data-Product-Initiative)

## License

[Apache License 2.0](LICENSE)
