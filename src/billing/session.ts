/**
 * Sesión de la cuenta en la app (ADR 0011). Abre el inicio de sesión con Google
 * en el navegador, lee la vuelta (`<esquema>://auth#…`) y conecta la cuenta con
 * RevenueCat (`Purchases.logIn`), así el Premium pagado en la web se ve acá.
 *
 * La dirección del proyecto Supabase llega con EXPO_PUBLIC_SUPABASE_URL al
 * compilar. Sin ella, el inicio de sesión no se muestra.
 */
import { Linking } from 'react-native';
import Constants from 'expo-constants';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from '../state/storage';
import { authorizeUrl, isAuthRedirect, parseAuthRedirect, type Account } from './account';
import { linkAccount, unlinkAccount } from './purchases';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

export const accountAvailable = SUPABASE_URL.startsWith('https://');

function scheme(): string {
  const s = Constants.expoConfig?.scheme;
  return (Array.isArray(s) ? s[0] : s) ?? 'ludikordo';
}

type Status = 'idle' | 'waiting' | 'error';

interface SessionState {
  account: Account | null;
  status: Status;
  error: string | null;
}

export const useSession = create<SessionState>()(
  persist((): SessionState => ({ account: null, status: 'idle', error: null }), {
    name: 'account',
    storage: createJSONStorage(() => zustandStorage),
    partialize: (s) => ({ account: s.account }),
  }),
);

/** Abre Google en el navegador; la vuelta la atiende `handleAuthUrl`. */
export async function signInWithGoogle(): Promise<void> {
  if (!accountAvailable) return;
  useSession.setState({ status: 'waiting', error: null });
  await Linking.openURL(authorizeUrl(SUPABASE_URL, scheme()));
}

/** Devuelve true si la URL era la vuelta del inicio de sesión (la haya resuelto o no). */
export async function handleAuthUrl(url: string | null): Promise<boolean> {
  if (!url || !isAuthRedirect(url, scheme())) return false;
  const res = parseAuthRedirect(url);
  if (!res.ok) {
    useSession.setState({ status: 'error', error: res.error });
    return true;
  }
  useSession.setState({ account: res.account, status: 'idle', error: null });
  await linkAccount(res.account.userId);
  return true;
}

export async function signOut(): Promise<void> {
  useSession.setState({ account: null, status: 'idle', error: null });
  await unlinkAccount();
}

/** Escucha las vueltas del inicio de sesión mientras la app está abierta. */
export function listenForAuth(): () => void {
  const sub = Linking.addEventListener('url', ({ url }) => void handleAuthUrl(url));
  void Linking.getInitialURL().then((url) => handleAuthUrl(url));
  return () => sub.remove();
}
