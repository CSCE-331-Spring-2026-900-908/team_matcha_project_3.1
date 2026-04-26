CREATE TABLE rewards (
  id         SERIAL PRIMARY KEY,
  userid     INTEGER NOT NULL REFERENCES app_users(id),
  points     INTEGER NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('earn', 'redeem')),
  orderid    INTEGER REFERENCES orders(orderid),
  created_at TIMESTAMPTZ DEFAULT NOW()
);