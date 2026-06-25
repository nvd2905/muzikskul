create table class_funds (
  id          text primary key,
  class_name  text        not null,
  balance     bigint      not null default 0,
  target_budget bigint    not null default 0,
  created_at  timestamptz not null default now()
);

create table class_transactions (
  id          uuid        primary key default gen_random_uuid(),
  fund_id     text        not null references class_funds(id),
  amount      bigint      not null,
  payer_name  text        not null,
  status      text        not null default 'pending' check (status in ('pending', 'approved')),
  invoice_url text,
  created_at  timestamptz not null default now()
);

-- Seed
insert into class_funds (id, class_name, balance, target_budget)
values ('fund-001', 'Lớp 12A3', 4250000, 10000000);

insert into class_transactions (fund_id, amount, payer_name, status) values
  ('fund-001', 500000, 'Nguyễn Văn An',  'approved'),
  ('fund-001', 500000, 'Trần Thị Bình',  'pending'),
  ('fund-001', 500000, 'Lê Minh Châu',   'approved'),
  ('fund-001', 500000, 'Phạm Quốc Duy',  'pending'),
  ('fund-001', 500000, 'Hoàng Thị Linh', 'approved');
