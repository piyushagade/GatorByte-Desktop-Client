const { cat } = require('shelljs');

function uicontrolvariablessubapp() {
    var self;
    self = this;
    self.version = 1.0;
    self.ls = window.sls;
    self.f = new functionsubapp().init();
    self.ipcr = require('electron').ipcRenderer;
    self.pwrsv =  require('electron').remote.powerSaveBlocker;
    self.a = global.accessors;
    
    self.filedownloadname = "control.ini";
    self.filedownloaddata = "";
    self.filedownloadline = 0;
    self.fileuploadline = 0;
    self.lines_to_send = 30;

    self.confighash = {};

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
        $(".home-panel .configure-gb-button").off("click").click(function () {
            $(".configure-gb-panel").removeClass("hidden");
            $(".home-panel").addClass("hidden");
            $(".gb-config-header").removeClass("hidden");
            
            // Send request to get GatorByte to enter config state
            var prefix = "##GB##", suffix = "#EOF#";
            self.ipcr.send('ipc/command/push', {
                command: prefix + "cv" + suffix,
                windowid: global.states.windowid,
                path: global.port.path
            });

            // Get config data from main process
            self.request_config();

        });
    }

}