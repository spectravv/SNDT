import sys,re,os
src=open(sys.argv[1]).read(); out=sys.argv[2]
i=src.index('<style>'); j=src.index('</style>')+len('</style>')
head_links=src[:i]; style=src[i:j]; body=src[j:]
base='<style>html{color-scheme:light;padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}</style>'
doc=('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
 '<meta name="description" content="SNDT: draw transit network schematics for your Minecraft server.">\n'
 # installable app (PWA): manifest, icons and the colour of the phone's status bar; site/sw.js makes it open offline
 '<link rel="manifest" href="/manifest.webmanifest">\n<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">\n'
 '<meta name="theme-color" content="#efede7" media="(prefers-color-scheme: light)">\n<meta name="theme-color" content="#121212" media="(prefers-color-scheme: dark)">\n'
 '<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-title" content="SNDT">\n'
 +base+'\n'+head_links.strip()+'\n'+style+'\n</head>\n<body>\n'+body.strip()+'\n</body>\n</html>\n')
os.makedirs(os.path.dirname(out),exist_ok=True); open(out,'w').write(doc); print('wrote',out,len(doc))
