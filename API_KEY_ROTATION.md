# API Key Rotation & Error Handling

## 🎯 Objective

Implement automatic API key rotation with user-friendly error messages when all keys are exhausted.

---

## ✅ Implementation

### 1. **ai-service.ts** - API Key Rotation Logic

**Before:**
```typescript
// Random pick ONE key
const apiKey = getApiKey();
const genAI = new GoogleGenerativeAI(apiKey);
// If fails → throw error immediately
```

**After:**
```typescript
// Get ALL keys
const apiKeys = getAllApiKeys();

// Try each key until one succeeds
for (let i = 0; i < apiKeys.length; i++) {
    try {
        // Try this key
        const genAI = new GoogleGenerativeAI(apiKeys[i]);
        const result = await model.generateContent(prompt);
        return result; // Success!
    } catch (error) {
        // Check if rate limit
        if (error includes 'quota' || 'rate' || '429') {
            console.warn('Rate limited, trying next key...');
            continue; // Try next key
        }
    }
}

// All keys failed
throw new Error('AI_SERVICE_UNAVAILABLE');
```

---

### 2. **App.tsx** - User-Friendly Error Messages

**Before:**
```typescript
catch (error) {
    console.error('Error:', error);
    setActiveAISection(null); // Silent fail
}
```

**After:**
```typescript
catch (error: any) {
    if (error?.message === 'AI_SERVICE_UNAVAILABLE') {
        // Rate limit error
        alert(language === 'vi'
            ? '⚠️ Dịch vụ AI hiện đang quá tải. Vui lòng thử lại sau vài phút.'
            : '⚠️ AI service is currently overloaded. Please try again in a few minutes.');
    } else {
        // Other errors
        alert(language === 'vi'
            ? '❌ Không thể tải nội dung. Vui lòng thử lại.'
            : '❌ Failed to load content. Please try again.');
    }
    setActiveAISection(null);
}
```

---

## 🔄 How It Works

### Normal Flow:
```
User clicks "Explain" button
  ↓
Check cache first
  ↓
Cache miss → Call API
  ↓
Try key 1 → Success ✅
  ↓
Display content
```

### Error Flow (Rate Limit):
```
User clicks "Explain" button
  ↓
Check cache first
  ↓
Cache miss → Call API
  ↓
Try key 1 → Rate limited ⚠️
  ↓
Try key 2 → Rate limited ⚠️
  ↓
Try key 3 → Rate limited ⚠️
  ↓
All keys exhausted ❌
  ↓
Throw 'AI_SERVICE_UNAVAILABLE'
  ↓
Show user message:
"⚠️ Dịch vụ AI hiện đang quá tải. 
Vui lòng thử lại sau vài phút."
```

---

## 📊 Console Logs

Users khi develop sẽ thấy:

### Success Case:
```
🔑 Trying key 1/5...
✅ key 1/5 succeeded
✅ Cache HIT for explanation: Q1 (vi)
```

### Rate Limit Case:
```
🔑 Trying key 1/5...
⚠️ key 1/5 rate limited, trying next key...
🔑 Trying key 2/5...
⚠️ key 2/5 rate limited, trying next key...
🔑 Trying key 3/5...
⚠️ key 3/5 rate limited, trying next key...
❌ All API keys exhausted!
```

---

## 🎨 Error Messages

### Vietnamese:
- **Rate Limit**: `⚠️ Dịch vụ AI hiện đang quá tải. Vui lòng thử lại sau vài phút.`
- **Other Error**: `❌ Không thể tải [lý thuyết/giải thích]. Vui lòng thử lại.`

### English:
- **Rate Limit**: `⚠️ AI service is currently overloaded. Please try again in a few minutes.`
- **Other Error**: `❌ Failed to load [theory/explanation]. Please try again.`

---

## 📁 Files Modified

1. **`src/lib/ai-service.ts`**
   - ✅ Added `getAllApiKeys()` function
   - ✅ Updated `callGeminiAPI()` with retry logic
   - ✅ Throws `AI_SERVICE_UNAVAILABLE` when all keys fail

2. **`src/App.tsx`**
   - ✅ Updated `handleRequestTheory()` error handling
   - ✅ Updated `handleRequestExplanation()` error handling
   - ✅ Added user-friendly error messages (bilingual)

---

## 🚀 Benefits

1. ✅ **Automatic Failover** - Seamlessly tries next key if one fails
2. ✅ **Better UX** - Users get clear messages instead of silent failures
3. ✅ **Bilingual Support** - Messages in Vietnamese and English
4. ✅ **Better Debugging** - Console logs show exactly which key failed and why
5. ✅ **Graceful Degradation** - System tries all options before failing

---

## 💡 Future Improvements

### Option 1: Replace alert() with Toast Notification
```typescript
import { toast } from 'react-toastify';

// Instead of alert()
toast.error(errorMessage, {
    position: "top-center",
    autoClose: 5000,
});
```

### Option 2: Show inline error in AI content section
```typescript
setAiContent(prev => ({
    ...prev,
    [cacheKey]: '⚠️ Service temporarily unavailable...'
}));
```

### Option 3: Add retry button
```typescript
<div className="ai-error">
    <p>{errorMessage}</p>
    <button onClick={retry}>Retry</button>
</div>
```

---

## ✅ Testing

### Test Case 1: Normal Operation
1. Click "Explain" or "Theory"
2. Should work with first available key
3. Content displays normally

### Test Case 2: One Key Fails
1. Invalidate one key in .env
2. Click "Explain"
3. Should automatically try next key
4. Content displays with working key

### Test Case 3: All Keys Exhausted
1. Invalidate all keys or hit rate limit
2. Click "Explain"
3. Should show error message:
   - "⚠️ Dịch vụ AI hiện đang quá tải..."
4. Loading stops
5. AI section closes

---

## 📝 Notes

- **Alert** is used for immediate feedback (can be replaced with toast later)
- Error messages are **bilingual** based on current language setting
- Console logs help with **debugging** in production
- System is **backward compatible** - works with single key or multiple keys
