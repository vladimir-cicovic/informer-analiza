/* Informer.rs: katalog kršenja novinarske etike (verzija za dijeljenje).
   Radi otvaranjem index.html direktno sa diska; podaci se učitavaju kao skripte iz foldera podaci/. */
(function () {
'use strict';
const M = window.P;                      // meta podaci (meta.js)
const CL = [], S = [], CLS = [];         // članci, kršenja, kršenja po članku
// CL[i] = [datum, rubrika, naslov, url]
// S[i]  = [članak, šifra, težina, glas, tip mete, meta (tekst), dokaz, zašto, [mete]]
window.P.dodaj = function (d) {
  const off = CL.length;
  for (const c of d.cl) { CL.push(c); CLS.push([]); }
  for (const s of d.s) { s[0] += off; CLS[s[0]].push(S.length); S.push(s); }
};

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const br = (n) => (n || 0).toLocaleString('sr-Latn');
const pct = (a, b, d = 1) => (b ? (100 * a / b) : 0).toFixed(d).replace('.', ',') + '%';
const MJ = ['', 'jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'avg', 'sep', 'okt', 'nov', 'dec'];
const MJP = ['', 'januar', 'februar', 'mart', 'april', 'maj', 'jun', 'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar'];
const mjKratko = (m) => MJ[+m.slice(5)] + ' ' + m.slice(2, 4);
const mjDugo = (m) => MJP[+m.slice(5)] + ' ' + m.slice(0, 4) + '.';
const datum = (d) => d ? (+d.slice(8, 10)) + '. ' + (+d.slice(5, 7)) + '. ' + d.slice(0, 4) + '.' : '';
const TEZ = { 2: 'srednja', 3: 'ozbiljna' };
const SKRIVEN_NASLOV = 'Naslov nije prikazan radi zaštite maloljetnika';
const SKRIVEN_DOKAZ = 'Dokaz nije prikazan radi zaštite maloljetnika';
const urlClanka = (c) => c[3] ? 'https://informer.rs/' + c[3] : '';
const sifPoKodu = {}; M.sif.forEach((s, i) => { sifPoKodu[s.k] = i; });

/* pretraga: bez dijakritika, ćirilica se prevodi u latinicu */
const CYR = { 'а':'a','б':'b','в':'v','г':'g','д':'d','ђ':'dj','е':'e','ж':'z','з':'z','и':'i','ј':'j','к':'k','л':'l','љ':'lj','м':'m','н':'n','њ':'nj','о':'o','п':'p','р':'r','с':'s','т':'t','ћ':'c','у':'u','ф':'f','х':'h','ц':'c','ч':'c','џ':'dz','ш':'s' };
const norm = (s) => String(s || '').toLowerCase().replace(/[Ѐ-ӿ]/g, (c) => CYR[c] || c)
  .replace(/đ/g, 'dj').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ');
let SX = null;
function indeksPretrage() {
  if (SX) return SX;
  SX = new Array(S.length);
  for (let i = 0; i < S.length; i++) {
    const s = S[i], c = CL[s[0]], sf = M.sif[s[1]];
    SX[i] = norm(c[2] + ' | ' + s[6] + ' | ' + M.ms[s[5]] + ' | ' + sf.k + ' ' + sf.ime + ' | ' + s[7]);
  }
  return SX;
}

/* ---------- učitavanje ---------- */
function ucitaj() {
  let n = 0;
  const sljedeci = () => {
    if (n >= M.mj.length) { $('ucitavanje') && $('ucitavanje').remove(); pocni(); return; }
    const sc = document.createElement('script');
    sc.src = 'podaci/d_' + M.mj[n] + '.js';
    sc.onload = () => { n++; $('traka').style.width = (100 * n / M.mj.length) + '%'; sljedeci(); };
    sc.onerror = () => { $('app').innerHTML = '<p class="prazno">Nije moguće učitati podatke (' + esc(sc.src) + '). Provjerite da je folder „podaci“ pored fajla index.html.</p>'; };
    document.body.appendChild(sc);
  };
  sljedeci();
}

/* ---------- ruter ---------- */
function ruta() {
  const h = location.hash.replace(/^#\/?/, '');
  const [str, q] = h.split('?');
  return { s: str || 'pocetna', p: new URLSearchParams(q || '') };
}
function idi(s, p) { location.hash = '#/' + s + (p && String(p) ? '?' + p : ''); }
function zamijeni(s, p) { history.replaceState(null, '', '#/' + s + (p && String(p) ? '?' + p : '')); }
function pocni() {
  $('period').textContent = M.period;
  $('podnozje').innerHTML = 'Stanje podataka: ' + esc(M.stanje) + ' Pravni osnov označava odredbe koje se odnose na vrstu kršenja; to nije sudski ni regulatorni nalaz. Dokazi su kratki citati (do 12 riječi) radi prepoznavanja mjesta u članku, a cijeli članci su dostupni na izvornim adresama.';
  window.addEventListener('hashchange', prikazi);
  prikazi();
}
function prikazi() {
  zatvori();
  const r = ruta();
  document.querySelectorAll('#nav a').forEach((a) => a.classList.toggle('akt', a.dataset.s === r.s));
  const f = { pocetna, katalog, mete, sifre, metodologija }[r.s] || pocetna;
  f(r.p);
  window.scrollTo(0, 0);
}

/* ---------- početna ---------- */
function pocetna() {
  const n = M.n_korpus;
  let h = `<h1>Kršenja novinarske etike u svim člancima Informera za jednu godinu</h1>
  <p class="lead">Analiziran je svaki od ${br(n)} članaka objavljenih na portalu Informer.rs od ${esc(M.period)} Katalog sadrži svako srednje i ozbiljno kršenje, sa šifrom, kratkim dokazom, objašnjenjem, metom i pravnim osnovom.</p>
  <section class="tiles">
    <div class="tile"><div class="v">${br(n)}</div><div class="l">članaka analizirano</div></div>
    <a class="tile" href="#/katalog"><div class="v">${pct(M.n_cl, n)}</div><div class="l">${br(M.n_cl)} članaka sa srednjim ili ozbiljnim kršenjem</div></a>
    <a class="tile" href="#/katalog?tez=3"><div class="v">${pct(M.n_cl3, n)}</div><div class="l">${br(M.n_cl3)} članaka sa ozbiljnim kršenjem</div></a>
    <a class="tile" href="#/katalog"><div class="v">${br(M.n_s)}</div><div class="l">pojedinačnih kršenja u katalogu</div></a>
    <a class="tile" href="#/mete"><div class="v">${br(M.mete.length)}</div><div class="l">meta: osoba, grupa, medija i institucija</div></a>
  </section>`;
  // rubrike
  const rub = M.rub.map((r, i) => ({ r, n: M.rub_n[i], f: M.rub_f[i], t3: M.rub_3[i] })).filter((x) => x.n).sort((a, b) => b.f / b.n - a.f / a.n);
  const maxR = Math.max(...rub.map((x) => x.f / x.n));
  h += `<div class="grid2"><div class="panel"><h3>Udio članaka sa kršenjem, po rubrici</h3><div class="pod">Klik na rubriku otvara njene slučajeve.</div>`;
  for (const x of rub) {
    const w3 = 100 * (x.t3 / x.n) / maxR, w2 = 100 * ((x.f - x.t3) / x.n) / maxR;
    h += `<a class="hb" href="#/katalog?rub=${encodeURIComponent(x.r)}" title="${esc(x.r)}: ${br(x.f)} od ${br(x.n)} članaka"><span class="ime">${esc(x.r)}</span><span class="bar"><i class="b3" style="width:${w3}%"></i><i class="b2" style="width:${w2}%"></i></span><span class="br">${pct(x.f, x.n)}</span></a>`;
  }
  h += legenda() + `</div>`;
  // mjeseci
  const maxM = Math.max(...M.mj.map((m, i) => M.mj_f[i] / (M.mj_n[i] || 1)));
  h += `<div class="panel"><h3>Udio članaka sa kršenjem, po mjesecu</h3><div class="pod">Oktobar 2025. i oktobar 2026. su djelimični mjeseci.</div><div class="vb">`;
  M.mj.forEach((m, i) => {
    const d = M.mj_n[i] || 1, v3 = 150 * (M.mj_3[i] / d) / maxM, v2 = 150 * ((M.mj_f[i] - M.mj_3[i]) / d) / maxM;
    h += `<a href="#/katalog?mj=${m}" title="${mjDugo(m)}: ${br(M.mj_f[i])} od ${br(M.mj_n[i])} članaka"><span class="pc">${pct(M.mj_f[i], d, 0)}</span><span class="stub"><i class="b3" style="height:${v3}px;display:block"></i><i class="b2" style="height:${v2}px;display:block"></i></span><span class="lbl">${mjKratko(m)}</span></a>`;
  });
  h += `</div>` + legenda() + `</div></div>`;
  // šifre i mete
  const top = M.sif.map((s, i) => ({ s, i })).filter((x) => x.s.cl).sort((a, b) => b.s.cl - a.s.cl).slice(0, 12);
  const maxS = top[0] ? top[0].s.cl : 1;
  h += `<div class="grid2" style="margin-top:16px"><div class="panel"><h3>Najčešća kršenja</h3><div class="pod">Broj članaka u kojima se šifra javlja. <a href="#/sifre">Sve šifre</a></div>`;
  for (const x of top) h += `<a class="hb siroko" href="#/katalog?sif=${x.s.k}"><span class="ime">${x.s.k} ${esc(x.s.ime)}</span><span class="bar"><i class="b2" style="width:${100 * x.s.cl / maxS}%"></i></span><span class="br">${br(x.s.cl)}</span></a>`;
  h += `</div><div class="panel"><h3>Najčešće mete</h3><div class="pod">Broj članaka sa srednjim ili ozbiljnim kršenjem prema meti. <a href="#/mete">Sve mete</a></div>`;
  const maxT = M.mete[0] ? M.mete[0][3] : 1;
  M.mete.slice(0, 12).forEach((t, i) => {
    h += `<a class="hb siroko" href="#/katalog?meta=${i}"><span class="ime">${esc(t[0])}</span><span class="bar"><i class="b3" style="width:${100 * t[4] / t[2] * t[3] / maxT}%"></i><i class="b2" style="width:${100 * (t[3] / maxT) * (1 - t[4] / t[2])}%"></i></span><span class="br">${br(t[3])}</span></a>`;
  });
  h += `</div></div>`;
  $('app').innerHTML = h;
}
const legenda = () => `<div class="leg"><span style="--c:var(--t3)">ozbiljno (3)</span><span style="--c:var(--t2)">srednje (2)</span></div>`;

/* ---------- katalog ---------- */
let LISTA = [], LIM = 50, KP = null;
function katalog(p) {
  KP = p;
  const opt = (v, t, sel) => `<option value="${esc(v)}"${sel ? ' selected' : ''}>${esc(t)}</option>`;
  const osnovne = M.sif.filter((s) => s.s && +s.k.slice(1) <= 29), prosirene = M.sif.filter((s) => s.s && +s.k.slice(1) > 29);
  const so = (arr) => arr.map((s) => opt(s.k, `${s.k} ${s.ime} (${br(s.s)})`, p.get('sif') === s.k)).join('');
  let h = `<h1>Katalog kršenja</h1>
  <p class="lead">Svako srednje i ozbiljno kršenje sa šifrom, dokazom i objašnjenjem. Klik na stavku otvara detalje i link na originalni članak.</p>
  <div class="bar-f"><div class="filters">
    <input type="search" id="fq" placeholder="Pretraga: naslov, dokaz, meta, šifra…" aria-label="Pretraga" value="${esc(p.get('q') || '')}">
    <select id="frub" aria-label="Rubrika">${opt('', 'Sve rubrike')}${M.rub.map((r) => opt(r, r, p.get('rub') === r)).join('')}</select>
    <select id="ftez" aria-label="Težina povrede">${opt('', 'Težina povrede')}${opt('3', 'Ozbiljna (3)', p.get('tez') === '3')}${opt('2', 'Srednja (2)', p.get('tez') === '2')}</select>
    <select id="fsif" aria-label="Šifra">${opt('', 'Sve šifre')}<optgroup label="Osnovne šifre (V01 do V29)">${so(osnovne)}</optgroup><optgroup label="Proširene šifre">${so(prosirene)}</optgroup></select>
    <select id="fmj" aria-label="Mjesec">${opt('', 'Svi mjeseci')}${M.mj.map((m) => opt(m, mjDugo(m), p.get('mj') === m)).join('')}</select>
    <select id="fglas" aria-label="Glas">${opt('', 'Svaki glas')}${M.glas.map((g, i) => opt(i, g[0].toUpperCase() + g.slice(1), p.get('glas') === String(i))).join('')}</select>
    <select id="ftip" aria-label="Vrsta mete">${opt('', 'Sve vrste meta')}${M.tip.map((t, i) => opt(i, t, p.get('tip') === String(i))).join('')}</select>
  </div>
  <div class="red2"><span class="count" id="cnt"></span><span id="chipm"></span>
    <select id="fsort" aria-label="Redoslijed">${opt('novo', 'Najnovije prvo', p.get('sort') === 'novo')}${opt('staro', 'Najstarije prvo', p.get('sort') === 'staro')}${opt('tez', 'Najteže prvo', p.get('sort') === 'tez')}</select>
    <button id="fcsv" title="Preuzmi filtrirane slučajeve kao tabelu (CSV)">Izvezi CSV</button>
    <button id="freset">Poništi</button></div></div>
  <div class="cases" id="cases"></div><button class="vise" id="vise">Prikaži još</button>`;
  $('app').innerHTML = h;
  let tm = null;
  $('fq').addEventListener('input', () => { clearTimeout(tm); tm = setTimeout(promjena, 220); });
  ['frub', 'ftez', 'fsif', 'fmj', 'fglas', 'ftip', 'fsort'].forEach((id) => $(id).addEventListener('change', promjena));
  $('freset').onclick = () => idi('katalog');
  $('fcsv').onclick = csv;
  $('vise').onclick = () => { LIM += 50; crtaj(); };
  $('cases').addEventListener('click', (e) => { const a = e.target.closest('.case'); if (a) otvori(+a.dataset.i); });
  $('cases').addEventListener('keydown', (e) => { if (e.key === 'Enter') { const a = e.target.closest('.case'); if (a) otvori(+a.dataset.i); } });
  filtriraj();
}
function promjena() {
  const p = new URLSearchParams();
  const set = (k, v) => { if (v) p.set(k, v); };
  set('q', $('fq').value.trim()); set('rub', $('frub').value); set('tez', $('ftez').value); set('sif', $('fsif').value);
  set('mj', $('fmj').value); set('glas', $('fglas').value); set('tip', $('ftip').value);
  if (KP.get('meta')) p.set('meta', KP.get('meta'));
  if ($('fsort').value !== 'novo') p.set('sort', $('fsort').value);
  KP = p; zamijeni('katalog', p); filtriraj();
}
function filtriraj() {
  const p = KP;
  const q = norm(p.get('q') || '').trim(), rub = p.get('rub') ? M.rub.indexOf(p.get('rub')) : -1;
  const tez = +p.get('tez') || 0, sif = p.get('sif') ? sifPoKodu[p.get('sif')] : -1, mj = p.get('mj') || '';
  const glas = p.get('glas') !== null && p.get('glas') !== '' ? +p.get('glas') : -1;
  const tip = p.get('tip') !== null && p.get('tip') !== '' ? +p.get('tip') : -1;
  const meta = p.get('meta') !== null && p.get('meta') !== '' ? +p.get('meta') : -1;
  const rijeci = q ? q.split(' ').filter(Boolean) : [];
  const X = rijeci.length ? indeksPretrage() : null;
  const out = [];
  for (let i = 0; i < S.length; i++) {
    const s = S[i], c = CL[s[0]];
    if (rub >= 0 && c[1] !== rub) continue;
    if (tez && s[2] !== tez) continue;
    if (sif !== undefined && sif >= 0 && s[1] !== sif) continue;
    if (mj && c[0].slice(0, 7) !== mj) continue;
    if (glas >= 0 && s[3] !== glas) continue;
    if (tip >= 0 && s[4] !== tip) continue;
    if (meta >= 0 && s[8].indexOf(meta) < 0) continue;
    if (X && !rijeci.every((w) => X[i].indexOf(w) >= 0)) continue;
    out.push(i);
  }
  const sort = p.get('sort') || 'novo';
  if (sort === 'novo') out.reverse();
  else if (sort === 'tez') { out.reverse(); out.sort((a, b) => S[b][2] - S[a][2]); }
  LISTA = out; LIM = 50;
  $('chipm').innerHTML = meta >= 0 && M.mete[meta] ? `<span class="chip">Meta: <b>${esc(M.mete[meta][0])}</b><button aria-label="Ukloni filter mete" id="chipx">×</button></span>` : '';
  if ($('chipx')) $('chipx').onclick = () => { KP.delete('meta'); zamijeni('katalog', KP); filtriraj(); };
  crtaj();
}
function crtaj() {
  const n = LISTA.length;
  $('cnt').textContent = br(n) + (n === 1 ? ' kršenje' : ' kršenja') + ' u ' + br(new Set(LISTA.map((i) => S[i][0])).size) + ' članaka';
  $('cases').innerHTML = n ? LISTA.slice(0, LIM).map(kartica).join('') : '<div class="prazno">Nema slučajeva za izabrane filtere.</div>';
  $('vise').style.display = n > LIM ? '' : 'none';
  $('vise').textContent = 'Prikaži još (' + br(Math.min(50, n - LIM)) + ' od preostalih ' + br(Math.max(0, n - LIM)) + ')';
}
function kartica(i) {
  const s = S[i], c = CL[s[0]], sf = M.sif[s[1]], ms = M.ms[s[5]];
  return `<article class="case" tabindex="0" data-i="${i}">
    <div class="meta-red"><span>${datum(c[0])}</span><span class="pill">${esc(M.rub[c[1]])}</span><span class="pill k">${sf.k}</span>
      <span class="pill t${s[2]}">težina ${s[2]}</span><span class="pill hide-m">${esc(M.glas[s[3]])}</span></div>
    <h3${c[2] ? '' : ' class="skriven"'}>${esc(c[2] || SKRIVEN_NASLOV)}</h3>
    <p><span class="lab">Kršenje</span>${esc(sf.ime)}</p>
    ${s[6] ? `<p><span class="lab">Dokaz</span><span class="dokaz">„${esc(s[6])}“</span></p>` : ''}
    ${s[7] ? `<p><span class="lab">Zašto</span>${esc(s[7])}</p>` : ''}
    ${ms ? `<p><span class="lab">Meta</span>${esc(ms)}</p>` : ''}
  </article>`;
}
function csv() {
  const red = (a) => a.map((x) => '"' + String(x == null ? '' : x).replace(/"/g, '""') + '"').join(';');
  const L = [red(['Datum', 'Rubrika', 'Šifra', 'Kršenje', 'Težina', 'Glas', 'Vrsta mete', 'Meta', 'Naslov', 'Dokaz', 'Zašto', 'Link'])];
  for (const i of LISTA) {
    const s = S[i], c = CL[s[0]], sf = M.sif[s[1]];
    L.push(red([c[0], M.rub[c[1]], sf.k, sf.ime, s[2], M.glas[s[3]], M.tip[s[4]], M.ms[s[5]], c[2] || SKRIVEN_NASLOV, s[6] || (c[2] ? '' : SKRIVEN_DOKAZ), s[7], urlClanka(c)]));
  }
  const b = new Blob(['﻿' + L.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'informer_krsenja.csv';
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

/* ---------- detalji slučaja ---------- */
let OTV = -1;
function osnovHTML(sf) {
  const d = [];
  if (sf.zakoni.length) d.push(esc(sf.zakoni.join('; ')));
  if (sf.kodeks.length) d.push('Kodeks novinara i novinarki Srbije: ' + esc(sf.kodeks.join('; ')));
  return d.length ? d.join('<br>') : '<span class="mut">Pravni osnov za ovu šifru još nije mapiran.</span>';
}
function otvori(i) {
  OTV = i;
  const s = S[i], c = CL[s[0]], sf = M.sif[s[1]], ms = M.ms[s[5]];
  const poz = LISTA.indexOf(i);
  const drugi = CLS[s[0]].filter((j) => j !== i);
  const meteLinkovi = s[8].map((m) => `<a href="#/katalog?meta=${m}">${esc(M.mete[m][0])}</a>`).join(', ');
  $('modal').innerHTML = `
    <div class="mhead"><span class="pill k">${sf.k}</span><span class="pill t${s[2]}">težina ${s[2]}: ${TEZ[s[2]]}</span>
      <span class="pill">${esc(M.rub[c[1]])}</span><span class="mut sm">${datum(c[0])}</span>
      ${poz >= 0 ? `<button id="mprev" aria-label="Prethodni slučaj"${poz > 0 ? '' : ' disabled'}>‹</button><button id="mnext" aria-label="Sljedeći slučaj"${poz < LISTA.length - 1 ? '' : ' disabled'}>›</button>` : ''}
      <button class="x" id="mx" aria-label="Zatvori">×</button></div>
    <div class="mbody">
      <h2${c[2] ? '' : ' class="skriven"'}>${esc(c[2] || SKRIVEN_NASLOV)}</h2>
      <div class="nalaz">
        <div class="l">Kršenje</div><div><b>${sf.k}</b> ${esc(sf.ime)}<div class="mut sm">${esc(sf.opis)}</div></div>
        <div class="l">Dokaz</div><div>${s[6] ? `<span class="dokaz">„${esc(s[6])}“</span>` : `<span class="mut">${c[2] ? 'Nije naveden.' : SKRIVEN_DOKAZ}</span>`}</div>
        ${s[7] ? `<div class="l">Zašto</div><div>${esc(s[7])}</div>` : ''}
        <div class="l">Meta</div><div>${ms ? esc(ms) : '<span class="mut">bez imenovane mete</span>'} <span class="mut sm">(${esc(M.tip[s[4]])})</span></div>
        <div class="l">Glas</div><div>${esc(M.glas[s[3]])}</div>
        <div class="l">Pravni osnov</div><div class="sm">${osnovHTML(sf)}</div>
      </div>
      ${drugi.length ? `<div class="ostali"><b>Ostala kršenja u istom članku (${drugi.length})</b>${drugi.map((j) => `<a href="#" data-j="${j}">${M.sif[S[j][1]].k} ${esc(M.sif[S[j][1]].ime)}, težina ${S[j][2]}</a>`).join('')}</div>` : ''}
      <div class="akcije">${urlClanka(c) ? `<a class="btn" href="${esc(urlClanka(c))}" target="_blank" rel="noopener noreferrer">Otvori članak na informer.rs</a>` : ''}
        ${s[8].length ? `<span class="sm mut" style="align-self:center">Svi slučajevi za: ${meteLinkovi}</span>` : ''}
        <button id="mprint">Štampaj</button></div>
    </div>`;
  $('ovl').classList.add('open'); $('ovl').scrollTop = 0;
  $('mx').onclick = zatvori; $('mprint').onclick = () => window.print();
  if ($('mprev')) { $('mprev').onclick = () => korak(-1); $('mnext').onclick = () => korak(1); }
  $('modal').querySelectorAll('.ostali a').forEach((a) => a.onclick = (e) => { e.preventDefault(); otvori(+a.dataset.j); });
  $('modal').querySelectorAll('.akcije a[href^="#"]').forEach((a) => a.addEventListener('click', zatvori));
  $('mx').focus();
}
function korak(d) { const poz = LISTA.indexOf(OTV); if (poz >= 0 && LISTA[poz + d] !== undefined) otvori(LISTA[poz + d]); }
function zatvori() { if ($('ovl')) $('ovl').classList.remove('open'); OTV = -1; }
$('ovl').addEventListener('click', (e) => { if (e.target === $('ovl')) zatvori(); });
document.addEventListener('keydown', (e) => {
  if (OTV < 0) return;
  if (e.key === 'Escape') zatvori();
  else if (e.key === 'ArrowLeft') korak(-1);
  else if (e.key === 'ArrowRight') korak(1);
});

/* ---------- mete ---------- */
let ML = [], MLIM = 100;
function mete(p) {
  const brTip = M.tip.map(() => 0); M.mete.forEach((t) => brTip[t[1]]++);
  $('app').innerHTML = `<h1>Mete</h1>
  <p class="lead">Osobe, grupe, mediji, države i institucije prema kojima je bilo usmjereno bar jedno srednje ili ozbiljno kršenje, sa brojem članaka i najčešćim vrstama kršenja. Klik na red otvara sve slučajeve za tu metu.</p>
  <div class="note">Privatna lica, žrtve i maloljetnici su u analizi označeni samo inicijalima i ne izdvajaju se u ovaj spisak, jer inicijali ne identifikuju osobu i mogu pripadati različitim ljudima. Njihovi slučajevi se nalaze u katalogu.</div>
  <div class="bar-f"><div class="filters">
    <input type="search" id="mq" placeholder="Pretraga po imenu…" aria-label="Pretraga po imenu" value="${esc(p.get('q') || '')}">
    <select id="mtip" aria-label="Vrsta mete"><option value="">Sve vrste meta</option>${M.tip.map((t, i) => brTip[i] ? `<option value="${i}"${p.get('tip') === String(i) ? ' selected' : ''}>${esc(t)} (${br(brTip[i])})</option>` : '').join('')}</select>
    <select id="msort" aria-label="Redoslijed"><option value="cl">Po broju članaka</option><option value="t3"${p.get('sort') === 't3' ? ' selected' : ''}>Po broju ozbiljnih kršenja</option><option value="abc"${p.get('sort') === 'abc' ? ' selected' : ''}>Abecedno</option></select>
  </div><div class="red2"><span class="count" id="mcnt"></span></div></div>
  <table class="tab"><thead><tr><th>Meta</th><th class="hide-m">Vrsta</th><th style="text-align:right">Članaka</th><th style="text-align:right" class="hide-m">Kršenja</th><th style="text-align:right">Ozbiljnih</th><th class="hide-m">Najčešća kršenja</th><th class="hide-m">Period</th></tr></thead><tbody id="mbody"></tbody></table>
  <button class="vise" id="mvise">Prikaži još</button>`;
  let tm = null;
  const prom = () => {
    const q = new URLSearchParams();
    if ($('mq').value.trim()) q.set('q', $('mq').value.trim()); if ($('mtip').value) q.set('tip', $('mtip').value); if ($('msort').value !== 'cl') q.set('sort', $('msort').value);
    zamijeni('mete', q); mfilt();
  };
  $('mq').addEventListener('input', () => { clearTimeout(tm); tm = setTimeout(prom, 180); });
  $('mtip').addEventListener('change', prom); $('msort').addEventListener('change', prom);
  $('mvise').onclick = () => { MLIM += 100; mcrtaj(); };
  $('mbody').addEventListener('click', (e) => { const r = e.target.closest('tr[data-m]'); if (r) idi('katalog', 'meta=' + r.dataset.m); });
  mfilt();
}
function mfilt() {
  const q = norm($('mq').value).trim(), tip = $('mtip').value === '' ? -1 : +$('mtip').value, so = $('msort').value;
  ML = [];
  M.mete.forEach((t, i) => { if ((tip < 0 || t[1] === tip) && (!q || norm(t[0]).indexOf(q) >= 0)) ML.push(i); });
  if (so === 't3') ML.sort((a, b) => M.mete[b][4] - M.mete[a][4] || M.mete[b][3] - M.mete[a][3]);
  else if (so === 'abc') ML.sort((a, b) => M.mete[a][0].localeCompare(M.mete[b][0], 'sr'));
  MLIM = 100; mcrtaj();
}
function mcrtaj() {
  $('mcnt').textContent = br(ML.length) + ' meta';
  $('mbody').innerHTML = ML.slice(0, MLIM).map((i) => {
    const t = M.mete[i];
    const per = t[6] === t[7] ? datum(t[6]) : datum(t[6]) + ' do ' + datum(t[7]);
    return `<tr class="kl" data-m="${i}" title="Otvori slučajeve"><td class="ime">${esc(t[0])}</td><td class="hide-m mut">${esc(M.tip[t[1]])}</td><td class="n">${br(t[3])}</td><td class="n hide-m">${br(t[2])}</td><td class="n">${br(t[4])}</td>
      <td class="hide-m sm">${t[5].map((k) => esc(M.sif[k].k + ' ' + M.sif[k].ime)).join('<br>')}</td><td class="hide-m sm mut">${per}</td></tr>`;
  }).join('') || '<tr><td colspan="7" class="prazno">Nema meta za izabrani filter.</td></tr>';
  $('mvise').style.display = ML.length > MLIM ? '' : 'none';
}

/* ---------- šifre ---------- */
function sifre(p) {
  const so = p.get('sort') || 'cl';
  const lista = M.sif.map((s, i) => i).sort(so === 'kod' ? ((a, b) => a - b) : ((a, b) => M.sif[b].cl - M.sif[a].cl || a - b));
  let h = `<h1>Šifre kršenja</h1>
  <p class="lead">Kodna shema sa ${M.sif.length} šifara. Za svaku šifru: opis, broj članaka i kršenja u ovoj godini, i odredbe koje se na tu vrstu kršenja odnose.</p>
  <div class="note sm">Skraćenice: ZJIM Zakon o javnom informisanju i medijima; ZEM Zakon o elektronskim medijima; REM-P Pravilnik Regulatornog tijela za elektronske medije o zaštiti ljudskih prava; KZ Krivični zakonik; ZKP Zakonik o krivičnom postupku; ZOO Zakon o obligacionim odnosima; ZZPL Zakon o zaštiti podataka o ličnosti; ZZD Zakon o zabrani diskriminacije; ZRR Zakon o rodnoj ravnopravnosti; Kodeks: Kodeks novinara i novinarki Srbije. Mapiranje pokazuje koje se odredbe tiču nalaza; ono nije sudski ni regulatorni nalaz.</div>
  <div class="red2"><span class="count"></span><select id="ssort" aria-label="Redoslijed"><option value="cl">Po broju članaka</option><option value="kod"${so === 'kod' ? ' selected' : ''}>Po šifri</option></select></div>`;
  for (const i of lista) {
    const s = M.sif[i];
    h += `<div class="sif" id="${s.k}"><div class="gl"><span class="kod">${s.k}</span><span class="im">${esc(s.ime)}</span>
      <span class="br">${br(s.cl)} članaka, ${br(s.s)} kršenja, ${br(s.t3)} ozbiljnih</span></div>
      <p>${esc(s.opis)}</p>
      ${s.od_a5 ? '<p class="sm mut">Šifra je uvedena tokom analize i primijenjena na rubrike Društvo, Magazin, Sport, Exatlon i TV; u ostalim rubrikama takvi slučajevi su označeni srodnim šiframa.</p>' : ''}
      <p class="osn"><span class="lab">Pravni osnov</span>${osnovHTML(s)}</p>
      ${s.s ? `<p class="sm"><a href="#/katalog?sif=${s.k}">Pogledaj ${br(s.s)} ${s.s === 1 ? 'slučaj' : 'slučajeva'}</a></p>` : '<p class="sm mut">Nema slučajeva težine 2 ili 3.</p>'}</div>`;
  }
  $('app').innerHTML = h;
  $('ssort').onchange = () => idi('sifre', $('ssort').value === 'kod' ? 'sort=kod' : '');
}

/* ---------- metodologija ---------- */
function metodologija() {
  const pA = pct(M.n_cl, M.n_korpus), p3 = pct(M.n_cl3, M.n_korpus);
  $('app').innerHTML = `<div class="tekst"><h1>Metodologija</h1>
  <h2>Obuhvat</h2>
  <p>Analizirani su svi članci objavljeni na portalu Informer.rs od ${esc(M.period)}, ukupno ${br(M.n_korpus)} članaka iz deset rubrika: Politika, Hronika, Planeta, Džet-set, Zabava, Društvo, Magazin, Sport, Exatlon i TV. Nije korišten uzorak, pa nema greške uzorkovanja.</p>
  <h2>Kako je ocijenjen članak</h2>
  <p>Svaki članak je analiziran i ocijenjen prema kodnoj shemi sa ${M.sif.length} šifara kršenja (pregled na stranici <a href="#/sifre">Šifre</a>). Za svako uočeno kršenje zabilježeni su:</p>
  <ul>
    <li><b>šifra</b> kršenja;</li>
    <li><b>težina povrede</b>: 1 blaga, 2 srednja, 3 ozbiljna;</li>
    <li><b>dokaz</b>: doslovan izvod iz članka, da se mjesto može provjeriti;</li>
    <li><b>objašnjenje</b> zašto je to kršenje;</li>
    <li><b>meta</b>: osoba, grupa ili institucija prema kojoj je kršenje usmjereno, i njena vrsta;</li>
    <li><b>glas</b>: da li problem dolazi od same redakcije (tekst ili naslov) ili iz citata, i da li redakcija citat pojačava naslovom ili opremom.</li>
  </ul>
  <p>Katalog prikazuje samo kršenja težine 2 i 3. Blaga kršenja (težina 1) se u katalogu ne navode.</p>
  <h2>Provjera nalaza</h2>
  <p>Ozbiljni i osjetljivi nalazi prošli su drugu, nezavisnu provjeru, u kojoj je svaki nalaz potvrđen, izmijenjen ili odbačen; propušteni nalazi su dodati. Za rubrike Društvo, Magazin, Sport, Exatlon i TV, gdje je kršenja znatno manje, primijenjen je skraćeni postupak sa drugim krugom provjere za sumnjive članke. Na kontrolnom skupu ocjena članka se sa punim postupkom slaže umjereno (kapa oko 0,73), a razlike su najčešće između ocjene 0 i 1.</p>
  <h2>Glavni rezultati</h2>
  <p>Srednje ili ozbiljno kršenje ima ${br(M.n_cl)} članaka (${pA}), a ozbiljno ${br(M.n_cl3)} (${p3}). Ukupno je zabilježeno ${br(M.n_s)} pojedinačnih kršenja težine 2 ili 3.</p>
  <h2>Pravni osnov</h2>
  <p>Svaka šifra je povezana sa odredbama koje se na tu vrstu kršenja odnose: Zakon o javnom informisanju i medijima, Zakon o elektronskim medijima (za Informer TV), Krivični zakonik, Zakon o obligacionim odnosima, pravilnici Regulatornog tijela za elektronske medije i Kodeks novinara i novinarki Srbije. To mapiranje pokazuje koje se odredbe tiču nalaza; ono nije pravni nalaz da je zakon prekršen, što može utvrditi samo sud ili regulator. Gdje je primjena odredbe još u provjeri, to je navedeno. Za dio šifara pravni osnov još nije mapiran.</p>
  <h2>Pravila ove verzije</h2>
  <ul>
    <li>Tekst članaka nije prenesen; svaki slučaj ima link na originalni članak.</li>
    <li>Dokaz je kratak citat, najviše 12 riječi.</li>
    <li>Javne ličnosti, mediji, organizacije i institucije navedeni su punim imenom, kako se javljaju u člancima.</li>
    <li>Privatna lica, žrtve i maloljetnici označeni su samo inicijalima.</li>
  </ul>
  <h2>Ograničenja</h2>
  <ul>
    <li>Ocjena kršenja uključuje procjenu; pojedinačni slučajevi mogu sadržati greške, iako je ukupna slika stabilna.</li>
    <li>Šifre V78, V79 i V80 (transfobija, trivijalizacija nasilja, romantizacija seksualnog kontakta sa maloljetnikom) uvedene su tokom analize i primijenjene na rubrike Društvo, Magazin, Sport, Exatlon i TV. U ostalim rubrikama takvi slučajevi su označeni srodnim šiframa.</li>
    <li>Imena meta su spojena kada se ista osoba javlja u više oblika (na primjer samo prezime i puno ime). Manja odstupanja u spajanju su moguća.</li>
  </ul></div>`;
}

ucitaj();
})();
