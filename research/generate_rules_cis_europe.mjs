import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const VERIFIED = "2026-11-16";

const sources = [];

function addSource(source_id, authority, title, url, jurisdiction, language = "en", source_type = "official_guidance", notes = "") {
  sources.push({
    source_id,
    authority,
    title,
    url,
    jurisdiction,
    language,
    publication_or_effective_date: null,
    last_verified: VERIFIED,
    source_type,
    notes,
  });
}

// Russia
addSource("RU-115-FZ-A5", "Russian Federation", "115-FZ Article 5 — temporary stay", "https://www.consultant.ru/document/cons_doc_LAW_37868/e9d581e7e11d7901295efd89c869ae044dd3d20f/", "RU", "ru", "official_legal_text");
addSource("RU-115-FZ-A13", "Russian Federation", "115-FZ Article 13 — foreign employment and exemptions", "https://www.consultant.ru/document/cons_doc_LAW_37868/c137c6f66afe76bc2b195f1d1743662a5fc3d372/", "RU", "ru", "official_legal_text");
addSource("RU-115-FZ-A13-3", "Russian Federation", "115-FZ Article 13.3 — patent route", "https://www.consultant.ru/document/cons_doc_LAW_37868/78903dca1f0ac1f3abc08d2f8cd1c0e2fddc826b/", "RU", "ru", "official_legal_text");
addSource("RU-115-FZ-A6", "Russian Federation", "115-FZ Article 6 — temporary residence permit", "https://www.consultant.ru/document/cons_doc_LAW_37868/c9b9574537c49598dac3a13845550e8995a3f405/", "RU", "ru", "official_legal_text");
addSource("RU-115-FZ-A6-2", "Russian Federation", "115-FZ Article 6.2 — education temporary residence", "https://www.consultant.ru/document/cons_doc_LAW_37868/a5e94ef8da2b4889c86521be15c448d51f4f30c3/", "RU", "ru", "official_legal_text");
addSource("RU-115-FZ-A8", "Russian Federation", "115-FZ Article 8 — residence permit", "https://www.consultant.ru/document/cons_doc_LAW_37868/cd5e24d0cd9cb837fa7a84e8f45ab9df1a3dbbbb/", "RU", "ru", "official_legal_text");
addSource("RU-109-FZ-REG", "Russian Federation", "109-FZ migration-registration rules", "https://www.consultant.ru/document/cons_doc_LAW_65707/fae587ce7120a45554e98af00cc6d09cae10d27f/", "RU", "ru", "official_legal_text");
addSource("EAEU-WORK-QA", "Eurasian Economic Commission", "EAEU worker migration Q&A", "https://eec.eaeunion.org/upload/medialibrary/a53/voprosy_migratsii.pdf", "EAEU", "ru", "official_guidance", "Supports the treaty-based work-authorization distinction for EAEU workers; check current treaty applicability.");

// CIS-region matrix sources.
addSource("UZ-ENTRY-WORK", "Uzbekistan Government Services Portal", "Entry, registration and employment of foreign citizens", "https://my.gov.uz/en/life-situations/6c33a349-31ba-4b9e-8693-b77b63200cba", "UZ");
addSource("UZ-VISA", "Ministry of Foreign Affairs of Uzbekistan", "Visa categories", "https://gov.uz/en/mfa/pages/o-zbekiston-respublikasi-vizasi", "UZ");
addSource("UZ-RESIDENCE", "Government of Uzbekistan", "Residence permit for foreign citizens", "https://gov.uz/en/advice/61/document/2030", "UZ");
addSource("UZ-FOREIGNERS", "Uzbekistan Government Services Portal", "Services and identification for foreigners", "https://my.gov.uz/uz/for-foreigners", "UZ", "uz");

addSource("KZ-ENTRY-STAY", "eGov Kazakhstan", "Entry, stay and temporary residence bases", "https://egov.kz/cms/en/articles/move_abroad/exit-entry_of_foreign_nationals", "KZ");
addSource("KZ-RESIDENCE", "eGov Kazakhstan", "Residence permit", "https://beta.egov.kz/situations/149/420?lang=en", "KZ");
addSource("KZ-LABOR", "eGov Kazakhstan", "Labor-immigrant permit", "https://egov.kz/cms/ru/services/legal_relations/38-1_mvd", "KZ", "ru");

addSource("KG-STAY", "Cabinet of Ministers of Kyrgyzstan", "Rules of stay for foreign citizens", "https://www.gov.kg/ru/npa/s/4495", "KG", "ru", "official_legal_text");
addSource("KG-UNIFIED-PERMIT", "Ministry of Justice of Kyrgyzstan", "Unified permit and resident-card regulation", "https://cbd.minjust.gov.kg/230045488/edition/52377/ru", "KG", "ru", "official_legal_text");
addSource("KG-RESIDENCE", "Ministry of Digital Development of Kyrgyzstan", "Residence-permit eligibility FAQ", "https://digital.gov.kg/chavo-vnzh/kto-mozhet-poluchit-vid-na-zhitelstvo-v-kyrgyzskoj-respublike-2/", "KG", "ru");
addSource("KG-EAEU-WORK", "National Investment Agency of Kyrgyzstan", "Labour and EAEU exemption", "https://invest.gov.kg/en/invest-compass/people/labor", "KG");

