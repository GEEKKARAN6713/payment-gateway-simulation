import { useState, useEffect, useRef } from "react";

// ─── Simulated Backend ────────────────────────────────────────────────────────
const transactionStore = {};

function generateTxnId() {
  return "TXN" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
}

function validatePayload({ amount, cardNumber, cvv, expiry, name }) {
  if (!name || name.trim().length < 2) return { ok: false, error: "Invalid cardholder name." };
  if (!/^\d{16}$/.test(cardNumber.replace(/\s/g, ""))) return { ok: false, error: "Card number must be 16 digits." };
  if (!/^\d{3,4}$/.test(cvv)) return { ok: false, error: "CVV must be 3–4 digits." };
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) return { ok: false, error: "Expiry format must be MM/YY." };
  const [m, y] = expiry.split("/").map(Number);
  const now = new Date();
  const expDate = new Date(2000 + y, m - 1, 1);
  if (expDate < now) return { ok: false, error: "Card has expired." };
  if (!amount || isNaN(amount) || Number(amount) <= 0) return { ok: false, error: "Amount must be a positive number." };
  return { ok: true };
}

// POST /pay
function apiPay({ amount, cardNumber, cvv, expiry, name, merchant }) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const validation = validatePayload({ amount, cardNumber, cvv, expiry, name });
      if (!validation.ok) {
        resolve({ success: false, error: validation.error, status: "FAILED" });
        return;
      }
      const txnId = generateTxnId();
      const rand = Math.random();
      let status = rand < 0.7 ? "SUCCESS" : rand < 0.88 ? "PENDING" : "FAILED";
      const txn = {
        txnId,
        amount: Number(amount),
        merchant: merchant || "Unknown Merchant",
        cardLast4: cardNumber.replace(/\s/g, "").slice(-4),
        name,
        status,
        timestamp: new Date().toISOString(),
        message: status === "SUCCESS" ? "Payment processed successfully." : status === "PENDING" ? "Payment under review. Please wait." : "Transaction declined by bank.",
      };
      transactionStore[txnId] = txn;
      resolve({ success: status === "SUCCESS", txnId, status, message: txn.message, timestamp: txn.timestamp });
    }, 1800);
  });
}

// GET /status/:id
function apiStatus(txnId) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const txn = transactionStore[txnId];
      if (!txn) resolve({ found: false, error: "Transaction ID not found." });
      else resolve({ found: true, ...txn });
    }, 600);
  });
}

// GET /history
function apiHistory() {
  return new Promise((resolve) => {
    setTimeout(() => {
      const list = Object.values(transactionStore).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      resolve(list);
    }, 400);
  });
}

// ─── UI Components ─────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  SUCCESS: { bg: "#0d2b1a", border: "#1aff7a", text: "#1aff7a", badge: "#0a4020" },
  PENDING: { bg: "#2b2000", border: "#ffb800", text: "#ffb800", badge: "#3d2e00" },
  FAILED:  { bg: "#2b0a0a", border: "#ff4444", text: "#ff4444", badge: "#3d1010" },
};

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.FAILED;
  return (
    <span style={{
      background: c.badge, color: c.text, border: `1px solid ${c.border}`,
      borderRadius: 4, padding: "3px 10px", fontSize: 11, fontFamily: "'Space Mono', monospace",
      fontWeight: 700, letterSpacing: 2, textTransform: "uppercase"
    }}>{status}</span>
  );
}

function Spinner() {
  return (
    <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid #333", borderTop: "2px solid #00e5ff", borderRadius: "50%", animation: "spin 0.7s linear infinite", verticalAlign: "middle", marginRight: 8 }} />
  );
}

function CardInput({ label, value, onChange, placeholder, maxLength, type = "text", mono }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 10, letterSpacing: 2, color: "#556", fontFamily: "'Space Mono', monospace", marginBottom: 6, textTransform: "uppercase" }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        style={{
          width: "100%", background: "#0a0f1a", border: "1px solid #1a2540",
          borderRadius: 6, padding: "10px 14px", color: "#e0e8ff",
          fontFamily: mono ? "'Space Mono', monospace" : "'DM Sans', sans-serif",
          fontSize: 14, outline: "none", boxSizing: "border-box",
          transition: "border-color 0.2s",
        }}
        onFocus={e => e.target.style.borderColor = "#00e5ff"}
        onBlur={e => e.target.style.borderColor = "#1a2540"}
      />
    </div>
  );
}

