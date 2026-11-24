import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from './ui';
import { Staff } from './Staff';
import { TabStaff } from './TabStaff';
import { IS_GUITAR } from '../instruments/current';
import { playSequence, type SequenceHandle } from '../audio/engine';
import { eventAtMs, exampleSchedule } from '../music/examples';
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
export function Score({ events, notation, width, current, noteNames, beatsPerBar }: { events: ScoreEvent[]; notation: 'tab' | 'staff'; width: number; current?: number; noteNames?: boolean; beatsPerBar?: number }) {
  const tab = notation === 'tab' ? asTab(events) : null;
  if (tab) return <TabStaff notes={tab} width={width} current={current} beatsPerBar={beatsPerBar} />;
  // La guitarra no tiene pentagrama todavía (el de la app es en clave de fa, del bajo):
  // corcheas y silencios también van en tablatura.
  if (notation === 'tab' && IS_GUITAR) return <TabStaff notes={events} width={width} current={current} beatsPerBar={beatsPerBar} />;
  return <Staff events={events} width={width} current={current} noteNames={noteNames} />;
}

/**
 * Ejemplo sonoro de una tarjeta: dibuja la notación (si corresponde) y lo toca
 * con un tono sintetizado. Se corta al desmontar o al tocar «Detener».
 */
export function Listen({ example, width, testID = 'listen', onProgress }: { example: ListenExample; width: number; testID?: string; onProgress?: (event: number) => void }) {
  const { t } = useTranslation();
  const [playing, setPlaying] = useState(false);
  // La nota que suena, para seguirla en la partitura (-1: ninguna).
  const [current, setCurrent] = useState(-1);
  const handle = useRef<SequenceHandle | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shown = !!example.show && example.events.length > 0;
  // Quien muestra la partitura en otro lado (la práctica) la sigue con `onProgress`.
  const follow = shown || (!!onProgress && example.events.length > 0);
  const progress = useRef(onProgress);
  progress.current = onProgress;

  useEffect(() => {
    if (!playing || !follow) {
      setCurrent(-1);
      progress.current?.(-1);
      return;
    }
    const id = setInterval(() => {
      const h = handle.current;
      if (!h) return;
      const i = eventAtMs(example, h.elapsedMs());
      setCurrent(i);
      progress.current?.(i);
    }, 60);
    return () => {
      clearInterval(id);
      progress.current?.(-1);
    };
  }, [playing, follow, example]);

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
    const { notes, beats, lengthSec } = exampleSchedule(example);
    handle.current = playSequence(notes, example.click ? { bpm: example.bpm, beats } : undefined, () => {
      // Otro ejemplo empezó a sonar y cortó este.
      handle.current = null;
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      setPlaying(false);
    }, example.tone);
    setPlaying(true);
    timer.current = setTimeout(() => {
      handle.current = null;
      setPlaying(false);
    }, lengthSec * 1000 + 400);
  };

  return (
    <View style={{ gap: 10 }}>
      {shown && example.show ? <Score events={example.events} notation={example.show} width={width} noteNames={example.noteNames} beatsPerBar={example.beatsPerBar} current={playing ? current : undefined} /> : null}
      <Button
        variant="secondary"
        label={playing ? t('ui.listen.stop') : t('ui.listen.play')}
        onPress={playing ? stop : play}
        testID={testID}
      />
    </View>
  );
}
