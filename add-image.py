#!/usr/bin/env python3
import os
import shutil
import re

def add_new_image():
    # Folders
    new_images_folder = "new-images"
    heroimgs_folder = "img/heroimgs"
    
    # Create new-images folder if it doesn't exist
    if not os.path.exists(new_images_folder):
        os.makedirs(new_images_folder)
        print(f"Created '{new_images_folder}' folder. Put your new images here!")
        return
    
    # Get new images
    new_files = [f for f in os.listdir(new_images_folder) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    
    if not new_files:
        print("No images found in 'new-images' folder!")
        return
    
    # Find next available number
    existing_files = os.listdir(heroimgs_folder)
    numbers = []
    for f in existing_files:
        match = re.search(r'img(\d+)', f)
        if match:
            numbers.append(int(match.group(1)))
    
    next_num = max(numbers) + 1 if numbers else 1
    
    # Process each new image
    for img_file in new_files:
        # Copy to heroimgs with new name
        src = os.path.join(new_images_folder, img_file)
        ext = os.path.splitext(img_file)[1]
        new_name = f"img{next_num}{ext}"
        dst = os.path.join(heroimgs_folder, new_name)
        
        shutil.copy2(src, dst)
        print(f"Added: {new_name}")
        
        # Add to CSS
        add_to_css(next_num, new_name)
        
        # Add to HTML
        add_to_html(next_num, new_name)
        
        next_num += 1
    
    print(f"\nAdded {len(new_files)} images successfully!")
    print("You can now delete images from 'new-images' folder")

def add_to_css(num, filename):
    css_file = "css/style.css"
    
    with open(css_file, 'r') as f:
        content = f.read()
    
    # Add new CSS rule
    new_rule = f"\n.item-works-{num} {{\n    background-image: url('../img/heroimgs/{filename}');\n}}"
    
    # Find last item-works rule and add after it
    pattern = r'(\.item-works-\d+\s*\{[^}]+\})'
    matches = list(re.finditer(pattern, content))
    
    if matches:
        last_match = matches[-1]
        insert_pos = last_match.end()
        content = content[:insert_pos] + new_rule + content[insert_pos:]
    else:
        content += new_rule
    
    with open(css_file, 'w') as f:
        f.write(content)

def add_to_html(num, filename):
    html_file = "index.html"
    
    with open(html_file, 'r') as f:
        content = f.read()
    
    # Grid section
    grid_item = f'''                        <!-- grid item {num} -->
                        <div class="col-md-4 col-sm-6 col-xs-12 masonry-item">
                            <div class="circle-wrapper-full">
                                <div class="grid-item-all item-works-{num}"></div>
                                <div class="center-container">
                                    <div class="center-block">
                                        <div class="more-wraper-center item-folio">
                                            <a class="thumb-link" data-size="1920x1280" href="img/heroimgs/{filename}">
                                                <div class="more-button-bg-center more-button-circle"></div>
                                                <div class="more-button-txt-center">
                                                    <span>View</span>
                                                </div>
                                            </a>
                                            <div class="item-folio__caption">Lorem Ipsum is simply dummy text.</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>'''
    
    # Carousel item
    carousel_item = f'''                        <!-- carousel item {num} -->
                        <div class="item">
                            <div class="circle-wrapper-full">
                                <div class="carousel-item-all item-works-{num}"></div>
                                <div class="center-container">
                                    <div class="center-block">
                                        <div class="more-wraper-center item-folio">
                                            <a class="thumb-link" data-size="1920x1280" href="img/heroimgs/{filename}">
                                                <div class="more-button-bg-center more-button-circle"></div>
                                                <div class="more-button-txt-center">
                                                    <span>View</span>
                                                </div>
                                            </a>
                                            <div class="item-folio__caption">Lorem Ipsum is simply dummy text.</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>'''
    
    # Add to grid section
    grid_end = content.find('<!-- grid section end -->')
    if grid_end != -1:
        content = content[:grid_end] + grid_item + '\n                    ' + content[grid_end:]
    
    # Add to carousel section
    carousel_end = content.find('<!-- carousel section end -->')
    if carousel_end != -1:
        content = content[:carousel_end] + carousel_item + '\n                    ' + content[carousel_end:]
    
    with open(html_file, 'w') as f:
        f.write(content)

if __name__ == "__main__":
    add_new_image()