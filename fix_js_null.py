import re

with open('Panduan_ERP_Orion.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the btnPrev/btnNext references from JS
content = re.sub(r'const btnPrev = document\.getElementById\(\'btnPrev\'\);', '', content)
content = re.sub(r'const btnNext = document\.getElementById\(\'btnNext\'\);', '', content)
content = re.sub(r'btnPrev\.disabled =.*?;', '', content)
content = re.sub(r'btnNext\.disabled =.*?;', '', content)

with open('Panduan_ERP_Orion.html', 'w', encoding='utf-8') as f:
    f.write(content)
