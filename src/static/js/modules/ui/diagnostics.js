
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

        self.ipcr.send('send-command-request', {
            command: command,
            windowid: global.states.windowid,
            path: global.port.path
        });
    }
    
    self.listeners = function () {

        // Dashboard big button
        $(".home-panel .gb-diagnostics-button").off("click").click(function () {
            $(".diagnostics-gb-panel").removeClass("hidden");
            $(".home-panel").addClass("hidden");

            self.initui();

            self.panel.find(".diagnostics-button-parent").removeClass("hidden");
            self.panel.find(".diagnostics-sub-panels-list").addClass("hidden");
            
            // Get config data
            global.accessors.uiconfiggatorbyte.request_config().then(function (configdata) {
                self.configdata = configdata;
                self.alldevices = global.accessors.uiconfiggatorbyte.devices;
                self.enableddevices = configdata.device.devices;
                self.enableddevices = (self.enableddevices || "").split(",");
            });
        });

        // Start diagnostics button
        self.panel.find(".start-peripherals-diagnostics-tests-button").off("click").click(function () {
            console.log("Starting diagnostics tests.");
            
            $(".diagnostics-gb-panel").removeClass("hidden");
            $(".home-panel").addClass("hidden");

            self.panel.find(".diagnostics-button-parent").addClass("hidden");
            self.panel.find(".diagnostics-sub-panels-list").removeClass("hidden");

            // Enter diagnostics state
            var prefix = "##GB##", suffix = "#EOF#";
            self.ipcr.send('send-command-request', {
                command: prefix + "dgn" + suffix,
                windowid: global.states.windowid,
                path: global.port.path
            });

            // Start diagnostics tests
            self.starttests();
            
        });
    }

    self.starttests = function () {

        self.enableddevices.forEach(function (device) {

            var devicedata = self.f.grep(self.alldevices, "id", device, true);

            // Return if the device doesn not require testing
            if (devicedata && devicedata.test == false) return;
            
            $(".diagnostics-sub-panel-item[type='" + device + "']").removeClass("hidden");

            self.sendcommand(device);
            self.setstatus({
                ui: "." + device + "-status",
                font: "fa-vial",
                color: "#555",
                message: "Testing"
            });
        })

        // // Test RTC
        // self.sendcommand("rtc");
        // self.setstatus({
        //     ui: ".rtc-status",
        //     font: "fa-vial",
        //     color: "#555",
        //     message: "Testing"
        // });

        // // Test EEPROM
        // self.sendcommand("eeprom");
        // self.setstatus({
        //     ui: ".eeprom-status",
        //     font: "fa-vial",
        //     color: "#555",
        //     message: "Testing"
        // });

        // // Test Bluetooth
        // self.sendcommand("bl");
        // self.setstatus({
        //     ui: ".bl-status",
        //     font: "fa-vial",
        //     color: "#555",
        //     message: "Testing"
        // });
        
        // // Test AHT
        // self.sendcommand("aht");
        // self.setstatus({
        //     ui: ".aht-status",
        //     font: "fa-vial",
        //     color: "#555",
        //     message: "Testing"
        // });

        // // Test GPS
        // self.sendcommand("gps");
        // self.setstatus({
        //     ui: ".gps-status",
        //     font: "fa-vial",
        //     color: "#555",
        //     message: "Testing"
        // });
        
        // // Test Sentinel
        // self.sendcommand("sntl");
        // self.setstatus({
        //     ui: ".sntl-status",
        //     font: "fa-vial",
        //     color: "#555",
        //     message: "Testing"
        // });
        
        // // Test SD
        // self.sendcommand("sd");
        // self.setstatus({
        //     ui: ".sd-status",
        //     font: "fa-vial",
        //     color: "#555",
        //     message: "Testing"
        // });
        
        // // Test FRAM
        // self.sendcommand("fram");
        // self.setstatus({
        //     ui: ".fram-status",
        //     font: "fa-vial",
        //     color: "#555",
        //     message: "Testing"
        // });
        
        // // Test EADC
        // self.sendcommand("eadc");
        // self.setstatus({
        //     ui: ".eadc-status",
        //     font: "fa-vial",
        //     color: "#555",
        //     message: "Testing"
        // });
        
        // // Test relay
        // self.sendcommand("relay");
        // self.setstatus({
        //     ui: ".relay-status",
        //     font: "fa-vial",
        //     color: "#555",
        //     message: "Testing"
        // });
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

        if (response.startsWith("sd:")) {
            response = response.replace(/sd:/g, "");

            self.panel.find(".sd-text").html(multiline(function () {/* 
                <span style="margin-right: 4px;">{{status}}</span>
            */}, {
                status: response.indexOf("true") > -1 ? "Device ready" : "Not detected"
            }));

            if (response.indexOf("true") > -1) {
                
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

            self.panel.find(".bl-text").html(multiline(function () {/* 
                <span style="margin-right: 4px;">{{status}}</span>
            */}, {
                status: response.indexOf("true") > -1 ? "Device ready" : "Not detected"
            }));

            if (response.indexOf("true") > -1) {
                
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
            <div class="col-auto diagnostics-sub-panel-item hidden" type="sd" style="margin-bottom: 12px;margin-right: 12px;background: #444444b8;padding: 5px 10px;">
                <p style="margin-top: 2px; color: #b8e274; font-size: 12px; text-align: justify; margin-bottom: 4px;">Micro SD storage</p>
                
                <!-- SD -->
                <div class="row" style="margin: 0px;">
                    <div class="col-auto" style="padding: 3px 6px;margin: 0 6px 6px 0;border: 1px solid #4a4a4a;background: #4a4a4a;">
                        <p style="color: #d0a190; font-size: 12px; text-align: justify; margin-bottom: 0px;">Status</p>
                        <p class="sd-text" style="color: #bbbbbb; font-size: 13px; text-align: justify; margin-bottom: 0px;">-</p>
                    </div>
                </div>
                    
                <!-- Status -->
                <div class="row" style="margin: 0px;">
                    
                    <div class="col-auto sd-status"  style="padding: 3px 6px;margin: 0 -5px;">
                        <div style="display: inline-flex;color: white;background: white;border-radius: 2px;padding: 0 3px;">
                            <i class="fa-regular fa-clock" style="color: #716f6e; font-size: 13px; margin: 4px 4px 4px 4px;"></i>
                            <div style="color: #222; margin: 0 6px 0 4px; font-size: 13px;">Waiting</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!--! FRAM -->
            <div class="col-auto diagnostics-sub-panel-item hidden" type="fram" style="margin-bottom: 12px;margin-right: 12px;background: #444444b8;padding: 5px 10px;">
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
                            <i class="fa-regular fa-clock" style="color: #716f6e; font-size: 13px; margin: 4px 4px 4px 4px;"></i>
                            <div style="color: #222; margin: 0 6px 0 4px; font-size: 13px;">Waiting</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!--! RTC -->
            <div class="col-auto diagnostics-sub-panel-item hidden" type="rtc" style="margin-bottom: 12px;margin-right: 12px;background: #444444b8;padding: 5px 10px;">
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
                            <i class="fa-regular fa-clock" style="color: #716f6e; font-size: 13px; margin: 4px 4px 4px 4px;"></i>
                            <div style="color: #222; margin: 0 6px 0 4px; font-size: 13px;">Waiting</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!--! EEPROM -->
            <div class="col-auto diagnostics-sub-panel-item hidden" type="mem" style="margin-bottom: 12px;margin-right: 12px;background: #444444b8;padding: 5px 10px;">
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
                            <i class="fa-regular fa-clock" style="color: #716f6e; font-size: 13px; margin: 4px 4px 4px 4px;"></i>
                            <div style="color: #222; margin: 0 6px 0 4px; font-size: 13px;">Waiting</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!--! Bluetooth -->
            <div class="col-auto diagnostics-sub-panel-item hidden" type="bl" style="margin-bottom: 12px;margin-right: 12px;background: #444444b8;padding: 5px 10px;">
                <p style="margin-top: 2px; color: #b8e274; font-size: 12px; text-align: justify; margin-bottom: 4px;">Bluetooth module</p>
                
                <!-- AT-09 -->
                <div class="row" style="margin: 0px;">
                    <div class="col-auto" style="padding: 3px 6px;margin: 0 6px 6px 0;border: 1px solid #4a4a4a;background: #4a4a4a;">
                        <p style="color: #d0a190; font-size: 12px; text-align: justify; margin-bottom: 0px;">Status</p>
                        <p class="bl-text" style="color: #bbbbbb; font-size: 13px; text-align: justify; margin-bottom: 0px;">-</p>
                    </div>

                </div>
                    
                <!-- Status -->
                <div class="row" style="margin: 0px;">
                    
                    <div class="col-auto bl-status"  style="padding: 3px 6px;margin: 0 -5px;">
                        <div style="display: inline-flex;color: white;background: white;border-radius: 2px;padding: 0 3px;">
                            <i class="fa-regular fa-clock" style="color: #716f6e; font-size: 13px; margin: 4px 4px 4px 4px;"></i>
                            <div style="color: #222; margin: 0 6px 0 4px; font-size: 13px;">Waiting</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!--! AHT -->
            <div class="col-auto diagnostics-sub-panel-item hidden" type="aht" style="margin-bottom: 12px;margin-right: 12px;background: #444444b8;padding: 5px 10px;">
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
                            <i class="fa-regular fa-clock" style="color: #716f6e; font-size: 13px; margin: 4px 4px 4px 4px;"></i>
                            <div style="color: #222; margin: 0 6px 0 4px; font-size: 13px;">Waiting</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!--! Sentinel -->
            <div class="col-auto diagnostics-sub-panel-item hidden" type="sntl" style="margin-bottom: 12px;margin-right: 12px;background: #444444b8;padding: 5px 10px;">
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
                            <i class="fa-regular fa-clock" style="color: #716f6e; font-size: 13px; margin: 4px 4px 4px 4px;"></i>
                            <div style="color: #222; margin: 0 6px 0 4px; font-size: 13px;">Waiting</div>
                        </div>
                    </div>
                </div>
            </div>

            <!--! GPS -->
            <div class="col-auto diagnostics-sub-panel-item hidden" type="gps" style="margin-bottom: 12px;margin-right: 12px;background: #444444b8;padding: 5px 10px;">
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
                            <i class="fa-regular fa-clock" style="color: #716f6e; font-size: 13px; margin: 4px 4px 4px 4px;"></i>
                            <div style="color: #222; margin: 0 6px 0 4px; font-size: 13px;">Waiting</div>
                        </div>
                    </div>
                </div>
            </div>

            <!--! EADC -->
            <div class="col-auto diagnostics-sub-panel-item hidden" type="eadc" style="margin-bottom: 12px;margin-right: 12px;background: #444444b8;padding: 5px 10px;">
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
                            <i class="fa-regular fa-clock" style="color: #716f6e; font-size: 13px; margin: 4px 4px 4px 4px;"></i>
                            <div style="color: #222; margin: 0 6px 0 4px; font-size: 13px;">Waiting</div>
                        </div>
                    </div>
                </div>
            </div>

            <!--! Relay -->
            <div class="col-auto diagnostics-sub-panel-item hidden" type="eadc" style="margin-bottom: 12px;margin-right: 12px;background: #444444b8;padding: 5px 10px;">
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
                            <i class="fa-regular fa-clock" style="color: #716f6e; font-size: 13px; margin: 4px 4px 4px 4px;"></i>
                            <div style="color: #222; margin: 0 6px 0 4px; font-size: 13px;">Waiting</div>
                        </div>
                    </div>
                </div>
            </div>
        */}));
    }
}