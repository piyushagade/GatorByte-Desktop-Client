var global = {
    keys: {},
    ports: {},
    states: {
        code: {}
    },
    timers: {},
    constants: {
        "fingerprint": null,
        "server": "https://sapi.ezbean-lab.com/",
        "api": "https://sapi.ezbean-lab.com/v3",
        "hostname": location.hostname,
        "socket": null,
        "device": {}
    },
    data: {
        "events": [],
        "blogs": [],
        "announcements": [],
        "pictures": [],
        "user": {},
        "url-params": new URLSearchParams(window.location.search)
    },
    variables: {
        "ls": window.sls,
        "tz-offset": null
    },
    accessors: {},
    dashboard: {},
    hook: null
};

var isOutOfBounds = function (elem, options) {

    if (!options.clearance) {
        options.clearance = {
            left: 0,
            right: 0,
            top: 0, 
            bottom: 0
        }
    }
    options.clearance.left = options.clearance.left || 0;
    options.clearance.right = options.clearance.right || 0;
    options.clearance.top = options.clearance.top || 0;
    options.clearance.bottom = options.clearance.bottom || 0;

	// Get element's bounding
	var bounding = elem.getBoundingClientRect();

	// Check if it's out of the viewport on each side
	var out = {};
	out.top = bounding.top < 0 + options.clearance.top;
	out.left = bounding.left < 0 + options.clearance.left;
	out.bottom = bounding.bottom > (window.innerHeight || document.documentElement.clientHeight) - options.clearance.bottom;
	out.right = bounding.right > (window.innerWidth || document.documentElement.clientWidth) - options.clearance.right;
	out.any = out.top || out.left || out.bottom || out.right;
	out.all = out.top && out.left && out.bottom && out.right;

	return out;
};

$(document).ready(function () {

    // Init subapps
    global.accessors.uilogin = new uiloginsubapp().init();
    global.accessors.ui = new uisubapp().init();
    global.accessors.uihome = new uihomesubapp().init();
    global.accessors.uidashboard = new uidashboardsubapp().init();
    global.accessors.uidownloadfiles = new uidownloadfilessubapp().init();
    global.accessors.uiserialmonitor = new uiserialmonitorsubapp().init();
    global.accessors.uisensorcalibration = new uisensorcalibrationsubapp().init();
    global.accessors.uiconfiggatorbyte = new uiconfiggatorbytesubapp().init();
    global.accessors.uicontrolvariables = new uicontrolvariablessubapp().init();
    global.accessors.uidiagnosticsgatorbyte = new uidiagnosticsgatorbytesubapp().init();

    global.accessors.ipc = new ipcsubapp().init();
    
    global.accessors.f = new functionsubapp().init();
    global.accessors.sck = new socketsubapp().init();

    // On window resize
    // setheight();
    // $(window).resize(function() {
    //     setheight();
    // });

    // Network test
    newtworktest();
    setInterval(() => {
        newtworktest();
    }, 30000);
});

function newtworktest () {
    return new Promise(function (resolve, reject) {
        $.ajax({
            url: window.global.constants.api + "/time/utc",
            method: "get",
            success: function (response) {
                global.states.internet = true;
                resolve (global.states.internet);
            },
            error: function (err) {
                global.states.internet = false;
                reject (err);
            }
        });
    })
}

function setheight() {

    setTimeout(() => {

        // Set serial monitor height
        if (!$(".serial-monitor").hasClass("hidden")) {
            global.accessors.uiserialmonitor.setheight();
        }

        // Default behaviour (other panels visible)
        else {
            
            var headerheight = $(".header-panel").height();
            var bodyheight = parseInt($(".container").css("height"));
            var panelheight = bodyheight - headerheight - 45;
            $(".panel").height(panelheight);
        }
    }, 100);
}

function on_port_closed() {

    // Hide status bar icons
    $(".status-bar-item.show-on-connected").addClass("hidden");
    
    // if (!$(".command-input-div").hasClass("hidden")) {
    //     $(".command-input-div").addClass("hidden");
    // }
}