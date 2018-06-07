var filelist = {};

filelist.secondsToHms = function (d) {
    d = Number(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);
    return ((h > 0 ? h + " heure" + (h > 1 ? "s " : " ") + (m < 10 ? "0" : "") : "") + m + " min " + (s < 10 ? "0" : "") + s); 
}

filelist.tooltipConfig = function(ctrl) {
    return function(element, isInitialized) {
        var el = $(element);

        if (!isInitialized) {
            //set up select2 (only if not initialized already)
            el.tooltip();
        }
    }
}

filelist.vm = (function() {
    var vm = {}

    vm.init = function() {
        vm.currentPage = m.route.param("page");
        vm.filesPerPage = m.prop(10);
        vm.maxPages = 20;

        vm.files = m.prop(new Array()); //default value


        vm.loadFiles();

        vm.timerID = setInterval(function() {
            vm.loadFiles();
        }, 5000);
    };

    vm.loadFiles = function() {
        ApiService.getFiles(xhrConfig, vm.currentPage, vm.filesPerPage()).then(vm.files);
    }

    vm.colorForFile = function(file) {
        if(file.processes.length > 0) {
            var status = file.processes[0].status_id;    
            if(status == 1) {
                //Queued
                return 'color5';
            } else if (status == 2) {
                //In progress
                return 'color9';
            } else if (status == 5) {
                //Finished
                return 'color7';
            } else if (status == 6) {
                //Error
                return 'color10';
            } else {
                return '';
            }
        } else {
            return '';
        }
    }

    vm.decodingTimeForFile = function(file) {
        var content = [];
        if(file.processes.length == 0) {

            content.push(m('span', {class: "label color2-bg"}, "-"));
        } else {
            var firstProcessId = file.processes[0].status_id;
            var firstProcess = file.processes[0];
            if(firstProcessId == 1) {
                content.push(m('span', {class: "label label-default"}, "-"));
            } else if(firstProcessId == 2) {
                content.push(m('span', {class: "label color9-bg"}, "-"));
            } else if(firstProcessId == 5) {

                var type = firstProcess.asr_model_name;

                content.push(m('span', {class: "label label-success"}, filelist.secondsToHms(firstProcess.duration) + ' (x' + (firstProcess.duration / file.duration).toFixed(1) + ')'));

            } else if(firstProcessId == 6) {
                content.push(m('span', {class: "label label-danger"}, "Erreur"));
            }

        }

        return m('td', {style: 'white-space: nowrap'}, content );
    };


    vm.modelForFile = function(file) {
        var content = [];
        if(file.processes.length == 0) {

            content.push(m('span', {style: "color: #37363e;"}, "-"));
        } else {
            var firstProcess = file.processes[0];
            content.push(m('span', {style: "color: #37363e;"}, firstProcess.asr_model_name));

        }

        return m('td', {style: 'white-space: nowrap'}, content );
    };

    vm.statusForFile = function(file) {
        var content = [];
        if(file.processes.length == 0) {

            content.push(m('span', {class: "label color2-bg"}, "Non lancé"));
        } else {
            var firstProcessId = file.processes[0].status_id;
            var firstProcess = file.processes[0];
            if(firstProcessId == 1) {
                content.push(m('span', {class: "label label-default"}, "En attente"));
            } else if(firstProcessId == 2) {
                content.push(
                    m('div', {class: "progress progress-striped active"}, [
                        m('div', {class: "progress-bar progress-bar-warning", role:"progressbar", 'aria-valuenow':"60", 'aria-valuemin':"0", 'aria-valuemax':"100", style:"width: " + firstProcess.progress + "%;"}, [
                            m('span', firstProcess.progress+'%')                        
                        ])
                    ])
                );

            } else if(firstProcessId == 5) {

                var type = firstProcess.asr_model_name;

                content.push(m('span', {config: filelist.tooltipConfig(), class: "label label-success", 'data-toggle':"tooltip", 'data-placement':"bottom", title:"Temps : " + filelist.secondsToHms(firstProcess.duration) + ' (x' + (firstProcess.duration / file.duration).toFixed(1) + '), ' + type}, "Terminé"));

            } else if(firstProcessId == 6) {
                content.push(m('span', {class: "label label-danger"}, "Erreur"));
            }

        }

        return m('td', {style: 'white-space: nowrap'}, content );
    };

    vm.pages = function(current, nbPerPage, maxPages) {
        var items = [];
        var nb = Math.ceil(filelist.vm.files().nb / nbPerPage);

        var displayed = true;
        if(current != 0) {
            items.push(m('li',{}, 
                        m("a[href='/files/" + (current - 1) + "']",{ config: m.route, 'data-page':(current-1)}, 'Précédent')));

        }
        for(var i=0; i<nb; i++) {

            if(nb > maxPages && current != i && ((i + 1) > (maxPages / 2) && i < (nb - maxPages / 2))) {
                // If the last item was displayed (not a ...), display a ...
                // Otherwise just skip
                if(displayed) {
                    items.push(m('li',{}, 
                                m("a",{}, '…')));

                    displayed = false;
                }

            } else {
                items.push(m('li',{class: current == i ? 'active':''}, 
                            m("a[href='/files/" + i + "']",{ config: m.route, 'data-page':i}, i+1)));
                displayed = true;
            }
        }

        if(current < nb-1) {
            items.push(m('li',{}, 
                        m("a[href='/files/" + (current + 1) + "']",{ config: m.route, 'data-page':(current+1)}, 'Suivant')));

        }

        return items;
    };

    vm.downloadLinks = function(file) {

        if(file.processes.length > 0 && file.processes[0].status_id == 5) {

            // 01/12/2015 00:00
            var current = 1448924400;
            var list =
            [
                m('a',{config: filelist.tooltipConfig(), href: transcriptionUrl.replace('-1', file.id)+ '?auth_token=' + authToken, 'data-toggle':"tooltip", 'data-placement':"bottom", title:"Sous-titres .srt"}, m('i', {class: "fa fa-file-video-o"})),
                m('a',{config: filelist.tooltipConfig(), href: transcriptionUrl.replace('-1', file.id)+ '?auth_token=' + authToken+ '&format=vtt', 'data-toggle':"tooltip", 'data-placement':"bottom", title:"Sous-titres WebVTT"}, m('i', {class: "fa fa-file-video-o"})),
                m('a',{config: filelist.tooltipConfig(), href: transcriptionUrl.replace('-1', file.id)+ '?auth_token=' + authToken+ '&format=scc', 'data-toggle':"tooltip", 'data-placement':"bottom", title:"Sous-titres Scenarist Closed Caption"}, m('i', {class: "fa fa-file-video-o"})),
                m('a',{config: filelist.tooltipConfig(), href: transcriptionUrl.replace('-1', file.id)+ '?auth_token=' + authToken + '&format=xml', 'data-toggle':"tooltip", 'data-placement':"bottom", title:"Données .xml"}, m('i', {class: "fa fa-file-code-o"})),
                m('a',{config: filelist.tooltipConfig(), href: transcriptionUrl.replace('-1', file.id)+ '?auth_token=' + authToken + '&format=txt', 'data-toggle':"tooltip", 'data-placement':"bottom", title:"Données .txt"}, m('i', {class: "fa fa-file-text-o"})),
            ];

            if(file.timestamp > current && voxoEditor) {
                list.push(m('a',{config: filelist.tooltipConfig(), href: '/correction/' + file.id, 'data-toggle':"tooltip", 'data-placement':"bottom", title:"Corriger le fichier"}, m('i', {class: "fa fa-font"})));

            }

            return list;

        } else {
            return '';
        }

    };


    vm.truncate = function(str, size) {
        if (typeof size === 'undefined') { size = 40; }

        if (str.length > size)
            return str.substring(0,size)+'...';
        else
            return str;
    };

    return vm;
}())

