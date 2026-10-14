PixelValln SHOP — Dashboard Pelanggan, Wallet & Promo

PENTING: sebelum upload website, buka Supabase SQL Editor dan jalankan supabase-akun-wallet-promo.sql. Backup database terlebih dahulu.

Fitur yang disiapkan:
- akun.html: dashboard, riwayat transaksi, isi saldo, mutasi saldo, edit profil, ubah password.
- promo-checkout.js + form kode promo pada checkout. Promo hanya untuk pelanggan login dan harus tervalidasi oleh database.
- auth.js: signup/reset diarahkan ke https://pixelvallnshop.my.id/. Tombol akun membuka dashboard saat sudah login.
- supabase-akun-wallet-promo.sql: tabel profil, promo, top-up wallet, ledger, dan RPC dengan pemeriksaan auth.

CATATAN PEMBAYARAN:
- QRIS yang ada di website masih QRIS statis; pembayaran belum terverifikasi otomatis. Admin harus memeriksa bukti/transaksi sebelum memanggil admin_review_wallet_topup dari sesi admin di SQL Editor atau sebelum fitur review wallet ditambahkan ke admin panel. Jangan menyetujui top-up hanya berdasarkan screenshot pelanggan.
- Promo contoh VALLN10 memberikan diskon 10% dengan minimal belanja Rp10.000 dan batas diskon Rp20.000. Edit/hapus promo ini di tabel store_promos jika tidak diinginkan.
- Pesanan lama yang user_id-nya NULL tidak dapat ditampilkan sebagai pesanan akun pelanggan. Pesanan baru yang dibuat setelah login akan tertaut ke user_id.
- Guest checkout tetap tersedia tanpa promo; promo membutuhkan login.
- Periksa kebijakan RLS dan backup sebelum menerapkan di production.
