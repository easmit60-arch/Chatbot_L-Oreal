# Project 8: L'Oréal Chatbot

L’Oréal is exploring the power of AI, and your job is to showcase what's possible. Your task is to build a chatbot that helps users discover and understand L’Oréal’s extensive range of products—makeup, skincare, haircare, and fragrances—as well as provide personalized routines and recommendations.

## 🚀 Launch via GitHub Codespaces

1. In the GitHub repo, click the **Code** button and select **Open with Codespaces → New codespace**.
2. Once your codespace is ready, open the `index.html` file via the live preview.

## ☁️ Cloudflare Note

When deploying through Cloudflare, make sure your API request body (in `script.js`) includes a `messages` array and handle the response by extracting `data.choices[0].message.content`.

### Secure deployment checklist

1. Paste the code from `RESOURCE_cloudflare-worker.js` into a Cloudflare Worker.
2. Add your OpenAI API key in Cloudflare under **Variables and Secrets** as `OPENAI_API_KEY`.
3. Deploy the Worker and copy the Worker URL that Cloudflare provides.
4. Confirm `script.js` points to your deployed Worker URL base (`https://l0realchatbot.easmit60.workers.dev`).
5. The app sends chat requests to `/api/chat` ( `https://l0realchatbot.easmit60.workers.dev/api/chat`).
6. Optional: for local overrides, define `window.LOCAL_CONFIG.WORKER_URL` before loading `script.js`.

### Verify the Worker connection

Open the browser DevTools console and run:

```js
await window.testWorkerConnection();
```

If the Worker is connected correctly, you will see a JSON response in the console.

Enjoy building your L’Oréal beauty assistant! 💄
