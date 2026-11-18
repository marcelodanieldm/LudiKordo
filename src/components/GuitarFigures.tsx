import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { Text } from './Text';
import { Fretboard } from './Fretboard';
import { STRINGS } from '../music/notes';
import { colors } from '../theme';
import type { Figure } from '../content/types';
import { CHORD_FIGURES, LEGEND_COUNT, RATIO } from './guitarFigureMeta';
import { chordDiagram, diagramOf, type GridDiagram } from '../music/chords';

export { isGuitarFigure } from './guitarFigureMeta';

/**
 * Ilustraciones de guitarra eléctrica dibujadas en código (sin imágenes con
 * derechos): partes de la guitarra, ampli, púa y postura. Cada una trae su
 * leyenda numerada, traducida (`ui.gfig.<figura>.*`), debajo del dibujo.
 * Para zurdos se espejan las que tienen dirección.
 */

const BODY = '#C2410C';
const GUARD = '#F5F1E8';
const METAL = '#C9C4BA';
const DARK = '#1D1B2E';
const AMP = '#26222F';
const TOLEX = '#3A3343';

function Callout({ x, y, n }: { x: number; y: number; n: number }) {
  return (
    <G>
      <Circle cx={x} cy={y} r={9} fill={colors.gold} />
      <SvgText x={x} y={y + 4} fontSize={11} fontWeight="900" fill={colors.onAccent} textAnchor="middle">
        {n}
      </SvgText>
    </G>
  );
}

function Knob({ x, y, r = 14, value, label }: { x: number; y: number; r?: number; value: number; label?: string }) {
  // 0 a 10 recorre 270° (de las 7 a las 5 del reloj, como una perilla real).
  const a = ((-225 + (value / 10) * 270) * Math.PI) / 180;
  return (
    <G>
      <Circle cx={x} cy={y} r={r + 3} fill="none" stroke={colors.line} strokeWidth={2} strokeDasharray="2 4" />
      <Circle cx={x} cy={y} r={r} fill={DARK} stroke={METAL} strokeWidth={2} />
      <Line x1={x} y1={y} x2={x + Math.cos(a) * (r - 3)} y2={y + Math.sin(a) * (r - 3)} stroke={colors.gold} strokeWidth={3} strokeLinecap="round" />
      {label ? (
        <SvgText x={x} y={y + r + 16} fontSize={10} fontWeight="800" fill={colors.ink} textAnchor="middle">
          {label}
        </SvgText>
      ) : null}
      <SvgText x={x} y={y - r - 7} fontSize={10} fontWeight="900" fill={colors.gold} textAnchor="middle">
        {value}
      </SvgText>
    </G>
  );
}

/** Guitarra eléctrica de cuerpo sólido vista de frente, horizontal (clavijero a la derecha). */
function GuitarDrawing() {
  return (
    <G>
      {/* Cuerpo con doble corte */}
      <Path d="M20 70 C14 30 48 18 72 30 C84 36 92 34 100 26 C108 18 122 22 120 36 L118 48 L118 92 L120 104 C122 118 108 122 100 114 C92 106 84 104 72 110 C48 122 14 110 20 70 Z" fill={BODY} />
      {/* Golpeador */}
      <Path d="M40 46 C52 36 74 40 86 46 L112 50 L112 90 L86 94 C74 100 52 104 40 94 C32 86 32 54 40 46 Z" fill={GUARD} opacity={0.92} />
      {/* Pastillas */}
      {[58, 76, 96].map((x, i) => (
        <G key={x} rotation={i === 0 ? -8 : 0} origin={`${x}, 70`}>
          <Rect x={x - 5} y={52} width={10} height={36} rx={4} fill={DARK} />
        </G>
      ))}
      {/* Puente */}
      <Rect x={36} y={54} width={10} height={32} rx={2} fill={METAL} />
      {/* Perillas y selector */}
      <Circle cx={56} cy={100} r={5} fill={METAL} />
      <Circle cx={68} cy={103} r={5} fill={METAL} />
      <Circle cx={80} cy={103} r={5} fill={METAL} />
      <Line x1={84} y1={90} x2={92} y2={86} stroke={DARK} strokeWidth={3} strokeLinecap="round" />
      {/* Jack */}
      <Circle cx={28} cy={104} r={5} fill={DARK} stroke={METAL} strokeWidth={2} />
      {/* Mástil */}
      <Rect x={118} y={58} width={170} height={24} fill={colors.wood} />
      {[134, 150, 165, 179, 192, 205, 217, 229, 240, 251, 261, 271, 280].map((x) => (
        <Line key={x} x1={x} y1={58} x2={x} y2={82} stroke={colors.fret} strokeWidth={1.4} />
      ))}
      {[173, 198, 223, 256].map((x) => (
        <Circle key={x} cx={x} cy={70} r={2.2} fill={colors.inlay} />
      ))}
      {/* Cejuela y clavijero (6 en línea) */}
      <Rect x={286} y={57} width={4} height={26} fill={colors.nut} />
      <Path d="M290 56 L338 50 C348 50 350 58 344 62 L330 84 L290 84 Z" fill={BODY} />
      {[298, 306, 314, 322, 330, 338].map((x, i) => (
        <Circle key={x} cx={x - i * 0.5} cy={50 - i * 0.6} r={3.2} fill={METAL} />
      ))}
      {/* Cuerdas */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Line key={i} x1={41} y1={60 + i * 4} x2={300 + i * 6} y2={60 + i * 4} stroke={colors.stringColor} strokeWidth={1.4 - i * 0.15} />
      ))}
    </G>
  );
}

