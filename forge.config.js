const { MakerZIP } = require("@electron-forge/maker-zip");
const { VitePlugin } = require("@electron-forge/plugin-vite");

module.exports = {
  packagerConfig: {
    asar: true,
  },
  rebuildConfig: {},
  makers: [new MakerZIP({}, ["darwin"])],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: "src/electron/main/index.js",
          config: "vite.main.config.mjs",
          target: "main",
        },
        {
          entry: "src/electron/preload/preload.js",
          config: "vite.preload.config.mjs",
          target: "preload",
        },
      ],
      renderer: [
        {
          name: "main_window",
          config: "vite.renderer.config.mjs",
        },
      ],
    }),
  ],
};