# ml-service/app.py
# ── Multi-Modal Anime Generation via FLUX Kontext (HF Inference API) ──
from flask import Flask, request, jsonify
from huggingface_hub import InferenceClient
from dotenv import load_dotenv
from PIL import Image
import os
import io
import time

load_dotenv()  # loads .env file

app = Flask(__name__)
UPLOAD_FOLDER = 'outputs'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ── HF Configuration ────────────────────────────────────────────
HF_TOKEN = os.environ.get('HF_TOKEN', '')
client = InferenceClient(token=HF_TOKEN) if HF_TOKEN and HF_TOKEN != 'your_token_here' else None

# FLUX.1-Kontext-dev: state-of-the-art image-to-image model
# Runs via fal.ai provider through HF — works on your network
MODEL = "black-forest-labs/FLUX.1-Kontext-dev"

# ── Style-specific prompts ──────────────────────────────────────
STYLE_PROMPTS = {
    'hayao': (
        'Transform this image into Studio Ghibli anime art style. '
        'Use soft warm watercolor palette, dreamy atmospheric lighting, '
        'lush hand-painted backgrounds, gentle and whimsical feel. '
        'Keep the same composition, people and scene but render everything '
        'as beautiful anime illustration.'
    ),
    'paprika': (
        'Transform this image into vivid bold anime art style. '
        'Use highly saturated psychedelic colors, surreal dynamic composition, '
        'Satoshi Kon inspired aesthetic, expressive and energetic feel. '
        'Keep the same people and scene but render as stunning anime art.'
    ),
    'shinkai': (
        'Transform this image into Makoto Shinkai anime style. '
        'Use photorealistic anime rendering, dramatic beautiful sky with clouds, '
        'cinematic golden hour lighting, ultra sharp details, lens flare effects. '
        'Keep the same people and scene but render as high quality anime.'
    ),
}


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'hf_configured': client is not None,
        'model': MODEL,
    })


@app.route('/transform', methods=['POST'])
def transform():
    data = request.json
    image_path = data.get('image_path')
    style = data.get('style', 'hayao')
    output_path = data.get('output_path', 'outputs/result.jpg')
    user_prompt = data.get('prompt', '')

    if not image_path or not os.path.exists(image_path):
        return jsonify({'error': f'Image not found: {image_path}'}), 400

    if not client:
        return jsonify({
            'error': 'HF_TOKEN not configured. '
                     'Edit ml-service/.env and add your Hugging Face token. '
                     'Get one free at https://huggingface.co/settings/tokens'
        }), 500

    # ── Build the prompt ────────────────────────────────────────
    base_prompt = STYLE_PROMPTS.get(style, STYLE_PROMPTS['hayao'])
    if user_prompt.strip():
        # User's custom mood/scene description enhances the base prompt
        prompt = f"{user_prompt.strip()}. {base_prompt}"
    else:
        prompt = base_prompt

    print(f'[Transform] Style: {style}')
    print(f'[Transform] Prompt: {prompt[:100]}...')

    try:
        # ── Load and prep image ─────────────────────────────────
        img = Image.open(image_path).convert('RGB')

        # Resize to max 1024px on longest side
        max_size = 1024
        w, h = img.size
        if max(w, h) > max_size:
            ratio = max_size / max(w, h)
            img = img.resize((int(w * ratio), int(h * ratio)), Image.LANCZOS)

        # Convert PIL image to bytes for the API
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='JPEG', quality=95)
        img_bytes = img_buffer.getvalue()

        print(f'[Transform] Image size: {img.size}, bytes: {len(img_bytes)}')

        # ── Call FLUX Kontext via HF Inference API ──────────────
        max_retries = 3
        result = None

        for attempt in range(max_retries):
            try:
                print(f'[Transform] API call attempt {attempt + 1}/{max_retries}...')

                result = client.image_to_image(
                    image=img_bytes,
                    prompt=prompt,
                    model=MODEL,
                )
                print(f'[Transform] API call successful! Result size: {result.size}')
                break

            except Exception as api_err:
                err_msg = str(api_err).lower()
                if ('loading' in err_msg or '503' in err_msg or 'queue' in err_msg) \
                        and attempt < max_retries - 1:
                    wait_time = 20 * (attempt + 1)
                    print(f'[Transform] Model busy, waiting {wait_time}s...')
                    time.sleep(wait_time)
                else:
                    raise api_err

        if result is None:
            return jsonify({'error': 'API call failed after retries'}), 500

        # ── Save result ─────────────────────────────────────────
        # Convert to RGB in case it's RGBA
        if result.mode == 'RGBA':
            result = result.convert('RGB')
        result.save(output_path, format='JPEG', quality=95)
        print(f'[Transform] Saved to {output_path}')

        return jsonify({
            'output_path': output_path,
            'success': True,
            'prompt_used': prompt,
        })

    except Exception as e:
        print(f'[Transform] Error: {type(e).__name__}: {e}')
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    if not client:
        print('\n' + '=' * 60)
        print('  WARNING: HF_TOKEN not set!')
        print('  Edit ml-service/.env and paste your token.')
        print('  Get one free: https://huggingface.co/settings/tokens')
        print('=' * 60 + '\n')
    else:
        print(f'HF API configured ✓  Model: {MODEL}')

    app.run(port=5001, debug=True)