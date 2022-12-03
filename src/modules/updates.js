const { is } = require('electron-util');
const path = require('path');
const {download} = require("electron-dl");
const { BrowserWindow } = require("electron-acrylic-window");
const { file } = require('electron-settings');
var moduleprefix = "upd";

module.exports = {
    check: function(i) {
        return new Promise(function (resolve, reject) {
            self = i[moduleprefix];

            i.r.post(i, {
                "url": i.g.API_URL + "/updates/check",
                "data": {
                    "machine-id": i.g.var.machineid,
                    "current-version": i.g.APP_VERSION
                }
            })
                .then(function (res) {
                    if (!res) return;

                    if (res.body.status == "success") {

                        // Set settings
                        i.s.setSync("update", { 
                            "app-url": i.g.APP_URL, 
                            ...res.body.payload 
                        });

                        self.setui(i);
                        resolve(i.s.getSync("update"));
                    }
                    else {
                        console.log("Couldn't fetch update information.");
                        reject(res.body.payload.err);
                    }
                })
                .catch(function (err) {

                    if (i.s.hasSync("update")) {
                        console.error("Could not obtain updates information from server. Using stored updates information.");
                        self.setui(i);
                        resolve(i.s.getSync("update"));
                    }
                    else {
                        console.error("Could not obtain updates information from server and stored updates information was not found. Please connect to the internet and try again.");
                        self.setui(i);
                        i.s.setSync("update", {
                            "app-url": i.g.APP_URL,
                            "app-version": i.g.APP_VERSION,
                            "latest-version": null,
                            "update-available": false
                        });

                        resolve(i.s.getSync("update"));
                    }
                });
        })
    },
    setui: function (i) {
        Object.keys(i.g.var.windows).forEach(function (id, ii) {
            var window = i.g.var.windows[id];

            // If the latest version was downloaded but not installed
            var downloadhistory = i.s.getSync("update-download");
            if (downloadhistory && downloadhistory["version"] != i.s.getSync("update")["current-version"]) {
                console.log("An update was downloaded, but not installed.");
                window.webContents.send('update-installation-notification-push', downloadhistory);
            }

            // If the latest version was never downloaded; Or if the latest version was installed
            else {
                try { window.webContents.send('update-information-push', i.s.getSync("update")); } catch (e) {} 
            }
        });
    },
    
    download: function(i, event, info) {

        // Set directory
        info.properties.directory = path.join(path.dirname(__dirname), "/downloads");
        console.log("Downloading application update from " + info.url +  " to " + info.properties.directory);

        var windowid = info.windowid;
        var window = BrowserWindow.fromId(windowid);

        // Send download progress
        info.properties.onProgress = (status) => { window.webContents.send("update-download-progress-push", status); }
        info.properties.saveAs = false;
        info.properties.showBadge = true;
        info.properties.showProgressBar = true;
        info.properties.overwrite = true;
        
        // On download complete
        info.properties.onCompleted = (status) => { 
            console.log(status.fileSize + " bytes downloaded"); 
            window.webContents.send("update-download-notification-push", status); 

            i.s.setSync("update-download", {
                "version": i.s.getSync("update")["latest-version"],
                "location": status.path,
                "size": status.fileSize,
                "filename": status.filename || status.fileName
            });
        }
        
        // Download file
        download(window, info.url, info.properties);
    },

    install: function(i, event, data) {
        setTimeout(() => {
            
            console.log("Opening update binary at " + data.location);
            var child = require('child_process').execFile;

            try {
                child(data.location, function(err, data) {
                    if(err) {
                        event.sender.send('install-update-response', {
                            "status": "error",
                            "error" : err
                        });
                    }
                
                    setTimeout(() => {
                        console.log("Closing app for update process.");
                        i.app.exit();
                    }, 1000);
                });
            }
            catch (err) {
                event.sender.send('install-update-response', {
                    "status": "error",
                    "error" : err
                });
            }
        }, 200);
    }
    
}