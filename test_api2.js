const API_URL = 'https://script.google.com/macros/s/AKfycbxpWtZ4n7rr4F3H5r3ORbvSBaF9SiyJuJukiOmJ6O3m_c57L9vowjHqJjVjKmfoisOuFQ/exec';
const body = 'payload=' + encodeURIComponent(JSON.stringify({action: 'get_po_customer'}));
fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body
}).then(res => res.json()).then(data => console.log(JSON.stringify(data, null, 2))).catch(console.error);
