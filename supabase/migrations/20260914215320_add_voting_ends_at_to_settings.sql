-- NULL means no countdown is shown in the voting portal.
ALTER TABLE public.settings ADD COLUMN voting_ends_at timestamptz;
