/** Colores y medidas del prototipo de diseño. Contrastes verificados para texto (≥ 4,5:1). */
export const colors = {
  bg: '#FFF8EE',
  card: '#FFFFFF',
  border: '#EADFCF',
  track: '#F3E6D3',
  ink: '#1D1B2E',
  muted: '#5B5870',
  accent: '#C2410C',
  accentSoft: '#FDE8DC',
  accentInk: '#8A2E08',
  teal: '#0F6E7E',
  tealSoft: '#E3F2F4',
  tealInk: '#0B5561',
  night: '#1D1B2E',
  nightMuted: '#D6D3E3',
  gold: '#E8A317',
  good: '#5BD1A0',
  /** Código de color fijo de la mano derecha. */
  fingerI: '#1F5FBF',
  fingerM: '#C2410C',
} as const;

export const radius = { sm: 10, md: 14, lg: 18, xl: 20 } as const;
export const space = (n: number) => n * 4;
export const MIN_TOUCH = 44;
