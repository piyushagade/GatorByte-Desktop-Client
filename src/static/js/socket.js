function socketsubapp(){
    var self;
    self = this;
    self.version = 1.0;
    self.ls = window.sls;
    self.f = new functionsubapp().init();
    self.ipcr = require('electron').ipcRenderer;
    self.a = global.accessors;
    self.socket = io("https://api.piyushagade.xyz/cereal");

    self.init = function () {

        // Start listeners
        self.listen();

        return self;
    }

    self.get_clients_count = function () {
        if (!global.states.sharedonline) return;
        self.socket.emit("live-share/client-connected-data/request", {
            "role": "source",
            "code": global.port.code
        });
    }

    self.join_source_room = function () {
        self.socket.emit('live-share/join-room/request', {
            "role": "source",
            "code": global.port.code
        });
    }

    self.leave_source_room = function () {
        self.socket.emit('live-share/leave-room/request', {
            "role": "source",
            "code": global.port.code
        });
    }

    self.share_serial_data = function (data) {
        if (!global.states.sharedonline) return;
        self.socket.emit('live-share/data/push', {
            ...data,
            "code": global.port.code
        });
    }

    self.share_state = function (data) {
        if (!global.port) return;
        if (!global.states.sharedonline) return;

        self.socket.emit('live-share/state/push', {
            code: global.port.code,
            port: global.port,
            states: global.states
        });
    }

    self.share_port_status = function (data) {
        if (!global.states.sharedonline || !data) return;

        global.portstatus = {
            code: global.port.code,
            connected: data.connected,
            upload: data.upload,
            waiting: data.waiting,
            codec: data.codec
        };

        self.socket.emit('live-share/port-status/push', global.portstatus);
    }

    self.on_port_selected = function (response) {
        if (!global.states.sharedonline) return;
        
        // If the port was available and a connection is established
        if (response.success && response.error == null) {
            self.share_port_status({
                code: global.port.code,
                connected: true,
                waiting: false,
                upload: false,
                codec: 1,
                port: global.port
            });
        }

        // If the port in available but busy
        else if (response.error != null) {
            self.share_port_status({
                code: global.port.code,
                connected: false,
                waiting: false,
                upload: false,
                codec: 2,
                port: global.port
            });
        }
        
        // If port is not avaialble (device not connected to the PC)
        else {
            self.share_port_status({
                code: global.port.code,
                connected: false,
                waiting: true,
                upload: false,
                codec: 3,
                port: null
            });
        }
    }

    self.on_port_upload_mode = function () {
        if (!global.states.sharedonline) return;
        
        // Broadcast a notification to all the clients connected to the room
        self.share_port_status({
            code: global.port.code,
            connected: false,
            upload: true,
            waiting: true,
            codec: 4,
            port: null
        });
    }

    self.on_port_disconnected = function () {
        if (!global.states.sharedonline) return;
        
        // Leave the room
        if (!global.states.follow && !global.states.upload) this.leave_source_room();

        // Broadcast a notification to all the clients connected to the room
        self.share_port_status({
            code: global.port.code,
            connected: false,
            upload: global.states.upload,
            waiting: global.states.follow,
            codec: 5,
            port: null
        });
    }

    self.listen = function () {
        
        self.socket.on("live-share/client-connected-data/push", function (obj) {
            var clientscount = obj.clientscount;

            $(".share-online-overlay .connected-clients-text").text(clientscount + " clients connected");
            $(".share-online-button .connected-clients-info-div").find(".connected-clients-text").text(clientscount);
        });

        self.socket.on("live-share/command/forward", function (obj) {
            if (!global.states.sharedonline) return;
            console.log("A web-client has sent a command: " + obj.command);
            
            self.ipcr.send('send-command-request', {
                command: obj.command,
                windowid: global.states.windowid,
                path: global.port.path
            });
        });

        self.socket.on("live-share/join-room/response", function (obj) {
            if (!global.states.sharedonline) return;
            console.log("The app has successfully joined the room: " + obj.room);
        });
    }
}