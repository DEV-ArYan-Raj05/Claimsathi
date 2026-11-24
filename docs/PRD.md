ClaimSathi — Micro-Insurance Claim Assistant PRD




ClaimSathi — Micro-Insurance Claim
Assistant PRD
  ​Nov 23, 2026



0. How to use this PRD
This is the single source of truth for the Build for Bharat (Track 1, Fintech, prompt 3) build.
Every agent and tool reads this first, then works only on the section it is told to.

Hand-off rules for each tool


  Tool                      What to give it                          What it owns

  Claude                    Export as Markdown → save as             Backend (FastAPI), AI pipelines, DB
  Code                       docs/PRD.md in the repo root, plus a    migrations, wiring frontend to API
                            short CLAUDE.md that says "Read
                            docs/PRD.md before any task. Follow
                            section 5 for stack, section 6 for API
                            and schema."

  Impeccable                Run /impeccable init in the              Visual quality, spacing, type, motion
                            frontend repo. Paste section 2           polish
                            (tokens) and section 4 (screens) into
                            the generated PRODUCT.md and
                             DESIGN.md . Then use /impeccable
                            shape , audit , polish , animate per
                            screen

  Lovable                   Paste sections 1, 2 and 4 as the first   First-pass React UI scaffold
                            prompt. One screen per prompt after
                            that. Connect GitHub so Claude
                            Code sees the same repo

  Figma                     Build the token set from section 2 as    Mock-ups, judge-facing visuals
                            Figma variables (two modes: Health,
                            Crop). Frames named exactly as
                            screen IDs in section 4 (e.g. H-03
                            Policy Detail )

  Antigravity               Same docs/PRD.md + a task line:          Targeted fixes and refactors
                            "Change only <file/feature>. Do not
                            touch other modules. Keep files
                            under 300 lines."




                                                                                                      Page 1 of 29
ClaimSathi — Micro-Insurance Claim Assistant PRD




Golden rules for every agent

   1. Never hard-code API keys. All secrets live in .env (backend) and .env.local
      (frontend, public keys only). Do not paste keys into chat, this doc, Lovable prompts or
      Git.
   2. Screen IDs, endpoint paths, table names and colour token names in this doc are
      contracts. Rename only by editing this doc first.
   3. Health and Crop share one codebase and one API. Track is a parameter ( track =
       health | crop ), never a fork.
   4. Keep each file under 300 lines. One feature per folder.
   5. When unsure, add a TODO with the section number, don't invent behaviour.

Open decisions (fill these in before or during the build)

       Colour mapping: the brief listed both palettes under "health". This PRD assumes Crop
       = olive/beige/terracotta and Health = sky blue/cloud white/muted red. Confirm or
       swap in section 3.
       Product name: "ClaimSathi" is a working name.
       Scroll animation spec: file and video reference to be added to section 4.4.
       Database details: Supabase Postgres assumed (section 5). Confirm hosting and
       region.
       Voice and calling providers: Sarvam AI + Twilio assumed (section 3.6). Twilio is needed
       because Supabase sends WhatsApp OTPs only through Twilio. Create the Twilio
       WhatsApp sender (or Sandbox) and the OTP + claim-update templates early: approval
       can take time.
       Languages for the demo: Hindi + English assumed.


1. Product overview
ClaimSathi turns a policy paper and a pile of handwritten bills into a complete, insurer-
ready claim, then tracks it until the money lands. It is a B2C web app for low-income
policyholders: farmers with crop cover and workers or families with small health/accident
cover (sum assured up to ₹1,00,000).

Problem. Micro-insurance claims fail for paperwork reasons, not coverage reasons. People
don't know their clauses, miss deadlines (crop losses must be reported within 72 hours),
submit bills without a doctor's stamp or registration number, and then have no visibility on
where the claim is stuck.

Users




                                                                                        Page 2 of 29
ClaimSathi — Micro-Insurance Claim Assistant PRD




  Persona                                    Track    Context                   What they need

  Ramesh, 42, wheat                          Crop     PMFBY-insured, basic      Report hail damage fast,
  farmer, Rohtak                                      Android phone, reads      know what proof to send,
                                                      Hindi                     know when money arrives

  Sunita, 35, domestic                       Health   Small health/accident     Turn handwritten bills into
  worker, Delhi                                       policy from employer or   a valid reimbursement
                                                      MFI, treated at a local   claim
                                                      clinic

  Helper (CSC operator,                      Both     Files on someone else's   Multi-profile, voice
  NGO volunteer, family                               behalf                    guidance, printable claim
  member)                                                                       pack


Goals (measured in the demo)

   1. Upload a policy and get its key clauses, limits, waiting periods and exclusions
      extracted in under 60 seconds.
   2. Generate a ready-to-send claim letter + checklist from the policy and the incident in
       under 2 minutes.
   3. Catch at least these defects on uploaded bills: missing stamp, missing signature,
       missing doctor registration number, missing date, missing patient name, total
       mismatch.
   4. Show a claim's live stage and an expected settlement date on one screen.

In scope for the hackathon (MVP)

       Two switchable tracks: Health (incl. accident) and Crop
       Policy Directory (upload, extract, store as "active policy")
       Claim Template generator (letter + claim form fields + checklist)
       Missing-document and missing-stamp alerts on uploaded bills
       Claim Readiness Score per track
       Claim Tracker with timeline and expected dates
       Voice assistant (speak to file / ask about policy) and outbound reminder calls
       Sign-in with Google and a verified WhatsApp number (Supabase Auth), WhatsApp
       claim updates, Supabase database

Out of scope (say so if judges ask)

       Filing directly into insurer or PMFBY systems (no public API). We generate the claim
       pack; the user or helper sends it by email, portal upload or in person. Tracker status is
       updated by the user, by parsing insurer emails/SMS the user forwards, or by a mock



                                                                                                      Page 3 of 29
ClaimSathi — Micro-Insurance Claim Assistant PRD




       insurer console for the demo.
       Life insurance, motor, cashless hospital flows (cashless is hospital-to-insurer; we only
       handle reimbursement).
       Legal advice. The app explains clauses; it doesn't promise approval.


2. Two tracks and the design system
The app has one shell and two themed tracks, Health and Crop. The user switches with a
two-option toggle that stays fixed in the top bar on every screen. Each track has its own
colours, copy, document rules and score, but the same screens and components.

Track switching behaviour

       Routes are prefixed: /health/... and /crop/... . Switching keeps the user on the
       equivalent screen (e.g. /health/policies → /crop/policies ).
       Theme is applied by data-track="health" | "crop" on <html> . All colours come
       from CSS variables, so components never hard-code hex.
       The switch animates: a 400 ms colour cross-fade of the background plus the toggle
       pill sliding across. Respect prefers-reduced-motion (instant swap).
       The last-used track is saved on the user profile and in localStorage .
       A user can hold policies in both tracks. Each track shows only its own policies, claims
       and scores.

Colour tokens (60 / 30 / 10)

