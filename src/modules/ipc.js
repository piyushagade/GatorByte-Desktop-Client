var SerialPort = require('serialport').SerialPort;
const { BrowserWindow } = require('electron');
const { dialog } = require('electron');
const exec = require('child_process').exec;
const path = require('path');
var moduleprefix = "i";
var flashmode = false;

module.exports = {
    self : {},
    listen: function (i) {

        // Get storage directory
        var storagedir = path.join(path.dirname(__dirname), "storage\\");

        // Create persistent storage files
        var devicesobject = {}; devicesobject[i.g.var.machineid] = [];
        if(!i.fs.existsSync(path.join(storagedir, "alldevices"))) i.fs.writeFileSync(path.join(storagedir, "alldevices"), JSON.stringify(devicesobject), "utf8");
        if(!i.fs.existsSync(path.join(storagedir, "config"))) i.fs.writeFileSync(path.join(storagedir, "config"), "[]", "utf8");

        /* 
            - Window operations
        */
       
        i.ipcm.on('ipc/close-window/request', (event, obj) => {

            var windowid = obj.windowid;
            var path = obj.path;

            console.log("\nClosing window with ID: " + windowid);
            if (!windowid) {
                i.app.exit();
                return;
            }

            try {
                var window = BrowserWindow.fromId(windowid);
                if (window) window.close();
                if (path && i.g.var.serports[path]) {
                    i.g.var.serports[path].close();
                    delete i.g.var.serports[path];
                }
            }
            catch (e) {
                console.log(e);
                console.log("GDC error: Couldn't close the windowid: " + String(windowid));
                i.app.exit();
            }
        });
        
        i.ipcm.on('new-window-request', (event) => {
            if (
                i.g.var.fullfunctionality ||
                (!i.g.var.fullfunctionality && Object.keys(i.g.var.windows).length == 0)
            ) {
                console.log("Full functionality is currently unlocked.");
                i.w.create.serial(i);
            }
            else {
                event.sender.send("ipc/full-functionality-locked-notification/push", {
                    code: "new-window-limit-reached"
                });
                console.log("This feature is not available. Please begin trial, or buy the product.");
            }
        });

        i.ipcm.on('new-activate-product-window-request', (event) => {
            i.w.create.activation(i);
        });

        
        /* 
            - Updating device attributes
        */

        i.ipcm.on('ipc/set-nickname/request', (event, data) => {

            // Get all devices
            var alldevices = JSON.parse(i.fs.readFileSync(path.join(storagedir, "alldevices"), "utf8"));
            alldevices[i.g.var.machineid].forEach(function (device, di) {
                if (data.pnpId == device.pnpId) {
                    device.nickname = data.nickname;
                }
            });
            i.fs.writeFileSync(path.join(storagedir, "alldevices"), JSON.stringify(alldevices), "utf8");
        });

        i.ipcm.on('ipc/set-uploaddelay/request', (event, data) => {

            // Check if full functionality is unlocked
            if (!i.g.var.fullfunctionality) {
                event.sender.send("ipc/full-functionality-locked-notification/push", {
                    code: "ipc/set-uploaddelay/request-prevent"
                });
                console.log("This feature is not available. Please begin trial, or buy the product.");
                return;
            }

            // Get all devices
            var alldevices = JSON.parse(i.fs.readFileSync(path.join(storagedir, "alldevices"), "utf8"));
            alldevices[i.g.var.machineid].forEach(function (device, di) {
                if (data.pnpId == device.pnpId) {
                    device.uploaddelay = data.uploaddelay;
                }
            });
            i.fs.writeFileSync(path.join(storagedir, "alldevices"), JSON.stringify(alldevices), "utf8");
        });

        i.ipcm.on('ipc/set-baud-rate/request', (event, data) => {

            // Get all devices
            var alldevices = JSON.parse(i.fs.readFileSync(path.join(storagedir, "alldevices"), "utf8"));
            alldevices[i.g.var.machineid].forEach(function (device, di) {
                if (data.pnpId == device.pnpId) {
                    device.baud = data.baud;
                }
            });
            i.fs.writeFileSync(path.join(storagedir, "alldevices"), JSON.stringify(alldevices), "utf8");
        });

        i.ipcm.on('ipc/set-favorite/request', (event, data) => {

            var alldevices = JSON.parse(i.fs.readFileSync(path.join(storagedir, "alldevices"), "utf8"));

            var filtered = alldevices[i.g.var.machineid].filter(function (device) {
                return device.favorite == true;
            });

            // Check if full functionality is unlocked, only 2 favorite devices can be added
            if (data.favorite && !i.g.var.fullfunctionality && filtered.length == 2) {
                event.sender.send("ipc/full-functionality-locked-notification/push", {
                    code: "set-favorite-limit-reached"
                });
                console.log("This feature is not available. Please begin trial, or buy the product.");
            }
            else {
                alldevices[i.g.var.machineid].forEach(function(entry, ei) {
                    if (entry.pnpId == data.pnpId) {
                        entry.favorite = data.favorite
                    }
                });
                i.fs.writeFileSync(path.join(storagedir, "alldevices"), JSON.stringify(alldevices), "utf8");
            }
        });

        
        /* 
            - Ports operations
        */

        i.ipcm.on('ipc/available-ports-list/request', (event) => {

            SerialPort.list()
                .then(function (ports) {

                    var AUTOCONNECT = true;

                    var connecteddevices = [];
                    var alldevices = JSON.parse(i.fs.readFileSync(path.join(storagedir, "alldevices"), "utf8"));
                    
                    // Filter out non-GatorByte devices
                    var acceptedproductid = ["8055", "0055"];

                    var gatorbytedevices = {}; gatorbytedevices[[i.g.var.machineid]] = {};
                    gatorbytedevices[[i.g.var.machineid]] = ports.filter(function (device) {
                        var found = acceptedproductid.indexOf(device.productId) !== -1;
                        if (found) return acceptedproductid.indexOf(device.productId) !== -1;
                        return true;
                    });

                    // Write all GB devices to list
                    i.fs.writeFileSync(path.join(storagedir, "allgbdevices"), JSON.stringify(gatorbytedevices), "utf8");

                    if (!gatorbytedevices[[i.g.var.machineid]]) gatorbytedevices[[i.g.var.machineid]] = [];
                    gatorbytedevices[[i.g.var.machineid]].forEach(function (row) {

                        // Check if the port exists in alldevices list
                        if (!alldevices[i.g.var.machineid]) alldevices[i.g.var.machineid] = [];
                        var filtered = alldevices[i.g.var.machineid].filter(function (device) {
                            return device.pnpId && device.pnpId == row.pnpId;
                        });

                        // Get attributes from alldevices list for the device and add to the list of connected devices
                        if (filtered.length > 0) {
                            connecteddevices.push({
                                ...row,
                                favorite: filtered[0].favorite,
                                baud: filtered[0].baud,
                                nickname: filtered[0].nickname,
                                uploaddelay: filtered[0].uploaddelay,
                                code: filtered[0].code
                            });

                            // TODO: Finish this
                            if (AUTOCONNECT) {

                            }
                        }

                        // If the device didn't exist in the alldevices list, add it to the alldevices list
                        if (filtered.length == 0) {
                            alldevices[i.g.var.machineid].push({
                                ...row,
                                favorite: false,
                                nickname: null,
                                uploaddelay: 15,
                                baud: 9600,
                                code: null
                            });
                            i.fs.writeFileSync(path.join(storagedir, "alldevices"), JSON.stringify(alldevices), "utf8");
                        }
                    });

                    // Get list of favorited devices
                    var favorites = alldevices[i.g.var.machineid].filter(function (device) { return device.favorite == true; });

                    event.sender.send("ipc/available-ports-list/response", {
                        alldevices: alldevices[i.g.var.machineid],
                        connecteddevices: connecteddevices,
                        favorites: favorites
                    });
                })
                .catch(function (err) {
                    console.log(err);
                });
        });

        i.ipcm.on('ipc/port-open/request', (event, obj) => {

            // Get port information from alldevices list
            var alldevices = JSON.parse(i.fs.readFileSync(path.join(storagedir, "alldevices"), "utf8"));

            // Get port metadata
            var port = alldevices[i.g.var.machineid].filter(function (device) { return device.pnpId != undefined && (device.pnpId == obj.pnpId) })[0];

            function connect () {
                var temp = new SerialPort({path:  port.path, baudRate: parseInt(port.baud)}, { autoOpen: false });
                var error = false;
                temp.on('error', function(err) {
                    error = true;
                });
                return { port: temp, error: error};
            }

            // Check if the requested device on port is connected to the computer
            SerialPort.list()
                .then(function (ports) {
                    var connected = false;
                    ports.forEach(function (row) {
                        if (row.path == port.path) {
                            connected = true;
                        }
                    });

                    // If the port was already opened and is connected, close it
                    if (i.g.var.serports[port.path]) { 
                        
                        // Send response to sender process
                        event.sender.send("ipc/select-port/response", {
                            ...port,
                            success: false,
                            error: "port-busy"
                        });

                        return;
                    }
                    
                    if (flashmode) return;

                    // Open the port
                    var result = connect();
                    if (!result.error && connected) {

                        console.log("\nPort opened: " + result.port.settings.path + " at " + result.port.settings.baudRate + " bps");

                        // Send ping
                        result.port.write("##CL-GDC-PING##");
                        
                        i.g.var.serports[result.port.settings.path] = result.port;

                        // On close event
                        i.g.var.serports[result.port.settings.path].on('close', function () {
                            console.log("Port closed: " + port.path + ". Number of open ports: " + Object.keys(i.g.var.serports).length);
                            try {
                                event.sender.send("ipc/port-disconnected/notification ", {
                                    port: result.port.settings.path,
                                    baud: result.port.settings.baudRate,
                                });

                                delete i.g.var.serports[port.path];
                            }
                            catch (e) {}
                        });
                        
                        // On new data event / on new serial data
                        i.g.var.serports[result.port.settings.path].on('data', function (data) {

                            // Extract text
                            data = new TextDecoder().decode(data);

                            // Log data to file
                            if (!i.fs.existsSync(path.join(storagedir, "seriallog"))) i.fs.mkdirSync(path.join(storagedir, "seriallog"));
                            i.fs.appendFileSync(path.join(storagedir, "seriallog", result.port.settings.path), data, "utf8");

                            // Clear detector timer
                            if (data.indexOf("##CL-GDC-PONG##") !== -1) {
                                console.log("PONG detected");
                                BrowserWindow.getAllWindows().forEach(function (window, wi) {
                                    window.webContents.send("ipc/pong-received-notification/push", {
                                        path: result.port.settings.path,
                                        pnpId: result.port.settings.pnpId
                                    });
                                })
                                clearInterval(i.g.var.timers.gbdetector);
                                return;
                            }

                            // Device SN
                            if (data.indexOf("##CL-GDC-SN::") !== -1) {
                                var sn = data.replace(/##/g, "").split("::")[1].trim();
                                console.log("Received SN: " + sn);
                                BrowserWindow.getAllWindows().forEach(function (window, wi) {
                                    window.webContents.send("ipc/device-sn-notification/push", {
                                        sn: sn
                                    });
                                });
                                return;
                            }

                            // Device environment
                            if (data.indexOf("##CL-GDC-ENV::") !== -1) {
                                var env = data.replace(/##/g, "").split("::")[1].trim();
                                console.log("Device environment: " + env);
                                BrowserWindow.getAllWindows().forEach(function (window, wi) {
                                    window.webContents.send("ipc/device-env-notification/push", {
                                        env: env
                                    });
                                });
                                return;
                            }

                            // GatorByte is now in GDC mode
                            if (data.indexOf("##CL-GB-READY##") !== -1) {
                                console.log("GB has completed setup");

                                BrowserWindow.getAllWindows().forEach(function (window, wi) {
                                    window.webContents.send("ipc/gb-ready-notification/push", {
                                        path: result.port.settings.path,
                                        pnpId: result.port.settings.pnpId
                                    });
                                });

                                // // Request hash from config on SD
                                // i.g.var.serports[result.port.settings.path].write("cfg:hash");
                                return;
                            }

                            // SD is initialized and ready
                            if (data.indexOf("##CL-GB-SD-READY##") !== -1) {
                                console.log("SD is initialized");

                                BrowserWindow.getAllWindows().forEach(function (window, wi) {
                                    window.webContents.send("ipc/gb-sd-ready-notification/push", {
                                        path: result.port.settings.path,
                                        pnpId: result.port.settings.pnpId
                                    });
                                });

                                // Request hash from config on SD
                                i.g.var.serports[result.port.settings.path].write("cfg:hash");
                                return;
                            }

                            // SD is absent
                            if (data.indexOf("##CL-GB-SD-ABS##") !== -1) {
                                console.log("SD is absent");

                                BrowserWindow.getAllWindows().forEach(function (window, wi) {
                                    window.webContents.send("ipc/gb-sd-absent-notification/push", {
                                        path: result.port.settings.path,
                                        pnpId: result.port.settings.pnpId
                                    });
                                });

                                return;
                            }

                            // SD R/W test failed
                            if (data.indexOf("##CL-GB-SD-RWF##") !== -1) {
                                console.log("SD R/W test failed");

                                BrowserWindow.getAllWindows().forEach(function (window, wi) {
                                    window.webContents.send("ipc/gb-sd-rwf-notification/push", {
                                        path: result.port.settings.path,
                                        pnpId: result.port.settings.pnpId
                                    });
                                });

                                return;
                            }

                            // SD initialization failed
                            if (data.indexOf("##CL-GB-SD-UINT##") !== -1) {
                                console.log("SD couldn't initialize");

                                BrowserWindow.getAllWindows().forEach(function (window, wi) {
                                    window.webContents.send("ipc/gb-sd-uint-notification/push", {
                                        path: result.port.settings.path,
                                        pnpId: result.port.settings.pnpId
                                    });
                                });

                                return;
                            }

                            // Check if the data being received is file data
                            let filedata = data.indexOf("fdl:") !== -1;

                            if (!filedata) {

                                // if (data.trim().length > 0) console.log("GB > " + data);

                                while (data.indexOf("\r\n") > 0) {
                                    var index = data.indexOf("\r\n");
                                    data = data.substring(0, index) + "#!CRL-SPL-STR#LINE-BRK##" + data.substring(index + "\r\n".length, data.length);
                                }
                                while (data.indexOf("\r") > 0) {
                                    var index = data.indexOf("\r");
                                    data = data.substring(0, index) + "#!CRL-SPL-STR#LINE-BRK##" + data.substring(index + "\r".length, data.length);
                                }
                                while (data.indexOf("\n") > 0) {
                                    var index = data.indexOf("\n");
                                    data = data.substring(0, index) + "#!CRL-SPL-STR#LINE-BRK##" + data.substring(index + "\n".length, data.length);
                                }
                            }

                            // Send data to renderer
                            event.sender.send('ipc/serial-data/new', {
                                data: data,
                                crlf: false,
                                lastemptychar: false,
                            });

                            return;
                        });

                        // Send response to sender process
                        event.sender.send("ipc/select-port/response", {
                            ...port,
                            success: !result.error && connected,
                            error: null
                        });

                        // Save device for quick connect
                        i.s.setSync("quickconnect-" + "windowid-" + obj.windowid, port);
                        console.log("Device saved for quick connect. Port: " + port.path);
                    }
                    else {
                        console.log("Port could not be opened: " + port.path);
                        
                        // Save device for quick connect
                        i.s.setSync("quickconnect-" + "windowid-" + obj.windowid, port);
                        console.log("Device saved for quick connect. Port: " + port.path);

                        // Send response to sender process
                        event.sender.send("ipc/select-port/response", {
                            ...port,
                            success: false,
                            error: null
                        });
                    };
                    
                });
        });

        i.ipcm.on('ipc/port-close/request', (event, port) => {
            var windowid = port.windowid;

            console.log("UI requested port close for: " + port.path);

            if (i.g.var.serports[port.path]) {
                i.g.var.serports[port.path].close();
                delete i.g.var.serports[port.path];
            }
            // else {
                try {
                    event.sender.send("ipc/port-disconnected/notification ", {
                        port: port.path,
                        baud: port.baudRate,
                    });
                }
                catch (e) {}
            // }

        });

        
        /* 
            - Live sharing
        */

        i.ipcm.on('set-live-share-code-request', (event, data) => {
            console.log("Setting live share code for " + data.path + " to: " + data.code);

            var alldevices = JSON.parse(i.fs.readFileSync(path.join(storagedir, "alldevices"), "utf8"));
            alldevices[i.g.var.machineid].forEach(function(entry, ei) {
                var forceupdate = data.forceupdate || !entry.code;
                if (entry.pnpId == data.pnpId && forceupdate) {
                    entry.code = data.code
                }
            });
            i.fs.writeFileSync(path.join(storagedir, "alldevices"), JSON.stringify(alldevices), "utf8");
        });

        
        /* 
            - Updates and installations
        */

        i.ipcm.on('download-update-request', (event, obj) => {

            // Download the file
            i.upd.download(i, event, obj);
        });

        i.ipcm.on('install-update-request', (event, obj) => {

            // Install the update
            i.upd.install(i, event, obj);
        });

        
        /* 
            - Miscellaneous operations
        */

        i.ipcm.on('ipc/bootstrap-data/request', (event, data) => {

            event.sender.send('bootstrap-information-push', {
                remoteurl: i.g.LIVE_SHARE_URL,
                appname: i.g.APP_NAME,
                appversion: i.g.APP_VERSION,
                machineid: i.g.var.machineid,
                fullfunctionality: i.g.var.fullfunctionality,
                windowid: data.windowid,
                windowtype: data.windowtype,
                windowscountid: BrowserWindow.getAllWindows().length,
                quickconnectport: i.s.getSync("quickconnect-" + "windowid-" + BrowserWindow.getAllWindows().length)
            });
        });

        i.ipcm.on('ipc/command/push', (event, obj) => {

            var command = obj.command;

            if (!i.g.var.serports[obj.path]) {
                console.log("GB < X " + command + ": " + obj.path + " Port not open.");
                event.sender.send("ipc/send-command/response", { "status": false });
                return;
            }
            
            i.g.var.serports[obj.path].write(command + "\r\n", function(err) {
                if (err) {
                    console.log("GB < X " + command + ": " + obj.path + " See the log for error.");
                    console.log(err);
                    event.sender.send("ipc/send-command/response", { "status": false }); 
                    return console.log('Error on write: ', err.message);
                }
                console.log("GB < " + command);
                event.sender.send("ipc/send-command/response", { "status": true }); 
            });
            
        });

        i.ipcm.on('ipc/open-url/request', (event, obj) => {

            console.log("Opening URL in browser: " + obj.url);
            
            const os = require('os');
            const { shell } = require('electron');
            if (os.platform() === 'win32') shell.openExternal(obj.url);
            else if (os.platform() === 'linux') require('child_process').exec('xdg-open ' + obj.url);

        });

        i.ipcm.on('ipc/save-file/request', (event, obj) => {
            var filedata = obj.filedata;
            var filename = obj.filename;

            if (!filename) return;

            console.log("Saving file to computer: " + filename);
            
            //renderer.js - renderer process example
            var window = BrowserWindow.fromId(obj.windowid);

            let options = {
                window: window,
                parent: window,
                title: "Save the downloaded file",
                defaultPath: obj.filename,
                buttonLabel: "Save",
                filters: [
                    {
                        name: 'All Files',
                        extensions: ['*']
                    }
                ]
            }

            dialog.showSaveDialog(options).then(file => {
                if (!file.canceled) {
                    i.fs.writeFile(file.filePath.toString(), obj.filedata, function (err) {
                        if (err) {
                            event.sender.send("ipc/save-file/response", {
                                ...obj,
                                success: false,
                                message: "Error saving file"
                            });
                            return;   
                        }
                        
                        console.log('File saved.');
                        event.sender.send("ipc/save-file/response", {
                            ...obj,
                            success: true,
                            message: "Saved successfully"
                        });
                    });
                }
                else {
                    event.sender.send("ipc/save-file/response", {
                        ...obj,
                        success: false,
                        message: "Saving file cancelled"
                    });
                }
            }).catch(err => {
                console.log(err)
            });
        });

        i.ipcm.on('ipc/upload-file/request', (event, obj) => {
            var filename = obj.filename;
            var filepath = obj.filepath;
            var filedata = i.fs.readFileSync(filepath, "utf-8").replace(/\n/g, "~").replace(/ /g, "`");
            
            console.log("Uploading file to GatorByte: " + filename);

            // Send filename
            i.g.var.serports[obj.path].write("fuplm:" + filename, (err) => {
                if (err) {
                    console.log("Error uploading file chunk: " + count);
                    event.sender.send("ipc/upload-file/response", { "status": false }); 
                }
            });

            setTimeout(() => {
                for (let count = 0; count < filedata.length; count += 30) {
                    const chunk = "fupl:" + filedata.slice(count, count + 30);
                    i.g.var.serports[obj.path].write(chunk, (err) => {
                        if (err) {
                            console.log("Error uploading file chunk: " + count);
                            event.sender.send("ipc/upload-file/response", { "status": false }); 
                        }
                    });
                }
            
                console.log("Upload complete");
                event.sender.send("ipc/upload-file/response", { "status": true }); 
            }, 500);

        });

        i.ipcm.on('ipc/flash-firmware/request', (event, obj) => {
            flashmode = true;
            console.log("Flashing firmware: " + obj["filepath"]);

            // Connect at 1200 bps
            setTimeout(() => {
                i.g.var.serports[obj.portpath] = new SerialPort({path:  obj.portpath, baudRate: 1200}, { autoOpen: true });
            }, 3000);

            // Reset to safe mode
            setTimeout(() => {
                try { i.g.var.serports[obj.portpath].close(); } catch (e) { }
            }, 4000);

            // Flash firmware
            setTimeout(() => {
                var sep = " ";
                var quotes = "\"";
                var tool = path.join(path.dirname(__dirname), "tools", "bossa", "bossac.exe");
                var arguments = "--write" + sep + "--verify" + sep + "--reset" + sep +  quotes + obj.filepath + quotes;

                console.log(tool + sep + arguments);

                // call the function
                execute(tool + sep + arguments, (output, error) => {
                    if (error) console.log(error);
                    else {
                        flashmode = false;
                    }
                });
            }, 5000);

            function execute(command, callback) {
                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        on_flash_complete(error);
                    }
                    if (stderr) {
                        on_flash_complete(stdout);
                    }
                    else {
                        on_flash_complete(stdout);
                    }
                });
            };

            function on_flash_complete  (message) {
                console.log(message);
                message = message && typeof message === "string" ? message.toLowerCase() : "";

                if (
                    message.indexOf("verify successful") > -1 &&
                    message.indexOf("cpu reset.") > -1
                ) {
                    event.sender.send("ipc/flash-firmware/response", {
                        status: "success"
                    });
                    
                    setTimeout(() => {
                        delete i.g.var.serports[obj.portpath];
                        flashmode = false;
                    }, 4000);

                }
                else {
                    event.sender.send("ipc/flash-firmware/response", {
                        status: "failure",
                        message: message
                    });
                    flashmode = false;
                    console.log(message);
                }
            }
        });
        
        i.ipcm.on('ipc/config-data-get/request', (event, obj) => {
            
            var configobject = null;
            var pnpId = obj.port.pnpId;

            var data = JSON.parse(i.fs.readFileSync(path.join(storagedir, "config"), "utf8"));
            data.forEach(function (item, ii) {
                if (item.pnpId == pnpId) {
                    configobject = item.configobject;
                    pnpId = item.pnpId;
                }
            });

            event.sender.send("ipc/config-data-get/response", {
                pnpId: pnpId,
                configobject: configobject
            });
        });
        
        i.ipcm.on('ipc/config-data-save/request', (event, obj) => {
            var configobject = obj.configobject;
            var pnpId = obj.port.pnpId;

            var data = JSON.parse(i.fs.readFileSync(path.join(storagedir, "config"), "utf8"));
            var found = false;
            data.forEach(function (item, ii) {
                if (item.pnpId == pnpId) found = true;
            });

            // Update object
            if (found) {
                data.forEach(function (item, ii) {
                    if (item.pnpId == pnpId) {
                        item.configobject = configobject;
                    }
                });
            }
            
            // Add object
            else {
                data.push({
                    configobject: configobject,
                    pnpId: pnpId
                });
            }

            // Write to storage
            i.fs.writeFileSync(path.join(storagedir, "config"), JSON.stringify(data), "utf8");
        });
        
        i.ipcm.on('ipc/open-serial-monitor/request', (event, obj) => {
            console.log(obj);

            i.w.create.monitor(i, obj);
        });
        
        i.ipcm.on('ipc/toggle-gb-op-lock/request', (event, obj) => {
            var state = obj.state;
            var port = obj.port;

            // Send command to the GatorByte            
            i.g.var.serports[port.path].write("##CL-GDC-LOCK##");
        });
    }
}