begin;
-- All fixtures and sales are rolled back. Identity sequence gaps are harmless.
insert into auth.users(id,email) values('00000000-0000-0000-0000-000000000001','staff-test@example.invalid'),('00000000-0000-0000-0000-000000000002','outsider-test@example.invalid');
insert into public.staff_members(user_id) values('00000000-0000-0000-0000-000000000001');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
set local role authenticated;
do $$
declare oid bigint; retry bigint; r public.orders; mutation uuid:=gen_random_uuid(); request uuid:=gen_random_uuid(); before_count bigint;
begin
 if (select count(*) from public.menu_items)<>34 then raise exception 'Menu missing items'; end if;
 oid:=public.create_order(request,'[{"item_id":0,"quantity":2,"option":"Hot","addon":"Vanilla"}]','Cash','Test');
 retry:=public.create_order(request,'[{"item_id":0,"quantity":2,"option":"Hot","addon":"Vanilla"}]','Cash','Test');
 if oid<>retry then raise exception 'Duplicate order'; end if;
 if (select total_paise from public.orders where id=oid)<>35800 then raise exception 'Wrong authoritative total'; end if;
 begin
  perform public.create_order(request,'[{"item_id":0,"quantity":1,"option":"Hot"}]','Cash','Test');
  raise exception 'FAIL reused request accepted';
 exception when others then if sqlerrm like 'FAIL%' then raise; end if; end;
 select count(*) into before_count from public.orders;
 begin
  perform public.create_order(gen_random_uuid(),'[{"item_id":0,"quantity":1,"option":"Hot"},{"item_id":26,"quantity":1,"option":"Hot"}]','UPI','');
  raise exception 'FAIL invalid serving accepted';
 exception when others then if sqlerrm like 'FAIL%' then raise; end if; end;
 if (select count(*) from public.orders)<>before_count then raise exception 'Partial order was committed'; end if;
 begin
  perform public.create_order(gen_random_uuid(),'[{"item_id":0,"quantity":0,"option":"Hot"}]','UPI','');
  raise exception 'FAIL zero quantity accepted';
 exception when others then if sqlerrm like 'FAIL%' then raise; end if; end;
 r:=public.move_order(oid,1,'Preparing',mutation);
 if r.version<>2 or r.status<>'Preparing' then raise exception 'Move failed'; end if;
 r:=public.move_order(oid,1,'Preparing',mutation);
 if r.version<>2 then raise exception 'Retry applied twice'; end if;
 begin
  perform public.move_order(oid,1,'Ready',gen_random_uuid());
  raise exception 'FAIL stale move accepted';
 exception when serialization_failure then null; end;
 r:=public.move_order(oid,2,'Ready',gen_random_uuid());
 r:=public.move_order(oid,3,'Queued',gen_random_uuid());
 if r.version<>4 then raise exception 'Reverse drag failed'; end if;
 begin
  update public.orders set status='Collected' where id=oid;
  raise exception 'FAIL direct update accepted';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
do $$ begin
 if (select count(*) from public.orders)<>0 or (select count(*) from public.menu_items)<>0 then raise exception 'Outsider sees data'; end if;
 begin
  perform public.create_order(gen_random_uuid(),'[{"item_id":0,"quantity":1,"option":"Hot"}]','Cash','');
  raise exception 'FAIL outsider checkout';
 exception when insufficient_privilege then null; end;
end $$;
set local role anon;
do $$ begin
 begin perform public.create_order(gen_random_uuid(),'[]','UPI','');raise exception 'FAIL anon checkout';exception when insufficient_privilege then null;end;
 begin perform * from public.orders;raise exception 'FAIL anon read';exception when insufficient_privilege then null;end;
end $$;
rollback;
select 'PASS: totals, idempotency, validation, rollback, stale versions, reverse moves, direct-write denial, outsider and anonymous denial' as test_result;
