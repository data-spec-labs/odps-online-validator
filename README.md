# ODPS Family Validator

[![Uptime](https://img.shields.io/uptimerobot/status/m803470989-1b1614aa5fda8a44f78aa02a?style=flat-square)](https://odps-validator.com/)
[![Build Status](https://img.shields.io/github/actions/workflow/status/data-spec-labs/odps-online-validator/build.yml?branch=main&style=flat-square)](https://github.com/data-spec-labs/odps-online-validator/actions)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg?style=flat-square)](https://opensource.org/licenses/Apache-2.0)
[![GitHub issues](https://img.shields.io/github/issues/data-spec-labs/odps-online-validator?style=flat-square)](https://github.com/data-spec-labs/odps-online-validator/issues)
[![GitHub stars](https://img.shields.io/github/stars/data-spec-labs/odps-online-validator?style=flat-square)](https://github.com/data-spec-labs/odps-online-validator/stargazers)
[![Built with Astro](https://img.shields.io/badge/Built__with-Astro-ff5d01?style=flat-square&logo=astro)](https://astro.build)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind__CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

Free online validator for the [Open Data Products standards family](https://opendataproducts.org/) and the [Bitol Open Data Product Standard](https://github.com/bitol-io/open-data-product-standard). Paste a YAML or JSON document and get instant schema validation with clear error paths.

Supports **ODPS Spec 4.1**, **ODPS Spec 4.0**, **ODPS Standard (Bitol) 1.0.0 / 0.9.0**, **ODPC 1.0**, **ODPG 1.0**, and **ODPV 1.0**.

**Live site:** [https://odps-validator.com/](https://odps-validator.com/)

## Features

- Validates ODPS Spec, Bitol ODPS Standard, ODPC, ODPG, and ODPV documents in **YAML** or **JSON**
- Auto-detects document kind and **version** (`version` for the LF family; `apiVersion` for Bitol)
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

Astro 7 · React · Tailwind CSS · AJV · official JSON Schemas from [Open-Data-Product-Initiative](https://github.com/Open-Data-Product-Initiative) and [bitol-io/open-data-product-standard](https://github.com/bitol-io/open-data-product-standard)

## License

[Apache License 2.0](LICENSE)
