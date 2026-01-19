"""
AI Cache Builder Script
-----------------------
Tạo cache AI cho các câu hỏi AWS SAA-C03.

Cách sử dụng:
    python cache_ai.py 1-10         # Cache câu hỏi từ 1 đến 10
    python cache_ai.py 1-10 --lang en  # Cache cho tiếng Anh
    python cache_ai.py 1-10 --type theory  # Chỉ cache theory
    python cache_ai.py 1-10 --type explanation  # Chỉ cache explanation
    python cache_ai.py 1-10 --force  # Ghi đè cache cũ

Yêu cầu:
    pip install httpx google-generativeai python-dotenv
"""

import os
import sys
import argparse
import time
from typing import Optional
from dotenv import load_dotenv
import httpx
import google.generativeai as genai

# Load environment variables
load_dotenv()

# Configuration
SUPABASE_URL = os.getenv('VITE_SUPABASE_URL') or os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('VITE_SUPABASE_ANON_KEY') or os.getenv('SUPABASE_KEY')

# Parse multiple Gemini API keys
def get_gemini_keys() -> list:
    """Lấy danh sách Gemini API keys từ environment"""
    keys_string = os.getenv('GEMINI_API_KEYS') or os.getenv('VITE_GOOGLE_API_KEYS') or ''
    keys = [k.strip() for k in keys_string.split(',') if k.strip()]
    
    # Fallback to single key
    if not keys:
        single_key = os.getenv('GEMINI_API_KEY') or os.getenv('VITE_GEMINI_API_KEY')
        if single_key:
            keys = [single_key]
    
    return keys

GEMINI_API_KEYS = get_gemini_keys()
current_key_index = 0  # Track current key for rotation

# Validate configuration
if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: SUPABASE_URL và SUPABASE_KEY chưa được cấu hình!")
    print("   Hãy tạo file .env với nội dung:")
    print("   SUPABASE_URL=your_supabase_url")
    print("   SUPABASE_KEY=your_supabase_anon_key")
    print("   GEMINI_API_KEYS=key1,key2,key3")
    sys.exit(1)

if not GEMINI_API_KEYS:
    print("❌ Error: GEMINI_API_KEYS chưa được cấu hình!")
    sys.exit(1)

print(f"🔑 Loaded {len(GEMINI_API_KEYS)} Gemini API keys")

# Supabase REST API headers
HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
}


def get_next_key() -> str:
    """Lấy key tiếp theo theo thứ tự tuần tự"""
    global current_key_index
    key = GEMINI_API_KEYS[current_key_index]
    current_key_index = (current_key_index + 1) % len(GEMINI_API_KEYS)
    return key


def get_explanation_prompt(question: str, options: str, correct_answer: str, language: str) -> str:
    """Tạo prompt cho Giải thích (Explanation)"""
    language_instruction = 'Vui lòng trả lời bằng tiếng Việt.' if language == 'vi' else 'Please respond in English.'
    
    return f"""You are an AWS Solutions Architect expert helping students prepare for the SAA-C03 exam.

Question: {question}

Options:
{options}

Correct Answer: {correct_answer}

{language_instruction}

Provide a comprehensive explanation covering:

1. **Giải thích câu hỏi**: Phân tích yêu cầu chính của câu hỏi, xác định các điểm mấu chốt cần chú ý.

2. **Giải thích đáp án đúng**: Tại sao đáp án {correct_answer} là đúng? Giải thích chi tiết cách nó đáp ứng yêu cầu của câu hỏi.

3. **Tại sao không chọn các đáp án khác**: Phân tích từng đáp án sai, giải thích lý do tại sao chúng không phù hợp hoặc không tối ưu.

4. **Các lỗi thường gặp (Common Mistakes)**: Liệt kê các lỗi mà thí sinh hay mắc phải khi gặp dạng câu hỏi này.

5. **Mẹo để nhớ (Tips to Remember)**: Cung cấp các mẹo, tricks hoặc cách nhớ nhanh để áp dụng cho các câu hỏi tương tự.

Keep the explanation structured and easy to understand (max 500 words)."""


def get_theory_prompt(question: str, options: str, language: str) -> str:
    """Tạo prompt cho Lý Thuyết (Theory)"""
    language_instruction = 'Vui lòng trả lời bằng tiếng Việt.' if language == 'vi' else 'Please respond in English.'
    
    return f"""You are an AWS Solutions Architect expert. Provide theoretical foundation for understanding this question.

Question: {question}

Options:
{options}

{language_instruction}

Provide a comprehensive theoretical breakdown:

1. **Cơ sở lý thuyết các thuật ngữ trong câu hỏi**: Liệt kê và giải thích TẤT CẢ các AWS services, concepts, và thuật ngữ kỹ thuật được đề cập trong câu hỏi. Mỗi thuật ngữ cần được giải thích ngắn gọn nhưng đầy đủ.

2. **Cơ sở lý thuyết các thuật ngữ trong đáp án**: Liệt kê và giải thích TẤT CẢ các AWS services, concepts, và thuật ngữ kỹ thuật xuất hiện trong các đáp án (A, B, C, D). Đặc biệt chú ý những thuật ngữ khác với phần câu hỏi.

Keep the theory organized and easy to reference (max 500 words)."""


