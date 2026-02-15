// P&L Calendar Script

let currentDate = new Date();
let dailyData = {}; // { 'YYYY-MM-DD': { pnl, trades: [], journals: [], triggers: [] } }
let journals = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  renderCalendar();
  setupControls();
  setupModal();
});

async function loadData() {
  // Load journals and session data
  const storage = await chrome.storage.local.get(['journals', 'pnlHistory']);
  journals = storage.journals || [];
  
  // If we have stored P&L history, use it
  // Otherwise, build from journals (which have timestamps)
  if (storage.pnlHistory) {
    dailyData = storage.pnlHistory;
  } else {
    // Initialize from available data
    dailyData = {};
  }
  
  // Process journals to get daily data
  journals.forEach(journal => {
    const date = new Date(journal.timestamp);
    const dateKey = formatDateKey(date);
    
    if (!dailyData[dateKey]) {
      dailyData[dateKey] = {
        pnl: 0,
        trades: [],
        journals: [],
        triggers: []
      };
    }
    
    dailyData[dateKey].journals.push(journal);
  });
  
  // Note: In production, trades would be tracked separately
  // For now, we'll simulate some data for demo purposes
  await loadSessionData();
}

async function loadSessionData() {
  const { sessionData } = await chrome.storage.local.get('sessionData');
  
  if (sessionData && sessionData.trades) {
    const today = formatDateKey(new Date());
    
    if (!dailyData[today]) {
      dailyData[today] = {
        pnl: sessionData.dailyPnL || 0,
        trades: sessionData.trades || [],
        journals: [],
        triggers: []
      };
    } else {
      dailyData[today].pnl = sessionData.dailyPnL || 0;
      dailyData[today].trades = sessionData.trades || [];
    }
  }
}

function renderCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // Update month display
  document.getElementById('currentMonth').textContent = 
    new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  // Get first and last day of month
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // Get starting day of week (0 = Sunday)
  const startingDayOfWeek = firstDay.getDay();
  
  // Get days in month
  const daysInMonth = lastDay.getDate();
  
  // Get days in previous month
  const prevMonth = new Date(year, month, 0);
  const daysInPrevMonth = prevMonth.getDate();
  
  // Build calendar grid
  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = '';
  
  // Day headers
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dayNames.forEach(day => {
    const header = document.createElement('div');
    header.className = 'day-header';
    header.textContent = day;
    grid.appendChild(header);
  });
  
  // Previous month days
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const cell = createDayCell(year, month - 1, day, true);
    grid.appendChild(cell);
  }
  
  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const cell = createDayCell(year, month, day, false);
    grid.appendChild(cell);
  }
  
  // Next month days to fill grid
  const totalCells = grid.children.length - 7; // Subtract headers
  const remainingCells = Math.ceil(totalCells / 7) * 7 - totalCells;
  
  for (let day = 1; day <= remainingCells; day++) {
    const cell = createDayCell(year, month + 1, day, true);
    grid.appendChild(cell);
  }
  
  // Update stats
  updateMonthStats();
}

function createDayCell(year, month, day, isOtherMonth) {
  const cell = document.createElement('div');
  cell.className = 'day-cell';
  
  if (isOtherMonth) {
    cell.classList.add('other-month');
  }
  
  const date = new Date(year, month, day);
  const dateKey = formatDateKey(date);
  const dayData = dailyData[dateKey] || { pnl: 0, trades: [], journals: [], triggers: [] };
  
  // Check if today
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    cell.classList.add('today');
  }
  
  // Day number
  const dayNumber = document.createElement('div');
  dayNumber.className = 'day-number';
  dayNumber.textContent = day;
  cell.appendChild(dayNumber);
  
  // P&L
  if (dayData.pnl !== 0) {
    const pnl = document.createElement('div');
    pnl.className = 'day-pnl ' + (dayData.pnl > 0 ? 'positive' : 'negative');
    pnl.textContent = formatCurrency(dayData.pnl);
    cell.appendChild(pnl);
  }
  
  // Trade count
  if (dayData.trades.length > 0) {
    const trades = document.createElement('div');
    trades.className = 'day-trades';
    trades.textContent = `${dayData.trades.length} trade${dayData.trades.length !== 1 ? 's' : ''}`;
    cell.appendChild(trades);
  }
  
  // Indicators
  const indicators = document.createElement('div');
  indicators.className = 'day-indicators';
  
  if (dayData.journals.length > 0) {
    const dot = document.createElement('div');
    dot.className = 'indicator journal';
    dot.title = `${dayData.journals.length} journal ${dayData.journals.length !== 1 ? 'entries' : 'entry'}`;
    indicators.appendChild(dot);
  }
  
  if (dayData.triggers && dayData.triggers.length > 0) {
    const dot = document.createElement('div');
    dot.className = 'indicator trigger';
    dot.title = 'Protocol triggered';
    indicators.appendChild(dot);
  }
  
  cell.appendChild(indicators);
  
  // Click to show details
  cell.addEventListener('click', () => showDayDetail(date, dayData));
  
  return cell;
}

