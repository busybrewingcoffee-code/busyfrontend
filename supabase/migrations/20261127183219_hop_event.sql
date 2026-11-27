-- Horn OK Please event. Additive only: every existing row becomes event 'pujo'
-- and keeps its values. HOP gets its own menu rows, ticket numbers and checkout.
alter table public.menu_items add column event text not null default 'pujo';
alter table public.orders add column event text not null default 'pujo';
alter table public.orders add column ticket_no integer;
create unique index orders_event_ticket_idx on public.orders(event, ticket_no);
create index orders_event_idx on public.orders(event, id desc);
create index menu_items_event_idx on public.menu_items(event, sort_order);

-- Same guarantees as create_order: staff only, server prices, idempotent request ID,
-- all-or-nothing. Lines are stored in the order they were tapped (add-ons follow
-- the drink they belong to), so the same item may appear on several lines.
create function private.create_event_order(p_event text, p_request_id uuid, p_lines jsonb, p_payment text, p_note text)
returns bigint language plpgsql security definer set search_path = '' as $$
declare
 o public.orders; m public.menu_items; l jsonb; payload jsonb;
 qty integer; opt text; amount integer := 0; n integer;
begin
 if auth.uid() is null or not private.is_staff() then raise exception 'Staff access required' using errcode='42501'; end if;
 if p_request_id is null then raise exception 'Request ID required'; end if;
 if p_event is null or p_event = 'pujo' or not exists(select 1 from public.menu_items where event = p_event) then raise exception 'Unknown event'; end if;
 payload := jsonb_build_object('event',p_event,'lines',p_lines,'payment',p_payment,'note',p_note);
 perform pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));
 select * into o from public.orders where request_id=p_request_id;
 if found then
   if o.created_by <> auth.uid() or o.request_payload <> payload then raise exception 'Request already used with different details'; end if;
   return o.id;
 end if;
 if p_payment is null or p_payment not in ('UPI','Cash') or p_note is null or length(p_note)>200 then raise exception 'Invalid payment or note'; end if;
 if p_lines is null or jsonb_typeof(p_lines)<>'array' then raise exception 'Invalid order lines'; end if;
 if jsonb_array_length(p_lines) not between 1 and 100 then raise exception 'Order must contain 1 to 100 lines'; end if;
 perform pg_advisory_xact_lock(hashtextextended('ticket:'||p_event,2));
 select coalesce(max(ticket_no),0)+1 into n from public.orders where event=p_event;
 insert into public.orders(request_id,request_payload,created_by,payment,note,event,ticket_no)
 values(p_request_id,payload,auth.uid(),p_payment,p_note,p_event,n) returning * into o;
 for l in select value from jsonb_array_elements(p_lines) loop
  select * into m from public.menu_items where id=(l->>'item_id')::integer and event=p_event and available;
  if not found then raise exception 'Item unavailable'; end if;
  if coalesce(l->>'quantity','') !~ '^[0-9]+$' then raise exception 'Invalid quantity'; end if;
  qty := (l->>'quantity')::integer; opt := coalesce(l->>'option','');
  if qty not between 1 and 99 then raise exception 'Quantity must be between 1 and 99'; end if;
  if not opt=any(m.options) then raise exception 'Invalid serving option for %',m.name; end if;
  if coalesce(l->>'addon','None')<>'None' then raise exception 'Add-ons are separate lines for this event'; end if;
  insert into public.order_items(order_id,menu_item_id,name,option,addon,quantity,unit_price_paise,addon_price_paise)
  values(o.id,m.id,m.name,opt,'None',qty,m.price_paise,0);
  amount := amount + m.price_paise*qty;
 end loop;
 update public.orders set total_paise=amount where id=o.id;
 return o.id;
end $$;
create function public.create_event_order(p_event text,p_request_id uuid,p_lines jsonb,p_payment text,p_note text)
returns bigint language sql security invoker set search_path='' as $$ select private.create_event_order(p_event,p_request_id,p_lines,p_payment,p_note) $$;
revoke all on function private.create_event_order(text,uuid,jsonb,text,text), public.create_event_order(text,uuid,jsonb,text,text) from public,anon;
grant execute on function private.create_event_order(text,uuid,jsonb,text,text), public.create_event_order(text,uuid,jsonb,text,text) to authenticated;

