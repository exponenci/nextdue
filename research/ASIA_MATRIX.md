# East and Southeast Asia coverage matrix

Reviewed: **2026-11-15**  
Coverage: **Japan, South Korea, mainland China, Hong Kong, Singapore, Thailand, Malaysia, Indonesia, Vietnam, the Philippines, and Taiwan**  
Status: **research map; not a publishable legal pack**

This document defines the facts NextDue should be able to collect and the broad obligation families it should be able to represent. It does not assert that every listed status applies to a user, and it intentionally does not encode filing, renewal, reporting, tax, inspection, or insurance deadlines. A rule can enter the user-facing catalog only after an editor has reviewed the individual official source, recorded its scope and effective date, and established a re-review cadence.

## Product rules derived from the research

1. A country being relevant to a person is not enough to suggest that country's passport or national identity document.
   - A national passport is suggested only from an explicit citizenship/nationality record and any additional eligibility facts required by the issuing authority.
   - A national identity document is suggested only from citizenship or another explicit statutory eligibility record. Residence cards issued to foreigners are modeled separately.
   - Residence, travel, family, employment, study, or asset ownership alone never unlocks a national passport suggestion.
2. Legal presence is an explicit **basis**, not a generated “starter pack.” Store a canonical basis and the exact issued status/code together.
3. A visa, permission to enter or stay, work authorization, residence permit/card, sponsor relationship, and address/arrival registration are separate records. One may depend on another, but they must not be collapsed into a single “visa” field.
4. Citizenship, usual residence, current physical stay, destination, tax residence, and an asset's country are separate many-to-many facts.
5. Immigration classifications change. Store both a stable product category and the exact wording/code printed on the user's record; never infer an exact code from a broad answer such as “work.”
6. Asset obligations are attached to the exact asset and issuing jurisdiction, not just to its owner. A person can own several homes, vehicles, land plots, or businesses in different countries.
7. Every legal-adjacent catalog item needs an official source, reviewed date, jurisdiction, audience, applicability questions, confidence, risk, and an “unknown / confirm” route. Updates never silently overwrite a user-confirmed fact or date.

## Minimum normalized facts

### Person and country relationship

- `citizenships[]`: jurisdiction, acquired date if relevant, lost/renounced date if relevant, evidence type; allow multiple.
- `residences[]`: country, region, address label without requiring a full address, from/to dates, usual/current/previous flag.
- `physicalStays[]`: destination, entry date, authorized-until date, departure date, purpose.
- `taxResidences[]`: user-confirmed country and tax year; never infer solely from immigration status.
- `statusRecords[]`: canonical basis, exact issued title/code, issuing authority, document number suffix only, issued/valid-from/valid-until, sponsor, employer/school/family link, linked dependants.
- `workAuthorizations[]`, `residenceCards[]`, `addressRegistrations[]`, and `arrivalDeclarations[]`: independent records linked to the relevant status.
- `dependants[]`: person link, relationship, principal-holder link, and whether the dependant has an independent status or work permission.

Recommended canonical status families:

`short_visit`, `work`, `study`, `family`, `investment_business`, `talent_specialist`, `retirement`, `humanitarian_special`, `long_term_residence`, `permanent_residence`, `citizen_other`.

### Exact possession hierarchy

```text
person / household
└── asset (country + exact asset label + owner)
    ├── registrations and title records
    ├── licences and permits
    ├── inspections / certifications
    ├── insurance policies
    ├── taxes / fees / notices
    └── recurring maintenance or user-created obligations
```

Each asset needs at least:

- country and subnational jurisdiction;
- asset type and subtype;
- user-visible nickname, make/model or property label;
- owner(s), keeper/operator/occupant where different, and ownership share if useful;
- acquired/disposed dates and active/archived state;
- issuing/registration authority and identifier suffix, without requiring a full sensitive number;
- use: personal, rental, commercial, vacant, imported/exported, or other;
- linked records, each with its own validity, recurrence, sources, and reminder plan.

Suggested asset families are `real_property`, `land`, `vehicle`, `watercraft`, `business`, and `other`. A car, for example, is one asset; its registration, roadworthiness inspection, insurance, road tax/fee, parking or operating permit, and driving-related records are linked obligation records rather than separate cars.

## Jurisdiction matrix

### Japan

**Coverage status:** research map / not publishable legal pack.

**Foreigner bases to represent**

