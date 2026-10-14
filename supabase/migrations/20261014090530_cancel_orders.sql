alter table public.orders drop constraint orders_status_check;
alter table public.orders add constraint orders_status_check check(status in ('Queued','Preparing','Ready','Collected','Cancelled'));
alter table public.orders add column cancellation_reason text check(length(cancellation_reason)<=200);
create function private.cancel_order(p_order_id bigint,p_expected_version integer,p_reason text,p_mutation_id uuid)
returns public.orders language plpgsql security definer set search_path='' as $$
declare o public.orders; e public.order_events;
begin
 if auth.uid() is null or not private.is_staff() then raise exception 'Staff access required' using errcode='42501'; end if;
 if p_mutation_id is null or p_expected_version is null or p_reason is null or length(trim(p_reason)) not between 1 and 200 then raise exception 'Please give a short cancellation reason'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_mutation_id::text,1));
 select * into o from public.orders where id=p_order_id for update;
 if not found then raise exception 'Order not found'; end if;
 select * into e from public.order_events where mutation_id=p_mutation_id;
 if found then
  if e.order_id<>p_order_id or e.actor_id<>auth.uid() or e.to_status<>'Cancelled' or e.expected_version<>p_expected_version then raise exception 'Mutation ID already used'; end if;
  return o;
 end if;
 if o.version<>p_expected_version then raise exception 'Order changed on another device. Refresh and try again.' using errcode='40001'; end if;
 if o.status='Cancelled' then return o; end if;
 insert into public.order_events(mutation_id,order_id,actor_id,from_status,to_status,expected_version,version)
 values(p_mutation_id,o.id,auth.uid(),o.status,'Cancelled',p_expected_version,o.version+1);
 update public.orders set status='Cancelled',cancellation_reason=trim(p_reason),version=version+1,updated_at=now() where id=o.id returning * into o;
 return o;
end $$;
create function public.cancel_order(p_order_id bigint,p_expected_version integer,p_reason text,p_mutation_id uuid)
returns public.orders language sql security invoker set search_path='' as $$ select private.cancel_order(p_order_id,p_expected_version,p_reason,p_mutation_id) $$;
revoke all on function private.cancel_order(bigint,integer,text,uuid), public.cancel_order(bigint,integer,text,uuid) from public,anon;
grant execute on function private.cancel_order(bigint,integer,text,uuid), public.cancel_order(bigint,integer,text,uuid) to authenticated;
