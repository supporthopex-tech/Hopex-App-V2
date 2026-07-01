# Migration Rollback Plan

Sprint: Sprint 3 Dry Run Migration
Status: Planning only

## Current Rule

No final production migration has been executed. Sprint 3 scripts are dry-run only and must not leave target business data behind.

## Dry-Run Rollback

Dry-run target scripts must:

1. Start a transaction with `begin;`.
2. Create only temporary or transaction-scoped helper objects where possible.
3. Run transformations for measurement only.
4. Return validation output as `select` result sets.
5. End with `rollback;`.

Expected result: no target business data persists after a dry run.

## Production Migration Rollback Strategy

Production migration in Sprint 4 must use an import batch id:

```sql
select gen_random_uuid() as migration_batch_id;
```

Every migrated row must be linked to a migration control table containing:

- `batch_id`
- `source_project_ref`
- `source_entity_name`
- `source_old_id`
- `target_table`
- `target_id`
- `action`
- `created_at`

Rollback must delete only rows created by the approved batch, in reverse dependency order. Existing target seed rows, users, roles, permissions, settings, and company records must not be deleted.

## Reverse Dependency Order

1. Optional copied storage objects recorded in the migration storage log.
2. Child logs, documents, and attachments:
   - `shipment_tracking`
   - `shipment_status_logs`
   - `shipment_events`
   - `shipment_documents`
   - `quote_status_logs`
   - `quote_documents`
   - `customer_activity_logs`
   - `customer_notes`
   - `customer_contacts`
   - `task_comments`
   - `task_attachments`
   - `task_status_logs`
   - `notifications`
   - `whatsapp_logs`
3. Accounting child rows:
   - `journal_entry_lines`
   - `payment_allocations`
   - `invoice_items`
4. Transaction headers:
   - `payments`
   - `expenses`
   - `journal_entries`
   - `invoices`
   - `quotes`
   - `quote_requests`
5. Shipment/customer/task data:
   - `shipment_items`
   - `shipments`
   - `tasks`
   - `customers`
6. Staff links:
   - `staff_permissions`
   - `staff`
   - `company_users`
   - `profiles` only if created by migration and not used by auth/user onboarding
7. Conditional reference data:
   - `bank_accounts`
   - `chart_of_accounts` rows created by migration only, never seeded system accounts

## Rollback Preconditions

- Confirm the affected `batch_id`.
- Export migration logs before rollback.
- Confirm the old production database remains untouched and available.
- Pause user writes on the new preview/target environment if any users are testing.
- Take a target database backup or Supabase PITR checkpoint if available.
- Capture pre-rollback row counts by table.
- Capture target storage object list for the batch.

## Rollback Verification

After rollback:

- Target business table counts return to pre-migration baseline.
- Seeded Hopex company, roles, permissions, settings, buckets, and structural chart accounts remain.
- No migrated target storage objects remain for the batch.
- V2 app still builds and starts.
- Old production app/database remain unchanged.
- V2 Auth users remain unless the owner explicitly approves removal.

## Destructive Action Approval

Any production rollback that deletes target rows or storage objects is destructive and requires explicit approval with:

- approved `batch_id`
- expected row counts by table
- expected storage object count by bucket
- rollback SQL reviewed
- verification checklist assigned