function Pick({ x, y, rot = 0, scale = 1 }: { x: number; y: number; rot?: number; scale?: number }) {
  return (
    <G rotation={rot} origin={`${x}, ${y}`}>
      <Path
        d={`M${x - 12 * scale} ${y - 10 * scale} C${x - 12 * scale} ${y - 18 * scale} ${x + 12 * scale} ${y - 18 * scale} ${x + 12 * scale} ${y - 10 * scale} L${x} ${y + 12 * scale} Z`}
        fill={colors.accent}
      />
    </G>
  );
}

/** Flecha de dirección de púa: abajo (⊓ en la partitura) o arriba (V). */
function StrokeMark({ x, y, dir }: { x: number; y: number; dir: 'down' | 'up' }) {
  return dir === 'down' ? (
    <Path d={`M${x - 7} ${y + 6} V${y - 6} H${x + 7} V${y + 6}`} fill="none" stroke={colors.gold} strokeWidth={3} strokeLinejoin="round" />
  ) : (
    <Path d={`M${x - 7} ${y - 6} L${x} ${y + 6} L${x + 7} ${y - 6}`} fill="none" stroke={colors.teal} strokeWidth={3} strokeLinejoin="round" />
  );
}

function Arrow({ x1, y1, x2, y2, color }: { x1: number; y1: number; x2: number; y2: number; color: string }) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const h = 8;
  const p1 = `${x2 - h * Math.cos(a - 0.45)},${y2 - h * Math.sin(a - 0.45)}`;
  const p2 = `${x2 - h * Math.cos(a + 0.45)},${y2 - h * Math.sin(a + 0.45)}`;
  return (
    <G>
      <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Polygon points={`${x2},${y2} ${p1} ${p2}`} fill={color} />
    </G>
  );
}

/**
 * Diagrama en grilla, como en los cancioneros: cuerdas verticales (la 6.ª a la
 * izquierda), trastes horizontales, cejuela gruesa arriba (o el número del primer
 * traste si la forma está más arriba), X/O sobre las cuerdas y el dedo en cada
 * punto; la tónica va en otro color. Sirve para acordes, power chords y cajas de
 * escala. No se espeja para zurdos: los cancioneros lo dibujan siempre igual.
 */
