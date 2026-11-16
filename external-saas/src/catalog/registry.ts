import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const country = z.object({ code: z.string().regex(/^[A-Z]{2}$/), name: z.string().min(1), flag: z.string().min(1) }).passthrough();
const source = z.object({
  source_id: z.string().min(1),
  authority: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url(),
  jurisdiction: z.string().min(2),
  language: z.string().min(1),
  last_verified: isoDate,
  source_type: z.string().min(1),
}).passthrough();
const rule = z.object({
  rule_id: z.string().min(1),
  destination_country: z.string().regex(/^[A-Z]{2}$/),
  requirement_name: z.string().min(1),
  requirement_type: z.string().min(1),
  condition_expression: z.record(z.string(), z.unknown()),
  source_ids: z.array(z.string().min(1)),
  last_verified: isoDate,
  review_status: z.enum(["verified", "publishable", "mapped", "partial", "retired"]),
  rule_specificity: z.enum(["exact_national_rule", "route_mapping", "research_prompt"]),
  runtime_tier: z.enum(["ready", "confirm", "research"]),
}).passthrough();

export const runtimeRegistrySchema = z.object({
  schema_version: z.string().min(1),
  catalog_version: z.string().min(1),
  generated_at: z.string().datetime(),
  legal_notice: z.string().min(1),
  counts: z.object({
    countries: z.literal(42),
    rules: z.literal(694),
    sources: z.literal(426),
    ready: z.literal(24),
    confirm: z.literal(515),
    research: z.literal(155),
  }).strict(),
  countries: z.array(country).length(42),
  rules: z.array(rule).length(694),
  sources: z.array(source).length(426),
}).strict().superRefine((registry, context) => {
  const countryCodes = new Set(registry.countries.map((record) => record.code));
  const ruleIds = new Set(registry.rules.map((record) => record.rule_id));
  const sourceIds = new Set(registry.sources.map((record) => record.source_id));
  if (countryCodes.size !== registry.countries.length) context.addIssue({ code: "custom", message: "Country codes must be unique." });
  if (ruleIds.size !== registry.rules.length) context.addIssue({ code: "custom", message: "Rule IDs must be unique." });
  if (sourceIds.size !== registry.sources.length) context.addIssue({ code: "custom", message: "Source IDs must be unique." });
  for (const record of registry.rules) {
    if (!countryCodes.has(record.destination_country)) context.addIssue({ code: "custom", message: `${record.rule_id} has an unknown country.` });
    for (const sourceId of record.source_ids) if (!sourceIds.has(sourceId)) context.addIssue({ code: "custom", message: `${record.rule_id} references missing source ${sourceId}.` });
    const expectedTier = record.rule_specificity === "research_prompt" ? "research" : record.rule_specificity === "exact_national_rule" && ["verified", "publishable"].includes(record.review_status) ? "ready" : "confirm";
    if (record.runtime_tier !== expectedTier) context.addIssue({ code: "custom", message: `${record.rule_id} has an invalid runtime tier.` });
  }
});

export type RuntimeRegistry = z.infer<typeof runtimeRegistrySchema>;

export async function loadRuntimeRegistry(): Promise<RuntimeRegistry> {
  const file = path.join(process.cwd(), "catalog", "registry.json");
  return runtimeRegistrySchema.parse(JSON.parse(await readFile(file, "utf8")));
}
