import re

with open('Panduan_ERP_Orion.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove navigation buttons
content = re.sub(r'<button class="nav-btn prev-btn".*?</button>', '', content, flags=re.DOTALL)
content = re.sub(r'<button class="nav-btn next-btn".*?</button>', '', content, flags=re.DOTALL)

# 2. Update CSS for professional look and remove nav-btn css
css_updates = """
        :root {
            --primary: #2563eb;
            --primary-dark: #1e40af;
            --text-main: #1f2937;
            --text-light: #6b7280;
            --bg-main: #f3f4f6;
            --bg-slide: #ffffff;
            --accent: #3b82f6;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: var(--bg-main);
            color: var(--text-main);
            overflow: hidden;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
        }

        .presentation-container {
            width: 100vw;
            height: 100vh;
            position: relative;
            background-color: var(--bg-slide);
            box-shadow: 0 0 20px rgba(0,0,0,0.05);
            overflow: hidden;
        }

        .slide {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            padding: 60px 80px;
            box-sizing: border-box;
            opacity: 0;
            transition: opacity 0.5s ease-in-out, transform 0.5s ease-in-out;
            transform: translateY(20px);
            pointer-events: none;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        .slide.active {
            opacity: 1;
            transform: translateY(0);
            pointer-events: auto;
        }

        h1, h2, h3 {
            color: var(--primary-dark);
            font-weight: 700;
        }

        h1 {
            font-size: 3.5rem;
            margin-bottom: 20px;
            letter-spacing: -1px;
        }

        h2 {
            font-size: 2.5rem;
            margin-bottom: 30px;
            border-bottom: 3px solid var(--accent);
            padding-bottom: 10px;
            display: inline-block;
        }

        p, li {
            font-size: 1.25rem;
            line-height: 1.7;
            color: var(--text-light);
        }

        .screenshot {
            max-width: 100%;
            max-height: 55vh;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            margin: 20px auto;
            display: block;
            border: 1px solid #e5e7eb;
            object-fit: contain;
        }

        .progress-bar {
            position: absolute;
            bottom: 0;
            left: 0;
            height: 6px;
            background-color: var(--accent);
            transition: width 0.3s ease;
            z-index: 100;
        }

        .slide-counter {
            position: absolute;
            bottom: 20px;
            right: 30px;
            font-size: 1rem;
            color: var(--text-light);
            font-weight: 600;
            z-index: 100;
        }
        
        .branding-logo {
            position: absolute;
            top: 20px;
            right: 30px;
            height: 50px;
            z-index: 100;
            opacity: 0.8;
        }

        .center-slide {
            align-items: center;
            text-align: center;
        }
        
        .mermaid {
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            margin: 20px auto;
        }
"""
# Replacing old CSS styles
content = re.sub(r'<style>.*?</style>', f'<style>\n{css_updates}\n</style>', content, flags=re.DOTALL)

# Add Mermaid.js to head
if '<script src="https://cdn.jsdelivr.net/npm/mermaid' not in content:
    content = content.replace('</head>', '    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>\n    <script>mermaid.initialize({startOnLoad:true});</script>\n</head>')

# 3. Add click events for navigation
js_updates = """
        // Handle click navigation
        document.addEventListener('click', (e) => {
            // Ignore clicks on links or buttons
            if (e.target.tagName.toLowerCase() === 'a' || e.target.tagName.toLowerCase() === 'button') {
                return;
            }
            
            const clickX = e.clientX;
            const screenWidth = window.innerWidth;
            
            if (clickX > screenWidth / 2) {
                // Clicked right side
                currentSlide = Math.min(currentSlide + 1, totalSlides - 1);
            } else {
                // Clicked left side
                currentSlide = Math.max(currentSlide - 1, 0);
            }
            showSlide(currentSlide);
        });
"""
# Inject JS updates
content = re.sub(r'// Navigation Event Listeners.*?showSlide\(currentSlide\);\n\s*\}\);', js_updates, content, flags=re.DOTALL)


with open('Panduan_ERP_Orion.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated basic structure")
