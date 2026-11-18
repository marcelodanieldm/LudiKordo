/**
 * Dos apps desde el mismo código (ADR 0009). `app.json` sigue siendo la base
 * (LudiKordo, bajo); con EXPO_PUBLIC_INSTRUMENT=guitar se arma la app de guitarra
 * eléctrica con otro nombre, otro paquete y su propio esquema de enlaces.
 *
 *   npm run android            → LudiKordo (bajo)
 *   npm run android:guitar     → app de guitarra
 *
 * El nombre de la app de guitarra es PROVISIONAL hasta que Marcelo lo elija.
 * El paquete Android (`app.ludikordo.guitar`) no cambia con el nombre: una vez
 * publicado en Google Play ya no se puede cambiar, así que no lleva la marca.
 */
import type { ConfigContext, ExpoConfig } from 'expo/config';

const GUITAR_NAME = process.env.APP_GUITAR_NAME ?? 'Kordi Guitar';

/**
 * APK de versión (workflow apk-release): el versionCode sale de la versión
 * (0.2.0 → 200, 1.3.12 → 10312) para que cada APK nuevo se instale encima del
 * anterior. En Google Play lo maneja EAS (`appVersionSource: remote`) y esta
 * variable no se define.
 */
function apkVersionCode(): number | undefined {
  const v = Number(process.env.APK_VERSION_CODE);
  return Number.isInteger(v) && v > 0 ? v : undefined;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  // La misma variable elige el contenido dentro del bundle (src/instruments/current.ts).
  const instrument = process.env.EXPO_PUBLIC_INSTRUMENT === 'guitar' ? 'guitar' : 'bass';
  const versionCode = apkVersionCode();
  const raw = config as ExpoConfig;
  const base: ExpoConfig = versionCode ? { ...raw, android: { ...raw.android, versionCode } } : raw;
  const extra = { ...base.extra, instrument };

  if (instrument === 'bass') return { ...base, extra };

  return {
    ...base,
    name: GUITAR_NAME,
    slug: 'ludikordo-guitar',
    scheme: 'ludikordoguitar',
    android: { ...base.android, package: 'app.ludikordo.guitar' },
    extra,
  };
};