function updateMonthStats() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // Get all days in current month
  const monthDays = Object.keys(dailyData).filter(dateKey => {
    const date = new Date(dateKey);
    return date.getFullYear() === year && date.getMonth() === month;
  });
  
  let monthPnL = 0;
  let wins = 0;
  let losses = 0;
  let totalWin = 0;
  let totalLoss = 0;
  let bestDay = 0;
  let worstDay = 0;
  
  monthDays.forEach(dateKey => {
    const data = dailyData[dateKey];
    monthPnL += data.pnl;
    
    if (data.pnl > 0) {
      wins++;
      totalWin += data.pnl;
      bestDay = Math.max(bestDay, data.pnl);
    } else if (data.pnl < 0) {
      losses++;
      totalLoss += data.pnl;
      worstDay = Math.min(worstDay, data.pnl);
    }
  });
  
  const totalDays = wins + losses;
  const winRate = totalDays > 0 ? (wins / totalDays * 100) : 0;
  const avgWin = wins > 0 ? (totalWin / wins) : 0;
  const avgLoss = losses > 0 ? (totalLoss / losses) : 0;
  
  // Update UI
  const monthPnLEl = document.getElementById('monthPnL');
  monthPnLEl.textContent = formatCurrency(monthPnL);
  monthPnLEl.className = 'stat-value ' + (monthPnL > 0 ? 'positive' : monthPnL < 0 ? 'negative' : '');
  
  document.getElementById('winRate').textContent = winRate.toFixed(0) + '%';
  
  const avgWinEl = document.getElementById('avgWin');
  avgWinEl.textContent = formatCurrency(avgWin);
  avgWinEl.className = 'stat-value positive';
  
  const avgLossEl = document.getElementById('avgLoss');
  avgLossEl.textContent = formatCurrency(avgLoss);
  avgLossEl.className = 'stat-value negative';
  
  const bestDayEl = document.getElementById('bestDay');
  bestDayEl.textContent = formatCurrency(bestDay);
  bestDayEl.className = 'stat-value positive';
  
  const worstDayEl = document.getElementById('worstDay');
  worstDayEl.textContent = formatCurrency(worstDay);
  worstDayEl.className = 'stat-value negative';
}

function setupControls() {
  document.getElementById('prevMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });
  
  document.getElementById('nextMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });
  
  document.getElementById('todayBtn').addEventListener('click', () => {
    currentDate = new Date();
    renderCalendar();
  });
}

function setupModal() {
  const modal = document.getElementById('dayModal');
  const closeBtn = document.getElementById('modalClose');
  
  closeBtn.addEventListener('click', () => {
    modal.classList.remove('show');
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('show');
    }
  });
}

function showDayDetail(date, dayData) {
  const modal = document.getElementById('dayModal');
  
  // Set date
  document.getElementById('modalDate').textContent = 
    date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  
  // Set stats
  const pnlEl = document.getElementById('modalPnL');
  pnlEl.textContent = formatCurrency(dayData.pnl);
  pnlEl.className = 'modal-stat-value ' + (dayData.pnl > 0 ? 'positive' : dayData.pnl < 0 ? 'negative' : '');
  
  document.getElementById('modalTrades').textContent = dayData.trades.length;
  
  // Set trades
  const tradeList = document.getElementById('tradeList');
  
  if (dayData.trades.length === 0) {
    tradeList.innerHTML = '<div style="text-align: center; color: rgba(255,255,255,0.4); padding: 2rem;">No trades on this day</div>';
  } else {
    tradeList.innerHTML = dayData.trades.map(trade => {
      const time = new Date(trade.timestamp).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true
      });
      
      return `
        <div class="trade-item">
          <span class="trade-time">${time}</span>
          <span class="trade-pnl ${trade.pnl > 0 ? 'positive' : 'negative'}">
            ${formatCurrency(trade.pnl)}
          </span>
        </div>
      `;
    }).join('');
  }
  
  modal.classList.add('show');
}

// Utility functions
function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatCurrency(amount) {
  const sign = amount >= 0 ? '+' : '';
  return sign + '$' + Math.abs(amount).toFixed(2);
}