def call_gemini(prompt: str, max_retries: int = 3) -> Optional[str]:
    """Gọi Gemini API với retry logic và key rotation"""
    tried_keys = set()
    
    while len(tried_keys) < len(GEMINI_API_KEYS):
        api_key = get_next_key()
        key_suffix = api_key[-6:]  # Last 6 chars for logging
        
        if api_key in tried_keys:
            continue
        
        tried_keys.add(api_key)
        
        for attempt in range(max_retries):
            try:
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel('gemini-2.5-flash')
                response = model.generate_content(prompt)
                return response.text
            except Exception as e:
                error_str = str(e).lower()
                
                # If quota exceeded or rate limited, try next key
                if 'quota' in error_str or 'rate' in error_str or '429' in error_str:
                    print(f"   ⚠️ Key ...{key_suffix} rate limited, switching to next key...")
                    break  # Break inner loop, try next key
                
                print(f"   ⚠️ Attempt {attempt + 1} with key ...{key_suffix} failed: {e}")
                
                if attempt < max_retries - 1:
                    wait_time = (attempt + 1) * 2
                    print(f"   ⏳ Waiting {wait_time}s before retry...")
                    time.sleep(wait_time)
        else:
            # All retries failed for this key
            continue
    
    print(f"   ❌ All {len(GEMINI_API_KEYS)} keys exhausted!")
    return None


def get_cached_content(question_id: str, language: str, content_type: str) -> Optional[str]:
    """Kiểm tra cache đã tồn tại chưa"""
    try:
        url = f"{SUPABASE_URL}/rest/v1/ai_cache"
        params = {
            'question_id': f'eq.{question_id}',
            'language': f'eq.{language}',
            'type': f'eq.{content_type}',
            'select': 'content'
        }
        
        with httpx.Client() as client:
            response = client.get(url, headers=HEADERS, params=params)
            
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    return data[0]['content']
            return None
    except Exception as e:
        print(f"   ⚠️ Cache check error: {e}")
        return None


def save_to_cache(question_id: str, language: str, content_type: str, content: str) -> bool:
    """Lưu kết quả vào Supabase cache (upsert)"""
    try:
        url = f"{SUPABASE_URL}/rest/v1/ai_cache"
        
        # Upsert headers
        upsert_headers = HEADERS.copy()
        upsert_headers['Prefer'] = 'resolution=merge-duplicates'
        
        data = {
            'question_id': question_id,
            'language': language,
            'type': content_type,
            'content': content
        }
        
        with httpx.Client() as client:
            response = client.post(url, headers=upsert_headers, json=data)
            
            if response.status_code in [200, 201, 204]:
                return True
            else:
                print(f"   ⚠️ Save response: {response.status_code} - {response.text}")
                return False
    except Exception as e:
        print(f"   ❌ Save error: {e}")
        return False


def format_options(options: list) -> str:
    """Format options thành chuỗi đánh số"""
    return '\n'.join([f"{chr(65+i)}. {opt}" for i, opt in enumerate(options)])


def fetch_questions(start: int, end: int) -> list:
    """Lấy danh sách câu hỏi từ Supabase"""
    try:
        url = f"{SUPABASE_URL}/rest/v1/questions"
        params = {'select': '*'}
        
        with httpx.Client() as client:
            response = client.get(url, headers=HEADERS, params=params)
            
            if response.status_code != 200:
                print(f"❌ Error fetching questions: {response.status_code}")
                return []
            
            questions = response.json()
        
        # Sort by numeric part of id (e.g., "q1" -> 1)
        def get_number(q):
            question_id = q.get('id', '')
            # Extract number from id like "q1", "q2", etc.
            num_str = ''.join(filter(str.isdigit, question_id))
            return int(num_str) if num_str else 0
        
        questions.sort(key=get_number)
        
        # Filter by range (1-indexed)
        filtered = []
        for q in questions:
            num = get_number(q)
            if start <= num <= end:
                filtered.append(q)
        
        return filtered
    except Exception as e:
        print(f"❌ Error fetching questions: {e}")
        return []


def process_question(
    question: dict,
    language: str,
    content_types: list,
    force: bool = False
) -> dict:
    """Xử lý một câu hỏi - tạo cache cho theory và/hoặc explanation"""
    question_id = question['id']
    question_text = question['question']
    options = question['options']
    correct_answer = question['correct_answer']
    
    options_str = format_options(options)
    results = {'id': question_id, 'theory': None, 'explanation': None}
    
    for content_type in content_types:
        # Check existing cache
        if not force:
            existing = get_cached_content(question_id, language, content_type)
            if existing:
                print(f"   ✓ {content_type.capitalize()} đã có cache, bỏ qua")
                results[content_type] = 'cached'
                continue
        
        # Generate content
        key_idx = (current_key_index % len(GEMINI_API_KEYS)) + 1
        print(f"   🤖 Đang tạo {content_type} (key {key_idx}/{len(GEMINI_API_KEYS)})...")
        
        if content_type == 'theory':
            prompt = get_theory_prompt(question_text, options_str, language)
        else:
            prompt = get_explanation_prompt(question_text, options_str, correct_answer, language)
        
        content = call_gemini(prompt)
        
        if content:
            # Save to cache
            if save_to_cache(question_id, language, content_type, content):
                print(f"   ✅ {content_type.capitalize()} đã lưu vào cache")
                results[content_type] = 'success'
            else:
                results[content_type] = 'save_failed'
        else:
            results[content_type] = 'api_failed'
        
        # Rate limiting - wait between API calls
        time.sleep(0.5)
    
    return results


