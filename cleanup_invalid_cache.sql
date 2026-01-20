-- Clean up invalid cache entries
-- This script removes cache entries with invalid content

-- Step 1: Check how many invalid entries exist
SELECT 
  COUNT(*) as invalid_count,
  type,
  language
FROM ai_cache
WHERE content = 'No response generated' 
   OR content = '' 
   OR content IS NULL
   OR LENGTH(TRIM(content)) = 0
GROUP BY type, language;

-- Step 2: Delete invalid cache entries
DELETE FROM ai_cache
WHERE content = 'No response generated' 
   OR content = '' 
   OR content IS NULL
   OR LENGTH(TRIM(content)) = 0;

-- Step 3: Verify cleanup
-- This should return 0 rows if cleanup was successful
SELECT 
  question_id,
  type,
  language,
  LENGTH(content) as content_length,
  LEFT(content, 50) as content_preview
FROM ai_cache
WHERE content = 'No response generated' 
   OR content = '' 
   OR content IS NULL
   OR LENGTH(TRIM(content)) < 10
ORDER BY question_id, type;

-- Step 4: Show stats after cleanup
SELECT 
  type,
  language,
  COUNT(*) as valid_cache_count,
  MIN(LENGTH(content)) as min_content_length,
  MAX(LENGTH(content)) as max_content_length,
  AVG(LENGTH(content))::int as avg_content_length
FROM ai_cache
GROUP BY type, language
ORDER BY type, language;
