// Deploy Studio reel kit: timing helpers, components, SFX registry
const $ = id => document.getElementById(id);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lin = (t, a, b) => clamp((t - a) / (b - a));
const eo = x => 1 - Math.pow(1 - x, 3);
const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const back = x => { const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2) };
const mix = (a, b, p) => a + (b - a) * p;
const on = (t, a, b) => t >= a && t < b;

window.SFX = [];
const sfx = (t, k, g = 1) => SFX.push({ t, k, g });

function rise(el, t, t0, dy = 60, d = .5) {
  if (typeof el === 'string') el = $(el);
  const p = eo(lin(t, t0, t0 + d));
  el.style.opacity = p; el.style.transform = `translateY(${(1 - p) * dy}px)`; return p;
}
function pop(el, t, t0, d = .45, from = .6) {
  if (typeof el === 'string') el = $(el);
  const p = lin(t, t0, t0 + d);
  el.style.opacity = t < t0 ? 0 : clamp(p * 4);
  el.style.transform = `scale(${t < t0 ? from : mix(from, 1, back(p))})`;
}
function vis(id, show) { $(id).style.display = show ? '' : 'none' }
function typeText(el, str, t, t0, t1) { if (typeof el === 'string') el = $(el); el.textContent = str.slice(0, Math.round(str.length * lin(t, t0, t1))) }

const CHECK = (c = '#0F1115', w = 3.4, s = 32) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const BELL = `<svg width="34" height="34" viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0" fill="none" stroke="#C6F432" stroke-width="2" stroke-linejoin="round"/></svg>`;
const PLANE = `<svg width="44" height="44" viewBox="0 0 24 24"><path d="M21 4L3 11l6 2.2L19 7l-8 7.6V20l3.4-3.6L18.5 19z" fill="#fff"/></svg>`;
const ARROW = `<svg width="44" height="44" viewBox="0 0 24 24"><path d="M5 3l14 8.2-6.2 1.4 3.6 6.8-2.6 1.4-3.6-6.8L5 18.2z" fill="#fff" stroke="#000" stroke-width="1.2" stroke-linejoin="round"/></svg>`;

// ---------- phone ----------
function phone(id, inner, { android = false, time = '14:02' } = {}) {
  return `<div class="phone${android ? ' android' : ''}" id="${id}"><div class="scr" id="${id}_s">
  <div class="isl"></div><div class="sb"><span id="${id}_clock">${time}</span><span>${android ? '▾ ▮' : '5G ▮'}</span></div>
  ${inner}<div class="rip" id="${id}_rip"></div><div class="tap" id="${id}_tap"></div></div></div>`;
}
const appbar = () => `<div class="appbar"><div class="lg">Г</div><div><div class="nm">Глянец</div><div class="ds">демо · детейлинг</div></div></div>`;

