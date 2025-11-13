# 🔗 API Integration Guide

## Overview

This frontend is designed to work with the Notified backend API which uses `/api/v1/` as the base path for all routes.

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_APP_NAME=Notified
VITE_APP_VERSION=1.0.0
```

### API Client Setup

The API client is configured in `src/services/api.ts`:

```typescript
const apiClient = axios.create({
  baseURL: API_BASE_URL, // http://localhost:5000/api/v1
  timeout: 10000,
  withCredentials: true, // Enable CORS credentials
  headers: {
    'Content-Type': 'application/json',
  },
})
```

**Features:**

- ✅ Automatic JWT token injection via interceptor
- ✅ Auto-redirect to login on 401 Unauthorized
- ✅ CORS credentials enabled
- ✅ Error handling and formatting

---

## 📋 Backend API Routes

All routes are prefixed with `/api/v1/`

### 🔐 Authentication (`/auth`)

| Method | Endpoint                | Description          | Auth Required   |
| ------ | ----------------------- | -------------------- | --------------- |
| POST   | `/auth/register`        | Register new user    | Superadmin only |
| POST   | `/auth/login`           | User login           | No              |
| POST   | `/auth/logout`          | User logout          | Yes             |
| POST   | `/auth/refresh-token`   | Refresh access token | Yes             |
| GET    | `/auth/me`              | Get current user     | Yes             |
| PUT    | `/auth/update-password` | Update password      | Yes             |
| PUT    | `/auth/update-profile`  | Update profile       | Yes             |

### 👤 Users (`/users`)

| Method | Endpoint              | Description          | Auth Required |
| ------ | --------------------- | -------------------- | ------------- |
| GET    | `/users`              | Get all users        | Admin only    |
| GET    | `/users/stats`        | User statistics      | Admin only    |
| GET    | `/users/:id`          | Get user by ID       | Admin only    |
| POST   | `/users`              | Create user          | Admin only    |
| PUT    | `/users/:id`          | Update user          | Admin only    |
| PUT    | `/users/:id/toggle`   | Toggle active status | Admin only    |
| DELETE | `/users/:id`          | Delete user          | Admin only    |
| GET    | `/users/search?q=...` | Search users         | Admin only    |

### 👨‍🎓 Students (`/students`)

| Method | Endpoint                            | Description             | Auth Required |
| ------ | ----------------------------------- | ----------------------- | ------------- |
| GET    | `/students`                         | Get all students        | Yes           |
| GET    | `/students/generate/student-number` | Generate student number | Staff+        |
| GET    | `/students/number/:studentNumber`   | Get by student number   | Yes           |
| GET    | `/students/:id`                     | Get student by ID       | Yes           |
| POST   | `/students`                         | Create student          | Staff+        |
| PUT    | `/students/:id`                     | Update student          | Staff+        |
| DELETE | `/students/:id`                     | Delete student          | Admin only    |
| GET    | `/students/search?q=...`            | Search students         | Yes           |

### 📚 Subjects (`/subjects`)

| Method | Endpoint                    | Description         | Auth Required |
| ------ | --------------------------- | ------------------- | ------------- |
| GET    | `/subjects`                 | Get all subjects    | Yes           |
| GET    | `/subjects/search?q=...`    | Search subjects     | Yes           |
| GET    | `/subjects/year/:year`      | Get by year level   | Yes           |
| GET    | `/subjects/code/:code`      | Get by subject code | Yes           |
| GET    | `/subjects/:id`             | Get subject by ID   | Yes           |
| GET    | `/subjects/:id/enrollments` | Get enrollments     | Yes           |
| POST   | `/subjects`                 | Create subject      | Staff+        |
| PUT    | `/subjects/:id`             | Update subject      | Staff+        |
| DELETE | `/subjects/:id`             | Delete subject      | Admin only    |

### ✅ Attendance (`/attendance`)

| Method | Endpoint                  | Description        | Auth Required |
| ------ | ------------------------- | ------------------ | ------------- |
| GET    | `/attendance`             | Get all attendance | Yes           |
| GET    | `/attendance/today`       | Today's attendance | Yes           |
| GET    | `/attendance/summary`     | Attendance summary | Yes           |
| GET    | `/attendance/student/:id` | Student attendance | Yes           |
| GET    | `/attendance/subject/:id` | Subject attendance | Yes           |
| GET    | `/attendance/:id`         | Get by ID          | Yes           |
| POST   | `/attendance`             | Mark attendance    | Staff+        |
| PUT    | `/attendance/:id`         | Update attendance  | Staff+        |
| DELETE | `/attendance/:id`         | Delete attendance  | Admin only    |

### 📝 Records (`/records`)

| Method | Endpoint               | Description       | Auth Required |
| ------ | ---------------------- | ----------------- | ------------- |
| GET    | `/records`             | Get all records   | Staff+        |
| GET    | `/records/today`       | Today's records   | Staff+        |
| GET    | `/records/stats`       | Record statistics | Staff+        |
| GET    | `/records/student/:id` | Student records   | Staff+        |
| GET    | `/records/subject/:id` | Subject records   | Staff+        |
| GET    | `/records/type/:type`  | Records by type   | Staff+        |
| GET    | `/records/:id`         | Get record by ID  | Staff+        |
| DELETE | `/records/:id`         | Delete record     | Admin only    |

### 🔔 Notifications (`/notifications`)

| Method | Endpoint                  | Description           | Auth Required |
| ------ | ------------------------- | --------------------- | ------------- |
| GET    | `/notifications`          | Get all notifications | Yes           |
| GET    | `/notifications/unread`   | Unread count          | Yes           |
| GET    | `/notifications/stats`    | Notification stats    | Yes           |
| GET    | `/notifications/:id`      | Get by ID             | Yes           |
| POST   | `/notifications`          | Create notification   | Staff+        |
| PUT    | `/notifications/:id/read` | Mark as read          | Yes           |
| PUT    | `/notifications/read-all` | Mark all as read      | Yes           |
| DELETE | `/notifications/:id`      | Delete notification   | Yes           |
| DELETE | `/notifications/read`     | Delete all read       | Yes           |

---

## 🛠️ Service Layer

All API calls are abstracted into service files in `src/services/`:

### Authentication Service

```typescript
import { authService } from '@/services/auth.service'