def parse_range(range_str: str) -> tuple:
    """Parse range string như '1-10' thành (1, 10)"""
    try:
        if '-' in range_str:
            parts = range_str.split('-')
            return int(parts[0]), int(parts[1])
        else:
            num = int(range_str)
            return num, num
    except ValueError:
        print(f"❌ Invalid range format: {range_str}")
        print("   Sử dụng format: 1-10 hoặc 5")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description='Cache AI responses cho câu hỏi AWS SAA-C03',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ví dụ:
    python cache_ai.py 1-10             # Cache câu 1-10, CẢ HAI ngôn ngữ (vi + en)
    python cache_ai.py 1-50 --lang vi   # Cache câu 1-50, CHỈ tiếng Việt
    python cache_ai.py 1-50 --lang en   # Cache câu 1-50, CHỈ tiếng Anh
    python cache_ai.py 1-10 --type theory  # Chỉ cache theory
    python cache_ai.py 5-5              # Cache chỉ câu 5
    python cache_ai.py 1-10 --force     # Ghi đè cache cũ
        """
    )
    
    parser.add_argument('range', help='Range câu hỏi (vd: 1-10, 5-20, 1)')
    parser.add_argument('--lang', choices=['vi', 'en'], default=None,
                        help='Ngôn ngữ output (default: cả vi và en)')
    parser.add_argument('--type', choices=['theory', 'explanation', 'both'], default='both',
                        help='Loại content cần cache (default: both)')
    parser.add_argument('--force', action='store_true',
                        help='Ghi đè cache cũ')
    
    args = parser.parse_args()
    
    # Parse range
    start, end = parse_range(args.range)
    
    # Determine content types
    if args.type == 'both':
        content_types = ['theory', 'explanation']
    else:
        content_types = [args.type]
    
    # Determine languages - if not specified, run for all languages
    if args.lang:
        languages = [args.lang]
        lang_display = 'Tiếng Việt' if args.lang == 'vi' else 'English'
    else:
        languages = ['vi', 'en']
        lang_display = 'Tiếng Việt + English (all)'
    
    print(f"""
╔══════════════════════════════════════════════════════════════╗
║           AWS SAA-C03 AI Cache Builder                       ║
╠══════════════════════════════════════════════════════════════╣
║  Range: {start} - {end}                                              
║  Language: {lang_display}                                      
║  Types: {', '.join(content_types)}                                    
║  Force: {'Yes' if args.force else 'No'}                                              
║  API Keys: {len(GEMINI_API_KEYS)} keys (rotating)                              
╚══════════════════════════════════════════════════════════════╝
""")
    
    # Fetch questions
    print(f"📚 Đang lấy câu hỏi từ {start} đến {end}...")
    questions = fetch_questions(start, end)
    
    if not questions:
        print("❌ Không tìm thấy câu hỏi nào trong range này!")
        return
    
    print(f"✅ Tìm thấy {len(questions)} câu hỏi\n")
    
    # Process each question for each language
    stats = {'success': 0, 'cached': 0, 'failed': 0}
    total_tasks = len(questions) * len(languages)
    current_task = 0
    
    for language in languages:
        lang_name = 'Tiếng Việt' if language == 'vi' else 'English'
        print(f"\n{'='*60}")
        print(f"🌐 Đang xử lý ngôn ngữ: {lang_name} ({language})")
        print(f"{'='*60}\n")
        
        for i, question in enumerate(questions, 1):
            current_task += 1
            print(f"[{current_task}/{total_tasks}] Câu hỏi: {question['id']} ({language})")
            
            results = process_question(
                question,
                language,
                content_types,
                args.force
            )
            
            for content_type in content_types:
                if results[content_type] == 'success':
                    stats['success'] += 1
                elif results[content_type] == 'cached':
                    stats['cached'] += 1
                else:
                    stats['failed'] += 1
            
            print()
    
    # Summary
    print(f"""
╔══════════════════════════════════════════════════════════════╗
║                        KẾT QUẢ                               ║
╠══════════════════════════════════════════════════════════════╣
║  ✅ Thành công: {stats['success']:>3}                                         
║  📦 Đã có cache: {stats['cached']:>3}                                        
║  ❌ Thất bại: {stats['failed']:>3}                                           
║  📊 Tổng tasks: {stats['success'] + stats['cached'] + stats['failed']:>3}                                         
╚══════════════════════════════════════════════════════════════╝
""")


if __name__ == '__main__':
    main()
