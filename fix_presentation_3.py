import re
import base64

with open('Panduan_ERP_Orion.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update logo with the correct one
# The correct logo is media__1781702380985.png
logo_path = '/Users/vickra/.gemini/antigravity-ide/brain/229db030-452f-4c1b-8ed3-84d42283bb26/media__1781702380985.png'
with open(logo_path, 'rb') as f:
    logo_b64 = base64.b64encode(f.read()).decode('utf-8')

# Replace the existing base64 logo
content = re.sub(r'<img src="data:image/png;base64,[^"]+" class="branding-logo" alt="Logo">', f'<img src="data:image/png;base64,{logo_b64}" class="branding-logo" alt="Logo">', content)

# 2. Remove Slide 3. 
# Slide 1: Welcome/Panduan
# Slide 2: Profil Perusahaan
# Slide 0.5: Alur Proses (which is actually slide 3 based on HTML order now?)
# Let's see the slides by splitting on '<div class="slide'.
slides = content.split('<div class="slide')

# slides[0] is everything before the first slide.
# slides[1] is slide 1
# slides[2] is slide 2
# slides[3] is slide 3
# etc.

# We will remove slides[3] which is the 3rd slide.
# Wait, let's just make sure we remove the entire 3rd slide div
if len(slides) > 3:
    # re-join without slides[3]
    new_content = slides[0]
    for i in range(1, len(slides)):
        if i == 3:
            # We skip slide 3. We must find where the slide ends.
            # Usually it ends with </div> before the next <!-- Slide X --> or <div class="slide
            pass 
        else:
            new_content += '<div class="slide' + slides[i]
            
    # Wait, the split on '<div class="slide' might cut off the </div> of the 3rd slide?
    # No, because the </div> of slide 3 is inside slides[3].
    content = new_content

# Let's fix the CSS to be super professional with animations
css_animations = """
        /* Animations */
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .slide.active > * {
            animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            opacity: 0;
        }

        .slide.active > *:nth-child(1) { animation-delay: 0.1s; }
        .slide.active > *:nth-child(2) { animation-delay: 0.25s; }
        .slide.active > *:nth-child(3) { animation-delay: 0.4s; }
        .slide.active > *:nth-child(4) { animation-delay: 0.55s; }
        .slide.active > *:nth-child(5) { animation-delay: 0.7s; }

        /* Professional Typography and Styles */
        body {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }
        
        .presentation-container {
            background-color: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.1);
            margin: 20px;
            height: calc(100vh - 40px);
            width: calc(100vw - 40px);
            border: 1px solid rgba(255,255,255,0.5);
        }

        h1 {
            background: linear-gradient(135deg, var(--primary-dark), var(--primary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-size: 4rem;
        }

        .branding-logo {
            height: 60px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            padding: 5px;
            background: white;
            transition: transform 0.3s ease;
        }
        .branding-logo:hover {
            transform: scale(1.05);
        }

        .mermaid {
            background: transparent;
            box-shadow: none;
            border-radius: 0;
            padding: 0;
        }
        
        .progress-bar {
            height: 8px;
            border-radius: 4px;
            background: linear-gradient(90deg, var(--primary), #8b5cf6);
            bottom: 20px;
            left: 20px;
            width: calc(100% - 40px) !important; /* to be overridden by JS inline style, wait, js sets width % */
            max-width: 0%;
        }
"""

content = content.replace('/* Animations */', '') # In case we run it twice
content = content.replace('</style>', f'{css_animations}\n</style>')

# Fix progress bar logic since we added border-radius and offset
content = content.replace('progress.style.width = `${((currentSlide + 1) / slides.length) * 100}%`;', 'progress.style.maxWidth = `${((currentSlide + 1) / slides.length) * 100}%`; progress.style.width = "calc(100% - 40px)";')

with open('Panduan_ERP_Orion.html', 'w', encoding='utf-8') as f:
    f.write(content)
