import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { useTranslation } from 'react-i18next';
import Rive, { Fit } from 'rive-react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { Kordi } from './Kordi';
import { colors, radius } from '../theme';
import type { Lesson } from '../content/types';
import { RIVE_READY } from '../content/assets';

const STAGE_H = 210;

/**
 * Reproductor de los video-cartoons. Cuando el archivo Rive de la lección está
 * en android/app/src/main/res/raw y listado en RIVE_READY, se reproduce la
 * animación; mientras tanto, Kordi bajo el foco con los subtítulos por escena.
 * La voz se agrega como pista de audio por idioma (docs/CARTOON_PIPELINE.md).
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

  const riveResource = lesson.cartoon.riveResource;
  const rive = riveResource !== undefined && RIVE_READY.includes(riveResource) ? riveResource : undefined;

  return (
    <View style={styles.frame}>
      <View style={styles.stage}>
        {rive ? (
          <Rive resourceName={lesson.cartoon.riveResource} fit={Fit.Contain} autoplay={playing} style={{ width: '100%', height: STAGE_H }} />
        ) : (
          <>
            <Svg width="100%" height={STAGE_H} viewBox="0 0 350 210" preserveAspectRatio="xMidYMid slice" style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id="stageBeam" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={colors.gold} stopOpacity={0.28} />
                  <Stop offset="1" stopColor={colors.gold} stopOpacity={0} />
                </LinearGradient>
              </Defs>
              <Path d="M155 0h40l70 196H85z" fill="url(#stageBeam)" />
              <Rect x={0} y={176} width={350} height={34} fill={colors.stage} />
              <Rect x={0} y={175} width={350} height={2} fill={colors.line} />
            </Svg>
            <Kordi size={160} />
          </>
        )}
        <View style={styles.badge}>
          <Text style={{ fontSize: 12, fontWeight: '900' }}>{t('ui.lesson.scene', { n: scene + 1, total: scenes.length })}</Text>
        </View>
      </View>
      {captions ? <Text style={styles.caption}>{t(scenes[scene])}</Text> : null}
      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={playing ? t('ui.lesson.pause') : t('ui.lesson.play')}
          onPress={() => setPlaying((p) => !p)}
          style={styles.play}
        >
          <Svg width={16} height={16} viewBox="0 0 24 24">
            {playing ? (
              <>
                <Rect x={5} y={4} width={5} height={16} rx={1.5} fill={colors.bg} />
                <Rect x={14} y={4} width={5} height={16} rx={1.5} fill={colors.bg} />
              </>
            ) : (
              <Path d="M7 4.5v15a1 1 0 0 0 1.5.9l12-7.5a1 1 0 0 0 0-1.8l-12-7.5A1 1 0 0 0 7 4.5z" fill={colors.bg} />
            )}
          </Svg>
        </Pressable>
        <View style={styles.dots}>
          {scenes.map((_, i) => (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={t('ui.lesson.scene', { n: i + 1, total: scenes.length })}
              onPress={() => setScene(i)}
              hitSlop={{ top: 18, bottom: 18 }}
              style={[styles.dot, i <= scene && { backgroundColor: colors.accent }]}
            />
          ))}
        </View>
        <Toggle label={slow ? t('ui.lesson.slow') : t('ui.lesson.normal')} on={slow} onPress={() => setSlow((s) => !s)} />
        <Toggle label="CC" a11y={t('ui.lesson.subtitles')} on={captions} onPress={() => setCaptions((c) => !c)} />
      </View>
    </View>
  );
}

function Toggle({ label, a11y, on, onPress }: { label: string; a11y?: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="switch" accessibilityLabel={a11y ?? label} accessibilityState={{ checked: on }} onPress={onPress} style={[styles.toggle, on && { backgroundColor: colors.ink }]}>
      <Text style={{ fontSize: 13, fontWeight: '900', color: on ? colors.bg : colors.ink }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  stage: { height: STAGE_H, backgroundColor: colors.night, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 14, overflow: 'hidden' },
  badge: { position: 'absolute', left: 12, top: 12, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(20,18,31,0.8)' },
  caption: { fontSize: 16, fontWeight: '700', lineHeight: 22, paddingHorizontal: 16, paddingTop: 14, minHeight: 66 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  play: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  dots: { flex: 1, flexDirection: 'row', gap: 4 },
  dot: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.line },
  toggle: { minWidth: 44, minHeight: 44, paddingHorizontal: 10, borderRadius: 12, backgroundColor: colors.raised, alignItems: 'center', justifyContent: 'center' },
});
