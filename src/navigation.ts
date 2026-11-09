import { router } from 'expo-router';
import { canOpenLesson } from './billing/access';
import { useBilling } from './billing/purchases';

/** Abre una lección, o el paywall si es Premium y el usuario no lo tiene. */
export function openLesson(id: string) {
  if (canOpenLesson(id, useBilling.getState().isPremium)) {
    router.push({ pathname: '/leccion/[id]', params: { id } });
  } else {
    router.push('/paywall');
  }
}
