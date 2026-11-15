"""Builds the public changelog page (sndt.cc/changelog/) from the player changelogs in releases/vX/CHANGELOG.md, newest first.
   usage: python3 scripts/changelog.py site/changelog/index.html
   The changelogs use a small part of Markdown: '# title', '## section', '- item' (two spaces before '-' for a sub-item), **bold**, `code`
   and plain paragraphs; that is all this converts."""
import glob, html, os, re, sys

def vkey(path):
    v = os.path.basename(os.path.dirname(path)).lstrip('v')
    return [int(x) for x in re.findall(r'\d+', v)]

def inline(t):
    t = html.escape(t, quote=False)
    t = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', t)
    t = re.sub(r'`(.+?)`', r'<code>\1</code>', t)
    return t

def convert(md, vid):
    out, depth = [], 0          # depth: how many <ul> are open
    def close(to=0):
        nonlocal depth
        while depth > to: out.append('</ul>'); depth -= 1
    for line in md.splitlines():
        if not line.strip(): close(); continue
        m = re.match(r'^(\s*)- (.*)', line)
        if m:
            want = 2 if len(m.group(1)) >= 2 else 1
            if depth < want: out.extend(['<ul>'] * (want - depth)); depth = want
            else: close(want)
            out.append(f'<li>{inline(m.group(2))}</li>'); continue
        close()
        if line.startswith('# '): out.append(f'<h2 id="{vid}"><a href="#{vid}">{inline(line[2:])}</a></h2>')
        elif line.startswith('## '): out.append(f'<h3>{inline(line[3:])}</h3>')
        else: out.append(f'<p>{inline(line.strip())}</p>')
    close()
    return '\n'.join(out)

def build(out_path, since=(1, 0)):
    """The page: every version since v1.0 as a list, newest first and open, the others closed until clicked (#v1-0-6 opens that one)."""
    files = [f for f in sorted(glob.glob('releases/v*/CHANGELOG.md'), key=vkey, reverse=True) if tuple(vkey(f)[:2]) >= since]
    parts, side = [], []
    for n, f in enumerate(files):
        vid = 'v' + '-'.join(str(x) for x in vkey(f))
        name = os.path.basename(os.path.dirname(f))
        md = open(f, encoding='utf-8').read().strip().splitlines()
        title = md[0][2:].strip() if md and md[0].startswith('# ') else name
        sub = re.sub(r'^SNDT\s+v[\d.]+\s*(—|changelog:)?\s*', '', title, flags=re.I)
        side.append(f'<a href="#{vid}">{html.escape(name)}</a>')
        parts.append(f'<details id="{vid}"{" open" if n == 0 else ""}><summary><span class="v">{html.escape(name)}</span><span class="t">{inline(sub)}</span></summary><div class="body">{convert(chr(10).join(md[1:]), vid)}</div></details>')
    page = TEMPLATE.replace('{{BODY}}', '\n'.join(parts)).replace('{{SIDE}}', '\n'.join(side))
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    open(out_path, 'w', encoding='utf-8').write(page)
    print('wrote', out_path, len(files), 'versions')

