const { cat } = require('shelljs');

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

    self.panel = $(".configure-gb-panel");

    self.init = function () {

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
        $(".home-panel .configure-gb-button").off("click").click(function () {
            $(".configure-gb-panel").removeClass("hidden");
            $(".home-panel").addClass("hidden");
            
            // Send request to get GatorByte to enter cofig state
            var prefix = "##GB##", suffix = "#EOF#";
            self.ipcr.send('send-command-request', {
                command: prefix + "cfgb" + suffix,
                windowid: global.states.windowid,
                path: global.port.path
            });

            // Get config data from main process
            self.ipcr.send("ipc/config-data-get/request", {
                port: global.port
            });

            // Show UTC time
            self.show_utctime();
        });

        // Get RTC time
        self.panel.find(".get-rtc-button").off("click").click(function () {
            self.show_rtctime();
            self.show_utctime();
        });

        // Survey ID change listener
        self.panel.find(".survey-id-text").off("keyup").on("keyup", self.f.debounce(function() {
            var value = $(this).val();
            if (value && value.length > 3) self.configobject["survey"]["id"] = $(this).val();
            else {
                $(this).css("border-bottom", "1px solid red");
                setTimeout(() => { $(this).css("border-bottom", "1px solid #444444"); }, 2000);
            }

            // Save config data to main process
            self.save_config_in_storage();

        }, 150));

        // Survey location change listener
        self.panel.find(".survey-location-text").off("keyup").on("keyup", self.f.debounce(function() {
            var value = $(this).val();
            if (value && value.length > 3) self.configobject["survey"]["location"] = $(this).val();
            else {
                $(this).css("border-bottom", "1px solid red");
                setTimeout(() => { $(this).css("border-bottom", "1px solid #444444"); }, 2000);
            }

            // Save config data to main process
            self.save_config_in_storage();

        }, 150));

        // Sleep duration change listener
        self.panel.find(".sleep-duration-text").off("keyup").on("keyup", self.f.debounce(function() {
            var sleepmode = self.panel.find(".sleep-mode-text").val()
            var value = $(this).val();
            if (value && value.length > 3 && !isNaN(parseInt(value))) self.configobject["device"]["sleep"] = sleepmode + "," + $(this).val();
            else {
                $(this).css("border-bottom", "1px solid red");
                setTimeout(() => { $(this).css("border-bottom", "1px solid #444444"); }, 2000);
            }

            // Save config data to main process
            self.save_config_in_storage();

        }, 150));

        // Device click listener
        self.panel.find(".devices-list-item").off("click").on("click", function() {
            var enabled = $(this).hasClass("enabled");

            if (enabled) {
                $(this).removeClass("enabled").css("opacity", "0.4");
                
                var device = $(this).text().trim();
                var devices = self.configobject["device"]["devices"].split(",");
                var filtered = devices.filter(function(item){ 
                    return device != item; 
                });
                self.configobject["device"]["devices"] = filtered.join(",");
            }
            else {
                $(this).addClass("enabled").css("opacity", "1");

                var devices = self.configobject["device"]["devices"].split(",");
                var device = $(this).text().trim();
                devices.push(device);
                self.configobject["device"]["devices"] = devices.join(",");
            }

            // Save config data to main process
            self.save_config_in_storage();

        });
    }

    self.show_utctime = function () {
        if (self.panel.hasClass("hidden")) clearInterval(self.timers.utctimeupdate);
        var time = moment(moment.now()).format("MM/DD/YY hh:mm a");
        self.panel.find(".utc-time-text").text(time).attr("title", moment.now());
    }

    self.show_rtctime = function () {
        if (self.panel.hasClass("hidden")) clearInterval(self.timers.utctimeupdate);
        self.sendcommand("rtc:get");
    }

    self.process_file_download_data = function (data) {

        // Replace prefix with nothing and <br> with \n
        data = data.replace(/<br>/g, "\n").replace(/gdc-cfg::fdl:/, "");

        self.filedownloadline += 30;

        // Append file data
        self.filedownloaddata += data;

        // Request next part of the data if available
        if (data.length > 0) return self.request_file_download(self.filedownloadname, self.filedownloadline);
        
        // On download complete
        else {

            // If the file doesn't exist
            if (self.filedownloaddata.length == 0) {
                console.log("The config.ini file does not exist on the SD card.");

                // Update UI
                self.panel.find(".spinner-parent").addClass("hidden");
                self.panel.find(".config-information-parent").removeClass("hidden");
                self.panel.find(".download-progress").find(".text").css("background", "#962e38").text("Configuration file does not exist.");
            }

            // If config data successfully downloaded
            else {
                
                self.configdata = self.filedownloaddata;
                self.on_config_data_acquired(false);
            }

            // Reset global variables
            self.filedownloaddata = "";
            self.filedownloadline = 0;
        }

    }

    self.request_file_download = function (filename, startingline) {

        return new Promise(function (resolve, reject) {
            self.sendcommand("download" + ":" + filename + "," + startingline);
            self.state = "wait-on-file-download";
        });
    }

    self.on_config_data_acquired = function (stale) {

        if (stale) self.panel.find(".download-progress").find(".text").css("background", "#a2660b").text("Using saved configuration data");
        else self.panel.find(".download-progress").find(".text").css("background", "#104c09").text("Configuration sync complete");
            
        // Update UI
        self.panel.find(".spinner-parent").addClass("hidden");
        self.panel.find(".config-information-parent").removeClass("hidden");
        self.panel.find(".download-progress").find(".refresh-config-data-button").off("click").click(function () {
            
            // Reset global variables
            self.filedownloaddata = "";
            self.filedownloadline = 0;

            // Get config data from SD card
            self.request_file_download(self.filedownloadname, self.filedownloadline);
            
            // Update UI
            self.panel.find(".spinner-parent").removeClass("hidden");
            self.panel.find(".config-information-parent").addClass("hidden");
            self.panel.find(".download-progress").find(".text").css("background", "#3d3d3d").text("Fetching configuration from your GatorByte");
        });

        // Get RTC time
        self.show_rtctime();

        // Process config data and update UI
        self.process_config_data();

        // Save config data to main process
        self.save_config_in_storage();
    }

    self.save_config_in_storage = function () {
        
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
                self.panel.find(".download-progress").find(".text").css("background", "#962e38").text("Malformed configuration data on SD card.");
            }
        });
        currentcategory = null;

        if (!erroroccured) self.update_panel_ui();

    }

    self.objecttostring = function (object) {
        if (!object) return;
        
        var string = "";
        var indentation = "    ";
        Object.keys(object).forEach(function (key, ki) {
            string += key;
            string += "\n";

            Object.keys(object[key]).forEach(function (subkey, ski) {
                string += indentation + subkey + ":" + object[key][subkey];
                string += "\n";
            });
        });

        return string;
    }

    self.setconfigdata = function (object) {
        
        if (!object) {
            self.getconfigdatafromsd();
            self.panel.find(".download-progress").find(".text").css("background", "#3d3d3d").text("Fetching configuration from your GatorByte");
        }
        else {
            self.configobject = { ...object };
            self.configdata = self.objecttostring(self.configobject);
            self.on_config_data_acquired(true);
        }
    }

    self.getconfigdatafromsd = function () {
        
        // Get config data from SD card
        self.request_file_download(self.filedownloadname, 0);
        
        // Update UI
        self.panel.find(".spinner-parent").removeClass("hidden");
        self.panel.find(".config-information-parent").addClass("hidden");
    }

    self.update_panel_ui = function () {

        var data = self.configobject;

        var alldevices = ["mcu", "sd", "rtc", "booster", "rgb", "aht", "gps", "bl", "rgb", "ph", "rtd", "dox", "ec", "ph", "rain", "uss", "turbidity"];
        var allstates = ["realtime"];
        
        // Survey information
        self.panel.find(".survey-information-parent").find(".survey-id-text").val(data.survey["id"]);
        self.panel.find(".survey-information-parent").find(".survey-date").text(data.survey["date"]);
        self.panel.find(".survey-information-parent").find(".survey-location-text").val(data.survey["location"]);
        
        // Sleep information
        self.panel.find(".device-information-parent").find(".sleep-mode-text").val(data.sleep["mode"]);
        self.panel.find(".device-information-parent").find(".sleep-duration-text").val(parseInt(data.sleep["duration"]) / 1000);
        
        // Devices list
        self.panel.find(".device-information-parent").find(".devices-list .devices-list-item").remove();
        alldevices.forEach(function (device, di) {
            self.panel.find(".device-information-parent").find(".devices-list").append(multiline(function () {/* 
                <div class="col-auto devices-list-item shadow" device="{{devicename}}" style="margin: 0 6px 6px 0;padding: 2px 6px;background: #e6e6e6;color: #505050;font-size: 12px;font-weight: bold; opacity: 0.4;">
                    {{devicename}}
                </div>
            */}, {
                "devicename": device.trim()
            }));
        });

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

        if (response.startsWith("rtc:")) {
            response = response.replace(/rtc:/g, "");

            var timestamp = parseInt(response) * 1000;
            self.panel.find(".gatorbyte-rtc-time-text").attr("title", timestamp).html(multiline(function () {/* 
                <span style="margin-right: 4px;">{{date}}</span>
                <span>{{time}}</span>
            */}, {
                date: moment(timestamp).format("MM/DD/YY"),
                time: moment(timestamp).format("hh:mm a").toUpperCase()
            }));

            // Sync RTC time
            self.panel.find(".calibrate-rtc-button").off("click").click(function () {
                var offset = self.timezone();
                var date = moment(moment.now() - offset).format("MMM-DD-YYYY");
                var time = moment(moment.now() - offset).format("HH-mm-ss");
                self.sendcommand("rtc:sync" + date + time);
                setTimeout(() => {
                    self.show_rtctime();
                }, 1500);
            });
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
}