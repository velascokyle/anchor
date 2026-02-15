// Content Script - TradingView Integration & Overlay Management

let lastPnL = null;
let overlayActive = false;
let overlayIframe = null;
let lastRealized = null;
let hasSeededRealized = false;

// Debounce timer for DOM mutation bursts
let _detectTimer = null;

// Initialize
initializeAnchor();

function initializeAnchor() {
  console.log("Anchor: Initializing on TradingView");

  // Check current state
  chrome.runtime.sendMessage({ type: "GET_STATE" }, (state) => {
    if (state && (state.current === "cooldown" || state.current === "locked")) {
      // Resume overlay if cooldown is active
      showOverlay(state.triggerReason, state.cooldownEnd, state.current === "locked");
    }
  });

  // Start monitoring trades
  startTradeMonitoring();

  // Listen for messages from background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "TRIGGER_COOLDOWN") {
      showOverlay(message.data.reason, message.data.cooldownEnd, message.data.locked);
    } else if (message.type === "COOLDOWN_COMPLETE") {
      removeOverlay();
    }
  });
}

function startTradeMonitoring() {
  // Monitor DOM for P&L changes via MutationObserver + polling backup

  const observer = new MutationObserver(() => {
    scheduleDetectTrade();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  // Poll every 2 seconds as backup
  setInterval(detectTrade, 2000);
}

function scheduleDetectTrade() {
  if (_detectTimer) return;
  _detectTimer = setTimeout(() => {
    _detectTimer = null;
    detectTrade();
  }, 250);
}

/* -----------------------------
   P&L parsing + label detection
------------------------------ */

function parseMoney(text) {
  if (!text) return null;

  // Normalize unicode minus and whitespace
  const t = String(text)
    .replace(/\u2212/g, "-") // Unicode minus → hyphen
    .replace(/\s+/g, " ")
    .trim();

  // Detect negativity from explicit symbols/parentheses in the text
  const isNeg = /\(|-\s*\$?/.test(t);

  // Extract number (with commas and optional decimals)
  const m = t.match(/([$])?\s*([0-9]{1,3}(?:,[0-9]{3})*|[0-9]+)(\.[0-9]+)?/);
  if (!m) return null;

  const num = parseFloat((m[2] + (m[3] || "")).replace(/,/g, ""));
  if (Number.isNaN(num)) return null;

  return isNeg ? -Math.abs(num) : Math.abs(num);
}

function isExactLabel(el, labelsSet) {
  const txt = (el.textContent || "").trim();
  return labelsSet.has(txt);
}

function closestRowContainer(el) {
  // Climb up to find a container that likely holds label + value.
  let cur = el;
  for (let i = 0; i < 8 && cur; i++) {
    const parent = cur.parentElement;
    if (!parent) break;

    const parentText = parent.textContent || "";
    const hasNumber = /[$]|\d/.test(parentText);

    if (parent.children && parent.children.length >= 2 && hasNumber) {
      return parent;
    }
    cur = parent;
  }
  return el.parentElement || el;
}

function findPnLByLabels(preferredLabels) {
  // preferredLabels = array, ordered by priority
  const labelsSet = new Set(preferredLabels);

  const nodes = document.querySelectorAll("span, div, td");

  for (const el of nodes) {
    if (!isExactLabel(el, labelsSet)) continue;

    const row = closestRowContainer(el);

    // Find last parseable money/number in the row excluding the label itself
    const valueNodes = row.querySelectorAll("span, div, td");
    let best = null;

    for (const vn of valueNodes) {
      const txt = (vn.textContent || "").trim();
      if (!txt) continue;
      if (labelsSet.has(txt)) continue;

      const parsed = parseMoney(txt);
      if (parsed !== null) best = parsed; // keep last good match (often the value is later)
    }

    if (best !== null) return best;
  }

  return null;
}

function getCurrentPnL() {
  const pnl = findPnLByLabels(["Realized P&L"]);
  if (pnl !== null) return { pnl, labelGroup: "realized" };
  return { pnl: null, labelGroup: null };
}

/* -----------------------------
   Trade detection
------------------------------ */

function detectTrade() {
  const { pnl: realized } = getCurrentPnL();
  if (realized === null) return;

  // ✅ Always update background with current realized total so popup matches TradingView
  chrome.runtime.sendMessage({
    type: "PNL_UPDATE",
    data: {
      realizedTotal: realized,
      timestamp: Date.now(),
      source: "paper_realized"
    }
  });

  // Seed once (prevents fake "trade" on initial load)
  if (!hasSeededRealized) {
    hasSeededRealized = true;
    lastRealized = realized;
    lastPnL = realized;
    console.log("[ANCHOR] Seeded Realized P&L:", realized);
    return;
  }

  // If realized changed, treat the change as the closed-trade PnL delta
  if (lastRealized !== null && realized !== lastRealized) {
    const delta = realized - lastRealized;

    // Ignore tiny noise
    if (Math.abs(delta) >= 0.5) {
      console.log(
        `Anchor: Realized changed Δ=${delta.toFixed(2)} (from ${lastRealized} to ${realized})`
      );

      chrome.runtime.sendMessage({
        type: "TRADE_DETECTED",
        data: {
          pnl: delta,
          realizedTotal: realized,
          timestamp: Date.now(),
          source: "realized"
        }
      });
    }

    lastRealized = realized;
  }

  lastPnL = realized;
}


/* -----------------------------
   Overlay logic (unchanged)
------------------------------ */

function showOverlay(reason, cooldownEnd, locked = false) {
  if (overlayActive) return;

  overlayActive = true;

  // Create full-screen overlay iframe
  overlayIframe = document.createElement("iframe");
  overlayIframe.id = "anchor-overlay";
  overlayIframe.src = chrome.runtime.getURL("overlay.html");
  overlayIframe.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    border: none !important;
    z-index: 2147483647 !important;
    background: transparent !important;
    opacity: 0 !important;
    transition: opacity 0.4s ease-out !important;
  `;

  document.body.appendChild(overlayIframe);

  // Trigger fade-in after a frame
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlayIframe.style.opacity = "1";
    });
  });

  // Disable page scrolling
  document.body.style.overflow = "hidden";

  // Send configuration to overlay once loaded
  overlayIframe.addEventListener("load", () => {
    overlayIframe.contentWindow.postMessage(
      {
        type: "INIT_OVERLAY",
        data: { reason, cooldownEnd, locked },
      },
      "*"
    );
  });

  // Listen for messages from overlay
  window.addEventListener("message", handleOverlayMessage);
}

function handleOverlayMessage(event) {
  if (event.data.type === "JOURNAL_COMPLETE") {
    chrome.runtime.sendMessage({
      type: "JOURNAL_COMPLETE",
      data: event.data.data,
    });
  } else if (event.data.type === "COOLDOWN_EXPIRED") {
    chrome.runtime.sendMessage({ type: "COOLDOWN_EXPIRED" });
  }
}

function removeOverlay() {
  if (!overlayActive) return;

  if (overlayIframe) {
    overlayIframe.style.opacity = "0";

    setTimeout(() => {
      if (overlayIframe) {
        overlayIframe.remove();
        overlayIframe = null;
      }

      document.body.style.overflow = "";
      overlayActive = false;

      window.removeEventListener("message", handleOverlayMessage);

      console.log("Anchor: Overlay removed - access restored");
    }, 400);
  }
}

/* -----------------------------
   Debug exports
------------------------------ */

/* -----------------------------
   Debug exports (content-script world)
------------------------------ */

window.anchorDebug = {
  getLastPnL: () => lastPnL,
  forceDetect: () => detectTrade(),
  getCurrentPnL: () => getCurrentPnL(),
  isOverlayActive: () => overlayActive,
  findLabels: () => {
    const labels = ["Realized P&L", "Closed P&L", "P/L Day", "Net P&L"];
    for (const l of labels) {
      const found = !!Array.from(document.querySelectorAll("span,div,td"))
        .find(el => (el.textContent || "").trim() === l);
      console.log("[ANCHOR] label", l, "found:", found);
    }
  },
  dumpRealizedRow: () => {
    const label = Array.from(document.querySelectorAll("span,div,td"))
      .find(el => (el.textContent || "").trim() === "Realized P&L");

    if (!label) {
      console.log("[ANCHOR] Realized P&L label not found");
      return;
    }

    const row = closestRowContainer(label);
    console.log("[ANCHOR] Row text:", (row.textContent || "").trim());

    const nodes = Array.from(row.querySelectorAll("span,div,td"))
      .map(n => (n.textContent || "").trim())
      .filter(Boolean);

    console.log("[ANCHOR] Row nodes:", nodes);
  }
};