Assumption: the brief listed both palettes under Health. This PRD maps olive to Crop and
sky blue to Health. Swap the two data-track blocks if that's wrong.


  Token                           Role and share                  Crop track        Health track

   --color-                       60%: page backgrounds of        Olive green       Sky blue #87BFE6
  dominant                        hero/section bands, top bar,    #6B6E4A
                                  sidebar, large illustrations

   --color-                       30%: cards, panels, inputs,     Warm beige        Cloud white #F4F6F8
  secondary                       table rows, secondary           #DFD5C5
                                  sections

   --color-                       10% or less: critical details   Terracotta rust   Muted red #B04A4A
  accent                          only (see rules)                #B5532F

   --color-ink                    Body text on secondary          #2B2C1E           #0F2A3D




                                                                                                       Page 4 of 29
ClaimSathi — Micro-Insurance Claim Assistant PRD




  Token                           Role and share                Crop track       Health track

   --color-on-                    Text and icons on dominant    #FFFFFF (5.3:1   #0F2A3D (dark text;
  dominant                                                      on olive)        white fails on sky blue)

   --color-                       Captions, borders, dividers   #8A8670          #6B8599
  muted

   --color-                       Settled / approved states     #4F7A3A          #2E7D5B
  success                         only


Hex values for the accent, sky blue and support colours are proposals. Confirm them in
Figma, then lock them here.

Accent rules (strict)

The accent appears only on these six things. Anything else uses dominant, secondary or
ink.

   1. The single primary action on a screen ("Generate claim", "Send to insurer", "Report
       loss now").
   2. Missing-document and missing-stamp alerts.
   3. Deadline countdowns (e.g. crop 72-hour window, health intimation window).
   4. A Claim Readiness Score below 60.
   5. A claim status of "Query raised" or "Rejected".
   6. The amount figure on the expected settlement card.

No accent on decorative icons, headings, borders, links, hover states, charts, or
illustrations.

Typography and layout

       Fonts: a humanist sans with full Devanagari support, e.g. "Mukta" or "Noto Sans" +
       "Noto Sans Devanagari" (Google Fonts). Final pick happens in Impeccable / Figma.
       Base size 16 px, minimum 14 px. Large tap targets (48 px min) because users are on
       low-end phones.
       Mobile-first, 360 px design width. Desktop is a centred 1200 px layout with a left
       sidebar.
       Icons: Lucide (ships with shadcn/ui).
       Copy is bilingual: every string in /locales/en.json and /locales/hi.json . No hard-
       coded strings in components.

Per-track content differences




                                                                                                   Page 5 of 29
ClaimSathi — Micro-Insurance Claim Assistant PRD




  Item                           Health                                 Crop

  Hero line                      "Your treatment bills, claim-ready."   "Crop damaged? Report within 72
                                                                        hours."

  Policy types                   Individual/family health, personal     PMFBY, RWBCIS, state crop
                                 accident, group micro-health           schemes, private crop cover

  Key incident                   Patient, hospital/clinic, admission    Crop, season (Kharif/Rabi),
  fields                         and discharge dates, diagnosis,        survey/khasra no., area affected
                                 accident yes/no                        (ha), cause, date of event,
                                                                        geotagged photos

  Main deadline                  Insurer's intimation window from       72 hours from the event for
                                 policy (often 24–48 h for              localised calamity
                                 hospitalisation)

  Main                           Bills, prescriptions, discharge        Loss intimation, photos, land
  documents                      summary, reports, FIR/MLC for          record, sowing certificate, bank
                                 accidents                              passbook




3. Core features
Three features carry the demo (Policy Directory, Claim Template, Missing-Document
Alerts). The score, tracker and voice/calling make it feel complete. Each feature works in
both tracks, with track-specific rules from the tables below.


3.1 Policy Directory (P0)
The user uploads a policy once; the app reads every clause and keeps it as an "active
policy" they can query and claim against.

Flow

   1. Upload PDF, photo or scan (multi-page). Accept JPG, PNG, HEIC, PDF up to 20 MB.
   2. OCR + layout extraction → raw text with page and box coordinates.
   3. LLM structured extraction into the PolicyExtract schema (section 6.3). Every
       extracted field stores its source page and quote so the UI can show "from page 4".
   4. User confirms or edits the key fields (insurer, policy no., insured names, period, sum
       insured).
   5. Policy saved with status active , expiring_soon (≤ 30 days), or expired .

What we extract




                                                                                                      Page 6 of 29
ClaimSathi — Micro-Insurance Claim Assistant PRD




  Field group                   Health                                 Crop

  Identity                      Insurer, TPA, policy no., product      Insurer, scheme (PMFBY/RWBCIS),
                                name, insured members, nominee         application no., farmer name,
                                                                       bank/branch, loanee or non-loanee

  Period and                    Start/end date, sum insured (≤         Season, crop(s), sum insured per ha,
  money                         ₹1,00,000), premium, co-pay %,         insured area per survey no., farmer
                                room-rent cap, sub-limits              premium paid

  Waiting                       Initial (usually 30 days), specific-   Not applicable; enrolment cut-off
  periods                       disease, pre-existing                  date instead

  Covered                       Hospitalisation, day care, accident,   Prevented sowing, mid-season
  events                        pre/post hospitalisation days          adversity, localised calamity, post-
                                                                       harvest loss, yield loss

  Exclusions                    Full list, each with plain-language    Full list (e.g. war, theft, malicious
                                explanation                            damage)

  Claim                         Intimation window, documents list,     Intimation window (72 h), channels
  procedure                     address/email, claim form name         (app, 14447, bank, agri office), docs
                                                                       list

  Fine print                    Anything that can reject a claim:      Anything that can reject a claim:
  flags                         deductibles, disease caps, "original   survey-number mismatch, premium
                                bills only"                            not debited before the event


Policy Detail screen shows: a one-paragraph plain-language summary (Hindi/English), a
coverage card, a "What can reject my claim" list (fine-print flags, highest risk first), and
"Ask this policy" (text or voice Q&A grounded only in the policy text, with page citations).


3.2 Claim Template generator (P0)
Given an active policy and an incident, the app produces a claim pack the user can send to
the insurer as-is.

Inputs: the selected policy, an incident form (fields per track in section 2), and the
uploaded supporting documents.

Outputs (one "Claim Pack")

   1. Claim letter: addressed to the insurer/TPA claims department from the policy, citing
      policy no., the covered clause (with clause number/page), incident facts, amount
       claimed, enclosures list. English + Hindi.




                                                                                                           Page 7 of 29
ClaimSathi — Micro-Insurance Claim Assistant PRD




   2. Pre-filled claim form fields: the insurer's standard reimbursement form fields (Health:
       Part A insured details, bank details, hospitalisation details; Crop: localised loss
       intimation fields – name, survey number-wise insured area, crop, application no.,
       mobile, bank account).
   3. Enclosure checklist with tick status from the uploaded documents.
   4. Bill summary table: each bill, date, provider, amount, and total. Totals are calculated in
       code, never by the LLM.
   5. Delivery options: download PDF, share via WhatsApp/email, copy insurer email
       address from policy, or print.

