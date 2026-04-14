# Project 8: L'Oréal Chatbot

L’Oréal is exploring the power of AI, and your job is to showcase what's possible. Your task is to build a chatbot that helps users discover and understand L’Oréal’s extensive range of products—makeup, skincare, haircare, and fragrances—as well as provide personalized routines and recommendations.

## 🚀 Launch via GitHub Codespaces

1. In the GitHub repo, click the **Code** button and select **Open with Codespaces → New codespace**.
2. Once your codespace is ready, open the `index.html` file via the live preview.

## ☁️ Cloudflare Note

When deploying through Cloudflare, make sure your API request body (in `script.js`) includes a `messages` array and handle the response by extracting `data.choices[0].message.content`.

### Secure deployment checklist

1.Play & Practice https://github.com/easmit60-arch/Chatbot_MeshUp
2. Paste the code from `RESOURCE_cloudflare-worker.js` into a Cloudflare Worker.
3. Add your OpenAI API key in Cloudflare under **Variables and Secrets** as `OPENAI_API_KEY`.
4. Deploy the Worker and copy the Worker URL that Cloudflare provides.
5. Confirm `script.js` points to your deployed Worker URL base (`https://l0realchatbot.easmit60.workers.dev`).
6. The app sends chat requests to `/api/chat` ( `https://l0realchatbot.easmit60.workers.dev/api/chat`).
7. Optional: for local overrides, define `window.LOCAL_CONFIG.WORKER_URL` before loading `script.js`.

### Verify the Worker connection

Open the browser DevTools console and run:

```js
await window.testWorkerConnection();
```

If the Worker is connected correctly, you will see a JSON response in the console.

## 🔄 Troubleshooting: Ouroboros Loop Pattern
### Reflections
"Here we go for the 13th time", I was in a loop for 13 hours trying to figure out why the AI agent is changing the code * write. Everytime I would have AI write in the Worker Script it would rewrite over what I wrote, thus causing a error. I would do it again, I put in gaurdrails in Copilot, it was not following the ones I was putting in place while actively changing the code to align with guardrails put into place by the professor. I had to edit the code to that was in the RESOURCE_cloudflare-worker to add a listner and sync.

### Symptom: "Sorry, I hit an error. Check your Worker URL and try again."

If your app shows a generic error and curl tests reveal HTTP 302 redirects to Cloudflare Access login, you are caught in a circular dependency:

- Frontend error is generic (does not reveal Access blocking).
- You check Worker code (it is fine).
- You check frontend code (it is fine).
- The real blocker is Cloudflare Access policy ordering, not code.

### Root Cause Hypotheses (ranked by likelihood)

1. **Access bypass rule for `/api/chat` is not created correctly.**
   - Verify in Cloudflare Zero Trust → Access → Applications.
   - Confirm the rule includes `path: /api/chat*` (note the wildcard).
   - Confirm the rule action is set to "Bypass" and include is "Everyone".

2. **Bypass rule exists but is below the broader protected rule, so it never matches.**
   - Cloudflare evaluates policies top-to-bottom; first match wins.
   - Move the `/api/chat*` bypass rule **above** the broader `/*` protected rule in the applications list.
   - Reorder via the UI or via the API (order field).

3. **Policy changed but has not propagated yet.**
   - Wait 1–2 minutes for Cloudflare edge propagation.
   - In terminal, confirm:

     ```bash
     curl -sS -i -X POST 'https://l0realchatbot.easmit60.workers.dev/api/chat' \
       -H 'Content-Type: application/json' \
       --data '{"messages":[{"role":"user","content":"hello"}],"context":{"name":"","pastQuestions":[]}}'
     ```
     
   - If status is still 302, continue debugging hypotheses 1–2.
   - If status is no longer 302 (e.g., 200, 400, 500), Access is working; focus on Worker/OpenAI errors.

### Recovery Steps

1. Reorder Cloudflare Access rules: `/api/chat*` bypass **above** `/*` protection.
2. Wait 1–2 minutes for propagation.
3. Re-run the curl test.
4. If curl now returns non-302 status, refresh your browser and test the chatbot again.
   Enjoy building your L’Oréal beauty assistant! 💄
