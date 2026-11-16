// r16 «deploy. на носителях» — формат Dd3MiVNN3x8: склейка каждые ~5 кадров, знак «напечатан» на предметах.
// Картинки: сгенерированы (Figma AI gemini-3.1-flash-image + Weave Nano Banana 2.1), public/r16.
// Навыки: beat-sync-editing (склейки сняты с оригинала покадрово, одна пауза 0.63–1.00 на камне),
// motion-art-direction (Energetic: только hard cut, без переходов; один медленный наезд на кадр),
// logo-animation (геометрия знака не искажается, только масштаб), shot-composition (объект — в центре, знак на объекте).
import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame, useVideoConfig, staticFile, delayRender, continueRender} from 'remotion';

const fh = typeof document !== 'undefined' ? delayRender('font') : 0;
if (typeof document !== 'undefined') {
  new FontFace('Golos', `url(${staticFile('fonts/GolosText-VF.ttf')})`, {weight: '400 900'}).load().then((f) => {document.fonts.add(f); continueRender(fh);});
}

const IW = 768, IH = 1376;
type Shot = {img: string; tx: number; ty: number; z: number; w: number; c: string; dot: string; o?: number; rot?: number; blur?: number};
// точка поверхности предмета на исходнике (tx,ty), доп. зум z, ширина знака w (px кадра), цвет знака
const S: Record<string, Shot> = {
  hoodie: {img: 'hoodie', tx: 384, ty: 640, z: 1.25, w: 270, c: '#E9E4D8', dot: '#FF4A1C', o: 0.92, blur: 0.4},
  building: {img: 'building', tx: 381, ty: 572, z: 1.05, w: 380, c: '#141414', dot: '#FF4A1C'},
  badge: {img: 'badge', tx: 384, ty: 985, z: 1.7, w: 260, c: '#141414', dot: '#FF4A1C'},
  bag: {img: 'bag', tx: 380, ty: 830, z: 1.1, w: 400, c: '#141414', dot: '#ECE7DD', o: 0.96},
  salon: {img: 'salon', tx: 384, ty: 560, z: 1.05, w: 480, c: '#F4EFE6', dot: '#FF4A1C', o: 0.9},
  card: {img: 'card', tx: 380, ty: 682, z: 1.15, w: 300, c: '#E9E4D8', dot: '#FF4A1C', o: 0.95},
  cup: {img: 'cup', tx: 381, ty: 776, z: 1.3, w: 270, c: '#2a1f14', dot: '#FF4A1C', o: 0.9, blur: 0.3},
  stone: {img: 'stone', tx: 440, ty: 680, z: 1.5, w: 230, c: '#E9E4D8', dot: '#FF4A1C', o: 0.92},
  barber: {img: 'barber', tx: 391, ty: 536, z: 1.1, w: 340, c: '#E9E4D8', dot: '#FF4A1C', o: 0.88},
  car: {img: 'car', tx: 470, ty: 760, z: 1.2, w: 380, c: '#E9E4D8', dot: '#FF4A1C', o: 0.9},
};
// склейки оригинала (сек), вторая колонка — кадр; g-* — плоские фирменные кадры
const CUTS: [number, string][] = [
  [0, 'hoodie'], [0.17, 'g-ink'], [0.33, 'building'], [0.5, 'badge'], [0.63, 'stone'], [1.0, 'bag'], [1.17, 'card'], [1.33, 'g-paper'],
  [1.47, 'cup'], [1.67, 'barber'], [1.83, 'car'], [2.0, 'salon'], [2.17, 'g-sig'], [2.33, 'hoodie*'], [2.5, 'building*'], [2.67, 'badge'],
  [2.8, 'card*'], [3.0, 'g-ink'], [3.17, 'bag*'], [3.3, 'cup*'], [3.5, 'barber*'], [3.67, 'car*'], [3.83, 'salon*'], [4.0, 'stone*'],
  [4.17, 'g-paper'], [4.33, 'hoodie'], [4.5, 'badge*'], [4.67, 'building'], [4.83, 'card'], [5.0, 'g-sig'], [5.17, 'bag'], [5.33, 'g-ink'],
];
export const R16_DUR = 162;

const Word: React.FC<{w: number; c: string; dot: string}> = ({w, c, dot}) => (
  // ширина «deploy.» в Golos 800 при 178px ≈ 640px → размер шрифта из нужной ширины
  <div style={{fontFamily: 'Golos', fontWeight: 800, fontSize: (178 * w) / 640, letterSpacing: '-.055em', lineHeight: 1, color: c, whiteSpace: 'nowrap'}}>deploy<span style={{color: dot}}>.</span></div>
);

export const R16: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / fps;
  let i = 0;
  for (let k = 0; k < CUTS.length; k++) if (t >= CUTS[k][0] - 1e-6) i = k;
  const t0 = CUTS[i][0], t1 = i + 1 < CUTS.length ? CUTS[i + 1][0] : R16_DUR / 30;
  const p = Math.min(1, (t - t0) / (t1 - t0));
  let key = CUTS[i][1];
  const alt = key.endsWith('*'); // повтор носителя: ближе и чуть с другой точки
  key = key.replace('*', '');

  if (key.startsWith('g-')) {
    const bg = key === 'g-ink' ? '#141414' : key === 'g-paper' ? '#ECE7DD' : '#FF4A1C';
    const c = key === 'g-ink' ? '#ECE7DD' : '#141414';
    const dot = key === 'g-sig' ? '#ECE7DD' : '#FF4A1C';
    return <AbsoluteFill style={{background: bg, alignItems: 'center', justifyContent: 'center'}}><Word w={640} c={c} dot={dot} /></AbsoluteFill>;
  }
  const s = S[key];
  const push = 1 + (key === 'stone' && !alt ? 0.12 : 0.035) * p; // единственная «пауза» — медленный наезд на камень
  const s0 = Math.max(1080 / IW, 1920 / IH);
  let sc = s0 * s.z * (alt ? 1.35 : 1) * push;
  const dx = alt ? 18 : 0;
  // поверхность предмета — в центр кадра; масштаб не меньше, чем нужно для заливки кадра
  const need = Math.max(540 / s.tx, 540 / (IW - s.tx), 960 / s.ty, 960 / (IH - s.ty));
  sc = Math.max(sc, need);
  const left = 540 - s.tx * sc + dx, top = 960 - s.ty * sc;
  const wScale = sc / (s0 * s.z);
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <Img src={staticFile(`r16/${s.img}.jpg`)} style={{position: 'absolute', left, top, width: IW * sc, height: IH * sc}} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', transform: `translateX(${dx}px) rotate(${s.rot ?? 0}deg)`, opacity: s.o ?? 1, filter: s.blur ? `blur(${s.blur}px)` : undefined, mixBlendMode: key === 'cup' ? 'multiply' : key === 'salon' ? 'screen' : 'normal'}}>
        <Word w={s.w * wScale} c={s.c} dot={s.dot} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
