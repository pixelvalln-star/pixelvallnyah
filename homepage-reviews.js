(() => {
  "use strict";

  const SUPABASE_URL = "https://kanswxpnoyshrunyubmg.supabase.co";
  const SUPABASE_KEY = "sb_publishable_8wRxslScRKutbK2l5nPM0A_51AhnRPM";

  if (!window.supabase || document.getElementById("storeReviews")) return;

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const style = document.createElement("style");
  style.textContent = `
    #storeReviews { margin: 50px auto; }
    #storeReviews .section-head { margin-bottom: 22px; }
    #storeReviews .review-marquee {
      --review-gap: 18px;
      overflow: hidden;
      position: relative;
      padding: 10px 2px 22px;
      -webkit-mask-image: linear-gradient(90deg, transparent, #000 4%, #000 96%, transparent);
      mask-image: linear-gradient(90deg, transparent, #000 4%, #000 96%, transparent);
    }
    #storeReviews .review-track {
      display: flex;
      width: max-content;
      gap: var(--review-gap);
      animation: pvReviewDrift 34s linear infinite;
      will-change: transform;
    }
    #storeReviews .review-marquee:hover .review-track,
    #storeReviews .review-marquee:focus-within .review-track { animation-play-state: paused; }
    #storeReviews .review-card {
      width: min(330px, calc(100vw - 76px));
      flex: 0 0 min(330px, calc(100vw - 76px));
      box-sizing: border-box;
      min-height: 174px;
      padding: 20px;
      border: 1px solid rgba(189,139,255,.26);
      border-radius: 18px;
      background: linear-gradient(145deg, rgba(31,24,57,.96), rgba(16,19,39,.96));
      box-shadow: 0 12px 35px rgba(0,0,0,.18), inset 0 1px rgba(255,255,255,.035);
      animation: pvReviewFloat 4.8s ease-in-out infinite;
      overflow-wrap: anywhere;
    }
    #storeReviews .review-card:nth-child(2n) { animation-delay: -1.7s; }
    #storeReviews .review-card:nth-child(3n) { animation-delay: -3.1s; }
    #storeReviews .review-name { color: #fff9ff; font-weight: 800; }
    #storeReviews .review-stars { color: #ffc857; letter-spacing: 2px; margin-top: 7px; }
    #storeReviews .review-product {
      display: flex; flex-wrap: wrap; gap: 5px 8px; align-items: center;
      margin-top: 11px; color: #cfc4ed; font-size: 12px; line-height: 1.5;
    }
    #storeReviews .review-product .product-game { color: #89cff0; font-weight: 800; }
    #storeReviews .review-product .product-name { color: #e6def8; }
    #storeReviews .review-product .product-price { color: #ffc857; font-weight: 700; margin-left: auto; }
    #storeReviews .review-comment { color: #f0eaff; line-height: 1.65; margin: 13px 0; }
    #storeReviews .review-date { color: #bdb4d2; font-size: 12px; }
    #storeReviews .review-status { color: #bdb4d2; font-size: 13px; }
    #storeReviews .review-error { color: #ff9caa; }
    #storeReviews .review-empty { padding: 18px 0; }
    #storeReviews .review-all-link {
      display: inline-flex; align-items: center; gap: 8px;
      margin-top: 8px; color: #d6b7ff; text-decoration: none; font-weight: 700;
    }
    #storeReviews .review-all-link:hover { color: #fff; }
    @keyframes pvReviewDrift {
      from { transform: translateX(0); }
      to { transform: translateX(-50%); }
    }
    @keyframes pvReviewFloat {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-7px); }
    }
    @media (prefers-reduced-motion: reduce) {
      #storeReviews .review-track, #storeReviews .review-card { animation: none !important; }
      #storeReviews .review-marquee { overflow-x: auto; mask-image: none; -webkit-mask-image: none; }
    }
  `;
  document.head.appendChild(style);

  const section = document.createElement("section");
  section.id = "storeReviews";
  section.className = "wrap content";
  section.innerHTML = `
    <div class="section-head">
      <div>
        <div class="kicker">04 / CUSTOMER REVIEWS</div>
        <h2>Kata Mereka ✦</h2>
      </div>
      <p>Pengalaman pelanggan berbelanja di PixelValln SHOP.</p>
    </div>
    <div class="review-marquee" aria-label="Ulasan pelanggan">
      <div id="reviewTrack" class="review-track">
        <p class="review-status">Memuat ulasan...</p>
      </div>
    </div>
    <a class="review-all-link" href="review.html">Lihat semua ulasan ↗</a>
  `;

  const footer = document.querySelector("footer");
  if (footer) footer.before(section);
  else document.body.appendChild(section);

  const track = section.querySelector("#reviewTrack");

  async function loadApprovedReviews() {
    track.replaceChildren();
    const { data, error } = await supabase
      .rpc("get_approved_store_reviews_with_products")
      .limit(12);

    if (error) {
      const status = document.createElement("p");
      status.className = "review-status review-error";
      status.textContent = "Ulasan belum dapat dimuat.";
      track.appendChild(status);
      console.error("Gagal memuat ulasan:", error);
      return;
    }

    if (!data || data.length === 0) {
      const status = document.createElement("p");
      status.className = "review-status review-empty";
      status.textContent = "Belum ada ulasan yang dipublikasikan.";
      track.appendChild(status);
      return;
    }

    const makeCard = (review, index) => {
      const card = document.createElement("article");
      card.className = "review-card";
      card.setAttribute("aria-label", `Ulasan dari ${review.display_name}`);

      const name = document.createElement("div");
      name.className = "review-name";
      name.textContent = review.display_name || "Pelanggan";

      const stars = document.createElement("div");
      stars.className = "review-stars";
      stars.textContent = "★".repeat(Number(review.rating)) + "☆".repeat(5 - Number(review.rating));

      const product = document.createElement("div");
      product.className = "review-product";

      const game = document.createElement("span");
      game.className = "product-game";
      game.textContent = review.game_name || "Game";

      const separator = document.createElement("span");
      separator.textContent = "·";

      const productName = document.createElement("span");
      productName.className = "product-name";
      productName.textContent = review.product_name || "Produk";

      const price = document.createElement("span");
      price.className = "product-price";
      price.textContent = review.amount == null
        ? ""
        : "Rp " + new Intl.NumberFormat("id-ID").format(Number(review.amount));

      product.append(game, separator, productName, price);

      const comment = document.createElement("p");
      comment.className = "review-comment";
      comment.textContent = review.comment || "";

      const date = document.createElement("small");
      date.className = "review-date";
      date.textContent = new Date(review.created_at).toLocaleDateString("id-ID");

      card.append(name, stars, product, comment, date);
      card.style.animationDelay = `${(index % 4) * -0.8}s`;
      return card;
    };

    data.forEach((review, index) => track.appendChild(makeCard(review, index)));

    // Duplicate cards only for a seamless marquee; the database is queried once.
    if (data.length > 1) {
      data.forEach((review, index) => {
        const duplicate = makeCard(review, index);
        duplicate.setAttribute("aria-hidden", "true");
        track.appendChild(duplicate);
      });
    } else {
      track.style.animation = "none";
    }
  }

  loadApprovedReviews();
})();
