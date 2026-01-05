from PIL import Image, ImageDraw, ImageFont
import json
import sys
import os

def generate_result_image(result_data):
    # ایجاد تصویر
    width, height = 800, 400
    image = Image.new('RGB', (width, height), color=(10, 10, 42))
    draw = ImageDraw.Draw(image)
    
    # بارگذاری فونت (اگر فونت وجود دارد)
    try:
        font_large = ImageFont.truetype("arial.ttf", 28)
        font_medium = ImageFont.truetype("arial.ttf", 20)
        font_small = ImageFont.truetype("arial.ttf", 16)
    except:
        font_large = ImageFont.load_default()
        font_medium = ImageFont.load_default()
        font_small = ImageFont.load_default()
    
    # عنوان
    draw.text((width//2, 40), "GPU Stress Test Result", fill=(0, 255, 204), 
              font=font_large, anchor="mm")
    
    # اطلاعات کاربر
    y_pos = 100
    draw.text((50, y_pos), f"User: {result_data.get('username', 'Unknown')}", 
              fill=(255, 255, 255), font=font_medium)
    y_pos += 40
    
    draw.text((50, y_pos), f"Test: {result_data.get('testName', 'Unknown')}", 
              fill=(255, 255, 255), font=font_medium)
    y_pos += 40
    
    draw.text((50, y_pos), f"Score: {result_data.get('overallScore', 0)}", 
              fill=(255, 255, 255), font=font_medium)
    y_pos += 40
    
    draw.text((50, y_pos), f"Avg FPS: {result_data.get('avgFPS', 0)}", 
              fill=(255, 255, 255), font=font_medium)
    y_pos += 40
    
    draw.text((50, y_pos), f"Stability: {result_data.get('stability', 0)}%", 
              fill=(255, 255, 255), font=font_medium)
    y_pos += 40
    
    draw.text((50, y_pos), f"Duration: {result_data.get('duration', 0):.1f}s", 
              fill=(255, 255, 255), font=font_medium)
    
    # ذخیره تصویر
    if not os.path.exists('screenshots'):
        os.makedirs('screenshots')
    
    filename = f"screenshots/result_{result_data.get('username', 'unknown')}_{int(result_data.get('timestamp', 0))}.png"
    image.save(filename)
    
    return filename

if __name__ == "__main__":
    if len(sys.argv) > 1:
        result_data = json.loads(sys.argv[1])
        output_file = generate_result_image(result_data)
        print(output_file)
    else:
        print("No data provided")