// controller
SubmitJobPage = can.Control({

    "init": function(element, options) {
        that = this;
        Application.findOne({
            tool: options.tool
        }, function(application) {
            element.hide();
            element.html(can.view('views/run.ejs', {
                application: application
            }));
            element.fadeIn();

        }, function(message) {
            new ErrorPage(that.element, {
                status: message.statusText,
                message: message.responseText
            });
        });

    },

    '#parameters submit': function(form) {

        // check required parameters.
        if (form[0].checkValidity() === false) {
            form[0].classList.add('was-validated');
            return false;
        }

        //show upload dialog
        var uploadDialog = bootbox.dialog({
            message: can.view('views/run.uploading.ejs'),
            closeButton: false,
            className: 'upload-dialog',
            shown: false
        });

        //start uploading when dialog is shown
        uploadDialog.on('shown.bs.modal', function() {

            var csrfToken;
            if (localStorage.getItem("cloudgene")) {
                try {

                    // get data
                    var data = JSON.parse(localStorage.getItem("cloudgene"));
                    csrfToken = data.csrf;

                } catch (e) {

                }
            }

            //submit form and upload files
            form.ajaxSubmit({
                dataType: 'json',

                headers: {
                    "X-CSRF-Token": csrfToken
                },

                success: function(answer) {

                    uploadDialog.modal('hide');

                    if (answer.success) {
                        can.route('jobs/:job');
                        can.route.attr({
                            route: 'jobs/:job',
                            job: answer.id,
                            page: 'jobs'
                        });

                    } else {
                        new ErrorPage("#content", {
                            status: "",
                            message: answer.message
                        });

                    }
                },

                error: function(message) {
                    uploadDialog.modal('hide');
                    new ErrorPage("#content", {
                        status: message.statusText,
                        message: message.responseText
                    });

                },

                //upade progress bar
                uploadProgress: function(event, position, total, percentComplete) {
                    $("#waiting-progress").css("width", percentComplete + "%");
                }

            });

        });

        //show upload dialog. fires uploading files.
        uploadDialog.modal('show');
        return false;
    },

    // custom file upload controls for single files

    '#select-single-file-btn click': function(button) {
        // trigger click to open file dialog
        fileUpload = button.closest('.col-sm-3').find(":file");
        fileUpload.trigger("click");
    },

    '.file-upload-field-single change': function(fileUpload) {
        filenameControl = fileUpload.parent().find(".file-name-control");
        if (fileUpload[0].files.length > 0) {
            filenameControl.val(fileUpload[0].files[0].name);
        } else {
            filenameControl.val('');
        }
    },

    // custom file upload controls for multiple files

    '#select-files-btn click': function(button) {
        // trigger click to open file dialog
        fileUpload = button.parent().find(":file");
        fileUpload.trigger("click");
    },

    '.file-upload-field-multiple change': function(fileUpload) {
        //update list of files
        fileList = fileUpload.parent().find(".file-list");
        fileList.empty();
        for (var i = 0; i < fileUpload[0].files.length; i++) {
            fileList.append('<li><span class="fa-li"><i class="fas fa-file"></i></span>' + fileUpload[0].files[i].name + '</li>');
        }

        fileUpload.parent().find("#change-files");

        if (fileUpload[0].files.length > 0) {
            fileUpload.parent().find("#select-files").hide();
            fileUpload.parent().find("#change-files").show();
            fileUpload.parent().find("#remove-all-files").show();
        } else {
            fileUpload.parent().find("#select-files").show();
            fileUpload.parent().find("#change-files").hide();
            fileUpload.parent().find("#remove-all-files").hide();
        }
    },

    '#change-files-btn click': function(button) {
        // trigger click to open file dialog
        fileUpload = button.parent().find(":file");
        fileUpload.trigger("click");
    },

    '#remove-all-files-btn click': function(button) {
        //clear hidden file upload field
        fileUpload = button.parent().find(":file");
        fileUpload.val('');
        //clear list of files
        fileList = button.parent().find(".file-list");
        fileList.empty();
        fileUpload.parent().find("#select-files").show();
        fileUpload.parent().find("#change-files").hide();
        fileUpload.parent().find("#remove-all-files").hide();
    },

    // custom handler for import urls

    '.folder-source change': function(source) {

        //delete filelist
        parent = source.parent();

        fileList = parent.find(".file-list");
        fileList.empty();

        //update parameter source
        param = parent.data('param');
        param.attr('source', source.val());
    },

    '#add-urls-btn click': function(button) {

        parent = button.parent();

        fileList = parent.find(".file-list");
        //fileList.empty();

        paramInputField = parent.find(".hidden-parameter");


        urlDialog = bootbox.confirm(
            '<h4>Import data from public URLs</h4>' +
            '<p>Please enter your URLs. </p>' +
            '<form>' +
            '<textarea class="form-control" id="urls" placeholder="http://www.example.com/test-data.txt" rows="8" name="urls" width="30" height="20">' + paramInputField.val() + '</textarea>' +
            '<small class="text-muted">To specify more than one url, separate the urls with a space or new line.</small>' +
            '</form>',
            function(result) {
                if (result) {
                    var urls = $('#urls').val();
                    $.ajax({
                        url: "api/v2/importer/files",
                        type: "POST",
                        data: {
                            input: urls
                        },
                        success: function(data) {

                            var arr = $.parseJSON(data);
                            fileList.empty();
                            $.each(arr, function(index, value) {
                                fileList.append('<li><span class="fa-li"><i class="fas fa-file"></i></span>' + value["text"].toString() + '</li>');
                            });

                            //update value
                            if (arr.length > 0) {
                                paramInputField.val(urls);
                                urlDialog.modal('hide');
                            } else {
                                paramInputField.val("");
                                bootbox.alert("Error: No valid files found on the provided urls.");
                            }

                        },
                        error: function(message) {
                            bootbox.alert("Error: " + message.responseText);
                        }
                    });

                    return false;
                }
            });
    }

});