function GridDiagramView({ d, callouts = false }: { d: GridDiagram; callouts?: boolean }) {
  const x0 = 150;
  const gap = 26;
  const top = 52;
  // Cuatro trastes, o más si la forma se estira (cajas de escala): la grilla mide siempre lo mismo.
  const lastFret = Math.max(...d.dots.map((x) => x.fret), d.barre?.fret ?? 0);
  const rows = Math.max(4, lastFret - d.startFret + 1);
  const fretH = (34 * 4) / rows;
  const sx = (i: number) => x0 + i * gap;
  const withNut = d.startFret === 1;
  return (
    <G>
      <SvgText x={70} y={118} fontSize={34} fontWeight="900" fill={colors.ink} textAnchor="middle">
        {d.name}
      </SvgText>
      <Rect x={x0} y={top} width={gap * 5} height={fretH * rows} fill={colors.wood} opacity={0.35} />
      {withNut ? (
        <Rect x={x0 - 2} y={top - 5} width={gap * 5 + 4} height={6} fill={colors.nut} />
      ) : (
        <>
          <Line x1={x0} y1={top} x2={x0 + gap * 5} y2={top} stroke={colors.fret} strokeWidth={2} />
          <SvgText x={x0 + gap * 5 + 12} y={top + fretH / 2 + 5} fontSize={13} fontWeight="900" fill={colors.muted}>
            {`${d.startFret}`}
          </SvgText>
        </>
      )}
      {Array.from({ length: rows }, (_, k) => k + 1).map((f) => (
        <Line key={f} x1={x0} y1={top + f * fretH} x2={x0 + gap * 5} y2={top + f * fretH} stroke={colors.fret} strokeWidth={2} />
      ))}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Line key={i} x1={sx(i)} y1={top} x2={sx(i)} y2={top + fretH * rows} stroke={colors.stringColor} strokeWidth={2.6 - i * 0.3} />
      ))}
      {d.marks.map((m, i) =>
        m ? (
          <SvgText key={`m${i}`} x={sx(i)} y={top - 12} fontSize={14} fontWeight="900" fill={m === 'x' ? colors.accent : colors.teal} textAnchor="middle">
            {m === 'x' ? 'X' : 'O'}
          </SvgText>
        ) : null,
      )}
      {d.barre ? (
        // Cejilla: el dedo 1 acostado sobre las cuerdas, en su traste.
        <Rect
          x={sx(d.barre.from) - 11}
          y={top + (d.barre.fret - d.startFret + 0.5) * fretH - 10}
          width={sx(d.barre.to) - sx(d.barre.from) + 22}
          height={20}
          rx={10}
          fill={colors.gold}
          opacity={0.85}
        />
      ) : null}
      {d.dots.map((dot, k) => {
        const cy = top + (dot.fret - d.startFret + 0.5) * fretH;
        return (
          <G key={`d${k}`}>
            <Circle cx={sx(dot.string)} cy={cy} r={10} fill={dot.root ? colors.accent : colors.gold} />
            <SvgText x={sx(dot.string)} y={cy + 4} fontSize={12} fontWeight="900" fill={colors.onAccent} textAnchor="middle">
              {dot.finger}
            </SvgText>
          </G>
        );
      })}
      {[6, 5, 4, 3, 2, 1].map((n, i) => (
        <SvgText key={`n${n}`} x={sx(i)} y={top + fretH * rows + 16} fontSize={10} fontWeight="800" fill={colors.muted} textAnchor="middle">
          {n}
        </SvgText>
      ))}
      {callouts ? (
        <>
          <Callout x={x0 - 24} y={top + fretH * 3} n={1} />
          <Callout x={x0 + gap * 5 + 24} y={top + fretH * 2} n={2} />
          <Callout x={x0 + gap * 5 + 24} y={top - 2} n={3} />
          <Callout x={sx(2) + 22} y={top + 1.5 * fretH} n={4} />
          <Callout x={x0 - 24} y={top - 14} n={5} />
        </>
      ) : null}
    </G>
  );
}

/** Tramo de mástil horizontal (trastes 1–4) que usan las figuras de la mano que pisa. */
function NeckSection() {
  return (
    <G>
      <Rect x={20} y={36} width={320} height={84} fill={colors.wood} />
      <Rect x={20} y={36} width={6} height={84} fill={colors.nut} />
      {[100, 176, 248, 316].map((x) => (
        <Line key={x} x1={x} y1={36} x2={x} y2={120} stroke={colors.fret} strokeWidth={3} />
      ))}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Line key={i} x1={20} y1={44 + i * 14.4} x2={340} y2={44 + i * 14.4} stroke={colors.stringColor} strokeWidth={1.2 + (i * 1.6) / 5} />
      ))}
    </G>
  );
}

