# internal/ — team material, not part of the product

Nothing in this folder is imported by `frontend/` or `backend/`, and the app never links to it.
One exception, by choice: the frontend build copies `architecture/index.html` to `/architecture/` so judges
can open it on the hosted demo (see `frontend/vite.config.ts`; build with `VITE_INCLUDE_ARCHITECTURE=false`
to leave it out). The Docker image copies `backend/app` only.

## architecture/

Interactive architecture diagrams made with [caru-ini/stack-diagram](https://github.com/caru-ini/stack-diagram).

- `index.html` — open it locally in a browser. Two tabs (Frontend, Backend & services). Click any box to see
  what it does, which files own it, the PRD/rules section, and whether it's built yet.
- `frontend.png`, `backend.png` — static snapshots for slides or chat.
- The page carries `noindex, nofollow` and an "INTERNAL" banner in case it's ever opened somewhere shared.

### Regenerate after changing the architecture

```bash
git clone --depth 1 https://github.com/caru-ini/stack-diagram.git /tmp/stack-diagram
cd internal/architecture/source
python3 gen.py /tmp/stack-diagram/skills/stack-diagram/assets/template.html      # edit nodes/edges in gen.py, text in info.json
python3 /tmp/stack-diagram/skills/stack-diagram/scripts/build.py draft.html icons ../index.html \
  --fonts /tmp/stack-diagram/skills/stack-diagram/assets/fonts
```

Icons come from devicon, gilbarbara/logos and Lucide; brand logos remain their owners' trademarks.
