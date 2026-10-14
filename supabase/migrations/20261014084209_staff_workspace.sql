-- Only approved staff can read data. All writes go through validated operations.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;
create table public.staff_members (
 user_id uuid primary key references auth.users(id) on delete cascade,
 active boolean not null default true
);
alter table public.staff_members enable row level security;
revoke all on public.staff_members from anon, authenticated;
grant select on public.staff_members to authenticated;
create policy own_membership on public.staff_members for select to authenticated using (user_id = (select auth.uid()));
create function private.is_staff() returns boolean language sql stable security invoker set search_path = '' as $$
 select exists(select 1 from public.staff_members where user_id = auth.uid() and active)
$$;
revoke all on function private.is_staff() from public, anon;
grant execute on function private.is_staff() to authenticated;
create table public.menu_items (
 id integer primary key, name text not null, category text not null, description text not null,
 art text not null, price_paise integer not null check(price_paise > 0),
 options text[] not null default '{}', syrup boolean not null default false,
 available boolean not null default true, sort_order integer not null
);
create table public.addons (name text primary key, price_paise integer not null check(price_paise >= 0));
create table public.orders (
 id bigint generated always as identity primary key,
 request_id uuid not null unique, request_payload jsonb not null,
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 status text not null default 'Queued' check(status in ('Queued','Preparing','Ready','Collected')),
 version integer not null default 1, payment text not null check(payment in ('UPI','Cash')),
 note text not null default '' check(length(note) <= 200), total_paise integer not null default 0 check(total_paise >= 0)
);
create table public.order_items (
 id bigint generated always as identity primary key, order_id bigint not null references public.orders(id),
 menu_item_id integer not null references public.menu_items(id), name text not null,
 option text not null, addon text not null, quantity integer not null check(quantity between 1 and 99),
 unit_price_paise integer not null check(unit_price_paise > 0), addon_price_paise integer not null check(addon_price_paise >= 0)
);
create index order_items_order_idx on public.order_items(order_id);
create index orders_created_idx on public.orders(created_at desc);
create table public.order_events (
 mutation_id uuid primary key, order_id bigint not null references public.orders(id),
 actor_id uuid not null references auth.users(id), from_status text not null, to_status text not null,
 expected_version integer not null, version integer not null, created_at timestamptz not null default now()
);
create index order_events_order_idx on public.order_events(order_id);
do $$ declare t text; begin
 foreach t in array array['menu_items','addons','orders','order_items','order_events'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 execute format('create policy staff_read on public.%I for select to authenticated using ((select private.is_staff()))',t);
 end loop;
end $$;
-- These private functions deliberately own the write privilege. Their public
-- wrappers are invokers; anonymous callers have no EXECUTE permission.
create function private.create_order(p_request_id uuid, p_lines jsonb, p_payment text, p_note text)
returns bigint language plpgsql security definer set search_path = '' as $$
declare
 o public.orders; m public.menu_items; l jsonb; payload jsonb;
 qty integer; opt text; addon text; extra integer; amount integer := 0;
begin
 if auth.uid() is null or not private.is_staff() then raise exception 'Staff access required' using errcode='42501'; end if;
 if p_request_id is null then raise exception 'Request ID required'; end if;
 payload := jsonb_build_object('lines',p_lines,'payment',p_payment,'note',p_note);
 perform pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));
 select * into o from public.orders where request_id=p_request_id;
 if found then
   if o.created_by <> auth.uid() or o.request_payload <> payload then raise exception 'Request already used with different details'; end if;
   return o.id;
 end if;
 if p_payment is null or p_payment not in ('UPI','Cash') or p_note is null or length(p_note)>200 then raise exception 'Invalid payment or note'; end if;
 if p_lines is null or jsonb_typeof(p_lines)<>'array' then raise exception 'Invalid order lines'; end if;
 if jsonb_array_length(p_lines) not between 1 and 100 then raise exception 'Order must contain 1 to 100 lines'; end if;
 insert into public.orders(request_id,request_payload,created_by,payment,note)
 values(p_request_id,payload,auth.uid(),p_payment,p_note) returning * into o;
 for l in select value from jsonb_array_elements(p_lines) loop
  select * into m from public.menu_items where id=(l->>'item_id')::integer and available;
  if not found then raise exception 'Item unavailable'; end if;
  if coalesce(l->>'quantity','') !~ '^[0-9]+$' then raise exception 'Invalid quantity'; end if;
  qty := (l->>'quantity')::integer; opt := coalesce(l->>'option',''); addon := coalesce(l->>'addon','None');
  if qty not between 1 and 99 then raise exception 'Quantity must be between 1 and 99'; end if;
  if not opt=any(m.options) then raise exception 'Invalid serving option for %',m.name; end if;
  select price_paise into extra from public.addons where name=addon;
  if not found or (addon<>'None' and not m.syrup) then raise exception 'Invalid add-on'; end if;
  insert into public.order_items(order_id,menu_item_id,name,option,addon,quantity,unit_price_paise,addon_price_paise)
  values(o.id,m.id,m.name,opt,addon,qty,m.price_paise,extra);
  amount := amount + (m.price_paise+extra)*qty;
 end loop;
 update public.orders set total_paise=amount where id=o.id;
 return o.id;