addSource("TJ-STAY", "Migration Service of Tajikistan", "Rules of stay for foreign citizens", "https://migration.tj/%D0%BF%D1%80%D0%B0%D0%B2%D0%B8%D0%BB%D0%B0-%D0%BF%D1%80%D0%B5%D0%B1%D1%8B%D0%B2%D0%B0%D0%BD%D0%B8%D1%8F-%D0%B8%D0%BD%D0%BE%D1%81%D1%82%D1%80%D0%B0%D0%BD%D0%BD%D1%8B%D1%85-%D0%B3%D1%80%D0%B0%D0%B6/", "TJ", "ru");
addSource("TJ-WORK", "Migration Service of Tajikistan", "Work permit for foreign citizens", "https://migration.tj/i%D2%B7ozat-baroi-kor-ba-sha%D2%B3rvandoni-hori%D2%B7/", "TJ", "tg");
addSource("TJ-STATUS", "Migration Service of Tajikistan", "Legal status of foreign citizens", "https://migration.tj/%D0%B7%D0%B0%D0%BA%D0%BE%D0%BD-%D1%80%D0%B5%D1%81%D0%BF%D1%83%D0%B1%D0%BB%D0%B8%D0%BA%D0%B8-%D1%82%D0%B0%D0%B4%D0%B6%D0%B8%D0%BA%D0%B8%D1%81%D1%82%D0%B0%D0%BD-%D0%BE-%D0%BF%D1%80%D0%B0%D0%B2%D0%BE/", "TJ", "ru", "official_legal_text");

addSource("AM-RESIDENCE", "Migration and Citizenship Service of Armenia", "Residence application", "https://migration.e-gov.am/en/service/residency_application/info", "AM");
addSource("AM-WORK", "Migration and Citizenship Service of Armenia", "Employment residence and work permit", "https://migration.e-gov.am/en/service/work_permits/info", "AM");
addSource("AM-EAEU-WORK", "Eurasian Economic Commission", "EAEU worker migration Q&A", "https://eec.eaeunion.org/upload/medialibrary/a53/voprosy_migratsii.pdf", "AM", "ru", "official_guidance");

addSource("AZ-REGISTRATION", "State Migration Service of Azerbaijan", "Place-of-stay registration FAQ", "https://www.migration.gov.az/en/questions", "AZ");
addSource("AZ-TEMP-RESIDENCE", "State Migration Service of Azerbaijan", "Temporary-residence grounds", "https://migration.gov.az/en/page/73", "AZ");
addSource("AZ-WORK", "State Migration Service of Azerbaijan", "Paid work and permits", "https://migration.gov.az/en/useful_detail/606", "AZ");
addSource("AZ-MIGRATION-CODE", "State Migration Service of Azerbaijan", "Migration Code", "https://www.migration.gov.az/content/pdf/M%C9%99c%C9%99ll%C9%99%20ENG%202-edited.pdf", "AZ", "en", "official_legal_text");

addSource("BY-STAY", "Brest Regional Citizenship and Migration Service", "Temporary stay", "https://www.bpwbrest.by/legalization/temporary_stay.html?lang=ru", "BY", "ru");
addSource("BY-TEMP-RESIDENCE", "Brest Regional Citizenship and Migration Service", "Temporary residence", "https://www.bpwbrest.by/legalization/temporary_residence.html", "BY", "ru");
addSource("BY-PERM-RESIDENCE", "Brest Regional Citizenship and Migration Service", "Permanent residence", "https://www.bpwbrest.by/legalization/permanent_residence.html", "BY", "ru");
addSource("BY-WORK", "Brest Regional Citizenship and Migration Service", "Foreign employment and EAEU exception", "https://www.bpwbrest.by/employment.html?lang=ru", "BY", "ru");

addSource("MD-STAY", "General Inspectorate for Migration of Moldova", "Right to stay and residence bases", "https://igm.gov.md/en/services/right-to-stay", "MD");
addSource("MD-WORK", "General Inspectorate for Migration of Moldova", "Migrant worker route", "https://igm.gov.md/en/services/right-to-stay/migrant-worker", "MD");
addSource("MD-DOCUMENTS", "General Inspectorate for Migration of Moldova", "Foreigner residence documents", "https://igm.gov.md/en/services/foreigners-documentation", "MD");

addSource("GE-RESIDENCE", "Public Service Development Agency of Georgia", "Residence permits", "https://sda.gov.ge/en/products/migration-residence-permits/", "GE");
addSource("GE-WORK", "Public Service Development Agency of Georgia", "Work-residence legislative update", "https://sda.gov.ge/en/an-amendment-has-been-made-to-the-legislation-regarding-the-process-of-obtaining-a-work-residence-permit/", "GE");
addSource("GE-ENTRY", "Public Service Development Agency of Georgia", "Migration and residence services", "https://sda.gov.ge/en/products/migration-residence-permits/", "GE", "en", "official_guidance", "General residence source; entry/stay details require a separate current route check.");

