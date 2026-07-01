alter table public.shipments
  add column if not exists rate_per_piece numeric(12,2) not null default 0;

alter table public.shipment_pricing
  add column if not exists rate_per_piece numeric(12,2) not null default 0;

alter table public.shipments drop constraint if exists shipments_status_check;
alter table public.shipments add constraint shipments_status_check check (status in (
  'pending','received','in_warehouse','in_transit','arrived','out_for_delivery','delivered','cancelled',
  'picked_up','customs_clearance','completed','on_hold','returned','lost','damaged','booked','customs'
));

create or replace function public.update_shipment_status_transaction(
  target_shipment_id uuid,
  target_status text,
  target_notes text default ''
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  shipment_row public.shipments%rowtype;
  previous_status text;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if target_status not in ('pending','received','in_warehouse','in_transit','arrived','out_for_delivery','delivered','cancelled') then
    raise exception 'Invalid shipment status';
  end if;

  select * into shipment_row from public.shipments where id = target_shipment_id and deleted_at is null for update;
  if shipment_row.id is null then raise exception 'Shipment not found' using errcode = 'P0002'; end if;
  if not public.is_company_member(shipment_row.company_id) then raise exception 'Company membership required' using errcode = '42501'; end if;
  if not public.user_has_permission(shipment_row.company_id, 'shipments.edit') then raise exception 'Shipment edit permission required' using errcode = '42501'; end if;

  previous_status := shipment_row.status;
  update public.shipments set status = target_status, actual_delivery = case when target_status = 'delivered' then coalesce(actual_delivery, current_date) else actual_delivery end, updated_at = now() where id = target_shipment_id and company_id = shipment_row.company_id;
  insert into public.shipment_events (company_id,shipment_id,event_type,status,notes,created_by) values (shipment_row.company_id,target_shipment_id,'status',target_status,coalesce(nullif(target_notes,''),'Status updated to ' || target_status),auth.uid());
  insert into public.shipment_status_logs (company_id,shipment_id,from_status,to_status,notes,public_note,created_by) values (shipment_row.company_id,target_shipment_id,previous_status,target_status,coalesce(nullif(target_notes,''),'Status updated to ' || target_status),coalesce(nullif(target_notes,''),'Status updated to ' || target_status),auth.uid());
  insert into public.audit_logs (company_id,actor_id,action,table_name,record_id,before,after,created_by) values (shipment_row.company_id,auth.uid(),'shipment.status_updated','shipments',target_shipment_id,jsonb_build_object('status',previous_status),jsonb_build_object('status',target_status,'notes',target_notes),auth.uid());
  insert into public.notifications (company_id,user_id,title,body,created_by) values (shipment_row.company_id,auth.uid(),'Shipment status updated','Shipment ' || shipment_row.tracking_number || ' is now ' || replace(target_status,'_',' ') || '.',auth.uid());
  return target_status;
end;
$$;

grant execute on function public.update_shipment_status_transaction(uuid,text,text) to authenticated;
revoke execute on function public.update_shipment_status_transaction(uuid,text,text) from anon, public;
