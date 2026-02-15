# Anchor - Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-02-14 - Initial Release

### ✨ Core Features
- **15-minute journal cooldown protocol** - Research-backed behavioral intervention
- **Full-screen calm overlay** - Premium stoic aesthetic with smooth fade animations
- **Structured 3-section journal** - Execution check, state check, professional alignment
- **Intelligent trigger system** - Consecutive losses, daily max loss, trade burst detection
- **Four mode presets** - Scalper, Structured (default), Reset, and Custom configurations
- **TradingView P&L detection** - Automatic trade monitoring via DOM observation
- **P&L calendar view** - Monthly visual tracking with daily breakdowns
- **Journal history** - Comprehensive reflection log with filters and CSV export
- **Privacy-first design** - All data stored locally, zero external transmission

### 🎨 User Interface
- Deep gradient backgrounds with vignette and grain texture
- Crimson Pro serif for quotes, JetBrains Mono for data
- Breathing ring animation (6.5s cycle)
- Smooth fade-in/fade-out transitions
- Responsive design (desktop, tablet, mobile)
- Anchor logo SVG icons (16px, 48px, 128px)

### 📊 Analytics & Tracking
- Daily P&L tracking with automatic history
- Session data (consecutive losses, trades, daily P&L)
- Journal entries with timestamps and emotions
- Win rate, average win/loss calculations
- Best/worst day tracking
- Trade-by-trade breakdown modal

### 🔧 Configuration
- Mode selection with visual cards
- Custom parameter adjustment
- Trigger enable/disable toggles
- Cooldown duration (5-30 minutes)
- Max loss behavior (journal vs. end-of-day lock)
- Data management (view, clear, export)

### 🛠️ Developer Features
- Chrome Extension Manifest V3
- Background service worker with state machine
- Content script for TradingView integration
- Modular platform adapter architecture (ready for expansion)
- Debug mode for weekend testing
- Comprehensive error handling

### 📝 Documentation
- README-COMMERCIAL.md - Complete feature overview
- QUICKSTART.md - 5-minute setup guide
- ARCHITECTURE.md - Technical documentation
- TRADINGVIEW_DETECTION.md - P&L detection guide
- DEPLOYMENT.md - Pre-launch checklist
- TROUBLESHOOTING.md - Common issues
- WEEKEND_TESTING.md - Testing without markets

### 🔐 Security & Privacy
- Local-first data storage (chrome.storage.local)
- No external API calls or data transmission
- No broker credentials required
- DOM-only observation (visible P&L)
- Content Security Policy compliant
- Minimal permissions (storage, tabs, scripting)

---

## Roadmap

### [1.1.0] - Planned
- Custom operator codes (personalized quotes)
- Enhanced analytics dashboard
- Trade clustering visualization
- Emotional volatility index
- Export P&L calendar to PDF

### [1.2.0] - Planned
- Tilt probability scoring
- Rule adherence metrics
- Weekly/monthly behavior reports
- Performance correlation analysis
- Desktop notifications

### [2.0.0] - Planned
- Multi-platform support (NinjaTrader, ThinkOrSwim)
- Platform adapter system
- Broker API integration (optional)
- Cloud sync (opt-in, encrypted)
- Mobile companion app

---

## Version History

**1.0.0** - Initial commercial release
- Production-ready MVP
- Full feature set for TradingView futures traders
- Comprehensive documentation
- Weekend testing capabilities

---

## Breaking Changes

None (initial release)

---

## Migration Guide

Not applicable (initial release)

---

## Known Issues

### Minor
- TradingView DOM selectors may need updates if TradingView changes structure
- SVG icons may not display in older Chrome versions (<89)
- Calendar may show empty state if no P&L history exists yet

### Workarounds
- See TRADINGVIEW_DETECTION.md for selector update instructions
- Use PNG fallback icons for older browsers
- Simulate test data for calendar demonstration (see README)

---

## Deprecations

None (initial release)

---

## Contributors

- Initial development and design
- Behavioral research and protocol design
- User testing and feedback

---

## License

[License type] - See LICENSE file for details

---

## Support

For issues, questions, or feature requests:
- GitHub Issues: [repository-url]
- Email: [support-email]
- Documentation: See README-COMMERCIAL.md

---

**Build with calm mastery.** ⚓
