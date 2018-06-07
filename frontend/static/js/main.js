var voxo = {};

// 20000 bytes, ~20Mo
voxo.maxFileSize = 20000000;

voxo.correction = {};

voxo.correction.init = function(params){
    voxo.correction.params = params;
    voxo.correction.checkFileSize(
        params.fileSize, 
        params.fileSizeHuman,
        function(isConfirm){
            if (isConfirm) {
                voxo.correction.loadFileFromServer(
                    params.audioUrl,
                    params.otrUrl,
                    params.fileUpdateCorrectionUrl
                );
            } else {
                voxo.correction.loadFileFromDisk(
                    params.otrUrl,
                    params.fileUpdateCorrectionUrl
                );
            }
        }
    );
}

voxo.correction.loadFileFromServer = function(audioUrl, otrUrl, fileUpdateCorrectionUrl) {
    console.log("Loading file from server");

    oT.init(otrUrl, fileUpdateCorrectionUrl);

    $(".textbox-container").show();
    $(".topbar").show();
    $(".controls").show();

    console.log("Loading " + audioUrl);

    oT.media.create( {
        file: audioUrl, 
        onChange: function (name) {console.log(name);} ,
        onReady: function() {
            oT.voxo.initTimeupdate();
            $(window).resize();
            oT.texteditor.adjustPlayerWidth();

        }
    
    } );
}


voxo.correction.loadFileFromDisk = function(otrUrl, fileUpdateCorrectionUrl) {
    console.log("Loading file from disk");
    console.log($(".textbox-container>.input"));
    $(".controls").show();
    $(".textbox-container").show();
    $(".textbox-container>.input").show();
    $(".btn-file-input").click();
    oT.init(otrUrl, fileUpdateCorrectionUrl);
}

voxo.correction.checkFileSize = function(fileSize, fileSizeHuman, loadCallback){

    console.log(fileSize, voxo.maxFileSize);

    if(fileSize > voxo.maxFileSize) {
        swal({
            title: "Fichier volumineux",
            text: "Votre fichier semble volumineux (" + fileSizeHuman + "). Vous devriez le charger directement à partir de votre disque dur pour plus de rapidité.",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "Charger quand même, j'ai une connexion rapide",
            cancelButtonText: "Charger depuis mon disque dur",
            closeOnConfirm: true
        },
        function(isConfirm){
            loadCallback(isConfirm);
        });

    } else {
        loadCallback(true);
    }
}


// JQUERY stuff
//

$(function () {

    // Load the available models
    $.ajax({
      url: modelsUrl,
      headers: {'Authentication-Token': authToken}
    }).done(function(data) {
      console.log(data);

      var optionsAsString = "";
      for(var i = 0; i < data.length; i++) {
          optionsAsString += "<option value='" + data[i].name + "'>" + data[i].description + "</option>";
      }
      $('#asr-models').append( optionsAsString );
      $('#asr-models').selectpicker('refresh');
    });

    $("#transcribe-file").click(function() {
        $('#file-send').removeClass('hidden');
        $('#start-transcription button').prop('disabled', true);
        $('#upload-progress').addClass('hidden');
        $('#upload-error').addClass('hidden');
        $('#files').html('');
    });

    $('#fileupload').fileupload({
        url: uploadUrl,
        dataType: 'json',
        autoUpload: true,
        headers: {'Authentication-Token': authToken},
        done: function (e, data) {
            $('#upload-progress').addClass('hidden');
            var myFile = $('<button type="button" class="btn btn-success file-uploaded"><i class="fa fa-check"></i> <span>' + data.jqXHR.responseJSON.filename + '</span></button>');
            myFile.data('remote-id', data.jqXHR.responseJSON.id);

            $('#files').append(myFile);
            $('#upload-error').addClass('hidden');
            $('#start-transcription button').prop('disabled', false);

        },
        fail: function (e, data) {
            var json = JSON.parse(data.jqXHR.responseText);
            $('#upload-progress').addClass('hidden');
            $('#file-send').removeClass('hidden');
            $('#upload-error').removeClass('hidden');
            $('#upload-error span').html(json.error);
        },
        send: function (e, data) {
            $('#file-send').addClass('hidden');
            $('#upload-progress').removeClass('hidden');
        },
        progressall: function (e, data) {
            var progress = parseInt(data.loaded / data.total * 100, 10);

            $('#upload-progress>div').css(
                'width',
                progress + '%'
            ).attr('aria-valuenow', progress);

            $('#upload-progress>div>span').html(
                progress + '%'
            );
        }

    });
});
