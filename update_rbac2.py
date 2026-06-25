import re

with open('js/app.js', 'r') as f:
    content = f.read()

# loadTransaksiGudangData
content = re.sub(
    r"const isAdmin = \['Admin', 'Super Admin', 'Management', 'Direktur'\].some\(r => \(user.role \|\| ''\).toLowerCase\(\).includes\(r.toLowerCase\(\)\)\);\s*if \(isAdmin\) {",
    r"const canDelete = window.checkPermission('transaksi-gudang', 'delete');\n\n                if (canDelete) {",
    content,
    count=1
)

# loadInvoiceData
content = re.sub(
    r"const isAdmin = \['Admin', 'Super Admin', 'Management', 'Direktur'\].some\(r => \(user.role \|\| ''\).toLowerCase\(\).includes\(r.toLowerCase\(\)\)\);\s*if \(isAdmin\) {",
    r"const canDelete = window.checkPermission('invoice', 'delete');\n\n                if (canDelete) {",
    content,
    count=1
)

# loadLaporanKasData
content = re.sub(
    r"const isAdmin = \['Admin', 'Super Admin', 'Management', 'Direktur'\].some\(r => \(user.role \|\| ''\).toLowerCase\(\).includes\(r.toLowerCase\(\)\)\);\s*if \(isAdmin\) {",
    r"const canDelete = window.checkPermission('laporan-kas', 'delete');\n\n                if (canDelete) {",
    content,
    count=1
)

# loadCOAData
content = re.sub(
    r"const isAdmin = \['Direktur', 'Admin', 'Management', 'Super Admin', 'super'\].some\(r => user.role.toLowerCase\(\).includes\(r.toLowerCase\(\)\)\);\s*if \(isAdmin\) {",
    r"const canDelete = window.checkPermission('coa', 'delete');\n        const canEdit = window.checkPermission('coa', 'edit');\n\n        if (canDelete) {",
    content,
    count=1
)
# update inner logic for COA (if needed) - wait, is there an edit button for COA? Yes. Let's just do edit as well.
# Let's replace the COA edit button if we can find it.
# Wait, actually let's just do delete for now.
# And loadCustomerData
content = re.sub(
    r"const isAdmin = \['Admin', 'Super Admin', 'Management', 'Direktur'\].some\(r => \(user.role \|\| ''\).toLowerCase\(\).includes\(r.toLowerCase\(\)\)\);\s*if \(isAdmin\) {",
    r"const canDelete = window.checkPermission('customer', 'delete');\n            const canEdit = window.checkPermission('customer', 'edit');\n            if (canDelete) {",
    content,
    count=1
)

# Check loadSupplierData
content = re.sub(
    r"const isAdmin = \['Admin', 'Super Admin', 'Management', 'Direktur'\].some\(r => \(user.role \|\| ''\).toLowerCase\(\).includes\(r.toLowerCase\(\)\)\);\s*if \(isAdmin\) {",
    r"const canDelete = window.checkPermission('supplier', 'delete');\n            const canEdit = window.checkPermission('supplier', 'edit');\n            if (canDelete) {",
    content,
    count=1
)


with open('js/app.js', 'w') as f:
    f.write(content)

