import re

def update_app_js():
    with open('/Users/vickra/Development/Appscript/ERPORION/js/app.js', 'r') as f:
        content = f.read()

    # 1. Add view routing for po-customer
    content = content.replace("else if (targetViewId === 'sales') loadPenawaranData();", 
                              "else if (targetViewId === 'sales') loadPenawaranData();\n        else if (targetViewId === 'po-customer') loadPOCustomerData();")

    # 2. Add PO Customer loader function and UI logic
    po_logic = """
// ==========================================
// PO CUSTOMER LOGIC
// ==========================================
window.poCustomerData = [];

async function loadPOCustomerData() {
    const tbody = document.getElementById('table-po-customer');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data...</td></tr>';
    
    // Make sure penawaran is loaded for references
    await window.ERPAPI.request('get_penawaran');
    
    const response = await window.ERPAPI.request('get_po_customer');
    if (response.status === 'success' && response.data) {
        window.poCustomerData = response.data.reverse();
        tbody.innerHTML = '';
        if (window.poCustomerData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Tidak ada data PO Customer.</td></tr>';
            return;
        }
        window.poCustomerData.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight: 500;">${item.id_po_customer || '-'}</td>
                <td><span class="badge badge-info">${item.no_penawaran || '-'}</span></td>
                <td>${item.nama_customer || '-'}</td>
                <td>${item.tanggal_po || '-'}</td>
                <td>Rp ${window.formatRupiah(item.total_harga || 0)}</td>
                <td><span class="badge badge-${item.status === 'Selesai' ? 'success' : (item.status === 'Proses' ? 'warning' : 'info')}">${item.status || 'Pending'}</span></td>
                <td>
                    <button class="btn-icon btn-edit" title="Edit" onclick="openPOCustomerModal('${item.id_po_customer}')"><i class="fa-solid fa-edit"></i></button>
                    <button class="btn-icon btn-delete" title="Hapus" onclick="deletePOCustomer('${item.id_po_customer}')"><i class="fa-solid fa-trash"></i></button>
                    <button class="btn-icon btn-print" title="Cetak PO" onclick="printPOCustomer('${item.id_po_customer}')"><i class="fa-solid fa-print"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--danger);">Gagal memuat data.</td></tr>';
    }
}

document.getElementById('btn-add-po-customer')?.addEventListener('click', async () => {
    document.getElementById('po-customer-form').reset();
    document.getElementById('poc_id').value = '';
    document.getElementById('poc-items-container').innerHTML = '';
    document.getElementById('poc_total_harga_display').innerText = '0';
    document.getElementById('poc_total_harga').value = '0';
    document.getElementById('po-customer-modal-title').innerText = 'Buat PO dari Penawaran';
    
    // Load Approved Penawaran
    const sel = document.getElementById('poc_no_penawaran');
    if (sel.tomselect) sel.tomselect.destroy();
    sel.innerHTML = '<option value="">Pilih Penawaran yang sudah di Approve...</option>';
    
    const penawaranRes = await window.ERPAPI.request('get_penawaran');
    if (penawaranRes.status === 'success' && penawaranRes.data) {
        const approved = penawaranRes.data.filter(p => p.status === 'Approve');
        approved.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.no_penawaran;
            opt.text = p.no_penawaran + ' - ' + p.customer;
            opt.dataset.customer = p.customer;
            opt.dataset.items = JSON.stringify(p.rincian_item || []);
            sel.appendChild(opt);
        });
    }
    
    new TomSelect('#poc_no_penawaran', { create: false });
    document.getElementById('po-customer-modal').classList.add('active');
});

document.getElementById('poc_no_penawaran')?.addEventListener('change', (e) => {
    const sel = e.target;
    const val = sel.value;
    if (!val) return;
    
    // Find the selected option to get datasets
    let opt = null;
    if (sel.tomselect) {
        const optionEl = sel.tomselect.getOption(val);
        // It's tricky to get dataset from TomSelect directly sometimes, better find original element
        const originalSelect = document.getElementById('poc_no_penawaran');
        for (let i = 0; i < originalSelect.options.length; i++) {
            if (originalSelect.options[i].value === val) opt = originalSelect.options[i];
        }
    } else {
        opt = sel.options[sel.selectedIndex];
    }
    
    if (opt) {
        document.getElementById('poc_customer').value = opt.dataset.customer || '';
        const items = JSON.parse(opt.dataset.items || '[]');
        renderPOCustomerItems(items);
    }
});

function renderPOCustomerItems(items) {
    const container = document.getElementById('poc-items-container');
    container.innerHTML = '';
    items.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'poc-item-row';
        div.style.display = 'grid';
        div.style.gridTemplateColumns = '2fr 1fr 1fr 1fr';
        div.style.gap = '10px';
        div.style.marginBottom = '10px';
        div.style.alignItems = 'center';
        
        div.innerHTML = `
            <input type="text" class="poc-item-nama" value="${item.nama}" readonly style="background:rgba(255,255,255,0.05);">
            <input type="text" class="poc-item-harga number-format" value="${window.formatRupiah(item.harga)}" readonly style="background:rgba(255,255,255,0.05);">
            <input type="number" class="poc-item-qty" value="${item.qty}" min="1" onchange="calculatePOCTotal()">
            <input type="text" class="poc-item-subtotal" value="${window.formatRupiah((item.harga || 0) * (item.qty || 0))}" readonly style="background:rgba(255,255,255,0.05); font-weight:bold;">
        `;
        container.appendChild(div);
    });
    calculatePOCTotal();
}

window.calculatePOCTotal = function() {
    let total = 0;
    const rows = document.querySelectorAll('.poc-item-row');
    rows.forEach(row => {
        const harga = window.parseRupiah(row.querySelector('.poc-item-harga').value);
        const qty = parseFloat(row.querySelector('.poc-item-qty').value) || 0;
        const subtotal = harga * qty;
        row.querySelector('.poc-item-subtotal').value = window.formatRupiah(subtotal);
        total += subtotal;
    });
    document.getElementById('poc_total_harga').value = total;
    document.getElementById('poc_total_harga_display').innerText = window.formatRupiah(total);
};

document.getElementById('btn-close-po-customer')?.addEventListener('click', () => {
    document.getElementById('po-customer-modal').classList.remove('active');
});

document.getElementById('po-customer-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
    btn.disabled = true;
    
    const items = [];
    document.querySelectorAll('.poc-item-row').forEach(row => {
        items.push({
            nama: row.querySelector('.poc-item-nama').value,
            harga: window.parseRupiah(row.querySelector('.poc-item-harga').value),
            qty: parseFloat(row.querySelector('.poc-item-qty').value)
        });
    });
    
    const payload = {
        id_po_customer: document.getElementById('poc_id').value,
        no_penawaran: document.getElementById('poc_no_penawaran').value,
        nama_customer: document.getElementById('poc_customer').value,
        tanggal_po: document.getElementById('poc_tanggal').value,
        item_po: items,
        total_harga: document.getElementById('poc_total_harga').value,
        status: document.getElementById('poc_status').value
    };
    
    const res = await window.ERPAPI.request('save_po_customer', payload);
    btn.innerText = originalText;
    btn.disabled = false;
    
    if (res.status === 'success') {
        window.showToast(res.message, 'success');
        document.getElementById('po-customer-modal').classList.remove('active');
        loadPOCustomerData();
    } else {
        window.showToast(res.message, 'error');
    }
});

window.openPOCustomerModal = function(id) {
    const item = window.poCustomerData.find(i => i.id_po_customer === id);
    if (!item) return;
    
    document.getElementById('po-customer-form').reset();
    document.getElementById('poc_id').value = item.id_po_customer;
    document.getElementById('po-customer-modal-title').innerText = 'Edit PO Customer';
    
    const sel = document.getElementById('poc_no_penawaran');
    if (sel.tomselect) sel.tomselect.destroy();
    sel.innerHTML = `<option value="${item.no_penawaran}">${item.no_penawaran}</option>`;
    new TomSelect('#poc_no_penawaran', { create: false });
    
    document.getElementById('poc_customer').value = item.nama_customer || '';
    
    let tgl = '';
    if (item.tanggal_po) {
        const parts = item.tanggal_po.split('/');
        if (parts.length === 3) tgl = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    document.getElementById('poc_tanggal').value = tgl;
    document.getElementById('poc_status').value = item.status;
    
    renderPOCustomerItems(item.item_po || []);
    
    document.getElementById('po-customer-modal').classList.add('active');
};

window.deletePOCustomer = async function(id) {
    if (!confirm('Hapus PO Customer ini?')) return;
    const res = await window.ERPAPI.request('delete_po_customer', { id: id });
    if (res.status === 'success') {
        window.showToast(res.message, 'success');
        loadPOCustomerData();
    } else {
        window.showToast(res.message, 'error');
    }
};

window.printPOCustomer = function(id) {
    window.showToast('Fitur cetak sedang dikembangkan.', 'info');
};

// ==========================================
"""
    content = content.replace("// Flow 1: Penawaran", po_logic + "\n// Flow 1: Penawaran")

    # 3. Penawaran Locking & Revisi Logic
    # Update openPenawaranModal
    p_edit_code = """
window.openPenawaranModal = function (noDoc, e) {
    if (e && e.target.closest('button')) return;
    const penawaran = window.penawaranData.find(p => p.no_penawaran === noDoc);
    if (!penawaran) return;

    document.getElementById('penawaran-form').reset();
    document.getElementById('penawaran-modal-title').innerText = 'Edit Penawaran';
    document.getElementById('p_no_penawaran').value = penawaran.no_penawaran;

    // Destroy existing TomSelect before setting value
    const customerSelect = document.getElementById('p_customer');
    if (customerSelect && customerSelect.tomselect) {
        customerSelect.tomselect.destroy();
    }

    // Ensure the customer option exists
    let optionExists = false;
    for (let i = 0; i < customerSelect.options.length; i++) {
        if (customerSelect.options[i].value === penawaran.customer) {
            optionExists = true;
            break;
        }
    }
    if (!optionExists) {
        const option = document.createElement('option');
        option.value = penawaran.customer;
        option.textContent = penawaran.customer;
        customerSelect.appendChild(option);
    }
    
    customerSelect.value = penawaran.customer;

    // Re-initialize TomSelect
    new TomSelect('#p_customer', {
        create: true,
        sortField: { field: 'text', direction: 'asc' }
    });

    document.getElementById('p_narasi').value = penawaran.narasi || '';
    document.getElementById('p_dp').value = window.formatRupiah(penawaran.dp || 0);
    document.getElementById('p_status').value = penawaran.status || 'Diajukan';

    try {
        const info = typeof penawaran.info_tambahan === 'string' ? JSON.parse(penawaran.info_tambahan) : (penawaran.info_tambahan || {});
        document.getElementById('p_attn').value = info.attn || '';
        document.getElementById('p_enq_no').value = info.enq_no || '';
        document.getElementById('p_rev_date').value = info.rev_date || '';
        document.getElementById('p_maker').value = info.maker || '';
        document.getElementById('p_delivery').value = info.delivery || '';
        document.getElementById('p_incoterm').value = info.incoterm || '';
        document.getElementById('p_payment').value = info.payment || '';
        document.getElementById('p_validity').value = info.validity || '';
    } catch (e) { console.error('Info parsing error', e); }

    const itemsContainer = document.getElementById('p-items-container');
    itemsContainer.innerHTML = '';
    
    let items = [];
    if (typeof penawaran.rincian_item === 'string') {
        try { items = JSON.parse(penawaran.rincian_item); } catch (e) { }
    } else {
        items = penawaran.rincian_item || [];
    }

    items.forEach(item => {
        addPenawaranItem(item.nama, item.qty, item.harga);
    });

    calculatePenawaranTotal();
    
    // Check Status to disable form & show Revisi
    const isLocked = penawaran.status === 'Approve' || penawaran.status === 'Reject';
    document.getElementById('btn-revisi-penawaran').style.display = isLocked ? 'flex' : 'none';
    document.getElementById('btn-save-penawaran').style.display = isLocked ? 'none' : 'flex';
    document.getElementById('btn-add-p-item').style.display = isLocked ? 'none' : 'flex';
    
    const fields = document.querySelectorAll('#penawaran-form input, #penawaran-form select, #penawaran-form textarea');
    fields.forEach(f => f.disabled = isLocked);
    
    // Always enable close button and revisi
    document.getElementById('btn-close-penawaran').disabled = false;
    document.getElementById('btn-revisi-penawaran').disabled = false;

    document.getElementById('penawaran-modal').classList.add('active');
};
"""
    # Use regex to replace the old openPenawaranModal function
    content = re.sub(r'window\.openPenawaranModal = function\s*\(noDoc,\s*e\)\s*\{[\s\S]*?document\.getElementById\(\'penawaran-modal\'\)\.classList\.add\(\'active\'\);\n\};', p_edit_code.strip(), content)

    # Revisi logic injection
    rev_logic = """
document.getElementById('btn-revisi-penawaran')?.addEventListener('click', async () => {
    const id = document.getElementById('p_no_penawaran').value;
    if(!id) return;
    if(!confirm('Buat revisi dari Penawaran ini? Data sebelumnya akan di set ke Reject.')) return;
    
    const btn = document.getElementById('btn-revisi-penawaran');
    const oldHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Proses...';
    btn.disabled = true;
    
    const res = await window.ERPAPI.request('revisi_penawaran', { id: id });
    if(res.status === 'success') {
        window.showToast(res.message, 'success');
        document.getElementById('penawaran-modal').classList.remove('active');
        loadPenawaranData();
        // Optional: wait a bit and open the newly created revision
        setTimeout(() => {
            if(window.openPenawaranModal && res.no_doc) {
                window.openPenawaranModal(res.no_doc);
            }
        }, 1000);
    } else {
        window.showToast(res.message, 'error');
    }
    btn.innerHTML = oldHtml;
    btn.disabled = false;
});
"""
    content = content.replace("document.getElementById('btn-add-p-item').addEventListener('click', () => addPenawaranItem());",
                              "document.getElementById('btn-add-p-item').addEventListener('click', () => addPenawaranItem());\n" + rev_logic)

    # Replace References in Surat Jalan
    content = content.replace("sj_no_penawaran", "sj_id_po_customer")
    content = content.replace("inv_no_penawaran", "inv_id_po_customer")

    # In Surat Jalan add logic to get POC instead of Penawaran
    content = content.replace("""const penawaranData = response.data || [];
        const selectSJ = document.getElementById('sj_id_po_customer');
        if (selectSJ && selectSJ.tomselect) { selectSJ.tomselect.destroy(); }
        if (selectSJ) {
            selectSJ.innerHTML = '<option value="">-- Pilih Penawaran --</option>';
            penawaranData.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.no_penawaran;
                opt.text = p.no_penawaran + ' - ' + p.customer;
                selectSJ.appendChild(opt);
            });""", """const penawaranData = await window.ERPAPI.request('get_po_customer');
        const pocData = penawaranData.data || [];
        const selectSJ = document.getElementById('sj_id_po_customer');
        if (selectSJ && selectSJ.tomselect) { selectSJ.tomselect.destroy(); }
        if (selectSJ) {
            selectSJ.innerHTML = '<option value="">-- Pilih PO Customer --</option>';
            pocData.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id_po_customer;
                opt.text = p.id_po_customer + ' - ' + p.nama_customer;
                selectSJ.appendChild(opt);
            });""")

    with open('/Users/vickra/Development/Appscript/ERPORION/js/app.js', 'w') as f:
        f.write(content)

update_app_js()
print("Updated app.js")
