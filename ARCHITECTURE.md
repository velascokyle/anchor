# Anchor - System Architecture

Technical overview of the extension's architecture, data flow, and key design decisions.

---

## High-Level Overview

```
┌─────────────────────────────────────────────────────┐
│                  TradingView Page                    │
│  ┌──────────────────────────────────────────────┐  │
│  │           content.js (Content Script)         │  │
│  │  - DOM monitoring (MutationObserver)          │  │
│  │  - P&L detection                              │  │
│  │  - Overlay injection                          │  │
│  └─────────────┬────────────────────────────────┘  │
│                │ Messages                           │
│                ▼                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │        overlay.html (iframe overlay)          │  │
│  │  - Timer display                              │  │
│  │  - Journal form                               │  │
│  │  - Stoic aesthetic                            │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                │ Messages
                ▼
┌─────────────────────────────────────────────────────┐
│        background.js (Service Worker)                │
│  - State machine (ACTIVE/COOLDOWN/LOCKED)           │
│  - Trigger evaluation                               │
│  - Configuration management                         │
│  - Storage management                               │
└─────────────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────┐
│          chrome.storage.local                        │
│  - config: user settings                            │
│  - sessionData: daily P&L, trades                   │
│  - state: current state, cooldown end               │
│  - journals: saved journal entries                  │
└─────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Background Service Worker (background.js)

**Purpose:** Central state management and business logic

**Responsibilities:**
- Maintain state machine (ACTIVE → COOLDOWN → LOCKED)
- Evaluate triggers against configuration
- Manage session data (daily P&L, consecutive losses)
- Handle configuration updates
- Persist data to chrome.storage

**Key Functions:**
```javascript
handleTradeDetected()   // Process incoming trades
checkTriggers()         // Evaluate if triggers are met
triggerCooldown()       // Activate cooldown protocol
applyModePreset()       // Load mode configurations
```

**State Machine:**
```
ACTIVE
  ├─ Consecutive losses ≥ threshold → COOLDOWN
  ├─ Daily loss ≥ max loss → COOLDOWN or LOCKED
  └─ Trade burst detected → COOLDOWN

COOLDOWN
  ├─ Timer expires → ACTIVE
  └─ (Journal saved independently)

LOCKED
  └─ Next day (midnight) → ACTIVE (via daily reset)
```

**Data Structures:**
```javascript
config = {
  mode: 'scalper' | 'structured' | 'reset' | 'custom',
  customTriggers: {
    consecutiveLosses: number,
    maxDailyLoss: number,
    tradeBurst: { count, minutes },
    maxLossBehavior: 'journal' | 'lockDay'
  },
  cooldownMinutes: number,
  enabledTriggers: string[]
}

sessionData = {
  dailyPnL: number,
  consecutiveLosses: number,
  trades: [ { timestamp, pnl }, ... ],
  lastResetDate: string
}

state = {
  current: 'active' | 'cooldown' | 'locked',
  cooldownEnd: timestamp | null,
  triggerReason: string | null
}
```

---

### 2. Content Script (content.js)

**Purpose:** Interface with TradingView and manage overlay

**Responsibilities:**
- Monitor TradingView DOM for P&L changes
- Detect trade execution
- Inject and remove overlay iframe
- Relay messages between overlay and background

**Detection Strategy:**
```
MutationObserver
    ↓
Selector matching ([class*="PL"])
    ↓
Value extraction (regex + color detection)
    ↓
Delta calculation (current - last)
    ↓
Noise filtering (> $0.50)
    ↓
Report to background
```

**Key Functions:**
```javascript
detectTrade()        // Core detection loop
showOverlay()        // Inject full-screen iframe
removeOverlay()      // Clean up and restore access
```

**Message Flow:**
```
content.js → background.js
  - TRADE_DETECTED: { pnl, timestamp }
  - GET_STATE: request current state
  - COOLDOWN_EXPIRED: timer finished