function Drawing({ id, left }: { id: Figure; left: boolean }) {
  const { t } = useTranslation();
  switch (id) {
    case 'guitar-parts':
      return (
        <Svg viewBox="0 0 360 130" width="100%" height="100%">
          <G transform={left ? 'translate(360,0) scale(-1,1)' : undefined}>
            <GuitarDrawing />
          </G>
          {/* Los números no se espejan: se ubican sobre el dibujo ya espejado. */}
          {[
            [318, 34, 1],
            [288, 98, 2],
            [210, 98, 3],
            [30, 30, 4],
            [76, 38, 5],
            [100, 92, 6],
            [68, 120, 7],
            [41, 42, 8],
            [14, 110, 9],
          ].map(([x, y, n]) => (
            <Callout key={n} x={left ? 360 - x : x} y={y} n={n} />
          ))}
        </Svg>
      );
    case 'pickup-selector':
      return (
        <Svg viewBox="0 0 360 150" width="100%" height="100%">
          {/* Tres pastillas, de mástil a puente */}
          {[
            [70, 1],
            [150, 2],
            [230, 3],
          ].map(([x, n]) => (
            <G key={n}>
              <Rect x={x - 32} y={20} width={64} height={22} rx={10} fill={DARK} stroke={METAL} strokeWidth={2} />
              {[0, 1, 2, 3, 4, 5].map((k) => (
                <Circle key={k} cx={x - 22 + k * 9} cy={31} r={2.4} fill={METAL} />
              ))}
              <Callout x={x} y={56} n={n} />
            </G>
          ))}
          {/* Selector de 5 posiciones */}
          <Rect x={60} y={84} width={180} height={18} rx={9} fill={colors.raised} stroke={colors.line} strokeWidth={2} />
          {[0, 1, 2, 3, 4].map((k) => (
            <Circle key={k} cx={78 + k * 36} cy={93} r={k === 0 ? 8 : 5} fill={k === 0 ? colors.gold : colors.line} />
          ))}
          {['1', '1+2', '2', '2+3', '3'].map((label, k) => (
            <SvgText key={label} x={78 + k * 36} y={124} fontSize={11} fontWeight="900" fill={colors.ink} textAnchor="middle">
              {label}
            </SvgText>
          ))}
          <Callout x={270} y={93} n={4} />
          <Callout x={300} y={124} n={5} />
        </Svg>
      );
    case 'guitar-knobs':
      return (
        <Svg viewBox="0 0 360 120" width="100%" height="100%">
          <Path d="M20 20 H340 V96 H20 Z" fill={GUARD} opacity={0.1} />
          <Knob x={80} y={56} r={22} value={10} />
          <Knob x={180} y={56} r={22} value={10} />
          <Knob x={280} y={56} r={22} value={10} />
          <Callout x={80} y={104} n={1} />
          <Callout x={180} y={104} n={2} />
          <Callout x={280} y={104} n={3} />
        </Svg>
      );
    case 'amp-panel':
    case 'amp-clean':
    case 'amp-crunch': {
      const gain = id === 'amp-crunch' ? 6 : 2;
      // Rótulos del panel: en todos los idiomas, como vienen serigrafiados en los amplis (en inglés).
      const knobs: [string, number][] = [
        [t('ui.gfig.amp.gain'), id === 'amp-panel' ? 3 : gain],
        [t('ui.gfig.amp.bass'), 5],
        [t('ui.gfig.amp.middle'), 5],
        [t('ui.gfig.amp.treble'), id === 'amp-crunch' ? 6 : 5],
        [t('ui.gfig.amp.volume'), id === 'amp-crunch' ? 3 : 4],
      ];
      return (
        <Svg viewBox="0 0 360 130" width="100%" height="100%">
          <Rect x={8} y={8} width={344} height={114} rx={12} fill={TOLEX} />
          <Rect x={18} y={18} width={324} height={94} rx={8} fill={AMP} stroke={colors.gold} strokeWidth={1.5} />
          {knobs.map(([label, v], k) => (
            <Knob key={label} x={58 + k * 62} y={58} value={v} label={label} />
          ))}
          {id === 'amp-panel' ? (
            [1, 2, 3, 4, 5].map((n, k) => <Callout key={n} x={58 + k * 62} y={20} n={n} />)
          ) : (
            <>
              <Callout x={58} y={20} n={1} />
              <Callout x={306} y={20} n={2} />
            </>
          )}
        </Svg>
      );
    }
    case 'cable-amp':
      return (
        <Svg viewBox="0 0 360 120" width="100%" height="100%">
          <G transform="translate(-10,0) scale(0.55)">
            <GuitarDrawing />
          </G>
          <Path d="M8 58 C-6 100 120 118 230 80 L262 70" fill="none" stroke={DARK} strokeWidth={6} strokeLinecap="round" />
          <Path d="M8 58 C-6 100 120 118 230 80 L262 70" fill="none" stroke={colors.line} strokeWidth={2} strokeLinecap="round" />
          <Rect x={262} y={30} width={88} height={70} rx={8} fill={TOLEX} />
          <Rect x={268} y={36} width={76} height={24} rx={4} fill={AMP} stroke={colors.gold} strokeWidth={1} />
          <Circle cx={278} cy={48} r={4} fill={DARK} stroke={METAL} strokeWidth={1.5} />
          <Knob x={318} y={48} r={7} value={0} />
          <Rect x={268} y={64} width={76} height={30} rx={4} fill="#1A1622" />
          <Callout x={16} y={78} n={1} />
          <Callout x={278} y={18} n={2} />
          <Callout x={318} y={18} n={3} />
        </Svg>
      );
    case 'guitar-tuner':
      return (
        <Svg viewBox="0 -20 360 170" width="100%" height="100%">
          <Path d="M60 110 A120 120 0 0 1 300 110" fill="none" stroke={colors.line} strokeWidth={10} strokeLinecap="round" />
          {/* Zona afinada (±5 cents) en turquesa, arriba del arco */}
          <Path d="M170 -9.6 A120 120 0 0 1 190 -9.6" fill="none" stroke={colors.teal} strokeWidth={10} strokeLinecap="round" />
          <Line x1={180} y1={112} x2={196} y2={14} stroke={colors.accent} strokeWidth={4} strokeLinecap="round" />
          <Circle cx={180} cy={112} r={7} fill={colors.ink} />
          {STRINGS.map((s, k) => (
            <SvgText key={s.id} x={180 + (k - (STRINGS.length - 1) / 2) * 44} y={142} fontSize={16} fontWeight="900" fill={colors.muted} textAnchor="middle">
              {s.id.toUpperCase()}
            </SvgText>
          ))}
        </Svg>
      );
    case 'posture':
      return (
        <Svg viewBox="0 0 360 170" width="100%" height="100%">
          <G transform={left ? 'translate(360,0) scale(-1,1)' : undefined}>
            {/* Silla */}
            <Rect x={110} y={112} width={86} height={8} rx={3} fill={colors.line} />
            <Line x1={118} y1={120} x2={118} y2={164} stroke={colors.line} strokeWidth={5} />
            <Line x1={188} y1={120} x2={188} y2={164} stroke={colors.line} strokeWidth={5} />
            <Line x1={190} y1={112} x2={196} y2={40} stroke={colors.line} strokeWidth={5} />
            {/* Persona (espalda recta, hombros sueltos) */}
            <Circle cx={170} cy={26} r={15} fill="#B07444" />
            <Path d="M160 42 L178 42 L184 110 L150 110 Z" fill="#7A6FA8" />
            <Path d="M150 110 L104 112 L100 160" fill="none" stroke="#7A6FA8" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
            {/* Guitarra apoyada en la pierna, mástil subiendo un poco */}
            <G rotation={-14} origin="120, 96">
              <Ellipse cx={130} cy={98} rx={34} ry={22} fill={BODY} />
              <Rect x={20} y={92} width={92} height={10} rx={3} fill={colors.wood} />
              <Rect x={6} y={89} width={18} height={16} rx={3} fill={BODY} />
            </G>
            {/* Brazo de la púa y mano del mástil */}
            <Path d="M172 50 L150 80 L132 94" fill="none" stroke="#B07444" strokeWidth={8} strokeLinecap="round" />
            <Path d="M162 50 L110 70 L64 80" fill="none" stroke="#B07444" strokeWidth={8} strokeLinecap="round" />
            {/* Guía de espalda recta */}
            <Line x1={198} y1={14} x2={198} y2={110} stroke={colors.teal} strokeWidth={2} strokeDasharray="5 5" />
          </G>
          <Callout x={left ? 360 - 210 : 210} y={30} n={1} />
          <Callout x={left ? 360 - 92 : 92} y={128} n={2} />
          <Callout x={left ? 360 - 60 : 60} y={64} n={3} />
          <Callout x={left ? 360 - 150 : 150} y={140} n={4} />
        </Svg>
      );
    case 'pick-grip':
      return (
        <Svg viewBox="0 0 360 150" width="100%" height="100%">
          <G transform={left ? 'translate(360,0) scale(-1,1)' : undefined}>
            {/* Índice doblado (debajo) */}
            <Path d="M110 40 C150 20 210 30 214 70 C216 92 200 104 184 100 C170 96 172 80 180 74" fill="none" stroke="#B07444" strokeWidth={26} strokeLinecap="round" />
            <Pick x={196} y={98} rot={0} scale={1.6} />
            {/* Pulgar encima, plano */}
            <Path d="M120 104 C150 96 178 92 200 88" fill="none" stroke="#C9874F" strokeWidth={22} strokeLinecap="round" />
            {/* Punta que asoma */}
            <Line x1={232} y1={112} x2={232} y2={126} stroke={colors.teal} strokeWidth={2} />
            <Line x1={226} y1={126} x2={238} y2={126} stroke={colors.teal} strokeWidth={2} />
          </G>
          <Callout x={left ? 360 - 120 : 120} y={130} n={1} />
          <Callout x={left ? 360 - 150 : 150} y={18} n={2} />
          <Callout x={left ? 360 - 254 : 254} y={120} n={3} />
        </Svg>
      );
    case 'pick-down':
    case 'pick-alternate': {
      const alt = id === 'pick-alternate';
      const dirs: ('down' | 'up')[] = alt ? ['down', 'up', 'down', 'up', 'down', 'up', 'down', 'up'] : ['down', 'down', 'down', 'down', 'down', 'down', 'down', 'down'];
      return (
        <Svg viewBox="0 0 360 140" width="100%" height="100%">
          <Line x1={20} y1={78} x2={340} y2={78} stroke={colors.stringColor} strokeWidth={3} />
          <Pick x={60} y={70} scale={1.2} />
          <Arrow x1={92} y1={44} x2={92} y2={108} color={colors.gold} />
          {alt ? <Arrow x1={116} y1={108} x2={116} y2={44} color={colors.teal} /> : null}
          {dirs.map((d, k) => (
            <StrokeMark key={k} x={160 + k * 24} y={30} dir={d} />
          ))}
          {dirs.map((_, k) => (
            <Line key={`n${k}`} x1={160 + k * 24} y1={60} x2={160 + k * 24} y2={96} stroke={colors.muted} strokeWidth={2} />
          ))}
          <Callout x={92} y={124} n={1} />
          <Callout x={alt ? 116 : 250} y={alt ? 124 : 124} n={2} />
        </Svg>
      );
    }
    case 'guitar-strings':
      // Versión compacta para el escenario del cartoon (el diapasón completo no entra).
      return (
        <Svg viewBox="0 0 360 150" width="100%" height="100%">
          <Rect x={40} y={14} width={312} height={122} rx={6} fill={colors.wood} />
          <Rect x={40} y={14} width={6} height={122} fill={colors.nut} />
          {STRINGS.map((s, k) => {
            const y = 24 + (STRINGS.length - 1 - k) * (100 / Math.max(1, STRINGS.length - 1));
            return (
              <G key={s.id}>
                <Line x1={46} y1={y} x2={352} y2={y} stroke={colors.stringColor} strokeWidth={3.2 - (k * 2) / Math.max(1, STRINGS.length - 1)} />
                <Circle cx={22} cy={y} r={10} fill={colors.teal} />
                <SvgText x={22} y={y + 4} fontSize={11} fontWeight="900" fill={colors.onTeal} textAnchor="middle">
                  {s.number}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      );
    case 'fret-hand': {
      const mirror = (x: number) => (left ? 360 - x : x);
      // Cada dedo pisa justo detrás de su traste (del lado de la cejuela).
      const fretCenters = [88, 164, 236, 304];
      return (
        <Svg viewBox="0 0 360 150" width="100%" height="100%">
          <G transform={left ? 'translate(360,0) scale(-1,1)' : undefined}>
            <NeckSection />
            {/* Pulgar detrás del mástil, a la altura del dedo 2 */}
            <Ellipse cx={150} cy={134} rx={34} ry={10} fill="#C9874F" opacity={0.85} />
          </G>
          {fretCenters.map((x, i) => (
            <G key={x}>
              <Circle cx={mirror(x)} cy={116} r={12} fill={colors.gold} />
              <SvgText x={mirror(x)} y={120} fontSize={13} fontWeight="900" fill={colors.onAccent} textAnchor="middle">
                {i + 1}
              </SvgText>
            </G>
          ))}
          <Callout x={mirror(196)} y={140} n={5} />
          {[1, 2, 3, 4].map((n, i) => (
            <SvgText key={n} x={mirror(fretCenters[i])} y={26} fontSize={11} fontWeight="800" fill={colors.muted} textAnchor="middle">
              {n}
            </SvgText>
          ))}
        </Svg>
      );
    }
    case 'hammer-on':
    case 'pull-off':
    case 'slide':
    case 'bend':
    case 'vibrato':
    case 'tapping': {
      // Tramo de mástil con la 3.ª cuerda (Sol) resaltada: y = 44 + 2 · 14,4. El tapping se enseña en la 1.ª (y = 44).
      const yG = id === 'tapping' ? 44 : 72.8;
      const m = (x: number) => (left ? 360 - x : x);
      const finger = (x: number, label: string, ghost = false) => (
        <G>
          <Circle cx={m(x)} cy={yG} r={11} fill={ghost ? 'none' : colors.gold} stroke={colors.gold} strokeWidth={2} strokeDasharray={ghost ? '4 3' : undefined} />
          <SvgText x={m(x)} y={yG + 4} fontSize={12} fontWeight="900" fill={ghost ? colors.gold : colors.onAccent} textAnchor="middle">
            {label}
          </SvgText>
        </G>
      );
      return (
        <Svg viewBox="0 0 360 150" width="100%" height="100%">
          <G transform={left ? 'translate(360,0) scale(-1,1)' : undefined}>
            <NeckSection />
            {id === 'bend' ? (
              <Path d={`M20 ${yG} L200 ${yG} Q236 ${yG + 26} 270 ${yG} L340 ${yG}`} fill="none" stroke={colors.accent} strokeWidth={2.4} />
            ) : (
              <Line x1={20} y1={yG} x2={340} y2={yG} stroke={colors.accent} strokeWidth={2.4} />
            )}
          </G>
          {id === 'hammer-on' ? (
            <>
              {finger(88, '1')}
              {finger(236, '3', true)}
              <Arrow x1={m(236)} y1={14} x2={m(236)} y2={yG - 14} color={colors.teal} />
              <Callout x={m(88)} y={yG + 26} n={1} />
              <Callout x={m(266)} y={22} n={2} />
            </>
          ) : null}
          {id === 'pull-off' ? (
            <>
              {finger(88, '1')}
              {finger(236, '3')}
              <Path d={`M${m(236)} ${yG - 14} Q${m(250)} ${yG - 40} ${m(286)} ${yG - 46}`} fill="none" stroke={colors.teal} strokeWidth={3} />
              <Polygon points={`${m(290)},${yG - 47} ${m(280)},${yG - 52} ${m(281)},${yG - 40}`} fill={colors.teal} />
              <Callout x={m(88)} y={yG + 26} n={1} />
              <Callout x={m(300)} y={yG - 30} n={2} />
            </>
          ) : null}
          {id === 'slide' ? (
            <>
              {finger(88, '1')}
              {finger(236, '1', true)}
              <Arrow x1={m(104)} y1={yG + 22} x2={m(220)} y2={yG + 22} color={colors.teal} />
              <Callout x={m(88)} y={20} n={1} />
              <Callout x={m(236)} y={20} n={2} />
            </>
          ) : null}
          {id === 'bend' ? (
            <>
              <Circle cx={m(236)} cy={yG + 22} r={11} fill={colors.gold} />
              <SvgText x={m(236)} y={yG + 26} fontSize={12} fontWeight="900" fill={colors.onAccent} textAnchor="middle">
                3
              </SvgText>
              <Circle cx={m(164)} cy={yG + 22} r={9} fill={colors.gold} opacity={0.6} />
              <Circle cx={m(98)} cy={yG + 22} r={9} fill={colors.gold} opacity={0.6} />
              <Arrow x1={m(256)} y1={yG} x2={m(256)} y2={yG + 36} color={colors.teal} />
              <Callout x={m(130)} y={yG + 50} n={1} />
              <Callout x={m(278)} y={yG + 30} n={2} />
              <Callout x={m(236)} y={20} n={3} />
            </>
          ) : null}
          {id === 'tapping' ? (
            <>
              {finger(88, '1')}
              {finger(160, '4')}
              {/* Dedo de la mano de la púa, más arriba en el mástil. */}
              <Circle cx={m(290)} cy={yG} r={11} fill={colors.teal} />
              <Arrow x1={m(290)} y1={14} x2={m(290)} y2={yG - 14} color={colors.teal} />
              <Path d={`M${m(290)} ${yG + 14} Q${m(250)} ${yG + 44} ${m(104)} ${yG + 22}`} fill="none" stroke={colors.teal} strokeWidth={2.4} strokeDasharray="5 4" />
              <Callout x={m(318)} y={24} n={1} />
              <Callout x={m(124)} y={yG + 44} n={2} />
            </>
          ) : null}
          {id === 'vibrato' ? (
            <>
              {finger(236, '3')}
              <Path
                d={`M${m(150)} 22 ${Array.from({ length: 8 }, (_, k) => `Q${m(150 + k * 20 + 5)} ${k % 2 ? 32 : 12} ${m(150 + (k + 1) * 20)} 22`).join(' ')}`}
                fill="none"
                stroke={colors.teal}
                strokeWidth={2.6}
              />
              <Callout x={m(236)} y={yG + 26} n={1} />
              <Callout x={m(130)} y={22} n={2} />
            </>
          ) : null}
        </Svg>
      );
    }
    case 'mute-fret-hand':
      return (
        <Svg viewBox="0 0 360 140" width="100%" height="100%">
          <G transform={left ? 'translate(360,0) scale(-1,1)' : undefined}>
            <NeckSection />
            {/* Dedo apoyado sin apretar, a lo ancho de las cuerdas */}
            <Rect x={196} y={34} width={30} height={90} rx={15} fill="#C9874F" opacity={0.7} />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <SvgText key={i} x={300} y={48 + i * 14.4} fontSize={12} fontWeight="900" fill={colors.accent} textAnchor="middle">
                ×
              </SvgText>
            ))}
          </G>
          <Callout x={left ? 360 - 211 : 211} y={20} n={1} />
          <Callout x={left ? 360 - 300 : 300} y={132} n={2} />
        </Svg>
      );
    case 'mute-pick-hand':
    case 'palm-mute':
      // Misma posición de la mano: para apagar se apoya más; para palm mute, apenas sobre el puente.
      return (
        <Svg viewBox="0 0 360 140" width="100%" height="100%">
          <G transform={left ? 'translate(360,0) scale(-1,1)' : undefined}>
            <Rect x={0} y={20} width={360} height={110} fill={BODY} />
            <Rect x={250} y={34} width={22} height={84} rx={3} fill={METAL} />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Line key={i} x1={0} y1={44 + i * 14.4} x2={262} y2={44 + i * 14.4} stroke={colors.stringColor} strokeWidth={2.8 - (i * 1.6) / 5} />
            ))}
            {/* Canto de la palma sobre las cuerdas graves, justo antes del puente */}
            <Path d="M200 40 C230 34 252 50 250 80 C248 102 228 112 210 106 C196 100 190 60 200 40 Z" fill="#C9874F" opacity={0.85} />
            <Pick x={170} y={100} scale={1} />
          </G>
          <Callout x={left ? 360 - 222 : 222} y={22} n={1} />
          <Callout x={left ? 360 - 120 : 120} y={22} n={2} />
        </Svg>
      );
    case 'fx-chain': {
      // De la guitarra al ampli: afinador, wah, ganancia, modulación, delay y reverb.
      const pedalColors = [colors.muted, colors.teal, colors.accent, colors.gold, colors.fingerI, colors.tealShadow];
      return (
        <Svg viewBox="0 0 360 120" width="100%" height="100%">
          <Line x1={6} y1={60} x2={354} y2={60} stroke={colors.ink} strokeWidth={2.4} />
          <Polygon points="354,60 344,54 344,66" fill={colors.ink} />
          {pedalColors.map((c, k) => (
            <G key={k}>
              <Rect x={14 + k * 56} y={34} width={46} height={58} rx={8} fill={c} />
              <Circle cx={37 + k * 56} cy={50} r={6} fill={DARK} />
              <Circle cx={37 + k * 56} cy={78} r={8} fill={METAL} />
              <Callout x={37 + k * 56} y={18} n={k + 1} />
            </G>
          ))}
        </Svg>
      );
    }
    case 'fx-drive':
    case 'fx-delay': {
      // Rótulos como vienen serigrafiados en los pedales (en inglés).
      const knobs = id === 'fx-drive' ? (['gain', 'tone', 'level'] as const) : (['time', 'feedback', 'mix'] as const);
      const values = id === 'fx-drive' ? [6, 5, 5] : [4, 3, 3];
      return (
        <Svg viewBox="0 0 360 130" width="100%" height="100%">
          {/* Cuerpo oscuro para que los rótulos claros tengan contraste; el borde da el color del pedal. */}
          <Rect x={80} y={6} width={200} height={118} rx={14} fill={colors.raised} stroke={id === 'fx-drive' ? colors.accent : colors.fingerI} strokeWidth={4} />
          {knobs.map((key, k) => (
            <G key={key}>
              <Knob x={120 + k * 60} y={42} value={values[k]} label={t(`ui.gfig.fxk.${key}`)} />
              <Callout x={120 + k * 60 + 24} y={20} n={k + 1} />
            </G>
          ))}
          <Circle cx={180} cy={102} r={13} fill={METAL} stroke={DARK} strokeWidth={2} />
        </Svg>
      );
    }
    case 'chord-diagram-how':
      return (
        <Svg viewBox="0 0 360 216" width="100%" height="100%">
          <GridDiagramView d={chordDiagram('Em')} callouts />
        </Svg>
      );
    case 'string-crossing':
      return (
        <Svg viewBox="0 0 360 150" width="100%" height="100%">
          {STRINGS.map((s, k) => {
            const y = 24 + (STRINGS.length - 1 - k) * (100 / Math.max(1, STRINGS.length - 1));
            return (
              <G key={s.id}>
                <Line x1={44} y1={y} x2={340} y2={y} stroke={colors.stringColor} strokeWidth={3.2 - (k * 2) / Math.max(1, STRINGS.length - 1)} />
                <SvgText x={22} y={y + 4} fontSize={12} fontWeight="900" fill={colors.muted} textAnchor="middle">
                  {s.number}
                </SvgText>
              </G>
            );
          })}
          <Path d="M110 124 C130 100 140 90 150 84 C170 70 180 60 200 50" fill="none" stroke={colors.gold} strokeWidth={3} strokeDasharray="6 5" />
          <Pick x={210} y={44} scale={1} />
          <Callout x={110} y={140} n={1} />
          <Callout x={240} y={44} n={2} />
        </Svg>
      );
    default: {
      const diagram = CHORD_FIGURES[id];
      return diagram ? (
        <Svg viewBox="0 0 360 216" width="100%" height="100%">
          <GridDiagramView d={diagramOf(diagram)} />
        </Svg>
      ) : null;
    }
  }
}