// Turkmenistan: fresh official State Migration Service and embassy research.
addSource("TM-REGISTRATION", "State Migration Service of Turkmenistan", "Registration of foreign citizens at place of stay", "https://migration.gov.tm/services/salgylar-boyunca-hasaba-durmak-tm-16830101021174743", "TM", "tk", "official_guidance", "States the three-working-day registration rule for foreign citizens staying more than three working days; entry day is excluded.");
addSource("TM-WORK", "State Migration Service of Turkmenistan", "Work permit for foreign citizens", "https://migration.gov.tm/services/is-rugsatnamasy-1686380235882169", "TM", "tk", "official_guidance", "Employer-filed work-permit service; source is Turkmen-language and needs translation/legal review before publication.");
addSource("TM-VISA", "Embassy of Turkmenistan in Turkey", "Visa requirements and visa categories", "https://turkey.tmembassy.gov.tm/index.php/en/consular-services/konsullyk-hyzmatlary/visa-requirements", "TM");
addSource("TM-RESIDENCE", "Government of Turkmenistan", "Residence permits for foreign citizens", "https://turkmenistan.gov.tm/index.php/en/post/75875/group-foreign-citizens-has-been-given-permission-reside-our-country", "TM", "en", "official_news", "Confirms a residence-permit process exists but does not provide a complete applicant route or evidence list.");

// Europe: matrix sources plus national route portals where the matrix identified a general route chooser.
addSource("EU-FREE-MOVEMENT", "European Union", "Residence rights when living abroad in the EU", "https://europa.eu/youreurope/citizens/residence/residence-rights/index_en.htm", "EU", "en", "official_supranational_guidance", "General EU free-movement framework; country registration and family-member implementation must also be resolved nationally.");
addSource("DE-EU-WORK", "European Commission", "EU Immigration Portal — employed worker in Germany", "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-germany_en", "DE", "en", "official_supranational_guidance");
addSource("DE-NATIONAL", "German Federal Government", "Make it in Germany — immigration route portal", "https://www.make-it-in-germany.com/en/", "DE");
addSource("FR-EU-WORK", "European Commission", "EU Immigration Portal — employed worker in France", "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-france_en", "FR", "en", "official_supranational_guidance");
addSource("FR-NATIONAL", "Government of France", "France-Visas — official visa portal", "https://france-visas.gouv.fr/en/web/france-visas/", "FR");
addSource("ES-EU-WORK", "European Commission", "EU Immigration Portal — employed worker in Spain", "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-spain_en", "ES", "en", "official_supranational_guidance");
addSource("ES-NATIONAL", "Ministry of Inclusion, Social Security and Migration of Spain", "Living in Spain — immigration authorisations", "https://www.inclusion.gob.es/web/migraciones/vivir-en-espana", "ES", "es");
addSource("PT-EU-WORK", "European Commission", "EU Immigration Portal — employed worker in Portugal", "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-portugal_en", "PT", "en", "official_supranational_guidance");
addSource("PT-NATIONAL", "Agency for Integration, Migration and Asylum of Portugal", "Living in Portugal", "https://aima.gov.pt/pt/viver", "PT", "pt");
addSource("IT-EU-WORK", "European Commission", "EU Immigration Portal — employed worker in Italy", "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-italy_en", "IT", "en", "official_supranational_guidance");
addSource("IT-NATIONAL", "Ministry of Foreign Affairs and International Cooperation of Italy", "Visa for Italy — official route portal", "https://vistoperitalia.esteri.it/home/en", "IT");
addSource("NL-EU-WORK", "European Commission", "EU Immigration Portal — employed worker in the Netherlands", "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-netherlands_en", "NL", "en", "official_supranational_guidance");
addSource("NL-NATIONAL", "Immigration and Naturalisation Service of the Netherlands", "Residence permits", "https://ind.nl/en/residence-permits", "NL");
addSource("BE-EU-WORK", "European Commission", "EU Immigration Portal — employed worker in Belgium", "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-belgium_en", "BE", "en", "official_supranational_guidance");
addSource("BE-NATIONAL", "Immigration Office of Belgium", "Third-country nationals", "https://dofi.ibz.be/en/themes/third-country-nationals", "BE");
addSource("AT-EU-WORK", "European Commission", "EU Immigration Portal — employed worker in Austria", "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-austria_en", "AT", "en", "official_supranational_guidance");
addSource("AT-NATIONAL", "Austrian Federal Government", "Migration to Austria — types of immigration", "https://www.migration.gv.at/en/types-of-immigration/", "AT");
addSource("CH-ENTRY", "State Secretariat for Migration of Switzerland", "Entry", "https://www.sem.admin.ch/en/entry", "CH");
addSource("CH-WORK", "State Secretariat for Migration of Switzerland", "Working in Switzerland", "https://www.sem.admin.ch/sem/en/home/overview-arbeit.html", "CH");
addSource("CH-EU-EFTA", "State Secretariat for Migration of Switzerland", "EU/EFTA citizens living and working in Switzerland", "https://www.sem.admin.ch/en/eu-efta-citizens-living-and-working-in-switzerland", "CH");
addSource("CZ-EU-WORK", "European Commission", "EU Immigration Portal — employed worker in Czechia", "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-czechia_en", "CZ", "en", "official_supranational_guidance");
addSource("CZ-NATIONAL", "Ministry of the Interior of Czechia", "Foreigners portal", "https://frs.gov.cz/en/", "CZ");
addSource("PL-EU-WORK", "European Commission", "EU Immigration Portal — employed worker in Poland", "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-poland_en", "PL", "en", "official_supranational_guidance");
addSource("PL-NATIONAL", "Office for Foreigners of Poland", "Official foreigners portal", "https://www.gov.pl/web/udsc-en", "PL");
addSource("IE-REGISTRATION", "Irish Immigration Service Delivery", "Registering immigration permission", "https://www.irishimmigration.ie/registering-your-immigration-permission/", "IE");
addSource("IE-STAMPS", "Irish Immigration Service Delivery", "Immigration permission stamps", "https://www.irishimmigration.ie/registering-your-immigration-permission/information-on-registering/immigration-permission-stamps/", "IE");
addSource("IE-WORK", "Department of Enterprise, Trade and Employment of Ireland", "Immigration and employment permits", "https://enterprise.gov.ie/en/what-we-do/workplace-and-skills/employment-permits/employment-permit-eligibility/immigration-employment-permits/", "IE");
addSource("GB-VISAS", "Government of the United Kingdom", "Visas and immigration", "https://www.gov.uk/browse/visas-immigration", "GB");
addSource("GB-VISA-CHECK", "Government of the United Kingdom", "Check if a UK visa is needed", "https://www.gov.uk/check-uk-visa", "GB");
addSource("SE-ROUTES", "Swedish Migration Agency", "Apply route chooser", "https://www.migrationsverket.se/en/you-want-to-apply.html", "SE");
addSource("SE-WORK", "Swedish Migration Agency", "Work routes", "https://www.migrationsverket.se/en/you-want-to-apply/work.html", "SE");
addSource("NO-ROUTES", "Norwegian Directorate of Immigration", "Want to apply", "https://www.udi.no/en/want-to-apply/", "NO");
addSource("FI-EU-WORK", "European Commission", "EU Immigration Portal — employed worker in Finland", "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-finland_en", "FI", "en", "official_supranational_guidance");
addSource("FI-MIGRI", "Finnish Immigration Service", "Immigration route portal", "https://migri.fi/en/home", "FI");
addSource("FI-EU", "Finnish Immigration Service", "EU citizen registration", "https://migri.fi/en/eu-citizen", "FI");
addSource("DK-ROUTES", "Danish Immigration Service and SIRI", "New to Denmark — route chooser", "https://nyidanmark.dk/en-GB/You-want-to-apply", "DK");
addSource("GR-EU-WORK", "European Commission", "EU Immigration Portal — employed worker in Greece", "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-greece_en", "GR", "en", "official_supranational_guidance");
addSource("GR-NATIONAL", "Ministry of Migration and Asylum of Greece", "Official migration portal", "https://migration.gov.gr/en/", "GR");
addSource("CY-EU-WORK", "European Commission", "EU Immigration Portal — employed worker in Cyprus", "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-cyprus_en", "CY", "en", "official_supranational_guidance");
addSource("CY-AUTHORITY", "European Commission", "EU Immigration Portal — Cyprus authorities", "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/who-does-what/cyprus_en", "CY", "en", "official_supranational_guidance");
addSource("EE-EU-WORK", "European Commission", "EU Immigration Portal — employed worker in Estonia", "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-estonia_en", "EE", "en", "official_supranational_guidance");
addSource("EE-ALIENS-ACT", "Riigi Teataja", "Estonian Aliens Act", "https://www.riigiteataja.ee/en/akt/501092026001", "EE", "en", "official_legal_text");
addSource("EE-DOCUMENTS", "Estonian ID Authority", "Foreign nationals' identity and residence documents", "https://www.id.ee/en/article/foreign-nationals-residing-in-estonia-and-their-documents/", "EE");

