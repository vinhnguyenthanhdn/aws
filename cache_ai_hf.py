"""
Hugging Face Cache Builder Script
---------------------------------
Tạo cache AI cho các câu hỏi AWS SAA-C03 sử dụng Hugging Face Inference API.
Model mặc định: mistralai/Mistral-7B-Instruct-v0.3

Cách sử dụng:
    python cache_ai_hf.py 1-10           # Cache câu hỏi từ 1 đến 10
    python cache_ai_hf.py 1-10 --lang en # Cache cho tiếng Anh
    python cache_ai_hf.py 1-10 --force   # Ghi đè cache cũ

Yêu cầu:
    pip install httpx huggingface_hub python-dotenv
"""

import os
import sys
import argparse
import time
from typing import Optional
from dotenv import load_dotenv
import httpx

try:
    from huggingface_hub import InferenceClient
except ImportError:
    print("❌ Error: Module 'huggingface_hub' chưa được cài đặt.")
    print("   Vui lòng chạy: pip install huggingface_hub")
    sys.exit(1)

# Load environment variables
load_dotenv()

# Configuration
SUPABASE_URL = os.getenv('VITE_SUPABASE_URL') or os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('VITE_SUPABASE_ANON_KEY') or os.getenv('SUPABASE_KEY')

# Hugging Face Configuration
HUGGINGFACE_API_KEY = os.getenv('HUGGINGFACE_API_KEY')
# Good free models: 
# - meta-llama/Meta-Llama-3-8B-Instruct (Recommended for Chat API)
# - mistralai/Mistral-7B-Instruct-v0.3
# - microsoft/Phi-3-mini-4k-instruct
HF_MODEL = os.getenv('HF_MODEL') or "meta-llama/Meta-Llama-3-8B-Instruct"

# Validate configuration
if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: SUPABASE_URL và SUPABASE_KEY chưa được cấu hình!")
    sys.exit(1)

if not HUGGINGFACE_API_KEY:
    print("❌ Error: HUGGINGFACE_API_KEY chưa được cấu hình trong file .env!")
    sys.exit(1)

print(f"🔑 Using Hugging Face API Key: {HUGGINGFACE_API_KEY[:4]}...{HUGGINGFACE_API_KEY[-4:]}")
print(f"🤖 Model: {HF_MODEL}")

# Supabase REST API headers
HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
}


def get_theory_prompt(question: str, options: str, language: str) -> str:
    """Tạo prompt cho Lý Thuyết (Theory)"""
    language_instruction = 'Vui lòng trả lời bằng tiếng Việt.' if language == 'vi' else 'Please respond in English.'
    
    prompt_structure = """## Cơ sở lý thuyết các thuật ngữ trong câu hỏi

Liệt kê và giải thích TẤT CẢ các AWS services, concepts, và thuật ngữ kỹ thuật được đề cập trong câu hỏi.

Định dạng cho mỗi thuật ngữ:
- **Tên thuật ngữ** (in đậm, không có dấu hai chấm)
- Giải thích ngắn gọn và đầy đủ về thuật ngữ đó (trên dòng mới)

## Cơ sở lý thuyết các thuật ngữ trong đáp án

Liệt kê và giải thích TẤT CẢ các AWS services, concepts, và thuật ngữ kỹ thuật xuất hiện trong các đáp án (A, B, C, D).

Định dạng cho mỗi thuật ngữ:
- **Tên thuật ngữ** (in đậm, không có dấu hai chấm)
- Giải thích ngắn gọn và đầy đủ về thuật ngữ đó (trên dòng mới)

QUAN TRỌNG: KHÔNG dùng dấu hai chấm (:) sau tên thuật ngữ.""" if language == 'vi' else """## Theoretical Foundation of Question Terms

List and explain ALL AWS services, concepts, and technical terms mentioned in the question.

Format for each term:
- **Term name** (bold, NO colon)
- Concise but thorough explanation (on new line)

## Theoretical Foundation of Answer Terms

List and explain ALL AWS services, concepts, and technical terms appearing in the answers (A, B, C, D).

Format for each term:
- **Term name** (bold, NO colon)
- Concise but thorough explanation (on new line)

IMPORTANT: Do NOT use colons (:) after term names."""
    
    return f"""You are an AWS Solutions Architect expert. Provide theoretical foundation for this question.

Question: {question}

Options:
{options}

{language_instruction}

IMPORTANT: Start directly with the theoretical content. Do NOT include any greetings, introductions, or conclusions. Go straight to the structured content below.

Provide a comprehensive theoretical breakdown:

{prompt_structure}

Keep the theory organized and easy to reference (max 500 words)."""


