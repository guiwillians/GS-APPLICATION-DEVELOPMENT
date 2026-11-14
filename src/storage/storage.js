import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@painel-territorial/state/v1';

export async function loadState() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export async function saveState(state) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    // persistência é best-effort; o app continua funcionando em memória
  }
}

export async function clearState() {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch (e) {}
}
