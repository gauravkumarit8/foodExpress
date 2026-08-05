-- Enables gen-uuid support for TypeORM's uuid primary keys, and PostGIS
-- for future geo-radius queries (nearby restaurants, rider proximity).
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;
