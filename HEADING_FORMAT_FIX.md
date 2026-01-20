# Content Heading Format Standardization

## 🔍 Vấn đề phát hiện

Khi so sánh HTML output, có 3 format khác nhau:

### Source 1 (Chuẩn - Explanation đầu):
```html
<h2>Giải thích câu hỏi</h2>
<h2>Giải thích đáp án đúng</h2>
```
✅ **Format đúng: markdown h2 (`## Heading`)**

### Source 2 (Explanation khác):
```html
<ol>
  <li><strong>Giải thích câu hỏi</strong></li>
  <li><strong>Giải thích đáp án đúng: B</strong></li>
</ol>
```
❌ **Format sai: numbered list**

### Source 3 (Theory):
```html
<p><strong>Cơ sở lý thuyết các thuật ngữ trong câu hỏi:</strong></p>
<p><strong>Cơ sở lý thuyết các thuật ngữ trong đáp án:</strong></p>
```
❌ **Format sai: bold paragraphs**

---

## 🎯 Root Cause

Prompts trong code đang dùng **numbered bold format**:
```
1. **Heading**: Description
2. **Another**: Description
```

AI đôi khi render thành:
- `<ol><li><strong>` (numbered list)
- `<p><strong>` (bold paragraph)
- `<h2>` (heading - ĐÚNG!)

→ **Không nhất quán!**

---

## ✅ Giải pháp

Thay đổi prompts để dùng **markdown h2 heading format**:

### Trước:
```
1. **Giải thích câu hỏi**: Phân tích...
2. **Giải thích đáp án đúng**: Tại sao...
```

### Sau:
```
## Giải thích câu hỏi
Phân tích...

## Giải thích đáp án đúng
Tại sao...
```

---

## 📁 Files Updated

### 1. **`src/lib/ai-service.ts`** (TypeScript)
- ✅ `getAIExplanation()` - Updated prompt structure
- ✅ `getAITheory()` - Updated prompt structure

### 2. **`cache_ai.py`** (Python)
- ✅ `get_explanation_prompt()` - Updated prompt structure
- ✅ `get_theory_prompt()` - Updated prompt structure

---

## 🎨 Kết quả

Bây giờ **TẤT CẢ** AI responses sẽ render với:

### Explanation sections:
```html
<h2>Giải thích câu hỏi</h2>
<h2>Giải thích đáp án đúng</h2>
<h2>Tại sao không chọn các đáp án khác</h2>
<h2>Các lỗi thường gặp</h2>
<h2>Mẹo để nhớ</h2>
```

### Theory sections:
```html
<h2>Cơ sở lý thuyết các thuật ngữ trong câu hỏi</h2>
<h2>Cơ sở lý thuyết các thuật ngữ trong đáp án</h2>
```

---

## ✨ Final Result

Với tất cả các fixes đã làm:

1. ✅ **Same background color** (xanh)
2. ✅ **Same border color** (xanh)
3. ✅ **Same header color** (xanh)
4. ✅ **Same font size for headings** (`1.15rem`)
5. ✅ **Same heading format** (`<h2>`) ← **MỚI FIX!**
6. ✅ **Same spacing**

**100% đồng bộ giữa Explanation và Theory!** 🎉

---

## ⚠️ Lưu ý

Cache cũ vẫn có format cũ. Để có format mới:
- **Option 1**: Xóa cache và regenerate
- **Option 2**: Chờ cache tự nhiên được regenerate
- **Option 3**: Chỉ cache mới sẽ có format mới
