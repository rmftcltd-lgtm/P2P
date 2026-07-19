-- Enable PostGIS for production geospatial matching.
-- Applied automatically when using docker-compose PostGIS image.
CREATE EXTENSION IF NOT EXISTS postgis;

-- Optional helper view once Prisma tables exist (run after migrate):
-- CREATE INDEX IF NOT EXISTS delivery_pickup_gix
--   ON "Delivery" USING GIST (ST_SetSRID(ST_MakePoint("pickupLng", "pickupLat"), 4326));
