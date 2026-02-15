# Anchor - Troubleshooting: Overlay Not Appearing

If the overlay doesn't show up when testing, follow these steps:

---

## Step 1: Verify Extension is Loaded

### Check Extension Status
1. Go to `chrome://extensions/`
2. Find "Anchor" in the list
3. Verify:
   - [ ] Extension is **enabled** (toggle is blue/on)
   - [ ] No red error messages
   - [ ] "Service worker" shows "Active" or "Inactive" (both OK)

### If you see errors:
- Click "Errors" button to see details
- Common issues:
  - Missing files → Re-extract zip and reload
  - Syntax errors → Download fresh zip
  - Permission issues → Check manifest.json

---

## Step 2: Check TradingView Page

### Requirements
1. Must be on `https://www.tradingview.com/*`
2. Content script only injects on TradingView pages
3. Try these URLs:
   - https://www.tradingview.com/chart/
   - https://www.tradingview.com/
   - Any TradingView chart page

### Verify Content Script Loaded
1. **Open TradingView page**
2. **Press F12** (DevTools)
3. **Console tab**
4. **Type:** `window.anchorDebug`
5. **Expected result:**
   ```javascript
   {
     getLastPnL: ƒ,
     forceDetect: ƒ,
     isOverlayActive: ƒ
   }
   ```

### If undefined:
- Content script didn't load
- Check chrome://extensions/ for errors
- Make sure you're on a TradingView URL
- Try refreshing the page (Ctrl+R)

---

## Step 3: Check Background Service Worker

### Verify Background Script
1. Go to `chrome://extensions/`
2. Find Anchor extension
3. Click **"Service worker"** link (under extension name)
4. New DevTools window opens for background script
5. **Console tab** - check for errors

### Test Message Passing
In the background service worker console, type:
```javascript
// Check if initialized
chrome.storage.local.get(['config', 'state', 'sessionData'], console.log);
```

**Expected output:**
```javascript
{
  config: { mode: 'structured', ... },
  state: { current: 'active', ... },
  sessionData: { dailyPnL: 0, ... }
}
```

### If storage is empty:
- Extension didn't initialize
- Look for errors in console
- Try removing and re-adding extension

---

## Step 4: Manual Trigger Test

Let's bypass the button and trigger directly:

### From Background Service Worker Console

1. **Open** `chrome://extensions/`
2. **Click** "Service worker" under Anchor
3. **In the console that opens**, paste:

```javascript
// Get the TradingView tab ID
chrome.tabs.query({url: "https://www.tradingview.com/*"}, (tabs) => {
  if (tabs.length > 0) {
    const tabId = tabs[0].id;
    console.log('Found TradingView tab:', tabId);
    
    // Manually trigger cooldown
    chrome.tabs.sendMessage(tabId, {
      type: 'TRIGGER_COOLDOWN',
      data: {
        reason: 'Manual debug test',
        cooldownEnd: Date.now() + 60000, // 1 minute
        locked: false
      }
    }, (response) => {
      console.log('Message sent to tab');
    });
  } else {
    console.error('No TradingView tabs found - open TradingView first!');
  }
});
```

**This should immediately show the overlay.**

---

## Step 5: Check Configuration

Your mode settings might prevent triggers:

### View Current Config
**In background service worker console:**
```javascript
chrome.storage.local.get(['config'], (data) => {
  console.log('Current config:', JSON.stringify(data.config, null, 2));
});
```

### Check if triggers are enabled
**Expected for Structured mode:**
```javascript
{
  "mode": "structured",
  "customTriggers": {
    "consecutiveLosses": 2,
    "maxDailyLoss": 500,
    // ...
  },
  "cooldownMinutes": 15,
  "enabledTriggers": ["consecutiveLosses", "maxDailyLoss"]
}
```

### If enabledTriggers is empty:
```javascript
// Reset to default Structured mode
chrome.runtime.sendMessage({
  type: 'APPLY_MODE_PRESET',
  mode: 'structured'
}, (response) => {
  console.log('Reset to Structured mode:', response);
});
```

---

## Step 6: Check Session Data

Maybe triggers already fired or count is off:

### View Session Data
**In background service worker console:**
```javascript
chrome.storage.local.get(['sessionData'], (data) => {
  console.log('Session data:', JSON.stringify(data.sessionData, null, 2));
});
```

### Reset Session Data
```javascript
chrome.storage.local.set({
  sessionData: {
    dailyPnL: 0,
    consecutiveLosses: 0,
    trades: [],
    lastResetDate: new Date().toDateString()
  }
}, () => {
  console.log('Session data reset');
});
```

---

## Step 7: Force Trigger (Guaranteed Method)

This will **definitely** show the overlay if extension is working:

### In Background Service Worker Console:

```javascript
// Step 1: Set state to cooldown
chrome.storage.local.set({
  state: {
    current: 'cooldown',
    cooldownEnd: Date.now() + 60000, // 1 minute
    triggerReason: 'Debug force trigger'
  }
}, () => {
  console.log('State set to cooldown');
  
  // Step 2: Tell TradingView tab to show overlay
  chrome.tabs.query({url: "https://www.tradingview.com/*"}, (tabs) => {
    if (tabs.length > 0) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'TRIGGER_COOLDOWN',
        data: {
          reason: 'Debug force trigger',
          cooldownEnd: Date.now() + 60000,
          locked: false
        }
      });
      console.log('Overlay command sent');
    }
  });
});
```

