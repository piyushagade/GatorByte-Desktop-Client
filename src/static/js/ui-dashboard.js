function uidashboardsubapp(){
    var self;
    self = this;
    self.version = 1.0;
    self.ls = window.sls;
    self.f = new functionsubapp().init();
    self.ipcr = require('electron').ipcRenderer;
    self.pwrsv =  require('electron').remote.powerSaveBlocker;
    self.a = global.accessors;


    self.init = function () {

        // Update dashboard items
        self.display_dashboard_items();
        global.timers.dashboardrefresh = setInterval(function () { self.display_dashboard_items(); }, 5000);
        
        // Start listeners
        self.listeners();

        return self;
    }
    
    self.listeners = function () {

        // Dashboard big button
        $(".home-panel .dashboard-button").off("click").click(function () {
            $(".dashboard-panel").removeClass("hidden");
            $(".home-panel").addClass("hidden");
        });
    }
    
    self.process_dashboard_items = function (line) {
        line = line.replace(/gdc-db::/, "").replace(/<br>/g, "").trim();

        // Add info to global object
        var key = line.split("=")[0].trim().toLowerCase();
        var value = line.split("=")[1];

        // Get data from storage
        var data = self.f.b64_to_json(localStorage.getItem("dashboard/data"));
        
        // Initialize global object if not done already
        if (data) global.dashboard = data;
        else global.dashboard[global.port.pnpId] = global.dashboard[global.port.pnpId] || {};

        // Set key and value in global object
        global.dashboard[global.port.pnpId][key] = value;

        // Update storage
        localStorage.setItem("dashboard/data", self.f.json_to_b64(global.dashboard));

        // Update items in the dashboard
        self.display_dashboard_items({
            fresh: true
        });

        self.on_dashboard_item_update(key)
    }

    self.display_dashboard_items = function (args) {
        var parent = $(".dashboard-panel");

        // Is the data fresh?
        var fresh = args && args.fresh;

        // Check if port is not connected
        if (!global.port) return;

        // Get data
        var data = self.f.b64_to_json(localStorage.getItem("dashboard/data") || {});

        // Check if data does not exist for the current device
        if (!data[global.port.pnpId]) return;
        
        Object.keys(data[global.port.pnpId]).forEach(function (key, ki) {
            var value = data[global.port.pnpId][key];

            // Display mode information
            if (fresh && key == "modem") {
                var el = parent.find(".modem-activity-text");
                var modemstatus;
                if (value == "active") modemstatus = "Active";
                if (value == "not-responding") modemstatus = "Error";
                if (value == "off") modemstatus = "Off";
                el.text(modemstatus ? "Active" : "Not responding");
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
            }el
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

        if (!el.attr("og-color")) el.attr("og-color", el.css("color"))

        el.css("color", "green");
        global.timers.dashboarditemupdate = setTimeout(function () {
            el.css("color", el.attr("og-color"));
        }, 2000);
    }
}