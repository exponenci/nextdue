# CIS legal-data matrix

**Status:** reviewed research seed, not a complete statement of law  
**Reviewed:** 2026-11-15  
**Countries:** Russia, Uzbekistan, Kazakhstan, Kyrgyzstan, Tajikistan, Armenia, Azerbaijan, Belarus, Moldova, and Georgia

This file defines what NextDue should ask, which document and obligation candidates it may show, and which facts must block automatic suggestions. It is product research, not personal legal advice. Rules that can create or remove a legal obligation must be checked against the effective law and an official authority before publication.

## Product conclusion

Do not generate one generic “starter pack” from one selected country. Resolve candidates from the following graph:

```text
person
  citizenship(s)
  country of physical stay / habitual residence
  entry and intended-stay facts
  stay or legalization basis
  basis-specific permit or status
  relationship / employer / educational institution, when relevant

named asset
  owner
  country of registration or location
  type and subtype
  asset-specific documents

→ source-backed applicability rules
→ obligations the user confirms
→ user-selected reminders and calendar events
```

A person can have several citizenships, several relevant countries, and several assets in different countries. A person living in Russia may own a flat in Uzbekistan and cars registered in two other countries. None of those countries may be collapsed into a single `country` property.

Replace “starter pack” in product copy with **legalization path**, **documents for this situation**, or **obligations for this person/asset**. A path is always tied to a host country and a declared basis.

## Non-negotiable applicability rules

1. A national/internal passport, national ID card, or ordinary international passport of country `X` is a candidate only when the person is a citizen of `X`. Residence, property ownership, family relationship, or vehicle registration in `X` must never activate citizen identity documents.
2. A residence card, foreigner ID, migration registration, visa, or work authorization is not a citizen passport. Model it as a host-country status document.
3. “Family” is not one basis. Ask for relationship, sponsor/relative citizenship and residence status, age/dependency where relevant, and the intended result (stay extension, temporary residence, permanent residence, etc.).
4. “Study” is not one basis. Ask for institution, program level, full-time/part-time mode, accreditation/state status when relevant, enrollment dates, and whether the user also works.
5. “Work” is not one basis. Ask for employee/self-employed/contractor status, employer, profession or qualification category, work region, EAEU status where relevant, and the actual permit/status already held.
6. Property ownership must not imply residence rights. It may activate registration, tax, insurance, safety, or title-document rules; immigration rights need their own sourced rule.
7. Each asset rule uses the asset's jurisdiction, not the owner's residence country. Tax residence may be an additional condition, never a substitute for asset location.
8. Do not turn a general legal deadline into the user's event date without the event that starts the clock: entry, registration, issue, acquisition, tax notice, academic enrollment, contract signing, or another sourced trigger.
9. User reminder offsets are preferences, not law. Store a slash-delimited entry as structured offsets, but do not present one universal sequence as a legal or recommended plan.
10. A catalog item with unresolved exceptions is shown as “check applicability,” never as “required.”

## Required data model

### Person and country relationships

```yaml
person:
  id: person_...
  display_name: string
  date_of_birth: optional date
  citizenships:
    - country: ISO-3166-1 alpha-2
      from: optional date
      to: optional date
      evidence_status: user_confirmed | verified | unknown
  presences:
    - host_country: ISO-3166-1 alpha-2
      role: lives | stays | plans_to_move | studies | works
      from: optional date
      intended_until: optional date
      entry_mode: visa_free | visa | citizen | unknown
      basis: tourism | work | study | family | temporary_residence | permanent_residence | other
      status_code: country-specific enum
      status_document_id: optional document reference
```

`citizenships[]` and `presences[]` are independently addable with a compact `+ Add country` action. “Where do you live?” is a repeatable country-period relation, not a second citizenship field.

### Legalization path

```yaml
legalization_path:
  person_id: person_...
  host_country: RU
  basis_code: RU.work.patent
  intent: work
  status: considering | preparing | applied | active | expired | ended
  started_at: optional date
  valid_until: optional date
  employer_id: optional reference
  institution_id: optional reference
  related_person_id: optional reference
  region: optional subdivision code
  facts: country-specific typed object
```

The `basis_code` is a stable catalog key, not free text. `other` is allowed, but it must not activate a pre-generated legal document set until a reviewer maps it.

### Named assets and their documents

