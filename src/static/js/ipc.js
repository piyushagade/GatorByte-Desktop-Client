function ipcsubapp(){
    var self;
    self = this;
    self.version = 1.0;
    self.ls = window.sls;
    self.f = new functionsubapp().init();
    self.ipcr = require('electron').ipcRenderer;
    self.pwrsv =  require('electron').remote.powerSaveBlocker;
    self.a = global.accessors;
 
    self.init = function () {
        
        // Get updated ports list every 2 seconds
        global.timers.portsrefresh = setInterval(() => { self.ipcr.send('get-available-ports-request'); }, 2000);
        
        self.ipcr.on('bootstrap-information-push', (event, data) => {
            self.process_bootstrap_data(event, data);
        });

        self.ipcr.on('update-download-notification-push', (event, response) => {
            console.log("Download completed");
        });

        self.ipcr.on('update-download-progress-push', (event, response) => {
            self.process_download_progress(event, response);
        });

        self.ipcr.on('subscription-information-push', (event, data) => {
            self.process_subscription_data(event, data);
        });

        self.ipcr.on('update-information-push', (event, data) => {
            self.process_update_data(event, data);
        });

        self.ipcr.on('update-installation-notification-push', (event, data) => {
            self.process_update_installation_data(event, data);
        });

        self.ipcr.on('install-update-response', (event, data) => {
            self.process_update_installation_response(event, data);
        });

        self.ipcr.on('new-serial-data-push', (event, arg) => {
            self.process_new_serial_data(event, arg);
        });

        self.ipcr.on('get-available-ports-response', (event, data) => {
            self.process_available_ports_list(event, data)
        });

        self.ipcr.on('select-port-response', (event, response) => {
            self.on_port_selected(event, response);
        });

        self.ipcr.on('port-disconnected-notification-push ', (event, response) => {
            self.on_port_disconnected(event, response);
        });

        self.ipcr.on('send-command-response', (event, response) => {
            if(response.status) {
                $(".command-input-div input").val("");
                $(".command-input-div .status-icon").html('<i class="fas fa-check" style="color: green;" title="Sent"></i>');
            }
            else {
                $(".command-input-div .status-icon").html('<i class="fas fa-times" style="color: red;" title="Couln\'t send"></i>');
            }
    
            setTimeout(() => {
                $(".command-input-div .status-icon").html("");
            }, 2000);
        });

        self.ipcr.on('ipc/full-functionality-locked-notification/push', (event, response) => {
            self.a.ui.show_functionality_locked_overlay(response);
        });

        self.ipcr.on('ipc/save-file/response', (event, response) => {
            self.a.uidownloadfiles.on_file_save_response(response);
        });

        self.ipcr.on("ipc/config-data-get/response", (event, response) => {
            self.a.uiconfiggatorbyte.setconfigdata(response.configobject);
        });

        self.ipcr.on("ipc/pong-received-notification/push", (event, response) => {
            if (global.port && global.port.path == response.path) {

                // Disable buttons that require the GatorByte to be ready (setup complete)
                $(".home-panel").find(".big-button.requires-device-ready").addClass("disabled");
                
                if ($(".flash-firmware-overlay").hasClass("hidden")) {
                    $(".device-not-available-overlay").slideUp(50);
                    $(".home-panel").removeClass("disabled").removeClass("blur");
                }
                
                $(".waiting-for-pong-overlay").slideUp(0);
                $(".waiting-for-pong-overlay").addClass("hidden");

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
            }
        });

        self.ipcr.on("ipc/gb-ready-notification/push", (event, response) => {
                
            // Enable buttons that require the GatorByte to be ready (setup complete)
            $(".home-panel").find(".big-button.requires-device-ready").removeClass("disabled");

        });

        self.ipcr.on("ipc/flash-firmware/response", (event, response) => {
            if (response.status == "success") {
                console.log("Flashing successful");
                var parent = $(".flash-firmware-overlay");

                parent.find(".flash-in-progress-notification-div").slideUp(100);
                setTimeout(() => { parent.find(".flash-in-progress-notification-div").addClass("hidden");}, 100);
                parent.find(".flash-success-div").removeClass("hidden").slideUp(0).slideDown(200);
                parent.find(".flash-failure-div").addClass("hidden");
            }

            else  {
                console.log("Flashing failed");
                var parent = $(".flash-firmware-overlay");

                parent.find(".flash-in-progress-notification-div").slideUp(100);
                setTimeout(() => { parent.find(".flash-in-progress-notification-div").addClass("hidden");}, 100);
                parent.find(".flash-failure-div").removeClass("hidden").slideUp(0).slideDown(200);
                parent.find(".flash-success-div").addClass("hidden");
            }
        });
        
        return self;
    }

    self.process_bootstrap_data = function (event, data) {

        if (data.windowtype == "serial-monitor") {
            global.port = data.global.data.port;
            $(".home-panel .serial-monitor-button").click();
        }
                
        // Print info just the first time
        var first = false
        if (!global.states.machineid) first = true;

        global.states.machineid = data.machineid;
        global.states.fullfunctionality = data.fullfunctionality;
        global.states.windowtype = data.windowtype;
        global.states.windowid = data.windowid;
        global.states.windowscountid = data.windowscountid;
        global.states.remoteurl = data.remoteurl;
        global.states.currentversion = data.appversion;

        // Set app version info
        $(".logo .version-text").text("v" + global.states.currentversion);
        if (!global.states.windowid) $(".logo .version-text").css("color", "chocolate");

        if (data.quickconnectport) {
            global.quickconnectport = data.quickconnectport;
            $(".quick-connect-button").removeClass("hidden");
            $(".quick-connect-button").find(".last-device-name").html("<b>" + (global.quickconnectport.nickname || global.quickconnectport.friendlyName || "Unnamed device") + "</b>");
            $(".quick-connect-button").find(".last-device-baud-rate").html("<b>" + global.quickconnectport.baud + " bps</b>");
            $(".quick-connect-button").off("click").click(function () {
                console.log("Requesting quick connection for: " + global.quickconnectport.path + " (" + global.quickconnectport.baud + " bps) on window ID: " + global.states.windowid);

                self.ipcr.send('open-port-request', {
                    path: global.quickconnectport.path,
                    ...global.quickconnectport
                });
            });
        }
        else {
            global.quickconnectport = null;
            $(".quick-connect-button").addClass("hidden");
            $(".quick-connect-button").find(".last-device-name").text("-");
            $(".quick-connect-button").find(".last-device-baud-rate").text("-");
        }

        if (first) {
            console.log("Bootstrap data received.");
            console.log("Machine ID: " + global.states.machineid);
            console.log("Full functionality: " + (global.states.fullfunctionality ? "unlocked" : "locked"));
            console.log("Window ID: " + global.states.windowid);
            console.log("Window count ID: " + global.states.windowscountid);
        }
    }

    self.process_subscription_data = function (event, data) {

        return;

        global.states.subscription = data;
        var states = global.states.subscription["computed-states"];

        // If no data was sent, it was probably due to no subscription information was available
        if (!global.states.subscription) {
            var ui = $(".inactive-subscription-notification");
            ui.removeClass("hidden");

            ui.find(".status-heading").text("Status");
            ui.find(".status-text").text("Unknown");
            ui.find(".status-message").text("We couldn't fetch your subscription/trial information. Please connect to the internet and try again. The app will have limited functionality until then.");
            ui.find(".activate-product-button").addClass("hidden");
            ui.find(".buy-product-button").addClass("hidden");

            return;
        }

        // If subscription is inactive (app not purchased)
        if (!states.subscriptionactive) {
            var ui = $(".inactive-subscription-notification");
            ui.removeClass("hidden");

            // If trial period has never been used/begun
            if (!states.trialused) {
                ui.find(".status-heading").text("Status");
                ui.find(".status-text").text("Inactive");
                ui.find(".status-message").text("The product hasn't been activated. Please register and activate a 30-day trial to unlock full functionality.");
                ui.find(".activate-product-button").removeClass("hidden");
                ui.find(".buy-product-button").addClass("hidden");
            }

            // If trial period was/is being used
            else {
                var daysremaining = states.daysremaining;
                var trialexpired = states.trialexpired;
                
                // Trial is currently active
                if (!trialexpired) {
                    if (ui.find(".status-heading").text().length == 0) console.log("Trial started: " + moment(parseInt(global.states.subscription.trial.timestamp)).fromNow());
                    
                    ui.find(".status-heading").text("Trial ends in");
                    ui.find(".status-text").text(daysremaining + " days");
                    ui.find(".status-message").text("The app is fully unlocked during the trial period. Please consider buying the software to unlock full functionality forever.");
                    ui.find(".buy-product-button").removeClass("hidden");
                    ui.find(".activate-product-button").addClass("hidden");
                }

                // Trial has expired
                else {
                    var dayssinceexpiry = states.dayssinceexpiry;
                    if (ui.find(".status-heading").text().length == 0) console.log("Trial ended " + dayssinceexpiry + " days ago.");

                    ui.find(".status-heading").text("Trial expired");
                    ui.find(".status-text").text(dayssinceexpiry + " days ago");
                    ui.find(".status-message").text("The trial period has ended. Please consider buying the software to unlock full functionality.");
                    ui.find(".buy-product-button").removeClass("hidden");
                    ui.find(".activate-product-button").addClass("hidden");
                }
            }
            
            $(".activate-product-button").off("click").on("click", function () {
                console.log("Requesting to open window for activating product");
                self.ipcr.send('new-activate-product-window-request');
            });
        }

        // If subscription is active
        else {
            var ui = $(".inactive-subscription-notification");
            ui.addClass("hidden");
        }
    }

    self.process_new_serial_data = function (event, arg) {
        if(typeof arg.data == "string" && arg.data.length == 0) return;

        // Distinguish lines
        if (arg.data.indexOf("#!cereal-special-string#line-break##") == -1) global.states.linecomplete = false;
        else global.states.linecomplete = true;

        var text = arg.data ? arg.data.replace(/#!cereal-special-string#line-break##/g, "<br>") : "";

        //! Auto scroll to the bottom of the div
        if (global.states.autoscroll) { 
            var elem = document.getElementsByClassName("serial-monitor")[0];
            elem.scrollTop = elem.scrollHeight;
        }
        
        // // Add line breaks
        // if (!global.states.line) global.states.line = "";
        // if (!global.states.linecomplete) {
        //     global.states.line  += text;
        //     $(".serial-monitor").find(".session[session-id='" + sessionid + "']").find(".line").last().text(global.states.line);

        //     console.log(text, global.states.line);
        // }
        // else {
        //     // $(".serial-monitor").find(".session[session-id='" + sessionid + "']").find(".line[line-id='" + lineid + "']").text(global.states.line);

        //     // Add next line's placeholder
        //     var lineid = moment.now();
        //     if (arg.data.trim().length > 0) $(".serial-monitor").find(".session[session-id='" + sessionid + "']").find(".line").css("color", "#38dd38");
        //     $(".serial-monitor").find(".session[session-id='" + sessionid + "']").append(multiline(function() {/*
        //         <p class="line" line-id="{{line-id}}" session-id="{{session-id}}" style="color: {{color}}; word-break: break-word; margin-bottom: 2px;">{{data}}</p>
        //     */},{ 
        //         "session-id": sessionid,
        //         "line-id": lineid,
        //         "color": "gold",
        //         "data": ""
        //     }));
        //     setTimeout(() => { $(".serial-monitor").find(".session[session-id='" + sessionid + "']").find(".line[line-id='" + lineid + "']").css("color", "#38dd38"); }, 2000);
        //     global.states.line = "";
        // }

        // Hide skeleton
        $(".serial-monitor .skeleton-div").addClass("hidden");

        // Add line
        var lineid = moment.now();
        self.a.uiserialmonitor.addlinetoserialmonitor(lineid, text);

        //! Share the serial data online
        if (global.states.sharedonline) {

            self.a.sck.share_serial_data({ 
                "role": "source",
                "code": global.port.code,
                "machine-id": global.states.machineid,
                "session-id": global.states.sessionid,
                "line-id": lineid,
                "data": text
            });
        }
    }

    self.process_available_ports_list = function (event, data) {
        if (global.states.connected || global.states.upload) return;
            
        // If follow mode is on, connect to the device directly
        if (global.states.follow) {
            
            data.connecteddevices.forEach(aport => {
                var port = global.quickconnectport || global.port;
                
                if (aport.path == port.path) {
                    console.log("Requesting reconnection for: " + port.path + " on window ID: " + global.states.windowid);
                    self.ipcr.send('open-port-request', {
                        path: port.path,
                        baud: port.baud,
                        windowid: global.states.windowid,
                        ...port
                    });
                }
            });
        }

        // Show device selector page
        else {

            Object.keys(data).forEach(function (category, ci) {
                var parent = $(".device-selector-panel");
                var ui = parent.find("." + category + "-device-selector-list");
                
                if (data[category].length == 0) {
                    ui.find(".empty-notification").removeClass("hidden");
                    ui.find(".device-selector-list-item").remove();
                }
                else ui.find(".empty-notification").addClass("hidden");
        
                data[category].forEach(port => {
                    var port_original = port.path;
                    var baud = port.baud;
                    var devicename = port.friendlyName;
                    var nickname = port.nickname || "";
                    var pnpid = encodeURI(port.pnpId)
                    var favorite = port.favorite || false;

                    var title = "";
                    if (port.path.length > 10) {
                        port.path = port.path.substring(0, 6) + " ... " + port.path.substring(port.path.length - 10, port.path.length);
                        title = port_original;
                    }

                    //! Add device to the list if not already added
                    if (ui.find(".device-selector-list-item[pnp-id='" + pnpid + "']").length == 0) {
                        ui.append(multiline(function () {/*
                            <div class="col-auto shadow-heavy device-selector-list-item" name="{{name}}" nickname="{{nickname}}" favorited="{{favorited}}" baud="{{baud}}" port="{{port}}" manufacturer="{{manufacturer}}" uploaddelay="{{uploaddelay}}" serial-number="{{serial-number}}" pnp-id="{{pnp-id}}" title="{{title}}" 
                                style="background: #AAAAAA66; color: #eee; border-radius: 0px; padding: 2px 8px; margin-right: 10px; cursor: pointer; margin-bottom: 10px;">
                                <div style="font-size: 13px; color: #000">
                                    <span class="text">{{displayname}}</span>
                                    <i class="fas fa-link-slash broken-link-icon hidden" title="Device disconnected" style="color: #ffc10c; font-size: 11px; margin-left: 4px;"></i>
                                </div>
                            </div>
                        */},
                        { 
                            "name": devicename,
                            "displayname": nickname.length > 0 ? nickname : devicename,
                            "nickname": nickname,
                            "favorited": favorite,
                            "baud": baud || "null",
                            "port": port_original,
                            "manufacturer": port.manufacturer,
                            "uploaddelay": port.uploaddelay,
                            "serial-number": port.serialNumber || "N/A",
                            "pnp-id": pnpid,
                            "title": title
                        }));
            
                        // Click listener
                        ui.find(".device-selector-list-item[port='" + port_original + "']").off("click").click(function () {
                            var portnumber = $(this).attr("port");
                            var nickname = $(this).attr("nickname");
                            var name = $(this).attr("name");
                            var pnpid = $(this).attr("pnp-id");
                            var favorited = $(this).attr("favorited");
                            var manufacturer = $(this).attr("manufacturer");
                            var uploaddelay = $(this).attr("uploaddelay");
                            var serialnumber = $(this).attr("serial-number");
                            var baud = $(this).attr("baud");

                            //! Selected device information panel
                            parent.find(".device-selected-info-row").remove();
                            $(this).after(multiline(function() {/*
                                
                                <!-- Device information subpanel -->
                                <div class="row device-selected-info-row" style="margin-top: -10px;width: 100%;max-width: 450px;margin-left: -13px;">
                                    <div class="col-12" style="padding: 10px 12px; margin-right: 6px;">
                                        
                                        <div style="padding: 4px 6px; background-color: #1d1d1d; margin-bottom: 0px;">
                                            <p style="font-size: 11px; color: #AAA; margin: 4px 10px -4px 10px;">Name</p>
                                            <p class="selected-device-name" style="font-size: 12px; color: #CCC; font-weight: bold; margin: 4px 10px 12px 10px;">-</p>

                                            <p style="font-size: 11px; color: #AAA; margin: 4px 10px -4px 10px;">Nickname</p> 
                                            <input class="selected-device-nickname" value="" type="text" style="font-size: 12px; width: 130px; text-align: left; background: transparent; outline: 0; border: 0; margin-bottom: 12px; margin-left: 14px; border-bottom: 1px solid #63636388; padding: 0 0px 0 2px; color: #98C379;">

                                            <p style="font-size: 11px; color: #AAA; margin: 4px 10px -4px 10px;">Upload delay</p> 
                                            <input class="selected-device-upload-delay" value="10" type="number" style="font-size: 12px; width: 130px; text-align: left; background: transparent; outline: 0; border: 0; margin-bottom: 12px; margin-left: 14px; border-bottom: 1px solid #63636388; padding: 0 0px 0 2px; color: #98C379; placeholder="Upload delay in seconds">

                                            <p style="font-size: 11px; color: #AAA; margin: 4px 10px -4px 10px;">Manufacturer</p>
                                            <p class="selected-device-manufacturer" style="font-size: 12px; color: #CCC; font-weight: bold; margin: 4px 10px 12px 10px;">-</p>
                                            
                                            <div class="set-favorite-button" title="Set as favorite" state="favorited" style="cursor: pointer; display: inline-flex; margin: 0px 10px 6px 6px; background-color: #111111; border-radius: 0px; padding: 3px 12px 3px 8px;">
                                                <i class="fas fa-heart" style="font-size: 11px;color: rgba(210, 41, 31, 0.83);margin-right: 4px;margin-top: 2px;"></i>
                                                <span style="font-size: 11px;color: #BBB;">Remove from favorites</span>
                                            </div>
                                        </div>

                                        <div style="padding: 8px 6px; background-color: #2b2b2b; margin-bottom: 0px;">
                                            <p style="font-size: 13px; color: #AAA; margin: 0px 10px 0px 10px;"><span class="selected-device-port-name" style="color: #98C379; font-weight: bold;"></span> at baud 
                                                <select class="selected-baud-rate" style="width: 90px; text-align: center; background: transparent; outline: 0; border: 0; border-bottom: 1px solid #EEEEEE88; padding: 0 0px 0 2px; color: #98C379;"> 
                                                    <option value="300" style="color: #2b2b2b;">300</option>    
                                                    <option value="1200" style="color: #2b2b2b;">1200</option>    
                                                    <option value="2400" style="color: #2b2b2b;">2400</option>    
                                                    <option value="4800" style="color: #2b2b2b;">4800</option>    
                                                    <option value="9600" style="color: #2b2b2b;" selected>9600</option>    
                                                    <option value="19200" style="color: #2b2b2b;">19200</option>    
                                                    <option value="38400" style="color: #2b2b2b;">38400</option>    
                                                    <option value="57600" style="color: #2b2b2b;">57600</option>    
                                                    <option value="74880" style="color: #2b2b2b;">74880</option>    
                                                    <option value="115200" style="color: #2b2b2b;">115200</option>    
                                                    <option value="500000" style="color: #2b2b2b;">500000</option>    
                                                    <option value="1000000" style="color: #2b2b2b;">1000000</option>    
                                                    <option value="2000000" style="color: #2b2b2b;">2000000</option>    
                                                </select>
                                                bps.
                                            </p>

                                            <div style="display: inline-flex; margin-top: 6px; padding: 2px 10px 4px 10px;">
                                                <div class="col-auto shadow selected-device-connect" style="background: #03757b; color: #eee; border-radius: 0px; padding: 1px 8px; margin-right: 10px; margin-bottom: 10px; cursor: pointer; margin-bottom: 2px; margin-right: 10px;">
                                                    <span class="" style="font-size: 12px; color: #FFF" >Connect</span>
                                                </div>
                                                <div class="col-auto shadow selected-device-discard" style="background: #484848; color: #eee; border-radius: 0px; padding: 1px 8px; margin-right: 10px; margin-bottom: 10px; cursor: pointer; margin-bottom: 2px;">
                                                    <span class="" style="font-size: 12px; color: #EEE">Cancel</span>
                                                </div>
                                            </div>

                                            <div class="hidden" style="margin-top: 6px; padding: 2px 10px 4px 10px;">
                                                <div class="col-auto shadow" style="color: #eee; border-radius: 0px; padding: 0px; margin-right: 10px; margin-bottom: 10px; margin-bottom: 2px; margin-right: 10px;">
                                                    <p style="font-size: 14px; color: #a7a7a7; margin-top: 0px; margin-bottom: 6px;">Or, if you want to flash GatorByte firmware, please click on the button below.</p>
                                                    <div class="flash-firmware-button" title="Flash firmware" style="cursor: pointer; padding: 4px 8px; font-size: 13px; color: rgb(255, 255, 255); background: #58410d; width: fit-content; margin-right: 10px; margin-top: 10px; margin-left: -1px;">Flash firmware</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            */}));

                            parent.find(".device-selected-info-row").find(".selected-device-port-name").text(portnumber);
                            parent.find(".device-selected-info-row").find(".selected-device-connect").attr("port", portnumber).attr("pnp-id", pnpid);
                            parent.find(".device-selected-info-row").find(".selected-device-name").text(name || "N/A");
                            parent.find(".device-selected-info-row").find(".selected-device-nickname").attr("placeholder", nickname || "Not set yet").val(nickname || "");
                            parent.find(".device-selected-info-row").find(".selected-device-upload-delay").val(uploaddelay || "10");
                            parent.find(".device-selected-info-row").find(".selected-device-manufacturer").text(manufacturer || "N/A");
                            parent.find(".device-selected-info-row").find(".set-favorite-button").attr("state", favorited == "true" ? "favorited" : "unfavorited");
                            parent.find(".device-selected-info-row").find(".set-favorite-button").find("i").css("color", favorited == "true" ? "#d2291fd4" : "#272727");
                            parent.find(".device-selected-info-row").find(".set-favorite-button").find("span").text(favorited == "true" ? "Remove from favorites" : "Add to favorites");
                            
                            // Auto select baud rate
                            parent.find(".device-selected-info-row").find(".selected-baud-rate").val(baud);

                            parent.find(".device-selected-info-row").find(".selected-device-connect").off("click").click(function () {
                                
                                console.log("Requesting connection for: " + portnumber + " (" + parent.find(".device-selected-info-row").find(".selected-baud-rate").val() + " bps) on window ID: " + global.states.windowid);
                                self.ipcr.send('open-port-request', {
                                    path: portnumber,
                                    ...port,
                                    windowid: global.states.windowid,
                                    baud: parseInt(parent.find(".selected-baud-rate").val()),
                                    nickname: nickname
                                });
                            });

                            parent.find(".device-selected-info-row").find(".set-favorite-button").off("click").click(function () {
                                var newstate;
                                if ($(this).attr("state") == "favorited") {
                                    newstate = "unfavorited";
                                    $(this).attr("state", "unfavorited");
                                    $(this).find("i").css("color", "#272727");
                                    $(this).find("span").text("Add to favorites");
                                }
                                else  {
                                    newstate = "favorited";
                                    $(this).attr("state", "favorited");
                                    $(this).find("i").css("color", "#d2291fd4");
                                    $(this).find("span").text("Remove from favorites");
                                }
                                
                                console.log("Setting port " + portnumber + " as " + (newstate == "favorited" ? "favorite." : "not favorite."));

                                self.ipcr.send('set-favorite-request', {
                                    path: portnumber,
                                    baud: parseInt(parent.find(".device-selected-info-row").find(".selected-baud-rate").val()),
                                    windowid: global.states.windowid,
                                    ...port,
                                    favorite: newstate == "favorited",
                                    nickname: nickname
                                });
                            });

                            parent.find(".device-selected-info-row").find(".selected-device-nickname").off("keyup").keyup(self.f.debounce(function () {
                                console.log("Setting nickname to " + parent.find(".device-selected-info-row").find(".selected-device-nickname").val());
                                self.ipcr.send('set-device-nickname', {
                                    path: portnumber,
                                    ...port,
                                    nickname: parent.find(".device-selected-info-row").find(".selected-device-nickname").val()
                                });
                            }, 1000));

                            parent.find(".device-selected-info-row").find(".selected-device-upload-delay").off("keyup").keyup(self.f.debounce(function () {
                                var value = parent.find(".device-selected-info-row").find(".selected-device-upload-delay").val();
                                value = value && value.length > 0 ? parseInt(value) : 10;
                                $(this).val(value);
                                global.states.uploaddelay = value;

                                console.log("Setting upload delay to " + value);
                                self.ipcr.send('set-device-uploaddelay', {
                                    path: portnumber,
                                    ...port,
                                    uploaddelay: value
                                });
                            }, 1000));

                            parent.find(".device-selected-info-row").find(".selected-baud-rate").off("change").change(self.f.debounce(function () {
                                console.log("Changing baud rate to " + parent.find(".device-selected-info-row").find(".selected-baud-rate").val());
                                self.ipcr.send('set-device-baud-rate', {
                                    path: portnumber,
                                    ...port,
                                    baud: parent.find(".device-selected-info-row").find(".selected-baud-rate").val()
                                });
                            }, 100));
                            
                            parent.find(".device-selected-info-row").find(".selected-device-discard").off("click").click(function () {
                                parent.find(".device-selected-info-row").addClass("hidden");

                                $(".status-bar-div .device-status-indicator").css("background-color", "#444444");
                                $(".status-bar-div .device-status-indicator .connected-device-port").text("N/A");
                            });
            
                        });
                    }
                    //! If the device is already in the list, update the item's ui
                    else {
                        var listitem = ui.find(".device-selector-list-item[pnp-id='" + pnpid + "']");
                        
                        listitem
                            .attr("name", devicename)
                            .attr("nickname", nickname)
                            .attr("favorite", favorite)
                            .attr("baud", baud)
                            .find(".text").text(nickname.length > 0 ? nickname : devicename)
                    }
                });
                
                //! If a device is in the list, check if the device is connected
                ui.find(".device-selector-list-item").each(function (ei, el) {

                    $(el).css({
                        "pointer-events": "auto"
                    })
                    $(el).find(".broken-link-icon").addClass("hidden")
                    $(el).find(".text").css({
                        "opacity": "1",
                    });

                    var found = false;
                    data["connecteddevices"].forEach(connecteddevice => {
                        if ($(el).attr("pnp-id") == encodeURI(connecteddevice.pnpId)) found = true;
                    });

                    if (!found) {
                        $(el).css({
                            "pointer-events": "auto"
                        });
                        $(el).find(".broken-link-icon").removeClass("hidden");
                        $(el).find(".text").css({
                            "opacity": "0.8",
                        });
                    }
                })
            }) 
        }
    }

    self.on_port_selected = function (event, response) {
        
        // Get bootstap data and update UI
        self.ipcr.send('bootstrap-data-request', {
            windowid: global.states.windowid,
            windowtype: global.states.windowtype
        });

        // Clear intervals
        if (global.timers.waitingforupload) clearInterval(global.timers.waitingforupload);
        if (global.timers.waitingforuploadcounter) clearInterval(global.timers.waitingforuploadcounter);
        if (global.timers.waitingforuploadcounterclear) clearInterval(global.timers.waitingforuploadcounterclear);

        // If the port was available and a connection is established
        if(response.success && response.error == null) {

            console.log("Connected to port " + response.path);

            global.states.connected = true;
            global.port = response;
            if (!global.states.follow) {
                console.log("Setting autoscroll to on");
                self.a.ui.toggleautoscroll("on");
            }
            global.states.follow = true;
            global.states.sessionid = moment.now();
            global.states.upload = false;
            global.states.uploaddelay = global.port.uploaddelay;

            if (global.states.autoclear) {
                $(".session").remove();
                $(".serial-monitor .skeleton-div").removeClass("hidden");
            }

            var baud = response.baud;

            // Set up UI elements
            if ($(".home-panel").attr("first-load-done") != "true") $(".home-panel").removeClass("disabled").removeClass("hidden").attr("first-load-done", "true");
            $(".waiting-for-device-notification").addClass("hidden");
            $(".device-not-available-overlay").slideUp(100);
            $(".waiting-for-pong-overlay").slideUp(0).removeClass("hidden").slideDown(150);
            $(".home-panel").addClass("disabled").addClass("blur");
            $(".status-bar-div .device-status-indicator").attr("prev-background-color", $(".status-bar-div .device-status-indicator").css("background-color")).css("background-color", "#1c65ca");
            $(".status-bar-div .device-status-indicator .connected-device-port").text(response.path);
            $(".follow-device-button").attr("state", "true").css("background", "#005c8a");
            
            // Set port name and baud rate in view
            $(".connected-device-port").text(response.path).attr("title", response.path + " at " + baud + " bps");
            if ($(".command-input-div").attr("state") == "shown") self.a.ui.toggle_command_input_ui("show");
            else  self.a.ui.toggle_command_input_ui("hide");

            // Hide upload mode ui if reconnected
            $(".update-mode-overlay").addClass("hidden");
            $(".update-mode-overlay .stage-1").removeClass("hidden");
            $(".update-mode-overlay .stage-2").addClass("hidden");

            // Truncate port name if required
            if (response.path && response.path.length > 10) {
                response.path = response.path.substring(0, 3) + " ... " + response.path.substring(response.path.length - 4, response.path.length)
            }

            $(".follow-device-button").off("click").click(function () {
                if ($(this).attr("state") == "false") {
                    $(this).attr("state", "true").css("background", "#005c8a");
                    global.states.follow = true;
                }
                else {
                    global.states.follow = false;
                    $(this).attr("state", "false").css("background", "#333");
                }
                if (global.states.sharedonline) self.a.sck.share_state();
            });

            // Send ping to device
            self.ipcr.send('send-command-request', {
                command: "gdc-ping",
                windowid: global.states.windowid,
                path: global.port.path
            });

            $(".auto-scroll-button").off("click").click(function () {
                if ($(this).attr("state") == "false" || $(this).attr("state") == "paused") {
                    self.a.ui.toggleautoscroll("on");
                }
                else {
                    self.a.ui.toggleautoscroll("off");
                }

                if (global.states.sharedonline) self.a.sck.share_state();
            });

            // Turn on live share
            $(".share-online-button").off("click").click(function () {

                function stop_live_share() {
                    $(".share-online-button").attr("state", "false").css("background", "#2A2A2A");
                    
                    // Share the state one last time
                    self.a.sck.share_state();

                    // Leave room
                    self.a.sck.leave_source_room();
                    
                    // Turn off live share
                    global.states.sharedonline = false;

                    // Stop the timer that shares the state to the clients
                    if (global.timers.sharestate) clearInterval(global.timers.sharestate);
                    if (global.timers.clientscounter) clearInterval(global.timers.clientscounter);

                    // Delete timers
                    delete global.timers.livesharefiveminutetimer;
                    delete global.timers.livesharefiveminutetimercounter;

                    // Update UI
                    $(".share-online-overlay").addClass("hidden");
                    $(".share-online-overlay .live-share-code").addClass("hidden");
                    $(".share-online-button .connected-clients-info-div").addClass("hidden").find(".connected-clients-text").text("0");
                }

                // If functionality is locked
                if (!global.states.subscription["computed-states"]["full-functionality"]) {
                    var timeout = 10 * 60 * 1000;

                    if (!global.timers.livesharefiveminutetimer) {
                        
                        self.a.ui.show_functionality_locked_overlay({
                            "code": "live-share"
                        });
                        
                        global.timers.livesharefiveminutetimer = setTimeout(function () {
                            clearTimeout(global.timers.livesharefiveminutetimer);
                            clearTimeout(global.timers.livesharefiveminutetimercounter);
                            $(".share-online-overlay").find(".functionality-locked-timer").addClass("hidden");
                            stop_live_share();
                        }, timeout);

                        // Show remaining time in UI
                        var counter = timeout;
                        global.timers.livesharefiveminutetimercounter = setInterval(function () {
                            counter -= 1000;
                            $(".share-online-overlay").find(".functionality-locked-timer").removeClass("hidden").text(multiline(function () {/* 
                                Session will end in {{minutes}} minutes {{seconds}} seconds.
                            */}, {
                                minutes: parseInt(counter / 1000 / 60),
                                seconds: parseInt(counter / 1000 % 60)
                            }))
                        }, 1000);
                    }
                }

                // Turn on live share and set UI
                $(this).attr("state", "true").css("background", "#773447");
                global.states.sharedonline = true;

                // Join socketIO room in 'source' role
                self.a.sck.join_source_room();

                // Start periodically sending state data to all connected clients
                self.a.sck.share_state();
                global.timers.sharestate = setInterval(() => {
                    
                    // Share app state
                    self.a.sck.share_state();

                    // Share port status
                    self.a.sck.share_port_status(global.portstatus);
                }, 5000);

                // Periodically get number of client connections
                self.a.sck.get_clients_count();
                global.timers.clientscounter = setInterval(() => {
                    self.a.sck.get_clients_count();
                }, 5000);

                // Generate code if this is first time sharing the port online; else get the code from storage
                var code = "";
                if (!global.port.code) {

                    // Generate a code
                    code = self.f.adj_noun_generate().join(":");
                    global.port.code = code;

                    // Save the code to storage
                    self.ipcr.send('set-live-share-code-request', {
                        ...global.port,
                    });
                }
                else code = global.port.code;

                $(".share-online-button .connected-clients-info-div").removeClass("hidden");
                $(".share-online-overlay .live-share-url").text(global.states.remoteurl).attr("location", global.states.remoteurl);
                $(".share-online-overlay .live-share-code").removeClass("hidden").html(multiline(function () {/*
                    <span class="first-word" style="font-size: 18px;color: #7fcae7f5;margin-top: -4px;margin-bottom: 6px; margin-right: 6px;">{{first-word}}</span>
                    <span class="second-word" style="font-size: 18px;color: #7fcae7f5;margin-top: -4px;margin-bottom: 6px; margin-right: 6px;">{{second-word}}</span>
                    <span class="third-word" style="font-size: 18px;color: #7fcae7f5;margin-top: -4px;margin-bottom: 6px; margin-right: 6px;">{{third-word}}</span>
                    <span class="fourth-word" style="font-size: 18px;color: #7fcae7f5;margin-top: -4px;margin-bottom: 6px; margin-right: 6px;">{{fourth-word}}</span>
                */}, {
                    "first-word": code.split(":")[0],
                    "second-word": code.split(":")[1],
                    "third-word": code.split(":")[2],
                    "fourth-word": code.split(":")[3],
                }));
                $(".share-online-overlay").removeClass("hidden");

                $(".share-online-overlay .live-share-url").off("click").click(function () {
                    var url = $(this).attr("location");

                    self.ipcr.send("open-url-request", {
                        windowid: global.states.windowid,
                        path: global.port.path,
                        url: url
                    })
                });

                $(".share-online-overlay .close-button").off("click").click(function () {
                    $(".share-online-overlay").addClass("hidden");
                });

                // Stop live share
                $(".share-online-overlay .stop-button").off("click").click(function () {
                    stop_live_share();
                });
            });

            // Enter upload mode
            $(".enter-upload-mode-button").off("click").click(function () {
                global.states.follow = true;
                global.states.upload = true;
                global.states.connected = false;

                // Set UI
                $(".update-mode-overlay .stage-1").addClass("hidden");
                $(".update-mode-overlay .stage-2").removeClass("hidden");
                $(".update-mode-overlay .stage-2").find(".delay-text").text((global.states.uploaddelay) + " seconds");

                var uploaddelay = global.states.uploaddelay;
                var counter = uploaddelay;

                global.timers.waitingforuploadcounter = setInterval(() => {
                    $(".update-mode-overlay .stage-2").find(".delay-text").text((--counter) + " seconds");
                }, 1000);

                global.timers.waitingforuploadcounterclear = setTimeout(() => {
                    clearInterval(global.timers.waitingforuploadcounter);
                }, global.states.uploaddelay * 1000);

                // Add 5 seconds
                $(".update-mode-overlay .add-time-button").off("click").click(function () {
                    
                    // If functionality is locked
                    if (!global.states.subscription["computed-states"]["full-functionality"]) {
                        self.a.ui.show_functionality_locked_overlay({
                            "code": "add-time-to-upload-delay"
                        });
                        return;
                    }

                    // Add 6 seconds (so that it look like 5 to the user in the UI) to the counter
                    counter += 6;

                    if (global.timers.waitingforupload) clearInterval(global.timers.waitingforupload);
                    global.timers.waitingforupload = setTimeout(() => {
                        console.log("Requesting reconnection for: " + global.port.path + " on window ID: " + global.states.windowid);
                        self.ipcr.send('open-port-request', {
                            path: global.port.path,
                            baud: global.port.baud,
                            windowid: global.states.windowid,
                            ...global.port
                        });
                    
                        // Clear intervals
                        if (global.timers.waitingforupload) clearInterval(global.timers.waitingforupload);
                        if (global.timers.waitingforuploadcounter) clearInterval(global.timers.waitingforuploadcounter);
                        if (global.timers.waitingforuploadcounterclear) clearInterval(global.timers.waitingforuploadcounterclear);
                    }, counter * 1000);

                    if (global.timers.waitingforuploadcounterclear) clearTimeout(global.timers.waitingforuploadcounterclear);
                    global.timers.waitingforuploadcounterclear = setTimeout(() => {
                        clearInterval(global.timers.waitingforuploadcounter);
                    }, counter * 1000);
                });

                // Connect right now
                $(".update-mode-overlay .connect-now-button").off("click").click(function () {
                    counter += 0;
                    if (global.timers.waitingforupload) clearInterval(global.timers.waitingforupload);
                    if (global.timers.waitingforuploadcounterclear) clearTimeout(global.timers.waitingforuploadcounterclear);

                    console.log("Requesting reconnection for: " + global.port.path + " on window ID: " + global.states.windowid);
                    self.ipcr.send('open-port-request', {
                        path: global.port.path,
                        baud: global.port.baud,
                        windowid: global.states.windowid,
                        ...global.port
                    });
                });

                // Close the port
                self.ipcr.send('close-port-request', {
                    path: global.port.path,
                    baud: global.port.baud,
                    windowid: global.states.windowid
                });

                // Share state with the live share clients
                if (global.states.sharedonline) self.a.sck.on_port_upload_mode();
            });

            // Clear interval for checking port connection    
            clearInterval(global.timers.portsrefresh);

            self.a.ui.on_port_connected();
        }

        // If the port in available but busy
        else if (response.error != null) {
            console.log("Port " + response.path + " is busy.");
            global.port = response;
            
            $(".status-bar-div .device-status-indicator").attr("prev-background-color", $(".status-bar-div .device-status-indicator").css("background-color")).css("background-color", "#b32a2a");
            $(".status-bar-div .device-status-indicator .connected-device-port").text("Port busy");

            // Hide upload mode ui if not successfull
            $(".update-mode-overlay").addClass("hidden");
            $(".update-mode-overlay .stage-1").removeClass("hidden");
            $(".update-mode-overlay .stage-2").addClass("hidden");
        }
        
        // If port is not avaialble (but device not connected to the PC)
        else {
            console.log("Port not available. Waiting on " + response.path);
            global.port = response;
            global.states.connected = false;
            global.states.follow = true;

            // Set port name and baud rate in view
            $(".connected-device-port").text(response.path).attr("title", response.path + " at " + response.baud + " bps");

            $(".show-on-connected").addClass("hidden");
            $(".serial-monitor .waiting-for-device-notification").removeClass("hidden");
            $(".device-not-available-overlay").slideUp(0).removeClass("hidden").slideDown(150);
            $(".waiting-for-pong-overlay").slideUp(0);
            
            // Hide all panels
            $(".panel").addClass("hidden");

            $(".status-bar-div .device-status-indicator").attr("prev-background-color", $(".status-bar-div .device-status-indicator").css("background-color")).css("background-color", "#af8302");
            $(".home-panel").addClass("disabled").removeClass("hidden").addClass("blur");
            // $(".home-panel").addClass("hidden");
            // $(".serial-monitor").removeClass("hidden");
        }

        // GatorByte info
        $(".gb-serial-number").text(global.port.serialNumber || "-");
        $(".gb-product-id").text(global.port.productId || "-");
        $(".gb-product-manufacturer").text(global.port.manufacturer || "-");
        $(".gb-port-path").text(global.port.path);

        $.ajax({
            url: "https://api.ezbean-lab.com/v3/gatorbyte/device/registration/get",
            type: "POST",
            data: '{ "sn": "' + global.port.serialNumber + '" }',
            success: function (response) {
                if (response.status == "success") {
                    $(".gb-registered-to").text(response.payload["REGISTERED_TO"]);
                    $(".register-gb-ui").addClass("hidden");
                }
            },
            error: function (x, h, r) {
                $(".gb-registered-to").text("Not registered.");
                $(".register-gb-ui").removeClass("hidden");
            }
        });

        // Broadcast the port information to all live share clients
        self.a.sck.on_port_selected(response); 
    }

    self.on_port_disconnected = function (event, response) {
        if(!response) return;

        /* 
            Port disconnected, but follow mode is on and Cereal is waiting for the device to reconnect
        */
        if (global.states.follow && !global.states.upload) {
            
            // Set connection state
            global.states.connected = false;
            
            console.log("Disconnected port " + (global.port.path || global.quickconnectport.path) + ". Waiting for reconnection.");

            $(".waiting-for-device-notification").removeClass("hidden");
            $(".device-not-available-overlay").slideUp(0).removeClass("hidden").slideDown(150);

            // Hide all panels
            $(".panel").addClass("hidden");
            
            $(".waiting-for-pong-overlay").slideUp(0);
            $(".status-bar-div .device-status-indicator").attr("prev-background-color", $(".status-bar-div .device-status-indicator").css("background-color")).css("background-color", "#af8302");
            $(".status-bar-div .device-status-indicator .connected-device-port").text((global.port.path || global.quickconnectport.path));
            $(".home-panel").addClass("disabled").removeClass("hidden").addClass("blur");
        }
        
        /* 
            Cereal in "Upload mode"; follow mode is on and Cereal is waiting for the specified time before reconnecting
        */
        else if (global.states.follow && global.states.upload) {
            
            // Set connection state
            global.states.connected = false;

            $(".home-panel").addClass("hidden").removeClass("blur");
            $(".serial-monitor").removeClass("hidden");
            $(".waiting-for-device-notification").removeClass("hidden");
            $(".device-not-available-overlay").slideUp(0).removeClass("hidden").slideDown(150);
            
            // Hide all panels
            $(".panel").addClass("hidden");

            $(".waiting-for-pong-overlay").slideUp(0);
            $(".status-bar-div .device-status-indicator").attr("prev-background-color", $(".status-bar-div .device-status-indicator").css("background-color")).css("background-color", "#af8302");
            $(".status-bar-div .device-status-indicator .connected-device-port").text(global.port.path);

            // Initialize timer to reconnect after a delay
            global.timers.waitingforupload = setTimeout(() => {
                console.log("Requesting reconnection for: " + global.port.path + " on window ID: " + global.states.windowid);
                self.ipcr.send('open-port-request', {
                    path: global.port.path,
                    baud: global.port.baud,
                    windowid: global.states.windowid,
                    ...global.port
                });
            }, parseInt(global.states.uploaddelay) * 1000);
        }

        /*
            Device disconnected and follow mode is off. Exit the serial monitor view
        */
        else if (!global.states.follow && !global.states.upload) {

            if (global && global.port) {
                console.log("Disconnected port " + global.port.path + ".");
                delete global.port;
            }

            // Turn off live share state updates to connected clients
            if (global.states.sharedonline) clearInterval(global.timers.sharestate);

            // Set connection state
            global.states.connected = false;
            
            // Clear timers
            if (global.timers.livesharefiveminutetimer) clearInterval(global.timers.livesharefiveminutetimer);
            delete global.timers.livesharefiveminutetimer;
            if (global.timers.livesharefiveminutetimercounter) clearInterval(global.timers.livesharefiveminutetimercounter);
            delete global.timers.livesharefiveminutetimercounter;
            
            // Turn off power saver
            if (global.states.powersaveid != undefined && self.pwrsv.isStarted(global.states.powersaveid)) {
                console.log('Power saving turned off');
                self.pwrsv.stop(global.states.powersaveid);
            }

            // Show device selector panel
            $(".panel").addClass("hidden");
            $(".device-selector-panel").removeClass("hidden");
            $(".home-panel").removeAttr("first-load-done");
            $(".home-panel").addClass("disabled").addClass("hidden").addClass("blur");

            $(".connected-device-port").text("N/A").attr("title", "");
            setTimeout(() => { $(".connected-device-port").parent().css("background", "#444"); }, 100);
            $(".device-selector-panel .device-list-row").removeClass("hidden");
            
        }

        // Restart the interval timer to get ports list from the main process
        if (global.timers.portsrefresh) clearInterval(global.timers.portsrefresh);
        global.timers.portsrefresh = setInterval(() => { self.ipcr.send('get-available-ports-request'); }, 2000);

        // Add a disconnection notification in the serial monitor
        var sessionid = global.states.sessionid;
        $(".serial-monitor .skeleton-div").addClass("hidden");

        // If the session doesn't exist, create it
        if ($(".serial-monitor").find(".session[session-id='" + sessionid + "']").length == 0) {
            $(".serial-monitor").find(".session .line").css("color", "#bbbbbb");
            $(".serial-monitor").append(multiline(function() {/*
            
                <div class="session" session-id="{{session-id}}" style="margin-bottom: 8px;padding: 8px 14px 8px 10px;background: #22222200; border-left: 3px solid #44444400;">
                    <p style="color:#da6565; border-bottom: 1px solid #444444AA">
                        <span style="color:#da6565; font-size: 11px;">{{datetime}}</span>, 
                        <span style="color:#da6565; font-size: 11px;">{{devicename}}</span>
                    </p>
                </div>
            */},{ 
                "datetime": sessionid ? moment(parseInt(sessionid)).format("DD-MM-YY, hh:mm:ss a").toUpperCase() : "-",
                "session-id": sessionid,
                "devicename": global.port ? global.port.friendlyName : ""
            }));
        }

        // Add line to the serial monitor display
        var lineid = moment.now();
        $(".serial-monitor").find(".session[session-id='" + sessionid + "']").append(multiline(function() {/*
            <p class="message" line-id="{{line-id}}" style="color: {{color}}; font-size: 11px; margin-top: 4px;">{{data}}</p>
        */},{ 
            "session-id": sessionid,
            "line-id": lineid,
            "color": "#888888",
            "data": "Device disconnected on " + (moment(moment.now()).format("DD-MM-YY, hh:mm:ss a").toUpperCase())
        }));
        
        // Set up UI
        self.a.ui.on_port_disconnected();
        
        // Broadcast the port information to all live share clients
        self.a.sck.on_port_disconnected(); 
    }

    self.process_update_data = function (event, data) {
        global.states.update = data;

        // Prep UI
        $(".update-installation-notification").addClass("hidden");

        // If update information not available (probably because the app was never connected to the internet in the past)
        if (global.states.update["latest-version"] == null) {
            console.log("Please connect to the internet to check for the latest version.");
        }
        else {
            // If update available
            if (global.states.update && global.states.update["update-available"]) {
                console.log("Update available. Current: " + global.states.update["app-version"] + ". Latest: " + global.states.update["latest-version"]);
                $(".update-notification").removeClass("hidden");
                $(".update-notification").find(".update-version-text").text(global.states.update["latest-version"]);
                $(".update-notification").find(".current-version-text").text(global.states.update["current-version"]);

                if (global.states.update["file-url"]) {
                    $(".update-notification").off("click").click(function () {
                        self.ipcr.send("download-update-request", {
                            url: global.states.update["file-url"],
                            windowid: global.states.windowid,
                            properties: {}
                        });
                    })
                }
                else {
                    $(".update-notification").off("click").click(function () {

                    })
                }
            }
            else if (global.states.update && !global.states.update["update-available"]) {
                console.log("You have the latest version. Latest: " + global.states.update["latest-version"]);
                $(".update-notification").addClass("hidden");
            }
        }
    }

    self.process_update_installation_data = function (event, data) {

        // Prep UI
        $(".update-installation-notification").removeClass("hidden");

        $(".update-installation-notification").off("click").click(function () {
            self.ipcr.send("install-update-request", data);
        });
    }

    self.process_update_installation_response = function (event, data) {

        // Prep UI
        $(".update-installation-notification").removeClass("hidden");
        $(".update-installation-notification").find(".caution-text").html(multiline(function () {/*
            <span>Installation failed <i class="fas fa-times" style="color: #da0101; margin-left: 4px; margin-right: 6px;"></i></span>
        */}, 
        {
            "error-code": ""
        }));

    }

    self.process_download_progress = function (event, response) {
        var percent = response.percent;
        $(".update-notification").find(".update-progress-text").removeClass("hidden").html(multiline(function () {/*
                Downloaded {{percent}}%
            */
        }, {
            "percent": parseInt(parseFloat(percent) * 100) 
        }));

        if (percent == 1) {
            $(".update-notification").find(".update-progress-text").html(multiline(function () {/*
                <span>Download complete <i class="fas fa-check" style="color: green; margin-left: 4px; margin-right: 6px;"></i></span><br>
                <span class="preparing-for-install-notification-text">Preparing to install <i class="fas fa-hourglass-start rotate-animation" style="color: chocolate; margin-left: 4px; margin-right: 6px;"></i></span>
            */}));

            setTimeout(() => {
                $(".update-notification").find(".preparing-for-install-notification-text").addClass("hidden");
                $(".update-notification").addClass("hidden");
                $(".update-installation-notification").removeClass("hidden");
            }, 5000);
        }
    }

}