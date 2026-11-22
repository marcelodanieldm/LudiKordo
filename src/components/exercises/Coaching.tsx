import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../Text';
import { Listen } from '../Listen';
import { colors, fonts, radius } from '../../theme';
import type { Counts, NoteProblem, Tip } from '../../music/feedback';
import type { ListenExample } from '../../content/types';
import { INSTRUMENT } from '../../instruments/current';

/** Número de cuerda (6 = la más grave en guitarra, 4 en bajo) del instrumento de esta build. */
export const stringNumber = (id: string) => INSTRUMENT.strings.find((s) => s.id === id)?.number ?? 0;

const Bullet = ({ children, color = colors.ink }: { children: React.ReactNode; color?: string }) => (
  <View style={{ flexDirection: 'row', gap: 8 }}>
    <Text style={{ color: colors.accentInk, fontWeight: '900', fontSize: 15, lineHeight: 22 }}>•</Text>
    <Text style={{ flex: 1, color, fontSize: 15, lineHeight: 22 }}>{children}</Text>
  </View>
);

/** Antes de empezar: qué hay que hacer y un ejemplo para escuchar. */
export function HowToCard({ tips, example, width }: { tips: Tip[]; example?: ListenExample; width: number }) {
  const { t } = useTranslation();
  return (
    <View style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: radius.xl, padding: 16, gap: 10 }} testID="howto">
      <Text style={{ fontFamily: fonts.display, fontSize: 18, lineHeight: 24, color: colors.ink }} accessibilityRole="header">
        {t('ui.exercise.howTo.title')}
      </Text>
      {tips.map((tip, i) => (
        <Bullet key={i}>{t(`ui.exercise.${tip.key}`, tip.params)}</Bullet>
      ))}
      {example ? (
        <View style={{ gap: 6 }}>
          <Text style={{ color: colors.muted, fontSize: 14 }}>{t('ui.exercise.howTo.example')}</Text>
          <Listen example={example} width={width - 34} testID="howto-example" />
        </View>
      ) : null}
    </View>
  );
}

const VERDICTS = ['hit', 'early', 'late', 'wrong', 'miss'] as const;
const VERDICT_COLOR: Record<(typeof VERDICTS)[number], string> = {
  hit: colors.tealInk,
  early: colors.gold,
  late: colors.gold,
  wrong: colors.accentInk,
  miss: colors.muted,
};

/**
 * Al terminar: cómo salió cada nota (si hay conteo), dónde estuvieron los
 * problemas y hasta tres consejos. `note` pone nombre a una nota MIDI.
 */
export function FeedbackCard({
  tips,
  counts,
  problems = [],
  note,
}: {
  tips: Tip[];
  counts?: Counts;
  problems?: NoteProblem[];
  note: (midi: number) => string;
}) {
  const { t } = useTranslation();
  return (
    <View style={{ alignSelf: 'stretch', gap: 10, paddingTop: 4 }} testID="feedback" accessibilityLiveRegion="polite">
      <Text style={{ fontFamily: fonts.display, fontSize: 18, lineHeight: 24, color: colors.ink }} accessibilityRole="header">
        {t('ui.exercise.feedback.title')}
      </Text>
      {counts ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {VERDICTS.filter((v) => counts[v] > 0).map((v) => (
            <View key={v} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: colors.track }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: VERDICT_COLOR[v] }}>
                {t(`ui.drills.verdict.${v}`)} · {counts[v]}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      {problems.map((p) => (
        <Bullet key={`p${p.index}`} color={colors.ink}>
          {p.verdict === 'wrong' && p.played !== null
            ? t('ui.exercise.feedback.problemWrong', { bar: p.bar, note: note(p.expected), played: note(p.played) })
            : t('ui.exercise.feedback.problem', { bar: p.bar, note: note(p.expected), verdict: t(`ui.drills.verdict.${p.verdict}`) })}
        </Bullet>
      ))}
      {tips.map((tip, i) => (
        <Bullet key={`t${i}`} color={colors.tealInk}>
          {t(`ui.exercise.${tip.key}`, tip.params)}
        </Bullet>
      ))}
    </View>
  );
}
