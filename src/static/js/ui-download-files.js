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
            
            // Clear list
            $(".download-files-panel .download-files-list .files-list-item").remove();

            // Hide file options
            $(".download-files-panel .file-options-parent").addClass("hidden");

            // Show spinner
            $(".download-files-panel .spinner-div").removeClass("hidden");

            // Send request to get GatorByte to send sd files list
            var prefix = "##GB##", suffix = "#EOF#";
            self.ipcr.send('send-command-request', {
                command: prefix + "files-list:list,/" + suffix,
                windowid: global.states.windowid,
                path: global.port.path
            });
            self.state = "wait-for-file-list";
        });
    }

    self.list_files = function (line) {
        line = line.replace(/<br>/g, "");

        if (self.state == "wait-for-file-list") {
            if (line.startsWith("file:")) self.update_file_list_ui(line.replace(/result:/, ""));
        }
        else if (self.state == "wait-on-file-download") {
            
            // Do nothing

        }
    }

    self.update_file_list_ui = function (line) {
        var file = line.replace(/file:/, "");

        // Ignore '/' folder
        if (file == "/") return;

        // If file already exists in the list, do not add
        if ($(".download-files-panel .download-files-list .files-list-item[filename='" + file + "']").length == 0) {

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
                    <div class="col-auto files-list-item shadow-heavy" filename="{{filename}}" style="text-align: center;position: relative;padding: 6px 8px;margin-right: 10px;margin-bottom: 10px;height: 100px;width: 85px;background: #ffffff1f;border-radius: 4px;">
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
                    filename: filename,
                    filesize: filesize,
                    filetype: extension.substring(0, 3),
                    filecolor: extensioncolors[knownextensions.indexOf(extension.substring(0, 3))]
                }));
            });
        }

        // On file clicked
        $(".download-files-panel .files-list-item").off("click").click(function () {
            var filename = $(this).attr("filename");
            var parent = $(".download-files-panel .file-options-parent");

            // Hide the file options
            if (parent.attr("state") == "file-selected" && filename == parent.attr("selected-file")) {
                parent.attr("state", "no-file-selected").attr("selected-file", "");
                parent.find(".filename").text("-");

                // Hide file options div
                parent.addClass("hidden");
                parent.find(".file-options-home").removeClass("hidden");
                parent.find(".file-options-download-information").addClass("hidden");
                
                $(".download-files-panel .files-list-item").css("background", "#ffffff1f").removeClass("selected");
            }

            // Show file options and select the file
            else {
                parent.attr("state", "file-selected").attr("selected-file", filename);
                
                $(".download-files-panel .files-list-item").css("background", "#ffffff1f").removeClass("selected");
                $(this).css("background", "#355377").addClass("selected");

                // Show file options div
                parent.removeClass("hidden");
                parent.find(".file-options-home").removeClass("hidden");
                parent.find(".file-options-download-information").addClass("hidden");

                // Setup UI
                parent.find(".filename").text(filename);
            }

            // Save file button listener (Download file)
            $(".download-files-panel .file-options-parent .download-file-button").off("click").click(function () {
                var filename = $(".download-files-panel .files-list-item.selected").attr("filename");

                // Send download request
                self.filedownloadname = filename;
                self.filedownloaddata = "";
                self.filedownloadline = 0;
                self.request_file_download(self.filedownloadname, self.filedownloadline);

                // Update UI
                parent.find(".file-options-home").addClass("hidden");
                parent.find(".file-options-download-information").removeClass("hidden");
                parent.find(".file-options-download-information .download-progress").css("color", "#424242").text("Starting download");
            });
        });
    }

    self.process_file_download_data = function (data) {
        // Replace prefix with nothing and <br> with \n
        data = data.replace(/<br>/g, "\n").replace(/gdc-dfl::fdl:/, "");

        self.filedownloadline += 30;

        // Update UI
        $(".download-files-panel").find(".file-options-download-information .download-progress").css("color", "#904c07").text(self.filedownloadline + " kB downloaded");

        // Append file data
        self.filedownloaddata += data;

        // Request new data
        if (data.length > 0) self.request_file_download(self.filedownloadname, self.filedownloadline);
        
        // On download complete
        else {

            // Update UI
            $(".download-files-panel").find(".file-options-download-information .download-progress").css("color", "#104c09").text("Download complete");

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
        self.sendcommand("download" + ":" + filename + "," + startingline);
        self.state = "wait-on-file-download";
    }

    self.on_file_save_response = function (data) {
        if (data.success) {
            $(".download-files-panel").find(".file-options-download-information .download-progress").css("color", "#104c09").text(data.message);
        }
        else {
            $(".download-files-panel").find(".file-options-download-information .download-progress").css("color", "#904c07").text(data.message);
        }

        setTimeout(() => {
            var parent = $(".download-files-panel .file-options-parent");

            // Update UI
            parent.find(".file-options-home").removeClass("hidden");
            parent.find(".file-options-download-information").addClass("hidden");
        }, 2000);
    }
}