-- "The Season Between" menu, Horn OK Please. Options: Hot/Iced = temperature;
-- Regular/Diet Coke and Strawberry/Cranberry = variants (served iced); '' = add-on.
insert into public.menu_items(id,event,name,category,description,art,price_paise,options,syrup,sort_order) values
(100,'hop','Americano','Standard','Espresso & water, clean and bold.','americano',24900,ARRAY['Hot','Iced'],false,100),
(101,'hop','OG Cold Coffee','Standard','The familiar favourite, blended cold.','og-cold',24900,ARRAY['Iced'],false,101),
(102,'hop','Cappuccino','Standard','Espresso under a soft milk foam.','cappuccino',24900,ARRAY['Hot','Iced'],false,102),
(103,'hop','Mocha','Standard','Espresso, milk & chocolate.','mocha',24900,ARRAY['Hot','Iced'],false,103),
(104,'hop','Flat White','Standard','Espresso with silky micro-foam.','flat-white',24900,ARRAY['Hot','Iced'],false,104),
(110,'hop','Fridge Cigarette','Signature','Espresso shot, coke & vanilla cold foam.','fridge-cigarette',32900,ARRAY['Regular Coke','Diet Coke'],false,110),
(111,'hop','Tiramisu Latte','Signature','Espresso, milk, tiramisu syrup & cold foam.','tiramisu',32900,ARRAY['Hot','Iced'],false,111),
(112,'hop','Classic Mont Blanc','Signature','Cold brew, orange juice & vanilla cold foam.','mont-blanc',32900,ARRAY['Iced'],false,112),
(113,'hop','Popcorn Latte','Signature','Espresso, milk, popcorn syrup & cold foam.','popcorn',32900,ARRAY['Hot','Iced'],false,113),
(114,'hop','Spanish Latte','Signature','Espresso, milk & condensed milk.','spanish',32900,ARRAY['Hot','Iced'],false,114),
(120,'hop','Cinnamon Bun Latte','Seasonal','Espresso, milk, cinnamon & vanilla cold foam.','cinnamon-latte',34900,ARRAY['Hot','Iced'],false,120),
(121,'hop','Cookie Butter Latte','Seasonal','Espresso, milk & Biscoff cold foam.','biscoff-latte',34900,ARRAY['Hot','Iced'],false,121),
(122,'hop','Salted Maple Latte','Seasonal','Espresso, milk, maple & sea salt cold foam.','maple-latte',34900,ARRAY['Hot','Iced'],false,122),
(123,'hop','Sea Salt Mocha','Seasonal','Espresso, milk, chocolate & sea salt cold foam.','sea-salt-mocha',34900,ARRAY['Hot','Iced'],false,123),
(124,'hop','Cherry Vanilla Mont Blanc','Seasonal','Cold brew, cherry syrup & vanilla cold foam.','cherry-mont-blanc',34900,ARRAY['Hot','Iced'],false,124),
(125,'hop','Espresso Fizz','Seasonal','Espresso, club soda & fruit.','espresso-fizz',34900,ARRAY['Strawberry','Cranberry'],false,125),
(130,'hop','Classic Hot Chocolate','Non-coffee','Rich, warm chocolate.','hot-chocolate',29900,ARRAY['Hot'],false,130),
(131,'hop','Cherry Cloud Chocolate','Non-coffee','Chocolate milk, cherry & cherry cold foam.','cherry-cloud',29900,ARRAY['Hot','Iced'],false,131),
(132,'hop','Cranberry Candy Cloud','Non-coffee','Chocolate milk, cranberry & cherry cold foam.','cranberry-cloud',29900,ARRAY['Hot','Iced'],false,132),
(133,'hop','Strawberry Ganache Cloud','Non-coffee','Milk, strawberry & ganache cold foam.','strawberry-cloud',29900,ARRAY['Hot','Iced'],false,133),
(140,'hop','Classic Matcha Latte','Matcha','Matcha & milk.','matcha',35900,ARRAY['Hot','Iced'],false,140),
(141,'hop','Cookie Butter Matcha','Matcha','Matcha, milk & Biscoff cold foam.','biscoff-matcha',35900,ARRAY['Hot','Iced'],false,141),
(142,'hop','Strawberry Matcha','Matcha','Matcha, milk & strawberry.','strawberry-matcha',35900,ARRAY['Hot','Iced'],false,142),
(143,'hop','Salted Maple Matcha','Matcha','Matcha, milk, maple & sea salt.','maple-matcha',35900,ARRAY['Hot','Iced'],false,143),
(144,'hop','Cinnamon Bun Matcha','Matcha','Matcha, milk, cinnamon & vanilla cold foam.','cinnamon-matcha',35900,ARRAY['Hot','Iced'],false,144),
(150,'hop','Orange Sunset','Mocktails','Cranberry, orange, lime & soda.','orange-sunset',24900,ARRAY['Iced'],false,150),
(151,'hop','Merry Mojito','Mocktails','Pomegranate, lime, mint & Sprite.','merry-mojito',24900,ARRAY['Iced'],false,151),
(152,'hop','Virgin Mojito','Mocktails','Mojito syrup, soda, mint & lime.','virgin-mojito',24900,ARRAY['Iced'],false,152),
(153,'hop','The Grinch','Mocktails','Green apple, soda, mint & lime.','grinch',24900,ARRAY['Iced'],false,153),
(154,'hop','Strawberry Lemonade','Mocktails','Strawberry, soda, mint & lime.','strawberry-lemonade',24900,ARRAY['Iced'],false,154),
(155,'hop','Masala Coke','Mocktails','Coke, chaat masala, lime, mint & pink salt.','masala-coke',24900,ARRAY['Regular Coke','Diet Coke'],false,155),
(160,'hop','Hazelnut','Add-ons','Syrup for the drink above.','addon-hazelnut',4000,ARRAY[''],false,160),
(161,'hop','Tiramisu','Add-ons','Syrup for the drink above.','addon-tiramisu',4000,ARRAY[''],false,161),
(162,'hop','Salted Caramel','Add-ons','Syrup for the drink above.','addon-caramel',4000,ARRAY[''],false,162),
(163,'hop','Popcorn','Add-ons','Syrup for the drink above.','addon-popcorn',4000,ARRAY[''],false,163),
(164,'hop','Vanilla','Add-ons','Syrup for the drink above.','addon-vanilla',4000,ARRAY[''],false,164),
(165,'hop','Maple','Add-ons','Syrup for the drink above.','addon-maple',4000,ARRAY[''],false,165),
(166,'hop','Espresso Shot','Add-ons','Extra shot for the drink above.','addon-shot',4000,ARRAY[''],false,166);
