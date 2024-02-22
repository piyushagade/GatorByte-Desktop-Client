function uihomesubapp(){
    var self;
    self = this;
    self.version = 1.0;
    self.ls = window.sls;
    self.f = new functionsubapp().init();
    self.ipcr = require('electron').ipcRenderer;
    self.pwrsv =  require('electron').remote.powerSaveBlocker;
    self.a = global.accessors;


    self.init = function () {
        
        //! Set UI
        $(".spinner-ui").addClass("hidden");
    
        // Start listeners
        self.listeners();

        return self;
    }
    
    self.listeners = function () {

        // GatorByte info button
        $(".home-panel .gb-info-button").off("click").click(function () {
            $(".device-info-overlay").removeClass("hidden").slideUp(0);
            $(".home-panel").addClass("blur").addClass("disabled");;
            $(".device-info-overlay").slideDown(200);
        });

        // GatorByte info dismiss button
        $(".device-info-overlay .dismiss-button").off("click").click(function () {
            $(".device-info-overlay").slideUp(200);
            setTimeout(() => {
                $(".home-panel").removeClass("blur").removeClass("disabled");
                $(".device-info-overlay").addClass("hidden");
            }, 200);
        });

        // Show flash firmware UI big button in home panel
        $(".home-panel .big-button.flash-firmware-button").off("click").click(function () {
            $(".flash-firmware-overlay").removeClass("hidden").slideUp(0);
            $(".home-panel").addClass("blur").addClass("disabled");
            $(".flash-firmware-overlay").slideDown(200);

            // Reset UI
            $(".flash-firmware-overlay").find(".file-selection-div").removeClass("hidden").slideDown(0)
            $(".flash-firmware-overlay").find(".file-selection-div").find(".selected-file-info").text("No file selected")
            $(".flash-firmware-overlay").find(".file-selection-div").find(".select-file-button").attr("state", "file-select");
            $(".flash-firmware-overlay").find(".flash-success-div").addClass("hidden");
            $(".flash-firmware-overlay").find(".flash-failure-div").addClass("hidden");
            $(".flash-firmware-overlay").find(".flash-in-progress-notification-div").addClass("hidden");

            $('.flash-firmware-overlay .file-selection-div').find(".select-file-input").remove();
            $('.flash-firmware-overlay .file-selection-div').append(multiline(function () {/* 
                <!-- File selector -->
                <input class="select-file-input" type="file" accept=".bin" style="display: none;">
            */}));

            // BIN file selector
            $('.flash-firmware-overlay .select-file-input').off("change").change(function () {
                
                if (!this.files) return;
                if (this.files.length == 0) return;

                var file = this.files[0];
                $(".flash-firmware-overlay .select-file-button").attr("state", "firmware-upload").text("Flash firmware").css("background-color", "#d46506");
                $(".flash-firmware-overlay .selected-file-info").attr("file-path", file.path).attr("file-name", file.name).html(multiline(function () {/* 
                    <span style="color: #444;">{{filename}}</span> - <span style="">{{filesize}}</span>
                */}, {
                    "filename": file.name,
                    "filesize": parseInt(parseInt(file.size) / 1024) + " kB"
                }));
            });

            // Select flash firmware button
            $(".flash-firmware-overlay .select-file-button").off("click").click(function () {
                if ($(this).attr("state") == "file-select") $(".flash-firmware-overlay").find(".select-file-input").click();
                else if ($(this).attr("state") == "firmware-upload"){

                    $(".flash-firmware-overlay").find(".file-selection-div").addClass("hidden");
                    $(".flash-firmware-overlay").find(".flash-in-progress-notification-div").slideDown(0).removeClass("hidden");

                    // Close the port
                    // TODO Find a better way to do this
                    $(".connected-device-disconnect-button").click();

                    // Blur the device selector UI
                    $(".device-selector-panel").addClass("disabled").addClass("blur");
                    
                    // Request f/w flash
                    self.ipcr.send("ipc/flash-firmware/request", {
                        filepath: $(".flash-firmware-overlay .selected-file-info").attr("file-path"),
                        filename: $(".flash-firmware-overlay .selected-file-info").attr("file-name"),
                        portpath: global.port.path,
                        baud: global.port.baud
                    });
                }
            });
            
            // Flash firmware dismiss button
            $(".flash-firmware-overlay .dismiss-button").off("click").click(function () {
                $(".flash-firmware-overlay").slideUp(200);
                setTimeout(() => {
                    $(".flash-firmware-overlay").addClass("hidden");
                    
                    // Remove blur the device selector UI
                    $(".home-panel").removeClass("blur").removeClass("disabled");
                    $(".waiting-for-pong-overlay").addClass("hidden").removeClass("blur");
                    $(".device-selector-panel").addClass("hidden").removeClass("blur");
                }, 200);
                $(".flash-firmware-overlay .select-file-button").attr("state", "file-select").text("Select file").css("background-color", "#1683c3");
            });
        });

        // Show flash firmware UI from "waiting for pong" overlay 
        $(".waiting-for-pong-overlay .flash-firmware-button").off("click").click(function () {
            $(".flash-firmware-overlay").removeClass("hidden").slideUp(0);
            $(".home-panel").addClass("blur").addClass("disabled");
            $(".waiting-for-pong-overlay").addClass("blur").addClass("hidden");
            $(".flash-firmware-overlay").slideDown(200);

            // Reset UI
            $(".flash-firmware-overlay").find(".file-selection-div").removeClass("hidden").slideDown(0)
            $(".flash-firmware-overlay").find(".file-selection-div").find(".selected-file-info").text("No file selected")
            $(".flash-firmware-overlay").find(".file-selection-div").find(".select-file-button").attr("state", "file-select");
            $(".flash-firmware-overlay").find(".flash-success-div").addClass("hidden");
            $(".flash-firmware-overlay").find(".flash-failure-div").addClass("hidden");
            $(".flash-firmware-overlay").find(".flash-in-progress-notification-div").addClass("hidden");

            $('.flash-firmware-overlay .file-selection-div').find(".select-file-input").remove();
            $('.flash-firmware-overlay .file-selection-div').append(multiline(function () {/* 
                <!-- File selector -->
                <input class="select-file-input" type="file" accept=".bin" style="display: none;">
            */}));

            // BIN file selector
            $('.flash-firmware-overlay .select-file-input').off("change").change(function () {
                
                if (!this.files) return;
                if (this.files.length == 0) return;

                var file = this.files[0];
                $(".flash-firmware-overlay .select-file-button").attr("state", "firmware-upload").text("Flash firmware").css("background-color", "#d46506");
                $(".flash-firmware-overlay .selected-file-info").attr("file-path", file.path).attr("file-name", file.name).html(multiline(function () {/* 
                    <span style="color: #444;">{{filename}}</span> - <span style="">{{filesize}}</span>
                */}, {
                    "filename": file.name,
                    "filesize": parseInt(parseInt(file.size) / 1024) + " kB"
                }));
            });

            // Select flash firmware button
            $(".flash-firmware-overlay .select-file-button").off("click").click(function () {
                if ($(this).attr("state") == "file-select") $(".flash-firmware-overlay").find(".select-file-input").click();
                else if ($(this).attr("state") == "firmware-upload"){

                    $(".flash-firmware-overlay").find(".file-selection-div").addClass("hidden");
                    $(".flash-firmware-overlay").find(".flash-in-progress-notification-div").slideDown(0).removeClass("hidden");

                    // Close the port
                    // TODO Find a better way to do this
                    $(".connected-device-disconnect-button").click();

                    // Blur the device selector UI
                    $(".device-selector-panel").addClass("disabled").addClass("blur");
                    
                    // Request f/w flash
                    self.ipcr.send("ipc/flash-firmware/request", {
                        filepath: $(".flash-firmware-overlay .selected-file-info").attr("file-path"),
                        filename: $(".flash-firmware-overlay .selected-file-info").attr("file-name"),
                        portpath: global.port.path,
                        baud: global.port.baud
                    });
                }
            });

            // Flash firmware dismiss button
            $(".flash-firmware-overlay .dismiss-button").off("click").click(function () {
                $(".flash-firmware-overlay").slideUp(200);
                setTimeout(() => {
                    $(".flash-firmware-overlay").addClass("hidden");
                    
                    // Remove blur the device selector UI
                    $(".waiting-for-pong-overlay").removeClass("blur").removeClass("hidden");
                    $(".device-selector-panel").removeClass("hidden").removeClass("blur");
                }, 200);
                $(".flash-firmware-overlay .select-file-button").attr("state", "file-select").text("Select file").css("background-color", "#1683c3");
            });
        });

        
        // // Dashboard big button
        // $(".home-panel .big-button.dashboard-button").off("click").click(function () {

        //     // Show back button
        //     $(".go-back-panel-button").removeClass("hidden");
            
        //     $(".dashboard-panel").removeClass("hidden");
        //     $(".home-panel").addClass("hidden");
        // });
    }
}