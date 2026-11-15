/* ManCalc — Manual sight reduction worksheet for Sextant Trainer and Navigator.
 * Loads as a classic script after the main app script. Uses the app's globals
 * (S, ap, body, md, fmt, fmtHs, reduce, show, save, render, updateLevelUI, R, $)
 * but does not modify their behaviour except by wrapping reduce, show, and
 * updateLevelUI, and the saveBtn click handler.
 */
(function () {
'use strict';

document.addEventListener('DOMContentLoaded', install);

function install() {
  if (typeof S === 'undefined' || typeof reduce !== 'function') {
    console.warn('ManCalc: app globals not ready, skipping install');
    return;
  }

  const LIFE_H = 15;
  const isActive = s => !!s.on && (Date.now() - s.t) / 3600000 < LIFE_H;

  // ---------- sheet state ----------
  function blankSheet() {
    return { altCorr:null, addlAtm:null, addlMV:null,
             ghaTab:null, ghaInc:null, sha:null,
             decTab:null, dFactor:null,
             hcTab:null, dTab:null, Z:null, sameContrary:null,
             ticks:{}, edited:{}, detached:{} };
  }
  function getSheet(s) {
    if (!s.mancalc) s.mancalc = blankSheet();
    return s.mancalc;
  }

  // ---------- computation ----------
  function computeM(s) {
    const sh = getSheet(s);
    const st = S.set;
    const ic = sh.detached.IC ? (sh.IC ?? 0) : (s.ie ?? st.ie ?? 0);
    const eye = s.eye ?? st.eye ?? 0;
    const dip = (s.bubble || !eye) ? 0 : -1.76 * Math.sqrt(eye);
    const ha = s.hs + ic/60 + dip/60;

    const altCorr = sh.altCorr ?? 0;
    const addlAtm = sh.addlAtm ?? 0;
    const addlMV  = sh.addlMV  ?? 0;
    const ho = ha + (altCorr + addlAtm + addlMV)/60;

    const ghaTab = sh.ghaTab ?? 0;
    const ghaInc = sh.ghaInc ?? 0;
    const sha    = sh.sha    ?? 0;
    const ghaTotal = md(ghaTab + ghaInc + sha);

    const p = ap();
    const apLat = s.apLat ?? (p ? p.lat : 0);
    const apLon = s.apLon ?? (p ? p.lon : 0);
    const lha = md(ghaTotal + apLon);

    const decTab  = sh.decTab  ?? 0;
    const dFactor = sh.dFactor ?? 0;
    const utcMin = new Date(s.t).getUTCMinutes() + new Date(s.t).getUTCSeconds()/60;
    const dCorr  = dFactor * (utcMin/60) * Math.sign(decTab || 1);
    const decTot = decTab + dCorr;

    const derivedSC = (Math.sign(decTot || 1) === Math.sign(apLat || 1)) ? 'Same' : 'Contrary';
    const sameContrary = sh.sameContrary ?? derivedSC;
    const scOk = sh.sameContrary == null || sh.sameContrary === derivedSC;

    const decMinAbs = (Math.abs(decTot) * 60) % 60;
    const decInc = ((sh.dTab ?? 0) * decMinAbs) / 60;

    const hc = (sh.hcTab ?? 0) + decInc;
    const larger = Math.max(ho, hc);
    const smaller = Math.min(ho, hc);
    const intercept = Math.abs(ho - hc);
    const dir = intercept < 0.05 ? '—' : (ho > hc ? 'T' : 'A');

    const Z = sh.Z ?? 0;
    const lha180 = lha > 180;
    let zn;
    if (apLat >= 0) zn = lha180 ? Z : md(360 - Z);
    else            zn = lha180 ? md(180 - Z) : md(180 + Z);

    return { ic, dip, ha, ho, ghaTotal, lha, dCorr, decTot, decMinAbs, decInc,
             hc, larger, smaller, intercept, dir, Z, zn,
             apLat, apLon, sameContrary, derivedSC, scOk };
  }

  function isComplete(s) {
    const sh = getSheet(s);
    if (sh.altCorr == null) return false;
    if (s.body === 'Moon' && sh.addlMV == null) return false;
    if (sh.ghaTab == null || sh.ghaInc == null) return false;
    if (s.body !== 'Sun' && sh.sha == null) return false;
    if (sh.decTab == null || sh.dFactor == null) return false;
    if (sh.hcTab == null || sh.dTab == null) return false;
    if (sh.Z == null) return false;
    if (sh.sameContrary != null && !computeM(s).scOk) return false;
    return true;
  }

  // ---------- auto-fill ----------
  function autoFill(s, rowId) {
    const st = S.set;
    if (rowId === 'addlAtm') return 0;
    if (rowId === 'addlMV')  return s.body === 'Moon' ? -0.8 : 0;
    if (rowId === 'sha')     return s.body === 'Sun' ? 0 : 0;

    const b = body(s.body, s.t);
    if (!b) return null;

    if (rowId === 'altCorr') {
      const ha = s.hs + (s.ie ?? st.ie ?? 0)/60
               + ((s.bubble || !s.eye) ? 0 : -1.76 * Math.sqrt(s.eye))/60;
      const sd = b.sd ?? 0;
      if (ha > 89.5) return -(sd * (s.limb === 'U' ? 1 : -1));
      const rf = 1.0 / Math.tan((ha + 7.31/(ha + 4.4)) * R);
      let sdCorr = 0, pa = 0;
      if (b.sun)        { sdCorr = (s.limb === 'U' ? -1 : 1) * sd; pa = (b.hp ?? 0.145) * Math.cos(ha*R); }
      else if (b.moon)  { sdCorr = (s.limb === 'U' ? -1 : 1) * sd; pa = (sd/0.2725) * Math.cos(ha*R); }
      else if (b.planet){ pa = (b.hp ?? 0) * Math.cos(ha*R); }
      return -rf + sdCorr + pa;
    }

    const dt = new Date(s.t);
    const hourMs = s.t - (dt.getUTCMinutes()*60 + dt.getUTCSeconds())*1000;

    if (rowId === 'ghaTab') { const b2 = body(s.body, hourMs); return b2 ? b2.gha : null; }
    if (rowId === 'ghaInc') { const b2 = body(s.body, hourMs); return b2 ? md(b.gha - b2.gha) : null; }
    if (rowId === 'decTab') { const b2 = body(s.body, hourMs); return b2 ? b2.dec : null; }
    if (rowId === 'dFactor') {
      const b1 = body(s.body, hourMs), b2 = body(s.body, hourMs + 3600000);
      return (b1 && b2) ? (b2.dec - b1.dec) : null;
    }

    if (rowId === 'hcTab' || rowId === 'dTab' || rowId === 'Z') {
      const p = ap();
      const apLat = s.apLat ?? (p ? p.lat : 0);
      const apLon = s.apLon ?? (p ? p.lon : 0);
      const lhaW = Math.round(md(b.gha + apLon));
      const latW = Math.round(apLat);
      const decW = Math.round(b.dec);
      const one = (dec) => {
        const pR = latW*R, dR = dec*R, lR = lhaW*R;
        const sh = Math.sin(pR)*Math.sin(dR) + Math.cos(pR)*Math.cos(dR)*Math.cos(lR);
        const hc = Math.asin(sh)/R;
        const A = Math.acos(Math.max(-1, Math.min(1,
          (Math.sin(dR) - Math.sin(pR)*sh)/(Math.cos(pR)*Math.cos(hc*R)))))/R;
        return { hc, zn: Math.sin(lR) > 0 ? 360 - A : A };
      };
      const h1 = one(decW), h2 = one(decW + 1);
      if (rowId === 'hcTab') return h1.hc;
      if (rowId === 'dTab')  return h2.hc - h1.hc;
      if (rowId === 'Z')     return h1.zn;
    }
    return null;
  }

  // ---------- DOM helper ----------
  const el = (tag, attrs, ...kids) => {
    const n = document.createElement(tag);
    if (attrs) for (const [k,v] of Object.entries(attrs)) {
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k === 'style') n.setAttribute('style', v);
      else if (k.startsWith('on') && typeof v === 'function') n[k.toLowerCase()] = v;
      else n.setAttribute(k, v);
    }
    for (const c of kids) if (c != null) n.append(c);
    return n;
  };

  // ---------- views ----------
  let mcView = 'list';
  let mcOpenId = null;
  let mcBatchSection = 'III';

  function renderMancalc() {
    const root = document.getElementById('mancalcRoot');
    if (!root) return;
    root.innerHTML = '';

    const tabList = el('div', { class: 'mc-tabs' });
    ['list', 'batch'].forEach(v => {
      const b = el('button', {
        class: 'mc-tab',
        'aria-selected': mcView === v ? 'true' : 'false',
        text: v === 'list' ? 'List' : 'Batch',
        onClick: () => { mcView = v; renderMancalc(); }
      });
      tabList.append(b);
    });
    root.append(tabList);

    if (mcView === 'list') renderList(root);
    else if (mcView === 'sheet' && mcOpenId != null) renderSheet(root);
    else if (mcView === 'batch') renderBatch(root);
  }

  function renderList(root) {
    const active = S.sights.filter(isActive);
    if (!active.length) {
      root.append(el('div', { class: 'mc-empty',
        text: 'No ticked sightings within the last 15 hours. Tick a sighting on the Sights tab.' }));
      return;
    }
    const card = el('div', { class: 'card' });
    card.append(el('b', { text: active.length + ' sheet' + (active.length === 1 ? '' : 's') }));
    active.forEach(s => {
      const done = isComplete(s);
      const row = el('div', {
        class: 'mc-listrow',
        onClick: () => { mcOpenId = s.t; mcView = 'sheet'; renderMancalc(); }
      },
        el('b', { text: s.body + (s.limb ? ' (' + s.limb + ')' : '') }),
        el('span', { class: 'mc-utc', text: new Date(s.t).toISOString().slice(11,19) }),
        el('span', { class: 'mc-state mc-state--' + (done ? 'done' : 'open'),
                     text: done ? '✓ complete' : '○ open' }),
        el('span', { text: '›' })
      );
      card.append(row);
    });
    root.append(card);
  }

  function renderSheet(root) {
    const s = S.sights.find(x => x.t === mcOpenId);
    if (!s) { mcView = 'list'; return renderList(root); }
    const sh = getSheet(s);
    const c = computeM(s);

    const header = el('div', { class: 'card',
      style: 'display:flex;justify-content:space-between;align-items:center;gap:8px' },
      el('button', { class: 'sm',
        onClick: () => { mcView = 'list'; renderMancalc(); } }, '← List'),
      el('b', { text: s.body + (s.limb ? ' (' + s.limb + ')' : '') + ' · ' +
                new Date(s.t).toISOString().slice(11,19) + 'Z' }),
      el('button', { class: 'sm',
        onClick: () => {
          document.body.classList.add('mc-print-blank');
          setTimeout(() => {
            window.print();
            document.body.classList.remove('mc-print-blank');
          }, 50);
        } }, 'Print blank')
    );
    root.append(header);

    const row = (opts) => {
      const { num, label, pageRef, tick, prefix, hint, valueEl, computed, isSub, isTotal,
              srcChip, inlineD } = opts;
      const cls = 'mc-row' + (isSub ? ' mc-row--sub' : '') + (isTotal ? ' mc-row--total' : '');
      const r = el('div', { class: cls });
      const lab = el('div', { class: 'mc-label' });
      if (num) lab.append(el('span', { class: 'mc-num', text: String(num).padStart(2,'0') }));
      if (prefix) lab.append(el('span', { text: prefix }));
      if (label) lab.append(el('span', { text: label }));
      if (pageRef) lab.append(el('span', { class: 'mc-pageref', text: pageRef }));
      if (srcChip) {
        const chip = el('span', {
          class: 'mc-src' + (sh.detached[srcChip.id] ? ' mc-src--manual' : ''),
          text: sh.detached[srcChip.id] ? 'manual' : 'from sight',
          onClick: () => {
            sh.detached[srcChip.id] = !sh.detached[srcChip.id];
            save(); renderMancalc();
          }
        });
        lab.append(chip);
      }
      if (inlineD) {
        lab.append(el('span', { style: 'font-size:11px;color:var(--mu)', text: '(d: ' }));
        const inp = el('input', {
          class: 'mc-inline-d',
          value: sh[inlineD] != null ? Number(sh[inlineD]).toFixed(2) : ''
        });
        inp.addEventListener('input', () => {
          sh[inlineD] = inp.value === '' ? null : parseFloat(inp.value);
          sh.edited[inlineD] = true;
          save();
        });
        lab.append(inp, el('span', { style: 'font-size:11px;color:var(--mu)', text: ')' }));
      }
      r.append(lab);
      if (computed != null) r.append(el('span', { class: 'mc-computed', text: computed }));
      else r.append(valueEl || el('span'));
      if (tick) {
        const t = el('button', { class: 'mc-tick' });
        const curState = sh.ticks[tick.id] || 'off';
        t.setAttribute('data-tick', curState);
        t.textContent = curState === 'off' ? '○' : curState === 'hint' ? '?' : '✓';
        t.addEventListener('click', () => {
          const cur = sh.ticks[tick.id] || 'off';
          const next = cur === 'off' ? 'hint' : cur === 'hint' ? 'auto' : 'off';
          sh.ticks[tick.id] = next;
          if (next === 'auto') {
            const v = autoFill(s, tick.id);
            if (v != null) { sh[tick.id] = v; sh.edited[tick.id] = false; }
          }
          if (next === 'off') { sh[tick.id] = null; sh.edited[tick.id] = false; }
          save(); renderMancalc();
        });
        r.append(t);
      } else r.append(el('span'));
      root.append(r);
      if (hint && tick && (sh.ticks[tick.id] === 'hint' || sh.ticks[tick.id] === 'auto')) {
        root.append(el('div', { class: 'mc-hint', text: hint }));
      }
    };

    const numInput = (id) => {
      const inp = el('input', {
        type: 'text', inputmode: 'decimal',
        value: sh[id] != null ? Number(sh[id]).toFixed(1) : ''
      });
      inp.addEventListener('input', () => {
        sh[id] = inp.value === '' ? null : parseFloat(inp.value);
        sh.edited[id] = true;
        save();
      });
      return el('span', { class: 'mc-val' }, inp, el('span', { text: '′' }));
    };

    const angleInput = (id, hasHemi, hemiOpts) => {
      const cur = sh[id];
      const wrap = el('span', { class: 'mc-val' });
      const d = el('input', { class: 'mc-w-deg', inputmode: 'numeric',
        value: cur != null ? Math.floor(Math.abs(cur*60)/60) : '' });
      const m = el('input', { class: 'mc-w-min', inputmode: 'decimal',
        value: cur != null ? (Math.abs(cur*60) % 60).toFixed(1) : '' });
      let h = null;
      if (hasHemi) {
        h = el('select', { class: 'mc-w-hemi' });
        hemiOpts.forEach(o => {
          const opt = el('option', { text: o });
          if (cur != null && ((o === hemiOpts[1]) === (cur < 0))) opt.selected = true;
          h.append(opt);
        });
      }
      const update = () => {
        const deg = parseFloat(d.value) || 0;
        const min = parseFloat(m.value) || 0;
        let v = deg + min/60;
        if (h && h.value === hemiOpts[1]) v = -v;
        sh[id] = v; sh.edited[id] = true; save();
      };
      d.addEventListener('input', update);
      m.addEventListener('input', update);
      if (h) h.addEventListener('change', update);
      wrap.append(d, el('span', { text: '°' }), m, el('span', { text: '′' }));
      if (h) wrap.append(h);
      return wrap;
    };

    // Section I
    root.append(el('div', { class: 'mc-section-h', text: 'Section I: Observations and Corrections' }));
    root.append(el('div', { class: 'mc-group-h', text: '1. Celestial Body' }));
    row({ num: 1, label: s.body + (s.limb ? ' (' + s.limb + ')' : ''), computed: '' });

    root.append(el('div', { class: 'mc-group-h', text: '2. Apparent Altitude' }));
    row({ label: 'Index Correction', isSub: true,
      computed: (sh.detached.IC ? (sh.IC ?? 0) : (s.ie ?? S.set.ie ?? 0)).toFixed(1) + '′',
      srcChip: { id: 'IC' } });
    row({ label: '+ Dip Correction', isSub: true, prefix: '+', computed: c.dip.toFixed(1) + '′' });
    row({ label: '+ Sextant Altitude', isSub: true, prefix: '+', computed: fmtHs(s.hs),
      srcChip: { id: 'Hs' } });
    row({ label: 'Total Apparent Altitude (ha)', isSub: true, computed: fmtHs(c.ha), isTotal: true });

    root.append(el('div', { class: 'mc-group-h', text: '3. Observed Altitude' }));
    row({ label: 'Altitude Correction', isSub: true,
      pageRef: s.body === 'Moon' ? 'NA p.A5+' : (s.body === 'Sun' ? 'NA p.A2' : 'NA p.A3'),
      hint: 'Enter with ha and limb',
      valueEl: numInput('altCorr'), tick: { id: 'altCorr' } });
    row({ label: '+ Additional Corrections (Atmospheric)', isSub: true, prefix: '+',
      pageRef: 'NA p.A4', hint: 'auto-0 for Sun & stars',
      valueEl: numInput('addlAtm'), tick: { id: 'addlAtm' } });
    row({ label: '+ Additional Corrections (Mars/Venus/Moon)', isSub: true, prefix: '+',
      pageRef: 'NA p.A4', hint: 'auto-0 for Sun & stars',
      valueEl: numInput('addlMV'), tick: { id: 'addlMV' } });
    row({ label: 'Total Observed Altitude (ho)', isSub: true, computed: fmtHs(c.ho), isTotal: true });

    // Section II
    root.append(el('div', { class: 'mc-section-h', text: 'Section II: Time and Dead Reckoning' }));
    root.append(el('div', { class: 'mc-group-h', text: '4. Date (GMT)' }));
    row({ computed: new Date(s.t).toISOString().slice(0,10) });
    root.append(el('div', { class: 'mc-group-h', text: '5. DR Latitude' }));
    row({ computed: fmt(c.apLat, 'lat') });
    root.append(el('div', { class: 'mc-group-h', text: '6. DR Longitude' }));
    row({ computed: fmt(c.apLon, 'lon') });
    root.append(el('div', { class: 'mc-group-h', text: '7. Time (GMT)' }));
    row({ computed: new Date(s.t).toISOString().slice(11,19) });

    // Section III
    root.append(el('div', { class: 'mc-section-h', text: 'Section III: Latitude and Longitude' }));
    root.append(el('div', { class: 'mc-group-h', text: '8. GHA' }));
    row({ label: '+ Tabulated GHA', isSub: true, prefix: '+',
      pageRef: 'NA daily', hint: 'Hourly GHA at whole hour',
      valueEl: angleInput('ghaTab'), tick: { id: 'ghaTab' } });
    row({ label: '+ GHA Increment', isSub: true, prefix: '+',
      pageRef: 'NA inc', hint: 'Minutes/seconds at UTC',
      valueEl: angleInput('ghaInc'), tick: { id: 'ghaInc' } });
    row({ label: '+ SHA (stars) or v-correction (Moon)', isSub: true, prefix: '+',
      pageRef: 'NA daily', hint: 'auto-0 for Sun',
      valueEl: numInput('sha'), tick: { id: 'sha' } });
    row({ label: 'Total GHA', isSub: true, computed: fmt(c.ghaTotal, 'lon'), isTotal: true });

    root.append(el('div', { class: 'mc-group-h', text: '9. LHA' }));
    row({ label: '(a) Assumed Longitude', isSub: true, prefix: '(a)',
      hint: 'E. Long = 60′ − GHA min.',
      computed: fmt(c.apLon, 'lon') });
    row({ label: '(b) ±360° if LHA <0° or >360°', isSub: true, prefix: '(b)', computed: '' });
    row({ label: 'Total LHA', isSub: true, computed: c.lha.toFixed(1) + '°', isTotal: true });

    root.append(el('div', { class: 'mc-group-h', text: '10. Declination' }));
    row({ label: 'Declination', isSub: true,
      pageRef: 'NA daily',
      valueEl: angleInput('decTab', true, ['N','S']),
      tick: { id: 'decTab' }, inlineD: 'dFactor' });
    row({ label: 'd-correction', isSub: true, computed: (c.dCorr*60).toFixed(1) + '′' });
    row({ label: '+ Total Declination (Dec.)', isSub: true, prefix: '+',
      computed: fmt(c.decTot, 'lat'), isTotal: true });

    root.append(el('div', { class: 'mc-group-h', text: '11. Assumed Latitude' }));
    row({ computed: fmt(c.apLat, 'lat') });
    row({ label: 'Same / Contrary', isSub: true,
      hint: 'Same if AP lat and Dec are both N or both S; else Contrary',
      valueEl: (() => {
        const wrap = el('span', { class: 'mc-val' });
        ['Same','Contrary'].forEach(o => {
          const lbl = el('label', { style: 'font-size:11px;display:flex;gap:2px;align-items:center;margin-right:6px' });
          const r = el('input', { type: 'radio', name: 'sc-' + s.t, value: o });
          r.checked = c.sameContrary === o;
          r.addEventListener('change', () => { sh.sameContrary = o; save(); renderMancalc(); });
          lbl.append(r, el('span', { text: o }));
          wrap.append(lbl);
        });
        return wrap;
      })(),
      tick: { id: 'sameContrary' } });
    if (!c.scOk) root.append(el('div', { class: 'mc-hint',
      text: 'Mismatch — correct answer is ' + c.derivedSC }));

    // Section IV
    root.append(el('div', { class: 'mc-section-h', text: 'Section IV: Determining a Line of Position' }));
    root.append(el('div', { class: 'mc-group-h', text: '12. Computed Altitude' }));
    row({ label: '+ Tabulated hc', isSub: true, prefix: '+',
      pageRef: 'Pub 229', hint: 'Page determined by LHA, AP lat, whole° Dec',
      valueEl: angleInput('hcTab'), tick: { id: 'hcTab' }, inlineD: 'dTab' });
    row({ label: 'Declination Increment', isSub: true,
      hint: 'Dec min / 60 × d',
      computed: (c.decInc*60).toFixed(1) + '′' });
    row({ label: 'Total Computed Altitude (hc)', isSub: true, computed: fmtHs(c.hc), isTotal: true });

    root.append(el('div', { class: 'mc-group-h', text: '13. Altitude Intercept' }));
    row({ label: '(ho or hc) whichever is larger', isSub: true,
      hint: 'ho = Section I, 3', computed: fmtHs(c.larger) });
    row({ label: '(ho or hc) whichever is smaller', isSub: true,
      hint: 'hc = Section IV, 12', computed: fmtHs(c.smaller) });
    row({ label: 'Intercept', isSub: true,
      hint: 'Toward if ho > hc, Away if ho < hc',
      computed: (c.intercept*60).toFixed(1) + '′ ' + c.dir, isTotal: true });

    root.append(el('div', { class: 'mc-group-h', text: '14. Azimuth Angle (Z)' }));
    row({ computed: (sh.Z != null ? sh.Z.toFixed(0) : '—') + '°',
      valueEl: (() => {
        const wrap = el('span', { class: 'mc-val' });
        const inp = el('input', { class: 'mc-w-min',
          value: sh.Z != null ? sh.Z.toFixed(0) : '' });
        inp.addEventListener('input', () => {
          sh.Z = inp.value === '' ? null : parseFloat(inp.value);
          sh.edited.Z = true; save();
        });
        wrap.append(inp, el('span', { text: '°' }));
        return wrap;
      })(),
      tick: { id: 'Z' } });

    root.append(el('div', { class: 'mc-group-h', text: '15. Azimuth (Zn)' }));
    row({ computed: c.zn.toFixed(0) + '°',
      hint: 'N Lat.: LHA>180°, Zn=Z | LHA<180°, Zn=360°−Z | S Lat.: LHA>180°, Zn=180°−Z | LHA<180°, Zn=180°+Z' });
  }

  function renderBatch(root) {
    const active = S.sights.filter(isActive);
    if (!active.length) {
      root.append(el('div', { class: 'mc-empty', text: 'No active sheets.' }));
      return;
    }

    const tabs = el('div', { class: 'mc-bat-tabs' });
    ['I','III','IV'].forEach(id => {
      tabs.append(el('button', {
        class: 'mc-tab',
        'aria-selected': mcBatchSection === id ? 'true' : 'false',
        text: 'Section ' + id,
        onClick: () => { mcBatchSection = id; renderMancalc(); }
      }));
    });
    root.append(tabs);

    const grid = el('div', { class: 'mc-bat-grid' });
    grid.style.setProperty('--cols', active.length);

    // header row
    grid.append(el('div', { class: 'mc-bat-lab mc-bat-lab--head', text: 'Sighting' }));
    active.forEach(s => {
      const done = isComplete(s);
      const cell = el('div', { class: 'mc-bat-cell mc-bat-cell--head' });
      cell.append(el('div', { text: s.body + (s.limb ? ' ' + s.limb : '') }));
      cell.append(el('div', { style: 'font-size:10px;color:var(--mu)',
        text: new Date(s.t).toISOString().slice(11,16) }));
      cell.append(el('div', { class: 'mc-state mc-state--' + (done ? 'done' : 'open'),
        text: done ? '✓' : '○' }));
      grid.append(cell);
    });

    const addRow = (label, pageRef, kind, rowId, renderCell) => {
      const lab = el('div', { class: 'mc-bat-lab' });
      lab.append(el('span', { text: label }));
      if (pageRef) lab.append(el('span', { class: 'mc-pageref', text: pageRef }));
      if (kind === 'lookup') {
        const states = active.map(s => getSheet(s).ticks[rowId] || 'off');
        const head = states.every(x => x === 'auto') ? 'auto'
                   : states.every(x => x === 'off') ? 'off'
                   : 'hint';
        const tick = el('button', { class: 'mc-tick' });
        tick.setAttribute('data-tick', head);
        tick.textContent = head === 'off' ? '○' : head === 'hint' ? '?' : '✓';
        tick.addEventListener('click', () => {
          const next = head === 'off' ? 'hint' : head === 'hint' ? 'auto' : 'off';
          active.forEach(s => {
            const sh = getSheet(s);
            sh.ticks[rowId] = next;
            if (next === 'auto') {
              const v = autoFill(s, rowId);
              if (v != null) { sh[rowId] = v; sh.edited[rowId] = false; }
            }
            if (next === 'off') { sh[rowId] = null; sh.edited[rowId] = false; }
          });
          save(); renderMancalc();
        });
        lab.append(tick);
      }
      grid.append(lab);
      active.forEach(s => grid.append(renderCell(s)));
    };

    const lookupCell = (s, rowId) => {
      const sh = getSheet(s);
      const cell = el('div', { class: 'mc-bat-cell' });
      if (sh.ticks[rowId] === 'auto' && !sh.edited[rowId]) cell.classList.add('is-auto');
      if (sh.edited[rowId]) cell.classList.add('is-edited');
      const inp = el('input', { inputmode: 'decimal',
        value: sh[rowId] != null ? Number(sh[rowId]).toFixed(2) : '' });
      inp.addEventListener('input', () => {
        sh[rowId] = inp.value === '' ? null : parseFloat(inp.value);
        sh.edited[rowId] = true; save();
      });
      cell.append(inp);
      return cell;
    };

    const staticCell = (s, text, total) => {
      const cell = el('div', { class: 'mc-bat-cell' + (total ? ' mc-bat-cell--total' : '') });
      cell.textContent = text;
      return cell;
    };

    if (mcBatchSection === 'I') {
      addRow('1. Celestial Body', null, 'static', null,
        s => staticCell(s, s.body + (s.limb ? ' ' + s.limb : '')));
      addRow('2. Index Correction', null, 'static', null,
        s => staticCell(s, (s.ie ?? S.set.ie ?? 0).toFixed(1) + '′'));
      addRow('2. + Dip', null, 'static', null,
        s => staticCell(s, computeM(s).dip.toFixed(1) + '′'));
      addRow('2. + Sextant Altitude', null, 'static', null,
        s => staticCell(s, fmtHs(s.hs)));
      addRow('2. Total ha', null, 'static', null,
        s => staticCell(s, fmtHs(computeM(s).ha), true));
      addRow('3. Altitude Correction', 'NA p.A2/A3/A5', 'lookup', 'altCorr',
        s => lookupCell(s, 'altCorr'));
      addRow('3. + Addl (Atm)', 'NA p.A4', 'lookup', 'addlAtm',
        s => lookupCell(s, 'addlAtm'));
      addRow('3. + Addl (M/V/Moon)', 'NA p.A4', 'lookup', 'addlMV',
        s => lookupCell(s, 'addlMV'));
      addRow('3. Total ho', null, 'static', null,
        s => staticCell(s, fmtHs(computeM(s).ho), true));
    } else if (mcBatchSection === 'III') {
      addRow('8. + Tabulated GHA', 'NA daily', 'lookup', 'ghaTab',
        s => lookupCell(s, 'ghaTab'));
      addRow('8. + GHA Increment', 'NA inc', 'lookup', 'ghaInc',
        s => lookupCell(s, 'ghaInc'));
      addRow('8. + SHA / v', 'NA daily', 'lookup', 'sha',
        s => lookupCell(s, 'sha'));
      addRow('8. Total GHA', null, 'static', null,
        s => staticCell(s, fmt(computeM(s).ghaTotal, 'lon'), true));
      addRow('9. Total LHA', null, 'static', null,
        s => staticCell(s, computeM(s).lha.toFixed(1) + '°', true));
      addRow('10. Declination', 'NA daily', 'lookup', 'decTab',
        s => lookupCell(s, 'decTab'));
      addRow('10. d factor', 'NA daily', 'lookup', 'dFactor',
        s => lookupCell(s, 'dFactor'));
      addRow('10. Total Dec', null, 'static', null,
        s => staticCell(s, fmt(computeM(s).decTot, 'lat'), true));
      addRow('11. Same/Contrary', null, 'derived', 'sameContrary', s => {
        const c = computeM(s);
        return el('div', { class: 'mc-bat-cell', text: c.sameContrary });
      });
    } else if (mcBatchSection === 'IV') {
      addRow('12. + Tabulated hc', 'Pub 229', 'lookup', 'hcTab',
        s => lookupCell(s, 'hcTab'));
      addRow('12. d (Pub 229)', 'Pub 229', 'lookup', 'dTab',
        s => lookupCell(s, 'dTab'));
      addRow('12. Dec Increment', null, 'static', null,
        s => staticCell(s, (computeM(s).decInc*60).toFixed(1) + '′'));
      addRow('12. Total hc', null, 'static', null,
        s => staticCell(s, fmtHs(computeM(s).hc), true));
      addRow('13. Larger', null, 'static', null,
        s => staticCell(s, fmtHs(computeM(s).larger)));
      addRow('13. Smaller', null, 'static', null,
        s => staticCell(s, fmtHs(computeM(s).smaller)));
      addRow('13. Intercept', null, 'static', null, s => {
        const c = computeM(s);
        return staticCell(s, (c.intercept*60).toFixed(1) + '′ ' + c.dir, true);
      });
      addRow('14. Azimuth Angle (Z)', 'Pub 229', 'lookup', 'Z',
        s => lookupCell(s, 'Z'));
      addRow('15. Azimuth (Zn)', null, 'static', null,
        s => staticCell(s, computeM(s).zn.toFixed(0) + '°', true));
    }

    const scroll = el('div', { class: 'mc-bat-scroll' });
    scroll.append(grid);
    root.append(scroll);
  }

  // ---------- hooks ----------
  // 1. reduce() dispatch
  const _origReduce = reduce;
  reduce = function(s, p) {
    if (s.mode === 'mancalc') {
      if (!isComplete(s)) return { I: null };
      const c = computeM(s);
      return { ho: c.ho, hc: c.hc, zn: c.zn, I: c.intercept*60,
               apLat: c.apLat, apLon: c.apLon };
    }
    return _origReduce(s, p);
  };

  // 2. show() hook
  const _origShow = show;
  show = function(p) {
    _origShow(p);
    const sec = document.getElementById('mancalc');
    if (!sec) return;
    if (p === 'mancalc') { sec.hidden = false; renderMancalc(); }
    else sec.hidden = true;
  };

  // 3. saveBtn wrapper (deferred: runs after init assigned onclick)
  const saveBtn = document.getElementById('saveBtn');
  const _origSaveClick = saveBtn.onclick;
  saveBtn.onclick = function() {
    if (S.set.lvl !== 'manual') {
      return typeof _origSaveClick === 'function' ? _origSaveClick.call(this) : undefined;
    }
    const origLvl = S.set.lvl;
    const before = S.sights.length;
    S.set.lvl = 'auto';
    try {
      if (typeof _origSaveClick === 'function') _origSaveClick.call(this);
    } catch (e) { console.error('ManCalc save delegation failed:', e); }
    S.set.lvl = origLvl;
    if (S.sights.length > before) {
      S.sights[S.sights.length - 1].mode = 'mancalc';
      save();
      render();
      const msg = document.getElementById('msg');
      if (msg) msg.textContent = 'Saved. Open the Manual tab to reduce this sight.';
    }
  };

  // 4. Retick clears sheet
  const list = document.getElementById('list');
  if (list) list.addEventListener('change', (e) => {
    const ii = e.target && e.target.dataset ? e.target.dataset.i : undefined;
    if (ii === undefined) return;
    const s = S.sights[+ii];
    if (!s) return;
    if (e.target.checked && s.mancalc) {
      s.mancalc = blankSheet();
      save();
      render();
    }
  });

  // 5. Level UI wrap
  const _origLevelUI = updateLevelUI;
  updateLevelUI = function() {
    _origLevelUI();
    const nav = document.getElementById('navMancalc');
    if (nav) nav.hidden = (S.set.lvl !== 'manual');
    const mf = document.getElementById('manualFields');
    if (mf && S.set.lvl === 'manual') mf.hidden = true;
  };
  updateLevelUI();

  console.log('ManCalc installed.');
}
})();