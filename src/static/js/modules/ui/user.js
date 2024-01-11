function uiloginsubapp(){
    var self;
    self = this;
    self.version = 1.0;
    self.ls = window.sls;
    self.f = new functionsubapp().init();
    self.ipcr = require('electron').ipcRenderer;
    self.a = global.accessors;
    self.panel = $(".login-panel.panel");


    self.init = function () {

        // Start listeners
        self.listeners();

        return self;
    }
    
    self.listeners = function () {

        // GatorByte info button
        self.panel.find(".login-submit-button").off("click").click(function () {
            
            var email = self.panel.find(".login-email-input").val().trim().toLowerCase();
            var password = self.panel.find(".login-password-input").val().trim();

            if (email.length == 0 || password.length == 0) {
                self.a.ui.notification({
                    "contexttype": "error",
                    "overlaytype": "notification",
                    "heading": "Incomplete credentials",
                    "body": "Please enter all fields to proceed.",
                    "hidetimeout": 3000
                });
                return;
            }
            else {

                self.verify_user({
                    email: email,
                    password: password
                })
            }
        });

    }

    self.verify_user = function (args) {
        if (!args.email || !args.password) return;
        var email = args.email.trim().toLowerCase();
        var password = args.password.trim().toLowerCase();

        // Perform a newtwork test
        newtworktest();

        if (!global.states.internet) {
            self.a.ui.notification({
                "contexttype": "error",
                "overlaytype": "notification",
                "heading": "No network detected",
                "body": "This action needs an active internet connection. Please try again.",
                "hidetimeout": 5000
            });

            return;
        }

        // Verify OTP on the server
        $.ajax({
            url: window.global.constants.api + "/users/verify",
            method: "post",
            data: JSON.stringify({
                "email": email,
                "password": password,
                "timestamp": new Date().getTime()
            }),
            success: function (response) {

                console.log("Successfully logged in");

                // If verified
                self.ls.setItem("user/data", JSON.stringify(response.payload));
                self.ls.setItem("login/state", "true");
                self.ls.setItem("login/email", email);
                self.ls.setItem("login/password", password);
                self.ls.setItem("login/name", response.payload["NAME"]);
                self.ls.setItem("login/position", response.payload["POSITION"]);
                self.ls.setItem("login/role", response.payload["ROLE"]);
                self.ls.setItem("login/uuid", response.payload["UUID"]);
                self.ls.setItem("login/timestamp", new Date().getTime());

                // Get/update login state
                self.on_login_success();

                if (args.callback && typeof args.callback ==  "function") args.callback();
            },
            error: function (x, h, r) {
                // self.f.create_notification("error", x.responseJSON.status, "mint");
                console.log("Couldn't log in");

                // Get/update login state
                self.on_login_failure();

            }
        });
    }

    self.on_login_success = function () {
        self.a.ui.notification({
            "contexttype": "success",
            "overlaytype": "notification",
            "heading": "Login",
            "body": "You are now logged in.",
            "hidetimeout": 1500
        });

        setTimeout(() => {
            $(".login-panel").addClass("hidden");
            $(".device-selector-panel").removeClass("hidden");
            $(".device-selected-info-row").remove();
        }, 500);

        self.on_user_logged_in();

    }

    self.on_user_logged_in = function () {

        // Set variables
        window.global.data.user[self.ls.functions.hash("email")] = self.ls.functions.encrypt(self.ls.getItem("login/email"));
        window.global.data.user[self.ls.functions.hash("password")] = self.ls.functions.encrypt(self.ls.getItem("login/password"));
        window.global.data.user[self.ls.functions.hash("role")] = self.ls.functions.encrypt(self.ls.getItem("login/role"));
        window.global.data.user[self.ls.functions.hash("position")] = self.ls.functions.encrypt(self.ls.getItem("login/position"));
        window.global.data.user[self.ls.functions.hash("id")] = self.ls.functions.encrypt(self.ls.getItem("login/uuid"));
        
        // Set UI
        $(".device-selector-panel .user-info-row").find(".user-name-text").text(self.ls.getItem("login/name"));
        $(".device-selector-panel .user-info-row").find(".user-email-text").text(self.ls.getItem("login/email"));

        // Get projects list from the server
        self.get_all_projects();
    }

    self.on_login_failure = function () {
        self.a.ui.notification({
            "contexttype": "error",
            "overlaytype": "notification",
            "heading": "Login",
            "body": "There was a problem with your request. Please try again.",
            "hidetimeout": 1500
        });
    }

    
        
    self.get_all_projects = function(callback) {

        console.log({
            "email": self.ls.functions.decrypt(window.global.data.user[self.ls.functions.hash("email")]),
            "user-email": JSON.parse(self.ls.getItem("user/data")).EMAIL,
            "user-id": JSON.parse(self.ls.getItem("user/data")).UUID
        });
        
        $.ajax({
            url: self.f.url({ path: "/gatorbyte/projects/get/all" }), 
            method: 'POST',
            data: JSON.stringify({
                "email": self.ls.functions.decrypt(window.global.data.user[self.ls.functions.hash("email")]),
                "user-email": JSON.parse(self.ls.getItem("user/data")).EMAIL,
                "user-id": JSON.parse(self.ls.getItem("user/data")).UUID
            }),
            success: function(response) {

                var allprojects = response.payload.projects;
                var accessibleprojects = response.payload.access;

                window.global.data["projects"] = [];
                accessibleprojects.forEach(function (accessrow, ari) {
                    var projectuuid = accessrow["PROJECTUUID"];
                    var projectdata = self.f.grep(allprojects, "UUID", projectuuid, true);
                    window.global.data["projects"].push(projectdata);

                    $(".device-selector-panel .projects-list").append(multiline (function () {/*
                        <div class="col-auto projects-list-item ui-truncate" style="background: #414141; padding: 1px 6px; border-radius: 1px; margin-right: 6px; font-size: 12px;" data-b64="{{data-b64}}" project-uuid="{{project-uuid}}" project-role="{{project-role}}" project-id="{{project-id}}" project-name="{{project-name}}">
                            {{project-name}}
                        </div>
                    */},
                    {
                        "data-b64": self.f.json_to_b64(projectdata),
                        "project-name": projectdata["NAME"],
                        "project-role": accessrow["ROLE"],
                        "project-id": projectdata["ID"],
                        "project-uuid": projectdata["UUID"]
                    }));
                    
                    if (accessrow["ROLE"] == "super" || accessrow["ROLE"] == "admin") {
                        $(".device-info-overlay .gb-register-project-select").append(multiline (function () {/*
                            <option value="{{project-uuid}}" data-b64="{{data-b64}}" style="color: #222;">{{project-id}}</option>
                        */},
                        {
                            "data-b64": self.f.json_to_b64(projectdata),
                            "project-name": projectdata["NAME"],
                            "project-id": projectdata["ID"],
                            "project-uuid": projectdata["UUID"]
                        }));
                    }
                });

                // Get list of sites for the user
                self.get_all_devices(function (sitesdata) {
                    var alldevices = sitesdata.devices;
                    var accessibledevices = sitesdata.access;

                    window.global.data["devices"] = [];
                    accessibledevices.forEach(function (accessrow, ari) {
                        var deviceuuid = accessrow["DEVICEUUID"];
                        var devicedata = self.f.grep(alldevices, "UUID", deviceuuid, true);
                        window.global.data["devices"].push(devicedata);
                    });
                });


            },
            error: function (request, textStatus, errorThrown) { }
        });
    }

    self.sntoprojectanddevice = function (sn) {
        $.ajax({
            url: window.global.constants.api + "/gatorbyte/sites/info/get",
            method: "post",
            data: JSON.stringify({
                "sn": sn
            }),
            success: function (response) {
                console.log(response);


                if (args.callback && typeof args.callback ==  "function") args.callback();
            },
            error: function (x, h, r) {

            }
        });
    }

    self.get_all_devices = function(callback) {

        $.ajax({
            url: self.f.url({ path: "/gatorbyte/sites/get/all" }), 
            method: 'POST',
            data: JSON.stringify({
                "email": self.ls.functions.decrypt(window.global.data["user"][self.ls.functions.hash("email")]),
                "user-email": JSON.parse(self.ls.getItem("user/data")).EMAIL,
                "user-id": JSON.parse(self.ls.getItem("user/data")).UUID
            }),
            success: function(response) {

                var alldevices = response.payload.devices;
                var accessibledevices = response.payload.access;

                if (callback && typeof callback == "function") callback(response.payload);
            },
            error: function (request, textStatus, errorThrown) { 
                console.log(errorThrown);
            }
        });
    }
}