Rules: the letter must only state facts the user entered or the documents show. Every
claimed amount links to a bill. If a fine-print flag applies (e.g. waiting period not over),
show it before generating, in the accent colour, and let the user continue or stop.


3.3 Missing-document and missing-stamp alerts (P0)
Every uploaded document is classified, read and checked. The app tells the user exactly
what is missing and how to fix it, before they submit.

Document checklist per track


  Health (reimbursement)                           Crop (localised calamity / post-harvest)

  Signed claim form                                Loss intimation docket / reference no.

  Policy copy or e-card                            PMFBY application / policy no.

  ID proof (Aadhaar/PAN) and cancelled             Aadhaar and bank passbook (account linked
  cheque or passbook                               to scheme)

  Original bills with item breakup + payment       Geotagged photos of the damaged field
  receipts

  Prescriptions (on letterhead) and                Land record (Khasra/Khatauni/Jamabandi) for
  pharmacy bills                                   the survey no.

  Discharge summary (if admitted)                  Sowing certificate or crop declaration

  Investigation reports                            Premium payment proof / bank debit entry

  FIR or MLC (accidents only)                      Claim form (if insurer requires one after
                                                   intimation)


The exact list is read from the user's policy where it is stated. The table above is the
fallback.

Checks on each bill or medical document


                                                                                               Page 8 of 29
ClaimSathi — Micro-Insurance Claim Assistant PRD




  Check                                            How                                          Severity

  Stamp/seal present                               Vision model detects round/rectangular       Critical
                                                   seal impression

  Doctor signature present                         Vision detection of handwritten signature    Critical
                                                   near doctor block

  Doctor registration number                       Regex for state council / NMC formats +      Critical
                                                   vision fallback

  Provider name and address                        OCR fields                                   High

  Patient name matches an insured                  Fuzzy match (Hindi/English transliteration   Critical
  member                                           aware)

  Date present and inside policy                   OCR date + rule                              Critical
  period

  Bill number                                      OCR                                          Medium

  Line items sum to stated total                   Python arithmetic on extracted items         High

  Legibility                                       OCR confidence < 0.6 on key fields → ask     Medium
                                                   for a clearer photo

  Duplicate bill                                   Perceptual hash + bill no. + amount          High


Checks on crop evidence


  Check                                            How                     Severity

  Photo is geotagged and inside the                EXIF GPS + reverse      Critical
  claimed plot's village/district                  geocode

  Photo taken within 72 h of                       EXIF timestamp          High
  reported event

  Survey no. on land record matches                OCR + match             Critical
  the policy

  Name on land record matches                      Fuzzy match             High
  farmer

  Intimation filed within 72 h                     Event time vs           Critical (countdown shown
                                                   intimation time         from event time)




                                                                                                   Page 9 of 29
ClaimSathi — Micro-Insurance Claim Assistant PRD