/**
 * Solo el dibujo (sin leyenda). `compact` lo usa el reproductor de cartoons: las
 * cuerdas se dibujan sin el diapasón completo para que entren en el escenario.
 */
export function GuitarDrawingFor({ id, width, leftHanded, compact = false }: { id: Figure; width: number; leftHanded: boolean; compact?: boolean }) {
  if (id === 'guitar-strings' && !compact) {
    return (
      <Fretboard
        width={width}
        frets={3}
        leftHanded={leftHanded}
        dots={STRINGS.map((s) => ({ string: s.id, fret: 0, label: String(s.number) }))}
      />
    );
  }
  const ratio = RATIO[id] ?? 0.4;
  return (
    <View style={{ width, height: width * ratio }}>
      <Drawing id={id} left={leftHanded} />
    </View>
  );
}

/** Figura completa de una tarjeta: dibujo y leyenda numerada. */
export function GuitarFigure({ id, width, leftHanded }: { id: Figure; width: number; leftHanded: boolean }) {
  const { t } = useTranslation();
  const count = LEGEND_COUNT[id] ?? 0;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={t(`ui.gfig.${id.replace(/-/g, '_')}.a11y`)} style={{ gap: 10 }}>
      <GuitarDrawingFor id={id} width={width} leftHanded={leftHanded} />
      {count > 0 ? (
        <View style={{ gap: 4 }}>
          {Array.from({ length: count }, (_, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '900', color: colors.onAccent }}>{i + 1}</Text>
              </View>
              <Text style={{ flex: 1, fontSize: 14, lineHeight: 20, color: colors.ink }}>{t(`ui.gfig.${id.replace(/-/g, '_')}.l${i + 1}`)}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
