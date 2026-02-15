# TradingView P&L Detection - Technical Implementation Guide

## Overview

TradingView is a dynamic single-page application (SPA) that frequently updates its DOM structure. Anchor detects trades by monitoring changes in the realized/closed P&L displayed in TradingView's trading panel.

---

## Detection Strategy

### Primary Method: DOM Observation

The extension uses a two-pronged approach:

1. **MutationObserver** - Watches for DOM changes
2. **Polling** - Backup 2-second interval check

This ensures detection even if MutationObserver misses rapid changes.

### Target Elements

TradingView displays P&L in several locations:
- **Account Summary** - Net P&L
- **Positions Panel** - Realized P&L
- **Order History** - Closed P&L

We monitor **Realized/Closed P&L** as it changes when trades close.

---

## Selector Strategy

### Current Selectors (content.js)

```javascript
const pnlSelectors = [
  // Class-based selectors (most reliable)
  '[class*="netPL"]',
  '[class*="netPl"]',
  '[class*="closedPL"]',
  '[class*="closedPl"]',
  '[class*="realizedPL"]',
  '[class*="realizedPl"]',
  
  // Data attributes (if available)
  '[data-name="net-pl"]',
  '[data-name="closed-pl"]',
  '[data-name="realized-pl"]'
];
```

**Why wildcard matching?**
- TradingView uses CSS modules with hashed class names
- Example: `closedPL-x8k2j9f` (hash changes between builds)
- `[class*="closedPL"]` matches any class containing "closedPL"

---

## How to Find Current Selectors

### Method 1: Chrome DevTools Inspection

1. Open TradingView trading panel
2. Make a trade and close it (paper trading OK)
3. Right-click the P&L value → "Inspect"
4. Look for parent containers with stable class patterns

**Example DOM structure:**
```html
<div class="trading-panel-x7k2m">
  <div class="positions-tab-a9j3k">
    <div class="summary-row-b2n5p">
      <span class="label-c4k8j">Net P&L</span>
      <span class="value-d1m6n closedPL-x8k2j9f">$123.45</span>
    </div>
  </div>
</div>
```

Look for patterns like:
- `closedPL-*`
- `realizedPL-*`
- `netPL-*`

### Method 2: Console Search

```javascript
// Run in DevTools console on TradingView page

// Search for elements with "PL" in class names
document.querySelectorAll('[class*="PL"]')

// Search for elements with "P&L" text
const textNodes = document.evaluate(
  "//div[contains(text(), 'P&L') or contains(text(), 'Net')]",
  document,
  null,
  XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
  null
);

for (let i = 0; i < textNodes.snapshotLength; i++) {
  console.log(textNodes.snapshotItem(i));
}
```

### Method 3: Network Tab Analysis

1. DevTools → Network tab
2. Filter: XHR/Fetch
3. Make a trade
4. Look for API calls with P&L data
5. Find the element that displays this data

---

## Value Extraction

### Parsing Logic

```javascript
// Extract monetary value from text
const text = element.textContent || element.innerText;

// Match formats:
// $123.45, -$123.45, +$123.45, 123.45, -123.45
const match = text.match(/[-+]?\$?\s*([\d,]+\.?\d*)/);

if (match) {
  const value = parseFloat(match[1].replace(/,/g, ''));
  
  // Determine sign
  const isNegative = text.includes('-') || 
                     element.classList.contains('negative') ||
                     isRedColor(element);
  
  const pnl = isNegative ? -Math.abs(value) : Math.abs(value);
}
```

### Color Detection

```javascript
function isRedColor(element) {
  const color = window.getComputedStyle(element).color;
  
  // Common red color patterns
  return color.includes('rgb(255') ||     // rgb(255, 0, 0)
         color.includes('rgb(239') ||     // rgb(239, 83, 80)
         element.style.color === 'red' ||
         element.classList.contains('negative') ||
         element.classList.contains('loss');
}
```

---

## Detection Algorithm

### Full Implementation Flow

