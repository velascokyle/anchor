// Popup Script - Status Display

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadStatus();
  } catch (e) {
    console.error('[Anchor Popup] loadStatus error:', e);
  }

  const bind = (id, fn) => {
    const el = document.getElementById(id);
    if (!el) {
      console.warn(`[Anchor Popup] Missing element #${id}`);
      return;
    }
    el.addEventListener('click', fn);
  };

  bind('settingsBtn', () => chrome.runtime.openOptionsPage());
  bind('reviewBtn', () => chrome.tabs.create({ url: 'review.html' }));
  bind('calendarBtn', () => chrome.tabs.create({ url: 'calendar.html' }));
  bind('journalBtn', () => chrome.tabs.create({ url: 'journal.html' }));

  // Debug button: simulate two losses to trigger "structured" consecutiveLosses=2
  bind('debugBtn', async () => {
    console.log('[Anchor Debug] Running full trigger test (structured mode)');

    await chrome.runtime.sendMessage({ type: 'DEBUG_SET_MODE', mode: 'structured' });
    await chrome.runtime.sendMessage({ type: 'DEBUG_RESET_DAY' });

    await chrome.runtime.sendMessage({ type: 'DEBUG_SIM_TRADE', data: { pnl: -50 } });

    setTimeout(async () => {
      await chrome.runtime.sendMessage({ type: 'DEBUG_SIM_TRADE', data: { pnl: -50 } });
      setTimeout(() => window.close(), 150);
    }, 500);
  });
});

async function loadStatus() {
  const { state, sessionData } = await chrome.storage.local.get(['state', 'sessionData']);

  const statusCard = document.getElementById('statusCard');
  const statusValue = document.getElementById('statusValue');

  // Reset classes each open
  statusCard.classList.remove('active', 'cooldown');

  if (!state || state.current === 'active') {
    statusCard.classList.add('active');
    statusValue.textContent = 'Active';
  } else if (state.current === 'cooldown') {
    statusCard.classList.add('cooldown');
    const remaining = Math.max(0, state.cooldownEnd - Date.now());
    const minutes = Math.floor(remaining / 60000);
    statusValue.textContent = `Protocol Active (${minutes}m)`;
  } else if (state.current === 'locked') {
    statusValue.textContent = 'Session Locked';
  } else {
    statusValue.textContent = 'Active';
    statusCard.classList.add('active');
  }

  if (sessionData) {
    const pnlElement = document.getElementById('dailyPnL');
    const pnl = Number(sessionData.dailyPnL) || 0;

    pnlElement.textContent = `$${pnl.toFixed(2)}`;
    pnlElement.style.color =
      pnl >= 0 ? 'rgba(120, 200, 140, 1)' : 'rgba(255, 120, 120, 1)';

    document.getElementById('consecutive').textContent =
      sessionData.consecutiveLosses || 0;
  }
}
