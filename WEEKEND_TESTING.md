# Anchor - Weekend Testing Guide

How to fully test the extension when markets are closed.

---

## Method 1: Debug Mode (Recommended - Fastest)

Test all functionality without needing TradingView trades.

### Step 1: Install Extension
```
1. Extract zip file
2. Chrome → chrome://extensions/
3. Enable Developer Mode
4. Load unpacked → select anchor-extension folder
```

### Step 2: Open TradingView
```
Navigate to: https://www.tradingview.com/chart/
(You don't even need to be logged in for debug testing)
```

### Step 3: Open Chrome DevTools
```
Press F12 (or right-click → Inspect)
Go to Console tab
```

### Step 4: Simulate Trades

**Simulate a single losing trade:**
```javascript
chrome.runtime.sendMessage({
  type: 'TRADE_DETECTED',
  data: { pnl: -50, timestamp: Date.now() }
});
```

**Simulate consecutive losses (trigger cooldown):**
```javascript
// First loss
chrome.runtime.sendMessage({
  type: 'TRADE_DETECTED',
  data: { pnl: -25, timestamp: Date.now() }
});

// Wait 1 second, then second loss (should trigger with default Structured mode)
setTimeout(() => {
  chrome.runtime.sendMessage({
    type: 'TRADE_DETECTED',
    data: { pnl: -30, timestamp: Date.now() }
  });
}, 1000);
```

**Simulate hitting max daily loss:**
```javascript
// Send a large loss (default max is $500)
chrome.runtime.sendMessage({
  type: 'TRADE_DETECTED',
  data: { pnl: -500, timestamp: Date.now() }
});
```

**Simulate trade burst:**
```javascript
// Send multiple trades rapidly (need to enable burst trigger in settings)
for (let i = 0; i < 6; i++) {
  setTimeout(() => {
    chrome.runtime.sendMessage({
      type: 'TRADE_DETECTED',
      data: { pnl: -10, timestamp: Date.now() }
    });
  }, i * 500); // 500ms apart
}
```

### Step 5: Verify Overlay Appears
- Full-screen overlay should cover TradingView
- Timer should count down
- Journal form should be visible
- Quote and breathing ring should display

### Step 6: Test Journal
1. Fill out all three sections
2. Click "Save Reflection"
3. Verify completion message appears
4. Verify timer continues counting

### Step 7: Test Timer Completion
- Wait for timer to reach 0:00
- Overlay should automatically disappear
- TradingView access should restore

**Pro Tip:** Set cooldown to 1 minute for faster testing
```
Settings → Custom Mode → Cooldown Duration: 1 minute
```

---

## Method 2: TradingView Paper Trading

TradingView paper trading works 24/7, even on weekends.

### Step 1: Enable Paper Trading
```
1. Go to TradingView.com
2. Click "Trading Panel" at bottom
3. Click "Paper Trading" (top-right of panel)
4. Connect to "Paper Trading" account
```

### Step 2: Place Test Trades
```
1. Select any futures contract (ES, NQ, CL, etc.)
2. Set small position size
3. Place market orders
4. Immediately close positions
5. Watch for P&L changes
```

### Step 3: Monitor Detection
```
Open DevTools Console (F12)
Look for: "[Anchor] Trade detected" messages
```

**Note:** Paper trading may have different DOM structure than real brokers. If detection doesn't work:
- See Method 3 (Manual P&L Testing)
- Or use Method 1 (Debug Mode)

---

## Method 3: Manual P&L Value Testing

Test if the extension can find P&L values without trading.

### Step 1: Open TradingView with Paper Trading
```
Go to any chart with trading panel visible
Make sure you can see P&L numbers somewhere
```

### Step 2: Check Detection
```javascript
// In DevTools Console:

// Check if content script loaded
window.anchorDebug

// Should return:
// { getLastPnL: f, forceDetect: f, isOverlayActive: f }
```

### Step 3: Manual Detection Test
```javascript
// Force detection check
window.anchorDebug.forceDetect()

// Check what P&L was detected
window.anchorDebug.getLastPnL()

// Should return a number (your current P&L) or null
```

### Step 4: Inspect P&L Elements
```javascript
// Find elements with "PL" in class names
document.querySelectorAll('[class*="PL"]')

// Find elements with "P&L" text
const pnlElements = Array.from(document.querySelectorAll('*'))
  .filter(el => el.textContent.includes('P&L') || el.textContent.includes('$'))
  .filter(el => el.children.length === 0);

console.log('Found P&L elements:', pnlElements);
```

