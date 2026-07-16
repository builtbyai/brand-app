-- Brand OS admin seed for local/demo use. Empty salt, password ChangeMe123!.
-- Change these credentials before any real deployment.
-- Hash: sha256("ChangeMe123!" || "") = 9a4aabf0e5cf71cae2cea646613ce7e2a5919fa758e56819704be25a3a2c1f0b

INSERT INTO users (id, email, password_hash, salt, role, created_at)
VALUES (
  'usr_admin_demo',
  'admin@example.com',
  '9a4aabf0e5cf71cae2cea646613ce7e2a5919fa758e56819704be25a3a2c1f0b',
  '',
  'admin',
  strftime('%s', 'now')
)
ON CONFLICT(email) DO UPDATE SET
  password_hash = excluded.password_hash,
  salt = excluded.salt,
  role = 'admin';
