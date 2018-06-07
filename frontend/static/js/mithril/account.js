var account = {};

//define the view-model
account.vm = {
    init: function() {

    }
};

account.controller = function() {
    account.vm.init()

};

account.view = function() {
    return [
        m('div', {class: 'row'}, [
            m('div', {class: 'col-md-12 col-lg-6'}, m('div',{ class:"panel panel-widget", style:"min-height:550px;"}, [
                m('div', {class: 'panel-title'}, 'Profil'),
                m('div', {class: 'panel-body'}, [
                    m('h4', 'Email'),
                    m('p', topbar.vm.info().email),
                    m('h4', 'API Token'),
                    m('textarea',{style: 'width: 100%'}, authToken)
                ])
            ])),
            m('div', {class: 'col-md-12 col-lg-6'}, m('div',{ class:"panel panel-widget", style:"min-height:550px;"}, [
                m('div', {class: 'panel-title'}, 'Historique'),
                m('div', {class: 'panel-body'}, [
                    m('table', {class: 'table table-striped'}, [
                        m('thead',m('tr', [
                            m('td', 'Date'),
                            m('td', 'Consommation')
                        ])),
                        m('tbody', [
                            topbar.vm.info().history.map(function(entry, index) {
                                return m("tr", [
                                    m('td', entry.month + '/' + entry.year),
                                    m('td', entry.hours.toFixed(2) + ' H')
                                ])
                            })
                        ])

                    ])
                ])
            ]))
        ])
    ];
};

