import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FileBlob, SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(scriptDir, "..");
const workspaceDir = path.resolve(projectDir, "../..");
const researchDir = path.join(projectDir, "research");
const outputDir = path.join(workspaceDir, "outputs", "01a1e08e-6398-7cc2-af38-a0d481e5241d");
const previewDir = "/tmp/nextdue-rules-workbook-previews";
const outputPath = path.join(outputDir, "nextdue-country-rules-map.xlsx");

const [ruleRegistry, sourceRegistry, model] = await Promise.all([
  fs.readFile(path.join(researchDir, "rules_registry.json"), "utf8").then(JSON.parse),
  fs.readFile(path.join(researchDir, "sources_registry.json"), "utf8").then(JSON.parse),
  fs.readFile(path.join(researchDir, "workbook_model.json"), "utf8").then(JSON.parse),
]);

const rules = ruleRegistry.rules;
const sources = sourceRegistry.sources;
const ruleColumns = model.rule_schema.fields;
const sourceColumns = model.source_schema.fields;
const countries = ruleRegistry.countries;

const COLORS = {
  navy: "#24324A",
  indigo: "#4C51BF",
  violet: "#6B5FB5",
  ink: "#1F2937",
  muted: "#667085",
  line: "#D8DEE9",
  soft: "#F5F7FB",
  blueSoft: "#EAF0FF",
  lavender: "#F0ECFF",
  amber: "#FFF3D6",
  redSoft: "#FDEBEC",
  white: "#FFFFFF",
};

const colLetter = (index) => {
  let value = index + 1;
  let result = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    value = Math.floor((value - 1) / 26);
  }
  return result;
};

const display = (value) => {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join("; ");
  if (typeof value === "object") return JSON.stringify(value);
  return value;
};

const unique = (values) => [...new Set(values.filter(Boolean))];

const title = (sheet, label, lastColumn) => {
  sheet.showGridLines = false;
  sheet.getRange("A2").values = [[label]];
  sheet.getRange("A2").format.font = { name: "Arial", size: 15, bold: true, color: COLORS.navy };
  sheet.getRange(`A3:${lastColumn}3`).format.borders = { bottom: { style: "thin", color: COLORS.line } };
};

const styleHeader = (range) => {
  range.format.fill = COLORS.navy;
  range.format.font = { name: "Arial", size: 9, bold: true, color: COLORS.white };
  range.format.horizontalAlignment = "center";
  range.format.verticalAlignment = "center";
  range.format.wrapText = true;
  range.format.rowHeight = 28;
};

const styleBody = (range, rowHeight = 34) => {
  range.format.font = { name: "Arial", size: 9, color: COLORS.ink };
  range.format.verticalAlignment = "top";
  range.format.wrapText = true;
  range.format.rowHeight = rowHeight;
};

const workbook = Workbook.create();
const overview = workbook.worksheets.add("Overview");
const rulesSheet = workbook.worksheets.add("Rules");
const coverageSheet = workbook.worksheets.add("Coverage");
const sourcesSheet = workbook.worksheets.add("Sources");
const modelSheet = workbook.worksheets.add("Data model");
const dictionariesSheet = workbook.worksheets.add("Dictionaries");

overview.tabColor = COLORS.navy;
rulesSheet.tabColor = COLORS.indigo;
coverageSheet.tabColor = COLORS.violet;
modelSheet.tabColor = "#8B91A7";
dictionariesSheet.tabColor = "#A9AEC0";