const countries = [
  { code: "RU", level: "national", scope: "non_destination_citizen", entry: ["RU-115-FZ-A5", "RU-109-FZ-REG"], work: ["RU-115-FZ-A13"], study: ["RU-115-FZ-A5", "RU-115-FZ-A6-2"], family: ["RU-115-FZ-A6", "RU-115-FZ-A8"], residence: ["RU-115-FZ-A6", "RU-115-FZ-A8"], status: "mapped" },
  { code: "UZ", level: "national", scope: "non_destination_citizen", entry: ["UZ-ENTRY-WORK", "UZ-VISA"], work: ["UZ-ENTRY-WORK"], study: ["UZ-VISA"], family: ["UZ-VISA", "UZ-RESIDENCE"], residence: ["UZ-RESIDENCE", "UZ-FOREIGNERS"] },
  { code: "KZ", level: "national", scope: "route_dependent", entry: ["KZ-ENTRY-STAY"], work: ["KZ-LABOR", "KZ-ENTRY-STAY"], study: ["KZ-ENTRY-STAY"], family: ["KZ-ENTRY-STAY"], residence: ["KZ-RESIDENCE"] },
  { code: "KG", level: "national", scope: "route_dependent", entry: ["KG-STAY"], work: ["KG-UNIFIED-PERMIT", "KG-EAEU-WORK"], study: ["KG-UNIFIED-PERMIT"], family: ["KG-UNIFIED-PERMIT", "KG-RESIDENCE"], residence: ["KG-RESIDENCE"] },
  { code: "TJ", level: "national", scope: "non_destination_citizen", entry: ["TJ-STAY", "TJ-STATUS"], work: ["TJ-WORK", "TJ-STATUS"], study: ["TJ-STATUS"], family: ["TJ-STATUS"], residence: ["TJ-STATUS"] },
  { code: "AM", level: "national", scope: "route_dependent", entry: ["AM-RESIDENCE"], work: ["AM-WORK", "AM-EAEU-WORK"], study: ["AM-RESIDENCE"], family: ["AM-RESIDENCE"], residence: ["AM-RESIDENCE"] },
  { code: "AZ", level: "national", scope: "non_destination_citizen", entry: ["AZ-REGISTRATION", "AZ-MIGRATION-CODE"], work: ["AZ-WORK", "AZ-MIGRATION-CODE"], study: ["AZ-TEMP-RESIDENCE"], family: ["AZ-TEMP-RESIDENCE"], residence: ["AZ-TEMP-RESIDENCE", "AZ-MIGRATION-CODE"] },
  { code: "BY", level: "national", scope: "route_dependent", entry: ["BY-STAY"], work: ["BY-WORK", "EAEU-WORK-QA"], study: ["BY-TEMP-RESIDENCE"], family: ["BY-TEMP-RESIDENCE"], residence: ["BY-PERM-RESIDENCE"] },
  { code: "MD", level: "national", scope: "non_destination_citizen", entry: ["MD-STAY"], work: ["MD-WORK"], study: ["MD-STAY"], family: ["MD-STAY"], residence: ["MD-STAY", "MD-DOCUMENTS"] },
  { code: "GE", level: "national", scope: "non_destination_citizen", entry: ["GE-ENTRY"], work: ["GE-WORK", "GE-RESIDENCE"], study: ["GE-RESIDENCE"], family: ["GE-RESIDENCE"], residence: ["GE-RESIDENCE"] },
  { code: "TM", level: "national", scope: "non_destination_citizen", entry: ["TM-REGISTRATION", "TM-VISA"], work: ["TM-WORK", "TM-VISA"], study: ["TM-VISA"], family: ["TM-VISA"], residence: ["TM-RESIDENCE"], status: "partial" },
  { code: "DE", level: "EU+national", scope: "third_country_national", fm: ["EU-FREE-MOVEMENT", "DE-NATIONAL"], entry: ["DE-NATIONAL"], work: ["DE-EU-WORK", "DE-NATIONAL"], study: ["DE-NATIONAL"], family: ["DE-NATIONAL"], residence: ["DE-NATIONAL"] },
  { code: "FR", level: "EU+national", scope: "third_country_national", fm: ["EU-FREE-MOVEMENT", "FR-NATIONAL"], entry: ["FR-NATIONAL"], work: ["FR-EU-WORK", "FR-NATIONAL"], study: ["FR-NATIONAL"], family: ["FR-NATIONAL"], residence: ["FR-NATIONAL"] },
  { code: "ES", level: "EU+national", scope: "third_country_national", fm: ["EU-FREE-MOVEMENT", "ES-NATIONAL"], entry: ["ES-NATIONAL"], work: ["ES-EU-WORK", "ES-NATIONAL"], study: ["ES-NATIONAL"], family: ["ES-NATIONAL"], residence: ["ES-NATIONAL"] },
  { code: "PT", level: "EU+national", scope: "third_country_national", fm: ["EU-FREE-MOVEMENT", "PT-NATIONAL"], entry: ["PT-NATIONAL"], work: ["PT-EU-WORK", "PT-NATIONAL"], study: ["PT-NATIONAL"], family: ["PT-NATIONAL"], residence: ["PT-NATIONAL"] },
  { code: "IT", level: "EU+national", scope: "third_country_national", fm: ["EU-FREE-MOVEMENT", "IT-NATIONAL"], entry: ["IT-NATIONAL"], work: ["IT-EU-WORK", "IT-NATIONAL"], study: ["IT-NATIONAL"], family: ["IT-NATIONAL"], residence: ["IT-NATIONAL"] },
  { code: "NL", level: "EU+national", scope: "third_country_national", fm: ["EU-FREE-MOVEMENT", "NL-NATIONAL"], entry: ["NL-NATIONAL"], work: ["NL-EU-WORK", "NL-NATIONAL"], study: ["NL-NATIONAL"], family: ["NL-NATIONAL"], residence: ["NL-NATIONAL"] },
  { code: "BE", level: "EU+national+regional", scope: "third_country_national", fm: ["EU-FREE-MOVEMENT", "BE-NATIONAL"], entry: ["BE-NATIONAL"], work: ["BE-EU-WORK", "BE-NATIONAL"], study: ["BE-NATIONAL"], family: ["BE-NATIONAL"], residence: ["BE-NATIONAL"] },
  { code: "AT", level: "EU+national", scope: "third_country_national", fm: ["EU-FREE-MOVEMENT", "AT-NATIONAL"], entry: ["AT-NATIONAL"], work: ["AT-EU-WORK", "AT-NATIONAL"], study: ["AT-NATIONAL"], family: ["AT-NATIONAL"], residence: ["AT-NATIONAL"] },
  { code: "CH", level: "national+cantonal", scope: "route_dependent", fm: ["CH-EU-EFTA"], entry: ["CH-ENTRY"], work: ["CH-WORK", "CH-EU-EFTA"], study: ["CH-ENTRY"], family: ["CH-ENTRY", "CH-EU-EFTA"], residence: ["CH-ENTRY"] },
  { code: "CZ", level: "EU+national", scope: "third_country_national", fm: ["EU-FREE-MOVEMENT", "CZ-NATIONAL"], entry: ["CZ-NATIONAL"], work: ["CZ-EU-WORK", "CZ-NATIONAL"], study: ["CZ-NATIONAL"], family: ["CZ-NATIONAL"], residence: ["CZ-NATIONAL"] },
  { code: "PL", level: "EU+national+regional", scope: "third_country_national", fm: ["EU-FREE-MOVEMENT", "PL-NATIONAL"], entry: ["PL-NATIONAL"], work: ["PL-EU-WORK", "PL-NATIONAL"], study: ["PL-NATIONAL"], family: ["PL-NATIONAL"], residence: ["PL-NATIONAL"] },
  { code: "IE", level: "national", scope: "route_dependent", fm: ["EU-FREE-MOVEMENT", "IE-REGISTRATION"], entry: ["IE-REGISTRATION", "IE-STAMPS"], work: ["IE-WORK", "IE-STAMPS"], study: ["IE-STAMPS"], family: ["IE-STAMPS"], residence: ["IE-REGISTRATION", "IE-STAMPS"] },
  { code: "GB", level: "national", scope: "route_dependent", entry: ["GB-VISA-CHECK", "GB-VISAS"], work: ["GB-VISAS"], study: ["GB-VISAS"], family: ["GB-VISAS"], residence: ["GB-VISAS"] },
  { code: "SE", level: "EU+national", scope: "route_dependent", fm: ["EU-FREE-MOVEMENT", "SE-ROUTES"], entry: ["SE-ROUTES"], work: ["SE-WORK", "SE-ROUTES"], study: ["SE-ROUTES"], family: ["SE-ROUTES"], residence: ["SE-ROUTES"] },
  { code: "NO", level: "EEA+national", scope: "route_dependent", fm: ["NO-ROUTES"], entry: ["NO-ROUTES"], work: ["NO-ROUTES"], study: ["NO-ROUTES"], family: ["NO-ROUTES"], residence: ["NO-ROUTES"] },
  { code: "FI", level: "EU+national", scope: "route_dependent", fm: ["EU-FREE-MOVEMENT", "FI-EU"], entry: ["FI-MIGRI", "FI-EU"], work: ["FI-EU-WORK", "FI-MIGRI"], study: ["FI-MIGRI"], family: ["FI-MIGRI"], residence: ["FI-MIGRI", "FI-EU"] },
  { code: "DK", level: "EU+national", scope: "route_dependent", fm: ["EU-FREE-MOVEMENT", "DK-ROUTES"], entry: ["DK-ROUTES"], work: ["DK-ROUTES"], study: ["DK-ROUTES"], family: ["DK-ROUTES"], residence: ["DK-ROUTES"] },
  { code: "GR", level: "EU+national", scope: "third_country_national", fm: ["EU-FREE-MOVEMENT", "GR-NATIONAL"], entry: ["GR-NATIONAL"], work: ["GR-EU-WORK", "GR-NATIONAL"], study: ["GR-NATIONAL"], family: ["GR-NATIONAL"], residence: ["GR-NATIONAL"] },
  { code: "CY", level: "EU+national", scope: "third_country_national", fm: ["EU-FREE-MOVEMENT", "CY-AUTHORITY"], entry: ["CY-AUTHORITY"], work: ["CY-EU-WORK", "CY-AUTHORITY"], study: ["CY-AUTHORITY"], family: ["CY-AUTHORITY"], residence: ["CY-AUTHORITY"] },
  { code: "EE", level: "EU+national", scope: "third_country_national", fm: ["EU-FREE-MOVEMENT", "EE-ALIENS-ACT"], entry: ["EE-ALIENS-ACT"], work: ["EE-EU-WORK", "EE-ALIENS-ACT"], study: ["EE-ALIENS-ACT"], family: ["EE-ALIENS-ACT"], residence: ["EE-ALIENS-ACT", "EE-DOCUMENTS"] },
];

