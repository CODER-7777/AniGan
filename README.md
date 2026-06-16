# 🎌 AniGan: Multi-Modal Anime Style Transfer

AniGan is a full-stack web application that transforms standard photographs into stunning, high-quality anime-style art. It features a premium, Studio Ghibli-inspired UI with glassmorphism effects and leverages advanced Generative AI (Stable Diffusion/FLUX via Hugging Face) to perform multi-modal image-to-image translations guided by user text prompts.

![AniGan Preview](https://img.shields.io/badge/Status-Active-success) ![Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node.js%20%7C%20Flask-blue) ![AI](https://img.shields.io/badge/AI-FLUX.1--Kontext--dev-purple)

---

## ✨ Features

- **Multi-Modal Generation**: Upload an image AND provide a text prompt (e.g., "Ghibli scene in the rain at sunset") to control the exact mood, lighting, and style of the output.
- **Premium UI/UX**: A highly polished, responsive interface built with raw CSS variables, featuring pure CSS particle backgrounds, glassmorphism cards, and fluid animations.
- **Microservices Architecture**: Clean separation of concerns with a React frontend, an Express gateway server, and a Python/Flask ML service.
- **Cloud AI Integration**: Uses the Hugging Face Inference API to access state-of-the-art diffusion models without requiring massive local GPU resources.

---

## 🛠️ Tech Stack

*   **Frontend (`client/`)**: React, Vite, Axios, React Dropzone, Pure CSS (Custom Design System).
*   **Backend (`server/`)**: Node.js, Express, Multer (for file handling).
*   **ML Service (`ml-service/`)**: Python, Flask, Hugging Face Hub (`huggingface_hub`), Pillow.
*   **AI Model**: `black-forest-labs/FLUX.1-Kontext-dev` (Image-to-Image diffusion model).

---

## 🚀 Getting Started

To run this application locally, you need to start all three services. 

### Prerequisites
- Node.js (v16+)
- Python (v3.8+)
- A **Free Hugging Face Token** (Get one at [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens))

### 1. Start the ML Service (Terminal 1)
This service handles the AI image generation.
```bash
cd ml-service

# Create and activate a virtual environment (if not already done)
python3 -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# Install dependencies
pip install flask pillow huggingface_hub python-dotenv

# Set up your Hugging Face Token
# Create a .env file in the ml-service folder and add:
# HF_TOKEN=your_huggingface_token_here

# Run the Flask server
python app.py
```
*Runs on `http://127.0.0.1:5001`*

### 2. Start the Node.js Server (Terminal 2)
This service handles file uploads and acts as a gateway between the frontend and the ML service.
```bash
cd server

# Install dependencies
npm install

# Start the Express server
node index.js
```
*Runs on `http://localhost:3001`*

### 3. Start the React Frontend (Terminal 3)
This is the beautiful user interface.
```bash
cd client

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```
*Runs on `http://localhost:5173`*

Open `http://localhost:5173` in your browser, upload an image, type an optional prompt, and click **Transform to Anime**!

---

## 🧠 Key Takeaways & Learnings

Building this project provided deep insights into modern web development and AI integration:

1. **Evolution of ML Models**: We initially explored lightweight GANs (AnimeGANv2) which act like complex color filters. We pivoted to **Diffusion Models** (FLUX via Hugging Face) to achieve true *Multi-Modal* capabilities, allowing text prompts to guide the structural and stylistic re-rendering of the image.
2. **Navigating Network Constraints & API Providers**: We encountered DNS blocking issues with standard Hugging Face inference endpoints (`api-inference.huggingface.co`). We learned how to debug API failures using raw `requests` and successfully pivoted to models served via alternative providers (like `fal.ai` via the HF Hub) that bypassed the network restrictions.
3. **Microservices Communication**: Successfully architected a pipeline where a React client sends multipart form data (images + text) to a Node.js server, which temporarily stores the file and forwards the payload to a Python Flask service for heavy lifting, returning the finalized asset URLs back up the chain.
4. **Handling Long-Running Processes**: Diffusion models take time (15-30 seconds). We implemented proper UI loading states, progress indicators, and extended Axios timeout configurations (`timeout: 120000`) to prevent premature connection drops during AI generation.
5. **Advanced CSS Engineering**: Rather than relying on frameworks like Tailwind, we built a bespoke "Studio Ghibli" design system from scratch using CSS Custom Properties (variables). This taught us the power of `backdrop-filter` for glassmorphism, pure CSS keyframe animations (like the floating particles background), and dynamic gradient states.
