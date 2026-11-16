import React from 'react';
import {R15} from './R15';
import {R16, R16_DUR} from './R16';
import {Composition, AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig} from 'remotion';
const Test: React.FC = () => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const s = spring({frame: f, fps, config: {damping: 14}});
  return <AbsoluteFill style={{background: '#121211', alignItems: 'center', justifyContent: 'center'}}>
    <div style={{fontFamily: 'Golos Text, sans-serif', fontWeight: 800, fontSize: 178, letterSpacing: '-.055em', color: '#ECE7DD', transform: `scale(${0.8 + 0.2 * s})`, opacity: interpolate(f, [0, 8], [0, 1])}}>deploy<span style={{color: '#FF4A1C'}}>.</span></div>
  </AbsoluteFill>;
};
export const Root: React.FC = () => <>
  <Composition id="Test" component={Test} durationInFrames={45} fps={30} width={1080} height={1920}/>
  <Composition id="R16" component={R16} durationInFrames={R16_DUR} fps={30} width={1080} height={1920}/>
  <Composition id="R15" component={R15} durationInFrames={192} fps={30} width={1080} height={1920}/>
</>;
