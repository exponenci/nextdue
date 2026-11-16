import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(scriptDir, "..");
const researchDir = path.join(projectDir, "research");
const registry = JSON.parse(await fs.readFile(path.join(researchDir, "sources_registry.json"), "utf8"));
const sources = registry.sources || [];
const checkedAt = new Date().toISOString();
const concurrency = Number(process.env.NEXTDUE_AUDIT_CONCURRENCY || 16);
const timeoutMs = Number(process.env.NEXTDUE_AUDIT_TIMEOUT_MS || 12000);
const retryFailed = process.env.NEXTDUE_AUDIT_RETRY_FAILED === "1";
let previousResults = [];
if (retryFailed) {
  try {
    const previous = JSON.parse(await fs.readFile(path.join(researchDir, "source_audit.json"), "utf8"));
    previousResults = previous.results || [];
  } catch {
    previousResults = [];
  }
}

async function check(source) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(source.url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "NextDue-source-audit/1.0 (+research link verification)",
        Range: "bytes=0-2047",
        Accept: "text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.5",
      },
    });
    await response.body?.cancel();
    const status = response.status;
    const accessResult = status >= 200 && status < 400
      ? "reachable"
      : [401, 403, 405, 429].includes(status)
        ? "restricted_or_rate_limited"
        : "http_error";
    return {
      source_id: source.source_id,
      jurisdiction: source.jurisdiction,
      authority: source.authority,
      host: new URL(source.url).host,
      source_type: source.source_type,
      url: source.url,
      final_url: response.url,
      http_status: status,
      access_result: accessResult,
      content_type: response.headers.get("content-type") || "",
      checked_at: checkedAt,
      error: "",
    };
  } catch (error) {
    return {
      source_id: source.source_id,
      jurisdiction: source.jurisdiction,
      authority: source.authority,
      host: new URL(source.url).host,
      source_type: source.source_type,
      url: source.url,
      final_url: "",
      http_status: null,
      access_result: error?.name === "AbortError" ? "timeout" : "network_error",
      content_type: "",
      checked_at: checkedAt,
      error: String(error?.message || error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

const previousById = new Map(previousResults.map((result) => [result.source_id, result]));
const sourcesToCheck = retryFailed
  ? sources.filter((source) => !["reachable", "restricted_or_rate_limited"].includes(previousById.get(source.source_id)?.access_result))
  : sources;
const checkedResults = new Array(sourcesToCheck.length);
let cursor = 0;
async function worker() {
  while (cursor < sourcesToCheck.length) {
    const index = cursor;
    cursor += 1;
    checkedResults[index] = await check(sourcesToCheck[index]);
  }
}
await Promise.all(Array.from({ length: Math.min(concurrency, sourcesToCheck.length) }, worker));
const checkedById = new Map(checkedResults.map((result) => [result.source_id, result]));
const results = sources.map((source) => checkedById.get(source.source_id) || previousById.get(source.source_id));

const counts = results.reduce((accumulator, result) => {
  accumulator[result.access_result] = (accumulator[result.access_result] || 0) + 1;
  return accumulator;
}, {});
const output = {
  schema_version: "1.0.0",
  checked_at: checkedAt,
  method: `HTTP GET with redirect following and a byte-range request (${retryFailed ? "retry of prior failures" : "full pass"}). Restricted or timed-out sites require manual browser verification; reachability does not by itself verify the legal interpretation.`,
  counts,
  results,
};
await fs.writeFile(path.join(researchDir, "source_audit.json"), `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ sources: sources.length, checked_this_pass: sourcesToCheck.length, counts }, null, 2));
