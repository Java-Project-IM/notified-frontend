# 🚀 Quick Start - API v1 Integration

## ✅ What Changed

**API Base URL Updated:**

- ❌ Old: `http://localhost:3000/api`
- ✅ New: `http://localhost:5000/api/v1`

---

## 📝 Setup (3 Steps)

### 1. Configure Environment

```bash
# Create or update .env file
echo "VITE_API_BASE_URL=http://localhost:5000/api/v1" > .env
echo "VITE_APP_NAME=Notified" >> .env
echo "VITE_APP_VERSION=1.0.0" >> .env
```

### 2. Start Backend

```bash
# Make sure backend is running on port 5000
# Backend should use /api/v1/ prefix for all routes
```

### 3. Start Frontend

```bash
npm run dev
# Opens at http://localhost:5173
```

---

## 🔑 Key Files Modified

| File                              | Change                                 |
| --------------------------------- | -------------------------------------- |
| `src/utils/constants.ts`          | API base URL → `localhost:5000/api/v1` |
| `src/services/api.ts`             | Added `withCredentials: true`          |
| `src/services/auth.service.ts`    | Updated endpoints + new methods        |
| `src/services/student.service.ts` | Added new endpoints                    |
| `src/services/subject.service.ts` | Updated to match backend               |
| `src/services/record.service.ts`  | Refactored for v1 API                  |

---

## 📦 New Service Files

- ✅ `src/services/attendance.service.ts`
- ✅ `src/services/notification.service.ts`
- ✅ `src/services/user.service.ts`

---

## 🧪 Quick Test

### Test Login Endpoint

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'
```

### Expected Result

```json
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "..."
  }
}
```

---

## 🎯 All Backend Routes Use `/api/v1/` Prefix

```
/api/v1/auth/*
/api/v1/users/*
/api/v1/students/*
/api/v1/subjects/*
/api/v1/attendance/*
/api/v1/records/*
/api/v1/notifications/*
```

---

## 📚 Full Documentation

- **[API_INTEGRATION.md](./API_INTEGRATION.md)** - Complete API guide
- **[API_UPDATE_SUMMARY.md](./API_UPDATE_SUMMARY.md)** - Detailed changes
- **[README.md](./README.md)** - Project documentation

---

## ✅ Status

- ✅ Build: Passing
- ✅ Lint: Passing
- ✅ TypeScript: No errors
- ✅ CORS: Configured
- ✅ Auth: Token-based with JWT

---

**Ready to go! 🎉**
