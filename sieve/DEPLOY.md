# SIEVE — Deploy to Vercel in 5 Minutes

## Prerequisites
- GitHub account ✅
- Vercel account (signed up with GitHub) ✅
- Your Anthropic API key (get it at console.anthropic.com)

---

## Step 1 — Install tools (one time)

Open your terminal and run:

```bash
npm install -g vercel
```

---

## Step 2 — Push to GitHub

1. Go to github.com → click **"New repository"**
2. Name it `sieve`, set to **Public**, click **Create**
3. In your terminal, navigate to this folder and run:

```bash
git init
git add .
git commit -m "🚀 initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/sieve.git
git push -u origin main
```

*(Replace YOUR_USERNAME with your GitHub username)*

---

## Step 3 — Deploy to Vercel

```bash
vercel
```

When prompted:
- **Set up and deploy?** → `Y`
- **Which scope?** → your username
- **Link to existing project?** → `N`
- **Project name?** → `sieve` (or press Enter)
- **In which directory is your code?** → `./` (press Enter)
- **Override settings?** → `N`

Vercel will build and give you a live URL like: `https://sieve-xxx.vercel.app`

---

## Step 4 — Add your API Key (IMPORTANT)

1. Go to **vercel.com/dashboard**
2. Click your **sieve** project
3. Go to **Settings → Environment Variables**
4. Click **Add New**:
   - **Key:** `ANTHROPIC_API_KEY`
   - **Value:** your Anthropic API key (starts with `sk-ant-...`)
   - **Environment:** select all three (Production, Preview, Development)
5. Click **Save**

6. Redeploy to apply the key:
```bash
vercel --prod
```

---

## Done! 🎉

Your live URL is ready. Share it in your Mosaic Fellowship submission.

Every future update:
```bash
git add . && git commit -m "update" && git push
```
Vercel auto-deploys on every push.

---

## Troubleshooting

**"API key not configured" error** → Make sure you added the env variable AND redeployed with `vercel --prod`

**Build fails** → Run `npm install` locally first, then push again

**Blank screen** → Check browser console for errors, usually a JSX import issue
