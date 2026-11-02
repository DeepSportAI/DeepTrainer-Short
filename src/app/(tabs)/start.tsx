import { Redirect } from 'expo-router';

/** Yer tutucu: "Test al" sekmesine dokunmak sporcu seçimini açar (`(tabs)/_layout.tsx`); adres doğrudan açılırsa da. */
export default function StartTab() {
  return <Redirect href="/pick-athlete" />;
}
