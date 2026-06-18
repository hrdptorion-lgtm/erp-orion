import re
import base64

# Load Logo
logo_path = '/Users/vickra/.gemini/antigravity-ide/brain/229db030-452f-4c1b-8ed3-84d42283bb26/media__1781702380956.png'
with open(logo_path, 'rb') as f:
    logo_b64 = base64.b64encode(f.read()).decode('utf-8')
logo_img_tag = f'<img src="data:image/png;base64,{logo_b64}" class="branding-logo" alt="Logo">'

with open('Panduan_ERP_Orion.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Add logo to presentation container
if '<img src="data:image/png;base64,' not in content:
    content = content.replace('<div class="presentation-container">', f'<div class="presentation-container">\n        {logo_img_tag}')

# Replace flowchart slide with Mermaid.js
mermaid_diagram = """
            <div class="mermaid">
            graph TD
                A[Penawaran] -->|Deal| B(Pemesanan Barang / Purchasing)
                B --> C{Barang Tersedia?}
                C -->|Ya| D[Produksi Massal]
                C -->|Tidak| E[Pemesanan ke Supplier]
                E --> D
                D --> F[Pengiriman]
                F --> G[Faktur & Laporan Keuangan]
                
                style A fill:#f9f,stroke:#333,stroke-width:2px
                style B fill:#bbf,stroke:#333,stroke-width:2px
                style D fill:#dfd,stroke:#333,stroke-width:2px
                style F fill:#fdd,stroke:#333,stroke-width:2px
                style G fill:#dff,stroke:#333,stroke-width:2px
            </div>
"""

# The previous script might not have removed the old flowchart. Let's find it.
# We look for the "Alur Proses & Fungsi Aplikasi" slide.
content = re.sub(r'<img class="screenshot" src="data:image/png;base64,.*?" alt="Alur Proses ERP ORION">', mermaid_diagram, content, flags=re.DOTALL)


# Also ensure there are no left/right arrows remaining
content = re.sub(r'<div class="nav-btn.*?>.*?</div>', '', content, flags=re.DOTALL)
content = re.sub(r'<button class="nav-btn.*?>.*?</button>', '', content, flags=re.DOTALL)

with open('Panduan_ERP_Orion.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Added logo and mermaid diagram.")
