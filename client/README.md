# LinkPulse Frontend — React + Vite on Vercel

This is the high-performance client interface for LinkPulse URL shortener and click analytics.

## Features
- **Instant URL Shortening**: Custom alias or clean 6-character random slug.
- **Deep Real-Time Analytics**:
  - Click volume over time (timeline chart)
  - Device distribution (Desktop, Mobile, Tablet)
  - Operating Systems & Browsers
  - Geographic breakdown (Countries & Cities)
  - Traffic Referrers (Direct, Social, Search Engines, Referral domains)
  - Live click event audit log
- **Integrated QR Code Suite**: SVG/PNG high-res download with custom colors.
- **UTM Builder & Tagging**: Add campaign parameters (`utm_source`, `utm_medium`, `utm_campaign`).
- **Flexible Backend Switching**: Use the built-in simulated storage engine or connect seamlessly to your live AWS EC2 FastAPI backend (`VITE_API_URL`).

## Deploying to Vercel
1. Push your repository to GitHub.
2. Go to [Vercel Dashboard](https://vercel.com/new).
3. Import your repository.
4. Set Framework Preset: **Vite**.
5. Add Environment Variable:
   ```env
   VITE_API_URL=https://api.yourdomain.com
   ```
6. Click **Deploy**. Vercel will build and distribute globally across edge CDN nodes.
