import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const countryCode = z.string().regex(/^[A-Z]{2}$/);
const scalar = z.union([z.string(), z.number(), z.boolean()]);
const fieldPath = z.string().regex(/^(person|asset|household)\.[a-zA-Z][a-zA-Z0-9_.]*$/);

export type ApplicabilityRule =
  | { all: ApplicabilityRule[] }
  | { any: ApplicabilityRule[] }
  | { not: ApplicabilityRule }
  | { eq: [string, string | number | boolean] }
  | { contains: [string, string | number | boolean] }
  | { in: [string, Array<string | number | boolean>] };

const applicabilityRule: z.ZodType<ApplicabilityRule> = z.lazy(() => z.union([
  z.object({ all: z.array(applicabilityRule).min(1) }).strict(),
  z.object({ any: z.array(applicabilityRule).min(1) }).strict(),
  z.object({ not: applicabilityRule }).strict(),
  z.object({ eq: z.tuple([fieldPath, scalar]) }).strict(),
  z.object({ contains: z.tuple([fieldPath, scalar]) }).strict(),
  z.object({ in: z.tuple([fieldPath, z.array(scalar).min(1)]) }).strict()
]));

const translation = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  audience: z.string().min(1)
}).strict();

const source = z.object({
  authority: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url(),
  reviewedAt: isoDate
}).strict();

const catalogItem = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9_-]+$/),
  category: z.enum(["identity", "residence", "tax", "transport", "property", "family", "business", "custom"]),
  subjectKind: z.enum(["person", "asset", "household"]),
  applicability: applicabilityRule,
  scheduleTemplate: z.record(z.string(), z.unknown()),
  defaultReminderInput: z.string().regex(/^\d+(?:\/\d+)*$/),
  confidence: z.enum(["high", "medium", "low"]),
  risk: z.enum(["administrative", "legal", "tax"]),
  translations: z.record(z.string(), translation),
  sources: z.array(source).min(1)
}).strict();

export const catalogPackSchema = z.object({
  countryCode,
  version: z.string().regex(/^\d{4}\.\d{2}$/),
  reviewedAt: isoDate,
  status: z.enum(["draft", "reviewed", "retired"]),
  defaultLocale: z.string().min(2),
  supportedLocales: z.array(z.string().min(2)).min(1),
  disclaimer: z.string().min(1),
  items: z.array(catalogItem)
}).strict().superRefine((pack, context) => {
  if (pack.status === "reviewed" && pack.items.length === 0) {
    context.addIssue({ code: "custom", message: "A reviewed pack must contain at least one item." });
  }
});

export type CatalogPack = z.infer<typeof catalogPackSchema>;
