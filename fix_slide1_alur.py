import re
import base64

with open('Panduan_ERP_Orion.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Encode alur_proses.png
alur_path = '/Users/vickra/Development/Appscript/ERPORION/alur_proses.png'
try:
    with open(alur_path, 'rb') as f:
        alur_b64 = base64.b64encode(f.read()).decode('utf-8')
except Exception as e:
    print(f"Error reading image: {e}")
    exit(1)

# Find Slide 1 boundaries
slide1_idx = content.find('<!-- Slide 1 -->')
if slide1_idx == -1:
    print("Could not find Slide 1")
    exit(1)

end_slide1_idx = content.find('<!-- Slide 2', slide1_idx)
if end_slide1_idx == -1:
    end_slide1_idx = len(content)

# We replace the entire Slide 1 with a new layout
new_slide1 = f"""<!-- Slide 1 -->
        <div class="slide center-slide">
            <h2 style="font-size: 2rem; margin-bottom: 10px;">Alur Sistem ERP ORION</h2>
            <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); width: 95%; max-height: 55vh; overflow: hidden; display: flex; justify-content: center; align-items: center; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 20px;">
                <img src="data:image/png;base64,{alur_b64}" alt="Alur Proses" style="width: 100%; max-height: 100%; object-fit: contain; border-radius: 8px;">
            </div>
            <p style="font-size: 1.1rem; max-width: 900px; color: #e0e0e0; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px; border-left: 4px solid #2980b9; text-align: left; line-height: 1.6;">
                <strong>Penjelasan Alur:</strong> Gambar di atas menunjukkan bagaimana proses bisnis terintegrasi di dalam ERP ORION. Setiap modul saling terhubung mulai dari proses pemesanan (Quotation/PO), produksi, hingga pencatatan ke dalam laporan keuangan secara otomatis. Sistem ini memastikan data selalu tersinkronisasi antar departemen.
            </p>
        </div>
        """

content = content[:slide1_idx] + new_slide1 + content[end_slide1_idx:]

with open('Panduan_ERP_Orion.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Slide 1 replaced with alur_proses.png successfully.")
