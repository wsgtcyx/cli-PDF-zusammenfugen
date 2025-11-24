#!/usr/bin/env node
import { Command } from "commander";
import { PDFDocument } from "pdf-lib";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";

const CLI_VERSION = "0.1.0";

type CLIOptions = {
  output: string;
  range: string[];
  verbose: boolean;
};

type NormalizedRangeEntry = {
  key: string;
  range: string;
};

const collectRanges = (value: string, previous: string[]) => {
  previous.push(value);
  return previous;
};

const parsePageRange = (rangeStr: string, totalPages: number): number[] => {
  if (!rangeStr.trim()) return [];

  const pages = new Set<number>();
  const segments = rangeStr.split(",");

  for (const segment of segments) {
    const [startStr, endStr] = segment.split("-").map((token) => token.trim());
    const start = Number(startStr);
    const end = Number(endStr);

    if (!Number.isNaN(start) && !Number.isNaN(end)) {
      const lower = Math.max(1, Math.min(start, end));
      const upper = Math.min(totalPages, Math.max(start, end));

      for (let cursor = lower; cursor <= upper; cursor += 1) {
        pages.add(cursor - 1);
      }
    } else if (!Number.isNaN(start)) {
      if (start >= 1 && start <= totalPages) {
        pages.add(start - 1);
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
};

const getAllPageIndices = (totalPages: number) =>
  Array.from({ length: totalPages }, (_, index) => index);

const buildRangeEntries = (rawRanges: string[]) => {
  const entries: NormalizedRangeEntry[] = [];

  for (const raw of rawRanges) {
    const [fileToken, rangeToken] = raw.split("=", 2);

    if (!fileToken || !rangeToken) {
      throw new Error('Range entries must use the format "file.pdf=1-3,5".');
    }

    const trimmedFile = fileToken.trim();
    const trimmedRange = rangeToken.trim();

    if (!trimmedRange) {
      throw new Error("Provided range cannot be empty.");
    }

    const resolvedPath = resolve(trimmedFile);
    entries.push({ key: resolvedPath, range: trimmedRange });
    entries.push({ key: trimmedFile, range: trimmedRange });
    entries.push({ key: basename(trimmedFile), range: trimmedRange });
  }

  return entries;
};

const findRangeForFile = (
  entries: NormalizedRangeEntry[],
  resolvedPath: string,
  originalInput: string
) => {
  const targets = [resolvedPath, originalInput, basename(originalInput)];

  for (const entry of entries) {
    if (targets.includes(entry.key)) {
      return entry.range;
    }
  }

  return undefined;
};

const ensureOutputDirectory = async (outputPath: string) => {
  const directory = dirname(outputPath);

  if (directory) {
    await mkdir(directory, { recursive: true });
  }
};

const main = async () => {
  const program = new Command();

  program
    .name("pdfzus-merge")
    .description("Merge multiple PDFs locally without uploading files.")
    .version(CLI_VERSION)
    .argument("<files...>", "PDF files to merge, in the desired order.")
    .option("-o, --output <file>", "Destination path for the merged PDF.", "merged.pdf")
    .option(
      "-r, --range <file=pages>",
      "Restrict a specific file to a comma-separated page range (e.g. file.pdf=1-3,5).",
      collectRanges,
      []
    )
    .option("-v, --verbose", "Enable progress output.", false);

  program.parse(process.argv);

  const options = program.opts<CLIOptions>();
  const inputs = program.args as string[];

  if (inputs.length < 2) {
    console.error("Bitte mindestens zwei PDF-Dateien angeben.");
    program.help({ error: true });
  }

  const rangeEntries = buildRangeEntries(options.range);
  const mergedDoc = await PDFDocument.create();

  for (const input of inputs) {
    const resolvedPath = resolve(input);

    if (!existsSync(resolvedPath)) {
      throw new Error(`Datei nicht gefunden: ${input}`);
    }

    const bytes = await readFile(resolvedPath);
    const sourceDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const totalPages = sourceDoc.getPageCount();
    const requestedRange = findRangeForFile(rangeEntries, resolvedPath, input);

    let pageIndices =
      requestedRange && requestedRange.length ? parsePageRange(requestedRange, totalPages) : [];

    if (requestedRange && pageIndices.length === 0) {
      console.warn(
        `Der Seitenbereich für "${input}" konnte nicht analysiert werden – es werden alle ${totalPages} Seiten verwendet.`
      );
      pageIndices = getAllPageIndices(totalPages);
    }

    if (!requestedRange) {
      pageIndices = getAllPageIndices(totalPages);
    }

    if (options.verbose) {
      console.log(
        `Verarbeite "${input}" (${totalPages} Seiten, ${pageIndices.length} ausgewählt).`
      );
    }

    const copiedPages = await mergedDoc.copyPages(sourceDoc, pageIndices);
    copiedPages.forEach((page) => mergedDoc.addPage(page));
  }

  const resolvedOutput = resolve(options.output);
  const mergedAssets = await mergedDoc.save();

  await ensureOutputDirectory(resolvedOutput);
  await writeFile(resolvedOutput, mergedAssets);

  console.log(`Zusammengeführtes PDF gespeichert unter: ${resolvedOutput}`);
};

main().catch((error) => {
  console.error("Fehler beim Zusammenfügen:", error instanceof Error ? error.message : error);
  process.exit(1);
});

