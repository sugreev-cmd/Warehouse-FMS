# Warehouse FMS

A warehouse operations task-management system, built on exactly the same logic as
[Custom-Task-FMS](https://github.com/sugreev-cmd/Custom-Task-FMS) — single-file HTML,
Supabase Auth, role-based access, recurring tasks, week-off handling, MIS reporting
and photo proof. Everything is in **English**, and the app ships with **6 roles**
(Owner + 5 more) and **5 demo tasks**.

**Live:** https://sugreev-cmd.github.io/Warehouse-FMS/

Single file: `index.html`. Runs on GitHub Pages, Netlify, or any static host.

---

## Status

| Step | State |
|------|-------|
| Supabase tables `wh_fms_tasks` + `wh_fms_settings` (with RLS) | ✅ Created |
| App pushed and published on GitHub Pages | ✅ Done |
| Login accounts for Roles 1–5 | ✅ Reuses your existing Task FMS accounts |
| Login account for Role 6 | ⬜ **One user to add** — see below |

---

## What is different from Task FMS

| | Task FMS | Warehouse FMS |
|---|---|---|
| Roles | 5 | **6** (Role 1 is named *Owner*) |
| Categories | Category 1–3, Admin, Custom | Inward & Receiving, Storage & Inventory, Outward & Dispatch, Safety & Housekeeping, Admin, Custom |
| Filters | Month + date range | Month + **Day** + date range |
| Tasks table | `task_fms_tasks` | `wh_fms_tasks` |
| Settings table | `task_fms_settings` | `wh_fms_settings` |
| Login emails | `fms-r1…r5@` | `fms-r1…r5@` (shared) + `wh-r6@` |
| Browser storage key | `taskfms_settings_v1` | `whfms_settings_v1` |
| Language | Hinglish | English |

Every key and table name is different, so **both apps run side by side** in the same
browser and the same Supabase project without touching each other's data.

---

## Remaining setup: one login account

Roles 1–5 reuse the login accounts you already have, so **you can log in right away with
the same passwords you use for Task FMS**:

| Role | Login email | Status |
|------|-------------|--------|
| Role 1 — Owner | `fms-r1@astorialiving.org` | ✅ exists |
| Role 2 | `fms-r2@astorialiving.org` | ✅ exists |
| Role 3 | `fms-r3@astorialiving.org` | ✅ exists |
| Role 4 | `fms-r4@astorialiving.org` | ✅ exists |
| Role 5 | `fms-r5@astorialiving.org` | ✅ exists |
| Role 6 | `wh-r6@astorialiving.org` | ⬜ add this one |

To add Role 6: Supabase Dashboard → **Authentication → Users → Add user**, email
`wh-r6@astorialiving.org`, set a password, tick *Auto Confirm User*.

Passwords are never stored in this file. Each person can change their own from
**Settings → 🗄 Data → Change my password**. To use different email addresses, edit them
in **Settings → 🗄 Data → Login emails**.

Then open the live link and log in as **Owner**. On that first load — while
`wh_fms_tasks` is still empty — the app inserts **5 demo tasks** so the dashboard,
MIS report and filters have something to show. Delete them once your real tasks are in.

> Note: Roles 1–5 share their login accounts with Task FMS, but the two apps use
> completely separate tables and browser storage, so the data never mixes.

---

## Database

Already created in the project. Kept here for reference, and also available in the app
at **Settings → 🗄 Data → Copy SQL**:

```sql
create table if not exists public.wh_fms_tasks (
  id text primary key,
  section text,
  name text,
  freq text,
  due_date date,
  actual_date date,
  status text,
  assigned_to text,
  notes text,
  month_key text,
  is_custom boolean default false,
  proof_link text,
  proof_photos jsonb not null default '[]'::jsonb,
  updated_at timestamptz default now()
);

alter table public.wh_fms_tasks enable row level security;
alter table public.wh_fms_tasks force row level security;

create policy "authenticated read"   on public.wh_fms_tasks for select to authenticated using (true);
create policy "authenticated insert" on public.wh_fms_tasks for insert to authenticated with check (true);
create policy "authenticated update" on public.wh_fms_tasks for update to authenticated using (true) with check (true);
create policy "authenticated delete" on public.wh_fms_tasks for delete to authenticated using (true);

revoke all on public.wh_fms_tasks from anon;
grant select, insert, update, delete on public.wh_fms_tasks to authenticated;


create table if not exists public.wh_fms_settings (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  admin_roles jsonb not null default '[]'::jsonb,
  updated_by text,
  updated_at timestamptz default now()
);

alter table public.wh_fms_settings enable row level security;
alter table public.wh_fms_settings force row level security;

create policy "authenticated read"   on public.wh_fms_settings for select to authenticated using (true);
create policy "authenticated insert" on public.wh_fms_settings for insert to authenticated with check (true);
create policy "authenticated update" on public.wh_fms_settings for update to authenticated using (true) with check (true);

revoke all on public.wh_fms_settings from anon;
grant select, insert, update on public.wh_fms_settings to authenticated;
```

---

## Roles

Role 1 is named **Owner** and has Full access; Roles 2–6 are placeholders you rename in
**Settings → 🔐 Roles** once you decide who does what. Renaming is safe at any time —
internally the role keys are fixed (`r1` … `r6`), so no data is affected.

Access levels:

- **Full** — all categories, Settings, proof links, can delete any task.
- **Team** — only its ticked categories, can edit, can delete only its own custom tasks.
  (A Team role with no category ticked sees all categories.)
- **View** — sees everything, cannot edit anything.

At least one role must always have Full access — the app enforces this.

---

## Demo tasks

| # | Category | Task | Frequency |
|---|----------|------|-----------|
| 1 | Inward & Receiving | Verify inbound shipment against the purchase order and record the GRN | Daily |
| 2 | Storage & Inventory | Bin-location stock count for fast-moving SKUs | Daily |
| 3 | Outward & Dispatch | Check dispatch documents and invoices before vehicle loading | Daily |
| 4 | Safety & Housekeeping | Fire extinguisher, emergency exit and first-aid box inspection | Weekly |
| 5 | Admin | Monthly stock reconciliation report for management review | Monthly |

Seeded only once, and only into an empty table. To change them, edit the `DEMO_TASKS`
array in `index.html`.

Real tasks can be added three ways: **+ Add Task** (with recurring generation —
Daily / Weekly / Monthly / Quarterly / Annual), the bulk paste box in
**Settings → 📥 Bulk Add**, or directly in Supabase.

---

## Filters

On both the **Tasks** and **MIS Report** screens:

- **Month** — the dropdown; the default view.
- **Day** — pick one date, or hit **Today**. Internally this sets From = To = that date,
  so the app pulls that exact day from Supabase even if it is outside the loaded month.
- **From / To** — any date range, across months. Editing these by hand clears the Day box.
- **Clear** — resets Day, From and To, and returns to the month view.

Tasks also filter by category, Overdue / Pending / Done, and free-text search.

---

## Week off and holidays

- Weekly off days + holiday dates are not working days.
- A due date landing on an off day shifts to the **previous working day**.
- **Special Working Days** override every off rule for a specific date.
- All 7 days cannot be off.
- Changing the week off does **not** move due dates of tasks that already exist — it
  applies to newly created and recurring tasks only.

Holidays can be imported from an Excel or CSV file in **Settings → 🗓 Week Off**.

---

## Security model

- Every role has its own Supabase Auth account; passwords are hashed in Supabase and
  appear nowhere in this file.
- Login returns an access token, and every database request uses that token.
- RLS allows the `authenticated` role only. All rights are revoked from `anon`, so the
  public anon key on its own cannot read or write anything.
- The token expires in one hour and refreshes automatically; a failed refresh logs out.

---

## Photo proof (optional)

`WarehouseFMS_Proof_Uploader.gs` is a Google Apps Script web app that stores proof photos
in your Google Drive under `Warehouse FMS Proofs / <date> /` and returns the link to the
app. Deploy it once (steps are in the file header), then paste the deployment URL into
**Settings → 🗄 Data → Proof Upload Script URL**.

---

Base: [Custom-Task-FMS](https://github.com/sugreev-cmd/Custom-Task-FMS) ·
Original: [-EA-PC-Task-FMS](https://github.com/sugreev-cmd/-EA-PC-Task-FMS)
