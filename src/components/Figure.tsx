import React from 'react';
import { View } from 'react-native';
import { Text } from './Text';
import { useTranslation } from 'react-i18next';
import { Fretboard } from './Fretboard';
import { Staff } from './Staff';
import { Kordi } from './Kordi';
import { GuitarFigure, isGuitarFigure } from './GuitarFigures';
import { colors } from '../theme';
import { useSettings } from '../state/settings';
import type { Figure as FigureId, FigureMotion, MotionStep } from '../content/types';
import { LeftHandFigure, RightHandFigure } from './HandFigures';
import { motionPositions } from '../music/motion';
import { STRINGS, noteName, type Locale } from '../music/notes';

/**
 * Ilustración de una tarjeta. Los diagramas de diapasón se dibujan en código;
 * las ilustraciones a mano (partes del bajo, manos) llegan como SVG del ilustrador
 * y se muestran aquí mismo. Mientras tanto, un marcador con Kordi.
 */
export function Figure({ id, width, step, motion }: { id: FigureId; width: number; step?: MotionStep; motion?: FigureMotion }) {
  const { t, i18n } = useTranslation();
  const { notation, hand } = useSettings();
  const locale = i18n.language as Locale;
  const left = hand === 'left';

  if (isGuitarFigure(id)) return <GuitarFigure id={id} width={width} leftHanded={left} />;
  // Con movimiento, el diapasón marca todas las posiciones del recorrido y resalta la que suena.
  const moving = motion ? motionPositions(motion) : null;
  const activeKey = step?.note ? `${step.note.string}${step.note.fret}` : '';
  const motionDots = moving?.map((p) => ({
    string: p.string,
    fret: p.fret,
    label: p.fret === 0 ? undefined : String(p.fret),
    color: `${p.string}${p.fret}` === activeKey ? colors.gold : colors.raised,
    labelColor: `${p.string}${p.fret}` === activeKey ? colors.onAccent : colors.ink,
  }));
  switch (id) {
    case 'right-hand':
      return <RightHandFigure width={width} step={step} leftHanded={left} />;
    case 'left-hand':
      return <LeftHandFigure width={width} step={step} leftHanded={left} labels={{ ok: t('ui.motion.ok'), onFret: t('ui.motion.onFret'), middle: t('ui.motion.middle') }} />;
    case 'tuner':
      // El afinador sirve igual para los dos instrumentos: muestra las cuerdas de esta build.
      return <GuitarFigure id="guitar-tuner" width={width} leftHanded={left} />;
    case 'bass-clef':
      return <Staff events={[]} width={width} highlightLine={6} accessibilityLabel={t('ui.figure.bassClef')} />;
    case 'naturals-6':
    case 'naturals-5': {
      // Notas naturales (sin sostenidos) en la cuerda grave, hasta el traste 12.
      const string = id === 'naturals-6' ? 'E' : 'A';
      const open = STRINGS.find((x) => x.id === string)?.openMidi ?? 40;
      const naturals = Array.from({ length: 13 }, (_, f) => f).filter((f) => [0, 2, 4, 5, 7, 9, 11].includes((open + f) % 12));
      return (
        <Fretboard
          width={width}
          frets={12}
          leftHanded={left}
          dots={naturals.map((f) => ({ string, fret: f, label: noteName(open + f, locale, notation === 'both' ? 'solfege' : notation).slice(0, 3), color: (open + f) % 12 === open % 12 ? colors.accent : undefined }))}
        />
      );
    }
    case 'fretboard-1234':
      return (
        <Fretboard
          width={width}
          frets={5}
          leftHanded={left}
          showNoteNames={{ locale, notation }}
          dots={motionDots ?? [1, 2, 3, 4].map((f) => ({ string: 'E' as const, fret: f, label: String(f) }))}
        />
      );
    case 'strings':
      return (
        <Fretboard
          width={width}
          frets={3}
          leftHanded={left}
          dots={
            motionDots
              ? (['E', 'A', 'D', 'G'] as const).map((s, i) => ({ string: s, fret: 0, label: String(4 - i), color: `${s}0` === activeKey ? colors.gold : undefined }))
              : (['E', 'A', 'D', 'G'] as const).map((s, i) => ({ string: s, fret: 0, label: String(4 - i) }))
          }
        />
      );
    case 'fret5':
      return (
        <Fretboard
          width={width}
          frets={5}
          leftHanded={left}
          showNoteNames={{ locale, notation }}
          dots={
            motionDots ?? [
              { string: 'E', fret: 5, label: '5', color: colors.accent },
              { string: 'A', fret: 5, label: '5', color: colors.accent },
              { string: 'D', fret: 5, label: '5', color: colors.accent },
            ]
          }
        />
      );
    default:
      return (
        <View style={{ alignItems: 'center', gap: 6, paddingVertical: 8 }}>
          <Kordi size={96} />
          <Text style={{ color: colors.muted, fontSize: 12 }}>[{id}]</Text>
        </View>
      );
  }
}
