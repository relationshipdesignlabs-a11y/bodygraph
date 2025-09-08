# Human Design Bodygraph — Vercel Deploy (No GitHub required)

This folder contains everything you need to deploy your bodygraph to Vercel:
- `index.html` — your working bodygraph UI (A/B hidden, trimmed joins).
- `api/bodygraph.js` — a serverless function that calls the Human Design API securely.

The page calls **`/api/bodygraph`** on your domain, so your API keys stay **server-side**.

---
## 1) Prepare your API keys
1. Create an account at **vercel.com** and log in.
2. In a new tab, make sure you have your two keys ready:
   - `HD_API_KEY`  (from HumanDesign API)
   - `GEO_API_KEY` (the geocoding key you used earlier)

---
## 2) Create a new Vercel project (no GitHub needed)
You can deploy from a local folder using the Vercel dashboard:
1. Download the ZIP from ChatGPT and extract it.
2. Go to **Vercel Dashboard → Add New… → Project**.
3. Click **Continue** until you see **“Import a project”**. Choose **“Other”** (not Next.js).
4. Drag-and-drop the extracted folder into the Vercel page, or use the **“Upload”** option.
   - The folder must contain `index.html` at the root and the `api/` folder.
5. After Vercel analyzes the project, click **Deploy**.

> Alternative (recommended for ongoing edits): push this folder to a new GitHub repo and
> “Import Git Repository” in Vercel. GitHub is not required, but it’s nice for easy updates.

---
## 3) Add environment variables on Vercel
1. In your project’s page, go to **Settings → Environment Variables**.
2. Add:
   - **Name:** `HD_API_KEY` → **Value:** _your key_
   - **Name:** `GEO_API_KEY` → **Value:** _your key_
3. Set **Environment** to **Production**, **Preview**, and **Development** (all three), then **Save**.
4. Click **Redeploy** so your function sees the new keys.

---
## 4) Test on your live site
1. Open your Vercel deployment URL (`https://your-project-name.vercel.app`).
2. Click **Load sample** to verify the visuals render as before.
3. Enter a real **Birthdate / Time / Location** and click **Show Bodygraph**.
   - The page makes a POST request to **`/api/bodygraph`**.
   - The Vercel function forwards it to the upstream API with your keys, then returns the JSON.
   - The JSON is rendered onto your bodygraph template.

> Tip: If you see an error, open **Vercel → Project → Functions → Logs** to read the error message.
  Common causes are missing env vars or malformed birth data.

---
## 5) Local preview (optional)
If you want to test locally:
1. Install Node.js 18+ and run: `npm i -g vercel`
2. In the project folder, run: `vercel dev`
3. In the Vercel prompt, set local env values for `HD_API_KEY` and `GEO_API_KEY` when asked.
4. Open `http://localhost:3000`, try **Load sample**, then real input.

---
## 6) Updating your site
- Edit `index.html` in this folder (or upload a new one later).
- Keep your **endpoint** set to `'/api/bodygraph'`.
- Re-deploy by dragging the updated folder into Vercel again (or push to GitHub if you connected it).

---
## Notes
- Keys stay hidden: they live in **serverless env vars**, never in the client.
- CORS isn’t required because your page and API live on the **same origin**.
- If the upstream API ever changes fields, the UI will still render the sample JSON so you can iterate safely.
