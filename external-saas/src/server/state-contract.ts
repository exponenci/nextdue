import { z } from "zod";

const linkedCollections = [
  "people", "citizenships", "countryContexts", "legalRoutes", "routeParties",
  "personRelationships", "assets", "assetJurisdictions", "assetPersonRoles",
  "issuedDocuments", "ruleCandidates", "items"
] as const;

export const householdStateSchema = z.object({
  version: z.literal(6),
  onboarded: z.boolean(),
  locale: z.enum(["en", "ru", "uz-Latn"]),
  profile: z.object({ goal: z.string().max(40), activeCountries: z.array(z.string().max(5)).max(100) }).passthrough(),
  settings: z.object({
    privacySafeTitles: z.boolean(),
    preparationMilestones: z.boolean(),
    horizonMonths: z.number().int().min(1).max(60)
  }).passthrough(),
  people: z.array(z.record(z.string(), z.unknown())).max(5000),
  citizenships: z.array(z.record(z.string(), z.unknown())).max(5000),
  countryContexts: z.array(z.record(z.string(), z.unknown())).max(5000),
  legalRoutes: z.array(z.record(z.string(), z.unknown())).max(5000),
  routeParties: z.array(z.record(z.string(), z.unknown())).max(5000),
  personRelationships: z.array(z.record(z.string(), z.unknown())).max(5000),
  assets: z.array(z.record(z.string(), z.unknown())).max(5000),
  assetJurisdictions: z.array(z.record(z.string(), z.unknown())).max(5000),
  assetPersonRoles: z.array(z.record(z.string(), z.unknown())).max(5000),
  issuedDocuments: z.array(z.record(z.string(), z.unknown())).max(5000),
  ruleCandidates: z.array(z.record(z.string(), z.unknown())).max(2000),
  items: z.array(z.record(z.string(), z.unknown())).max(1000),
  dismissedCatalogIds: z.array(z.string()).max(5000).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
}).passthrough().superRefine((state, context) => {
  for (const collection of linkedCollections) {
    if (!Array.isArray(state[collection])) context.addIssue({ code: "custom", message: `${collection} must be an array` });
  }
});

export const stateWriteSchema = z.object({
  revision: z.number().int().min(0),
  state: householdStateSchema
});

export type HouseholdState = z.infer<typeof householdStateSchema>;
