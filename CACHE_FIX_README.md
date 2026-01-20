# Fix Cache Duplicate Issue

## 🔴 Vấn đề
Database có nhiều bản ghi trùng lặp cho cùng một `(question_id, language, type)`, gây lỗi khi query với `.maybeSingle()`.

**Lỗi:**
```
PGRST116: Results contain 7 rows, application/vnd.pgrst.object+json requires 1 row
```

## ✅ Giải pháp đã thực hiện

### 1. **Sửa code** (`ai-service.ts`)
- Thêm `.order('created_at', { ascending: false }).limit(1)` để lấy bản ghi mới nhất
- Bây giờ code sẽ hoạt động ngay cả khi có duplicate

### 2. **Cleanup database** (`fix_duplicate_cache.sql`)
- **Xóa duplicates**: Giữ lại bản ghi mới nhất cho mỗi `(question_id, language, type)`
- **Thêm UNIQUE constraint**: Ngăn chặn duplicate trong tương lai

## 📝 Hướng dẫn thực hiện

### Bước 1: Deploy code mới
```bash
git add .
git commit -m "fix: handle duplicate cache entries"
git push
```

### Bước 2: Chạy SQL script trong Supabase
1. Vào **Supabase Dashboard** → **SQL Editor**
2. Mở file `fix_duplicate_cache.sql`
3. Copy nội dung và paste vào SQL Editor
4. Click **Run** để thực thi

### Bước 3: Verify
Sau khi chạy SQL, kiểm tra:
- Query cuối cùng trong script sẽ cho biết có còn duplicate không
- Nếu kết quả trống = thành công! ✅

## 🧪 Test
Sau khi deploy + cleanup:
1. Mở browser console (F12)
2. Click vào câu hỏi bất kỳ
3. Click "Explanation" hoặc "Theory"
4. Sẽ thấy: `✅ Cache HIT for explanation: Q1 (vi)`

## 📊 Monitoring
Console logs giờ sẽ hiển thị:
- ✅ `Cache HIT` - Tìm thấy cache
- 📭 `No cache found` - Chưa có cache
- 🔄 `Calling Gemini API` - Tạo cache mới
- ❌ `Database error` - Lỗi database (kèm chi tiết)