TEMPLATE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SNDT changelog</title>
<meta name="description" content="Everything that changed in SNDT, version by version.">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%230b0b0b'/%3E%3Cpath d='M5 21H12L20 13H28' fill='none' stroke='%23efede7' stroke-width='3.2'/%3E%3Cpath d='M5 17V25' stroke='%23efede7' stroke-width='3.2'/%3E%3Cpath d='M19 3V29' fill='none' stroke='%23e61919' stroke-width='3.2'/%3E%3Ccircle cx='19' cy='14' r='3.7' fill='%23efede7' stroke='%230b0b0b' stroke-width='1.8'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Figtree:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap">
<style>
:root{--paper:#efede7;--ink:#0b0b0b;--muted:#55524c;--red:#e61919;--line:#0b0b0b}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--paper:#121212;--ink:#efede7;--muted:#a8a49c;--red:#ff2a2a;--line:#efede7}}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.6 Figtree,system-ui,sans-serif}
main{max-width:1040px;margin:0 auto;padding:40px 16px 80px}
.cols{display:grid;grid-template-columns:minmax(0,1fr) 180px;gap:48px;align-items:start}
.side{position:sticky;top:24px;border-left:3px solid var(--line);padding-left:16px}
.side p{font:700 12px/1.2 'JetBrains Mono',monospace;letter-spacing:.14em;text-transform:uppercase;margin:4px 0 10px}
.side nav{display:flex;flex-direction:column}
.side a{font:15px/1 'Archivo Black',sans-serif;letter-spacing:-.01em;text-decoration:none;padding:7px 0;color:var(--muted)}
.side a:hover,.side a.on{color:var(--ink)}
.side a.on::before{content:'';display:inline-block;width:8px;height:8px;background:var(--red);margin-right:8px;vertical-align:2px}
@media (max-width:760px){.cols{grid-template-columns:1fr;gap:20px}.side{position:static;order:-1;border-left:0;border-top:3px solid var(--line);padding:10px 0 0}.side nav{flex-direction:row;flex-wrap:wrap;gap:4px 14px}}
a{color:inherit;text-decoration-color:var(--red);text-underline-offset:3px}
.top{display:flex;align-items:center;gap:10px;text-decoration:none}
.top svg{width:32px;height:32px}
.top b{font:24px/1 'Archivo Black',sans-serif;letter-spacing:-.04em}
.bar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:28px}
.open{font:700 12px/1 'JetBrains Mono',monospace;letter-spacing:.12em;text-transform:uppercase;text-decoration:none;border:2px solid var(--line);padding:10px 14px;box-shadow:3px 3px 0 var(--line)}
.kick{font:700 12px/1.2 'JetBrains Mono',monospace;letter-spacing:.14em;text-transform:uppercase;margin:0 0 8px}
.kick::before{content:'// ';color:var(--red)}
h1{font:clamp(34px,7vw,56px)/1 'Archivo Black',sans-serif;letter-spacing:-.03em;margin:0 0 14px}
.lede{color:var(--muted);margin:0 0 24px}
.list{border-top:3px solid var(--line)}
details{border-bottom:1px solid color-mix(in srgb,var(--ink) 30%,transparent)}
summary{display:flex;align-items:baseline;gap:14px;padding:16px 4px;cursor:pointer;list-style:none}
summary::-webkit-details-marker{display:none}
summary::after{content:'+';margin-left:auto;font:22px/1 'Archivo Black',sans-serif;color:var(--red)}
details[open] summary::after{content:'−'}
summary:hover .t{text-decoration:underline;text-decoration-color:var(--red);text-underline-offset:3px}
.v{font:22px/1 'Archivo Black',sans-serif;letter-spacing:-.02em;min-width:5.2em}
.t{color:var(--muted)}
.body{padding:0 4px 20px}
.body h3:first-child{margin-top:4px}
h3{font:600 18px/1.3 Figtree,sans-serif;margin:22px 0 4px}
ul{padding-left:20px;margin:4px 0}
li{margin:4px 0}
code{font:14px 'JetBrains Mono',monospace}
footer{margin-top:56px;color:var(--muted);font-size:14px}
</style>
</head>
<body>
<main>
<div class="bar"><a class="top" href="/" aria-label="SNDT home"><svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" fill="var(--ink)"/><path d="M5 21H12L20 13H28" fill="none" stroke="var(--paper)" stroke-width="3.2"/><path d="M5 17V25" stroke="var(--paper)" stroke-width="3.2"/><path d="M19 3V29" fill="none" stroke="var(--red)" stroke-width="3.2"/><circle cx="19" cy="14" r="3.7" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.8"/></svg><b>SNDT</b></a><a class="open" href="/app/">Open the editor</a></div>
<p class="kick">Changelog</p>
<h1>What changed.</h1>
<p class="lede">Every SNDT version since 1.0, newest first. Click a version to see what it brought.</p>
<div class="cols">
<div class="list">
{{BODY}}
</div>
<aside class="side" aria-label="Versions"><p>Versions</p><nav>
{{SIDE}}
</nav></aside>
</div>
<script>
// a link like sndt.cc/changelog/#v1-0-6 opens that version and scrolls to it
function mark(){document.querySelectorAll('.side a').forEach(a=>{const d=document.getElementById(a.getAttribute('href').slice(1));a.classList.toggle('on',!!(d&&d.open))})}
function openHash(){const d=location.hash&&document.getElementById(location.hash.slice(1));if(d&&d.tagName==='DETAILS'){d.open=true;d.scrollIntoView({block:'start'})}mark()}
openHash();addEventListener('hashchange',openHash);document.querySelectorAll('details').forEach(d=>d.addEventListener('toggle',mark));
</script>
<footer><a href="/">Home</a> · <a href="/handbook/">Handbook</a> · <a href="https://discord.gg/jTycUK7Uvs" rel="noopener">Suggest something on Discord</a></footer>
</main>
</body>
</html>
"""

if __name__ == '__main__':
    build(sys.argv[1] if len(sys.argv) > 1 else 'site/changelog/index.html')
