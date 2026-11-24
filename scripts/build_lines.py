#!/usr/bin/env python3
"""Build data/lines.geojson from raw OpenStreetMap extracts.

Two tiers only:
  remains=True   trackbed / track that physically survives (OSM abandoned & disused ways)
  remains=False  known course with nothing left on the ground: razed sections, sections
                 rebuilt as modern railway, and hand-drawn approximate courses.
"""
import json, math, heapq, os
HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, 'raw')
OUT = os.path.join(HERE, '..', 'data', 'lines.geojson')

old = json.load(open(os.path.join(RAW, 'osm_abandoned.json')))['elements']
modern = json.load(open(os.path.join(RAW, 'osm_modern.json')))['elements'] \
       + json.load(open(os.path.join(RAW, 'osm_lod_yard.json')))['elements']

def km(a, b):
    return math.hypot((a[0]-b[0])*111.2, (a[1]-b[1])*111.2*math.cos(math.radians(a[0])))
def pts(e): return [(p['lat'], p['lon']) for p in e['geometry']]
def length(g): return sum(km(a, b) for a, b in zip(g, g[1:]))
def mid(g): return g[len(g)//2]
def inbox(p, b): return b[0] <= p[0] <= b[2] and b[1] <= p[1] <= b[3]

old_ways = [e for e in old if e['type'] == 'way' and 'geometry' in e]
def status(t):
    for k in ('railway', ):
        if t.get(k) in ('abandoned', 'disused', 'razed', 'dismantled'): return t[k]
    for s in ('razed', 'abandoned', 'disused'):
        if s + ':railway' in t: return s
    return None
def is_line(t):
    v = t.get('abandoned:railway') or t.get('disused:railway') or t.get('razed:railway')
    return v in (None, 'rail', 'narrow_gauge')

# ---------- routing graph over modern + disused standard-gauge rail ----------
graph = {}
def add_way(g):
    for a, b in zip(g, g[1:]):
        d = km(a, b)
        graph.setdefault(a, []).append((b, d)); graph.setdefault(b, []).append((a, d))
for e in modern:
    if e['type'] == 'way' and 'geometry' in e and e['tags'].get('construction') not in ('light_rail', 'platform') \
       and 'light' not in e['tags'].get('name', '').lower() and 'קלה' not in e['tags'].get('name', '') and 'הקו ה' not in e['tags'].get('name', ''):
        add_way(pts(e))
for e in old_ways:
    if e['tags'].get('gauge') == '1435': add_way(pts(e))
nodes = list(graph)
def snap(p): return min(nodes, key=lambda n: km(n, p))
def shortest(a, b):
    a, b = snap(a), snap(b)
    dist = {a: 0}; prev = {}; pq = [(0, a)]
    while pq:
        d, u = heapq.heappop(pq)
        if u == b: break
        if d > dist[u]: continue
        for v, w in graph[u]:
            nd = d + w
            if nd < dist.get(v, 1e9): dist[v] = nd; prev[v] = u; heapq.heappush(pq, (nd, v))
    if b not in dist:
        print('  !! no rail path', a, b, '- straight line used'); return [a, b]
    path = [b]
    while path[-1] != a: path.append(prev[path[-1]])
    return path[::-1]
def route(*via):
    out = []
    for a, b in zip(via, via[1:]):
        seg = shortest(a, b); out += seg if not out else seg[1:]
    return out

features = []
def add(line, remains, geom, src, osm=None):
    geom = [g for i, g in enumerate(geom) if i == 0 or g != geom[i-1]]
    if len(geom) < 2: return
    props = {'line': line, 'remains': remains, 'src': src}
    if osm: props['osm'] = osm                      # OSM way id the segment was taken from
    features.append({'type': 'Feature', 'properties': props,
                     'geometry': {'type': 'LineString', 'coordinates': [[round(p[1], 5), round(p[0], 5)] for p in geom]}})

def take(line, pred):
    n = 0
    for e in old_ways:
        t = e['tags']; st = status(t)
        if not st or not is_line(t): continue
        if 'light_rail' in t.values() or 'tram' in t.values() or 'הקו ה' in t.get('name', ''): continue   # Jerusalem light rail (e.g. Red Line stub tagged disused)
        g = pts(e)
        if pred(e, t, g):
            add(line, st in ('abandoned', 'disused'), g, 'osm', e['id']); n += 1
    print(line, 'osm ways:', n)

# ---------- 1. Jaffa–Jerusalem (1892) ----------
JAFFA = (32.0590, 34.7614)
take('jj', lambda e, t, g: e['id'] == 854647180)                                   # Park HaMesila, Tel Aviv
take('jj', lambda e, t, g: t.get('gauge') == '1435' and inbox(mid(g), (31.72, 34.985, 31.78, 35.215))
     and t.get('service') is None)                                                 # Beit Shemesh – Malha, rails in place, disused
take('jj', lambda e, t, g: t.get('gauge') != '1435' and inbox(mid(g), (31.745, 35.185, 31.770, 35.23))
     and t.get('name') != 'הקו האדום')  # Jerusalem Train Track Park
add('jj', False, [JAFFA, (32.0592, 34.7640)], 'approx')
add('jj', False, [(32.0610, 34.7720), (32.0625, 34.7765), (32.0615, 34.7810), (32.0570, 34.7835), snap((32.0537, 34.7848))], 'approx')
add('jj', False, route((32.0537, 34.7848), (31.9459, 34.8756), (31.9294, 34.8768), (31.8704, 34.8700),
                       (31.8064, 34.8736), (31.7574, 34.9909)), 'modern')

# ---------- 2. Jezreel Valley railway (1905) ----------
HAIFA_E = (32.8118, 35.0048); AFULA = (32.6106, 35.2903); BEITSHEAN = (32.5128, 35.4936)
VALLEY_BOX = (32.49, 35.45, 32.76, 35.756)   # east to Yarmouk tunnel no. 1 and the Wadi Khaled bend, the last stretch on the Israeli-held bank
take('valley', lambda e, t, g: t.get('gauge') != '1435' and inbox(mid(g), VALLEY_BOX))
take('valley', lambda e, t, g: e['id'] == 251770874 or 'Jezreel' in t.get('name', '') + t.get('description', '') or t.get('name') == 'השוק')
add('valley', False, [HAIFA_E] + route(HAIFA_E, (32.7740, 35.0489), (32.7194, 35.0908), (32.6676, 35.1455),
                                        (32.6276, 35.2672)) + [(32.6200, 35.2800), AFULA], 'modern')
add('valley', False, [AFULA, (32.6030, 35.3000)] + route((32.5972, 35.3100), (32.5148, 35.4880)) + [BEITSHEAN], 'modern')

# ---------- 3. Acre branch (1913) ----------
add('acre', False, route((32.7740, 35.0489), (32.7934, 35.0307), (32.9283, 35.0828)), 'modern')

# ---------- 4. Samaria railway (1912-15): Afula – Jenin – Mas'udiya – Nablus / Tulkarm ----------
take('samaria', lambda e, t, g: t.get('gauge') != '1435' and inbox(mid(g), (32.20, 35.012, 32.605, 35.33))
     and t.get('name') != 'השוק')

# ---------- 5. Eastern railway (1915): Tulkarm – Lydda, and the Hadera forest branches ----------
TULKARM = (32.3077, 35.0156)
add('eastern', False, route((31.9459, 34.8756), (32.0418, 34.9357), (32.1042, 34.9347), (32.2116, 34.9639),
                            (32.2900, 35.0080)) + [TULKARM], 'modern')
add('eastern', False, [TULKARM, (32.3300, 35.0120), (32.3600, 35.0060), (32.3836, 35.0019), (32.4050, 34.9900),
                       (32.4250, 34.9650), (32.4372, 34.9456)], 'approx')
add('eastern', False, [(32.3836, 35.0019), (32.4200, 35.0040), (32.4599, 35.0062), (32.4900, 35.0180), (32.5230, 35.0330)], 'approx')

# ---------- 6. Southern line (1915-16): Wadi Surar – Beersheba – Auja – Kusseima ----------
SOREK = (31.8064, 34.8736); TINA = (31.7450, 34.8000); BS_STN = (31.2454, 34.7853)
NORTH_IDS = {1490951493, 1490951494, 1490951500, 1490951501, 1490951502, 1490951503, 1009209246,
             1490946228, 1490946229, 1490946230, 1349018080, 1490504072, 1490504069, 875470109, 624434434, 875470113}
take('south', lambda e, t, g: e['id'] in NORTH_IDS or (mid(g)[0] < 31.20 and 34.2 < mid(g)[1] < 34.85 and not (mid(g)[0] > 30.92 and mid(g)[1] < 34.42)))
add('south', False, [SOREK, (31.7900, 34.8450), (31.7750, 34.8280), (31.7580, 34.8120), TINA, (31.7200, 34.7870),
                     (31.6900, 34.7720), (31.6600, 34.7600), (31.6300, 34.7700), (31.6060, 34.7800)], 'approx')
add('south', False, [(31.3850, 34.6800), (31.3830, 34.6400), (31.3820, 34.6070)], 'approx')        # Tell esh-Sheria – Abu Hureira spur

def link(line, via):
    """Subdued connector whose two ends snap to the nearest existing end of the same line (within 1 km)."""
    ends = []
    for f in features:
        if f['properties']['line'] == line:
            c = f['geometry']['coordinates']; ends += [(c[0][1], c[0][0]), (c[-1][1], c[-1][0])]
    via = list(via)
    for i in (0, -1):
        q = min(ends, key=lambda e: km(e, via[i]))
        if km(q, via[i]) < 1.0: via[i] = q
    add(line, False, via, 'approx')
south_done = len(features)
link('south', [(31.6000, 34.7820), (31.5750, 34.7800), (31.5510, 34.7760)])                      # Iraq al-Manshiya – Nahal Shikma
link('south', [(31.4690, 34.7640), (31.4500, 34.7450), (31.4300, 34.7150), (31.4170, 34.7000)])  # Nahal Pura – Tell esh-Sheria
link('south', [(31.3320, 34.6740), (31.3150, 34.6900), (31.3006, 34.7100), (31.2830, 34.7280)])  # – Nahal Patish bridge
link('south', [(31.2570, 34.7530), (31.2520, 34.7700), BS_STN])                                  # into Beersheba station
link('south', [BS_STN, (31.2400, 34.7950), (31.2351, 34.8029)])                                  # station – Turkish bridge
link('south', [(31.2336, 34.8035), (31.2100, 34.8080), (31.1920, 34.8070)])                      # bridge – Ramat Hovav

# ---------- 7. Gaza branch (1917): et-Tina – Deir Sneid – Beit Hanoun, and the Huj spur ----------
add('gaza', False, [TINA, (31.7405, 34.7750), (31.7377, 34.7568), (31.7280, 34.7350), (31.7150, 34.7150), (31.7030, 34.7000),
                    (31.6980, 34.6850), (31.6750, 34.6550), (31.6450, 34.6200), (31.6100, 34.5850), (31.5705, 34.5539),
                    (31.5550, 34.5450), (31.5410, 34.5370)], 'approx')
add('gaza', False, [(31.5570, 34.5460), (31.5520, 34.5650), (31.5560, 34.5850), (31.5650, 34.6020), (31.5580, 34.6180),
                    (31.5350, 34.6250), (31.5100, 34.6230)], 'approx')

# ---------- close gaps between surviving pieces with subdued connectors ----------
def fill_gaps(line, maxgap, anchors=()):
    segs = [f for f in features if f['properties']['line'] == line]
    ends = []
    for i, f in enumerate(segs):
        c = f['geometry']['coordinates']
        ends += [(i, (c[0][1], c[0][0])), (i, (c[-1][1], c[-1][0]))]
    ends += [(-1 - k, a) for k, a in enumerate(anchors)]
    allpts = [(i, (p[1], p[0])) for i, f in enumerate(segs) for p in f['geometry']['coordinates']]
    done = set(); n = 0
    for i, p in ends:
        if any(j != i and km(p, q) < 0.04 for j, q in allpts): continue           # already touching something
        best = min(((km(p, q), j, q) for j, q in ends if j != i), default=None)
        if not best or best[0] > maxgap: continue
        key = tuple(sorted([p, best[2]]))
        if key in done: continue
        done.add(key); add(line, False, [p, best[2]], 'gap'); n += 1
    print(line, 'gap connectors:', n)
fill_gaps('south', 3.0)
fill_gaps('valley', 2.5, anchors=[BEITSHEAN])
fill_gaps('samaria', 2.5, anchors=[AFULA, TULKARM])
fill_gaps('jj', 1.5)

tot = {}
for f in features:
    p = f['properties']; c = [(y, x) for x, y in f['geometry']['coordinates']]
    tot.setdefault((p['line'], p['remains']), 0); tot[(p['line'], p['remains'])] += length(c)
for k in sorted(tot): print(k, round(tot[k], 1), 'km')
json.dump({'type': 'FeatureCollection', 'features': features}, open(OUT, 'w'), separators=(',', ':'))
print('wrote', OUT, len(features), 'features', os.path.getsize(OUT)//1024, 'KB')
