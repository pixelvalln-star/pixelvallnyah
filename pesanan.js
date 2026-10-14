(() => {
"use strict";
const SUPABASE_URL="https://kanswxpnoyshrunyubmg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY="sb_publishable_8wRxslScRKutbK2l5nPM0A_51AhnRPM";
const client=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
const $=id=>document.getElementById(id);
const money=n=>"Rp "+new Intl.NumberFormat("id-ID").format(Number(n||0));
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const normalizePhone=v=>String(v||"").replace(/\D/g,"").replace(/^0/,"62");
const statusLabel=v=>({pending:"Menunggu",processing:"Sedang Diproses",completed:"Selesai",cancelled:"Dibatalkan",verified:"Terverifikasi"}[String(v||"").toLowerCase()]||String(v||"Menunggu"));
function showError(message){$("trackingResult").innerHTML=`<div class="tracking-error">${esc(message)}</div>`}
function renderOrder(o){
 const orderStatus=String(o.order_status||"pending").toLowerCase();
 const paymentStatus=String(o.payment_status||"pending").toLowerCase();
 const timeline=[{label:"Pesanan Dibuat",active:true},{label:"Sedang Diproses",active:["processing","completed"].includes(orderStatus)},{label:"Pesanan Selesai",active:orderStatus==="completed"}];
 $("trackingResult").innerHTML=`<section class="tracking-card" style="padding:20px;margin-top:12px"><div class="order-head"><div><div class="kicker">DETAIL PESANAN</div><div class="order-code">${esc(o.order_code)}</div></div><span class="status-badge">${esc(statusLabel(orderStatus))}</span></div><div class="tracking-grid"><div class="tracking-item"><span>Game</span><strong>${esc(o.game_name||"—")}</strong></div><div class="tracking-item"><span>Produk</span><strong>${esc(o.product_name||"—")}</strong></div><div class="tracking-item"><span>Total</span><strong>${money(o.amount)}</strong></div><div class="tracking-item"><span>Metode Pembayaran</span><strong>${esc(o.payment_method||"—")}</strong></div><div class="tracking-item"><span>Status Pembayaran</span><strong>${esc(statusLabel(paymentStatus))}</strong></div><div class="tracking-item"><span>Dibuat</span><strong>${esc(o.created_at?new Date(o.created_at).toLocaleString("id-ID"):"—")}</strong></div></div><div class="timeline">${timeline.map(s=>`<div class="timeline-step ${s.active?"active":""}">${s.active?"●":"○"} ${s.label}</div>`).join("")}</div><p class="tracking-note">${orderStatus==="completed"?"Pesanan selesai. Terima kasih sudah berbelanja di PixelValln SHOP!":orderStatus==="cancelled"?"Pesanan ini dibatalkan. Jika merasa ini keliru, hubungi dukungan toko melalui kanal resmi yang tersedia.":paymentStatus==="pending"?"Pesanan tercatat dan menunggu verifikasi pembayaran oleh admin.":"Pesanan sedang ditangani. Status ini akan berubah setelah admin memperbarui pesanan."}</p><div class="tracking-actions"><button class="btn btn-ghost" type="button" id="refreshOrder">Perbarui Status</button><a class="btn btn-main" href="index.html#games">Buat Pesanan Baru</a></div></section>`;
 $("refreshOrder").addEventListener("click",()=>lookupOrder(o.order_code,$("orderContact").value));
}
async function lookupOrder(code,contact){
 const btn=$("trackBtn"); if(btn) btn.disabled=true;
 $("trackingResult").innerHTML="<p class='tracking-note'>Memeriksa pesanan…</p>";
 try{
  const normalizedCode=String(code||"").trim().toUpperCase();
  const normalizedContact=normalizePhone(contact);
  if(!/^PV-[A-Z0-9]{6,16}$/.test(normalizedCode)) throw new Error("Format kode pesanan tidak sesuai.");
  if(normalizedContact.length<9||normalizedContact.length>15) throw new Error("Nomor kontak tidak valid.");
  const {data,error}=await client.rpc("get_public_order_status",{p_order_code:normalizedCode,p_customer_contact:normalizedContact});
  if(error) throw error;
  const order=Array.isArray(data)?data[0]:data;
  if(!order) throw new Error("Pesanan tidak ditemukan. Periksa kembali kode pesanan dan nomor kontak.");
  renderOrder(order);
 }catch(err){showError(err.message||"Gagal memuat pesanan. Coba lagi.")}
 finally{if(btn) btn.disabled=false}
}
$("trackingForm").addEventListener("submit",e=>{e.preventDefault();lookupOrder($("orderCode").value,$("orderContact").value)});
$("year").textContent=new Date().getFullYear();
try{const params=new URLSearchParams(location.search);const code=params.get("code");if(code){$("orderCode").value=code;const last=JSON.parse(sessionStorage.getItem("pixelvalln_last_order")||"null");if(last&&last.code===code){$("orderContact").value=last.contact||"";if(last.contact) lookupOrder(code,last.contact)}}}catch{}
})();