background.js → content.js
  - TRIGGER_COOLDOWN: { reason, cooldownEnd, locked }
  - COOLDOWN_COMPLETE: remove overlay

content.js ↔ overlay.js (via postMessage)
  - INIT_OVERLAY: { reason, cooldownEnd, locked }
  - JOURNAL_COMPLETE: { form data }
  - COOLDOWN_EXPIRED: notify parent
```

---

### 3. Overlay (overlay.html + overlay.js)

**Purpose:** Full-screen cooldown interface

**Design Principles:**
- **Stoic aesthetic** - Calm, professional, minimal
- **Cognitive reset** - Re-engage prefrontal cortex
- **Identity reinforcement** - "You are an operator"
- **Non-negotiable timer** - Enforces minimum pause

**Layout Structure:**
```
┌──────────────────────────────────────────┐
│  Left Column          Right Column       │
│  ┌──────────────┐    ┌──────────────┐   │
│  │ Stoic Quote  │    │ Journal Card │   │
│  └──────────────┘    │              │   │
│  ┌──────────────┐    │ 1. Execution │   │
│  │ Status       │    │ 2. State     │   │
│  │ Reason       │    │ 3. Alignment │   │
│  │ Timer        │    │              │   │
│  └──────────────┘    │ [Submit]     │   │
│  ┌──────────────┐    └──────────────┘   │
│  │ Breathing    │                        │
│  │ Ring         │                        │
│  └──────────────┘                        │
└──────────────────────────────────────────┘
```

**Timer Logic:**
```javascript
// Timer starts on overlay load
cooldownEnd = timestamp + (minutes * 60 * 1000)

// Updates every second
setInterval(() => {
  remaining = cooldownEnd - Date.now()
  display = formatTime(remaining)
  
  if (remaining <= 0) {
    notifyExpired()
  }
}, 1000)
```

**Journal Validation:**
- All three sections required
- Conditional fields (violation text, continue reason)
- Form submission doesn't end timer
- Completion state shows confirmation

---

### 4. Popup (popup.html + popup.js)

**Purpose:** Quick status view

**Displays:**
- Current state (Active / Cooldown / Locked)
- Daily P&L (color-coded)
- Consecutive losses count
- Link to settings

**Updates:**
- On popup open (chrome.storage.local.get)
- No real-time sync (user must re-open)

---

### 5. Options Page (options.html + options.js)

**Purpose:** Configuration interface

**Features:**
- Mode selection (visual cards)
- Custom mode parameter inputs
- Trigger enable/disable
- Data management (view/clear)
- Success feedback

**Mode Preset System:**
```javascript
// Presets defined in background.js
MODE_PRESETS = {
  scalper: { /* config */ },
  structured: { /* config */ },
  reset: { /* config */ }
}

// Applied via message to background
chrome.runtime.sendMessage({
  type: 'APPLY_MODE_PRESET',
  mode: 'structured'
})
```

---

## Data Flow Diagrams

### Trade Detection Flow

```
TradingView renders P&L
    ↓
MutationObserver triggers
    ↓
content.js: detectTrade()
    ↓
Find P&L elements via selectors
    ↓
Extract value + sign
    ↓
Calculate delta from lastPnL
    ↓
Filter noise (> $0.50)
    ↓
chrome.runtime.sendMessage(TRADE_DETECTED)
    ↓
background.js: handleTradeDetected()
    ↓
Update sessionData (P&L, consecutive losses)
    ↓
checkTriggers()
    ↓
If triggered → triggerCooldown()
    ↓
Update state to COOLDOWN
    ↓
chrome.tabs.sendMessage(TRIGGER_COOLDOWN)
    ↓
content.js: showOverlay()
    ↓
Inject iframe, disable page scrolling
    ↓
Overlay loads, starts timer
```

### Journal Completion Flow

```
User fills journal form
    ↓
Clicks "Save Reflection"
    ↓
overlay.js: form submit handler
    ↓
Collect form data
    ↓
window.parent.postMessage(JOURNAL_COMPLETE)
    ↓
