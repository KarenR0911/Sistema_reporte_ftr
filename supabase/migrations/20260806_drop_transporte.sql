-- Eliminación del módulo de transporte.
-- La tabla ya no se usa en el cliente (offline-first) y no debe sincronizarse.

DROP TABLE IF EXISTS public.transporte;
