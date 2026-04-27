CREATE TABLE IF NOT EXISTS app_users (
  id SERIAL PRIMARY KEY,
  google_id VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('employee', 'manager')),
  points_balance INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS app_users_google_id_key ON app_users (google_id);
CREATE UNIQUE INDEX IF NOT EXISTS app_users_email_key ON app_users (LOWER(email));

INSERT INTO app_users (id, google_id, email, name, role, points_balance)
VALUES
  (1, '110367735841765804061', 'singhvitthal101@gmail.com', 'Vitthal Singh', 'manager', 0),
  (2, '115833503133420324794', 'dumb7030@gmail.com', 'dum bot', 'employee', 0),
  (3, '106576649169626955548', 'vitthal775@tamu.edu', 'Vitthal Singh', 'employee', 0),
  (4, '112397219579897357702', 'anandpatil3003@gmail.com', 'Anand Patil', 'manager', 0),
  (5, '105118126785643091874', 'reveille.bubbletea@gmail.com', 'Reveille', 'employee', 0),
  (6, '104085138647738795995', 'pranavkalai04@tamu.edu', 'Pranav Kalaiselvan', 'manager', 0),
  (7, '107689060550984901345', 'bhargav.vudayagiri17@tamu.edu', 'Bhargav Vudayagiri', 'employee', 0)
ON CONFLICT (id) DO UPDATE
SET
  google_id = EXCLUDED.google_id,
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  points_balance = EXCLUDED.points_balance;

SELECT setval(
  pg_get_serial_sequence('app_users', 'id'),
  COALESCE((SELECT MAX(id) FROM app_users), 1),
  true
);
