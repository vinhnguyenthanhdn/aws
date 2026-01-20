# Cache AI Script - Hướng dẫn sử dụng

## 📋 Prerequisites

### 1. Install Python dependencies
```bash
# Option 1: Using requirements.txt (recommended)
pip install -r requirements.txt

# Option 2: Manual installation
pip install httpx google-genai python-dotenv
```

### 2. Verify .env file
File `.env` đã được tạo với:
- ✅ 5 Gemini API keys (rotating)
- ✅ Supabase URL
- ✅ Supabase anon key

## 🚀 Cách sử dụng

### Cú pháp cơ bản
```bash
python cache_ai.py <range> [options]
```

### Ví dụ

#### 1. Cache câu 1-10 (CẢ 2 ngôn ngữ: VI + EN)
```bash
python cache_ai.py 1-10
```

#### 2. Cache câu 1-50 (CHỈ tiếng Việt)
```bash
python cache_ai.py 1-50 --lang vi
```

#### 3. Cache câu 1-50 (CHỈ tiếng Anh)
```bash
python cache_ai.py 1-50 --lang en
```

#### 4. Cache CHỈ Theory
```bash
python cache_ai.py 1-10 --type theory
```

#### 5. Cache CHỈ Explanation
```bash
python cache_ai.py 1-10 --type explanation
```

#### 6. Cache 1 câu cụ thể
```bash
python cache_ai.py 5-5
```

#### 7. Ghi đè cache cũ (Force regenerate)
```bash
python cache_ai.py 1-10 --force
```

#### 8. Combine options
```bash
# Cache câu 1-100, CHỈ tiếng Anh, CHỈ Explanation, Force
python cache_ai.py 1-100 --lang en --type explanation --force
```

## 📊 Output Example

```
╔══════════════════════════════════════════════════════════════╗
║           AWS SAA-C03 AI Cache Builder                       ║
╠══════════════════════════════════════════════════════════════╣
║  Range: 1 - 10                                              
║  Language: Tiếng Việt + English (all)                                      
║  Types: theory, explanation                                    
║  Force: No                                              
║  API Keys: 5 keys (rotating)                              
╚══════════════════════════════════════════════════════════════╝

📚 Đang lấy câu hỏi từ 1 đến 10...
✅ Tìm thấy 10 câu hỏi

============================================================
🌐 Đang xử lý ngôn ngữ: Tiếng Việt (vi)
============================================================

[1/20] Câu hỏi: 1 (vi)
   🤖 Đang tạo theory (key 1/5)...
   ✅ Theory đã lưu vào cache
   🤖 Đang tạo explanation (key 2/5)...
   ✅ Explanation đã lưu vào cache
```

## 🔑 API Key Rotation

Script tự động rotate giữa 5 API keys:
- ✅ Tránh rate limit
- ✅ Maximize throughput
- ✅ Auto-switch khi key bị quota

## ⚠️ Notes

### Rate Limiting
- Script có `time.sleep(0.5)` giữa các API calls
- Nếu gặp rate limit, script tự động switch sang key khác

### Cache Strategy
- Mặc định: Không ghi đè cache cũ
- Dùng `--force` để regenerate

### Error Handling
- Script retry 3 lần cho mỗi API key
- Nếu tất cả keys fail → skip câu hỏi đó

## 📈 Best Practices

### 1. Cache toàn bộ (recommended)
```bash
# Cache tất cả câu hỏi, cả 2 ngôn ngữ
python cache_ai.py 1-1000
```

### 2. Cache by batches
```bash
# Chia nhỏ để dễ monitor
python cache_ai.py 1-100
python cache_ai.py 101-200
python cache_ai.py 201-300
```

### 3. Regenerate English only
```bash
# Nếu cache EN bị lỗi ngôn ngữ
python cache_ai.py 1-1000 --lang en --force
```

## 🧹 Cleanup Before Regenerate

Nếu muốn xóa cache cũ trước khi regenerate:

```sql
-- Xóa cache EN bị lỗi
DELETE FROM ai_cache WHERE language = 'en';

-- Hoặc xóa toàn bộ
DELETE FROM ai_cache;
```

## 📊 Monitor Progress

Kết quả cuối cùng:
```
╔══════════════════════════════════════════════════════════════╗
║                        KẾT QUẢ                               ║
╠══════════════════════════════════════════════════════════════╣
║  ✅ Thành công:  95                                         
║  📦 Đã có cache:  105                                        
║  ❌ Thất bại:    0                                           
║  📊 Tổng tasks:  200                                         
╚══════════════════════════════════════════════════════════════╝
```