content.js: handleOverlayMessage()
    ↓
chrome.runtime.sendMessage(JOURNAL_COMPLETE)
    ↓
background.js: handleJournalComplete()
    ↓
Save to chrome.storage.local (journals array)
    ↓
Show completion message
    ↓
Timer continues independently
    ↓
On timer expiry → window.parent.postMessage(COOLDOWN_EXPIRED)
    ↓
content.js → chrome.runtime.sendMessage(COOLDOWN_EXPIRED)
    ↓
background.js: handleCooldownExpired()
    ↓
Update state to ACTIVE
    ↓
chrome.tabs.sendMessage(COOLDOWN_COMPLETE)
    ↓
content.js: removeOverlay()
    ↓
Access restored
```

---

## Key Design Decisions

### 1. Why Chrome Extension vs Web App?

**Advantages:**
- Direct DOM access to TradingView
- No TradingView API dependency
- Works with any broker
- Local storage (privacy)
- Enforceability (can block access)

**Tradeoffs:**
- Platform-specific (Chrome only in MVP)
- DOM fragility (TradingView updates can break)
- No cloud sync
- Limited to browser-based platforms

### 2. Why Manifest V3?

**Requirements:**
- Chrome deprecated Manifest V2
- Service workers required for background scripts
- Better security and performance

**Implications:**
- No background page (service worker only)
- No persistent state in background
- Must use chrome.storage for persistence
- Async message passing only

### 3. Why Full-Screen Overlay vs Modal?

**Rationale:**
- Maximum disruption (the point)
- Can't be dismissed accidentally
- Forces complete context switch
- Aesthetic consistency (no page bleed-through)

**Implementation:**
- Iframe for isolation
- z-index: 2147483647 (max)
- Disable page scrolling
- Prevent click-through

### 4. Why Journal Timer Runs Independently?

**Behavioral Design:**
- Prevents "speed-running" reflection
- Enforces minimum pause period
- Journal is cognitive reset, not task completion
- Timer = identity standard, not punishment

**Implementation:**
- Timer starts immediately on overlay load
- Journal completion shows confirmation
- Timer continues regardless
- No "skip" or "end early" option

### 5. Why Local Storage Only?

**Privacy:**
- No external data transmission
- User owns their data
- No analytics or tracking
- GDPR/privacy compliant by default

**Simplicity:**
- No backend required
- No auth/sync complexity
- Faster MVP iteration
- Easier to test

**Tradeoffs:**
- No multi-device sync
- Data lost if browser data cleared
- Limited to ~5MB per extension

---

## Performance Considerations

### MutationObserver Optimization

**Challenge:** Observing entire DOM is expensive

**Solution:**
```javascript
// Observe trading panel only (when found)
const tradingPanel = document.querySelector('.trading-panel');
if (tradingPanel) {
  observer.observe(tradingPanel, { /* config */ });
} else {
  // Fallback to body, but with debouncing
  observer.observe(document.body, { /* config */ });
}
```

### Memory Management

**Service Worker Lifecycle:**
- Wakes on message
- Sleeps after inactivity
- Must persist state to storage

**Overlay Isolation:**
- Iframe prevents memory leaks into page
- Clean removal on cooldown end

### Storage Efficiency

**Data Minimization:**
```javascript
// Don't store full trade objects
trades: [
  { timestamp, pnl } // Only essentials
]

// Journal entries: ~1KB each
// Daily limit: 100 trades × 100 bytes = 10KB
// Total: Well under 5MB limit
```

---

## Security Model

### Permissions (manifest.json)

```json
"permissions": [
  "storage",      // Local data only
  "tabs",         // Tab messaging
  "activeTab",    // Current tab access
  "scripting"     // Content script injection
],
"host_permissions": [
  "https://www.tradingview.com/*"  // TradingView only
]
```

### Content Security Policy

- No eval()
- No inline scripts in HTML
- No external script loads (except Google Fonts)
- Iframe sandboxing

### Data Access Boundaries

**Content Script Can Access:**
- TradingView DOM (read-only for P&L)
- chrome.storage (local only)
- chrome.runtime messages

**Content Script Cannot Access:**
- Broker credentials
- Account numbers
- API keys
- TradingView user data beyond displayed P&L

---

## Extension Lifecycle

### Installation
```
chrome.runtime.onInstalled
    ↓
