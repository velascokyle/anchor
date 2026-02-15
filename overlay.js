// Overlay Script - Timer, Journal, and State Management

const QUOTES = [
  "Protect capital first.",
  "Return only when deliberate.",
  "Discipline is quiet.",
  "Detach from outcome. Execute process.",
  "One good trade is enough.",
  "The market will be here tomorrow.",
  "Process over profit.",
  "Emotion is data, not directive.",
  "Pause is power.",
  "Preserve to perform."
];

let cooldownEnd = null;
let timerInterval = null;
let isLocked = false;

// Listen for initialization from parent
window.addEventListener('message', (event) => {
  if (event.data.type === 'INIT_OVERLAY') {
    initializeOverlay(event.data.data);
  }
});

function initializeOverlay(data) {
  cooldownEnd = data.cooldownEnd;
  isLocked = data.locked;
  
  // Set quote
  const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  document.getElementById('quote').textContent = randomQuote;
  
  // Set reason
  document.getElementById('reason').textContent = data.reason;
  
  // Handle locked state
  if (isLocked) {
    document.getElementById('journalCard').style.display = 'none';
    document.getElementById('lockedMessage').classList.add('visible');
    document.querySelector('.status-section').style.display = 'none';
    document.querySelector('.breathing-container').style.display = 'none';
    return;
  }
  
  // Start timer
  startTimer();
  
  // Setup journal form
  setupJournalForm();
}

function startTimer() {
  updateTimerDisplay();
  
  timerInterval = setInterval(() => {
    updateTimerDisplay();
    
    // Check if cooldown expired
    if (Date.now() >= cooldownEnd) {
      clearInterval(timerInterval);
      handleCooldownExpired();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const remaining = Math.max(0, cooldownEnd - Date.now());
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  document.getElementById('timer').textContent = display;
}

function handleCooldownExpired() {
  // Add fade-out class
  document.body.classList.add('fade-out');
  
  // Wait for fade-out animation to complete (400ms) before notifying
  setTimeout(() => {
    // Notify parent that cooldown expired
    window.parent.postMessage({ type: 'COOLDOWN_EXPIRED' }, '*');
  }, 400);
}

function setupJournalForm() {
  const form = document.getElementById('journalForm');
  const setupNoRadio = document.getElementById('setupNo');
  const setupYesRadio = document.getElementById('setupYes');
  const continueYesRadio = document.getElementById('continueYes');
  const continueNoRadio = document.getElementById('continueNo');
  const violationSection = document.getElementById('violationSection');
  const reasonSection = document.getElementById('reasonSection');
  
  // Show/hide violation text when "Outside setup" is selected
  setupNoRadio.addEventListener('change', () => {
    violationSection.style.display = 'block';
    document.getElementById('ruleViolation').required = true;
  });
  
  setupYesRadio.addEventListener('change', () => {
    violationSection.style.display = 'none';
    document.getElementById('ruleViolation').required = false;
    document.getElementById('ruleViolation').value = '';
  });
  
  // Show/hide reason text when "would continue" is selected
  continueYesRadio.addEventListener('change', () => {
    reasonSection.style.display = 'block';
    document.getElementById('continueReason').required = true;
  });
  
  continueNoRadio.addEventListener('change', () => {
    reasonSection.style.display = 'none';
    document.getElementById('continueReason').required = false;
    document.getElementById('continueReason').value = '';
  });
  
  // Handle form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = {
      withinSetup: document.querySelector('input[name="withinSetup"]:checked').value,
      ruleViolation: document.getElementById('ruleViolation').value,
      emotion: document.querySelector('input[name="emotion"]:checked').value,
      shouldContinue: document.querySelector('input[name="shouldContinue"]:checked').value,
      continueReason: document.getElementById('continueReason').value,
      timestamp: Date.now()
    };
    
    // Save journal entry
    window.parent.postMessage({
      type: 'JOURNAL_COMPLETE',
      data: formData
    }, '*');
    
    // Show completion message
    document.getElementById('journalCard').querySelector('form').style.display = 'none';
    document.getElementById('journalCard').querySelector('.journal-header').style.display = 'none';
    document.getElementById('completionMessage').classList.add('visible');
  });
}