end $$;
create function public.create_order(p_request_id uuid,p_lines jsonb,p_payment text,p_note text)
returns bigint language sql security invoker set search_path='' as $$ select private.create_order(p_request_id,p_lines,p_payment,p_note) $$;
create function private.move_order(p_order_id bigint,p_expected_version integer,p_status text,p_mutation_id uuid)
returns public.orders language plpgsql security definer set search_path='' as $$
declare o public.orders; e public.order_events;
begin
 if auth.uid() is null or not private.is_staff() then raise exception 'Staff access required' using errcode='42501'; end if;
 if p_mutation_id is null or p_expected_version is null or p_status is null or p_status not in ('Queued','Preparing','Ready','Collected') then raise exception 'Invalid state change'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_mutation_id::text,1));
 select * into o from public.orders where id=p_order_id for update;
 if not found then raise exception 'Order not found'; end if;
 select * into e from public.order_events where mutation_id=p_mutation_id;
 if found then
  if e.order_id<>p_order_id or e.actor_id<>auth.uid() or e.to_status<>p_status or e.expected_version<>p_expected_version then raise exception 'Mutation ID already used'; end if;
  return o;
 end if;
 if o.version<>p_expected_version then raise exception 'Order changed on another device. Refresh and try again.' using errcode='40001'; end if;
 if o.status=p_status then return o; end if;
 insert into public.order_events(mutation_id,order_id,actor_id,from_status,to_status,expected_version,version)
 values(p_mutation_id,o.id,auth.uid(),o.status,p_status,p_expected_version,o.version+1);
 update public.orders set status=p_status,version=version+1,updated_at=now() where id=o.id returning * into o;
 return o;
end $$;
create function public.move_order(p_order_id bigint,p_expected_version integer,p_status text,p_mutation_id uuid)
returns public.orders language sql security invoker set search_path='' as $$ select private.move_order(p_order_id,p_expected_version,p_status,p_mutation_id) $$;
revoke all on function private.create_order(uuid,jsonb,text,text), public.create_order(uuid,jsonb,text,text), private.move_order(bigint,integer,text,uuid), public.move_order(bigint,integer,text,uuid) from public,anon;
grant execute on function private.create_order(uuid,jsonb,text,text), public.create_order(uuid,jsonb,text,text), private.move_order(bigint,integer,text,uuid), public.move_order(bigint,integer,text,uuid) to authenticated;

