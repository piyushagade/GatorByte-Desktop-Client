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
    self.panel = $(".sd-explorer-panel");
    self.currentfoldername = "/";

    self.init = function () {

        // Start listeners
        self.listeners();

        return self;
    }

    self.sendcommand = function (command) {
        self.ipcr.send('ipc/command/push', {
            command: command,
            windowid: global.states.windowid,
            path: global.port.path
        });
    }
    
    self.listeners = function () {

        // Big button
        $(".home-panel .download-files-button").off("click").click(function () {
            $(".sd-explorer-panel").removeClass("hidden");
            $(".home-panel").addClass("hidden");
            $(".gb-config-header").addClass("hidden");
            self.panel.find(".file-viewer-div").addClass("hidden");
            self.panel.find(".file-list-parent").removeClass("hidden");
        
            // // Ensure all base files/folders exist
            // self.sendcommand("sdf:cr:all");
        
            // Hide previous errors
            $(".sd-explorer-panel .download-files-list").find(".error-item").remove();
            
            // Send request to get GatorByte to send sd files list
            self.open_directory("/");

            //! Upload file button listener
            $(".sd-explorer-panel .upload-file-button").off("click").click(function (e) {
                $(".sd-explorer-panel .upload-file-button-accessories").find(".file-input").click();
            });
            
            //! On upload file selected listener
            $(".sd-explorer-panel .upload-file-button-accessories").find(".file-input").off("change").on("change", function () {
                
                if (this.files && this.files.length > 0) {
                    $(".panel").addClass("disabled");
                    $(".header-panel").find(".progress-bar-overlay").removeClass("hidden");
                    $(".header-panel").find(".download-status-heading").text("Uploading");
                    $(".header-panel").find(".download-status-text").text("Sending " + (this.files.length + " file" + (this.files.length == 1 ? "" : "s")));
                    $(".header-panel").find(".progress-bar-overlay").find(".progress").removeClass("progress-striped").addClass("progress-striped-infinite");
                    $(".header-panel").find(".progress-bar-overlay").find(".progress").find(".progress-bar").css("width", $(".header-panel").find(".progress-bar-overlay").find(".progress").width());

                    var fileList = [];
                    for (var i = 0; i < this.files.length; i++) {
                        fileList.push(this.files[i]);
                    }
                    // For every selected file
                    fileList.forEach(function (file, index) {
                        var foldername = self.currentfoldername + (self.currentfoldername.endsWith("/") ? "" : "/")
                        var filename = foldername + file.name;
                        var filesize = file.size;
                        var filepath = file.path;

                        self.ipcr.send('ipc/upload-file/request', {
                            ...global.port,
                            windowid: global.states.windowid,
                            filename: filename, 
                            filesize: filesize, 
                            filepath: filepath
                        });
                    });
                }

                // // Refresh UI
                // setTimeout(() => {
                //     $(".sd-explorer-panel .refresh-files-list-button").click();
                // }, 1000);
            });

            //! Create directory button listener
            $(".sd-explorer-panel .make-directory-button").off("click").click(function () {

                var path = self.currentfoldername.startsWith("/") ? self.currentfoldername.substring(1, self.currentfoldername.length) : self.currentfoldername;
                self.request_folder_creation(path, "folder");
            });
        });

        //! Refresh list button listener
        $(".sd-explorer-panel .refresh-files-list-button").off("click").click(function () {
            
            // Hide file options
            $(".sd-explorer-panel .file-options-parent").addClass("hidden");

            // Hide previous errors
            $(".sd-explorer-panel .download-files-list").find(".error-item").remove();

            // Show spinner
            self.show_progress_bar("Please wait", "Refreshing directory");

            // Send request to get GatorByte to send sd files list
            self.request_file_list(self.currentfoldername, 1);
        });
    }

    self.show_progress_bar = function (title, subtitle) {
        title = title || "";
        subtitle = subtitle || "";
        $(".panel").addClass("disabled");
        $(".header-panel").find(".progress-bar-overlay").removeClass("hidden");
        $(".header-panel").find(".download-status-heading").text(title);
        $(".header-panel").find(".download-status-text").text(subtitle);
        $(".header-panel").find(".progress-bar-overlay").find(".progress").removeClass("progress-striped").addClass("progress-striped-infinite");
        $(".header-panel").find(".progress-bar-overlay").find(".progress").find(".progress-bar").css("width", $(".header-panel").find(".progress-bar-overlay").find(".progress").width());
    }

    self.hide_progress_bar = function () {
        $(".panel").removeClass("disabled");
        $(".header-panel").find(".progress-bar-overlay").addClass("hidden");
        $(".header-panel").find(".download-status-heading").text("");
        $(".header-panel").find(".download-status-text").text("");
        $(".header-panel").find(".progress-bar-overlay").find(".progress").find(".progress-bar").css("width", 0);
    }

    self.request_file_list = function (dir, page) {
        var prefix = "##GB##", suffix = "#EOF#";
        self.ipcr.send('ipc/command/push', {
            command: prefix + "fl:list," + dir + suffix,
            windowid: global.states.windowid,
            path: global.port.path
        });
        
        // Clear list
        self.panel.find(".download-files-list .files-list-item").remove();

        self.state = "wait-for-file-list";
    }

    self.process_response = function (response) {

        if (response.indexOf("error:") !== -1) {
            var error = response.split(":")[1];
            self.show_error(error);
        }
        else if (response.startsWith("file:")) {
            var line = response.replace(/<br>/g, "");

            if (self.state == "wait-for-file-list") {
                self.update_file_list_ui(line.replace(/file:/, ""));
            }
            else if (self.state == "wait-on-file-download") {
                
                // Do nothing

            }
        }
        else if (response.startsWith("upl:ack")){
            $(".header-panel").find(".download-status-heading").text("Uploading 🟢");
            setTimeout(() => {
                $(".header-panel").find(".download-status-heading").text("Uploading");
            }, 400);
        }
    }

    self.show_error = function (error) {
        console.log("Error listing files: " + error);

        if (error == "nodevice") {

            // Hide spinner
            self.hide_progress_bar();

            // Hide previous errors
            $(".sd-explorer-panel .download-files-list").find(".error-item").remove();
            
            $(".sd-explorer-panel .download-files-list").append(multiline(function () {/* 
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
            self.hide_progress_bar();

            // Hide previous errors
            $(".sd-explorer-panel .download-files-list").find(".error-item").remove();
            
            $(".sd-explorer-panel .download-files-list").append(multiline(function () {/* 
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
        if ($(".sd-explorer-panel .download-files-list .files-list-item[filename='" + file + "']").length == 0) {
            
            // Hide previous errors
            $(".sd-explorer-panel .download-files-list").find(".error-item").remove();

            // Hide spinner
            self.hide_progress_bar();

            file.split(",").forEach(function (entry, ei) {

                // console.log(entry);

                var filename = entry.split(":")[0];
                var filesize = parseInt(entry.split(":")[1]); // Size in bytes
                var filesizetext;

                // Parse filesize
                if (!isNaN(filesize)) {
                    if (filesize >= 1024 * 1024) filesizetext = (filesize / 1024).toFixed(2) + " MB";
                    else if (filesize >= 1024) filesizetext = (filesize / 1024).toFixed(2) + " kB";
                    else if (filesize >= 0) filesizetext = (filesize) + " B";
                }
                
                var isfolder = filename.endsWith("/");
                var extension = (isfolder ? "dir" : (filename.split(".").length > 1 ? filename.split(".")[1] : "")).toUpperCase();
                var knownextensions = ["DIR", "CSV", "LOG", "INI"];
                var extensioncolors = ["#c74b0f", "green", "#962020", "#1969cc"];

                $(".sd-explorer-panel .download-files-list").append(multiline(function () {/* 
                    <div class="col-auto files-list-item" filesize="{{filesize}}" filename="{{filename}}" filetype="{{filetype}}" style="text-align: center;position: relative;padding: 6px 8px;margin-right: 10px;margin-bottom: 10px;height: 100px;width: 85px;background: #ffffff1f;border-radius: 4px;">
                        <div style="color: #f1f1f1;font-size: 36px;">
                            {{fileicon}}
                            <div style="color: #ffffff;font-size: 10px;position: absolute;top: 6px;left: 5px;margin: auto auto;background: {{filecolor}};padding: 0px 2px;border-radius: 2px;">
                                {{filetype}}
                            </div>
                        </div>
                        <div contenteditable class="truncate file-name-text" filename="{{filename}}" title="{{filename}}" style="color: #BBBBBB;font-size: 13px;">
                            {{filename}}
                        </div>
                        <div class="truncate" style="color: #88adff;font-size: 10px;">
                            {{filesizetext}}
                        </div>
                    </div>
                */}, {
                    fileicon: isfolder ? '<i class="fa-solid fa-folder"></i>' : '<i class="fa-solid fa-file-lines"></i>',
                    filename: isfolder ? filename.replace("/", "") : filename,
                    filesizetext: isfolder ? "N/A" : filesizetext,
                    filesize: isfolder ? 1 : filesize,
                    filetype: extension.substring(0, 3),
                    filecolor: extensioncolors[knownextensions.indexOf(extension.substring(0, 3))]
                }));
            });
        }

        //! Rename folder/file
        $(".sd-explorer-panel .files-list-item .file-name-text").off("keyup").keyup(self.f.debounce(function () {
            var oldname = $(this).attr("filename").trim();
            var newname = $(this).text().trim();

            // Only folder
            if (!oldname.startsWith("/")) return;

            self.request_rename(oldname.substring(1, oldname.length), newname.substring(1, newname.length));
            $(this).blur();
        }, 1000));

        //! When user clicks on an icon
        $(".sd-explorer-panel .files-list-item").off("click").click(function () {
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
                    
                    $(".sd-explorer-panel .files-list-item").css("background", "#ffffff1f").removeClass("selected");
                }

                //! Show file options and select the file
                else {
                    
                    $(".sd-explorer-panel .files-list-item").css("background", "#ffffff1f").removeClass("selected");
                    $(this).css("background", "#355377").addClass("selected");

                    // Show file options div
                    self.panel.find(".file-options-parent").removeClass("hidden");
                    self.panel.find(".file-options-download-information").addClass("hidden");
                    
                    // Hide folder options div
                    self.panel.find(".folder-options-parent").addClass("hidden");
                }

                //! Save file button listener (Download file)
                $(".sd-explorer-panel .file-options-parent .download-file-button").off("click").click(function () {
                    var filename = $(".sd-explorer-panel .files-list-item.selected").attr("filename");
                    var filesize = $(".sd-explorer-panel .files-list-item.selected").attr("filesize");

                    if (filesize > 20000) {
                        var time;
                        if (filesize > 60000) time = (parseFloat(filesize) / 60000).toFixed(1) + " minutes";
                        else time = (parseFloat(filesize) / 1000).toFixed(0) + " seconds";
                        self.a.ui.notification({
                            "contexttype": "error",
                            "overlaytype": "dialog",
                            "heading": "Download large file",
                            "body": "This file will take " + time + " to download. Are you sure you want to download the file?",
                            "okay": "Yes",
                            "dismiss": "Cancel",
                            "onokay": function () {
                                onproceed();
                            }
                        });
                    }
                    else {
                        onproceed();
                    }

                    function onproceed() {
                        // Send download request
                        self.filedownloadname = filename;
                        self.filedownloaddata = "";
                        self.filedownloadline = 0;
                        self.filedownloadsize = filesize;

                        var filepath = (self.currentfoldername == "/" ? "" : self.currentfoldername + "/") + self.filedownloadname;
                        self.request_file_download(filepath, self.filedownloadline);

                        // Update UI
                        self.panel.find(".file-options-home").addClass("hidden");
                        // self.panel.find(".file-options-download-information").removeClass("hidden");
                        // self.panel.find(".file-options-download-information .download-progress-icon").css("color", "#c55a0e").addClass("rotate-animation");
                        // self.panel.find(".file-options-download-information .download-progress").css("color", "#464444").text("Starting download");
                    }
                });

                //! Delete file button listener
                $(".sd-explorer-panel .file-options-parent .delete-file-button").off("click").click(function () {
                    var filename = $(".sd-explorer-panel .files-list-item.selected").attr("filename");

                    self.a.ui.notification({
                        "contexttype": "error",
                        "overlaytype": "dialog",
                        "heading": "Delete file?",
                        "body": "Are you sure you want to delete this item?",
                        "okay": "Delete",
                        "dismiss": "Cancel",
                        "onokay": function () {
                            
                            // Send download request
                            self.filedownloadname = filename;
                            self.filedownloaddata = "";
                            self.filedownloadline = 0;

                            var filepath = (self.currentfoldername == "/" ? "" : self.currentfoldername + "/") + self.filedownloadname;
                            self.request_file_deletion(filepath);

                            // Update UI
                            setTimeout(() => {
                                $(".sd-explorer-panel .refresh-files-list-button").click();
                                self.panel.find(".file-options-parent").addClass("hidden");
                            }, 400);
                        }
                    });
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
                    
                    $(".sd-explorer-panel .files-list-item").css("background", "#ffffff1f").removeClass("selected");
                    $(this).css("background", "#355377").addClass("selected");
                }
                
                //! Delete folder button listener
                $(".sd-explorer-panel .folder-options-parent .delete-folder-button").off("click").click(function () {
                    var selectedfolder = $(".sd-explorer-panel .files-list-item.selected").attr("filename");

                    self.a.ui.notification({
                        "contexttype": "error",
                        "overlaytype": "dialog",
                        "heading": "Delete folder?",
                        "body": "Are you sure you want to delete the folder and all its contents?",
                        "okay": "Delete",
                        "dismiss": "Cancel",
                        "onokay": function () {
                            
                            var folderpath = self.currentfoldername + selectedfolder.substring(1, selectedfolder.length);
                            self.request_folder_deletion(folderpath);

                            // Update UI
                            setTimeout(() => {
                                $(".sd-explorer-panel .refresh-files-list-button").click();
                                self.panel.find(".folder-options-parent").addClass("hidden");
                            }, 400);
                        }
                    });
                });
            }
        });

        //! When user dblclicks on a folder/file
        $(".sd-explorer-panel .files-list-item").off("dblclick").dblclick(function () {

            var foldername = "/" + $(this).attr("filename").replace("/", "");
            var filename = $(this).attr("filename").replace("/", "");
            var filetype = $(this).attr("filetype");


            if (filetype == "DIR") {
                console.log("Directory clicked: " + foldername);

                self.open_directory(foldername);
            }

            else {
                console.log("File clicked: " + filename);

                if (
                    filename.toLowerCase().endsWith(".ini") ||
                    filename.toLowerCase().endsWith(".txt") ||
                    filename.toLowerCase().endsWith(".csv") ||
                    filename.toLowerCase().endsWith(".queue") ||
                    filename.toLowerCase().endsWith(".log") ||
                    filename.toLowerCase().endsWith(".debug")
                ) {
                    self.open_file_viewer(filename);
                }

            }
        });
        
    }

    self.process_file_download_data = function (data) {
        // Replace prefix with nothing and <br> with \n
        data = data.replace(/<br>/g, "\n").replace(/gdc-dfl::fdl:/, "");

        self.filedownloadline += 40;

        // Throttle UI updates
        if ((self.filedownloadline / 40) % 5 == 0) {
            var filesize = parseFloat(self.filedownloadline);
            var filesizetext;
            if (filesize > 1 * 1024 * 1024) filesizetext = (filesize / 1024 / 1024).toFixed(1) + " MB"
            else if (filesize > 1 * 1024) filesizetext = (filesize / 1024).toFixed(1) + " kB"
            else filesizetext = (filesize) + " B"
            // self.panel.find(".file-options-download-information .download-progress-icon").css("color", "#c55a0e").addClass("rotate-animation");
            // self.panel.find(".file-options-download-information .download-progress").css("color", "#464444").text(filesize + " downloaded");

            $(".panel").addClass("disabled");
            $(".header-panel").find(".progress-bar-overlay").removeClass("hidden");
            $(".header-panel").find(".download-status-heading").text("Downloading file");
            $(".header-panel").find(".download-status-text").text(filesizetext + " downloaded");
            $(".header-panel").find(".progress-bar-overlay").find(".progress").addClass("progress-striped").removeClass("progress-striped-infinite");
            $(".header-panel").find(".progress-bar-overlay").find(".progress").find(".progress-bar").css("width", (parseFloat(filesize) / parseFloat(self.filedownloadsize)) * $(".header-panel").find(".progress-bar-overlay").find(".progress").width());
        }

        // Append file data
        self.filedownloaddata += data.replace(/#DLEOF#/g, "");
        
        // On download complete
        if (data.indexOf("#DLEOF#") !== -1) {

            console.log("File download complete");

            // Update UI
            // self.panel.find(".file-options-download-information .download-progress-icon").css("color", "#464444").removeClass("rotate-animation");
            // self.panel.find(".file-options-download-information .download-progress").css("color", "#464444").text("Download complete");
            
            $(".header-panel").find(".download-status-text").text("Download complete");
            $(".header-panel").find(".progress-bar-overlay").find(".progress").find(".progress-bar").css("width", $(".header-panel").find(".progress-bar-overlay").find(".progress").width());

            if (self.panel.find(".file-viewer-div").hasClass("hidden")) {
                self.ipcr.send('ipc/save-file/request', {
                    ...global.port,
                    windowid: global.states.windowid,
                    filedata: self.filedownloaddata,
                    filename: self.filedownloadname
                });
            }

            else {
                self.editor.setValue(self.filedownloaddata);

                $(".header-panel").find(".download-status-text").text("Opening file");
                setTimeout(() => {
                    $(".panel").removeClass("disabled");
                    $(".header-panel").find(".progress-bar-overlay").addClass("hidden");
                    $(".header-panel").find(".progress-bar-overlay").find(".progress").find(".progress-bar").css("width", 0);
                }, 1000);
            }
            
            // Reset global variables
            self.filedownloaddata = "";
            self.filedownloadline = 0;
        }

        // Download in progress
        else {

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

    self.request_folder_creation = function (path, foldername) {

        return new Promise(function (resolve, reject) {
            self.sendcommand("crd" + ":" + path + foldername);
            self.state = "wait-for-file-list";
            
            // Update UI
            setTimeout(() => {
                $(".sd-explorer-panel .refresh-files-list-button").click();
            }, 1500);
        });
    }

    self.request_rename = function (oldname, newname) {

        return new Promise(function (resolve, reject) {
            self.sendcommand("rnd:" + oldname + "#" + newname);
            self.state = "wait-for-file-list";
            
            // Update UI
            setTimeout(() => {
                $(".sd-explorer-panel .refresh-files-list-button").click();
            }, 1500);
        });
    }

    self.request_folder_deletion = function (filename) {

        return new Promise(function (resolve, reject) {
            self.sendcommand("rmd" + ":" + filename);
            self.state = "wait-for-file-list";
        });
    }

    self.on_file_upload_response = function (data) {
        if (data.status) {

            $(".header-panel").find(".download-status-text").text("File uploaded successfully. Please refresh the list.");
            setTimeout(() => {
                $(".panel").removeClass("disabled");
                $(".header-panel").find(".progress-bar-overlay").addClass("hidden");
            }, 2000);

            // // Update UI
            // setTimeout(() => {
            //     $(".sd-explorer-panel .refresh-files-list-button").click();
            // }, 1500);
        }
        else {
            $(".header-panel").find(".download-status-text").text("Error encountered");
            setTimeout(() => {
                $(".panel").removeClass("disabled");
                $(".header-panel").find(".progress-bar-overlay").addClass("hidden");
            }, 3000);
        }
    }

    self.on_file_save_response = function (data) {
        if (data.success) {
            // self.panel.find(".file-options-download-information .download-progress-icon").css("color", "#464444").removeClass("rotate-animation");
            // self.panel.find(".file-options-download-information .download-progress").css("color", "#464444").text(data.message);
            $(".header-panel").find(".download-status-text").text("File saved");
            setTimeout(() => {
                $(".panel").removeClass("disabled");
                $(".header-panel").find(".progress-bar-overlay").addClass("hidden");
                $(".header-panel").find(".progress-bar-overlay").find(".progress").find(".progress-bar").css("width", 0);
            }, 1000);
        }
        else {
            // self.panel.find(".file-options-download-information .download-progress-icon").css("color", "#c5160eeb").removeClass("rotate-animation");
            // self.panel.find(".file-options-download-information .download-progress").css("color", "#464444").text(data.message);
            $(".header-panel").find(".download-status-text").text("File saving cancelled");
            setTimeout(() => {
                $(".panel").removeClass("disabled");
                $(".header-panel").find(".progress-bar-overlay").addClass("hidden");
                $(".header-panel").find(".progress-bar-overlay").find(".progress").find(".progress-bar").css("width", 0);
            }, 1000);
        }

        setTimeout(() => {
            var parent = $(".sd-explorer-panel .file-options-parent");

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
                $(".sd-explorer-panel .download-files-list").find(".error-item").remove();
                
                self.open_directory($(this).attr("target-folder"));
            });

        if (self.currentfoldername != foldername) self.currentfoldername = foldername;

        // // Clear list
        // self.panel.find(".download-files-list .files-list-item").remove();

        // Hide file options
        $(".sd-explorer-panel .file-options-parent").addClass("hidden");

        // Hide download information div
        self.panel.find(".file-options-download-information").addClass("hidden");

        // Show spinner
        self.show_progress_bar("Please wait", "Opening directory");

        self.panel.find(".directory-name-text").text(foldername);

        // Send request to get GatorByte to send sd files list
        self.request_file_list(foldername, 1);
    }

    self.open_file_viewer = function (filename) {

        var filesize = $(".sd-explorer-panel .files-list-item.selected").attr("filesize");

        if (filesize > 20000) {
            var time;
            if (filesize > 60000) time = (parseFloat(filesize) / 60000).toFixed(1) + " minutes";
            else time = (parseFloat(filesize) / 1000).toFixed(0) + " seconds";
            self.a.ui.notification({
                "contexttype": "error",
                "overlaytype": "dialog",
                "heading": "Download large file",
                "body": "This file will take " + time + " to download. Are you sure you want to download the file?",
                "okay": "Yes",
                "dismiss": "Cancel",
                "onokay": function () {
                    onproceed();
                }
            });
        }
        else {
            onproceed();
        }

        function onproceed() {
            
            // Send download request
            self.filedownloadname = filename;
            self.filedownloaddata = "";
            self.filedownloadline = 0;
            self.filedownloadsize = filesize;

            var filepath = (self.currentfoldername == "/" ? "" : self.currentfoldername + "/") + self.filedownloadname;
            self.request_file_download(filepath, self.filedownloadline);

            // Update UI
            self.panel.find(".file-options-home").addClass("hidden");
        }

        // Clear text
        if (self.editor) self.editor.setValue("");
        
        self.panel.find(".file-list-parent").addClass("hidden");
        self.panel.find(".file-viewer-div").removeClass("hidden").height($(".sd-explorer-panel").height());

        if (!self.editor) {
            self.editor = CodeMirror.fromTextArea($(".codemirror-textarea")[0], {
                mode: { name: "javascript", json: true },
                lineNumbers: true,
                lineWrapping: false,
                theme: "darcula",
                lint: true,
                scrollbarStyle: "overlay",
                fontSize: 12,
                autoIndent: true,
                foldGutter: true,
                gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
                foldOptions: {
                    widget: (from, to) => {
                        var count = undefined;
                        var editor = window.globals.variables["configeditor"];

                        // Get open / close token
                        var startToken = '{', endToken = '}';
                        var prevLine = editor.getLine(from.line);
                        if (prevLine.lastIndexOf('[') > prevLine.lastIndexOf('{')) {
                            startToken = '[', endToken = ']';
                        }

                        // Get json content
                        var internal = editor.getRange(from, to);
                        var toParse = startToken + internal + endToken;

                        // Get key count
                        try {
                            var parsed = JSON.parse(toParse);
                            count = Object.keys(parsed).length;
                        } catch (e) { }

                        // return count ? `\u21A4${count}\u21A6` : '\u2194';
                        return " --- "
                    },
                },
                readOnly: true 
            });

            resize ();
            $(window).resize(self.f.debounce(function () {
                resize ();
            }, 100));

            $(".CodeMirror-hscrollbar").addClass("scrollbar-style-horizontal");
            $(".CodeMirror.cm-s-darcula.CodeMirror-overlayscroll").css("padding", "0").css("margin-top", "6px");
            $(".CodeMirror-sizer").css("font-size", "13px");

            function resize () {
                // Set height of the editor
                var height = $(".html-slidein-ui .html-placeholder").height() - $(".config-editor-header").height() - 30;
                $(".site-config-div").height(height);
                self.editor.setSize("100%", "100%");
            }
        }
    }
}