import re

with open('Panduan_ERP_Orion.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the bottom navigation buttons from HTML
content = re.sub(r'<div class="nav-btn.*?>.*?</div>', '', content, flags=re.DOTALL)
content = re.sub(r'<button class="btn" id="btnPrev".*?</button>', '', content, flags=re.DOTALL)
content = re.sub(r'<button class="btn" id="btnNext".*?</button>', '', content, flags=re.DOTALL)
content = re.sub(r'<div class="controls">.*?</div>', '', content, flags=re.DOTALL)

# Add click listener
click_js = """
        document.addEventListener('click', (e) => {
            // Ignore clicks on links or buttons
            if (e.target.tagName.toLowerCase() === 'a' || e.target.tagName.toLowerCase() === 'button') {
                return;
            }
            
            const clickX = e.clientX;
            const screenWidth = window.innerWidth;
            
            if (clickX > screenWidth / 2) {
                // Clicked right side
                nextSlide();
            } else {
                // Clicked left side
                prevSlide();
            }
        });

        document.addEventListener('keydown', (e) => {
"""

content = content.replace("        document.addEventListener('keydown', (e) => {", click_js)

with open('Panduan_ERP_Orion.html', 'w', encoding='utf-8') as f:
    f.write(content)
