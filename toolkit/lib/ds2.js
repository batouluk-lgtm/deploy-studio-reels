// Deploy Studio reel kit v2 — «Бюро записи» (STYLE.md, с 2026-11-12).
// Подключение в rN.html (из toolkit/):
//   <link rel="stylesheet" href="brand/brand.css"><link rel="stylesheet" href="lib/ds2.css">
//   <script src="vendor/gsap.min.js"></script><script src="vendor/CustomEase.min.js"></script>
//   <script src="vendor/matter.min.js"></script><script src="lib/ds2.js"></script>
// Всё детерминировано от t: компоненты возвращают объект с методом render(t); эффекты пишутся в window.SFX.
// Звуки бюро (lib/audio.py): flap, flap_set, printer, printer_l, stamp, tear, rustle, bell, type, ding, slide, drop, enter.

const $ = id => document.getElementById(id);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lin = (t, a, b) => clamp((t - a) / (b - a));
const mix = (a, b, p) => a + (b - a) * p;
gsap.registerPlugin(CustomEase);
const E = {
  out: gsap.parseEase('power3.out'), in: gsap.parseEase('power2.in'), io: gsap.parseEase('power2.inOut'),
  expo: gsap.parseEase('expo.out'), back: gsap.parseEase('back.out(1.8)'),
  snap: CustomEase.create('snap', 'M0,0 C0.2,0 0.1,1 1,1'),
};
window.SFX = [];
const sfx = (t, k, g = 1) => { if (t >= 0) SFX.push({ t: +t.toFixed(3), k, g }) };
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

// --- сцены: показать сцену, если t в [a, b) ---
function scenes(list, t) { list.forEach(([id, a, b]) => { $(id).style.display = (t >= a && t < b) ? 'block' : 'none' }) }
// --- плёночное зерно: сдвиг на каждом кадре ---
function grain(t) { const f = Math.floor(t * 30); document.querySelectorAll('.grain').forEach(g => g.style.backgroundPosition = `${Math.floor(hash(f) * 300)}px ${Math.floor(hash(f + 9) * 300)}px`) }
// --- тряска кадра после удара (2–3 кадра) ---
function shake(t, t0, amp = 14) {
  const p = t - t0; if (p < 0 || p > .11) return [0, 0, 0];
  const k = 1 - p / .11, f = Math.floor(p * 30);
  return [(hash(f + t0) - .5) * 2 * amp * k, (hash(f + t0 + 3) - .5) * 2 * amp * k, (hash(f + t0 + 5) - .5) * 1.2 * k];
}

// ========== ТАБЛО (split-flap) ==========
const FLAP_CH = 'АБВГДЕЖЗИКЛМНОПРСТУФХЧШЩЭЮЯ0123456789';
// lines: [{text:'КЛИЕНТ', sig:false}] ; opts: t0, per (сдвиг между буквами), flip (длит. одной прокрутки), size(px)
function flapBoard(el, lines, { t0 = 0, per = .05, flip = .07, size = 96, minSpins = 2, maxSpins = 4, sound = true, seed = 1 } = {}) {
  el.classList.add('board'); el.style.fontSize = size + 'px';
  const cells = []; let idx = 0;
  el.innerHTML = lines.map((ln, li) => `<div class="flaps">` + [...ln.text].map(ch => {
    const sp = ch === ' ';
    const c = { ch, sp, i: idx++, li };
    c.spins = minSpins + Math.floor(hash(c.i * 7 + seed) * (maxSpins - minSpins + 1));
    c.start = t0 + c.i * per; c.end = c.start + c.spins * flip; cells.push(c);
    return `<span class="flap${sp ? ' sp' : ''}${ln.sig ? ' sig' : ''}"><i></i></span>`;
  }).join('') + `</div>`).join('');
  const nodes = [...el.querySelectorAll('.flap i')];
  cells.forEach((c, k) => {
    c.node = nodes[k];
    if (!c.sp && sound) { for (let s = 0; s < c.spins; s++) sfx(c.start + s * flip, 'flap', .22 + hash(k + s) * .1); sfx(c.end, 'flap_set', .35) }
  });
  return {
    end: Math.max(...cells.map(c => c.end)),
    render(t) {
      cells.forEach((c, k) => {
        if (c.sp) return;
        const n = c.node;
        if (t < c.start) { n.textContent = ''; n.style.transform = ''; return }
        if (t >= c.end) { n.textContent = c.ch; n.style.transform = ''; return }
        const s = Math.floor((t - c.start) / flip), ph = ((t - c.start) / flip) % 1;
        n.textContent = FLAP_CH[Math.floor(hash(k * 13 + s + seed) * FLAP_CH.length)];
        n.style.transform = `scaleY(${1 - Math.sin(ph * Math.PI) * .55})`;
      });
    }
  };
}

