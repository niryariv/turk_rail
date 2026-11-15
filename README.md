# Ottoman railways in Israel

An interactive map of the railway lines built under Ottoman rule between 1892 and 1917,
and of what is still standing: bridges, stations, water towers, tunnels and embankments.

The map draws only one distinction:

- **Roof-tile red** — something physical survives: a thin solid line for trackbed or rails, a sand
  medallion with an ink drawing for a standing structure, a small dot for a minor remain.
- **Faint sand-coloured dotted line / dashed rings** — the historical course or site is known, but
  nothing is left on the ground.

The palette follows Nachum Gutman's paintings of Jaffa and early Tel Aviv: sunlit sand, roof-tile red,
sea teal, ochre, dusty rose and olive under a thin ink line.

The map opens on aerial imagery so the embankments, bridges and cuttings can be seen as they are today.
Zoomed in, the line thins to a row of sparse dots so that it does not cover the trackbed in the imagery.

The interface is in Hebrew (right-to-left) and is aimed at people who want to go and see the remains.

## Run locally

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

It is a static site (Leaflet, no build step), so it can be served as-is from GitHub Pages:
push to GitHub, then Settings → Pages → Deploy from branch → `main` / root.

## Data

| File | Contents |
|---|---|
| `data/lines.geojson` | Line segments, each with `line` and `remains` (true/false) |
| `data/sites.geojson` | Stations, bridges and other sites, each with `remains` (true/false) |
| `data/minor.geojson` | Small remains (culverts, small bridges, cuttings, rail fragments) from Amud Anan; all are physical remains |

Both are generated; edit the scripts, not the output.

```sh
python3 scripts/build_lines.py   # from the raw OpenStreetMap extracts in scripts/raw/
python3 scripts/build_sites.py   # from the curated list inside the script
python3 scripts/build_minor.py   # from scripts/raw/amudanan_points.json (run after the other two)
```

- **Surviving trackbed** comes from OpenStreetMap ways tagged `railway=abandoned` / `disused`
  (queries in `scripts/raw/*.overpassql`).
- **Vanished course** is either OSM `razed`/`dismantled` ways, the modern railway where it was
  built on the old formation, or a hand-sketched course between known points (approximate).
- **Sites** are curated by hand in `scripts/build_sites.py` from the Hebrew Wikipedia articles on
  each line, station and bridge, cross-checked against OpenStreetMap and Israel Hiking Map points
  of interest. To add a site, add a row there and set `remains` honestly.

- **Small remains** come from public, user-contributed points on [Amud Anan](https://amudanan.co.il)
  that mention a railway in any spelling (חיג'אזית / חיגזית / טורקית / תורכית / עות'מאנית / עותמנית …),
  lie on one of the lines and are described as physical objects. The filter rules are in
  `scripts/build_minor.py`. Each point shows a shortened description and, where one exists, its photo (hot-linked),
  credits its contributors and links back to its Amud Anan page. Amud Anan does not state a reuse licence for this content, so
  check with them before publishing widely.

## Credits

Map data © OpenStreetMap contributors (ODbL). Base maps: Esri World Imagery (default), Israel Hiking Map
(CC BY-NC-SA), OpenStreetMap. Photographs are hot-linked from Wikimedia Commons, Hebrew
Wikipedia and Amud Anan; each links to its source page for author and licence. Historical text is summarised from Hebrew Wikipedia
(CC BY-SA).