- Temporary Visitor.
- Work or activity-based statuses, stored by exact issued status.
- Student and training-related statuses.
- Dependent.
- Spouse or Child of Japanese National; Spouse or Child of Permanent Resident.
- Long-Term Resident.
- Permanent Resident.
- Designated Activities, with exact activity recorded.

**Identity and status gates**

- Japanese passport: citizenship/nationality-gated; never suggested from Japanese residence or an asset.
- Residence card: a foreign-resident record for eligible mid- to long-term residents, not a citizenship document.
- Status of residence, period of stay, residence card validity, re-entry permission, and municipal address notification are distinct facts.

**Applicability questions**

- Exact status of residence and period printed on the permit/card?
- Mid- or long-term resident and residence card holder?
- Employer, school, spouse, dependant, or other sponsor link?
- Any status change, extension, re-entry, or municipal address event to track?
- Permanent-residence application in progress or already granted?

**Asset hooks**

- Property/land: exact property, ownership/occupancy, municipality/prefecture, notices and tax records.
- Vehicle: exact vehicle, registration, compulsory/optional insurance, inspection/certification, and local parking/operating records where applicable.
- Business: entity registration, licences, tax notices, payroll/employment-related records.

**Official sources**

- [Status of residence directory — Immigration Services Agency](https://www.moj.go.jp/isa/applications/status/index.html?lang=en&language=jpn)
- [Guidance for living in Japan — Immigration Services Agency](https://www.moj.go.jp/isa/support/guidance/index.html?hl=en)
- [Residence card and address-notification overview — Immigration Services Agency](https://www.moj.go.jp/isa/content/001462561.pdf)
- [Permanent residence procedure — Immigration Services Agency](https://www.moj.go.jp/isa/applications/procedures/16-4.html)

**Cautions:** status conditions and permitted activities vary materially. Do not turn a broad work/student/family answer into a specific status, and do not infer work permission from residence alone.

### South Korea

**Coverage status:** research map / not publishable legal pack.

**Foreigner bases to represent**

- Short stay/visitor.
- Study and training.
- Professional employment, non-professional employment, and other employment categories.
- Investment/business.
- Dependant family and marriage migrant.
- Overseas Korean status.
- Permanent resident.

**Identity and status gates**

- Republic of Korea passport and citizen identity records: citizenship-gated.
- Foreigner/residence registration is a status record for applicable foreign residents, not a national identity entitlement.
- Visa/entry status, period of stay, residence/foreigner registration, and work eligibility remain separate.

**Applicability questions**

- Exact status/code and authorized period of stay?
- Intended duration above or below the registration threshold applicable to the issued status?
- Employer, employment-permit route, school, spouse, family, or investor sponsor?
- Residence card/foreigner registration held and address changes to track?
- Work permission inherent in the status, restricted, or separately authorized?

**Asset hooks**

- Property: exact unit/land, ownership and occupancy, local tax/notices.
- Vehicle: exact vehicle, registration, inspection, compulsory insurance, taxes/fees.
- Business: entity, business/investment registration, licences, tax and employment records.

**Official sources**

- [Korea Immigration Service](https://www.immigration.go.kr/immigration_eng/index)
- [Residence and stay information — Study in Korea / Government of Korea](https://www.gks.go.kr/ko/life/residenceAndStayInfo.do)
- [Korea Visa Portal](https://www.visa.go.kr/main.do)
- [Employment Permit System — Ministry of Employment and Labor](https://www.moel.go.kr/english/policy/international.do)

**Cautions:** registration and reporting duties depend on duration and exact status. Treat “staying more than 90 days” as an applicability question requiring official verification, not as a universal catalog deadline.

### Mainland China

**Coverage status:** research map / not publishable legal pack. Mainland China is a separate immigration jurisdiction from Hong Kong, Macao, and Taiwan.

**Foreigner bases to represent**

- Tourism/visit.
- Business and other short-term activities.
- Work.
- Study.
- Family visit/reunion and private affairs.
- Talent and other special categories.
- Permanent residence.

**Identity and status gates**

- PRC passport and resident identity card: citizenship/eligibility-gated; never suggested from mainland residence or asset ownership.
- Visa, entry, temporary stay, residence permit, work authorization, and accommodation/residence registration are distinct records.
- A work residence permit must link to the separately verified work authorization where required.

**Applicability questions**

- Exact visa category, number of entries, and stay duration?
- Exact residence-permit purpose and validity?
- Employer, school, family member, inviter, or other sponsor?
- Work permit/authorization or exemption held?
- Hotel stay or non-hotel accommodation requiring a separate registration record?
- City/province and any address change?

**Asset hooks**

- Property/land-use interest: exact unit/right, city, ownership/occupancy, notices and applicable taxes/fees.
- Vehicle: exact vehicle, local registration/plate, inspection, compulsory insurance, tax/fee records.
- Business: entity, licences, investment and tax registrations, employee/work-related records.

**Official sources**

- [Exit and Entry Administration Law — National Immigration Administration](https://en.nia.gov.cn/n147418/n147458/c155978/content.html)
- [Entry, stay and residence services — National Immigration Administration](https://en.nia.gov.cn/n147423/n147478/n147715/index.html)
- [Residence permit guidance — National Immigration Administration](https://en.nia.gov.cn/n147423/n147478/n147715/c158270/content.html)
- [Visa and residence registration guidance — National Immigration Administration](https://en.nia.gov.cn/n147428/n147498/n147760/n147850/c158717/content.html)

**Cautions:** local implementation and document names can differ. Store locality and issuing authority. Never treat visa validity, permitted stay, or residence-permit validity as interchangeable.

### Hong Kong

**Coverage status:** research map / not publishable legal pack. Hong Kong is modeled as its own immigration and asset jurisdiction.

**Foreigner bases to represent**

- Visitor/transit.
- Study.
- Employment/professional schemes.
- Investment/business/entrepreneur routes.
- Talent admission schemes.
- Training.
- Dependant.
- Right of abode, right to land, and other residence entitlements.

**Identity and status gates**

- HKSAR passport: never suggested from Hong Kong residence alone; eligibility requires the authority's nationality and permanent-resident conditions to be explicitly confirmed.
- Hong Kong identity card: model as a holder/registration entitlement, not as proof of citizenship. Store permanent/non-permanent classification as printed/verified.
- Entry permission/visa, limit of stay, work/study conditions, dependant status, and identity-card registration are separate.

**Applicability questions**

- Exact entry scheme/status and limit of stay?
- Visitor, employee, student, entrepreneur, talent, trainee, or dependant?
- Employer, institution, business, or principal-status link?
- Permission to work/study and any conditions?
- Hong Kong identity card held, and permanent/non-permanent status?
- Right of abode/right to land claimed or confirmed?

**Asset hooks**

- Property: exact property, ownership/tenancy, rates/government-rent and tax notices where applicable.
- Vehicle: exact vehicle, registration/licensing, inspection, insurance and operating permits.
- Business: company/business registration, sector licences, tax and employer records.

**Official sources**

- [Immigration entry guideline — Immigration Department](https://www.immd.gov.hk/eng/services/visas/immigration-entry-guideline.html)
- [Visit/transit rules — Immigration Department](https://www.immd.gov.hk/eng/services/visas/visit-transit/visit-visa-entry-permit.html)
- [General Employment Policy — Immigration Department](https://www.immd.gov.hk/eng/services/visas/GEP.html)
- [Residence as a dependant — Immigration Department](https://www.immd.gov.hk/eng/services/visas/residence_as_dependant.html)

**Cautions:** visitors generally cannot take employment, establish/join a business, or study without the appropriate permission. Never infer unrestricted work rights for a dependant without checking the exact route and current conditions.

### Singapore

**Coverage status:** research map / not publishable legal pack.

**Foreigner bases to represent**

- Short-Term Visit Pass.
- Student's Pass.
- Long-Term Visit Pass.
- Work passes and permits, including Employment Pass, S Pass, Work Permit and other route-specific passes.
- Dependant's Pass and other family routes.
- Permanent residence.

**Identity and status gates**

- Singapore passport and citizen identity records: citizenship-gated.
- Permanent-resident identity records require explicit PR status; they are not unlocked by any long-term pass.
- ICA immigration permission and Ministry of Manpower work passes are separate authority records and must not be merged.

**Applicability questions**

- Exact ICA pass and exact MOM pass, if any?
- Employer, school, spouse/principal holder, or family sponsor?
- Entry permission and authorized stay dates?
- Work-pass issuance/renewal/cancellation status and employment link?
- Permanent-residence application in progress or PR already granted?
- Residential address and any authority-specific update obligation?

**Asset hooks**

- Property: exact property, ownership/occupancy, eligibility/approval record where relevant, property-tax and management records.
- Vehicle: exact vehicle, registration, road tax, inspection, insurance, entitlement/permit records where applicable.
- Business: ACRA entity, sector licences, corporate tax/GST and employer records.

**Official sources**

- [Short-Term Visit Pass — Immigration & Checkpoints Authority](https://www.ica.gov.sg/enter-transit-depart/extend-stay)
- [Student's Pass — Immigration & Checkpoints Authority](https://www.ica.gov.sg/information-and-e-services/long-term-visit-and-study/student-s-pass)
- [Long-Term Visit Pass — Immigration & Checkpoints Authority](https://www.ica.gov.sg/reside/LTVP/)
- [Permanent residence — Immigration & Checkpoints Authority](https://www.ica.gov.sg/reside/PR/)
- [Passes and permits — Ministry of Manpower](https://www.mom.gov.sg/passes-and-permits)

**Cautions:** an immigration stay permission is not a work pass. Work-pass categories and conditions must be reviewed with the MOM record for the exact route; do not derive them from job title or salary entered by the user.

### Thailand

**Coverage status:** research map / not publishable legal pack.

**Foreigner bases to represent**

- Visa-exempt/visitor and tourist routes.
- Non-Immigrant business/work route.
- Education.
- Family/marriage/dependant.
- Retirement.
- Privilege and other special routes.
- Permanent residence.

**Identity and status gates**

- Thai passport and citizen identity card: citizenship-gated.
- Visa/permission to stay, extension, re-entry permission, arrival information, address/periodic reporting, and work permit are separate records.

**Applicability questions**

- Exact entry basis, visa class and permission-to-stay date?
- Extension or re-entry permission held?
- Employer/business, school, spouse/family, retirement, or other basis?
- Work permit or exemption held?
- Address and reporting obligations applicable to the exact stay type?
- Provincial immigration office responsible for the record?

**Asset hooks**

- Property/land/lease: exact right or unit, ownership/lease structure, province, tax/fee and management records.
- Vehicle: exact vehicle, registration, inspection, compulsory/optional insurance, taxes/fees.
- Business: entity/foreign-business approvals where applicable, sector licences, tax and employee records.

**Official sources**

- [Thailand Digital Arrival Card and immigration notices — Immigration Bureau](https://tdac.immigration.go.th/arrival-card/)
- [Public service handbook — Lamphun Immigration](https://lamphun.immigration.go.th/คู่มือการให้บริการประชาชน/)

**Cautions:** the public guidance is fragmented across central and provincial immigration sites. Do not publish a deadline or reporting rule from a provincial summary until it has been checked against the current central rule and scoped to the exact status.

### Malaysia

**Coverage status:** research map / not publishable legal pack.

**Foreigner bases to represent**

- Short-Term Social Visit Pass.
- Employment Pass and other employment/temporary employment routes.
- Professional Visit Pass.
- Student Pass.
- Dependant Pass.
- Long-Term Social Visit Pass.
- Malaysia My Second Home or other long-stay programme, when applicable.
- Permanent residence/entry-permit route.

**Identity and status gates**

- Malaysian passport and citizen identity card: citizenship-gated.
- Visit, employment, professional-visit, student, dependant and long-term social-visit passes are separate exact pass types.
- A dependant pass must link to its principal holder; work entitlement must be verified independently.

**Applicability questions**

- Exact pass type/category and endorsing authority?
- Employer, institution, spouse/principal holder, or programme sponsor?
- Work authorization, permission/endorsement, or exemption held?
- Principal and dependant expiry dates linked but independently confirmed?
- State/Sabah/Sarawak or other territorial rule relevant?

**Asset hooks**

- Property/land: exact interest, state, ownership/approval status where relevant, assessment/quit-rent and tax notices.
- Vehicle: exact vehicle, registration/licence, inspection where applicable, insurance, road tax.
- Business: entity, sector/local licences, tax/SST and employer records.

**Official sources**

- [Employment Pass — Expatriate Services Division, Immigration Department](https://esd.imi.gov.my/portal/expatriates/myxpats/key-services/employment-pass/)
- [Dependant Pass — Expatriate Services Division](https://esd.imi.gov.my/portal/expatriates/myxpats/key-services/employment-pass/dependant-pass/)
- [Long-Term Social Visit Pass — Immigration Department](https://www.imi.gov.my/index.php/en/main-services/pass/visitor-pass/social-visit-pass/long-term-social-visit-pass/)
- [Student Pass — Immigration Department](https://www.imi.gov.my/index.php/en/main-services/pass/student-pass/)
- [Short-Term Social Visit Pass — Immigration Department](https://www.imi.gov.my/index.php/en/main-services/pass/visitor-pass/social-visit-pass/short-term-social-visit-pass/)

**Cautions:** territorial and programme-specific rules matter. Avoid presenting one generic “Malaysia residence permit”; keep the pass family and exact endorsement.

### Indonesia

**Coverage status:** research map / not publishable legal pack.

**Foreigner bases to represent**

- Visitor and visa-on-arrival routes.
- Work.
- Investor.
- Education.
- Family/reunification.
- Repatriation/descent and former-citizen routes.
- Second home, remote-worker or retirement routes where currently available.
- Limited stay and permanent stay.

**Identity and status gates**

- Indonesian passport and citizen identity card: citizenship-gated.
- Visa, visit stay permit, limited stay permit, permanent stay permit, re-entry permission and work authorization are separate records.
- Store both the stable category and exact visa/stay-permit code because codes and route names change.

**Applicability questions**

- Exact visa code and purpose shown in the current official system?
- Visit, limited-stay, or permanent-stay permit held?
- Employer, company investment, school, spouse/family, former-citizen/descent, or other sponsor?
- Work authorization or exemption held?
- Local address/reporting or sponsor action applicable?
- Re-entry permission required or included for the exact permit?

**Asset hooks**

- Property/land/right/lease: exact legal interest, locality, owner/holder eligibility, taxes/fees and management records.
- Vehicle: exact vehicle, registration certificate/plate, periodic tax/fees, inspection where applicable, insurance.
- Business: entity/investment registration, business identification/licences, tax and employment records.

**Official sources**

- [Indonesia visa-category list — Directorate General of Immigration regional office](https://kanwilsultra.imigrasi.go.id/wna/daftar-visa-indonesia)
- [Visit stay permit — East Jakarta Immigration Office](https://jakartatimur.imigrasi.go.id/izin-tinggal-kunjungan/)
- [Limited stay permit — Surabaya Immigration Office](https://surabaya.imigrasi.go.id/layanan-warga-negara-asing/izin-tinggal-terbatas/)

**Cautions:** route names and codes change frequently, and regional office pages may lag. The production catalog needs a current central-source check before publishing any specific code or deadline.

### Vietnam

**Coverage status:** research map / not publishable legal pack.

**Foreigner bases to represent**

- E-visa and other visit routes.
- Sponsored employment/work.
- Study.
- Family/dependant sponsorship.
- Investor/business routes.
- Temporary residence card.
- Permanent residence where eligible.

**Identity and status gates**

- Vietnamese passport and citizen identity records: citizenship-gated.
- Visa, sponsor approval, work permit/exemption, temporary-stay declaration, temporary residence card and permanent residence are separate records.

**Applicability questions**

- Exact visa category, validity, entries and authorized stay?
- Sponsoring organization or family member?
- Work permit or exemption held, and linked employer?
- Temporary residence card held and on which basis?
- Accommodation provider or individual responsible for temporary-stay declaration?
- Family relationship and principal-status link for dependants?

**Asset hooks**

- Property/land-use/lease interest: exact unit/right, locality, ownership/occupancy and tax/fee records.
- Vehicle: exact vehicle, registration, inspection, compulsory insurance, taxes/fees.
- Business/investment: enterprise and investment records, licences, tax and employee/work-permit links.

**Official sources**

- [Vietnam Immigration Department portal](https://immigration.gov.vn/)
- [Vietnam e-visa portal](https://evisa.immigration.gov.vn/en_US/web/guest/trang-chu-ttdt)
- [Organization sponsorship procedure — Immigration Department](https://evisa.immigration.gov.vn/web/guest/huong-dan-dvbl-xdnc)
- [Individual/family sponsorship — Immigration Department](https://immigration.gov.vn/web/guest/ca-nhan-bao-lanh-nguoi-nuoc-ngoai)

**Cautions:** sponsorship, work authorization, visa/entry permission, residence card and accommodation declaration must not be conflated. Exact categories and responsible authorities need Vietnamese-source editorial review.

### Philippines

**Coverage status:** research map / not publishable legal pack.

**Foreigner bases to represent**

- Tourist/temporary visitor.
- Pre-arranged employment, including 9(g), stored by exact issued category.
- Student, including 9(f), stored by exact issued category.
- Dependants linked to a principal visa/status.
- Marriage/non-quota immigrant routes, including 13(a) where applicable.
- Probationary/permanent resident routes and special/investor visas.

**Identity and status gates**

- Philippine passport and citizen identity records: citizenship-gated.
- Visa/status, admission/stay, alien registration record/card, work authorization and annual reporting are separate records.
- Annual reporting should be shown only to registered foreign nationals for whom the current official rule applies.

**Applicability questions**

- Exact visa/status and admission/stay validity?
- Employer, school, spouse, principal holder, investment or other sponsor?
- Alien registration record/card held?
- Separate work permit/authorization required or held?
- Annual report applicability confirmed for the current status?
- Probationary vs permanent stage for marriage/residence routes?

**Asset hooks**

- Property/land/unit/lease/share: exact legally held interest, locality, ownership eligibility and tax/association records.
- Vehicle: exact vehicle, registration, renewal/inspection records, compulsory insurance and fees.
- Business/investment: entity, investment or sector approvals, permits, tax and employer records.

**Official sources**

- [Visa directory — Bureau of Immigration](https://immigration.gov.ph/Visas/)
- [Immigration FAQs](https://immigration.gov.ph/faqs/)
- [Pre-arranged employment visa 9(g)](https://immigration.gov.ph/pre-4-arranged-employment-visa-9g/)
- [Student visa 9(f)](https://immigration.gov.ph/student-visa-9f/)

**Cautions:** do not infer eligibility for land ownership or a residence route from marriage, investment, or long stay. Asset-right and immigration checks need independent applicability gates.

### Taiwan

**Coverage status:** research map / not publishable legal pack. Taiwan is modeled as a distinct immigration and asset jurisdiction.

**Foreigner bases to represent**

- Visitor/visa-exempt stay.
- Employment.
- Investment/business.
- Study.
- Family reunion/dependant.
- Employment Gold Card/foreign professional route.
- Alien Resident Certificate and Alien Permanent Resident Certificate routes.

**Identity and status gates**

- Taiwan passport and national identity records require explicit nationality/household-registration eligibility facts; they are never suggested from an ARC, APRC, stay, or asset alone.
- Visa/visa exemption, reason for residence, work permit/exemption, resident authorization, ARC, APRC and address records are separate.

**Applicability questions**

- Exact entry basis and authorized stay?
- Exact reason for residence and resident-visa/authorization record?
- ARC, APRC or Gold Card held, with exact validity?
- Employer, school, spouse/family, investment or professional basis?
- Work permit, open work rights, or exemption explicitly confirmed?
- Address change or re-entry event applicable?

**Asset hooks**

- Property/land/right: exact asset and interest, locality, foreign-owner eligibility/approval where relevant, tax/fee records.
- Vehicle: exact vehicle, registration, inspection, compulsory insurance, taxes/fees.
- Business/investment: company/investment approval, licences, tax and employment records.

**Official sources**

- [ARC application and renewal — National Immigration Agency](https://www.immigration.gov.tw/5475/5478/141465/141808/141970/)
- [Residence application from visitor or visa-exempt status — National Immigration Agency](https://www.immigration.gov.tw/5475/5478/141465/141808/141824/)
- [Stay and residence Q&A — National Immigration Agency](https://news.immigration.gov.tw/NewsSection/Detail/7B823596-8BE9-47FD-8750-A9EC98B9CDF8?lang=EN&topic=onetouch)
- [Immigration regulations — National Immigration Agency](https://www.immigration.gov.tw/5475/5478/141478/141482/148812/cp)

**Cautions:** nationality, household registration, passport eligibility and immigration residence are related but not interchangeable concepts. Avoid simplifying them into a single `citizen` boolean.

## Publishability checklist for a future catalog item

An individual obligation may move from this matrix into a country pack only when all answers below are recorded:

- What exact audience does the official rule cover, and which facts exclude a user?
- Is the record tied to citizenship, immigration basis, location, tax status, an exact asset, or a combination?
- Which authority and subnational jurisdiction issue or enforce it?
- Is the triggering event entry, issue, expiry, address change, acquisition, notice, tax year, inspection, or another event?
- Is the timing a fixed date, relative interval, periodic recurrence, user-entered date, or notice-controlled date?
- Are days calendar or working days, and what happens on holidays/weekends?
- Which exceptions, grace periods, or sponsor actions make a generic deadline unsafe?
- What official source and effective date support the rule?
- When must the source be reviewed again, and how will changed/withdrawn sources be detected?
- Can the item be displayed as “possible — confirm” rather than silently added?

Until those fields are complete, the UI may offer the relevant status or asset record type for manual tracking, but it must not claim that a specific obligation or deadline applies.
