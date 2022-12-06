const { SerialPort } = require('serialport');
const { BrowserWindow } = require('electron');
const { dialog } = require('electron');
const path = require('path');
var moduleprefix = "i";

module.exports = {
    listen: function (i) {
        
        // Get storage directory
        var storagedir = path.join(path.dirname(__dirname), "storage\\");

        // Create persistent storage files
        if(!i.fs.existsSync(path.join(storagedir, "alldevices"))) i.fs.writeFileSync(path.join(storagedir, "alldevices"), "[]", "utf8");

        /* 
            - Window operations
        */
       
        i.ipcm.on('close-window-request', (event, obj) => {

            var windowid = obj.windowid;
            var path = obj.path;

            console.log("\nClosing window with ID: " + windowid);
            var window = BrowserWindow.fromId(windowid);
            if (window) window.close();
            if (path && i.g.var.serports[path]) {
                i.g.var.serports[path].close();
                delete i.g.var.serports[path];
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

        i.ipcm.on('set-device-nickname', (event, data) => {

            // Get all devices
            var alldevices = JSON.parse(i.fs.readFileSync(path.join(storagedir, "alldevices"), "utf8"));
            alldevices.forEach(function (device, di) {
                if (data.pnpId == device.pnpId) {
                    device.nickname = data.nickname;
                }
            });
            i.fs.writeFileSync(path.join(storagedir, "alldevices"), JSON.stringify(alldevices), "utf8");
        });

        i.ipcm.on('set-device-uploaddelay', (event, data) => {

            // Check if full functionality is unlocked
            if (!i.g.var.fullfunctionality) {
                event.sender.send("ipc/full-functionality-locked-notification/push", {
                    code: "set-device-uploaddelay-prevent"
                });
                console.log("This feature is not available. Please begin trial, or buy the product.");
                return;
            }

            // Get all devices
            var alldevices = JSON.parse(i.fs.readFileSync(path.join(storagedir, "alldevices"), "utf8"));
            alldevices.forEach(function (device, di) {
                if (data.pnpId == device.pnpId) {
                    device.uploaddelay = data.uploaddelay;
                }
            });
            i.fs.writeFileSync(path.join(storagedir, "alldevices"), JSON.stringify(alldevices), "utf8");
        });

        i.ipcm.on('set-device-baud-rate', (event, data) => {

            // Get all devices
            var alldevices = JSON.parse(i.fs.readFileSync(path.join(storagedir, "alldevices"), "utf8"));
            alldevices.forEach(function (device, di) {
                if (data.pnpId == device.pnpId) {
                    device.baud = data.baud;
                }
            });
            i.fs.writeFileSync(path.join(storagedir, "alldevices"), JSON.stringify(alldevices), "utf8");
        });

        i.ipcm.on('set-favorite-request', (event, data) => {

            var alldevices = JSON.parse(i.fs.readFileSync(path.join(storagedir, "alldevices"), "utf8"));

            var filtered = alldevices.filter(function (device) {
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
                alldevices.forEach(function(entry, ei) {
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

        i.ipcm.on('get-available-ports-request', (event) => {

            SerialPort.list()
                .then(function (ports) {
                    var connecteddevices = [];
                    var alldevices = JSON.parse(i.fs.readFileSync(path.join(storagedir, "alldevices"), "utf8"));
                    
                    // Filter out non-GatorByte devices
                    var acceptedproductid = ["8055", "0055"];

                    var gatorbytedevices = ports.filter(function (device) { 
                        return acceptedproductid.indexOf(device.productId) !== -1;
                    });

                    gatorbytedevices.forEach(function (row) {

                        // Check if the port exists in alldevices list
                        var filtered = alldevices.filter(function (device) {
                            return device.pnpId == row.pnpId;
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

                        }

                        // If the device didn't exist in the alldevices list, add it to the list
                        if (filtered.length == 0) {
                            alldevices.push({
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
                    var favorites = alldevices.filter(function (device) { return device.favorite == true; });

                    event.sender.send("get-available-ports-response", {
                        alldevices: alldevices,
                        connecteddevices: connecteddevices,
                        favorites: favorites
                    });
                })
                .catch(function (err) {
                    console.log(err);
                });
        });

        i.ipcm.on('open-port-request', (event, obj) => {

            // Get port information from alldevices list
            var alldevices = JSON.parse(i.fs.readFileSync(path.join(storagedir, "alldevices"), "utf8"));
            var port = alldevices.filter(function (device) { return device.pnpId == obj.pnpId })[0];

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
                        event.sender.send("select-port-response", {
                            ...port,
                            success: false,
                            error: "port-busy"
                        });

                        return;
                    }

                    // Open the port
                    var result = connect();
                    if (!result.error && connected) {
                        console.log("\nPort opened: " + port.path + " at " + port.baud + " bps");

                        // Send ping
                        result.port.write("##CEREAL-GDC-PING##");
                        
                        i.g.var.serports[result.port.settings.path] = result.port;

                        // On close event
                        i.g.var.serports[result.port.settings.path].on('close', function () {
                            console.log("Port closed: " + port.path + ". Number of open ports: " + Object.keys(i.g.var.serports).length);
                            try {
                                event.sender.send("port-disconnected-notification-push ", {
                                    port: result.port.settings.path,
                                    baud: result.port.settings.baudRate,
                                });

                                delete i.g.var.serports[port.path];
                            }
                            catch (e) {}
                        });

                        // On new data event
                        i.g.var.serports[result.port.settings.path].on('data', function (data) {

                            data = new TextDecoder().decode(data);

                            // Clear detector timer
                            if (data.indexOf("##CEREAL-GDC-PONG##") !== -1) {
                                console.log("PONG detected");
                                clearInterval(i.g.var.timers.gbdetector);
                                return;
                            }

                            let filedata = data.indexOf("fdl:") > -1;

                            if (!filedata) {
                                while (data.indexOf("\r\n") > 0) {
                                    var index = data.indexOf("\r\n");
                                    data = data.substring(0, index) + "#!cereal-special-string#line-break##" + data.substring(index + "\r\n".length, data.length);
                                }
                                while (data.indexOf("\r") > 0) {
                                    var index = data.indexOf("\r");
                                    data = data.substring(0, index) + "#!cereal-special-string#line-break##" + data.substring(index + "\r".length, data.length);
                                }
                                while (data.indexOf("\n") > 0) {
                                    var index = data.indexOf("\n");
                                    data = data.substring(0, index) + "#!cereal-special-string#line-break##" + data.substring(index + "\n".length, data.length);
                                }
                            }

                            // Send data to renderer
                            event.sender.send('new-serial-data-push', {
                                data: data,
                                crlf: false,
                                lastemptychar: false,
                            });
                            return;
                        });

                        // Send response to sender process
                        event.sender.send("select-port-response", {
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
                        event.sender.send("select-port-response", {
                            ...port,
                            success: false,
                            error: null
                        });
                    };
                    
                });
        });

        i.ipcm.on('close-port-request', (event, port) => {
            var windowid = port.windowid;

            console.log("UI requested port close for: " + port.path);

            if (i.g.var.serports[port.path]) {
                i.g.var.serports[port.path].close();
                delete i.g.var.serports[port.path];
            }
            else {
                try {
                    event.sender.send("port-disconnected-notification-push ", {
                        port: port.path,
                        baud: port.baudRate,
                    });
                }
                catch (e) {}
            }

        });

        
        /* 
            - Live sharing
        */

        i.ipcm.on('set-live-share-code-request', (event, data) => {
            console.log("Setting live share code for " + data.path + " to: " + data.code);

            var alldevices = JSON.parse(i.fs.readFileSync(path.join(storagedir, "alldevices"), "utf8"));
            alldevices.forEach(function(entry, ei) {
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

        i.ipcm.on('bootstrap-data-request', (event, data) => {
            
            event.sender.send('bootstrap-information-push', {
                remoteurl: i.g.LIVE_SHARE_URL,
                appname: i.g.APP_NAME,
                appversion: i.g.APP_VERSION,
                machineid: i.g.var.machineid,
                fullfunctionality: i.g.var.fullfunctionality,
                windowid: data.windowid,
                windowscountid: BrowserWindow.getAllWindows().length,
                quickconnectport: i.s.getSync("quickconnect-" + "windowid-" + BrowserWindow.getAllWindows().length)
            });
        });

        i.ipcm.on('send-command-request', (event, obj) => {
            var command = obj.command;

            if (!i.g.var.serports[obj.path]) {
                console.log("Error sending " + obj.path + " a command: " + command + ". Port not open.");
                event.sender.send("send-command-response", { "status": false });
                return;
            }
            
            i.g.var.serports[obj.path].write(command + "\r\n", function(err) {
                if (err) {
                    console.log("Error sending " + obj.path + " a command: " + command + ". Unknown error.");
                    event.sender.send("send-command-response", { "status": false }); 
                    return console.log('Error on write: ', err.message);
                }
                console.log("Sent " + obj.path + " a command: " + command);
                event.sender.send("send-command-response", { "status": true }); 
            });
            
        });

        i.ipcm.on('open-url-request', (event, obj) => {

            console.log("Opening URL in browser: " + obj.url);
            
            const os = require('os');
            const { shell } = require('electron');
            if (os.platform() === 'win32') shell.openExternal(obj.url);
            else if (os.platform() === 'linux') require('child_process').exec('xdg-open ' + obj.url);

        });

        i.ipcm.on('ipc/save-file/request', (event, obj) => {
            var filedata = obj.filedata;
            var filename = obj.filename;

            console.log("A request to save file received: " + filename);
            
            //renderer.js - renderer process example
            var window = BrowserWindow.fromId(obj.windowid);

            let options = {
                window: window,
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

        i.ipcm.on('ipc/flash-firmware/request', (event, obj) => {
            const exec = require('child_process').exec;

            console.log("Flashing firmware: " + obj["filepath"]);
            function execute(command, callback) {
                exec(command, (error, stdout, stderr) => { 
                    callback(stdout); 
                });
            };


            // --port COM19 --write --verify --reset firmware.bin
            var sep = " ";
            var quotes = "\"";
            var tool = path.join(path.dirname(__dirname), "tools", "bossa", "bossac.exe");
            var arguments = "--port" + sep + obj.portpath + sep + "--write" + sep + "--verify" + sep + "--reset" + sep +  quotes + obj.filepath + quotes;

            console.log(tool + sep + arguments);
            
            // call the function
            execute(tool + sep + arguments, (output, error) => {
                console.log(output);
                if (error) console.log(error);

                // Open port
            });

        });
    }
}