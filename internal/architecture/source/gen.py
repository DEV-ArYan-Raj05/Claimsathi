"""Build the internal architecture page from the stack-diagram template (geometry per references/geometry.md)."""
import json, pathlib, sys

HERE = pathlib.Path(__file__).parent
# usage: python gen.py <path to stack-diagram/skills/stack-diagram/assets/template.html>
T = pathlib.Path(sys.argv[1]).read_text(encoding="utf-8")
style = T[T.index('<style>'):T.index('</style>')+8]

def node(cx, top, icon, name, role, key, tile=''):
    return (f'<button class="node" data-key="{key}" style="left:{cx-66}px;top:{top}px" type="button">'
            f'<div class="tile {tile}"><img src="%%ICON_{icon}%%" alt=""></div>'
            f'<div class="name"><span>{name}</span></div><div class="role"><span>{role}</span></div></button>')

def group(l, t, w, h, label, icon, cls='ga'):
    img = f'<img src="%%ICON_{icon}%%" alt="">' if icon else ''
    return f'<div class="group {cls}" style="left:{l}px; top:{t}px; width:{w}px; height:{h}px;"><div class="g-label">{img}{label}</div></div>'

def canvas(w, h, groups, edges, nodes, mid):
    svg = (f'<svg class="edges" viewBox="0 0 {w} {h}" style="width:{w}px;height:{h}px" aria-hidden="true"><defs>'
           f'<marker id="ar-{mid}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">'
           '<path d="M0 0 L10 5 L0 10 z" fill="context-stroke"/></marker></defs>' + ''.join(edges).replace('url(#ar)', f'url(#ar-{mid})') + '</svg>')
    return f'<div class="scroller"><div class="canvas" style="width:{w}px;height:{h}px">{"".join(groups)}{svg}{"".join(nodes)}</div></div>'

def e(cls, d, label=None, lx=0, ly=0, anchor='middle', accent=False):
    out = f'<path class="{cls}" d="{d}" marker-end="url(#ar)"/>'
    if label: out += f'<text class="el{" a" if accent else ""}" x="{lx}" y="{ly}" text-anchor="{anchor}">{label}</text>'
    return out

# ---------- FRONTEND: rows top 140/280/420, cols 330/480/630, outside cx 120 and 900
R1, R2, R3 = 140, 280, 420
fe = canvas(1000, 610,
  [group(240, 80, 480, 490, 'React SPA on Vercel', 'vercel')],
  [e('e', f'M156 {R1+30} H294', 'HTTPS', 225, R1+22, accent=True),
   e('e', f'M366 {R1+30} H444', 'hooks', 405, R1+22, accent=True),
   e('e', f'M516 {R1+30} H594', 'api()', 555, R1+22, accent=True),
   e('e', f'M666 {R1+30} H864', '/api/v1 + JWT', 765, R1+22, accent=True),
   e('n dash', f'M630 {R1+100} V{R2-4}', 'no API URL', 640, R1+122, 'start'),
   e('n', f'M330 {R1+100} V{R2-4}', 'track, lang', 340, R1+122, 'start'),
   e('n', f'M666 {R3+30} H864', 'OAuth / OTP', 765, R3+22)],
  [node(120, R1, 'lucide-user', 'User', 'phone / browser', 'user'),
   node(330, R1, 'react', 'Pages', 'lazy routes', 'pages'),
   node(480, R1, 'tanstack', 'TanStack Query', 'server state', 'query'),
   node(630, R1, 'lucide-plug', 'apiClient', 'only HTTP door', 'apiclient'),
   node(900, R1, 'fastapi', 'FastAPI', 'real backend', 'fastapi'),
   node(330, R2, 'zustand', 'Zustand', 'track, language', 'zustand'),
   node(480, R2, 'lucide-languages', 'i18next', 'en + hi', 'i18n'),
   node(630, R2, 'lucide-database', 'Demo server', 'in-browser API', 'demo'),
   node(330, R3, 'lucide-film', 'ScrollSequence', 'canvas frames', 'sequence'),
   node(480, R3, 'tailwind', 'Tokens', 'css variables', 'tokens'),
   node(630, R3, 'supabase', 'supabase-js', 'browser sign-in', 'supabasejs'),
   node(900, R3, 'supabase', 'Supabase Auth', 'otp via twilio', 'supaauth')], 'fe')

