-- Enable Realtime for the messages table
-- REPLICA IDENTITY FULL is required for Supabase Realtime to include the full
-- row data (including old values) in UPDATE/DELETE change events, and to allow
-- filtered subscriptions (e.g. listing_id=eq.xxx) to work correctly.

ALTER TABLE public.messages REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
