BEGIN;

ALTER TABLE public.settings
  ADD COLUMN announcement_text text,
  ADD COLUMN announcement_active boolean NOT NULL DEFAULT false;

NOTIFY pgrst, 'reload schema';

COMMIT;
