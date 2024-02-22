
function uiconfiggatorbytesubapp() {
    var self;
    self = this;
    self.version = 1.0;
    self.ls = window.sls;
    self.f = new functionsubapp().init();
    self.ipcr = require('electron').ipcRenderer;
    self.pwrsv =  require('electron').remote.powerSaveBlocker;
    self.a = global.accessors;
    
    self.filedownloadname = "config.ini";
    self.filedownloaddata = "";
    self.filedownloadline = 0;
    self.fileuploadline = 0;
    self.lines_to_send = 30;

    self.confighash = {};

    // var alldevicesid = ["mcu", "sntl", "sd", "fram", "rtc", "booster", "buzzer", "rgb", "aht", "gps", "bl", "rgb", "ph", "rtd", "dox", "ec", "ph", "rain", "uss", "wlev", "relay", "turbidity", "eadc"];

    self.panel = $(".configure-gb-panel");
    self.devices = [
        {
            "id": "rgb",
            "name": "RGB LED",
            "description": "RGB 5050, indicator LED",
            "category": "peripheral",
            "test": true,
            "location": "stalk"
        },
        {
            "id": "buzzer",
            "name": "Buzzer",
            "description": "Buzzer, speaker",
            "category": "peripheral",
            "test": true,
            "location": "stalk"
        },
        {
            "id": "mcu",
            "name": "NB1500 MCU",
            "description": "NB1500 microcontroller, Arduino",
            "category": "microcontoller",
            "test": false,
            "location": "mcuhat"
        },
        {
            "id": "bl",
            "name": "Bluetooth module",
            "description": "AT-09 Bluetooth module",
            "category": "communication",
            "test": true,
            "location": "sensorbaseboard"
        },
        {
            "id": "rain",
            "name": "Rain sensor",
            "description": "RG-11 optical rain sensor",
            "category": "sensor",
            "test": false,
            "location": "sensorbaseboard"
        },
        {
            "id": "ph",
            "name": "pH",
            "description": "Atlas Scientific pH sensor",
            "category": "sensor",
            "calibration": true,
            "test": true,
            "location": "sensorbaseboard"
        },
        {
            "id": "ec",
            "name": "EC",
            "description": "Atlas Scientific EC sensor",
            "category": "sensor",
            "calibration": true,
            "test": true,
            "location": "sensorbaseboard"
        },
        {
            "id": "dox",
            "name": "DO",
            "description": "Atlas Scientific DO sensor",
            "category": "sensor",
            "calibration": true,
            "test": true,
            "location": "sensorbaseboard"
        },
        {
            "id": "rtd",
            "name": "RTD",
            "description": "Atlas Scientific RTD sensor",
            "category": "sensor",
            "calibration": true,
            "test": true,
            "location": "sensorbaseboard"
        },
        {
            "id": "uss",
            "name": "USS sensor",
            "description": "Ultrasound, distance sensor, water level sensor",
            "category": "sensor",
            "test": true,
            "location": "sensorbaseboard"
        },
        {
            "id": "gps",
            "name": "GPS",
            "description": "Neo-6M GPS module, location",
            "category": "peripheral",
            "test": true,
            "location": "sensorbaseboard"
        },
        {
            "id": "wlev",
            "name": "Water level",
            "description": "Pressure-based water level sensor",
            "category": "sensor",
            "test": true,
            "location": "sensorbaseboard"
        },
        {
            "id": "relay",
            "name": "SPST relay",
            "description": "SPST relay",
            "category": "peripheral",
            "test": true,
            "location": "sensorbaseboard"
        },
        {
            "id": "turbidity",
            "name": "Turbidity",
            "description": "DFRobot turbidity sensor",
            "category": "sensor",
            "test": true,
            "location": "sensorbaseboard"
        },
        {
            "id": "eadc",
            "name": "External ADC",
            "description": "External ADC, ADS1115",
            "category": "peripheral",
            "test": true,
            "location": "sensorbaseboard"
        },
        {
            "id": "aht",
            "name": "AHT10",
            "description": "AHT10 humidity and temperature sensor",
            "category": "sensor",
            "test": true,
            "location": "mcuhat"
        },
        {
            "id": "rtc",
            "name": "RTC",
            "description": "DS3231 RTC module",
            "category": "peripheral",
            "test": true,
            "location": "mcuhat"
        },
        {
            "id": "booster",
            "name": "Booster",
            "description": "5V booster",
            "category": "peripheral",
            "test": false,
            "location": "mcuhat"
        },
        {
            "id": "fram",
            "name": "Flash memory",
            "description": "W25QX flash memory",
            "category": "storage",
            "test": true,
            "location": "mcuhat"
        },
        {
            "id": "sd",
            "name": "Micro-SD",
            "description": "Micro-SD module",
            "category": "storage",
            "test": true,
            "location": "sensorbaseboard"
        },
        {
            "id": "mem",
            "name": "EEPROM",
            "description": "AT24C EEPROM memory",
            "category": "storage",
            "test": true,
            "location": "mcuhat"
        },
        {
            "id": "sntl",
            "name": "Sentinel",
            "description": "GatorByte sentinel",
            "category": "peripheral",
            "test": true,
            "location": "sensorbaseboard"
        },
        {
            "id": "lipo",
            "name": "Li-Po battery",
            "description": "Li-Po 3.7 V battery",
            "category": "power",
            "test": true,
            "location": "sensorbaseboard"
        }
    ];

    self.init = function () {

        // Start listeners
        self.listeners();

        // Construct base devices list UI
        
        var alldevicesnames = self.devices.map(function (device) { return device.name });
        var alldevicesdescription = self.devices.map(function (device) { return device.description });
        var alldevicesids = self.devices.map(function (device) { return device.id });
        self.panel.find(".devices-information-parent").find(".devices-list .devices-list-item").remove();
        alldevicesids.forEach(function (deviceid, di) {
            self.panel.find(".devices-information-parent").find(".devices-list").append(multiline(function () {/* 
                <div class="col-auto devices-list-item shadow" device="{{deviceid}}" title="{{devicesdescription}}" style="margin: 0 6px 6px 0;padding: 2px 6px;background: #e6e6e6;color: #505050;font-size: 12px;font-weight: bold; opacity: 0.4;">
                    {{devicename}}
                </div>
            */}, {
                "deviceid": deviceid.trim(),
                "devicename": alldevicesnames[di],
                "devicesdescription": alldevicesdescription[di]
            }));
        });

        // Device click listener
        self.panel.find(".devices-list-item").off("click").on("click", function() {
            var enabled = $(this).hasClass("enabled");
            if (!self.configobject) self.configobject = {};
            if (!self.configobject["device"]) self.configobject["device"] = {};
            if (!self.configobject["device"]["devices"]) self.configobject["device"]["devices"] = "mcu";

            if (enabled) {
                $(this).removeClass("enabled").css("opacity", "0.4");
                
                var deviceid = $(this).attr("device").trim();
                var devices = self.configobject["device"]["devices"].split(",");
                var filtered = devices.filter(function(item){ 
                    return deviceid != item; 
                });
                self.configobject["device"]["devices"] = filtered.join(",");
            }
            else {
                $(this).addClass("enabled").css("opacity", "1");

                var devices = self.configobject["device"]["devices"].split(",");
                var deviceid = $(this).attr("device").trim();
                devices.push(deviceid);
                self.configobject["device"]["devices"] = devices.join(",");
            }
            
            // Update flag
            self.configobject["updateflag"] = true;

            // Save config data to main process
            self.save_config_in_storage();

            // Update config data
            self.configdata = self.objecttostring(self.configobject);

        });

        // Set timezones in the dropdown
        var timezoneoffsets = [{"timezone":"ACST","offset":1,"hours":9,"minutes":30},{"timezone":"AEST","offset":1,"hours":10,"minutes":0},{"timezone":"ART","offset":-1,"hours":3,"minutes":0},{"timezone":"AST","offset":-1,"hours":4,"minutes":0},{"timezone":"AWST","offset":1,"hours":8,"minutes":0},{"timezone":"BRT","offset":-1,"hours":3,"minutes":0},{"timezone":"CDT","offset":-1,"hours":5,"minutes":0},{"timezone":"CEST","offset":1,"hours":2,"minutes":0},{"timezone":"CET","offset":1,"hours":1,"minutes":0},{"timezone":"CLT","offset":-1,"hours":4,"minutes":0},{"timezone":"CST","offset":-1,"hours":6,"minutes":0},{"timezone":"CST","offset":1,"hours":8,"minutes":0},{"timezone":"EET","offset":1,"hours":2,"minutes":0},{"timezone":"EEST","offset":1,"hours":3,"minutes":0},{"timezone":"EDT","offset":-1,"hours":4,"minutes":0},{"timezone":"EST","offset":-1,"hours":5,"minutes":0},{"timezone":"GMT","offset":1,"hours":0,"minutes":0},{"timezone":"HKT","offset":1,"hours":8,"minutes":0},{"timezone":"HST","offset":-1,"hours":10,"minutes":0},{"timezone":"ICT","offset":1,"hours":7,"minutes":0},{"timezone":"IST","offset":1,"hours":5,"minutes":30},{"timezone":"JST","offset":1,"hours":9,"minutes":0},{"timezone":"KST","offset":1,"hours":9,"minutes":0},{"timezone":"MDT","offset":-1,"hours":6,"minutes":0},{"timezone":"MST","offset":-1,"hours":7,"minutes":0},{"timezone":"MYT","offset":1,"hours":8,"minutes":0},{"timezone":"NZDT","offset":1,"hours":13,"minutes":0},{"timezone":"NZST","offset":1,"hours":12,"minutes":0},{"timezone":"PDT","offset":-1,"hours":7,"minutes":0},{"timezone":"PHT","offset":1,"hours":8,"minutes":0},{"timezone":"PKT","offset":1,"hours":5,"minutes":0},{"timezone":"PST","offset":-1,"hours":8,"minutes":0},{"timezone":"SGT","offset":1,"hours":8,"minutes":0},{"timezone":"UYT","offset":-1,"hours":3,"minutes":0},{"timezone":"VET","offset":-1,"hours":4,"minutes":0},{"timezone":"WIB","offset":1,"hours":7,"minutes":0},{"timezone":"WITA","offset":1,"hours":8,"minutes":0}];

        timezoneoffsets.forEach(function (tzrow, tzi) {
            $(".data-information-parent").find(".timezone-dropdown").append(multiline(function () {/* 
                <option value="{{tz-id}}" style="color: #222;">{{tz-name}}</option>
            */}, {
                "tz-id": tzrow.timezone,
                "tz-name": tzrow.timezone
            }));
        });

        return self;
    }

    self.sendcommand = function (command) {

        if (!global.states.connected) return;

        try {
            self.ipcr.send('ipc/command/push', {
                command: command,
                windowid: global.states.windowid,
                path: global.port.path
            });
        }
        catch (e) {
            console.error("Error sending command: " + command);
        }
    }
    
    self.listeners = function () {

        // Dashboard big button
        $(".home-panel .big-button.configure-gb-button").off("click").click(function () {

            // Show back button
            $(".go-back-panel-button").removeClass("hidden");
            
            $(".configure-gb-panel").removeClass("hidden");
            $(".home-panel").addClass("hidden");
            $(".gb-config-header").removeClass("hidden");
            
            // Send request to get GatorByte to enter config state
            var prefix = "##GB##", suffix = "#EOF#";
            self.ipcr.send('ipc/command/push', {
                command: prefix + "cfgb" + suffix,
                windowid: global.states.windowid,
                path: global.port.path
            });

            // Show UTC time from the computer/phone
            self.show_utctime();

            // Get RTC time from the GatorByte
            self.show_rtctime();

            // Get BL information
            self.panel.find(".bl-sync-status").addClass("hidden");
            setTimeout(() => {
                self.sendcommand("bl:getconfig");
            }, 2000);
            
            // Get config data from main process
            self.request_config();
        });

        // Request sync status check
        $(".gb-config-header .sync-status-heading").off("click").click(function () {
            self.checkconfigsync();
            self.getbattlevel(300);
        });

        // Request battery level check
        $(".gb-config-header .battery-icon-parent").off("click").click(function () {
            self.getbattlevel(300);
        });

        // Get RTC time
        self.panel.find(".get-rtc-button").off("click").click(function () {
            self.show_rtctime();
            self.show_utctime();
        });

        // Survey ID change listener
        self.panel.find(".project-id-text").off("keyup").on("keyup", self.f.debounce(function() {
            var value = $(this).val();
            if (!self.configobject) self.configobject = {};
            if (!self.configobject["survey"]) self.configobject["survey"] = {};
            if (value && value.length > 3) self.configobject["survey"]["id"] = $(this).val();
            else {
                $(this).css("border-bottom", "1px solid red");
                setTimeout(() => { $(this).css("border-bottom", "1px solid #444444"); }, 2000);
            }

            // Update flag
            self.configobject["updateflag"] = true;
            
            // Save config data to main process
            self.save_config_in_storage();

            // Update config data
            self.configdata = self.objecttostring(self.configobject);

        }, 150));

        // Device name change listener
        self.panel.find(".device-name-text").off("keyup").on("keyup", self.f.debounce(function() {
            var value = $(this).val();
            if (!self.configobject) self.configobject = {};
            if (!self.configobject["device"]) { self.configobject["device"] = {}; }
            if (value && value.length > 3) {
                self.configobject["device"]["name"] = $(this).val();
                self.configobject["device"]["id"] = global.port.sn;

                // Update flag
                self.configobject["updateflag"] = true;
                
                // Save config data to main process
                self.save_config_in_storage();

                // Update config data
                self.configdata = self.objecttostring(self.configobject);
            }
            else {
                $(this).css("border-bottom", "1px solid red");
                setTimeout(() => { $(this).css("border-bottom", "1px solid #444444"); }, 2000);
            }

        }, 150));

        // Survey location change listener
        self.panel.find(".survey-location-text").off("keyup").on("keyup", self.f.debounce(function() {
            var value = $(this).val();
            if (!self.configobject) self.configobject = {};
            if (!self.configobject["survey"]) self.configobject["survey"] = {};
            if (value && value.length > 3) self.configobject["survey"]["location"] = $(this).val();
            else {
                $(this).css("border-bottom", "1px solid red");
                setTimeout(() => { $(this).css("border-bottom", "1px solid #444444"); }, 2000);
            }

            // Update flag
            self.configobject["updateflag"] = true;
            
            // Save config data to main process
            self.save_config_in_storage();

            // Update config data
            self.configdata = self.objecttostring(self.configobject);

        }, 150));

        // Server address change listener
        self.panel.find(".server-address-text").off("keyup").on("keyup", self.f.debounce(function() {
            var value = $(this).val();
            if (!self.configobject) self.configobject = {};
            if (!self.configobject["server"]) self.configobject["server"] = {};
            if (value && value.length > 3) self.configobject["server"]["url"] = $(this).val();
            else {
                $(this).css("border-bottom", "1px solid red");
                setTimeout(() => { $(this).css("border-bottom", "1px solid #444444"); }, 2000);
            }

            // Update flag
            self.configobject["updateflag"] = true;

            // Save config data to main process
            self.save_config_in_storage();

            // Update config data
            self.configdata = self.objecttostring(self.configobject);

        }, 150));
        
        // Server port number change listener
        self.panel.find(".server-port-number-text").off("keyup").on("keyup", self.f.debounce(function() {
            var value = $(this).val();
            if (!self.configobject) self.configobject = {};
            if (!self.configobject["server"]) self.configobject["server"] = {};
            if (value && value.length > 0) self.configobject["server"]["port"] = $(this).val();
            else {
                $(this).css("border-bottom", "1px solid red");
                setTimeout(() => { $(this).css("border-bottom", "1px solid #444444"); }, 2000);
            }

            // Update flag
            self.configobject["updateflag"] = true;
            
            // Save config data to main process
            self.save_config_in_storage();

            // Update config data
            self.configdata = self.objecttostring(self.configobject);

        }, 150));

        // Upload to server flag listener
        self.panel.find(".server-upload-enabled-selector").off("change").on("change", function() {
            var uploadenabled = self.panel.find(".server-upload-enabled-selector select").val();
            if (!self.configobject) self.configobject = {};
            if (!self.configobject["server"]) self.configobject["server"] = {};
            self.configobject["server"]["enabled"] = uploadenabled;

            // Update flag
            self.configobject["updateflag"] = true;
            
            // Save config data to main process
            self.save_config_in_storage();

            // Update config data
            self.configdata = self.objecttostring(self.configobject);
        });

        // Timezone selector listener
        self.panel.find(".timezone-dropdown").off("change").on("change", function() {
            var selectedtz = self.panel.find(".timezone-dropdown").val();
            if (!self.configobject) self.configobject = {};
            if (!self.configobject["survey"]) self.configobject["survey"] = {};
            self.configobject["survey"]["tz"] = selectedtz;

            // Update flag
            self.configobject["updateflag"] = true;
            
            // Save config data to main process
            self.save_config_in_storage();

            // Update config data
            self.configdata = self.objecttostring(self.configobject);
        });

        // RAT listener
        self.panel.find(".rat-dropdown").off("change").on("change", function() {
            var selectedRAT = self.panel.find(".rat-dropdown").val();
            if (!self.configobject) self.configobject = {};
            if (!self.configobject["sim"]) self.configobject["sim"] = {};
            self.configobject["sim"]["rat"] = selectedRAT;

            // Update flag
            self.configobject["updateflag"] = true;
            
            // Save config data to main process
            self.save_config_in_storage();

            // Update config data
            self.configdata = self.objecttostring(self.configobject);
        });

        // APN text listener
        self.panel.find(".apn-text").off("keyup").on("keyup", self.f.debounce(function() {
            var value = $(this).val();
            if (!self.configobject) self.configobject = {};
            if (!self.configobject["sim"]) self.configobject["sim"] = {};
            self.configobject["sim"]["apn"] = $(this).val();

            // Update flag
            self.configobject["updateflag"] = true;
            
            // Save config data to main process
            self.save_config_in_storage();

            // Update config data
            self.configdata = self.objecttostring(self.configobject);
        }));

        // Server type listener
        self.panel.find(".server-type-selector").off("change").on("change", function() {
            var servertype = self.panel.find(".server-type-selector select").val();
            if (!self.configobject) self.configobject = {};
            if (!self.configobject["server"]) self.configobject["server"] = {};
            self.configobject["server"]["type"] = servertype;

            // Update flag
            self.configobject["updateflag"] = true;
            
            // Save config data to main process
            self.save_config_in_storage();

            // Update config data
            self.configdata = self.objecttostring(self.configobject);
        });

        // Sleep duration change listener
        self.panel.find(".sleep-duration-text").off("keyup").on("keyup", self.f.debounce(function() {
            var value = parseInt($(this).val());
            if (!self.configobject) self.configobject = {};
            if (!self.configobject["sleep"]) self.configobject["sleep"] = {};
            if (value && value >= 1 && !isNaN(parseInt(value))) self.configobject["sleep"]["duration"] = value * 1000;
            else {
                $(this).css("border-bottom", "1px solid red");
                setTimeout(() => { $(this).css("border-bottom", "1px solid #444444"); }, 2000);
            }
            
            // Update flag
            self.configobject["updateflag"] = true;
            
            // Save config data to main process
            self.save_config_in_storage();

            // Update config data
            self.configdata = self.objecttostring(self.configobject);
        }, 150));

        // Sleep mode change listener
        self.panel.find(".sleep-mode-text").off("change").on("change", function() {
            var sleepmode = self.panel.find(".sleep-mode-text").val();
            if (!self.configobject) self.configobject = {};
            if (!self.configobject["sleep"]) self.configobject["sleep"] = {};
            self.configobject["sleep"]["mode"] = sleepmode;

            // Update flag
            self.configobject["updateflag"] = true;
            
            // Save config data to main process
            self.save_config_in_storage();

            // Update config data
            self.configdata = self.objecttostring(self.configobject);
        });

        // Sensor read mode change listener
        self.panel.find(".data-mode-text").off("change").on("change", function() {
            var datamode = self.panel.find(".data-mode-text").val();
            if (!self.configobject) self.configobject = {};
            if (!self.configobject["data"]) self.configobject["data"] = {};
            self.configobject["data"]["mode"] = datamode;

            // Update flag
            self.configobject["updateflag"] = true;
            
            // Save config data to main process
            self.save_config_in_storage();

            // Update config data
            self.configdata = self.objecttostring(self.configobject);
        });

        // Sensor read until change listener
        self.panel.find(".sensor-read-mode-text").off("change").on("change", function() {
            var readmode = self.panel.find(".sensor-read-mode-text").val();
            if (!self.configobject) self.configobject = {};
            if (!self.configobject["data"]) self.configobject["data"] = {};
            self.configobject["data"]["readuntil"] = readmode;
            
            // Update flag
            self.configobject["updateflag"] = true;

            // Save config data to main process
            self.save_config_in_storage();

            // Update config data
            self.configdata = self.objecttostring(self.configobject);
        });
    }

    /*
        Request config from the main process
    */
    self.request_config = function () {

        return new Promise(function (resolve, reject) {
            
            // Get config data from main process
            self.ipcr.send("ipc/config-data-get/request", {
                port: global.port
            });
            
            setTimeout(() => {

                resolve(self.configobject);

                console.log("Configuration data");
                console.log(self.configobject);
            }, 1000);
        });

    }

    self.show_utctime = function () {
        if (self.panel.hasClass("hidden")) clearInterval(self.timers.utctimeupdate);
        var offset = self.timezone();
        var time = moment(moment.now()).format("MM/DD/YY hh:mm a").toUpperCase();
        self.panel.find(".utc-time-text").text(time).attr("title", moment.now());
    }

    // Get RTC time from the GatorByte
    self.show_rtctime = function () {
        if (self.panel.hasClass("hidden")) clearInterval(self.timers.utctimeupdate);
        self.panel.find(".rtc-sync-status").text("⏲️ Fetching RTC time.");
        setTimeout(() => {
            self.sendcommand("rtc:get");
        }, self.panel.find(".gatorbyte-rtc-time-text").text() == "-" ? 100 : 250);
    }

    self.process_file_download_data = function (data) {

        // Replace prefix with nothing and <br> with \n
        data = data.replace(/<br>/g, "\n").replace(/gdc-cfg::fdl:/, "");
        $(".header-panel").find(".download-status-text").removeClass("hidden").text(self.filedownloadline + " kB downloaded");

        self.filedownloadline += self.lines_to_send;

        // Append file data
        self.filedownloaddata += data.replace(/#EOF#/g, "");

        // // Request next part of the data if available
        // if (data.length > 0) {
        //     $(".header-panel").find(".download-status-text").removeClass("hidden").text(self.filedownloadline + " kB downloaded");
        //     return self.request_config_file_download(self.filedownloadname, self.filedownloadline);
        // }
        
        // On download complete
        if (data.indexOf("#EOF#") !== -1) {

            // Update UI
            $(".sync-status-heading").removeClass("disabled");
            $(".connected-device-disconnect-button").removeClass("disabled");
            $(".upload-config-data-button").removeClass("disabled");
            $(".refresh-config-data-button").removeClass("disabled");
            // $(".refresh-config-data-button").removeClass("disabled");
            $(".panel").removeClass("disabled");

            // If the file doesn't exist
            if (self.filedownloaddata.length == 0) {
                console.log("The config.ini file does not exist on the SD card.");
                
                self.on_config_data_acquired(false);

                setTimeout(() => {
                    $(".gb-config-header").find(".sync-status-heading").removeClass("disabled").css("background", "#962e38").text("Initial configuration pending.");
                    $(".gb-config-header").find(".refresh-config-data-button").addClass("disabled");
                    $(".gb-config-header").find(".upload-config-data-button").addClass("disabled");
                    
                    if (!$(".home-panel").find(".sd-error-notification").hasClass("hidden")) $(".home-panel .initial-configuration-pending-notification").removeClass("hidden");

                }, 200);

                // // Disable text boxes
                // self.panel.find(".survey-information-parent").find(".project-id-text").addClass("disabled");
                // self.panel.find(".survey-information-parent").find(".device-sn-text").addClass("disabled");
                // self.panel.find(".survey-information-parent").find(".device-name-text").addClass("disabled");
                // self.panel.find(".survey-information-parent").find(".survey-location-text").addClass("disabled");
                // self.panel.find(".survey-information-parent").find(".survey-date").addClass("disabled");
                // self.panel.find(".survey-information-parent").find(".survey-date-picker").addClass("disabled");
                // self.panel.find(".device-information-parent").find(".sleep-mode-text").addClass("disabled");
                // self.panel.find(".device-information-parent").find(".sleep-duration-text").addClass("disabled");
                // self.panel.find(".device-information-parent").find(".data-mode-text").addClass("disabled");
                // self.panel.find(".device-information-parent").find(".sensor-read-mode-text").addClass("disabled");

                // Enable big buttons in home UI
                var functions = [];
                $(".home-panel").find(".big-button.requires-device-ready.disabled").each(function (ei, el) {

                    functions.push(function () {
                        $(el).removeClass("disabled");
                    });
                });
                self.f.waterfall(functions, 150);

                setTimeout(() => {
                    self.panel.find(".config-information-parent").removeClass("disabled").removeClass("blur");
                    $(".sync-status-heading").removeClass("ui-disabled");
                    $(".upload-config-data-button").removeClass("ui-disabled");
                    $(".refresh-config-data-button").removeClass("ui-disabled");
                    $(".panel").removeClass("ui-disabled");
                }, 200);

                // setTimeout(() => {
                //     console.log("H 1");
                //     $(".header-panel").find(".progress-bar-overlay").addClass("hidden");
                //     $(".header-panel").find(".download-status-heading").text("");
                //     $(".header-panel").find(".download-status-text").text("");
                //     $(".header-panel").find(".progress").find(".progress-bar").css("width", "0%");
                // }, 3000);
            
            }

            // If config data successfully downloaded
            else {
                console.log("Configuration successfully downloaded from SD.");

                $(".header-panel").find(".download-status-text").removeClass("hidden").text("Download complete");
                $(".gb-config-header").find(".upload-config-data-button").find("i").removeClass("animate-pulse-opacity");
                self.configdata = self.filedownloaddata;

                self.on_config_data_acquired(false);
                
                // Update flag
                self.configobject["updateflag"] = false;

                // Check config data sync
                self.checkconfigsync(500);
                self.getbattlevel(800);
                
            }

            // Reset global variables
            self.filedownloaddata = "";
            self.filedownloadline = 0;
        }

    }

    // Download config from SD
    self.request_config_file_download = function (filename, startingline) {

        return new Promise(function (resolve, reject) {
            self.sendcommand("cfgdl" + ":" + filename + "," + startingline);
            self.state = "wait-on-file-download";
        });
    }

    // Upload config data to SD card
    self.request_file_upload = function (startingline) {
        var datatosend = self.configdata.substring(startingline, startingline + self.lines_to_send).replace(/\n/g, "~").replace(/ /g, "`");
        
        // If data is still not fully sent
        if (datatosend && datatosend.trim().length > 0) {
            var uploadedbyte = startingline + self.lines_to_send >= self.configdata.length ? self.configdata.length : startingline + self.lines_to_send;
            
            $(".header-panel").find(".progress").find(".progress-bar").css("width", (uploadedbyte / self.configdata.length) * $(".header-panel").find(".progress-bar-overlay").find(".progress").width());
            $(".header-panel").find(".download-status-text").text("Uploaded " + (uploadedbyte + " / " + self.configdata.length + " kB"));

            return new Promise(function (resolve, reject) {
                self.sendcommand("cfgupl:" + datatosend + "^" + startingline);
                self.state = "wait-on-file-upload";
            });
        }

        // Upload complete
        else {
            console.log("Upload complete");
            self.fileuploadline = 0;
            self.configobject["updateflag"] = false;

            // Send a request to update the config in GatorByte's memory
            self.sendcommand("cfgupd:config");

            // Update UI
            $(".sync-status-heading").removeClass("disabled");
            $(".connected-device-disconnect-button").removeClass("disabled");
            $(".upload-config-data-button").removeClass("disabled");
            $(".refresh-config-data-button").removeClass("disabled");
            $(".panel").removeClass("disabled");
            // self.panel.find(".spinner-parent").addClass("hidden");
            // self.panel.find(".config-information-parent").removeClass("hidden");
            $(".header-panel").find(".progress-bar-overlay").addClass("hidden");
            self.panel.find(".config-information-parent").removeClass("disabled").removeClass("blur");
            
            self.on_config_data_acquired();
            
            // Save config data to main process
            self.save_config_in_storage();
            
            // Check config data sync after 500 ms
            self.checkconfigsync(500);
            self.getbattlevel(800);

            // Update config data
            self.configdata = self.objecttostring(self.configobject);
        }
    }

    self.on_config_data_acquired = function (stale) {

        if (!self.configdata) return;

        // Check if the saved configuration was updated and needs to be uploaded
        if (self.configobject && self.configobject["updateflag"]) {
            $(".gb-config-header").find(".sync-status-heading").removeClass("disabled").css("background", "#865600").text("Configuration upload due");
            $(".gb-config-header").find(".upload-config-data-button").removeClass("disabled").css("background", "#865600");
            $(".gb-config-header").find(".refresh-config-data-button").removeClass("disabled").css("background", "#333333");
        }
        else {
            setTimeout(() => {
                // if (stale) $(".gb-config-header").find(".sync-status-heading").css("background", "#0b63a2").text("Using saved configuration data");
                // else $(".gb-config-header").find(".sync-status-heading").css("background", "#104c09").text("Configuration sync complete");
                $(".home-panel .initial-configuration-pending-notification").addClass("hidden");
                $(".upload-config-data-button").css("background", "#333");
            }, 500);
        }
        
        let hash = 0;
        for (let i = 0; i < self.configdata.length; i++) {
            const charCode = self.configdata.charCodeAt(i);
            hash = (hash << 5) - charCode;
        }

        console.log("Hash from configuration stored locally: " + hash);
        self.confighash["local"] = hash;

        // Enable big buttons in home UI
        var functions = [];
        $(".home-panel").find(".big-button.requires-device-ready.disabled").each(function (ei, el) {

            functions.push(function () {
                $(el).removeClass("disabled");
            });
        });
        self.f.waterfall(functions, 150);
            
        // Update UI
        // self.panel.find(".spinner-parent").addClass("hidden");
        // self.panel.find(".config-information-parent").removeClass("hidden");

        setTimeout(() => {
            $(".header-panel").find(".progress-bar-overlay").addClass("hidden");
        }, 500);
        self.panel.find(".config-information-parent").removeClass("disabled").removeClass("blur");

        //! Download configuration button listener
        $(".gb-config-header").find(".refresh-config-data-button").off("click").click(function () {

            self.a.ui.notification({
                "contexttype": "success",
                "overlaytype": "dialog",
                "heading": "Download configuration",
                "body": "Are you sure you want to download the configuration from the GatorByte?",
                "okay": "Yes",
                "dismiss": "Cancel",
                "onokay": function () {

                    // Reset global variables
                    self.filedownloaddata = "";
                    self.filedownloadline = 0;

                    // Ensure all base files/folders exist
                    self.sendcommand("sdf:cr:all");

                    // Get config data from SD card
                    setTimeout(() => {
                        self.request_config_file_download(self.filedownloadname, self.filedownloadline);
                    }, 1500);
                    
                    // Update UI
                    self.onconfigstateunknown(0, "Downloading configuration");
                    $(".sync-status-heading").addClass("disabled");
                    $(".upload-config-data-button").addClass("disabled");
                    $(".refresh-config-data-button").addClass("disabled");
                    $(".panel").addClass("disabled");
                    $(".header-panel").find(".progress-bar-overlay").removeClass("hidden");
                    self.panel.find(".config-information-parent").addClass("disabled").addClass("blur");
                    $(".header-panel").find(".download-status-heading").text("Downloading configuration");
                    $(".header-panel").find(".download-status-text").text("Initializing download");
                    $(".header-panel").find(".progress").addClass("progress-striped-infinite").removeClass("progress-striped");
                    $(".header-panel").find(".progress").find(".progress-bar").css("width", "100%");
                }
            });
        });

        //! Upload config button listener
        $(".gb-config-header").find(".upload-config-data-button").off("click").click(function () {

            self.a.ui.notification({
                "contexttype": "success",
                "overlaytype": "dialog",
                "heading": "Upload configuration",
                "body": "Do you want to upload the configuration to GatorByte?",
                "okay": "Yes",
                "dismiss": "Cancel",
                "onokay": function () {
                    
                    // Update UI
                    self.onconfigstateunknown(0, "Uploading configuration");
                    $(".sync-status-heading").addClass("disabled");
                    // $(".connected-device-disconnect-button").addClass("disabled");
                    $(".upload-config-data-button").addClass("disabled");
                    $(".refresh-config-data-button").addClass("disabled");
                    $(".panel").addClass("disabled");
                    // self.panel.find(".spinner-parent").removeClass("hidden");
                    // self.panel.find(".config-information-parent").addClass("hidden");
                    $(".header-panel").find(".progress-bar-overlay").removeClass("hidden");
                    self.panel.find(".config-information-parent").addClass("disabled").addClass("blur");
                    $(".header-panel").find(".download-status-heading").text("Uploading configuration");
                    $(".header-panel").find(".download-status-text").text("Initializing upload");
                    $(".header-panel").find(".progress").addClass("progress-striped").removeClass("progress-striped-infinite");
                    $(".header-panel").find(".progress").find(".progress-bar").css("width", "0px");

                    // Append mandatory fields
                    self.configobject["survey"]["id"] = self.get_content(self, "project-id-text");
                    delete self.configobject["survey"]["location"];
                    delete self.configobject["survey"]["date"];
                    self.configobject["device"]["name"] = self.get_content(self, "device-name-text");
                    self.configobject["device"]["id"] = global.port.sn;
                    self.configobject["server"]["url"] = self.get_value(self, "server-address-text");
                    self.configobject["server"]["port"] = self.get_value(self, "server-port-number-text");
                    self.configobject["server"]["port"] = self.get_value(self, "server-port-number-text");
                    self.configobject["server"]["enabled"] = self.get_value(self, "server-upload-enabled-selector select");
                    self.configobject["server"]["tz"] = self.get_value(self, "timezone-dropdown");
                    self.configobject["server"]["type"] = self.get_value(self, "server-type-selector select");
                    self.configobject["sim"]["rat"] = self.get_value(self, "rat-dropdown");
                    self.configobject["sim"]["apn"] = self.get_value(self, "apn-text");
                    self.configobject["sleep"]["duration"] = parseInt(self.get_value(self, "sleep-duration-text")) * 1000;
                    self.configobject["sleep"]["mode"] = self.get_value(self, "sleep-mode-text");
                    self.configobject["data"]["mode"] = self.get_value(self, "data-mode-text");
                    self.configobject["data"]["readuntil"] = self.get_value(self, "sensor-read-mode-text");
                    
                    // Save config data to main process
                    self.save_config_in_storage();

                    // Update config data
                    self.configdata = self.objecttostring(self.configobject);
                    
                    console.log("Uploading config:");
                    console.log(self.configobject);

                    // Upload config data to SD card
                    self.request_file_upload(self.fileuploadline);
                }
            });
        });

        if (self.configobject) self.configobject["updateflag"] = false;

        // Process config data and update UI
        self.process_config_data();

        // Save config data to main process
        self.save_config_in_storage();
    }

    self.get_value = function (self, classstr) {
        var value = self.panel.find("." + classstr).val();
        return value;
    }

    self.get_content = function (self, classstr) {
        var value = self.panel.find("." + classstr).text();
        return value;
    }

    self.save_config_in_storage = function () {

        // Check if the saved configuration was updated and needs to be uploaded
        if (self.configobject && self.configobject["updateflag"]) {
            $(".gb-config-header").find(".sync-status-heading").removeClass("disabled").css("background", "#865600").text("Configuration upload due");
            $(".gb-config-header").find(".upload-config-data-button").removeClass("disabled").css("background", "#865600");
        }

        self.ipcr.send("ipc/config-data-save/request", {
            port: global.port,
            configobject: self.configobject
        });
    }

    self.process_config_data = function () {

        if (!self.configdata) return;

        /*
            device
                id: gb-swb
                devices: mcu,mem,ph,dox,ec,rtd,booster,rgb,aht,gps,bl
                disabled: 
                sleep: shallow,120000
            data
                mode: stream
                sensor mode: stability
                data mode: read
            survey
                id: caip-trial
                date: 11-08-2022
                location: CAIP
            state
                online: false
                use gps: true
                log to sd: true
            server
                url: api.ezbean-lab.com
                port: 80
                enabled: true
            
        */

        self.configobject = {};
        var currentcategory = null;
        var erroroccured = false;
        var indentation = " ";
        self.configdata.split("\n").forEach(function (line, li) {

            try {
                // If the line is a category
                if (!line.startsWith(indentation)) {
                    var category = line;
                    currentcategory = category.trim();
                    if (currentcategory.length == 0) return;
                    self.configobject[currentcategory] = {};
                }
                
                // If the line is a sub category and key value pair 
                else if (line.startsWith(indentation) && line.indexOf(":") >= 0) {
                    var key = line.trim().split(":")[0].trim().replace(/ /g, "-");
                    var value = line.trim().split(":")[1].trim();

                    self.configobject[currentcategory][key] = value;
                }
            }
            catch (e) {
                erroroccured = true;
                console.log("Malformed config data on SD card.");
                $(".gb-config-header").find(".sync-status-heading").removeClass("disabled").css("background", "#962e38").text("Malformed configuration data on SD card.");
            }
        });
        currentcategory = null;
        if (!erroroccured) self.update_panel_ui();

    }

    self.objecttostring = function (object) {
        if (!object) return;

        var string = "";
        var indentation = " ";
        Object.keys(object).forEach(function (key, ki) {
            if (!key || key.length == 0) return;
            if (key == "updateflag") return;

            string += key;
            string += "\n";
            
            Object.keys(object[key]).forEach(function (subkey, ski) {
                if (!subkey || subkey.length == 0) return;

                string += indentation + subkey + ":" + object[key][subkey];
                string += "\n";
            });
        });

        return string;
    }

    self.setconfigdata = function (object) {
        
        if (!object) {
            self.getconfigdatafromsd();
            $(".gb-config-header").find(".sync-status-heading").removeClass("disabled").css("background", "#3d3d3d").text("Downloading configuration.");
            $(".gb-config-header").find(".refresh-config-data-button").addClass("disabled").css("background", "#333333");
        }
        else {
            self.configobject = { ...object };
            self.configdata = self.objecttostring(self.configobject);
            self.on_config_data_acquired(true);
            
        }
    }

    self.getconfigdatafromsd = function () {
        
        // Ensure all base files/folders exist
        self.sendcommand("sdf:cr:all");

        // Get config data from SD card
        setTimeout(() => {
            self.request_config_file_download(self.filedownloadname, 0);
        }, 1500);
        
        // Update UI
        // self.panel.find(".spinner-parent").removeClass("hidden");
        // self.panel.find(".config-information-parent").addClass("hidden");
        $(".header-panel").find(".progress-bar-overlay").removeClass("hidden");
        self.panel.find(".config-information-parent").addClass("disabled").addClass("blur");
    }

    self.update_panel_ui = function () {

        var data = self.configobject;
        
        var allstates = ["realtime"];
        
        // Timezone information
        self.panel.find(".data-information-parent").find(".timezone-dropdown").removeClass("disabled").val(data.survey["tz"]);

        // Survey information
        var projectid = self.ls.getItem("device/registration/project-id");
        var devicename = self.ls.getItem("device/registration/device-name");
        var sn = self.ls.getItem("device/registration/sn");

        self.panel.find(".survey-information-parent").find(".project-id-text").removeClass("disabled").text(projectid ? projectid : data.survey["id"]).attr("readonly", "true");
        self.panel.find(".survey-information-parent").find(".device-sn-text").removeClass("disabled").text(sn ? sn : global.sn);
        self.panel.find(".survey-information-parent").find(".device-name-text").removeClass("disabled").text(devicename ? devicename : data.device["name"]).attr("readonly", "true");
        self.panel.find(".survey-information-parent").find(".survey-location-text").removeClass("disabled").val(data.survey["location"]);
        
        // Sleep information
        self.panel.find(".device-information-parent").find(".sleep-mode-text").removeClass("disabled").val(data.sleep["mode"]);
        self.panel.find(".device-information-parent").find(".sleep-duration-text").removeClass("disabled").val(parseInt(data.sleep["duration"]) / 1000);

        // Server information
        if (data.server) {
            self.panel.find(".server-information-parent").find(".server-address-text").removeClass("disabled").val(data.server["url"] ? data.server["url"] : "");
            self.panel.find(".server-information-parent").find(".server-port-number-text").removeClass("disabled").val(data.server["port"] ? data.server["port"] : "");
            self.panel.find(".server-information-parent").find(".server-upload-enabled-dropdown").removeClass("disabled").val(data.server["enabled"]);
            self.panel.find(".server-information-parent").find(".server-type-dropdown").removeClass("disabled").val(data.server["type"]);
        }

        // SIM information
        if (data.sim) {
            self.panel.find(".sim-information-parent").find(".rat-dropdown").removeClass("disabled").val(data.sim["rat"]);
            self.panel.find(".sim-information-parent").find(".apn-text").removeClass("disabled").val(data.sim["apn"] ? data.sim["apn"] : "");
        }
        
        // Show enabled devices
        data.device["devices"].split(",").forEach(function (device, di) {
            self.panel.find(".devices-list-item[device='" + device.trim() + "']").css("opacity", "1").addClass("enabled");
        });
        
        // States list
        self.panel.find(".device-information-parent").find(".states-list .states-list-item").remove();
        allstates.forEach(function (state, si) {
            self.panel.find(".device-information-parent").find(".states-list").append(multiline(function () {/* 
                <div class="col-auto states-list-item shadow disabled" state="{{state}}" style="margin: 0 6px 6px 0;padding: 2px 6px;background: #e6e6e6;color: #505050;font-size: 12px;font-weight: bold;">
                    {{state}}
                </div>
            */}, {
                "state": state.trim()
            }));
        });

        // Show enabled states
        if (data.survey.realtime == "true") self.panel.find(".states-list-item[state='online']").removeClass("disabled").addClass("enabled");

        // Update listeners
        self.listeners();
    }

    self.process_response = function (response) {
        response = response.replace(/<br>/g, "");

        // console.log("Response received: " + response);

        if (response == "fupl:ack") {
            self.fileuploadline += self.lines_to_send;
            
            // Upload remainder of the config data to SD card
            self.request_file_upload(self.fileuploadline);
        }

        //! RTC responses
        else if (response.startsWith("rtc:")) {
            response = response.replace(/rtc:/g, "");
            var offset = self.timezone();


            if (response == "not-detected") {

                self.panel.find(".get-rtc-button").addClass("disabled");
                self.panel.find(".sync-rtc-button").addClass("disabled");

                self.panel.find(".gatorbyte-rtc-time-text").html("Error");
                self.panel.find(".rtc-sync-status").text("🛑 The RTC is either uninitialized or not connected to the GatorByte.");
            }

            else {
                
                var timestamp = response.split("-")[0];
                var source = response.split("-")[1];

                self.panel.find(".get-rtc-button").removeClass("disabled");
                self.panel.find(".sync-rtc-button").removeClass("disabled");

                console.log("Received GatorByte timestamp: " + timestamp + ", source: " + source);
                
                // if (source == "modem") {
                //     var offset = self.timezone();
                //     var oldtimestamp = parseInt(timestamp);
                //     var timestamp = (parseInt(timestamp) * 1000 + offset) / 1000;
                //     console.log("Adjusting MODEM timestamp to timezone.");
                //     console.log("Offset: " + offset / 1000 + " seconds, or " + offset / 1000 / 3600 + " hours.");
                //     console.log("Old time: " + moment(oldtimestamp * 1000).format("LLL") + ", " + oldtimestamp);
                //     console.log("New time: " +  moment(timestamp * 1000).format("LLL") + ", " + timestamp);
                // }

                var timestamp = parseInt(timestamp) * 1000;
                self.panel.find(".gatorbyte-rtc-time-text").attr("title", timestamp).html(multiline(function () {/* 
                    <span style="margin-right: 4px;">{{date}}</span>
                    <span>{{time}}</span>
                */}, {
                    date: moment(timestamp).format("MM/DD/YY"),
                    time: moment(timestamp).format("hh:mm a").toUpperCase()
                }));

                // Update RTC sync status
                if (Math.abs(timestamp - moment.now()) > 1 * 60 * 1000) {
                    self.panel.find(".rtc-sync-status").text("⛔ The GatorByte time is out of sync.");
                    self.panel.find(".sync-rtc-button").removeClass("disabled");
                }
                else {
                    if (source == "rtc") {
                        self.panel.find(".rtc-sync-status").text("✅ The clocks are in sync. No action required.");
                        self.panel.find(".sync-rtc-button").addClass("disabled");
                    }
                    else if (source == "modem") {
                        self.panel.find(".rtc-sync-status").text("⚠️ The clocks are in sync. However, the RTC is likely unoperational. The time has been acquired from the MODEM.");
                        self.panel.find(".sync-rtc-button").addClass("disabled");
                    }
                }
            }

            // Sync RTC time
            self.panel.find(".sync-rtc-button").off("click").click(function () {
                var offset = self.timezone();
                var date = moment(moment.now() - offset).format("MMM-DD-YYYY");
                var time = moment(moment.now() - offset).format("HH-mm-ss");

                console.log("Syncing RTC date and time to: "  + date + " " + time);

                self.sendcommand("rtc:sync" + date + time);
                setTimeout(() => {
                    self.show_rtctime();
                }, 0);
            });
        }

        //! BL responses
        else if (response.startsWith("bl:")) {
            response = response.replace(/bl:/g, "");

            self.panel.find(".bl-name-text").val("");
            self.panel.find(".bl-pin-text").val("");
            
            if (response == "not-detected") {
                self.panel.find(".bl-sync-status").removeClass("hidden").text("⛔ The AT-09 module is either uninitialized or not connected to the GatorByte.");
                self.panel.find(".update-bl-config-button").addClass("disabled").find("p").text("Update");
                
                self.panel.find(".bl-name-text").parent().addClass("disabled");
                self.panel.find(".bl-pin-text").parent().addClass("disabled");
            }
            else {
                self.panel.find(".update-bl-config-button").removeClass("disabled").find("p").text("Update");
                self.panel.find(".bl-sync-status").addClass("hidden");

                var blname = response.split(";")[0];
                var blpin = response.split(";")[1];

                console.log("Received BL name and pin: "  + blname + ", " + blpin);

                self.panel.find(".bl-name-text").val(blname).parent().removeClass("disabled");
                self.panel.find(".bl-pin-text").val(blpin).parent().removeClass("disabled");
            }
            
            // Update BL config
            self.panel.find(".update-bl-config-button").off("click").click(function () {
                $(this).addClass("disabled").find("p").html("Updating. Please wait.");
                
                var name = self.panel.find(".bl-name-text").val();
                var pin = self.panel.find(".bl-pin-text").val();

                console.log("Updating BL name and pin: "  + name + ", " + pin);

                self.sendcommand("bl:setconfig" + name + ";" + pin);
            });

        }

        //! SD config hash response
        else if (response.startsWith("cfghash:")) {
            response = response.replace(/cfghash:/, "");
            var sdconfighash = response;
            
            if (sdconfighash > 0) self.confighash["sd"] = sdconfighash;
            console.log("Hash from configuration on SD: " + sdconfighash);

            // Update UI
            self.onconfigsyncstatusupdate();
        }

        //! Battery level
        else if (response.startsWith("cfgbatt:")) {
            response = response.replace(/cfgbatt:/, "");
            var level = response;
            
            console.log("Battery level: " + level);

            var container = $(".gb-config-header .battery-icon-parent");
            if (level > 85) html = multiline(function() {/* 
                <i class="fa-solid fa-battery-full" style="opacity: 1;"></i>
            */});
            else if (level > 60) html = multiline(function() {/* 
                <i class="fa-solid fa-battery-three-quarters" style="opacity: 1;"></i>
            */});
            else if (level > 20) html = multiline(function() {/* 
                <i class="fa-solid fa-battery-half" style="opacity: 1;"></i>
            */});
            else if (level > 0) html = multiline(function() {/* 
                <i class="fa-solid fa-battery-empty" style="opacity: 1;"></i>
            */});

            // Set HTML
            container.html(html).attr("title",  title="Battery at " + parseFloat(level).toFixed(1) + "%");
        }
    }

    self.timezone = function () {
        var MyDate = new Date();
        var MyString = MyDate.toTimeString();
        var MyOffset = MyString.slice(12,17);

        var sign = MyOffset.indexOf("-") == 0 ? -1 : 1;
        var hours = parseInt(MyOffset.slice(1, 3));
        var minutes = parseInt(MyOffset.slice(3, 5));

        var milliseconds = sign * (hours * 3600 + minutes * 60) * 1000;
        return milliseconds;
    }

    self.getbattlevel = function (delay) {
        delay = delay ? delay : 0;

        setTimeout(() => {
            // Check config sync
            self.sendcommand("cfg:batt");
        }, delay);
    }

    self.checkconfigsync = function (delay) {
        delay = delay ? delay : 0;

        $(".gb-config-header").find(".sync-status-heading").removeClass("disabled").css("background", "#3d3d3d").text("Checking sync status");
        setTimeout(() => {
            // Check config sync
            self.sendcommand("cfg:hash");
        }, delay);
    }

    self.onconfigstateunknown = function (delay, message) {
        delay = delay ? delay : 0;

        $(".gb-config-header").find(".sync-status-heading").addClass("disabled").css("background", "#3d3d3d").text(message ? message : "Unknown sync status");
        setTimeout(() => {
            // Check config sync
            self.sendcommand("cfg:hash");
        }, delay);
    }

    self.onconfigsyncstatusupdate = function () {
        
        // Check if the configuration is out of sync
        if (self.confighash["local"] && self.confighash["sd"]) {
            if (self.confighash["local"] != self.confighash["sd"]) {
                console.error("Configuration out of sync.");
                $(".gb-config-header").find(".sync-status-heading").removeClass("disabled").css("background", "#962e38").text("Configuration out of sync.");
                $(".gb-config-header").find(".upload-config-data-button").removeClass("disabled").css("background", "#333333");
                $(".gb-config-header").find(".refresh-config-data-button").removeClass("disabled").css("background", "#333333");
            }
            else {
                console.log("Configuration in sync.");
                $(".gb-config-header").find(".sync-status-heading").removeClass("disabled").css("background", "#104c09").text("Configuration in sync");
                $(".gb-config-header").find(".upload-config-data-button").css("background", "#333333");
                $(".gb-config-header").find(".refresh-config-data-button").css("background", "#333333");
            }
        }
        else {
            if (!self.confighash["local"]) {
                console.error("No local copy of configuration found.");
                $(".gb-config-header").find(".upload-config-data-button").addClass("disabled").css("background", "#333333");
            }
            if (!self.confighash["sd"]) {
                console.error("No configuration found on SD.");
                $(".gb-config-header").find(".sync-status-heading").removeClass("disabled").css("background", "#962e38").text("Initial configuration pending.");
                $(".gb-config-header").find(".refresh-config-data-button").addClass("disabled").css("background", "#333333");
                $(".gb-config-header").find(".upload-config-data-button").addClass("disabled").css("background", "#333333");
                if (!$(".home-panel").find(".sd-error-notification").hasClass("hidden")) $(".home-panel .initial-configuration-pending-notification").removeClass("hidden");
            }
        }
    }
}