# Rate Limit Handling - Best Practices Guide

## 🚨 What Are Rate Limits?

Rate limits are restrictions on how many requests you can make to an API or service within a specific time period. Common scenarios:

1. **API Rate Limits** - External APIs (GitHub, OpenAI, etc.)
2. **Backend Rate Limits** - Your own server protecting resources
3. **Service Rate Limits** - Hosting platforms (Vercel, Netlify, etc.)

---

## ✅ Current Implementation Status

### ✅ What We Have
- ✅ Exponential backoff retry logic
- ✅ Backend rate limiting (token bucket algorithm)
- ✅ Rate limit error handling (429 status codes)
- ✅ Retry-After header support in backend

### ⚠️ What Needs Improvement
- ⚠️ Frontend doesn't retry on 429 errors (currently skips all 4xx)
- ⚠️ Frontend doesn't respect Retry-After headers
- ⚠️ No user-friendly rate limit messages

---

## 🎯 Best Practices for Rate Limit Handling

### 1. **Respect Retry-After Headers**
When a server returns `429 Too Many Requests`, it often includes a `Retry-After` header telling you exactly when to retry.

```javascript
// Good: Respect Retry-After header
const retryAfter = response.headers.get('Retry-After');
if (retryAfter) {
    await sleep(parseInt(retryAfter) * 1000);
    return retry();
}
```

### 2. **Exponential Backoff with Jitter**
Add randomness to prevent "thundering herd" problem:

```javascript
// Good: Exponential backoff with jitter
const baseDelay = 1000;
const maxDelay = 30000;
const delay = Math.min(
    baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
    maxDelay
);
```

### 3. **Different Strategies for Different Errors**
- **429 (Rate Limit)**: Retry with exponential backoff + Retry-After
- **5xx (Server Error)**: Retry with exponential backoff
- **4xx (Client Error)**: Don't retry (except 429)
- **Timeout**: Retry once or twice

### 4. **User-Friendly Error Messages**
Show users what happened and when they can try again:

```javascript
if (error.status === 429) {
    const retryAfter = error.headers?.get('Retry-After');
    const message = retryAfter 
        ? `Rate limit exceeded. Please try again in ${retryAfter} seconds.`
        : `Rate limit exceeded. Please try again in a moment.`;
}
```

### 5. **Circuit Breaker Pattern**
Stop retrying if service is consistently failing:

```javascript
if (consecutiveFailures > 5) {
    // Stop retrying, show error
    throw new Error("Service temporarily unavailable");
}
```

### 6. **Request Queuing**
For high-frequency operations, queue requests instead of failing:

```javascript
const requestQueue = [];
let processing = false;

async function queueRequest(request) {
    return new Promise((resolve, reject) => {
        requestQueue.push({ request, resolve, reject });
        processQueue();
    });
}
```

---

## 🔧 Implementation: Enhanced Rate Limit Handling

### Updated API Client Strategy

```javascript
// Rate limit handling strategy
const handleRateLimit = async (error, attempt, maxRetries) => {
    if (error.status !== 429) {
        return false; // Not a rate limit error
    }
    
    // Get Retry-After header
    const retryAfter = error.headers?.get('Retry-After');
    
    if (retryAfter && attempt < maxRetries) {
        // Wait for the specified time
        const waitTime = parseInt(retryAfter) * 1000;
        await sleep(waitTime);
        return true; // Retry
    }
    
    // No Retry-After header, use exponential backoff
    if (attempt < maxRetries) {
        const delay = Math.min(
            1000 * Math.pow(2, attempt) + Math.random() * 1000,
            30000 // Max 30 seconds
        );
        await sleep(delay);
        return true; // Retry
    }
    
    return false; // Max retries reached
};
```

---

## 📋 Quick Reference: What to Do When You Hit Rate Limits

### Immediate Actions

1. **Check the Error Response**
   ```javascript
   if (error.status === 429) {
       // Rate limit exceeded
   }
   ```

2. **Read Retry-After Header**
   ```javascript
   const retryAfter = response.headers.get('Retry-After');
   ```

3. **Wait and Retry**
   ```javascript
   await sleep(retryAfter * 1000);
   return retry();
   ```

### Long-term Solutions

1. **Implement Caching**
   - Cache responses to reduce API calls
   - Use localStorage for frequently accessed data

2. **Batch Requests**
   - Combine multiple requests into one
   - Use GraphQL for flexible queries

3. **Request Throttling**
   - Limit requests on the client side
   - Use debouncing for user input

4. **Upgrade Service Tier**
   - If hitting limits frequently, consider upgrading
   - Use multiple API keys with rotation

---

## 🛠️ Common Rate Limit Scenarios

### Scenario 1: GitHub API (60 requests/hour)
```javascript
// Solution: Cache aggressively, batch requests
const cache = new Map();
const CACHE_TTL = 3600000; // 1 hour

async function getGitHubData(url) {
    if (cache.has(url)) {
        return cache.get(url);
    }
    const data = await fetch(url);
    cache.set(url, data, CACHE_TTL);
    return data;
}
```

### Scenario 2: Your Own Backend (60 requests/minute)
```javascript
// Solution: Respect Retry-After, show user-friendly message
if (error.status === 429) {
    const retryAfter = error.headers.get('Retry-After');
    showToast(`Rate limit exceeded. Retrying in ${retryAfter}s...`);
    await sleep(retryAfter * 1000);
    return retry();
}
```

### Scenario 3: External API (1000 requests/day)
```javascript
// Solution: Track usage, implement request queuing
class RateLimitedAPI {
    constructor(maxRequests, windowMs) {
        this.requests = [];
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
    }
    
    async request(url) {
        this.cleanup();
        if (this.requests.length >= this.maxRequests) {
            const oldest = this.requests[0];
            const waitTime = oldest + this.windowMs - Date.now();
            await sleep(waitTime);
        }
        this.requests.push(Date.now());
        return fetch(url);
    }
}
```

---

## 📊 Monitoring Rate Limits

### Track Rate Limit Events

```javascript
// Log rate limit events for monitoring
if (error.status === 429) {
    console.warn('Rate limit hit:', {
        endpoint: url,
        retryAfter: error.headers?.get('Retry-After'),
        timestamp: new Date().toISOString()
    });
    
    // Send to analytics
    analytics.track('rate_limit_exceeded', {
        endpoint: url,
        retryAfter: error.headers?.get('Retry-After')
    });
}
```

---

## 🎯 Summary: Best Practices Checklist

- [x] ✅ Respect Retry-After headers
- [x] ✅ Use exponential backoff with jitter
- [x] ✅ Different retry strategies for different errors
- [x] ✅ User-friendly error messages
- [x] ✅ Implement caching to reduce requests
- [x] ✅ Request throttling on client side
- [x] ✅ Circuit breaker for persistent failures
- [x] ✅ Monitor and log rate limit events
- [x] ✅ Queue requests instead of failing
- [x] ✅ Batch requests when possible

---

## 🚀 Next Steps

1. **Update API Client** - Add 429 retry handling (see implementation below)
2. **Add Rate Limit UI** - Show users when they hit limits
3. **Implement Caching** - Reduce unnecessary requests
4. **Monitor Usage** - Track rate limit events

---

**Remember**: Rate limits are there to protect services. Respect them, handle them gracefully, and your users will have a better experience! 🎉

