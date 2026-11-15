# NextDue Europe jurisdiction research matrix

**Reviewed:** 2026-11-15  
**Status:** research map; not a complete or publishable legal pack  
**Countries:** Germany, France, Spain, Portugal, Italy, Netherlands, Belgium, Austria, Switzerland, Czechia, Poland, Ireland, United Kingdom, Sweden, Norway, Finland, Denmark, Greece, Cyprus, Estonia

This document maps official source families, broad residence/legalisation bases, identity-document gates, asset obligation areas, and the facts NextDue must ask for. It deliberately does **not** prescribe deadlines. A deadline, recurrence, grace period, or reminder default belongs in the catalog only after an editor has verified the exact official rule, its effective date, exceptions, and the user's applicability facts.

## Source and system boundaries

- **EU-wide:** free movement gives EU citizens and qualifying family members a different path from third-country nationals. The basis can depend on whether the person is a worker, self-employed, studying, supported by sufficient resources, or joining family. Host-state registration and document formalities remain national. See [Your Europe: residence rights](https://europa.eu/youreurope/citizens/residence/residence-rights/index_en.htm) and [residence documents and formalities](https://europa.eu/youreurope/citizens/residence/documents-formalities/index_en.htm).
- **EU third-country framework:** the [EU Immigration Portal](https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal_en) and its [category guide](https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/what-category-do-i-fit_en) are route indexes, not a substitute for national rules. Common route families include employment, highly qualified work, seasonal work, intra-corporate transfer, research, study, family, and long-term residence. Availability and conditions vary by country.
- **National:** visas, permits, registrations, renewals, changes of basis, tax, vehicle, property, business, and local obligations are implemented nationally and sometimes regionally or municipally.
- **Opt-outs and non-EU systems:** Denmark and Ireland use their own immigration systems for substantial parts of third-country immigration. Norway and Switzerland are not EU members and need their own official route logic. The United Kingdom is a national system.
- **Asset rules:** the EU provides useful cross-border context, but there is no single EU vehicle-registration rule and national testing frequencies can differ. Start with [vehicle registration](https://europa.eu/youreurope/citizens/vehicles/registration/index_en.htm), [registration formalities](https://europa.eu/youreurope/citizens/vehicles/registration/formalities/index_en.htm), and [registration after moving](https://europa.eu/youreurope/citizens/vehicles/registration/registration-abroad/index_en.htm). Business tax and VAT are also country-specific; use [Your Europe: business tax](https://europa.eu/youreurope/business/finance-and-tax/business-tax/index_en.htm) only as an index into national rules.

## Non-negotiable product rules

1. `citizenships[]`, `residences[]`, destinations, and asset jurisdictions are separate many-to-many facts. A person may have several citizenships, several current or historical residence bases, and possessions in any number of countries.
2. A national passport or citizenship identity card is suggested only when `person.citizenships` contains the issuing country. Residence, travel, employment, property ownership, or family ties alone never trigger that suggestion.
3. Residence permits, residence cards, foreigner's identity cards, refugee travel documents, and immigrant passports are status documents. They must not be mislabeled as citizenship documents.
4. A route or permit is not inferred from country alone. The user selects or confirms the basis: EU/EEA/Swiss free movement, employment, self-employment, study, family, visit, protection, permanent/long-term residence, or a country-specific route.
5. Each possession has its own `country`, optional `registrationCountry`, region/municipality, owner, type, subtype, and human label. Obligations attach to the exact possession, not merely to its owner's country.
6. A research-map row may create questions and candidate route families. It must not create a live legal obligation or date until a source-backed catalog entry passes editorial review.

EU travel guidance describes passports and national identity cards as documents carried by EU nationals. NextDue must implement the inverse gate as well: being resident in an EU country does not make the user eligible for that country's passport or national ID. See [Your Europe: travel documents for EU nationals](https://europa.eu/youreurope/citizens/travel/entry-exit/eu-citizen/index_en.htm).

“Identity card” is not one universal eligibility class. Finland can issue a distinct foreigner's identity card to an eligible permanent resident, and Estonia issues different ID/residence-permit credentials to resident foreign nationals; neither is a citizenship passport or ordinary citizen travel document. Portugal also documents a limited Citizen Card path for Brazilian citizens who have been granted the relevant equal-rights status. These must be separate, explicit eligibility rules, never a generic “lives in country” default. See [Finnish Police: foreigner's identity card](https://poliisi.fi/en/how-to-apply-for-an-identity-card), [Estonia: foreign nationals and their documents](https://www.id.ee/en/article/foreign-nationals-residing-in-estonia-and-their-documents/), and [Portugal: first Citizen Card](https://www2.gov.pt/en/servicos/pedir-o-cartao-de-cidadao).

## Reusable codes

### Status-basis families

- **FM:** EU/EEA/Swiss or Nordic free-movement/residence route, including worker, self-employed, student, sufficient-resources, qualifying family member, and permanent-right variants where applicable.
- **VISIT:** short stay, visitor, visa waiver/authorisation, or national visitor permission; never treat this as permission to work.
- **WORK:** employed worker, single/work-and-residence permit, or country-specific employment route.
- **HQ:** highly qualified or skilled route, including EU Blue Card only where the country actually participates and the applicant meets its conditions.
- **TEMP:** seasonal, posted, intra-corporate transfer, working-holiday, or other temporary-work route where available.
- **SELF:** self-employed, entrepreneur, start-up, investor, or business route where available.
- **STUDY:** school, higher education, vocational training, research, or accompanying-family route, kept as distinct subtypes.
- **FAMILY:** spouse/partner, child, parent/dependent, EU-family, sponsor-dependent, or other nationally recognised family basis.
- **LONG:** permanent residence, EU long-term residence where applicable, settlement/indefinite leave, or country-specific long-term status.
- **PROTECT:** asylum, international/temporary protection, humanitarian, or other special status. These require separate, careful catalog review.

These are product taxonomy families, not claims that every route exists in every country.

### Asset-obligation families

- **V — vehicle:** registration/re-registration, ownership or address change, roadworthiness/inspection, mandatory insurance, circulation/registration tax, parking or local permits, licence/permit documents, and import/export formalities.
- **P — property/land:** title/registry facts, municipality and region, property or land tax, owner/occupier status, insurance, rental/landlord registration, local charges, and safety/energy certificates where applicable.
- **B — business/self-employment:** legal form, registration, beneficial/owner role, tax regime, VAT, payroll/social contributions, licences, annual accounts/returns, and registered-office changes.
- **R — other regulated possession:** boat, trailer, aircraft, or another registered/insured/inspected item. Do not create a generic obligation until the subtype and responsible authority are known.

### Base applicability questions

- **Q1 Identity:** all citizenships, including dual nationality; EU/EEA/Swiss, Nordic, British, or Irish status where relevant.
- **Q2 Geography:** current country, destination country, previous country, normal residence, and all relevant arrival/departure dates.
- **Q3 Stay:** intended duration, continuous/temporary stay, and whether the person is already in-country.
- **Q4 Basis:** visit, employment, self-employment, study/research, family relationship, sufficient resources, protection, or long-term status; exact route chosen if already known.
- **Q5 Status document:** issuer country, document kind, status/basis, issue date, printed expiry date, renewal/change application state, and any conditions. Do not collect document numbers by default.
- **Q6 Sponsor:** employer, host entity, school/research body, family sponsor, or self-employment/business facts.
- **Q7 Household:** spouse/partner, children, dependent relatives, citizenships, ages where legally relevant, and whether they accompany or join later.
- **Q8 Local layer:** state/region/canton/autonomous community/voivodeship/municipality and address-change date; store no full address unless a later feature truly requires it.
- **Q9 Asset jurisdiction:** exact asset, owner, country where located, country where registered, acquisition/import/move date, and whether personal or business use.
- **Q10 Asset detail:** type, subtype, make/model or user label, registration/inspection/insurance document kinds, and printed dates. Each car, home, plot, boat, or business is a separate record.
- **Q11 Tax/business:** individual or entity owner, legal form, tax residence/regime, VAT/payroll status, employees, rental activity, and official notice/filing period.
- **Q12 Change event:** employer, school, family, permit basis, address, owner, registration country, or asset-use change. A change may create a new review task even if no deadline is known.

## Country matrix

“Asset prompts” identifies areas to research and ask about. It does not assert that every listed obligation applies.

| Country and system boundary | Broad status bases to model | Citizenship-only identity defaults | Asset prompts | Country-specific applicability additions | Official starting sources |
|---|---|---|---|---|---|
| **Germany** — EU FM plus national implementation of EU/third-country routes | FM; VISIT; WORK; HQ/skilled worker; job-search/opportunity routes only when nationally verified; SELF; STUDY/training/research; FAMILY; LONG; PROTECT | German passport and `Personalausweis` only when `citizenships[]` contains `DE` | V, P, B, R | Q1–Q12; federal state and municipality; regulated profession; qualification recognition; exact employer and employment type | [EU employed-worker page](https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-germany_en); [Make it in Germany](https://www.make-it-in-germany.com/en/) |
| **France** — EU FM plus national immigration system | FM; VISIT; WORK; HQ/talent routes; TEMP; SELF; STUDY/research; FAMILY; LONG; PROTECT | French passport and national identity card only for `FR` citizenship | V, P, B, R | Q1–Q12; prefecture/department/commune; employee vs posted worker; business form; property occupancy and rental use | [EU employed-worker page](https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-france_en) |
| **Spain** — EU FM plus national system; autonomous-community and municipal layers matter | FM; VISIT; WORK; HQ; TEMP; SELF/entrepreneur; STUDY/research; FAMILY; LONG; PROTECT; national special routes only after source verification | Spanish passport and DNI only for `ES` citizenship | V, P, B, R | Q1–Q12; autonomous community, province and municipality; employee vs self-employed; cadastral/municipal property facts; exact vehicle registration country | [EU employed-worker page](https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-spain_en) |
| **Portugal** — EU FM plus national immigration system | FM; VISIT; WORK; HQ; TEMP; SELF/entrepreneur; STUDY/research; FAMILY; LONG; PROTECT; other national residence bases only after source verification | Portuguese passport only for `PT` citizenship; Citizen Card defaults to `PT`, with a separately verified path for a Brazilian citizen granted the relevant equal-rights status | V, P, B, R | Q1–Q12; municipality; exact residence basis; tax-residence/business regime; property use; vehicle import or move | [EU employed-worker page](https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-portugal_en); [Portugal: first Citizen Card](https://www2.gov.pt/en/servicos/pedir-o-cartao-de-cidadao) |
| **Italy** — EU FM plus national system; some work admission is route/quota specific | FM; VISIT; WORK; HQ; TEMP/seasonal/ICT; SELF; STUDY/research; FAMILY; LONG; PROTECT | Italian passport and electronic identity card only for `IT` citizenship | V, P, B, R | Q1–Q12; region/province/comune; employment authorisation and employer; property use; vehicle registration/import; business/VAT position | [EU employed-worker page](https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-italy_en) |
| **Netherlands** — EU FM plus national IND system | FM; VISIT; WORK; HQ/highly skilled migrant; HQ/Blue Card where applicable; SELF/start-up; STUDY/research; FAMILY; LONG; PROTECT | Dutch passport and identity card only for `NL` citizenship | V, P, B, R | Q1–Q12; IND sponsor status; municipality; employee/highly skilled/start-up distinction; RDW registration country; owner-occupied vs rented property | [EU employed-worker page](https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-netherlands_en); [IND: employing a foreign national](https://ind.nl/en/residence-permits/work/employing-a-foreign-national) |
| **Belgium** — EU FM; residence is federal while work authorisation can be regional | FM; VISIT; WORK/single permit; HQ; TEMP; SELF/professional route; STUDY/research; FAMILY; LONG; PROTECT | Belgian passport and national eID only for `BE` citizenship; residence cards remain status documents | V, P, B, R | Q1–Q12; employer's region (Flanders, Wallonia, Brussels-Capital, or German-speaking Community); municipality; federal vs regional authority; property region | [EU employed-worker page](https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-belgium_en) |
| **Austria** — EU FM plus national residence/work system | FM; VISIT; WORK; HQ/Red-White-Red or Blue Card only under exact national conditions; TEMP; SELF; STUDY/research; FAMILY; LONG; PROTECT | Austrian passport and identity card only for `AT` citizenship | V, P, B, R | Q1–Q12; federal state and municipality; exact residence title and labour-market access; employer; regulated profession; property/business location | [EU employed-worker page](https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-austria_en); [Austria: work and migration](https://www.sozialministerium.gv.at/en/Topics/Labour/Labour-Market/Work-and-migration.html) |
| **Switzerland** — non-EU; EU/EFTA free-movement agreement plus national/cantonal third-country rules | FM for EU/EFTA; VISIT; WORK for third-country nationals under national conditions; SELF only where eligible; STUDY/research; FAMILY; LONG/settlement; PROTECT | Swiss passport and identity card only for `CH` citizenship | V, P, B, R | Q1–Q12; EU/EFTA vs third-country nationality; canton and municipality; permit category; employer and qualifications; cross-border commuter status; asset canton | [SEM: entry](https://www.sem.admin.ch/en/entry); [SEM: working in Switzerland](https://www.sem.admin.ch/sem/en/home/overview-arbeit.html); [SEM: EU/EFTA citizens](https://www.sem.admin.ch/en/eu-efta-citizens-living-and-working-in-switzerland); [SEM identity/travel FAQ](https://www.sem.admin.ch/en/faq-entry) |
| **Czechia** — EU FM plus national implementation | FM; VISIT; WORK/Employee Card; HQ/Blue Card where applicable; TEMP; SELF/business; STUDY/research; FAMILY; LONG; PROTECT | Czech passport and national identity card only for `CZ` citizenship | V, P, B, R | Q1–Q12; region/municipality; Employee Card vs other purpose; employer/job position; business basis; property and vehicle registration location | [EU employed-worker page](https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-czechia_en) |
| **Poland** — EU FM plus national/voivodeship implementation | FM; VISIT; WORK/temporary residence and work; HQ/Blue Card where applicable; TEMP; SELF/business; STUDY/research; FAMILY; permanent and EU LONG; PROTECT | Polish passport and national identity card only for `PL` citizenship | V, P, B, R | Q1–Q12; voivodeship, powiat and gmina where relevant; employer and work authorisation; permanent vs EU long-term basis; business legal form; asset municipality | [EU employed-worker page](https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-poland_en) |
| **Ireland** — EU FM plus Common Travel Area and a national third-country permission/stamp system; do not inherit Denmark-excluded or Ireland-excluded EU routes automatically | FM; CTA/British-Irish status; VISIT; WORK plus separate employment-permit/immigration-permission logic; STUDY; FAMILY; LONG; SELF/business where nationally available; PROTECT | Irish passport only as the initial citizenship-document default for `IE`; do not invent a generic national-ID obligation | V, P, B, R | Q1–Q12; Irish/British/EEA/Swiss status; immigration permission/stamp; whether an employment permit is separately required; county/local authority; exact permission conditions | [ISD: registering immigration permission](https://www.irishimmigration.ie/registering-your-immigration-permission/); [ISD: permission stamps](https://www.irishimmigration.ie/registering-your-immigration-permission/information-on-registering/immigration-permission-stamps/); [Department of Enterprise: immigration and employment permits](https://enterprise.gov.ie/en/what-we-do/workplace-and-skills/employment-permits/employment-permit-eligibility/immigration-employment-permits/) |
| **United Kingdom** — national system; British and Irish citizens have distinct rights from visa nationals | British/Irish status; VISIT/ETA/visa as applicable; WORK; HQ/skilled and other national work routes; STUDY; FAMILY; settlement/ILR; PROTECT; country-specific special routes only after source verification | British passport only for a qualifying British nationality; no generic national-ID default | V, P, B, R | Q1–Q12; constituent nation (England, Wales, Scotland, Northern Ireland) and local council; British/Irish status; exact visa route and eVisa/status evidence; sponsor; asset nation | [GOV.UK: visas and immigration](https://www.gov.uk/browse/visas-immigration); [check if a UK visa is needed](https://www.gov.uk/check-uk-visa); [British passport eligibility](https://www.gov.uk/british-passport-eligibility) |
| **Sweden** — EU/EEA/Nordic routes plus national Migration Agency system | FM/Nordic; VISIT; WORK employee/self-employed; TEMP; job-search routes only when eligibility is verified; STUDY; FAMILY; permanent/LONG; PROTECT | Swedish passport and national ID only for `SE` citizenship | V, P, B, R | Q1–Q12; Nordic vs EU/EEA vs Swiss vs third-country status; municipality; employment type; accompanying family; exact permit basis; vehicle registration country | [Swedish Migration Agency: route chooser](https://www.migrationsverket.se/en/you-want-to-apply.html); [work routes](https://www.migrationsverket.se/en/you-want-to-apply/work.html) |
| **Norway** — non-EU EEA/Nordic system plus national UDI routes | FM under EU/EEA rules; Nordic relocation; VISIT; WORK/skilled or seasonal; STUDY; FAMILY; LONG; PROTECT; SELF where a verified route exists | Norwegian passport and national ID only for `NO` citizenship; immigrant passports/travel documents stay in status-document taxonomy | V, P, B, R | Q1–Q12; Nordic vs EU/EEA vs third-country status; municipality/county; exact work category; family sponsor; whether changing basis replaces an existing permit; asset registration country | [UDI: want to apply](https://www.udi.no/en/want-to-apply/); [UDI: Norwegian passport](https://www.udi.no/en/word-definitions/applying-for-a-norwegian-passport/) |
| **Finland** — EU/EEA/Swiss and Nordic registration routes plus national third-country permits | FM/Nordic; VISIT; WORK; HQ; SELF/entrepreneur; STUDY/research; FAMILY; LONG; PROTECT | Finnish passport and citizen travel ID only for `FI`; an eligible foreigner's identity card is a separate non-travel resident credential | V, P, B, R | Q1–Q12; Nordic vs EU/EEA/Swiss vs third-country status; municipality; EU registration basis; employer/entrepreneur route; accompanying family; exact asset location | [EU employed-worker page](https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-finland_en); [Migri: EU citizen](https://migri.fi/en/eu-citizen); [Finnish Police: identity cards](https://poliisi.fi/en/how-to-apply-for-an-identity-card) |
| **Denmark** — EU/Nordic routes plus national immigration system; do not auto-apply EU third-country route templates | FM/Nordic; VISIT; national WORK; STUDY; FAMILY; permanent/LONG; PROTECT; SELF where nationally available | Danish passport only as the initial citizenship-document default for `DK`; do not invent a generic national-ID obligation | V, P, B, R | Q1–Q12; Nordic vs EU vs third-country status; municipality; exact national scheme; employer/school/family sponsor; asset registration country | [New to Denmark: route chooser](https://nyidanmark.dk/en-GB/You-want-to-apply); [EU portal: who does what](https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/who-does-what_en) |
| **Greece** — EU FM plus national implementation | FM; VISIT; WORK; HQ; TEMP/seasonal/ICT; SELF where available; STUDY/research; FAMILY; LONG; PROTECT | Greek passport and police identity card only for `GR` citizenship | V, P, B, R | Q1–Q12; region/municipality; employer and admission category; property location/use; vehicle registration country; business/tax regime | [EU employed-worker page](https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-greece_en) |
| **Cyprus** — EU FM plus national immigration system; use national/EU country pages rather than assuming another member state's implementation | FM; VISIT; WORK; HQ where nationally available; SELF/business where available; STUDY/research; FAMILY; LONG; PROTECT | Cypriot passport and national identity card only for `CY` citizenship | V, P, B, R | Q1–Q12; district/municipality; exact entry/residence/employment permit; employer; property location and use; vehicle registration country | [EU employed-worker page](https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-cyprus_en); [EU portal: Cyprus authorities](https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/who-does-what/cyprus_en) |
| **Estonia** — EU FM plus national Aliens Act/Police and Border Guard implementation | FM; VISIT; WORK/short-term employment or residence route as applicable; HQ; TEMP/ICT; SELF/business; STUDY/research; FAMILY; LONG; PROTECT | Estonian passport and citizen travel ID only for `EE`; EU-resident ID cards, third-country residence-permit cards, and e-resident digital IDs are separate non-citizenship credentials | V, P, B, R | Q1–Q12; municipality; short-term employment registration vs residence permit; employer; business/e-residency distinction; asset registration/location | [EU employed-worker page](https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-estonia_en); [Estonian Aliens Act](https://www.riigiteataja.ee/en/akt/501092026001); [Estonia: foreign nationals' documents](https://www.id.ee/en/article/foreign-nationals-residing-in-estonia-and-their-documents/) |

## Data shape implied by the research

The current flat “country pack” concept should resolve against a country graph rather than a single country choice.

```text
household
├── people[]
│   ├── citizenships[]
│   ├── residences[] → country + basis + status document + local layer
│   └── destinations[] → country + purpose + planned dates
├── assets[]
│   ├── ownerSubjectId
│   ├── country + optional registrationCountry + local layer
│   ├── type + subtype + makeModelOrName + userLabel
│   └── documents[] → inspection / insurance / licence / registry / tax notice
└── obligations[]
    ├── jurisdiction + authorityLevel
    ├── subjectRef → person or exact asset
    ├── legalBasisFamily + applicability answers
    └── confirmed date / recurrence / user reminder plan
```

Recommended minimum fields:

```json
{
  "person": {
    "citizenships": ["UZ"],
    "residences": [
      {
        "country": "RU",
        "basisFamily": "WORK",
        "basisCode": "user-selected-country-route",
        "region": null,
        "municipality": null,
        "statusDocumentRef": null
      }
    ]
  },
  "asset": {
    "id": "asset-car-1",
    "ownerSubjectId": "person-1",
    "country": "DE",
    "registrationCountry": "DE",
    "type": "vehicle",
    "subtype": "passenger-car",
    "makeModelOrName": "Volkswagen Golf",
    "userLabel": "Blue Golf"
  }
}
```

`basisCode` must point to reviewed country data, not a generated free-text conclusion. `makeModelOrName` and `userLabel` are for recognition and filtering; registration numbers or VINs are not needed for the core reminder product.

## Filters required by the model

The obligation list and calendar should support independent, combinable filters for:

- obligation jurisdiction/country;
- person/owner;
- residence or legal basis;
- possession type and subtype;
- exact possession by stable `asset.id` and human label;
- obligation category and document kind;
- source-review status and confidence;
- due window, missing date, or needs-confirmation state.

Example: `Germany / vehicle / Blue Golf / inspection` must not show the insurance or inspection tasks of another car, even if both have the same owner and country.

## Editorial pipeline for country data

1. **Research map:** identify the official authority, route/asset family, scope boundary, and applicability questions. This file is at that stage.
2. **Candidate rule:** capture the exact official page or legal text, source language, authority level, effective date, reviewed date, and known exceptions. Keep it unpublished.
3. **Country review:** a reviewer confirms the route or obligation, applicability expression, translations, and whether timing is printed-date, event-relative, notice-based, or recurring.
4. **Publishable catalog entry:** include stable ID, jurisdiction, subject type, exact applicability expression, official sources, review date, risk, and confidence. A tax or legal date must be traceable to the exact source passage.
5. **Change monitoring:** re-review when the authority changes the page, the law's effective date changes, or a scheduled review expires. Never silently rewrite a user's confirmed date.

Recommended source metadata:

```text
authority
authorityLevel: EU | national | regional | municipal
sourceUrl
sourceTitle
sourceLanguage
effectiveFrom / effectiveTo (when known)
lastVerifiedAt
reviewStatus: research-map | candidate | reviewed | retired
applicabilityNotes
timingEvidence
```

## Coverage cautions

- The route lists are deliberately broad and may include a family that is unavailable or differently named in a country. Country data must narrow the list before showing it as a recommendation.
- EU free movement, Schengen entry, residence registration, and permission to work are related but different concepts. They need separate fields and source rules.
- A residence card is evidence of a status; it is not proof of citizenship and must never unlock a national-passport task.
- Vehicle country, owner residence, normal residence, and registration country can differ. Ask for all of them before applying a vehicle rule.
- Property and business obligations often depend on a regional or municipal layer, ownership/use, and tax regime. Country alone is not enough.
- Exact dates, renewal windows, notice periods, and tax schedules have intentionally been excluded from this matrix. They require rule-level official-source research and legal/editorial review.
- Translations should preserve the official local document/route name alongside English, Russian, and Uzbek labels. Translation never changes applicability logic.

