# ⚓ Anchor - Session Architecture for Disciplined Trading

**Professional behavioral guardrails for futures traders who want to master their process.**

Anchor is a Chrome extension that implements a research-backed 15-minute cooldown protocol to prevent revenge trading and reinforce disciplined execution. Built for traders committed to process optimization, not market prediction.

---

## 🎯 Core Philosophy

**Process over profit.** Anchor doesn't predict markets—it optimizes your behavior through:
- **Identity reinforcement** - Anchor to professional standards, not emotional impulses
- **Cognitive reset** - Re-engage prefrontal cortex through structured reflection
- **Measurable improvement** - Track reduced trade clustering, lower drawdown volatility, higher rule adherence

**What Anchor is NOT:**
- Not signals, indicators, or copy trading
- Not a gambling restraint tool
- Not market analysis or prediction

**What Anchor IS:**
- Behavioral architecture for committed traders
- Process enforcement through intelligent triggers
- Professional risk desk for individual traders

---

## ✨ Features

### 🔒 15-Minute Journal Cooldown (Core Feature)

**The defining protocol.** When triggered:
1. Full-screen overlay appears with calm, professional interface
2. TradingView access removed during cooldown period
3. Structured 3-section journal engages prefrontal cortex
4. Timer runs independently (minimum 15 minutes, configurable)
5. Access automatically restored when complete

**Why 15 minutes?**
- Research-backed duration for cognitive reset
- Breaks emotional momentum
- Forces deliberate pause, not rushed checkbox
- Long enough to prevent impulse, short enough to stay engaged

### 📊 Intelligent Trigger System

**Four mode presets:**

**Scalper Mode** (Low friction)
- Optimized for high-frequency traders
- 5-minute cooldown option
- Higher burst tolerance
- Triggers: 3 consecutive losses OR 8 trades/10min burst

**Structured Mode** (Recommended default)
- Balanced approach for most traders
- 15-minute journal reset
- Triggers: 2 consecutive losses OR daily max loss

**Reset Mode** (High friction)
- Maximum discipline enforcement
- Triggers on every loss
- For traders rebuilding process discipline

**Custom Mode** (Advanced)
- Fine-tune all parameters
- Set your own thresholds
- Enable/disable specific triggers
- Configure cooldown duration (5-30 minutes)

**Trigger Types:**
1. **Consecutive losses** - Customizable threshold (1-10 trades)
2. **Daily max loss** - Dollar amount threshold with configurable behavior:
   - Journal cooldown (continue after reflection)
   - End-of-day lock (institutional approach)
3. **Trade burst** - X trades in Y minutes (prevents overtrading)

### 📝 Structured Journal Protocol

**Three required sections:**

**1. Execution Check**
- Within setup? (Yes/No)
- If outside: What rule was violated?

**2. State Check**
Select current emotion:
- Neutral, Frustration, Urgency, Anger, Fear, FOMO, Overconfidence, Fatigue

**3. Professional Alignment**
- Would a disciplined operator continue? (Yes/No)
- If yes: One-sentence why

**Design principle:** Friction is the point. The journal re-engages cognitive control, not emotional venting.

### 📅 P&L Calendar

Visual monthly calendar showing:
- Daily net P&L (color-coded green/red)
- Win rate and averages for the month
- Best/worst day tracking
- Click any day for trade-by-trade breakdown
- Indicator dots for journal entries and triggers

**Month Statistics:**
- Total month P&L
- Win rate percentage
- Average win/loss
- Best and worst single days

### 📖 Journal History

Comprehensive reflection log:
- All journal entries chronologically
- Filter by emotion, time period, setup adherence
- Stats: total entries, this week, most common emotion, within-setup rate
- Export to CSV for external analysis
- Search and review past patterns

### 🎨 Premium Stoic Aesthetic

**Visual design principles:**
- Deep gradient backgrounds (navy → darker)
- Subtle vignette and grain texture
- Crimson Pro serif for calm authority
- JetBrains Mono for data displays
- Breathing ring animation (6.5s cycle)
- No gamification, streaks, or loud alerts

**Identity-based quotes:**
- "Protect capital first."
- "Discipline is quiet."
- "Detach from outcome. Execute process."
- "One good trade is enough."
- Custom operator codes (roadmap)

### 🔐 Privacy First

**Zero external transmission:**
- All data stored locally (chrome.storage.local)
- No cloud sync, no analytics, no tracking
- No broker API access (avoids fintech complexity)
- DOM observation only—reads visible TradingView P&L
- GDPR compliant by design

