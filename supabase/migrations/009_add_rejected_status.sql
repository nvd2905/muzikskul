alter table class_transactions drop constraint class_transactions_status_check;
alter table class_transactions add constraint class_transactions_status_check
  check (status in ('pending', 'approved', 'rejected'));
