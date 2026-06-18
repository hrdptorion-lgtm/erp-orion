import re
import base64

with open('Panduan_ERP_Orion.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove circle styling from the first slide's logo
# Find: style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; border: 4px solid var(--primary); box-shadow: 0 10px 25px rgba(37,99,235,0.3); margin-bottom: 20px;"
# Replace with: style="height: 150px; object-fit: contain; margin-bottom: 20px;"
content = re.sub(
    r'style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; border: 4px solid var\(--primary\); box-shadow: 0 10px 25px rgba\(37,99,235,0\.3\); margin-bottom: 20px;"',
    r'style="height: 150px; object-fit: contain; margin-bottom: 20px;"',
    content
)

# 2. Replace the last slide's logo with gambar 1
logo_path = '/Users/vickra/.gemini/antigravity-ide/brain/229db030-452f-4c1b-8ed3-84d42283bb26/media__1781702380985.png'
with open(logo_path, 'rb') as f:
    logo_b64 = base64.b64encode(f.read()).decode('utf-8')

# The last slide likely has an img before "Terima Kasih!" or we can just find the Orion logo base64
# Since we don't know the exact base64 string, let's find the img inside the "Terima Kasih!" slide.
# <div class="slide center-slide">
#     <img src="data:image/png;base64,..." ...>
#     <h2>Terima Kasih! 🎉</h2>

# We can regex it: <img[^>]+src="data:image/png;base64,[^"]+"[^>]*>(?=\s*<h2>Terima Kasih!)
# Or simply replace any image that is right before <h2>Terima Kasih!
content = re.sub(
    r'<img[^>]+src="data:image/png;base64,[^"]+"[^>]*>(\s*<h2>Terima Kasih!)',
    f'<img src="data:image/png;base64,{logo_b64}" style="height: 150px; object-fit: contain; margin-bottom: 20px;" alt="Logo">\\1',
    content
)

with open('Panduan_ERP_Orion.html', 'w', encoding='utf-8') as f:
    f.write(content)
