# BoltDYI Logo & Brand Assets

This folder contains all logo variations and brand assets for BoltDYI.

## 📁 File Structure

```
public/
├── favicon.svg                 # 32x32 favicon (replace with bolt icon)
├── logo.svg                    # Main logo used in header
├── brand/                      # 👈 Place all brand assets here
│   ├── logo-full.svg          # Full logo with text (primary)
│   ├── logo-full.png          # Full logo PNG (fallback)
│   ├── logo-icon.svg          # Just the bolt icon (for small spaces)
│   ├── logo-icon.png          # Icon PNG (fallback)
│   ├── logo-white.svg         # White version (for dark backgrounds)
│   ├── logo-white.png         # White PNG (fallback)
│   ├── logo-horizontal.svg    # Horizontal layout (if available)
│   ├── logo-horizontal.png    # Horizontal PNG (fallback)
│   └── social/                # Social media assets
│       ├── og-image.png       # 1200x630 for Open Graph
│       ├── twitter-card.png   # 1200x600 for Twitter
│       └── favicon.ico        # Multi-size favicon
```

## 🎨 Logo Versions You Need

### 1. **Primary Logo (Full Color)**
- **File:** `logo-full.svg` (and .png)
- **Usage:** Main website header, light backgrounds
- **Dimensions:** Flexible (SVG), recommended 200-400px width
- **Background:** Your circuit board logo with "BoltDYI" text

### 2. **Icon Only (Just the Bolt)**
- **File:** `logo-icon.svg` (and .png)
- **Usage:** Favicon, app icons, small spaces, loading indicators
- **Dimensions:** Square (512x512 recommended)
- **Background:** Just the circuit board lightning bolt

### 3. **White/Light Version**
- **File:** `logo-white.svg` (and .png)
- **Usage:** Dark backgrounds, photos, dark theme
- **Dimensions:** Same as primary
- **Background:** White or light colored version

### 4. **Horizontal Layout** (Optional)
- **File:** `logo-horizontal.svg` (and .png)
- **Usage:** Wide spaces, footer
- **Dimensions:** Wide aspect ratio
- **Background:** Logo with text side-by-side

## 📐 Recommended Sizes

### SVG Files (Vector - Always Preferred)
- Scale infinitely without quality loss
- Small file size
- Easy to style with CSS

### PNG Files (Raster - Fallback)
```
logo-full.png          → 800x800px or larger
logo-icon.png          → 512x512px (for app icons)
logo-white.png         → Same as logo-full.png
og-image.png           → 1200x630px (social media)
twitter-card.png       → 1200x600px (Twitter)
favicon.ico            → 16x16, 32x32, 48x48 (multi-size)
```

## 🔧 How to Add Your Logo

### Step 1: Export from Design Tool
Export your logo in these formats:
- SVG (best quality, smallest size)
- PNG with transparent background
- Different variations (full, icon, white)

### Step 2: Place Files
```bash
# Navigate to the project
cd /Users/stijnus/Github/bolt.new

# Place your logo files
cp ~/Downloads/boltdyi-logo-full.svg public/brand/logo-full.svg
cp ~/Downloads/boltdyi-icon.svg public/brand/logo-icon.svg
cp ~/Downloads/boltdyi-white.svg public/brand/logo-white.svg

# Update the main logo (used in header)
cp public/brand/logo-full.svg public/logo.svg

# Update favicon (just the icon)
cp public/brand/logo-icon.svg public/favicon.svg
```

### Step 3: Update Favicon
Replace `public/favicon.svg` with your bolt icon (just the lightning bolt without text).

### Step 4: Update Social Preview
Replace `public/social_preview_index.jpg` with a new image featuring your logo.

## 💻 Usage in Code

### In Header (already configured)
```tsx
// app/components/header/Header.tsx
<a href="/" className="text-2xl font-semibold text-accent flex items-center">
  <img src="/logo.svg" alt="BoltDYI" className="h-8" />
</a>
```

### As Favicon (already configured)
```tsx
// app/root.tsx
{
  rel: 'icon',
  href: '/favicon.svg',
  type: 'image/svg+xml',
}
```

### In Components
```tsx
// Full logo
<img src="/brand/logo-full.svg" alt="BoltDYI" />

// Icon only
<img src="/brand/logo-icon.svg" alt="BoltDYI" />

// White version (dark backgrounds)
<img src="/brand/logo-white.svg" alt="BoltDYI" />

// With gradient effect
<div className="circuit-glow">
  <img src="/brand/logo-full.svg" alt="BoltDYI" />
</div>
```

## 🎨 Logo Styling

### Apply Brand Gradient
```css
.logo-gradient {
  filter: drop-shadow(0 0 10px rgba(0, 188, 212, 0.5));
}
```

### Circuit Glow Effect
```css
.circuit-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    filter: drop-shadow(0 0 10px rgba(0, 188, 212, 0.3));
  }
  50% {
    filter: drop-shadow(0 0 20px rgba(0, 188, 212, 0.6));
  }
}
```

## 📱 Additional Assets Needed

### Social Media
- **Open Graph Image:** 1200x630px (Facebook, LinkedIn)
- **Twitter Card:** 1200x600px
- **Instagram:** 1080x1080px square

### App Icons
- **iOS:** 1024x1024px
- **Android:** 512x512px
- **PWA:** Multiple sizes (192x192, 512x512)

### Favicon
- **ICO file:** 16x16, 32x32, 48x48 (multi-resolution)
- **Apple Touch Icon:** 180x180px

## ✅ Checklist

- [ ] Export logo-full.svg (with text)
- [ ] Export logo-icon.svg (just bolt)
- [ ] Export logo-white.svg (for dark backgrounds)
- [ ] Place in `public/brand/` folder
- [ ] Update `public/logo.svg` with logo-full.svg
- [ ] Update `public/favicon.svg` with logo-icon.svg
- [ ] Create og-image.png (1200x630)
- [ ] Create twitter-card.png (1200x600)
- [ ] Test in light theme
- [ ] Test in dark theme
- [ ] Test favicon in browser tab

## 🚀 Quick Start

If you have your logo image ready:

```bash
# 1. Place your logo in the project
cp ~/Desktop/boltdyi-logo.png public/brand/logo-full.png

# 2. Update the main logo
cp public/brand/logo-full.png public/logo.png

# 3. Update favicon (should be just the icon)
cp ~/Desktop/boltdyi-icon.png public/favicon.png

# 4. Restart dev server
pnpm run dev
```

## 📞 Need Help?

If you need help:
1. Exporting logo in correct formats
2. Optimizing SVG files
3. Creating different variations
4. Setting up favicons

Create an issue or ask in the team chat!

---

**Last Updated:** January 3, 2025  
**Logo Version:** BoltDYI v1.0
