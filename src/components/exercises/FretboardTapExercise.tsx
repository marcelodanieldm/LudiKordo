import React, { useState } from 'react';
import { View } from 'react-native';
import { Text } from '../Text';
import { useTranslation } from 'react-i18next';
import { Fretboard } from '../Fretboard';
import { Button } from '../ui';
import { playTone } from '../../audio/engine';
import { midiAt, midiToFreq, type StringId } from '../../music/notes';
import { starsFor } from '../../music/scoring';
import { useSettings } from '../../state/settings';
import { colors, fonts } from '../../theme';
import type { FretboardTapExercise as FbEx } from '../../content/types';

/** Tocar en orden las notas de una secuencia sobre el diapasón virtual. Suena cada nota. */
export function FretboardTapExercise({ exercise, onDone, width, mastery }: { exercise: FbEx; onDone: (stars: number) => void; width: number; mastery: number }) {
  const { t } = useTranslation();
  const hand = useSettings((s) => s.hand);
  const [pos, setPos] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [flash, setFlash] = useState<{ string: StringId; fret: number } | null>(null);
  const done = pos >= exercise.sequence.length;

  const onTap = (string: StringId, fret: number) => {
    if (done) return;
    void playTone(midiToFreq(midiAt(string, fret)), 0.6);
    const target = exercise.sequence[pos];
    if (target.string === string && target.fret === fret) {
      setPos((p) => p + 1);
      setFlash(null);
    } else {
      setMistakes((m) => m + 1);
      setFlash({ string, fret });
    }
  };

  const accuracy = exercise.sequence.length / (exercise.sequence.length + mistakes);
  const dots = [
    ...exercise.sequence.slice(0, pos).map((n, i) => ({ ...n, label: String(i + 1), color: colors.teal, labelColor: colors.onTeal })),
    ...(done ? [] : [{ ...exercise.sequence[pos], label: '?', color: colors.accent, glow: true }]),
    ...(flash ? [{ ...flash, label: '×', color: colors.danger }] : []),
  ];

  return (
    <View style={{ gap: 14 }}>
      <Text style={{ fontFamily: fonts.display, fontSize: 24, lineHeight: 30, color: colors.ink }}>{t(exercise.promptKey)}</Text>
      <Text style={{ color: colors.muted }}>{t('ui.exercise.fretboardHint')}</Text>
      <Fretboard width={width} frets={exercise.frets} leftHanded={hand === 'left'} dots={dots} onTap={onTap} />
      <Button label={t('ui.common.next')} disabled={!done} onPress={() => onDone(starsFor(accuracy, mastery))} />
    </View>
  );
}