```javascript
function detectTrade() {
  let pnlValue = null;
  
  // 1. Try selector-based detection
  for (const selector of pnlSelectors) {
    const elements = document.querySelectorAll(selector);
    
    for (const element of elements) {
      const value = extractValue(element);
      if (value !== null) {
        pnlValue = value;
        break;
      }
    }
    if (pnlValue !== null) break;
  }
  
  // 2. Fallback: XPath text search
  if (pnlValue === null) {
    pnlValue = searchByText();
  }
  
  // 3. Check for change (trade closed)
  if (pnlValue !== null && lastPnL !== null) {
    const tradePnL = pnlValue - lastPnL;
    
    // Filter noise (sub-cent changes)
    if (Math.abs(tradePnL) > 0.5) {
      reportTrade(tradePnL);
    }
  }
  
  // 4. Update last known value
  if (pnlValue !== null) {
    lastPnL = pnlValue;
  }
}
```

---

## Handling Different TradingView Layouts

### Paper Trading vs. Real Trading

**Paper Trading:**
- Different panel layout
- May use different class names
- Test both modes

**Real Trading:**
- Broker-specific panels
- Different DOM structures per broker

### Multiple Account Types

1. **Broker-connected accounts**
2. **Paper trading accounts**
3. **Demo accounts**

Each may render P&L differently. Test across account types.

---

## Debugging Detection Issues

### Check if P&L is visible

```javascript
// Run in console on TradingView
const pnlElements = document.querySelectorAll('[class*="PL"]');
console.log('Found P&L elements:', pnlElements.length);

pnlElements.forEach((el, i) => {
  console.log(`Element ${i}:`, {
    text: el.textContent,
    classes: el.className,
    visible: el.offsetParent !== null
  });
});
```

### Monitor detection in real-time

```javascript
// Enable verbose logging in content.js
function detectTrade() {
  console.log('[Anchor Debug] Running detection...');
  
  // ... existing code ...
  
  if (pnlValue !== null) {
    console.log('[Anchor Debug] Current P&L:', pnlValue);
    console.log('[Anchor Debug] Last P&L:', lastPnL);
    console.log('[Anchor Debug] Delta:', pnlValue - lastPnL);
  } else {
    console.warn('[Anchor Debug] P&L not found');
  }
}
```

### Test with manual trigger

```javascript
// Simulate trade in console
window.anchorDebug.forceDetect();

// Or directly send message
chrome.runtime.sendMessage({
  type: 'TRADE_DETECTED',
  data: {
    pnl: -50.00,
    timestamp: Date.now()
  }
});
```

---

## Selector Update Process

When TradingView updates and selectors break:

### Step 1: Identify New Structure

```javascript
// Find all elements with $ symbols
const moneyElements = Array.from(document.querySelectorAll('*'))
  .filter(el => el.textContent.includes('$'))
  .filter(el => el.children.length === 0); // Leaf nodes only

moneyElements.forEach(el => {
  console.log({
    text: el.textContent,
    classes: el.className,
    parent: el.parentElement.className
  });
});
```

### Step 2: Extract Patterns

Look for:
- Stable class prefixes
- Data attributes
- Consistent parent structures

### Step 3: Update content.js

```javascript
// Add new selectors
const pnlSelectors = [
  // Old selectors (keep for backward compatibility)
  '[class*="closedPL"]',
  
  // New selectors (add based on findings)
  '[class*="newPattern-"]',
  '[data-name="new-attribute"]',
  
  // Parent-based selectors
  '.positions-panel [class*="value"]'
];
```

### Step 4: Test

1. Load updated extension
2. Make test trades
3. Monitor console for detection logs
4. Verify triggers activate correctly

---

## Advanced Detection Techniques

### 1. Event Listener Interception

```javascript
// Hook into TradingView's internal events
const originalDispatch = EventTarget.prototype.dispatchEvent;
EventTarget.prototype.dispatchEvent = function(event) {
  if (event.type === 'tradeClose' || event.type === 'positionUpdate') {
    console.log('[Anchor] Trade event detected:', event);
  }
  return originalDispatch.call(this, event);
};
```

### 2. Network Request Monitoring

```javascript
// Monitor WebSocket messages
const originalSend = WebSocket.prototype.send;
WebSocket.prototype.send = function(data) {
  // Parse and check for trade data
  try {
    const parsed = JSON.parse(data);
    if (parsed.type === 'trade' || parsed.method === 'closePo sition') {
      console.log('[Anchor] Trade WS message:', parsed);
    }
  } catch (e) {}
  
  return originalSend.call(this, data);
};
```

