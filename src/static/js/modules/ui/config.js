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
    self.fileuploadline = 0;

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

            // Update flag
            self.configobject["updateflag"] = true;
            
            // Save config data to main process
            self.save_config_in_storage();

            // Update config data
            self.configdata = self.objecttostring(self.configobject);

        }, 150));

        // Survey location change listener
        self.panel.find(".survey-location-text").off("keyup").on("keyup", self.f.debounce(function() {
            var value = $(this).val();
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

        // Sleep duration change listener
        self.panel.find(".sleep-duration-text").off("keyup").on("keyup", self.f.debounce(function() {
            var value = parseInt($(this).val());

            if (value && value >= 3 && !isNaN(parseInt(value))) self.configobject["sleep"]["duration"] = value * 1000;
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
            self.configobject["data"]["readuntil"] = readmode;
            
            // Update flag
            self.configobject["updateflag"] = true;

            // Save config data to main process
            self.save_config_in_storage();

            // Update config data
            self.configdata = self.objecttostring(self.configobject);
        });

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
            
            // Update flag
            self.configobject["updateflag"] = true;

            // Save config data to main process
            self.save_config_in_storage();

            // Update config data
            self.configdata = self.objecttostring(self.configobject);

        });
    }

    self.show_utctime = function () {
        if (self.panel.hasClass("hidden")) clearInterval(self.timers.utctimeupdate);
        var time = moment(moment.now()).format("MM/DD/YY hh:mm a");
        self.panel.find(".utc-time-text").text(time).attr("title", moment.now());
    }

    self.show_rtctime = function () {
        if (self.panel.hasClass("hidden")) clearInterval(self.timers.utctimeupdate);
        self.panel.find(".rtc-sync-status").text("Fetching RTC time.").css("color", "#b17200");
        setTimeout(() => {
            self.sendcommand("rtc:get");
        }, self.panel.find(".gatorbyte-rtc-time-text").text() == "-" ? 0 : 1000);
    }

    self.process_file_download_data = function (data) {

        // Replace prefix with nothing and <br> with \n
        data = data.replace(/<br>/g, "\n").replace(/gdc-cfg::fdl:/, "");
        
        self.panel.find(".download-status-text").removeClass("hidden").text(self.filedownloadline + " kB downloaded");

        self.filedownloadline += 30;

        // Append file data
        self.filedownloaddata += data;

        // Request next part of the data if available
        if (data.length > 0) {
            self.panel.find(".download-status-text").removeClass("hidden").text(self.filedownloadline + " kB downloaded");
            return self.request_file_download(self.filedownloadname, self.filedownloadline);
        }
        
        // On download complete
        else {

            // If the file doesn't exist
            if (self.filedownloaddata.length == 0) {
                console.log("The config.ini file does not exist on the SD card.");

                // Update UI
                // self.panel.find(".spinner-parent").addClass("hidden");
                // self.panel.find(".config-information-parent").removeClass("hidden");
                self.panel.find(".config-sync-notification-parent").addClass("hidden");
                self.panel.find(".config-information-parent").removeClass("disabled").removeClass("blur");
                
                self.panel.find(".sync-status-heading").css("background", "#962e38").text("Configuration file does not exist.");
            }

            // If config data successfully downloaded
            else {
                self.panel.find(".download-status-text").removeClass("hidden").text("Download complete");
                self.configdata = self.filedownloaddata;
                
                // Update flag
                self.configobject["updateflag"] = false;

                self.on_config_data_acquired(false);
            }

            // Reset global variables
            self.filedownloaddata = "";
            self.filedownloadline = 0;
        }

    }

    self.request_file_download = function (filename, startingline) {

        return new Promise(function (resolve, reject) {
            self.sendcommand("dl" + ":" + filename + "," + startingline);
            self.state = "wait-on-file-download";
        });
    }

    // Upload config data to SD card
    self.request_file_upload = function (startingline) {
        var datatosend = self.configdata.substring(startingline, startingline + 30).replace(/\n/g, "~").replace(/ /g, "`");
        
        // If data is still not fully sent
        if (datatosend && datatosend.trim().length > 0) {
            var uploadedbyte = startingline + 30 >= self.configdata.length ? self.configdata.length : startingline + 30;
            
            self.panel.find(".progress").find(".progress-bar").css("width", (uploadedbyte / self.configdata.length) * self.panel.find(".progress").width());
            self.panel.find(".download-status-text").text("Uploaded " + (uploadedbyte + " / " + self.configdata.length + " kB"));

            return new Promise(function (resolve, reject) {
                self.sendcommand("upl" + ":" + datatosend + "^" + startingline);
                self.state = "wait-on-file-upload";
            });
        }

        // Upload complete
        else {
            console.log("Upload complete");
            self.fileuploadline = 0;
            self.configobject["updateflag"] = false;

            // self.panel.find(".spinner-parent").addClass("hidden");
            // self.panel.find(".config-information-parent").removeClass("hidden");
            self.panel.find(".config-sync-notification-parent").addClass("hidden");
            self.panel.find(".config-information-parent").removeClass("disabled").removeClass("blur");
            
            self.on_config_data_acquired();
            
            // Save config data to main process
            self.save_config_in_storage();

            // Update config data
            self.configdata = self.objecttostring(self.configobject);
        }
    }

    self.on_config_data_acquired = function (stale) {

        // Check if the saved configuration was updated and needs to be uploaded
        if (self.configobject["updateflag"]) {
            self.panel.find(".sync-status-heading").css("background", "#865600").text("Configuration upload due");
            self.panel.find(".upload-config-data-button").css("background", "#865600");
        }
        else {
            setTimeout(() => {
                if (stale) self.panel.find(".sync-status-heading").css("background", "#a2660b").text("Using saved configuration data");
                else self.panel.find(".sync-status-heading").css("background", "#104c09").text("Configuration sync complete");

                $(".upload-config-data-button").css("background", "#333");
            }, 50);
        }
            
        // Update UI
        // self.panel.find(".spinner-parent").addClass("hidden");
        // self.panel.find(".config-information-parent").removeClass("hidden");
        self.panel.find(".config-sync-notification-parent").addClass("hidden");
        self.panel.find(".config-information-parent").removeClass("disabled").removeClass("blur");
        self.panel.find(".refresh-config-data-button").off("click").click(function () {
            
            // Reset global variables
            self.filedownloaddata = "";
            self.filedownloadline = 0;

            // Get config data from SD card
            self.request_file_download(self.filedownloadname, self.filedownloadline);
            
            // Update UI
            // self.panel.find(".spinner-parent").removeClass("hidden");
            // self.panel.find(".config-information-parent").addClass("hidden");
            self.panel.find(".config-sync-notification-parent").removeClass("hidden");
            self.panel.find(".config-information-parent").addClass("disabled").addClass("blur");
            self.panel.find(".download-status-heading").text("Downloading configuration");
            self.panel.find(".download-status-text").text("Initializing download");
            self.panel.find(".progress").addClass("progress-striped-infinite").removeClass("progress-striped");
            self.panel.find(".progress").find(".progress-bar").css("width", "100%");
        });
        self.panel.find(".upload-config-data-button").off("click").click(function () {
            
            // Update UI
            // self.panel.find(".spinner-parent").removeClass("hidden");
            // self.panel.find(".config-information-parent").addClass("hidden");
            self.panel.find(".config-sync-notification-parent").removeClass("hidden");
            self.panel.find(".config-information-parent").addClass("disabled").addClass("blur");
            self.panel.find(".download-status-heading").text("Uploading configuration");
            self.panel.find(".download-status-text").text("Initializing upload");
            self.panel.find(".progress").addClass("progress-striped").removeClass("progress-striped-infinite");
            self.panel.find(".progress").find(".progress-bar").css("width", "0px");
            
            // Upload config data to SD card
            self.request_file_upload(self.fileuploadline);
        });

        // Get RTC time
        self.show_rtctime();

        self.configobject["updateflag"] = false;

        // Process config data and update UI
        self.process_config_data();

        // Save config data to main process
        self.save_config_in_storage();
    }

    self.save_config_in_storage = function () {

        // Update UI
        self.panel.find(".sync-status-heading").css("background", "#865600").text("Configuration upload due");
        self.panel.find(".upload-config-data-button").css("background", "#865600");
        
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
                self.panel.find(".sync-status-heading").css("background", "#962e38").text("Malformed configuration data on SD card.");
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
            self.panel.find(".sync-status-heading").css("background", "#3d3d3d").text("Fetching GatorByte's configuration.");
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
        // self.panel.find(".spinner-parent").removeClass("hidden");
        // self.panel.find(".config-information-parent").addClass("hidden");
        self.panel.find(".config-sync-notification-parent").removeClass("hidden");
        self.panel.find(".config-information-parent").addClass("disabled").addClass("blur");
    }

    self.update_panel_ui = function () {

        var data = self.configobject;

        var alldevices = ["mcu", "sd", "rtc", "booster", "rgb", "aht", "gps", "bl", "rgb", "ph", "rtd", "dox", "ec", "ph", "rain", "uss", "turbidity"];
        var allstates = ["realtime"];
        
        // Survey information
        self.panel.find(".survey-information-parent").find(".survey-id-text").val(data.survey["id"]);
        self.panel.find(".survey-information-parent").find(".survey-location-text").val(data.survey["location"]);
        
        self.panel.find(".survey-information-parent").find(".survey-date").val(data.survey["date"]);
        self.panel.find(".survey-information-parent").find(".survey-date-picker").datetimepicker({
            datepicker: true,
            timepicker: false,
            defaultDate: moment(data.survey["date"], "MM-DD-YYYY").format("YYYY/MM/DD"),
            onChangeDateTime: function (dp, input) {
                var date = input.val().split(" ")[0];
                var timestamp = moment(date + " 12:00AM", "YYYY/MM/DD").valueOf();
                $(input).find("input").attr("utc", timestamp);
                $(input).find("input").attr("date", moment(timestamp).format("MM-DD-YYYY"));
                $(input).find("input").val(moment(timestamp).format("MM-DD-YYYY"));

                // Update the object
                self.configobject["survey"]["date"] = moment(timestamp).format("MM-DD-YYYY");

                // Update flag
                self.configobject["updateflag"] = true;

                // Save config data to main process
                self.save_config_in_storage();

                // Update config data
                self.configdata = self.objecttostring(self.configobject);
            }
        });

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

        // // Show enabled devices
        // data.device["devices"].split(",").forEach(function (device, di) {
        //     self.panel.find(".devices-list-item[device='" + device.trim() + "']").css("opacity", "1").addClass("enabled");
        // });
        
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

        if (response == "fupl:ack") {
            self.fileuploadline += 30;
            
            // Upload remainder of the config data to SD card
            self.request_file_upload(self.fileuploadline);
        }

        else if (response.startsWith("rtc:")) {
            response = response.replace(/rtc:/g, "");

            var timestamp = parseInt(response) * 1000;
            self.panel.find(".gatorbyte-rtc-time-text").attr("title", timestamp).html(multiline(function () {/* 
                <span style="margin-right: 4px;">{{date}}</span>
                <span>{{time}}</span>
            */}, {
                date: moment(timestamp).format("MM/DD/YY"),
                time: moment(timestamp).format("hh:mm a").toUpperCase()
            }));

            // Update RTC sync status
            if (Math.abs(timestamp - moment.now()) > 1 * 60 * 1000) {
                self.panel.find(".rtc-sync-status").text("The RTC clock is out of sync. Please use the 'Sync RTC' button to sync the clocks.").css("color", "#d23512");
            }
            else {
                self.panel.find(".rtc-sync-status").text("The clocks are in sync. No action required.").css("color", "green");
            }

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