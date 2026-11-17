import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from './ui';
import { Staff } from './Staff';
import { TabStaff } from './TabStaff';
import { playSequence, type SequenceHandle } from '../audio/engine';
import { LISTEN_COUNT_IN, listenLengthSec, listenSchedule } from '../music/listen';
import { isRest } from '../music/staff';
import type { ListenExample, ScoreEvent, TabNote } from '../content/types';

/** La tablatura solo dibuja negras, blancas y redondas sin silencios. */
function asTab(events: ScoreEvent[]): TabNote[] | null {
  const out: TabNote[] = [];
  for (const e of events) {
    if (isRest(e) || e.beats === 0.5) return null;
    out.push({ string: e.string, fret: e.fret, beats: e.beats });
  }
  return out;
}

/** Notación de un ejemplo o ejercicio: pentagrama o tablatura. */
export function Score({ events, notation, width, current, noteNames }: { events: ScoreEvent[]; notation: 'tab' | 'staff'; width: number; current?: number; noteNames?: boolean }) {
  const tab = notation === 'tab' ? asTab(events) : null;
  if (tab) return <TabStaff notes={tab} width={width} current={current} />;
  return <Staff events={events} width={width} current={current} noteNames={noteNames} />;
}

/**
 * Ejemplo sonoro de una tarjeta: dibuja la notación (si corresponde) y lo toca
 * con un tono sintetizado. Se corta al desmontar o al tocar «Detener».
 */
export function Listen({ example, width }: { example: ListenExample; width: number }) {
  const { t } = useTranslation();
  const [playing, setPlaying] = useState(false);
  const handle = useRef<SequenceHandle | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = () => {
    handle.current?.stop();
    handle.current = null;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setPlaying(false);
  };
  // Otro ejemplo (la tarjeta siguiente) corta el que sonaba.
  useEffect(() => stop, [example]);

  const play = () => {
    stop();
    const offset = example.click ? LISTEN_COUNT_IN : 0;
    const notes = listenSchedule(example.events, example.bpm, offset);
    const beats = example.events.reduce((a, e) => a + e.beats, 0) + offset;
    handle.current = playSequence(notes, example.click ? { bpm: example.bpm, beats } : undefined);
    setPlaying(true);
    timer.current = setTimeout(() => {
      handle.current = null;
      setPlaying(false);
    }, listenLengthSec(example.events, example.bpm, example.click) * 1000 + 400);
  };

  return (
    <View style={{ gap: 10 }}>
      {example.show ? <Score events={example.events} notation={example.show} width={width} noteNames={example.noteNames} /> : null}
      <Button
        variant="secondary"
        label={playing ? t('ui.listen.stop') : t('ui.listen.play')}
        onPress={playing ? stop : play}
        testID="listen"
      />
    </View>
  );
}
