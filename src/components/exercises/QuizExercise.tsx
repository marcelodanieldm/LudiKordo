import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../Text';
import { useTranslation } from 'react-i18next';
import { optionLabel } from '../../i18n';
import { useSettings } from '../../state/settings';
import type { Locale } from '../../music/notes';
import { playTones } from '../../audio/engine';
import { Button } from '../ui';
import { colors, radius, fonts } from '../../theme';
import type { QuizExercise as Quiz } from '../../content/types';

/** Opción múltiple y ejercicios de oído (con tonos de referencia). */
export function QuizExercise({ exercise, onDone }: { exercise: Quiz; onDone: (stars: number) => void }) {
  const { t, i18n } = useTranslation();
  const notation = useSettings((st) => st.notation);
  const note = { locale: (['en', 'es', 'pt'].includes(i18n.language) ? i18n.language : 'en') as Locale, notation };
  const [picked, setPicked] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const correct = picked === exercise.correctIndex;

  useEffect(() => {
    if (exercise.tones) void playTones(exercise.tones);
  }, [exercise]);

  const pick = (i: number) => {
    if (correct) return;
    setPicked(i);
    setAttempts((a) => a + 1);
  };

  // Primera respuesta correcta = 3 estrellas; una equivocación = 2; más = 1.
  const stars = attempts <= 1 ? 3 : attempts === 2 ? 2 : 1;

  return (
    <View style={{ gap: 14 }}>
      <Text style={{ fontFamily: fonts.display, fontSize: 24, lineHeight: 30, color: colors.ink }}>{t(exercise.promptKey)}</Text>
      {exercise.tones ? <Button variant="secondary" label={`▶ ${t('ui.exercise.listen')}`} onPress={() => void playTones(exercise.tones!)} /> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {exercise.options.map((opt, i) => {
          const isPicked = picked === i;
          const ok = isPicked && i === exercise.correctIndex;
          const bad = isPicked && !ok;
          return (
            <Pressable
              key={opt}
              accessibilityRole="button"
              accessibilityState={{ selected: isPicked }}
              onPress={() => pick(i)}
              style={{
                flexBasis: '47%',
                flexGrow: 1,
                minHeight: 64,
                borderRadius: radius.lg,
                borderWidth: 2,
                alignItems: 'center',
                justifyContent: 'center',
                borderColor: ok ? colors.teal : bad ? colors.accent : colors.border,
                backgroundColor: ok ? colors.tealSoft : bad ? colors.accentSoft : colors.card,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '800', color: ok ? colors.tealInk : bad ? colors.accentInk : colors.ink }}>{optionLabel(t, opt, note)}</Text>
            </Pressable>
          );
        })}
      </View>
      {picked !== null ? (
        <View
          accessibilityLiveRegion="polite"
          style={{ borderRadius: radius.md, padding: 14, backgroundColor: correct ? colors.tealSoft : colors.accentSoft }}
        >
          <Text style={{ fontWeight: '700', color: correct ? colors.tealInk : colors.accentInk }}>
            {correct ? t('ui.exercise.correct') : exercise.hintKey ? t(exercise.hintKey) : t('ui.exercise.wrong')}
          </Text>
        </View>
      ) : null}
      <Button label={t('ui.common.next')} disabled={!correct} onPress={() => onDone(stars)} />
    </View>
  );
}