// ========== ПЕЧАТЬ ЧЕКА ==========
// rows: ['title:НАПОМИНАНИЕ', 'hr', ['Завтра','14:00'], ['Выбрал','сам','sig'], 'barcode']
function receiptHTML(rows) {
  return rows.map(r => {
    if (r === 'hr') return '<hr>';
    if (r === 'barcode') return '<div class="barcode" style="margin-top:18px"></div>';
    if (typeof r === 'string' && r.startsWith('title:')) return `<div class="ttl">${esc(r.slice(6))}</div>`;
    if (typeof r === 'string') return `<div class="row" style="justify-content:center">${esc(r)}</div>`;
    return `<div class="row"><span>${esc(r[0])}</span><span class="dots"></span><span class="v${r[2] === 'sig' ? ' sig' : ''}">${esc(r[1])}</span></div>`;
  }).join('');
}
// печатает чек построчно из принтера; el — контейнер (абсолютный), x/y/w — положение щели
function printer(el, rows, { x = 140, y = 250, w = 800, t0 = 0, line = .3, sound = true } = {}) {
  el.innerHTML = `<div class="printer" style="left:${x}px;top:${y}px;width:${w}px"><div class="led"></div></div>
    <div class="rcpt-wrap" style="left:${x + 50}px;top:${y + 38}px;width:${w - 100}px;height:1500px">
    <div class="receipt" style="padding-top:64px">${receiptHTML(rows)}</div></div>`;
  const wrap = el.querySelector('.rcpt-wrap'), rc = wrap.querySelector('.receipt'), led = el.querySelector('.led');
  const items = [...rc.children];
  const T = items.map((_, i) => t0 + i * line);
  items.forEach((it, i) => { if (sound && it.tagName !== 'HR') sfx(T[i], 'printer', .32) });
  let H = 0;
  return {
    end: t0 + items.length * line,
    render(t) {
      if (!H) H = rc.offsetHeight;
      let shown = 0;
      items.forEach((it, i) => {
        const p = lin(t, T[i], T[i] + line * .8);
        it.style.visibility = t >= T[i] ? 'visible' : 'hidden';
        // моно-строка «печатается» слева направо
        it.style.clipPath = `inset(0 ${(1 - p) * 100}% 0 0)`;
        if (t >= T[i]) shown = it.offsetTop + it.offsetHeight + 40;
      });
      const all = t >= T[T.length - 1] + line;
      const vis = all ? H : Math.max(70, shown);
      // бумага выезжает: показываем только напечатанную часть; лёгкий дребезг при подаче
      const feeding = t >= t0 && !all;
      wrap.style.clipPath = `inset(0 0 ${Math.max(0, wrap.offsetHeight - vis)}px 0)`;
      rc.style.transform = `translateY(${feeding ? Math.sin(t * 90) * 1.2 : 0}px) rotate(${all ? mix(0, -1.2, E.out(lin(t, T[T.length - 1] + line, T[T.length - 1] + line + .5))) : 0}deg)`;
      led.classList.toggle('on', feeding);
    }
  };
}

