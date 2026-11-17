/**
 * Sistema visual «escenario nocturno» (ver docs/design/ui-redesign.md).
 * Contrastes verificados para texto (≥ 4,5:1) sobre bg, card y track.
 *
 * Los nombres antiguos (card, track, accentSoft, tealInk…) se mantienen para no
 * romper pantallas: ahora apuntan a sus equivalentes oscuros.
 */
export const colors = {
  /** Fondo de la app. */
  bg: '#14121F',
  /** Superficie de tarjetas. */
  card: '#1F1C2E',
  /** Superficie elevada: chips, botones neutros, pistas de progreso. */
  raised: '#2A2640',
  /** Borde de tarjetas. */
  border: '#2E2A44',
  /** Líneas y bordes de controles sin seleccionar. */
  line: '#3A3552',
  track: '#2A2640',
  /** Barra de pestañas. */
  bar: '#1A1828',
  /** Escenario del cartoon y diapasón. */
  night: '#0E0C17',
  stage: '#1A1626',
  ink: '#F5F1E8',
  muted: '#B3ADC7',
  nightMuted: '#B3ADC7',

  /** Naranja de amplificador: la acción principal y la nota activa. */
  accent: '#FF6B2C',
  accentSoft: '#43292E',
  accentInk: '#FF8A57',
  accentShadow: '#B4441A',
  /** Texto sobre naranja, dorado o turquesa (≥ 6,6:1). */
  onAccent: '#1A0F08',

  /** Turquesa: afinado, correcto, objetivo. */
  teal: '#3FD0C9',
  tealSoft: '#24353F',
  tealInk: '#3FD0C9',
  tealShadow: '#23938E',
  onTeal: '#0C1F1E',

  /** Dorado: logros, estrellas, racha, checkpoint. */
  gold: '#F5B83D',
  goldSoft: '#3F3530',
  goldShadow: '#A9761A',
  good: '#3FD0C9',
  danger: '#FF7A7A',

  /** Diapasón de madera. */
  wood: '#3B2A20',
  woodGrain: '#33241B',
  fret: '#C9B79C',
  nut: '#EDE6D8',
  stringColor: '#D9D4CC',
  inlay: '#6B5444',

  /** Código de color fijo de la mano derecha. */
  fingerI: '#7AA7FF',
  fingerM: '#FF8A57',
} as const;

/**
 * Familias cargadas en app/_layout.tsx con @expo-google-fonts.
 * En Android cada peso es una familia distinta: no combinar con fontWeight.
 */
export const fonts = {
  display: 'Fredoka_600SemiBold',
  displayBold: 'Fredoka_700Bold',
  regular: 'Nunito_400Regular',
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extrabold: 'Nunito_800ExtraBold',
  black: 'Nunito_900Black',
} as const;

/** Familia de Nunito según el peso pedido (lo usa el componente Text). */
export function bodyFont(weight?: string | number): string {
  const w = Number(weight === 'bold' ? 700 : weight === 'normal' || weight === undefined ? 400 : weight);
  if (w >= 900) return fonts.black;
  if (w >= 800) return fonts.extrabold;
  if (w >= 700) return fonts.bold;
  if (w >= 600) return fonts.semibold;
  return fonts.regular;
}

export const radius = { sm: 10, md: 14, lg: 18, xl: 22, xxl: 28 } as const;
export const space = (n: number) => n * 4;
export const MIN_TOUCH = 44;