def get_explanation_prompt(question: str, options: str, correct_answer: str, language: str) -> str:
    """Tạo prompt cho Giải thích (Explanation)"""
    language_instruction = 'Vui lòng trả lời bằng tiếng Việt.' if language == 'vi' else 'Please respond in English.'
    
    prompt_structure = f"""## Giải thích câu hỏi

Phân tích yêu cầu chính của câu hỏi, xác định các điểm mấu chốt cần chú ý.

## Giải thích đáp án đúng

Tại sao đáp án {correct_answer} là đúng? Giải thích chi tiết.

## Tại sao không chọn các đáp án khác

Phân tích từng đáp án sai, giải thích lý do.

## Các lỗi thường gặp

Liệt kê các lỗi mà thí sinh hay mắc phải.

## Mẹo để nhớ

Cung cấp các mẹo, tricks để áp dụng cho các câu hỏi tương tự.

QUAN TRỌNG: Khi đề cập đến các keywords hoặc concepts trong nội dung, viết chúng ở dạng **in đậm** KHÔNG CÓ dấu hai chấm (:) phía sau. Ví dụ: **Keyword** chứ không phải **Keyword:**""" if language == 'vi' else f"""## Question Analysis

Analyze the main requirements of the question and identify the key points.

## Correct Answer Explanation

Why is answer {correct_answer} correct? Explain in detail.

## Why Other Answers Are Wrong

Analyze each incorrect answer and explain why.

## Common Mistakes

List the mistakes students often make.

## Tips to Remember

Provide tips and tricks to apply to similar questions.

IMPORTANT: When mentioning keywords or concepts in content, write them in **bold** withOUT colons (:) after. Example: **Keyword** NOT **Keyword:**"""
    
    return f"""You are an AWS Solutions Architect expert. Analyze this SAA-C03 exam question.

Question: {question}

Options:
{options}

Correct Answer: {correct_answer}

{language_instruction}

IMPORTANT: Start directly with the analysis. Do NOT include any greetings, introductions, or conclusions. Go straight to the structured content.

Do NOT use colons (:) after bold keywords. Write descriptions on the same line or new line without colons.

Provide a comprehensive explanation:

{prompt_structure}

Keep the explanation structured and easy to understand (max 500 words)."""

def call_huggingface(prompt: str, max_retries: int = 5) -> Optional[str]:
    """Gọi Hugging Face API với retry logic cao hơn cho Serverless endpoints"""
    client = InferenceClient(api_key=HUGGINGFACE_API_KEY)

    for attempt in range(max_retries):
        try:
            # Try chat completion first (best for Instruction/Chat models)
            try:
                messages = [
                    {"role": "system", "content": "You are a helpful AWS expert assistant."},
                    {"role": "user", "content": prompt}
                ]
                
                response = client.chat_completion(
                    model=HF_MODEL,
                    messages=messages,
                    max_tokens=1500,
                    temperature=0.7
                )
                return response.choices[0].message.content
            
            except Exception as e:
                # If model doesn't support chat, fallback to text generation
                if "not a chat model" in str(e).lower() or "invalid_request_error" in str(e).lower():
                    print(f"   ℹ️ Model doesn't support Chat API, falling back to text generation...")
                    # Manual basic formatting for Instruction models
                    formatted_prompt = f"[INST] {prompt} [/INST]"
                    response = client.text_generation(
                        formatted_prompt,
                        model=HF_MODEL,
                        max_new_tokens=1500,
                        temperature=0.7
                    )
                    return response
                raise e # Re-raise if it's not a chat model specific error

        except Exception as e:
            error_str = str(e).lower()
            
            # Handling model loading (503) or rate limits (429)
            if '503' in error_str or 'loading' in error_str:
                print(f"   ⏳ Model is loading... waiting longer (Attempt {attempt + 1})")
                time.sleep(10) # Wait longer for model load
                continue
                
            print(f"   ⚠️ Attempt {attempt + 1} failed: {e}")
            
            if attempt < max_retries - 1:
                wait_time = (attempt + 1) * 3
                time.sleep(wait_time)
    
    print("   ❌ Hugging Face API call failed after retries")
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
    """Lưu kết quả vào Supabase cache (delete + insert)"""
    try:
        url = f"{SUPABASE_URL}/rest/v1/ai_cache"
        
        with httpx.Client() as client:
            # Step 1: Delete existing record
            delete_params = {
                'question_id': f'eq.{question_id}',
                'language': f'eq.{language}',
                'type': f'eq.{content_type}'
            }
            client.delete(url, headers=HEADERS, params=delete_params)
            
            # Step 2: Insert new record
            data = {
                'question_id': question_id,
                'language': language,
                'type': content_type,
                'content': content
            }
            
            response = client.post(url, headers=HEADERS, json=data)
            return response.status_code in [200, 201, 204]
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
                return []
            questions = response.json()
        
        def get_number(q):
            num_str = ''.join(filter(str.isdigit, q.get('id', '')))
            return int(num_str) if num_str else 0
        
        questions.sort(key=get_number)
        
        filtered = []
        for q in questions:
            num = get_number(q)
            if start <= num <= end:
                filtered.append(q)
        return filtered
    except Exception as e:
        print(f"❌ Error fetching questions: {e}")
        return []