const routeNames = {
  fm: "Check EU/EEA/Swiss free-movement residence and registration route",
  entry: "Check visa, authorized stay and registration route",
  work: "Check work authorization or exemption route",
  study: "Check study residence route and institution evidence",
  family: "Check family residence route and sponsor evidence",
  residence: "Check temporary, long-term or permanent residence route",
};

const routePurposes = { fm: "free_movement", entry: "visit", work: "work", study: "study", family: "family", residence: "long_term" };
const routeActors = { fm: "mobile_citizen_or_qualifying_family_member", entry: "traveller_and_receiving_party", work: "worker_and_employer", study: "student_and_institution", family: "applicant_and_family_sponsor", residence: "applicant" };
const routeTriggers = { fm: "planned_move_or_residence_start", entry: "planned_entry_or_address_change", work: "employment_offer_or_work_start", study: "admission_or_enrolment", family: "family_reunification_intent", residence: "residence_status_intent_or_expiry" };
const routeEvidence = {
  fm: ["citizenship_or_qualifying_family_link", "host_country", "residence_purpose", "planned_duration", "local_registration_facts"],
  entry: ["citizenship", "travel_document", "entry_basis", "arrival_date", "accommodation_or_receiving_party"],
  work: ["citizenship", "current_status", "employment_type", "employer", "work_location", "route_or_exemption"],
  study: ["citizenship", "current_status", "institution", "programme", "study_mode", "admission_or_enrolment"],
  family: ["citizenship", "current_status", "relationship", "sponsor_citizenship_or_status", "dependency_when_applicable"],
  residence: ["citizenship", "current_status", "intended_duration", "selected_statutory_ground", "locality_when_applicable"],
};

