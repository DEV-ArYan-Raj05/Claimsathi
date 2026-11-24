# strategy.md — how ClaimSathi was designed, and why

This explains the key decisions behind the build, in the order they were made. Each one says what we
did and why, so you can defend it to judges or change it with your eyes open.

---

## 1. Read the three documents as a hierarchy, not as equals

There were three sources of instruction: the **PRD** (what the product does), **rules.md** (how the code
is written) and **SKILL.md** (hackathon workflow + visual rules). They disagree in places, so we fixed an
order first:

| Question | Who wins | Why |
|---|---|---|
| Product behaviour (screens, deadlines, accent rules, colours per track) | PRD | rules.md says so itself |
| Code structure, file size, naming, folders | rules.md | rules.md says so itself |
| Workflow + visual method (60-30-10, read DESIGN.md first, audit before shipping) | SKILL.md | applied wherever it doesn't contradict the two above |

**The one real conflict:** SKILL.md lists fixed hex values (`#0099FF / #FDFDFE / #E8250E…`). The PRD
locks different per-track values (olive/beige/terracotta for Crop, sky/cloud/muted red for Health), and
rules.md §17 confirms that mapping. We kept the **PRD colours** and applied SKILL.md's **60-30-10 method**
to them. SKILL.md's second set (`#CCFF00` lime) would also clash badly with an earthy farm theme.

SKILL.md also names tools to install (Ponytail, Impeccable, Skiper UI, Vengeance UI…). Those are
Antigravity/CLI installs, and rules.md §7 forbids adding another UI kit. So we followed their *principles*
(minimal diffs, one design system in DESIGN.md, audit spacing/contrast/CTA isolation) without adding the
packages. DESIGN.md now exists at the repo root, because SKILL.md's UI phase requires reading it first.

## 2. "Track is data, not branches", taken literally

The PRD's biggest structural idea is that Health and Crop are **one app with a parameter**, not two apps.
We pushed that as far as it would go:

- Everything that differs per track (checklist, score weights, stages, deadlines, incident form fields,
  escalation channels, which animation to show) lives in **one config object per track**:
  `backend/app/rules/{health,crop}.yaml` and its mirror `frontend/src/shared/config/tracks.ts`.
- Screens read that config. There is no `if (track === "crop")` anywhere in screens or services.
  We grepped for it and removed the two places it had crept in.
- The incident form (x-05) is **generated from the field list**, including its Zod validation. Adding
  a field to a track means one line of config, not a new form.
- Track-specific copy uses keys like `start.crop.cta`, so the words differ while the code is the same.

**Why it matters:** when a judge asks "can you add motor insurance?", the honest answer is "a third
YAML file and a third theme block", and that's a strong answer.

## 3. Colour: 60-30-10, and one place we had to bend

- **60% dominant** (olive / sky) is the page itself: background, top bar, sidebar, title bands.
- **30% secondary** (beige / cloud) is every surface you read or type on: cards, inputs, bottom nav.
- **≤10% accent** (terracotta / muted red) appears **only** on the six things the PRD allows: the one
  primary button per screen, missing-document alerts, deadline countdowns, scores under 60,
  "Query raised" / overdue, and the expected-settlement amount. Everything else is ink.

**Contrast problem we found and fixed:** we measured every token pair. Crop terracotta and green as
*small text* on beige come out at about 3.4:1, which fails WCAG AA. So in Crop, accent and success are used as
**filled pills with white text** (≈5:1) instead of coloured text. That needs a text-on-fill colour the PRD
doesn't list, so we added `--color-on-accent` **with a TODO** rather than sneaking a hex into components.
→ *Decision for you:* approve it in PRD §2, or tell us to drop it.

Also measured: `muted` fails AA as text in both tracks, so captions use ink at 72% (`text-caption`).
`muted` is kept for borders only.

## 4. Type and layout

- **One typeface, Mukta.** It carries Latin and Devanagari in the same family, so a Hindi screen has the
  same weight and rhythm as the English one. Using two families would have made Hindi look like an
  afterthought.
- Mobile-first at 360 px with a bottom nav (Home, Policies, Claims, Voice). Desktop is the PRD's centred
  1200 px with a left sidebar. Every tap target is at least 48 px.
