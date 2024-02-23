
function uicontrolvariablessubapp() {
    var self;
    self = this;
    self.version = 1.0;
    self.ls = window.sls;
    self.f = new functionsubapp().init();
    self.ipcr = require('electron').ipcRenderer;
    self.pwrsv =  require('electron').remote.powerSaveBlocker;
    self.a = global.accessors;
    
    self.filedownloadname = "variables.ini";
    self.filedownloaddata = "";
    self.filedownloadline = 0;
    self.fileuploadline = 0;
    self.lines_to_send = 30;

    self.hash = {};
    self.dataobject = {};
    self.datastring = "";

    self.panel = $(".control-variables-panel");

    self.init = function () {

        // Start listeners
        self.listeners();

        return self;
    }

    self.sendcommand = function (command) {

        self.ipcr.send('ipc/command/push', {
            command: command,
            windowid: global.states.windowid,
            path: global.port.path
        });
    }
    
    self.listeners = function () {

        // Dashboard big button
        $(".home-panel .big-button.control-variables-button").off("click").click(function () {

            // Show back button
            $(".go-back-panel-button").removeClass("hidden");
            
            $(".control-variables-panel").removeClass("hidden");
            $(".home-panel").addClass("hidden");
            $(".gb-config-header").removeClass("hidden");
            
            // Send request to get GatorByte to enter config state
            var prefix = "##GB##", suffix = "#EOF#";
            self.ipcr.send('ipc/command/push', {
                command: prefix + "cv" + suffix,
                windowid: global.states.windowid,
                path: global.port.path
            });
            
            self.panel.find(".cv-list-item").remove();
            self.panel.find(".loading-notification").removeClass("hidden");
            self.panel.find(".sync-error-notification").addClass("hidden");
            self.panel.find(".empty-notification").addClass("hidden");
            self.panel.find(".add-control-variable-button").addClass("disabled");
            self.panel.find(".sync-control-variable-button").addClass("disabled");

            // Get config data from main process
            setTimeout(() => {
                self.start_file_download();
            }, 500);

        });

        self.panel.find(".add-cv-value-input").off("keyup").keyup(self.f.debounce(function () {
            var value = $(this).val();

            if (value.trim().toLowerCase() == "true" || value.trim().toLowerCase() == "false") {
                self.panel.find(".add-cv-type-input").val("bool");
            }
            else if (!isNaN(parseFloat(value.trim())) && value.trim().indexOf(".") !== -1) {
                self.panel.find(".add-cv-type-input").val("float");
            }
            else if (!isNaN(parseFloat(value.trim())) && value.trim().indexOf(".") === -1) {
                self.panel.find(".add-cv-type-input").val("int");
            }
            else {
                self.panel.find(".add-cv-type-input").val("string");
            }
        }, 100));
        
        self.panel.find(".add-control-variable-button").off("click").click(function () {

            var name = self.panel.find(".add-cv-name-input").val().trim();
            var type = self.panel.find(".add-cv-type-input").val().trim();
            var value = self.panel.find(".add-cv-value-input").val().trim();

            // Send command
            self.sendcommand("add:" + name + ":" + type + ":" + value);

            self.add_item_to_list({
                key: name,
                value: value,
                type: type
            });

            self.panel.find(".empty-notification").addClass("hidden");
            
            $(".panel").addClass("disabled");
            $(".header-panel").find(".progress-bar-overlay").removeClass("hidden");
            $(".header-panel").find(".download-status-heading").text("Updating control variables");
            $(".header-panel").find(".download-status-text").text("In progress");
            $(".header-panel").find(".progress-bar-overlay").find(".progress").removeClass("progress-striped").addClass("progress-striped-infinite");
            $(".header-panel").find(".progress-bar-overlay").find(".progress").find(".progress-bar").css("width", "100%");

            // Get sync status
            setTimeout(() => {
                self.checkdatasync();
            }, 500);

        });
        
        self.panel.find(".sync-control-variable-button").off("click").click(function () {

            // Update self.datastring
            self.datastring = "";
            self.panel.find(".cv-list-item").each(function (ei, el) {
                var key = $(el).find(".cv-name-input").val().trim();
                var type = $(el).find(".cv-type-input").val().trim();
                var value = $(el).find(".cv-value-input").val().trim();

                self.datastring += key + ":" + value + "\n";
            });
            self.datastring = self.datastring.substring(0, self.datastring.length - 1);

            // Update self.dataobject
            self.dataobject = self.strtoobj();
            
            // Upload file
            self.upload_file(0);

            $(".panel").addClass("disabled");
            $(".header-panel").find(".progress-bar-overlay").removeClass("hidden");
            $(".header-panel").find(".download-status-heading").text("Uploading control variables");
            $(".header-panel").find(".download-status-text").text("In progress");
            $(".header-panel").find(".progress-bar-overlay").find(".progress").removeClass("progress-striped").addClass("progress-striped-infinite");
            $(".header-panel").find(".progress-bar-overlay").find(".progress").find(".progress-bar").css("width", "0");

        });
    }

    self.checkdatasync = function () {
        self.sendcommand("cv:hash");

        self.panel.find(".add-control-variable-button").addClass("disabled");
        self.panel.find(".sync-control-variable-button").addClass("disabled");
        self.panel.find(".sync-error-notification").addClass("hidden");
    }

    self.process_response = function (response) {
        response = response.replace(/<br>/g, "");

        // console.log("Response received: " + response);

        if (response.indexOf("hash") !== -1) {
            var hash = response.replace(/hash:/g, "");

            if (hash > 0) self.hash["sd"] = hash;

            self.oncsyncstatusupdate();

            self.panel.find(".add-control-variable-button").removeClass("disabled");
            self.panel.find(".sync-control-variable-button").removeClass("disabled");

            $(".panel").removeClass("disabled");
            $(".header-panel").find(".progress-bar-overlay").addClass("hidden");
        }

        
        if (response == "fupl:ack") {
            self.fileuploadline += self.lines_to_send;
            
            // Upload remainder of the data to SD card
            self.upload_file(self.fileuploadline);
        }
    }

    self.oncsyncstatusupdate = function () {
        
        // // Check if the configuration is out of sync
        // if (self.hash["local"] && self.hash["sd"]) {
        //     if (self.hash["local"] != self.hash["sd"]) {
        //         console.error("Control variables data out of sync.");
        //     }
        //     else {
        //         console.log("Configuration in sync.");
        //     }
        // }
        // else {
        //     if (!self.hash["local"]) {
        //         console.error("No local copy of control variables data found.");
        //     }
        //     if (!self.hash["sd"]) {
        //         console.error("No control variables data found on SD.");
        //     }
        // }
    }

    // Download file from SD
    self.start_file_download = function () {
        console.log("Starting file download.");
        self.request_file_data(0)
        
        self.panel.find(".add-control-variable-button").addClass("disabled");
        self.panel.find(".sync-control-variable-button").addClass("disabled");

        $(".panel").addClass("disabled");
        $(".header-panel").find(".progress-bar-overlay").removeClass("hidden");
        $(".header-panel").find(".download-status-heading").text("Fetching control variables");
        $(".header-panel").find(".download-status-text").text("In progress");
        $(".header-panel").find(".progress-bar-overlay").find(".progress").addClass("progress-striped").removeClass("progress-striped-infinite");
        $(".header-panel").find(".progress-bar-overlay").find(".progress").find(".progress-bar").css("width", "100%");
    }
    
    // Request data from file from SD
    self.request_file_data = function (startingline) {

        return new Promise(function (resolve, reject) {
            self.sendcommand("cvdl" + ":" + startingline);
            self.state = "wait-on-file-download";
        });
    }

    self.objtostr = function () {
        self.datastring = "";

        Object.keys(self.dataobject).forEach(function (key, ki) {
            var type = self.dataobject[key].type;
            var value = self.dataobject[key].value;

            self.datastring += key + ":" + value;
        });
    }

    self.strtoobj = function () {
        self.datastring.split(/\r?\n/).forEach(row => {
            if (!row || row.length == 0 || row.indexOf(":") === -1) {
                self.panel.find(".sync-error-notification").removeClass("hidden");
                return;
            }

            var key = row.split(":")[0].trim();
            var value = row.split(":")[1].trim();

            var type;
            if (value.charAt(0) == "\"" && value.charAt(value.length) == "\"") {
                type = "string";
                value = value.substring(1, value.length - 1);
            }
            else if (value.toLowerCase().indexOf("true") !== -1 || value.toLowerCase().indexOf("false") !== -1) {
                type = "bool";
            }
            else if (value.indexOf(".") !== -1 && value.replace(".", "").indexOf(".") === -1) {
                type = "float";
            }
            else {
                type = "int";
            }
            
            self.dataobject[key] = {
                type: type,
                value: value
            };
        });

        return self.dataobject;
    }

    self.process_incoming_file = function (data) {

        // Replace prefix with nothing and <br> with \n
        data = data.replace(/<br>/g, "\n").replace(/gdc-cv::fdl:/, "");
        self.filedownloadline += self.lines_to_send;

        // Append file data
        self.filedownloaddata += data.replace(/#EOF#/g, "");

        // On download complete
        if (data.indexOf("#EOF#") !== -1) {
        
            // If the file doesn't exist
            if (self.filedownloaddata.length == 0) {
                console.log("The variables.ini file does not exist on the SD card.");

                // Populate the last used control variables
                self.datastring = self.ls.getItem("/cv/lastused");

                // Convert to JSON
                if (self.datastring.length > 0) self.dataobject = self.strtoobj();
                
                self.panel.find(".add-control-variable-button").removeClass("disabled");
                self.panel.find(".sync-control-variable-button").removeClass("disabled");

                self.panel.find(".loading-notification").addClass("hidden");
                self.panel.find(".cv-list-item").remove();
                setTimeout(() => {
                    self.panel.find(".empty-notification").removeClass("hidden").html(multiline(function () {/* 
                        <div style="padding: 6px 8px; background: #00000052; border-radius: 4px;">
                            <i class="fa-solid fa-triangle-exclamation" style="color: coral; margin-right: 6px;"></i>
                            <span>No control variables found. </span>
                            <span class="{{notice-visibility}}">Using the variables used in the last GatorByte you uploaded the variables to.<br>Please click on "Sync Changes" to upload the variables.</span>
                        </div>
                    */}, {
                        "notice-visibility": self.datastring.length > 0 ? "" : "hidden"
                    }));
                }, 300);
                // UI updates
                self.on_file_download_complete(self.dataobject);
            }

            // If config data successfully downloaded
            else {
                console.log("File download complete: variables.ini");
                
                // Assign string data
                self.datastring = self.filedownloaddata;

                // Convert to JSON
                self.dataobject = self.strtoobj();

                // UI updates
                self.on_file_download_complete(self.dataobject);

                // Persist to browser storage
                self.ls.setItem("/cv/lastused", self.datastring);

                self.checkdatasync(500);
                
            }

            // Reset global variables
            self.filedownloaddata = "";
            self.filedownloadline = 0;
        }
    }

    self.on_file_download_complete = function (data) {
        
        self.panel.find(".add-control-variable-button").removeClass("disabled");
        self.panel.find(".sync-control-variable-button").removeClass("disabled");
        $(".panel").removeClass("disabled");
        $(".header-panel").find(".progress-bar-overlay").addClass("hidden");
        
        // Generate list
        if (Object.keys(self.dataobject).length == 0) {
            self.panel.find(".loading-notification").addClass("hidden");
            self.panel.find(".empty-notification").removeClass("hidden");
            self.panel.find(".cv-list-item").remove();
        }
        else {
            self.panel.find(".loading-notification").addClass("hidden");
            self.panel.find(".empty-notification").addClass("hidden");
            self.panel.find(".cv-list-item").remove();
            
            Object.keys(self.dataobject).forEach(function (key, ki) {
                var type = self.dataobject[key].type;
                var value = self.dataobject[key].value;
                
                self.add_item_to_list({
                    key: key,
                    value: value,
                    type: type
                });
            });
        }
    }

    self.on_file_upload_complete = function (data) {
        
        self.panel.find(".add-control-variable-button").removeClass("disabled");
        self.panel.find(".sync-control-variable-button").removeClass("disabled");
        
        $(".panel").removeClass("disabled");
        $(".header-panel").find(".progress-bar-overlay").addClass("hidden");
    }

    self.add_item_to_list = function (args) {
        var key = args.key, value = args.value, type = args.type;

        self.panel.find(".list").append(multiline(function () {/*
            <div class="row cv-list-item" controlvariablename="{{key}}" style="margin: 6px 0 10px 0;">
                <div class="col" style="margin-right: 6px; min-width: 60px; padding-right: 4px;">
                    <input class="cv-name-input" placeholder="Variable name" style="padding: 0 4px; width: 100%; background: transparent; outline: 0; border: 0; border-bottom: 1px solid #444; color: rgb(197, 197, 197); font-size: 14px; text-align: justify; margin-bottom: 0px;" value="{{key}}">
                </div>
                
                <div class="col-auto hidden" style="margin-right: 6px; min-width: 60px; padding-right: 4px;">
                    <select class="cv-type-input" style="padding: 0 4px; background: transparent; outline: 0; border: 0; border-bottom: 1px solid #444; color: rgb(197, 197, 197); font-size: 14px; text-align: justify; margin-bottom: 0px;">
                        <option value="int" style="color: #222;">int</option>
                        <option value="float" style="color: #222;">float</option>
                        <option value="bool" style="color: #222;">bool</option>
                        <option value="string" style="color: #222;">string</option>
                    </select>
                </div>
                
                <div class="col" style="margin-right: 6px; min-width: 60px;">
                    <input class="cv-value-input" placeholder="value" style="padding: 0 4px; width: 100%; background: transparent; outline: 0; border: 0; border-bottom: 1px solid #444; color: rgb(197, 197, 197); font-size: 14px; text-align: justify; margin-bottom: 0px;" value="{{value}}">
                </div>
                
                <div class="col-auto" controlvariablename="{{key}}" style="margin-right: 6px; color: crimson;font-size: 13px;margin-top: 4px;">
                    <i class="fa-solid fa-trash-can delete-cv-item" title="Double click to delete"></i>
                </div>
            </div>
        */}, {
            "key": key,
            "value": value
        }));

        self.panel.find(".cv-list-item[controlvariablename='" + key + "']").find(".cv-type-input").val(type);

        self.panel.find(".delete-cv-item").off("dblclick").dblclick(function () {
            var variablename = $(this).parent().attr("controlvariablename");
            self.panel.find(".cv-list-item[controlvariablename='" + variablename + "']").remove();
        });
    }

    self.upload_file = function (startingline) {
        
        self.panel.find(".add-control-variable-button").addClass("disabled");
        self.panel.find(".sync-control-variable-button").addClass("disabled");

        var datatosend = self.datastring.substring(startingline, startingline + self.lines_to_send).replace(/\n/g, "~").replace(/ /g, "`");
        
        // If data is still not fully sent
        if (datatosend && datatosend.trim().length > 0) {
            var uploadedbyte = startingline + self.lines_to_send >= self.datastring.length ? self.datastring.length : startingline + self.lines_to_send;
            
            $(".header-panel").find(".progress").find(".progress-bar").css("width", (uploadedbyte / self.datastring.length) * $(".header-panel").find(".progress-bar-overlay").find(".progress").width());
            $(".header-panel").find(".download-status-text").text("Uploaded " + (uploadedbyte + " / " + self.datastring.length + " B"));

            return new Promise(function (resolve, reject) {
                self.sendcommand("cvupl:" + datatosend + "^" + startingline);
            });
        }

        // Upload complete
        else {
            console.log("Upload complete");
            self.fileuploadline = 0;

            // Send a request to update the config in GatorByte's memory
            self.sendcommand("cvupd:done");

            // Check config data sync after 500 ms
            self.checkdatasync(500);

            self.on_file_upload_complete();
        }
    }

}