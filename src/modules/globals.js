const { BrowserWindow } = require("electron-acrylic-window");

module.exports = {
    DEV_MODE: false,
    SHOW_DEV_TOOLS: false,

    APP_NAME: "Cereal",
    APP_VERSION: "1.1.0",
    APP_ID: "{{a013771f-e172-4230-ac5d-4acf5ef71c14}}",
    PUBLISHER: "Piyush Agade",
    PUBLISHER_SHORT: "Agade",
    APP_URL: "https://piyushagade.xyz/a/cereal",
    LIVE_SHARE_URL: "https://piyushagade.xyz/a/cereal/remote",
    API_URL: "https://api.piyushagade.xyz/v1/app/cereal",
    APP_EXE: "Cereal.exe",
    APP_SOURCE: "C:\\Silo\\Cereal",
    SOURCE_DIR: "Cereal-win32-x64",
    TRIAL_DURATION: 45,
    LICENSE: "license.txt",
    FIRST_RUN: true,
    DONATE_LINK: "https://paypal.me/piyushagade",
    INSTALL_PATH: null,
    THEMES_PATH: './app/themes',
    STORAGE_PATH: './app/storage',
    var: {
        machineid: null,
        auxwindows: [],
        windows: {},
        serports: {},
        windowscount: 0,
        timers: {},
        tray: null,
        subscription: {},
        trialinactive: null,
        fullfunctionality: null
    }
}