# Rate Limit Quick Fix Guide

## 🚨 What to Do When You Hit Rate Limits

### Immediate Actions

1. **Wait and Retry**
   - The API client now automatically retries on rate limit errors (429)
   - It respects the `Retry-After` header from the server
   - Uses exponential backoff with jitter if no header is provided

2. **Check Your Usage**
   - Backend default: 60 requests per minute
   - Check logs to see if you're hitting limits frequently

3. **User-Friendly Messages**
   - Users now see: "Rate limit exceeded. Please try again in X seconds."
   - The app automatically retries when possible

---

## ✅ What's Been Fixed

### Enhanced API Client (`frontend/src/api.js`)

**Before:**
- ❌ Skipped all 4xx errors (including 429 rate limits)
- ❌ No retry on rate limits
- ❌ Didn't respect Retry-After headers

**After:**
- ✅ Specifically handles 429 rate limit errors
- ✅ Retries with exponential backoff
- ✅ Respects Retry-After headers from server
- ✅ User-friendly error messages with wait times
- ✅ Jitter added to prevent thundering herd

---

## 🔧 Configuration Options

### Backend Rate Limits

Set in environment variables:
```bash
RATE_LIMIT_ENABLED=true
RATE_LIMIT_PER_MINUTE=60  # Adjust as needed
```

### Frontend Retry Behavior

The API client now:
- Retries up to 3 times on rate limit errors
- Waits for `Retry-After` header if provided
- Uses exponential backoff (1s, 2s, 4s) with jitter if no header
- Shows user-friendly error messages

---

## 📋 Best Practices

### 1. **Respect Rate Limits**
- Don't spam requests
- Use caching to reduce API calls
- Batch requests when possible

### 2. **Handle Gracefully**
- Show clear error messages
- Automatically retry when appropriate
- Don't frustrate users

### 3. **Monitor Usage**
- Track rate limit events
- Adjust limits if needed
- Consider upgrading service tier

---

## 🎯 Common Scenarios

### Scenario 1: User Hits Rate Limit
**What happens:**
1. Request returns 429 with `Retry-After: 30`
2. API client waits 30 seconds
3. Automatically retries
4. If successful, user sees result
5. If still rate limited, shows error with wait time

### Scenario 2: Multiple Users Hitting Limits
**Solution:**
- Increase `RATE_LIMIT_PER_MINUTE` in backend
- Implement request queuing
- Use caching to reduce requests

### Scenario 3: External API Rate Limits
**Solution:**
- Implement aggressive caching
- Batch requests
- Use multiple API keys with rotation

---

## 🚀 Quick Commands

### Check Current Rate Limit Settings
```bash
# Backend
grep RATE_LIMIT backend/.env

# Or check config
cat backend/config.py | grep RATE_LIMIT
```

### Adjust Rate Limits
```bash
# Edit .env file
RATE_LIMIT_PER_MINUTE=120  # Increase to 120 requests/minute
```

### Test Rate Limit Handling
```javascript
// In browser console
// Make many rapid requests to test
for (let i = 0; i < 100; i++) {
    fetch('/api/voices').catch(console.error);
}
```

---

## 📊 Monitoring

### Check Rate Limit Events in Logs
```bash
# Backend logs
grep "Rate limit exceeded" logs/app.log

# Or check metrics endpoint
curl http://localhost:8000/api/metrics
```

---

## ✨ Summary

**What Changed:**
- ✅ API client now handles 429 errors properly
- ✅ Respects Retry-After headers
- ✅ Automatic retry with exponential backoff
- ✅ User-friendly error messages

**What You Should Do:**
1. ✅ Nothing! It's automatic now
2. ✅ Monitor rate limit events
3. ✅ Adjust limits if needed
4. ✅ Consider caching for frequently accessed data

**Result:**
- 🎉 Better user experience
- 🎉 Automatic retry on rate limits
- 🎉 Clear error messages
- 🎉 No more silent failures

---

**The rate limit handling is now production-ready!** 🚀

