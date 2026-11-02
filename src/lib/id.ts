/** Yerel kayıt kimliği: zaman öneki (sıralanabilir) + rastgele parça. Sunucu kimliği değildir. */
export function newId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}${random}`;
}