insert into public.menu_items(id,name,category,description,art,price_paise,options,syrup,sort_order) values
(0,'Americano','Classics','Espresso, beautifully simple.','americano',14900,ARRAY['Hot','Iced'],true,0),
(1,'Cappuccino','Classics','Coffee beneath a soft milk foam.','cappuccino',17900,ARRAY['Hot','Iced'],true,1),
(2,'Latte','Classics','Espresso & silky milk.','latte',17900,ARRAY['Hot','Iced'],true,2),
(3,'Mocha','Classics','Coffee meets chocolate.','mocha',18900,ARRAY['Hot','Iced'],true,3),
(4,'OG Cold Coffee','Classics','The familiar favourite, served cold.','cold-coffee',18900,ARRAY['Cold'],true,4),
(8,'Strawberry Iced Latte','Signature','Espresso, milk & strawberry crush.','strawberry-latte',23900,ARRAY['Cold'],false,5),
(5,'Vietnamese Latte','Signature','Espresso, sweetened with condensed milk.','vietnamese',23900,ARRAY['Hot','Cold'],false,6),
(6,'Pop-corn Latte','Signature','Espresso, milk, caramel popcorn & a cloud.','popcorn',24900,ARRAY['Hot','Iced'],false,7),
(7,'Tiramisu Latte','Signature','Espresso, milk, tiramisu cloud & cocoa.','tiramisu',24900,ARRAY['Hot','Iced'],false,8),
(33,'Sunrise Iced Americano','Signature','Espresso & orange juice.','sunrise',23900,ARRAY['Cold'],false,9),
(9,'Cranberry Fizz Espresso','Signature','Cranberry & Sprite topped with espresso over ice.','cranberry-espresso',24900,ARRAY['Cold'],false,10),
(10,'Fridge Cigarette','Signature','Espresso, fizzy Diet Coke & silky vanilla cold foam.','fridge-cigarette',24900,ARRAY['Cold'],false,11),
(11,'Matcha Latte','Matcha','Earthy matcha meets milk.','hot-matcha',21900,ARRAY['Hot'],false,12),
(12,'Iced Matcha Latte','Matcha','Matcha & milk, over ice.','iced-matcha',23900,ARRAY['Cold'],false,13),
(13,'Strawberry Iced Matcha Latte','Matcha','Strawberry, milk & matcha.','strawberry-matcha',25900,ARRAY['Cold'],false,14),
(14,'Salted Caramel Iced Matcha Latte','Matcha','Matcha with salted caramel.','caramel-matcha',25900,ARRAY['Cold'],false,15),
(15,'Nolen Gur Cloud Iced Latte','Pujo specials','Espresso, milk, topped with nolen gur cloud.','gur-cloud',25900,ARRAY['Cold'],false,16),
(16,'Nolen Gur Latte','Pujo specials','Espresso & milk, sweetened with nolen gur.','gur-latte',24900,ARRAY['Hot','Iced'],false,17),
(17,'Kachha Aamer Shorbot','Pujo specials','Raw mango syrup, mint, desi spices & soda.','mango-shorbot',17900,ARRAY['Cold'],false,18),
(18,'Jamun Fizz','Mocktails','Spiced jamun syrup, lime & soda.','jamun',17900,ARRAY['Cold'],false,19),
(19,'Virgin Mojito','Mocktails','Fresh mint, lime & soda.','mojito',17900,ARRAY['Cold'],false,20),
(20,'Orange Sunset','Mocktails','Orange, citrus, cranberry & soda.','sunset',17900,ARRAY['Cold'],false,21),
(21,'Masala Coke / Diet Coke','Mocktails','Chilled coke with our signature spice mix.','masala-cola',17900,ARRAY['Coke','Diet Coke'],false,22),
(22,'Strawberry Lemonade','Mocktails','Strawberry crush, lemon & soda.','strawberry-lemonade',17900,ARRAY['Cold'],false,23),
(23,'Classic Fries','Fries','Golden, crisp & lightly salted.','fries',14900,ARRAY[''],false,24),
(24,'Peri Peri Fries','Fries','Golden fries with a little heat.','peri-fries',16900,ARRAY[''],false,25),
(25,'Loaded Cheesy Fries','Fries','Crisp fries, generously cheesy.','cheesy',22900,ARRAY[''],false,26),
(26,'Veg Momo','Momo','Vegetable-filled little parcels.','momo-veg',14900,ARRAY['Steamed','Fried'],false,27),
(27,'Paneer Momo','Momo','Paneer-filled little parcels.','momo-paneer',16900,ARRAY['Steamed','Fried'],false,28),
(28,'Chicken Momo','Momo','Chicken-filled little parcels.','momo-chicken',17900,ARRAY['Steamed','Fried'],false,29),
(29,'Crispy Veg Cigar Rolls','Cigar rolls','Crisp rolls with a vegetable filling.','rolls-veg',17900,ARRAY[''],false,30),
(30,'Crispy Chicken Cigar Rolls','Cigar rolls','Crisp rolls with a chicken filling.','rolls-chicken',19900,ARRAY[''],false,31),
(31,'Veg Falafel Pita','Pita pockets','Falafel tucked into a soft pita.','pita-falafel',19900,ARRAY[''],false,32),
(32,'Chicken Shami Kebab Pita','Pita pockets','Chicken shami kebab in a soft pita.','pita-chicken',22900,ARRAY[''],false,33);
insert into public.addons(name,price_paise) values ('None',0),('Hazelnut',3000),('Tiramisu',3000),('Salted Caramel',3000),('Popcorn Syrup',3000),('Vanilla',3000);
