# 📊 Analytics Tracking Setup Guide

Your Letter of Support form now has invisible tracking to monitor who views it!

## 🎯 What's Being Tracked

- **IP Address** - Visitor's IP
- **Geolocation** - Country, city, region, postal code, coordinates
- **Device Info** - Browser, platform, screen resolution
- **Visit Details** - Timestamp, referrer, language, timezone, ISP

## 📱 How to View Analytics

### Option 1: Local Dashboard (Works Immediately)

1. Open `analytics-dashboard.html` in your browser
2. This shows all visits stored in your browser's localStorage
3. Works right away, no setup needed!

**Features:**
- Real-time visit tracking
- Filter by country, city, or IP
- Export to CSV
- Auto-refreshes every 30 seconds
- View location on Google Maps

### Option 2: Permanent Backend with Google Sheets (Recommended)

For permanent storage that persists across devices:

1. **Set up Google Apps Script:**
   - Go to https://script.google.com
   - Click "New Project"
   - Copy all code from `webhook-backend.gs`
   - Paste it into the script editor
   - Click "Deploy" → "New deployment"
   - Choose "Web app"
   - Set "Execute as" → "Me"
   - Set "Who has access" → "Anyone"
   - Click "Deploy"
   - Copy the Web App URL (looks like: `https://script.google.com/macros/s/...`)

2. **Connect to your form:**
   - Open `index.html`
   - Find line 3575: `const WEBHOOK_URL = 'YOUR_WEBHOOK_URL_HERE';`
   - Replace with your Web App URL
   - Save and push changes

3. **Benefits:**
   - Automatic Google Sheet creation
   - All visits logged permanently
   - Can view from anywhere
   - Optional email notifications

### Option 3: Quick Test with webhook.site

For testing without Google setup:

1. Go to https://webhook.site
2. Copy your unique URL
3. Paste it in `index.html` line 3575
4. Save and push
5. View visits at webhook.site

## 🔔 Email Notifications (Optional)

To get notified via email when someone views your form:

1. In your Google Apps Script (webhook-backend.gs)
2. Change line 139: `const recipient = 'your-email@example.com';` to your email
3. Uncomment line 153: `sendEmailNotification(data);`
4. Redeploy the script

You'll get an email for each visit!

## 🚀 Current Status

✅ Tracking script added to index.html (invisible, no visual changes)
✅ Analytics dashboard created (analytics-dashboard.html)
✅ Google Sheets backend ready (webhook-backend.gs)
⏳ Waiting for webhook URL configuration

## 📍 Files

- `index.html` - Your form (tracking added at line 3567-3632)
- `analytics-dashboard.html` - View your analytics
- `webhook-backend.gs` - Google Apps Script for permanent storage
- `ANALYTICS_SETUP.md` - This file

## 🔒 Privacy Notes

- Tracking only works on production (not localhost)
- Uses free ipapi.co service for geolocation
- No cookies or personal data stored
- Only captures technical visit information

## 🐛 Troubleshooting

**No data showing:**
- Check that you've visited the live site (not localhost)
- Make sure browser localStorage isn't disabled
- Try opening analytics-dashboard.html in the same browser

**Webhook not working:**
- Verify the URL in index.html line 3575 is correct
- Check Google Apps Script deployment settings
- Make sure "Who has access" is set to "Anyone"

## 💡 Tips

- Open `analytics-dashboard.html` in a browser tab and leave it open for real-time monitoring
- Use filters to track specific countries or cities
- Export to CSV for detailed analysis
- Combine with Google Sheets for long-term analytics
