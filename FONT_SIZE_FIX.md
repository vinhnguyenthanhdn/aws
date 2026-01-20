# Font Size Synchronization Fix

## 🔍 Vấn đề phát hiện

Khi so sánh HTML của 2 sections:

### 🤖 Giải thích AI (Explanation):
```html
<h2>Giải thích câu hỏi</h2>
<h2>Giải thích đáp án đúng</h2>
<h2>Tại sao không chọn các đáp án khác</h2>
```

### 📚 Lý thuyết AI (Theory):
```html
<h3>1. Cơ sở lý thuyết các thuật ngữ trong câu hỏi</h3>
<h3>2. Cơ sở lý thuyết các thuật ngữ trong đáp án</h3>
```

**Vấn đề**: 
- Explanation dùng `<h2>` 
- Theory dùng `<h3>`
- CSS cũ có `.markdown-body h3 { font-size: 1.1em; }` nhưng h2 không có → **Font size khác nhau!**

---

## ✅ Giải pháp

### Trước:
```css
.markdown-body h1,
.markdown-body h2,
.markdown-body h3 {
    font-weight: 700;
}

.markdown-body h3 {
    font-size: 1.1em;  /* Only h3 has size */
}
```

### Sau:
```css
.markdown-body h1,
.markdown-body h2,
.markdown-body h3 {
    font-weight: 700;
    font-size: 1.15rem;  /* ALL headings same size */
}
```

---

## 📁 File Updated
**`src/styles/AIContent.css`**

---

## 🎨 Kết quả

Bây giờ **TẤT CẢ** headings trong cả Explanation và Theory sections đều có:
- ✅ **Cùng font-size**: `1.15rem`
- ✅ **Cùng font-weight**: `700`
- ✅ **Cùng margin**: `1.5em` (top), `0.75em` (bottom)
- ✅ **Cùng color**: `var(--color-text-primary)`

Dù Explanation dùng h2 và Theory dùng h3, chúng sẽ trông **giống hệt nhau**! ✨

---

## 📊 Visual Consistency Achieved

Cả hai sections giờ có:
1. ✅ Cùng background color
2. ✅ Cùng border color
3. ✅ Cùng header color (h3 title)
4. ✅ **Cùng content heading size (h1, h2, h3)** ← NEW!
5. ✅ Cùng body text size
6. ✅ Cùng spacing

**Hoàn toàn đồng bộ!** 🎉
