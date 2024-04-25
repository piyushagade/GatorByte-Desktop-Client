
// Login as guest
Mousetrap.bind(["alt+g"], function(e) {
    if (global.states.connected) return;

    $(".login-panel").addClass("hidden");
    $(".device-selector-panel").removeClass("hidden");
    $(".device-selected-info-row").remove();
    return false;
});

// Logout
Mousetrap.bind(["alt+l"], function(e) {
    if (global.states.connected) return;

    $(".panel").addClass("hidden");
    $(".login-panel").removeClass("hidden");
    localStorage.clear();
    return false;
});

// Disconnect a device
Mousetrap.bind(["alt+d"], function(e) {
    if (!global.states.connected) return;
    if (
        (!global.port || !global.port.path) &&
        (!global.quickconnectport || !global.quickconnectport.path)
    ) return;
    $(".connected-device-disconnect-button").click();
    return false;
});

Mousetrap.bind(["ctrl+s", "command+s"], function(e) {
    if (!global.states.connected) return;
    if (
        (!global.port || !global.port.path) &&
        (!global.quickconnectport || !global.quickconnectport.path)
    ) return;
    $(".big-button.serial-monitor-button").click();
    return false;
});

Mousetrap.bind(["del"], function(e) {
    if (!global.states.connected) return;
    if (
        (!global.port || !global.port.path) &&
        (!global.quickconnectport || !global.quickconnectport.path)
    ) return;

    if (!$(".sd-explorer-panel").hasClass("hidden")) {
        if ($(".sd-explorer-panel .files-list-item.selected").length == 0) return;
        $(".sd-explorer-panel .delete-file-button").click();
    }
    return false;
});

$(document).keyup(function(e) {

    if (global.keys["alt"] && global.keys["ctrl"]) {
        if (!global.states.connected) return;
        if (
            (!global.port || !global.port.path) &&
            (!global.quickconnectport || !global.quickconnectport.path)
        ) return;

        global.keys["alt"] = false;
        global.keys["ctrl"] = false;

        if (!global.states.upload) {
            $(".home-panel").removeClass("disabled").removeClass("blur");
            $(".update-mode-overlay").addClass("hidden");
            $(".update-mode-overlay .stage-1").removeClass("hidden");
            $(".update-mode-overlay .stage-2").addClass("hidden");
        }
    }
});

// Enter upload mode
$(document).keydown(function(e) {
    if (e.altKey && e.ctrlKey) {
        if (!global.states.connected) return;
        if (global.keys["alt"] && global.keys["ctrl"]) return;
        if (
            (!global.port || !global.port.path) &&
            (!global.quickconnectport || !global.quickconnectport.path)
        ) return;
        global.keys["alt"] = true;
        global.keys["ctrl"] = true;

        $(".home-panel").addClass("disabled").addClass("blur");
        $(".update-mode-overlay").removeClass("hidden");
        $(".update-mode-overlay .stage-1").removeClass("hidden")
            .find(".delay-text").text((global.port.uploaddelay) + " seconds");
        $(".update-mode-overlay .stage-2").addClass("hidden");
    }
});

Mousetrap.bind(["ctrl+f", "command+f"], function(e) {
    if (!global.states.connected) return;
    if (
        (!global.port || !global.port.path) &&
        (!global.quickconnectport || !global.quickconnectport.path)
    ) return;

    $(".status-bar-item.follow-device-button").trigger("click");
    return false;
});

// SHow serial command sender text box
Mousetrap.bind(["ctrl+k", "command+k"], function(e) {
    if ($(".serial-monitor.panel").hasClass("hidden")) return;

    if (!global.states.connected) return;
    if (
        (!global.port || !global.port.path) &&
        (!global.quickconnectport || !global.quickconnectport.path)
    ) return;

    $(".status-bar-item.input-button").trigger("click");
    $(".command-input-div input").focus();
    return false;
});

// Clear serial monitor
Mousetrap.bind(["ctrl+l", "command+l"], function(e) {
    if (!global.states.connected) return; 
    
    if ($(".serial-monitor.panel").hasClass("hidden")) return;
    if (
        (!global.port || !global.port.path) &&
        (!global.quickconnectport || !global.quickconnectport.path)
    ) return;

    $(".status-bar-item.clear-display-button").trigger("click");
    return false;
});

Mousetrap.bind("escape", function(e) {

    // Hide command text box
    if (!$(".command-input-div").hasClass("hidden")) $(".status-bar-item.input-button").trigger("click");

    // Hide dismissable overlays/notification/dialog
    if ($(".dismissable-bottom-overlay").not(".hidden").length > 0) {
        var parent = $(".dismissable-bottom-overlay").not(".hidden");
        parent.slideUp(200);
        setTimeout(() => {
            $(".home-panel").removeClass("disabled").removeClass("blur");
            parent.addClass("hidden");
        }, 200);
    }

    // Hide dismissable panels
    else if ($(".dismissable-panel").not(".hidden").length > 0) {
        if (!global.states.connected) return;
        $(".go-back-panel-button").click();
    }

    return false;
});

Mousetrap.bind("enter", function(e) {
    if (!global.states.connected) return;

    if (!$(".serial-monitor.panel").hasClass("hidden")) {
        var ipcRenderer = require("electron").ipcRenderer;

        // If command input is not open, return
        if ($(".command-input-div").hasClass("hidden")) return false;

        // Send string as serial data
        ipcRenderer.send("ipc/command/push", {
            command: $(".command-input-div input").val(),
            windowid: global.states.windowid,
            path: global.port.path
        });
    }

    else if (!$(".sd-explorer-panel.panel").hasClass("hidden")) {

        if (!global.states.connected) return;
        if (
            (!global.port || !global.port.path) &&
            (!global.quickconnectport || !global.quickconnectport.path)
        ) return;

        if ($(".dismissable-bottom-overlay").not(".hidden").length == 0) return;
        $(".dismissable-bottom-overlay").find(".okay-button").click();
    }

    // Hide dismissable overlays/notification/dialog
    else if ($(".dismissable-bottom-overlay").not(".hidden").length > 0) {
        if (!$(".dismissable-bottom-overlay").find(".okay-button").hasClass("hidden")) {
            $(".dismissable-bottom-overlay").find(".okay-button").click();
        }
    }

    return false;
});

// Open dev tools
Mousetrap.bind(["ctrl+\\", "command+\\"], function(e) {
    var ipcRenderer = require("electron").ipcRenderer;

    // Send command
    ipcRenderer.send("ipc/devtools-toggle/request", {
        windowid: global.states.windowid,
    });

    return false;
});
Mousetrap.bind(['ctrl+shift+i', 'command+shift+i'], function(e) {
    e.preventDefault();
    return false;
});