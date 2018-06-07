jQuery( document ).ready(function( $ ) {
    // Setup html5 version
    $("#uploader").pluploadQueue({
        // General settings
        runtimes : 'html5,html4',
        url : uploadUrl,
        headers: {'Authentication-Token': authToken},

        rename : true,
        dragdrop: true
    });
});