### 3. Storage Monitoring

```javascript
// Watch localStorage changes
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
  if (key.includes('trade') || key.includes('position')) {
    console.log('[Anchor] Storage update:', key, value);
  }
  return originalSetItem.call(this, key, value);
};
```

**Note:** These advanced techniques may break with TradingView updates and should be used as fallbacks.

---

## Performance Considerations

### Optimize MutationObserver

```javascript
// Don't observe everything
const observer = new MutationObserver(detectTrade);

// Only observe trading panel container
const tradingPanel = document.querySelector('.trading-panel');
if (tradingPanel) {
  observer.observe(tradingPanel, {
    childList: true,
    subtree: true,
    characterData: true
  });
} else {
  // Fallback to body if panel not found
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}
```

### Debounce Detection

```javascript
let detectionTimer = null;

const debouncedDetect = () => {
  clearTimeout(detectionTimer);
  detectionTimer = setTimeout(detectTrade, 300); // 300ms delay
};

observer.observe(document.body, {
  // ... config
}, debouncedDetect);
```

### Reduce Polling Frequency

```javascript
// Start with slower polling
setInterval(detectTrade, 5000); // 5 seconds

// Speed up when trading is active
function enterActiveMode() {
  clearInterval(pollInterval);
  pollInterval = setInterval(detectTrade, 1000); // 1 second
}
```

---

## Testing Matrix

Test across multiple scenarios:

### Browser Variations
- [ ] Chrome (latest)
- [ ] Chrome (1-2 versions back)
- [ ] Edge
- [ ] Brave

### TradingView Variations
- [ ] Free account
- [ ] Pro account
- [ ] Premium account
- [ ] Paper trading mode
- [ ] Real broker connection

### Trade Types
- [ ] Market orders
- [ ] Limit orders
- [ ] Stop orders
- [ ] Partial fills
- [ ] Multiple simultaneous positions

### Edge Cases
- [ ] Very fast trades (<1 second)
- [ ] Multiple trades in burst
- [ ] Switching between instruments
- [ ] Switching between accounts
- [ ] Page refresh during cooldown

---

## Fallback Strategies

If DOM detection proves unreliable:

### Option 1: User Confirmation
```javascript
// When change detected, ask user to confirm
if (possibleTrade) {
  const confirmed = confirm('Trade detected. P&L: $' + delta + '. Correct?');
  if (confirmed) {
    reportTrade(delta);
  }
}
```

### Option 2: Manual Logging
```javascript
// Add button to manually log trades
const logButton = document.createElement('button');
logButton.textContent = 'Log Trade';
logButton.onclick = () => {
  const pnl = prompt('Enter trade P&L:');
  if (pnl) {
    reportTrade(parseFloat(pnl));
  }
};
```

### Option 3: Broker API Integration
```javascript
// Future: Direct broker API
// Requires user auth and API keys
// More reliable but higher complexity
```

---

## Maintenance Checklist

Regular maintenance tasks:

### Monthly
- [ ] Test on latest TradingView version
- [ ] Check Chrome console for errors
- [ ] Verify selectors still work
- [ ] Test all trigger types

### After TradingView Updates
- [ ] Inspect DOM structure changes
- [ ] Update selectors if needed
- [ ] Test detection accuracy
- [ ] Update version number

### User Reports
- [ ] Collect failed detection cases
- [ ] Analyze common patterns
- [ ] Add new selectors
- [ ] Document fixes

---

## Resources

- TradingView Developer Docs: https://www.tradingview.com/HTML5-stock-forex-bitcoin-charting-library/
- Chrome Extension Docs: https://developer.chrome.com/docs/extensions/
- MutationObserver API: https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver

---

## Support

If detection issues persist after following this guide:

1. Enable debug logging (see above)
2. Export logs from console
3. Screenshot TradingView DOM structure
4. Report issue with:
   - Browser version
   - TradingView account type
   - Broker (if connected)
   - Console logs
   - Screenshot of P&L element structure
