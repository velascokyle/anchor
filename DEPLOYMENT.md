# Anchor - Deployment Checklist

Pre-launch verification before releasing to users.

---

## ✅ Code Quality

- [ ] All JavaScript files pass linting
- [ ] No console.log statements in production code (except debug mode)
- [ ] Error handling in all async functions
- [ ] Input validation on all user inputs
- [ ] CSS variables used consistently
- [ ] No hardcoded values that should be configurable

---

## ✅ Functionality Testing

### Core Features
- [ ] Extension loads without errors
- [ ] Background service worker initializes correctly
- [ ] Content script injects on TradingView
- [ ] Overlay appears when triggered
- [ ] Timer counts down accurately
- [ ] Journal form validates correctly
- [ ] Journal saves to local storage
- [ ] Overlay removes after timer expires
- [ ] State persists across page refreshes

### Mode Presets
- [ ] Scalper mode applies correct settings
- [ ] Structured mode applies correct settings
- [ ] Reset mode applies correct settings
- [ ] Custom mode saves manual configuration

### Triggers
- [ ] Consecutive losses trigger works
- [ ] Daily max loss trigger works
- [ ] Trade burst trigger works
- [ ] Max loss "end session" behavior works
- [ ] Triggers respect enabled/disabled state

### UI/UX
- [ ] Popup displays current status
- [ ] Popup shows daily P&L correctly
- [ ] Settings page loads without errors
- [ ] Mode cards are selectable
- [ ] Custom settings show/hide correctly
- [ ] Success messages appear on save
- [ ] Overlay aesthetic matches design spec

---

## ✅ Browser Compatibility

- [ ] Chrome (latest)
- [ ] Chrome (1 version back)
- [ ] Edge (Chromium)
- [ ] Brave
- [ ] Opera

---

## ✅ TradingView Integration

- [ ] Detects P&L on paper trading account
- [ ] Detects P&L on real broker (if available)
- [ ] Works with different TradingView layouts
- [ ] Handles rapid trade sequences
- [ ] Handles page navigation
- [ ] Handles TradingView updates/refreshes
- [ ] DOM selectors are current

---

## ✅ Performance

- [ ] No memory leaks (run for extended period)
- [ ] MutationObserver doesn't slow page
- [ ] Overlay loads instantly when triggered
- [ ] No stuttering or lag in overlay animations
- [ ] Storage operations are fast
- [ ] Background script CPU usage is minimal

---

## ✅ Data & Privacy

- [ ] All data stored locally only
- [ ] No external API calls
- [ ] No analytics or tracking
- [ ] Chrome storage quota not exceeded
- [ ] Clear data function works
- [ ] Export data function works (if implemented)
- [ ] No sensitive data in logs

---

## ✅ Security

- [ ] No eval() or unsafe code execution
- [ ] Content Security Policy compliant
- [ ] No XSS vulnerabilities
- [ ] Input sanitization on all user inputs
- [ ] Manifest V3 best practices followed
- [ ] Permissions are minimal and justified

---

## ✅ Documentation

- [ ] README.md is complete and accurate
- [ ] QUICKSTART.md has clear instructions
- [ ] TRADINGVIEW_DETECTION.md is up to date
- [ ] Code comments explain complex logic
- [ ] All configuration options documented
- [ ] Troubleshooting section covers common issues

---

## ✅ User Experience

- [ ] First-time setup is intuitive
- [ ] Error messages are helpful
- [ ] Success feedback is clear
- [ ] No confusing terminology
- [ ] Overlay aesthetic is calming (not jarring)
- [ ] Journal prompts are concise
- [ ] Settings are not overwhelming

---

## ✅ Edge Cases

- [ ] Works when TradingView is in fullscreen
- [ ] Handles browser tab switching
- [ ] Handles computer sleep/wake
- [ ] Handles clock changes (DST)
- [ ] Handles rapid trigger re-activation
- [ ] Handles cooldown expiry during page refresh
- [ ] Handles storage quota exceeded
- [ ] Handles corrupted storage data

---

## ✅ Accessibility

- [ ] Keyboard navigation works in overlay
- [ ] Form labels are properly associated
- [ ] Color contrast meets WCAG standards
- [ ] Focus indicators are visible
- [ ] No flashing/seizure-inducing animations

---

## ✅ Legal & Compliance

- [ ] Disclaimer is prominent
- [ ] Privacy policy is clear
- [ ] Terms of use (if applicable)
- [ ] License file included
- [ ] No misleading claims about trading performance
- [ ] No guarantee of results

---

## ✅ Pre-Release

- [ ] Version number updated in manifest.json
- [ ] Icons are production-quality (not placeholders)
- [ ] No "TODO" comments in code
- [ ] No debug code enabled
- [ ] Extension description is accurate
- [ ] Screenshots prepared (if publishing)
- [ ] Demo video created (if publishing)

---

## ✅ Post-Release Monitoring

- [ ] User feedback channel established
- [ ] Error reporting mechanism
- [ ] Version tracking for bug reports
- [ ] Plan for TradingView selector updates
- [ ] Support email/contact configured

---

## Publishing to Chrome Web Store (Optional)

If publishing publicly:

### Required Assets
- [ ] High-res icon (128x128, 256x256, 512x512)
- [ ] Promotional images (440x280, 920x680, 1400x560)
- [ ] Screenshots (1280x800 or 640x400)
- [ ] Detailed description
- [ ] Short description (132 chars max)

### Web Store Requirements
- [ ] Single purpose clearly stated
- [ ] Privacy policy URL (if collecting data)
- [ ] Permissions justified
- [ ] No obfuscated code
- [ ] Content Security Policy set
- [ ] Manifest V3 compliant

### Review Checklist
- [ ] Test package (.zip) created
- [ ] Tested on fresh Chrome install
- [ ] All store assets uploaded
- [ ] Categories selected
- [ ] Pricing/payment set (free)
- [ ] Distribution regions selected

---

## Notes

**Critical for MVP:**
- Focus on core functionality over polish
- Ensure P&L detection works reliably
- Make sure overlay is truly calming (not annoying)
- Validate all triggers work as configured
- Test with real trading scenarios (paper trading OK)

**Nice to Have (Post-MVP):**
- Analytics dashboard
- Export to CSV
- Custom operator codes
- Multi-platform support
- Broker API integration

**Known Limitations (Document):**
- TradingView-only in MVP
- Requires visible P&L in trading panel
- DOM selectors may need updates
- No cloud sync

---

## Sign-Off

Before declaring "ready for users":

- [ ] Product owner approval
- [ ] Lead developer sign-off
- [ ] QA testing complete
- [ ] Documentation reviewed
- [ ] Support plan in place
- [ ] Rollback plan prepared

---

**Remember:** This is behavioral architecture for committed traders. It won't work for users who don't want to change. Make sure messaging is clear about this.

The extension is a tool, not a solution. The user's commitment is the solution.