```yaml
asset:
  id: asset_...
  owner_person_ids: [person_...]
  country: ISO-3166-1 alpha-2
  type: vehicle | real_estate | land | business | vessel | other
  subtype: country-neutral controlled value
  display_name: user-entered, e.g. "Toyota Camry 2019"
  acquired_at: optional date
  disposed_at: optional date
  registration_region: optional subdivision code
  use: personal | rental | business | mixed | unknown
  attributes: type-specific typed object

asset_document:
  asset_id: asset_...
  document_type: registration | title | insurance | inspection | tax_notice | permit | warranty | other
  jurisdiction: ISO country/subdivision
  issued_at: optional date
  valid_until: optional date
  recurrence: optional structured rule
```

Avoid storing scans, passport numbers, full addresses, VINs, cadastral numbers, or tax identifiers by default. A friendly asset name is enough to filter obligations. Sensitive identifiers can be a later encrypted opt-in.

### Rule and source provenance

Every published catalog rule needs:

```yaml
rule:
  id: stable country-scoped key
  jurisdiction: country and optional subdivision
  subject: person | asset | relationship | employer
  applies_if: machine-readable predicates
  excludes_if: machine-readable predicates
  trigger: event + source field
  outcome: document_candidate | obligation_candidate | warning
  actor: user | host | employer | institution | authority
  timing: exact | authority_notice | user_supplied | unknown
  effective_from: date
  effective_to: optional date
  reviewed_at: date
  source_urls: [official/legal URLs]
  confidence: verified | partial | unresolved
  reviewer: editorial or legal reviewer ID
```

An official page describing a service supports the service fields; it does not prove that every user must use it. Applicability must be supported separately.

## Russia deep dive: Uzbekistan citizen

An Uzbekistan citizen is generally in Russia's visa-free branch but is not an EAEU worker. Armenia, Belarus, Kazakhstan, and Kyrgyzstan are EAEU member states; their workers receive the treaty exemption from Russian work permits and patents. Uzbekistan does not. Therefore, a patent is a common employment branch for an Uzbekistan citizen, but it is not a universal default and must be checked for exemptions and the actual status held.

### Path matrix

| Basis/status | Ask before suggesting documents | Candidate documents and tracked facts | Candidate obligations/events | Must not infer |
|---|---|---|---|---|
| `RU.short_stay.visa_free` | entry date and border route; stated purpose; intended departure; host/accommodation; prior Russian stays in the same calendar year; whether work or study begins | foreign travel passport issued by country of citizenship; entry/migration record when issued; migration registration/arrival notification; host details | end of allowed stay; registration deadline calculated from the actual accommodation and applicable exception; departure or status-change checkpoint | do not add a Russian national or international passport; do not assume all visa-free stays receive the same registration exception; do not treat tourist/visit purpose as work authorization |
| `RU.work.patent` | visa-free entry; work purpose/entry record where applicable; employer and contract type; work region; profession if patent records it; exemption/status checks; existing RVP/VNZH; application and payment history | patent; application receipt; migration registration; medical examination results; voluntary medical insurance or qualifying medical-services agreement; Russian language/history/law evidence or exemption; employment/civil contract; advance personal-income-tax payment records | application window from entry; monthly/periodic advance-tax payments before the paid period lapses; contract-copy submission after patent issue where applicable; employer conclusion/termination notification; validity and region/profession checks; reissue or status-change checkpoints | a patent is not a work permit; paying after lapse must not be represented as retroactive cure; one region's patent must not be assumed valid in another; employer duties must not be assigned to the employee |
| `RU.work.work_permit` | why the work-permit branch applies to this visa-free Uzbekistan citizen; employer authorization; qualification/category, including highly qualified specialist where relevant; region and profession; other residence status | employer/work authorization artifacts applicable to the selected category; individual work permit; contract; registration and stay documents | permit validity; employer notifications; status-specific income, medical-insurance, or reporting checkpoints when the selected category requires them | do not offer a conventional work permit as an interchangeable alternative to a patent; do not publish a packet until a specific Article 13 category is selected |
| `RU.study.temporary_stay` | institution; state/private and accreditation facts; program and level; full-time status; enrollment/order dates; expected completion; employment alongside study | admission/enrollment order or agreement; education-purpose stay extension; migration registration; institution-provided documents; foreign travel passport | registration and stay-extension events; enrollment/status changes; completion, dismissal, academic leave, or transfer checkpoints; work-status review if employment starts | enrollment does not automatically mean RVPO; study does not automatically remove every work authorization requirement; the institution and program facts matter |
| `RU.study.rvpo` | whether the institution and full-time program meet Article 6.2; program dates; current temporary-stay/status facts; prior RVPO; dismissal/transfer risk | RVPO application artifacts; qualifying enrollment evidence; identity/travel document; registration; issued RVPO document/status | application and decision milestones; validity tied to qualifying education plus the statutory post-study period; address/registration and material study-status changes; transition to another status after completion | do not equate RVPO with ordinary RVP; do not show it for every course, school, or part-time program |
| `RU.family` | exact relationship; relative's citizenship and Russian status; ages/dependency; co-residence/address facts; marriage/parentage/adoption evidence; desired result: stay extension, RVP, VNZH, or another status | civil-status records; relative's citizenship/status evidence; relationship-specific application artifacts; translation/legalization evidence if required | expiry and application milestones for the selected target status; changes to the relationship or sponsor status that affect the basis | “relative in Russia” is not a permit; no universal family packet exists; property or registration at the same address does not prove a family basis |
| `RU.residence.rvp` | quota or exact no-quota ground; current stay; region; prior status; relationship/education/work facts supporting the ground; address | RVP application artifacts; identity/travel document; ground evidence; medical and language/history/law evidence or exemptions; registration | application/decision milestones; RVP validity; residence/address obligations; annual residence confirmation and income/residence evidence where applicable; transition to VNZH or departure | do not confuse RVP with RVPO; an RVP is region/status-specific and not citizenship; do not create a fixed packet without the quota/no-quota ground |
| `RU.residence.rvpo` | same qualifying-study questions as above; intended post-study path | RVPO-specific status documents and qualifying-study evidence | study-status monitoring; validity and post-completion transition | do not merge its rules with RVP just because both begin with `РВП` |
| `RU.residence.vnzh` | exact eligibility route; preceding RVP/RVPO if required or exemption; family, birth, former citizenship, qualification, employment, protection, or education ground; existing VNZH category | VNZH application artifacts; eligibility evidence; identity document; registration; language/history/law evidence or exemption; issued residence permit | permit/card validity where limited; annual residence confirmation; address/status changes; absence/continuous-residence checks; replacement of the physical document | not every VNZH is indefinite; an indefinite status can still have recurring notifications and a replaceable physical card |
| `RU.other` | user description and intended outcome | user-created records only until mapped | user-created dates and reminders | do not attach a nearby legal packet by semantic similarity |

