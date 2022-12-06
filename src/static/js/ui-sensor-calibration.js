function uisensorcalibrationsubapp(){
    var self;
    self = this;
    self.version = 1.0;
    self.ls = window.sls;
    self.f = new functionsubapp().init();
    self.ipcr = require('electron').ipcRenderer;
    self.pwrsv =  require('electron').remote.powerSaveBlocker;
    self.a = global.accessors;


    self.init = function () {

        // Start listeners
        self.listeners();

        return self;
    }
    
    self.listeners = function () {

        // Dashboard big button
        $(".home-panel .sensor-calibration-button").off("click").click(function () {
            $(".sensor-calibration-panel").removeClass("hidden");
            $(".home-panel").addClass("hidden");
            
            // Send request to get GatorByte to send sd files list
            var prefix = "##GB##", suffix = "#EOF#";
            self.ipcr.send('send-command-request', {
                command: prefix + "calibration" + suffix,
                windowid: global.states.windowid,
                path: global.port.path
            });
        });
        
        // Select sensor from the sensor list
        $(".sensor-calibration-panel .sensor-list .calibrate-sensor-item").off("click").click(function () {
            var sensor = $(this).attr("name");
            
            // Send request to get GatorByte to send sd files list
            self.state = "enter";
            self.selectedsensor = sensor;
            self.sendcommand(sensor + ":enter");

            $(".calibration-info-div").attr("sensor", sensor);
            $(".calibration-perform-div").attr("sensor", sensor);
            $(".sensor-calibration-panel .sensor-list .spinner-div").removeClass("hidden");
            
            // Add blur
            $(".calibration-meta-info-div").addClass("blur");
            $(".calibration-data-info-div").addClass("blur");
            
            // Set sensor name in GUI
            $(".sensor-calibration-panel").find(".sensor-name").text(sensor);
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
            }, 3000);
        }
        if (line == "nack") {
            self.nack = true;
            global.timers.calack = setTimeout(function () {
                self.nack = false;
            }, 3000);
        }

        if (self.ack) {

            if (self.state == "enter") {
                var sensor = self.selectedsensor;
                var parent = $(".calibration-info-div[sensor='" + sensor + "']");
                
                // UI update
                $(".sensor-calibration-panel .sensor-list").addClass("hidden");
                $(".sensor-calibration-panel .calibration-info-parent").removeClass("hidden");

                // Show calibration perform UI
                parent.find(".go-back-sensor-list-button").off("click").click(function () {
                    $(".sensor-calibration-panel .calibration-info-parent").addClass("hidden");
                    $(".sensor-calibration-panel .sensor-list").removeClass("hidden");
                });

                // Show calibration perform UI
                parent.find(".show-calibration-actions-button").off("click").click(function () {
                    $(".sensor-calibration-panel .calibration-info-parent").addClass("hidden");
                    $(".sensor-calibration-panel .calibration-perform-parent").removeClass("hidden");

                    var newparent = $(".calibration-perform-div[sensor='" + sensor + "']");

                    var options = { 
                        "ph": {
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
                            "solutions": [
                                {
                                    "id": "0",
                                    "description": "Zero"
                                },
                                {
                                    "id": "saturated",
                                    "description": "Saturated"
                                }
                            ]
                        },
                        "ec": {
                            "levels": [
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
                    });
    
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

                    // Clear calibration button click handler
                    newparent.find(".calibration-clear-option").off("click").on("click", function () {
                        shouldenableperformbutton();

                        self.sendcommand(sensor + ":calibrate:clear");
                        self.state = "wait-on-result";
                        parent.find(".calibration-option[type='status']").addClass("rotate-animation");
                        
                        // Add blur
                        $(".calibration-meta-info-div").addClass("blur");
                        $(".calibration-data-info-div").addClass("blur");
                        
                        // Show info screen and hide perform screen
                        $(".sensor-calibration-panel .calibration-info-parent").removeClass("hidden");
                        $(".sensor-calibration-panel .calibration-perform-parent").addClass("hidden");
                    });

                    // Perform calibration button click handler
                    newparent.find(".perform-calibration-button").off("click").on("click", function () {
                        var level = newparent.find(".calibration-level-option.active").attr("type");
                        var solution = newparent.find(".calibration-solution-option.active").attr("type");

                        self.sendcommand(sensor + ":calibrate:" + level + "," + solution);
                        self.state = "wait-on-result";
                        parent.find(".calibration-option[type='status']").addClass("rotate-animation");
                        
                        // Add blur
                        $(".calibration-meta-info-div").addClass("blur");
                        $(".calibration-data-info-div").addClass("blur");

                        // Show info screen and hide perform screen
                        $(".sensor-calibration-panel .calibration-info-parent").removeClass("hidden");
                        $(".sensor-calibration-panel .calibration-perform-parent").addClass("hidden");
                    });

                    // Cancel calibration button click handler
                    newparent.find(".cancel-calibration-button").off("click").on("click", function () {
                        // Show info screen and hide perform screen
                        $(".sensor-calibration-panel .calibration-info-parent").removeClass("hidden");
                        $(".sensor-calibration-panel .calibration-perform-parent").addClass("hidden");
                    });
    
                    // Enable/disable perform calibration buttons
                    function shouldenableperformbutton () {
                        if (newparent.find(".calibration-level-option.active").length > 0 && newparent.find(".calibration-solution-option.active").length > 0) {
                            newparent.find(".perform-calibration-button").removeClass("disabled");         
                        }
                        else {
                            newparent.find(".perform-calibration-button").addClass("disabled");        
                        }
                    }
                    
                });

                // Get calibration status
                self.state = "wait-on-status";
                self.sendcommand(sensor + ":calibrate:status");
                parent.find(".calibration-option[type='status']").addClass("rotate-animation");
                
                // Add blur
                $(".calibration-meta-info-div").addClass("blur");
                $(".calibration-data-info-div").addClass("blur");
            }

            if (self.state == "wait-on-status") {
                var sensor = self.selectedsensor;

                // Update the list of calibrations found
                self.update_cal_status_ui(line);

                // Hide spinner
                $(".sensor-calibration-panel .sensor-list .spinner-div").addClass("hidden");
                
                var parent = $(".calibration-info-div[sensor='" + sensor + "']")
                parent.removeClass("hidden");
                
            }
            if (self.state == "wait-on-result") {
                
                // Update the list of calibrations found
                self.update_cal_status_ui(line);
            }
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
            else parent.find(".calibration-data-info-item[type='calibrations-found'] .list").html(multiline(function () {/* 
                <div style="background: #4e4e4e; padding: 2px 5px; font-size: 12px; margin: 0 4px 4px 0;">No calibration found</div>
            */}));

            if (calibrations >= 4) {
                parent.find(".calibration-data-info-item[type='calibrations-found'] .list").append(multiline(function () {/* 
                    <div style="background: #4e4e4e; padding: 2px 5px; font-size: 12px; margin: 0 4px 4px 0;">High-point</div>
                */}));
                calibrations -= 4;
            }
            if (calibrations >= 2) {
                parent.find(".calibration-data-info-item[type='calibrations-found'] .list").append(multiline(function () {/* 
                    <div style="background: #4e4e4e; padding: 2px 5px; font-size: 12px; margin: 0 4px 4px 0;">Mid-point</div>
                */}));
                calibrations -= 2;
            }
            if (calibrations >= 1) {
                parent.find(".calibration-data-info-item[type='calibrations-found'] .list").append(multiline(function () {/* 
                    <div style="background: #4e4e4e; padding: 2px 5px; font-size: 12px; margin: 0 4px 4px 0;">Low-point</div>
                */}));
                calibrations -= 1;
            }
        
            // Remove blur
            $(".calibration-meta-info-div").removeClass("blur");
            $(".calibration-data-info-div").removeClass("blur");
        }
    }
}