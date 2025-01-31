
function uidiagnosticsgatorbytesubapp() {
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

    self.alldevices = [];
    self.enableddevices = [];

    self.panel = $(".diagnostics-gb-panel");

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
        $(".home-panel .big-button.gb-diagnostics-button").off("click").click(function () {

            // Show back button
            $(".go-back-panel-button").removeClass("hidden");
            
            $(".diagnostics-gb-panel").removeClass("hidden");
            $(".home-panel").addClass("hidden");
            $(".gb-config-header").removeClass("hidden"); setheight();

            self.initui();

            self.panel.find(".diagnostics-button-parent").removeClass("hidden");
            self.panel.find(".diagnostics-sub-panels-list-parent").addClass("hidden");
            self.panel.find(".communication-diagnostics-sub-panel").addClass("hidden");
            
            // Get config data
            global.accessors.uiconfiggatorbyte.request_config().then(function (configdata) {
                self.configdata = configdata;
                self.alldevices = global.accessors.uiconfiggatorbyte.devices;
                self.enableddevices = configdata.device.devices;
                self.enableddevices = (self.enableddevices || "").split(",");
            });
        });

        // Start peripherals diagnostics button
        self.panel.find(".start-peripherals-diagnostics-tests-button").off("click").click(function () {
            var category = $(this).attr("category") || "peripherals";

            $(".diagnostics-gb-panel").removeClass("hidden");
            $(".home-panel").addClass("hidden");
            $(".gb-config-header").addClass("hidden"); setheight();

            self.panel.find(".diagnostics-button-parent").addClass("hidden");
            self.panel.find(".diagnostics-sub-panels-list-parent").removeClass("hidden");
            self.panel.find(".communication-diagnostics-sub-panel").addClass("hidden");

            self.initui();

            // Enter diagnostics state
            var prefix = "##GB##", suffix = "#EOF#";
            self.ipcr.send('ipc/command/push', {
                command: prefix + "dgn" + suffix,
                windowid: global.states.windowid,
                path: global.port.path
            });

            // Display panels of devices in the device config
            self.displaypanels(category.split(","));

        });

        // Start power diagnostics button
        self.panel.find(".start-power-diagnostics-tests-button").off("click").click(function () {
            var category = $(this).attr("category") || "peripherals";

            $(".home-panel").addClass("hidden");
            $(".gb-config-header").addClass("hidden"); setheight();
            $(".diagnostics-gb-panel").removeClass("hidden");

            self.panel.find(".diagnostics-button-parent").addClass("hidden");
            self.panel.find(".diagnostics-sub-panels-list-parent").removeClass("hidden");

            // Enter diagnostics state
            var prefix = "##GB##", suffix = "#EOF#";
            self.ipcr.send('ipc/command/push', {
                command: prefix + "dgn" + suffix,
                windowid: global.states.windowid,
                path: global.port.path
            });

            // Display panels of devices in the device config
            self.displaypanels(category.split(","));

        });

        // Start communications diagnostics button
        self.panel.find(".start-communications-diagnostics-tests-button").off("click").click(function () {
            var category = $(this).attr("category");

            $(".home-panel").addClass("hidden");
            $(".gb-config-header").addClass("hidden"); setheight();
            $(".diagnostics-gb-panel").removeClass("hidden");

            self.panel.find(".diagnostics-button-parent").addClass("hidden");
            self.panel.find(".communication-diagnostics-sub-panel").removeClass("hidden");

            // Enter diagnostics state
            var prefix = "##GB##", suffix = "#EOF#";
            self.ipcr.send('ipc/command/push', {
                command: prefix + "dgn" + suffix,
                windowid: global.states.windowid,
                path: global.port.path
            });

            // Start initial tests
            setTimeout(() => {
                self.sendcommand("comm:all");
            }, 250);
        });

        // Search input listener
        self.panel.find(".diagnostics-sub-panels-list-parent .search-input").find("input").off("keyup").keyup(self.f.debounce(function () {
            var value = $(this).val().toLowerCase();
            
            var atleastonefound = false;
            $(".diagnostics-sub-panel-item").addClass("hidden").each(function (ei, el) {
                var devicename = $(el).find("p").first().text().toLowerCase();
                var deviceid = $(el).attr("type").toLowerCase();

                if (devicename.indexOf(value) > -1 || deviceid.indexOf(value) > -1) {

                    // Show device only if it is specified in the device config
                    if (self.enableddevices.indexOf(deviceid) > -1) {
                        $(this).removeClass("hidden");
                        atleastonefound = true;

                        // Test individual devices click listener
                        $(".diagnostics-sub-panel-item[type='" + deviceid + "']").off("click").click(function () {
                            var deviceid = $(this).attr("type");
                            self.testdevice(deviceid);
                        });
                    }
                }   
            });

            if (atleastonefound) {
                $(".diagnostics-sub-panels-list-parent .no-device-notification").addClass("hidden");
            }
            else {
                $(".diagnostics-sub-panels-list-parent .no-device-notification").removeClass("hidden");
            }

        }, 250));

        // Start diagnostics button
        self.panel.find(".start-all-diagnostics-button").off("click").click(function () {
            
            // Start diagnostics tests
            self.starttests();
        });

        // Back button
        self.panel.find(".back-to-diagnostics-home-button").off("click").click(function () {
            
            $(".diagnostics-gb-panel").removeClass("hidden");
            $(".home-panel").addClass("hidden");
            $(".gb-config-header").removeClass("hidden"); setheight();

            self.panel.find(".diagnostics-button-parent").removeClass("hidden");
            self.panel.find(".diagnostics-sub-panels-list-parent").addClass("hidden");
            self.panel.find(".communication-diagnostics-sub-panel").addClass("hidden");
            
            self.initui();
            
            // Disable communication diagnostics refresh button
            self.panel.find(".communication-diagnostics-sub-panel .refresh-button").addClass("disabled");

            // Hide test panel items
            $(".diagnostics-sub-panel-item").addClass("hidden");

            // Enter diagnostics state
            var prefix = "##GB##", suffix = "#EOF#";
            self.ipcr.send('ipc/command/push', {
                command: prefix + "dgn" + suffix,
                windowid: global.states.windowid,
                path: global.port.path
            });
        });

        // comm-diagnostics-item click handler
        self.panel.find(".comm-diagnostics-item").off("click").click(function () {
            var type = $(this).attr("type");
            self.panel.find(".comm-diagnostics-item[type='" + type + "']").find(".text").text("-");
            self.sendcommand("comm:" + type);
        });

        // Refresh communication status button
        self.panel.find(".communication-diagnostics-sub-panel .refresh-button").off("click").click(function () {

            $(this).addClass("disabled");
            self.panel.find(".modem-activity-text").text("-");
            self.panel.find(".power-status-text").text("-");
            self.panel.find(".cellular-status-text").text("-");
            self.panel.find(".mqtt-status-text").text("-");
            self.panel.find(".modem-firmware-text").text("-");
            self.panel.find(".modem-imei-text").text("-");
            self.panel.find(".sim-iccid-text").text("-");
            self.panel.find(".cell-operator-text").text("-");
            self.panel.find(".cell-rssi-text").text("-");

            // Start initial tests
            setTimeout(() => {
                self.sendcommand("comm:all");
            }, 250);
        });

        // Reboot MODEM button
        self.panel.find(".communication-diagnostics-sub-panel .reboot-modem-button").off("click").click(function () {

            $(this).addClass("disabled");
            self.panel.find(".modem-activity-text").text("-");
            self.panel.find(".power-status-text").text("-");
            self.panel.find(".cellular-status-text").text("-");
            self.panel.find(".mqtt-status-text").text("-");
            self.panel.find(".modem-firmware-text").text("-");
            self.panel.find(".modem-imei-text").text("-");
            self.panel.find(".sim-iccid-text").text("-");
            self.panel.find(".cell-operator-text").text("-");
            self.panel.find(".cell-rssi-text").text("-");

            // Start initial tests
            setTimeout(() => {
                self.sendcommand("comm:modem:rb");
            }, 250);
        });

        // Connection test button
        self.panel.find(".communication-diagnostics-sub-panel .conn-test-button").off("click").click(function () {

            // Start initial tests
            setTimeout(() => {
                self.sendcommand("##GB##dgncomm:conn");
            }, 250);
        });
    }

    self.displaypanels = function (categories) {

        if (!self.enableddevices) console.log("Configuration data (enableddevices) not initialized");

        var devicesmetadata = self.alldevices.filter(function (d) { return categories.indexOf(d.category) > -1; });
        
        console.log(devicesmetadata);

        // Hide panels
        $(".diagnostics-sub-panel-item").addClass("hidden");
        
        // Show panels; Disable them
        self.enableddevices.forEach(function (device) {

            // Check if the device does not belong in the category
            if (devicesmetadata.filter(function (d) { return d.id == device; }).length == 0) return;

            console.log(device);

            $(".diagnostics-sub-panel-item[type='" + device + "']").removeClass("hidden").css("opacity", "0.5");

            // Test individual devices click listener
            $(".diagnostics-sub-panel-item[type='" + device + "']").off("click").click(function () {
                var deviceid = $(this).attr("type");
                self.testdevice(deviceid);
            });
        });
        
    }

    self.starttests = function () {
        console.log("Starting diagnostics tests.");

        if (!self.enableddevices) console.log("Configuration data (enableddevices) not initialized");

        var functions = [];
        self.enableddevices.forEach(function (device) {
            functions.push(function () {
                self.testdevice(device);
            });
            
        });
        
        self.f.waterfall(functions, 300)
            .then(function() {
                console.log("All test requests sent");
            });
        
    }

    self.testdevice = function (device) {
        console.log("Testing device: " + device.split("dgn:")[1]);

        var devicedata = self.f.grep(self.alldevices, "id", device.split("dgn:")[1], true);

        // Return if the device doesn not require testing
        if (devicedata && devicedata.test == false) return;
        
        $(".diagnostics-sub-panel-item[type='" + device + "']").removeClass("hidden").css("opacity", "1");

        self.sendcommand(device);
        self.setstatus({
            ui: "." + device + "-status",
            font: "fa-vial",
            color: "#555",
            message: "Testing"
        });
    }

    self.process_response = function (response) {
        response = response.replace(/<br>/g, "");

        if (response.startsWith("rtc:")) {
            response = response.replace(/rtc:/g, "");

            console.log("Received RTC timestamp: " + response)

            var timestamp = parseInt(response) * 1000;
            self.panel.find(".gatorbyte-rtc-time-text").attr("title", timestamp).html(multiline(function () {/* 
                <span style="margin-right: 4px;">{{date}}</span>
                <span>{{time}}</span>
            */}, {
                date: moment(timestamp).format("MM/DD/YY"),
                time: moment(timestamp).format("hh:mm a").toUpperCase()
            }));

            if (timestamp > -1 && timestamp - moment.now() <= 300000) {
                
                self.setstatus({
                    ui: ".rtc-status",
                    font: "fa-check",
                    color: "green",
                    message: "OK"
                });

                self.panel.find(".rtc-text").html(multiline(function () {/* 
                    <span style="margin-right: 4px;">{{status}}</span>
                */}, {
                    status: "Device ready"
                }));
            }
            else if (timestamp > -1 && timestamp - moment.now() >= 300000) {
                
                self.setstatus({
                    ui: ".rtc-status",
                    font: "fa-exclamation",
                    color: "crimson",
                    message: "Out of sync"
                });
                
                self.panel.find(".rtc-text").html(multiline(function () {/* 
                    <span style="margin-right: 4px;">{{status}}</span>
                */}, {
                    status: "Out of sync"
                }));
            }
            else  {

                self.setstatus({
                    ui: ".rtc-status",
                    font: "fa-triangle-exclamation",
                    color: "crimson",
                    message: "Error"
                });
                
                self.panel.find(".rtc-text").html(multiline(function () {/* 
                    <span style="margin-right: 4px;">{{status}}</span>
                */}, {
                    status: "Not detected"
                }));
            }
        }

        if (response.startsWith("mem:")) {
            response = response.replace(/mem:/g, "");

            if (!self.panel.hasClass("hidden")) {

                self.panel.find(".mem-text").html(multiline(function () {/* 
                    <span style="margin-right: 4px;">{{status}}</span>
                */}, {
                    status: response.indexOf("true") > -1 ? "Device ready" : "Device may require formatting"
                }));

                if (response.indexOf("true") > -1) {
                    
                    self.setstatus({
                        ui: ".mem-status",
                        font: "fa-check",
                        color: "green",
                        message: "OK"
                    });
                }
                else  {
                    
                    self.setstatus({
                        ui: ".mem-status",
                        font: "fa-triangle-exclamation",
                        color: "crimson",
                        message: "Error"
                    });
                }
            }

            else if (!$(".pre-survey-tests-results-parent").hasClass("hidden")) {
                $(".pre-survey-tests-results-parent .mem-test .test-result").text(response.indexOf("true") > -1 ? "✅ Working." : "⛔ Communication error.");
            }
        }

        if (response.startsWith("sd:")) {
            response = response.replace(/sd:/g, "");

            var success = response.split(":..:")[0].indexOf("true") > -1;
            var payload = response.split(":..:")[1].indexOf("not-detected") > -1 ? "-" : response.split(":..:")[1];

            self.panel.find(".sd-text").html(multiline(function () {/* 
                <span style="margin-right: 4px;">{{status}}</span>
            */}, {
                status: response.indexOf("true") > -1 ? "Device ready" : "Not detected"
            }));

            if (response.indexOf("true") > -1) {
                
                self.panel.find(".sd-data").html(multiline(function () {/* 
                    <span style="margin-right: 4px;">{{card-size}}</span>
                */}, {
                    "card-size": payload
                }));
                
                self.setstatus({
                    ui: ".sd-status",
                    font: "fa-check",
                    color: "green",
                    message: "OK"
                });
            }
            else  {
                
                self.setstatus({
                    ui: ".sd-status",
                    font: "fa-triangle-exclamation",
                    color: "crimson",
                    message: "Error"
                });
            }
        }

        if (response.startsWith("bl:")) {
            response = response.replace(/bl:/g, "");

            var success = response.split(":..:")[0].indexOf("true") > -1;
            var payload = response.split(":..:")[1].indexOf("not-detected") > -1 ? "-" : response.split(":..:")[1];

            self.panel.find(".bl-text").html(multiline(function () {/* 
                <span style="margin-right: 4px;">{{status}}</span>
            */}, {
                status: response.indexOf("true") > -1 ? "Device ready" : "Not detected"
            }));

            if (success) {
                
                self.panel.find(".bl-data").html(multiline(function () {/* 
                    <span style="margin-right: 4px;">{{name}}</span>
                */}, {
                    name: payload
                }));
                
                self.setstatus({
                    ui: ".bl-status",
                    font: "fa-check",
                    color: "green",
                    message: "OK"
                });
            }
            else  {
                
                self.setstatus({
                    ui: ".bl-status",
                    font: "fa-triangle-exclamation",
                    color: "crimson",
                    message: "Error"
                });
            }
        }

        if (response.startsWith("fram:")) {
            response = response.replace(/fram:/g, "");

            self.panel.find(".fram-text").html(multiline(function () {/* 
                <span style="margin-right: 4px;">{{status}}</span>
            */}, {
                status: response.indexOf("true") > -1 ? "Device ready" : "Not detected"
            }));

            if (response.indexOf("true") > -1) {
                
                self.setstatus({
                    ui: ".fram-status",
                    font: "fa-check",
                    color: "green",
                    message: "OK"
                });
            }
            else  {
                
                self.setstatus({
                    ui: ".fram-status",
                    font: "fa-triangle-exclamation",
                    color: "crimson",
                    message: "Error"
                });
            }
        }
        
        if (response.startsWith("gps:")) {
            response = response.replace(/gps:/g, "");

            console.log(response);

            var success = response.split(":..:")[0].indexOf("true") > -1;
            var payload = response.split(":..:")[1].indexOf("not-detected") > -1 ? "-" : response.split(":..:")[1];

            self.panel.find(".gps-text").html(multiline(function () {/* 
                <span style="margin-right: 4px;">{{status}}</span>
            */}, {
                status: response.indexOf("true") > -1 ? "Device ready" : "Not detected"
            }));

            if (success) {
                
                self.panel.find(".gps-data").html(multiline(function () {/* 
                    <span style="margin-right: 4px;">{{manufacturer}}</span>
                */}, {
                    manufacturer: payload
                }));
                
                self.setstatus({
                    ui: ".gps-status",
                    font: "fa-check",
                    color: "green",
                    message: "OK"
                });
            }
            else  {
                
                self.setstatus({
                    ui: ".gps-status",
                    font: "fa-triangle-exclamation",
                    color: "crimson",
                    message: "Error"
                });
            }
        }
        
        if (response.startsWith("sntl:")) {
            response = response.replace(/sntl:/g, "");
            
            var success = response.split(":..:")[0].indexOf("true") > -1;
            var payload = response.split(":..:")[1].indexOf("not-detected") > -1 ? "-" : response.split(":..:")[1];

            self.panel.find(".sntl-text").html(multiline(function () {/* 
                <span style="margin-right: 4px;">{{status}}</span>
            */}, {
                status: success ? "Device ready" : "Not detected"
            }));

            if (success) {

                self.panel.find(".sntl-data").html(multiline(function () {/* 
                    <span style="margin-right: 4px;">v{{firmware}}</span>
                */}, {
                    firmware: payload
                }));
                
                self.setstatus({
                    ui: ".sntl-status",
                    font: "fa-check",
                    color: "green",
                    message: "OK"
                });
            }
            else  {
                
                self.setstatus({
                    ui: ".sntl-status",
                    font: "fa-triangle-exclamation",
                    color: "crimson",
                    message: "Error"
                });
            }
        }
        
        if (response.startsWith("aht:")) {
            response = response.replace(/aht:/g, "");

            var success = response.split(":..:")[0].indexOf("true") > -1;
            var payload = response.split(":..:")[1].indexOf("not-detected") > -1 ? "-" : response.split(":..:")[1];

            self.panel.find(".aht-text").html(multiline(function () {/* 
                <span style="margin-right: 4px;">{{status}}</span>
            */}, {
                status: success > -1 ? "Device ready" : "Not detected"
            }));

            if (success > -1) {

                self.panel.find(".aht-data").html(multiline(function () {/* 
                    <span style="margin-right: 4px;">{{humidity}} % R.H., {{temperature}} <sup>o</sup>C</span>
                */}, {
                    humidity: payload.split(":.:")[1] == 255 ? "-" : payload.split(":.:")[1],
                    temperature: payload.split(":.:")[0]
                }));
                
                self.setstatus({
                    ui: ".aht-status",
                    font: "fa-check",
                    color: "green",
                    message: "OK"
                });
            }
            else  {
                
                self.setstatus({
                    ui: ".aht-status",
                    font: "fa-triangle-exclamation",
                    color: "crimson",
                    message: "Error"
                });
            }
        }
        
        if (response.startsWith("eadc:")) {

            response = response.replace(/eadc:/g, "");
            
            var success = response.split(":..:")[0].indexOf("true") > -1;
            var payload = response.split(":..:")[1].indexOf("not-detected") > -1 ? "-" : response.split(":..:")[1];

            self.panel.find(".eadc-text").html(multiline(function () {/* 
                <span style="margin-right: 4px;">{{status}}</span>
            */}, {
                status: success ? "Device ready" : "Not detected"
            }));

            if (success) {
                
                self.panel.find(".eadc-data").html(multiline(function () {/* 
                    <span style="margin-right: 4px;">{{channel0}}, {{channel1}}, {{channel2}}, {{channel3}}</span>
                */}, {
                    "channel0": payload.split(":.:")[0],
                    "channel1": payload.split(":.:")[1],
                    "channel2": payload.split(":.:")[2],
                    "channel3": payload.split(":.:")[3]
                }));

                self.setstatus({
                    ui: ".eadc-status",
                    font: "fa-check",
                    color: "green",
                    message: "OK"
                });
            }
            else  {
                
                self.setstatus({
                    ui: ".eadc-status",
                    font: "fa-triangle-exclamation",
                    color: "crimson",
                    message: "Error"
                });
            }
        }
        
        if (response.startsWith("relay:")) {
            response = response.replace(/relay:/g, "");

            var success = response.split(":..:")[0].indexOf("true") > -1;

            self.panel.find(".relay-text").html(multiline(function () {/* 
                <span style="margin-right: 4px;">{{status}}</span>
            */}, {
                status: success > -1 ? "Device triggered" : "Not detected"
            }));

            if (success > -1) {

                self.setstatus({
                    ui: ".relay-status",
                    font: "fa-check",
                    color: "green",
                    message: "OK"
                });
            }
            else  {
                
                self.setstatus({
                    ui: ".relay-status",
                    font: "fa-triangle-exclamation",
                    color: "crimson",
                    message: "Error"
                });
            }
        }
        
        if (response.startsWith("uss:")) {

            response = response.replace(/uss:/g, "");

            var success = response.split(":..:")[0].indexOf("true") > -1;
            var payload = response.split(":..:")[1].indexOf("not-detected") > -1 ? "-" : response.split(":..:")[1];

            self.panel.find(".uss-text").html(multiline(function () {/* 
                <span style="margin-right: 4px;">{{status}}</span>
            */}, {
                status: success ? "Device ready" : "Not detected"
            }));

            if (success) {
                
                self.panel.find(".uss-data").html(multiline(function () {/* 
                    <span style="margin-right: 4px;">{{distance}}</span>
                */}, {
                    "distance": payload.split(":.:")[0],
                }));

                self.setstatus({
                    ui: ".uss-status",
                    font: "fa-check",
                    color: "green",
                    message: "OK"
                });
            }
            else  {
                
                self.setstatus({
                    ui: ".uss-status",
                    font: "fa-triangle-exclamation",
                    color: "crimson",
                    message: "Error"
                });
            }
        }
        
        if (response.startsWith("rgb:")) {

            response = response.replace(/rgb:/g, "");

            console.log(response);
            
            var success = response.split(":..:")[0].indexOf("true") > -1;
            var payload = response.split(":..:")[1].indexOf("not-detected") > -1 ? "-" : response.split(":..:")[1];

            self.panel.find(".rgb-text").html(multiline(function () {/* 
                <span style="margin-right: 4px;">{{status}}</span>
            */}, {
                status: success ? "Device ready" : "Not detected"
            }));

            if (success) {
                
                self.setstatus({
                    ui: ".rgb-status",
                    font: "fa-check",
                    color: "green",
                    message: "OK"
                });
            }
            else  {
                
                self.setstatus({
                    ui: ".rgb-status",
                    font: "fa-triangle-exclamation",
                    color: "crimson",
                    message: "Error"
                });
            }
        }
        
        if (response.startsWith("buzzer:")) {

            response = response.replace(/buzzer:/g, "");

            console.log(response);
            
            var success = response.split(":..:")[0].indexOf("true") > -1;
            var payload = response.split(":..:")[1].indexOf("not-detected") > -1 ? "-" : response.split(":..:")[1];

            self.panel.find(".buzzer-text").html(multiline(function () {/* 
                <span style="margin-right: 4px;">{{status}}</span>
            */}, {
                status: success ? "Device ready" : "Not detected"
            }));

            if (success) {
                
                self.panel.find(".buzzer-data").html(multiline(function () {/* 
                    <span style="margin-right: 4px;">{{distance}}</span>
                */}, {
                    "distance": payload.split(":.:")[0],
                }));

                self.setstatus({
                    ui: ".buzzer-status",
                    font: "fa-check",
                    color: "green",
                    message: "OK"
                });
            }
            else  {
                
                self.setstatus({
                    ui: ".buzzer-status",
                    font: "fa-triangle-exclamation",
                    color: "crimson",
                    message: "Error"
                });
            }
        }
        
        if (response.startsWith("ph:")) {

            response = response.replace(/ph:/g, "");
            
            var success = response.split(":..:")[0].indexOf("true") > -1;
            var payload = response.split(":..:")[1].indexOf("not-detected") > -1 ? "-" : response.split(":..:")[1];

            self.panel.find(".ph-text").html(multiline(function () {/* 
                <span style="margin-right: 4px;">{{status}}</span>
            */}, {
                status: success ? "Device ready" : "Not detected"
            }));

            if (success) {
                
                self.panel.find(".ph-data").html(multiline(function () {/* 
                    <span style="margin-right: 4px;">{{distance}}</span>
                */}, {
                    "distance": payload.split(":.:")[0],
                }));

                self.setstatus({
                    ui: ".ph-status",
                    font: "fa-check",
                    color: "green",
                    message: "OK"
                });
            }
            else  {
                
                self.setstatus({
                    ui: ".ph-status",
                    font: "fa-triangle-exclamation",
                    color: "crimson",
                    message: "Error"
                });
            }
        }
        
        if (response.startsWith("ec:")) {

            response = response.replace(/ec:/g, "");
            
            var success = response.split(":..:")[0].indexOf("true") > -1;
            var payload = response.split(":..:")[1].indexOf("not-detected") > -1 ? "-" : response.split(":..:")[1];

            self.panel.find(".ec-text").html(multiline(function () {/* 
                <span style="margin-right: 4px;">{{status}}</span>
            */}, {
                status: success ? "Device ready" : "Not detected"
            }));

            if (success) {
                
                self.panel.find(".ec-data").html(multiline(function () {/* 
                    <span style="margin-right: 4px;">{{distance}}</span>
                */}, {
                    "distance": payload.split(":.:")[0],
                }));

                self.setstatus({
                    ui: ".ec-status",
                    font: "fa-check",
                    color: "green",
                    message: "OK"
                });
            }
            else  {
                
                self.setstatus({
                    ui: ".ec-status",
                    font: "fa-triangle-exclamation",
                    color: "crimson",
                    message: "Error"
                });
            }
        }
        
        if (response.startsWith("dox:")) {

            response = response.replace(/dox:/g, "");
            
            var success = response.split(":..:")[0].indexOf("true") > -1;
            var payload = response.split(":..:")[1].indexOf("not-detected") > -1 ? "-" : response.split(":..:")[1];

            self.panel.find(".dox-text").html(multiline(function () {/* 
                <span style="margin-right: 4px;">{{status}}</span>
            */}, {
                status: success ? "Device ready" : "Not detected"
            }));

            if (success) {
                
                self.panel.find(".dox-data").html(multiline(function () {/* 
                    <span style="margin-right: 4px;">{{distance}}</span>
                */}, {
                    "distance": payload.split(":.:")[0],
                }));

                self.setstatus({
                    ui: ".dox-status",
                    font: "fa-check",
                    color: "green",
                    message: "OK"
                });
            }
            else  {
                
                self.setstatus({
                    ui: ".dox-status",
                    font: "fa-triangle-exclamation",
                    color: "crimson",
                    message: "Error"
                });
            }
        }
        
        if (response.startsWith("rtd:")) {

            response = response.replace(/rtd:/g, "");
            
            var success = response.split(":..:")[0].indexOf("true") > -1;
            var payload = response.split(":..:")[1].indexOf("not-detected") > -1 ? "-" : response.split(":..:")[1];

            self.panel.find(".rtd-text").html(multiline(function () {/* 
                <span style="margin-right: 4px;">{{status}}</span>
            */}, {
                status: success ? "Device ready" : "Not detected"
            }));

            if (success) {
                
                self.panel.find(".rtd-data").html(multiline(function () {/* 
                    <span style="margin-right: 4px;">{{distance}}</span>
                */}, {
                    "distance": payload.split(":.:")[0],
                }));

                self.setstatus({
                    ui: ".rtd-status",
                    font: "fa-check",
                    color: "green",
                    message: "OK"
                });
            }
            else  {
                
                self.setstatus({
                    ui: ".rtd-status",
                    font: "fa-triangle-exclamation",
                    color: "crimson",
                    message: "Error"
                });
            }
        }

        if (response.startsWith("lipo:")) {

            response = response.replace(/lipo:/g, "");

            var success = response.split(":..:")[0].indexOf("true") > -1;
            var payload = response.split(":..:")[1].indexOf("not-detected") > -1 ? "-" : response.split(":..:")[1];
            
            self.panel.find(".lipo-text").html(multiline(function () {/* 
                <span style="margin-right: 4px;">{{status}}</span>
            */}, {
                status: success ? "Device ready" : "Not detected"
            }));
            
            self.panel.find(".lipo-data").html(multiline(function () {/* 
                <span style="margin-right: 4px;">{{voltage}}</span>
            */}, {
                voltage: success ? payload + " V" : "-"
            }));

            if (success) {
                
                self.setstatus({
                    ui: ".lipo-status",
                    font: "fa-check",
                    color: "green",
                    message: "OK"
                });
            }
            else  {
                
                self.setstatus({
                    ui: ".lipo-status",
                    font: "fa-triangle-exclamation",
                    color: "crimson",
                    message: "Error"
                });
            }
        }

        /*! Communication peripheral */

        // Is the data fresh?
        var fresh = true;
        var key = response.split("=")[0];
        var value = response.split("=")[1];
        var parent = self.panel.find(".communication-diagnostics-sub-panel");

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

            // Enable communication diagnostics refresh button
            self.panel.find(".communication-diagnostics-sub-panel .refresh-button").removeClass("disabled");
        }
    }

    self.setstatus = function (args) {

        self.panel.find(args.ui).html(multiline(function () {/* 
            <div style="display: inline-flex;color: white;background: white;border-radius: 2px;padding: 0 3px;">
                <i class="fa-solid {{icon.font}}" style="color: {{icon.color}}; font-size: 13px; margin: 4px 4px 4px 4px;"></i>
                <div style="color: #222; margin: 0 6px 0 4px; font-size: 13px; ">{{message}}</div>
            </div>
        */}, {
            icon: {
                font: args.font,
                color: args.color
            },
            message: args.message
        }));
    }

    self.initui = function () {
        self.panel.find(".diagnostics-sub-panels-list").html(multiline(function() {/* 
            
            <!--! SD -->
            <div class="col-12 diagnostics-sub-panel-item shadow-medium hidden" type="sd" style="margin-bottom: 12px;margin-right: 12px;background: #383838b8;padding: 5px 10px;">
                <p style="margin-top: 2px; color: #b8e274; font-size: 12px; text-align: justify; margin-bottom: 4px;">Micro SD storage</p>
                
                <!-- SD -->
                <div class="row" style="margin: 0px;">
                    <div class="col-auto" style="padding: 3px 6px;margin: 0 6px 6px 0;border: 1px solid #4a4a4a;background: #4a4a4a;">
                        <p style="color: #d0a190; font-size: 12px; text-align: justify; margin-bottom: 0px;">Status</p>
                        <p class="sd-text" style="color: #bbbbbb; font-size: 13px; text-align: justify; margin-bottom: 0px;">-</p>
                    </div>
                    
                    <div class="col-auto" style="padding: 3px 6px;margin: 0 6px 6px 0;border: 1px solid #4a4a4a;background: #4a4a4a;">
                        <p style="color: #d0a190; font-size: 12px; text-align: justify; margin-bottom: 0px;">Card size</p>
                        <p class="sd-data" style="color: #bbbbbb; font-size: 13px; text-align: justify; margin-bottom: 0px;">-</p>
                    </div>
                </div>
                    
                <!-- Status -->
                <div class="row" style="margin: 0px;">
                    
                    <div class="col-auto sd-status"  style="padding: 3px 6px;margin: 0 -5px;">
                        <div style="display: inline-flex;color: white;background: white;border-radius: 2px;padding: 0 3px;">
                            <i class="fa-solid fa-vial" style="color: #716f6e; font-size: 13px; margin: 4px 4px 4px 4px;"></i>
                            <div style="color: #222; margin: 0 6px 0 4px; font-size: 13px;">Unknown</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!--! FRAM -->
            <div class="col-12 diagnostics-sub-panel-item shadow-medium hidden" type="fram" style="margin-bottom: 12px;margin-right: 12px;background: #383838b8;padding: 5px 10px;">
                <p style="margin-top: 2px; color: #b8e274; font-size: 12px; text-align: justify; margin-bottom: 4px;">Flash storage</p>
                
                <div class="row" style="margin: 0px;">
                    <div class="col-auto" style="padding: 3px 6px;margin: 0 6px 6px 0;border: 1px solid #4a4a4a;background: #4a4a4a;">
                        <p style="color: #d0a190; font-size: 12px; text-align: justify; margin-bottom: 0px;">Status</p>
                        <p class="fram-text" style="color: #bbbbbb; font-size: 13px; text-align: justify; margin-bottom: 0px;">-</p>
                    </div>

                </div>
                    
                <!-- Status -->
                <div class="row" style="margin: 0px;">
                    
                    <div class="col-auto fram-status"  style="padding: 3px 6px;margin: 0 -5px;">
                        <div style="display: inline-flex;color: white;background: white;border-radius: 2px;padding: 0 3px;">
                            <i class="fa-solid fa-vial" style="color: #716f6e; font-size: 13px; margin: 4px 4px 4px 4px;"></i>
                            <div style="color: #222; margin: 0 6px 0 4px; font-size: 13px;">Unknown</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!--! RTC -->
            <div class="col-12 diagnostics-sub-panel-item shadow-medium hidden" type="rtc" style="margin-bottom: 12px;margin-right: 12px;background: #383838b8;padding: 5px 10px;">
                <p style="margin-top: 2px; color: #b8e274; font-size: 12px; text-align: justify; margin-bottom: 4px;">Realtime clock</p>
                    
                <!-- UTC time -->
                <div class="row" style="margin: 0px;">
                    
                    <div class="col-auto" style="padding: 3px 6px;margin: 0 6px 6px 0;border: 1px solid #4a4a4a;background: #4a4a4a;">
                        <p style="color: #d0a190; font-size: 12px; text-align: justify; margin-bottom: 0px;">Status</p>
                        <p class="rtc-text" style="color: #bbbbbb; font-size: 13px; text-align: justify; margin-bottom: 0px;">-</p>
                    </div>

                    <div class="col-auto" style="padding: 3px 6px;margin: 0 6px 6px 0;border: 1px solid #4a4a4a;background: #4a4a4a;">
                        <p style="color: #d0a190; font-size: 12px; text-align: justify; margin-bottom: 0px;">GatorByte time</p>
                        <p class="gatorbyte-rtc-time-text" style="color: #bbbbbb; font-size: 13px; text-align: justify; margin-bottom: 0px;">-</p>
                    </div>
                </div>
                    
                <!-- Status -->
                <div class="row" style="margin: 0px;">
                    
                    <div class="col-auto rtc-status"  style="padding: 3px 6px;margin: 0 -5px;">
                        <div style="display: inline-flex;color: white;background: white;border-radius: 2px;padding: 0 3px;">
                            <i class="fa-solid fa-vial" style="color: #716f6e; font-size: 13px; margin: 4px 4px 4px 4px;"></i>
                            <div style="color: #222; margin: 0 6px 0 4px; font-size: 13px;">Unknown</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!--! EEPROM -->
            <div class="col-12 diagnostics-sub-panel-item shadow-medium hidden" type="mem" style="margin-bottom: 12px;margin-right: 12px;background: #383838b8;padding: 5px 10px;">
                <p style="margin-top: 2px; color: #b8e274; font-size: 12px; text-align: justify; margin-bottom: 4px;">AT24C EEPROM memory</p>
                
                <!-- AT24C -->
                <div class="row" style="margin: 0px;">
                    <div class="col-auto" style="padding: 3px 6px;margin: 0 6px 6px 0;border: 1px solid #4a4a4a;background: #4a4a4a;">
                        <p style="color: #d0a190; font-size: 12px; text-align: justify; margin-bottom: 0px;">Status</p>
                        <p class="mem-text" style="color: #bbbbbb; font-size: 13px; text-align: justify; margin-bottom: 0px;">-</p>
                    </div>

                </div>
                    
                <!-- Status -->
                <div class="row" style="margin: 0px;">
                    
                    <div class="col-auto mem-status"  style="padding: 3px 6px;margin: 0 -5px;">
                        <div style="display: inline-flex;color: white;background: white;border-radius: 2px;padding: 0 3px;">
                            <i class="fa-solid fa-vial" style="color: #716f6e; font-size: 13px; margin: 4px 4px 4px 4px;"></i>
                            <div style="color: #222; margin: 0 6px 0 4px; font-size: 13px;">Unknown</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!--! AHT -->
            <div class="col-12 diagnostics-sub-panel-item shadow-medium hidden" type="aht" style="margin-bottom: 12px;margin-right: 12px;background: #383838b8;padding: 5px 10px;">
                <p style="margin-top: 2px; color: #b8e274; font-size: 12px; text-align: justify; margin-bottom: 4px;">AHT</p>
                
                <div class="row" style="margin: 0px;">
                    <div class="col-auto" style="padding: 3px 6px;margin: 0 6px 6px 0;border: 1px solid #4a4a4a;background: #4a4a4a;">
                        <p style="color: #d0a190; font-size: 12px; text-align: justify; margin-bottom: 0px;">Status</p>
                        <p class="aht-text" style="color: #bbbbbb; font-size: 13px; text-align: justify; margin-bottom: 0px;">-</p>
                    </div>
                    
                    <div class="col-auto" style="padding: 3px 6px;margin: 0 6px 6px 0;border: 1px solid #4a4a4a;background: #4a4a4a;">
                        <p style="color: #d0a190; font-size: 12px; text-align: justify; margin-bottom: 0px;">Humidity and temperature</p>
                        <p class="aht-data" style="color: #bbbbbb; font-size: 13px; text-align: justify; margin-bottom: 0px;">-</p>
                    </div>
                </div>
                    
                <!-- Status -->
                <div class="row" style="margin: 0px;">
                    
                    <div class="col-auto aht-status"  style="padding: 3px 6px;margin: 0 -5px;">
                        <div style="display: inline-flex;color: white;background: white;border-radius: 2px;padding: 0 3px;">
                            <i class="fa-solid fa-vial" style="color: #716f6e; font-size: 13px; margin: 4px 4px 4px 4px;"></i>
                            <div style="color: #222; margin: 0 6px 0 4px; font-size: 13px;">Unknown</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!--! Sentinel -->
            <div class="col-12 diagnostics-sub-panel-item shadow-medium hidden" type="sntl" style="margin-bottom: 12px;margin-right: 12px;background: #383838b8;padding: 5px 10px;">
                <p style="margin-top: 2px; color: #b8e274; font-size: 12px; text-align: justify; margin-bottom: 4px;">Sentinel</p>
                
                <!-- Sentinel -->
                <div class="row" style="margin: 0px;">
                    <div class="col-auto" style="padding: 3px 6px;margin: 0 6px 6px 0;border: 1px solid #4a4a4a;background: #4a4a4a;">
                        <p style="color: #d0a190; font-size: 12px; text-align: justify; margin-bottom: 0px;">Status</p>
                        <p class="sntl-text" style="color: #bbbbbb; font-size: 13px; text-align: justify; margin-bottom: 0px;">-</p>
                    </div>
                    
                    <div class="col-auto" style="padding: 3px 6px;margin: 0 6px 6px 0;border: 1px solid #4a4a4a;background: #4a4a4a;">
                        <p style="color: #d0a190; font-size: 12px; text-align: justify; margin-bottom: 0px;">F/W version</p>
                        <p class="sntl-data" style="color: #bbbbbb; font-size: 13px; text-align: justify; margin-bottom: 0px;">-</p>
                    </div>
                </div>
                    
                <!-- Status -->
                <div class="row" style="margin: 0px;">
                    
                    <div class="col-auto sntl-status"  style="padding: 3px 6px;margin: 0 -5px;">
                        <div style="display: inline-flex;color: white;background: white;border-radius: 2px;padding: 0 3px;">
                            <i class="fa-solid fa-vial" style="color: #716f6e; font-size: 13px; margin: 4px 4px 4px 4px;"></i>
                            <div style="color: #222; margin: 0 6px 0 4px; font-size: 13px;">Unknown</div>
                        </div>
                    </div>
                </div>
            </div>

            <!--! GPS -->
            <div class="col-12 diagnostics-sub-panel-item shadow-medium hidden" type="gps" style="margin-bottom: 12px;margin-right: 12px;background: #383838b8;padding: 5px 10px;">
                <p style="margin-top: 2px; color: #b8e274; font-size: 12px; text-align: justify; margin-bottom: 4px;">Neo-6M GPS module</p>
                
                <!-- Neo-6M -->
                <div class="row" style="margin: 0px;">
                    <div class="col-auto" style="padding: 3px 6px;margin: 0 6px 6px 0;border: 1px solid #4a4a4a;background: #4a4a4a;">
                        <p style="color: #d0a190; font-size: 12px; text-align: justify; margin-bottom: 0px;">Status</p>
                        <p class="gps-text" style="color: #bbbbbb; font-size: 13px; text-align: justify; margin-bottom: 0px;">-</p>
                    </div>

                    <div class="col-auto" style="padding: 3px 6px;margin: 0 6px 6px 0;border: 1px solid #4a4a4a;background: #4a4a4a;">
                        <p style="color: #d0a190; font-size: 12px; text-align: justify; margin-bottom: 0px;">Manufacturer</p>
                        <p class="gps-data" style="color: #bbbbbb; font-size: 13px; text-align: justify; margin-bottom: 0px;">-</p>
                    </div>
                </div>
                    
                <!-- Status -->
                <div class="row" style="margin: 0px;">
                    
                    <div class="col-auto gps-status"  style="padding: 3px 6px;margin: 0 -5px;">
                        <div style="display: inline-flex;color: white;background: white;border-radius: 2px;padding: 0 3px;">
                            <i class="fa-solid fa-vial" style="color: #716f6e; font-size: 13px; margin: 4px 4px 4px 4px;"></i>
                            <div style="color: #222; margin: 0 6px 0 4px; font-size: 13px;">Unknown</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!--! BL -->
            <div class="col-12 diagnostics-sub-panel-item shadow-medium hidden" type="bl" style="margin-bottom: 12px;margin-right: 12px;background: #383838b8;padding: 5px 10px;">
                <p style="margin-top: 2px; color: #b8e274; font-size: 12px; text-align: justify; margin-bottom: 4px;">Bluetooth module</p>
                
                <!-- Neo-6M -->
                <div class="row" style="margin: 0px;">
                    <div class="col-auto" style="padding: 3px 6px;margin: 0 6px 6px 0;border: 1px solid #4a4a4a;background: #4a4a4a;">
                        <p style="color: #d0a190; font-size: 12px; text-align: justify; margin-bottom: 0px;">Status</p>
                        <p class="bl-text" style="color: #bbbbbb; font-size: 13px; text-align: justify; margin-bottom: 0px;">-</p>
                    </div>

                    <div class="col-auto" style="padding: 3px 6px;margin: 0 6px 6px 0;border: 1px solid #4a4a4a;background: #4a4a4a;">
                        <p style="color: #d0a190; font-size: 12px; text-align: justify; margin-bottom: 0px;">BT name</p>
                        <p class="bl-data" style="color: #bbbbbb; font-size: 13px; text-align: justify; margin-bottom: 0px;">-</p>
                    </div>
                </div>
                    
                <!-- Status -->
                <div class="row" style="margin: 0px;">
                    
                    <div class="col-auto bl-status"  style="padding: 3px 6px;margin: 0 -5px;">
                        <div style="display: inline-flex;color: white;background: white;border-radius: 2px;padding: 0 3px;">
                            <i class="fa-solid fa-vial" style="color: #716f6e; font-size: 13px; margin: 4px 4px 4px 4px;"></i>
                            <div style="color: #222; margin: 0 6px 0 4px; font-size: 13px;">Unknown</div>
                        </div>
                    </div>
                </div>
            </div>

            <!--! EADC -->
            <div class="col-12 diagnostics-sub-panel-item shadow-medium hidden" type="eadc" style="margin-bottom: 12px;margin-right: 12px;background: #383838b8;padding: 5px 10px;">
                <p style="margin-top: 2px; color: #b8e274; font-size: 12px; text-align: justify; margin-bottom: 4px;">ADS1115 external ADC</p>
                
                <div class="row" style="margin: 0px;">
                    <div class="col-auto" style="padding: 3px 6px;margin: 0 6px 6px 0;border: 1px solid #4a4a4a;background: #4a4a4a;">
                        <p style="color: #d0a190; font-size: 12px; text-align: justify; margin-bottom: 0px;">Status</p>
                        <p class="eadc-text" style="color: #bbbbbb; font-size: 13px; text-align: justify; margin-bottom: 0px;">-</p>
                    </div>
                    
                    <div class="col-auto" style="padding: 3px 6px;margin: 0 6px 6px 0;border: 1px solid #4a4a4a;background: #4a4a4a;">
                        <p style="color: #d0a190; font-size: 12px; text-align: justify; margin-bottom: 0px;">Channel readings</p>
                        <p class="eadc-data" style="color: #bbbbbb; font-size: 13px; text-align: justify; margin-bottom: 0px;">-</p>
                    </div>
                </div>
                    
                <!-- Status -->
                <div class="row" style="margin: 0px;">
                    
                    <div class="col-auto eadc-on hidden"  style="padding: 3px 6px;margin: 0 -5px;">
                        <div style="display: inline-flex;color: white;background: white;border-radius: 2px;padding: 0 3px;">
                            <i class="fa-solid fa-toggle-on" style="color: #716f6e; font-size: 13px; margin: 4px 4px 4px 4px;"></i>
                            <div style="color: #222; margin: 0 6px 0 4px; font-size: 13px;">On</div>
                        </div>
                    </div>
                    
                    <div class="col-auto eadc-off hidden"  style="padding: 3px 6px;margin: 0 -5px;">
                        <div style="display: inline-flex;color: white;background: white;border-radius: 2px;padding: 0 3px;">
                            <i class="fa-solid fa-toggle-off" style="color: #716f6e; font-size: 13px; margin: 4px 4px 4px 4px;"></i>
                            <div style="color: #222; margin: 0 6px 0 4px; font-size: 13px;">Off</div>
                        </div>
                    </div>
                    
                    <div class="col-auto eadc-status"  style="padding: 3px 6px;margin: 0 -5px;">
                        <div style="display: inline-flex;color: white;background: white;border-radius: 2px;padding: 0 3px;">
                            <i class="fa-solid fa-vial" style="color: #716f6e; font-size: 13px; margin: 4px 4px 4px 4px;"></i>
                            <div style="color: #222; margin: 0 6px 0 4px; font-size: 13px;">Unknown</div>
                        </div>
                    </div>
                </div>
            </div>

            <!--! Relay -->
            <div class="col-12 diagnostics-sub-panel-item shadow-medium hidden" type="relay" style="margin-bottom: 12px;margin-right: 12px;background: #383838b8;padding: 5px 10px;">
                <p style="margin-top: 2px; color: #b8e274; font-size: 12px; text-align: justify; margin-bottom: 4px;">Relay</p>
                
                <div class="row" style="margin: 0px;">
                    <div class="col-auto" style="padding: 3px 6px;margin: 0 6px 6px 0;border: 1px solid #4a4a4a;background: #4a4a4a;">
                        <p style="color: #d0a190; font-size: 12px; text-align: justify; margin-bottom: 0px;">Status</p>
                        <p class="relay-text" style="color: #bbbbbb; font-size: 13px; text-align: justify; margin-bottom: 0px;">-</p>
                    </div>
                </div>
                    
                <!-- Status -->
                <div class="row" style="margin: 0px;">
                    
                    <div class="col-auto relay-status"  style="padding: 3px 6px;margin: 0 -5px;">
                        <div style="display: inline-flex;color: white;background: white;border-radius: 2px;padding: 0 3px;">
                            <i class="fa-solid fa-vial" style="color: #716f6e; font-size: 13px; margin: 4px 4px 4px 4px;"></i>
                            <div style="color: #222; margin: 0 6px 0 4px; font-size: 13px;">Unknown</div>
                        </div>
                    </div>
                </div>
            </div>

            <!--! pH -->
            <div class="col-12 diagnostics-sub-panel-item shadow-medium hidden" type="ph" style="margin-bottom: 12px;margin-right: 12px;background: #383838b8;padding: 5px 10px;">
                <p style="margin-top: 2px; color: #b8e274; font-size: 12px; text-align: justify; margin-bottom: 4px;">pH sensor</p>
                
                <div class="row" style="margin: 0px;">
                    <div class="col-auto" style="padding: 3px 6px;margin: 0 6px 6px 0;border: 1px solid #4a4a4a;background: #4a4a4a;">
                        <p style="color: #d0a190; font-size: 12px; text-align: justify; margin-bottom: 0px;">Status</p>
                        <p class="ph-text" style="color: #bbbbbb; font-size: 13px; text-align: justify; margin-bottom: 0px;">-</p>
                    </div>
                    
                    <div class="col-auto" style="padding: 3px 6px;margin: 0 6px 6px 0;border: 1px solid #4a4a4a;background: #4a4a4a;">
                        <p style="color: #d0a190; font-size: 12px; text-align: justify; margin-bottom: 0px;">Device info</p>
                        <p class="ph-data" style="color: #bbbbbb; font-size: 13px; text-align: justify; margin-bottom: 0px;">-</p>
                    </div>
                </div>
                    
                <!-- Status -->
                <div class="row" style="margin: 0px;">
                    
                    <div class="col-auto ph-status"  style="padding: 3px 6px;margin: 0 -5px;">
                        <div style="display: inline-flex;color: white;background: white;border-radius: 2px;padding: 0 3px;">
                            <i class="fa-solid fa-vial" style="color: #716f6e; font-size: 13px; margin: 4px 4px 4px 4px;"></i>
                            <div style="color: #222; margin: 0 6px 0 4px; font-size: 13px;">Unknown</div>
                        </div>
                    </div>
                </div>
            </div>

            <!--! EC -->
            <div class="col-12 diagnostics-sub-panel-item shadow-medium hidden" type="ec" style="margin-bottom: 12px;margin-right: 12px;background: #383838b8;padding: 5px 10px;">
                <p style="margin-top: 2px; color: #b8e274; font-size: 12px; text-align: justify; margin-bottom: 4px;">EC sensor</p>
                
                <div class="row" style="margin: 0px;">
                    <div class="col-auto" style="padding: 3px 6px;margin: 0 6px 6px 0;border: 1px solid #4a4a4a;background: #4a4a4a;">
                        <p style="color: #d0a190; font-size: 12px; text-align: justify; margin-bottom: 0px;">Status</p>
                        <p class="ec-text" style="color: #bbbbbb; font-size: 13px; text-align: justify; margin-bottom: 0px;">-</p>
                    </div>
                    
                    <div class="col-auto" style="padding: 3px 6px;margin: 0 6px 6px 0;border: 1px solid #4a4a4a;background: #4a4a4a;">
                        <p style="color: #d0a190; font-size: 12px; text-align: justify; margin-bottom: 0px;">Device info</p>
                        <p class="ec-data" style="color: #bbbbbb; font-size: 13px; text-align: justify; margin-bottom: 0px;">-</p>
                    </div>
                </div>
                    
                <!-- Status -->
                <div class="row" style="margin: 0px;">
                    
                    <div class="col-auto ec-status"  style="padding: 3px 6px;margin: 0 -5px;">
                        <div style="display: inline-flex;color: white;background: white;border-radius: 2px;padding: 0 3px;">
                            <i class="fa-solid fa-vial" style="color: #716f6e; font-size: 13px; margin: 4px 4px 4px 4px;"></i>
                            <div style="color: #222; margin: 0 6px 0 4px; font-size: 13px;">Unknown</div>
                        </div>
                    </div>
                </div>
            </div>

            <!--! DOX -->
            <div class="col-12 diagnostics-sub-panel-item shadow-medium hidden" type="dox" style="margin-bottom: 12px;margin-right: 12px;background: #383838b8;padding: 5px 10px;">
                <p style="margin-top: 2px; color: #b8e274; font-size: 12px; text-align: justify; margin-bottom: 4px;">DO sensor</p>
                
                <div class="row" style="margin: 0px;">
                    <div class="col-auto" style="padding: 3px 6px;margin: 0 6px 6px 0;border: 1px solid #4a4a4a;background: #4a4a4a;">
                        <p style="color: #d0a190; font-size: 12px; text-align: justify; margin-bottom: 0px;">Status</p>
                        <p class="dox-text" style="color: #bbbbbb; font-size: 13px; text-align: justify; margin-bottom: 0px;">-</p>
                    </div>
                    
                    <div class="col-auto" style="padding: 3px 6px;margin: 0 6px 6px 0;border: 1px solid #4a4a4a;background: #4a4a4a;">
                        <p style="color: #d0a190; font-size: 12px; text-align: justify; margin-bottom: 0px;">Device info</p>
                        <p class="dox-data" style="color: #bbbbbb; font-size: 13px; text-align: justify; margin-bottom: 0px;">-</p>
                    </div>
                </div>
                    
                <!-- Status -->
                <div class="row" style="margin: 0px;">
                    
                    <div class="col-auto dox-status"  style="padding: 3px 6px;margin: 0 -5px;">
                        <div style="display: inline-flex;color: white;background: white;border-radius: 2px;padding: 0 3px;">
                            <i class="fa-solid fa-vial" style="color: #716f6e; font-size: 13px; margin: 4px 4px 4px 4px;"></i>
                            <div style="color: #222; margin: 0 6px 0 4px; font-size: 13px;">Unknown</div>
                        </div>
                    </div>
                </div>
            </div>

            <!--! RTD -->
            <div class="col-12 diagnostics-sub-panel-item shadow-medium hidden" type="rtd" style="margin-bottom: 12px;margin-right: 12px;background: #383838b8;padding: 5px 10px;">
                <p style="margin-top: 2px; color: #b8e274; font-size: 12px; text-align: justify; margin-bottom: 4px;">RTD sensor</p>
                
                <div class="row" style="margin: 0px;">
                    <div class="col-auto" style="padding: 3px 6px;margin: 0 6px 6px 0;border: 1px solid #4a4a4a;background: #4a4a4a;">
                        <p style="color: #d0a190; font-size: 12px; text-align: justify; margin-bottom: 0px;">Status</p>
                        <p class="rtd-text" style="color: #bbbbbb; font-size: 13px; text-align: justify; margin-bottom: 0px;">-</p>
                    </div>
                    
                    <div class="col-auto" style="padding: 3px 6px;margin: 0 6px 6px 0;border: 1px solid #4a4a4a;background: #4a4a4a;">
                        <p style="color: #d0a190; font-size: 12px; text-align: justify; margin-bottom: 0px;">Device info</p>
                        <p class="rtd-data" style="color: #bbbbbb; font-size: 13px; text-align: justify; margin-bottom: 0px;">-</p>
                    </div>
                </div>
                    
                <!-- Status -->
                <div class="row" style="margin: 0px;">
                    
                    <div class="col-auto rtd-status"  style="padding: 3px 6px;margin: 0 -5px;">
                        <div style="display: inline-flex;color: white;background: white;border-radius: 2px;padding: 0 3px;">
                            <i class="fa-solid fa-vial" style="color: #716f6e; font-size: 13px; margin: 4px 4px 4px 4px;"></i>
                            <div style="color: #222; margin: 0 6px 0 4px; font-size: 13px;">Unknown</div>
                        </div>
                    </div>
                </div>
            </div>

            
            <!--! USS -->
            <div class="col-12 diagnostics-sub-panel-item shadow-medium hidden" type="uss" style="margin-bottom: 12px;margin-right: 12px;background: #383838b8;padding: 5px 10px;">
                <p style="margin-top: 2px; color: #b8e274; font-size: 12px; text-align: justify; margin-bottom: 4px;">Ultrasound sensor</p>
                
                <div class="row" style="margin: 0px;">
                    <div class="col-auto" style="padding: 3px 6px;margin: 0 6px 6px 0;border: 1px solid #4a4a4a;background: #4a4a4a;">
                        <p style="color: #d0a190; font-size: 12px; text-align: justify; margin-bottom: 0px;">Status</p>
                        <p class="uss-text" style="color: #bbbbbb; font-size: 13px; text-align: justify; margin-bottom: 0px;">-</p>
                    </div>
                    
                    <div class="col-auto" style="padding: 3px 6px;margin: 0 6px 6px 0;border: 1px solid #4a4a4a;background: #4a4a4a;">
                        <p style="color: #d0a190; font-size: 12px; text-align: justify; margin-bottom: 0px;">Distance</p>
                        <p class="uss-data" style="color: #bbbbbb; font-size: 13px; text-align: justify; margin-bottom: 0px;">-</p>
                    </div>
                </div>
                    
                <!-- Status -->
                <div class="row" style="margin: 0px;">
                    
                    <div class="col-auto uss-status"  style="padding: 3px 6px;margin: 0 -5px;">
                        <div style="display: inline-flex;color: white;background: white;border-radius: 2px;padding: 0 3px;">
                            <i class="fa-solid fa-vial" style="color: #716f6e; font-size: 13px; margin: 4px 4px 4px 4px;"></i>
                            <div style="color: #222; margin: 0 6px 0 4px; font-size: 13px;">Unknown</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!--! RGB -->
            <div class="col-12 diagnostics-sub-panel-item shadow-medium hidden" type="rgb" style="margin-bottom: 12px;margin-right: 12px;background: #383838b8;padding: 5px 10px;">
                <p style="margin-top: 2px; color: #b8e274; font-size: 12px; text-align: justify; margin-bottom: 4px;">RGB</p>
                
                <div class="row" style="margin: 0px;">
                    <div class="col-auto" style="padding: 3px 6px;margin: 0 6px 6px 0;border: 1px solid #4a4a4a;background: #4a4a4a;">
                        <p style="color: #d0a190; font-size: 12px; text-align: justify; margin-bottom: 0px;">Status</p>
                        <p class="rgb-text" style="color: #bbbbbb; font-size: 13px; text-align: justify; margin-bottom: 0px;">-</p>
                    </div>
                </div>
                    
                <!-- Status -->
                <div class="row" style="margin: 0px;">
                    
                    <div class="col-auto rgb-status"  style="padding: 3px 6px;margin: 0 -5px;">
                        <div style="display: inline-flex;color: white;background: white;border-radius: 2px;padding: 0 3px;">
                            <i class="fa-solid fa-vial" style="color: #716f6e; font-size: 13px; margin: 4px 4px 4px 4px;"></i>
                            <div style="color: #222; margin: 0 6px 0 4px; font-size: 13px;">Unknown</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!--! Buzzer -->
            <div class="col-12 diagnostics-sub-panel-item shadow-medium hidden" type="buzzer" style="margin-bottom: 12px;margin-right: 12px;background: #383838b8;padding: 5px 10px;">
                <p style="margin-top: 2px; color: #b8e274; font-size: 12px; text-align: justify; margin-bottom: 4px;">Buzzer</p>
                
                <div class="row" style="margin: 0px;">
                    <div class="col-auto" style="padding: 3px 6px;margin: 0 6px 6px 0;border: 1px solid #4a4a4a;background: #4a4a4a;">
                        <p style="color: #d0a190; font-size: 12px; text-align: justify; margin-bottom: 0px;">Status</p>
                        <p class="buzzer-text" style="color: #bbbbbb; font-size: 13px; text-align: justify; margin-bottom: 0px;">-</p>
                    </div>
                </div>
                    
                <!-- Status -->
                <div class="row" style="margin: 0px;">
                    
                    <div class="col-auto buzzer-status"  style="padding: 3px 6px;margin: 0 -5px;">
                        <div style="display: inline-flex;color: white;background: white;border-radius: 2px;padding: 0 3px;">
                            <i class="fa-solid fa-vial" style="color: #716f6e; font-size: 13px; margin: 4px 4px 4px 4px;"></i>
                            <div style="color: #222; margin: 0 6px 0 4px; font-size: 13px;">Unknown</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!--! Battery -->
            <div class="col-12 diagnostics-sub-panel-item shadow-medium hidden" type="lipo" style="margin-bottom: 12px;margin-right: 12px;background: #383838b8;padding: 5px 10px;">
                <p style="margin-top: 2px; color: #b8e274; font-size: 12px; text-align: justify; margin-bottom: 4px;">Li-Po battery</p>
                
                <div class="row" style="margin: 0px;">
                    <div class="col-auto" style="padding: 3px 6px;margin: 0 6px 6px 0;border: 1px solid #4a4a4a;background: #4a4a4a;">
                        <p style="color: #d0a190; font-size: 12px; text-align: justify; margin-bottom: 0px;">Status</p>
                        <p class="lipo-text" style="color: #bbbbbb; font-size: 13px; text-align: justify; margin-bottom: 0px;">-</p>
                    </div>
                    
                    <div class="col-auto" style="padding: 3px 6px;margin: 0 6px 6px 0;border: 1px solid #4a4a4a;background: #4a4a4a;">
                        <p style="color: #d0a190; font-size: 12px; text-align: justify; margin-bottom: 0px;">Info</p>
                        <p class="lipo-data" style="color: #bbbbbb; font-size: 13px; text-align: justify; margin-bottom: 0px;">-</p>
                    </div>
                </div>
                    
                <!-- Status -->
                <div class="row" style="margin: 0px;">
                    
                    <div class="col-auto lipo-status"  style="padding: 3px 6px;margin: 0 -5px;">
                        <div style="display: inline-flex;color: white;background: white;border-radius: 2px;padding: 0 3px;">
                            <i class="fa-solid fa-vial" style="color: #716f6e; font-size: 13px; margin: 4px 4px 4px 4px;"></i>
                            <div style="color: #222; margin: 0 6px 0 4px; font-size: 13px;">Unknown</div>
                        </div>
                    </div>
                </div>
            </div>
        */}));

        // Disable communication diagnostics refresh button
        self.panel.find(".communication-diagnostics-sub-panel .refresh-button").addClass("disabled");

        self.panel.find(".modem-activity-text").text("-");
        self.panel.find(".power-status-text").text("-");
        self.panel.find(".cellular-status-text").text("-");
        self.panel.find(".mqtt-status-text").text("-");
        self.panel.find(".modem-firmware-text").text("-");
        self.panel.find(".modem-imei-text").text("-");
        self.panel.find(".sim-iccid-text").text("-");
        self.panel.find(".cell-operator-text").text("-");
        self.panel.find(".cell-rssi-text").text("-");
    }
}