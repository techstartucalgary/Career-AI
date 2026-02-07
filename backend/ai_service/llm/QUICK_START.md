# Quick Start: Modular LLM System

## TL;DR

Your resume AI is now **modular**! Switch between cloud and local models with one line:

```bash
# .env file
LLM_PROVIDER=gemini    # or "ollama" for local
```

No code changes needed. Just change the config and restart.

---

## Current Setup (Gemini - No Changes)

Everything works exactly as before:

```bash
# .env
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_key_here
```

**Performance**: ~30-40s for resume generation

---

## Switch to Local Model (Faster)

### 1. Install Ollama (one-time)
```bash
brew install ollama
```

### 2. Download a model (one-time)
```bash
# Recommended: Best balance for M4 Mac Air 16GB
ollama pull qwen2.5:7b

# OR faster but lower quality
ollama pull phi3.5

# OR slower but higher quality
ollama pull llama3.3:8b
```

### 3. Start Ollama
```bash
ollama serve
```

### 4. Update .env
```bash
LLM_PROVIDER=ollama
OLLAMA_MODEL=qwen2.5:7b
```

### 5. Restart backend
```bash
cd backend
python main.py
```

**Performance**: ~15-25s for resume generation (1.5-2x faster!)

---

## Model Comparison

| Model | Where | Speed | Quality | RAM | Cost |
|-------|-------|-------|---------|-----|------|
| **gemini-2.5-flash** | Cloud | ⚡⚡ (network) | ⭐⭐⭐⭐ | 0GB | $$ |
| **phi3.5** | Local | ⚡⚡⚡⚡ | ⭐⭐⭐ | 4GB | Free |
| **qwen2.5:7b** ✅ | Local | ⚡⚡⚡ | ⭐⭐⭐⭐ | 6GB | Free |
| **llama3.3:8b** | Local | ⚡⚡ | ⭐⭐⭐⭐ | 7GB | Free |

**Recommendation for M4 Mac Air 16GB**: `qwen2.5:7b`

---

## Switching Back

Want to go back to Gemini?

```bash
# .env
LLM_PROVIDER=gemini
```

Restart backend. Done!

---

## Advanced: Manual Override in Code

```python
from ai_service.ai_service import AIService

# Use default from .env
service = AIService()

# OR force Gemini
service = AIService(provider="gemini")

# OR force local phi-3.5
service = AIService(provider="ollama", model_name="phi3.5")
```

---

## Troubleshooting

### "Could not connect to Ollama"
→ Run `ollama serve` first

### "Model not found"
→ Run `ollama pull qwen2.5:7b` first

### "Out of memory"
→ Use smaller model: `ollama pull phi3.5`

---

## Benefits

**With Local Models:**
- ✅ 1.5-2x faster
- ✅ Free (no API costs)
- ✅ Private (data stays local)
- ✅ Works offline

**With Gemini:**
- ✅ No setup needed
- ✅ No RAM usage
- ✅ Reliable cloud infrastructure

---

## Next Steps

1. **Try it**: Install Ollama and test local models
2. **Compare**: Run same resume with both providers
3. **Choose**: Pick what works best for you
4. **Extend**: Add more providers (OpenAI, Claude, etc.)

---

For detailed setup: See `SETUP_LOCAL_MODEL.md`
For architecture details: See `IMPLEMENTATION_SUMMARY.md`
For usage examples: See `README.md`
