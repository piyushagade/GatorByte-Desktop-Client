function uisubapp(){
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
        $(".device-selector-panel").removeClass("hidden");
    
        // //! Auto-hide menu
        // setTimeout(() => { $(".menu-buttons-div").fadeOut(400).addClass("hidden").fadeIn(0); }, 1500);
        // $(".container").off("mouseenter").mouseenter(function () {
        //     $(".menu-buttons-div").removeClass("hidden");
        // });
        // $(".container").off("mouseleave").mouseleave(function () {
        //     $(".menu-buttons-div").addClass("hidden");
        // });
        
        $('.serial-monitor').mousewheel(function(event) {
            var up = event.deltaY > 0;
            var down = event.deltaY < 0;

            var element = document.getElementsByClassName("serial-monitor")[0];
            var amount = element.scrollHeight - element.scrollTop - element.clientHeight;

            if (
                $(".auto-scroll-button").attr("state") == "true" || 
                $(".auto-scroll-button").attr("state") == "paused"
            ) {
                if (amount >= 50) {
                    global.states.autoscroll = false;
                    $(".auto-scroll-button").attr("state", "paused").css("background", "#7b6308");
                }
                else {
                    global.states.autoscroll = true;
                    $(".auto-scroll-button").attr("state", "true").css("background", "#5c6d17");
                }
            }
            // if (up && element.scrollTop = element.scrollHeight)
        });

        // Window height adjustment on resize
        global.timers.windowresize = setInterval(function () { self.update_ui_dimensions(false); }, 100);

        // Start listeners
        self.listeners();

        return self;
    }
    
    self.on_port_disconnected = function () {
        
        // Hide status bar icons
        $(".status-bar-item.show-on-connected").addClass("hidden");

        // Hide line options
        $(".line-options-overlay").attr("state", "hidden").addClass("hidden");
        
    }

    self.on_port_connected = function () {

        // Show status bar icons
        $(".status-bar-item.show-on-connected").removeClass("hidden");

        // Hide command input
        if ($(".command-input-div").attr("state") == "hidden") {
            $(".command-input-div").addClass("hidden").attr("state", "hidden");
            $(".status-bar-item.input-button").css("background", "transparent");
            $(".status-bar-item.input-button").find("i").css("color", "#EEE");
        }

        // Input button listener
        $(".status-bar-item.input-button").off("click").click(function () {
            self.toggle_command_input_ui();
        });

        $(".waiting-for-device-panel").addClass("hidden");
        $(".device-selector-panel").addClass("hidden");

        global.states.powersaveid = self.pwrsv.start('prevent-app-suspension');
        if (global.states.powersaveid != undefined) console.log('Power saving turned on');
    }

    self.update_ui_dimensions = function () {
        $("body").css("width", $(window).width());
        $(".container").css("width", $(window).width());
        $(".device-selector-panel").height($(".container").height() - 30);
        
        // Re-set serial-monitor container height
        var containerheight = $(".container").height() - 30;
        var pinnedoverlayheight = $(".pinned-lines-overlay").hasClass("hidden") ? 0 : parseInt($(".pinned-lines-overlay").css("height")) + 15;
        $(".serial-monitor").css("height", containerheight - pinnedoverlayheight);
    }

    self.auto_scroll = function () {
        var scrolled = false;
        
        setInterval(updateScroll, 5)
        function updateScroll(){
            var element = document.getElementsByClassName("serial-monitor")[0];
            if (!scrolled) element.scrollTop = element.scrollHeight;
            if (Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 10) scrolled = false;
        }

        $(".serial-monitor").on('scroll', function(){
            userscrolled = true;
            if (Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 10) scrolled = false;
        });

        window.setInterval(function() {
            $(".serial-monitor").css("scroll-behavior", "smooth");
            if (global.states.autoscroll) {
                var elem = document.getElementsByClassName("serial-monitor")[0];
                elem.scrollTop = elem.scrollHeight;
            }
        }, 300);
    }

    self.listeners = function () {

        // Go back panel button
        $(".go-back-panel-button").off("click").click(function () {
            $(".panel").addClass("hidden");
            $("." + $(this).attr("target-panel")).removeClass("hidden");
            if ($(this).attr("target-panel") == "home-panel") $(".gb-config-header").removeClass("hidden"); setheight();
        });

        // Go home panel button
        $(".go-home-panel").off("click").click(function () {
            $(".panel").addClass("hidden");
            $(".home-panel").removeClass("hidden");
            $(".gb-config-header").removeClass("hidden").addClass("disabledz"); setheight();
            $(".gb-config-header .action-button").addClass("disabled"); 
        });

        // Close window button
        $(".menu-buttons-div .close-app-button").off("click").click(function () {
            self.ipcr.send('close-window-request', {
                windowid: global.states.windowid,
                port: global.port ? global.port.path : null
            });
        });
    
        // New window button
        $(".menu-buttons-div .new-window-button").off("click").click(function () {
            self.ipcr.send('new-window-request');
        });
    
        // Expand/collapse devices list in home panel
        $(".list-devices-button .header").off("click").click(function () {
            var parent = $(this).parent();
            if (parent.attr("state") == "collapsed") {
                parent.attr("state", "expanded").find(".list").removeClass("hidden");
                $(this).find(".list-visibility-status-icon").removeClass("fa-caret-down").addClass("fa-caret-up");
            }
            else {
                parent.attr("state", "collapsed").find(".list").addClass("hidden");
                $(this).find(".list-visibility-status-icon").removeClass("fa-caret-up").addClass("fa-caret-down");
            }
        });
    
        // Clear serial monitor display
        $(".status-bar-div .clear-display-button").off("click").click(function () {
            $(".serial-monitor .serial-monitor-text .session").remove();
            $(".serial-monitor .skeleton-div").removeClass("hidden");
        });
    
        // Toggle transparent mode
        $(".status-bar-div .enable-transparent-mode-button").off("click").click(function () {
            self.ipcr.send('enable-transparent-mode-request');
            global.states.compactmode = true;
            $(".status-bar-div").fadeOut(400);
        });

        // Close port button listeners
        $(".connected-device-disconnect-button").removeClass("hidden");
        $(".connected-device-disconnect-button").off("click").click(function () {
                global.states.follow = false;
                self.a.uiconfiggatorbyte.onconfigstateunknown();
                $(".waiting-for-device-notification").addClass("hidden");
                $(".device-not-available-overlay").slideUp(100);
                $(".home-panel").find(".device-not-ready-notification").addClass("hidden");
                $(".waiting-for-pong-overlay").slideUp(100);
                $(".share-online-overlay").addClass("hidden");
                $(".session").remove();
                $(".serial-monitor .skeleton-div").removeClass("hidden");
                $(".config-sync-notification-parent").addClass("hidden");
                
                $(".sync-status-heading").removeClass("disabled");
                $(".upload-config-data-button").removeClass("disabled");
                $(".refresh-config-data-button").removeClass("disabled");
                $(".panel").removeClass("disabled");

                global.accessors.uiconfiggatorbyte.filedownloaddata = "";
                global.accessors.uiconfiggatorbyte.filedownloadline = 0;

                self.ipcr.send('ipc/port-close/request', {
                    path: global.port.path,
                    baud: global.port.baud,
                    windowid: global.states.windowid
                });

                // TODO: Leave room in SocketIO

                if (!$(".command-input-div").hasClass("hidden")) self.a.ui.toggle_command_input_ui("hide");
            })
            .off("mouseenter").mouseenter(function () {
                $(".status-bar-div .device-status-indicator").attr("prev-background-color", $(".status-bar-div .device-status-indicator").css("background-color")).css("background", "#e06253");
            })
            .off("mouseleave").mouseleave(function () {
                $(".status-bar-div .device-status-indicator").css("background", $(".status-bar-div .device-status-indicator").attr("prev-background-color") || "#1c65ca");
            });
    }

    self.toggle_command_input_ui = function (targetstate) {
        if (targetstate == "show" || (!targetstate && $(".command-input-div").hasClass("hidden"))) {
            $(".command-input-div").attr("state", "shown").removeClass("hidden").draggable();
            
            $(".status-bar-item.input-button").css("background", "#e8e8e8");
            $(".status-bar-item.input-button").find("i").css("color", "#222");
            $(".command-input-div input").focus();

            if (global.timers.commandinputbounding) clearInterval(global.timers.commandinputbounding);
            global.timers.commandinputbounding = setInterval(function () {
                var el = $(".command-input-div")[0];
                var width = $(".command-input-div").width();
                var height = $(".command-input-div").height();
                var isOut = isOutOfBounds(el, {
                    clearance: {
                        bottom: 30
                    }
                });
        
                if(isOut.left) $(".command-input-div").css("left", "20px");
                if(isOut.top) $(".command-input-div").css("top", "20px");
                if(isOut.right) $(".command-input-div").css("left", window.innerWidth - width - 20);
                if(isOut.bottom) $(".command-input-div").css("top",  window.innerHeight - height - 40);
            }, 500);
        }
        else if (targetstate == "hide" || (!targetstate && !$(".command-input-div").hasClass("hidden"))) {
            $(".command-input-div").addClass("hidden").attr("state", "hidden");;
            $(this).css("background", "transparent");
            $(this).find("i").css("color", "#EEE");
            
            if (global.timers.commandinputbounding) clearInterval(global.timers.commandinputbounding);
        }
    }

    self.toggleautoscroll = function (targetstate) {
        if (targetstate == "on") {
            global.states.autoscroll = true;
            $(".auto-scroll-button").attr("state", "true").css("background", "#5c6d17");
            var elem = document.getElementsByClassName("serial-monitor")[0];
            elem.scrollTop = elem.scrollHeight;
        }
        else if (targetstate == "pause") {
            global.states.autoscroll = false;
            $(".auto-scroll-button").attr("state", "paused").css("background", "#7b6308");
        }
        else {
            global.states.autoscroll = false;
            $(".auto-scroll-button").attr("state", "false").css("background", "#333");
        }
    }

    self.show_functionality_locked_overlay = function (response) {
        var code = response.code;
        var parent = $(".functionality-locked-overlay");
        parent.removeClass("hidden").slideUp(0).slideDown(150);
        $(".home-panel").addClass("disabled").addClass("blur");

        /* 
            Explaination
        */
        var explaination = parent.find(".code-explaination");

        if (code == "new-window-limit-reached") {
            explaination.removeClass("hidden").text("The trial version only allows one device to be monitored at a time. PRO version, has no limits.");
        }
        else if (code == "live-share") {
            explaination.removeClass("hidden").text("Trial version limits a 'Live share' session to 10-minutes at a time. Please buy PRO to enjoy endless live share sessions.");
        }
        else if (code == "set-favorite-limit-reached") {
            explaination.removeClass("hidden").text("Trial version limits the number of favorite devices to 2. Unlock PRO to add as many favorite devices as you like.");
        }
        else if (code == "ipc/set-uploaddelay/request-prevent") {
            explaination.removeClass("hidden").text("The trial version doesn't allow changing the device upload delay. Please unlock PRO to perform this action.");
        }
        else if (code == "add-time-to-upload-delay") {
            explaination.removeClass("hidden").text("The trial version doesn't allow changing the device upload delay. Please unlock PRO to perform this action.");
        }

        /*
            Listeners
        */

        // Dismiss button listener
        parent.find(".dismiss-button").off("click").click(() => {
            parent.slideUp(100);
            setTimeout(() => {
                $(".home-panel").removeClass("disabled").removeClass("blur");
                parent.addClass("hidden");
            }, 100);
        });

        // Unlock pro version listener
        parent.find(".unlock-pro-button").off("click").click(() => {
                
        });
    }

    self.notification = function (args) {
        var parent = $(".notification-overlay");

        /*
            Context types: 'success', 'error'
        */
        var contexttype = args.contexttype || "success";

        /*
            Set heading icon
        */
        if (contexttype == "success") {
            parent.find(".heading-icon").css("color", "#2b8a04").find("i").removeClass("fa-triangle-exclamation").addClass("fa-check");
        }
        else if (contexttype == "error") {
            parent.find(".heading-icon").css("color", "#d65103").find("i").addClass("fa-triangle-exclamation").removeClass("fa-check");
        }
        
        /*
            Set heading
        */
        parent.find(".heading-text").html(args.heading || "");
        
        /*
            Set body
        */
        parent.find(".body").html(args.body || "");
        
        /*
            Overlay types: 'dialog' (with button), 'notification' with timer-based dismissal
        */
        var overlaytype = args.overlaytype || "dialog";
        
        /*
            Set overlay type
        */
        if (overlaytype == "dialog") {
            parent.find(".action-buttons").removeClass("hidden");
            parent.find(".dismiss-button").removeClass("hidden");
            parent.find(".okay-button").removeClass("hidden");
        }

        else {
            parent.find(".action-buttons").addClass("hidden");
            parent.find(".dismiss-button").addClass("hidden");
            parent.find(".okay-button").addClass("hidden");

            setTimeout(() => {
                parent.find(".content-parent").slideUp(100);
                setTimeout(() => {
                    parent.addClass("hidden");
                }, 100);
                setTimeout(() => {
                    parent.find(".heading").html("");
                    parent.find(".body").html("");
                }, 150);

                if (args.onokay && typeof args.onokay == "function") args.onokay();
            }, args.hidetimeout || 3000);
        }

        /*
            Set button text
        */
        parent.find(".okay-button").text(args.okay || "Okay");
        parent.find(".dismiss-button").text(args.dismiss || "Dismiss");

        /*
            Show overlay
        */
        parent.removeClass("hidden").find(".content-parent").slideUp(0).slideDown(150);

        /*
            Listeners
        */

        // Dismiss button listener
        parent.find(".dismiss-button").off("click").click(() => {
            parent.find(".content-parent").slideUp(100);
            setTimeout(() => {
                parent.addClass("hidden");
                if (args.oncancel && typeof args.oncancel == "function") args.oncancel();
            }, 100);
        });

        // Okay button listener
        parent.find(".okay-button").off("click").click(() => {
            parent.find(".content-parent").slideUp(100);
            setTimeout(() => {
                parent.addClass("hidden");
                if (args.onokay && typeof args.onokay == "function") args.onokay();
            }, 100);
        });
    }

}