// Overview
title(overview, "NextDue country rules map", "F");
overview.getRange("A5:F5").values = [["Scope", "Value", "Meaning", "", "", ""]];
styleHeader(overview.getRange("A5:C5"));
const rulesLastRow = rules.length + 4;
const sourcesLastRow = sources.length + 4;
const coverageLastRow = countries.length + 4;
overview.getRange("A6:C12").values = [
  ["Rule rows", null, "A rule is a predicate plus one requirement, not a full citizenship × country Cartesian row."],
  ["Countries / jurisdictions", null, "CIS-region, Europe, East Asia and Southeast Asia coverage in this release."],
  ["Official source records", null, "Each source keeps authority, jurisdiction, URL and verification date."],
  ["Verified published rules", null, "Reviewed rules already used by the product catalog."],
  ["Mapped / partial / unresolved", null, "Research rows that need applicability or rule-level review before action."],
  ["Asset-scoped rows", null, "Rules or checklist seeds attached to an exact possession."],
  ["Schema version", ruleRegistry.schema_version, "Stable predicate and source model for server ingestion."],
];
overview.getRange("B6").formulas = [[`=COUNTA(Rules!$A$5:$A$${rulesLastRow})`]];
overview.getRange("B7").formulas = [[`=COUNTA(Coverage!$A$5:$A$${coverageLastRow})`]];
overview.getRange("B8").formulas = [[`=COUNTA(Sources!$A$5:$A$${sourcesLastRow})`]];
overview.getRange("B9").formulas = [[`=COUNTIFS(Rules!$AD$5:$AD$${rulesLastRow},"verified")`]];
overview.getRange("B10").formulas = [["=B6-B9"]];
overview.getRange("B11").formulas = [[`=SUM(Coverage!$L$5:$L$${coverageLastRow})`]];
styleBody(overview.getRange("A6:C12"), 30);
overview.getRange("A6:A12").format.font = { name: "Arial", size: 10, bold: true, color: COLORS.ink };
overview.getRange("B6:B12").format.horizontalAlignment = "right";
overview.getRange("A15:C15").values = [["How to use this workbook", "", ""]];
overview.getRange("A15:C15").format.fill = COLORS.blueSoft;
overview.getRange("A15:C15").format.font = { name: "Arial", size: 10, bold: true, color: COLORS.navy };
overview.getRange("A16:C20").values = [
  ["1", "Match facts", "Match citizenships, country context, purpose, exact route, family/employer/institution facts and exact asset."],
  ["2", "Check review status", "Only verified rows are publishable without another editorial pass. Mapped, partial and unresolved rows are planning data."],
  ["3", "Resolve the trigger", "A deadline is actionable only after the triggering event and responsible actor are confirmed."],
  ["4", "Open the source", "Re-check the current official page or legal text before relying on the requirement."],
  ["5", "Instantiate an obligation", "Copy the matched rule into a user obligation while preserving the rule version and the user's confirmed date."],
];
styleBody(overview.getRange("A16:C20"), 34);
overview.getRange("A23:C23").values = [["Legal-use boundary", "", ""]];
overview.getRange("A23:C23").format.fill = COLORS.amber;
overview.getRange("A23:C23").format.font = { name: "Arial", size: 10, bold: true, color: COLORS.ink };
overview.getRange("A24:C26").values = [
  ["", "", ruleRegistry.legal_notice],
  ["", "", "Laws, implementing rules and authority guidance can change. Source and review dates are part of the data model, not optional notes."],
  ["", "", "Empty source IDs on low-confidence asset checklist seeds mean an official transport or property source is still required before publication."],
];
styleBody(overview.getRange("A24:C26"), 34);
overview.getRange("A5:C26").format.borders = { preset: "outside", style: "thin", color: COLORS.line };
overview.getRange("A:A").format.columnWidth = 26;
overview.getRange("B:B").format.columnWidth = 22;
overview.getRange("C:C").format.columnWidth = 76;

