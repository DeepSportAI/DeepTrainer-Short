import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Klavye açık mı — iOS'ta açılmadan hemen önce (`will`), Android'de açıldıktan sonra (`did`; Android
 * `will` olayı göndermiyor). Yüzen sekme çubuğu klavye açıkken gizlenir.
 */
export function useKeyboardShown(): boolean {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const show = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hide = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const subscriptions = [
      Keyboard.addListener(show, () => setShown(true)),
      Keyboard.addListener(hide, () => setShown(false)),
    ];
    return () => subscriptions.forEach((subscription) => subscription.remove());
  }, []);
  return shown;
}
