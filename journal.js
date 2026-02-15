// Journal History Page Script

let allEntries = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadJournals();
  setupFilters();
  setupExport();
});

async function loadJournals() {
  const { journals = [] } = await chrome.storage.local.get('journals');
  allEntries = journals.sort((a, b) => b.timestamp - a.timestamp); // Newest first
  
  updateStats();
  renderEntries(allEntries);
}

function updateStats() {
  // Total entries
  document.getElementById('totalEntries').textContent = allEntries.length;
  
  // This week
  const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const thisWeek = allEntries.filter(e => e.timestamp > weekAgo).length;
  document.getElementById('thisWeek').textContent = thisWeek;
  
  // Most common emotion
  if (allEntries.length > 0) {
    const emotions = allEntries.map(e => e.emotion);
    const counts = {};
    emotions.forEach(e => counts[e] = (counts[e] || 0) + 1);
    const mostCommon = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    document.getElementById('mostCommon').textContent = capitalize(mostCommon);
  }
  
  // Setup rate
  if (allEntries.length > 0) {
    const withinSetup = allEntries.filter(e => e.withinSetup === 'yes').length;
    const rate = Math.round((withinSetup / allEntries.length) * 100);
    document.getElementById('setupRate').textContent = rate + '%';
  }
}

function renderEntries(entries) {
  const container = document.getElementById('entriesContainer');
  
  if (entries.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📝</div>
        <div class="empty-title">No journal entries yet</div>
        <div class="empty-text">
          Your reflections will appear here after triggers activate.<br>
          Each entry helps you build process awareness.
        </div>
      </div>
    `;
    return;
  }
  
  container.innerHTML = entries.map(entry => {
    const date = new Date(entry.timestamp);
    const dateStr = formatDate(date);
    const timeStr = formatTime(date);
    
    return `
      <div class="entry">
        <div class="entry-header">
          <div class="entry-date">${dateStr} at ${timeStr}</div>
          <div class="entry-badges">
            <span class="badge badge-emotion">${capitalize(entry.emotion)}</span>
            ${entry.withinSetup === 'yes' 
              ? '<span class="badge badge-setup">Within Setup</span>' 
              : '<span class="badge badge-violation">Outside Setup</span>'
            }
          </div>
        </div>
        
        <div class="entry-content">
          ${entry.withinSetup === 'no' && entry.ruleViolation ? `
            <div class="entry-section">
              <div class="entry-section-title">Rule Violation</div>
              <div class="entry-section-content">${escapeHtml(entry.ruleViolation)}</div>
            </div>
          ` : ''}
          
          <div class="entry-section">
            <div class="entry-section-title">Professional Alignment</div>
            <div class="entry-section-content">
              ${entry.shouldContinue === 'yes' ? 'Would continue trading' : 'Would pause'}
              ${entry.continueReason ? `<br><em>${escapeHtml(entry.continueReason)}</em>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function setupFilters() {
  const emotionFilter = document.getElementById('emotionFilter');
  const periodFilter = document.getElementById('periodFilter');
  const setupFilter = document.getElementById('setupFilter');
  
  const applyFilters = () => {
    let filtered = [...allEntries];
    
    // Emotion filter
    if (emotionFilter.value !== 'all') {
      filtered = filtered.filter(e => e.emotion === emotionFilter.value);
    }
    
    // Period filter
    const now = Date.now();
    if (periodFilter.value === 'today') {
      const todayStart = new Date().setHours(0, 0, 0, 0);
      filtered = filtered.filter(e => e.timestamp >= todayStart);
    } else if (periodFilter.value === 'week') {
      const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(e => e.timestamp >= weekAgo);
    } else if (periodFilter.value === 'month') {
      const monthAgo = now - (30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(e => e.timestamp >= monthAgo);
    }
    
    // Setup filter
    if (setupFilter.value !== 'all') {
      filtered = filtered.filter(e => e.withinSetup === setupFilter.value);
    }
    
    renderEntries(filtered);
  };
  
  emotionFilter.addEventListener('change', applyFilters);
  periodFilter.addEventListener('change', applyFilters);
  setupFilter.addEventListener('change', applyFilters);
}

function setupExport() {
  document.getElementById('exportBtn').addEventListener('click', () => {
    if (allEntries.length === 0) {
      alert('No journal entries to export');
      return;
    }
    
    // Create CSV
    const headers = ['Date', 'Time', 'Within Setup', 'Rule Violation', 'Emotion', 'Should Continue', 'Reason'];
    const rows = allEntries.map(entry => {
      const date = new Date(entry.timestamp);
      return [
        formatDate(date),
        formatTime(date),
        entry.withinSetup,
        entry.ruleViolation || '',
        entry.emotion,
        entry.shouldContinue,
        entry.continueReason || ''
      ];
    });
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anchor-journal-${formatDate(new Date()).replace(/\//g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

// Utility functions
function formatDate(date) {
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

function formatTime(date) {
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
