// Background Service Worker - State Machine & Message Handler

const STATE = {
  ACTIVE: 'active',
  COOLDOWN: 'cooldown',
  LOCKED: 'locked'
};

const DEFAULT_CONFIG = {
  mode: 'structured',
  customTriggers: {
    consecutiveLosses: 2,
    maxDailyLoss: 500,
    tradeBurst: { count: 5, minutes: 10 },
    maxLossBehavior: 'journal' // 'journal' or 'lockDay'
  },
  cooldownMinutes: 15,
  enabledTriggers: ['consecutiveLosses', 'maxDailyLoss']
};

const MODE_PRESETS = {
  scalper: {
    consecutiveLosses: 3,
    maxDailyLoss: 300,
    tradeBurst: { count: 8, minutes: 10 },
    maxLossBehavior: 'journal',
    cooldownMinutes: 5,
    enabledTriggers: ['maxDailyLoss', 'tradeBurst']
  },
  structured: {
    consecutiveLosses: 2,
    maxDailyLoss: 500,
    tradeBurst: { count: 5, minutes: 10 },
    maxLossBehavior: 'journal',
    cooldownMinutes: 15,
    enabledTriggers: ['consecutiveLosses', 'maxDailyLoss']
  },
  reset: {
    consecutiveLosses: 1,
    maxDailyLoss: 300,
    tradeBurst: { count: 3, minutes: 5 },
    maxLossBehavior: 'journal',
    cooldownMinutes: 15,
    enabledTriggers: ['consecutiveLosses', 'maxDailyLoss', 'tradeBurst']
  }
};

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
  await initializeStorage();
  console.log('Anchor initialized');
});

async function initializeStorage() {
  const data = await chrome.storage.local.get(['config', 'sessionData', 'state']);
  
  if (!data.config) {
    await chrome.storage.local.set({ config: DEFAULT_CONFIG });
  }
  
  if (!data.sessionData) {
    await chrome.storage.local.set({ 
      sessionData: {
        dailyPnL: 0,
        consecutiveLosses: 0,
        trades: [],
        lastResetDate: new Date().toDateString()
      }
    });
  }
  
  if (!data.state) {
    await chrome.storage.local.set({ 
      state: {
        current: STATE.ACTIVE,
        cooldownEnd: null,
        triggerReason: null
      }
    });
  }
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TRADE_DETECTED') {
    handleTradeDetected(message.data, sender.tab.id);
  } else if (message.type === 'PNL_UPDATE') {
    handlePnLUpdate(message.data).then(sendResponse);
    return true;
  } else if (message.type === 'DEBUG_TRIGGER_OVERLAY') {
    debugTriggerOverlay().then(sendResponse);
    return true;  
  } else if (message.type === 'DEBUG_SET_MODE') {
    applyModePreset(message.mode).then(sendResponse);
    return true;
  } else if (message.type === 'DEBUG_RESET_DAY') {
    resetDay().then(sendResponse);
    return true;
  } else if (message.type === 'DEBUG_SIM_TRADE') {
    debugSimTrade(message.data).then(sendResponse);
    return true;  
  } else if (message.type === 'GET_STATE') {
    getState().then(sendResponse);
    return true;
  } else if (message.type === 'JOURNAL_COMPLETE') {
    handleJournalComplete(message.data);
  } else if (message.type === 'COOLDOWN_EXPIRED') {
    handleCooldownExpired(sender.tab.id);
  } else if (message.type === 'UPDATE_CONFIG') {
    updateConfig(message.data).then(sendResponse);
    return true;
  } else if (message.type === 'GET_CONFIG') {
    getConfig().then(sendResponse);
    return true;
  } else if (message.type === 'APPLY_MODE_PRESET') {
    applyModePreset(message.mode).then(sendResponse);
    return true;
  }
});