// Rules
title(rulesSheet, `Rules (${rules.length} rows)`, colLetter(ruleColumns.length - 1));
rulesSheet.getRangeByIndexes(3, 0, 1, ruleColumns.length).values = [ruleColumns];
rulesSheet.getRangeByIndexes(4, 0, rules.length, ruleColumns.length).values = rules.map((rule) => ruleColumns.map((column) => display(rule[column])));
styleHeader(rulesSheet.getRangeByIndexes(3, 0, 1, ruleColumns.length));
styleBody(rulesSheet.getRangeByIndexes(4, 0, rules.length, ruleColumns.length), 38);
rulesSheet.freezePanes.freezeRows(4);
rulesSheet.freezePanes.freezeColumns(2);
rulesSheet.tables.add(`A4:${colLetter(ruleColumns.length - 1)}${rulesLastRow}`, true, "RulesTable");
const widthByRuleColumn = {
  rule_id: 34, destination_country: 10, authority_level: 18, citizenship_scope_type: 24,
  citizenship_values: 22, residence_or_entry_scope: 25, purpose: 16, route_code: 32,
  person_role: 22, family_condition: 28, employer_condition: 28, institution_condition: 28,
  asset_type: 18, asset_condition: 28, condition_expression: 64, requirement_type: 25,
  requirement_name: 42, actor: 24, trigger_event: 32, deadline_type: 25, deadline_value: 16,
  deadline_unit: 18, recurrence: 18, required_evidence: 44, exceptions: 58, source_ids: 34,
  effective_from: 14, effective_to: 14, last_verified: 14, review_status: 15, confidence: 14, notes: 62,
};
ruleColumns.forEach((column, index) => { rulesSheet.getRange(`${colLetter(index)}:${colLetter(index)}`).format.columnWidth = widthByRuleColumn[column] || 20; });
const statusColumn = colLetter(ruleColumns.indexOf("review_status"));
const statusRange = rulesSheet.getRange(`${statusColumn}5:${statusColumn}${rulesLastRow}`);
statusRange.conditionalFormats.add("containsText", { text: "verified", format: { fill: COLORS.blueSoft, font: { bold: true, color: COLORS.indigo } } });
statusRange.conditionalFormats.add("containsText", { text: "mapped", format: { fill: COLORS.lavender, font: { color: COLORS.violet } } });
statusRange.conditionalFormats.add("containsText", { text: "partial", format: { fill: COLORS.amber, font: { color: "#8A5D00" } } });
statusRange.conditionalFormats.add("containsText", { text: "unresolved", format: { fill: COLORS.redSoft, font: { bold: true, color: "#9B2C2C" } } });

// Coverage
const coverageColumns = ["country", "name", "region", "total_rules", "verified", "mapped", "partial", "unresolved", "work", "study", "family", "asset_scoped", "source_refs"];
const regionFor = (code) => ["RU", "UZ", "KZ", "KG", "TJ", "TM", "AM", "AZ", "BY", "MD", "GE"].includes(code)
  ? "CIS region"
  : ["JP", "KR", "CN", "HK", "SG", "TH", "MY", "ID", "VN", "PH", "TW"].includes(code)
    ? "East / Southeast Asia"
    : "Europe";
title(coverageSheet, "Coverage by jurisdiction", colLetter(coverageColumns.length - 1));
coverageSheet.getRangeByIndexes(3, 0, 1, coverageColumns.length).values = [coverageColumns];
coverageSheet.getRangeByIndexes(4, 0, countries.length, coverageColumns.length).values = countries.map((country) => {
  const countryRules = rules.filter((rule) => rule.destination_country === country.code);
  const sourceRefs = unique(countryRules.flatMap((rule) => rule.source_ids)).length;
  const purposeCount = (purpose) => countryRules.filter((rule) => String(rule.purpose || "").split("|").includes(purpose)).length;
  const assetCount = countryRules.filter((rule) => Boolean(rule.asset_type)).length;
  return [country.code, `${country.flag} ${country.name}`, regionFor(country.code), null, null, null, null, null, purposeCount("work"), purposeCount("study"), purposeCount("family"), assetCount, sourceRefs];
});
for (let row = 5; row <= coverageLastRow; row += 1) {
  coverageSheet.getRange(`D${row}`).formulas = [[`=COUNTIFS(Rules!$B$5:$B$${rulesLastRow},$A${row})`]];
  coverageSheet.getRange(`E${row}`).formulas = [[`=COUNTIFS(Rules!$B$5:$B$${rulesLastRow},$A${row},Rules!$AD$5:$AD$${rulesLastRow},"verified")`]];
  coverageSheet.getRange(`F${row}`).formulas = [[`=COUNTIFS(Rules!$B$5:$B$${rulesLastRow},$A${row},Rules!$AD$5:$AD$${rulesLastRow},"mapped")`]];
  coverageSheet.getRange(`G${row}`).formulas = [[`=COUNTIFS(Rules!$B$5:$B$${rulesLastRow},$A${row},Rules!$AD$5:$AD$${rulesLastRow},"partial")`]];
  coverageSheet.getRange(`H${row}`).formulas = [[`=COUNTIFS(Rules!$B$5:$B$${rulesLastRow},$A${row},Rules!$AD$5:$AD$${rulesLastRow},"unresolved")`]];
}
styleHeader(coverageSheet.getRangeByIndexes(3, 0, 1, coverageColumns.length));
styleBody(coverageSheet.getRangeByIndexes(4, 0, countries.length, coverageColumns.length), 24);
coverageSheet.freezePanes.freezeRows(4);
coverageSheet.freezePanes.freezeColumns(3);
coverageSheet.tables.add(`A4:M${coverageLastRow}`, true, "CoverageTable");
coverageSheet.getRange("A:A").format.columnWidth = 10;
coverageSheet.getRange("B:B").format.columnWidth = 27;
coverageSheet.getRange("C:C").format.columnWidth = 24;
coverageSheet.getRange("D:M").format.columnWidth = 14;

