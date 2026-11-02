const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

// Native derleme klasörleri izlenmez (DeepSport Atletik'teki aynı ders: `ios/build` içindeki geçici kilit dosyası
// Metro'nun izleyicisini düşürüyordu).
const nativeBuildDirs = [
  /[/\\]ios[/\\]build[/\\].*/,
  /[/\\]ios[/\\]Pods[/\\].*/,
  /[/\\]android[/\\](app[/\\])?build[/\\].*/,
  /[/\\]android[/\\]\.gradle[/\\].*/,
];
const blockList = config.resolver.blockList;
config.resolver.blockList = [...(Array.isArray(blockList) ? blockList : blockList ? [blockList] : []), ...nativeBuildDirs];

// withUniwindConfig en dıştaki sarmalayıcı olmalı. Metro ilk çalıştığında `src/uniwind-types.d.ts` yazılır — commit edilir.
// `extraThemes`: açık / koyu dışındaki token bloğu (`global.css` → `@variant navy`, "Koyu lacivert").
module.exports = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
  dtsFile: './src/uniwind-types.d.ts',
  extraThemes: ['navy'],
});