// Login
const response = await authService.login({ email, password })

// Signup/Register
const response = await authService.signup({ name, email, password })

// Get current user
const user = await authService.getCurrentUser()

// Logout
await authService.logout()

// Refresh token
await authService.refreshToken()

// Update password
await authService.updatePassword({ currentPassword, newPassword })

// Update profile
await authService.updateProfile({ name, email })
```

### Student Service

```typescript
import { studentService } from '@/services/student.service'

// Get all students
const students = await studentService.getAll()

// Get student by ID
const student = await studentService.getById(id)

// Get by student number
const student = await studentService.getByStudentNumber('2024-001')

// Generate student number
const { studentNumber } = await studentService.generateStudentNumber()

// Create student
const newStudent = await studentService.create(formData)

// Update student
await studentService.update(id, formData)

// Delete student
await studentService.delete(id)

// Search students
const results = await studentService.search('John')
```

### Subject Service

```typescript
import { subjectService } from '@/services/subject.service'

// Get all subjects
const subjects = await subjectService.getAll()

// Get by subject code
const subject = await subjectService.getByCode('CS101')

// Get by year level
const subjects = await subjectService.getByYear(1)

// Get enrollments
const enrollments = await subjectService.getEnrollments(id)

// Create, update, delete
await subjectService.create(formData)
await subjectService.update(id, formData)
await subjectService.delete(id)

// Search
const results = await subjectService.search('Math')
```

### Attendance Service

```typescript
import { attendanceService } from '@/services/attendance.service'

// Get today's attendance
const attendance = await attendanceService.getToday()

// Get summary
const summary = await attendanceService.getSummary()

// Get by student
const records = await attendanceService.getByStudent(studentId)

// Mark attendance
await attendanceService.create({
  studentId,
  subjectId,
  date: '2025-11-13',
  status: 'present',
})
```

### Record Service

```typescript
import { recordService } from '@/services/record.service'

// Get today's records
const records = await recordService.getToday()

// Get statistics
const stats = await recordService.getStats()

// Get by student/subject
const records = await recordService.getByStudent(studentId)
const records = await recordService.getBySubject(subjectId)