**If this doesn't show overlay, there's an issue with content script injection.**

---

## Step 8: Content Script Issues

If force trigger didn't work, content script isn't running:

### Check Content Script Errors

1. **On TradingView page**, open DevTools (F12)
2. **Console tab**
3. Look for errors mentioning "content.js" or "Anchor"

### Common Issues:

**"Cannot read property of undefined"**
- JavaScript error in content.js
- Check line number
- Report as bug

**"Failed to load resource: net::ERR_FILE_NOT_FOUND"**
- Missing file
- Re-extract zip completely
- Reload extension

**No errors, but window.anchorDebug is undefined**
- Content script not matching URL
- Verify you're on https://www.tradingview.com/*
- Check manifest.json content_scripts matches section

### Manual Content Script Injection Test

**In background service worker console:**
```javascript
chrome.tabs.query({url: "https://www.tradingview.com/*"}, (tabs) => {
  if (tabs.length > 0) {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: () => {
        console.log('Manual injection test - Anchor should be loaded');
        console.log('anchorDebug exists:', typeof window.anchorDebug);
      }
    });
  }
});
```

---

## Step 9: Permissions Check

### Verify Permissions in Manifest

1. Open `manifest.json` from extracted folder
2. Verify these permissions exist:
```json
"permissions": [
  "storage",
  "tabs",
  "activeTab",
  "scripting"
],
"host_permissions": [
  "https://www.tradingview.com/*"
]
```

3. If missing or wrong, download fresh zip

---

## Step 10: Complete Reset

If nothing works, nuclear option:

### Full Extension Reset

1. **Go to** `chrome://extensions/`
2. **Remove Anchor** (click Remove button)
3. **Close all TradingView tabs**
4. **Restart Chrome completely**
5. **Re-extract zip** to fresh folder
6. **Load unpacked** again
7. **Open new TradingView tab**
8. **Try debug button** again

---

## Quick Diagnostic Script

Run this in background service worker console for full diagnostics:

```javascript
(async function diagnose() {
  console.log('=== ANCHOR DIAGNOSTICS ===\n');
  
  // Check storage
  const storage = await chrome.storage.local.get(null);
  console.log('1. Storage:', storage);
  
  // Check tabs
  const tabs = await chrome.tabs.query({url: "https://www.tradingview.com/*"});
  console.log('2. TradingView tabs:', tabs.length);
  if (tabs.length > 0) {
    console.log('   Tab ID:', tabs[0].id);
    console.log('   Tab URL:', tabs[0].url);
  }
  
  // Check state
  console.log('3. Current state:', storage.state?.current);
  console.log('4. Enabled triggers:', storage.config?.enabledTriggers);
  console.log('5. Session data:', storage.sessionData);
  
  console.log('\n=== END DIAGNOSTICS ===');
})();
```

---

## Expected Behavior Checklist

When working correctly:

1. **Click debug button** → Button closes
2. **TradingView tab** → Overlay appears within 500ms
3. **Overlay shows:**
   - [ ] Full-screen coverage
   - [ ] Stoic quote
   - [ ] Reason: "2 consecutive losses" (or similar)
   - [ ] Timer: 15:00 (or configured time)
   - [ ] Breathing ring animating
   - [ ] Journal form on right

---

## Still Not Working?

### Create Debug Report:

1. **Background worker console logs** (copy all)
2. **TradingView page console logs** (copy all)
3. **Chrome version:** `chrome://version/`
4. **Extension version:** Check manifest.json
5. **Operating System:**
6. **Steps taken:**
7. **Error messages:**

### Common Fixes Summary:

- **Extension won't load** → Check chrome://extensions/ for errors, re-extract zip
- **Content script missing** → Refresh TradingView page, check URL
- **Overlay won't show** → Use force trigger (Step 7)
- **No errors but nothing happens** → Complete reset (Step 10)
- **Triggers not firing** → Check config, reset session data

---

## Test with Absolute Minimum

Create a test HTML file to verify extension basics:

**test.html:**
```html
<!DOCTYPE html>
<html>
<head><title>Anchor Test</title></head>
<body>
  <h1>Extension Test</h1>
  <button onclick="testExtension()">Test Extension</button>
  <div id="result"></div>
  
  <script>
    function testExtension() {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        document.getElementById('result').textContent = '✅ Chrome extension API available';
        
        // Try to get extension ID
        console.log('Extension ID:', chrome.runtime.id);
      } else {
        document.getElementById('result').textContent = '❌ Extension API not available';
      }
    }
  </script>
</body>
</html>
```

Save and open in Chrome - if extension API isn't available, it's a Chrome/system issue.

---

**Most Common Issue:** Content script not loading because page URL doesn't match. Solution: Make absolutely sure you're on https://www.tradingview.com/chart/ or similar TradingView URL.
