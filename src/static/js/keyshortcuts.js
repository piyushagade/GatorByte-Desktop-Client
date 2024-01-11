Mousetrap.bind(["ctrl+k", "command+k"], function(e) {
    if (
        (!global.port || !global.port.path) &&
        (!global.quickconnectport || !global.quickconnectport.path)
    ) return;

    $(".status-bar-item.input-button").trigger("click");
    $(".command-input-div input").focus();
    return false;
});

Mousetrap.bind(["alt+g"], function(e) {
    $(".login-panel").addClass("hidden");
    $(".device-selector-panel").removeClass("hidden");
    $(".device-selected-info-row").remove();
    return false;
});

Mousetrap.bind(["alt+l"], function(e) {
    $(".panel").addClass("hidden");
    $(".login-panel").removeClass("hidden");
    localStorage.clear();
    return false;
});

Mousetrap.bind(["alt+d"], function(e) {
    if (
        (!global.port || !global.port.path) &&
        (!global.quickconnectport || !global.quickconnectport.path)
    ) return;
    $(".connected-device-disconnect-button").click();
    return false;
});

Mousetrap.bind(["ctrl+s", "command+s"], function(e) {
    if (
        (!global.port || !global.port.path) &&
        (!global.quickconnectport || !global.quickconnectport.path)
    ) return;
    $(".serial-monitor-button").click();
    return false;
});

$(document).keyup(function(e) {

    if (global.keys["alt"] && global.keys["ctrl"]) {
        if (
            (!global.port || !global.port.path) &&
            (!global.quickconnectport || !global.quickconnectport.path)
        ) return;
        if (!global.states.connected) return;

        global.keys["alt"] = false;
        global.keys["ctrl"] = false;

        if (!global.states.upload) {
            $(".update-mode-overlay").addClass("hidden");
            $(".update-mode-overlay .stage-1").removeClass("hidden");
            $(".update-mode-overlay .stage-2").addClass("hidden");
        }
    }
});

$(document).keydown(function(e) {
    if (e.altKey && e.ctrlKey) {
        if (global.keys["alt"] && global.keys["ctrl"]) return;
        if (
            (!global.port || !global.port.path) &&
            (!global.quickconnectport || !global.quickconnectport.path)
        ) return;
        if (!global.states.connected) return;
        global.keys["alt"] = true;
        global.keys["ctrl"] = true;

        $(".update-mode-overlay").removeClass("hidden");
        $(".update-mode-overlay .stage-1").removeClass("hidden")
            .find(".delay-text").text((global.port.uploaddelay) + " seconds");
        $(".update-mode-overlay .stage-2").addClass("hidden");
    }
});

Mousetrap.bind(["ctrl+f", "command+f"], function(e) {
    if (
        (!global.port || !global.port.path) &&
        (!global.quickconnectport || !global.quickconnectport.path)
    ) return;

    $(".status-bar-item.follow-device-button").trigger("click");
    return false;
});

Mousetrap.bind(["ctrl+l", "command+l"], function(e) {
    if (
        (!global.port || !global.port.path) &&
        (!global.quickconnectport || !global.quickconnectport.path)
    ) return;

    $(".status-bar-item.clear-display-button").trigger("click");
    return false;
});

Mousetrap.bind("escape", function(e) {

    if (!$(".command-input-div").hasClass("hidden")) $(".status-bar-item.input-button").trigger("click");

    return false;
});

Mousetrap.bind("enter", function(e) {
    var ipcRenderer = require("electron").ipcRenderer;

    // If command input is not open, return
    if ($(".command-input-div").hasClass("hidden")) return false;

    // Send string as serial data
    ipcRenderer.send("ipc/command/push", {
        command: $(".command-input-div input").val(),
        windowid: global.states.windowid,
        path: global.port.path
    });

    return false;
});