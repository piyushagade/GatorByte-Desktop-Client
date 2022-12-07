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
            $(".device-info-overlay").removeClass("hidden");
        });

        // GatorByte info dismiss button
        $(".device-info-overlay .dismiss-button").off("click").click(function () {
            $(".device-info-overlay").addClass("hidden");
        });

        // Flash firmware big button
        $(".home-panel .flash-firmware-button").off("click").click(function () {
            $(".flash-firmware-overlay").removeClass("hidden");
        });

        // Select firmware button
        $(".flash-firmware-overlay .select-file-button").off("click").click(function () {
            if ($(this).attr("state") == "file-select") $(".flash-firmware-overlay").find(".select-file-input").click();
            else if ($(this).attr("state") == "firmware-upload"){
                
                // Enter upload mode
                $(".enter-upload-mode-button").click();

                // Request flash
                self.ipcr.send("ipc/flash-firmware/request", {
                    filepath: $(".flash-firmware-overlay .selected-file-info").attr("file-path"),
                    filename: $(".flash-firmware-overlay .selected-file-info").attr("file-name"),
                    portpath: global.port.path
                });
            }
        });

        // BIN file selector
        $('.flash-firmware-overlay .select-file-input').change(function () {
            $(".flash-firmware-overlay .select-file-button").attr("state", "firmware-upload").text("Flash firmware").css("background-color", "#d46506");

            var file = this.files[0];

            $(".flash-firmware-overlay .selected-file-info").attr("file-path", file.path).attr("file-name", file.name).html(multiline(function () {/* 
                <span style="color: #444;">{{filename}}</span> - <span style="">{{filesize}}</span>
            */}, {
                "filename": file.name,
                "filesize": parseInt(parseInt(file.size) / 1024) + " kB"
            }));
        });
        
        // Flash firmware dismiss button
        $(".flash-firmware-overlay .dismiss-button").off("click").click(function () {
            $(".flash-firmware-overlay").addClass("hidden");
            $(".flash-firmware-overlay .select-file-button").attr("state", "file-select").text("Select file").css("background-color", "#17972c");
        });

        
        // Dashboard big button
        $(".home-panel .dashboard-button").off("click").click(function () {
            $(".dashboard-panel").removeClass("hidden");
            $(".home-panel").addClass("hidden");
        });
    }
}