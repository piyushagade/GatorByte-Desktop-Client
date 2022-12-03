var global = {
    keys: {},
    ports: {},
    states: {
        code: {}
    },
    timers: {},
    accessors: {},
    dashboard: {},
    hook: {}
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
    global.accessors.ipc = new ipcsubapp().init();
    global.accessors.ui = new uisubapp().init();
    global.accessors.uihome = new uihomesubapp().init();
    global.accessors.uidashboard = new uidashboardsubapp().init();
    global.accessors.uiserialmonitor = new uiserialmonitorsubapp().init();
    global.accessors.f = new functionsubapp().init();
    global.accessors.sck = new socketsubapp().init();
});

function on_port_closed() {

    // Hide status bar icons
    $(".status-bar-item.show-on-connected").addClass("hidden");
    
    // if (!$(".command-input-div").hasClass("hidden")) {
    //     $(".command-input-div").addClass("hidden");
    // }
}