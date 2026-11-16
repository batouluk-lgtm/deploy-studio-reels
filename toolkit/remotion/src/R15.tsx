// r15 «deploy.» — формат drench.bottles (DfuNd8fNcAs): знак стоит в центре, мир под ним меняется в бит.
// Навыки: motion-art-direction (Energetic: hard cut, out-expo, без переходов-эффектов),
// beat-sync-editing (склейки сняты с оригинала, пик на 3.43 → выдох), logo-animation (overshoot-settle иконки),
// video-shotcraft: line-boil (hold A), halation-bloom (удар 3.43), card-flip-reveal (5.43), FlashCut-логика не используется (R4: ≤3 удара на кадр).
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing, staticFile, delayRender, continueRender} from 'remotion';
import './r15.css';

const FONTS: [string, string, string][] = [
  ['Golos', 'GolosText-VF.ttf', '400 900'],
  ['JBM', 'JetBrainsMono-Regular.ttf', '400'],
  ['JBM', 'JetBrainsMono-Medium.ttf', '500'],
  ['JBM', 'JetBrainsMono-Bold.ttf', '700'],
];
const fontHandle = typeof document !== 'undefined' ? delayRender('fonts') : 0;
if (typeof document !== 'undefined') {
  Promise.all(FONTS.map(([fam, file, w]) => new FontFace(fam, `url(${staticFile('fonts/' + file)})`, {weight: w}).load().then((f) => document.fonts.add(f))))
    .then(() => continueRender(fontHandle));
}

type Wm = 'ink' | 'paper' | 'none';
// склейки, снятые покадрово с оригинала (сек) → сцена, цвет знака
const SEG: [number, string, Wm][] = [
  [0.0, 'rec', 'ink'], [0.1, 'sig', 'ink'], [0.17, 'cal', 'ink'], [0.27, 'term', 'paper'], [0.33, 'tg', 'ink'], [0.43, 'sign', 'ink'], [0.57, 'ph', 'ink'],
  [0.67, 'flap', 'paper'], [0.73, 'stamp', 'ink'], [0.83, 'sig', 'ink'], [0.9, 'bp', 'paper'], [0.97, 'pst', 'ink'], [1.07, 'tgn', 'paper'], [1.13, 'cal', 'ink'],
  [1.2, 'bp2', 'paper'],
  [1.87, 'rec', 'ink'], [1.93, 'sig', 'ink'], [2.0, 'term', 'paper'], [2.1, 'pst', 'ink'], [2.17, 'sign', 'ink'], [2.27, 'ph', 'ink'], [2.33, 'flap', 'paper'],
  [2.4, 'cal', 'ink'], [2.5, 'tgn', 'paper'], [2.57, 'stamp', 'ink'], [2.67, 'sig', 'ink'], [2.73, 'bp', 'paper'], [2.8, 'tg', 'ink'], [2.9, 'sign', 'ink'],
  [3.03, 'ph', 'ink'], [3.13, 'rec', 'ink'], [3.3, 'sig', 'ink'],
  [3.43, 'hold', 'paper'],
  [5.43, 'card', 'none'], [5.83, 'sign', 'ink'], [6.23, 'ico', 'none'],
];
const COL = {ink: '#141414', paper: '#ECE7DD'};
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const outExpo = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(x)));
const outCubic = (x: number) => 1 - Math.pow(1 - clamp(x), 3);

const Noise: React.FC<{o: number}> = ({o}) => <div className="noise" style={{opacity: o}} />;

// line-boil: SVG-фильтр, seed меняется каждые 3 кадра; монтируется только пока идёт hold
const Boil: React.FC<{f: number; children: React.ReactNode; on: boolean}> = ({f, children, on}) =>
  on ? (
    <>
      <svg width="0" height="0" style={{position: 'absolute'}}>
        <filter id="boil"><feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves={2} seed={Math.floor(f / 3)} /><feDisplacementMap in="SourceGraphic" scale={6} /></filter>
      </svg>
      <div style={{position: 'absolute', inset: 0, filter: 'url(#boil)'}}>{children}</div>
    </>
  ) : <>{children}</>;

