const fs = require('fs');
const file = '/Users/vickra/Development/Appscript/ERPORION/js/app.js';
let content = fs.readFileSync(file, 'utf-8');

// Replace multi-line if (!isBackgroundSync)
content = content.replace(
    /if \(\!isBackgroundSync\) \{\s*tbody\.innerHTML \= [^;]+Memuat data\.\.\.[^;]+\;\s*\}/g,
    (match) => {
        return match.replace('if (!isBackgroundSync) {', "if (!isBackgroundSync && (!tbody.innerHTML.trim() || tbody.innerHTML.includes('Tidak ada') || tbody.innerHTML.includes('Gagal') || tbody.innerHTML.includes('Memuat data'))) {");
    }
);

// Replace single-line if (tbody && !isBackgroundSync)
content = content.replace(
    /if \(tbody && \!isBackgroundSync\) tbody\.innerHTML \= [^;]+Memuat data\.\.\.[^;]+\;/g,
    (match) => {
        return match.replace('if (tbody && !isBackgroundSync)', "if (tbody && !isBackgroundSync && (!tbody.innerHTML.trim() || tbody.innerHTML.includes('Tidak ada') || tbody.innerHTML.includes('Gagal') || tbody.innerHTML.includes('Memuat data')))");
    }
);

// Replace unconditional tbody.innerHTML = '...Memuat data...' 
content = content.replace(
    /^(\s*)(tbody\.innerHTML \= [`'].*?Memuat data\.\.\..*?[`'];)$/gm,
    (match, p1, p2) => {
        // If it's already inside an if statement, we don't want to double wrap, 
        // but if we match exactly this line and it's not preceded by our custom if, we wrap it.
        // Actually, let's just wrap it.
        return `${p1}if (!tbody.innerHTML.trim() || tbody.innerHTML.includes('Tidak ada') || tbody.innerHTML.includes('Gagal') || tbody.innerHTML.includes('Memuat data')) {\n${p1}    ${p2}\n${p1}}`;
    }
);

// Clean up any double wraps that might have happened
content = content.replace(/if \(\!tbody\.innerHTML\.trim\(\) \|\| tbody\.innerHTML\.includes\('Tidak ada'\) \|\| tbody\.innerHTML\.includes\('Gagal'\) \|\| tbody\.innerHTML\.includes\('Memuat data'\)\) \{\s*if \(\!tbody\.innerHTML\.trim\(\) \|\| tbody\.innerHTML\.includes\('Tidak ada'\) \|\| tbody\.innerHTML\.includes\('Gagal'\) \|\| tbody\.innerHTML\.includes\('Memuat data'\)\) \{/g, "if (!tbody.innerHTML.trim() || tbody.innerHTML.includes('Tidak ada') || tbody.innerHTML.includes('Gagal') || tbody.innerHTML.includes('Memuat data')) {");

fs.writeFileSync(file, content);
console.log('Fixed loading states.');
