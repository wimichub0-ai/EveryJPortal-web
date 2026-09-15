-- Expose only the aggregate; individual votes remain protected by RLS.
CREATE OR REPLACE FUNCTION public.get_total_votes()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT count(*) FROM public.votes;
$$;

REVOKE ALL ON FUNCTION public.get_total_votes() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_total_votes() TO anon, authenticated;