**If detection fails:**
1. Check TRADINGVIEW_DETECTION.md for selector debugging
2. Update selectors in content.js
3. Reload extension
4. Test again

---

## Method 4: Settings & UI Testing

Test all UI components without needing trades.

### Test Popup
```
1. Click Anchor icon in toolbar
2. Verify popup shows:
   - Status (should be "Active")
   - Daily P&L ($0.00)
   - Consecutive losses (0)
   - Settings button works
```

### Test Settings Page
```
1. Right-click Anchor icon → Options
   OR click Settings from popup

2. Test Mode Selection:
   - Click each mode card
   - Verify visual selection
   - Verify custom settings appear for Custom mode

3. Test Custom Mode:
   - Change consecutive losses threshold
   - Change max daily loss
   - Change cooldown duration
   - Enable/disable triggers
   - Change max loss behavior
   - Click Save
   - Verify success message

4. Test Data Management:
   - Click "View Stored Data"
   - Verify shows config and session data
   - Click "Clear All Data"
   - Confirm clear works
```

### Test Overlay Aesthetic
```
1. Use Debug Mode (Method 1) to trigger overlay
2. Verify design elements:
   - Background gradient (dark navy → darker)
   - Vignette effect
   - Subtle grain texture
   - Crimson Pro font for quotes
   - JetBrains Mono for timer/labels
   - Breathing ring animation (smooth 6.5s cycle)
   - Two-column layout (desktop)
   - Rounded corners on panels
   - Soft shadows and borders
   
3. Test Responsive:
   - Resize browser window
   - Verify stacks to single column on mobile
   - Verify all elements remain readable
```

---

## Method 5: Quick Full-Flow Test (5 Minutes)

Complete end-to-end test using debug mode.

### Checklist

**Installation (1 min)**
- [ ] Extension loads without errors in chrome://extensions/
- [ ] Anchor icon appears in toolbar
- [ ] No console errors

**Configuration (1 min)**
- [ ] Settings page opens
- [ ] Structured mode is selected by default
- [ ] Can switch modes and save
- [ ] Custom settings work

**Trigger Test (1 min)**
- [ ] Open TradingView (any page)
- [ ] Open DevTools console
- [ ] Run: `chrome.runtime.sendMessage({ type: 'TRADE_DETECTED', data: { pnl: -50, timestamp: Date.now() } });`
- [ ] Run again (second loss should trigger)
- [ ] Overlay appears immediately

**Overlay Test (2 min)**
- [ ] Quote displays correctly
- [ ] Timer shows correct time (15:00 for Structured)
- [ ] Breathing ring animates smoothly
- [ ] Journal form has all three sections
- [ ] Fill form and submit
- [ ] Completion message appears
- [ ] Timer continues counting
- [ ] Wait for 0:00 (or set to 1min for faster test)
- [ ] Overlay disappears automatically

**Verification**
- [ ] Can access TradingView again
- [ ] Popup shows updated stats
- [ ] Settings → View Data shows journal entry

---

## Weekend Testing Schedule

**Saturday Morning (30 min total):**
1. **Install & Setup** (10 min)
   - Load extension
   - Test all settings
   - Configure preferred mode

2. **Debug Mode Testing** (15 min)
   - Test each mode preset
   - Test all trigger types
   - Test journal form
   - Test timer functionality

3. **UI/Aesthetic Review** (5 min)
   - Verify design matches spec
   - Test responsive behavior
   - Check font rendering

**Sunday (Optional - Real Trading Simulation):**
1. **Paper Trading** (20 min)
   - Open TradingView paper account
   - Make actual trades
   - Verify P&L detection
   - Test trigger activation
   - Debug selectors if needed

---

## Troubleshooting Weekend Testing

### "Extension won't load"
```
Check chrome://extensions/ for errors
Verify all files extracted from zip
Try removing and re-adding
```

### "Debug commands don't work"
```
Make sure you're in the Console tab
Make sure you're on a TradingView page
Check if content script loaded: window.anchorDebug
If undefined, check console for errors
```