- We deliberately avoided generic "AI dashboard" looks: no gradient washes, no ALL-CAPS labels, no
  shadows on every card. Hierarchy comes from the dominant/secondary split itself.

## 5. The scroll animations: where they go and what they mean

**Where:** the tractor sits on the **Crop** track home (x-01, `/crop`) and the MRI machine on the
**Health** track home (x-01, `/health`). rules.md §7 allows scroll-driven animation only on S-01 and x-01.
We chose x-01 rather than the landing page so the shared landing (S-01) stays light on 3G and each machine
appears only inside its own track. The landing page shows one still frame of each machine on its track card,
which acts as a preview.

**What they mean:** both sequences are line drawings of a machine **coming apart into its parts**.
That is exactly what ClaimSathi does to a claim: it breaks it into documents and checks each piece. So the
captions tell that story in three beats ("taken apart" → "each piece gets checked" → "put back together,
ready to send"). The animation explains the product instead of decorating it.

**Urgency first:** a farmer opening `/crop` mid-crisis shouldn't have to scroll through an animation
to see their deadline. So the greeting and the **72-hour countdown sit on top of the first frame**,
with a "Skip to my dashboard" link.

**How it's built (exactly your prompt):** one component, `shared/components/ScrollSequence.tsx`:
- frames drawn on a `<canvas>`, never `<img>` tags
- every frame preloaded before it starts, with a loading bar and percentage
- scroll position mapped to frame index (the Apple technique)
- 400vh tall container with the canvas sticky inside it
- drawing only inside `requestAnimationFrame`, and a repaint only when the frame index actually changes
- canvas resized on window resize, keeping the aspect ratio (letterbox filled with the drawing's own paper
  colour, sampled from the frame, so there's no hex in code)
- under 768 px wide it loads every second frame
- with `prefers-reduced-motion` it shows one static frame (the fully exploded one)

Two additions beyond your prompt, both required by rules.md/PRD:
1. **Under 4 GB of device memory** it also shows the static frame (rules.md §7, PRD §4.4).
2. The sticky canvas pins **56 px below the top bar** (a `topOffset` prop), not at the very top, so the
   track switcher never covers the drawing.

**Frame weight:** the 300 + 300 source JPEGs were 35 MB. We re-encoded them to 1280×720 WebP with a light
median filter that removes paper grain the eye doesn't see. That brought them to 13 MB (MRI) and 12 MB
(tractor), and mobile loads half of that.

### If the animation feels too fast or too slow

Open `frontend/src/shared/components/ScrollSequence.tsx` and change **one number**:

```ts
const SCROLL_LENGTH_VH = 400;
```

The whole sequence plays across `SCROLL_LENGTH_VH − 100` viewport-heights of scrolling (300vh by default).

- **Too fast** (the machine flies apart with a small flick) → raise it: `500` or `600`.
- **Too slow** (lots of scrolling for little movement) → lower it: `300` (min ~`200`).
- To move **when each caption appears**, edit `CAPTION_AT = [0, 0.36, 0.72]` in
  `features/dashboard/components/TrackStory.tsx` (values are 0–1 progress points).

## 6. A demo that works with no backend, without lying about it

A hackathon demo fails if one API key or one Supabase setting is missing. So the frontend talks to one
`apiClient`, and **if `VITE_API_BASE_URL` is empty, requests go to an in-browser demo server** that
implements the same PRD §6.2 paths with the same response shapes, on seeded data that follows the PRD demo
script:

- **Health (Sunita):** three clinic bills (one missing a stamp, one with a wrong total, one clean) plus
  a prescription missing the doctor's registration number, giving a readiness score of **55, high risk**.
  Re-upload the fixed bill and it rises (we tested 55 → 65 end to end). A second claim is **4 days past**
  the insurer's 30-day deadline, which shows the interest note and escalation letter.
- **Crop (Ramesh, Rohtak, wheat):** hail damage 30 hours ago, so the **72-hour countdown** reads
  ~42 h left. One field photo fails the 72-hour check. An older cotton claim is overdue on its
  surveyor/payment deadlines.
- `/admin/mock-insurer` moves claims through stages live for judging (hidden from nav, not mounted in
  production).

Insurer names in the demo are **fictional and labelled "(demo)"**, so nothing impersonates a real insurer.
Flipping one env var switches the same screens onto the real FastAPI.

## 7. Trust rules built into the interface

These come straight from the PRD and rules.md, and we made them visible rather than just documented:

- The score is called **"readiness"**, and every score widget says it is *not a prediction of approval*.
- **Every clause shows its page number and the exact quote**, with "AI read this, please check" on
  low-confidence fields.
- **Critical problems block "Send to insurer"** until fixed or overridden with a written reason, and the
  reason stays visible on the alert.
- Every alert says **what's wrong, on which document (thumbnail with the region marked), and the fix**
  in plain words ("Ask the clinic to stamp this bill").
- **"Send to insurer" opens your own email app** with the letter. We never file on your behalf (PRD
  out-of-scope).
- Policy and bank numbers are **masked to the last 4** in UI, share text and WhatsApp messages.
- WhatsApp updates need a **verified number and a separate opt-in, unticked by default**. "Delete my
  data" asks for confirmation first.
- Money is added in **integer paise (TS) / Decimal (Python)**, never floats and never by an LLM. The
  backend also refuses to show a claim letter containing any number that isn't in the claim data.

## 8. Every screen handles five states

A shared `QueryView` forces loading (skeletons), error (plain message + retry), empty (one clear action)
and data on every screen. Uploads are validated by **magic bytes** (not file name), compressed on the
phone (max 1600 px, ~80% JPEG), and **queued while offline** with "waiting for network". Long jobs show
step-by-step progress and say you can leave the screen.

## 9. Performance budget

- Every route is lazy-loaded; the demo server and supabase-js are dynamic imports.
- Initial JS is **~127 KB gzipped** (budget: 200 KB).
- Animations use only `transform` and `opacity`. The track switch is a 400 ms **opacity** cross-fade
  (an overlay painted in the old colour fades out) plus a sliding pill, which rules.md requires instead of
  animating `background-color`.

## 10. Backend: build the parts that must be right first

With limited time, we built and tested the backend pieces where **a mistake costs a farmer or patient
money**, and left plumbing as clearly marked TODOs:

| Built and tested | Left as TODO (marked in code) |
|---|---|
| Track YAML rules + typed loader | SQLAlchemy models + Alembic migrations |
| Readiness score (Decimal, weights from YAML) | `/api/v1` routers and repositories |
| Regulatory deadlines: 72 h / 48 h / 15 days (crop), 30 days + interest (health) | RQ jobs (extract, check, build pack) |
| All 15 PRD §3.3 document checks as a registry: add a check = YAML line + one function | Vendor adapters (Vision, Claude, Sarvam, Twilio) |
| Bill totals with ₹1 tolerance | Supabase Send-SMS hook |
| Claim letter templates (2 tracks × 2 languages) + "no invented numbers" check | Mock insurer API (frontend demo covers it) |
| WhatsApp webhook signature check, quiet hours (IST), masking, STOP/STATUS/HELP | |

The frontend demo server mirrors the score and deadline rules, so both sides give the same answers.

## 11. The architecture diagrams are internal on purpose

`internal/architecture/index.html` (made with caru-ini/stack-diagram) is an **interactive** map: two tabs
(Frontend, Backend & services), and clicking any box shows what it does, its files, its PRD section and
whether it's built. It's kept strictly separate from the product:
- it lives in `internal/`, outside both `frontend/` and `backend/`, so neither build can include it
- it has an "INTERNAL" banner and `noindex, nofollow`
- nothing in the app links to it

## 12. Open questions for the team (also TODOs in code)

1. Approve `--color-on-accent` in PRD §2 (see §3 above).
2. Health waiting period is assumed to be 30 days in the demo. The real value should come from the
   extracted clause (`TODO(PRD §3.1)`).
3. Claim pack generation should become a `build_pack` job returning `{job_id}`; the contract only lists
   `POST /claims/{id}/pack` (`TODO(PRD §7.1)`).
4. Name matching uses a simple similarity for now; swap in rapidfuzz + indic-transliteration for
   Hindi⇄English names (`TODO(PRD §5.2)`).
5. Voice uses the browser's speech recognition until Sarvam is wired (`TODO(PRD §3.6)`).
