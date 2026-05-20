# Get a live website URL for AgriResolve

GitHub only hosts **code**. To get a URL anyone can open in a browser, deploy to **Render** (free):

## Steps (about 5 minutes, no terminal)

1. Open **[Render → New Web Service](https://dashboard.render.com/select-repo?type=web)** and sign in with **GitHub**.
2. On the GitHub screen, click **Authorize** for Render (if the button is grey, refresh the page).
3. Select repository **`agriresolve`** → **Connect**.
4. Render should detect `render.yaml` automatically. Confirm:
   - **Build:** `npm install && npm run build`
   - **Start:** `npm start`
5. Under **Environment**, add:
   - `OPENAI_API_KEY` = your OpenAI key (needed for AI chat; plant pages work without it)
6. Click **Create Web Service** and wait ~3–5 minutes for the build.
7. Your live URL will look like: **`https://agriresolve.onrender.com`** (shown at the top of the dashboard).

## After deploy

Share that `https://….onrender.com` link — that is your public web app.
