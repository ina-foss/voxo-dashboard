var upload = {};

//define the view-model
upload.vm = {
    init: function() {

    },
    startTranscription: function() {
        var asrModel = $("#asr-models").val();
        console.log("Selected model: ", asrModel);

        $('.file-uploaded').each(function( index ) {
            ApiService.startTranscription(
                $(this).data('remote-id'),
                xhrConfig,
                asrModel
            );
        });

        $('#uploadFile').modal('hide');
        swal({   title: "Transcription démarrée !",   text: "Vos fichiers sont en cours de traitement.",   timer: 3000, type: "success" });

        if (typeof filelist != 'undefined') {
            filelist.vm.loadFiles();
        }
    }
};

upload.controller = function() {
    upload.vm.init()

};

upload.view = function() {
    return m("button", {class: 'btn btn-success', disabled: 'disabled', onclick: upload.vm.startTranscription }, "Lancer la transcription");
};


m.mount(document.getElementById("start-transcription"), {controller: upload.controller, view: upload.view});
