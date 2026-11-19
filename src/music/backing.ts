/**
 * Acompañamiento sintetizado (lógica pura): batería y teclado que tocan con el
 * alumno según el cifrado y el estilo. Sin grabaciones: la app lo genera.
 */

export type BackingStyle = 'rock' | 'pop' | 'ballad' | 'blues' | 'reggae' | 'bossa' | 'soul' | 'funk';
export type DrumKind = 'kick' | 'snare' | 'hat' | 'rim';

export const BACKING_STYLES: BackingStyle[] = ['rock', 'pop', 'ballad', 'blues', 'reggae', 'bossa', 'soul', 'funk'];

const PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export interface ParsedChord {
  root: number;
  /** Intervalos desde la raíz (semitonos). */
  intervals: number[];
  /** Nota del bajo si es una inversión (C/E), como clase de altura. */
  bass?: number;
}

const QUALITIES: [RegExp, number[]][] = [
  [/^maj7/, [0, 4, 7, 11]],
  [/^m7b5|^ø/, [0, 3, 6, 10]],
  [/^m7/, [0, 3, 7, 10]],
  [/^m/, [0, 3, 7]],
  [/^dim/, [0, 3, 6]],
  [/^7/, [0, 4, 7, 10]],
  [/^5/, [0, 7]],
  [/^sus4/, [0, 5, 7]],
  [/^/, [0, 4, 7]],
];

