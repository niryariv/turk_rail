#!/usr/bin/env python3
"""Build data/minor.geojson — small physical remains (culverts, small bridges, cuttings,
stretches of embankment) taken from Amud Anan (amudanan.co.il) user-contributed points.

Input: scripts/raw/amudanan_points.json — every public Amud Anan point in the map tiles along
the rail corridors whose title or description mentions a railway (any spelling).
A point is kept only if it (a) lies on one of our lines, (b) is described as Ottoman/Turkish/WWI-era
or sits on a surviving stretch, (c) is named as a physical object, and (d) carries no wording that
says it is gone, uncertain or from a later period. Everything kept is a remain; nothing here is tier two.
"""
import json, math, os, re, urllib.parse
HERE = os.path.dirname(os.path.abspath(__file__))
D = os.path.join(HERE, '..', 'data')
pts = json.load(open(os.path.join(HERE, 'raw', 'amudanan_points.json')))
lines = json.load(open(os.path.join(D, 'lines.geojson')))['features']
sites = json.load(open(os.path.join(D, 'sites.geojson')))['features']

def km(a, b): return math.hypot((a[0]-b[0])*111.2, (a[1]-b[1])*94)
grid = {}
for f in lines:
    c = f['geometry']['coordinates']
    for i, (x, y) in enumerate(c):
        seg = [(y, x)]
        if i:
            px, py = c[i-1]; n = int(km((py, px), (y, x))/0.2)
            seg += [(py+(y-py)*k/(n+1), px+(x-px)*k/(n+1)) for k in range(1, n+1)]
        for p in seg: grid.setdefault((int(p[0]*50), int(p[1]*50)), []).append((p[0], p[1], f['properties']['line'], f['properties']['remains']))
def nearest(la, lo):
    best = (9, None, None)
    for i in (-1, 0, 1):
        for j in (-1, 0, 1):
            for p in grid.get((int(la*50)+i, int(lo*50)+j), []):
                d = km((la, lo), p)
                if d < best[0]: best = (d, p[2], p[3])
    return best

# spelling variants: חיג'אזית/חיגאזית/חיגזית/חג'אזית, טורקי/תורכי, עות'מאני/עותמאני/עותמני/עותומני/עוסמאני
RAIL = re.compile(r"ח[י]?ג.?א?ז|רכבת|מסיל|Hejaz|[Rr]ailway")
ERA = re.compile(r"טורק|תורכ|עות.?ו?מ.?נ|עוסמ|ח[י]?ג.?א?ז|רכבת העמק|מלחמת העולם הראשונה|מלח.?.?ע הראשונה|191[4-8]|190[3-5]|1892")
KINDS = [('culvert', r"גשרון|גישרון|מעביר|מעבר מים|מעברי מים"), ('bridge', r"גשר"), ('cutting', r"מבתר|חפיר|מפער"),
         ('station', r"תחנ"), ('water', r"באר|בור מים|מגדל מים|מאגר"), ('embankment', r"סולל|תוואי|מסיל|פסי|שרידי")]
GONE = re.compile(r"לא אותר|משוער|לא נותר דבר|לא נותר ממנ|אין שריד|שמועות|לא סביר|כאן הייתה|גשר חדש|נהרס ב-?20|דגם|ללא GPS|לא נדגם")
LATER = re.compile(r"מנדטורי|בריטי|אירי|ממלוכי|ישראל|החדש|רכבת ישראל|1937|הקלה|תצפית|גשר מעל|העתידית|כביש|הולכי רגל")
LATER_DESC = re.compile(r"בטון בריטי|גשר מחודש|מאוחר יותר|כנראה תקופת המנדט|רכבת העמק החדשה|ולא של|נבנתה בשנת 19[2-9]|מסילת העמק המחודשת")
BADTYPE = re.compile(r"בית ספר|מסעדה|בית קברות|אנדרטה|מפל|צמחיה|עץ|ישוב|יישוב|צמת|צומת|נחל|מטע|חניון|מלון|קניות|מבני ציבור|בית כנסת|שכונה|ארכיאולוגי")
SKIP_IDS = {'514014', '316058', '821465', '848789'}   # Nahal Qana bridge at Sdei Hemed: reported destroyed in 2021 during the rebuilding of the line

keep = []
for p in pts:
    if p['id'] in SKIP_IDS: continue
    t, d = p['title'], p['desc']; txt = t + ' ' + d
    if not RAIL.search(txt): continue
    dist, line, rem = nearest(p['lat'], p['lon'])
    era = bool(ERA.search(txt))
    if dist > (0.4 if era else 0.12) or (not era and not rem): continue
    kind = next((k for k, rx in KINDS if re.search(rx, t)), None)
    if not kind: continue
    if GONE.search(txt) or LATER.search(t) or LATER_DESC.search(d) or BADTYPE.search(p['type']): continue
    if line == 'jj': continue   # the Jerusalem line is still laid with track; Amud Anan points there are mostly modern crossings
    if any(km((p['lat'], p['lon']), (s['geometry']['coordinates'][1], s['geometry']['coordinates'][0])) < 0.15 for s in sites): continue
    keep.append(dict(p, line=line, kind=kind))

# (Deir Sneid is a Mandate station, Nur esh-Shams is unclear, Elro'i is already a curated site)
# one marker per spot: prefer the entry with a photo, then the longer description
keep.sort(key=lambda p: (not p['img'], -len(p['desc'])))
out = []
for p in keep:
    if any(km((p['lat'], p['lon']), (q['lat'], q['lon'])) < 0.05 for q in out): continue
    out.append(p)
out.sort(key=lambda p: (p['line'], -p['lat']))

def aa_thumb(name):
    return 'https://amudanan.co.il/services/thumb.php?file=' + ('../images/user/' if 'my.' in name else '../w/images/') + urllib.parse.quote(name.replace(' ', '_')) + '&size=640'
def short(s, n=320):
    s = re.sub(r'https?://\S+', '', re.sub(r'\s+', ' ', s)).strip()
    return s if len(s) <= n else s[:n].rsplit(' ', 1)[0] + '…'
REPORTS = {}
for r in json.load(open(os.path.join(D, 'src', 'ride_reports.json'))):
    for i in r['ids']: REPORTS.setdefault(i, []).append([r['label'], r['url']])
feats = [{'type': 'Feature', 'geometry': {'type': 'Point', 'coordinates': [p['lon'], p['lat']]},
          'properties': {'id': 'P' + p['id'], 'line': p['line'], 'kind': p['kind'], 'name': p['title'], 'desc': short(p['desc']),
                         'by': short(p['by'], 80), 'url': 'https://amudanan.co.il/#!wiki=P' + p['id'],
                         **({'img': aa_thumb(p['img'])} if p['img'] else {}),
                         **({'more': REPORTS['P' + p['id']]} if 'P' + p['id'] in REPORTS else {})}} for p in out]
json.dump({'type': 'FeatureCollection', 'features': feats}, open(os.path.join(D, 'minor.geojson'), 'w'), ensure_ascii=False, indent=0)
import collections
print(len(feats), 'minor remains', dict(collections.Counter(f['properties']['line'] for f in feats)), dict(collections.Counter(f['properties']['kind'] for f in feats)))