**What we access:**
- ✅ Visible P&L numbers on TradingView page
- ✅ Local browser storage (your device only)

**What we DON'T access:**
- ❌ Broker login credentials
- ❌ Account balances or equity
- ❌ Open positions or orders
- ❌ Personal information
- ❌ External servers

---

## 🚀 Installation

### Requirements
- Google Chrome or Chromium-based browser (Edge, Brave, Opera)
- TradingView account (free or paid)
- Active trading panel in TradingView

### Load Extension

1. **Download** the extension folder
2. **Open Chrome** → `chrome://extensions/`
3. **Enable Developer Mode** (toggle top-right)
4. **Click "Load unpacked"**
5. **Select** the `anchor-extension` folder
6. **Extension icon appears** in Chrome toolbar

### First-Time Setup

1. **Click Anchor icon** in toolbar
2. **Click "Settings"**
3. **Select your mode:**
   - New traders: **Structured Mode** (balanced)
   - Scalpers: **Scalper Mode** (lower friction)
   - Strict discipline: **Reset Mode** (every loss)
4. **Click "Save Configuration"**
5. **You're ready!** Extension monitors TradingView automatically

---

## 📖 Usage

### Normal Trading

1. Open TradingView and navigate to trading panel
2. Trade as normal—Anchor is passive until triggered
3. When trigger conditions met, overlay appears automatically
4. Complete journal during cooldown
5. Access returns when timer expires

### When Cooldown Triggers

**What happens:**
1. Full-screen overlay covers TradingView
2. Calm interface with stoic quote and breathing animation
3. Timer begins (15 minutes default, mode-dependent)
4. Journal form appears with 3 required sections
5. Save reflection → completion confirmation
6. Timer continues regardless of journal completion
7. Access automatically restored at 0:00

**Important:** Journal completion does NOT end timer early. This enforces minimum reflection period.

### Locked State (Max Loss)

If daily max loss hit with "end-of-day lock" enabled:
- Session ends immediately
- Anchor logo and "Session Ended" message
- No further access until next trading day
- Automatic reset at midnight local time

---

## 📊 Data & Analytics

### Current Session (Popup)
- Current state (Active/Cooldown/Locked)
- Today's P&L (color-coded)
- Consecutive losses count
- Quick access to settings and journal

### P&L Calendar
- Monthly view of all trading days
- Visual color coding (green wins, red losses)
- Month statistics and averages
- Day detail modal with trade breakdown
- Navigation between months

### Journal History
- All reflection entries with timestamps
- Filter by emotion, period, setup status
- Summary statistics
- Export to CSV functionality
- Pattern recognition over time

### Data Storage

**Stored locally:**
- Session data (daily P&L, trades, consecutive count)
- Journal entries (all fields with timestamps)
- Configuration settings
- P&L history (organized by date)

**Storage location:** `chrome.storage.local` (~5MB limit)

**Data management:**
- View all stored data in Settings
- Clear data option (preserves configuration)
- Export journals to CSV
- No cloud backup (local-first philosophy)

---

## 🛠️ Configuration

### Mode Selection

**Quick setup via presets:**
- Click mode card in Settings
- Automatically applies tested configurations
- Save and start trading

**Custom configuration:**
- Select "Custom Mode"
- Adjust individual parameters:
  - Consecutive loss threshold
  - Max daily loss amount
  - Trade burst detection
  - Cooldown duration
  - Trigger enable/disable
  - Max loss behavior

### Advanced Settings

**Cooldown Duration:** 5-30 minutes
**Daily Max Loss Behavior:**
- Journal cooldown (continue after reflection)
- End-of-day lock (institutional, no further trading)

**Enabled Triggers:** Mix and match
- Consecutive losses
- Daily max loss
- Trade burst detection

---

## 🧪 Testing & Validation

### Debug Mode (Weekend Testing)

**From extension popup:**
- Click "Debug: Trigger Test"
- Overlay appears immediately
- Test all features without real trades

**From background service worker console:**
```javascript
chrome.tabs.query({url: "https://www.tradingview.com/*"}, (tabs) => {
  chrome.tabs.sendMessage(tabs[0].id, {
    type: 'TRIGGER_COOLDOWN',
    data: {
      reason: 'Test trigger',
      cooldownEnd: Date.now() + 60000, // 1 minute
      locked: false
    }
  });
});
```

### TradingView P&L Detection

**Detection method:** DOM observation
- Monitors TradingView trading panel
- Detects realized P&L changes
- Calculates trade delta
- Filters noise (>$0.50)

