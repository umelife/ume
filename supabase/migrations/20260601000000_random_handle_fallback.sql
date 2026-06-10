-- ============================================================================
-- Friendly random handles instead of email-derived usernames
-- ----------------------------------------------------------------------------
-- Previously, when a new auth user had no `username` in their signup metadata,
-- handle_new_user() fell back to the email prefix (split_part(email,'@',1)).
-- That produced ugly, email-leaking handles like `wgilbert00151`. This replaces
-- the fallback with a generated handle like `HungryHippo482` and ensures the
-- email is NEVER used as a public handle.
--
-- Chosen usernames (the normal signup path) are unaffected.
-- ============================================================================

create or replace function public.generate_random_handle()
returns text as $$
declare
  adjectives text[] := array[
    'Happy','Brave','Cozy','Swift','Sunny','Mellow','Clever','Witty','Lucky','Bold',
    'Chill','Snappy','Jolly','Nimble','Plucky','Spry','Zesty','Breezy','Quirky','Mighty',
    'Fuzzy','Groovy','Peppy','Hungry','Sleepy','Frosty','Toasty','Curious','Daring','Wandering'
  ];
  nouns text[] := array[
    'Otter','Hippo','Falcon','Panda','Koala','Fox','Wolf','Tiger','Heron','Bison',
    'Maple','Comet','Pixel','Cactus','Walrus','Beagle','Lynx','Moose','Badger','Sparrow',
    'Mango','Pumpkin','Acorn','Pebble','Willow','Raptor','Gecko','Llama','Penguin','Narwhal'
  ];
begin
  return adjectives[1 + floor(random() * array_length(adjectives, 1))::int]
       || nouns[1 + floor(random() * array_length(nouns, 1))::int]
       || (100 + floor(random() * 900))::int::text;
end;
$$ language plpgsql;

create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_username text;
  chosen       text;
  attempt_count int := 0;
begin
  chosen := nullif(new.raw_user_meta_data->>'username', '');

  -- Chosen handle from signup, else a friendly random handle (never the email).
  new_username := coalesce(chosen, public.generate_random_handle());

  -- Ensure uniqueness (case-insensitive). A taken chosen handle gets a numeric
  -- suffix; a generated handle that collides is simply regenerated.
  while exists (select 1 from public.users where lower(username) = lower(new_username))
        and attempt_count < 100 loop
    attempt_count := attempt_count + 1;
    if chosen is not null then
      new_username := chosen || attempt_count::text;
    else
      new_username := public.generate_random_handle();
    end if;
  end loop;

  insert into public.users (
    id, email, display_name, username, university_domain, college_name, college_address, created_at
  )
  values (
    new.id,
    new.email,
    new_username,
    new_username,
    split_part(new.email, '@', 2),
    coalesce(nullif(new.raw_user_meta_data->>'college_name', ''), ''),
    coalesce(nullif(new.raw_user_meta_data->>'college_address', ''), ''),
    now()
  );
  return new;
end;
$$ language plpgsql security definer;
