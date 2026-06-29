import base64
import re

with open('logos_b64.js', 'r') as f:
    content = f.read()

match = re.search(r"const LOGO_B64 = 'data:image/png;base64,(.*?)';", content, re.DOTALL)
if match:
    b64_data = match.group(1)
    with open('logo.png', 'wb') as img_f:
        img_f.write(base64.b64decode(b64_data))
    print("logo.png created successfully")
else:
    print("Could not find LOGO_B64")
