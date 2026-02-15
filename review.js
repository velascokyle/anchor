// Weekly Review Script - Professional Coaching Assessment

let currentWeekOffset = 0; // 0 = this week, -1 = last week, etc.
let weekData = null;

document.addEventListener('DOMContentLoaded', async () => {
  await loadWeekData();
  renderReview();
  setupNavigation();
});

async function loadWeekData() {
  const { pnlHistory = {}, journals = [] } = await chrome.storage.local.get(['pnlHistory', 'journals']);
  
  // Calculate week range
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + (currentWeekOffset * 7)); // Sunday
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6); // Saturday
  weekEnd.setHours(23, 59, 59, 999);
  
  // Collect week data
  weekData = {
    startDate: weekStart,
    endDate: weekEnd,
    days: [],
    totalPnL: 0,
    wins: 0,
    losses: 0,
    totalTrades: 0,
    journals: [],
    triggers: 0,
    emotions: {},
    setupViolations: 0
  };
  
  // Process each day in the week
  for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
    const dateKey = formatDateKey(new Date(d));
    const dayData = pnlHistory[dateKey];
    
    if (dayData) {
      weekData.days.push({
        date: new Date(d),
        ...dayData
      });
      
      weekData.totalPnL += dayData.pnl || 0;
      weekData.totalTrades += (dayData.trades || []).length;
      
      if (dayData.pnl > 0) weekData.wins++;
      if (dayData.pnl < 0) weekData.losses++;
    }
  }
  
  // Process journals for the week
  weekData.journals = journals.filter(j => {
    const jDate = new Date(j.timestamp);
    return jDate >= weekStart && jDate <= weekEnd;
  });
  
  // Analyze journals
  weekData.journals.forEach(j => {
    weekData.emotions[j.emotion] = (weekData.emotions[j.emotion] || 0) + 1;
    if (j.withinSetup === 'no') weekData.setupViolations++;
  });
  
  weekData.triggers = weekData.journals.length; // Each journal = a trigger
}

