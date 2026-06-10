# ml-service/app.py
from flask import Flask, request, jsonify
import os
from PIL import Image
import torch

app = Flask(__name__)
UPLOAD_FOLDER = 'outputs'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ── Load AnimeGANv2 model ────────────────────────────────────────
# Install first: pip install torch torchvision
# The model repo: github.com/bryandlee/animegan2-pytorch

model = None
midas = None
midas_transform = None

def load_model(style='hayao'):
    """Load AnimeGANv2 pretrained model"""
    global model
    
    # The bryandlee repo only has specific models, so we map our frontend styles to them:
    style_map = {
        'hayao': 'face_paint_512_v2',  # Good general anime face style
        'paprika': 'paprika',          # Paprika is actually available!
        'shinkai': 'celeba_distill'    # Fallback for Shinkai
    }
    
    actual_model_name = style_map.get(style, 'face_paint_512_v2')
    
    try:
        model = torch.hub.load(
            'bryandlee/animegan2-pytorch:main',
            'generator',
            pretrained=actual_model_name
        )
        model.eval()
        print(f'Model loaded: {style} (using weights: {actual_model_name})')
    except Exception as e:
        print(f'Model load failed: {e}')
        model = None

# Load default model on startup
load_model('hayao')

def load_midas():
    """Load MiDaS depth estimation model"""
    global midas, midas_transform
    if midas is not None:
        return
    try:
        model_type = "MiDaS_small"
        midas = torch.hub.load("intel-isl/MiDaS", model_type)
        midas.eval()
        midas_transforms = torch.hub.load("intel-isl/MiDaS", "transforms")
        midas_transform = midas_transforms.small_transform
        print("MiDaS model loaded.")
    except Exception as e:
        print(f"MiDaS load failed: {e}")
        midas = None

load_midas()

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'model_loaded': model is not None})

@app.route('/transform', methods=['POST'])
def transform():
    data       = request.json
    image_path = data.get('image_path')
    style      = data.get('style', 'hayao')
    output_path = data.get('output_path', 'outputs/result.jpg')

    if not image_path or not os.path.exists(image_path):
        return jsonify({'error': f'Image not found: {image_path}'}), 400

    try:
        # If model is not loaded or style changed, reload
        load_model(style)

        if model is None:
            # Fallback: just copy the input image
            # Remove this once model is working
            import shutil
            shutil.copy(image_path, output_path)
            return jsonify({'output_path': output_path, 'fallback': True})

        # Run inference
        from torchvision.transforms.functional import to_tensor, to_pil_image

        img = Image.open(image_path).convert('RGB')

        # Resize to reasonable size (model works best at multiples of 32)
        w, h = img.size
        new_w = (w // 32) * 32
        new_h = (h // 32) * 32
        img = img.resize((new_w, new_h))

        # Convert to tensor
        tensor = to_tensor(img).unsqueeze(0)

        with torch.no_grad():
            result_tensor = model(tensor)

        # Convert back to image
        result_img = to_pil_image(result_tensor.squeeze(0).clamp(0, 1))
        result_img.save(output_path)

        # Generate depth map
        depth_path = output_path.replace('.jpg', '_depth.jpg')
        if midas is not None:
            import cv2
            import numpy as np
            img_np = np.array(img)
            input_batch = midas_transform(img_np)
            
            with torch.no_grad():
                prediction = midas(input_batch)
                prediction = torch.nn.functional.interpolate(
                    prediction.unsqueeze(1),
                    size=(new_h, new_w),
                    mode="bicubic",
                    align_corners=False,
                ).squeeze()
                
            depth_map = prediction.cpu().numpy()
            # Normalize to 0-255
            depth_map = cv2.normalize(depth_map, None, 0, 255, norm_type=cv2.NORM_MINMAX, dtype=cv2.CV_8U)
            # Invert depth map (MiDaS outputs closer = lighter, Three.js displacement usually wants closer = lighter, but sometimes we need to invert. We'll stick with closer=lighter)
            Image.fromarray(depth_map).save(depth_path)
        else:
            depth_path = None

        return jsonify({'output_path': output_path, 'depth_path': depth_path, 'success': True})

    except Exception as e:
        print(f'Transform error: {e}')
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)