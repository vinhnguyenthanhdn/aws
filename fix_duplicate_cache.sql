-- Step 1: Find and delete duplicate cache entries (keep only the most recent one)
-- This creates a temporary table with the IDs to keep
WITH ranked_cache AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY question_id, language, type 
      ORDER BY created_at DESC
    ) as rn
  FROM ai_cache
)
DELETE FROM ai_cache
WHERE id IN (
  SELECT id 
  FROM ranked_cache 
  WHERE rn > 1
);

-- Step 2: Add a unique constraint to prevent future duplicates
-- First, drop the constraint if it exists
ALTER TABLE ai_cache 
DROP CONSTRAINT IF EXISTS ai_cache_unique_question_lang_type;

-- Then add the unique constraint
ALTER TABLE ai_cache
ADD CONSTRAINT ai_cache_unique_question_lang_type 
UNIQUE (question_id, language, type);

-- Step 3: Verify the cleanup
-- This should show you how many entries remain per question
SELECT 
  question_id, 
  language, 
  type, 
  COUNT(*) as count,
  MAX(created_at) as latest_cache
FROM ai_cache
GROUP BY question_id, language, type
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- If the above query returns no rows, cleanup was successful!