const specialRoutes = {
  RU: { entry: "RU.short_stay.resolve", work: "RU.work.resolve_category", study: "RU.study.temporary_stay", family: "RU.family.resolve_ground", residence: "RU.residence.resolve_rvp_rvpo_vnzh" },
  UZ: { entry: "UZ.entry.visa_or_visa_free", work: "UZ.work.confirmation", study: "UZ.study.visa_or_residence", family: "UZ.family.visa_or_residence", residence: "UZ.residence.foreigner_permit" },
  KZ: { entry: "KZ.entry_and_trp.resolve", work: "KZ.work.employer_or_labor_immigrant", study: "KZ.residence.study", family: "KZ.residence.family", residence: "KZ.residence.permanent" },
  KG: { entry: "KG.stay.registration", work: "KG.work.unified_permit_or_eaeu", study: "KG.residence.study", family: "KG.residence.family", residence: "KG.residence.temporary_or_permanent" },
  AM: { entry: "AM.stay.resolve", work: "AM.work.permit_or_eaeu", study: "AM.residence.study", family: "AM.residence.family", residence: "AM.residence.temporary_permanent_special" },
  AZ: { entry: "AZ.stay.registration", work: "AZ.work.permit_and_residence", study: "AZ.residence.study", family: "AZ.residence.family", residence: "AZ.residence.temporary_or_permanent" },
  BY: { entry: "BY.stay.registration", work: "BY.work.special_permit_or_eaeu", study: "BY.residence.study", family: "BY.residence.family", residence: "BY.residence.permanent" },
  MD: { entry: "MD.stay.resolve", work: "MD.residence.migrant_worker", study: "MD.residence.study", family: "MD.residence.family_reunification", residence: "MD.residence.provisional_or_permanent" },
  GE: { entry: "GE.stay.resolve", work: "GE.residence.work", study: "GE.residence.study", family: "GE.residence.family_reunification", residence: "GE.residence.resolve_category" },
  TM: { entry: "TM.entry.visa_and_registration", work: "TM.work.work_permit", study: "TM.visa.student", family: "TM.visa.family", residence: "TM.residence.permit" },
  IE: { entry: "IE.permission.registration", work: "IE.work.permission_and_employment_permit", study: "IE.permission.study", family: "IE.permission.family", residence: "IE.permission.long_term" },
  GB: { entry: "GB.entry.visa_eta_or_exempt", work: "GB.work.resolve_route", study: "GB.study.student", family: "GB.family.resolve_route", residence: "GB.settlement.resolve_route" },
};

