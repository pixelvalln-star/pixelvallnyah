-- PixelValln SHOP: fix ambiguous `amount` reference in authenticated checkout.
-- Run this file in Supabase SQL Editor; it replaces only the checkout RPC.

create or replace function public.create_authenticated_store_order_with_promo(
 p_game_id text,p_category_name text,p_product_name text,p_game_user_id text,p_game_server_id text,p_customer_contact text,p_payment_method text,p_promo_code text default null
) returns table(order_code text,amount bigint,subtotal bigint,discount_amount bigint,promo_code text)
language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_product public.store_products%rowtype; v_code text; v_discount bigint:=0; v_promo public.store_promos%rowtype; v_amount bigint; v_balance bigint;
begin
 if v_user is null then raise exception 'Login diperlukan untuk membuat pesanan akun'; end if;
 if length(trim(coalesce(p_game_user_id,''))) not between 1 and 120 then raise exception 'ID pemain atau catatan tidak valid'; end if;
 if length(regexp_replace(coalesce(p_customer_contact,''),'\D','','g')) not between 9 and 20 then raise exception 'Nomor kontak tidak valid'; end if;
 if p_payment_method not in ('QRIS','GoPay','DANA','OVO','Transfer Bank','ShopeePay','Lainnya','Saldo PixelValln') then raise exception 'Metode pembayaran tidak valid'; end if;
 select * into v_product from public.store_products where game_id=p_game_id and category_name=p_category_name and product_name=p_product_name and is_active=true;
 if not found then raise exception 'Produk tidak ditemukan atau tidak aktif'; end if;
 if nullif(trim(coalesce(p_promo_code,'')),'') is not null then
   select * into v_promo from public.store_promos where code=upper(trim(p_promo_code)) and is_active=true and starts_at<=now() and (ends_at is null or ends_at>=now()) and (max_uses is null or used_count<max_uses) for update;
   if not found then raise exception 'Kode promo tidak valid atau sudah kedaluwarsa'; end if;
   if v_product.price<v_promo.min_subtotal then raise exception 'Belanja belum memenuhi minimal promo'; end if;
   if v_promo.game_ids is not null and not (p_game_id=any(v_promo.game_ids)) then raise exception 'Promo tidak berlaku untuk game ini'; end if;
   if v_promo.product_keyword is not null and position(lower(v_promo.product_keyword) in lower(p_product_name))=0 then raise exception 'Promo tidak berlaku untuk produk ini'; end if;
   v_discount:=case when v_promo.discount_type='percent' then floor(v_product.price*v_promo.discount_value/100.0)::bigint else v_promo.discount_value end;
   if v_promo.max_discount is not null then v_discount:=least(v_discount,v_promo.max_discount); end if;
   v_discount:=least(greatest(v_discount,0),v_product.price);
 end if;
 v_amount:=greatest(0,v_product.price-v_discount);
 if p_payment_method='Saldo PixelValln' then
   -- Serialize wallet spends per account to prevent simultaneous purchases overspending the same balance.
   insert into public.customer_profiles(user_id,username,full_name) select v_user,split_part(coalesce(u.email,''),'@',1),split_part(coalesce(u.email,''),'@',1) from auth.users u where u.id=v_user on conflict(user_id) do nothing;
   perform 1 from public.customer_profiles where user_id=v_user for update;
   select coalesce(sum(wl.amount),0) into v_balance from public.wallet_ledger as wl where wl.user_id=v_user;
   if v_balance<v_amount then raise exception 'Saldo tidak cukup. Saldo kamu %; total pesanan %.',v_balance,v_amount; end if;
 end if;
 v_code:='PV-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10));
 insert into public.orders(order_code,user_id,customer_name,customer_contact,game_id,game_name,product_name,game_user_id,game_server_id,amount,subtotal,discount_amount,promo_code,payment_method,payment_status,order_status)
 values(v_code,v_user,null,trim(p_customer_contact),p_game_id,v_product.game_name,v_product.category_name||' — '||v_product.product_name,trim(p_game_user_id),nullif(trim(coalesce(p_game_server_id,'')),''),v_amount,v_product.price,v_discount,nullif(upper(trim(coalesce(p_promo_code,''))),''),p_payment_method,case when p_payment_method='Saldo PixelValln' then 'verified' else 'pending' end,'pending');
 if p_payment_method='Saldo PixelValln' then
   insert into public.wallet_ledger(user_id,transaction_type,description,amount) values(v_user,'purchase','Pembayaran pesanan '||v_code,-v_amount);
 end if;
 if v_promo.id is not null then update public.store_promos set used_count=used_count+1 where id=v_promo.id; end if;
 return query select v_code,v_amount,v_product.price,v_discount,nullif(upper(trim(coalesce(p_promo_code,''))),'');
end $$;
revoke all on function public.create_authenticated_store_order_with_promo(text,text,text,text,text,text,text,text) from public; grant execute on function public.create_authenticated_store_order_with_promo(text,text,text,text,text,text,text,text) to authenticated;

