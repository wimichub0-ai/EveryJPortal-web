BEGIN;

ALTER TABLE public.settings
  ADD COLUMN winner_creator_id uuid REFERENCES public.creators(id),
  ADD COLUMN winner_declared_at timestamptz;

NOTIFY pgrst, 'reload schema';

COMMIT;
