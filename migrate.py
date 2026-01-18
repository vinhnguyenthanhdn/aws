import os
import re
import psycopg2
from psycopg2.extras import execute_values

# Database connection configuration
DB_CONFIG = {
    'dbname': 'postgres',
    'user': 'postgres.kowpqhvjlykpjwjxxhrf',
    'password': 'Khoinhan@125',
    'host': 'aws-1-ap-northeast-2.pooler.supabase.com',
    'port': 6543
}

def get_db_connection():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return None

def create_table_if_not_exists(conn):
    schema_questions = """
    CREATE TABLE IF NOT EXISTS questions (
        id text PRIMARY KEY,
        topic text,
        question text,
        options text[],
        correct_answer text,
        discussion_link text,
        is_multiselect boolean DEFAULT false,
        created_at timestamp with time zone DEFAULT now()
    );
    """
    
    schema_ai_cache = """
    CREATE TABLE IF NOT EXISTS ai_cache (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        question_id text NOT NULL,
        language text NOT NULL, 
        type text NOT NULL CHECK (type IN ('explanation', 'theory')),
        content text NOT NULL,
        created_at timestamp with time zone DEFAULT now()
    );
    
    -- Create index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_ai_cache_lookup 
    ON ai_cache(question_id, language, type);
    """

    try:
        with conn.cursor() as cur:
            cur.execute(schema_questions)
            cur.execute(schema_ai_cache)
        conn.commit()
        print("✅ Tables 'questions' and 'ai_cache' match schema.")
    except Exception as e:
        conn.rollback()
        print(f"❌ Error creating tables: {e}")

def parse_markdown_file(file_path):
    print(f"📖 Reading file: {file_path}")
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    questions = []
    # Split by separator line
    blocks = content.split('----------------------------------------')
    
    print(f"🔍 Found {len(blocks)} blocks. Parsing...")
    
    for block in blocks:
        block = block.strip()
        if not block: continue
            
        id_match = re.search(r'## Exam .* question (\d+) discussion', block)
        if not id_match: continue
        
        suggested_match = re.search(r'Suggested Answer:\s+([A-Z]+)', block)
        official_match = re.search(r'\*\*Answer:\s+([A-Z]+)\*\*', block)
        topic_match = re.search(r'Topic #:\s+(\d+)', block)
        link_match = re.search(r'\[View on ExamTopics\]\((.*?)\)', block)
        
        lines = block.split('\n')
        
        # Options extraction
        opt_start = len(lines)
        for i, line in enumerate(lines):
            if re.match(r'^[A-F]\.\s+', line):
                opt_start = i
                break
                
        options = []
        for line in lines[opt_start:]:
            if re.match(r'^[A-F]\.\s+', line):
                options.append(line.strip())
        
        # Meta end for Body extraction
        meta_end = 0
        for i, line in enumerate(lines):
            if "[All AWS Certified Solutions Architect" in line:
                meta_end = i + 1
                break
                
        # Body extraction
        clean_body = []
        for line in lines[meta_end:opt_start]:
            s = line.strip()
            if not s or s.startswith(("Question #", "Topic #", "Exam question from", "Amazon's", "AWS Certified")):
                continue
            if s.startswith("Suggested Answer:"):
                continue
            clean_body.append(s)
            
        q_text = "\n".join(clean_body)
        is_multi = "(Choose two" in q_text or "(Choose three" in q_text
        
        correct_answ = None
        if suggested_match:
            correct_answ = suggested_match.group(1)
        elif official_match:
            correct_answ = official_match.group(1)
            
        if not correct_answ:
            continue

        questions.append((
            id_match.group(1),
            topic_match.group(1) if topic_match else "Unknown",
            q_text,
            options,
            correct_answ,
            link_match.group(1) if link_match else None,
            is_multi
        ))
        
    return questions

def migrate_to_supabase(questions):
    conn = get_db_connection()
    if not conn:
        return

    create_table_if_not_exists(conn)
    
    query = """
    INSERT INTO questions (id, topic, question, options, correct_answer, discussion_link, is_multiselect)
    VALUES %s
    ON CONFLICT (id) DO UPDATE SET
        question = EXCLUDED.question,
        options = EXCLUDED.options,
        correct_answer = EXCLUDED.correct_answer,
        discussion_link = EXCLUDED.discussion_link,
        is_multiselect = EXCLUDED.is_multiselect;
    """
    
    BATCH_SIZE = 100
    total = len(questions)
    print(f"📦 Uploading {total} questions in batches of {BATCH_SIZE}...")
    
    try:
        with conn.cursor() as cur:
            for i in range(0, total, BATCH_SIZE):
                batch = questions[i:i + BATCH_SIZE]
                execute_values(cur, query, batch)
                conn.commit()
                print(f"✅ Uploaded batch {i//BATCH_SIZE + 1} ({len(batch)} items)")
        print("🎉 Migration completed successfully!")
    except Exception as e:
        conn.rollback()
        print(f"❌ Error uploading data: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    file_path = "public/SAA_C03.md"
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        exit(1)
        
    try:
        parsed_questions = parse_markdown_file(file_path)
        print(f"✅ Successfully parsed {len(parsed_questions)} questions.")
        
        if len(parsed_questions) > 0:
            migrate_to_supabase(parsed_questions)
        else:
            print("⚠️ No questions found to migrate.")
            
    except Exception as e:
        print(f"❌ Critical Error: {e}")
