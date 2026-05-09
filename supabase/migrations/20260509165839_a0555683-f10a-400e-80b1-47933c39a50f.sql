ALTER TABLE public.media
  ADD COLUMN IF NOT EXISTS spinoffs jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS linked_spinoff_ids uuid[] NOT NULL DEFAULT '{}'::uuid[];