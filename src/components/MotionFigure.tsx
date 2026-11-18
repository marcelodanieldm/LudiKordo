import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from './ui';
import { Figure } from './Figure';
import { Text } from './Text';
import { playSequence, type SequenceHandle } from '../audio/engine';
import { motionLengthSec, motionNotes, motionStarts, motionStepAt } from '../music/motion';
import { colors } from '../theme';
import type { Figure as FigureId, FigureMotion } from '../content/types';

/**
 * Dibujo que se mueve con sonido: al tocar «Ver y escuchar», cada paso del
 * movimiento se resalta en el dibujo mientras suena su nota. Se corta al
 * desmontar, al cambiar de tarjeta o si empieza otro ejemplo.
 */
export function MotionFigure({ id, motion, width, testID = 'motion' }: { id: FigureId; motion: FigureMotion; width: number; testID?: string }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const handle = useRef<SequenceHandle | null>(null);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  const starts = useMemo(() => motionStarts(motion), [motion]);
  const total = useMemo(() => motionLengthSec(motion), [motion]);

  const stop = () => {
    handle.current?.stop();
    handle.current = null;
    if (tick.current) clearInterval(tick.current);
    tick.current = null;
    setStep(-1);
    setPlaying(false);
  };
  useEffect(() => stop, [motion]);

  const play = () => {
    stop();
    const notes = motionNotes(motion).map((n) => ({ freq: n.freq, startSec: n.startSec, durSec: n.durSec, tone: n.muted ? ('muted' as const) : undefined }));
    // El motor arranca 0,15 s después de programar: el dibujo espera lo mismo.
    const t0 = Date.now() + 150;
    handle.current = playSequence(notes, undefined, () => {
      // Otro ejemplo empezó a sonar y cortó este.
      handle.current = null;
      if (tick.current) clearInterval(tick.current);
      tick.current = null;
      setStep(-1);
      setPlaying(false);
    });
    setStep(-1);
    setPlaying(true);
    tick.current = setInterval(() => {
      const elapsed = (Date.now() - t0) / 1000;
      if (elapsed >= total + 0.2) {
        if (tick.current) clearInterval(tick.current);
        tick.current = null;
        handle.current = null;
        setStep(-1);
        setPlaying(false);
        return;
      }
      setStep(motionStepAt(starts, total, elapsed));
    }, 40);
  };

  const current = step >= 0 ? motion.steps[step] : undefined;
  return (
    <View style={{ gap: 10 }}>
      <View accessible accessibilityRole="image" accessibilityLabel={t('ui.motion.label', { step: step + 1, total: motion.steps.length })}>
        <Figure id={id} width={width} motion={motion} step={current} />
      </View>
      <Text style={{ textAlign: 'center', color: colors.muted, fontSize: 14 }} accessibilityLiveRegion="polite">
        {current ? t('ui.motion.stepOf', { step: step + 1, total: motion.steps.length }) : ' '}
      </Text>
      <Button variant="secondary" label={playing ? t('ui.motion.stop') : t('ui.motion.play')} onPress={playing ? stop : play} testID={testID} />
    </View>
  );
}
