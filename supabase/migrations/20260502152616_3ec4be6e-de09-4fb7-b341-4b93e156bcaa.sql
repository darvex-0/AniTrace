ALTER TABLE public.media 
ADD COLUMN current_season integer NOT NULL DEFAULT 1,
ADD COLUMN total_seasons integer;