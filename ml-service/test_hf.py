#!/usr/bin/env python3
"""Quick test to debug the HF Inference API connection."""
from dotenv import load_dotenv
from huggingface_hub import InferenceClient
from PIL import Image
import os, io, traceback

load_dotenv()

HF_TOKEN = os.environ.get('HF_TOKEN', '')
print(f"Token loaded: {'Yes (' + HF_TOKEN[:8] + '...)' if HF_TOKEN else 'NO'}")

client = InferenceClient(token=HF_TOKEN)

# Create a small test image (solid blue, 256x256)
test_img = Image.new('RGB', (256, 256), color=(100, 150, 200))
buf = io.BytesIO()
test_img.save(buf, format='JPEG')
img_bytes = buf.getvalue()

MODEL = "timbrooks/instruct-pix2pix"
PROMPT = "Convert to anime style"

print(f"\nTesting model: {MODEL}")
print(f"Prompt: {PROMPT}")
print(f"Image size: {len(img_bytes)} bytes")
print("Calling API...\n")

try:
    result = client.image_to_image(
        image=img_bytes,
        prompt=PROMPT,
        model=MODEL,
        guidance_scale=7.5,
        image_guidance_scale=1.5,
        num_inference_steps=20,
    )
    print(f"SUCCESS! Result type: {type(result)}, size: {result.size}")
    result.save("test_output.jpg")
    print("Saved to test_output.jpg")
except Exception as e:
    print(f"FAILED!")
    print(f"Error type: {type(e).__name__}")
    print(f"Error message: {e}")
    print(f"\nFull traceback:")
    traceback.print_exc()
