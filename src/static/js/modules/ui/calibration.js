function uisensorcalibrationsubapp(){
    var self;
    self = this;
    self.version = 1.0;
    self.ls = window.sls;
    self.f = new functionsubapp().init();
    self.ipcr = require('electron').ipcRenderer;
    self.pwrsv =  require('electron').remote.powerSaveBlocker;
    self.a = global.accessors;
    self.panel = $(".sensor-calibration-panel");
    self.options = { 
        "ph": {
            "messages" : {
                "mid": "Caution: Mid-point calibration clears all other calibrations."
            },
            "levels": [
                {
                    "id": "low",
                    "description": "Low-point"
                },
                {
                    "id": "mid",
                    "description": "Mid-point",
                    "notification": {
                        "contexttype": "success",
                        "overlaytype": "dialog",
                        "heading": "Important note",
                        "body": "Mid-point calibration will remove Low-point and High-point calibrations. Do you want to proceed?"
                    }
                },
                {
                    "id": "high",
                    "description": "High-point"
                }
            ],
            "solutions": [
                {
                    "id": "4",
                    "description": "4.0"
                },
                {
                    "id": "7",
                    "description": "7.0"
                },
                {
                    "id": "10",
                    "description": "10.0"
                }
            ]
        },
        "dox": {
            "levels": [
                {
                    "id": "atm",
                    "description": "Atmosphere"
                },
                {
                    "id": "zero",
                    "description": "Zero solution"
                }
            ],
            "solutions": []
        },
        "rtd": {
            "levels": [],
            "solutions": []
        },
        "ec": {
            "levels": [
                {
                    "id": "dry",
                    "description": "Dry"
                },
                {
                    "id": "low",
                    "description": "Low-point"
                },
                {
                    "id": "high",
                    "description": "High-point"
                }
            ],
            "solutions": [
                {
                    "id": "100",
                    "description": "100 uS"
                },
                {
                    "id": "400",
                    "description": "400 uS"
                },
                {
                    "id": "1410",
                    "description": "1410 uS"
                },
                {
                    "id": "2000",
                    "description": "82000 uS"
                },
                {
                    "id": "12800",
                    "description": "12800 uS"
                },
                {
                    "id": "80000",
                    "description": "80000 uS"
                }
            ]
        },
    }

    self.init = function () {

        // Start listeners
        self.listeners();

        return self;
    }
    
    self.listeners = function () {

        // Dashboard big button
        $(".home-panel .sensor-calibration-button").off("click").click(function () {
            self.panel.removeClass("hidden");
            $(".home-panel").addClass("hidden");
            
            // Reset states
            self.state = "";
            self.selectedsensor = null;
            
            // UI update
            self.panel.find(".sensor-list-parent").removeClass("hidden");
            self.panel.find(".calibration-info-parent").addClass("hidden");
            self.panel.find(".calibration-perform-parent").addClass("hidden");
            
            // Send request to get GatorByte to send sd files list
            var prefix = "##GB##", suffix = "#EOF#";
            self.ipcr.send('ipc/command/push', {
                command: prefix + "calibration" + suffix,
                windowid: global.states.windowid,
                path: global.port.path
            });
            
            // Remove previous sensor list items
            self.panel.find(".calibration-sensor-list").find(".calibrate-sensor-item").remove();
            self.panel.find(".calibration-sensor-list").find(".empty-notification").remove();

            // Get config data
            global.accessors.uiconfiggatorbyte.request_config().then(function (configdata) {
                self.configdata = configdata;
                self.alldevices = global.accessors.uiconfiggatorbyte.devices;
                self.enableddevices = configdata.device.devices;
                self.enableddevices = (self.enableddevices || "").split(",");
                self.calibrationdevices = {};
                var atleastonefound = false;

                self.alldevices.forEach(function (device) {

                    // Check if the device is enabled
                    if (self.enableddevices.indexOf(device.id) == -1) return;

                    // If found, and allows calibration
                    if (device.calibration) {
                        atleastonefound = true;
                        self.calibrationdevices[device.id] = {...device};
                        self.calibrationdevices[device.id].calibration = self.options[device.id];

                        // Show item in the sensors list
                        self.panel.find(".calibration-sensor-list").append(multiline(function () {/* 
                            <div class="col-auto calibrate-sensor-item shadow-heavy" sensorname="{{sensor.name}}" sensorid="{{sensor.id}}" style="padding: 7px 8px 4px 8px;margin-right: 6px;margin-bottom: 6px;background: #ffffffbf;border-radius: 0px;">
                                <p style="color: #101010;margin-bottom: 0;font-size: 14px;text-align: center;margin-top: -2px;">{{sensor.name}}</p>
                            </div>
                        */}, {
                            "sensor": {
                                "id": device.id,
                                "name": device.name
                            }
                        }));
                    }
                });

                // If no calibrate-able devices/sensors were found
                if (!atleastonefound) {
                    self.panel.find(".calibration-sensor-list").append(multiline(function () {/* 
                        <div class="col-12 empty-notification" style="padding: 2px;margin-right: 6px;margin-bottom: 6px; border-radius: 0px;">
                            <p style="color: #dcd5d5;margin-bottom: 0;font-size: 14px; margin-top: -2px;">
                                The GatorByte's configuration doesn't specify any sensors that can be calibrated. If this is unexpected, please ensure that the sensor(s) are enabled in the <span style="font-weight: bold;"><i class="fa-solid fa-gears"></i> Configure GatorByte</span> page.
                            </p>
                        </div>
                    */}));
                }

                // Select sensor from the sensor list
                self.panel.find(".sensor-list-parent .calibrate-sensor-item").off("click").click(function () {
                    var sensorname = $(this).attr("sensorname");
                    var sensor = $(this).attr("sensorid");
                    
                    // Send request to get GatorByte to send sd files list
                    self.state = "enter";
                    self.selectedsensor = sensor;
                    self.sendcommand(sensor + ":enter");

                    $(".calibration-info-div").attr("sensor", sensor);
                    $(".calibration-perform-div").attr("sensor", sensor);
                    $(".start-continous-readings-button").css("opacity", "1").removeClass("disabled");

                    self.panel.find(".calibration-stabalization-div").removeClass("hidden");
                    self.panel.find(".calibration-options-div").addClass("hidden");

                    // Show spinner
                    self.panel.find("-parent .spinner-div").removeClass("hidden");
                    
                    // Add blur
                    self.panel.find(".calibrations-found-item").addClass("blur");
                    // self.panel.find(".calibration-data-info-div").addClass("blur");

                    // Set sensor name in GUI
                    self.panel.find(".sensor-name").text(sensorname);
                });
            });
        });
        
        // Update the list of calibrations found
        self.panel.find(".calibration-status-refresh-button").off("click").click(function () {
            self.sendcommand(sensor + ":calibrate:status");
            self.state = "wait-on-result";
            $(this).addClass("rotate-animation");
            $(".calibrations-found-item").addClass("blur");
        });
    }

    self.sendcommand = function (command) {
        self.ipcr.send('ipc/command/push', {
            command: command,
            windowid: global.states.windowid,
            path: global.port.path
        });
    }
    
    self.process = function (line) {
        line = line.replace(/<br>/g, "");

        // Process acknowledgment
        if (line == "ack") {
            self.ack = true;
            global.timers.calack = setTimeout(function () {
                self.ack = false;
            }, 100);
        }
        if (line == "nack") {
            self.nack = true;
            global.timers.calack = setTimeout(function () {
                self.nack = false;
            }, 100);
        }

        if (self.ack) {

            if (self.state == "enter") {
                var sensor = self.selectedsensor;
                var parent = $(".calibration-info-div[sensor='" + sensor + "']");
                
                // UI update
                self.panel.find(".sensor-list-parent").addClass("hidden");
                self.panel.find(".calibration-info-parent").removeClass("hidden");

                // Show sensors list UI
                parent.find(".go-back-sensor-list-button").off("click").click(function () {
                    self.panel.find(".calibration-info-parent").addClass("hidden");
                    self.panel.find(".sensor-list-parent").removeClass("hidden");
                });

                // Get last calibration last perform info
                self.sendcommand(sensor + ":lpi");
                self.state = "wait-on-lpi";

            }

            if (self.state == "wait-on-status") {
                var sensor = self.selectedsensor;

                // Update the list of calibrations found
                self.update_cal_status_ui(line);

                // Hide spinner
                self.panel.find(".sensor-list .spinner-div").addClass("hidden");
                
                var parent = $(".calibration-info-div[sensor='" + sensor + "']")
                parent.removeClass("hidden");
                
            }

            if (self.state == "wait-on-result") {
                
                // Update the list of calibrations found
                self.update_cal_status_ui(line);
            }
        }

        // If the response is last performed calibration information
        if (line.indexOf("lpi:") != -1) {
            
            var sensor = self.selectedsensor;
            var parent = $(".calibration-info-div[sensor='" + sensor + "']")

            // Get timestamp of last date of calibration
            var lastperformedinfo = parseInt(line.replace("lpi:", "")) * 1000;

            if (!isNaN(lastperformedinfo)) {
                self.panel.find(".last-calibrated-date-text").text(moment(lastperformedinfo).format("MM/DD/YY hh:mm a"));;
                
                if (moment.now() - lastperformedinfo > 86400 * 30 * 6) self.panel.find(".calibration-recommendation-text").text("Overdue");
                else if (moment.now() - lastperformedinfo > 86400 * 30 * 2) self.panel.find(".calibration-recommendation-text").text("Recommended");
                else if (moment.now() - lastperformedinfo < 86400 * 30 * 1) self.panel.find(".calibration-recommendation-text").text("Not needed");
            }
            else {
                self.panel.find(".last-calibrated-date-text").text("Unknown");
                self.panel.find(".calibration-recommendation-text").text("Recommended");
            }

            // Show calibration perform UI (also, continuous readings UI)
            parent.find(".show-calibration-actions-button").off("click").click(function () {
                self.panel.find(".calibration-info-parent").addClass("hidden");
                self.panel.find(".calibration-perform-parent").removeClass("hidden");

                self.panel.find(".number-continous-readings").find(".text").text("0");
                self.panel.find(".previous-continous-readings").find(".text").text("-");
                self.panel.find(".latest-continous-readings").find(".text").text("-");
                self.panel.find(".delta-continous-readings").find(".text").text("-");

                var sensor = self.selectedsensor;
                var newparent = $(".calibration-perform-div[sensor='" + sensor + "']");
                
                // Show sensor calibration status UI
                self.panel.find(".go-back-sensor-calibration-status-button").off("click").click(function () {
                    self.panel.find(".calibration-info-parent").removeClass("hidden");
                    self.panel.find(".calibration-perform-parent").addClass("hidden");
                });

                // Clear calibration button click handler
                newparent.find(".calibration-clear-option").off("click").on("click", function () {
                    
                    self.a.ui.notification({
                        "contexttype": "success",
                        "overlaytype": "dialog",
                        "heading": "Clear calibration",
                        "body": "Are you sure you want to clear the calibration?",
                        "onokay": function () {
                            shouldenableperformbutton();

                            self.sendcommand(sensor + ":calibrate:clear");
                            self.state = "wait-on-result";
                            parent.find(".calibration-status-refresh-button").addClass("rotate-animation");
                            
                            // Add blur
                            $(".calibrations-found-item").addClass("blur");
                            $(".lpi-item").addClass("blur");
                            // $(".calibration-data-info-div").addClass("blur");
                            
                            // Show info screen and hide perform screen
                            self.panel.find(".calibration-info-parent").removeClass("hidden");
                            self.panel.find(".calibration-perform-parent").addClass("hidden");
                            
                            self.panel.find(".calibration-stabalization-div").removeClass("hidden");
                            self.panel.find(".calibration-options-div").addClass("hidden");
                        }
                    });
                    
                });

                // Perform calibration button click handler
                newparent.find(".perform-calibration-button").off("click").on("click", function () {
                    var level = newparent.find(".calibration-level-option.active").attr("type");
                    var solution = newparent.find(".calibration-solution-option.active").attr("type");
                    var notificationdata = self.f.grep(self.calibrationdevices[sensor].calibration.levels, "id", level, true).notification;
                    if (!solution) solution = -1;

                    
                    if (notificationdata) {
                        notificationdata.onokay = onproceed;
                        console.log(notificationdata);
                        self.a.ui.notification(notificationdata);
                    }
                    else onproceed();

                    function onproceed () {
                        self.sendcommand(sensor + ":calibrate:" + level + "," + solution);
                        self.state = "wait-on-result";
                        parent.find(".calibration-status-refresh-button").addClass("rotate-animation");
                        
                        // Add blur
                        $(".calibrations-found-item").addClass("blur");
                        $(".lpi-item").addClass("blur");

                        self.a.ui.notification({
                            "contexttype": "success",
                            "overlaytype": "notification",
                            "hidetimeout": 3000,
                            "heading": "Calibration done",
                            "body": "The sensor was sucessfully calibrated to '" + level + "'.",
                            "onokay": function () {
                                self.panel.find(".calibration-stabalization-div").removeClass("hidden");
                                self.panel.find(".calibration-options-div").addClass("hidden");
                            }
                        });
                    }
                });

                // Cancel calibration button click handler
                newparent.find(".back-calibration-button").off("click").on("click", function () {
                    self.panel.find(".calibration-stabalization-div").removeClass("hidden");
                    self.panel.find(".calibration-options-div").addClass("hidden");
                });

                // Enable/disable perform calibration buttons
                function shouldenableperformbutton () {
                    if (newparent.find(".calibration-level-option.active").length > 0 && (self.calibrationdevices[sensor].calibration.solutions.length == 0 || (self.calibrationdevices[sensor].calibration.solutions.length > 0 && newparent.find(".calibration-solution-option.active").length > 0))) {
                        newparent.find(".perform-calibration-button").removeClass("disabled");         
                    }
                    else {
                        newparent.find(".perform-calibration-button").addClass("disabled");        
                    }
                }

                // Get continuous readings
                newparent.find(".start-continous-readings-button").off("click").on("click", function () {
                    var count = $(this).attr("count");
                    $(".start-continous-readings-button").css("opacity", "0.3").addClass("disabled");
                    newparent.find(".show-calibration-options-button").css("opacity", "0.3").addClass("disabled");

                    self.selectedcreadcount = count;
                    
                    // Send request to GB for continuous readings
                    self.sendcommand(sensor + ":cread:" + self.selectedcreadcount);
                    parent.find(".continuous-read-status-div").addClass("rotate-animation");
                });

                self.panel.find(".show-calibration-options-button").off("click").click(function () {
                    self.panel.find(".start-continous-readings-button").css("opacity", "1").removeClass("disabled");
                    
                    self.panel.find(".calibration-stabalization-div").addClass("hidden");
                    self.panel.find(".calibration-options-div").removeClass("hidden");

                    // Clear lists
                    newparent.find(".calibration-levels-list .calibration-level-option").remove();
                    newparent.find(".calibration-solutions-list .calibration-solution-option").remove();

                    // Create level and solution lists
                    Object.keys(self.calibrationdevices).forEach(function (sensor, si) {

                        if (sensor != self.selectedsensor) return;

                        // Show calibration levels
                        if (self.calibrationdevices[sensor].calibration.levels.length == 0) {
                            newparent.find(".calibration-levels-list").addClass("hidden");
                        }
                        else {
                            self.calibrationdevices[sensor].calibration.levels.forEach(function (level, li) {
                                newparent.find(".calibration-levels-list").append(multiline(function () {/* 
                                    <div class="col-auto calibration-level-option sensor-specific shadow-heavy" type="{{option}}" style="padding: 4px 6px;margin-right: 6px;margin-bottom: 6px;background: #5a5a5ab0;border-radius: 2px;height: 28px;">
                                        <p style="color: #b4b4b4;margin-bottom: 0;">{{description}}</p>
                                    </div>
                                */}, {
                                    "option": level.id,
                                    "description": level.description
                                }));
                            });
                        }

                        // Show calibration solution options
                        if (self.calibrationdevices[sensor].calibration.solutions.length == 0) {
                            newparent.find(".calibration-solutions-list").addClass("hidden");
                        }
                        else {
                            newparent.find(".calibration-solutions-list").removeClass("hidden");
                            self.calibrationdevices[sensor].calibration.solutions.forEach(function (solution, si) {
                                newparent.find(".calibration-solutions-list").append(multiline(function () {/* 
                                    <div class="col-auto calibration-solution-option sensor-specific shadow-heavy" type="{{option}}" style="padding: 4px 6px;margin-right: 6px;margin-bottom: 6px;background: #5a5a5ab0;border-radius: 2px;height: 28px;">
                                        <p style="color: #b4b4b4;margin-bottom: 0;">{{description}}</p>
                                    </div>
                                */}, {
                                    "option": solution.id,
                                    "description": solution.description
                                }));
                            });
                        }
                    });

                    // Disable Perform button
                    shouldenableperformbutton();

                    // Click listeners
                    newparent.find(".calibration-level-option").off("click").on("click", function () {
                        newparent.find(".calibration-level-option").css("opacity", "0.3").removeClass("active");
                        $(this).css("opacity", "1").addClass("active");
                        shouldenableperformbutton();
                    });
                    newparent.find(".calibration-solution-option").off("click").on("click", function () {
                        newparent.find(".calibration-solution-option").css("opacity", "0.3").removeClass("active");
                        $(this).css("opacity", "1").addClass("active");
                        shouldenableperformbutton();
                    });
                });

                // // Skip continuous readings
                // newparent.find(".skip-continous-readings-button").off("click").on("click", function () {
                //     self.panel.find(".start-continous-readings-button").css("opacity", "1").removeClass("disabled");
                //     self.panel.find(".show-calibration-options-button").css("opacity", "0.3").addClass("disabled");
                    
                //     self.panel.find(".calibration-stabalization-div").addClass("hidden");
                //     self.panel.find(".calibration-options-div").removeClass("hidden");
                // });
                
            });

            // Get calibration status
            self.state = "wait-on-status";
            self.sendcommand(sensor + ":calibrate:status");
            parent.find(".calibration-status-refresh-button").addClass("rotate-animation");

            // Add blur
            $(".calibrations-found-item").addClass("blur");
            $(".lpi-item").addClass("blur");
        }

        // If the response is continuous readings
        if (line.indexOf("cread:") != -1) {
            var sensor = self.selectedsensor;
            line = line.replace("cread:", "");

            // Get payload
            var count = parseInt(line.split(":")[0]) + 1;
            var reading = parseFloat(line.split(":")[1]);

            if (count == 1) {
                self.deltacontinousreading = 0;
                self.previouscontinuousreading = reading;
            }
            if (count > 1 && count < self.selectedcreadcount) {
                self.deltacontinousreading = reading - self.previouscontinuousreading;
            }
            else if (count == self.selectedcreadcount) {
                self.panel.find(".continuous-read-status-div").addClass("rotate-animation");
                self.panel.find(".start-continous-readings-button").css("opacity", "1").removeClass("disabled");
                self.panel.find(".show-calibration-options-button").css("opacity", "1").removeClass("disabled");
            }

            self.panel.find(".number-continous-readings .text").text(count);
            
            self.panel.find(".previous-continous-readings .text").text(parseFloat(self.previouscontinuousreading).toFixed(2));
            self.panel.find(".latest-continous-readings .text").text(parseFloat(reading).toFixed(2));
            self.panel.find(".delta-continous-readings .text").text(parseFloat(self.deltacontinousreading).toFixed(3));

            // Set previous reading value
            if (reading) self.previouscontinuousreading = reading;

        }
    }

    self.update_cal_status_ui = function (line) {

        // Get calibrations found
        if (line.indexOf("result:") >= 0) {
            var calibrations = parseInt(line.split(":")[2]);
            var sensor = line.split(":")[1];
            var parent = $(".calibration-info-div[sensor='" + sensor + "']");

            parent.find(".calibration-status-refresh-button").removeClass("rotate-animation");

            if (calibrations > 0) parent.find(".calibration-data-info-item[type='calibrations-found'] .list").html("");
            else {
                parent.find(".calibration-data-info-item[type='calibrations-found'] .list").html(multiline(function () {/* 
                    <div class="calibrations-found-item" style="background: #4e4e4e; padding: 2px 5px; font-size: 12px; margin: 0 4px 4px 0;">No calibration found</div>
                */}));

                // Update recommendation
                self.panel.find(".calibration-recommendation-text").text("Recommended");
            }

            if (sensor == "ph") {
                if (calibrations >= 4) {
                    parent.find(".calibration-data-info-item[type='calibrations-found'] .list").append(multiline(function () {/* 
                        <div class="calibrations-found-item" style="background: #4e4e4e; padding: 2px 5px; font-size: 12px; margin: 0 4px 4px 0;">High-point</div>
                    */}));
                    calibrations -= 4;
                }
                if (calibrations >= 2) {
                    parent.find(".calibration-data-info-item[type='calibrations-found'] .list").append(multiline(function () {/* 
                        <div class="calibrations-found-item" style="background: #4e4e4e; padding: 2px 5px; font-size: 12px; margin: 0 4px 4px 0;">Mid-point</div>
                    */}));
                    calibrations -= 2;
                }
                if (calibrations >= 1) {
                    parent.find(".calibration-data-info-item[type='calibrations-found'] .list").append(multiline(function () {/* 
                        <div class="calibrations-found-item" style="background: #4e4e4e; padding: 2px 5px; font-size: 12px; margin: 0 4px 4px 0;">Low-point</div>
                    */}));
                    calibrations -= 1;
                }
            }
            if (sensor == "ec") {
                if (calibrations >= 8) {
                    parent.find(".calibration-data-info-item[type='calibrations-found'] .list").append(multiline(function () {/* 
                        <div class="calibrations-found-item" style="background: #4e4e4e; padding: 2px 5px; font-size: 12px; margin: 0 4px 4px 0;">High-point</div>
                    */}));
                    calibrations -= 8;
                }
                if (calibrations >= 4) {
                    parent.find(".calibration-data-info-item[type='calibrations-found'] .list").append(multiline(function () {/* 
                        <div class="calibrations-found-item" style="background: #4e4e4e; padding: 2px 5px; font-size: 12px; margin: 0 4px 4px 0;">Low</div>
                    */}));
                    calibrations -= 4;
                }
                if (calibrations >= 2) {
                    parent.find(".calibration-data-info-item[type='calibrations-found'] .list").append(multiline(function () {/* 
                        <div class="calibrations-found-item" style="background: #4e4e4e; padding: 2px 5px; font-size: 12px; margin: 0 4px 4px 0;">Single-point</div>
                    */}));
                    calibrations -= 2;
                }
                if (calibrations >= 1) {
                    parent.find(".calibration-data-info-item[type='calibrations-found'] .list").append(multiline(function () {/* 
                        <div class="calibrations-found-item" style="background: #4e4e4e; padding: 2px 5px; font-size: 12px; margin: 0 4px 4px 0;">Dry</div>
                    */}));
                    calibrations -= 1;
                }
            }
            if (sensor == "dox") {
                if (calibrations >= 2) {
                    parent.find(".calibration-data-info-item[type='calibrations-found'] .list").append(multiline(function () {/* 
                        <div class="calibrations-found-item" style="background: #4e4e4e; padding: 2px 5px; font-size: 12px; margin: 0 4px 4px 0;">Zero</div>
                    */}));
                    calibrations -= 2;
                }
                if (calibrations >= 1) {
                    parent.find(".calibration-data-info-item[type='calibrations-found'] .list").append(multiline(function () {/* 
                        <div class="calibrations-found-item" style="background: #4e4e4e; padding: 2px 5px; font-size: 12px; margin: 0 4px 4px 0;">Atmospheric</div>
                    */}));
                    calibrations -= 1;
                }
            }
            
            // Remove blur
            $(".calibrations-found-item").removeClass("blur");
            $(".lpi-item").removeClass("blur");
        }
    }
}