function predicate(code, purpose, scope) {
  return {
    all: [
      { field: "destination_country", op: "eq", value: code },
      { field: "purpose", op: "eq", value: purpose },
      { field: "citizenship_scope", op: "resolve", value: scope },
    ],
  };
}

function makeRule(country, family) {
  const code = country.code;
  const routeCode = specialRoutes[code]?.[family] || `${code}.${family}.official_route_check`;
  return {
    rule_id: `${code.toLowerCase()}_${family}_route_family`,
    destination_country: code,
    authority_level: country.level,
    citizenship_scope_type: family === "fm" ? "EU_EEA_Swiss_or_qualifying_family_member" : country.scope,
    citizenship_values: [],
    residence_or_entry_scope: family === "entry" ? "entry_or_temporary_stay" : family === "fm" ? "free_movement_residence_or_registration" : "residence_or_status_application",
    purpose: routePurposes[family],
    route_code: routeCode,
    person_role: "foreign_national_or_non_domestic_route_user",
    family_condition: family === "family" ? "verified_relationship_and_sponsor_status_required" : null,
    employer_condition: family === "work" ? "employer_or_exemption_facts_required" : null,
    institution_condition: family === "study" ? "institution_and_programme_facts_required" : null,
    asset_type: null,
    asset_condition: null,
    condition_expression: predicate(code, routePurposes[family], family === "fm" ? "EU_EEA_Swiss_or_qualifying_family_member" : country.scope),
    requirement_type: family === "entry" ? "entry_and_registration_review" : `${family}_route_review`,
    requirement_name: routeNames[family],
    actor: routeActors[family],
    trigger_event: routeTriggers[family],
    deadline_type: "check_official_list",
    deadline_value: null,
    deadline_unit: null,
    recurrence: "event_based",
    required_evidence: routeEvidence[family],
    exceptions: ["Route, nationality, treaty, status, local-authority and transition exceptions must be resolved before treating this item as required."],
    source_ids: country[family],
    effective_from: null,
    effective_to: null,
    last_verified: VERIFIED,
    review_status: country.status || "partial",
    confidence: country.status === "mapped" ? "medium_high" : "medium",
    notes: "Research-map route family. Show as check-applicability until a country reviewer confirms the exact route, evidence list, actor and triggering facts.",
  };
}

const rules = countries.flatMap((country) => [...(country.fm ? ["fm"] : []), "entry", "work", "study", "family", "residence"].map((family) => makeRule(country, family)));