# ---------- BACKEND: row1 120, row2 300, row3 460
B1, B2, B3 = 120, 300, 470
be = canvas(1060, 690,
  [group(150, 60, 180, 210, 'Vercel', 'vercel'),
   group(510, 60, 480, 210, 'Supabase', 'supabase'),
   group(360, B3-60, 630, 210, 'Providers (behind Protocols)', None, 'gb')],
  [e('e', f'M126 {B1+30} H204', 'HTTPS', 165, B1+22, accent=True),
   e('e', f'M276 {B1+30} H414', 'REST + JWT', 345, B1+22, accent=True),
   e('e', f'M486 {B1+30} H564', 'SQL · RLS', 525, B1+22, accent=True),
   e('n', f'M450 {B1+100} V{B2-4}', 'enqueue', 440, B1+152, 'end'),
   e('n', f'M486 {B2+30} H564', 'jobs', 525, B2+22),
   e('n', f'M600 {B2-4} V{B1+104}', 'results', 610, B2-12, 'start'),
   e('n', f'M600 {B2+100} V{B3-4}', 'adapters', 610, B3-14, 'start'),
   e('n dash', f'M240 {B1-4} V36 H900 V{B1-4}', 'sign-in (browser → Supabase)', 570, 30)],
  [node(90, B1, 'lucide-user', 'User', 'phone / browser', 'user'),
   node(240, B1, 'react', 'React SPA', 'vite build', 'spa'),
   node(450, B1, 'fastapi', 'FastAPI', 'api, docker', 'fastapi'),
   node(600, B1, 'postgres', 'Postgres', 'rls everywhere', 'postgres'),
   node(750, B1, 'supabase', 'Storage', 'private buckets', 'storage'),
   node(900, B1, 'supabase', 'Auth', 'google, whatsapp', 'auth'),
   node(450, B2, 'redis', 'Redis', 'rq queue', 'redis'),
   node(600, B2, 'docker', 'Worker', 'same image as api', 'worker'),
   node(450, B3, 'gcp', 'Cloud Vision', 'handwriting ocr', 'ocr'),
   node(600, B3, 'claude', 'Claude', 'extract, letters', 'llm'),
   node(750, B3, 'lucide-audio-lines', 'Sarvam AI', 'hindi speech', 'voice'),
   node(900, B3, 'twilio', 'Twilio', 'messages, calls', 'twilio')], 'be')

