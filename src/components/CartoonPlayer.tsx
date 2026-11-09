import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Rive, { Fit } from 'rive-react-native';
import { Kordi } from './Kordi';
import { colors, radius } from '../theme';
import type { Lesson } from '../content/types';
import { RIVE_READY } from '../content/assets';

/**
 * Reproductor de los video-cartoons. Cuando el archivo Rive de la lección está
 * en android/app/src/main/res/raw y listado en RIVE_READY, se reproduce la
 * animación; mientras tanto, Kordi estático con los subtítulos por escena.
 * La voz se agrega como pista de audio por idioma (ver README).
 */
export function CartoonPlayer({ lesson }: { lesson: Lesson }) {
  const { t } = useTranslation();
  const scenes = lesson.cartoon.sceneKeys;
  const [scene, setScene] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [slow, setSlow] = useState(false);
  const [captions, setCaptions] = useState(true);
  const perScene = (lesson.cartoon.durationSec / scenes.length) * (slow ? 1 / 0.75 : 1);

  useEffect(() => {
    if (!playing) return;
    const id = setTimeout(() => setScene((s) => (s + 1 < scenes.length ? s + 1 : s)), perScene * 1000);
    return () => clearTimeout(id);
  }, [playing, scene, perScene, scenes.length]);

  const rive = lesson.cartoon.riveResource && RIVE_READY.includes(lesson.cartoon.riveResource);

  return (
    <View style={{ gap: 10 }}>
      <View style={styles.stage}>
        {rive ? (
          <Rive resourceName={lesson.cartoon.riveResource} fit={Fit.Contain} autoplay={playing} style={{ width: '100%', height: 220 }} />
        ) : (
          <Kordi size={150} />
        )}
        {captions ? <Text style={styles.caption}>{t(scenes[scene])}</Text> : null}
        <View style={styles.controls}>
          <Pressable accessibilityRole="button" accessibilityLabel={playing ? 'Pause' : 'Play'} onPress={() => setPlaying((p) => !p)} style={styles.ctrl}>
            <Text style={styles.ctrlText}>{playing ? '❚❚' : '▶'}</Text>
          </Pressable>
          <View style={styles.dots}>
            {scenes.map((_, i) => (
              <Pressable key={i} accessibilityRole="button" accessibilityLabel={`${i + 1}`} onPress={() => setScene(i)} style={[styles.dot, i <= scene && { backgroundColor: '#F7B58F' }]} />
            ))}
          </View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Toggle label="CC" on={captions} onPress={() => setCaptions((c) => !c)} />
        <Toggle label={slow ? t('ui.lesson.slow') : t('ui.lesson.normal')} on={slow} onPress={() => setSlow((s) => !s)} />
      </View>
    </View>
  );
}

function Toggle({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="switch" accessibilityState={{ checked: on }} onPress={onPress} style={[styles.toggle, on && { backgroundColor: colors.tealSoft, borderColor: colors.tealSoft }]}>
      <Text style={{ fontWeight: '700', color: on ? colors.tealInk : colors.ink }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stage: { backgroundColor: colors.night, borderRadius: radius.xl, padding: 16, alignItems: 'center', gap: 12, minHeight: 300, justifyContent: 'center' },
  caption: { color: '#FFFFFF', fontSize: 16, lineHeight: 22, textAlign: 'center' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 12, alignSelf: 'stretch' },
  ctrl: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  ctrlText: { color: '#FFFFFF', fontSize: 18 },
  dots: { flex: 1, flexDirection: 'row', gap: 6 },
  dot: { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#4A4760' },
  toggle: { minHeight: 44, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, justifyContent: 'center' },
});
