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
            self.panel.find(".sensor-list").removeClass("hidden");
            self.panel.find(".calibration-info-parent").addClass("hidden");
            self.panel.find(".calibration-perform-parent").addClass("hidden");
            
            // Send request to get GatorByte to send sd files list
            var prefix = "##GB##", suffix = "#EOF#";
            self.ipcr.send('send-command-request', {
                command: prefix + "calibration" + suffix,
                windowid: global.states.windowid,
                path: global.port.path
            });
        });
        
        // Select sensor from the sensor list
        self.panel.find(".sensor-list .calibrate-sensor-item").off("click").click(function () {
            var sensor = $(this).attr("name");
            
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
            self.panel.find("sensor-list .spinner-div").removeClass("hidden");
            
            // Add blur
            self.panel.find(".calibrations-found-item").addClass("blur");
            // self.panel.find(".calibration-data-info-div").addClass("blur");

            // Set sensor name in GUI
            self.panel.find(".sensor-name").text(sensor);
        });
    }

    self.sendcommand = function (command) {
        self.ipcr.send('send-command-request', {
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
                self.panel.find(".sensor-list").addClass("hidden");
                self.panel.find(".calibration-info-parent").removeClass("hidden");

                // Show sensors list UI
                parent.find(".go-back-sensor-list-button").off("click").click(function () {
                    self.panel.find(".calibration-info-parent").addClass("hidden");
                    self.panel.find(".sensor-list").removeClass("hidden");
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

                var sensor = self.selectedsensor;
                var newparent = $(".calibration-perform-div[sensor='" + sensor + "']");

                var options = { 
                    "ph": {
                        "messages" : {
                            "mid": "Caution: Mid-point calibration clears all other calibrations."
                        },
                        "levels": [
                            {
                                "id": "mid",
                                "description": "Mid-point"
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
                                "option": "atm",
                                "description": "Atmosphere"
                            },
                            {
                                "option": "zero",
                                "description": "Zero solution"
                            }
                        ],
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
                                "option": "100",
                                "description": "100 uS"
                            },
                            {
                                "option": "400",
                                "description": "400 uS"
                            },
                            {
                                "option": "1410",
                                "description": "1410 uS"
                            },
                            {
                                "option": "2000",
                                "description": "82000 uS"
                            },
                            {
                                "option": "12800",
                                "description": "12800 uS"
                            },
                            {
                                "option": "80000",
                                "description": "80000 uS"
                            },
                        ]
                    },

                    
                }

                // Clear lists
                newparent.find(".calibration-levels-list .calibration-level-option").remove();
                newparent.find(".calibration-solutions-list .calibration-solution-option").remove();

                // Create level and solution lists
                Object.keys(options).forEach(function (sensor, si) {

                    if (sensor != self.selectedsensor) return;

                    // Show calibration levels
                    options[sensor].levels.forEach(function (level, li) {
                        newparent.find(".calibration-levels-list").append(multiline(function () {/* 
                            <div class="col-auto calibration-level-option sensor-specific shadow-heavy" type="{{option}}" style="padding: 4px 6px;margin-right: 6px;margin-bottom: 6px;background: #5a5a5ab0;border-radius: 2px;height: 28px;">
                                <p style="color: #b4b4b4;margin-bottom: 0;">{{description}}</p>
                            </div>
                        */}, {
                            "option": level.id,
                            "description": level.description
                        }));
                    });

                    // Show calibration solution options
                    if (options[sensor].solutions.length == 0) {
                        newparent.find(".calibration-solutions-list").addClass("hidden");
                    }
                    else {
                        newparent.find(".calibration-solutions-list").removeClass("hidden");
                        options[sensor].solutions.forEach(function (solution, si) {
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
                
                // Show sensor calibration status UI
                self.panel.find(".go-back-sensor-calibration-status-button").off("click").click(function () {
                    self.panel.find(".calibration-info-parent").removeClass("hidden");
                    self.panel.find(".calibration-perform-parent").addClass("hidden");
                });

                // Clear calibration button click handler
                newparent.find(".calibration-clear-option").off("click").on("click", function () {
                    shouldenableperformbutton();

                    self.sendcommand(sensor + ":calibrate:clear");
                    self.state = "wait-on-result";
                    parent.find(".calibration-option[type='status']").addClass("rotate-animation");
                    
                    // Add blur
                    $(".calibrations-found-item").addClass("blur");
                    $(".lpi-item").addClass("blur");
                    // $(".calibration-data-info-div").addClass("blur");
                    
                    // Show info screen and hide perform screen
                    self.panel.find(".calibration-info-parent").removeClass("hidden");
                    self.panel.find(".calibration-perform-parent").addClass("hidden");
                    
                    self.panel.find(".calibration-stabalization-div").removeClass("hidden");
                    self.panel.find(".calibration-options-div").addClass("hidden");
                });

                // Perform calibration button click handler
                newparent.find(".perform-calibration-button").off("click").on("click", function () {
                    var level = newparent.find(".calibration-level-option.active").attr("type");
                    var solution = newparent.find(".calibration-solution-option.active").attr("type");

                    self.sendcommand(sensor + ":calibrate:" + level + "," + solution);
                    self.state = "wait-on-result";
                    parent.find(".calibration-option[type='status']").addClass("rotate-animation");
                    
                    // Add blur
                    $(".calibrations-found-item").addClass("blur");
                    $(".lpi-item").addClass("blur");
                    // $(".calibration-data-info-div").addClass("blur");

                    // Show info screen and hide perform screen
                    self.panel.find(".calibration-info-parent").removeClass("hidden");
                    self.panel.find(".calibration-perform-parent").addClass("hidden");
                    
                    self.panel.find(".calibration-stabalization-div").removeClass("hidden");
                    self.panel.find(".calibration-options-div").addClass("hidden");
                });

                // Cancel calibration button click handler
                newparent.find(".cancel-calibration-button").off("click").on("click", function () {
                    // Show info screen and hide perform screen
                    self.panel.find(".calibration-info-parent").removeClass("hidden");
                    self.panel.find(".calibration-perform-parent").addClass("hidden");
                    
                    self.panel.find(".calibration-stabalization-div").removeClass("hidden");
                    self.panel.find(".calibration-options-div").addClass("hidden");
                });

                // Enable/disable perform calibration buttons
                function shouldenableperformbutton () {
                    if (newparent.find(".calibration-level-option.active").length > 0 && (options[sensor].solutions.length == 0 || (options[sensor].solutions.length > 0 && newparent.find(".calibration-solution-option.active").length > 0))) {
                        newparent.find(".perform-calibration-button").removeClass("disabled");         
                    }
                    else {
                        newparent.find(".perform-calibration-button").addClass("disabled");        
                    }
                }

                // Get continuous readings
                newparent.find(".start-continous-readings-button").off("click").on("click", function () {
                    $(this).css("opacity", "0.3").addClass("disabled");
                    newparent.find(".show-calibration-options-button").css("opacity", "0.3").addClass("disabled");
                    
                    // Send request to GB for continuous readings
                    self.sendcommand(sensor + ":cread");
                    parent.find(".continuous-read-status-div").addClass("rotate-animation");
                });

                self.panel.find(".show-calibration-options-button").off("click").click(function () {
                    self.panel.find(".start-continous-readings-button").css("opacity", "1").removeClass("disabled");
                    
                    self.panel.find(".calibration-stabalization-div").addClass("hidden");
                    self.panel.find(".calibration-options-div").removeClass("hidden");
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
            parent.find(".calibration-option[type='status']").addClass("rotate-animation");

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
            var reading = parseInt(line.split(":")[1]);

            if (count == 1) {
                self.deltacontinousreading = self.previouscontinuousreading ? self.previouscontinuousreading - reading : 0;
                self.previouscontinuousreading = reading;
            }
            else if (count == 30) {
                delete self.deltacontinousreading;
                delete self.previouscontinuousreading;

                self.panel.find(".continuous-read-status-div").addClass("rotate-animation");
                self.panel.find(".start-continous-readings-button").css("opacity", "1").removeClass("disabled");
                self.panel.find(".show-calibration-options-button").css("opacity", "1").removeClass("disabled");
            }

            self.panel.find(".number-continous-readings .text").text(count);
            
            self.panel.find(".previous-continous-readings .text").text(self.previouscontinuousreading);
            self.panel.find(".latest-continous-readings .text").text(reading);
            self.panel.find(".delta-continous-readings .text").text(self.deltacontinousreading);

        }
    }

    self.update_cal_status_ui = function (line) {

        // Get calibrations found
        if (line.indexOf("result:") >= 0) {
            var calibrations = parseInt(line.split(":")[2]);
            var sensor = line.split(":")[1];
            var parent = $(".calibration-info-div[sensor='" + sensor + "']");

            parent.find(".calibration-option[type='status']").removeClass("rotate-animation");

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