### Russia rule notes

- Federal Law 115-FZ Article 5 now provides the main temporary-stay framework, including the general visa-free limit of 90 days in a calendar year, subject to extensions, special statuses, treaties, and other exceptions. Store prior stays so the system can ask, not guess.
- Article 13.3 is the patent branch for visa-free foreign workers. Article 13 contains the broader work-permit framework and exemptions. Keep their catalog IDs, screens, and sources separate.
- Full-time students in qualifying accredited programs may fall within employment exemptions in Article 13, while RVPO under Article 6.2 is a separate residence path. One must not activate the other without its own facts.
- RVP under Article 6, RVPO under Article 6.2, and VNZH under Article 8 are three distinct status families.
- Article 15.1 makes proof of Russian language, Russian history, and basic law relevant to several statuses, while also defining exemptions. Represent both the requirement and exemption predicates.
- Migration registration has its own actor and timing rules. The arrival notification may be performed by a receiving party or another permitted actor. Do not assign every step to the foreign citizen.

### Russia sources

- [115-FZ Article 5 — temporary stay](https://www.consultant.ru/document/cons_doc_LAW_37868/e9d581e7e11d7901295efd89c869ae044dd3d20f/)
- [115-FZ Article 13 — foreign employment, work permits, exemptions](https://www.consultant.ru/document/cons_doc_LAW_37868/c137c6f66afe76bc2b195f1d1743662a5fc3d372/)
- [115-FZ Article 13.3 — patent](https://www.consultant.ru/document/cons_doc_LAW_37868/78903dca1f0ac1f3abc08d2f8cd1c0e2fddc826b/)
- [115-FZ Article 6 — RVP](https://www.consultant.ru/document/cons_doc_LAW_37868/c9b9574537c49598dac3a13845550e8995a3f405/)
- [115-FZ Article 6.2 — RVPO for education](https://www.consultant.ru/document/cons_doc_LAW_37868/a5e94ef8da2b4889c86521be15c448d51f4f30c3/)
- [115-FZ Article 8 — VNZH and residence confirmation](https://www.consultant.ru/document/cons_doc_LAW_37868/cd5e24d0cd9cb837fa7a84e8f45ab9df1a3dbbbb/)
- [115-FZ Article 15.1 — language/history/law evidence and exemptions](https://www.consultant.ru/document/cons_doc_LAW_37868/443b9d69fea13cc5f1b681847cd6c139a2002c63/)
- [109-FZ migration-registration rules](https://www.consultant.ru/document/cons_doc_LAW_65707/fae587ce7120a45554e98af00cc6d09cae10d27f/)
- [Eurasian Economic Commission migration Q&A — EAEU work authorization exemption](https://eec.eaeunion.org/upload/medialibrary/a53/voprosy_migratsii.pdf)
- [Federal Tax Service — annual tax notification for vehicles, land, and individual property](https://www.nalog.gov.ru/nu/)

### Russia asset seed

For every exact vehicle, store registration country/region and separate candidates for registration certificate, compulsory insurance, inspection/diagnostic obligations when applicable, and transport tax. For every exact property/land asset, store its location and ownership period and create separate candidates for title/registration, property tax, land tax, and user-added building/insurance/service dates. Federal Tax Service data confirms that registered vehicles and real property can produce annual tax-notification obligations; regional/municipal rate and relief rules must remain subdivision-aware.

## Country seed matrix

The table lists candidate branches to pre-generate. It does not authorize showing all items to every user.

| Host country | Legalization/status branches to model | Key applicability questions | Citizen-only identity documents | Asset-linked seed | Coverage status |
|---|---|---|---|---|---|
| Russia | visa/visa-free temporary stay; patent; work permit/category exemptions; study stay; RVP; RVPO; VNZH; family-specific routes | citizenship/EAEU; entry mode and dates; prior stays; exact work/study/family ground; region; status held | passport of Russian citizen and Russian foreign-travel passport only for Russian citizens | named vehicle registration/insurance/inspection/tax; named real estate/land registration and taxes | deep seed for Uzbekistan citizen; exceptions and document lists still require legal review |
| Uzbekistan | visa-free or visa/e-visa entry; temporary registration; work confirmation; study/family/other visa-purpose branches; permanent residence/foreigner residence document; PINFL/JShShIR | citizenship and visa regime; purpose and visa category; accommodation/registration; employer and work confirmation; temporary vs permanent stay | Uzbekistan passport/ID and international passport only for Uzbekistan citizens | named vehicle registration certificate; real-estate cadastral/title records; property and land tax; user-added insurance/inspection dates | source-backed branch seed; residence and work exceptions need legal review |
| Kazakhstan | entry/authorized stay; receiving-party notification; temporary residence permit by work, EAEU employment, study, family, medical, business, or other sourced ground; labor-immigrant permit; employer work-permit route; permanent residence/permit | citizenship/visa; EAEU status; contract/employer; purpose; intended duration; family/institution; region; permit category | Kazakhstan identity card and citizen passport only for Kazakhstan citizens | property/land tax by exact located asset; vehicle registration and transport tax by exact vehicle; foreign-asset disclosure only when tax-residence rules activate it | source-backed high-level seed; current category deadlines need editorial extraction |
| Kyrgyzstan | authorized stay/registration; unified permit for stay and work; EAEU worker exemption; study/family/business and other temporary-residence grounds; temporary/permanent residence cards | citizenship/EAEU; work vs study/family; employer; intended duration; registration address; status/card already held | Kyrgyz ID-card passport and ordinary passport only for Kyrgyz citizens | real estate/land tax by exact asset; vehicle registration and inspection/insurance dates; do **not** create a current vehicle-property-tax obligation because the official 2025 reform report says it was abolished from 2025 | current 2026 permit-regulation seed; detailed exceptions and transitions need review |
| Tajikistan | visa/visa-free entry; registration/stay; temporary/permanent residence; employment work permit and listed exemptions; study/family/other grounds | citizenship/visa; arrival and registration; employer/profession; exemption; stay purpose and duration; sponsor/institution | Tajik IC identity passport and international passport only for Tajik citizens | exact real property/land and vehicle objects; tax rule candidates sourced from the Tax Code; registration/inspection/insurance dates require separate transport-source review | partial seed; migration and tax sources found, document packets not publication-ready |
| Armenia | authorized stay; work permit/employment residence; EAEU work exemption; temporary/permanent/special residence; study; family; entrepreneurship and other statutory grounds | citizenship/EAEU; employer or business; study institution; family relationship; intended term; current card/status | Armenian ID card and citizen passport only for Armenian citizens | exact real estate and vehicle property-tax objects; vehicle registration/insurance/inspection to be sourced separately | source-backed residence/work branch seed; asset operational rules partial |
| Azerbaijan | authorized stay and place-of-stay registration; temporary residence by exact statutory ground; work permit plus temporary residence for paid work unless exempt; study/family/business/property and other grounds; permanent residence | citizenship/visa; arrival date; accommodation/receiving party; exact temporary-residence ground; employer and exemption; intended term | Azerbaijani identity card and ordinary passport only for Azerbaijani citizens | exact building/land; water/air vehicle property tax; foreign-registered road-vehicle entry tax where applicable; vehicle registration/insurance/inspection needs separate source | source-backed migration and tax seed; ground exceptions require legal review |
| Belarus | temporary stay and registration; temporary residence for work, study, family and other statutory grounds; special work permit unless exempt; EAEU work exemption; permanent residence and residence permit | citizenship/visa/treaty; EAEU; accommodation; employer; exact temporary/permanent ground; relationship; study | Belarus citizen passport/ID products only for Belarus citizens; foreigner biometric residence permit is a host-status document | exact real estate, land, and registered vehicle; unified property-payment obligation with separate underlying tax types | source-backed high-level seed; 2026 stay-rule changes require current official-text review before publication |
| Moldova | provisional residence by work, study, family reunification, humanitarian/religious/voluntary activity, medical care, protection, IT/investor/manager/specialist and other listed grounds; permanent residence; migrant-worker branch | citizenship/visa; exact statutory purpose; employer/category; family sponsor; institution; residence duration; current card | Moldovan identity card and citizen passport only for Moldovan citizens | exact real estate/land local tax; wealth-tax check for qualifying residential holdings; vehicle registration/insurance/inspection to be sourced separately | source-backed residence and real-estate-tax seed; operational vehicle rules partial |
| Georgia | lawful stay; work residence; study residence; family reunification; former-citizen, stateless, special, investment, short-term property and permanent residence branches where applicable | citizenship/visa-free allowance; lawful-stay evidence; employer/business and labor-right decision; institution; family relationship; investment/property criteria; income evidence | Georgian electronic ID and citizen passport only for Georgian citizens | exact Georgian property/land with income/threshold predicates; named vehicle registration and cross-border temporary-registration clocks; inspection/insurance to be sourced separately | source-backed residence, property-tax, and vehicle-registration seed; work changes require continuing review |

## Country notes and official/legal sources

### Uzbekistan

The official portal groups entry/visa, migration registration, work confirmation, and services for foreigners. PINFL/JShShIR is available to foreigners and must be modeled as an administrative identifier, not as an Uzbekistan citizen identity document. The portal explicitly describes the Uzbekistan citizen passport/ID as proof of Uzbekistan citizenship, which supports the citizenship gate.

- [Government portal — entry, registration, and employment of foreign citizens](https://my.gov.uz/en/life-situations/6c33a349-31ba-4b9e-8693-b77b63200cba)
- [Government portal — services and identification for foreigners](https://my.gov.uz/uz/for-foreigners)
- [Government portal — PINFL/JShShIR for foreigners](https://my.gov.uz/en/static/jshshir-for-foreigners)
- [Government information — residence permit for foreign citizens](https://gov.uz/en/advice/61/document/2030)
- [Ministry of Foreign Affairs — visa categories](https://gov.uz/en/mfa/pages/o-zbekiston-respublikasi-vizasi)
- [MyGov — citizen passport/ID scope](https://my.gov.uz/en/life-situations/38d089e4-697c-494a-a5ac-d2ca1eeea49a)
- [MyGov — new vehicle registration](https://my.gov.uz/ru/service/985)
- [MyGov — residential real-estate services](https://my.gov.uz/en/life-situations/f8f0cb5b-a148-481b-b0ef-1fe48bb451a0)
- [MyGov — property and land taxes](https://my.gov.uz/ru/service/64)

### Kazakhstan

Temporary residence is basis-specific. The official entry/stay guide distinguishes employment under an ordinary work authorization, EAEU employment contract, labor-immigrant permit, and other purposes. Preserve those as distinct codes. The identity-card source states that it is mandatory for citizens permanently residing in Kazakhstan; it must not be suggested merely because a foreigner lives there.

- [eGov — entry/stay and temporary residence bases](https://egov.kz/cms/en/articles/move_abroad/exit-entry_of_foreign_nationals)
- [eGov — residence permit](https://beta.egov.kz/situations/149/420?lang=en)
- [eGov — labor-immigrant permit](https://egov.kz/cms/ru/services/legal_relations/38-1_mvd)
- [eGov — Kazakhstan citizen passport and identity card](https://egov.kz/cms/ru/articles/faqs_passport_id?mobile=no)
- [eGov — individual property tax](https://www.gov.kz/situations/16/75)
- [State Revenue Committee — property, land, and vehicle taxes](https://kgd.gov.kz/ru/faq/520?page=1)

### Kyrgyzstan

The current 2026 regulation establishes a unified permit/resident-card framework. EAEU workers are a separate exemption branch. For assets, do not copy old transport-tax deadlines into the active catalog: the Ministry of Economy's official report says vehicle property tax was abolished from 1 January 2025.

- [Ministry of Justice legal database — 2026 unified permit and resident-card regulation](https://cbd.minjust.gov.kg/230045488/edition/52377/ru)
- [National Investment Agency — labor and EAEU exemption](https://invest.gov.kg/en/invest-compass/people/labor)
- [Cabinet of Ministers — stay rules](https://www.gov.kg/ru/npa/s/4495)
- [Digital Development Ministry — residence-permit eligibility FAQ](https://digital.gov.kg/chavo-vnzh/kto-mozhet-poluchit-vid-na-zhitelstvo-v-kyrgyzskoj-respublike-2/)
- [Digital Development Ministry — national passports of Kyrgyz citizens](https://digital.gov.kg/postanovleniya/postanovlenie-pkr-ot-3-aprelya-2017-goda-%E2%84%96-196-o-naczionalnyh-pasportah-grazhdan-kyrgyzskoj-respubliki/)
- [National Investment Agency — property tax](https://invest.gov.kg/ru/invest-compass/taxes/taxation)
- [Ministry of Economy — 2025 abolition of vehicle property tax](https://mineconom.gov.kg/froala/uploads/file/194e1f33012d0eeb4627cec3c148c37f97314f48.pdf)

### Tajikistan

The Migration Service describes the work-permit procedure and exceptions; the law and stay rules supply the broader status framework. Treat the stated normal permit period as a maximum/category fact, not a universal user deadline. Asset tax candidates exist for real property and vehicles, but the product still needs separately reviewed registration, inspection, and insurance sources.

- [Migration Service — work permit](https://migration.tj/i%D2%B7ozat-baroi-kor-ba-sha%D2%B3rvandoni-hori%D2%B7/)
- [Migration Service — legal status of foreign citizens](https://migration.tj/%D0%B7%D0%B0%D0%BA%D0%BE%D0%BD-%D1%80%D0%B5%D1%81%D0%BF%D1%83%D0%B1%D0%BB%D0%B8%D0%BA%D0%B8-%D1%82%D0%B0%D0%B4%D0%B6%D0%B8%D0%BA%D0%B8%D1%81%D1%82%D0%B0%D0%BD-%D0%BE-%D0%BF%D1%80%D0%B0%D0%B2%D0%BE/)
- [Migration Service — stay rules](https://migration.tj/%D0%BF%D1%80%D0%B0%D0%B2%D0%B8%D0%BB%D0%B0-%D0%BF%D1%80%D0%B5%D0%B1%D1%8B%D0%B2%D0%B0%D0%BD%D0%B8%D1%8F-%D0%B8%D0%BD%D0%BE%D1%81%D1%82%D1%80%D0%B0%D0%BD%D0%BD%D1%8B%D1%85-%D0%B3%D1%80%D0%B0%D0%B6/)
- [Ministry of Internal Affairs — Tajik citizen IC identity passport](https://www.mvd.tj/974-perechen-uslug-pasportno-registracionnoj-sluzhby.html)
- [Tax Committee — Tax Code, real-estate and vehicle objects](https://www.andoz.tj/docs/kodex/tax_code_RT_15.03.2023_ru.pdf)

### Armenia

The official platform separates employment-based residence/work authorization from family and other residence applications. EAEU rules remain a distinct exemption predicate. Armenia citizen ID/passport services are citizenship-scoped; residence documents for foreigners are not variants of those documents.

- [Migration and Citizenship Service — residence application](https://migration.e-gov.am/en/service/residency_application/info)
- [Migration and Citizenship Service — employment residence/work permit](https://migration.e-gov.am/en/service/work_permits/info)
- [Migration and Citizenship Service — ID cards](https://migration.e-gov.am/en/service/id_cards/info)
- [Migration and Citizenship Service — passport of an Armenian citizen](https://migration.e-gov.am/en/service/issuing_passport_over16/info)
- [State Revenue Committee — real-estate and vehicle property taxes](https://src.am/en/getNews/478)
- [Eurasian Economic Commission — EAEU worker rules](https://eec.eaeunion.org/upload/medialibrary/a53/voprosy_migratsii.pdf)

### Azerbaijan

Paid employment normally requires both a work permit and a temporary residence basis unless an exception applies. Place-of-stay registration has a receiving-party actor and nationality-specific timing, so it cannot be represented by one universal deadline. Temporary-residence applications should be planned before authorized stay ends; the official service page states at least 30 days for the described procedure.

- [State Migration Service — paid work and permits](https://migration.gov.az/en/useful_detail/606)
- [State Migration Service — temporary-residence grounds](https://migration.gov.az/en/page/73)
- [State Migration Service — filing before authorized stay expires](https://migration.gov.az/en/page_detail/572)
- [State Migration Service — place-of-stay registration FAQ](https://www.migration.gov.az/en/questions)
- [Official Migration Code](https://www.migration.gov.az/content/pdf/M%C9%99c%C9%99ll%C9%99%20ENG%202-edited.pdf)
- [ASAN — Azerbaijan citizen passports](https://www.asan.gov.az/en/service/asan-xidmetler/uemumvetendas-pasportlarinin-verilmesi-ve-deyisdirilmesi)
- [ASAN — Azerbaijan citizen identity cards](https://asan.gov.az/en/service/asan-xidmetler/sexsiyyet-vesiqelerinin-verilmesi-ve-deyisdirilmesi)
- [State Tax Service — property, land, and relevant transport taxes](https://www.taxes.gov.az/en/page/vergi-beledcisi)

### Belarus

The foreigner law distinguishes temporary stay, temporary residence, and permanent residence; the residence permit is a foreigner's identity/status document. Work authorization is a separate branch, with EAEU citizens excluded from the ordinary special-permit requirement. Belarus introduced a unified property payment, but the underlying real-estate, land, and vehicle objects should remain separate in the user's asset tree.

- [CIS Statistical Committee legal text — Law 105-Z on foreigners](https://new.cisstat.org/documents/20143/570526/2_BE_Law%2Bof%2Bthe%2BRepublic%2Bof%2BBelarus%2BOn%2Bthe%2BLegal%2BStatus%2Bof%2BForeign%2BCitizens%2B2010%2B%282016-2%29.pdf/adfde1fa-a0b5-e4f7-8db0-c0c56bbb7a76?t=1675065770711&version=1.0)
- [Brest regional citizenship/migration service — temporary stay](https://www.bpwbrest.by/legalization/temporary_stay.html?lang=ru)
- [Brest regional citizenship/migration service — temporary residence](https://www.bpwbrest.by/legalization/temporary_residence.html)
- [Brest regional citizenship/migration service — permanent residence](https://www.bpwbrest.by/legalization/permanent_residence.html)
- [Brest regional service — foreign employment and EAEU exception](https://www.bpwbrest.by/employment.html?lang=ru)
- [Eurasian Economic Commission — EAEU worker rules](https://eec.eaeunion.org/upload/medialibrary/a53/voprosy_migratsii.pdf)
- [Ministry of Taxes — transport tax](https://nalog.gov.by/individuals/property_taxation/taxation_of_vehicles/)
- [Ministry of Taxes — real-estate tax](https://nalog.gov.by/individuals/property_taxation/real_estate_taxation/)
- [Ministry of Taxes — unified property payment](https://nalog.gov.by/inspectorates/reference/imns-minsk-region/clarifications/24304)

### Moldova

The Inspectorate lists multiple provisional-residence purposes; preserve them as separate applicability branches. Its official guidance explicitly says real-estate ownership does not itself confer residence priority. Moldova citizen ID/passport services are separate from foreigner residence documents.

- [General Inspectorate for Migration — right to stay and bases](https://igm.gov.md/en/services/right-to-stay)
- [General Inspectorate for Migration — migrant worker](https://igm.gov.md/en/services/right-to-stay/migrant-worker)
- [General Inspectorate for Migration — foreigner residence documents](https://igm.gov.md/en/services/foreigners-documentation)
- [General Inspectorate for Migration — ownership does not confer residence priority](https://inimi.igm.gov.md/en/the-rights-and-obligations-of-foreigners-in-the-republic-of-moldova)
- [Public Services Agency — Moldova citizen identity documents](https://www.asp.gov.md/en/servicii/persoane-fizice/acte-identitate)
- [Public Services Agency — Moldova citizen passport](https://www.asp.gov.md/en/servicii/persoane-fizice/acte-identitate/pasaport)
- [State Tax Service — real-estate and land tax payment](https://www.sfs.md/ro/initializare/cum-pot-achita-impozitul-pe-bunurile-imobiliare-si-impozitul-funciar)
- [State Tax Service — individual wealth-tax scope](https://www.sfs.md/ro/intrebare-baza-de-date-generalizare/175)

### Georgia

The official residence service separates work, study, family reunification, permanent, investment, property-related, and other categories and supplies category-specific evidence. The work branch now includes a labor-activity-right decision in the described procedure, so older catalog rules must not be carried forward unreviewed. Property tax requires both asset and household-income predicates. Vehicle registration rules depend on whether a vehicle is imported for Georgian registration or brought into the country for more than the stated temporary period.

- [Public Service Development Agency — residence permits](https://sda.gov.ge/en/products/migration-residence-permits/)
- [Public Service Development Agency — work-residence legislative update](https://sda.gov.ge/en/an-amendment-has-been-made-to-the-legislation-regarding-the-process-of-obtaining-a-work-residence-permit/)
- [Public Service Development Agency — Georgian citizen passport](https://sda.gov.ge/en/products/passport/)
- [Public Service Development Agency — Georgian citizen ID card](https://sda.gov.ge/en/products/id-card/)
- [Revenue Service — individual property-tax liability](https://www.rs.ge/PropertyTaxLiability)
- [Revenue Service — property-tax calculator and filing/payment dates](https://www.rs.ge/PropertyTax)
- [Service Agency — vehicle registration](https://www.sa.gov.ge/p/vehicle/registration)

## Applicability questions for onboarding

Keep onboarding compact by asking only high-signal questions, then expand the selected path.

1. **People:** Who are you tracking? Add dependants only if needed.
2. **Citizenship:** Add every citizenship for each person with `+ Add citizenship`.
3. **Countries:** Where does this person live, stay, study, work, or plan to move? Add more with `+ Add country`.
4. **Basis per host country:** Tourism/visit, work, study, family, temporary residence, permanent residence, or other.
5. **Basis detail:** Show a short country-specific follow-up. Example: patent vs qualifying work permit; full-time accredited study vs other study; spouse/parent/child plus sponsor status.
6. **Assets:** Add each named possession, choose its country, type, owner, and optional friendly details.
7. **Documents:** Suggest only items whose applicability predicates pass; ask the user to confirm possession and dates.
8. **Reminders:** Let the user enter their own slash-separated offsets per obligation or copy an editable catalog suggestion. Do not show a universal reminder sequence in the plan.

Unknown answers remain `unknown`; they are not coerced to `false`. A rule requiring an unknown fact stays in “Check applicability.”

## Asset taxonomy and filtering

### Taxonomy

- **Vehicle**
  - car, motorcycle, commercial vehicle, trailer, watercraft, aircraft, other;
  - registration, title, compulsory/voluntary insurance, inspection, roadworthiness, tax, vignette/road charge, parking/resident permit, import/temporary-registration clock.
- **Real estate**
  - apartment, house, commercial unit, garage/parking place, holiday home, other;
  - title/cadastral record, property tax, rental declaration, insurance, safety inspection, association/service dates.
- **Land**
  - residential, agricultural, commercial, other;
  - title/use right, land tax, lease/use expiry, local obligations.
- **Business/participation**
  - sole proprietor, company share, company, other;
  - registration, license, annual return, tax filings. Keep this disabled until a separate business-law catalog is reviewed.
- **Other**
  - user-created documents and reminders only until a reviewed subtype exists.

### Filter contract

The catalog and plan need combinable filters:

```text
country
+ person/owner
+ possession type
+ exact possession
+ document/obligation type
+ status (needs date / upcoming / due / expired / archived)
+ legal basis/status
```

Country means the obligation's jurisdiction or asset's location, not whichever country is currently selected in the person's profile. Exact-possession values use the friendly name, such as `Toyota Camry 2019`, and reveal its child documents: registration, insurance, inspection, and tax.

## Editorial publication gate

A country pack may be published only when:

- the source is official or the current legal text is linked;
- effective dates and the review date are stored;
- the rule identifies the actor and triggering event;
- citizenship, residence, and asset-country predicates are tested independently;
- exemptions and unresolved questions are visible;
- source text supports the UI claim at the same level of specificity;
- translations are reviewed without changing legal meaning;
- at least one reviewer has checked stale-law risk;
- a regression test proves that a non-citizen is not offered that country's national/internal or international passport;
- a regression test proves that two assets of the same type in different countries receive different country rules;
- a regression test proves that two exact vehicles can be filtered independently;
- a regression test proves that patent, work permit, RVP, RVPO, and VNZH do not collapse into one status.

## Known gaps

- This matrix does not yet cover most European or East/South-East Asian countries; those should use the same schema in separate regional files.
- It is not an exhaustive inventory of visas, exemptions, refugee/humanitarian statuses, military duties, professional licenses, benefits, or family fact patterns.
- Vehicle insurance and inspection rules remain incomplete for several countries.
- Subnational tax rates and reliefs are not normalized.
- Cross-border tax residency, foreign-asset declarations, and double-taxation rules require a separate reviewed tax module.
- Source pages and laws can change. A scheduled source-review workflow is required before this becomes a paid legal-adjacent catalog.

