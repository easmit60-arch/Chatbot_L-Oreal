# Project 9: L'Oréal Routine Builder

L’Oréal is expanding what’s possible with AI, and now your chatbot is getting smarter. This week, you’ll upgrade it into a product-aware routine builder.

Users will be able to browse real L’Oréal brand products, select the ones they want, and generate a personalized routine using AI. They can also ask follow-up questions about their routine just like chatting with a real advisor.

## 🚀 Launch via GitHub Codespaces

1. In the GitHub repo, click the **Code** button and select **Open with Codespaces → New codespace**.
2. Once your codespace is ready, open the `index.html` file via the live preview.

## ✅ Project 9 Objectives

1. Let users browse real L'Oréal brand products from `products.json`.
2. Allow selecting and unselecting products from the product grid.
3. Show selected products in a separate list with remove controls.
4. Save selected products with `localStorage` so they persist after reload.
5. Generate a personalized routine using only selected products.
6. Support follow-up chat questions with full conversation history.
7. Keep the UI responsive and accessible across screen sizes.

## ☁️ Cloudflare Note

When deploying through Cloudflare, make sure your API request body (in `script.js`) includes a `messages` array and handle the response by extracting `data.choices[0].message.content`.

### Secure deployment checklist

1. Practice first with this reference repo: [Chatbot_MeshUp](https://github.com/easmit60-arch/Chatbot_MeshUp).
2. Paste the code from `RESOURCE_cloudflare-worker.js` into a Cloudflare Worker.
3. Add your OpenAI API key in Cloudflare under **Variables and Secrets** as `OPENAI_API_KEY`.
4. Deploy the Worker and copy the Worker URL.
5. Confirm `script.js` points to your deployed Worker URL base (`https://l0realchatbot.easmit60.workers.dev`).
6. Make sure the app sends requests to `/api/chat` (`https://l0realchatbot.easmit60.workers.dev/api/chat`).
7. Optional: for local overrides, define `window.LOCAL_CONFIG.WORKER_URL` before loading `script.js`.

### Verify the Worker connection

Open the browser DevTools console and run:

```js
await window.testWorkerConnection();
```

If the Worker is connected correctly, you will see a JSON response in the console.

## 🔄 Troubleshooting: Ouroboros Loop Pattern

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

## 📝 Reflection Sections

### Reflection 1: Prompt Writing

What prompt strategy helped you get better routine outputs from the model?

Answer:

- I improved output quality by giving the model explicit structure, product constraints, and output format instructions.
- I included the selected product JSON so the model had concrete context.
- I requested a clear response format (AM steps, PM steps, reasoning, and a safety note) so the answer stayed focused.

### Reflection 2: Overcoming Roadblocks

What technical roadblock did you hit, and how did you solve it?

Answer:

- One challenge was keeping product selection, visual state, and selected list in sync.
- I solved it by using one source of truth (`selectedIds`), then re-rendering both the product grid and selected list after every selection change.
- I also used `localStorage` so the selected list persisted after reload and remained reliable.

### Reflection 3: LinkedIn Post Draft

Share a short professional summary of what you built.

Draft:
I built a Product-Aware L'Oréal Routine Builder chatbot using JavaScript, a Cloudflare Worker, and OpenAI. Users can browse real products, filter by category and keyword, select products, generate a personalized routine, and ask follow-up questions with conversation memory. I also implemented localStorage persistence, optional web search mode with source links, and responsive UI support including RTL layout handling.
