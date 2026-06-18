import re
import base64

with open('Panduan_ERP_Orion.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update logo V in first slide
vickra_path = '/Users/vickra/Development/Appscript/ERPORION/vickra.png'
with open(vickra_path, 'rb') as f:
    vickra_b64 = base64.b64encode(f.read()).decode('utf-8')

img_tag = f'<img src="data:image/png;base64,{vickra_b64}" class="profile-avatar" alt="Vickra" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; border: 4px solid var(--primary); box-shadow: 0 10px 25px rgba(37,99,235,0.3); margin-bottom: 20px;">'

# Replace <div class="profile-img">V</div>
content = re.sub(r'<div class="profile-img">V</div>', img_tag, content)

# 2. Update mermaid to LR and add header/notes
old_mermaid = """<div class="mermaid">
            graph TD"""

new_mermaid = """
            <p style="font-size: 1.1rem; color: var(--text-light); max-width: 800px; margin: -10px auto 30px auto; background: rgba(59, 130, 246, 0.1); padding: 15px; border-left: 4px solid var(--primary); border-radius: 0 8px 8px 0; text-align: left;">
                <strong>💡 Catatan Sistem:</strong> Alur ini dirancang secara terintegrasi. Setiap proses yang terjadi di ORION akan secara otomatis mengupdate status di tahap selanjutnya, mulai dari awal penawaran hingga menjadi laporan keuangan akhir.
            </p>
            <div class="mermaid" style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); width: 100%; max-width: 1000px;">
            graph LR"""

content = content.replace(old_mermaid, new_mermaid)

with open('Panduan_ERP_Orion.html', 'w', encoding='utf-8') as f:
    f.write(content)