function renderReview() {
  const container = document.getElementById('reviewContent');
  
  // Update week display
  const weekText = currentWeekOffset === 0 ? 'This Week' : 
                   currentWeekOffset === -1 ? 'Last Week' :
                   `${Math.abs(currentWeekOffset)} Weeks Ago`;
  document.getElementById('currentWeek').textContent = weekText;
  
  // Check if there's data
  if (weekData.days.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📊</div>
        <div class="empty-title">No Trading Activity</div>
        <div class="empty-text">
          No data for this week. Trade actively and return for your weekly assessment.
        </div>
      </div>
    `;
    return;
  }
  
  // Generate review
  const assessment = generateAssessment();
  
  container.innerHTML = `
    <div class="review-card">
      <div class="review-header">
        <div class="review-title">Week ${getCurrentWeekNumber()} Assessment</div>
        <div class="review-date-range">
          ${formatDate(weekData.startDate)} – ${formatDate(weekData.endDate)}
        </div>
      </div>
      
      ${renderMetrics()}
      ${renderPerformanceAssessment(assessment)}
      ${renderKeyInsights(assessment)}
      ${renderRecommendations(assessment)}
      ${renderClosingStatement(assessment)}
    </div>
  `;
}

function renderMetrics() {
  const winRate = weekData.wins + weekData.losses > 0 
    ? (weekData.wins / (weekData.wins + weekData.losses) * 100).toFixed(0) 
    : 0;
  
  const avgTrade = weekData.totalTrades > 0 
    ? (weekData.totalPnL / weekData.totalTrades) 
    : 0;
  
  return `
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-value ${weekData.totalPnL > 0 ? 'positive' : weekData.totalPnL < 0 ? 'negative' : 'neutral'}">
          ${formatCurrency(weekData.totalPnL)}
        </div>
        <div class="metric-label">Net P&L</div>
      </div>
      
      <div class="metric-card">
        <div class="metric-value neutral">${winRate}%</div>
        <div class="metric-label">Win Rate</div>
      </div>
      
      <div class="metric-card">
        <div class="metric-value neutral">${weekData.totalTrades}</div>
        <div class="metric-label">Total Trades</div>
      </div>
      
      <div class="metric-card">
        <div class="metric-value neutral">${weekData.triggers}</div>
        <div class="metric-label">Protocols Triggered</div>
      </div>
    </div>
  `;
}

function generateAssessment() {
  const assessment = {
    performance: '',
    discipline: '',
    emotional: '',
    recommendations: [],
    tone: 'neutral', // positive, neutral, corrective
    insights: []
  };
  
  // Performance assessment
  if (weekData.totalPnL > 0) {
    assessment.performance = 'profitable';
    assessment.tone = 'positive';
  } else if (weekData.totalPnL < 0) {
    assessment.performance = 'unprofitable';
    const avgLoss = Math.abs(weekData.totalPnL / weekData.days.length);
    assessment.tone = avgLoss > 200 ? 'corrective' : 'neutral';
  } else {
    assessment.performance = 'breakeven';
  }
  
  // Discipline assessment
  const setupAdherence = weekData.journals.length > 0 
    ? ((weekData.journals.length - weekData.setupViolations) / weekData.journals.length * 100)
    : 100;
  
  if (setupAdherence >= 80) {
    assessment.discipline = 'strong';
  } else if (setupAdherence >= 60) {
    assessment.discipline = 'adequate';
  } else {
    assessment.discipline = 'needs attention';
    assessment.tone = 'corrective';
  }
  
  // Emotional assessment
  const dominantEmotion = Object.keys(weekData.emotions).reduce((a, b) => 
    weekData.emotions[a] > weekData.emotions[b] ? a : b, 'neutral'
  );
  
  assessment.emotional = dominantEmotion;
  
  // Generate insights
  if (weekData.triggers > 5) {
    assessment.insights.push({
      icon: '⚠️',
      title: 'High Protocol Frequency',
      description: `${weekData.triggers} cooldown protocols triggered this week. Pattern suggests overtrading tendencies or insufficient risk parameters.`
    });
  }
  
  if (weekData.setupViolations > weekData.journals.length * 0.4) {
    assessment.insights.push({
      icon: '📋',
      title: 'Setup Discipline Concern',
      description: `${weekData.setupViolations} trades outside defined setups. Rules exist for capital preservation—enforce them.`
    });
  }
  
  if (dominantEmotion !== 'neutral' && weekData.emotions[dominantEmotion] > weekData.journals.length * 0.5) {
    assessment.insights.push({
      icon: '🧠',
      title: 'Emotional Pattern Detected',
      description: `${capitalize(dominantEmotion)} was the dominant state. Recurring emotional patterns indicate process breakdown points.`
    });
  }
  
  const winRate = weekData.wins / (weekData.wins + weekData.losses) * 100;
  if (winRate < 40 && weekData.wins + weekData.losses >= 5) {
    assessment.insights.push({
      icon: '🎯',
      title: 'Win Rate Below Threshold',
      description: `${winRate.toFixed(0)}% win rate requires immediate strategy review. Edge may be compromised or execution is off.`
    });
  }
  
  // Generate recommendations
  assessment.recommendations = generateRecommendations(assessment);
  
  return assessment;
}

function generateRecommendations(assessment) {
  const recs = [];
  
  // Performance-based
  if (assessment.performance === 'unprofitable') {
    recs.push('Reduce position size by 50% until process is re-stabilized. Capital preservation over profit-seeking.');
  }
  
  // Discipline-based
  if (assessment.discipline === 'needs attention') {
    recs.push('Implement pre-trade checklist. No execution without explicit setup confirmation. Process before discretion.');
  }
  
  // Trigger-based
  if (weekData.triggers > 5) {
    recs.push('Tighten entry criteria or switch to longer timeframe. High trigger frequency indicates misalignment between strategy and execution.');
  }
  
  if (weekData.triggers === 0 && weekData.totalTrades < 5) {
    recs.push('Insufficient sample size for meaningful assessment. Increase trade frequency within risk parameters.');
  }
  
  // Emotional-based
  if (assessment.emotional === 'frustration' || assessment.emotional === 'anger') {
    recs.push('Session breaks mandatory after losses. Emotional trading is capital destruction. Protect the account, protect your psychology.');
  }
  
  if (assessment.emotional === 'fomo' || assessment.emotional === 'urgency') {
    recs.push('Wait for A+ setups only. Market creates opportunity daily. Missing trades is not the risk—forcing trades is.');
  }
  
  // Default/positive
  if (recs.length === 0) {
    recs.push('Maintain current process discipline. Consistency compounds over time. Protect what works.');
  }
  
  // Add max 3 recommendations
  return recs.slice(0, 3);
}

function renderPerformanceAssessment(assessment) {
  let text = '';
  
  if (assessment.performance === 'profitable' && assessment.discipline === 'strong') {
    text = `You executed with discipline this week and the market compensated accordingly. Net positive ${formatCurrency(weekData.totalPnL)} demonstrates that process adherence generates results. This is how professional trading operates—not excitement, not hope, but disciplined execution of defined parameters.`;
  } else if (assessment.performance === 'profitable' && assessment.discipline !== 'strong') {
    text = `Week ended net positive ${formatCurrency(weekData.totalPnL)}, but setup violations indicate you were compensated by market conditions, not process quality. Profit without discipline is temporary. Reinforce your standards before variance corrects.`;
  } else if (assessment.performance === 'unprofitable' && assessment.discipline === 'strong') {
    text = `Net loss of ${formatCurrency(Math.abs(weekData.totalPnL))} despite maintaining setup discipline. This is variance, not failure. Professional operators accept that correct process sometimes produces negative results. Edge plays out over hundreds of trades, not days. Maintain standards.`;
  } else if (assessment.performance === 'unprofitable' && assessment.discipline !== 'strong') {
    text = `Week closed at ${formatCurrency(weekData.totalPnL)} with multiple setup violations. This is not market difficulty—this is process breakdown. Undisciplined trading guarantees capital erosion. No edge can overcome poor execution. Reset immediately.`;
  } else {
    text = `Week ended approximately breakeven. Neither profit nor loss provides useful feedback without examining process quality. Review your journals for patterns, reinforce what worked, eliminate what didn't.`;
  }
  
  return `
    <div class="assessment-section">
      <div class="section-title">
        <span class="section-icon">📊</span>
        Performance Assessment
      </div>
      <div class="assessment-text">${text}</div>
    </div>
  `;
}

