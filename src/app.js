/*
    Includes
*/
const { app, ipcMain, ipcRenderer, remote, net, BrowserWindow, dialog } = require('electron');
app.commandLine.appendSwitch('force_high_performance_gpu');
var fs = require('fs');
var settings = require('electron-settings');
settings.configure({prettify: true});
const { machineIdSync } = require("node-machine-id");

/*
    Modules
*/
var g = require("./modules/globals");
var w = require("./modules/windows");
var sub = require("./modules/subscription");
var ipc = require("./modules/ipc");
var r = require("./modules/request");
var upd = require("./modules/updates");
var i = { app: app, ipcm: ipcMain, ipcr: ipcRenderer, ipc: ipc, fs: fs, s: settings, g: g, w: w, r: r, sub: sub, upd: upd };

/*
    Start the app beeech
*/
app.on('ready', () => {
    i.g.var.machineid = machineIdSync({original: true});
    console.log("Machine ID: " + i.g.var.machineid);
    
    // Get subscription/trial (license) information from the server and open serial monitor window
    i.sub.validate(i)
        .then(function () {
            i.w.create.serial(i);
            setTimeout(() => { i.sub.validate(i); }, 100); 
        });

    // Check subscription data every 1 minute
    setInterval(() => { i.sub.validate(i); }, 60000); 

    // Initialize IPC listeners
    i.ipc.listen(i);
    
    // Check for an app update
    i.upd.check(i);
    
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        console.log("All windows closed. Quitting app.");
        i.app.quit();
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
    // if (Object.keys(i.g.var.windows).length === 0) {
        i.w.create.serial(i);
    }
})

app.on('before-quit', () => {

    // Close all ports
    console.log("Closing all ports.");
    Object.keys(i.g.var.serports).forEach(function (path, pi) { try  { if (i.g.var.serports[path]) i.g.var.serports[path].close(); delete i.g.var.serports[path]; } catch (e) {};});
})


/*
    ! Bugs, feature additions, and limitations

    BUG Updates
    BUG Line distinction
    BUG DONE Better window positioning
    BUG DONE Sending state information to live share clients - 
    FEATURE DONE Simplify device list storage (favorites, recent, all devices) - 
    FEATURE DONE UI for locked functionality
    FEATURE Hooks
    FEATURE Remember command input UI's location
    FEATURE Themes
    FEATURE Background:
        1. https://codepen.io/zgreen/pen/eYxZNG - Static background
        2. https://codepen.io/nikma/pen/pEjEVN - 8-bit
        3. https://codepen.io/tkain/pen/gRxVaG - Nyan cat
    FEATURE Buy app UI and functionality
    FEATURE Commercial license


*/