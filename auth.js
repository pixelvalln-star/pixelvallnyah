/* PixelValln SHOP Auth — Supabase Auth
   Set SUPABASE_URL and SUPABASE_ANON_KEY in this file after creating your Supabase project.
   The anon/publishable key is intended for browser use; NEVER put service_role keys here.
*/
(() => {
  const SUPABASE_URL = "https://kanswxpnoyshrunyubmg.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_8wRxslScRKutbK2l5nPM0A_51AhnRPM";
  // Production origin must match Supabase Authentication → URL Configuration.
  const PRODUCTION_ORIGIN = "https://pixelvallnshop.my.id";
  const productionUrl = (path="") => `${PRODUCTION_ORIGIN}/${String(path).replace(/^\/+/, "")}`;
  const $ = (id) => document.getElementById(id);
  const modal = $("authModal");
  let currentUser = null;
  if (!modal) return;
  const configured = !SUPABASE_URL.includes("PASTE_") && !SUPABASE_ANON_KEY.includes("PASTE_");
  let supabase = null;
  if (window.supabase && configured) supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  let mode = "login"; // login | signup | verify | reset | update-password
  let pendingEmail = "";
  const msg = (text, error=false) => { $("authMessage").textContent = text; $("authMessage").classList.toggle("error", error); };
  const setMode = (next) => {
    mode = next; msg("");
    const titles = {login:["Selamat datang!","Login untuk melanjutkan petualanganmu.","Login"],signup:["Buat akun baru","Daftar dan verifikasi email kamu.","Kirim kode verifikasi"],verify:["Verifikasi email","Masukkan kode yang dikirim ke email kamu.","Verifikasi akun"],reset:["Reset password","Kami akan mengirim tautan reset ke email kamu.","Kirim tautan reset"],"update-password":["Password baru","Buat password baru minimal 8 karakter.","Simpan password"]};
    const [title,subtitle,button] = titles[next];
    $("authTitle").textContent=title; $("authSubtitle").textContent=subtitle; $("authSubmitBtn").textContent=button;
    $("authPasswordWrap").hidden = next === "verify";
    $("authOtpWrap").hidden = next !== "verify";
    $("authPassword").required = ["login","signup","update-password"].includes(next);
    $("authPassword").value = ""; $("authOtp").value = "";
    $("forgotPasswordBtn").hidden = !["login"].includes(next);
    $("authSwitchText").hidden = !["login","signup"].includes(next);
    $("authSwitchText").innerHTML = next === "signup" ? 'Sudah punya akun? <button type="button" id="switchAuthBtn">Login</button>' : 'Belum punya akun? <button type="button" id="switchAuthBtn">Daftar sekarang</button>';
    $("switchAuthBtn")?.addEventListener("click",()=>setMode(mode === "login" ? "signup" : "login"));
  };
  const open = (next="login") => { modal.hidden=false; document.body.style.overflow="hidden"; setMode(next); if(!configured) msg("Setup Supabase belum selesai. Ikuti README-SETUP-AUTH.txt terlebih dahulu.",true); };
  const close = () => { modal.hidden=true; document.body.style.overflow=""; };
  $("openAuthBtn")?.addEventListener("click",()=>{ if(currentUser){ location.href="akun.html"; return; } open("login"); });
  $("closeAuthBtn")?.addEventListener("click",close);
  modal.querySelector("[data-close-auth]")?.addEventListener("click",close);
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!modal.hidden)close()});
  $("forgotPasswordBtn")?.addEventListener("click",()=>setMode("reset"));
  $("logoutBtn")?.addEventListener("click",async()=>{if(supabase) await supabase.auth.signOut(); updateUser(null); msg("");});
  function updateUser(user){
    const openBtn=$("openAuthBtn"), logout=$("logoutBtn");
    currentUser = user || null;
    if(user){
      const name=(user.email||"Akun").split("@")[0];const avatar=user.user_metadata?.avatar_url;
      openBtn.classList.add("account-avatar-link");openBtn.setAttribute("aria-label","Buka akun saya");openBtn.title=(user.email||"Akun aktif")+" · Buka akun";
      openBtn.innerHTML=avatar?`<img src="${String(avatar).replace(/[&<>\"']/g,"")}" alt="Foto profil">`:`<span class="avatar-initial">${name.charAt(0).toUpperCase()}</span>`;logout.hidden=false;
    } else {openBtn.classList.remove("account-avatar-link");openBtn.removeAttribute("aria-label");openBtn.textContent="Login / Daftar";openBtn.title="Login atau daftar akun";logout.hidden=true;}
  }
  async function refreshSession(){
    if(!supabase)return;
    const {data:{session}}=await supabase.auth.getSession(); updateUser(session?.user||null);
    supabase.auth.onAuthStateChange((_event,session)=>updateUser(session?.user||null));
  }
  $("authForm")?.addEventListener("submit",async e=>{
    e.preventDefault();
    const email=$("authEmail").value.trim().toLowerCase();
    const password=$("authPassword").value;
    const otp=$("authOtp").value.trim();
    if(!configured){msg("Isi SUPABASE_URL dan SUPABASE_ANON_KEY di auth.js terlebih dahulu.",true);return;}
    const btn=$("authSubmitBtn"); btn.disabled=true; const old=btn.textContent; btn.textContent="Memproses…";
    try{
      if(mode==="signup"){
        pendingEmail=email;
        const {error}=await supabase.auth.signUp({email,password,options:{emailRedirectTo:productionUrl("")}});
        if(error)throw error;
        setMode("verify"); $("authEmail").value=email; msg("Permintaan pendaftaran dikirim. Periksa email untuk kode verifikasi. Jika email hanya berisi tautan, ubah template Confirm signup menjadi kode OTP sesuai README.");
      } else if(mode==="verify"){
        const {data,error}=await supabase.auth.verifyOtp({email:pendingEmail||email,token:otp,type:"signup"});
        if(error)throw error;
        updateUser(data.user); msg("Email berhasil diverifikasi. Kamu sudah bisa login."); setTimeout(()=>setMode("login"),1300);
      } else if(mode==="login"){
        const {data,error}=await supabase.auth.signInWithPassword({email,password}); if(error)throw error;
        updateUser(data.user); msg("Login berhasil. Selamat berbelanja!"); setTimeout(close,900);
      } else if(mode==="reset"){
        const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:productionUrl("index.html?reset-password=1")}); if(error)throw error;
        msg("Jika email terdaftar, tautan reset password akan dikirim. Periksa inbox dan folder spam.");
      } else if(mode==="update-password"){
        const {error}=await supabase.auth.updateUser({password}); if(error)throw error;
        msg("Password berhasil diperbarui. Silakan login kembali."); setTimeout(()=>setMode("login"),1200);
      }
    }catch(err){msg(err.message||"Terjadi kesalahan. Coba lagi.",true)}
    finally{btn.disabled=false;btn.textContent=old;}
  });
  async function init(){
    if(!configured){$("openAuthBtn").title="Perlu konfigurasi Supabase";return;}
    if(!window.supabase){msg("Library autentikasi gagal dimuat. Periksa koneksi internet.",true);return;}
    supabase=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
    await refreshSession();
    if(new URLSearchParams(location.search).get("reset-password")==="1"){open("update-password");} else if(new URLSearchParams(location.search).get("login")==="1"){open("login");}
  }
  init();
})();
