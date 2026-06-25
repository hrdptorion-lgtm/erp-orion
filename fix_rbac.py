import re

with open('js/app.js', 'r') as f:
    content = f.read()

# fix customer
content = re.sub(
    r"let actionBtns = `<button class=\"btn btn-edit-customer\".*?</i></button>`;\s*const session = localStorage.getItem\('erp_session'\);\s*const user = session \? JSON.parse\(session\) : \{\};\s*const canDelete = window.checkPermission\('grn', 'delete'\);\s*if \(canDelete\) \{",
    r"""const canEdit = window.checkPermission('customer', 'edit');
            const canDelete = window.checkPermission('customer', 'delete');
            let actionBtns = '';
            if (canEdit) actionBtns += `<button class="btn btn-edit-customer" data-id="${c.id_customer}" data-nama="${c.nama_customer}" data-kontak="${c.kontak_telepon || c['kontak_/_telepon'] || ''}" data-alamat="${c.alamat_keterangan || c['alamat_/_keterangan'] || ''}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; margin-right: 5px;"><i class="fa-solid fa-pen"></i></button>`;
            if (canDelete) {""",
    content,
    flags=re.DOTALL
)

# wait, the customer edit replacement above might fail if the regex is wrong.
# Let's just do targeted replaces.

with open('js/app.js', 'w') as f:
    f.write(content)