function bookingPages(p, { day = 'пт', date = '13', dateLong = 'пятница, 13 ноября', slot = '14:00', svc = 'Полировка кузова' } = {}) {
  return `${appbar()}<div class="pages">
  <div class="pg" data-i="0" id="${p}pg0"><div class="prog"><i class="on"></i><i></i><i></i></div><h3>Выберите услугу</h3>
    <div class="svc"><div><div class="a">Мойка кузова</div><div class="b">1 час</div></div><div class="p">от 1 500 ₽</div></div>
    <div class="svc" id="${p}svc"><div><div class="a">${svc}</div><div class="b">5 часов</div></div><div class="p">от 8 000 ₽</div></div>
    <div class="svc"><div><div class="a">Химчистка салона</div><div class="b">6 часов</div></div><div class="p">от 6 000 ₽</div></div>
    <div class="svc"><div><div class="a">Керамика</div><div class="b">2 дня</div></div><div class="p">от 15 000 ₽</div></div>
    <div class="svc"><div><div class="a">Бронепленка</div><div class="b">2–3 дня</div></div><div class="p">от 20 000 ₽</div></div></div>
  <div class="pg" data-i="1" id="${p}pg1"><div class="prog"><i class="on"></i><i class="on"></i><i></i></div><h3>Когда удобно?</h3>
    <div class="days"><div class="day"><div class="w">ср</div><div class="d">11</div></div><div class="day"><div class="w">чт</div><div class="d">12</div></div>
    <div class="day" id="${p}day"><div class="w">${day}</div><div class="d">${date}</div></div><div class="day"><div class="w">сб</div><div class="d">14</div></div></div>
    <div class="hint">Свободное время · бокс подберётся сам</div>
    <div class="slots"><div class="slot off">09:00</div><div class="slot" ${slot === '10:00' ? `id="${p}slot"` : ''}>10:00</div><div class="slot off">11:00</div>
    <div class="slot off">12:00</div><div class="slot" ${slot === '14:00' ? `id="${p}slot"` : ''}>14:00</div><div class="slot">15:00</div>
    <div class="slot">16:00</div><div class="slot off">17:00</div><div class="slot">18:00</div></div>
    <div class="btn" id="${p}btn1">Далее</div></div>
  <div class="pg" data-i="2" id="${p}pg2"><div class="prog"><i class="on"></i><i class="on"></i><i class="on"></i></div><h3>Ваши контакты</h3>
    <div class="summary"><b>${svc}</b><br>${day}, ${date} ноября · ${slot}</div>
    <div class="fld"><div class="l">Имя</div><div class="in" id="${p}fn"><span id="${p}vn"></span><span class="caret" id="${p}cn"></span></div></div>
    <div class="fld"><div class="l">Телефон</div><div class="in" id="${p}fp"><span id="${p}vp"></span><span class="caret" id="${p}cp"></span></div></div>
    <div class="chk"><div class="box" id="${p}box">${CHECK()}</div><div class="tx">Согласен на обработку персональных данных по политике</div></div>
    <div class="btn" id="${p}btn2">Записаться</div></div>
  <div class="pg" data-i="3" id="${p}pg3"><div class="done">
    <div class="ok" id="${p}ok"><svg width="120" height="120" viewBox="0 0 24 24"><path id="${p}okp" d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#0F1115" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="22" stroke-dashoffset="22"/></svg></div>
    <h2 id="${p}dh">Вы записаны</h2><div class="when" id="${p}dw"><b>${svc}</b><br>${dateLong}, ${slot}</div>
    <div class="remind" id="${p}dr"><div class="ic">${BELL}</div><div>Напомним за сутки<br>и за 2 часа</div></div>
    <div class="btn ghost" id="${p}dc" style="width:100%">Отменить или перенести</div></div></div>
  </div>`;
}

// centre of element relative to phone screen, ignoring transforms
function centre(el, scr) {
  let x = 0, y = 0, e = el; while (e && e !== scr) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent }
  return [x + el.offsetWidth / 2, y + el.offsetHeight / 2];
}
function pgIndex(el) { const pg = el.closest('.pg'); return pg ? +pg.dataset.i : 0 }

// generic tap cursor driver. taps: [{t, el, dx}] ; pageOf(t) gives current page float
function drive(phoneId, taps, t, pagePos = () => 0, { lead = .5, tail = .3 } = {}) {
  const scr = $(phoneId + '_s'), tap = $(phoneId + '_tap'), rip = $(phoneId + '_rip'), W = scr.offsetWidth;
  let cur = -1; for (let i = 0; i < taps.length; i++) if (t >= taps[i].t - lead - .05 && t <= taps[i].t + tail) cur = i;
  if (cur < 0) { tap.style.opacity = 0; rip.style.opacity = 0; return }
  const p = pagePos(t);
  const at = i => { const a = taps[i], el = $(a.el); const [x, y] = centre(el, scr); return [x + (a.dx || 0) + (pgIndex(el) - p) * W, y] };
  const a = taps[cur]; let [X, Y] = at(cur);
  const chained = cur > 0 && taps[cur].t - taps[cur - 1].t < lead + tail + .6;
  if (chained) { const [X0, Y0] = at(cur - 1); const m = eio(lin(t, a.t - lead, a.t - .08)); X = mix(X0, X, m); Y = mix(Y0, Y, m) }
  const vin = chained ? 1 : eo(lin(t, a.t - lead - .05, a.t - lead + .2));
  const nextChained = cur < taps.length - 1 && taps[cur + 1].t - a.t < lead + tail + .6;
  const vout = nextChained ? 1 : 1 - lin(t, a.t + .12, a.t + tail);
  const d = t - a.t, s = d > -.08 && d < .1 ? .78 : 1;
  tap.style.opacity = vin * vout; tap.style.transform = `translate(${X}px,${Y}px) scale(${s})`;
  const r = lin(t, a.t, a.t + .35); rip.style.opacity = d >= 0 ? (1 - r) * .9 : 0; rip.style.transform = `translate(${X}px,${Y}px) scale(${1 + r * 1.4})`;
}

