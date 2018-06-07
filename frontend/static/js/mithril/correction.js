var correction = {};

//define the view-model
correction.vm = {
    init: function() {

    }
};

correction.controller = function() {
    correction.vm.init()

};

correction.view = function() {
    return [
        m('div', {class: 'row'}, [
            m('h2', {}, 'Corrections')
        ])
    ];
};


