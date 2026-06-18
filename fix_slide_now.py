import re
import base64

with open('Panduan_ERP_Orion.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update logo slide 1 using logo4.png
logo_path = 'logo4.png'
with open(logo_path, 'rb') as f:
    logo_b64 = base64.b64encode(f.read()).decode('utf-8')

# The img in slide 1 looks like: <img src="data:image/png;base64,iVBORw0K..." ...>
# We can find Slide 1 and replace its img src.
# Slide 1 start: <!-- Slide 1 -->
# Let's replace the first very large base64 string after Slide 1.
import re
# Regex to find the first img in Slide 1
slide1_idx = content.find('<!-- Slide 1 -->')
if slide1_idx != -1:
    end_slide1_idx = content.find('<!-- Slide 2', slide1_idx)
    if end_slide1_idx == -1: end_slide1_idx = len(content)
    
    slide1_content = content[slide1_idx:end_slide1_idx]
    # Replace the base64 src
    new_slide1_content = re.sub(r'src="data:image/[^;]+;base64,[^"]+"', f'src="data:image/png;base64,{logo_b64}"', slide1_content, count=1)
    
    content = content[:slide1_idx] + new_slide1_content + content[end_slide1_idx:]


# 2. Update mermaid to LR and add header/notes
old_mermaid = """<div class="mermaid">
            graph TD"""

new_mermaid = """
            <p style="font-size: 1.1rem; color: #555; max-width: 800px; margin: -10px auto 30px auto; background: rgba(59, 130, 246, 0.1); padding: 15px; border-left: 4px solid #2980b9; border-radius: 0 8px 8px 0; text-align: left;">
                <strong>💡 Catatan Sistem:</strong> Alur ini dirancang secara terintegrasi. Setiap proses yang terjadi di ORION akan secara otomatis mengupdate status di tahap selanjutnya, mulai dari awal penawaran hingga menjadi laporan keuangan akhir.
            </p>
            <div class="mermaid" style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); width: 100%; max-width: 1000px;">
            graph LR"""

content = content.replace(old_mermaid, new_mermaid)

# 3. Make it more professional: enhance some CSS styles
# Add better background, shadows, transitions, etc.
css_improvements = """
        body {
            background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
        }
        .slides-container {
            box-shadow: 0 30px 60px rgba(0,0,0,0.6);
            border: 1px solid rgba(255,255,255,0.1);
        }
        h1 {
            background: -webkit-linear-gradient(#2980b9, #2c3e50);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        }
"""
content = content.replace("        /* Layout Types */", css_improvements + "\n        /* Layout Types */")

with open('Panduan_ERP_Orion.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Slide updated successfully.")
