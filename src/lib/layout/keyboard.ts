/**
 * `KeyboardAvoidingView` davranışı — iki platformda da `padding`.
 *
 * Android Expo 57'de kenardan kenara (edge-to-edge) çizer: pencere klavye için yeniden
 * boyutlanmaz, klavye içeriğin ÜSTÜNE açılır. Eskiden Android'de davranış verilmiyordu (pencere
 * küçülür varsayımı) ve alanlarla birincil düğme klavyenin arkasında kalıyordu. Klavye açıkken
 * düzen: içerik yukarı kalkar, birincil düğme klavyenin hemen üstünde görünür (tasarım 01 · 1b·k).
 */
export const KEYBOARD_BEHAVIOR = 'padding' as const;
