function uidashboardsubapp(){
    var self;
    self = this;
    self.version = 1.0;
    self.ls = window.sls;
    self.f = new functionsubapp().init();
    self.ipcr = require('electron').ipcRenderer;
    self.pwrsv =  require('electron').remote.powerSaveBlocker;
    self.a = global.accessors;
    self.panel = $(".dashboard-panel");


    self.init = function () {

        // Update dashboard items
        self.display_dashboard_items();
        global.timers.dashboardrefresh = setInterval(function () { self.display_dashboard_items(); }, 5000);
        
        // Start listeners
        self.listeners();

        return self;
    }

    self.sendcommand = function (command) {

        self.ipcr.send('send-command-request', {
            command: command,
            windowid: global.states.windowid,
            path: global.port.path
        });
    }
    
    self.listeners = function () {

        // Dashboard big button
        $(".home-panel .dashboard-button").off("click").click(function () {
            $(".dashboard-panel").removeClass("hidden");
            $(".home-panel").addClass("hidden");
            
            // Send request to get GatorByte to send sd files list
            var prefix = "##GB##", suffix = "#EOF#";
            self.ipcr.send('send-command-request', {
                command: prefix + "db:enter" + suffix,
                windowid: global.states.windowid,
                path: global.port.path
            });
        });

        // GB lock button
        $(".home-panel").find(".toggle-gb-lock-button").off("click").click(function () {

            var state = $(this).attr("state") || "lock";

            self.ipcr.send('ipc/toggle-gb-op-lock/request', {
                state: state,
                port: global.port
            });
        });

        // Fetch sensor readings
        self.panel.find(".fetch-sensor-readings-button").off("click").click(function () {

            // Update UI
            $(this).find(".icon").addClass("rotate-animation");
            self.panel.find(".sensor-reading-item").addClass("disabled");
            
            // Send request to GatorByte (fetch sensor readings)
            self.sendcommand("fsr:all");
        });

        // Fetch sensor reading individually
        self.panel.find(".sensor-reading-item").off("click").click(function () {
            var sensor = $(this).attr("type");

            // Update UI
            self.panel.find(".fetch-sensor-readings-button").find(".icon").addClass("rotate-animation");
            $(this).addClass("disabled");
            
            // Send request to GatorByte (fetch sensor readings)
            self.sendcommand("fsr:" + sensor);
        });
    }
    
    self.process_dashboard_items = function (line) {
        line = line.replace(/gdc-db::/, "").replace(/<br>/g, "").trim();

        // Add info to global object
        var key = line.split("=")[0].trim().toLowerCase();
        var value = line.split("=")[1];

        if (key == "fsr") self.process_sensor_readings(value);
        else {

            // Get data from storage
            var data = self.f.b64_to_json(localStorage.getItem("dashboard/data") || self.f.json_to_b64({}));
            
            // Initialize global object if not done already
            if (data && data[global.port.pnpId]) global.dashboard = data;
            else global.dashboard[global.port.pnpId] = global.dashboard[global.port.pnpId] || {};

            // Set key and value in global object
            global.dashboard[global.port.pnpId][key] = value;

            // Update storage
            localStorage.setItem("dashboard/data", self.f.json_to_b64(global.dashboard));

            // Update items in the dashboard
            self.update_dashboard_item({
                fresh: true,
                key: key, 
                value: value
            });

            self.on_dashboard_item_update(key);
        }
    }

    self.update_dashboard_item = function (args) {
        var parent = $(".dashboard-panel");

        // Is the data fresh?
        var fresh = args && args.fresh ? true : false;
        var key = args ? args.key : null;
        var value = args ? args.value : null;
        
        // Check if port is not connected
        if (!global.port) return;

        // Set device in awake state
        if (fresh && key == "modem") {
            var el = parent.find(".modem-activity-text");
            var modemstatus;
            if (value == "active") {
                el.parent().css("border-left", "4px solid #94bb34");
                modemstatus = "Active";
            }
            if (value == "not-responding") {
                el.parent().css("border-left", "4px solid orange");
                modemstatus = "Error";
            }
            if (value == "off") {
                el.parent().css("border-left", "4px solid red");
                modemstatus = "Off";
            }
            el.text(modemstatus);
        }
        if (fresh && key == "power") {
            var el = parent.find(".power-status-text");
            var status;
            if (value == "awake") {
                status = "Awake";
                el.parent().css("border-left", "4px solid #94bb34");
                $(".dashboard-item").css("opacity", 1);
            }
            if (value == "asleep") {
                status = "Sleeping";
                el.parent().css("border-left", "4px solid red");
                $(".dashboard-item").css("opacity", 0.2);
            }
            el.text(status).css("opacity", 1);
        }
        if (fresh && key == "cell") {
            var el = parent.find(".cellular-status-text");

            var status;
            if (value == "connected") {
                status = "Connected";
                el.parent().css("border-left", "4px solid #94bb34");
                $(".dashboard-item").css("opacity", 1);
            }
            if (value == "disconnected") {
                status = "Disconnected";
                el.parent().css("border-left", "4px solid red");
            }
            if (value == "upload-success") {
                status = "Uploaded";
                el.parent().css("border-left", "4px solid #0066ff");
            }
            if (value == "upload-failed") {
                status = "Upload fail";
                el.parent().css("border-left", "4px solid #ff8d00");
            }
            el.text(status).css("opacity", 1);
        }
        if (fresh && key == "mqtt") {
            var el = parent.find(".mqtt-status-text");
            var status = value == "1" ? "Connected" : "Disconnected";
            el.parent().css("border-left", "4px solid " + (value == "1" ? "#94bb34" : "red"));
            el.text(status);
        }
        if (key == "modem-fw") {
            var el = parent.find(".modem-firmware-text");
            var modemfirmware = value;
            el.text(modemfirmware);
        }
        if (key == "modem-imei") {
            var el = parent.find(".modem-imei-text");
            var modemimei = value;
            el.text(modemimei);
        }
        if (key == "sim-iccid") {
            var el = parent.find(".sim-iccid-text");
            var iccid = value;
            el.text(iccid);
        }
        if (key == "cops") {
            var el = parent.find(".cell-operator-text");
            var cops = value;
            el.text(cops);
        }
        if (fresh && key == "rssi") {
            var el = parent.find(".cell-rssi-text");
            var rssi = value;
            el.text(rssi);
        }
        if (fresh && key == "ph") {
            var el = parent.find(".sensor-ph-text");
            el.text(value);
            
            self.panel.find(".sensor-reading-item[type='ph']").removeClass("disabled");     
            parent.find(".last-updated-timestamp").text("Last updated: " + moment(moment.now()).format("LLL"));
            self.panel.find(".fetch-sensor-readings-button").find(".icon").removeClass("rotate-animation");
        }
        if (fresh && key == "rtd") {
            var el = parent.find(".sensor-rtd-text");
            el.text(value);
            
            self.panel.find(".sensor-reading-item[type='rtd']").removeClass("disabled");            
            parent.find(".last-updated-timestamp").text("Last updated: " + moment(moment.now()).format("LLL"));
            self.panel.find(".fetch-sensor-readings-button").find(".icon").removeClass("rotate-animation");
        }
        if (fresh && key == "ec") {
            var el = parent.find(".sensor-ec-text");
            el.text(value);
            
            self.panel.find(".sensor-reading-item[type='ec']").removeClass("disabled");     
            parent.find(".last-updated-timestamp").text("Last updated: " + moment(moment.now()).format("LLL"));
            self.panel.find(".fetch-sensor-readings-button").find(".icon").removeClass("rotate-animation");
        }
        if (fresh && key == "dox") {
            var el = parent.find(".sensor-dox-text");
            el.text(value);
            
            self.panel.find(".sensor-reading-item[type='dox']").removeClass("disabled");     
            parent.find(".last-updated-timestamp").text("Last updated: " + moment(moment.now()).format("LLL"));
            self.panel.find(".fetch-sensor-readings-button").find(".icon").removeClass("rotate-animation");
        }
        if (fresh && key == "loopiteration") {
            var el = parent.find(".loop-iteration-text");
            parent.find(".loop-iteration-text").text(value);
        }
        if (key == "config-devices") {
            var el = parent.find(".devices-list-text");
            el.text(value);
        }
        if (key == "config-survey-id") {
            var el = parent.find(".survey-id-text");
            el.text(value);
        }
        if (key == "config-sleep-mode") {
            var el = parent.find(".sleep-mode-text");
            el.text(value);
        }
        if (key == "config-sleep-duration") {
            var el = parent.find(".sleep-duration-text");
            var value = parseInt(value);

            var string = (value > 3600000 ? parseInt(value / 60000) + " hrs" : "") +
                        (value > 60000 ? parseInt(value / 60000) + " mins"  : "" ) +
                        parseInt(value / 1000) + " secs";

            el.text(string);
        }
    }

    self.display_dashboard_items = function (args) {
        var parent = $(".dashboard-panel");

        // Is the data fresh?
        var fresh = args && args.fresh ? true : false;
        
        // Check if port is not connected
        if (!global.port) return;

        // Get data
        var data = self.f.b64_to_json(localStorage.getItem("dashboard/data") || self.f.json_to_b64({}));

        // Check if data does not exist for the current device
        if (!data[global.port.pnpId]) return;

        // Set device in awake state
        Object.keys(data[global.port.pnpId]).forEach(function (key, ki) {
            var value = data[global.port.pnpId][key];

            if (fresh && key == "modem") {
                var el = parent.find(".modem-activity-text");
                var modemstatus;
                if (value == "active") {
                    el.parent().css("border-left", "4px solid #94bb34");
                    modemstatus = "Active";
                }
                if (value == "not-responding") {
                    el.parent().css("border-left", "4px solid orange");
                    modemstatus = "Error";
                }
                if (value == "off") {
                    el.parent().css("border-left", "4px solid red");
                    modemstatus = "Off";
                }
                el.text(modemstatus);
            }
            if (fresh && key == "power") {
                var el = parent.find(".power-status-text");
                var status;
                if (value == "awake") {
                    status = "Awake";
                    el.parent().css("border-left", "4px solid #94bb34");
                    $(".dashboard-item").css("opacity", 1);
                }
                if (value == "asleep") {
                    status = "Sleeping";
                    el.parent().css("border-left", "4px solid red");
                    $(".dashboard-item").css("opacity", 0.2);
                }
                el.text(status).css("opacity", 1);
            }
            if (fresh && key == "cell") {
                var el = parent.find(".cellular-status-text");

                var status;
                if (value == "connected") {
                    status = "Connected";
                    el.parent().css("border-left", "4px solid #94bb34");
                    $(".dashboard-item").css("opacity", 1);
                }
                if (value == "disconnected") {
                    status = "Disconnected";
                    el.parent().css("border-left", "4px solid red");
                }
                if (value == "upload-success") {
                    status = "Uploaded";
                    el.parent().css("border-left", "4px solid #0066ff");
                }
                if (value == "upload-failed") {
                    status = "Upload fail";
                    el.parent().css("border-left", "4px solid #ff8d00");
                }
                el.text(status).css("opacity", 1);
            }
            if (fresh && key == "mqtt") {
                var el = parent.find(".mqtt-status-text");
                var status = value == "1" ? "Connected" : "Disconnected";
                el.parent().css("border-left", "4px solid " + (value == "1" ? "#94bb34" : "red"));
                el.text(status);
            }
            if (key == "modem-fw") {
                var el = parent.find(".modem-firmware-text");
                var modemfirmware = value;
                el.text(modemfirmware);
            }
            if (key == "modem-imei") {
                var el = parent.find(".modem-imei-text");
                var modemimei = value;
                el.text(modemimei);
            }
            if (key == "sim-iccid") {
                var el = parent.find(".sim-iccid-text");
                var iccid = value;
                el.text(iccid);
            }
            if (key == "cops") {
                var el = parent.find(".cell-operator-text");
                var cops = value;
                el.text(cops);
            }
            if (fresh && key == "rssi") {
                var el = parent.find(".cell-rssi-text");
                var rssi = value;
                el.text(rssi);
            }
            if (fresh && key == "ph") {
                var el = parent.find(".sensor-ph-text");
                el.text(value).css("opacity", 1);
                parent.find(".last-updated-timestamp").text("Last updated: " + moment(moment.now()).format("LLL"));
            }
            if (fresh && key == "rtd") {
                var el = parent.find(".sensor-rtd-text");
                el.text(value).css("opacity", 1);
                parent.find(".last-updated-timestamp").text("Last updated: " + moment(moment.now()).format("LLL"));
            }
            if (fresh && key == "ec") {
                var el = parent.find(".sensor-ec-text");
                el.text(value).css("opacity", 1);
                parent.find(".last-updated-timestamp").text("Last updated: " + moment(moment.now()).format("LLL"));
            }
            if (fresh && key == "dox") {
                var el = parent.find(".sensor-dox-text");
                el.text(value).css("opacity", 1);
                parent.find(".last-updated-timestamp").text("Last updated: " + moment(moment.now()).format("LLL"));
            }
            if (fresh && key == "loopiteration") {
                var el = parent.find(".loop-iteration-text");
                parent.find(".sensor-rtd-text").css("opacity", 0.5);
                parent.find(".sensor-ph-text").css("opacity", 0.5);
                parent.find(".sensor-ec-text").css("opacity", 0.5);
                parent.find(".sensor-dox-text").css("opacity", 0.5);
                parent.find(".loop-iteration-text").text(value);
            }
            if (key == "config-devices") {
                var el = parent.find(".devices-list-text");
                el.text(value);
            }
            if (key == "config-survey-id") {
                var el = parent.find(".survey-id-text");
                el.text(value);
            }
            if (key == "config-sleep-mode") {
                var el = parent.find(".sleep-mode-text");
                el.text(value);
            }
            if (key == "config-sleep-duration") {
                var el = parent.find(".sleep-duration-text");
                var value = parseInt(value);

                var string = (value > 3600000 ? parseInt(value / 60000) + " hrs" : "") +
                            (value > 60000 ? parseInt(value / 60000) + " mins"  : "" ) +
                            parseInt(value / 1000) + " secs";

                el.text(string);
            }

        });

    }

    self.on_dashboard_item_update = function (key) {
        var parent = $(".dashboard-panel");
        var el;

        if (key == "modem") {
            el = parent.find(".modem-activity-text");
        }
        if (key == "power") {
            el = parent.find(".power-status-text-text");
        }
        if (key == "cell") {
            var el = parent.find(".cellular-status-text");
        }
        if (key == "mqtt") {
            var el = parent.find(".mqtt-status-text");
        }
        if (key == "modem-fw") {
            el = parent.find(".modem-firmware-text");
        }
        if (key == "modem-imei") {
            el = parent.find(".modem-imei-text");
        }
        if (key == "sim-iccid") {
            el = parent.find(".sim-iccid-text");
        }
        if (key == "cops") {
            el = parent.find(".cell-operator-text");
        }
        if (key == "rssi") {
            el = parent.find(".cell-rssi-text");
        }
        if (key == "ph") {
            el = parent.find(".sensor-ph-text");
        }
        if (key == "rtd") {
            el = parent.find(".sensor-rtd-text");
        }
        if (key == "ec") {
            el = parent.find(".sensor-ec-text");
        }
        if (key == "dox") {
            el = parent.find(".sensor-dox-text");
        }
        if (key == "loopiteration") {
            el = parent.find(".loop-iteration-text");
        }
        if (key == "config-devices") {
            el = parent.find(".devices-list-text");
        }
        if (key == "config-survey-id") {
            el = parent.find(".survey-id-text");
        }
        if (key == "config-sleep-mode") {
            el = parent.find(".sleep-mode-text");
        }
        if (key == "config-sleep-duration") {
            el = parent.find(".sleep-duration-text");
        }

        if (el && !el.attr("og-color")) el.attr("og-color", el.css("color"))
        if (el) el.css("color", "green");
        global.timers.dashboarditemupdate = setTimeout(function () {
            if (el) el.css("color", el.attr("og-color"));
        }, 2000);
    }
    
    self.process_sensor_readings = function (values) {
        console.log(values);
    }
}