function pitchClass(name: string): number | null {
  const m = /^([A-G])([#♯b♭]?)/.exec(name);
  if (!m) return null;
  const acc = m[2] === '#' || m[2] === '♯' ? 1 : m[2] === 'b' || m[2] === '♭' ? -1 : 0;
  return (PC[m[1]] + acc + 12) % 12;
}

/** «Am7», «G/B», «F#m», «Bb7» → raíz, intervalos y bajo. */
export function parseChord(symbol: string): ParsedChord | null {
  const [main, bassName] = symbol.trim().split('/');
  const root = pitchClass(main);
  if (root === null) return null;
  const rest = main.replace(/^[A-G][#♯b♭]?/, '');
  const intervals = QUALITIES.find(([re]) => re.test(rest))![1];
  const bass = bassName ? pitchClass(bassName) ?? undefined : undefined;
  return { root, intervals, bass };
}

/**
 * Voces del teclado: las notas del acorde en registro medio (cerca de `center`),
 * lejos del registro del bajo para no taparlo ni confundir al micrófono.
 */
export function voiceChord(chord: ParsedChord, center = 62): number[] {
  return chord.intervals
    .map((iv) => {
      const pc = (chord.root + iv) % 12;
      // La nota de esa clase más cercana al centro, entre center-6 y center+5.
      return center - 6 + ((((pc - (center - 6)) % 12) + 12) % 12);
    })
    .sort((a, b) => a - b);
}

export interface DrumHit {
  beat: number;
  kind: DrumKind;
}

/** Un compás de 4/4 de batería por estilo (pulsos desde 0). */
export function drumBar(style: BackingStyle): DrumHit[] {
  const eighths = (kind: DrumKind) => [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].map((beat) => ({ beat, kind }));
  switch (style) {
    case 'rock':
      return [...eighths('hat'), { beat: 0, kind: 'kick' }, { beat: 2, kind: 'kick' }, { beat: 2.5, kind: 'kick' }, { beat: 1, kind: 'snare' }, { beat: 3, kind: 'snare' }];
    case 'pop':
    case 'soul':
      return [...eighths('hat'), { beat: 0, kind: 'kick' }, { beat: 1.5, kind: 'kick' }, { beat: 2, kind: 'kick' }, { beat: 1, kind: 'snare' }, { beat: 3, kind: 'snare' }];
    case 'funk':
      return [
        ...[0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75].map((beat) => ({ beat, kind: 'hat' as const })),
        { beat: 0, kind: 'kick' },
        { beat: 0.75, kind: 'kick' },
        { beat: 2.5, kind: 'kick' },
        { beat: 1, kind: 'snare' },
        { beat: 3, kind: 'snare' },
      ];
    case 'ballad':
      return [{ beat: 0, kind: 'kick' }, { beat: 2, kind: 'snare' }, ...[0, 1, 2, 3].map((beat) => ({ beat, kind: 'hat' as const }))];
    case 'blues':
      // Shuffle: corchea larga y corta (tresillo 2+1).
      return [
        ...[0, 2 / 3, 1, 5 / 3, 2, 8 / 3, 3, 11 / 3].map((beat) => ({ beat, kind: 'hat' as const })),
        { beat: 0, kind: 'kick' },
        { beat: 2, kind: 'kick' },
        { beat: 1, kind: 'snare' },
        { beat: 3, kind: 'snare' },
      ];
    case 'reggae':
      // One drop: el uno vacío; bombo y caja juntos en el 3.
      return [...eighths('hat').filter((h) => h.beat !== 0), { beat: 2, kind: 'kick' }, { beat: 2, kind: 'rim' }];
    case 'bossa':
      return [
        { beat: 0, kind: 'kick' },
        { beat: 1.5, kind: 'kick' },
        { beat: 2, kind: 'kick' },
        { beat: 3.5, kind: 'kick' },
        ...[0, 0.75, 1.5, 2.5, 3].map((beat) => ({ beat, kind: 'rim' as const })),
        ...eighths('hat'),
      ];
  }
}

export interface CompHit {
  beat: number;
  beats: number;
}

/** Ritmo del teclado en un compás, por estilo. */
export function compBar(style: BackingStyle): CompHit[] {
  switch (style) {
    case 'reggae':
      // Skank: acordes cortos en el «y» de cada tiempo.
      return [0.5, 1.5, 2.5, 3.5].map((beat) => ({ beat, beats: 0.25 }));
    case 'ballad':
      return [{ beat: 0, beats: 4 }];
    case 'bossa':
      return [0, 1.5, 2.5, 3.5].map((beat) => ({ beat, beats: 0.5 }));
    case 'funk':
      return [0.5, 1.75, 2.5, 3.25].map((beat) => ({ beat, beats: 0.25 }));
    case 'blues':
      return [0, 1, 2, 3].map((beat) => ({ beat, beats: 0.6 }));
    case 'rock':
      return [{ beat: 0, beats: 2 }, { beat: 2, beats: 2 }];
    case 'pop':
    case 'soul':
      return [{ beat: 0, beats: 1.5 }, { beat: 1.5, beats: 1 }, { beat: 2.5, beats: 1.5 }];
  }
}

export interface BackingOptions {
  /** Un símbolo por compás; dos separados por espacio cambian en el tercer tiempo. */
  chords: string[];
  bpm: number;
  style: BackingStyle;
  drums: boolean;
  keys: boolean;
  /** Clic de metrónomo en cada pulso, además del acompañamiento. */
  click: boolean;
  /** Pulsos de cuenta antes del primer compás (palitos de la batería). */
  countIn?: number;
}

export interface BackingSchedule {
  drums: { timeSec: number; kind: DrumKind }[];
  keys: { timeSec: number; durSec: number; midis: number[] }[];
  clicks: { timeSec: number; accent: boolean }[];
  /** Segundo en que empieza el compás 1 (después de la cuenta). */
  startSec: number;
  lengthSec: number;
}

/** Programa completo del acompañamiento, en segundos desde el inicio. */
export function backingSchedule(o: BackingOptions): BackingSchedule {
  const beat = 60 / o.bpm;
  const countIn = o.countIn ?? 4;
  const startSec = countIn * beat;
  const drums: BackingSchedule['drums'] = [];
  const keys: BackingSchedule['keys'] = [];
  const clicks: BackingSchedule['clicks'] = [];
  // Cuenta: siempre suena (palitos), haya o no batería.
  for (let i = 0; i < countIn; i++) clicks.push({ timeSec: i * beat, accent: i === 0 });
  o.chords.forEach((symbol, bar) => {
    const barStart = startSec + bar * 4 * beat;
    if (o.drums) for (const h of drumBar(o.style)) drums.push({ timeSec: barStart + h.beat * beat, kind: h.kind });
    if (o.click) for (let b = 0; b < 4; b++) clicks.push({ timeSec: barStart + b * beat, accent: b === 0 });
    if (o.keys) {
      const parts = symbol.split(' ').filter(Boolean);
      for (const hit of compBar(o.style)) {
        // Con dos acordes en el compás, el segundo entra en el tercer tiempo.
        const sym = parts.length > 1 && hit.beat >= 2 ? parts[1] : parts[0];
        const chord = parseChord(sym);
        if (!chord) continue;
        keys.push({ timeSec: barStart + hit.beat * beat, durSec: hit.beats * beat * 0.92, midis: voiceChord(chord) });
      }
    }
  });
  drums.sort((a, b) => a.timeSec - b.timeSec);
  return { drums, keys, clicks, startSec, lengthSec: startSec + o.chords.length * 4 * beat };
}
