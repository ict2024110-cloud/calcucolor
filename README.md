# CalcuColor ⬡

A stylish, client-side web app combining a **multi-mode calculator**, **color palette generator**, and **number converter** — with audio feedback and zero backend requirements.

**Live demo links:**
- GitHub: https://github.com/ict2024110-cloud
- Instagram: https://www.instagram.com/cine.snaper

---

## Features

| Feature | Details |
|---|---|
| 🔢 Calculator | Basic, Scientific, and Binary modes |
| 🎨 Color Palette | 6 scheme types, copy CSS vars or hex list |
| 🔄 Converter | Dec ↔ Bin ↔ Hex ↔ Oct with bit visualizer |
| 🔊 Audio | Web Audio API click sounds, mute toggle |
| 📱 Responsive | Works on mobile and desktop |

---

## Project Structure

```
calcucolor/
├── index.html      # App shell + markup
├── styles.css      # All styles (CSS variables, dark theme)
├── main.js         # All logic (calculator, palette, converter, audio)
├── manifest.json   # PWA manifest
├── favicon.svg     # SVG favicon
└── README.md       # This file
```

---

## How to Apply the Code

### Step 1 — Download the files
Download all 5 files above and keep them in one folder called `calcucolor/`.

### Step 2 — Test locally
Open `index.html` directly in your browser, OR use a local server:
```bash
# Python (built-in):
cd calcucolor
python3 -m http.server 8080
# Then open http://localhost:8080
```

---

## Free Hosting Options

### Option A — GitHub Pages (Recommended, Free)

1. Create a new GitHub repository at https://github.com/new  
   - Name it e.g. `calcucolor` or `my-app`
   - Set it to **Public**

2. Upload your files:
   ```bash
   cd calcucolor
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/calcucolor.git
   git push -u origin main
   ```

3. Enable GitHub Pages:
   - Go to your repo → **Settings** → **Pages**
   - Under "Source" select **Deploy from a branch**
   - Branch: `main` / Folder: `/ (root)`
   - Click **Save**

4. Your site goes live at:  
   `https://YOUR_USERNAME.github.io/calcucolor/`  
   (takes ~1–2 minutes first time)

---

### Option B — Netlify (Drag & Drop, Free)

1. Go to https://netlify.com and sign up (free)
2. On the dashboard click **"Add new site"** → **"Deploy manually"**
3. Drag your entire `calcucolor/` folder onto the upload zone
4. Done! You get a live URL like `https://random-name.netlify.app`
5. Optional: Go to **Site settings → Domain management** to set a custom name

---

### Option C — Vercel (Free)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```
2. From inside your `calcucolor/` folder:
   ```bash
   vercel
   ```
3. Follow the prompts (login, project name, etc.)
4. Your site deploys instantly at `https://calcucolor.vercel.app`

---

## Customization Tips

- **Change accent color**: Edit `--accent` in `styles.css` (line ~10)
- **Change social links**: Search for `instagram.com` and `github.com` in `index.html`
- **Add more palette schemes**: Add a case to `generatePalette()` in `main.js` and an `<option>` in `index.html`
- **Adjust sounds**: Edit the `configs` object in the `playSound()` function in `main.js`

---

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge).  
Web Audio API is required for sounds (gracefully silent if unavailable).