def process_question(question: dict, language: str, content_types: list, force: bool = False) -> dict:
    """Xử lý một câu hỏi"""
    question_id = question['id']
    question_text = question['question']
    options = question['options']
    correct_answer = question['correct_answer']
    
    options_str = format_options(options)
    results = {'id': question_id, 'theory': None, 'explanation': None}
    
    for content_type in content_types:
        if not force:
            if get_cached_content(question_id, language, content_type):
                print(f"   ✓ {content_type.capitalize()} đã có cache, bỏ qua")
                results[content_type] = 'cached'
                continue
        
        print(f"   🤖 Đang tạo {content_type} với Hugging Face ({HF_MODEL})...")
        
        if content_type == 'theory':
            prompt = get_theory_prompt(question_text, options_str, language)
        else:
            prompt = get_explanation_prompt(question_text, options_str, correct_answer, language)
        
        content = call_huggingface(prompt)
        
        if content:
            if save_to_cache(question_id, language, content_type, content):
                print(f"   ✅ {content_type.capitalize()} đã lưu vào cache")
                results[content_type] = 'success'
            else:
                results[content_type] = 'save_failed'
        else:
            results[content_type] = 'api_failed'
        
        # Hugging Face rate limits can be strict on free tier
        time.sleep(3) 
    
    return results


def main():
    parser = argparse.ArgumentParser(description='AWS AI Cache Builder (Hugging Face)')
    parser.add_argument('range', help='Range câu hỏi (VD: 1-10)')
    parser.add_argument('--lang', default='vi', choices=['vi', 'en'], help='Ngôn ngữ (vi/en)')
    parser.add_argument('--type', choices=['theory', 'explanation'], help='Loại nội dung (optional)')
    parser.add_argument('--force', action='store_true', help='Ghi đè cache cũ')
    
    args = parser.parse_args()
    
    try:
        start, end = map(int, args.range.split('-'))
    except ValueError:
        print("❌ Invalid range format. Use: start-end (e.g., 1-10)")
        sys.exit(1)
    
    print(f"\n╔══════════════════════════════════════════════════════════════╗")
    print(f"║           AWS SAA-C03 AI Cache Builder (Hugging Face)        ║")
    print(f"╠══════════════════════════════════════════════════════════════╣")
    print(f"║  Range: {start} - {end}                                              ")
    print(f"║  Language: {'Tiếng Việt' if args.lang == 'vi' else 'English'}                                      ")
    print(f"║  Model: {HF_MODEL}")
    print(f"╚══════════════════════════════════════════════════════════════╝\n")
    
    print(f"📚 Đang lấy câu hỏi từ {start} đến {end}...")
    questions = fetch_questions(start, end)
    print(f"✅ Tìm thấy {len(questions)} câu hỏi")
    
    content_types = [args.type] if args.type else ['theory', 'explanation']
    
    for i, q in enumerate(questions):
        print(f"\n[{i+1}/{len(questions)}] Câu hỏi: {q['id']} ({args.lang})")
        process_question(q, args.lang, content_types, args.force)

if __name__ == "__main__":
    main()
