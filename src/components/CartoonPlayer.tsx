import React, { useEffect, useMemo, useReducer, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { useTranslation } from 'react-i18next';
import Rive, { AutoBind, Fit, useRive } from 'rive-react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { Kordi } from './Kordi';
import { colors, radius } from '../theme';
import type { Lesson } from '../content/types';
import { RIVE_READY } from '../content/assets';
import { SCENE_GAP_MS, initialPlayer, playerReducer, sceneDurationsMs, voiceTimeoutMs, type PlayerAction, type PlayerState } from '../content/cartoon';
import { voiceFor } from '../content/voices';
import { playClip } from '../audio/voice';
import { noteName, type Locale } from '../music/notes';
import { useSettings } from '../state/settings';

const STAGE_H = 210;

/**
 * Reproductor de los video-cartoons (contrato en docs/CARTOON_PIPELINE.md).
 *
 * - Con voz grabada para el idioma: cada escena dura lo que su audio, más una pausa.
 * - Sin voz: cada escena dura su tiempo de lectura (src/content/cartoon.ts).
 * - Con el .riv listo: se le pasan por data binding `scene` (1–4), `talking` y
 *   `subtitle`. Sin él, Kordi bajo el foco con el subtítulo debajo.
 */
export function CartoonPlayer({ lesson }: { lesson: Lesson }) {
  const { t, i18n } = useTranslation();
  const locale = (['en', 'es', 'pt'].includes(i18n.language) ? i18n.language : 'en') as Locale;
  const notation = useSettings((st) => st.notation);
  const scenes = lesson.cartoon.sceneKeys;
  const [{ scene, playing }, dispatch] = useReducer(
    (st: PlayerState, a: PlayerAction) => playerReducer(st, a, scenes.length),
    initialPlayer,
  );
  const [talking, setTalking] = useState(false);
  const [slow, setSlow] = useState(false);
  const [captions, setCaptions] = useState(true);
  const rate = slow ? 0.75 : 1;
  // Nombres de las cuerdas al aire según el ajuste de notación (glosario: «Mi (E)»).
  const texts = useMemo(() => {
    const n = (midi: number) => noteName(midi, locale, notation);
    const vars = { e: n(28), a: n(33), d: n(38), g: n(43) };
    return scenes.map((k) => t(k, vars));
  }, [scenes, t, locale, notation]);
  const readMs = useMemo(() => sceneDurationsMs(texts, rate), [texts, rate]);
  const [setRiveRef, riveRef] = useRive();
  const voice = voiceFor(lesson.id, locale, scene);

  const rive = lesson.cartoon.riveResource && RIVE_READY.includes(lesson.cartoon.riveResource);

  // Avance de escenas: por la voz si existe, si no por el tiempo de lectura.
  useEffect(() => {
    if (!playing) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let advanced = false;
    const advance = () => {
      if (advanced) return;
      advanced = true;
      dispatch({ type: 'sceneDone' });
    };
    if (voice === undefined) {
      timers.push(setTimeout(advance, readMs[scene]));
      return () => timers.forEach(clearTimeout);
    }
    setTalking(true);
    const clip = playClip(voice, rate, () => {
      setTalking(false);
      timers.push(setTimeout(advance, SCENE_GAP_MS / rate));
    });
    // Respaldo: si el audio no carga o no avisa el final, la escena sigue igual.
    timers.push(
      setTimeout(() => {
        clip.stop();
        setTalking(false);
        advance();
      }, voiceTimeoutMs(readMs[scene]) / rate),
    );
    return () => {
      clip.stop();
      setTalking(false);
      timers.forEach(clearTimeout);
    };
  }, [playing, scene, voice, rate, readMs]);

  // Datos para la animación (view model `Cartoon` del .riv). useRive entrega la
  // referencia cuando el archivo ya cargó (rive-react-native ≥ 9.3.1).
  useEffect(() => {
    if (!rive || !riveRef) return;
    riveRef.setNumber('scene', scene + 1);
    riveRef.setBoolean('talking', talking);
    // El globo de diálogo dentro del .riv obedece al botón CC.
    riveRef.setString('subtitle', captions ? (texts[scene] ?? '') : '');
  }, [rive, riveRef, scene, talking, texts, captions]);

  // Pausar también detiene la animación.
  useEffect(() => {
    if (!rive || !riveRef) return;
    if (playing) riveRef.play();
    else riveRef.pause();
  }, [rive, riveRef, playing]);

  const togglePlay = () => dispatch({ type: 'toggle' });

  return (
    <View style={styles.frame}>
      <View style={styles.stage}>
        {rive ? (
          <Rive
            ref={setRiveRef}
            resourceName={lesson.cartoon.riveResource}
            stateMachineName="Lesson"
            dataBinding={AutoBind(true)}
            fit={Fit.Contain}
            autoplay
            style={{ width: '100%', height: STAGE_H }}
          />
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
      {captions ? (
        // Sin voz, TalkBack lee el subtítulo; con voz, se pisarían.
        <Text accessibilityLiveRegion={voice === undefined ? 'polite' : 'none'} style={styles.caption}>
          {texts[scene]}
        </Text>
      ) : null}
      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={playing ? t('ui.lesson.pause') : t('ui.lesson.play')}
          onPress={togglePlay}
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
              onPress={() => dispatch({ type: 'goto', scene: i })}
              hitSlop={{ top: 19, bottom: 19 }}
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