// full booking flow inside phone `ph` with prefix `p`, starting T0, time scale k. Registers SFX.
function bookingFlow(ph, p, T0, k = 1, { name = 'Анна', tel = '+7 900 000-00-00', sound = true } = {}) {
  const T = r => T0 + r * k;
  const taps = [
    { t: T(.9), el: p + 'svc', dx: 120 }, { t: T(1.9), el: p + 'day' }, { t: T(2.6), el: p + 'slot' }, { t: T(3.0), el: p + 'btn1' },
    { t: T(3.8), el: p + 'fn', dx: 120 }, { t: T(4.25), el: p + 'fp', dx: 120 }, { t: T(4.95), el: p + 'box' }, { t: T(5.25), el: p + 'btn2' }];
  const tr = [[T(1.15), T(1.55)], [T(3.2), T(3.6)], [T(5.4), T(5.8)]];
  if (sound) {
    taps.forEach(a => sfx(a.t, 'tap', .55));
    tr.forEach(([a]) => sfx(a, 'swipe', .3));
    for (let i = 0; i < name.length; i++) sfx(T(3.9) + i * (.3 * k / name.length), 'key', .25);
    for (let i = 0; i < 10; i++) sfx(T(4.35) + i * (.5 * k / 10), 'key', .2);
    sfx(T(5.9), 'chime', .5);
  }
  const page = t => tr.reduce((s, [a, b]) => s + eio(lin(t, a, b)), 0);
  return function (t) {
    const pp = page(t);
    for (let i = 0; i < 4; i++) $(p + 'pg' + i).style.transform = `translateX(${(i - pp) * 100}%)`;
    $(p + 'svc').classList.toggle('sel', t >= T(.95));
    $(p + 'day').classList.toggle('sel', t >= T(1.95));
    $(p + 'slot').classList.toggle('sel', t >= T(2.65));
    typeText(p + 'vn', name, t, T(3.9), T(4.2));
    typeText(p + 'vp', tel, t, T(4.35), T(4.85));
    const fN = t >= T(3.8) && t < T(4.25), fP = t >= T(4.25) && t < T(4.95);
    $(p + 'fn').classList.toggle('foc', fN); $(p + 'fp').classList.toggle('foc', fP);
    const blink = Math.floor(t * 2.4) % 2 === 0;
    $(p + 'cn').style.opacity = fN ? (on(t, T(3.9), T(4.2)) ? 1 : +blink) : 0;
    $(p + 'cp').style.opacity = fP ? (on(t, T(4.35), T(4.85)) ? 1 : +blink) : 0;
    $(p + 'box').classList.toggle('on', t >= T(5.0));
    const press = (id, tt) => { const q = Math.max(0, 1 - Math.abs(t - tt) / .12); $(id).style.transform = `scale(${1 - q * .04})` };
    press(p + 'btn1', T(3.0)); press(p + 'btn2', T(5.25));
    const o = lin(t, T(5.8), T(6.25)); $(p + 'ok').style.transform = `scale(${t < T(5.8) ? 0 : back(o)})`;
    $(p + 'okp').style.strokeDashoffset = 22 * (1 - eo(lin(t, T(5.95), T(6.35))));
    ['dh', 'dw', 'dr', 'dc'].forEach((s, i) => rise(p + s, t, T(6.0) + i * .1 * k, 30, .35));
    drive(ph, taps, t, page);
  };
}

// telegram notification
function tgCard(id, top, title, lines, link = 'Открыть в админке →') {
  return `<div class="tg" id="${id}" style="top:${top}px"><div class="hd"><div class="av">${PLANE}</div>
  <div><div class="who">Глянец · записи</div><div class="app">Telegram-бот</div></div><div class="now">сейчас</div></div>
  <div class="msg"><div class="t">${title}</div>${lines}</div>${link ? `<div class="lnk">${link}</div>` : ''}</div>`;
}
function tgIn(id, t, t0, t1 = 99) {
  const a = back(lin(t, t0, t0 + .5)), b = eio(lin(t, t1, t1 + .35));
  $(id).style.opacity = t < t0 ? 0 : 1 - b;
  $(id).style.transform = `translateY(${(1 - a) * -600 - b * 60}px)`;
}

// admin calendar (inside phone or panel)
function admin(id, newLabel = 'Полировка кузова') {
  const hrs = ['10', '11', '12', '13', '14', '15', '16', '17'];
  const H = 120, top0 = 0;
  const ev = (col, h0, dur, title, sub, cls = '', eid = '') => `<div class="ev ${cls}" ${eid ? `id="${eid}"` : ''} style="top:${(h0 - 10) * H + 4}px;height:${dur * H - 8}px"><b>${title}</b>${sub}</div>`;
  return `<div class="adm" id="${id}"><div class="top"><div class="lg">Г</div>Пт, 13 ноября<span class="pill">Сегодня</span></div>
  <div class="hrs">${hrs.map((h, i) => `<div class="hr" style="top:${i * H - 14}px">${h}:00</div>`).join('')}</div>
  <div class="cols"><div class="col"><div class="ch">Бокс 1</div>${ev(0, 10, 2, 'Мойка + воск', 'подтверждена')}${ev(0, 14, 3, newLabel, 'новая запись', 'new', id + '_new')}</div>
  <div class="col"><div class="ch">Бокс 2</div>${ev(1, 11, 4, 'Химчистка', 'подтверждена')}${ev(1, 15.5, 1.5, 'Мойка кузова', 'пришёл')}</div></div></div>`;
}