function formatCard(v) {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

// ─── Tab: Pay ─────────────────────────────────────────────────────────────────
function PayTab({ onSuccess }) {
  const [form, setForm] = useState({ name: "", cardNumber: "", cvv: "", expiry: "", amount: "", merchant: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  async function handlePay() {
    setLoading(true); setResult(null);
    const res = await apiPay({ ...form, cardNumber: form.cardNumber.replace(/\s/g, "") });
    setLoading(false); setResult(res);
    if (res.success || res.status === "PENDING") onSuccess();
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <div style={{ gridColumn: "1/-1" }}>
          <CardInput label="Cardholder Name" value={form.name} onChange={set("name")} placeholder="John Doe" />
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <CardInput label="Card Number" value={form.cardNumber} onChange={v => set("cardNumber")(formatCard(v))} placeholder="1234 5678 9012 3456" maxLength={19} mono />
        </div>
        <CardInput label="Expiry (MM/YY)" value={form.expiry} onChange={v => {
          let clean = v.replace(/\D/g, "").slice(0, 4);
          if (clean.length > 2) clean = clean.slice(0,2) + "/" + clean.slice(2);
          set("expiry")(clean);
        }} placeholder="09/27" maxLength={5} mono />
        <CardInput label="CVV" value={form.cvv} onChange={v => set("cvv")(v.replace(/\D/g,"").slice(0,4))} placeholder="•••" maxLength={4} type="password" mono />
        <CardInput label="Amount (₹)" value={form.amount} onChange={v => set("amount")(v.replace(/[^0-9.]/g,""))} placeholder="0.00" mono />
        <CardInput label="Merchant" value={form.merchant} onChange={set("merchant")} placeholder="e.g. Amazon India" />
      </div>

      <button
        onClick={handlePay}
        disabled={loading}
        style={{
          width: "100%", padding: "13px 0", marginTop: 4,
          background: loading ? "#0d1a2e" : "linear-gradient(135deg, #00e5ff 0%, #0066ff 100%)",
          color: loading ? "#334" : "#000", fontFamily: "'Space Mono', monospace",
          fontWeight: 700, fontSize: 13, letterSpacing: 2, border: "none",
          borderRadius: 8, cursor: loading ? "not-allowed" : "pointer",
          textTransform: "uppercase", transition: "all 0.2s",
        }}
      >
        {loading ? <><Spinner />Processing…</> : "▶  Initiate Payment  /pay"}
      </button>

      {result && (
        <div style={{
          marginTop: 18, padding: "14px 18px",
          background: STATUS_COLORS[result.status]?.bg || "#111",
          border: `1px solid ${STATUS_COLORS[result.status]?.border || "#333"}`,
          borderRadius: 8,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#889" }}>RESPONSE</span>
            <StatusBadge status={result.status} />
          </div>
          {result.txnId && <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#556", marginBottom: 4 }}>TXN_ID: <span style={{ color: "#00e5ff" }}>{result.txnId}</span></div>}
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: STATUS_COLORS[result.status]?.text || "#f44" }}>{result.message || result.error}</div>
          {result.timestamp && <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#445", marginTop: 6 }}>{new Date(result.timestamp).toLocaleString("en-IN")}</div>}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Status ──────────────────────────────────────────────────────────────
function StatusTab() {
  const [txnId, setTxnId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function handleCheck() {
    if (!txnId.trim()) return;
    setLoading(true); setResult(null);
    const res = await apiStatus(txnId.trim().toUpperCase());
    setLoading(false); setResult(res);
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 10, letterSpacing: 2, color: "#556", fontFamily: "'Space Mono', monospace", marginBottom: 6, textTransform: "uppercase" }}>Transaction ID</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={txnId}
            onChange={e => setTxnId(e.target.value.toUpperCase())}
            placeholder="e.g. TXN1A2B3C4D..."
            style={{
              flex: 1, background: "#0a0f1a", border: "1px solid #1a2540",
              borderRadius: 6, padding: "10px 14px", color: "#e0e8ff",
              fontFamily: "'Space Mono', monospace", fontSize: 13, outline: "none",
            }}
            onFocus={e => e.target.style.borderColor = "#00e5ff"}
            onBlur={e => e.target.style.borderColor = "#1a2540"}
            onKeyDown={e => e.key === "Enter" && handleCheck()}
          />
          <button
            onClick={handleCheck} disabled={loading}
            style={{
              padding: "10px 20px", background: "#0d2040", color: "#00e5ff",
              border: "1px solid #00e5ff", borderRadius: 6, cursor: "pointer",
              fontFamily: "'Space Mono', monospace", fontSize: 12, letterSpacing: 1, whiteSpace: "nowrap",
            }}
          >
            {loading ? <Spinner /> : "GET /status"}
          </button>
        </div>
      </div>

      {result && (
        <div style={{
          padding: "16px 18px",
          background: result.found ? STATUS_COLORS[result.status]?.bg : "#1a0f0f",
          border: `1px solid ${result.found ? STATUS_COLORS[result.status]?.border : "#441"}`,
          borderRadius: 8,
        }}>
          {!result.found ? (
            <div style={{ color: "#f88", fontFamily: "'Space Mono', monospace", fontSize: 13 }}>404 — {result.error}</div>
          ) : (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#00e5ff" }}>{result.txnId}</span>
                <StatusBadge status={result.status} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px" }}>
                {[
                  ["Amount", `₹${result.amount?.toFixed(2)}`],
                  ["Merchant", result.merchant],
                  ["Cardholder", result.name],
                  ["Card", `•••• ${result.cardLast4}`],
                  ["Time", new Date(result.timestamp).toLocaleString("en-IN")],
                  ["Message", result.message],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: 9, letterSpacing: 2, color: "#445", fontFamily: "'Space Mono', monospace", textTransform: "uppercase", marginBottom: 2 }}>{k}</div>
                    <div style={{ fontSize: 13, color: "#ccd", fontFamily: "'DM Sans', sans-serif" }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tab: History ─────────────────────────────────────────────────────────────
function HistoryTab({ refreshKey }) {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(null);

  async function fetch() {
    setLoading(true);
    const res = await apiHistory();
    setHistory(res); setLoading(false);
  }

  useEffect(() => { if (refreshKey > 0) fetch(); }, [refreshKey]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#445", letterSpacing: 2, textTransform: "uppercase" }}>GET /history</span>
        <button
          onClick={fetch} disabled={loading}
          style={{
            padding: "7px 16px", background: "#0d2040", color: "#00e5ff",
            border: "1px solid #1a3560", borderRadius: 6, cursor: "pointer",
            fontFamily: "'Space Mono', monospace", fontSize: 11,
          }}
        >
          {loading ? <Spinner /> : "↻ Refresh"}
        </button>
      </div>

      {history === null ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#334", fontFamily: "'Space Mono', monospace", fontSize: 12 }}>Click refresh to load transactions</div>
      ) : history.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#334", fontFamily: "'Space Mono', monospace", fontSize: 12 }}>[ ] No transactions yet. Initiate a payment first.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {history.map(txn => (
            <div key={txn.txnId} style={{
              background: "#080d18", border: "1px solid #121c30",
              borderRadius: 8, padding: "12px 16px",
              borderLeft: `3px solid ${STATUS_COLORS[txn.status]?.border || "#333"}`,
              display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 8,
            }}>
              <div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#00e5ff", marginBottom: 3 }}>{txn.txnId}</div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, color: "#ccd", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>₹{txn.amount?.toFixed(2)}</span>
                  <span style={{ fontSize: 13, color: "#778" }}>{txn.merchant}</span>
                  <span style={{ fontSize: 11, color: "#445", fontFamily: "'Space Mono', monospace" }}>•••• {txn.cardLast4}</span>
                </div>
                <div style={{ fontSize: 10, color: "#334", fontFamily: "'Space Mono', monospace", marginTop: 4 }}>{new Date(txn.timestamp).toLocaleString("en-IN")}</div>
              </div>
              <StatusBadge status={txn.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
const TABS = ["pay", "status", "history"];

export default function App() {
  const [tab, setTab] = useState("pay");
  const [historyRefresh, setHistoryRefresh] = useState(0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #05080f; min-height: 100vh; display: flex; justify-content: center; align-items: flex-start; padding: 32px 16px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        input::placeholder { color: #2a3550; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #0a0f1a; } ::-webkit-scrollbar-thumb { background: #1a2540; border-radius: 4px; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 560, animation: "fadeIn 0.5s ease" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #00e5ff, #0055ff)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⬡</div>
            <div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 15, color: "#e0e8ff", letterSpacing: 1 }}>PayGate<span style={{ color: "#00e5ff" }}>_</span>Sim</div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#334", letterSpacing: 2, textTransform: "uppercase" }}>Payment Gateway Simulation System</div>
            </div>
          </div>
          <div style={{ height: 1, background: "linear-gradient(90deg, #1a2540 0%, #00e5ff33 50%, #1a2540 100%)" }} />
        </div>

        {/* API Tabs */}
        <div style={{ display: "flex", gap: 2, marginBottom: 24, background: "#080d18", padding: 4, borderRadius: 8, border: "1px solid #121c30" }}>
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); if (t === "history") setHistoryRefresh(r => r + 1); }}
              style={{
                flex: 1, padding: "9px 0", border: "none", borderRadius: 6,
                background: tab === t ? "#0d1e3a" : "transparent",
                color: tab === t ? "#00e5ff" : "#334",
                fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700,
                letterSpacing: 1, cursor: "pointer", textTransform: "uppercase",
                boxShadow: tab === t ? "0 0 0 1px #1a3560" : "none",
                transition: "all 0.15s",
              }}
            >
              {t === "pay" ? "POST /pay" : t === "status" ? "GET /status" : "GET /history"}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div style={{
          background: "#080e1c", border: "1px solid #111d35",
          borderRadius: 12, padding: "24px 24px 20px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px #0a1428",
        }}>
          {tab === "pay" && <PayTab onSuccess={() => {}} />}
          {tab === "status" && <StatusTab />}
          {tab === "history" && <HistoryTab refreshKey={historyRefresh} />}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 18, flexWrap: "wrap" }}>
          {Object.entries(STATUS_COLORS).map(([s, c]) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: c.border }} />
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#334", letterSpacing: 1 }}>{s}</span>
            </div>
          ))}
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#223", letterSpacing: 1 }}>· HashMap-backed · OOP · REST Simulation</span>
        </div>
      </div>
    </>
  );
}