// Sources
title(sourcesSheet, `Sources (${sources.length} records)`, colLetter(sourceColumns.length - 1));
sourcesSheet.getRangeByIndexes(3, 0, 1, sourceColumns.length).values = [sourceColumns];
sourcesSheet.getRangeByIndexes(4, 0, sources.length, sourceColumns.length).values = sources.map((source) => sourceColumns.map((column) => display(source[column])));
styleHeader(sourcesSheet.getRangeByIndexes(3, 0, 1, sourceColumns.length));
styleBody(sourcesSheet.getRangeByIndexes(4, 0, sources.length, sourceColumns.length), 38);
sourcesSheet.freezePanes.freezeRows(4);
sourcesSheet.freezePanes.freezeColumns(2);
sourcesSheet.tables.add(`A4:${colLetter(sourceColumns.length - 1)}${sourcesLastRow}`, true, "SourcesTable");
const sourceWidths = [28, 34, 44, 68, 12, 14, 20, 16, 28, 58];
sourceWidths.forEach((width, index) => { sourcesSheet.getRange(`${colLetter(index)}:${colLetter(index)}`).format.columnWidth = width; });

// Data model
title(modelSheet, "Stable server data model", "M");
const entityRows = [];
for (const entity of [...model.server_model.entities, ...(model.server_model.join_entities || [])]) {
  for (const fieldSpec of entity.fields || []) {
    const [field, rawType = ""] = fieldSpec.split(":");
    const nullable = rawType.endsWith("?");
    entityRows.push([entity.name, (model.server_model.join_entities || []).includes(entity) ? "join entity" : "entity", entity.primary_key, field, rawType.replace(/\?$/, ""), nullable ? "optional" : "required", "Version fields and user-confirmed facts are preserved; rule updates do not overwrite records."]);
  }
}
const entityHeaders = ["entity", "kind", "primary_key", "field", "type", "required", "stability_contract"];
modelSheet.getRange("A4:G4").values = [entityHeaders];
modelSheet.getRangeByIndexes(4, 0, entityRows.length, entityHeaders.length).values = entityRows;
styleHeader(modelSheet.getRange("A4:G4"));
styleBody(modelSheet.getRangeByIndexes(4, 0, entityRows.length, entityHeaders.length), 28);
modelSheet.tables.add(`A4:G${entityRows.length + 4}`, true, "EntitiesTable");
const relationshipHeaders = ["from", "to", "cardinality", "foreign_key", "meaning"];
const relationshipRows = model.server_model.relationships.map((relationship) => [
  relationship.from, relationship.to, relationship.cardinality, relationship.foreign_key,
  "Relationship is explicit; country, person, route, document and asset facts are never inferred from one another.",
]);
modelSheet.getRange("I4:M4").values = [relationshipHeaders];
modelSheet.getRangeByIndexes(4, 8, relationshipRows.length, relationshipHeaders.length).values = relationshipRows;
styleHeader(modelSheet.getRange("I4:M4"));
styleBody(modelSheet.getRangeByIndexes(4, 8, relationshipRows.length, relationshipHeaders.length), 28);
modelSheet.tables.add(`I4:M${relationshipRows.length + 4}`, true, "RelationshipsTable");
modelSheet.freezePanes.freezeRows(4);
modelSheet.getRange("A:A").format.columnWidth = 22;
modelSheet.getRange("B:B").format.columnWidth = 16;
modelSheet.getRange("C:C").format.columnWidth = 24;
modelSheet.getRange("D:D").format.columnWidth = 28;
modelSheet.getRange("E:E").format.columnWidth = 18;
modelSheet.getRange("F:F").format.columnWidth = 14;
modelSheet.getRange("G:G").format.columnWidth = 58;
modelSheet.getRange("H:H").format.columnWidth = 3;
modelSheet.getRange("I:K").format.columnWidth = 24;
modelSheet.getRange("L:L").format.columnWidth = 32;
modelSheet.getRange("M:M").format.columnWidth = 58;