async function handleTradeDetected(tradeData, tabId) {
  const { config, sessionData, state } = await chrome.storage.local.get(['config', 'sessionData', 'state']);
  
  // Check if we need to reset daily data
  const today = new Date().toDateString();
  if (sessionData.lastResetDate !== today) {
    // Save previous day's P&L to history before reset
    if (sessionData.dailyPnL !== 0 || sessionData.trades.length > 0) {
      await saveDailyPnLHistory(sessionData);
    }
    
    sessionData.dailyPnL = 0;
    sessionData.consecutiveLosses = 0;
    sessionData.trades = [];
    sessionData.lastResetDate = today;
  }
  
  // Update session data
 // sessionData.dailyPnL is controlled by PNL_UPDATE (realized total).
// Keep it in sync if content provided realizedTotal; otherwise fall back to += delta.
if (typeof tradeData.realizedTotal === 'number' && Number.isFinite(tradeData.realizedTotal)) {
  sessionData.dailyPnL = tradeData.realizedTotal;
} else {
  sessionData.dailyPnL += tradeData.pnl;
}

  sessionData.trades.push({
    timestamp: Date.now(),
    pnl: tradeData.pnl
  });
  
  if (tradeData.pnl < 0) {
    sessionData.consecutiveLosses++;
  } else {
    sessionData.consecutiveLosses = 0;
  }
  
  await chrome.storage.local.set({ sessionData });
  
  // Also update today's P&L history in real-time
  await updateTodayPnLHistory(sessionData);
  
  // Check triggers only if currently active
  if (state.current !== STATE.ACTIVE) {
    return;
  }
  
  const triggerReason = checkTriggers(config, sessionData);
  
  if (triggerReason) {
    await triggerCooldown(triggerReason, tabId, config);
  }
}
async function handlePnLUpdate(data) {
  const realizedTotal = Number(data?.realizedTotal);
  if (!Number.isFinite(realizedTotal)) return { success: false };

  const { sessionData } = await chrome.storage.local.get(['sessionData']);

  // Daily reset check (same logic as trades)
  const today = new Date().toDateString();
  if (sessionData.lastResetDate !== today) {
    if (sessionData.dailyPnL !== 0 || sessionData.trades.length > 0) {
      await saveDailyPnLHistory(sessionData);
    }
    sessionData.dailyPnL = 0;
    sessionData.consecutiveLosses = 0;
    sessionData.trades = [];
    sessionData.lastResetDate = today;
  }
  async function debugTriggerOverlay() {
    // Find an active TradingView tab in the current window
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  
    const tvTab = tabs.find(t => (t.url || '').includes('tradingview.com'));
    if (!tvTab?.id) {
      console.warn('[ANCHOR][DEBUG] No active TradingView tab found.');
      return { success: false, error: 'No active TradingView tab' };
    }
  
    const { config } = await chrome.storage.local.get(['config']);
  
    // Trigger a short cooldown for testing
    await triggerCooldown('DEBUG: manual trigger test', tvTab.id, config || DEFAULT_CONFIG);
  
    return { success: true, tabId: tvTab.id };
  }
  
  // ✅ Make popup match TradingView: dailyPnL = realized total
  sessionData.dailyPnL = realizedTotal;

  await chrome.storage.local.set({ sessionData });
  await updateTodayPnLHistory(sessionData);

  return { success: true };
}

async function saveDailyPnLHistory(sessionData) {
  const { pnlHistory = {} } = await chrome.storage.local.get('pnlHistory');
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateKey = formatDateKey(yesterday);
  
  pnlHistory[dateKey] = {
    pnl: sessionData.dailyPnL,
    trades: sessionData.trades,
    journals: [],
    triggers: []
  };
  
  await chrome.storage.local.set({ pnlHistory });
}

