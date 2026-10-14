(() => {
  "use strict";
  const SUPABASE_URL = "https://kanswxpnoyshrunyubmg.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_8wRxslScRKutbK2l5nPM0A_51AhnRPM";
  const $ = id => document.getElementById(id);
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  const money = n => "Rp " + new Intl.NumberFormat("id-ID").format(Number(n || 0));
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const showMessage = (id, message, type="") => {
    const el = $(id); el.textContent = message; el.className = "notice" + (type ? " " + type : "");
  };
  let currentUser = null;
  
let ordersChannel = null;
let ordersReloadTimer = null;

function startOrdersRealtime() {
  if (ordersChannel) return;

  ordersChannel = client
    .channel("pixelvalln-admin-orders")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "orders"
      },
      () => {
        // Gabungkan event berdekatan agar tabel tidak memuat ulang berkali-kali.
        clearTimeout(ordersReloadTimer);
        ordersReloadTimer = setTimeout(() => {
          if (!$("ordersPanel").classList.contains("hidden")) {
            loadOrders();
          }
        }, 250);
      }
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log("Realtime pesanan aktif.");
      } else if (status === "CHANNEL_ERROR") {
        console.error("Realtime gagal tersambung.");
      }
    });
}

function stopOrdersRealtime() {
  clearTimeout(ordersReloadTimer);
  ordersReloadTimer = null;
  if (!ordersChannel) return;

  client.removeChannel(ordersChannel);
  ordersChannel = null;
}


  async function isAdmin() {
    const { data, error } = await client.rpc("is_store_admin");
    if (error) throw error;
    return data === true;
  }

  function statusPill(value) {
    const good = value === "verified" || value === "completed";
    const warn = value === "pending";
    return `<span class="pill ${good ? "good" : warn ? "warn" : ""}">${esc(value)}</span>`;
  }

  async function loadOrders() {
    $("ordersBody").innerHTML = "";
    showMessage("ordersMessage", "Memuat pesanan…");
    const { data, error } = await client.from("orders")
      .select("id,order_code,customer_name,customer_contact,game_name,product_name,game_user_id,game_server_id,amount,payment_method,payment_status,order_status,delivered_details,created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      showMessage("ordersMessage", "Gagal memuat pesanan: " + error.message, "error");
      return;
    }
    if (!data || data.length === 0) {
      showMessage("ordersMessage", "Belum ada pesanan di database. Checkout website perlu dihubungkan ke Supabase terlebih dahulu.");
      return;
    }
    showMessage("ordersMessage", `${data.length} pesanan ditampilkan.`);
    $("ordersBody").innerHTML = data.map(o => {
      const completed = o.payment_status === "verified" && o.order_status === "completed";
      return `<tr>
        <td><b>${esc(o.order_code)}</b><small>${esc(new Date(o.created_at).toLocaleString("id-ID"))}</small></td>
        <td>${esc(o.customer_name || "—")}<small>${esc(o.customer_contact || "—")}</small></td>
        <td>${esc(o.game_name)}<small>${esc(o.product_name)} · ${String(o.game_user_id||"").startsWith("Catatan pelanggan:") ? esc(o.game_user_id) : "ID: " + esc(o.game_user_id)}${o.game_server_id ? " · Server: " + esc(o.game_server_id) : ""}</small><small>${esc(o.payment_method)}</small></td>
        <td>${money(o.amount)}</td>
        <td>Pembayaran: ${statusPill(o.payment_status)}<small>Pesanan: ${statusPill(o.order_status)}</small></td>
        <td><div class="actions">
          ${o.payment_status !== "verified" ? `<button class="green" data-action="verify" data-id="${esc(o.id)}">Verifikasi bayar</button>` : ""}
          ${o.order_status === "pending" ? `<button class="secondary" data-action="processing" data-id="${esc(o.id)}">Proses pesanan</button>` : ""}
          ${o.order_status !== "completed" && o.order_status !== "cancelled" ? `<button class="green" data-action="complete" data-id="${esc(o.id)}">Tandai selesai</button>` : ""}
          <button class="secondary" data-action="details" data-id="${esc(o.id)}">${o.delivered_details ? "Edit detail kiriman" : "Isi detail kiriman"}</button>
          ${completed ? `<button class="secondary" data-action="token" data-code="${esc(o.order_code)}">Ambil token ulasan</button>` : ""}
          <div class="delivery-editor hidden" id="details-${esc(o.id)}"><label for="details-input-${esc(o.id)}">Detail yang akan diterima pelanggan</label><textarea id="details-input-${esc(o.id)}" maxlength="10000" placeholder="Contoh: detail akun Minecraft, kode redeem Valorant, instruksi penukaran...">${esc(o.delivered_details || "")}</textarea><p class="fine">Hanya tampil ke pelanggan setelah pembayaran verified dan pesanan completed. Jangan masukkan password email utama atau kode OTP.</p><button class="green" data-action="save-details" data-id="${esc(o.id)}">Simpan detail</button><button class="secondary" data-action="cancel-details" data-id="${esc(o.id)}">Batal</button></div>
          <div id="token-${esc(o.id)}" class="token"></div>
        </div></td>
      </tr>`;
    }).join("");
  }

  async function updateOrder(id, changes) {
    const { error } = await client.from("orders").update(changes).eq("id", id);
    if (error) throw error;
    await loadOrders();
  }


  async function loadAdminReviews() {
    const list = $("adminReviewsList");
    if (!list) return;
    list.replaceChildren();
    showMessage("reviewsMessage", "Memuat ulasan…");

    const { data, error } = await client
      .from("store_reviews")
      .select("id, display_name, rating, comment, created_at, is_approved")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      showMessage("reviewsMessage", "Gagal memuat ulasan: " + error.message, "error");
      return;
    }

    if (!data || data.length === 0) {
      showMessage("reviewsMessage", "Belum ada ulasan.");
      return;
    }

    const pendingCount = data.filter(review => !review.is_approved).length;
    showMessage("reviewsMessage",
      `${data.length} ulasan · ${pendingCount} menunggu persetujuan.`,
      pendingCount ? "" : "ok");

    data.forEach(review => {
      const card = document.createElement("article");
      card.className = "review-admin-card";

      const title = document.createElement("h3");
      title.textContent = review.display_name;

      const stars = document.createElement("div");
      stars.className = "review-stars";
      stars.textContent = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);

      const comment = document.createElement("p");
      comment.textContent = review.comment;

      const meta = document.createElement("div");
      meta.className = "review-meta";
      meta.textContent =
        `${new Date(review.created_at).toLocaleString("id-ID")} · ` +
        (review.is_approved ? "Dipublikasikan" : "Menunggu persetujuan");

      card.append(title, stars, comment, meta);

      if (!review.is_approved) {
        const actions = document.createElement("div");
        actions.className = "row";
        actions.style.marginTop = "12px";

        const approve = document.createElement("button");
        approve.className = "green";
        approve.type = "button";
        approve.textContent = "Setujui ulasan";
        approve.addEventListener("click", async () => {
          approve.disabled = true;
          const { error: updateError } = await client
            .from("store_reviews")
            .update({ is_approved: true })
            .eq("id", review.id);

          if (updateError) {
            showMessage("reviewsMessage", "Gagal menyetujui ulasan: " + updateError.message, "error");
            approve.disabled = false;
            return;
          }
          await loadAdminReviews();
        });

        const reject = document.createElement("button");
        reject.className = "red";
        reject.type = "button";
        reject.textContent = "Hapus ulasan";
        reject.addEventListener("click", async () => {
          if (!confirm("Hapus ulasan ini secara permanen?")) return;
          reject.disabled = true;
          const { error: deleteError } = await client
            .from("store_reviews")
            .delete()
            .eq("id", review.id);

          if (deleteError) {
            showMessage("reviewsMessage", "Gagal menghapus ulasan: " + deleteError.message, "error");
            reject.disabled = false;
            return;
          }
          await loadAdminReviews();
        });

        actions.append(approve, reject);
        card.appendChild(actions);
      }

      list.appendChild(card);
    });
  }


  const stockMoney = n => "Rp " + new Intl.NumberFormat("id-ID").format(Number(n || 0));
  let stockRows = [];
  function catalogRows(){
    const catalog=window.PIXELVALLN_CATALOG||[];
    return catalog.flatMap(g=>g.categories.flatMap(c=>c.items.map(it=>({game_id:g.id,game_name:g.name,category_name:c.name,product_name:it.name,price:it.price,kind:g.kind||"topup"}))));
  }
  const normalizeStockKey = value => String(value ?? "")
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("id-ID")
    .replace(/\\s+/g, " ");

  async function loadStock(){
    const tbody=$("stockBody"); if(!tbody)return;
    showMessage("stockMessage","Memuat status stok produk…");
    const {data,error}=await client.rpc("get_public_product_stock");
    if(error){showMessage("stockMessage","Gagal memuat stok. Detail: "+error.message,"error");return;}

    const dbRows = data || [];
    const exactMap = new Map(
      dbRows.map(r => [[r.game_id, r.category_name, r.product_name].join("||"), r])
    );

    // Cocokkan kategori + varian tanpa bergantung pada game_id tampilan.
    // Beberapa katalog front-end memakai ID yang berbeda dari database.
    const categoryProductMap = new Map();
    for (const r of dbRows) {
      const key = [normalizeStockKey(r.category_name), normalizeStockKey(r.product_name)].join("||");
      if (!categoryProductMap.has(key)) categoryProductMap.set(key, []);
      categoryProductMap.get(key).push(r);
    }

    stockRows = catalogRows().map(row => {
      const exactKey = [row.game_id, row.category_name, row.product_name].join("||");
      let dbRow = exactMap.get(exactKey);
      if (!dbRow) {
        const matches = categoryProductMap.get(
          [normalizeStockKey(row.category_name), normalizeStockKey(row.product_name)].join("||")
        ) || [];
        if (matches.length === 1) dbRow = matches[0];
      }
      return {
        ...row,
        // Keep stock state from Supabase whenever a matching row exists.
        is_active: dbRow ? dbRow.is_active !== false : true
      };
    });

    renderStock();
    showMessage("stockMessage",`${stockRows.length} varian produk ditampilkan. Status stok tersimpan di Supabase.`,"ok");
  }
  function renderStock(){
    const q=($("stockSearch")?.value||"").trim().toLocaleLowerCase("id-ID");
    const rows=stockRows.filter(r=>[r.game_name,r.category_name,r.product_name].join(" ").toLocaleLowerCase("id-ID").includes(q));
    $("stockBody").innerHTML=rows.map(r=>`<tr><td><b>${esc(r.game_name)}</b><small>${r.kind==="premium"?"Apps Premium":"Top Up / Produk Gaming"}</small></td><td>${esc(r.category_name)}</td><td>${esc(r.product_name)}</td><td>${stockMoney(r.price)}</td><td>${r.is_active?'<span class="pill good">Tersedia</span>':'<span class="pill warn">Stok habis</span>'}</td><td><button class="${r.is_active?'red':'green'}" data-stock-toggle="1" data-game="${esc(r.game_id)}" data-category="${esc(r.category_name)}" data-product="${esc(r.product_name)}" data-next="${r.is_active?'false':'true'}">${r.is_active?'Tandai habis':'Aktifkan stok'}</button></td></tr>`).join("")||'<tr><td colspan="6" class="empty">Produk tidak ditemukan.</td></tr>';
  }
  $("stockBody")?.addEventListener("click", async e => {
    const btn = e.target.closest("button[data-stock-toggle]");
    if (!btn) return;

    btn.disabled = true;
    try {
      const { data: dbRows, error: listError } = await client.rpc("get_public_product_stock");
      if (listError) throw listError;

      const wantedCategory = normalizeStockKey(btn.dataset.category);
      const wantedProduct = normalizeStockKey(btn.dataset.product);

      // Cocokkan nama kategori + varian dahulu. Ini menghindari game_id dari
      // katalog front-end yang berbeda dari game_id yang tersimpan di database.
      let match = (dbRows || []).find(row =>
        normalizeStockKey(row.category_name) === wantedCategory &&
        normalizeStockKey(row.product_name) === wantedProduct
      );

      // Fallback aman: hanya gunakan nama varian jika hasilnya unik.
      if (!match) {
        const productMatches = (dbRows || []).filter(row =>
          normalizeStockKey(row.product_name) === wantedProduct
        );
        if (productMatches.length === 1) match = productMatches[0];
      }

      if (!match) {
        throw new Error(
          `Varian "${btn.dataset.product}" dengan kategori "${btn.dataset.category}" tidak ditemukan di store_products. Muat ulang stok dan periksa nama produk di Supabase.`
        );
      }

      const { error } = await client.rpc("set_store_product_stock", {
        p_game_id: match.game_id,
        p_category_name: match.category_name,
        p_product_name: match.product_name,
        p_is_active: btn.dataset.next === "true"
      });
      if (error) throw error;

      await loadStock();
      showMessage(
        "stockMessage",
        `${match.product_name}: stok berhasil ${btn.dataset.next === "true" ? "diaktifkan" : "ditandai habis"}.`,
        "ok"
      );
    } catch (err) {
      showMessage("stockMessage", "Gagal mengubah stok: " + (err.message || "Kesalahan tidak diketahui"), "error");
    } finally {
      btn.disabled = false;
    }
  });
  $("refreshStockBtn")?.addEventListener("click",loadStock);
  $("stockSearch")?.addEventListener("input",renderStock);

  $("refreshReviewsBtn").addEventListener("click", loadAdminReviews);


  async function loadWalletTopups() {
    showMessage("walletAdminMessage", "Memuat permintaan isi saldo…");
    const { data, error } = await client.rpc("admin_list_wallet_topups");
    if (error) { showMessage("walletAdminMessage", "Gagal memuat isi saldo: " + error.message, "error"); return; }
    const rows = data || [];
    if (!rows.length) { $("walletAdminBody").innerHTML = ""; showMessage("walletAdminMessage", "Belum ada permintaan isi saldo."); return; }
    showMessage("walletAdminMessage", `${rows.length} permintaan isi saldo ditampilkan.`);
    const money = n => "Rp " + new Intl.NumberFormat("id-ID").format(Number(n || 0));
    const esc = v => String(v ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
    $("walletAdminBody").innerHTML = rows.map(t => `<tr><td><b>${esc(t.topup_code)}</b><small>${esc(new Date(t.created_at).toLocaleString("id-ID"))}</small></td><td>${esc(t.customer_email || t.user_id)}</td><td><b>${money(t.amount)}</b></td><td>${esc(t.payment_method)}</td><td>${statusPill(t.status)}</td><td><div class="actions">${t.status === "pending" ? `<button class="green" data-wallet-action="approve" data-code="${esc(t.topup_code)}">Setujui saldo</button><button class="red" data-wallet-action="reject" data-code="${esc(t.topup_code)}">Tolak</button>` : "Sudah ditinjau"}</div></td></tr>`).join("");
  }
  async function reviewWalletTopup(code, approve) {
    const note = approve ? "Pembayaran diverifikasi admin" : "Pembayaran tidak dapat diverifikasi";
    const { error } = await client.rpc("admin_review_wallet_topup", { p_topup_code: code, p_approve: approve, p_admin_note: note });
    if (error) throw error;
    showMessage("walletAdminMessage", `Permintaan ${code} ${approve ? "disetujui dan saldo ditambahkan" : "ditolak"}.`, approve ? "ok" : "error");
    await loadWalletTopups();
  }

  $("walletAdminBody")?.addEventListener("click", async e => {
    const btn=e.target.closest("button[data-wallet-action]"); if(!btn)return; const approve=btn.dataset.walletAction==="approve";
    if(!confirm(`${approve?"Setujui dan tambahkan saldo untuk":"Tolak permintaan"} ${btn.dataset.code}?`))return; btn.disabled=true;
    try{await reviewWalletTopup(btn.dataset.code,approve)}catch(err){showMessage("walletAdminMessage",err.message||"Gagal meninjau isi saldo.","error")}finally{btn.disabled=false}
  });
  $("refreshWalletBtn")?.addEventListener("click",loadWalletTopups);

  $("loginForm").addEventListener("submit", async e => {
    e.preventDefault();
    const btn = $("loginBtn"); btn.disabled = true;
    showMessage("loginMessage", "Memeriksa akun…");
    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: $("email").value.trim(),
        password: $("password").value
      });
      if (error) throw error;
      currentUser = data.user;
      if (!(await isAdmin())) {
        await client.auth.signOut();
        currentUser = null;
        throw new Error("Akun ini belum terdaftar sebagai admin di store_admins.");
      }
      $("loginPanel").classList.add("hidden");
      $("ordersPanel").classList.remove("hidden");
      $("reviewsPanel").classList.remove("hidden");
      $("walletPanel").classList.remove("hidden");
      $("stockPanel").classList.remove("hidden");
      await loadStock();
      await loadWalletTopups();
      $("logoutBtn").classList.remove("hidden");
      $("adminIdentity").textContent = currentUser.email || "Admin";
      await loadOrders();
      startOrdersRealtime();
      await loadAdminReviews();
    } catch (err) {
      showMessage("loginMessage", err.message || "Login gagal.", "error");
    } finally {
      btn.disabled = false;
    }
  });

  $("logoutBtn").addEventListener("click", async () => {
    stopOrdersRealtime();
    await client.auth.signOut();
    currentUser = null;
    $("ordersPanel").classList.add("hidden");
    $("reviewsPanel").classList.add("hidden");
    $("walletPanel").classList.add("hidden");
    $("stockPanel").classList.add("hidden");
    $("logoutBtn").classList.add("hidden");
    $("loginPanel").classList.remove("hidden");
    showMessage("loginMessage", "Kamu sudah logout.");
  });
  $("refreshBtn").addEventListener("click", loadOrders);

  $("ordersBody").addEventListener("click", async e => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    btn.disabled = true;
    try {
      if (action === "verify") {
        await updateOrder(btn.dataset.id, { payment_status: "verified", updated_at: new Date().toISOString() });
      } else if (action === "processing") {
        await updateOrder(btn.dataset.id, { order_status: "processing", updated_at: new Date().toISOString() });
      } else if (action === "complete") {
        const row = btn.closest("tr");
        const paymentText = row.children[4].textContent;
        if (!paymentText.includes("verified")) {
          throw new Error("Verifikasi pembayaran terlebih dahulu sebelum menyelesaikan pesanan.");
        }
        await updateOrder(btn.dataset.id, { order_status: "completed", updated_at: new Date().toISOString() });
      } else if (action === "details") {
        document.getElementById(`details-${btn.dataset.id}`).classList.toggle("hidden");
      } else if (action === "cancel-details") {
        document.getElementById(`details-${btn.dataset.id}`).classList.add("hidden");
      } else if (action === "save-details") {
        const value = document.getElementById(`details-input-${btn.dataset.id}`).value.trim();
        const { error } = await client.from("orders").update({ delivered_details: value || null, updated_at: new Date().toISOString() }).eq("id", btn.dataset.id);
        if (error) throw error;
        showMessage("ordersMessage", "Detail pesanan berhasil disimpan. Pelanggan akan melihatnya setelah pesanan selesai.", "ok");
        await loadOrders();
      } else if (action === "token") {
        const { data, error } = await client.rpc("get_review_token", { p_order_code: btn.dataset.code });
        if (error) throw error;
        if (!data) throw new Error("Token belum tersedia.");
        const cell = btn.closest("td");
        const tokenEl = cell.querySelector(".token");
        tokenEl.textContent = "Token ulasan: " + data;
        const copy = document.createElement("button");
        copy.className = "secondary";
        copy.type = "button";
        copy.textContent = "Salin token";
        copy.addEventListener("click", async () => {
          try { await navigator.clipboard.writeText(data); copy.textContent = "Tersalin"; }
          catch { tokenEl.textContent = "Salin manual token ini: " + data; }
        });
        tokenEl.appendChild(document.createElement("br"));
        tokenEl.appendChild(copy);
      }
    } catch (err) {
      showMessage("ordersMessage", err.message || "Aksi gagal.", "error");
    } finally {
      btn.disabled = false;
    }
  });

  client.auth.getSession().then(async ({ data }) => {
    if (!data.session) return;
    try {
      currentUser = data.session.user;
      if (!(await isAdmin())) return;
      $("loginPanel").classList.add("hidden");
      $("ordersPanel").classList.remove("hidden");
      $("reviewsPanel").classList.remove("hidden");
      $("walletPanel").classList.remove("hidden");
      $("stockPanel").classList.remove("hidden");
      await loadStock();
      await loadWalletTopups();
      $("logoutBtn").classList.remove("hidden");
      $("adminIdentity").textContent = currentUser.email || "Admin";
      await loadOrders();
      startOrdersRealtime();
      await loadAdminReviews();
    } catch (_) { /* Keep login screen visible if the session is not an authorized admin. */ }
  });
})();
