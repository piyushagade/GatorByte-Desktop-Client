// const { BrowserWindow } = require('electron');
const { BrowserWindow } = require("electron-acrylic-window");
const windowStateKeeper = require('electron-window-state');
var moduleprefix = "w";

module.exports = {
    create: {
        serial: function (i) {
            let winstate = windowStateKeeper({
                defaultWidth: 450,
                defaultHeight: 500,
                file: "windowstate.json"
            });
            
            var numberofwindows = BrowserWindow.getAllWindows().length;

            console.log("Window location: " + winstate.x + ", " + winstate.y);
            console.log("Window dimensions: " + winstate.width + ", " + winstate.height);

            var win = new BrowserWindow({
                x: winstate.x + (numberofwindows - 1) % 3 * 40,
                y: winstate.y + (numberofwindows - 1) % 3 * 40,
                width: winstate.width,
                height: winstate.height,
                minWidth: 400,
                minHeight: 300,
                transparent: true,
                vibrancy:  {
                    theme: "#222222A1",
                    effect: "acrylic",
                    useCustomWindowRefreshMethod: false,
                    disableOnBlur: false
                },
                frame: false,
                icon: './src/static/icons/cereal-icon.ico',
                maximizable: false,
                fullscreenable: false,
                alwaysOnTop: true,
                webPreferences: { nodeIntegration: true, contextIsolation: false } 
            });
            
            // Manage window state
            winstate.manage(win);
        
            // Load HTML
            win.loadFile('./src/static/html/serial.html');
        
            // Open the DevTools.
            if(i.g.SHOW_DEV_TOOLS) win.webContents.openDevTools();

            i.g.var.windows[win.id] = win;

            win.on('show', () => {

                // Push bootstrap information
                setTimeout(() => {
                    win.webContents.send('bootstrap-information-push', {
                        windowtype: "main-window",
                        remoteurl: i.g.LIVE_SHARE_URL,
                        appname: i.g.APP_NAME,
                        appversion: i.g.APP_VERSION,
                        machineid: i.g.var.machineid,
                        fullfunctionality: i.g.var.fullfunctionality,
                        windowid: win.id,
                        windowscountid: BrowserWindow.getAllWindows().length,
                        quickconnectport: i.s.getSync("quickconnect-" + "windowid-" + BrowserWindow.getAllWindows().length)
                    });
                }, 250);
                    
                // Push subscription information to the window
                i.sub.setui(i);

                console.log("Created a new window with ID: " + win.id + ", count ID:" + BrowserWindow.getAllWindows().length);
            });

        
            win.on('closed', () => {
                win = null;
            });
        
            return win;
        },
        monitor: function (i, data) {
            let winstate = windowStateKeeper({
                defaultWidth: 450,
                defaultHeight: 500,
                file: "serialmonitorstate.json"
            });
            
            var numberofwindows = BrowserWindow.getAllWindows().length;

            var win = new BrowserWindow({
                x: winstate.x + (numberofwindows - 1) % 3 * 40,
                y: winstate.y + (numberofwindows - 1) % 3 * 40,
                width: winstate.width,
                height: winstate.height,
                minWidth: 400,
                minHeight: 300,
                transparent: true,
                vibrancy:  {
                    theme: "#222222A1",
                    effect: "acrylic",
                    useCustomWindowRefreshMethod: false,
                    disableOnBlur: false
                },
                frame: false,
                icon: './src/static/icons/cereal-icon.ico',
                maximizable: false,
                fullscreenable: false,
                alwaysOnTop: true,
                webPreferences: { nodeIntegration: true, contextIsolation: false } 
            });
            
            // Manage window state
            winstate.manage(win);
        
            // Load HTML
            win.loadFile('./src/static/html/serialmonitor.html');
        
            // Open the DevTools.
            if(i.g.SHOW_DEV_TOOLS) win.webContents.openDevTools();

            i.g.var.windows[win.id] = win;

            win.on('show', () => {

                // Push bootstrap information
                setTimeout(() => {
                    win.webContents.send('bootstrap-information-push', {
                        windowtype: "serial-monitor",
                        remoteurl: i.g.LIVE_SHARE_URL,
                        appname: i.g.APP_NAME,
                        appversion: i.g.APP_VERSION,
                        machineid: i.g.var.machineid,
                        fullfunctionality: i.g.var.fullfunctionality,
                        windowid: win.id,
                        windowscountid: BrowserWindow.getAllWindows().length,
                        quickconnectport: i.s.getSync("quickconnect-" + "windowid-" + BrowserWindow.getAllWindows().length),
                        
                        global: data
                    });
                }, 250);
                    
                // Push subscription information to the window
                i.sub.setui(i);

                console.log("Created a new serial monitor window with ID: " + win.id + ", count ID:" + BrowserWindow.getAllWindows().length);
            });

        
            win.on('closed', () => {
                win = null;
            });
        
            return win;
        },
        activation: function (i) {
            let winstate = windowStateKeeper({
                defaultWidth: 400,
                defaultHeight: 500,
                file: "activationwindowstate.json"
            });
        
            var win = new BrowserWindow({
                center: true,
                width: 400,
                height: 500,
                resizable: false,
                transparent: true,
                vibrancy:  {
                    theme: "#AAAAAAA1",
                    effect: "acrylic",
                    useCustomWindowRefreshMethod: true,
                    maximumRefreshRate: 60,
                    disableOnBlur: false
                },
                frame: false,
                icon: './src/static/icons/cereal-icon.ico',
                maximizable: false,
                fullscreenable: false,
                alwaysOnTop: true,
                webPreferences: {
                    nodeIntegration: true
                }
            });
            
            // Manage window state
            winstate.manage(win);
        
            // Load HTML
            win.loadFile('./src/static/html/activate.html');

            win.on('show', () => {
                win.webContents.send('machineid-information-push', {
                    machineid: i.g.var.machineid
                });
            });
        
            win.on('closed', () => {
                win = null;
            });
        
            return win;
        },
        notification: function (i, w, h) {
            i.g.var.notif_win = new BrowserWindow({
                width: i.g.SHOW_DEV_TOOLS ? 700 : w || 90,
                height: i.g.SHOW_DEV_TOOLS ? 400 : h || 10,
                frame: false,
                icon: i.g.ICON_PATH,
                title: i.g.APP_NAME,
                opacity: 0.0,
                webPreferences: {
                    nodeIntegration: true
                },
                resizable: false,
                skipTaskbar: i.g.SHOW_DEV_TOOLS ? false : true,
                maximizable: false,
                fullscreenable: false,
                center: true,
                alwaysOnTop: i.g.SHOW_DEV_TOOLS ? false : true 
            });
        
            i.g.var.notif_win.loadFile(i.g.NOTIFICATION_INDEX_PATH);
            if(i.g.SHOW_DEV_TOOLS) i.g.var.notif_win.webContents.openDevTools();
        }
    }
}