// ========== ШТАМП ==========
// el — .stampbox с .stamp внутри; удар с overshoot 1.4 → .95 → 1
function stampHit(el, t0, { rot = -8, sound = true, g = .9 } = {}) {
  if (sound) sfx(t0, 'stamp', g);
  return {
    t0,
    render(t) {
      const p = t - t0;
      if (p < 0) { el.style.opacity = 0; return }
      let s;
      if (p < .07) s = mix(1.4, .95, E.in(p / .07));
      else if (p < .16) s = mix(.95, 1, E.out((p - .07) / .09));
      else s = 1;
      el.style.opacity = clamp(p / .04);
      el.style.transform = `rotate(${rot}deg) scale(${s})`;
    }
  };
}

// ========== ОТРЫВ ==========
// верхний слой отрывается по пунктиру: зубчатый край + улетает вверх с поворотом
function zigzag(yPct, teeth = 26, depth = 22) {
  const pts = ['0% 0%', '100% 0%'];
  for (let i = teeth; i >= 0; i--) pts.push(`${(i / teeth) * 100}% calc(${yPct}% + ${i % 2 ? depth : 0}px)`);
  return `polygon(${pts.join(',')})`;
}
function tearAway(el, t, t0, d = .55) {
  const p = lin(t, t0, t0 + d);
  if (t < t0) { el.style.clipPath = ''; el.style.transform = ''; return }
  el.style.clipPath = zigzag(100 - 0.0001);
  const e = E.in(p);
  el.style.transform = `translate(${e * 160}px, ${-e * 2100}px) rotate(${-e * 9}deg)`;
}

// ========== ПАДЕНИЕ С ФИЗИКОЙ (Matter.js) ==========
// items: [{html, w, h, x, a, cls}] ; падают по очереди с шагом gap на пол floorY, стопкой
function physDrop(container, items, { t0 = 0, gap = .25, floorY = 1500, left = 120, right = 960, sound = true } = {}) {
  const els = items.map(it => { const d = document.createElement('div'); d.className = 'card-drop ' + (it.cls || ''); d.innerHTML = it.html; d.style.width = it.w + 'px'; d.style.height = it.h + 'px'; container.appendChild(d); return d });
  const DT = 1 / 120;
  let eng, bodies, simT;
  function reset() {
    eng = Matter.Engine.create(); eng.gravity.y = 2.4; bodies = [];
    const W = Matter.World, B = Matter.Bodies;
    W.add(eng.world, [B.rectangle(540, floorY + 50, 1400, 100, { isStatic: true }), B.rectangle(left - 50, floorY - 600, 100, 1400, { isStatic: true }), B.rectangle(right + 50, floorY - 600, 100, 1400, { isStatic: true })]);
    simT = 0;
  }
  function step(to, hit) {
    while (simT + DT <= to) {
      items.forEach((it, i) => {
        if (!bodies[i] && simT >= i * gap) {
          const b = Matter.Bodies.rectangle(it.x, -it.h - 40, it.w, it.h, { angle: it.a || 0, restitution: .08, friction: .7, frictionAir: .012, density: .002 });
          b.plugin = { i }; bodies[i] = b; Matter.World.add(eng.world, b);
        }
      });
      Matter.Engine.update(eng, DT * 1000);
      simT += DT;
      if (hit) bodies.forEach((b, i) => { if (b && !hit[i] && b.position.y > -10 && Math.abs(b.velocity.y) < 2 && simT > i * gap + .15) hit[i] = simT });
    }
  }
  // предварительный прогон: где карточки «приземляются» → звук
  reset(); const hit = []; step(items.length * gap + 2.5, hit);
  if (sound) hit.forEach(h => h && sfx(t0 + h - .03, 'drop', .55));
  reset();
  return {
    render(t) {
      const lt = t - t0;
      if (lt < simT - 1e-6) reset();
      if (lt > 0) step(lt);
      els.forEach((d, i) => {
        const b = bodies[i];
        if (!b || lt <= 0) { d.style.display = 'none'; return }
        d.style.display = 'block';
        d.style.transform = `translate(${b.position.x - items[i].w / 2}px, ${b.position.y - items[i].h / 2}px) rotate(${b.angle}rad)`;
      });
    }
  };
}

