-- Wallet sharing (015) added update but no delete policy for
-- personal_transactions, since the feature only supported adding
-- transactions at the time. Same actor set as the existing update policy:
-- any editor of the wallet, not just the transaction's original creator,
-- matching how "Editors can update wallet transactions" already works.
create policy "Editors can delete wallet transactions"
  on personal_transactions for delete
  using (can_edit_account(account_id));
