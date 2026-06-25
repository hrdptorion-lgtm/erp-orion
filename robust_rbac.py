import re

with open('js/app.js', 'r') as f:
    content = f.read()

def replace_action(menu_target, func_regex, default_edit=True, default_del=True):
    global content
    
    # We will search for the function signature and the closing bracket.
    # It's better to just search for the specific actionBtns blocks within the functions.
    pass

# COA
content = re.sub(
    r"let actionBtns = `<button class=\"btn btn-edit-coa\".*?</i></button>`;\s*const canDelete = window.checkPermission\('coa', 'delete'\);\s*const canEdit = window.checkPermission\('coa', 'edit'\);\s*if \(canDelete\) \{",
    r"const canDelete = window.checkPermission('coa', 'delete');\n        const canEdit = window.checkPermission('coa', 'edit');\n        let actionBtns = '';\n        if (canEdit) actionBtns += `<button class=\"btn btn-edit-coa\" data-kode=\"${c.kode_akun}\" data-nama=\"${c.nama_akun}\" data-parent=\"${c.parent_kode || ''}\" style=\"padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; margin-right: 5px;\"><i class=\"fa-solid fa-pen\"></i></button>`;\n        if (canDelete) {",
    content,
    flags=re.DOTALL
)

# Customer
content = re.sub(
    r"let actionBtns = `<button class=\"btn btn-edit-customer\".*?</i></button>`;\s*const session = localStorage.getItem\('erp_session'\);\s*const user = session \? JSON.parse\(session\) : \{\};\s*const canDelete = window.checkPermission\('customer', 'delete'\);\s*const canEdit = window.checkPermission\('customer', 'edit'\);\s*if \(canDelete\) \{",
    r"const canDelete = window.checkPermission('customer', 'delete');\n            const canEdit = window.checkPermission('customer', 'edit');\n            let actionBtns = '';\n            if (canEdit) actionBtns += `<button class=\"btn btn-edit-customer\" data-id=\"${c.id_customer}\" data-nama=\"${c.nama_customer}\" data-kontak=\"${c.kontak_telepon || c['kontak_/_telepon'] || ''}\" data-alamat=\"${c.alamat_keterangan || c['alamat_/_keterangan'] || ''}\" style=\"padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; margin-right: 5px;\"><i class=\"fa-solid fa-pen\"></i></button>`;\n            if (canDelete) {",
    content,
    flags=re.DOTALL
)

# Supplier
content = re.sub(
    r"let actionBtns = `<button class=\"btn btn-edit-supplier\".*?</i></button>`;\s*const session = localStorage.getItem\('erp_session'\);\s*if \(session\) \{",
    r"const canDelete = window.checkPermission('supplier', 'delete');\n            const canEdit = window.checkPermission('supplier', 'edit');\n            let actionBtns = '';\n            if (canEdit) actionBtns += `<button class=\"btn btn-edit-supplier\" data-id=\"${s.id_supplier}\" data-nama=\"${s.nama_supplier}\" data-kontak=\"${s.kontak___telepon || s['kontak_/_telepon'] || ''}\" data-alamat=\"${s.alamat || ''}\" style=\"padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; margin-right: 5px; background: rgba(99, 102, 241, 0.1); color: var(--primary);\"><i class=\"fa-solid fa-pen\"></i></button>`;\n            if (canDelete) {",
    content,
    flags=re.DOTALL
)

# Laporan Kas doesn't have an edit button.

# Invoice
content = re.sub(
    r"let actionBtns = '';\s*if \(item.status !== 'Lunas'\) \{\s*actionBtns \+= `<button class=\"btn btn-bayar-invoice\".*?</i></button>`;\s*\}\s*const canDelete = window.checkPermission\('invoice', 'delete'\);\s*if \(canDelete\) \{",
    r"let actionBtns = '';\n                const canEdit = window.checkPermission('invoice', 'edit');\n                if (item.status !== 'Lunas' && canEdit) {\n                    actionBtns += `<button class=\"btn btn-bayar-invoice\" data-no=\"${item.no_invoice}\" data-total=\"${totalAkhir}\" style=\"padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; background:var(--success); margin-right: 5px;\" title=\"Tandai Lunas\"><i class=\"fa-solid fa-money-bill-wave\"></i></button>`;\n                }\n                const canDelete = window.checkPermission('invoice', 'delete');\n                if (canDelete) {",
    content,
    flags=re.DOTALL
)

with open('js/app.js', 'w') as f:
    f.write(content)