// ========== ЖУРНАЛ ЗАПИСЕЙ ==========
// rows: [[время, услуга, статус]], заполняются по одной; hi — индекс строки, которая вспыхивает сигнальным в tHi
function journal(el, rows, { t0 = 0, step = .35, hi = -1, tHi = 0, head = ['Время', 'Услуга', 'Статус'], sound = true } = {}) {
  el.classList.add('journal');
  el.innerHTML = `<div class="head"><span>${head[0]}</span><span>${head[1]}</span><span>${head[2]}</span></div>` +
    rows.map(r => `<div class="jr"><div class="hl"></div><span>${esc(r[0])}</span><span>${esc(r[1])}</span><span class="st">${esc(r[2])}</span></div>`).join('');
  const rs = [...el.querySelectorAll('.jr')];
  rows.forEach((r, i) => { if (sound) { sfx(t0 + i * step, 'type', .45); sfx(t0 + i * step + .12, 'type', .3) } });
  if (hi >= 0 && sound) sfx(tHi, 'stamp', .5);
  return {
    render(t) {
      rs.forEach((r, i) => {
        const a = t0 + i * step, p = E.out(lin(t, a, a + .3));
        r.style.opacity = t < a ? 0 : 1;
        r.style.clipPath = `inset(0 ${(1 - p) * 100}% 0 0)`;
        const hl = r.querySelector('.hl');
        const q = i === hi ? E.expo(lin(t, tHi, tHi + .25)) : 0;
        hl.style.transform = `scaleX(${q})`;
        r.querySelector('.st').style.color = i === hi && q > .5 ? 'var(--ink)' : '';
      });
    }
  };
}

// ========== ТЕРМИНАЛ deploy ==========
// lines: [{cmd:'deploy glyanets'} | {out:'текст', cls:'dim'} | {bar:true, from, to}] ; t — время начала строки
function terminal(el, lines, { cps = 22 } = {}) {
  el.classList.add('term');
  lines.forEach(l => {
    if (l.cmd) { for (let i = 0; i < l.cmd.length; i++) sfx(l.t + i / cps, 'type', .3 + hash(i) * .15); sfx(l.t + l.cmd.length / cps + .05, 'enter', .6) }
    else if (l.bar) { for (let k = 0; k < 6; k++) sfx(l.t + k * (l.d || 1) / 6, 'type', .18) }
    else sfx(l.t, l.snd || 'type', l.g || .25);
  });
  return {
    render(t) {
      let html = '';
      lines.forEach((l, i) => {
        if (t < l.t) return;
        if (l.cmd) {
          const n = Math.min(l.cmd.length, Math.floor((t - l.t) * cps));
          const typing = n < l.cmd.length || (lines[i + 1] && t < lines[i + 1].t);
          html += `<span class="p">$</span> ${esc(l.cmd.slice(0, n))}${typing && Math.floor(t * 3) % 2 === 0 ? '<span class="cur"></span>' : ''}\n`;
        } else if (l.bar) {
          const p = E.io(lin(t, l.t, l.t + (l.d || 1))), W = 18, k = Math.round(p * W);
          html += `<span class="dim">[</span>${'█'.repeat(k)}<span class="dim">${'·'.repeat(W - k)}]</span> ${String(Math.round(p * 100)).padStart(3)}%\n`;
        } else html += `<span class="${l.cls || 'ok'}">${l.html || esc(l.out)}</span>\n`;
      });
      el.innerHTML = html;
    }
  };
}

// ========== КИНЕТИЧЕСКАЯ ТИПОГРАФИКА ==========
// <span class="mask"><span>Слово</span></span> — вход маской снизу, без размытия
function maskIn(el, t, t0, d = .42, out = null) {
  const inner = el.firstElementChild || el;
  let y = 110 * (1 - E.expo(lin(t, t0, t0 + d)));
  if (out !== null) y -= 110 * E.in(lin(t, out, out + .25));
  inner.style.transform = `translateY(${y}%)`;
  el.style.visibility = t < t0 ? 'hidden' : 'visible';
}