filelist.controller = function() {
    filelist.vm.init()

    this.onunload = function() {
        // Don't forget to clear the timer as a new
        // one will be created on page change
        clearInterval(filelist.vm.timerID);
    }

};

filelist.view = function(ctrl) {

    return [
        m('div', {class: 'row'}, m('div', {class: 'col-md-12 col-lg-12'}, m('div',{ class:"panel panel-widget", style:"min-height:550px;",id:"my-files"}, [
            m('div', {class: 'panel-title'}, [
                "Mes fichiers ",
                m('span', {class: "label label-danger"}, filelist.vm.files().nb),
                m('ul', {class: "panel-tools"}, [
                    m('li', [ 
                        m('a', {class:"icon", 'data-toggle':"modal", 'data-target':"#uploadFile"}, [
                            m('i', {class:"fa fa-plus"})
                        ])
                    ])
                ])
            ]),
            m('div', {class:"panel-body table-responsive"}, [
                m('table', {class:"table table-dic table-hover table-striped"}, [
                    m('thead', [
                        m('tr', [
                            m('td', 'ID'),
                            m('td', 'Date'),
                            m('td', 'Fichier'),
                            m('td', 'Durée Fichier'),
                            m('td', 'Tps transcription'),
                            m('td', 'Status'),
                            m('td', 'Modèle'),
                            m('td',{ class:"text-right"}, 'Résultats')
                        ])
                        
                    ]),

                    m('tbody', [
                        filelist.vm.files().files.map(function(file, index) {
                            var firstProcess = file.processes[0];
                            return m("tr", {class: filelist.vm.colorForFile(file)}, [
                                m('td', '#' + file.id),
                                m('td', {style: 'white-space: nowrap'}, file.created_at),
                                m('td', {class: 'filename'}, [
                                    m('a', {href: downloadUrl.replace('-1', file.id) + "?auth_token=" + authToken }, m('i', {class: 'fa fa-file-audio-o'})),
                                    m('span', {config: filelist.tooltipConfig(), style: "color: #37363e;", 'data-toggle':"tooltip", 'data-placement':"bottom", title:file.filename}, filelist.vm.truncate(file.filename))
                                ]),
                                m('td', filelist.secondsToHms(file.duration)),
                                filelist.vm.decodingTimeForFile(file),
                                filelist.vm.statusForFile(file),
                                filelist.vm.modelForFile(file),
                                m('td', { class:"text-right"}, filelist.vm.downloadLinks(file))
                            ])
                        })
                    ])
                ]),
                m('nav', {class: 'text-c'}, [
                    m('ul', {class: 'pagination'}, filelist.vm.pages(parseInt(filelist.vm.currentPage), filelist.vm.filesPerPage(), filelist.vm.maxPages))
                ])
            ])
        ])))
    ];
};


