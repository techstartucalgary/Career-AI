# Modular LLM Provider System

This system allows you to switch between different LLM providers (Gemini, Ollama) without changing your code.

## Quick Start

### Option 1: Use Gemini (Cloud)

1. Set in `.env`:
```bash
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

2. That's it! No installation needed.

**Pros:**
- No setup required
- Fast and reliable
- No hardware requirements

**Cons:**
- Requires internet
- API costs apply
- Data sent to Google

---

### Option 2: Use Ollama (Local)

1. **Install Ollama:**
```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Windows
# Download from https://ollama.ai
```

2. **Pull a model:**
```bash
# Fast & small (recommended for M4 Mac Air 16GB)
ollama pull phi3.5

# OR: Balanced quality/speed
ollama pull qwen2.5:7b

# OR: Best quality
ollama pull llama3.3:8b
```

3. **Start Ollama:**
```bash
ollama serve
```

4. **Configure in `.env`:**
```bash
LLM_PROVIDER=ollama
OLLAMA_MODEL=phi3.5
OLLAMA_BASE_URL=http://localhost:11434
```

**Pros:**
- Private - data stays local
- No API costs
- Faster (no network latency)
- Works offline

**Cons:**
- Requires ~4-8GB RAM per model
- Need to run Ollama server
- Initial model download (~2-5GB)

---

## Model Comparison

### For Mac Air M4 (16GB RAM)

| Model | Provider | Speed | Quality | RAM | Best For |
|-------|----------|-------|---------|-----|----------|
| **phi3.5** | Ollama | ⚡⚡⚡⚡ | ⭐⭐⭐ | 4GB | Speed priority |
| **qwen2.5:7b** | Ollama | ⚡⚡⚡ | ⭐⭐⭐⭐ | 6GB | **Best balance** ✅ |
| **llama3.3:8b** | Ollama | ⚡⚡ | ⭐⭐⭐⭐ | 7GB | Quality priority |
| **gemini-2.5-flash** | Gemini | ⚡⚡ (network) | ⭐⭐⭐⭐ | 0GB | Cloud/no setup |

**Recommendation:** `qwen2.5:7b` for best local performance

---

## Usage in Code

### Automatic (uses .env config)
```python
from ai_service.ai_service import AIService

# Uses LLM_PROVIDER from .env
service = AIService()
```

### Manual override
```python
# Force Gemini
service = AIService(provider="gemini", model_name="gemini-2.5-flash")

# Force Ollama with Phi-3.5
service = AIService(provider="ollama", model_name="phi3.5")

# Force Ollama with Qwen 2.5
service = AIService(provider="ollama", model_name="qwen2.5:7b")
```

---

## Switching Providers

**To switch from Gemini to Ollama:**
1. Install Ollama and pull a model (see above)
2. Change `.env`: `LLM_PROVIDER=ollama`
3. Restart your backend
4. Done! No code changes needed

**To switch back to Gemini:**
1. Change `.env`: `LLM_PROVIDER=gemini`
2. Restart your backend
3. Done!

---

## Performance Comparison

### Resume Tailoring (~30-40s total)

| Provider | Model | Time | Notes |
|----------|-------|------|-------|
| Gemini | gemini-2.5-flash | ~30-40s | Includes network latency |
| Ollama | phi3.5 | ~15-20s | No network, pure inference |
| Ollama | qwen2.5:7b | ~20-25s | Slightly slower, better quality |
| Ollama | llama3.3:8b | ~25-30s | Highest quality |

**Expected speedup with local models:** 1.5-2x faster

---

## Troubleshooting

### Ollama connection error
```
Error: Could not connect to Ollama at http://localhost:11434
```

**Solution:**
```bash
# Start Ollama server
ollama serve
```

### Model not found
```
Error: model 'qwen2.5:7b' not found
```

**Solution:**
```bash
# Pull the model first
ollama pull qwen2.5:7b
```

### Out of memory
```
Error: not enough memory to load model
```

**Solution:**
- Use a smaller model (phi3.5 instead of llama3.3:8b)
- Close other applications
- Check available RAM: `ollama ps`

---

## Adding New Providers

To add support for OpenAI, Anthropic, etc.:

1. Create `backend/ai_service/llm/openai_provider.py`:
```python
from .base import BaseLLMProvider
from langchain_openai import ChatOpenAI

class OpenAIProvider(BaseLLMProvider):
    def __init__(self, api_key: str, model_name: str = "gpt-4", **kwargs):
        super().__init__(model_name, **kwargs)
        self.llm = ChatOpenAI(model=model_name, api_key=api_key, **kwargs)

    def invoke(self, messages, **kwargs):
        return self.llm.invoke(messages, **kwargs)

    def generate_content(self, prompt: str, **kwargs):
        response = self.llm.invoke([HumanMessage(content=prompt)], **kwargs)
        return response.content
```

2. Update `factory.py`:
```python
from .openai_provider import OpenAIProvider

def get_llm_provider(...):
    # ... existing code ...
    elif provider == "openai":
        return OpenAIProvider(api_key=api_key, model_name=model_name, **kwargs)
```

3. Update `config.py` with OpenAI settings

4. Done!
