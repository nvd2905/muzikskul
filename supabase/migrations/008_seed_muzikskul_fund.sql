insert into class_funds (id, class_name, balance, target_budget)
values ('fund-002', 'Muzik Skul', 344999, 1000000);

insert into class_transactions (fund_id, amount, payer_name, status, note) values
  ('fund-002', 199999, 'Tan',    'approved', 'Đóng quỹ (migrated)'),
  ('fund-002', 150000, 'Vỹ',     'approved', 'Đóng quỹ (migrated)'),
  ('fund-002', 55000,  'Bình',   'approved', 'Đóng quỹ (migrated)'),
  ('fund-002', 50000,  'Hades',  'approved', 'Đóng quỹ (migrated)'),
  ('fund-002', 30000,  'Tri',    'approved', 'Đóng quỹ (migrated)'),
  ('fund-002', 20000,  'Duy',    'approved', 'Đóng quỹ (migrated)'),
  ('fund-002', 20000,  'Thuan',  'approved', 'Đóng quỹ (migrated)'),
  ('fund-002', 20000,  'Dung',   'approved', 'Đóng quỹ (migrated)'),
  ('fund-002', -200000, 'Chi quỹ lớp', 'approved', 'Tổng chi (migrated)');
