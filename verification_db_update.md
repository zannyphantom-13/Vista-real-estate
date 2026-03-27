# Update Your Supabase Database

To flawlessly support the new Identity Document Validation system, we must rigidly add 4 new columns to your existing `users` table.

### 1. Execute SQL
Go to your **Supabase Dashboard** -> **SQL Editor** (on the left menu) and click **"New query"**.

### 2. Paste This Code
```sql
ALTER TABLE public.users
ADD COLUMN verification_status text default 'unsubmitted',
ADD COLUMN id_url text,
ADD COLUMN license_number text,
ADD COLUMN brokerage_name text;
```

### 3. Run It
Click the green "Run" button precisely mapping the changes! The dashboard code I am writing will natively rely on these exact columns to successfully function!
