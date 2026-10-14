PixelValln SHOP — Saldo checkout dan foto profil

Perubahan:
- Metode pembayaran baru: Saldo PixelValln. Opsi hanya tampil untuk pelanggan yang login.
- Database memeriksa saldo di server. Jika saldo cukup, total pesanan langsung dipotong dari wallet_ledger dan payment_status menjadi verified. Jika saldo tidak cukup, transaksi ditolak.
- Foto profil bisa diunggah dari halaman akun; format JPG/PNG/WebP, maksimal 3 MB.
- Foto profil tersimpan di Supabase Storage bucket profile-avatars dan URL disimpan pada customer_profiles.avatar_url.
- Tombol akun di navbar berubah menjadi foto profil (atau inisial jika belum mengunggah foto).

Pemasangan:
1. Cadangkan repository dan database.
2. Salin file website dari ZIP ini ke repository dengan mempertahankan struktur file.
3. Buka Supabase > SQL Editor dan jalankan ulang seluruh file supabase-akun-wallet-promo.sql yang sudah diperbarui.
4. Pastikan fungsi create_authenticated_store_order_with_promo dan update_customer_avatar berhasil dibuat.
5. Tunggu GitHub Pages selesai deploy, lalu lakukan hard refresh browser.
6. Uji upload avatar menggunakan akun pelanggan, kemudian buat pesanan dengan metode Saldo PixelValln. Coba juga akun dengan saldo tidak cukup untuk memastikan transaksi ditolak.

Catatan:
- Tidak ada pembayaran saldo untuk pelanggan yang belum login.
- Saldo hanya berasal dari wallet_ledger; jangan mengubah saldo langsung dari browser.
- Pembayaran isi saldo eksternal masih perlu diverifikasi admin sebelum dana ditambahkan.
- Jangan pernah memasukkan service_role key ke file JavaScript browser.


## Perbaikan checkout saldo (error `amount` is ambiguous)
Jika checkout dengan Saldo PixelValln menampilkan `column reference "amount" is ambiguous`, jalankan file `fix-wallet-amount-ambiguity.sql` di Supabase → SQL Editor. File ini mengganti RPC checkout yang sama dengan versi yang mengacu eksplisit ke `wallet_ledger.amount`. Tidak perlu menjalankan seluruh SQL migrasi lagi hanya untuk error ini.

Logo Saldo PixelValln menggunakan `lg.png` dan opsi saldo diletakkan tepat setelah QRIS. Nominal saldo dimuat dari `get_customer_account_dashboard` setelah pelanggan login.
