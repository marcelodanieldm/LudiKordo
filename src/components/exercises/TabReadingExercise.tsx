import React, { useState } from 'react';
import { View } from 'react-native';
import { Text } from '../Text';
import { useTranslation } from 'react-i18next';
import { Fretboard } from '../Fretboard';
import { TabStaff } from '../TabStaff';
import { Button, Muted, Stars } from '../ui';
import { playTone } from '../../audio/engine';
import { midiAt, midiToFreq, type StringId } from '../../music/notes';
import { countFor, figureOf, placeNotes } from '../../music/tab';
import { starsFor } from '../../music/scoring';
import { useSettings } from '../../state/settings';
import { colors, fonts } from '../../theme';
import type { TabReadingExercise as TabEx } from '../../content/types';

/** Duración de un pulso al hacer sonar cada nota (60 bpm): la redonda dura 4 veces la negra. */
const BEAT_SEC = 0.5;

/**
 * Leer tablatura: la nota marcada se toca en el diapasón virtual (cuerda y
 * traste) y suena con su duración, para relacionar la figura con lo que dura.
 */
export function TabReadingExercise({ exercise, onDone, width, mastery }: { exercise: TabEx; onDone: (stars: number) => void; width: number; mastery: number }) {
  const { t } = useTranslation();
  const hand = useSettings((s) => s.hand);
  const [pos, setPos] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [flash, setFlash] = useState<{ string: StringId; fret: number } | null>(null);
  const placed = placeNotes(exercise.notes);
  const done = pos >= placed.length;
  const current = placed[pos];
  const stars = starsFor(placed.length / (placed.length + mistakes), mastery);

  const onTap = (string: StringId, fret: number) => {
    if (done) return;
    const ok = current.string === string && current.fret === fret;
    void playTone(midiToFreq(midiAt(string, fret)), ok ? current.beats * BEAT_SEC : 0.4);
    if (ok) {
      setPos((p) => p + 1);
      setFlash(null);
    } else {
      setMistakes((m) => m + 1);
      setFlash({ string, fret });
    }
  };

  return (
    <View style={{ gap: 14 }}>
      <Text style={{ fontFamily: fonts.display, fontSize: 24, lineHeight: 30 }}>{t(exercise.promptKey)}</Text>
      <Muted>{t('ui.exercise.tabHint')}</Muted>
      <TabStaff notes={exercise.notes} width={width} current={pos} />
      <Text accessibilityLiveRegion="polite" style={{ fontSize: 15, fontWeight: '800', color: done ? colors.teal : colors.accentInk, minHeight: 22 }}>
        {done
          ? t('ui.exercise.tabDone', { count: mistakes })
          : t('ui.exercise.tabNow', {
              figure: t(`ui.exercise.figure.${figureOf(current.beats)}`),
              count: countFor(current).join(' '),
            })}
      </Text>
      <Fretboard
        width={width}
        frets={exercise.frets}
        openStrings
        leftHanded={hand === 'left'}
        dots={flash ? [{ ...flash, label: '×', color: colors.danger }] : []}
        onTap={onTap}
      />
      {done ? (
        <View style={{ alignItems: 'center' }}>
          <Stars count={stars} size={36} />
        </View>
      ) : null}
      <Button label={t('ui.common.next')} disabled={!done} onPress={() => onDone(stars)} />
    </View>
  );
}
