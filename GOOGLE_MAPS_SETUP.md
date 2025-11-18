# Google Maps API Setup Guide

## Quick Setup (5 minutes)

### 1. Get API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - **Maps JavaScript API**
   - **Places API** (optional, for future features)
4. Go to **APIs & Services** → **Credentials**
5. Click **Create Credentials** → **API Key**
6. Copy your API key

### 2. Configure API Key
1. Open `frontend/.env`
2. Replace `your_google_maps_api_key_here` with your actual API key:
   ```
   VITE_GOOGLE_MAPS_API_KEY=AIzaSy...your_key_here
   ```

### 3. Restart Development Server
```bash
cd frontend
npm run dev
```

## Security Best Practices

### Restrict API Key (Recommended for Production)
1. In Google Cloud Console, click on your API key
2. Under **Application restrictions**:
   - Select **HTTP referrers**
   - Add your domain: `yourdomain.com/*`
3. Under **API restrictions**:
   - Select **Restrict key**
   - Choose only: Maps JavaScript API

### Environment Variables
- ✅ **Development**: Use `.env` file (already set up)
- ✅ **Production**: Set `VITE_GOOGLE_MAPS_API_KEY` in your hosting platform

## Pricing
- Google Maps offers **$200 free credit per month**
- Maps JavaScript API: ~$7 per 1,000 loads
- Most small projects stay within free tier

## Troubleshooting

### Map not showing?
1. Check browser console for errors
2. Verify API key is correct in `.env`
3. Ensure Maps JavaScript API is enabled
4. Restart Vite dev server after changing `.env`

### "This page can't load Google Maps correctly"
- Your API key restrictions might be too strict
- Temporarily remove all restrictions to test
- Then add back restrictions one by one

## Features Implemented
- ✅ Interactive map with markers
- ✅ Blue pin: Your current location
- ✅ Red pin: Selected current location
- ✅ Gray pins: Nearby places
- ✅ Green pin: Selected nearby place
- ✅ Click markers to select location

## Next Steps
- [ ] Add info windows on marker click
- [ ] Enable place search
- [ ] Add routing/directions
- [ ] Customize map styling