// Russia's patent and conventional work-permit categories are separate predicates.
const ruWorkIndex = rules.findIndex((row) => row.rule_id === "ru_work_route_family");
rules.splice(ruWorkIndex, 1,
  {
    ...makeRule(countries[0], "work"),
    rule_id: "ru_work_patent_route",
    citizenship_scope_type: "visa_free_non_eaeu_non_exempt_worker",
    route_code: "RU.work.patent",
    condition_expression: { all: [
      { field: "destination_country", op: "eq", value: "RU" },
      { field: "purpose", op: "eq", value: "work" },
      { field: "entry_mode", op: "eq", value: "visa_free" },
      { field: "has_eaeu_work_exemption", op: "eq", value: false },
      { field: "has_residence_or_other_work_exemption", op: "eq", value: false },
    ] },
    requirement_type: "work_authorization_route",
    requirement_name: "Confirm Russian work-patent route and its event-triggered evidence list",
    required_evidence: ["citizenship", "entry_mode", "entry_record_when_issued", "work_region", "employment_or_civil_contract", "current_status", "exemption_check"],
    source_ids: ["RU-115-FZ-A13-3", "RU-109-FZ-REG"],
    review_status: "mapped",
    confidence: "high",
    notes: "Patent is not interchangeable with an ordinary work permit. Do not calculate application, payment, contract-copy or notification dates until their specific trigger facts are present.",
  },
  {
    ...makeRule(countries[0], "work"),
    rule_id: "ru_work_permit_category_route",
    citizenship_scope_type: "category_specific_foreign_worker",
    route_code: "RU.work.work_permit.category_required",
    condition_expression: { all: [
      { field: "destination_country", op: "eq", value: "RU" },
      { field: "purpose", op: "eq", value: "work" },
      { field: "work_permit_category", op: "is_known", value: true },
    ] },
    requirement_type: "work_authorization_route",
    requirement_name: "Confirm category-specific Russian work-permit route",
    required_evidence: ["citizenship", "visa_or_entry_mode", "employer", "work_permit_category", "profession_or_qualification", "work_region", "current_status"],
    source_ids: ["RU-115-FZ-A13"],
    review_status: "mapped",
    confidence: "high",
    notes: "Do not present this route as an alternative to a patent until the applicable Article 13 category is selected.",
  },
  {
    ...makeRule(countries[0], "work"),
    rule_id: "ru_work_eaeu_exemption_route",
    citizenship_scope_type: "citizenship_allowlist",
    citizenship_values: ["AM", "BY", "KZ", "KG"],
    route_code: "RU.work.eaeu_exempt",
    condition_expression: { all: [
      { field: "destination_country", op: "eq", value: "RU" },
      { field: "purpose", op: "eq", value: "work" },
      { field: "citizenships", op: "contains_any", value: ["AM", "BY", "KZ", "KG"] },
    ] },
    requirement_type: "work_authorization_exemption_review",
    requirement_name: "Confirm EAEU worker exemption and remaining stay/registration duties",
    required_evidence: ["citizenships", "employment_or_civil_contract", "employer", "entry_and_registration_facts"],
    source_ids: ["RU-115-FZ-A13", "EAEU-WORK-QA", "RU-109-FZ-REG"],
    review_status: "mapped",
    confidence: "high",
    notes: "The work-authorization exemption does not erase migration-registration or lawful-stay requirements.",
  },
);

function setRelativeDeadline(ruleId, value, unit, exceptions, confidence = "high") {
  const row = rules.find((item) => item.rule_id === ruleId);
  row.deadline_type = "relative";
  row.deadline_value = value;
  row.deadline_unit = unit;
  row.exceptions = exceptions;
  row.review_status = "mapped";
  row.confidence = confidence;
}

setRelativeDeadline(
  "ru_entry_route_family",
  7,
  "working_days",
  ["Default migration-registration window is subject to status, accommodation, treaty, receiving-party and other statutory exceptions.", "Trigger is arrival at the actual place of stay, not merely border entry."],
);
setRelativeDeadline(
  "tm_entry_route_family",
  3,
  "working_days",
  ["Official service text applies to foreign citizens/stateless persons arriving for more than three working days.", "The day of entry is excluded.", "Visa category and receiving-party procedure still require resolution."],
);

const sourceIds = new Set(sources.map((source) => source.source_id));
for (const row of rules) {
  for (const sourceId of row.source_ids) {
    if (!sourceIds.has(sourceId)) throw new Error(`Unknown source ${sourceId} in ${row.rule_id}`);
  }
}

const expectedFields = [
  "rule_id", "destination_country", "authority_level", "citizenship_scope_type", "citizenship_values", "residence_or_entry_scope", "purpose", "route_code", "person_role", "family_condition", "employer_condition", "institution_condition", "asset_type", "asset_condition", "condition_expression", "requirement_type", "requirement_name", "actor", "trigger_event", "deadline_type", "deadline_value", "deadline_unit", "recurrence", "required_evidence", "exceptions", "source_ids", "effective_from", "effective_to", "last_verified", "review_status", "confidence", "notes",
];

for (const row of rules) {
  if (Object.keys(row).join("|") !== expectedFields.join("|")) throw new Error(`Field mismatch in ${row.rule_id}`);
}

if (new Set(rules.map((row) => row.rule_id)).size !== rules.length) throw new Error("Duplicate rule_id");
if (new Set(sources.map((row) => row.source_id)).size !== sources.length) throw new Error("Duplicate source_id");

writeFileSync(join(HERE, "rules_cis_europe.json"), `${JSON.stringify(rules, null, 2)}\n`);
writeFileSync(join(HERE, "sources_cis_europe.json"), `${JSON.stringify(sources, null, 2)}\n`);

console.log(JSON.stringify({ countries: new Set(rules.map((row) => row.destination_country)).size, rules: rules.length, sources: sources.length }));
