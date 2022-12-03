function uiserialmonitorsubapp(){
    var self;
    self = this;
    self.version = 1.0;
    self.ls = window.sls;
    self.f = new functionsubapp().init();
    self.ipcr = require('electron').ipcRenderer;
    self.pwrsv =  require('electron').remote.powerSaveBlocker;
    self.a = global.accessors;


    self.init = function () {

        // Start listeners
        self.listeners();

        return self;
    }
    
    self.listeners = function () {

        // Dashboard big button
        $(".home-panel .serial-monitor-button").off("click").click(function () {
            $(".serial-monitor").removeClass("hidden");
            $(".home-panel").addClass("hidden");
        });
        

        // Close window button
        $(".home-panel .serial-monitor-button").off("click").click(function () {
            $(".home-panel").addClass("hidden");
            $(".serial-monitor").removeClass("hidden");
        });
    }
    
    

    self.addlinetoserialmonitor = function (lineid, line) {
        var sessionid = global.states.sessionid;

        // If the session doesn't exist, create it
        if ($(".serial-monitor").find(".session[session-id='" + sessionid + "']").length == 0) {
            $(".serial-monitor").find(".session .line").not(".hook-line").css("color", "#bbbbbb");
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

        // If the line is a hook
        var hook = self.process_hooks(line.trim());
        if (!hook) return;

        // Show line only if specified hook object
        if (hook.show) {

            // Add line to the serial monitor display
            if (line.trim().length > 0) $(".serial-monitor").find(".session[session-id='" + sessionid + "']").find(".line").not(".hook-line").css("color", "#38dd38");
            $(".serial-monitor").find(".session[session-id='" + sessionid + "']").append(multiline(function() {/*
                <span class="line {{classname}}" hook-category="{{hook-category}}" line-id="{{line-id}}" session-id="{{session-id}}" style="color: {{color}}; background: {{background}}; word-break: break-word;">{{data}}</span>
            */},{ 
                "classname": hook.category ? "hook-line" : "",
                "hook-category": hook.category,
                "session-id": sessionid,
                "line-id": lineid,
                "color": hook.style.color,
                "background": hook.style.background,
                "font-size": hook.style.fontsize,
                "font-weight": hook.style.fontweight,
                "data": hook.line
            }));
            setTimeout(() => { $(".serial-monitor").find(".session[session-id='" + sessionid + "']").find(".line[line-id='" + lineid + "']").not(".hook-line").css("color", "#38dd38"); }, 2000);
            
            //! Take hool actions
            if (hook.actions) self.process_hook_actions(hook.actions);

            //! Auto scroll to the bottom of the div
            if (global.states.autoscroll) { 
                var elem = $(".serial-monitor")[0];
                elem.scrollTop = elem.scrollHeight;
            }

            /*
                Line options
            */

            $(".serial-monitor .session .line").off("click").click(function (event) {

                var mouse = { 
                    x: event.clientX,
                    y: event.clientY
                }

                var cleartimer = function () {
                    if (global.timers.lineselectionclear) clearInterval(global.timers.lineselectionclear);
                }
                var starttimer = function () {
                    cleartimer();
                    global.timers.lineselectionclear = setTimeout(() => {
                        
                        // Revert the state of autoscroll
                        global.states.autoscroll = $(".line-options-overlay").attr("autoscroll-state") == "true";
                        if (global.states.autoscroll) self.a.ui.toggleautoscroll("on");
                        else self.a.ui.toggleautoscroll("off");
                        
                        // Revert line's style
                        $(".line.selected").each(function (ei, el) {
                            var styleobj = self.f.b64_to_json($(el).attr("saved-line-style"));
                            $(el).css({
                                "color": styleobj["color"],
                                "font-weight": styleobj["font-weight"],
                                "font-size": styleobj["font-size"],
                                "background": styleobj["background"]
                            });

                            // Clean up
                            $(el).removeAttr("saved-line-style").removeClass("selected");
                        });
                        
                        // Clean-up
                        $(".line-options-overlay").attr("autoscroll-state", null);
                        $(".line-options-overlay").attr("state", "hidden").attr("line-id" , null).attr("session-id", null).addClass("hidden");

                    }, 5000);
                }
                
                // Unselect line if selected
                if ($(this).hasClass("selected")) {

                    // Revert line's style
                    $(".line.selected").each(function (ei, el) {
                        var styleobj = self.f.b64_to_json($(el).attr("saved-line-style"));
                        $(el).css({
                            "color": styleobj["color"],
                            "font-weight": styleobj["font-weight"],
                            "font-size": styleobj["font-size"],
                            "background": styleobj["background"]
                        });

                        // Clean up
                        $(el).removeAttr("saved-line-style").removeClass("selected");
                    });

                    starttimer();
                    
                    // Hide line options if no lines are selected
                    if ($(".session .line.selected").length == 0) {
                        $(".line-options-overlay").attr("state", "hidden").attr("line-id" , null).attr("session-id", null).addClass("hidden");
                    
                        // Revert the state of autoscroll
                        global.states.autoscroll = $(".line-options-overlay").attr("autoscroll-state") == "true";
                        if (global.states.autoscroll) self.a.ui.toggleautoscroll("on");
                        else self.a.ui.toggleautoscroll("off");

                        // Clean-up
                        $(".line-options-overlay").attr("autoscroll-state", null);
                        $(".serial-monitor .session .line.selected").removeClass("selected"); 
                    }
                    
                    return;
                }

                // Start the timer
                starttimer();

                // Save the state of autoscroll to revert later
                var currentautoscrollstate = $(".auto-scroll-button").attr("state");
                $(".line-options-overlay").attr("autoscroll-state", currentautoscrollstate == "true" || currentautoscrollstate == "paused");

                // Save the line's style
                $(this).attr("saved-line-style", self.f.json_to_b64({
                    "color": $(this).css("color"),
                    "font-weight": $(this).css("font-weight"),
                    "font-size": $(this).css("font-size"),
                    "background": $(this).css("background")
                }));

                // Pause auto-scroll
                if (global.states.autoscroll) self.a.ui.toggleautoscroll("pause");

                // Uncomment the following line to disable multiple line selection
                // $(".line.selected").removeClass("selected");
                // $(".line").css("background-color", "transparent");

                // Add the 'selected' class to the line 
                $(this).addClass("selected");
                $(this).css("background-color", "#2445bd");

                var lineid = $(this).attr("line-id");
                var sessionid = $(this).attr("session-id");
                var parent = $(".line-options-overlay");

                // Show the overlay
                parent.removeClass("hidden").css({
                    "top": mouse.y,
                    "left": mouse.x,
                });

                $(".line-options-overlay").attr("state", "visible").attr("line-id" , lineid).attr("session-id", sessionid).removeClass("hidden");

                // Copy line to clipboard
                parent.find(".copy-button").off("click").click(function () {
                    
                    // Restart timer
                    starttimer();

                    // Get all selected lines
                    var text = "";
                    $(".line.selected").each(function (ei, el) {
                        text += $(el).text();
                    });

                    var el = $(this);
                    el.find("i").removeClass("fa-clipboard").addClass("fa-check").css("color", "#38dd38");
                    setTimeout(() => {
                        el.find("i").addClass("fa-clipboard").removeClass("fa-check").css("color", "#222222");
                    }, 2000);

                    // Take action
                    self.f.copy_to_clipboard(text);
                });
                
                // Pin line
                parent.find(".pin-button").off("click").click(function () {

                    // Restart timer
                    starttimer();

                    var text = $(".serial-monitor .session .line[line-id='" + lineid + "']").text();
                    
                    // Get all selected lines
                    var html = "", text = "";
                    $(".line.selected").each(function (ei, el) {
                        html += el.outerHTML;
                        text += $(el).text();
                    });

                    var el = $(this);
                    el.find("i").removeClass("fa-thumbtack").addClass("fa-check").css("color", "#38dd38");
                    setTimeout(() => {
                        el.find("i").addClass("fa-thumbtack").removeClass("fa-check").css("color", "#222222");
                    }, 2000);

                    // Take action
                    $(".pinned-lines-overlay").removeClass("hidden"); 
                    $(".pinned-lines-overlay .list").append(multiline(function () {/* 
                        <div class="pinned-line" line-id="{{lineid}}">
                            <span style="color: #AAA; font-size: 12px; margin-right: 4px; cursor: pointer;"><i class="fa-solid fa-thumbtack unpin-button"></i></span>
                            <span style="color: #AAA; font-size: 12px; margin-right: 4px; cursor: pointer;"><i class="fa-solid fa-clipboard copy-button"></i></span>
                            <span class="text" text="{{full-text}}" style="color: #c3e023; font-size: 12px; word-break: break-all;">{{text}}</span>
                        </div>
                    */}, {
                        "full-text": self.f.str_to_b64(text),
                        "text": text.length > 75 ? text.substring(0, 75) + "..." : text,
                        "lineid": lineid
                    }));

                    // Auto-scroll
                    var elem = $(".pinned-lines-overlay .list")[0];
                    elem.scrollTop = elem.scrollHeight;

                    // Up-pin lines
                    $(".pinned-line").find(".unpin-button").off("click").click(function () {
                        var lineid = $(this).parent().parent().attr("line-id");

                        // Remove item
                        $(this).parent().parent().remove();

                        if ($(".pinned-lines-overlay .list .pinned-line").length == 0) $(".pinned-lines-overlay").addClass("hidden"); 
                    });

                    // Copy pinned line
                    $(".pinned-line").find(".copy-button").off("click").click(function () {
                        var parent = $(this).parent().parent();
                        var text = self.f.b64_to_str(parent.find(".text").attr("text"));

                        var el = $(this);
                        el.removeClass("fa-clipboard").addClass("fa-check").css("color", "#38dd38");
                        setTimeout(() => {
                            el.addClass("fa-clipboard").removeClass("fa-check").css("color", "#AAAAAA");
                        }, 2000);

                        // Take action
                        self.f.copy_to_clipboard(text);
                    });
                });
            });
        }
    }

    self.process_hooks = function (line) {

        // Default return object
        let hook = {
            line: line,
            category: global.hook ? global.hook.category : null,
            style: {
                color: "gold",
                background: "transparent",
                fontsize: "13px",
                fontweight: "normal"
            },
            show: true
        }
        let endhook = false;

        // Remove the manually added (in F/W code) line break
        line = line.replace(/<br>/, "");

        if (line.indexOf("##CEREAL##") > -1 || global.hook) {

            // If the incoming hook string has an end-of-line indicator
            if (line.indexOf("#EOF#") != -1) {
                endhook = true;
            }

            // If the string doesn't have a EOF indicator, return previous hook object
            if (!endhook) {

                if (global.hook) global.hook.line += line.replace("##CEREAL##", "");
                else global.hook = hook;

                global.hook.category = line.split("::")[0].replace(/<br>/g, "").replace("##CEREAL##", "");
                return null;
            }

            // Else figure out the hook object/styling/actions
            else {
                
                line = line.replace("##CEREAL##", "").replace("#EOF#", "");
                var brprefix = line.indexOf("::") > -1 ? (line.split("::")[0].startsWith("<br>") ? "<br>": "") : "";
                var brsuffix = line.indexOf("::") > -1 ? (line.split("::")[1].endsWith("<br>") ? "<br>": "") : "";
                var category = global.hook ? global.hook.category : (line.indexOf("::") > -1 ? line.split("::")[0] : line).replace(/<br>/g, ""); 
                var data = ((global.hook ? global.hook.line : "") + brprefix + (line.indexOf("::") > -1 ? line.split("::")[1] : line).replace(category, "") + brsuffix).replace("##CEREAL##", "").replace("#EOF#", "").replace(category + "::", ""); 

                if (category == "data") {
                    hook = {
                        line: data,
                        category: category,
                        show: true,
                        style: {
                            "color": "black",
                            "background": "white"
                        },
                        actions: [
                            {
                                name: "upload",
                                options: {
                                    type: "get",
                                    url: "https://api.piyushagade.xyz/v1/time/utc"
                                }
                            }
                        ]
                    }
                }
                if (category.indexOf("highlight-") == 0) {
                    
                    var highlightcolor = category.split("-")[1];

                    hook = {
                        line: data,
                        category: category,
                        show: true,
                        style: {
                            "color": "black",
                            "background": highlightcolor
                        },
                        actions: [
                            {
                                name: "beep",
                                options: {
                                    times: 3,
                                    delay: 1000
                                }
                            }
                        ]
                    }
                }
                if (category.indexOf("gdc-db") == 0) {

                    self.a.uidashboard.process_dashboard_items(line);
                    
                    hook = {
                        category: category,
                        show: false,
                        line: data,
                        style: {
                            "color": "black",
                            "background": "green"
                        }
                    }
                }
            }

            // Clear state if EOF encountered; save state otherwise
            global.hook = endhook ? null : { ...hook };
        }
        return hook;
    }

    self.process_hook_actions = function (actions) {

        if (!actions || actions.length == 0) return;
        
        actions.forEach(function (action, ai) {
            
            // Extract options
            var options = action.options;

            // Upload data
            if (action.name == "upload") {
                $.ajax({
                    url: options.url,
                    method: options.type || "GET",
                    body: options.method == "POST" ? options.data : undefined
                }).done(function(response) {
                    console.log(response);
                });
            }

            else if (action.name == "beep") {
                self.beep("https://www.orangefreesounds.com/wp-content/uploads/2021/12/Barcode-scanner-beep-sound.mp3?_=1", options.times);
            }
        });
    }

    self.beep = function (url, times) {
        if (times == 0) return true;
        var audio = new Audio(url);
        audio.play();
        return self.beep(url, parseInt(times)-1);
    }
}