-- Verify the unique index exists
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'users' AND indexname LIKE '%username%';
