// Supabase client bersama untuk checkout dan fitur toko.
(() => {
  const SUPABASE_URL = "https://kanswxpnoyshrunyubmg.supabase.co";
  const SUPABASE_KEY = "sb_publishable_8wRxslScRKutbK2l5nPM0A_51AhnRPM";

  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error("Supabase JS gagal dimuat. Periksa koneksi internet/CDN.");
    return;
  }

  window.pixelSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );
})();
