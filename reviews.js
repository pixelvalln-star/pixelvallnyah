
(() => {
  const SUPABASE_URL = "https://kanswxpnoyshrunyubmg.supabase.co";
  const SUPABASE_KEY = "sb_publishable_8wRxslScRKutbK2l5nPM0A_51AhnRPM";

  const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

  const style = document.createElement("style");
  style.textContent = `
    #storeReviews { margin: 50px auto; }
    #storeReviews .review-panel {
      background: rgba(18,22,43,.94);
      border: 1px solid rgba(137,207,240,.22);
      border-radius: 20px;
      padding: 24px;
      margin-bottom: 22px;
    }
    #storeReviews .review-form { display:grid; gap:14px; max-width:650px; }
    #storeReviews input, #storeReviews select, #storeReviews textarea {
      box-sizing:border-box; width:100%; padding:12px;
      border:1px solid #39415f; border-radius:10px;
      background:#0d1226; color:#fff; font:inherit;
    }
    #storeReviews textarea { min-height:110px; resize:vertical; }
    #storeReviews label { display:grid; gap:7px; }
    #storeReviews .review-list { display:grid; gap:12px; }
    #storeReviews .review-card {
      background:rgba(18,22,43,.8); border:1px solid #303957;
      border-radius:14px; padding:18px; overflow-wrap:anywhere;
    }
    #storeReviews .review-stars { color:#ffc857; letter-spacing:2px; }
    #storeReviews .review-status { color:#b7c4df; font-size:.9rem; }
    #storeReviews .review-error { color:#ff9caa; }
    #storeReviews .review-success { color:#8ce8bd; }
  `;
  document.head.appendChild(style);

  const section = document.createElement("section");
  section.id = "storeReviews";
  section.className = "wrap content";
  section.innerHTML = `
    <div class="section-head">
      <div>
        <div class="kicker">04 / CUSTOMER REVIEWS</div>
        <h2>Ulasan Pelanggan</h2>
      </div>
      <p>Ceritakan pengalamanmu berbelanja di PixelValln SHOP.</p>
    </div>

    <div class="review-panel">
      <h3>Tulis ulasanmu ✦</h3>
      <p class="review-status">
        Tidak perlu login. Masukkan token dari admin setelah pesanan selesai.
        Ulasan akan ditampilkan setelah disetujui admin.
      </p>

      <form class="review-form" id="reviewForm">
        <label>Token ulasan
          <input id="reviewToken" required autocomplete="off"
            placeholder="Tempel token ulasan dari admin">
        </label>
        <label>Nickname
          <input id="reviewName" maxlength="50" required
            placeholder="Contoh: VallnPlayer">
        </label>
        <label>Rating
          <select id="reviewRating" required>
            <option value="5">★★★★★ — Sangat puas</option>
            <option value="4">★★★★☆ — Puas</option>
            <option value="3">★★★☆☆ — Cukup</option>
            <option value="2">★★☆☆☆ — Kurang puas</option>
            <option value="1">★☆☆☆☆ — Tidak puas</option>
          </select>
        </label>
        <label>Komentar
          <textarea id="reviewComment" minlength="3" maxlength="1000"
            required placeholder="Bagaimana pengalamanmu?"></textarea>
        </label>
        <button class="btn btn-main" id="reviewSubmit" type="submit">
          Kirim Ulasan
        </button>
        <p id="reviewMessage" class="review-status" role="status"
          aria-live="polite"></p>
      </form>
    </div>

    <div class="review-panel">
      <h3>Ulasan Terbaru</h3>
      <div id="reviewList" class="review-list">
        <p class="review-status">Memuat ulasan...</p>
      </div>
    </div>
  `;


const reviewPage = document.getElementById("reviewPage");

if (reviewPage) {
  reviewPage.appendChild(section);
} else {
  const footer = document.querySelector("footer");
  if (footer) footer.before(section);
  else document.body.appendChild(section);
}


  const form = document.getElementById("reviewForm");
  const message = document.getElementById("reviewMessage");
  const submitButton = document.getElementById("reviewSubmit");
  const reviewList = document.getElementById("reviewList");

  function showMessage(text, type = "") {
    message.textContent = text;
    message.className = "review-status " + type;
  }

  async function loadReviews() {
    reviewList.replaceChildren();

    const { data, error } = await supabase
      .from("store_reviews")
      .select("display_name, rating, comment, created_at")
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      const p = document.createElement("p");
      p.className = "review-status review-error";
      p.textContent = "Ulasan belum dapat dimuat. Periksa konfigurasi Supabase.";
      reviewList.appendChild(p);
      console.error("Gagal memuat ulasan:", error);
      return;
    }

    if (!data || data.length === 0) {
      const p = document.createElement("p");
      p.className = "review-status";
      p.textContent = "Belum ada ulasan yang dipublikasikan.";
      reviewList.appendChild(p);
      return;
    }

    data.forEach(review => {
      const card = document.createElement("article");
      card.className = "review-card";

      const name = document.createElement("strong");
      name.textContent = review.display_name;

      const stars = document.createElement("div");
      stars.className = "review-stars";
      stars.textContent = "★".repeat(review.rating) +
        "☆".repeat(5 - review.rating);

      const comment = document.createElement("p");
      comment.textContent = review.comment;

      const date = document.createElement("small");
      date.className = "review-status";
      date.textContent = new Date(review.created_at).toLocaleDateString("id-ID");

      card.append(name, stars, comment, date);
      reviewList.appendChild(card);
    });
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const token = document.getElementById("reviewToken").value.trim();
    const displayName = document.getElementById("reviewName").value.trim();
    const rating = Number(document.getElementById("reviewRating").value);
    const comment = document.getElementById("reviewComment").value.trim();

    if (!token || displayName.length < 1 || displayName.length > 50 ||
        !Number.isInteger(rating) || rating < 1 || rating > 5 ||
        comment.length < 3 || comment.length > 1000) {
      showMessage("Periksa kembali token, nickname, rating, dan komentar.", "review-error");
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Mengirim...";
    showMessage("");

    try {
      const { error } = await supabase.rpc("submit_store_review", {
        p_review_token: token,
        p_display_name: displayName,
        p_rating: rating,
        p_comment: comment
      });

      if (error) throw error;

      form.reset();
      showMessage(
        "Ulasan berhasil dikirim dan menunggu persetujuan admin.",
        "review-success"
      );
      await loadReviews();
    } catch (error) {
      console.error("Gagal mengirim ulasan:", error);
      showMessage(
        "Ulasan gagal dikirim. Pastikan token benar, pesanan sudah selesai, dan token belum pernah digunakan.",
        "review-error"
      );
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Kirim Ulasan";
    }
  });

  loadReviews();
})();
