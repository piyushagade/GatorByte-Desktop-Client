function uidownloadfilessubapp(){
    var self;
    self = this;
    self.version = 1.0;
    self.ls = window.sls;
    self.f = new functionsubapp().init();
    self.ipcr = require('electron').ipcRenderer;
    self.pwrsv =  require('electron').remote.powerSaveBlocker;
    self.a = global.accessors;
    self.filedata = "";
    self.panel = $(".download-files-panel");
    self.currentfoldername = "/";

    self.init = function () {

        // Start listeners
        self.listeners();

        return self;
    }

    self.sendcommand = function (command) {
        self.ipcr.send('send-command-request', {
            command: command,
            windowid: global.states.windowid,
            path: global.port.path
        });
    }
    
    self.listeners = function () {

        // Big button
        $(".home-panel .download-files-button").off("click").click(function () {
            $(".download-files-panel").removeClass("hidden");
            $(".home-panel").addClass("hidden");
        
            // Hide previous errors
            $(".download-files-panel .download-files-list").find(".error-item").remove();
            
            // Send request to get GatorByte to send sd files list
            self.open_directory("/");
        });

        //! Refresh list button listener
        $(".download-files-panel .refresh-files-list-button").off("click").click(function () {
            
            // Clear list
            self.panel.find(".download-files-list .files-list-item").remove();

            // Hide file options
            $(".download-files-panel .file-options-parent").addClass("hidden");

            // Hide previous errors
            $(".download-files-panel .download-files-list").find(".error-item").remove();

            // Show spinner
            $(".download-files-panel .spinner-div").removeClass("hidden");

            // Send request to get GatorByte to send sd files list
            self.request_file_list(self.currentfoldername, 1);
        });
    }

    self.request_file_list = function (dir, page) {
        var prefix = "##GB##", suffix = "#EOF#";
        self.ipcr.send('send-command-request', {
            command: prefix + "fl:list," + dir + suffix,
            windowid: global.states.windowid,
            path: global.port.path
        });

        self.state = "wait-for-file-list";
    }

    self.list_files = function (line) {
        line = line.replace(/<br>/g, "");

        if (self.state == "wait-for-file-list") {
            if (line.startsWith("file:")) self.update_file_list_ui(line.replace(/file:/, ""));
            else if (line.startsWith("error:")) {
                var error = line.split(":")[1];
                self.show_error(error);
            }
        }
        else if (self.state == "wait-on-file-download") {
            
            // Do nothing

        }
    }

    self.show_error = function (error) {
        console.log("Error listing files: " + error);

        if (error == "nodevice") {

            // Hide spinner
            $(".download-files-panel .spinner-div").addClass("hidden");

            // Hide previous errors
            $(".download-files-panel .download-files-list").find(".error-item").remove();
            
            $(".download-files-panel .download-files-list").append(multiline(function () {/* 
                <div class="error-item" style="margin-right: 10px; margin-bottom: 10px;">
                    <div class="shadow-heavy" style="color: #f1f1f1;">
                        <div style="color: #ffffff;font-size: 13px;padding: 4px 10px;background: #d22e0975;border-radius: 2px;">
                            SD card module has reported an error.
                        </div>
                    </div>
                    
                    <div class="shadow-heavy" style="color: #f1f1f1; margin-top: 8px;">
                        <div style="color: #ffffff;font-size: 13px;padding: 4px 10px;background: #56565675;border-radius: 2px;">
                            Most likely the SD card is not inserted, or the device has not been initialized in the GatorByte firmware.
                        </div>
                    </div>
                </div>
            */}));
        }
        
        if (error == "nofile") {

            // Hide spinner
            $(".download-files-panel .spinner-div").addClass("hidden");

            // Hide previous errors
            $(".download-files-panel .download-files-list").find(".error-item").remove();
            
            $(".download-files-panel .download-files-list").append(multiline(function () {/* 
                <div class="error-item" style="margin-right: 10px; margin-bottom: 10px;">
                    <div style="color: #f1f1f1; margin-top: 8px;">
                        <div style="color: #ffffff;font-size: 13px;padding: 4px 10px; border-radius: 2px;">
                            This folder is empty.
                        </div>
                    </div>
                </div>
            */}));
        }
    }

    self.update_file_list_ui = function (file) {

        // Ignore '/' folder
        if (file == "/:0") return;
        
        // If file already exists in the list, do not add
        if ($(".download-files-panel .download-files-list .files-list-item[filename='" + file + "']").length == 0) {
            
            // Hide previous errors
            $(".download-files-panel .download-files-list").find(".error-item").remove();

            // Hide spinner
            $(".download-files-panel .spinner-div").addClass("hidden");

            file.split(",").forEach(function (entry, ei) {

                // console.log(entry);

                var filename = entry.split(":")[0];
                var filesize = parseInt(entry.split(":")[1]);

                // Parse filesize
                if (!isNaN(filesize)) {
                    if (filesize >= 1024) filesize = (filesize / 1024).toFixed(2) + " MB";
                    if (filesize >= 0) filesize = (filesize) + " kB";
                }
                
                var isfolder = filename.endsWith("/");
                var extension = (isfolder ? "dir" : (filename.split(".").length > 1 ? filename.split(".")[1] : "")).toUpperCase();
                var knownextensions = ["DIR", "CSV", "LOG", "INI"];
                var extensioncolors = ["#c74b0f", "green", "#962020", "#1969cc"];
                
                $(".download-files-panel .download-files-list").append(multiline(function () {/* 
                    <div class="col-auto files-list-item shadow-heavy" filename="{{filename}}" filetype="{{filetype}}" style="text-align: center;position: relative;padding: 6px 8px;margin-right: 10px;margin-bottom: 10px;height: 100px;width: 85px;background: #ffffff1f;border-radius: 4px;">
                        <div style="color: #f1f1f1;font-size: 36px;">
                            {{fileicon}}
                            <div style="color: #ffffff;font-size: 10px;position: absolute;top: 6px;left: 5px;margin: auto auto;background: {{filecolor}};padding: 0px 2px;border-radius: 2px;">
                                {{filetype}}
                            </div>
                        </div>
                        <div class="truncate" title="{{filename}}" style="color: #BBBBBB;font-size: 13px;">
                            {{filename}}
                        </div>
                        <div class="truncate" style="color: #88adff;font-size: 10px;">
                            {{filesize}}
                        </div>
                    </div>
                */}, {
                    fileicon: isfolder ? '<i class="fa-solid fa-folder"></i>' : '<i class="fa-solid fa-file-lines"></i>',
                    filename: isfolder ? "/" + filename.replace("/", "") : filename,
                    filesize: isfolder ? "N/A" : filesize,
                    filetype: extension.substring(0, 3),
                    filecolor: extensioncolors[knownextensions.indexOf(extension.substring(0, 3))]
                }));
            });
        }

        //! When user clicks on an icon
        $(".download-files-panel .files-list-item").off("click").click(function () {
            var filename = $(this).attr("filename");
            var filetype = $(this).attr("filetype");

            if (filetype != "DIR") {

                // Hide the file options if already shown
                if ($(this).hasClass("selected")) {

                    // Hide file options div
                    self.panel.find(".file-options-parent").addClass("hidden");
                    self.panel.find(".file-options-download-information").addClass("hidden");

                    // Hide folder options div
                    self.panel.find(".folder-options-parent").addClass("hidden");
                    
                    $(".download-files-panel .files-list-item").css("background", "#ffffff1f").removeClass("selected");
                }

                //! Show file options and select the file
                else {
                    
                    $(".download-files-panel .files-list-item").css("background", "#ffffff1f").removeClass("selected");
                    $(this).css("background", "#355377").addClass("selected");

                    // Show file options div
                    self.panel.find(".file-options-parent").removeClass("hidden");
                    self.panel.find(".file-options-download-information").addClass("hidden");
                    
                    // Hide folder options div
                    self.panel.find(".folder-options-parent").addClass("hidden");
                }

                //! Save file button listener (Download file)
                $(".download-files-panel .file-options-parent .download-file-button").off("click").click(function () {
                    var filename = $(".download-files-panel .files-list-item.selected").attr("filename");

                    // Send download request
                    self.filedownloadname = filename;
                    self.filedownloaddata = "";
                    self.filedownloadline = 0;

                    var filepath = (self.currentfoldername == "/" ? "" : self.currentfoldername + "/") + self.filedownloadname;
                    self.request_file_download(filepath, self.filedownloadline);

                    // Update UI
                    self.panel.find(".file-options-home").addClass("hidden");
                    self.panel.find(".file-options-download-information").removeClass("hidden");
                    self.panel.find(".file-options-download-information .download-progress-icon").css("color", "#c55a0e").addClass("rotate-animation");
                    self.panel.find(".file-options-download-information .download-progress").css("color", "#464444").text("Starting download");
                });

                
                //! Delete file button listener
                $(".download-files-panel .file-options-parent .delete-file-button").off("click").click(function () {
                    var filename = $(".download-files-panel .files-list-item.selected").attr("filename");

                    // Send download request
                    self.filedownloadname = filename;
                    self.filedownloaddata = "";
                    self.filedownloadline = 0;

                    var filepath = (self.currentfoldername == "/" ? "" : self.currentfoldername + "/") + self.filedownloadname;
                    self.request_file_deletion(filepath);

                    // Update UI
                    setTimeout(() => {
                        $(".download-files-panel .refresh-files-list-button").click();
                    }, 1400);
                });
            }

            else if (filetype == "DIR") {
                
                // Hide file options div
                self.panel.find(".file-options-parent").addClass("hidden");

                // Show folder options div
                self.panel.find(".folder-options-parent").removeClass("hidden");

                if ($(this).hasClass("selected")) {
                    $(this).attr("state", "no-folder-selected").attr("selected-folder", "");
                }

                //! Show folder options and select the folder
                else {
                    $(this).attr("state", "folder-selected").attr("selected-folder", filename);
                    
                    $(".download-files-panel .files-list-item").css("background", "#ffffff1f").removeClass("selected");
                    $(this).css("background", "#355377").addClass("selected");
                }

                //! Save file button listener (Download file)
                $(".download-files-panel .folder-options-parent .make-directory-button").off("click").click(function () {
                    var filename = $(".download-files-panel .files-list-item.selected").attr("filename");

                    // Send download request
                    self.filedownloadname = filename;
                    self.filedownloaddata = "";
                    self.filedownloadline = 0;

                    var filepath = (self.currentfoldername == "/" ? "" : self.currentfoldername) + self.filedownloadname;
                    console.log(filepath);

                    // self.request_file_download(filepath, self.filedownloadline);

                });

                
                //! Delete file button listener
                $(".download-files-panel .folder-options-parent .delete-directory-button").off("click").click(function () {
                    var filename = $(".download-files-panel .files-list-item.selected").attr("filename");

                    // Send download request
                    self.filedownloadname = filename;
                    self.filedownloaddata = "";
                    self.filedownloadline = 0;

                    var filepath = (self.currentfoldername == "/" ? "" : self.currentfoldername) + self.filedownloadname;
                    self.request_folder_deletion(filepath);

                    // Update UI
                    setTimeout(() => {
                        $(".download-files-panel .refresh-files-list-button").click();
                    }, 1400);
                });
            }
        });

        //! When user dblclicks on a folder
        $(".download-files-panel .files-list-item").off("dblclick").dblclick(function () {

            var foldername = "/" + $(this).attr("filename").replace("/", "");
            var filetype = $(this).attr("filetype");


            if (filetype == "DIR") {
                console.log("Directory clicked: " + foldername);

                self.open_directory(foldername);
            }
        });
    }

    self.process_file_download_data = function (data) {
        // Replace prefix with nothing and <br> with \n
        data = data.replace(/<br>/g, "\n").replace(/gdc-dfl::fdl:/, "");

        self.filedownloadline += 30;

        // Update UI
        self.panel.find(".file-options-download-information .download-progress-icon").css("color", "#c55a0e").addClass("rotate-animation");
        self.panel.find(".file-options-download-information .download-progress").css("color", "#464444").text(self.filedownloadline + " kB downloaded");

        // Append file data
        self.filedownloaddata += data;
        
        var filepath = (self.currentfoldername == "/" ? "" : self.currentfoldername + "/") + self.filedownloadname;

        // Request next part of the data if available
        if (data.length > 0) return self.request_file_download(filepath, self.filedownloadline);
        
        // On download complete
        else {

            // Update UI
            self.panel.find(".file-options-download-information .download-progress-icon").css("color", "#464444").removeClass("rotate-animation");
            self.panel.find(".file-options-download-information .download-progress").css("color", "#464444").text("Download complete");

            self.ipcr.send('ipc/save-file/request', {
                ...global.port,
                windowid: global.states.windowid,
                filedata: self.filedownloaddata,
                filename: self.filedownloadname
            });
            
            
            // Reset global variables
            self.filedownloaddata = "";
            self.filedownloadline = 0;
        }

    }

    self.request_file_download = function (filename, startingline) {

        return new Promise(function (resolve, reject) {
            self.sendcommand("dl" + ":" + filename + "," + startingline);
            self.state = "wait-on-file-download";
        });
    }

    self.request_file_deletion = function (filename) {

        return new Promise(function (resolve, reject) {
            self.sendcommand("rm" + ":" + filename);
            self.state = "wait-for-file-list";
        });
    }

    self.request_folder_deletion = function (filename) {

        return new Promise(function (resolve, reject) {
            self.sendcommand("rmd" + ":" + filename);
            self.state = "wait-for-file-list";
        });
    }

    self.on_file_save_response = function (data) {
        if (data.success) {
            self.panel.find(".file-options-download-information .download-progress-icon").css("color", "#464444").removeClass("rotate-animation");
            self.panel.find(".file-options-download-information .download-progress").css("color", "#464444").text(data.message);
        }
        else {
            self.panel.find(".file-options-download-information .download-progress-icon").css("color", "#c5160eeb").removeClass("rotate-animation");
            self.panel.find(".file-options-download-information .download-progress").css("color", "#464444").text(data.message);
        }

        setTimeout(() => {
            var parent = $(".download-files-panel .file-options-parent");

            // Update UI
            parent.find(".file-options-home").removeClass("hidden");
            self.panel.find(".file-options-download-information").addClass("hidden");
        }, 5000);
    }

    self.open_directory = function (foldername) {

        // Show/hide go up button
        if (foldername != "/") self.panel.find(".go-up-button").removeClass("hidden");
        else if (foldername == "/") self.panel.find(".go-up-button").addClass("hidden");

        // Hide file options div
        self.panel.find(".file-options-parent").addClass("hidden");

        // Hide folder options div
        self.panel.find(".folder-options-parent").addClass("hidden");

        // Setup behaviour of "go up" button
        if (foldername != "/")
            self.panel.find(".go-up-button").attr("target-folder", self.currentfoldername).off("click").click(function () {
                
                // Hide previous errors
                $(".download-files-panel .download-files-list").find(".error-item").remove();
                
                self.open_directory($(this).attr("target-folder"));
            });

        if (self.currentfoldername != foldername) self.currentfoldername = foldername;

        // Clear list
        self.panel.find(".download-files-list .files-list-item").remove();

        // Hide file options
        $(".download-files-panel .file-options-parent").addClass("hidden");

        // Hide download information div
        self.panel.find(".file-options-download-information").addClass("hidden");

        // Show spinner
        $(".download-files-panel .spinner-div").removeClass("hidden");

        self.panel.find(".directory-name-text").text(foldername);

        // Send request to get GatorByte to send sd files list
        self.request_file_list(foldername, 1);
    }
}