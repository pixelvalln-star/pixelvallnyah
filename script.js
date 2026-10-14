/* PixelValln SHOP: checkout tersimpan di website; status pesanan dikelola admin. */
const games=window.PIXELVALLN_CATALOG;
let activeGame=null,activeCategory=null,activeItem=null;
const stockMap=new Map();
const stockKey=(g,c,it)=>[g.stockGameId||g.id,c.name,it.name].join("||");
function isAvailable(g,c,it){return stockMap.get(stockKey(g,c,it))!==false;}
async function loadProductStock(){try{const {data,error}=await window.pixelSupabase.rpc("get_public_product_stock");if(error)throw error;stockMap.clear();(data||[]).forEach(r=>stockMap.set([r.game_id,r.category_name,r.product_name].join("||"),r.is_active!==false));}catch(e){console.warn("Status stok belum dimuat",e);}renderGames();if(activeGame){renderCategories();renderItems();}}
const $=id=>document.getElementById(id);
const money=n=>"Rp "+new Intl.NumberFormat("id-ID").format(n);
function searchTerm(){return ($("productSearch")?.value||"").trim().toLocaleLowerCase("id-ID")}
let activeStoreTab="topup";
function gameMatches(g,q){return !q||g.name.toLocaleLowerCase("id-ID").includes(q)||g.genre.toLocaleLowerCase("id-ID").includes(q)||g.categories.some(c=>c.name.toLocaleLowerCase("id-ID").includes(q)||c.items.some(it=>(it.name+" "+it.detail).toLocaleLowerCase("id-ID").includes(q)))}
function renderGames(){
 const q=searchTerm();
 const found=games.filter(g=>(activeStoreTab==="all"||g.kind===activeStoreTab)&&gameMatches(g,q));
 const safeText=v=>String(v??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
 $("gameGrid").innerHTML=found.map(g=>{
   const prices=g.categories.flatMap(c=>c.items.map(it=>Number(it.price)||0)).filter(n=>n>0);
   const startPrice=prices.length?Math.min(...prices):0;
   const original=Number(g.compareAtPrice)||0;
   const hasRealSale=original>startPrice&&startPrice>0;
   const discount=hasRealSale?Math.round((1-startPrice/original)*100):0;
   const metrics=[];
   if(Number.isFinite(Number(g.rating))&&Number(g.rating)>0)metrics.push(`<span class="product-meta-chip rating">★ ${Number(g.rating).toFixed(1)}</span>`);
   if(Number.isFinite(Number(g.soldCount))&&Number(g.soldCount)>=0&&g.soldCount!==undefined)metrics.push(`<span class="product-meta-chip sold">${Number(g.soldCount).toLocaleString("id-ID")} terjual</span>`);
   if(g.fulfillmentLabel)metrics.push(`<span class="product-meta-chip fast">${safeText(g.fulfillmentLabel)}</span>`);
   if(g.warrantyLabel)metrics.push(`<span class="product-meta-chip warranty">${safeText(g.warrantyLabel)}</span>`);
   return `<article class="game-card-wrap">
     <div class="game" style="--art:${g.art}" aria-label="Produk ${safeText(g.name)}">
       <div class="gameart"><img src="${safeText(g.image)}" alt="Artwork ${safeText(g.name)}" loading="lazy"><span class="game-badge">${safeText(g.icon)}</span>${hasRealSale?`<span class="real-sale-badge">-${discount}%</span>`:""}</div>
       <div class="gbody"><span class="game-kind">${g.kind==="premium"?"APPS PREMIUM":"TOP UP & DIGITAL"}</span><strong>${safeText(g.name)}</strong><small>${safeText(g.genre||"")}</small>
       <div class="product-meta-row">${metrics.length?metrics.join(""):'<span class="product-meta-chip neutral">Produk digital</span><span class="product-meta-chip neutral">Harga transparan</span>'}</div>
       <div class="game-price-line">${hasRealSale?`<del>${money(original)}</del><span class="real-saving">Hemat ${money(original-startPrice)}</span>`:""}</div>
       <div class="game-start-price">${startPrice?`Mulai ${money(startPrice)}`:"Lihat harga"}</div></div>
     </div><a class="game-buy-btn" href="checkout.html?game=${encodeURIComponent(g.id)}">🛒 Beli Sekarang</a></article>`
 }).join("")||`<div class="empty search-empty">Tidak ada game atau produk yang cocok dengan “${safeText(q)}”. Coba kata kunci lain.</div>`;
 // Animate each product card with a short stagger when the category changes or search updates.
 const cards=$("gameGrid").querySelectorAll(".game-card-wrap");
 cards.forEach((card,index)=>{
   card.style.setProperty("--card-index",Math.min(index,15));
   card.classList.remove("product-pop-in");
   void card.offsetWidth;
   card.classList.add("product-pop-in");
 });
 document.querySelectorAll("[data-store-tab]").forEach(b=>b.classList.toggle("active",b.dataset.storeTab===activeStoreTab));
 $("clearSearch").hidden=!q;
 $("searchHint").textContent=q?`${found.length} game cocok dengan pencarian “${q}”.`:"Cari nama game, diamond, VP, Robux, Welkin, dan item lainnya.";
}
function selectGame(id){activeGame=games.find(g=>g.id===id);activeCategory=activeGame.categories[0];activeItem=null;renderGames();renderCategories();renderItems();renderGameFields();$("itemHeading").textContent=activeGame.name;$("itemSub").textContent=`Pilih kategori dan item ${activeGame.name} yang kamu inginkan.`;$("summaryIcon").textContent=activeGame.icon;$("summaryGame").textContent=activeGame.name;const stage=$("shopStage");stage.classList.remove("is-locked");stage.classList.remove("reveal-swing");void stage.offsetWidth;stage.classList.add("reveal-swing");updateSummary();$("topup").scrollIntoView({behavior:"smooth",block:"start"});const art=$("selectedGameArt");art.innerHTML=`<img src="${activeGame.image}" alt="${activeGame.name}"><div><small>GAME DIPILIH</small><strong>${activeGame.name}</strong></div>`;art.classList.remove("art-enter");void art.offsetWidth;art.classList.add("art-enter")}
function renderCategories(){$("categoryBar").innerHTML=activeGame.categories.map((c,i)=>`<button class="item ${activeCategory===c?"selected":""}" data-cat="${i}"><strong>${c.name}</strong><small>${c.items.length} pilihan item</small></button>`).join("");document.querySelectorAll("[data-cat]").forEach(b=>b.addEventListener("click",()=>{activeCategory=activeGame.categories[Number(b.dataset.cat)];activeItem=null;renderCategories();renderItems();updateSummary()}))}
function renderItems(){const q=searchTerm();let list;if(q){list=activeGame.categories.flatMap((cat,ci)=>cat.items.map((it,ii)=>({it,cat,ci,ii}))).filter(x=>(x.it.name+" "+x.it.detail+" "+x.cat.name+" "+activeGame.name).toLocaleLowerCase("id-ID").includes(q))}else{list=activeCategory.items.map((it,ii)=>({it,cat:activeCategory,ci:activeGame.categories.indexOf(activeCategory),ii}))}$("itemGrid").innerHTML=list.map(x=>`<button class="item ${activeItem===x.it?"selected":""} ${isAvailable(activeGame,x.cat,x.it)?"":"stock-out"}" data-item="${x.ii}" data-item-cat="${x.ci}" ${isAvailable(activeGame,x.cat,x.it)?"":"disabled"}><strong>${x.it.name}</strong>${q?`<small>${x.cat.name}</small>`:x.it.detail?`<small>${x.it.detail}</small>`:""}<span class="price">${money(x.it.price)}</span>${isAvailable(activeGame,x.cat,x.it)?"":"<span class=\"stock-badge\">STOK HABIS</span>"}</button>`).join("")||`<div class="empty">Tidak ada produk yang cocok. Coba kata kunci lain atau pilih kategori berbeda.</div>`;document.querySelectorAll("[data-item]").forEach(b=>b.addEventListener("click",()=>{activeCategory=activeGame.categories[Number(b.dataset.itemCat)];activeItem=activeCategory.items[Number(b.dataset.item)];if(!isAvailable(activeGame,activeCategory,activeItem)){activeItem=null;toast("Produk sedang habis stok.");return}renderCategories();renderItems();updateSummary()}))}
const gameFieldConfig={
  ml:{label:"User ID",placeholder:"Masukkan User ID",server:true,serverLabel:"Zone ID",serverPlaceholder:"Masukkan Zone ID",hint:"Masukkan User ID dan Zone ID yang tertera di profil Mobile Legends."},
  ff:{label:"Player ID",placeholder:"Masukkan Player ID",server:false,hint:"Masukkan Player ID Free Fire."},
  valorant:{label:"Riot ID Anda",placeholder:"Contoh: NamaPemain#TAG",server:false,hint:"Masukkan Riot ID lengkap beserta #TAG. Jangan masukkan kata sandi akun Riot."},
  genshin:{label:"UID",placeholder:"Masukkan UID",server:true,serverLabel:"Server",serverType:"select",options:["Asia","America","Europe","TW, HK, MO"],serverPlaceholder:"Pilih server",hint:"Masukkan UID dan pilih server akun Genshin Impact."},
  roblox:{label:"Username Roblox",placeholder:"Contoh: FastPlayer99",server:false,hint:"Masukkan username Roblox saja. Jangan masukkan password atau kode backup di website."},
  mc:{label:"Username / detail akun",placeholder:"Masukkan username atau detail yang diperlukan",server:false,hint:"Untuk produk akun atau voucher Minecraft, admin akan mengonfirmasi detail yang diperlukan."},
  pubg:{label:"Player ID PUBG Mobile",placeholder:"Masukkan Player ID PUBG Mobile",server:false,hint:"Masukkan Player ID PUBG Mobile saja. Tidak perlu Server ID atau password akun."},
  "magic-chess":{label:"Player ID",placeholder:"Masukkan Player ID Magic Chess Go Go",server:false,hint:"Masukkan Player ID Magic Chess Go Go."},
  hok:{label:"Player ID",placeholder:"Masukkan Player ID Honor of Kings",server:false,hint:"Masukkan Player ID Honor of Kings."},
  hsr:{label:"UID",placeholder:"Masukkan UID Honkai: Star Rail",server:false,hint:"Masukkan UID Honkai: Star Rail."},
  "steam-wallet":{requiresId:false,note:true,hint:"Steam Wallet dikirim sebagai kode. ID game tidak diperlukan."},
  discord:{requiresId:false,note:true,hint:"Akun Discord atau Nitro tidak memerlukan ID game. Jangan tulis password email pribadi atau OTP."},
  "apps-premium":{requiresId:false,note:true,hint:"Tidak perlu ID game. Tulis catatan pengiriman bila diperlukan."}
};
function getGameFieldConfig(g=activeGame){return gameFieldConfig[g?.id]||(g?.kind==="premium"?gameFieldConfig["apps-premium"]:{});}
function renderGameFields(){
 const cfg=activeGame?getGameFieldConfig(activeGame):null;
 const player=$("playerId"), serverField=$("serverField"), server=$("serverId");
 player.value="";server.value="";if($("customerNote"))$("customerNote").value="";
 const needsId=!!cfg&&cfg.requiresId!==false;
 player.disabled=!needsId;player.hidden=!needsId;
 const playerLabel=document.querySelector('label[for="playerId"]');if(playerLabel)playerLabel.hidden=!needsId;
 player.placeholder=needsId?cfg.placeholder:"Tidak diperlukan";
 $("customerNoteWrap").hidden=!(cfg&&cfg.note);
 $("gameFieldHint").textContent=cfg?cfg.hint:"Kolom akan menyesuaikan dengan produk yang dipilih.";
 if(playerLabel)playerLabel.textContent=needsId?cfg.label.toUpperCase():"USER ID / USERNAME / UID";
 if(needsId&&cfg&&cfg.server){
   serverField.hidden=false;
   const label=$("serverLabel");label.textContent=cfg.serverLabel;
   if(cfg.serverType==="select"){
     const select=document.createElement("select");select.className="input";select.id="serverId";select.innerHTML='<option value="">Pilih server</option>'+cfg.options.map(x=>`<option value="${x}">${x}</option>`).join("");
     server.replaceWith(select);
   }else{
     const current=$("serverId");
     if(current.tagName!=="INPUT"){const input=document.createElement("input");input.className="input";input.id="serverId";input.autocomplete="off";current.replaceWith(input)}
     $("serverId").placeholder=cfg.serverPlaceholder||"Masukkan "+cfg.serverLabel;
   }
 }else{
   serverField.hidden=true;
   const current=$("serverId");
   if(current.tagName!=="INPUT"){const input=document.createElement("input");input.className="input";input.id="serverId";input.autocomplete="off";current.replaceWith(input)}
 }
 $("playerId").oninput=updateSummary;
 $("serverId").oninput=updateSummary;
 $("serverId").onchange=updateSummary;
 updateSummary();
}
function updateSummary(){
 window.PV_ACTIVE_GAME_ID=activeGame?(activeGame.stockGameId||activeGame.id):"";window.PV_ACTIVE_ITEM_NAME=activeItem?activeItem.name:"";
 $("summaryGame").textContent=activeGame?activeGame.name:"Belum pilih game";
 $("summaryCategory").textContent=activeCategory?activeCategory.name:"—";
 $("summaryItem").textContent=activeItem?activeItem.name:"—";
 $("summaryPrice").textContent=activeItem?money(activeItem.price):"Rp0";$("summaryPrice").dataset.raw=activeItem?String(activeItem.price):"0";if($("summaryFinalPrice")){const disc=window.PV_PROMO?window.PV_PROMO.getDiscount(activeItem?activeItem.price:0):0;$("summaryFinalPrice").textContent=money(Math.max(0,(activeItem?activeItem.price:0)-disc));}document.dispatchEvent(new Event("pv:summary-updated"));
 $("summaryUid").textContent=(getGameFieldConfig(activeGame).requiresId===false?($("customerNote")?.value.trim()?"Catatan ditambahkan":"Tidak diperlukan"):($("playerId").value.trim()||"Belum diisi"));
 $("summaryWa").textContent=$("waNumber").value.trim()||"Belum diisi";
 $("summaryPayment").textContent=selectedPayment();
}
$("waNumber").addEventListener("input",updateSummary);$("customerNote")?.addEventListener("input",updateSummary);
function selectedPayment(){return document.querySelector('input[name="paymentMethod"]:checked')?.value||"QRIS"}
async function refreshWalletPaymentOption(){const option=$("walletPaymentOption");if(!option||!window.pixelSupabase)return;try{const {data:{session}}=await window.pixelSupabase.auth.getSession();option.hidden=!session;if(!session&&selectedPayment()==="Saldo PixelValln"){document.querySelector('input[name="paymentMethod"][value="QRIS"]').checked=true;}if(session){const {data,error}=await window.pixelSupabase.rpc("get_customer_account_dashboard");if(error)throw error;const balance=Number(data?.balance||0);$("walletPaymentBalance").textContent="Saldo tersedia: "+money(balance);option.querySelector("input").disabled=false;}else{$("walletPaymentBalance").textContent="Login untuk melihat saldo";}}catch(err){console.warn("Saldo dompet belum bisa dimuat",err);option.hidden=true}}
refreshWalletPaymentOption();window.pixelSupabase?.auth.onAuthStateChange(()=>refreshWalletPaymentOption());
document.querySelectorAll('input[name="paymentMethod"]').forEach(input=>input.addEventListener("change",()=>{
  document.querySelectorAll(".payment-option").forEach(label=>label.classList.toggle("selected",label.querySelector("input")?.checked));
  updateSummary();
}));
// Make each payment tile reliably selectable by mouse, touch, or keyboard.
document.querySelectorAll(".payment-option").forEach(label=>{
  label.setAttribute("tabindex","0");
  label.setAttribute("role","radio");
  label.addEventListener("click",event=>{
    const input=label.querySelector('input[name="paymentMethod"]');
    if(!input||input.disabled||label.hidden)return;
    if(event.target!==input){input.checked=true;input.dispatchEvent(new Event("change",{bubbles:true}));}
  });
  label.addEventListener("keydown",event=>{
    if(event.key==="Enter"||event.key===" "){event.preventDefault();label.click();}
  });
});

function toast(s){$("toast").textContent=s;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2800)}
function buildOrderMessage(customer, paymentLabel, orderCode="Belum tersedia"){
 const robuxFiveDay=activeGame.id==="roblox"&&activeCategory.name.toLowerCase().includes("5 hari");
 return `Halo admin PixelValln SHOP! Saya ingin konfirmasi pesanan.

🛒 DETAIL PESANAN
🧾 Kode pesanan: ${orderCode}
🎮 Game: ${activeGame.name}
📦 Kategori: ${activeCategory.name}
💎 Item: ${activeItem.name}
💰 Total: ${money(activeItem.price)}
💳 Metode pembayaran: ${paymentLabel}
🆔 ${getGameFieldConfig(activeGame).label||"ID / Username"}: ${$("playerId").value.trim()}${getGameFieldConfig(activeGame).server?`\n🌐 ${getGameFieldConfig(activeGame).serverLabel}: ${$("serverId").value.trim()}`:""}
📱 Nomor WhatsApp saya: ${customer}${robuxFiveDay?"\n⏳ Layanan Robux 5 Hari — username saja, tanpa password.":""}

Saya sudah mengirim konfirmasi pembayaran. Mohon cek pembayaran dan verifikasi pesanan saya. Saya memahami status masih menunggu verifikasi admin. Terima kasih!`;
}
async function saveOrderToSupabase(customer){
 if(!window.pixelSupabase) throw new Error("Koneksi Supabase belum siap. Periksa supabase-client.js.");
 const gameUserId=(getGameFieldConfig(activeGame).requiresId===false?(($("customerNote")?.value.trim())?"Catatan pelanggan: "+$("customerNote").value.trim().slice(0,100):"Tidak diperlukan"):$ ("playerId").value.trim());
 const {data:{session}}=await window.pixelSupabase.auth.getSession();
 const promo=window.PV_PROMO?.applied||null;
 if(promo&&!session) throw new Error("Login terlebih dahulu untuk menggunakan kode promo.");
 const args={p_game_id:activeGame.stockGameId||activeGame.id,p_category_name:activeCategory.name,p_product_name:activeItem.name,p_game_user_id:gameUserId,p_game_server_id:$("serverId").value.trim(),p_customer_contact:customer,p_payment_method:selectedPayment()};
 let data,error;
 if(session){({data,error}=await window.pixelSupabase.rpc("create_authenticated_store_order_with_promo",{...args,p_promo_code:promo?.code||null}));}
 else {({data,error}=await window.pixelSupabase.rpc("create_public_store_order_with_access",args));}
 if(error) throw error;
 const row=Array.isArray(data)?data[0]:data;
 if(row&&promo){row.promo_code=promo.code;row.discount_amount=promo.discount_amount;}
 return row;
}
let pendingQrisCustomer="";
function closeQrisModal(){$("qrisPaymentModal").hidden=true;document.body.classList.remove("payment-modal-open")}
function showQrisModal(customer){pendingQrisCustomer=customer;$("qrisPaymentAmount").textContent=money(window.pendingStoreOrderAmount||activeItem.price);$("qrisPaymentModal").hidden=false;document.body.classList.add("payment-modal-open")}
$("checkoutBtn").addEventListener("click",async()=>{
 if(!activeGame){toast("Pilih game terlebih dahulu!");$("games").scrollIntoView({behavior:"smooth"});return}
 if(!activeItem){toast("Pilih kategori dan item terlebih dahulu!");return}
 const cfg=getGameFieldConfig(activeGame);
 const idValue=$("playerId").value.trim(),serverValue=$("serverId").value.trim();
 if(!isAvailable(activeGame,activeCategory,activeItem)){toast("Produk ini sedang habis stok.");return}
 if(cfg.requiresId!==false&&!idValue){toast("Isi "+(cfg.label||"ID/username")+" terlebih dahulu.");$("playerId").focus();return}
 if(cfg.server&&!serverValue){toast("Isi "+cfg.serverLabel+" terlebih dahulu.");$("serverId").focus();return}
 let wa=$("waNumber").value.trim(),digits=wa.replace(/\D/g,"");if(!digits||digits.length<9||digits.length>15){toast("Masukkan nomor WhatsApp yang valid.");$("waNumber").focus();return}
 const customer=digits.startsWith("0")?"62"+digits.slice(1):digits;
 const btn=$("checkoutBtn"); btn.disabled=true;
 try{
   const order=await saveOrderToSupabase(customer);
   window.pendingStoreOrderCode=order.order_code;
   window.pendingStoreOrderAmount=order.amount;
   rememberCustomerOrder(order, customer);
   if(selectedPayment()==="Saldo PixelValln") {
     showInlineOrderStatus(order.order_code, customer);
     toast("Pembayaran saldo berhasil. Pesanan: "+order.order_code);
     await refreshWalletPaymentOption();
     return;
   }
   if(selectedPayment()==="QRIS") {
     showQrisModal(customer);
     toast("Pesanan tersimpan: "+order.order_code);
     return;
   }
   // Tetap di halaman toko; tampilkan status otomatis setelah pesanan dibuat.
   showInlineOrderStatus(order.order_code, customer);
   toast("Pesanan tersimpan: "+order.order_code);
 }catch(err){console.error(err);toast("Pesanan belum tersimpan: "+(err.message||"Periksa koneksi Supabase"));}
 finally{btn.disabled=false}
});
$("closeQrisPayment").addEventListener("click",closeQrisModal);
document.querySelectorAll("[data-close-payment]").forEach(el=>el.addEventListener("click",closeQrisModal));
$("copyQrisAmount").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(String(window.pendingStoreOrderAmount||activeItem.price));toast("Nominal "+money(window.pendingStoreOrderAmount||activeItem.price)+" berhasil disalin.")}catch{toast("Nominal: "+money(activeItem.price)+". Silakan salin manual.")}});
$("qrisPaidBtn").addEventListener("click",()=>{
 if(!window.pendingStoreOrderCode){toast("Kode pesanan tidak ditemukan.");return}
 const code=window.pendingStoreOrderCode;
 const contact=pendingQrisCustomer;
 closeQrisModal();
 showInlineOrderStatus(code, contact);
});

