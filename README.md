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
4. Put that Worker URL into `secrets.js` under `WORKER_URL` for local testing.

### Verify the Worker connection

After you replace `WORKER_URL` in `secrets.js` with the deployed Cloudflare Worker URL, open the browser DevTools console and run:

```js
await window.testWorkerConnection();
```

If the URL is still a placeholder, the helper will warn you instead of sending a request.

Enjoy building your L’Oréal beauty assistant! 💄