// Dictionaries
const predicateOperators = [
  { code: "eq", label: "Exact scalar equality" },
  { code: "intersects", label: "At least one list value matches" },
  { code: "matches_scope", label: "Resolve a citizenship group against current facts" },
  { code: "matches_route_family", label: "Match an exact route or reviewed route family" },
  { code: "satisfies", label: "Evaluate a structured family, employer, institution or asset condition" },
];
const dictionaryRows = [];
for (const [dictionary, entries] of Object.entries({ ...model.enums, predicate_operators: predicateOperators })) {
  for (const rawEntry of entries) {
    const entry = typeof rawEntry === "string"
      ? { code: rawEntry, label: rawEntry.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase()) }
      : rawEntry;
    dictionaryRows.push([dictionary, entry.code, entry.label, entry.description || entry.meaning || "", model.schema_version]);
  }
}
const dictionaryHeaders = ["dictionary", "code", "label", "meaning", "schema_version"];
title(dictionariesSheet, "Stable dictionaries and predicate operators", "E");
dictionariesSheet.getRange("A4:E4").values = [dictionaryHeaders];
dictionariesSheet.getRangeByIndexes(4, 0, dictionaryRows.length, dictionaryHeaders.length).values = dictionaryRows;
styleHeader(dictionariesSheet.getRange("A4:E4"));
styleBody(dictionariesSheet.getRangeByIndexes(4, 0, dictionaryRows.length, dictionaryHeaders.length), 26);
dictionariesSheet.tables.add(`A4:E${dictionaryRows.length + 4}`, true, "DictionariesTable");
dictionariesSheet.freezePanes.freezeRows(4);
dictionariesSheet.freezePanes.freezeColumns(2);
dictionariesSheet.getRange("A:A").format.columnWidth = 28;
dictionariesSheet.getRange("B:B").format.columnWidth = 30;
dictionariesSheet.getRange("C:C").format.columnWidth = 46;
dictionariesSheet.getRange("D:D").format.columnWidth = 68;
dictionariesSheet.getRange("E:E").format.columnWidth = 16;

await workbook.recalculate();

const errorValues = [];
for (const sheet of workbook.worksheets.items) {
  const used = sheet.getUsedRange();
  for (const [rowIndex, row] of (used?.values || []).entries()) {
    for (const [columnIndex, value] of row.entries()) {
      if (typeof value === "string" && /^#(REF!|DIV\/0!|VALUE!|NAME\?|N\/A|NUM!|NULL!)/.test(value)) {
        errorValues.push(`${sheet.name}!${colLetter(columnIndex)}${rowIndex + 1}:${value}`);
      }
    }
  }
}
if (errorValues.length) throw new Error(`Formula errors: ${errorValues.join(", ")}`);

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(previewDir, { recursive: true });
for (const sheet of workbook.worksheets.items) {
  const preview = await workbook.render({ sheetName: sheet.name, autoCrop: "all", scale: 0.75, format: "png" });
  await fs.writeFile(path.join(previewDir, `${sheet.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`), new Uint8Array(await preview.arrayBuffer()));
}

const overviewInspect = await workbook.inspect({ kind: "region", sheetId: "Overview", range: "A1:C26", maxChars: 6500 });
const coverageInspect = await workbook.inspect({ kind: "region", sheetId: "Coverage", range: "A1:M12", maxChars: 6500 });
console.log(overviewInspect.ndjson || overviewInspect);
console.log(coverageInspect.ndjson || coverageInspect);

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);

const imported = await SpreadsheetFile.importXlsx(await FileBlob.load(outputPath));
const importedInspect = await imported.inspect({ kind: "workbook,sheet,table", maxChars: 9000, tableMaxRows: 3, tableMaxCols: 8 });
console.log(importedInspect.ndjson || importedInspect);
console.log(JSON.stringify({ outputPath, previewDir, rules: rules.length, countries: countries.length, sources: sources.length }, null, 2));
