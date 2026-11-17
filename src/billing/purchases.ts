/**
 * Suscripciones con RevenueCat sobre Google Play Billing.
 *
 * Configuración necesaria (ver README):
 * - Play Console: suscripción `ludikordo_premium` con planes base `anual` (P1Y,
 *   oferta de prueba de 7 días) y `semestral` (P6M).
 * - RevenueCat: permiso `premium` y una oferta `default` con los paquetes
 *   ANNUAL y SIX_MONTH apuntando a esos planes.
 */
import { Linking } from 'react-native';
import Constants from 'expo-constants';
import Purchases, { type CustomerInfo, type PurchasesPackage, PACKAGE_TYPE } from 'react-native-purchases';
import { create } from 'zustand';
import { ENTITLEMENT_ID, PRODUCT_ID } from './access';

interface BillingState {
  ready: boolean;
  isPremium: boolean;
  managementURL: string | null;
  annual: PurchasesPackage | null;
  semiannual: PurchasesPackage | null;
}

export const useBilling = create<BillingState>(() => ({
  ready: false,
  isPremium: false,
  managementURL: null,
  annual: null,
  semiannual: null,
}));

function applyCustomerInfo(info: CustomerInfo) {
  useBilling.setState({
    isPremium: Boolean(info.entitlements.active[ENTITLEMENT_ID]),
    managementURL: info.managementURL,
  });
}

export async function initBilling(): Promise<void> {
  const apiKey = Constants.expoConfig?.extra?.revenueCatAndroidKey as string | undefined;
  if (!apiKey || apiKey.startsWith('REEMPLAZAR')) {
    // Sin clave configurada (desarrollo): la app funciona en modo gratis, salvo
    // que una compilación de desarrollo pida probar todo como Premium con
    // EXPO_PUBLIC_DEV_PREMIUM=1. En una compilación de release __DEV__ es false.
    useBilling.setState({ ready: true, isPremium: __DEV__ && process.env.EXPO_PUBLIC_DEV_PREMIUM === '1' });
    return;
  }
  Purchases.configure({ apiKey });
  Purchases.addCustomerInfoUpdateListener(applyCustomerInfo);
  try {
    const [info, offerings] = await Promise.all([Purchases.getCustomerInfo(), Purchases.getOfferings()]);
    applyCustomerInfo(info);
    const current = offerings.current;
    useBilling.setState({
      annual: current?.availablePackages.find((p) => p.packageType === PACKAGE_TYPE.ANNUAL) ?? null,
      semiannual: current?.availablePackages.find((p) => p.packageType === PACKAGE_TYPE.SIX_MONTH) ?? null,
    });
  } finally {
    useBilling.setState({ ready: true });
  }
}

/** Devuelve true si la compra activó Premium; false si el usuario la canceló. */
export async function purchase(pkg: PurchasesPackage): Promise<boolean> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    applyCustomerInfo(customerInfo);
    return Boolean(customerInfo.entitlements.active[ENTITLEMENT_ID]);
  } catch (e: unknown) {
    if (typeof e === 'object' && e !== null && 'userCancelled' in e && (e as { userCancelled?: boolean }).userCancelled) {
      return false;
    }
    throw e;
  }
}

export async function restore(): Promise<boolean> {
  const info = await Purchases.restorePurchases();
  applyCustomerInfo(info);
  return Boolean(info.entitlements.active[ENTITLEMENT_ID]);
}

/** Abre la página de suscripciones de Google Play, directo en la de LudiKordo. */
export async function openManageSubscription(): Promise<void> {
  const url =
    useBilling.getState().managementURL ??
    `https://play.google.com/store/account/subscriptions?sku=${PRODUCT_ID}&package=app.ludikordo`;
  await Linking.openURL(url);
}
