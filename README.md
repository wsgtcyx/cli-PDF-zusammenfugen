# pdfzus Merge CLI

This repository contains a command-line tool that mirrors the browser-based **pdfzus** merge experience. It merges multiple PDFs locally using `pdf-lib`, keeps every file inside your machine, and is designed for eventual Homebrew distribution.

## Requirements

- Node 18+ (LTS or higher)
- npm, pnpm, or yarn for installing dependencies and building the CLI

## Build & Install Locally

```bash
pnpm install
pnpm run build
```

After building, the bundled `dist/index.js` file is executable as `pdfzus-merge` and can be linked via `npm link` or imported into other tooling.

## Usage

```bash
pdfzus-merge input-1.pdf input-2.pdf -o merged-output.pdf
```

- Supply at least two input PDFs (order determines the merge order).
- Use `-o, --output` to pick the merged file name (default: `merged.pdf`).
- Add `-r, --range file.pdf=1-3,5` to limit which pages of a given PDF are merged; repeat for multiple files.
- `--verbose` prints progress details.

## Homebrew Packaging Notes

This CLI is intended to ship through Homebrew via a Node-based formula. Follow the official Homebrew contribution guide when it is time to submit:

- Inspect existing Node formulae in `Homebrew/homebrew-core` to model `Language::Node` usage.
- After releasing a tarball (e.g., `npm pack` or GitHub release), compute `sha256` with `shasum -a 256`.
- Test the formula with `brew install --build-from-source pdfzus-merge`, `brew audit --strict --new --online`, `brew test pdfzus-merge`, and `brew style --fix pdfzus-merge`.
- Confirm `pdfzus-merge --help` and merging logic function before filing a PR.

More guidance is available in the [Homebrew Adding Software guide](https://docs.brew.sh/Adding-Software-to-Homebrew).