// Get by type
const records = await recordService.getByType('attendance')
```

### Notification Service

```typescript
import { notificationService } from '@/services/notification.service'

// Get unread count
const { count } = await notificationService.getUnreadCount()

// Mark as read
await notificationService.markAsRead(id)

// Mark all as read
await notificationService.markAllAsRead()

// Create notification
await notificationService.create({
  title: 'New Assignment',
  message: 'Math homework due tomorrow',
  type: 'info',
})
```

### User Service

```typescript
import { userService } from '@/services/user.service'

// Get all users (admin only)
const users = await userService.getAll()

// Get statistics
const stats = await userService.getStats()

// Create user
await userService.create({ name, email, password, role })

// Toggle active status
await userService.toggleActive(id)

// Search users
const results = await userService.search('admin')
```

---

## 🔒 Authentication Flow

### Login Process

1. User submits email and password
2. Frontend calls `authService.login(credentials)`
3. Backend validates and returns JWT token + user data
4. Frontend stores token in localStorage
5. Frontend updates authStore with user data
6. User is redirected to dashboard

### Token Management

- Access token stored in localStorage
- Automatically injected in request headers via axios interceptor
- On 401 response, user is auto-redirected to login
- Token refresh available via `authService.refreshToken()`

### Protected Routes

```typescript
<Route element={<ProtectedRoute allowedRoles={['admin', 'staff']} />}>
  <Route path="/students" element={<StudentsPage />} />
</Route>
```

---

## 🌐 CORS Configuration

### Frontend Configuration

Already configured in `src/services/api.ts`:

```typescript
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // ✅ Enables CORS credentials
})
```

### Backend Configuration Required

Your backend should allow the frontend origin:

```javascript
// Backend Express CORS setup
app.use(
  cors({
    origin: 'http://localhost:5173', // Vite dev server
    credentials: true,
  })
)
```

Or in `.env`:

```env
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

---

## 🧪 Testing API Connection

### Test Backend Health

```bash
curl http://localhost:5000/health
```

### Test Login Endpoint

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@notified.com","password":"Admin@123"}'
```

Expected response:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "Admin User",
      "email": "admin@notified.com",
      "role": "admin"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 🚨 Common Issues

### Issue: 404 Not Found

**Problem**: API routes returning 404

**Solution**: Ensure your backend uses `/api/v1/` prefix:

- ✅ Correct: `http://localhost:5000/api/v1/auth/login`
- ❌ Wrong: `http://localhost:5000/api/auth/login`

### Issue: CORS Errors

**Problem**: Browser blocks requests with CORS error

**Solution**:

1. Enable `withCredentials: true` in axios (already done)
2. Configure backend CORS to allow your frontend origin
3. Ensure backend sends proper CORS headers

### Issue: 401 Unauthorized

**Problem**: Protected routes return 401

**Solution**:

1. Check if token is stored in localStorage
2. Verify token is valid and not expired
3. Ensure Authorization header is being sent
4. Check backend token validation logic

### Issue: Wrong API Base URL

**Problem**: Requests going to wrong URL

**Solution**:

1. Check `.env` file: `VITE_API_BASE_URL=http://localhost:5000/api/v1`
2. Restart dev server after changing `.env`
3. Clear browser cache and localStorage

---

## 📱 Development Tips

1. **Use React Query DevTools** - Already configured, press `Ctrl+Shift+D` to open
2. **Check Network Tab** - Monitor API requests in browser DevTools
3. **Check Console** - All API errors are logged to console
4. **Use Zustand DevTools** - Install Redux DevTools extension to inspect store
5. **Test API Separately** - Use Postman/Insomnia to test backend first

---

## 🔄 API Response Format

All backend responses should follow this structure:

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "errors": {
    "field": ["Validation error"]
  }
}
```

---

## 📚 Additional Resources

- [Backend API Documentation](https://github.com/Java-Project-IM/notified-backend)
- [Axios Documentation](https://axios-http.com/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Zustand Documentation](https://docs.pmnd.rs/zustand)

---

## 🤝 Contributing

When adding new API endpoints:

1. Update the service file in `src/services/`
2. Add TypeScript types in `src/types/`
3. Update this documentation
4. Test the endpoint thoroughly
5. Update the changelog

---

**Last Updated**: November 13, 2025