function rememberCustomerOrder(order, contact){
 try {
   const key="pixelvalln_customer_orders";
   const list=JSON.parse(localStorage.getItem(key)||"[]");
   if(order.customer_access_token && !list.some(x=>x.customer_access_token===order.customer_access_token)) {
     list.push({customer_access_token:order.customer_access_token, code:order.order_code, contact, created_at:order.created_at||new Date().toISOString()});
     localStorage.setItem(key, JSON.stringify(list.slice(-50)));
   }
   // Keep last order for status recovery on this browser.
   localStorage.setItem("pixelvalln_last_order", JSON.stringify({code:order.order_code,contact}));
 } catch(e){ console.warn("Tidak dapat menyimpan sesi pesanan",e); }
}
let inlineOrderTimer=null;
function showInlineOrderStatus(code, contact){
 const overlay=$("pvOrderStatusOverlay");
 overlay.hidden=false;
 $("pvOrderCode").textContent=code;
 $("pvOrderStatusText").textContent="Menunggu verifikasi pembayaran oleh admin";
 $("pvOrderPaymentText").textContent="Menunggu verifikasi";
 $("pvOrderProgress").innerHTML="<span class='active'>● Pesanan dibuat</span><span>○ Sedang diproses</span><span>○ Pesanan selesai</span>";
 const refresh=()=>refreshInlineOrder(code,contact);
 refresh();
 if(inlineOrderTimer) clearInterval(inlineOrderTimer);
 inlineOrderTimer=setInterval(refresh,7000);
}
async function refreshInlineOrder(code,contact){
 try{
  const {data,error}=await window.pixelSupabase.rpc("get_public_order_status",{p_order_code:code,p_customer_contact:contact});
  if(error) throw error;
  const o=Array.isArray(data)?data[0]:data;
  if(!o){$("pvOrderStatusText").textContent="Pesanan belum ditemukan. Coba muat ulang beberapa saat lagi.";return}
  const os=String(o.order_status||"pending").toLowerCase();
  const ps=String(o.payment_status||"pending").toLowerCase();
  $("pvOrderGame").textContent=o.game_name||"—";
  $("pvOrderProduct").textContent=o.product_name||"—";
  $("pvOrderAmount").textContent=money(o.amount);
  $("pvOrderMethod").textContent=o.payment_method||"—";
  $("pvOrderBadge").textContent=os==="completed"?"Selesai":os==="processing"?"Sedang Diproses":os==="cancelled"?"Dibatalkan":ps==="verified"?"Pembayaran Terverifikasi":"Menunggu Pembayaran";
  $("pvOrderBadge").style.background=os==="completed"?"#dcfce7":os==="cancelled"?"#fee2e2":ps==="verified"?"#dbeafe":"#fff0cc";
  $("pvOrderBadge").style.color=os==="completed"?"#166534":os==="cancelled"?"#991b1b":ps==="verified"?"#1d4ed8":"#8a5a00";
  const paid=ps==="verified"||ps==="paid";
  const processing=["processing","completed"].includes(os);
  const completed=os==="completed"&&paid;
  $("pvOrderPaymentText").textContent=paid?"Pembayaran terverifikasi":"Menunggu verifikasi pembayaran";
  $("pvOrderStatusText").textContent=os==="cancelled"?"Pesanan dibatalkan":completed?"Pesanan selesai! Terima kasih sudah berbelanja.":processing?"Admin sudah memverifikasi pembayaran. Pesanan sedang diproses.":paid?"Pembayaran terverifikasi. Menunggu proses pesanan.":"Pesanan diterima. Menunggu verifikasi pembayaran oleh admin.";
  $("pvOrderProgress").innerHTML=`<span class="${paid?"active":""}">${paid?"●":"○"} Pembayaran ${paid?"terverifikasi":"menunggu"}</span><span class="${processing?"active":""}">${processing?"●":"○"} Sedang diproses</span><span class="${completed?"active":""}">${completed?"●":"○"} Pesanan selesai</span>`;
  const detailsWrap=$("pvDeliveredDetailsWrap");
  if(detailsWrap){
    const details=String(o.delivered_details||"").trim();
    detailsWrap.hidden=!(completed && details);
    $("pvDeliveredDetails").textContent=completed ? details : "";
  }
  if(completed){clearInterval(inlineOrderTimer);inlineOrderTimer=null;$("pvOrderReviewNote").hidden=false;}
 }catch(e){console.warn("Status pesanan belum dapat diperbarui",e);$("pvOrderStatusText").textContent="Status sedang dimuat. Akan diperbarui otomatis."}
}
$("pvOrderStatusClose").addEventListener("click",()=>{ $("pvOrderStatusOverlay").hidden=true; if(inlineOrderTimer){clearInterval(inlineOrderTimer);inlineOrderTimer=null;} });
$("zoomQrisBtn").addEventListener("click",()=>{$("qrisLightbox").hidden=false});
$("closeQrisLightbox").addEventListener("click",()=>{$("qrisLightbox").hidden=true});
$("qrisLightbox").addEventListener("click",e=>{if(e.target.id==="qrisLightbox")$("qrisLightbox").hidden=true});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeQrisModal();$("qrisLightbox").hidden=true}});
document.querySelectorAll("[data-store-tab]").forEach(btn=>btn.addEventListener("click",()=>{activeStoreTab=btn.dataset.storeTab;renderGames()}));
$("productSearch").addEventListener("input",()=>{renderGames();if(activeGame)renderItems()});
$("clearSearch").addEventListener("click",()=>{$("productSearch").value="";renderGames();if(activeGame)renderItems();$("productSearch").focus()});
$("year").textContent=new Date().getFullYear();renderGames();loadProductStock();
