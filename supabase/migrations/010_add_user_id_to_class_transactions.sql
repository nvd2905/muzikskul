alter table class_transactions add column user_id uuid references profiles(id);

drop policy "Authenticated users can report a pending payment" on class_transactions;
create policy "Authenticated users can report a pending payment"
  on class_transactions for insert
  with check (
    auth.role() = 'authenticated'
    and status = 'pending'
    and (user_id is null or user_id = auth.uid())
  );
