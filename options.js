// Options Page Script - Settings Management

let currentMode = 'structured';

document.addEventListener('DOMContentLoaded', async () => {
  await loadCurrentConfig();
  setupEventListeners();
});

function setupEventListeners() {
  // Mode card selection
  document.querySelectorAll('.mode-card').forEach(card => {
    card.addEventListener('click', () => {
      const mode = card.dataset.mode;
      selectMode(mode);
    });
  });

  // Save button
  document.getElementById('saveBtn').addEventListener('click', saveConfiguration);

  // Reset button
  document.getElementById('resetBtn').addEventListener('click', resetToDefaults);

  // Data management buttons
  document.getElementById('viewDataBtn').addEventListener('click', viewStoredData);
  document.getElementById('clearDataBtn').addEventListener('click', clearAllData);
}

async function loadCurrentConfig() {
  const { config } = await chrome.storage.local.get('config');
  
  if (config) {
    currentMode = config.mode || 'structured';
    selectMode(currentMode);
    
    // Populate custom settings if in custom mode
    if (currentMode === 'custom') {
      document.getElementById('consecutiveLosses').value = config.customTriggers.consecutiveLosses;
      document.getElementById('maxDailyLoss').value = config.customTriggers.maxDailyLoss;
      document.getElementById('burstCount').value = config.customTriggers.tradeBurst.count;
      document.getElementById('burstMinutes').value = config.customTriggers.tradeBurst.minutes;
      document.getElementById('cooldownMinutes').value = config.cooldownMinutes;
      
      // Set checkboxes
      document.getElementById('triggerConsecutive').checked = config.enabledTriggers.includes('consecutiveLosses');
      document.getElementById('triggerMaxLoss').checked = config.enabledTriggers.includes('maxDailyLoss');
      document.getElementById('triggerBurst').checked = config.enabledTriggers.includes('tradeBurst');
      
      // Set radio button
      if (config.customTriggers.maxLossBehavior === 'lockDay') {
        document.getElementById('maxLossLock').checked = true;
      } else {
        document.getElementById('maxLossJournal').checked = true;
      }
    }
  }
}

function selectMode(mode) {
  currentMode = mode;
  
  // Update UI
  document.querySelectorAll('.mode-card').forEach(card => {
    card.classList.remove('selected');
  });
  document.querySelector(`[data-mode="${mode}"]`).classList.add('selected');
  
  // Show/hide custom settings
  const customSettings = document.getElementById('customSettings');
  if (mode === 'custom') {
    customSettings.classList.add('visible');
  } else {
    customSettings.classList.remove('visible');
  }
}

async function saveConfiguration() {
  let config;
  
  if (currentMode === 'custom') {
    // Build custom config from form
    const enabledTriggers = [];
    if (document.getElementById('triggerConsecutive').checked) {
      enabledTriggers.push('consecutiveLosses');
    }
    if (document.getElementById('triggerMaxLoss').checked) {
      enabledTriggers.push('maxDailyLoss');
    }
    if (document.getElementById('triggerBurst').checked) {
      enabledTriggers.push('tradeBurst');
    }
    
    const maxLossBehavior = document.querySelector('input[name="maxLossBehavior"]:checked').value;
    
    config = {
      mode: 'custom',
      customTriggers: {
        consecutiveLosses: parseInt(document.getElementById('consecutiveLosses').value),
        maxDailyLoss: parseInt(document.getElementById('maxDailyLoss').value),
        tradeBurst: {
          count: parseInt(document.getElementById('burstCount').value),
          minutes: parseInt(document.getElementById('burstMinutes').value)
        },
        maxLossBehavior: maxLossBehavior
      },
      cooldownMinutes: parseInt(document.getElementById('cooldownMinutes').value),
      enabledTriggers: enabledTriggers
    };
  } else {
    // Apply preset mode
    const response = await chrome.runtime.sendMessage({
      type: 'APPLY_MODE_PRESET',
      mode: currentMode
    });
    
    if (response.success) {
      config = response.config;
    }
  }
  
  // Save to storage
  await chrome.storage.local.set({ config });
  
  // Show success message
  showSuccessMessage();
}

async function resetToDefaults() {
  if (confirm('Reset all settings to default Structured mode?')) {
    const response = await chrome.runtime.sendMessage({
      type: 'APPLY_MODE_PRESET',
      mode: 'structured'
    });
    
    if (response.success) {
      currentMode = 'structured';
      selectMode('structured');
      showSuccessMessage();
    }
  }
}

function showSuccessMessage() {
  const message = document.getElementById('successMessage');
  message.classList.add('show');
  
  setTimeout(() => {
    message.classList.remove('show');
  }, 3000);
}

async function viewStoredData() {
  const data = await chrome.storage.local.get(['sessionData', 'journals', 'config']);
  
  const formattedData = {
    sessionData: data.sessionData || {},
    journalEntries: (data.journals || []).length,
    currentConfig: data.config || {}
  };
  
  alert('Stored Data:\n\n' + JSON.stringify(formattedData, null, 2));
}

async function clearAllData() {
  if (confirm('Clear all session data and journal entries? This cannot be undone.\n\nYour configuration will be preserved.')) {
    await chrome.storage.local.remove(['sessionData', 'journals']);
    
    // Reset session data
    await chrome.storage.local.set({
      sessionData: {
        dailyPnL: 0,
        consecutiveLosses: 0,
        trades: [],
        lastResetDate: new Date().toDateString()
      }
    });
    
    alert('Data cleared successfully.');
  }
}
