import { useWindowDimensions } from 'react-native';

/** Tablet = el lado corto de la pantalla mide 600 dp o más. */
export function useLayout() {
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;
  return { width, height, isTablet, isLandscape: width > height };
}