function renderKeyInsights(assessment) {
  if (assessment.insights.length === 0) return '';
  
  return `
    <div class="assessment-section">
      <div class="section-title">
        <span class="section-icon">💡</span>
        Key Observations
      </div>
      <div class="insights-list">
        ${assessment.insights.map(insight => `
          <div class="insight-item">
            <div class="insight-icon">${insight.icon}</div>
            <div class="insight-content">
              <div class="insight-title">${insight.title}</div>
              <div class="insight-description">${insight.description}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderRecommendations(assessment) {
  return `
    <div class="assessment-section">
      <div class="section-title">
        <span class="section-icon">🎯</span>
        Directives for Next Week
      </div>
      <div class="recommendations">
        ${assessment.recommendations.map((rec, i) => `
          <div class="recommendation-item">
            <div class="recommendation-number">${i + 1}</div>
            <div class="recommendation-text">${rec}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderClosingStatement(assessment) {
  const statements = {
    positive: [
      'Trading is a profession, not a performance. Continue operating within defined parameters. Compound discipline, not capital.',
      'Consistency beats intensity. Maintain your process and let probabilities compound in your favor.',
      'Professional traders are not emotional about wins. They respect the process that generated them. Continue.'
    ],
    neutral: [
      'Markets reward patience and discipline over time. Protect your process more than your profit.',
      'Every week is data. Extract the signal, discard the noise, refine the approach.',
      'Professional development is measured in quarters, not days. Stay committed to the work.'
    ],
    corrective: [
      'Process breakdown is addressable. Capital destruction is not. Recommit to your standards before next session.',
      'Discipline is not negotiable. If you cannot follow your rules, reduce size until you can.',
      'The market is indifferent to your account. Your discipline is the only factor under your control. Exercise it.'
    ]
  };
  
  const options = statements[assessment.tone] || statements.neutral;
  const statement = options[Math.floor(Math.random() * options.length)];
  
  return `
    <div class="closing-statement">
      "${statement}"
    </div>
  `;
}

function setupNavigation() {
  document.getElementById('prevWeek').addEventListener('click', () => {
    currentWeekOffset--;
    loadWeekData().then(renderReview);
  });
  
  document.getElementById('nextWeek').addEventListener('click', () => {
    if (currentWeekOffset < 0) {
      currentWeekOffset++;
      loadWeekData().then(renderReview);
    }
  });
}

// Utility functions
function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCurrency(amount) {
  const sign = amount >= 0 ? '+' : '';
  return sign + '$' + Math.abs(amount).toFixed(2);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getCurrentWeekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.ceil(diff / oneWeek);
}
