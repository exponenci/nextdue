export const DOMAIN_SCHEMA_VERSION = 5;

export const ASSET_PERSON_ROLES = [
  "owner",
  "co_owner",
  "registered_owner",
  "keeper",
  "operator",
  "taxpayer",
  "responsible_person",
];

export const ASSET_JURISDICTION_ROLES = [
  "location",
  "registration",
  "tax",
  "ownership",
  "use",
  "incorporation",
  "other",
];

function id(prefix) {
  const suffix = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${suffix}`;
}

export function emptyDomainState(locale = "en") {
  const timestamp = new Date().toISOString();
  return {
    version: DOMAIN_SCHEMA_VERSION,
    onboarded: false,
    locale,
    profile: { goal: "move", activeCountries: [] },
    people: [{ id: "person-me", name: "Me", relationship: "self" }],
    citizenships: [],
    countryContexts: [],
    legalRoutes: [],
    routeParties: [],
    personRelationships: [],
    assets: [],
    assetJurisdictions: [],
    assetPersonRoles: [],
    issuedDocuments: [],
    items: [],
    dismissedCatalogIds: [],
    settings: { privacySafeTitles: true, preparationMilestones: true, horizonMonths: 24 },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function citizenshipsFor(state, personId) {
  return (state.citizenships || []).filter((record) => record.personId === personId);
}

export function citizenshipCodesFor(state, personId) {
  return citizenshipsFor(state, personId).map((record) => record.country);
}

export function contextsFor(state, personId) {
  return (state.countryContexts || []).filter((record) => record.personId === personId);
}

export function routeForContext(state, countryContextId) {
  return (state.legalRoutes || []).find((record) => record.countryContextId === countryContextId) || null;
}

export function primaryAssetJurisdiction(state, assetId) {
  const jurisdictions = (state.assetJurisdictions || []).filter((record) => record.assetId === assetId);
  return jurisdictions.find((record) => record.isPrimary) || jurisdictions[0] || null;
}

export function assetRolesFor(state, assetId) {
  return (state.assetPersonRoles || []).filter((record) => record.assetId === assetId);
}

export function primaryAssetPerson(state, assetId) {
  const roles = assetRolesFor(state, assetId);
  return roles.find((record) => ["owner", "co_owner", "registered_owner"].includes(record.role))
    || roles.find((record) => record.role === "responsible_person")
    || roles[0]
    || null;
}

export function catalogGraph(state) {
  return {
    people: (state.people || []).map((person) => ({
      ...person,
      citizenships: citizenshipCodesFor(state, person.id),
      jurisdictions: contextsFor(state, person.id).map((context) => {
        const route = routeForContext(state, context.id);
        return {
          id: context.id,
          country: context.country,
          type: context.contextType === "lives_now" ? "residence" : "destination",
          contextType: context.contextType,
          purpose: context.purpose || "unknown",
          route: route?.routeCode || "not_sure",
          basis: route?.routeCode || "not_sure",
          startsOn: context.startsOn || "",
          endsOn: context.endsOn || "",
        };
      }),
    })),
    assets: (state.assets || []).map((asset) => {
      const jurisdiction = primaryAssetJurisdiction(state, asset.id);
      const personRole = primaryAssetPerson(state, asset.id);
      return {
        ...asset,
        country: jurisdiction?.country || "",
        ownerId: personRole?.personId || null,
      };
    }),
  };
}

export function normalizeCatalogObligation(item, responsiblePersonId = null, applicability = item.applicability || "candidate") {
  const { subjectId, assetId, ...rest } = item;
  if (assetId) {
    return {
      ...rest,
      subjectType: "asset",
      personId: null,
      assetId,
      responsiblePersonId: responsiblePersonId || subjectId || null,
      applicability,
    };
  }
  if (subjectId) {
    return {
      ...rest,
      subjectType: "person",
      personId: subjectId,
      assetId: null,
      responsiblePersonId: responsiblePersonId || subjectId,
      applicability,
    };
  }
  return {
    ...rest,
    subjectType: "household",
    personId: null,
    assetId: null,
    responsiblePersonId,
    applicability,
  };
}

function normalizeExistingV5(value) {
  const empty = emptyDomainState(value.locale || "en");
  return {
    ...empty,
    ...value,
    version: DOMAIN_SCHEMA_VERSION,
    people: Array.isArray(value.people) ? value.people : empty.people,
    citizenships: Array.isArray(value.citizenships) ? value.citizenships : [],
    countryContexts: Array.isArray(value.countryContexts) ? value.countryContexts : [],
    legalRoutes: Array.isArray(value.legalRoutes) ? value.legalRoutes : [],
    routeParties: Array.isArray(value.routeParties) ? value.routeParties : [],
    personRelationships: Array.isArray(value.personRelationships) ? value.personRelationships : [],
    assets: Array.isArray(value.assets) ? value.assets : [],
    assetJurisdictions: Array.isArray(value.assetJurisdictions) ? value.assetJurisdictions : [],
    assetPersonRoles: Array.isArray(value.assetPersonRoles) ? value.assetPersonRoles : [],
    issuedDocuments: Array.isArray(value.issuedDocuments) ? value.issuedDocuments : [],
    items: Array.isArray(value.items) ? value.items : [],
  };
}

export function migrateDomainState(value) {
  if (!value || typeof value !== "object") return emptyDomainState();
  if (value.version === DOMAIN_SCHEMA_VERSION) return normalizeExistingV5(value);

  const next = emptyDomainState(value.locale || "en");
  next.onboarded = Boolean(value.onboarded);
  next.profile = value.profile || next.profile;
  next.settings = value.settings || next.settings;
  next.createdAt = value.createdAt || next.createdAt;
  next.updatedAt = value.updatedAt || next.updatedAt;
  next.dismissedCatalogIds = Array.isArray(value.dismissedCatalogIds) ? value.dismissedCatalogIds : [];

  next.people = (value.people || next.people).map((person) => ({
    id: person.id || id("person"),
    name: person.name || "Person",
    relationship: person.relationship || "dependant",
    birthDate: person.birthDate || "",
  }));

  for (const person of value.people || []) {
    for (const country of new Set(person.citizenships || [])) {
      next.citizenships.push({
        id: id("citizenship"),
        personId: person.id,
        country,
        confirmation: "user_confirmed",
      });
    }
    for (const relation of person.jurisdictions || []) {
      const contextId = relation.id || id("context");
      next.countryContexts.push({
        id: contextId,
        personId: person.id,
        country: relation.country,
        contextType: relation.contextType || (relation.type === "residence" ? "lives_now" : "planned_move"),
        purpose: relation.purpose || "unknown",
        startsOn: relation.startsOn || "",
        endsOn: relation.endsOn || "",
        confirmation: "user_confirmed",
      });
      const routeCode = relation.route || relation.basis || "not_sure";
      next.legalRoutes.push({
        id: id("route"),
        countryContextId: contextId,
        routeCode,
        routeFamily: routeCode === "citizen" ? "citizen" : routeCode === "not_sure" ? "unknown" : "other",
        stage: routeCode === "not_sure" ? "exploring" : "active",
        confirmation: routeCode === "not_sure" ? "unconfirmed" : "user_confirmed",
      });
      const statusDocument = relation.statusDocument;
      if (statusDocument) {
        next.issuedDocuments.push({
          id: id("document"),
          subjectType: "person",
          personId: person.id,
          assetId: null,
          legalRouteId: next.legalRoutes.at(-1).id,
          country: relation.country,
          documentType: "immigration_status",
          title: statusDocument.label || "Status document",
          status: statusDocument.status || "active",
          validUntil: statusDocument.printedExpiry || "",
          confirmation: "user_confirmed",
        });
      }
    }
  }

  next.assets = (value.assets || []).map((asset) => ({
    id: asset.id || id("asset"),
    type: asset.type || "other",
    subtype: asset.subtype || "",
    label: asset.label || "Possession",
    status: asset.status || "active",
    facts: asset.facts || (asset.details ? { legacyNote: asset.details } : {}),
  }));

  for (const asset of value.assets || []) {
    if (asset.country) {
      next.assetJurisdictions.push({
        id: id("asset-jurisdiction"),
        assetId: asset.id,
        country: asset.country,
        role: asset.type === "business" ? "incorporation" : asset.type === "vehicle" ? "registration" : "location",
        isPrimary: true,
      });
    }
    if (asset.ownerId) {
      next.assetPersonRoles.push({
        id: id("asset-role"),
        assetId: asset.id,
        personId: asset.ownerId,
        role: "owner",
      });
    }
  }

  next.items = (value.items || []).map((item) => normalizeCatalogObligation(
    item,
    item.responsiblePersonId || null,
    item.applicability || (item.provenance === "catalog" ? "candidate" : "user_confirmed"),
  ));
  return next;
}

export function validateSubject(item) {
  if (item.subjectType === "household") return !item.personId && !item.assetId;
  if (item.subjectType === "person") return Boolean(item.personId) && !item.assetId;
  if (item.subjectType === "asset") return Boolean(item.assetId) && !item.personId;
  return false;
}
