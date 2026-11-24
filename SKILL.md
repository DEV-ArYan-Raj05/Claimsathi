name: hackathon-stack-orchestrator description: Enforces
verified repositories, 60-30-10 visual hierarchy, disciplined diffs,
and safe installation rules for hackathon builds in Google
Antigravity.

Hackathon Stack & Workflow Orchestrator

1. Golden Rule for Context & Speed
Never load conflicting or bloated skill sets simultaneously:

   -​   Keep 1 coding discipline rule active (ponytail or karpathy-skills).
   -​   Keep 1 design system active (DESIGN.md).
   -​   Keep 1 UI polish skill active (impeccable — do NOT run simultaneously with
        ui-ux-pro-max-skill due to overlapping/conflicting style rules).
   -​   Install frontend UI and motion libraries only on demand when building that exact
        component.


2. Verified Repository & CLI Reference (Corrected URLs)
Always use these audited URLs and commands—never use raw OCR-corrupted links:

   -​   Ponytail (Minimal Diffs): github.com/DietrichGebert/ponytail
   -​   Matt Pocock Skills (PRD/TDD/Triage): npx skills@latest add
        mattpocock/skills (invoke per phase)
   -​   Impeccable (UI Critique/Polish): npx skills@latest add
        pbakaus/impeccable
   -​   Karpathy Coding Rules: github.com/multica-ai/andrej-karpathy-skills
   -​   Design MD Directory: getdesign.md (github.com/VoltAgent/design-md)
   -​   Skiper UI: npx shadcn@latest add @skiper-ui/<component>
        (skiper-ui.com)
   -​   Vengeance UI: npx shadcn@latest add @vengeanceui/<component>
        (vengenceui.com / Ashutoshx7/VengeanceUI)
   -​   Bklit UI (Charts): bklit.com (github.com/bklit/bklit-ui)
   -​   Kokonut UI / Watermelon UI / React Bits: kokonutui.com, ui.watermelon.sh,
        reactbits.dev
   -​   Animation Engines: npm i motion, npm i lenis, npm i gsap, npm i animejs
3. Security & Sandbox Guardrails
  -​   cco Sandbox (github.com/nikvdp/cco): Container/OS sandbox wrapper for
       Claude Code/Codex (not a vulnerability scanner). Never pass
       --allow-oauth-refresh on macOS and never mount /var/run/docker.sock.
  -​   /brag (github.com/latent-spaces/brag): Demo video generator via browser
       automation—inspect script permissions before running on private repositories.
  -​   Unverified / Heavy Assets: Inspect animmasterlib.dev component source before
       shipping. Restrict Vanta.js (vantajs.com) strictly to hero sections due to mobile
       GPU load.


4. Execution Protocol
  1.​ Plan Phase: Define scope before coding; keep diffs minimal and atomic.
  2.​ UI Phase: Read DESIGN.md in project root before generating components. Enforce
      the 60-30-10 color split (#0099FF / #FDFDFE / #E8250E or #F42902 / #FDFDFF /
      #CCFF00).
  3.​ Polish Phase: Audit spacing, contrast, and CTA isolation before shipping.
