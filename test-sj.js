const fs = require('fs');
const code = fs.readFileSync('/Users/vickra/Development/Appscript/ERPORION/js/app.js', 'utf8');

global.window = {};
global.document = {
    addEventListener: (event, cb) => {
        if (event === 'DOMContentLoaded') cb();
    },
    getElementById: (id) => {
        return {
            id: id,
            addEventListener: (ev, cb) => {
                if (id === 'btn-add-surat-jalan' && ev === 'click') {
                    global.btnSuratJalanClick = cb;
                }
            },
            reset: () => {},
            value: '',
            classList: { add: (c) => console.log(id + ' added class ' + c), remove: () => {} },
            querySelector: () => null
        };
    },
    querySelectorAll: () => [],
    createElement: () => ({}),
    body: { appendChild: () => {}, classList: { add: () => {}, remove: () => {} } }
};

try {
    eval(code);
    if (global.btnSuratJalanClick) {
        console.log("Simulating click on btn-add-surat-jalan...");
        global.btnSuratJalanClick();
    } else {
        console.log("btn-add-surat-jalan listener not found");
    }
} catch(e) {
    console.error(e);
}