INFO = json.loads((HERE / 'info.json').read_text(encoding='utf-8'))
page = f'''<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow"><title>ClaimSathi architecture (internal)</title>{style}
<style>
.internal {{ background:oklch(30% 0.06 25); color:#fff; font-family:var(--font-mono); font-size:12px; padding:10px 14px; border-radius:8px; margin-bottom:24px; letter-spacing:.02em; }}
.tabs {{ display:flex; gap:8px; margin-bottom:16px; }}
.tabs button {{ font:600 13px var(--font-display); padding:8px 14px; border-radius:8px; border:1px solid var(--color-rule-2); background:var(--color-paper); color:var(--color-ink); cursor:pointer; }}
.tabs button[aria-selected="true"] {{ background:var(--color-ink); color:var(--color-paper); }}
button.node {{ background:none; border:0; cursor:pointer; font:inherit; color:inherit; padding:0; }}
button.node:focus-visible .tile, button.node[aria-pressed="true"] .tile {{ border-color:var(--color-accent); box-shadow:0 0 0 3px var(--color-accent-soft); }}
.layout {{ display:grid; grid-template-columns:auto 320px; gap:24px; align-items:start; }}
@media (max-width:1400px) {{ .layout {{ grid-template-columns:1fr; }} }}
.panel {{ border:1px solid var(--color-rule-2); border-radius:10px; padding:18px; background:var(--color-paper-2); position:sticky; top:16px; }}
.panel h2 {{ font:700 18px var(--font-display); }}
.panel .what {{ font-size:13px; line-height:1.65; margin-top:8px; color:var(--color-ink-2); }}
.panel dl {{ margin-top:12px; font-size:12px; display:grid; gap:6px; }}
.panel dt {{ font-family:var(--font-mono); color:var(--color-muted); font-size:10.5px; }}
.panel dd {{ font-family:var(--font-mono); font-size:11.5px; word-break:break-word; }}
.panel .hint {{ font-size:12px; color:var(--color-muted); }}
.view[hidden] {{ display:none; }}
</style></head><body><div class="page">
<div class="internal" role="note">INTERNAL — for the team only. Not part of the app, not deployed, not linked from anywhere public.</div>
<header class="head"><div><div class="kicker">claimsathi / internal / architecture</div><h1>How ClaimSathi is put together</h1></div>
<p class="lede">Click any box to see what it does, which files own it, and the PRD section it comes from.</p></header>
<div class="tabs" role="tablist"><button role="tab" aria-selected="true" data-view="fe">Frontend</button><button role="tab" aria-selected="false" data-view="be">Backend &amp; services</button></div>
<div class="layout"><div>
<section class="view" id="view-fe">{fe}
<div class="legend"><span><span class="sw"></span>request path</span><span><span class="sw n"></span>internal</span><span><span class="sw n dash"></span>demo mode only</span></div></section>
<section class="view" id="view-be" hidden>{be}
<div class="legend"><span><span class="sw"></span>request path</span><span><span class="sw n"></span>internal / jobs</span><span><span class="sw n dash"></span>browser-direct</span></div></section>
</div><aside class="panel" aria-live="polite"><h2 id="p-title">Pick a box</h2><p class="what" id="p-what">Every box is a real part of the codebase.</p><dl id="p-meta"></dl></aside></div>
<div class="foot"><span>ClaimSathi internal architecture, built from rules.md and the PRD</span><span>icons: devicon / gilbarbara logos / Lucide · made with <a href="https://github.com/caru-ini/stack-diagram" target="_blank" rel="noopener">stack-diagram</a></span></div>
</div>
<script>
const INFO = {json.dumps(INFO, ensure_ascii=False)};
const tabs = document.querySelectorAll('[role=tab]');
tabs.forEach(t => t.addEventListener('click', () => {{
  tabs.forEach(x => x.setAttribute('aria-selected', String(x === t)));
  document.getElementById('view-fe').hidden = t.dataset.view !== 'fe';
  document.getElementById('view-be').hidden = t.dataset.view !== 'be';
}}));
document.querySelectorAll('button.node').forEach(n => n.addEventListener('click', () => {{
  document.querySelectorAll('button.node').forEach(x => x.setAttribute('aria-pressed', String(x === n)));
  const i = INFO[n.dataset.key]; if (!i) return;
  document.getElementById('p-title').textContent = i.title;
  document.getElementById('p-what').textContent = i.what;
  const dl = document.getElementById('p-meta'); dl.replaceChildren();
  for (const [k, v] of [['Files', i.files], ['PRD / rules', i.ref], ['Status', i.status]]) {{
    if (!v) continue; const dt = document.createElement('dt'); dt.textContent = k; const dd = document.createElement('dd'); dd.textContent = v; dl.append(dt, dd);
  }}
}}));
</script></body></html>'''
(HERE / 'draft.html').write_text(page, encoding='utf-8')
print('draft ok')