### "Overlay doesn't appear"
```javascript
// Check current state
chrome.storage.local.get(['state'], (data) => {
  console.log('Current state:', data.state);
});

// Manually trigger overlay (bypass trigger system)
chrome.storage.local.set({
  state: {
    current: 'cooldown',
    cooldownEnd: Date.now() + 60000, // 1 minute
    triggerReason: 'Manual test'
  }
}, () => {
  // Reload TradingView page
  location.reload();
});
```

### "Timer doesn't count down"
```
Check browser console for JavaScript errors
Verify cooldownEnd timestamp is in future
Check if overlay.js loaded correctly
```

### "Journal won't submit"
```
Verify all required fields are filled
Check console for validation errors
Make sure emotion and other radios are selected
```

---

## Pre-Monday Checklist

Before markets open, make sure:

- [ ] Extension works in debug mode
- [ ] All modes apply correctly
- [ ] Overlay aesthetic is perfect
- [ ] Timer functions properly
- [ ] Journal saves correctly
- [ ] Settings persist
- [ ] Popup shows correct data

**Optional but recommended:**
- [ ] Test on TradingView paper trading
- [ ] Verify P&L detection works
- [ ] Test with real broker account (if you have one)

---

## Advanced Weekend Testing

### Test Edge Cases

**Browser Events:**
```
1. Trigger cooldown
2. Close browser completely
3. Reopen Chrome
4. Open TradingView
5. Verify cooldown resumed or access restored (depending on time)
```

**Multiple Tabs:**
```
1. Open TradingView in two tabs
2. Trigger cooldown in one tab
3. Verify both tabs show overlay (should only affect triggering tab)
```

**Storage Limits:**
```javascript
// Generate many journal entries
for (let i = 0; i < 100; i++) {
  chrome.runtime.sendMessage({
    type: 'JOURNAL_COMPLETE',
    data: {
      withinSetup: 'yes',
      emotion: 'neutral',
      shouldContinue: 'no',
      timestamp: Date.now()
    }
  });
}

// Check storage usage
chrome.storage.local.getBytesInUse(null, (bytes) => {
  console.log('Storage used:', bytes, 'bytes');
  console.log('Percent of 5MB limit:', (bytes / 5242880 * 100).toFixed(2) + '%');
});
```

**Mode Switching:**
```
1. Set Structured mode
2. Trigger cooldown
3. While in cooldown, switch to Scalper mode in settings
4. Verify timer adjusts or next trigger uses new settings
```

---

## Quick Debug Commands Reference

Copy-paste these into DevTools console on TradingView:

```javascript
// === TRIGGER TESTS ===

// Single loss
chrome.runtime.sendMessage({ type: 'TRADE_DETECTED', data: { pnl: -50, timestamp: Date.now() } });

// Consecutive losses (2 quick)
chrome.runtime.sendMessage({ type: 'TRADE_DETECTED', data: { pnl: -50, timestamp: Date.now() } });
setTimeout(() => chrome.runtime.sendMessage({ type: 'TRADE_DETECTED', data: { pnl: -50, timestamp: Date.now() } }), 1000);

// Max loss
chrome.runtime.sendMessage({ type: 'TRADE_DETECTED', data: { pnl: -500, timestamp: Date.now() } });

// === STATE CHECKS ===

// View current state
chrome.storage.local.get(['state', 'sessionData', 'config'], console.log);

// Check if overlay is active
window.anchorDebug?.isOverlayActive();

// Check last detected P&L
window.anchorDebug?.getLastPnL();

// === RESET ===

// Clear all data (fresh start)
chrome.storage.local.clear(() => console.log('Storage cleared'));

// Reset to active state
chrome.storage.local.set({ state: { current: 'active', cooldownEnd: null, triggerReason: null } });
```

---

## Success Criteria

By end of weekend testing, you should have:

✅ Confirmed extension loads and runs  
✅ Tested all mode presets  
✅ Verified overlay appears and looks perfect  
✅ Confirmed timer works correctly  
✅ Tested journal form submission  
✅ Verified data persistence  
✅ Checked all settings work  
✅ Identified any selector issues (if using paper trading)  

**You're ready for Monday markets when:**
- Debug mode triggers work flawlessly
- Overlay aesthetic matches your vision
- All modes apply correct settings
- Timer enforces minimum cooldown
- Journal saves locally

---

**Remember:** Debug mode (Method 1) is the most reliable weekend testing method. You can fully validate the behavioral architecture without needing market data.

Test with calm mastery. 🎯