const Cal: React.FC = () => {
  const busy: Record<string, string> = {'10-1': 'Аня · стрижка', '11-3': 'Маша · ногти', '12-2': 'массаж', '16-2': 'стрижка', '17-5': 'маникюр', '18-3': '18:30 · новая'};
  const cells: React.ReactNode[] = ['', 'пн', 'вт', 'ср', 'чт', 'пт'].map((d, i) => <div key={'h' + i} className="h">{d}</div>);
  for (let h = 10; h <= 19; h++) {
    cells.push(<div key={'t' + h} className="h">{h}:00</div>);
    for (let d = 1; d <= 5; d++) {
      const k = h + '-' + d;
      cells.push(<div key={k}>{busy[k] && <div className={'b' + (k === '18-3' ? ' s' : '')}>{busy[k]}</div>}</div>);
    }
  }
  return <div className="cal">{cells}</div>;
};

const Scene: React.FC<{id: string; lt: number; p: number; i: number; f: number}> = ({id, lt, p, i, f}) => {
  // каждая склейка: короткий «удар» масштаба 1.07→1.0 за 4 кадра (out-expo) + медленный дрейф
  const punch = 1 + 0.07 * (1 - outExpo(lt / 0.13));
  const drift = `scale(${punch * (1.04 - 0.03 * p)}) translateY(${(i % 2 ? 1 : -1) * 10 * p}px)`;
  const In: React.FC<{children: React.ReactNode}> = ({children}) => <div className="in" style={{transform: drift}}>{children}</div>;
  switch (id) {
    case 'rec': return <div className="sc on paper"><In><div className="slip">
      <div style={{textAlign: 'center', fontSize: 26, color: 'var(--ink-2)'}}>студия «глянец» · онлайн-запись</div>
      <div style={{height: 840}} />
      <div className="row"><span>услуга</span><span>стрижка</span></div><div className="row"><span>мастер</span><span>аня</span></div>
      <div className="row"><span>время</span><span>18:30</span></div><div className="row"><span>статус</span><span style={{color: 'var(--signal)'}}>подтверждено</span></div>
      <div className="bar" /></div></In><Noise o={0.25} /></div>;
    case 'sig': return <div className="sc on sig"><Noise o={0.3} /></div>;
    case 'cal': return <div className="sc on paper"><In><Cal />
      <div className="lab" style={{left: 70, top: 240, color: 'var(--ink)'}}>админка · вторник</div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 850, height: 220, background: 'var(--paper)', borderTop: '2px solid var(--ink)', borderBottom: '2px solid var(--ink)'}}><div className="lab" style={{left: 70, top: 14, color: 'var(--ink-2)'}}>13:00–14:00 · обед</div></div>
    </In></div>;
    case 'term': return <div className="sc on night"><In><div className="term">
      <b>$ deploy</b> --studio glanets<br />→ сайт ............ <i>ok</i><br />→ онлайн-запись ... <i>ok</i><br />→ админка ......... <i>ok</i><br />→ бот telegram .... <i>ok</i>
      <div style={{height: 600}} />→ напоминания ..... <i>ok</i><br />→ запись 24/7 ..... <i>ok</i><br /><b>готово.</b></div></In><Noise o={0.15} /></div>;
    case 'tg': return <div className="sc on paper"><In>
      <div className="tg" style={{top: 300, opacity: 0.55, transform: 'scale(.92)'}}><small>бот · 09:12</small>Новая запись: маникюр, 11:00</div>
      <div className="tg" style={{top: 520, opacity: 0.8, transform: 'scale(.96)'}}><small>бот · 12:40</small>Новая запись: массаж, 15:30</div>
      <div className="tg" style={{top: 1220}}><small>бот · 17:58</small>Новая запись: стрижка, 18:30</div>
      <div className="tg" style={{top: 1440, opacity: 0.7, transform: 'scale(.96)'}}><small>бот · 18:05</small>Напоминание отправлено</div></In></div>;
    case 'tgn': return <div className="sc on night tgn"><In>
      <div className="tg" style={{top: 340}}><small>бот · 23:41</small>Новая запись: ночью, пока вы спали</div>
      <div className="tg" style={{top: 1260, opacity: 0.6}}><small>бот · 23:42</small>Клиент подтвердил визит</div></In><Noise o={0.15} /></div>;
    case 'sign': return <div className="sc on"><In><div className="wall" /><div className="floor" /><div className="box" />
      <div style={{position: 'absolute', left: 120, right: 120, top: 1290, height: 500, background: 'radial-gradient(ellipse at 50% 0,rgba(255,240,210,.18),transparent 70%)'}} /></In><Noise o={0.6} /><div className="vign" /></div>;
    case 'ph': return <div className="sc on paper"><In><div className="ph"><div className="scr">
      <div className="mono" style={{fontSize: 22, color: 'var(--ink-2)', textAlign: 'center', marginBottom: 680}}>шаг 2 из 3 · время</div>
      <div style={{textAlign: 'center'}}>{['16:00', '17:00', '18:30', '19:00'].map((s) => <span key={s} className={'slot' + (s === '18:30' ? ' on' : '')} style={{width: 140}}>{s}</span>)}</div>
      <div className="btn">Записаться</div></div></div></In></div>;
    case 'flap': return <div className="sc on night"><In>
      <div className="fl" style={{top: 520}}>{'18:30'.split('').map((c, k) => <span key={k}>{c}</span>)}</div>
      <div className="fl" style={{top: 1260}}>{'СВОБОДНО'.split('').map((c, k) => <span key={k}>{c}</span>)}</div></In><Noise o={0.15} /></div>;
    case 'stamp': return <div className="sc on rec"><In>
      <div className="lab" style={{left: 120, top: 300, color: 'var(--ink)'}}>запись № 0417</div><div className="lab" style={{right: 120, top: 300, color: 'var(--ink)'}}>18:30</div>
      <div style={{position: 'absolute', left: 120, right: 120, top: 350, borderTop: '3px solid var(--ink)'}} />
      <div className="stamp" style={{transform: `rotate(-9deg) scale(${1 + 0.25 * (1 - outExpo(lt / 0.1))})`}}>ЗАПИСАН</div></In><Noise o={0.3} /></div>;
    case 'bp': return <div className="sc on bp"><In><div className="g" />
      <div className="frm" style={{left: 300, top: 420, width: 480, height: 110}} /><div className="lab" style={{left: 330, top: 460}}>имя клиента</div>
      <div className="frm" style={{left: 300, top: 1300, width: 480, height: 110, borderColor: 'var(--signal)'}} /><div className="lab s" style={{left: 330, top: 1340}}>записаться →</div>
      <div className="ln" style={{left: 240, top: 420, width: 2, height: 990}} /><div className="lab" style={{left: 90, top: 900, transform: 'rotate(-90deg)'}}>form / 3 шага</div></In></div>;
    case 'bp2': {
      const w1 = 780 * outCubic(lt / 0.35), w2 = 780 * outCubic((lt - 0.12) / 0.35);
      return <div className="sc on bp"><div className="g" /><Boil f={f} on={lt > 0.45}>
        {['слот · 18:30', 'мастер · аня', 'запись 24/7', '● онлайн'].map((t, k) => (
          <div key={k} className={'lab' + (k === 3 ? ' s' : '')} style={{[k % 2 ? 'right' : 'left']: 150, top: k < 2 ? 640 : 1250, opacity: lt > 0.05 + k * 0.08 ? 1 : 0}}>{t}</div>))}
        <div className="ln" style={{left: 150, top: 690, height: 2, width: w1}} /><div className="ln" style={{right: 150, top: 1230, height: 2, width: w2}} />
        <div className="frm" style={{left: 450, top: 1380, width: 180, height: 70, opacity: lt > 0.4 ? 1 : 0}} />
      </Boil></div>;
    }
    case 'pst': return <div className="sc on"><In><div className="pst">
      {[360, 720].map((x) => <div key={x} className="ln" style={{left: x, top: 0, bottom: 0, width: 2, opacity: 0.25}} />)}
      {[700, 1220].map((y) => <div key={y} className="ln" style={{left: 0, right: 0, top: y, height: 2, opacity: 0.25}} />)}
      <div className="lab" style={{left: 60, top: 300}}>01 сайт</div><div className="lab" style={{left: 400, top: 300}}>02 запись</div><div className="lab" style={{left: 760, top: 300}}>03 бот</div>
      <div className="lab" style={{left: 60, top: 1260, lineHeight: 1.6}}>без звонков<br />без «а есть окошко?»<br />без пропущенных</div>
      <div className="lab" style={{left: 760, top: 1260, lineHeight: 1.6}}>7–12 дней<br />под ключ</div>
      <div className="lab" style={{left: 60, top: 1500, color: 'var(--signal)'}}>@deploy_studio03</div></div></In><Noise o={0.25} /></div>;
    case 'hold': {
      const a = outCubic(lt / 0.5), off = clamp((lt - 1.05) / 0.25);
      const labs: [string, React.CSSProperties, boolean?][] = [
        ['запись', {left: 120, top: 1100}], ['админка', {left: 120, top: 1150, border: '2px solid rgba(236,231,221,.5)', padding: '6px 14px', borderRadius: 10}],
        ['бот', {right: 120, top: 1100}], ['7–12 дней', {right: 120, top: 1150}, true], ['ds / 2026', {left: 120, top: 780}], ['● 24/7', {right: 120, top: 780}]];
      return <div className="sc on night">
        <div className="ln" style={{left: 540, top: 960, height: 2, width: 2400, transformOrigin: '0 0', background: 'rgba(236,231,221,.35)', transform: `rotate(-61deg) scaleX(${a})`, opacity: 1 - off}} />
        <div className="ln" style={{left: 540, top: 960, height: 2, width: 2400, transformOrigin: '0 0', background: 'rgba(236,231,221,.35)', transform: `rotate(119deg) scaleX(${a})`, opacity: 1 - off}} />
        <div className="ln" style={{left: 420, width: 2, top: 0, height: 1920 * outCubic((lt - 0.1) / 0.5), background: 'rgba(236,231,221,.35)', opacity: 1 - off}} />
        {labs.map(([t, st, s], k) => <div key={k} className={'lab' + (s ? ' s' : '')} style={{...st, opacity: (lt > 0.25 + k * 0.07 ? 1 : 0) * (1 - off)}}>{t}</div>)}
        <Noise o={0.12} /></div>;
    }
    case 'card': {
      // card-flip-reveal: 9f до 192° (bezier .55,0,.3,1), 3f возврат на 180°; блик по ребру с пиком на 90°
      const fl = Math.round(lt * 30);
      const ang = fl <= 9
        ? interpolate(fl, [0, 9], [0, 192], {easing: Easing.bezier(0.55, 0, 0.3, 1), extrapolateRight: 'clamp'})
        : interpolate(fl, [9, 12], [192, 180], {easing: Easing.out(Easing.poly(5)), extrapolateRight: 'clamp'});
      const pos = interpolate(ang, [35, 145], [-25, 115], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
      const amp = 0.32 * Math.max(0, Math.sin((Math.min(ang, 180) * Math.PI) / 180));
      const face: React.CSSProperties = {position: 'absolute', inset: 0, backfaceVisibility: 'hidden', borderRadius: 28, overflow: 'hidden', padding: 50};
      return <div className="sc on"><div className="stage3">
        <div className="shadow3" />
        <div style={{position: 'absolute', left: 240, top: 620, width: 600, height: 680, transformStyle: 'preserve-3d', transform: `translateY(${-20 * Math.sin(lt * 5)}px) rotateY(${ang}deg) rotateX(${8 - 6 * p}deg)`}}>
          <div style={{...face, background: 'var(--receipt)', fontFamily: 'var(--f-mono)', fontSize: 30, textTransform: 'uppercase', color: 'var(--ink)'}}>
            <div style={{color: 'var(--ink-2)', fontSize: 24}}>студия «глянец»</div>
            <div style={{fontFamily: 'var(--f-head)', fontWeight: 800, fontSize: 200, letterSpacing: '-.05em', marginTop: 120, textTransform: 'none'}}>18:30</div>
            <div style={{marginTop: 30}}>стрижка · аня</div>
            <div style={{position: 'absolute', left: 50, right: 50, bottom: 50, color: 'var(--signal)'}}>подтверждено ✓</div>
          </div>
          <div style={{...face, background: '#1c1c1a', boxShadow: 'inset 0 0 0 2px rgba(236,231,221,.12)', transform: 'rotateY(180deg)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <span style={{fontFamily: 'var(--f-head)', fontWeight: 800, fontSize: 120, letterSpacing: '-.055em', color: '#ECE7DD'}}>deploy<span style={{color: 'var(--signal)'}}>.</span></span>
          </div>
          {amp > 0.01 && <div style={{position: 'absolute', inset: 0, borderRadius: 28, pointerEvents: 'none', background: `linear-gradient(105deg, transparent ${pos - 18}%, rgba(255,255,255,${amp}) ${pos}%, transparent ${pos + 18}%)`, mixBlendMode: 'screen'}} />}
        </div></div><Noise o={0.4} /><div className="vign" /></div>;
    }
    case 'ico': {
      // logo-animation: 0.9 → 1.04 (3f, out-expo) → 1.00 на ударе
      const s = lt < 0.1 ? 0.9 + 0.14 * outExpo(lt / 0.1) : 1.04 - 0.04 * outCubic((lt - 0.1) / 0.07);
      return <div className="sc on paper">
        <div className="pill" style={{left: -200, top: 520, width: 880, height: 260}} /><div className="pill" style={{left: 620, top: 1160, width: 700, height: 260}} /><div className="pill" style={{left: -300, top: 1160, width: 820, height: 260}} />
        <div className="ico" style={{transform: `scale(${s})`}}><span style={{fontFamily: 'var(--f-head)', fontWeight: 800, fontSize: 96, letterSpacing: '-.055em', color: 'var(--paper)'}}>deploy<span style={{color: 'var(--signal)'}}>.</span></span></div>
        <Noise o={0.2} /></div>;
    }
  }
  return null;
};

export const R15: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / fps;
  let i = 0;
  for (let k = 0; k < SEG.length; k++) if (t >= SEG[k][0] - 1e-6) i = k;
  const [t0, id, wm] = SEG[i];
  const t1 = i + 1 < SEG.length ? SEG[i + 1][0] : 6.4;
  const lt = t - t0, p = clamp(lt / (t1 - t0));
  const onOrange = id === 'sig';
  const color = id === 'sign' || onOrange ? COL.ink : COL[wm as 'ink' | 'paper'] ?? COL.ink;
  // halation-bloom на ударе 3.43: 6f разгон 1→1.3 (out-cubic), 20f линейно до .35, 15f до .22
  const hf = id === 'hold' ? Math.round(lt * 30) : -1;
  const bloomScale = interpolate(hf, [0, 6], [1, 1.3], {easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const bloomO = 0.6 * (hf < 0 ? 0 : hf < 26 ? interpolate(hf, [6, 26], [1, 0.35], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : interpolate(hf, [26, 41], [0.35, 0.22], {extrapolateRight: 'clamp'}) * (1 - clamp((lt - 1.05) / 0.25)));
  const Word: React.FC<{c: string; dot: string}> = ({c, dot}) => (
    <div style={{fontFamily: 'var(--f-head)', fontWeight: 800, fontSize: 178, letterSpacing: '-.055em', lineHeight: 1, color: c, whiteSpace: 'nowrap'}}>deploy<span style={{color: dot}}>.</span></div>
  );
  return (
    <AbsoluteFill style={{background: '#121211', overflow: 'hidden'}}>
      <Scene id={id} lt={lt} p={p} i={i} f={f} />
      {wm !== 'none' && hf >= 0 && bloomO > 0.01 && (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', transform: `scale(${bloomScale})`, opacity: bloomO, filter: 'blur(22px) brightness(1.8)'}}><Word c="#fff" dot="#FF4A1C" /></AbsoluteFill>
      )}
      {wm !== 'none' && (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}><Word c={color} dot={onOrange ? '#141414' : '#FF4A1C'} /></AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
