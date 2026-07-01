-- Run on OLD Hopex production database as read-only.
-- This script must not update, delete, insert, truncate, or alter anything.

begin read only;

select
  entity_name,
  count(*) as record_count
from public.app_records
group by entity_name
order by entity_name;

select
  id,
  entity_name,
  data,
  created_by,
  created_at,
  updated_at
from public.app_records
where entity_name in (
  'Shipment',
  'Customer',
  'QuoteRequest',
  'CargoInvoice',
  'Payment',
  'Expense',
  'AccountingAccount',
  'JournalEntry',
  'ActivityLog',
  'Staff_Member',
  'StaffMember',
  'Notification'
)
order by entity_name, created_at nulls last, id;

commit;
