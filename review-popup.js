(() => {
  "use strict";
  if (window.__pixelVallnReviewPopupLoaded) return;
  window.__pixelVallnReviewPopupLoaded = true;

  const client = window.pixelSupabase || (window.supabase && window.supabase.createClient(
    "https://kanswxpnoyshrunyubmg.supabase.co",
    "sb_publishable_8wRxslScRKutbK2l5nPM0A_51AhnRPM"
  ));
  if (!client) return;

  const ORDERS_KEY = "pixelvalln_customer_orders";
  const SUBMITTED_KEY = "pixelvalln_review_submitted_tokens";
  const DISMISSED_KEY = "pixelvalln_review_dismissed_tokens";

  const style = document.createElement("style");
  style.textContent = `
    #pv-review-overlay{position:fixed;inset:0;z-index:99999;background:rgba(3,7,20,.78);display:flex;align-items:center;justify-content:center;padding:18px;backdrop-filter:blur(7px)}
    #pv-review-overlay[hidden]{display:none!important}
    #pv-review-card{width:min(100%,480px);max-height:90vh;overflow:auto;background:#10172b;color:#f5f8ff;border:1px solid rgba(137,207,240,.35);border-radius:22px;padding:24px;box-shadow:0 24px 80px #0008;font-family:inherit}
    #pv-review-card h2{margin:0 0 8px;font-size:1.45rem}#pv-review-card p{color:#c4cde0;line-height:1.5}
    #pv-review-order{background:#1a263d;border:1px solid #2b3c5a;border-radius:12px;padding:12px;margin:14px 0}
    #pv-review-order .pv-detail-label{font-size:11px;color:#9eabc2;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px}
    #pv-review-order .pv-detail-value{font-weight:700;overflow-wrap:anywhere;margin-bottom:10px}
    #pv-review-order .pv-total{display:flex;justify-content:space-between;gap:12px;border-top:1px solid #34445e;padding-top:10px;margin-top:4px}
    #pv-review-order .pv-total strong{color:#89cff0;white-space:nowrap}
    #pv-review-card label{display:grid;gap:7px;margin:13px 0;color:#eaf1ff}
    #pv-review-card input,#pv-review-card select,#pv-review-card textarea{box-sizing:border-box;width:100%;padding:12px;border:1px solid #394766;border-radius:10px;background:#0b1020;color:#fff;font:inherit}
    #pv-review-card textarea{min-height:95px;resize:vertical}
    #pv-review-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}#pv-review-actions button{padding:11px 15px;border-radius:10px;border:1px solid #52617f;cursor:pointer;font:inherit}
    #pv-review-submit{background:#89cff0;color:#08101f;border-color:#89cff0!important;font-weight:700}#pv-review-close{background:transparent;color:#eaf1ff}
    #pv-review-message{min-height:1.4em;font-size:.92rem}#pv-review-message.error{color:#ff9cab}#pv-review-message.success{color:#8ce8bd}
  `;
  document.head.appendChild(style);

  const overlay = document.createElement("div");
  overlay.id = "pv-review-overlay";
  overlay.hidden = true;
  overlay.innerHTML = `
    <section id="pv-review-card" role="dialog" aria-modal="true" aria-labelledby="pv-review-title">
      <h2 id="pv-review-title">Pesananmu sudah selesai! ✨</h2>
      <p>Terima kasih sudah berbelanja di PixelValln SHOP. Yuk, bagikan pengalamanmu.</p>
      <div id="pv-review-order" hidden>
        <div class="pv-detail-label">Game</div><div class="pv-detail-value" id="pv-review-game"></div>
        <div class="pv-detail-label">Produk</div><div class="pv-detail-value" id="pv-review-product"></div>
        <div class="pv-total"><span>Total pesanan</span><strong id="pv-review-amount"></strong></div>
      </div>
      <form id="pv-review-form">
        <label>Nickname<input id="pv-review-name" maxlength="50" required placeholder="Nama yang ditampilkan"></label>
        <label>Rating<select id="pv-review-rating"><option value="5">★★★★★ — Sangat puas</option><option value="4">★★★★☆ — Puas</option><option value="3">★★★☆☆ — Cukup</option><option value="2">★★☆☆☆ — Kurang puas</option><option value="1">★☆☆☆☆ — Tidak puas</option></select></label>
        <label>Komentar<textarea id="pv-review-comment" minlength="3" maxlength="1000" required placeholder="Ceritakan pengalamanmu..."></textarea></label>
        <p id="pv-review-message" role="status" aria-live="polite"></p>
        <div id="pv-review-actions"><button id="pv-review-submit" type="submit">Kirim ulasan</button><button id="pv-review-close" type="button">Nanti saja</button></div>
      </form>
    </section>`;
  document.body.appendChild(overlay);

  const form = overlay.querySelector("#pv-review-form");
  const msg = overlay.querySelector("#pv-review-message");
  const submit = overlay.querySelector("#pv-review-submit");
  let activeReviewToken = null;

  function readArray(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch { return []; }
  }
  function addToken(key, token) {
    if (!token) return;
    const values = readArray(key);
    if (!values.includes(token)) values.push(token);
    localStorage.setItem(key, JSON.stringify(values.slice(-200)));
  }
  function rupiah(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return "—";
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
  }
  function show(row) {
    activeReviewToken = row.review_token;
    msg.textContent = "";
    msg.className = "";
    overlay.querySelector("#pv-review-game").textContent = row.game_name || "Game";
    overlay.querySelector("#pv-review-product").textContent = row.product_name || "Produk";
    overlay.querySelector("#pv-review-amount").textContent = rupiah(row.amount);
    overlay.querySelector("#pv-review-order").hidden = false;
    overlay.hidden = false;
  }
  function closePopup() {
    // Dismiss only this session's popup; it may be offered again on a later visit.
    if (activeReviewToken) addToken(DISMISSED_KEY, activeReviewToken);
    overlay.hidden = true;
    activeReviewToken = null;
  }
  overlay.querySelector("#pv-review-close").addEventListener("click", closePopup);
  overlay.addEventListener("click", event => {
    if (event.target === overlay) closePopup();
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!activeReviewToken) return;
    const displayName = overlay.querySelector("#pv-review-name").value.trim();
    const rating = Number(overlay.querySelector("#pv-review-rating").value);
    const comment = overlay.querySelector("#pv-review-comment").value.trim();
    if (!displayName || displayName.length > 50 || comment.length < 3 || comment.length > 1000) {
      msg.textContent = "Periksa nickname dan komentar kamu.";
      msg.className = "error";
      return;
    }
    submit.disabled = true;
    submit.textContent = "Mengirim...";
    msg.textContent = "";
    try {
      const token = activeReviewToken;
      const { error } = await client.rpc("submit_store_review", {
        p_review_token: token,
        p_display_name: displayName,
        p_rating: rating,
        p_comment: comment
      });
      if (error) throw error;
      addToken(SUBMITTED_KEY, token);
      // Also maintain the old key for compatibility with previous versions.
      addToken("pixelvalln_review_popup_seen", token);
      overlay.hidden = true;
      activeReviewToken = null;
      alert("Terima kasih! Ulasanmu berhasil dikirim dan menunggu persetujuan admin.");
    } catch (error) {
      console.error("Review submit failed", error);
      msg.textContent = "Ulasan gagal dikirim. Coba lagi.";
      msg.className = "error";
    } finally {
      submit.disabled = false;
      submit.textContent = "Kirim ulasan";
    }
  });

  async function checkOrders() {
    if (!overlay.hidden) return;
    const orders = readArray(ORDERS_KEY);
    const submitted = readArray(SUBMITTED_KEY);
    const dismissed = readArray(DISMISSED_KEY);
    for (const order of orders) {
      if (!order.customer_access_token) continue;
      try {
        const { data, error } = await client.rpc("check_customer_order", {
          p_customer_access_token: order.customer_access_token
        });
        if (error) throw error;
        const row = Array.isArray(data) ? data[0] : data;
        if (!row || row.payment_status !== "verified" || row.order_status !== "completed" || !row.review_token) continue;
        // Crucial: compare the REVIEW token returned by the server, not the customer access token.
        if (submitted.includes(row.review_token) || dismissed.includes(row.review_token)) continue;
        show(row);
        return;
      } catch (error) {
        console.warn("Status pesanan belum dapat diperiksa", error);
      }
    }
  }

  checkOrders();
  window.setInterval(checkOrders, 15000);
})();
