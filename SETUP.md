# SWer_AI-PI: Trauma-Informed, Privacy-First Setup & Integration

**API KEYS (use environment variables, never commit real secrets):**

```
MISTRAL_API_KEY=YOUR_MISTRAL_API_KEY
API_ID=YOUR_API_ID
APIFY_API_TOKEN=YOUR_APIFY_API_TOKEN
AGENT_ID=YOUR_AGENT_ID
```

---

## Step 1: Set Up a Safe Linux Environment

If you need voice processing, use WSL (Windows Subsystem for Linux) or a privacy-respecting Linux VM. Never share your real credentials in public or shared environments.

- Install WSL (Windows):
  - Open PowerShell as Administrator and run:
    ```powershell
    wsl --install
    ```
  - Complete Ubuntu setup (create a username/password).

---

## Step 2: Install Docker (Optional, for Voice/AI)

- Open your WSL terminal (Ubuntu).
- Install Docker:
  ```bash
  sudo apt update && sudo apt install -y docker.io
  sudo service docker start
  sudo usermod -aG docker $USER
  # Log out and back in for group change
  ```

---

## Step 3: (Optional) Install Rhasspy for Voice

Run Rhasspy in Docker for local, privacy-respecting voice processing:

```bash
docker run -d -p 12101:12101 \
  --name rhasspy \
  -v "$HOME/.config/rhasspy/profiles:/profiles" \
  --device /dev/snd:/dev/snd \
  rhasspy/rhasspy
```

Access at [http://localhost:12101](http://localhost:12101)

---

## Step 4: Configure STT/TTS (Privacy-First)

- Use Vosk for offline STT.
- Use Mimic 3 for TTS (train with your own voice if desired).
- Never upload private voice data to third-party servers.

---

## Step 5: Voice Cloning (Optional)

1. Record 15–30 minutes of your voice (16kHz mono WAV).
2. Install Mimic 3: `pip install mimic3`
3. Train your model locally (see Mimic 3 docs).
4. Integrate with Rhasspy (never upload private data).

---

## Step 6: Integrate Mistral for NLP

1. In your intent handler, call the Mistral API using your environment variable for the key:

```python
import os, requests
def query_swb(text):
    url = "https://api.mistral.ai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {os.getenv('MISTRAL_API_KEY')}"}
    payload = {"model": "mistral-medium", "messages": [{"role": "user", "content": text}]}
    response = requests.post(url, headers=headers, json=payload)
    return response.json()["choices"][0]["message"]["content"]
```

2. Never hardcode secrets. Always use environment variables.
3. Configure Rhasspy to call your handler as needed.

---

## Step 7: Test the Setup

- Speak to the assistant using the wake word.
- The assistant will:
  - Transcribe your speech (STT)
  - Send text to SWer_AI-PI for NLP
  - Respond in your cloned voice (TTS)

---

## Step 8: Troubleshooting

- If Docker/WSL issues, check versions and logs.
- For privacy, never share logs with secrets.

---

## Next Steps

- Test and refine locally.
- Deploy to a private device (e.g., Raspberry Pi) for continuous, private use.

---

## System Architecture: Safety Bot (SWB)

### 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface Layer                   │
│  (Web UI / CLI / Desktop App / Mobile-responsive)          │
└────────────────────┬───────────────────────────────────────┘
                     │
┌────────────────────▼───────────────────────────────────────┐
│                   API Gateway Layer                       │
│  (Auth, Rate Limiting, Request Routing)                   │
└────────────────────┬───────────────────────────────────────┘
                     │
     ┌───────────────┼───────────────┐
     │               │               │
┌────▼────┐  ┌──────▼──────┐  ┌────▼─────┐
│  Core   │  │  Community  │  │ Encrypted │
│  Safety │  │  & Peer     │  │ Messaging │
│ Module  │  │  Network    │  │ Service   │
└────┬────┘  └──────┬──────┘  └─────┬─────┘
     │              │              │
┌────▼──────────────▼──────────────▼──────────┐
│         Local Data Layer (Encrypted)        │
│  - User Profiles                            │
│  - Safety Plans                             │
│  - Resource Library (cached)                │
│  - Community Data (synced, encrypted)       │
└────┬───────────────────────────────────────┘
     │
┌────▼─────────────────────────────────────┐
│    Sync & Backup Engine (E2E Encrypted)  │
│    (Optional Cloud)                      │
└──────────────────────────────────────────┘
```

### 2. Core Modules

- Safety Planning & Client Research: Risk assessment, peer network, documentation (local only)
- Resource Library: Legal, health, and community resources
- Communication & Screening: Messaging templates, encrypted messaging
- Community & Peer Network: Peer verification, anonymous sharing
- Privacy & Security: Encryption, data minimization, access control

### 3. Technology Stack

| Layer      | Technology             | Why                             |
| ---------- | ---------------------- | ------------------------------- |
| Frontend   | React/Vue.js/Electron  | Cross-platform, offline-first   |
| Mobile     | React Native/Flutter   | iOS & Android support           |
| Backend    | Node.js/Python         | Lightweight, community-friendly |
| Database   | SQLite/PouchDB         | Offline-first, encrypted        |
| Encryption | TweetNaCl.js/libsodium | Audited, industry-standard      |
| Messaging  | Matrix/Riot API        | Decentralized, E2E encrypted    |
| Deployment | Docker/AppImage        | Multi-OS support                |

### 4. Data Flow (User-Centered)

1. User opens SWB locally
2. Initiates a workflow (e.g., "Client Research")
3. System prompts for user input
4. Safety Module processes the request (local only)
5. Optional: Ask peers (encrypted, anonymized)
6. User documents findings in Safety Plan (encrypted locally)