**Selectors used:**
- `[class*="netPL"]`
- `[class*="closedPL"]`
- `[class*="realizedPL"]`

**If detection fails:**
- See `TRADINGVIEW_DETECTION.md` for troubleshooting
- Update selectors for current TradingView version
- Use debug mode for testing

---

## 🎯 Roadmap Features

### Phase 2: Analytics Engine
- Trade clustering visualization
- Emotional volatility index
- Tilt probability scoring
- Rule adherence metrics
- Weekly/monthly behavior reports
- Performance correlation analysis

### Phase 3: Advanced Features
- Custom operator codes (personalized quotes)
- Multi-day session tracking
- Broker API integration (optional)
- Desktop notifications
- Multi-platform support

### Phase 4: Platform Expansion
- NinjaTrader adapter
- ThinkOrSwim integration
- Interactive Brokers TWS
- MetaTrader 5
- Standalone desktop app

---

## ❓ FAQ

**Q: Will this make me profitable?**
A: No. Anchor optimizes behavior, not market outcomes. It's for traders who already have an edge but struggle with discipline.

**Q: Can I skip the cooldown?**
A: No. That's the point. The timer is non-negotiable and enforces minimum reflection.

**Q: Does journal completion end the timer early?**
A: No. The timer runs independently. You can complete the journal quickly, but must wait the full cooldown period.

**Q: What if I have multiple TradingView tabs open?**
A: Overlay appears only in the tab where trigger occurred. Other tabs remain accessible (though this violates the spirit of the protocol).

**Q: Can I customize the quotes?**
A: Not in MVP. Custom operator codes are planned for Phase 3.

**Q: Does this work with paper trading?**
A: Yes. Works with both paper and real accounts. P&L detection works the same.

**Q: What happens if TradingView updates and breaks detection?**
A: See `TRADINGVIEW_DETECTION.md` for selector update guide. We'll maintain the extension as TradingView evolves.

**Q: Can I use this with other platforms?**
A: MVP is TradingView-only. Platform adapters planned for Phase 4.

**Q: Is my data synced across devices?**
A: No. Local-first design. Each browser/device has separate data.

**Q: Can I export my data?**
A: Yes. Journal history has CSV export. Session data viewable in Settings.

---

## 🔒 Security & Privacy

### Data Access
- **Local only** - No external transmission
- **No tracking** - No analytics or telemetry
- **No accounts** - No login, no cloud storage
- **Open source** - Auditable codebase

### Permissions Explained

**storage** - Save settings and journal entries locally
**tabs** - Detect TradingView pages and send messages
**activeTab** - Access current tab for overlay injection
**scripting** - Inject content script into TradingView
**host_permissions** - Limited to `https://www.tradingview.com/*`

### Content Security Policy
- No `eval()` or unsafe code execution
- No inline scripts in HTML
- External resources limited to Google Fonts
- Iframe sandboxing for overlay isolation

---

## 📄 License

[Your license here - MIT recommended for open source]

---

## 🤝 Support & Contribution

**Issues & Feature Requests:**
- GitHub Issues: [repository-url]
- Email: [contact-email]

**Contributing:**
- Platform adapters welcome
- Analytics implementations
- UI/UX improvements
- Bug fixes and optimizations

---

## ⚠️ Disclaimer

**Anchor is a behavioral tool, not financial advice.**

- Does not guarantee profitable trading
- Cannot prevent all revenge trading behaviors
- Requires user commitment to process improvement
- Use at your own risk
- Past performance does not indicate future results

Trading futures involves substantial risk of loss. This extension is provided "as is" without warranty.

---

## 🎯 Philosophy

> *"The market doesn't care about your emotions. But your account does."*

Anchor exists because **discipline is a practice, not a personality trait.**

The 15-minute cooldown isn't punishment—it's **professional standards.**

The journal isn't therapy—it's **process verification.**

The overlay isn't gamification—it's **identity reinforcement.**

**You are an operator. Execute with calm mastery.** ⚓

---

## 📚 Documentation

- **README.md** - This file (overview and usage)
- **QUICKSTART.md** - 5-minute installation guide
- **ARCHITECTURE.md** - Technical system design
- **TRADINGVIEW_DETECTION.md** - P&L detection deep dive
- **DEPLOYMENT.md** - Pre-launch checklist
- **TROUBLESHOOTING.md** - Common issues and fixes
- **WEEKEND_TESTING.md** - Testing without markets

---

**Version:** 1.0.0  
**Status:** Production Ready  
**Last Updated:** February 2026  

Built with calm mastery. ⚓
