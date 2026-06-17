const fs = require('fs');
const code = fs.readFileSync('/Users/vickra/Development/Appscript/ERPORION/js/app.js', 'utf8');

// Mock browser objects
global.window = {};
global.document = {
    addEventListener: (event, cb) => {
        if (event === 'DOMContentLoaded') cb();
    },
    getElementById: () => ({ addEventListener: () => {}, reset: () => {}, classList: { add: () => {}, remove: () => {} }, querySelector: () => null }),
    querySelectorAll: () => [],
    createElement: () => ({}),
    body: { appendChild: () => {}, classList: { add: () => {}, remove: () => {} } }
};

try {
    eval(code);
    console.log("formatRupiah function: " + typeof window.formatRupiah);
    if (typeof window.formatRupiah === 'function') {
        console.log("Output: " + window.formatRupiah(1000));
    }
} catch(e) {
    console.error(e);
}
