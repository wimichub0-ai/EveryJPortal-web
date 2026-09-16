BEGIN;

ALTER TABLE public.creators
  ADD COLUMN is_evicted boolean NOT NULL DEFAULT false,
  ADD COLUMN evicted_at timestamptz;

CREATE OR REPLACE FUNCTION public.cast_vote(p_creator_id uuid, p_voter_name text)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_status text;
  v_email text;
  v_phone text;
  v_local_part text;
  v_domain text;
  v_normalized_contact text;
  v_contact_type text;
  v_vote_count bigint;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select voting_status into v_status from public.settings where id = 1;

  if v_status = 'paused' then
    raise exception 'Voting is paused';
  elsif v_status is distinct from 'live' then
    raise exception 'Voting is closed';
  end if;

  -- Serialize voting with author updates, including eviction, until commit.
  perform 1 from public.creators
  where id = p_creator_id and is_active = true
  for share;
  if not found then
    raise exception 'Creator not found';
  end if;

  if exists (
    select 1 from public.creators
    where id = p_creator_id and is_evicted = true
  ) then
    raise exception 'This creator has been evicted';
  end if;

  select nullif(btrim(email), ''), nullif(btrim(phone), '')
  into v_email, v_phone
  from auth.users
  where id = v_user_id;

  if v_phone is not null then
    v_contact_type := 'phone';
    v_phone := regexp_replace(v_phone, '[-[:space:]()]', '', 'g');
    if v_phone ~ '^0[0-9]{10}$' then
      v_normalized_contact := '+234' || substr(v_phone, 2);
    elsif v_phone ~ '^234[0-9]+$' then
      v_normalized_contact := '+' || v_phone;
    elsif v_phone ~ '^\+234[0-9]+$' then
      v_normalized_contact := v_phone;
    else
      v_normalized_contact := v_phone;
    end if;
  elsif v_email is not null then
    v_contact_type := 'email';
    v_email := lower(btrim(v_email));
    v_local_part := split_part(v_email, '@', 1);
    v_domain := split_part(v_email, '@', 2);
    if v_domain in ('gmail.com', 'googlemail.com') then
      v_local_part := replace(split_part(v_local_part, '+', 1), '.', '');
    end if;
    v_normalized_contact := v_local_part || '@' || v_domain;
    if exists (select 1 from public.blocked_email_domains where domain = v_domain) then
      raise exception 'This email domain is not allowed';
    end if;
  else
    raise exception 'Not authenticated';
  end if;

  begin
    insert into public.votes (creator_id, user_id, voter_name, normalized_contact, contact_type)
    values (p_creator_id, v_user_id, p_voter_name, v_normalized_contact, v_contact_type);
  exception
    when unique_violation then
      raise exception 'You have already used your vote';
  end;

  select count(*) into v_vote_count from public.votes where creator_id = p_creator_id;
  return v_vote_count;
end;
$function$;

NOTIFY pgrst, 'reload schema';
COMMIT;
