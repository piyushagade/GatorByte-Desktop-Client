const { BrowserWindow } = require("electron-acrylic-window");
var moment = require("moment");
var self, moduleprefix = "sub";
var licenseinfoprintedstate = false;

module.exports = {
    validate: function (i) {
        
        return new Promise(function (resolve, reject) {
            self = i[moduleprefix];

            i.r.post(i, {
                "url": i.g.API_URL + "/license/validate",
                "data": {
                    "machine-id": i.g.var.machineid,
                    "user-email": i.g.var.useremail
                }
            })
                .then(function (res) {
                    if (!res) return;
                    
                    if (res.body.status == "success") {
                        
                        i.g.var.subscription = { ...res.body.payload.subscription, fetched: moment.now() };
                        
                        // Set settings
                        i.s.setSync("subscription", i.g.var.subscription);
                        
                        // Compute trial/subscription states
                        i.g.var.fullfunctionality = self.computestate(i);
                        
                        self.setui(i);

                        resolve(i.g.var.fullfunctionality);
                    }
                })
                .catch(function (err) {
                    if (i.s.hasSync("subscription")) {
                        console.error("Could not obtain subscription/trial information from server. Using stored subscription information.");
                        
                        // Get stored subscription information
                        i.g.var.subscription = i.s.getSync("subscription");
                        
                        // Compute trial/subscription states
                        i.g.var.fullfunctionality = self.computestate(i);

                        self.setui(i);
                        resolve(i.g.var.fullfunctionality);
                    }
                    else {
                        console.error("Could not obtain subscription/trial information from server and stored subscription information was not found. Please connect to the internet and try again.");
                        
                        // Compute trial/subscription states
                        i.g.var.fullfunctionality = self.computestate(i);

                        self.setui(i);
                        resolve(i.g.var.fullfunctionality);
                    }
                });
        })
    }, 

    computestate: function (i) {
        if (!i.g.var.subscription) return;

        // Construct object
        i.g.var.subscription = {
            ...i.g.var.subscription, 
            "trial-duration": i.g.TRIAL_DURATION,
            "computed-states": {
                trialused: i.g.var.subscription.trial.timestamp != null || i.g.var.subscription.trial.timestamp != undefined,
                daysremaining: parseInt(i.g.TRIAL_DURATION) - parseInt((moment.now() - parseInt(i.g.var.subscription.trial.timestamp)) / 1000 / 3600 / 24),
                subscriptionactive: i.g.var.subscription.activation.active
            }
        }
        i.g.var.subscription["computed-states"] = {
            ...i.g.var.subscription["computed-states"],
            trialexpired: i.g.var.subscription["computed-states"].trialused && parseInt(i.g.TRIAL_DURATION) < (moment.now() - parseInt(i.g.var.subscription.trial.timestamp)) / 1000 / 3600 / 24,
            dayssinceexpiry: -1 * i.g.var.subscription["computed-states"].daysremaining
        }

        // Update in storage
        i.s.setSync("subscription", i.g.var.subscription);

        var states = i.g.var.subscription["computed-states"];
        var fullfunctionality = states.trialused && (states.subscriptionactive || !states.trialexpired);

        // Add fullfunctionality to subscription object
        i.g.var.subscription["computed-states"] = {
            ...i.g.var.subscription["computed-states"],
            "full-functionality": fullfunctionality
        }

        if (!licenseinfoprintedstate) {

            if (states["subscriptionactive"]) console.log("User has an active subscription/license.");
            else if (!states["trialused"]) console.log("User hasn't activated the trial yet.");
            else if (states["trialexpired"]) console.log("The trial expired " + states["dayssinceexpiry"] + " days ago.");
            else console.log("The trial is active and will expire in " + states["daysremaining"] + " days.");
            licenseinfoprintedstate = true;
        }

        // Unlock full functionality of the app?
        return fullfunctionality;
    },
        
    setui: function (i, state) {
        BrowserWindow.getAllWindows().forEach(function (win, wi) {
            try { win.webContents.send('subscription-information-push', i.g.var.subscription); } catch (e) {} 
        });
    }
}
        