// end card. pre = optional line above plate
function endCard(id = 'end', pre = '') {
  return `<div class="end" id="${id}">${pre ? `<div class="pre" id="${id}_pre">${pre}</div>` : ''}
  <div class="plate" id="${id}_pl"><div class="a">Напиши</div><div class="b">ДЕМО</div><div class="c">в комментариях</div></div>
  <div class="nick" id="${id}_nk"><div class="lg">D</div>@deploy_studio03</div></div>`;
}
function endAnim(t, t0, id = 'end') {
  $(id).style.opacity = t < t0 ? 0 : 1;
  if ($(id + '_pre')) rise(id + '_pre', t, t0 + .05, 40, .4);
  pop(id + '_pl', t, t0 + .12, .5, .7);
  rise(id + '_nk', t, t0 + .45, 30, .4);
}
function endSfx(t0) { sfx(t0, 'hit', .9); sfx(t0 + .12, 'pop', .5) }

// subtitles: list of [t0, t1, "слова *ключевое*"]
function subsHTML(id) { return `<div class="sub" id="${id}"></div>` }
function subs(id, list, t) {
  const el = $(id); const cur = list.find(s => t >= s[0] && t < s[1]);
  if (!cur) { el.innerHTML = ''; return }
  if (el.dataset.k !== String(cur[0])) {
    el.dataset.k = String(cur[0]);
    let key = false;
    el.innerHTML = cur[2].split(' ').map(w => {
      if (w.startsWith('*')) key = true;
      const html = `<span class="w${key ? ' k' : ''}">${w.replace(/\*/g, '')}</span>`;
      if (w.endsWith('*')) key = false;
      return html;
    }).join(' ');
  }
  const p = back(lin(t, cur[0], cur[0] + .25));
  el.style.transform = `scale(${mix(.85, 1, p)})`; el.style.opacity = clamp(lin(t, cur[0], cur[0] + .08));
}

// desktop booking site
function site(id) {
  return `<div class="site" id="${id}">
  <div class="nav"><div class="brand"><div class="lg">Г</div>Глянец</div><span>Услуги</span><span>Цены</span><span>Контакты</span><span class="cta">Записаться</span></div>
  <div class="hero"><div class="l"><div class="k">ДЕТЕЙЛИНГ · ДЕМО</div><h1>Машина как<br>из салона.<br>Запись — онлайн.</h1>
  <p>Выберите услугу и свободное время — без звонков и переписки.</p><span class="b" id="${id}_hb">Записаться онлайн</span></div><div class="r paint"></div></div>
  <h2>Услуги</h2>
  <div class="cards">
   <div class="card"><div class="im paint2"></div><div class="a">Мойка кузова</div><div class="p">от 1 500 ₽ · 1 ч</div></div>
   <div class="card" id="${id}_c2"><div class="im paint"></div><div class="a">Полировка</div><div class="p">от 8 000 ₽ · 5 ч</div></div>
   <div class="card"><div class="im paint3"></div><div class="a">Химчистка</div><div class="p">от 6 000 ₽ · 6 ч</div></div>
   <div class="card"><div class="im paint2"></div><div class="a">Керамика</div><div class="p">от 15 000 ₽ · 2 дня</div></div></div>
  <h2 style="margin-top:60px">Свободное время</h2>
  <div class="book"><div class="days" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:0">
   <div class="day"><div class="w">ср</div><div class="d">11</div></div><div class="day"><div class="w">чт</div><div class="d">12</div></div>
   <div class="day" id="${id}_d"><div class="w">пт</div><div class="d">13</div></div><div class="day"><div class="w">сб</div><div class="d">14</div></div></div>
   <div class="slots"><div class="slot off">09:00</div><div class="slot">10:00</div><div class="slot off">11:00</div><div class="slot off">12:00</div>
   <div class="slot" id="${id}_s">14:00</div><div class="slot">15:00</div><div class="slot">16:00</div><div class="slot off">17:00</div><div class="slot">18:00</div></div></div>
  <div class="bk2"><div class="btn" id="${id}_b">Записаться на 14:00</div><div class="sm" id="${id}_ok">Полировка · пт, 13 ноября</div></div>
  <div style="height:300px"></div></div>`;
}

window.render = () => { };
