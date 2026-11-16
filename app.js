/* מסילות הרכבת העות'מאניות — map logic.
   Two tiers only: what can be seen on the ground (crimson, opaque, labelled)
   and the historical course with nothing left (half-transparent). */
(function () {
  'use strict';

  var TITLE = "מסילות הרכבת העות'מאניות";
  var LINES = {
    jj: { wiki: 'מסילת הרכבת יפו–ירושלים', name: 'מסילת יפו–ירושלים', years: '1892', gauge: '1,000 מ"מ',
      text: 'מסילת הרכבת הראשונה בארץ. נבנתה בידי חברה צרפתית על סמך זיכיון שהשיג יוסף נבון ונחנכה בספטמבר 1892: 87 ק"מ ו-176 גשרים, בעלייה לירושלים לאורך נחל שורק ונחל רפאים. קטע מישור החוף הוא כיום מסילה מודרנית פעילה. בקטע ההררי הפסים עדיין מונחים על התוואי של 1892, אך רכבות אינן נוסעות בו מאז 2020. שני קצות המסילה, ביפו ובירושלים, הפכו לפארקים.' },
    valley: { wiki: 'רכבת העמק', name: 'רכבת העמק', years: '1905', gauge: '1,050 מ"מ',
      text: "שלוחת חיפה–דרעא של המסילה החיג'אזית, שנתנה לדמשק נמל בים התיכון. המסילה חצתה את עמק יזרעאל ועמק בית שאן, ירדה אל הירדן לגובה 246 מטר מתחת לפני הים וטיפסה בקניון הירמוך. נסגרה ב-1951. ממערב לבית שאן נסללה מסילה חדשה בתוואי דומה; ממזרח לה שרדו הסוללה הישנה, גשרי הבזלת והתחנות." },
    samaria: { wiki: 'מסילת השומרון', name: 'מסילת השומרון', years: '1912–1915', gauge: '1,050 מ"מ',
      text: "נסללה מעפולה דרומה דרך ג'נין למסעודיה ולשכם, ונועדה להגיע לירושלים. המלחמה שינתה את התוכנית: ממסעודיה נסלל קו מערבה לטולכרם, שחיבר את המסילה החיג'אזית למסילה הצבאית החדשה. הפסים פורקו מזמן, אך את הסוללה המתפתלת אפשר לזהות לאורך רוב הדרך." },
    eastern: { wiki: 'המסילה המזרחית ההיסטורית', name: 'המסילה המזרחית', years: '1915', gauge: '1,050 מ"מ',
      text: "נסללה בקיץ 1915 בניהולו של היינריך מייסנר מטולכרם ללוד, הרחק מהחוף ומטווח תותחי הצי הבריטי. שלוחות יער הובילו צפונה לחדרה ולכפר קניר, להבאת עצי אלון להסקת הקטרים. הבריטים הרחיבו אותה לרוחב תקני והיא הייתה לקו הראשי של הארץ. כיום היא נסללת מחדש, ולכן נותרו ממנה בעיקר תחנות וגשרים אחדים מהתקופה העות'מאנית." },
    south: { wiki: 'מסילת הרכבת מנחל שורק לקוסיימה', name: 'המסילה הדרומית לסיני', years: '1915–1916', gauge: '1,050 מ"מ',
      text: "\"השלוחה המצרית\", שנסללה כדי לתמוך במתקפה על תעלת סואץ. היא התפצלה ממסילת ירושלים בוואדי צראר, הגיעה לבאר שבע באוקטובר 1915, לביר עסלוג' במרץ 1916 ולעוג'ה אל-חפיר במאי, וסוללתה נמשכה עד קוסיימה שבסיני. לאורכה נבנו כ-140 גשרי אבן ומעבירי מים. הבריטים פוצצו את הגשרים הגדולים במאי 1917 והעות'מאנים פירקו את הפסים בנסיגתם, אך בנגב היבש הסוללה נמשכת עד היום לאורך עשרות קילומטרים." },
    gaza: { wiki: 'מסילת הרכבת מנחל שורק לעזה', name: 'השלוחה לעזה', years: '1917', gauge: '1,050 מ"מ',
      text: "נסללה באביב 1917 מא-תינה לכיוון עזה כדי לתמוך בקו עזה–באר שבע, עם שלוחה לכפר הוג'. היא הגיעה עד בית חאנון ושימשה חודשים ספורים, עד שהחזית נפרצה בנובמבר 1917. כמעט דבר לא נותר ממנה מלבד גשר אחד נאה." },
    acre: { wiki: 'רכבת העמק', name: 'שלוחת עכו', years: '1913', gauge: '1,050 מ"מ',
      text: "שלוחה קצרה מבלד א-שייח' סביב מפרץ חיפה לעכו. פסיה פורקו ב-1915 לטובת המסילה הצבאית בדרום, ומסילת החוף המאוחרת נסללה על חלק ניכר מהתוואי. לא נותרו ממנה שרידים." }
  };
  var ORDER = ['jj', 'valley', 'samaria', 'eastern', 'south', 'gaza', 'acre'];
  var KIND = { station: 'תחנה', bridge: 'גשר', water: 'מתקן מים', tunnel: 'מנהרה', trackbed: 'תוואי מסילה', building: 'מבנה', culvert: 'גשרון / מעביר מים', cutting: 'מבתר', embankment: 'סוללה / פסים' };

  var mobile = window.matchMedia('(max-width: 760px)');
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  /* ---------------------------------------------------------------- map */
  var map = L.map('map', { zoomControl: false, minZoom: 7, maxZoom: 19, zoomSnap: 1,
    maxBounds: [[28.6, 32.4], [34.2, 37.6]] });
  L.control.zoom({ position: 'bottomleft' }).addTo(map);
  map.attributionControl.setPrefix('');

  map.createPane('base').classList.add('leaflet-base-pane'); map.getPane('base').style.zIndex = 200;
  map.createPane('labels').classList.add('leaflet-labels-pane'); map.getPane('labels').style.zIndex = 390; map.getPane('labels').style.pointerEvents = 'none';
  map.createPane('gone').style.zIndex = 400;
  map.createPane('remains').style.zIndex = 410;
  map.createPane('hit').style.zIndex = 420;

  var osmAttr = '© תורמי <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
  var bases = {
    map: L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { pane: 'base', maxZoom: 19, attribution: osmAttr }),
    hike: L.tileLayer('https://israelhiking.osm.org.il/Hebrew/Tiles/{z}/{x}/{y}.png', { pane: 'base', maxNativeZoom: 16, maxZoom: 19, attribution: '<a href="https://mapeak.com">Israel Hiking Map</a> CC BY-NC-SA, ' + osmAttr }),
    sat: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { pane: 'base', maxNativeZoom: 18, maxZoom: 19, attribution: 'צילום: Esri, Maxar, Earthstar Geographics' })
  };
  var mapEl = $('map');
  function setBase(k) {
    Object.keys(bases).forEach(function (b) { if (map.hasLayer(bases[b])) map.removeLayer(bases[b]); });
    bases[k].addTo(map);
    ['map', 'hike', 'sat'].forEach(function (b) { mapEl.classList.toggle('base-' + b, k === b); });
    document.querySelectorAll('.basemaps button').forEach(function (b) { b.classList.toggle('on', b.dataset.base === k); });
  }
  document.querySelectorAll('.basemaps button').forEach(function (b) { b.addEventListener('click', function () { setBase(b.dataset.base); }); });
  setBase('sat');

  function padding() {
    return mobile.matches ? { paddingTopLeft: [24, 60], paddingBottomRight: [24, 90] } : { paddingTopLeft: [30, 30], paddingBottomRight: [420, 30] };
  }
  var HOME = [[30.78, 34.35], [32.95, 35.68]];
  map.fitBounds(HOME, padding());

  /* ------------------------------------------------------------ markers */
  /* ink-line pictograms, drawn on a 24 grid */
  var GLYPH = {
    station: 'M6 18.500V11l6-4.500 6 4.500v7.500zM10.500 18.500v-4h3v4M15.500 8.700V6.500',
    bridge: 'M3.500 8.500h17M5.500 8.500v9M12 8.500v9M18.500 8.500v9M5.500 14.500a3.250 3.250 0 016.500 0M12 14.500a3.250 3.250 0 016.500 0',
    water: 'M7.500 5.500h9v5.500h-9zM9.300 11l-1.800 8M14.700 11l1.800 8M8.300 15.500h7.400M12 3.500v2',
    tunnel: 'M3.500 18.500c1.800-8 4.500-12 8.500-12s6.700 4 8.500 12zM9.500 18.500v-4a2.500 2.500 0 015 0v4',
    trackbed: 'M9 4.500L6 19.500M15 4.500l3 15M8.300 8h7.400M7.600 11.700h8.800M6.800 15.500h10.400',
    building: 'M5.500 18.500v-10h13v10zM9.500 18.500v-4h3v4M14.500 11.500h1.500M8 11.500h1.500'
  };
  function icon(p) {
    if (p.remains) {
      return L.divIcon({ className: 'site', iconSize: [28, 28], iconAnchor: [14, 14],
        html: '<span class="mk mk-disc"><svg width="28" height="28" viewBox="0 0 24 24"><circle class="pt" cx="12" cy="12" r="11"/><path class="glyph" transform="translate(2.400 2.400) scale(.8)" d="' + (GLYPH[p.kind] || GLYPH.building) + '"/></svg></span>' });
    }
    return L.divIcon({ className: 'site gone', iconSize: [22, 22], iconAnchor: [11, 11],
      html: '<span class="mk mk-ring"><svg width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="4.500"/></svg></span>' });
  }

  /* --------------------------------------------------------------- data */
  var minor = {}, sites = {}, markers = {}, lineLayers = {}, lineBounds = {}, lineKm = {}, selected = null;

  function km(c) {
    var d = 0;
    for (var i = 1; i < c.length; i++) d += map.distance([c[i - 1][1], c[i - 1][0]], [c[i][1], c[i][0]]);
    return d / 1000;
  }

  function ext(href, label) { return '<a href="' + esc(href) + '" target="_blank" rel="noopener">' + label + '</a>'; }
  function lineWiki(id, label) { return ext('https://he.wikipedia.org/wiki/' + encodeURIComponent(LINES[id].wiki.replace(/ /g, '_')), label || 'ויקיפדיה'); }
  /* where a line segment comes from: the OSM way itself, or how it was drawn */
  function segSource(p) {
    var w = lineWiki(p.line, 'ערך המסילה בוויקיפדיה');
    if (p.osm) return ext('https://www.openstreetmap.org/way/' + p.osm, 'קטע המסילה ב-OpenStreetMap');
    if (p.src === 'modern') return 'מסילה מודרנית על התוואי הישן, לפי ' + ext('https://www.openstreetmap.org/#map=14/' + p.at, 'OpenStreetMap') + ' ו' + w;
    if (p.src === 'gap') return 'קטע חיבור משוער בין קטעים ממופים, לפי ' + w;
    return 'שרטוט משוער לפי ' + w;
  }
  function hikeLink(lat, lon) {
    return '<a href="https://mapeak.com/map/16/' + lat + '/' + lon + '" target="_blank" rel="noopener">מפת טיולים</a>';
  }

  Promise.all([fetch('data/lines.geojson').then(function (r) { return r.json(); }),
               fetch('data/sites.geojson').then(function (r) { return r.json(); }),
               fetch('data/minor.geojson').then(function (r) { return r.json(); })])
    .then(function (res) { drawLines(res[0]); drawMinor(res[2]); drawSites(res[1]); buildLists(); zoomed(); route(); })
    .catch(function (e) {
      $('lede').textContent = 'טעינת נתוני המפה נכשלה. אם הקובץ נפתח ישירות מהדיסק, יש להגיש את התיקייה דרך שרת http (למשל: python3 -m http.server).';
      console.error(e);
    });

  function drawLines(gj) {
    gj.features.forEach(function (f) {
      var p = f.properties, ll = f.geometry.coordinates.map(function (c) { return [c[1], c[0]]; });
      var group = lineLayers[p.line] = lineLayers[p.line] || { remains: [], gone: [] };
      lineKm[p.line] = lineKm[p.line] || { remains: 0, gone: 0 };
      lineKm[p.line][p.remains ? 'remains' : 'gone'] += km(f.geometry.coordinates);
      if (p.remains) {
        group.remains.push(L.polyline(ll, { pane: 'remains', interactive: false, className: 'ln-case' }).addTo(map));
        group.remains.push(L.polyline(ll, { pane: 'remains', interactive: false, className: 'ln-rem' }).addTo(map));
      } else {
        group.gone.push(L.polyline(ll, { pane: 'gone', interactive: false, className: 'ln-gone' }).addTo(map));
      }
      var hit = L.polyline(ll, { pane: 'hit', color: '#000', weight: 18, opacity: 0, className: p.remains ? '' : 'gone' }).addTo(map);
      hit.bindTooltip(LINES[p.line].name + (p.remains ? ' – סוללה ששרדה' : ' – תוואי היסטורי, ללא שרידים'), { sticky: true, className: 'tip', direction: 'top', offset: [0, -6] });
      hit.on('click', function (e) {
        L.DomEvent.stopPropagation(e);
        var lat = e.latlng.lat.toFixed(5), lon = e.latlng.lng.toFixed(5);
        var h = p.remains
          ? '<p class="pop-h yes">סוללה או פסים ששרדו</p><p>כאן אפשר לראות בשטח את תוואי ' + esc(LINES[p.line].name) + '.</p>'
          : '<p class="pop-h no">תוואי היסטורי – אין מה לראות</p><p>כאן עברה ' + esc(LINES[p.line].name) + ', אך לא נותרו ממנה שרידים בשטח.</p>';
        h += '<p class="pop-src"><span class="lk-h">מקור:</span> ' + segSource({ line: p.line, osm: p.osm, src: p.src, at: lat + '/' + lon }) + '</p>';
        if (p.remains) h += '<p class="pop-links">' + hikeLink(lat, lon) + '</p>';
        h += '<button type="button" class="pop-more" data-line="' + p.line + '">על ' + esc(LINES[p.line].name) + '</button>';
        L.popup({ className: 'pop', maxWidth: 260, autoPanPadding: [30, 80] }).setLatLng(e.latlng).setContent(h).openOn(map);
      });
      lineBounds[p.line] = (lineBounds[p.line] || L.latLngBounds([])).extend(hit.getBounds());
    });
  }

  function drawSites(gj) {
    gj.features.forEach(function (f) {
      var p = f.properties; p.ll = [f.geometry.coordinates[1], f.geometry.coordinates[0]]; sites[p.id] = p;
      var m = L.marker(p.ll, { icon: icon(p), title: p.name, alt: p.name, keyboard: true, riseOnHover: true, zIndexOffset: p.remains ? 500 : 0 }).addTo(map);
      m.on('click', function () { go('site', p.id, false); });
      markers[p.id] = m;
    });
  }

  /* small remains recorded by Amud Anan hikers: culverts, small bridges, cuttings, lengths of rail */
  function drawMinor(gj) {
    var ic = L.divIcon({ className: 'minor', iconSize: [16, 16], iconAnchor: [8, 8], html: '<span class="mn"></span>' });
    gj.features.forEach(function (f) {
      var p = f.properties; p.ll = [f.geometry.coordinates[1], f.geometry.coordinates[0]]; p.remains = true; p.minor = true; minor[p.id] = p;
      var m = L.marker(p.ll, { icon: ic, title: p.name, alt: p.name, keyboard: false, zIndexOffset: 100 }).addTo(map);
      m.bindTooltip(p.name, { className: 'tip', direction: 'top', offset: [0, -7] });
      m.on('click', function () { go('minor', p.id, false); });
      markers[p.id] = m;
    });
  }

  /* at close zoom every surviving structure carries its name; the vanished ones never do */
  var labelled = null;
  function zoomed() {
    var z = map.getZoom();
    mapEl.style.setProperty('--mk', Math.max(0.55, Math.min(1, 0.55 + (z - 8) * 0.2)).toFixed(2));
    mapEl.classList.toggle('z-far', z < 10); mapEl.classList.toggle('z-mid', z === 14); mapEl.classList.toggle('z-close', z >= 15);
    var want = z >= 11;
    if (want === labelled) return;
    labelled = want;
    Object.keys(sites).forEach(function (id) {
      var p = sites[id], m = markers[id];
      m.unbindTooltip();
      if (p.remains && want) m.bindTooltip(p.name, { permanent: true, className: 'tag', direction: 'bottom', offset: [0, 13] });
      else m.bindTooltip(p.name + (p.remains ? '' : ' – ללא שרידים'), { className: 'tip', direction: 'top', offset: [0, p.remains ? -14 : -8] });
    });
  }
  map.on('zoomend', zoomed);

  function buildLists() {
    var totalKm = 0, n = 0;
    $('line-list').innerHTML = ORDER.map(function (id) {
      var k = lineKm[id] || { remains: 0, gone: 0 }, tot = k.remains + k.gone, pct = tot ? Math.round(100 * k.remains / tot) : 0;
      totalKm += k.remains;
      var meta = k.remains >= 1 ? Math.round(k.remains) + ' מתוך ' + Math.round(tot) + ' ק"מ נראים בשטח' : Math.round(tot) + ' ק"מ, לא נותרו שרידי מסילה';
      return '<li><button type="button" data-line="' + id + '"><span class="ln">' + esc(LINES[id].name) + '</span><span class="ly">' + LINES[id].years + '</span>' +
        '<span class="lm">' + meta + '</span><span class="bar"><i style="width:' + pct + '%"></i></span></button></li>';
    }).join('');
    $('site-list').innerHTML = ORDER.map(function (id) {
      var list = Object.keys(sites).map(function (s) { return sites[s]; }).filter(function (s) { return s.line === id && s.remains; });
      if (!list.length) return '';
      n += list.length;
      return '<p class="group-h">' + esc(LINES[id].name) + '</p>' + list.map(siteBtn).join('');
    }).join('');
    $('n-km').textContent = Math.round(totalKm);
    $('n-sites').textContent = n + Object.keys(minor).length;
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-line],[data-site]'); if (!b) return;
      map.closePopup();
      if (b.dataset.line) go('line', b.dataset.line, true); else go('site', b.dataset.site, true);
    });
  }
  function siteBtn(s) {
    return '<button type="button" class="site-btn' + (s.remains ? '' : ' none') + '" data-site="' + s.id + '"><span class="dot"></span><span class="sn">' + esc(s.name) + '</span><span class="sk">' + KIND[s.kind] + '</span></button>';
  }

  /* ------------------------------------------------------------- detail */
  function siteHTML(s) {
    var lat = s.ll[0].toFixed(5), lon = s.ll[1].toFixed(5), h = '';
    if (s.img) h += '<figure class="photo"><img src="' + esc(s.img) + '" alt="' + esc(s.name) + '" loading="lazy" onerror="this.parentNode.remove()"><figcaption>צילום: <a href="' + esc(s.img_src || s.url) + '" target="_blank" rel="noopener">' + esc(s.img_by || 'עמוד ענן') + '</a></figcaption></figure>';
    h += '<div class="d-pad"><h2>' + esc(s.name) + '</h2>';
    h += '<p class="status ' + (s.remains ? 'yes">יש שרידים בשטח' : 'no">לא נותרו שרידים – אין מה לראות במקום') + '</p>';
    h += '<p class="d-desc">' + esc(s.desc) + '</p>';
    if (s.approx) h += '<p class="d-note">המיקום משוער.</p>';
    if (s.minor) h += '<p class="d-note">תיאור ומיקום מתוך עמוד ענן' + (s.by ? ', תרמו: ' + esc(s.by) : '') + '.</p>';
    h += '<dl class="facts"><dt>מסילה</dt><dd><button type="button" data-line="' + s.line + '">' + esc(LINES[s.line].name) + '</button></dd>' +
         (s.year ? '<dt>נבנה</dt><dd>' + esc(s.year) + '</dd>' : '') + '<dt>סוג</dt><dd>' + KIND[s.kind] + '</dd></dl>';
    h += '<p class="links"><span class="lk-h">מקורות:</span>';
    if (s.wiki) h += ext(s.wiki, 'ויקיפדיה');
    if (s.aa || s.url) h += ext(s.aa || s.url, 'עמוד ענן');
    if (s.osm) h += ext(s.osm, 'OpenStreetMap');
    if (!s.wiki && !s.aa && !s.url && !s.osm) h += lineWiki(s.line, 'ערך המסילה בוויקיפדיה');
    h += '</p><p class="links more">' + hikeLink(lat, lon) + '</p></div>';
    return h;
  }
  function lineHTML(id) {
    var l = LINES[id], k = lineKm[id] || { remains: 0, gone: 0 };
    var all = Object.keys(sites).map(function (s) { return sites[s]; }).filter(function (s) { return s.line === id; });
    var yes = all.filter(function (s) { return s.remains; }), no = all.filter(function (s) { return !s.remains; });
    var h = '<div class="d-pad"><h2>' + esc(l.name) + '</h2>';
    h += '<dl class="facts"><dt>נפתחה</dt><dd>' + l.years + '</dd><dt>רוחב המסילה</dt><dd>' + l.gauge + '</dd>' +
         '<dt>נראה בשטח</dt><dd>' + (k.remains >= 1 ? 'כ-' + Math.round(k.remains) + ' מתוך ' + Math.round(k.remains + k.gone) + ' ק"מ' : 'לא נותרו שרידי מסילה') + '</dd></dl>';
    h += '<p class="d-desc">' + esc(l.text) + '</p>';
    var nm = Object.keys(minor).filter(function (m) { return minor[m].line === id; }).length;
    if (yes.length) h += '<h3>שרידים לביקור</h3>' + yes.map(siteBtn).join('');
    if (nm) h += '<p class="d-note">ועוד ' + nm + ' שרידים קטנים לאורך המסילה (גשרונים, מעבירי מים, מבתרים), מסומנים במפה בנקודות אדומות קטנות.</p>';
    if (no.length) h += '<h3 class="faint">אתרים ידועים ללא שרידים</h3>' + no.map(siteBtn).join('');
    h += '<p class="links"><span class="lk-h">מקורות:</span>' + lineWiki(id) + ext('https://www.openstreetmap.org/copyright', 'OpenStreetMap') + '<a href="about.html">איך נוצרה המפה</a></p>';
    return h + '</div>';
  }

  /* centre a site in the part of the map that is not covered by the panel */
  function focus(ll, zoom, always) {
    var target = ll;
    if (mobile.matches) {
      var h = map.getSize().y, shift = h / 2 - Math.max(110, h * 0.16);
      target = map.unproject(map.project(ll, zoom).add([0, shift]), zoom);
    } else {
      /* desktop: the glass panel covers the right-hand side, so centre in what is left */
      var pt = map.latLngToContainerPoint(ll), sz = map.getSize();
      if (!always && pt.x > 60 && pt.x < sz.x - 440 && pt.y > 60 && pt.y < sz.y - 60) return;
      target = map.unproject(map.project(ll, zoom).add([200, 0]), zoom);
    }
    map.flyTo(target, zoom, { duration: 0.7 });
  }

  function select(id) {
    if (selected && markers[selected]) { markers[selected].getElement().classList.remove('sel'); markers[selected].setZIndexOffset(minor[selected] ? 100 : sites[selected].remains ? 500 : 0); }
    selected = id;
    if (id && markers[id]) { markers[id].getElement().classList.add('sel'); markers[id].setZIndexOffset(2000); }
  }
  function highlight(lineId) {
    ORDER.forEach(function (id) {
      var g = lineLayers[id]; if (!g) return;
      var dim = lineId && id !== lineId;
      g.remains.concat(g.gone).forEach(function (l) {
        if (!l._path) return;
        l._path.classList.toggle('dimmed', !!dim); l._path.classList.toggle('lit', !!lineId && !dim);
      });
    });
  }

  function show(type, id, move) {
    if ((type === 'site' && sites[id]) || (type === 'minor' && minor[id])) {
      var s = sites[id] || minor[id];
      if (!s.remains && $('show-gone').checked === false) { $('show-gone').checked = true; mapEl.classList.remove('hide-gone'); }
      $('detail').innerHTML = siteHTML(s); select(id); highlight(null);
      focus(s.ll, move ? Math.max(map.getZoom(), 16) : map.getZoom(), move);
      $('handle').querySelector('.handle-title').textContent = s.name;
    } else if (type === 'line' && LINES[id]) {
      $('detail').innerHTML = lineHTML(id); select(null); highlight(id);
      if (move && lineBounds[id]) map.flyToBounds(lineBounds[id], Object.assign({ duration: 0.8, maxZoom: 13 }, padding()));
      $('handle').querySelector('.handle-title').textContent = LINES[id].name;
    } else { home(); return; }
    $('view-home').hidden = true; $('view-detail').hidden = false; $('panel-body').scrollTop = 0;
    sheet(type !== 'line' || !mobile.matches ? true : false);
  }
  function home() {
    select(null); highlight(null);
    $('view-detail').hidden = true; $('view-home').hidden = false; $('panel-body').scrollTop = 0;
    $('handle').querySelector('.handle-title').textContent = TITLE;
  }

  /* routing through the URL hash so every site and line has a link */
  var pendingMove = true;
  function go(type, id, move) { pendingMove = move; var h = '#' + type + '=' + id; if (location.hash === h) route(); else location.hash = h; }
  function route() {
    var m = /^#(site|line|minor)=([\w-]+)$/.exec(location.hash);
    if (m) show(m[1], m[2], pendingMove); else home();
    pendingMove = true;
  }
  window.addEventListener('hashchange', route);
  $('back').addEventListener('click', function () { history.pushState(null, '', location.pathname + location.search); home(); if (mobile.matches) sheet(true); });
  map.on('click', function () { if (mobile.matches) sheet(false); });

  /* ------------------------------------------------- mobile bottom sheet */
  /* "how the map was made": the text of about.html, shown as a modal */
  var aboutLoaded = false;
  function openAbout() {
    var dlg = $('about');
    if (!dlg.showModal) { location.href = 'about.html'; return; }
    dlg.showModal(); dlg.scrollTop = 0;
    if (aboutLoaded) return;
    fetch('about.html').then(function (r) { if (!r.ok) throw 0; return r.text(); }).then(function (t) {
      var m = new DOMParser().parseFromString(t, 'text/html').querySelector('main');
      m.querySelectorAll('.home').forEach(function (n) { n.remove(); });
      var h1 = m.querySelector('h1'); if (h1) h1.id = 'about-title';
      $('about-body').innerHTML = m.innerHTML; aboutLoaded = true;
    }).catch(function () { $('about-body').innerHTML = '<p>הטקסט לא נטען. <a href="about.html">לפתיחה בדף נפרד</a></p>'; });
  }
  $('about-btn').addEventListener('click', openAbout);
  $('about-close').addEventListener('click', function () { $('about').close(); });
  $('about').addEventListener('click', function (e) { if (e.target === $('about')) $('about').close(); });
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href="about.html"]');
    if (a && !a.closest('#about')) { e.preventDefault(); openAbout(); }
  });

  function sheet(open) {
    $('panel').classList.toggle('open', open);
    $('handle').setAttribute('aria-expanded', open);
    $('handle-hint').textContent = open ? 'למפה' : ($('view-detail').hidden ? 'למדריך' : 'לפרטים');
  }
  $('handle').addEventListener('click', function () { sheet(!$('panel').classList.contains('open')); });

  /* ------------------------------------------------------------ controls */
  $('show-gone').addEventListener('change', function (e) { mapEl.classList.toggle('hide-gone', !e.target.checked); });

  var here = null;
  $('locate').addEventListener('click', function () { $('locate').classList.add('busy'); map.locate({ setView: false, enableHighAccuracy: true, timeout: 10000 }); });
  map.on('locationfound', function (e) {
    $('locate').classList.remove('busy');
    if (!here) here = L.marker(e.latlng, { icon: L.divIcon({ className: '', html: '<span class="here"></span>', iconSize: [14, 14], iconAnchor: [7, 7] }), interactive: false, zIndexOffset: 3000 }).addTo(map);
    else here.setLatLng(e.latlng);
    map.flyTo(e.latlng, Math.max(map.getZoom(), 12), { duration: 0.8 });
  });
  map.on('locationerror', function () { $('locate').classList.remove('busy'); $('locate').title = 'המיקום אינו זמין'; });
})();