Alert UX: a list at the top of the claim screen. Each item says what's wrong, on which
document (thumbnail with the region highlighted), and the fix ("Ask Dr. Sharma's clinic to
stamp this bill"). Critical items use the accent colour and block "Send to insurer" until
fixed or the user overrides with a reason.


3.4 Claim Readiness Score (P1)
A 0–100 score per claim that says how ready the claim is to be filed, with every point lost
explained. It is not a prediction of approval, and the UI must say so.


  Component                                Health   Crop         Full points when
                                           weight   weight

  Document                                 35       30           Every checklist item uploaded
  completeness

  Document validity                        30       20           No critical/high check failures

  Coverage match                           20       25           Event is a covered peril, not excluded,
                                                                 waiting period over, amount within sum
                                                                 insured/sub-limits

  Timeliness                               15       25           Intimation within the policy/scheme
                                                                 window


Bands: 80–100 "Ready to send" (success colour), 60–79 "Fix a few things" (dominant),
below 60 "High risk of rejection" (accent). Show the score as a ring with a breakdown list
underneath. Each track also shows the user's average score across past claims on the
dashboard. Weights live in a config file so they can be tuned without code changes.


3.5 Claim Tracker (P0 for UI, P1 for live data)
One screen per claim showing where it is, when each stage happened, who responded
what, and the expected settlement date.

Stages


  #           Health stage                          Crop stage                           Who acts

  1           Draft prepared                        Loss reported (docket no.)           User

  2           Documents verified by app             Intimation forwarded to insurer      App /
                                                    (if via bank/agri office)            intermediary

  3           Submitted to insurer/TPA              Surveyor appointed                   User / insurer




                                                                                                    Page 10 of 29
ClaimSathi — Micro-Insurance Claim Assistant PRD




  #           Health stage                         Crop stage                          Who acts

  4           Acknowledged (claim no.              Joint survey done (insurer + agri   Insurer / govt
              issued)                              dept)

  5           Under review                         Loss assessed, claim calculated     Insurer / govt

  6           Query raised (loops back to          Approved by insurer and state       Insurer / govt
              user)

  7           Approved / partially                 Payment via bank / DBT              Insurer
              approved / rejected

  8           Payment credited                     Payment credited                    Insurer → bank


Each stage stores: entered-at timestamp, actor (user, insurer, TPA, government body,
bank), response text, attached evidence (email/SMS screenshot), and the next expected
date.

Expected-date rules (shown with "based on regulation" note)

       Health reimbursement: insurer should settle or reject within 30 days of the last
       necessary document, up to 45 days if an investigation is needed. Delays beyond that
       attract interest at 2% above bank rate. The tracker shows the due date and, if
       overdue, the interest the user can claim.
       Crop localised calamity: intimation within 72 hours, surveyor appointed within 48
       hours of intimation, and claim paid within 15 days of the survey report, subject to
       premium and government subsidy being received. The tracker shows each step's due
       date.
       If a date is missed, the stage turns accent-coloured and offers an escalation template
       (insurer grievance cell → Bima Bharosa/IRDAI for health, district agriculture office /
       14447 helpline for crop).

How status gets updated (MVP)

   1. User taps "Update status" and picks the stage, optionally attaching the insurer's
       email/SMS screenshot. The app reads it and suggests the stage.
   2. Forwarded-email parsing: the user forwards insurer emails to a per-user inbound
       address; the backend extracts claim no. and status.
   3. Demo-only "Insurer console" at /admin/mock-insurer to move a claim through
       stages live during judging.




                                                                                                  Page 11 of 29
ClaimSathi — Micro-Insurance Claim Assistant PRD




3.6 Voice and calling (P1)
Voice assistant (in-app). A mic button on every screen. The user speaks in Hindi or
English. Speech-to-text → intent → action or answer → text-to-speech reply. Supported
intents for MVP: "What does my policy cover?", "Start a claim", "What documents are
missing?", "Where is my claim?", and dictating incident details into the form.

Calling (outbound + inbound). Used for people who can't read well or don't use the app
daily.

       Outbound reminder calls: crop 72-hour countdown (at 24 h and 60 h after the event),
       missing document reminders, and "claim status changed" alerts. The call plays a TTS
       message in the user's language and offers "press 1 to hear details".
       Optional inbound IVR number: farmer calls, says the policy number and what
       happened; the system creates a draft claim and texts the checklist.
       All calls are logged in call_logs with consent captured at signup.

Provider assumption: Sarvam AI for Indian-language speech-to-text and text-to-speech,
Twilio for calls, SMS and WhatsApp (one vendor, and the only one Supabase supports for
WhatsApp OTP). Both are behind adapter interfaces ( VoiceProvider ,
 TelephonyProvider ) so the team can plug in whichever keys they have. Keys go in .env ,
never in code or chat.


3.7 Sign in with Google + verified WhatsApp (P0)
Users sign in with their Google account, then verify their WhatsApp number with a 6-digit
code sent on WhatsApp. Supabase Auth handles both, and both end up on the same user
record. No custom auth code.

Flow

   1. S-02: "Continue with Google" → supabase.auth.signInWithOAuth({ provider:
       'google', options: { redirectTo: '<app>/auth/callback' } }) . Request only
       the openid email profile scopes.
   2. /auth/callback finishes the session and creates the profiles row (name, email,
       photo from Google).
   3. S-03 step "Verify WhatsApp": user enters the number (+91 prefilled). App calls
        supabase.auth.updateUser({ phone }) and Supabase issues an OTP.
   4. The OTP is delivered on WhatsApp, not SMS (see "Delivery" below).
   5. User enters the code → supabase.auth.verifyOtp({ phone, token, type:
       'phone_change' }) . On success auth.users.phone is confirmed for that same user.
   6. Backend sets profiles.whatsapp_verified_at and shows a separate opt-in
       checkbox for WhatsApp claim updates (unticked by default).



                                                                                       Page 12 of 29
ClaimSathi — Micro-Insurance Claim Assistant PRD




Gating: the user can browse and add policies after Google sign-in. WhatsApp updates
switch on only after the number is verified and opt-in is ticked. Unverified users see a
banner on x-01 and x-09.

Delivery of the OTP on WhatsApp

       Sign-in OTPs (fallback path below): Supabase's phone provider set to Twilio or Twilio
       Verify with the WhatsApp channel, signInWithOtp({ phone, options: { channel:
       'whatsapp' } }) . Supabase supports WhatsApp only through Twilio, which is why
       Twilio is the telephony vendor (3.6).
       Number verification after Google sign-in ( phone_change ): configure a Supabase
       Send SMS Auth Hook that points to POST /api/v1/auth/hooks/send-otp on our API;
       the hook sends every Supabase OTP through the approved WhatsApp OTP template.
       If the hook isn't ready in time, accept SMS for this one step and keep WhatsApp for
       updates.
       Test WhatsApp OTP delivery on day one. Community reports describe the WhatsApp
       channel falling back to SMS in some setups.

Fallback for users without Google: "Use phone number instead" on S-02 signs in with
WhatsApp OTP directly. They can attach Google later from x-11 with
 supabase.auth.linkIdentity({ provider: 'google' }) (turn on manual identity
linking in Supabase).

Supabase dashboard setup

       Auth → Providers → Google: enable, paste the Google Cloud OAuth client ID and
       secret; add Supabase's callback URL to the Google console's authorised redirect
       URIs.
       Auth → URL configuration: site URL and redirect URLs for Vercel production, Vercel
       previews and localhost .
       Auth → Providers → Phone: enable, provider Twilio (or Twilio Verify), WhatsApp sender
       set up in Twilio. The OTP message on the Supabase dashboard must match the
       WhatsApp template approved in Twilio exactly.
       Auth → Hooks: Send SMS hook → our endpoint, with the hook secret in .env .
       Enable manual identity linking.

Known issue to guard against: Supabase matches a phone_change OTP by phone
number, and stale unfinished attempts can attach the number to the wrong account. After
verification the backend checks the verified phone belongs to the signed-in user and
clears stale phone_change values for that number.




                                                                                       Page 13 of 29
ClaimSathi — Micro-Insurance Claim Assistant PRD




3.8 WhatsApp claim updates (P1)
Every tracker stage change is sent to the user's verified WhatsApp number, in their
language, with the next expected date and a link back to x-09.


  Trigger                                          Message (Hindi + English template)                   Track

  Claim submitted                                  "Claim {ref} for ₹{amount} sent to {insurer} on      Both
                                                   {date}. Decision due by {due}."

  Stage changed                                    "Your claim {ref} is now: {stage}. Next step         Both
                                                   expected by {date}."

  Query raised by insurer                          "{insurer} needs: {item}. Upload it here: {link}"    Both

  Missing documents                                "{n} documents still missing for claim {ref}. Fix    Both
                                                   them: {link}" (24 h after a draft has failures)

  Deadline countdown                               "Report crop loss within {hours} hours. Start        Crop
                                                   here: {link}" (24 h and 60 h after event)

  Surveyor appointed / survey                      "Surveyor appointed for {crop}, survey no.           Crop
  done                                             {survey_no}."

  Overdue                                          "{insurer} is {n} days past the deadline. You can    Both
                                                   escalate: {link}"

  Approved / paid                                  "₹{amount} approved / credited for claim {ref}."     Both


Rules

       Messages the app starts must use WhatsApp templates pre-approved through Twilio
       (utility category), en + hi versions, variables only. Free-form text only inside the 24-
       hour window after the user messages us.
       Inbound replies: STATUS → latest stage and expected date; STOP → opt out (sets
        whatsapp_opt_in = false ); HELP → short menu.
       Privacy in message text: policy number masked to last 4, no diagnosis, no document
       images, no bank details.
       Quiet hours 9 pm to 8 am, except crop 72-hour deadline alerts.
       Delivery status (sent, delivered, read, failed) is stored; a failed message falls back to
       SMS.
       For the hackathon, Twilio's WhatsApp Sandbox is enough (judges join with a code). A
       production sender needs a registered WhatsApp Business account.




                                                                                                       Page 14 of 29
ClaimSathi — Micro-Insurance Claim Assistant PRD




Implementation: inserting a row into claim_stages (or a due date passing) enqueues
 notify_claim_update(stage_id) . The worker renders the template, calls
 TelephonyProvider.send_whatsapp() , and stores the message in whatsapp_messages ;
the stage id is the idempotency key so retries never send twice. Twilio status callbacks
and inbound replies hit POST /webhooks/whatsapp .

Supabase references: Google login, Phone login with Twilio and WhatsApp, Identity
linking, phone_change wrong-user issue.

Regulatory sources: IRDAI 2024 health master circular summary (Business Standard),
Bajaj General service TAT (30/45 days, interest), SBI General PMFBY claim process (72 h,
48 h, 15 days), PIB on geotagged photos via Crop Insurance App.


4. Screens and frontend spec
There are 11 screens per track plus 3 shared ones. IDs are H-xx (Health), C-xx (Crop) and
 S-xx (shared); the same number is the same screen in both tracks with that track's
theme and copy. Use these IDs as Figma frame names, Lovable prompt titles and React
route component names.


4.1 Screen list

  ID          Screen                  Route          Key contents               Accent allowed
                                                                                on

  S-01        Landing                  /             Hero, two big track        —
                                                     cards (Health / Crop),
                                                     how-it-works in 3 steps,
                                                     scroll-animated story

  S-          Login                    /login        "Continue with Google"     Primary "Verify"
  02                                                 (primary), "Use phone      button
                                                     number instead"
                                                     (WhatsApp OTP) for
                                                     users without Google,
                                                     language picker
                                                     (Hindi/English)

  S-03        Onboarding               /onboarding   Name, state/district,      Primary
                                                     pick tracks, verify        "Continue"
                                                     WhatsApp number
                                                     (OTP on WhatsApp),
                                                     WhatsApp-updates opt-
                                                     in, call consent




                                                                                          Page 15 of 29
ClaimSathi — Micro-Insurance Claim Assistant PRD




  ID          Screen                  Route                            Key contents                 Accent allowed
                                                                                                    on

  x-01        Track home /             /{track}                        Greeting, active policies    Deadline
              dashboard                                                count, open claims, avg      countdown,
                                                                       readiness score, next        primary CTA
                                                                       deadline, "Start a claim"

  x-02        Policy                   /{track}/policies               Policy cards (insurer,       —
              Directory                                                number, status chip,
                                                                       sum insured, expiry),
                                                                       filter, "+ Add policy"

  x-03        Add policy               /{track}/policies/new           Upload (camera / file),      Primary "Save
                                                                       progress steps               policy"
                                                                       (Reading → Extracting
                                                                       → Review), editable
                                                                       extracted fields

  x-04        Policy detail            /{track}/policies/:id           Summary, coverage            —
                                                                       card, "What can reject
                                                                       my claim", clause list
                                                                       with page refs, "Ask this
                                                                       policy" chat, view
                                                                       original

  x-05        New claim:               /{track}/claims/new             Pick policy, incident        Primary "Next",
              incident                                                 form (fields per track),     fine-print
                                                                       voice dictation,             warnings
                                                                       coverage check result

  x-06        New claim:               /{track}/claims/:id/documents   Checklist with upload        Missing/critical
              documents                                                slots, per-document          alerts, score < 60
              and alerts                                               check results, alert list,
                                                                       readiness score ring

  x-07        Claim pack               /{track}/claims/:id/pack        Letter preview (EN/HI        Primary "Send to
              preview                                                  toggle), form fields, bill   insurer", amount
                                                                       summary, enclosures,
                                                                       download/share/send

  x-08        My claims                /{track}/claims                 List of claims with stage    Overdue / query
                                                                       chip, amount, expected       / rejected chips
                                                                       date

  x-09        Claim tracker            /{track}/claims/:id             Vertical timeline of         Expected
              detail                                                   stages, actor +              amount, overdue
                                                                       response per stage,          stage
                                                                       expected settlement
                                                                       card, "Update status",
                                                                       escalation

  x-10        Voice                   sheet over any screen            Mic button, live             —
              assistant                                                transcript, answer card,
                                                                       suggested actions




                                                                                                              Page 16 of 29
ClaimSathi — Micro-Insurance Claim Assistant PRD




  ID          Screen                  Route              Key contents              Accent allowed
                                                                                   on

  x-11        Profile and              /settings         Language, family          —
              settings                                   members (health) / land
                                                         parcels (crop), bank
                                                         details (masked), call
                                                         and WhatsApp-update
                                                         preferences, change
                                                         WhatsApp number, link
                                                         Google account, data
                                                         export/delete


Mock insurer console ( /admin/mock-insurer , demo only, hidden from nav): list of claims,
buttons to move stage, add a query or response text, set approved amount.


4.2 Shared components
 TrackSwitcher , TopBar , BottomNav (mobile: Home, Policies, Claims, Voice),
 PolicyCard , ClauseItem , UploadSlot (camera + file, shows check result badges),
 AlertItem , ScoreRing , ClaimTimeline + TimelineStage , ExpectedSettlementCard ,
 CountdownTimer , VoiceButton + VoiceSheet , LanguageToggle , EmptyState ,
 Skeleton . All built on shadcn/ui primitives and track tokens.


4.3 States every screen must handle
Loading (skeletons, never blank), empty (illustration + one action), error (plain-language
message + retry), offline (queued uploads shown as "waiting for network"), and long OCR
jobs (progress steps, can leave the screen and get notified).


4.4 Scroll animations
Both tracks get scroll-driven animation on S-01 (landing) and on each track home (x-01).
Functional screens (upload, claim pack, tracker) use only small entrance transitions so
they stay fast.

       Libraries: GSAP + ScrollTrigger for pinned and scrubbed sequences, Lenis for smooth
       scrolling, Motion (Framer Motion) for component-level enter/exit and the track-
       switch transition.
       Health track feel: calm, airy. Clouds/soft shapes drifting, cards rising in sequence.
       Crop track feel: grounded, earthy. Field rows or crop silhouettes revealing left to right,
       parallax soil/sky layers.
       Claim timeline (x-09): stages draw in one after another as they scroll into view; the
       connecting line fills to the current stage.




                                                                                            Page 17 of 29
ClaimSathi — Micro-Insurance Claim Assistant PRD




       Performance budget: animate only transform and opacity , lazy-load GSAP on the
       landing route, no animation on devices with prefers-reduced-motion or under 4 GB
       RAM ( navigator.deviceMemory ), Lighthouse performance ≥ 85 on mobile.
       Spec to be added: reference file and video clip from the team. Drop them in
        /design/scroll-refs/ and add a timing table here (section, trigger, start/end,
       duration, easing). Per Impeccable's guidance, avoid bounce/elastic easing.


4.5 Accessibility and low-end devices
WCAG AA contrast, 48 px touch targets, every icon button labelled, full keyboard
support, Hindi screen-reader labels. Images compressed on-device before upload (max
1600 px, ~80% JPEG) so uploads work on 3G. Initial JS for any route under 200 KB
gzipped.


5. Tech stack and architecture
The frontend is React + Vite + TypeScript + Tailwind + shadcn/ui, because that is what
Lovable generates, so Lovable output, Impeccable polish and hand-written code all live in
one repo without conversion. The backend is Python (FastAPI) with Supabase for
Postgres, auth and file storage.


5.1 Frontend

  Layer                      Choice                           Why

  Framework                  React 18 + Vite + TypeScript     Lovable's native output; fast dev
                                                              server; small bundles

  Styling                    Tailwind CSS with CSS-variable   One component set, two themes;
                             tokens per data-track            maps 1:1 to Figma variables

  Components                 shadcn/ui (Radix primitives) +   Accessible, editable source, what
                             Lucide icons                     Lovable and Impeccable expect

  Routing                    React Router v6                  /health/* , /crop/* route trees

  Server state               TanStack Query                   Caching, polling claim status, upload
                                                              retries

  Client state               Zustand                          Current track, language, voice sheet
                                                              state

  Forms                      React Hook Form + Zod            Same validation shapes as backend
                                                              Pydantic models




                                                                                             Page 18 of 29
ClaimSathi — Micro-Insurance Claim Assistant PRD




  Layer                      Choice                                      Why

  i18n                       i18next ( en , hi )                         Bilingual from day one

  Motion                     GSAP + ScrollTrigger, Lenis, Motion         See 4.4

  API client                 Typed client generated from                 Frontend and backend never drift
                             FastAPI's OpenAPI ( openapi-
                             typescript )

  Hosting                    Vercel                                      Preview URL per branch for judges



5.2 Backend

  Layer                             Choice                                  Why

  Language /                        Python 3.12, FastAPI, Pydantic v2,      Async, auto OpenAPI docs at
  framework                         Uvicorn                                  /docs

  Database                          Supabase Postgres, SQLAlchemy 2         Real Postgres, row-level
                                    + Alembic migrations                    security, free tier

  Auth                              Supabase Auth: Google OAuth sign-       No custom auth code
                                    in + WhatsApp number verified by
                                    OTP (WhatsApp OTP sign-in as
                                    fallback); FastAPI verifies the
                                    Supabase JWT on every request

  File storage                      Supabase Storage, private buckets,      Policies and bills are sensitive
                                    short-lived signed URLs

  Background jobs                   RQ + Redis (Upstash) for OCR,           OCR can take 10–30 s; never
                                    extraction, checks, PDF; fallback       block a request
                                    FastAPI BackgroundTasks if time
                                    runs out

  PDF / image                       PyMuPDF (PDF → images/text),            Works on phone photos of
  handling                          Pillow + OpenCV (deskew, crop, seal     crumpled bills
                                    detection pre-processing), piexif
                                    (photo GPS/time)

  OCR +                             Google Cloud Vision Document Text       Handwritten Indian bills need
  handwriting                       Detection (Hindi + English              strong handwriting OCR
                                    handwriting) behind an
                                    OcrProvider interface; a vision
                                    LLM as fallback




                                                                                                        Page 19 of 29
ClaimSathi — Micro-Insurance Claim Assistant PRD




  Layer                             Choice                                  Why

  LLM                               Claude API via the anthropic            Clause extraction, letter
                                    Python SDK, with tool-use / JSON-       drafting, Q&A, reading insurer
                                    schema outputs, behind an               emails
                                     LlmProvider interface

  Matching                          rapidfuzz + indic-transliteration       Hindi/English name matching

  Claim pack PDF                    Jinja2 HTML templates →                 Bilingual, printable letters
                                    WeasyPrint (Noto Sans Devanagari
                                    embedded)

  Voice                             Sarvam AI STT/TTS behind                Indian languages, Indian accents
                                     VoiceProvider

  Calls / SMS                       Twilio (voice, SMS, WhatsApp)           Reminder calls, IVR, SMS,
                                    behind TelephonyProvider ;              WhatsApp claim updates
                                    webhooks into FastAPI

  Hosting                           Docker → Render, Railway or Fly.io      One-command deploy
                                    (API + worker as two services)

  Monitoring                        Sentry (frontend + backend),            Debug live during judging
                                    structured JSON logs



5.3 Repository layout

  claimsathi/
      CLAUDE.md                                    # points every agent to docs/PRD.md
      docs/PRD.md                                  # export of this doc
      design/                                      # Figma links, scroll-refs/, tokens.json
      frontend/                # Vite React app (Lovable-connected)
        src/routes/{health,crop,shared}/
          src/components/                          # shared components (4.2)
          src/theme/tokens.css                     # data-track variables
        src/locales/{en,hi}.json
      backend/
          app/main.py
      app/api/                                     # routers: policies, claims, documents, tracker,
  voice, calls, webhooks
          app/models/                              # SQLAlchemy
          app/schemas/                             # Pydantic (PolicyExtract, ClaimPack,
  CheckResult...)
      app/services/                                # extraction, checks, scoring, letters, timelines
          app/providers/                           # ocr, llm, voice, telephony adapters
          app/rules/                               # health.yaml, crop.yaml (checklists, weights,



                                                                                                           Page 20 of 29
ClaimSathi — Micro-Insurance Claim Assistant PRD




  deadlines)
          app/workers/                             # RQ jobs
          alembic/
      .env.example                                 # names of every key, no values


Track-specific behaviour lives in app/rules/health.yaml and app/rules/crop.yaml
(document checklist, checks and severities, score weights, deadlines, stage list). Code
reads the rules for the claim's track; no if track == ... scattered through services.


5.4 Environment variables
 SUPABASE_URL , SUPABASE_SERVICE_ROLE_KEY (backend only), SUPABASE_JWT_SECRET ,
 DATABASE_URL , REDIS_URL , ANTHROPIC_API_KEY , GOOGLE_APPLICATION_CREDENTIALS ,
 SARVAM_API_KEY , EXOTEL_SID / EXOTEL_TOKEN (or TWILIO_* ), SENTRY_DSN . Frontend
only gets VITE_SUPABASE_URL , VITE_SUPABASE_ANON_KEY , VITE_API_BASE_URL .

Added for Google + WhatsApp: use TWILIO_ACCOUNT_SID , TWILIO_AUTH_TOKEN ,
 TWILIO_WHATSAPP_FROM , TWILIO_TEMPLATE_SIDS (JSON map of template name →
content SID) instead of the Exotel keys, plus SUPABASE_SEND_SMS_HOOK_SECRET . The
Google OAuth client ID and secret are pasted into the Supabase dashboard, not into our
env files.


5.5 Architecture




system architecture · 7 components




                                                                                     Page 21 of 29
ClaimSathi — Micro-Insurance Claim Assistant PRD




The browser talks only to FastAPI (plus Supabase Auth for OTP login). Uploads go to
Storage, the API enqueues a job, and the worker runs OCR, extraction, checks and PDF
generation, then writes results back. In-app voice goes browser → API → Sarvam; provider
callbacks come back to /webhooks/* .



6. Data model and API contract
Every row that belongs to a user carries user_id and track , and Supabase row-level
security allows a user to read only their own rows. More database details will be added
later; treat this as the v1 schema.


6.1 Tables (Postgres)

  Table                               Key columns                                           Notes

   profiles                            id (= auth user id), name , phone , language         One per user
                                      ( en / hi ), state , district , last_track ,
                                       call_consent (bool), created_at

   members                             id , user_id , name , relation , dob                 Health: insured
                                                                                            family members

   land_parcels                        id , user_id , survey_no , village , district ,      Crop: farmer's
                                       area_ha , lat , lng                                  plots

   policies                            id , user_id , track , insurer , tpa , policy_no ,   extract holds
                                       product , scheme , start_date , end_date ,           everything; key
                                       sum_insured , status                                 fields copied to
                                      ( processing / active / expiring_soon / expired ),    columns for
                                       summary_en , summary_hi , extract (jsonb, full       queries
                                       PolicyExtract ), source_file_id

   policy_clauses                      id , policy_id , type                                Feeds "What
                                      ( coverage / exclusion / waiting_period / limit /     can reject my
                                       procedure / fine_print ), title , text ,             claim" and Q&A
                                       plain_en , plain_hi , page , risk                    citations
                                      ( low / med / high )

   files                               id , user_id , bucket , path , mime , size ,         Every upload
                                       sha256 , phash , exif (jsonb)




                                                                                                       Page 22 of 29
ClaimSathi — Micro-Insurance Claim Assistant PRD




  Table                               Key columns                                           Notes

   claims                              id , user_id , track , policy_id , claim_ref         One per claim
                                      (insurer's no.), incident (jsonb), event_at ,
                                       intimated_at , amount_claimed ,
                                       amount_approved , current_stage ,
                                       expected_settlement_date , readiness_score ,
                                       status ( draft / submitted / closed )

   claim_documents                     id , claim_id , file_id , doc_type                   Classified
                                      ( bill / prescription / discharge_summary / repor     uploads
                                      t / fir_mlc / id_proof / bank_proof / geo_photo / l
                                      and_record / sowing_cert / intimation / other ),
                                       extracted (jsonb), ocr_confidence

   document_checks                     id , claim_document_id , check_code , passed         One row per
                                      (bool), severity ( critical / high / medium ),        check per
                                       message_en , message_hi , fix_en , fix_hi , bbox     document
                                      (jsonb), overridden_reason

   bill_items                          id , claim_document_id , description , qty ,         Totals computed
                                       amount                                               in SQL/Python

   claim_stages                        id , claim_id , stage_code , entered_at , actor      Tracker timeline
                                      ( user / app / insurer / tpa / govt / bank ),         (append-only)
                                       response_text , evidence_file_id , due_at ,
                                       source ( manual / email / mock_insurer )

   claim_packs                         id , claim_id , version , letter_en , letter_hi ,    Regenerated
                                       form_fields (jsonb), pdf_file_id , created_at        when docs
                                                                                            change

   score_snapshots                     id , claim_id , score , breakdown (jsonb),           History of
                                       created_at                                           readiness score

   notifications                       id , user_id , claim_id , channel                    Reminders and
                                      ( push / sms / call ), kind , scheduled_at ,          status alerts
                                       sent_at , status

   call_logs                           id , user_id , direction , provider_call_id ,        Telephony audit
                                       purpose , transcript , duration_s , created_at

   jobs                                id , kind , ref_id , status                          Frontend polls
                                      ( queued / running / done / failed ), progress ,      this for OCR
                                       error , updated_at                                   progress


Additions for Google sign-in and WhatsApp




                                                                                                         Page 23 of 29
ClaimSathi — Micro-Insurance Claim Assistant PRD




  Table                                            Change

   profiles                                        Add email , avatar_url , auth_providers (text[],
                                                   e.g. {google, phone} ), whatsapp_phone ,
                                                   whatsapp_verified_at , whatsapp_opt_in (bool,
                                                   default false), whatsapp_opt_in_at ,
                                                   whatsapp_lang

   notifications                                   channel gains whatsapp ; add template_name ,
                                                   idempotency_key (unique, = stage id + kind)

   whatsapp_messages (new)                         id , user_id , claim_id , direction ( out / in ),
                                                   template_name , variables (jsonb), body ,
                                                   provider_message_id , status
                                                   ( queued / sent / delivered / read / failed ),
                                                    error , created_at



6.2 REST endpoints (FastAPI, prefix /api/v1 )
All endpoints need Authorization: Bearer <supabase jwt> except webhooks
(signature-verified). Track-scoped endpoints take ?track=health|crop .


  Method and path                                                        Purpose

   GET /me · PATCH /me                                                   Profile, language, last track, consent

   GET/POST /members · GET/POST /land-parcels                            Family members / plots

   POST /files/upload-url                                                Signed upload URL for Supabase
                                                                         Storage

   POST /policies                                                        Create from uploaded file_id , starts
                                                                         extraction job → {policy_id, job_id}

   GET /policies?track= · GET /policies/{id} ·                           List, detail (with clauses), user
   PATCH /policies/{id}                                                  corrections

   POST /policies/{id}/ask                                               Q&A grounded in this policy →
                                                                          {answer, citations[{page,
                                                                         quote}]}

   POST /claims                                                          Create draft from policy_id +
                                                                          incident → includes coverage check
                                                                         and fine-print warnings

   GET /claims?track= · GET /claims/{id}                                 List, detail (stages, docs, checks, score)




                                                                                                             Page 24 of 29
ClaimSathi — Micro-Insurance Claim Assistant PRD




  Method and path                                   Purpose

   POST /claims/{id}/documents                      Attach file_id (+ optional doc_type ),
                                                    starts check job

   GET /claims/{id}/checklist                       Required vs uploaded vs failing, per
                                                    track rules

   POST                                             User overrides a failed check with
  /claims/{id}/checks/{check_id}/override           reason

   GET /claims/{id}/score                           Readiness score + breakdown

   POST /claims/{id}/pack                           Generate claim pack (letter, form fields,
                                                    PDF)

   POST /claims/{id}/submit                         Mark submitted, record channel
                                                    (email/portal/in-person), start timeline
                                                    clocks

   POST /claims/{id}/stages                         Add a tracker stage (manual or from
                                                    evidence)

   POST /claims/{id}/stages/parse                   Upload screenshot/email text →
                                                    suggested stage

   GET /claims/{id}/escalation                      Escalation letter if overdue

   GET /jobs/{id}                                   Job progress

   GET /dashboard?track=                            Counts, average score, next deadline

   POST /voice/transcribe · POST /voice/speak       STT, TTS, intent + action
  · POST /voice/intent

   POST /calls/remind                               Trigger a reminder call (also scheduled
                                                    by worker)

   POST /webhooks/telephony · POST                  Provider callbacks, forwarded insurer
  /webhooks/inbound-email                           emails

   POST /admin/mock-                                Demo only, disabled in production
  insurer/{claim_id}/advance


Added endpoints for Google + WhatsApp. Google sign-in, WhatsApp OTP send and
verify all run in the browser through supabase-js (3.7). The API only adds:




                                                                                         Page 25 of 29
ClaimSathi — Micro-Insurance Claim Assistant PRD




  Method and path                                  Purpose

   POST /me/whatsapp/confirm                       Called after verifyOtp succeeds; checks the
                                                   verified phone belongs to this user, sets
                                                   whatsapp_verified_at , clears stale
                                                   phone_change

   PATCH /me/whatsapp                              Opt in or out of WhatsApp updates, set message
                                                   language

   POST /auth/hooks/send-otp                       Supabase Send SMS hook; verifies hook signature,
                                                   sends the OTP via the WhatsApp template

   POST /webhooks/whatsapp                         Twilio delivery status + inbound replies ( STATUS ,
                                                    STOP , HELP ); signature-verified

   GET /claims/{id}/whatsapp-log                   Messages sent for a claim (shown on x-09)



6.3 Core schemas (Pydantic, mirrored in Zod)

  class Cited(BaseModel):
      value: str | float | int | date | None
          page: int | None
          quote: str | None                        # exact source text


  class PolicyExtract(BaseModel):
      track: Literal["health", "crop"]
      insurer: Cited; policy_no: Cited; product_or_scheme: Cited
          insured: list[Cited]                 # members or farmer
          start_date: Cited; end_date: Cited; sum_insured: Cited
          covered_events: list[Clause]; exclusions: list[Clause]
          waiting_periods: list[Clause]; limits: list[Clause]
          claim_procedure: ClaimProcedure      # intimation_window_hours, channels,
  required_docs, address, email
      fine_print_flags: list[Clause]                           # anything that can reject a claim


  class CheckResult(BaseModel):
      code: str                                                # e.g. "BILL_STAMP_MISSING"
      passed: bool
          severity: Literal["critical", "high", "medium"]
          message: dict[str, str]              # {"en": ..., "hi": ...}
          fix: dict[str, str]
          bbox: list[float] | None


  class ReadinessScore(BaseModel):
      score: int                                               # 0-100



                                                                                                         Page 26 of 29
ClaimSathi — Micro-Insurance Claim Assistant PRD




          band: Literal["ready", "fix", "high_risk"]
          breakdown: list[ScoreItem]           # component, max, got, reasons[]


  class ClaimPack(BaseModel):
      letter: dict[str, str]; form_fields: dict[str, str]
          bills: list[BillSummary]; total_claimed: Decimal
          enclosures: list[EnclosureStatus]; pdf_url: str




7. AI pipelines, security, build plan and demo

7.1 AI pipelines
Policy extraction (job extract_policy )

   1. PDF → page images (PyMuPDF); photos → deskew, crop, contrast (OpenCV).
   2. OCR each page with layout (Cloud Vision). Keep text + boxes + page numbers.
   3. Classify track if not given (health vs crop keywords) and split into sections
       (definitions, coverage, exclusions, claims procedure).
   4. LLM call with the PolicyExtract JSON schema as a tool. Prompt rule: every field
      must carry page + quote copied from the OCR text, or be null . No guessing.
   5. Validate: quotes must exist in the OCR text (string match), dates parse, sum insured is
       a number. Failed fields are marked "please confirm" in the UI.
   6. Second LLM pass writes plain-language Hindi and English summaries and ranks fine-
       print flags by rejection risk.

Document check (job check_document )

   1. Pre-process image; OCR with handwriting mode.
   2. Classify doc_type (LLM on OCR text + image).
   3. Extract fields per type (provider, doctor, reg. no., patient, date, items, total).
   4. Run rule checks from rules/{track}.yaml in Python. Vision model only answers
       yes/no questions ("Is there a stamp/seal impression? Return bbox").
   5. Arithmetic (totals, sums, date windows) always in Python.
   6. Store CheckResult s, recompute readiness score, update checklist.

Claim letter (job build_pack )

Jinja2 template per track and language fills the fixed parts (addresses, policy no.,
enclosures, amounts). The LLM writes only the short incident narrative, from the user's
own incident fields. Then a check confirms every number and date in the letter exists in
the claim data.




                                                                                           Page 27 of 29
ClaimSathi — Micro-Insurance Claim Assistant PRD




Guardrails: temperature 0 for extraction; JSON schema validation with one retry; show "AI
read this, please check" on any field below confidence 0.7; never state that a claim will be
approved.


7.2 Security and privacy
       India's DPDP Act applies: explicit consent at signup for storing documents and for
       calls/SMS; a "Delete my data" button that removes files and rows.
       Aadhaar: store only the last 4 digits; mask the number on uploaded images before
       sending them to any AI provider (OCR, then black-box the 12-digit pattern).
       Bank account: store masked (last 4); full number only inside the generated PDF.
       Storage buckets private, signed URLs valid 10 minutes. Row-level security on every
       table.
       Secrets only in env vars; .env in .gitignore ; rotate any key that was ever pasted
       into chat or committed.
       Webhooks verify provider signatures. Admin/mock routes disabled when
        ENV=production .
       Log no document text or PII; log IDs only.

Google and WhatsApp specifics: Google scopes limited to openid email profile .
WhatsApp updates need a separate, recorded opt-in and honour STOP at once. OTP
delivery, hook calls and webhooks are rate-limited per number. The app never sends
documents, diagnoses or full policy/bank numbers over WhatsApp.


7.3 Build plan (priority order)
   1. Foundation: repo, CLAUDE.md , Supabase project, Google sign-in + WhatsApp
       verification, track switcher, theme tokens, empty screens for all IDs (Lovable for UI,
       Claude Code for backend skeleton).
   2. Policy Directory end to end: upload → extraction job → policy detail with clauses (P0).
   3. Claim flow: incident form → document upload → checks and alerts → claim pack PDF
       (P0).
   4. Tracker: stages, expected dates, mock insurer console (P0 UI).
   5. Score: readiness score + breakdown + dashboard average (P1).
   6. Voice and calls: in-app voice for Q&A and dictation, one outbound reminder call,
       WhatsApp claim updates for every stage change (P1).
   7. Polish: Impeccable audit and polish per screen, scroll animations from the team's
       spec, Hindi copy review, Lighthouse pass.

Suggested split: one person frontend (Lovable + Impeccable), one backend (FastAPI +
DB), one AI pipelines (OCR, extraction, checks), one on voice/calls + demo data + pitch.


                                                                                        Page 28 of 29
ClaimSathi — Micro-Insurance Claim Assistant PRD




Demo data to prepare: 2 sample health policies (one with a 30-day waiting period), 1
PMFBY policy schedule, 4 handwritten clinic bills (one missing a stamp, one missing the
doctor reg. no., one with a wrong total, one clean), 3 geotagged field photos (one older
than 72 h).


7.4 Three-minute demo script
   1. (20 s) Landing with scroll story; pick Health.
   2. (40 s) Upload a health policy photo → clauses appear with page citations; ask by voice
       in Hindi "Kya mera accident cover hai?" and get a cited answer.
   3. (50 s) Start a claim, upload 3 handwritten bills → app flags "stamp missing" on one and
       "total mismatch" on another; score jumps from 52 to 88 after re-uploading the fixed
       bill.
   4. (30 s) Generate the claim pack; show the bilingual letter and PDF.
   5. (25 s) Switch to Crop (theme transition): report hail damage, 72-hour countdown,
       geotag check rejects an old photo.
   6. (15 s) Tracker: advance the claim from the mock insurer console live; expected
       settlement date updates; phone rings with a reminder call and a WhatsApp message
       arrives with the new stage and date.




                                                                                       Page 29 of 29
