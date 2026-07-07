alter table class_funds enable row level security;
alter table class_transactions enable row level security;

create policy "Authenticated users can view fund status"
  on class_funds for select
  using (auth.role() = 'authenticated');

create policy "Admins can update fund balance"
  on class_funds for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Authenticated users can view transactions"
  on class_transactions for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can report a pending payment"
  on class_transactions for insert
  with check (auth.role() = 'authenticated' and status = 'pending');

create policy "Admins can insert approved adjustments"
  on class_transactions for insert
  with check (
    status = 'approved'
    and exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can approve transactions"
  on class_transactions for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