// ========== МИНИ-САЙТ «ГЛЯНЕЦ» (вставка в бумажную сцену) ==========
function miniSite({ svc = 1, slot = 5 } = {}) {
  const S = [['Комплексная мойка', 'от 2 500'], ['Полировка кузова', 'от 9 000'], ['Химчистка салона', 'от 7 000']];
  const T = ['10:00', '11:30', '12:00', '13:30', '14:00', '15:30', '16:00', '17:30'];
  return `<div class="mini"><div class="top"><div class="lg">Г</div>Глянец<span style="margin-left:auto;font-family:var(--f-mono);font-size:20px;font-weight:500;color:#8a857c">демо · детейлинг</span></div>
    ${S.map((s, i) => `<div class="sv${i === svc ? ' on' : ''}"><span>${s[0]}</span><span>${s[1]}</span></div>`).join('')}
    <div class="slots">${T.map((x, i) => `<div class="${i === slot ? 'on' : (i === 1 || i === 3 ? 'off' : '')}">${x}</div>`).join('')}</div>
    <div class="btn">Записаться</div></div>`;
}

// ========== ФИНАЛЬНАЯ КАРТОЧКА (как #reel-end в brand/board.html) ==========
function endCard2(id, { stamp = 'ПОКАЖЕМ' } = {}) {
  return `<div class="sc" id="${id}">
  <div class="reg" style="left:60px;top:280px" id="${id}_r1"></div><div class="reg" style="right:60px;top:280px" id="${id}_r2"></div>
  <div class="pad" style="top:360px"><div class="runner" id="${id}_run"><span>Бюро записи</span><span>ds.</span></div></div>
  <div class="pad f-mono" style="top:470px;font-size:40px;color:var(--ink-2)" id="${id}_a"></div>
  <div class="pad f-head" style="top:540px;font-size:300px;letter-spacing:-.06em"><span class="mask" id="${id}_d"><span>ДЕМО</span></span></div>
  <div class="pad f-serif" style="top:880px;font-size:64px" id="${id}_s">— покажем сайт <span class="signal">под вашу</span> нишу</div>
  <div class="stampbox" style="left:72px;top:1080px" id="${id}_st"><span class="stamp" style="font-size:46px;transform:none">${stamp}</span></div>
  <div class="pad" style="top:1330px;display:flex;justify-content:space-between;align-items:end" id="${id}_f">
    <span class="f-mono" style="font-size:36px">@deploy_studio03</span><span class="logo" style="font-size:90px">ds<b>.</b></span></div>
  <div class="grain"></div></div>`;
}
const END_A = 'Напишите в комментариях';
function endSfx2(t0) {
  sfx(t0, 'slide', .5);
  for (let i = 0; i < END_A.length; i += 2) sfx(t0 + .05 + i * .012, 'type', .22);
  sfx(t0 + .9, 'stamp', .85); sfx(t0 + 1.25, 'bell', .4);
}
function endAnim2(id, t, t0) {
  const runP = E.out(lin(t, t0, t0 + .35));
  $(id + '_run').style.clipPath = `inset(0 ${(1 - runP) * 100}% 0 0)`;
  $(id + '_a').textContent = END_A.slice(0, Math.round(END_A.length * lin(t, t0 + .05, t0 + .35)));
  maskIn($(id + '_d'), t, t0 + .2, .45);
  const s = E.out(lin(t, t0 + .55, t0 + .85));
  $(id + '_s').style.opacity = s; $(id + '_s').style.transform = `translateY(${(1 - s) * 24}px)`;
  stampHit($(id + '_st'), t0 + .9, { rot: -5, sound: false }).render(t);
  const f = E.out(lin(t, t0 + 1.05, t0 + 1.4));
  $(id + '_f').style.opacity = f;
  return shake(t, t0 + .9, 10);
}