async function updateTodayPnLHistory(sessionData) {
  const { pnlHistory = {} } = await chrome.storage.local.get('pnlHistory');
  
  const today = new Date();
  const dateKey = formatDateKey(today);
  
  pnlHistory[dateKey] = {
    pnl: sessionData.dailyPnL,
    trades: sessionData.trades,
    journals: pnlHistory[dateKey]?.journals || [],
    triggers: pnlHistory[dateKey]?.triggers || []
  };
  
  await chrome.storage.local.set({ pnlHistory });
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function checkTriggers(config, sessionData) {
  const triggers = config.customTriggers;
  const enabled = config.enabledTriggers;
  
  // Consecutive losses
  if (enabled.includes('consecutiveLosses') && 
      sessionData.consecutiveLosses >= triggers.consecutiveLosses) {
    return `${sessionData.consecutiveLosses} consecutive losses`;
  }
  
  // Max daily loss
  if (enabled.includes('maxDailyLoss') && 
      sessionData.dailyPnL <= -triggers.maxDailyLoss) {
    if (triggers.maxLossBehavior === 'lockDay') {
      return 'Daily loss limit reached - session ended';
    }
    return `Daily loss limit: $${Math.abs(sessionData.dailyPnL).toFixed(2)}`;
  }
  
  // Trade burst
  if (enabled.includes('tradeBurst')) {
    const cutoffTime = Date.now() - (triggers.tradeBurst.minutes * 60 * 1000);
    const recentTrades = sessionData.trades.filter(t => t.timestamp > cutoffTime);
    
    if (recentTrades.length >= triggers.tradeBurst.count) {
      return `${recentTrades.length} trades in ${triggers.tradeBurst.minutes} minutes`;
    }
  }
  
  return null;
}

async function triggerCooldown(reason, tabId, config) {
  const cooldownEnd = Date.now() + (config.cooldownMinutes * 60 * 1000);
  
  await chrome.storage.local.set({
    state: {
      current: reason.includes('session ended') ? STATE.LOCKED : STATE.COOLDOWN,
      cooldownEnd: cooldownEnd,
      triggerReason: reason
    }
  });
  
  // Notify content script to show overlay
  chrome.tabs.sendMessage(tabId, {
    type: 'TRIGGER_COOLDOWN',
    data: {
      reason,
      cooldownEnd,
      locked: reason.includes('session ended')
    }
  });
}

async function handleJournalComplete(journalData) {
  // Save journal entry
  const { journals = [] } = await chrome.storage.local.get('journals');
  journals.push({
    ...journalData,
    timestamp: Date.now()
  });
  await chrome.storage.local.set({ journals });
  
  console.log('Journal entry saved');
}

async function handleCooldownExpired(tabId) {
  await chrome.storage.local.set({
    state: {
      current: STATE.ACTIVE,
      cooldownEnd: null,
      triggerReason: null
    }
  });
  
  // Notify content script to remove overlay
  chrome.tabs.sendMessage(tabId, { type: 'COOLDOWN_COMPLETE' });
}

async function getState() {
  const { state } = await chrome.storage.local.get('state');
  return state;
}

async function getConfig() {
  const { config } = await chrome.storage.local.get('config');
  return config;
}

async function updateConfig(newConfig) {
  await chrome.storage.local.set({ config: newConfig });
  return { success: true };
}

async function applyModePreset(mode) {
  const preset = MODE_PRESETS[mode];
  if (!preset) {
    return { success: false, error: 'Invalid mode' };
  }
  
  const config = {
    mode,
    customTriggers: {
      consecutiveLosses: preset.consecutiveLosses,
      maxDailyLoss: preset.maxDailyLoss,
      tradeBurst: preset.tradeBurst,
      maxLossBehavior: preset.maxLossBehavior
    },
    cooldownMinutes: preset.cooldownMinutes,
    enabledTriggers: preset.enabledTriggers
  };
  
  await chrome.storage.local.set({ config });
  return { success: true, config };
}

async function getActiveTradingViewTabId() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const t = tabs.find(tab => (tab.url || '').includes('tradingview.com'));
  return t?.id ?? null;
}

async function resetDay() {
  const { sessionData } = await chrome.storage.local.get(['sessionData']);
  const today = new Date().toDateString();

  sessionData.dailyPnL = 0;
  sessionData.consecutiveLosses = 0;
  sessionData.trades = [];
  sessionData.lastResetDate = today;

  await chrome.storage.local.set({ sessionData });
  await updateTodayPnLHistory(sessionData);

  console.log('[ANCHOR][BG] Day reset');
  return { success: true };
}

async function debugSimTrade(tradeData) {
  const tabId = await getActiveTradingViewTabId();
  if (!tabId) {
    console.warn('[ANCHOR][BG] No active TradingView tab found for debug trade');
    return { success: false, error: 'No active TradingView tab' };
  }

  await handleTradeDetected(
    { pnl: tradeData.pnl, timestamp: Date.now() },
    tabId
  );

  console.log('[ANCHOR][BG] Debug trade injected', tradeData);
  return { success: true, tabId };
}
