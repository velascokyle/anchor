# Anchor - Quick Start Guide

Get up and running in 5 minutes.

---

## Step 1: Install Extension (2 minutes)

1. **Download** the `anchor-extension` folder
2. **Open Chrome** → Navigate to `chrome://extensions/`
3. **Enable Developer Mode** (toggle in top-right)
4. **Load Extension:**
   - Click "Load unpacked"
   - Select the `anchor-extension` folder
   - Extension loads automatically

✅ **Verify:** Anchor icon appears in Chrome toolbar

---

## Step 2: Configure Mode (1 minute)

1. **Click** Anchor extension icon
2. **Click** "Settings" button
3. **Select Mode:**
   - **New traders:** Start with "Structured Mode" (balanced)
   - **Scalpers:** Try "Scalper Mode" (lower friction)
   - **Strict discipline:** Use "Reset Mode" (every loss triggers)
4. **Click** "Save Configuration"

✅ **Verify:** Success message appears

---

## Step 3: Open TradingView (1 minute)

1. Navigate to https://www.tradingview.com/chart/
2. **Log in** to your account (paper trading OK)
3. **Open trading panel** (bottom panel)
4. **Make sure P&L is visible** in positions/account summary

✅ **Verify:** You can see your account P&L

---

## Step 4: Test Trigger (1 minute)

**Option A: Real Test**
1. Make a small trade
2. Close it for a loss
3. Wait 2-3 seconds
4. Overlay should appear

**Option B: Debug Test**
1. Press F12 (Chrome DevTools)
2. Console tab
3. Paste this code:
   ```javascript
   chrome.runtime.sendMessage({
     type: 'TRADE_DETECTED',
     data: { pnl: -50, timestamp: Date.now() }
   });
   ```
4. Press Enter
5. Overlay should appear immediately

✅ **Verify:** Full-screen overlay covers TradingView

---

## Step 5: Complete Journal (30 seconds)

1. **Read quote** and reason for trigger
2. **Fill journal:**
   - Execution check: Within setup? (Yes/No)
   - State check: Select your emotion
   - Professional alignment: Should you continue? (Yes/No)
3. **Click** "Save Reflection"
4. **Wait** for timer to expire

✅ **Verify:** Journal saved, timer continues, access returns when complete

---

## You're Done! 🎯

Anchor is now active. It will:
- Monitor your trades automatically
- Trigger cooldown when configured thresholds are met
- Enforce 15-minute reflection protocol
- Store journals locally on your device

---

## Next Steps

### Customize Your Settings
- **Settings → Custom Mode** to fine-tune triggers
- Adjust consecutive loss threshold
- Set your max daily loss limit
- Enable/disable specific triggers

### View Your Data
- **Click Anchor icon** for daily stats
- **Settings → View Stored Data** for journal entries
- All data stays on your device

### Adjust If Needed
- **Too many triggers?** Increase thresholds or switch to Scalper Mode
- **Not triggering?** Lower thresholds or enable more trigger types
- **Want longer cooldown?** Custom Mode allows 5-30 minutes

---

## Troubleshooting

### "Overlay doesn't appear"
→ Check DevTools console for errors  
→ Verify TradingView is logged in  
→ Try debug test (Step 4, Option B)

### "Can't see my settings changes"
→ Make sure you clicked "Save Configuration"  
→ Reload TradingView page after saving

### "P&L not detected"
→ See full guide: `TRADINGVIEW_DETECTION.md`  
→ TradingView DOM may need selector updates  
→ Test with debug mode first

### "Extension won't load"
→ Check chrome://extensions/ for errors  
→ Verify all files are present in folder  
→ Try removing and re-adding extension

---

## Quick Reference

**Modes:**
- Scalper: Low friction, 5min cooldown
- Structured: Balanced, 15min cooldown (default)
- Reset: High friction, every loss
- Custom: Manual configuration

**Triggers:**
- Consecutive losses
- Daily max loss
- Trade burst (X trades in Y minutes)

**Data Storage:**
- Everything local (chrome.storage)
- No external transmission
- View/clear in Settings

**Support:**
- Full docs: `README.md`
- Tech guide: `TRADINGVIEW_DETECTION.md`
- Issues: [GitHub/Contact]

---

## Remember

> "The 15-minute cooldown isn't punishment—it's professional standards."

Anchor works best when you're committed to the process. The overlay forces a pause. The journal re-engages your prefrontal cortex. The timer ensures minimum reflection time.

**This is behavioral architecture, not a magic fix.**

Trade with calm mastery. 🎯