initializeStorage()
    ↓
Set default config (Structured mode)
    ↓
Initialize sessionData
    ↓
Set state to ACTIVE
```

### Daily Reset
```
Each trade detection:
  Check if date changed
    ↓
  If new day:
    Reset dailyPnL to 0
    Reset consecutiveLosses to 0
    Clear trades array
    Update lastResetDate
```

### Update/Reload
```
Extension reloads
    ↓
Service worker reinitializes
    ↓
Read state from chrome.storage
    ↓
If in COOLDOWN:
  Resume cooldown (check timestamp)
  Re-inject overlay if needed
```

---

## Testing Strategy

### Unit Testing (Manual)

- Each function in isolation
- Edge cases (negative P&L, zero, large numbers)
- State transitions
- Storage operations

### Integration Testing

- Full flow: trade → trigger → journal → resume
- Mode preset application
- Settings persistence
- Multi-tab behavior

### End-to-End Testing

- Real TradingView paper trading
- Full user scenarios
- Browser restart during cooldown
- TradingView page refresh

---

## Future Architecture Considerations

### Platform Adapters

```javascript
// Abstract interface
class TradingPlatformAdapter {
  detectPlatform() { }
  getPnLSelectors() { }
  monitorTrades() { }
  injectOverlay() { }
}

// Platform-specific implementations
class TradingViewAdapter extends TradingPlatformAdapter {
  // Current implementation
}

class NinjaTraderAdapter extends TradingPlatformAdapter {
  // Desktop app - different approach
}
```

### Analytics Engine

```javascript
// Post-MVP: Behavior analysis
class AnalyticsEngine {
  calculateTiltProbability() { }
  detectTradeC clustering() { }
  scoreEmotionalVolatility() { }
  measureRuleAdherence() { }
}
```

### Cloud Sync (Optional)

```javascript
// If users request multi-device
class SyncEngine {
  encrypt(data) { }
  uploadToCloud() { }
  resolveConflicts() { }
  // Still: user opt-in, encrypted, privacy-first
}
```

---

## Maintenance & Updates

### Monitoring TradingView Changes

**Automated:**
- Weekly DOM structure snapshot
- Compare against known selectors
- Alert on breaking changes

**Manual:**
- Test on TradingView beta/canary
- Subscribe to TradingView release notes
- User reports of detection failures

### Versioning Strategy

```
1.0.0 - MVP (TradingView only)
1.1.0 - Analytics dashboard
1.2.0 - Custom operator codes
2.0.0 - Multi-platform support
```

### Rollback Plan

```
If critical bug in production:
  1. Disable extension in Chrome Web Store
  2. Prepare hotfix
  3. Test thoroughly
  4. Re-enable with version bump
  5. Notify users
```

---

## Code Standards

### Naming Conventions
- Variables: camelCase
- Constants: SCREAMING_SNAKE_CASE
- Functions: camelCase (verbs)
- CSS: kebab-case
- Files: kebab-case

### Message Types
- Always SCREAMING_SNAKE_CASE
- Prefix with context when ambiguous
- Examples: TRADE_DETECTED, JOURNAL_COMPLETE

### Storage Keys
- Descriptive, consistent
- Examples: config, sessionData, state, journals

---

This architecture prioritizes:
1. **Behavioral effectiveness** - 15-min cooldown is non-negotiable
2. **Privacy** - Local-first, no external transmission
3. **Simplicity** - Minimal dependencies, clear data flow
4. **Maintainability** - Clean separation of concerns
5. **Extensibility** - Adapter pattern for future platforms

The extension is a tool for committed traders to reinforce their identity as disciplined operators.
