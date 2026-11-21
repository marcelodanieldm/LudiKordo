/**
 * Tres apps desde el mismo código (ADR 0009 y 0010). `app.json` sigue siendo la
 * base (LudiKordo, bajo); con EXPO_PUBLIC_INSTRUMENT=guitar se arma la app de
 * guitarra eléctrica y con EXPO_PUBLIC_INSTRUMENT=nylon la de guitarra criolla,
 * cada una con otro nombre, otro paquete y su propio esquema de enlaces.
 *
 *   npm run android            → LudiKordo (bajo)
 *   npm run android:guitar     → app de guitarra eléctrica
 *   npm run android:nylon      → app de guitarra criolla
 *
 * La de criolla se llama «LudiKordo guitar» (elegido por Marcelo); el de la
 * eléctrica sigue PROVISIONAL hasta que Marcelo lo elija.
 * Los paquetes Android (`app.ludikordo.guitar`, `app.ludikordo.nylon`) no cambian con
 * el nombre: una vez publicados en Google Play ya no se pueden cambiar.
 */
import type { ConfigContext, ExpoConfig } from 'expo/config';

const GUITAR_NAME = process.env.APP_GUITAR_NAME ?? 'Kordi Guitar';
// Nombre de la app de criolla, elegido por Marcelo (21 nov 2026).
const NYLON_NAME = process.env.APP_NYLON_NAME ?? 'LudiKordo guitar';

type Instrument = 'bass' | 'guitar' | 'nylon';

function instrumentOf(value: string | undefined): Instrument {
  return value === 'guitar' || value === 'nylon' ? value : 'bass';
}

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

/**
 * APK de prueba (workflow apk-test): el versionName lleva la versión de app.json y
 * el número de build (0.2.0-test.14), para saber en Ajustes de Android qué build está
 * instalado. Sin la variable queda la versión de app.json.
 */
function apkVersionName(): string | undefined {
  const v = process.env.APK_VERSION_NAME?.trim();
  return v ? v : undefined;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  // La misma variable elige el contenido dentro del bundle (src/instruments/current.ts).
  const instrument = instrumentOf(process.env.EXPO_PUBLIC_INSTRUMENT);
  const versionCode = apkVersionCode();
  const versionName = apkVersionName();
  const raw = config as ExpoConfig;
  const named: ExpoConfig = versionName ? { ...raw, version: versionName } : raw;
  const base: ExpoConfig = versionCode ? { ...named, android: { ...named.android, versionCode } } : named;
  const extra = { ...base.extra, instrument };

  if (instrument === 'bass') return { ...base, extra };

  if (instrument === 'nylon') {
    return {
      ...base,
      name: NYLON_NAME,
      slug: 'ludikordo-nylon',
      scheme: 'ludikordonylon',
      android: { ...base.android, package: 'app.ludikordo.nylon' },
      extra,
    };
  }

  return {
    ...base,
    name: GUITAR_NAME,
    slug: 'ludikordo-guitar',
    scheme: 'ludikordoguitar',
    android: { ...base.android, package: 'app.ludikordo.guitar' },
    extra,
  };
};
