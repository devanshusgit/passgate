# PassGate — Deployment Steps

All files are ready. Follow these steps in your terminal (PowerShell or Command Prompt).

---

## STEP 1 — Get your Gemini API Key (free)

1. Go to: https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key (looks like: `AIzaSy...`)
5. Open the `.env` file in the `passgate` folder and replace `PASTE_YOUR_GEMINI_KEY_HERE` with your key

---

## STEP 2 — Open a terminal in the passgate folder

In Windows Explorer, navigate to your `Downloads/passgate` folder,
then right-click → "Open in Terminal" (or PowerShell).

Or run:
```
cd %USERPROFILE%\Downloads\passgate
```

---

## STEP 3 — Test locally (optional but recommended)

```
npm run dev
```
Open http://localhost:5173 — you should see the PassGate UI.
Press Ctrl+C to stop.

---

## STEP 4 — Install GitHub CLI + Vercel CLI

```
npm install -g vercel
```

For GitHub CLI, download the installer from: https://cli.github.com
(Click "Download for Windows")

---

## STEP 5 — Initialize Git and push to GitHub

```
git init
git branch -m main
git add .
git commit -m "Initial commit — PassGate ATS Scanner"
gh auth login
gh repo create passgate --public --source=. --remote=origin --push
```

When `gh auth login` runs, choose:
- GitHub.com
- HTTPS
- Login with a web browser

---

## STEP 6 — Deploy to Vercel

```
npx vercel --prod
```

When prompted:
- Set up and deploy? → **Y**
- Which scope? → your username
- Link to existing project? → **N**
- Project name → **passgate**
- In which directory is your code located? → **./** (just press Enter)
- Want to modify settings? → **N**

---

## STEP 7 — Add your Gemini API Key to Vercel

```
npx vercel env add GEMINI_API_KEY production
```

Paste your Gemini API key when prompted, then press Enter.

Then redeploy:
```
npx vercel --prod
```

---

## STEP 8 — Done!

Vercel will print your live URL like:
`https://passgate-xyz.vercel.app`

Open it, upload a resume, paste a job description, and click Scan!
