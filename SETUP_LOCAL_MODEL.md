# Setup Local Model (Ollama) for CareerCompanion

This guide will help you set up a local LLM model using Ollama on your Mac Air M4 (16GB RAM).

## Why Use Local Models?

✅ **Faster**: No network latency (~2x faster than cloud)
✅ **Private**: Your resume data stays on your machine
✅ **Free**: No API costs
✅ **Offline**: Works without internet

## Step 1: Install Ollama

```bash
# Install via Homebrew
brew install ollama
```

**Alternative:** Download from https://ollama.ai

## Step 2: Pull a Model

For your Mac Air M4 with 16GB RAM, we recommend **Qwen 2.5 7B** for best balance:

```bash
# Best option: Qwen 2.5 7B (balanced speed & quality)
ollama pull qwen2.5:7b

# OR if you want maximum speed: Phi-3.5 Mini
ollama pull phi3.5

# OR if you want maximum quality: Llama 3.3 8B
ollama pull llama3.3:8b
```

This will download ~2-5GB depending on the model. It may take a few minutes.

## Step 3: Start Ollama Server

```bash
# Start Ollama in the background
ollama serve
```

**Tip:** Keep this terminal window open, or run Ollama as a background service:
```bash
# Run in background (macOS)
brew services start ollama
```

## Step 4: Test the Model

```bash
# Test that it works
ollama run qwen2.5:7b "Hello, how are you?"
```

You should see a response from the model.

## Step 5: Configure CareerCompanion

1. **Edit your `.env` file** in the `backend` directory:

```bash
# Change this line:
LLM_PROVIDER=gemini

# To this:
LLM_PROVIDER=ollama

# And set your model:
OLLAMA_MODEL=qwen2.5:7b
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_TEMPERATURE=0.3
```

2. **Restart your backend server:**

```bash
cd backend
python main.py
```

You should see:
```
✓ AIService initialized with Ollama (qwen2.5:7b at http://localhost:11434)
```

## Step 6: Test Resume Generation

Use your frontend or API to generate a resume. It should now use the local model!

Expected performance:
- **With Gemini**: ~30-40 seconds
- **With Ollama (qwen2.5:7b)**: ~15-25 seconds ⚡

---

## Model Recommendations

### For Mac Air M4 (16GB RAM):

| Model | Speed | Quality | RAM Used | Recommendation |
|-------|-------|---------|----------|----------------|
| `phi3.5` | ⚡⚡⚡⚡ | ⭐⭐⭐ | ~4GB | If speed is critical |
| `qwen2.5:7b` | ⚡⚡⚡ | ⭐⭐⭐⭐ | ~6GB | **Best choice** ✅ |
| `llama3.3:8b` | ⚡⚡ | ⭐⭐⭐⭐ | ~7GB | If quality is critical |

**Our recommendation: `qwen2.5:7b`**
- Great at structured outputs (JSON)
- Excellent for code and technical content
- Perfect balance for resume/interview tasks
- Leaves enough RAM for your system

---

## Switching Between Models

You can easily switch between models:

```bash
# Try a different model
ollama pull llama3.3:8b

# Update .env
OLLAMA_MODEL=llama3.3:8b

# Restart backend
```

---

## Switching Back to Gemini

If you want to switch back to Gemini:

1. Edit `.env`:
```bash
LLM_PROVIDER=gemini
```

2. Restart backend

That's it! The system will automatically use Gemini again.

---

## Troubleshooting

### "Could not connect to Ollama"

**Solution:** Make sure Ollama is running:
```bash
ollama serve
```

### "Model not found"

**Solution:** Pull the model first:
```bash
ollama pull qwen2.5:7b
```

### "Out of memory"

**Solution:** Use a smaller model:
```bash
ollama pull phi3.5
```

Then update `.env`:
```bash
OLLAMA_MODEL=phi3.5
```

### Slow performance

**Check:**
- Are other heavy apps running? (Close browsers, etc.)
- Is your Mac plugged in? (Better performance when charging)
- Try a smaller model (phi3.5)

---

## Advanced: Running Multiple Models

You can keep multiple models installed and switch between them:

```bash
# Pull all three
ollama pull phi3.5
ollama pull qwen2.5:7b
ollama pull llama3.3:8b

# List installed models
ollama list

# Switch in .env anytime:
OLLAMA_MODEL=phi3.5  # or qwen2.5:7b or llama3.3:8b
```

---

## Performance Comparison

### Resume Tailoring Task

| Configuration | Time | Notes |
|--------------|------|-------|
| Gemini 2.5 Flash (cloud) | ~30-40s | Network latency included |
| Ollama phi3.5 (local) | ~15-20s | Fastest, good quality |
| Ollama qwen2.5:7b (local) | ~20-25s | Best balance |
| Ollama llama3.3:8b (local) | ~25-30s | Highest quality |

**Expected speedup: 1.5-2x faster** with local models on your M4 Mac Air!

---

## Need Help?

- Ollama docs: https://ollama.ai/docs
- CareerCompanion issues: https://github.com/your-repo/issues
- Ollama Discord: https://discord.gg/ollama

---

Happy coding! 🚀
