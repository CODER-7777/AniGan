# AnimeStyle (AniGan) - Multi-Modal Anime Generation

This project currently features a premium, interactive React UI that connects to a backend ML service to transform photos into an anime art style using AnimeGANv2.

However, the next evolutionary step for this application is **Option 5: Multi-Modal Anime Generation**.

## 🚀 Option 5: Multi-Modal Anime Generation Overview

The multi-modal anime generation feature allows a user to provide **both an image and a text prompt** (e.g., "Make this photo look like a Ghibli scene in the rain at sunset"). The system then generates an anime version that preserves the person/subject from the original photo while adopting the specific mood, environment, and artistic style described in the text.

### Technical Depth & Architecture

This requires a sophisticated combination of computer vision and natural language processing models.

#### 1. The Core Stack
- **Text Encoder (CLIP/T5):** To understand the semantic meaning of the user's text prompt ("Ghibli scene in the rain at sunset").
- **Vision Model:** To extract the structural and identity features from the user's uploaded photo.
- **Text-Guided Diffusion Model:** We will use a model like **Stable Diffusion (with ControlNet)** or **InstructPix2Pix**.
  - **ControlNet** is the ideal choice here. We can use a Canny edge detector or Depth map on the original photo to ensure the final generated image strictly follows the spatial structure of the uploaded photo.
  - The text prompt acts as the style and context guide.

#### 2. Pipeline Implementation Steps
1. **Input Stage:** The user uploads an image (`img`) and types a prompt (`txt`).
2. **Preprocessing:** 
   - The original image is passed through a preprocessor (e.g., Canny edge detection or HED boundary detection) to extract a control map (`C_map`).
3. **Multi-Modal Fusion (Diffusion Process):**
   - We initialize a latent noise vector.
   - The Diffusion model uses the `txt` prompt via cross-attention layers.
   - The `C_map` is injected via ControlNet into the U-Net blocks of the diffusion model, guiding the spatial layout.
   - We specifically use a fine-tuned "Anime" Checkpoint (e.g., Anything V3/V5, or NijiJourney-inspired models) as the base diffusion model.
4. **Output Stage:** The model denoises the image into a high-quality anime illustration matching the prompt.

### How to Implement in This Repository

#### Frontend (`client/`)
1. **Add a Prompt Input:** Update the drag-and-drop area in `App.jsx` to include a text input field for the prompt.
2. **State Management:** Add `const [prompt, setPrompt] = useState('')` and append it to the `FormData` in `handleTransform`.
3. **Loading States:** Update the loading spinner to reflect the longer processing times of diffusion models (typically 5-15 seconds).

#### Backend (`server/`)
1. **API Update:** Modify `index.js` to accept the `prompt` parameter from the multipart form data.
2. **Forwarding:** Pass both the image buffer and the text prompt to the ML service.

#### ML Service (`ml-service/`)
1. **Shift from GAN to Diffusion:** AnimeGANv2 is too rigid for text guidance. We must integrate a Python script that loads `diffusers` (Hugging Face).
2. **Model Loading (Python Example):**
```python
from diffusers import StableDiffusionControlNetPipeline, ControlNetModel
import torch
from diffusers.utils import load_image

# Load Anime ControlNet and Base Model
controlnet = ControlNetModel.from_pretrained("lllyasviel/sd-controlnet-canny", torch_dtype=torch.float16)
pipe = StableDiffusionControlNetPipeline.from_pretrained("andite/anything-v4.0", controlnet=controlnet, torch_dtype=torch.float16)
pipe.to("cuda")

def generate_multi_modal_anime(image_path, text_prompt):
    init_image = load_image(image_path)
    # Extract edges (Canny)
    canny_image = get_canny_edges(init_image) 
    
    # Generate
    prompt = text_prompt + ", masterpiece, best quality, highly detailed anime"
    negative_prompt = "lowres, bad anatomy, bad hands, cropped, worst quality"
    
    result = pipe(prompt, negative_prompt=negative_prompt, image=canny_image).images[0]
    return result
```

### UI Adjustments (Design System)
The current UI is already designed to feel premium. To add the text input without breaking the glassmorphism aesthetic:
- Create a frosted glass input field `<input type="text" className="glass-input" />`.
- Style it with `background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-subtle); color: var(--text-primary);`.
- Place it directly underneath the image dropzone but above the "Transform" button.

### Roadmap
- [x] Phase 1: Establish premium anime UI with CSS custom properties, glassmorphism, and responsive React logic.
- [ ] Phase 2: Set up Python microservice with `diffusers` and `ControlNet`.
- [ ] Phase 3: Add text input to the frontend and connect the multi-modal pipeline.
- [ ] Phase 4: Implement Region-by-Region style transfer (Option 1) using attention maps and segmentation masks.
