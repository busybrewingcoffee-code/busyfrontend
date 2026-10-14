create table private.staff_emails(email text primary key check(email=lower(email)));
alter table private.staff_emails enable row level security;
revoke all on private.staff_emails from public,anon,authenticated;
create function private.provision_staff() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.email_confirmed_at is not null and exists(select 1 from private.staff_emails where email=lower(new.email)) then
   insert into public.staff_members(user_id) values(new.id) on conflict do nothing;
 else
   update public.staff_members set active=false where user_id=new.id;
 end if;
 return new;
end $$;
revoke all on function private.provision_staff() from public,anon,authenticated;
create trigger provision_staff after insert or update of email,email_confirmed_at on auth.users for each row execute function private.provision_staff();
