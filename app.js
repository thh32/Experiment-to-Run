"use strict";

const API_URL = "https://www.ebi.ac.uk/ena/portal/api/search";
const BATCH_SIZE = 40;
const ACCESSION_RE = /^(?:ERX|SRX|DRX)\d+$/i;

const input = document.querySelector("#experiments");
const output = document.querySelector("#runs");
const convertButton = document.querySelector("#convert");
const copyButton = document.querySelector("#copy");
const downloadButton = document.querySelector("#download");
const clearButton = document.querySelector("#clear");
const statusBox = document.querySelector("#status");
const inputCount = document.querySelector("#input-count");
const resultCount = document.querySelector("#result-count");
let lastPairs = [];

function parseInput() {
  return input.value.split(/\r?\n/).map(x => x.trim().toUpperCase()).filter(Boolean);
}

function setStatus(message, kind = "") {
  statusBox.textContent = message;
  statusBox.className = `status ${kind}`.trim();
}

function updateCount() {
  const values = parseInput();
  const valid = values.filter(x => ACCESSION_RE.test(x)).length;
  inputCount.textContent = `${valid} valid`;
}

function chunks(values, size) {
  const result = [];
  for (let i = 0; i < values.length; i += size) result.push(values.slice(i, i + size));
  return result;
}

async function fetchBatch(accessions) {
  const query = accessions.map(x => `experiment_accession=\"${x}\"`).join(" OR ");
  const params = new URLSearchParams({
    result: "read_run",
    query: `(${query})`,
    fields: "experiment_accession,run_accession",
    format: "json",
    limit: "0"
  });
  const response = await fetch(`${API_URL}?${params}`, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`ENA API returned HTTP ${response.status}.`);
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error("ENA returned an unexpected response.");
  return data;
}

async function convert() {
  const all = parseInput();
  const invalid = all.filter(x => !ACCESSION_RE.test(x));
  const valid = all.filter(x => ACCESSION_RE.test(x));
  if (!all.length) return setStatus("Paste at least one experiment accession.", "error");
  if (invalid.length) return setStatus(`Invalid experiment accession${invalid.length > 1 ? "s" : ""}: ${invalid.slice(0, 5).join(", ")}${invalid.length > 5 ? "…" : ""}`, "error");

  convertButton.disabled = true;
  copyButton.disabled = true;
  downloadButton.disabled = true;
  output.value = "";
  setStatus(`Querying ENA for ${valid.length} experiment accession${valid.length === 1 ? "" : "s"}…`);

  try {
    const records = [];
    const batches = chunks([...new Set(valid)], BATCH_SIZE);
    for (let i = 0; i < batches.length; i++) {
      setStatus(`Querying ENA: batch ${i + 1} of ${batches.length}…`);
      records.push(...await fetchBatch(batches[i]));
    }
    const lookup = new Map();
    for (const row of records) {
      const experiment = String(row.experiment_accession || "").toUpperCase();
      const run = String(row.run_accession || "").toUpperCase();
      if (!experiment || !run) continue;
      if (!lookup.has(experiment)) lookup.set(experiment, new Set());
      lookup.get(experiment).add(run);
    }
    lastPairs = valid.map(experiment => {
      const runs = lookup.has(experiment) ? [...lookup.get(experiment)].sort().join(", ") : "-";
      return { experiment, runs };
    });
    output.value = lastPairs.map(x => x.runs).join("\n");
    resultCount.textContent = `${lastPairs.length} results`;
    copyButton.disabled = false;
    downloadButton.disabled = false;
    const missing = lastPairs.filter(x => x.runs === "-").length;
    setStatus(`Done. ${lastPairs.length - missing} found; ${missing} not found.`, "success");
  } catch (error) {
    console.error(error);
    setStatus(`${error.message} Check your connection and try again. If the problem persists, ENA may be temporarily unavailable or blocking browser requests.`, "error");
  } finally {
    convertButton.disabled = false;
  }
}

async function copyResults() {
  try {
    await navigator.clipboard.writeText(output.value);
    setStatus("Results copied to the clipboard.", "success");
  } catch {
    output.select();
    document.execCommand("copy");
    setStatus("Results copied to the clipboard.", "success");
  }
}

function downloadTsv() {
  const rows = ["experiment_accession\trun_accession", ...lastPairs.map(x => `${x.experiment}\t${x.runs}`)];
  const blob = new Blob([rows.join("\n") + "\n"], { type: "text/tab-separated-values;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "ena_experiment_to_run.tsv";
  anchor.click();
  URL.revokeObjectURL(url);
}

function clearAll() {
  input.value = ""; output.value = ""; lastPairs = [];
  inputCount.textContent = "0 valid"; resultCount.textContent = "0 results";
  copyButton.disabled = true; downloadButton.disabled = true;
  setStatus("Ready."); input.focus();
}

input.addEventListener("input", updateCount);
convertButton.addEventListener("click", convert);
copyButton.addEventListener("click", copyResults);
downloadButton.addEventListener("click", downloadTsv);
clearButton.addEventListener("click", clearAll);
