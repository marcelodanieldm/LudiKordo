import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { QuizExercise } from './QuizExercise';
import { TapRhythmExercise } from './TapRhythmExercise';
import { FretboardTapExercise } from './FretboardTapExercise';
import { PlayAlongExercise } from './PlayAlongExercise';
import { Button } from '../ui';
import { colors } from '../../theme';
import type { Exercise } from '../../content/types';

/**
 * Elige el componente de cada tipo de ejercicio. 4 de los 10 tipos están
 * implementados; el resto muestra «próximamente» y deja seguir.
 */
export function ExerciseView({ exercise, onDone, width, mastery }: { exercise: Exercise; onDone: (stars: number) => void; width: number; mastery: number }) {
  const { t } = useTranslation();
  switch (exercise.kind) {
    case 'quiz':
    case 'ear':
      return <QuizExercise key={exercise.id} exercise={exercise} onDone={onDone} />;
    case 'tapRhythm':
      return <TapRhythmExercise key={exercise.id} exercise={exercise} onDone={onDone} mastery={mastery} />;
    case 'fretboardTap':
      return <FretboardTapExercise key={exercise.id} exercise={exercise} onDone={onDone} width={width} mastery={mastery} />;
    case 'playAlong':
      return <PlayAlongExercise key={exercise.id} exercise={exercise} onDone={onDone} mastery={mastery} />;
    default:
      return (
        <View style={{ gap: 12 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.ink }}>{t(exercise.promptKey)}</Text>
          <Text style={{ color: colors.muted }}>{t('ui.common.comingSoon')}</Text>
          <Button label={t('ui.common.next')} onPress={() => onDone(1)} />
        </View>
      );
  }
}
