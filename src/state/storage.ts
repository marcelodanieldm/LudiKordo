/**
 * Almacenamiento persistente con MMKV (API de react-native-mmkv 3.x).
 * Si se actualiza a MMKV 4, cambiar `new MMKV()` por `createMMKV()`.
 */
import { MMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

const mmkv = new MMKV({ id: 'ludikordo' });

export const zustandStorage: StateStorage = {
  getItem: (name) => mmkv.getString(name) ?? null,
  setItem: (name, value) => mmkv.set(name, value),
  removeItem: (name) => mmkv.delete(name),
};
