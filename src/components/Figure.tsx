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
import type { Figure as FigureId } from '../content/types';
import type { Locale } from '../music/notes';

/**
 * Ilustración de una tarjeta. Los diagramas de diapasón se dibujan en código;
 * las ilustraciones a mano (partes del bajo, manos) llegan como SVG del ilustrador
 * y se muestran aquí mismo. Mientras tanto, un marcador con Kordi.
 */
export function Figure({ id, width }: { id: FigureId; width: number }) {
  const { t, i18n } = useTranslation();
  const { notation, hand } = useSettings();
  const locale = i18n.language as Locale;
  const left = hand === 'left';

  if (isGuitarFigure(id)) return <GuitarFigure id={id} width={width} leftHanded={left} />;
  switch (id) {
    case 'tuner':
      // El afinador sirve igual para los dos instrumentos: muestra las cuerdas de esta build.
      return <GuitarFigure id="guitar-tuner" width={width} leftHanded={left} />;
    case 'bass-clef':
      return <Staff events={[]} width={width} highlightLine={6} accessibilityLabel={t('ui.figure.bassClef')} />;
    case 'fretboard-1234':
      return (
        <Fretboard
          width={width}
          frets={5}
          leftHanded={left}
          showNoteNames={{ locale, notation }}
          dots={[1, 2, 3, 4].map((f) => ({ string: 'E' as const, fret: f, label: String(f) }))}
        />
      );
    case 'strings':
      return (
        <Fretboard
          width={width}
          frets={3}
          leftHanded={left}
          dots={(['E', 'A', 'D', 'G'] as const).map((s, i) => ({ string: s, fret: 0, label: String(4 - i) }))}
        />
      );
    case 'fret5':
      return (
        <Fretboard
          width={width}
          frets={5}
          leftHanded={left}
          showNoteNames={{ locale, notation }}
          dots={[
            { string: 'E', fret: 5, label: '5', color: colors.accent },
            { string: 'A', fret: 5, label: '5', color: colors.accent },
            { string: 'D', fret: 5, label: '5', color: colors.accent },
          ]}
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
