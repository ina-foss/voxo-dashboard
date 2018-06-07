var ApiService = {
    getFiles: function(xhrConfig, pageNumber, filesPerPage) {
        if (typeof pageNumber === 'undefined') pageNumber = 0;
        if (typeof filesPerPage === 'undefined') filesPerPage = 10;
        return m.request({method: "GET", url: filesUrl + '?page=' + pageNumber + '&filesPerPage=' + filesPerPage, config: xhrConfig});
    },
    startTranscription: function(file_id, xhrConfig, asrModel) {
        var data;

        data = {id: file_id, asr_model_name: asrModel};


        return m.request({method: "POST", url: processUrl, data: data, config: xhrConfig});

    },
    getAccountInfos: function(xhrConfig) {
        return m.request({method: "GET", url: accountUrl, config: xhrConfig});
    }
};


