-- Runs once, on first container start (empty volume).
-- ota_test is wiped by the Jest setup; ota keeps dev data.
CREATE DATABASE IF NOT EXISTS ota_test;
-- Global grant so `prisma migrate dev` can create its shadow database. Local container only.
GRANT ALL PRIVILEGES ON *.* TO 'ota'@'%';
FLUSH PRIVILEGES;
