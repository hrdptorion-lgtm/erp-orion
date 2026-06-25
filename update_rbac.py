import re

with open('js/app.js', 'r') as f:
    content = f.read()

# loadBahanBakuData
content = re.sub(
    r"const isAdmin = \['Admin', 'Super Admin', 'Management', 'Direktur'\].some\(r => \(user.role \|\| ''\).toLowerCase\(\).includes\(r.toLowerCase\(\)\)\);\s*if \(isAdmin\) {",
    r"const canDelete = window.checkPermission('purchasing', 'delete');\n\n                if (canDelete) {",
    content,
    count=1
)

# loadPOInternalData
content = re.sub(
    r"const isAtasan = \['Admin', 'Management', 'Super Admin', 'Super', 'super'\].includes\(user.role\);\s*const isPurchasing = \['Admin', 'Purchasing', 'Super Admin', 'Super', 'super'\].includes\(user.role\);\s*const isAdmin = \['Admin', 'Super Admin', 'Super', 'super'\].includes\(user.role\);",
    r"const canEdit = window.checkPermission('po-internal', 'edit');\n            const canDelete = window.checkPermission('po-internal', 'delete');\n            const canAddGRN = window.checkPermission('grn', 'add');\n            const isAtasan = canEdit;\n            const isPurchasing = canAddGRN;\n            const isAdmin = canDelete;",
    content,
    count=1
)

# loadGRNData
content = re.sub(
    r"const isAdmin = \['Admin', 'Super Admin', 'Management', 'Direktur'\].some\(r => \(user.role \|\| ''\).toLowerCase\(\).includes\(r.toLowerCase\(\)\)\);\s*if \(isAdmin\) {",
    r"const canDelete = window.checkPermission('grn', 'delete');\n\n                if (canDelete) {",
    content,
    count=1
)

# loadSuratJalanData
content = re.sub(
    r"const isAdmin = \['Admin', 'Super Admin', 'Management', 'Direktur'\].some\(r => \(user.role \|\| ''\).toLowerCase\(\).includes\(r.toLowerCase\(\)\)\);\s*if \(item.status !== 'Selesai \(Diterima\)'\) {",
    r"const canDelete = window.checkPermission('surat-jalan', 'delete');\n                const canEdit = window.checkPermission('surat-jalan', 'edit');\n\n                if (item.status !== 'Selesai (Diterima)') {",
    content,
    count=1
)
# update inner logic for Surat Jalan
content = re.sub(
    r"actionBtns \+= `<button class=\"btn btn-finish-sj\" data-no=\"\$\{item.no_sj\}\" style=\"padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; background:var\(--success\); margin-right: 5px;\" title=\"Tandai Selesai\"><i class=\"fa-solid fa-check\"></i></button>`;\n\s*}\n\s*if \(isAdmin\) {",
    r"if (canEdit) actionBtns += `<button class=\"btn btn-finish-sj\" data-no=\"${item.no_sj}\" style=\"padding: 0.4rem 0.8rem; font-size: 0.8rem; display: inline-flex; background:var(--success); margin-right: 5px;\" title=\"Tandai Selesai\"><i class=\"fa-solid fa-check\"></i></button>`;\n                }\n\n                if (canDelete) {",
    content,
    count=1
)

# loadBOMData
content = re.sub(
    r"const isAdmin = \['Admin', 'Super Admin', 'Management', 'Direktur'\].some\(r => \(user.role \|\| ''\).toLowerCase\(\).includes\(r.toLowerCase\(\)\)\);\s*if \(isAdmin\) {",
    r"const canDelete = window.checkPermission('bom', 'delete');\n\n                if (canDelete) {",
    content,
    count=1
)

# loadProduksiData (SPK)
content = re.sub(
    r"const canEdit = \['Admin', 'Management', 'Produksi', 'Super', 'Super Admin'\].some\(r => \(user.role \|\| ''\).includes\(r\)\);\s*const isAdmin = \['Admin', 'Super Admin', 'Management', 'Direktur'\].some\(r => \(user.role \|\| ''\).toLowerCase\(\).includes\(r.toLowerCase\(\)\)\);",
    r"const canEdit = window.checkPermission('produksi', 'edit');\n                const isAdmin = window.checkPermission('produksi', 'delete');",
    content,
    count=1
)

# loadBarangJadiData
content = re.sub(
    r"const isAdmin = \['Admin', 'Super Admin', 'Management', 'Direktur'\].some\(r => \(user.role \|\| ''\).toLowerCase\(\).includes\(r.toLowerCase\(\)\)\);\s*if \(isAdmin\) {",
    r"const canDelete = window.checkPermission('barang-jadi', 'delete');\n\n                if (canDelete) {",
    content,
    count=1
)

# loadSalesData (Penawaran)
content = re.sub(
    r"const isAdmin = \['Direktur', 'Admin', 'Management', 'Super Admin', 'super'\].some\(r => user.role.toLowerCase\(\).includes\(r.toLowerCase\(\)\)\);\s*if \(isAdmin\) {",
    r"const canDelete = window.checkPermission('sales', 'delete');\n\n        if (canDelete) {",
    content,
    count=1
)

# loadPOCustomerData
content = re.sub(
    r"const isAdmin = \['Admin', 'Super Admin', 'Management', 'Direktur'\].some\(r => \(user.role \|\| ''\).toLowerCase\(\).includes\(r.toLowerCase\(\)\)\);\s*if \(isAdmin\) {",
    r"const canDelete = window.checkPermission('po-customer', 'delete');\n\n            if (canDelete) {",
    content,
    count=1
)

with open('js/app.js', 'w') as f:
    f.write(content)

