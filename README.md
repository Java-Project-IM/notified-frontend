# Notified Frontend

> **A modern, production-grade React + TypeScript frontend for student attendance and management system**

[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-blue)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-5-purple)](https://vitejs.dev/)

This is the web frontend for **Notified**, a comprehensive student management system originally built as a JavaFX desktop application. This modernized version brings all the features to the web with an improved UI/UX, responsive design, and a scalable architecture.

## 🎯 Project Overview

Notified Frontend is a complete rewrite of the original JavaFX application ([Java-Project-IM/notified](https://github.com/Java-Project-IM/notified)) using modern web technologies. It provides a clean, intuitive interface for managing:

- **Student Records** - CRUD operations, bulk email, guardian management
- **Subject/Course Management** - Organize classes, sections, year levels
- **Attendance & Activity Logs** - Track records with filtering and search
- **Role-Based Access** - Superadmin, Admin, and Staff permissions
- **Dashboard Analytics** - Real-time statistics and insights

---

## 🛠️ Tech Stack

### Core

- **React 18** - UI library with hooks and modern patterns
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool and dev server
- **React Router v6** - Client-side routing with protected routes

### Styling & UI

- **TailwindCSS** - Utility-first CSS framework
- **ShadCN/UI** - High-quality, accessible component primitives
- **Framer Motion** - Smooth animations and transitions
- **Lucide React** - Beautiful, consistent icons
- **Neumorphic Design** - Soft shadows and modern aesthetics

### State & Data

- **Zustand** - Lightweight state management
- **TanStack Query (React Query)** - Server state management
- **Axios** - HTTP client with interceptors

### Code Quality

- **ESLint** - Linting and code standards
- **Prettier** - Code formatting
- **Husky** - Git hooks for pre-commit checks

---

## 📁 Project Structure

```
notified-frontend/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # Base UI components (Button, Card, Input, etc.)
│   │   └── ProtectedRoute.tsx
│   ├── layouts/           # Layout components
│   │   └── MainLayout.tsx
│   ├── pages/             # Page components
│   │   ├── LandingPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── SignupPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── StudentsPage.tsx
│   │   ├── SubjectsPage.tsx
│   │   └── RecordsPage.tsx
│   ├── services/          # API service layer
│   │   ├── api.ts         # Axios instance & interceptors
│   │   ├── auth.service.ts
│   │   ├── student.service.ts
│   │   ├── subject.service.ts
│   │   ├── record.service.ts
│   │   ├── attendance.service.ts
│   │   ├── notification.service.ts
│   │   └── user.service.ts
│   ├── store/             # Zustand stores
│   │   ├── authStore.ts
│   │   └── toastStore.ts
│   ├── types/             # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/             # Utility functions
│   │   └── constants.ts
│   ├── lib/               # Shared libraries
│   │   └── utils.ts
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # Application entry point
│   └── index.css          # Global styles
├── .env.example           # Environment variables template
├── .eslintrc.cjs          # ESLint configuration
├── .prettierrc            # Prettier configuration
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** or **yarn** or **pnpm**
- A running backend API (Express + MongoDB recommended)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Java-Project-IM/notified-frontend.git
   cd notified-frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure:

   ```env
   VITE_API_BASE_URL=http://localhost:5000/api/v1
   VITE_APP_NAME=Notified
   VITE_APP_VERSION=1.0.0
   ```

   **⚠️ Important**: The backend API uses `/api/v1/` prefix for all routes. Make sure your `VITE_API_BASE_URL` includes `/api/v1` at the end.

4. **Run the development server**

   ```bash
   npm run dev
   ```

   The app will be available at [http://localhost:5173](http://localhost:5173)

### Build for Production

```bash
npm run build
```

The optimized production build will be in the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

---

## 🔑 Environment Variables

Create a `.env` file in the root directory:

| Variable            | Description          | Default                     |
| ------------------- | -------------------- | --------------------------- |
| `VITE_API_BASE_URL` | Backend API endpoint | `http://localhost:3000/api` |
| `VITE_APP_NAME`     | Application name     | `Notified`                  |
| `VITE_APP_VERSION`  | App version          | `1.0.0`                     |

---

## 📖 Features & Pages

### 🏠 Landing Page

- Hero section with call-to-action
- Feature showcase
- Responsive design

### 🔐 Authentication

- **Login** - Email/password with validation
- **Signup** - New user registration
- **Protected Routes** - Auto-redirect if not authenticated
- **Session Management** - Persistent auth with Zustand

### 📊 Dashboard

- Real-time statistics cards
- Total students, subjects, and records
- Today's activity count
- Quick action buttons
- Greeting with user's name

### 👥 Student Management

- View all students in a searchable table
- Add new students with auto-generated student numbers
- Edit existing student information
- Delete students with confirmation
- Send bulk emails to selected students
- Guardian information management

### 📚 Subject Management

- List all subjects with filtering
- Create new subjects (code, name, section, year level)
- Update subject details
- Delete subjects
- View enrolled students per subject

### 📋 Records & Logs

- View attendance and activity records
- Filter by date range
- Search by student name/number
- Record types: Attendance, Enrollment, Withdrawal, Grade Update
- Detailed timestamps and metadata

---

## 🎨 Design Philosophy

### Color Palette

Based on the original JavaFX app with modern enhancements:

- **Primary**: `#2196F3` (Blue) - Primary actions, links
- **Secondary**: `#21CBF3` (Cyan) - Accents, gradients
- **Success**: Green tones
- **Warning**: Yellow/Orange tones
- **Error**: Red tones
- **Neutral**: Grays for text and backgrounds

### UI Components

- **Neumorphic Shadows** - Soft, elevated card designs
- **Smooth Transitions** - Framer Motion animations
- **Responsive Grid** - Mobile-first approach
- **Accessible** - ARIA labels, keyboard navigation

---

## 🔗 API Integration

The frontend expects a REST API with the following endpoints:

### Authentication

```
POST   /api/auth/login      - User login
POST   /api/auth/signup     - User registration
POST   /api/auth/logout     - User logout
GET    /api/auth/me         - Get current user
```

### Students

```
GET    /api/students        - Get all students
GET    /api/students/:id    - Get student by ID
POST   /api/students        - Create student
PUT    /api/students/:id    - Update student
DELETE /api/students/:id    - Delete student
POST   /api/students/email  - Send bulk email
```

### Subjects

```
GET    /api/subjects        - Get all subjects
GET    /api/subjects/:id    - Get subject by ID
POST   /api/subjects        - Create subject
PUT    /api/subjects/:id    - Update subject
DELETE /api/subjects/:id    - Delete subject
```

### Records

```
GET    /api/records         - Get all records
GET    /api/records/:id     - Get record by ID
POST   /api/records         - Create record
GET    /api/records/stats   - Get dashboard statistics
```

All endpoints expect `Authorization: Bearer <token>` header for authenticated requests.

---

## 🧪 Testing

### Run Linter

```bash
npm run lint
```

### Format Code

```bash
npm run format
```

### Type Check

```bash
npm run build  # TypeScript compilation happens during build
```

---

## 🚢 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel dashboard
3. Set environment variables
4. Deploy!

### Netlify

```bash
npm run build
# Upload dist/ folder to Netlify
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 👥 Role-Based Access Control

The application supports three user roles:

| Role           | Permissions                                        |
| -------------- | -------------------------------------------------- |
| **Superadmin** | Full access to all features, user management       |
| **Admin**      | Manage students, subjects, records (no user admin) |
| **Staff**      | View-only access to students and records           |

Roles are enforced on the frontend via protected routes and on the backend via API middleware.

---

## 🛡️ Security Features

- JWT-based authentication
- HTTP-only cookies (if configured on backend)
- Auto token refresh
- Protected route guards
- XSS protection via React's JSX escaping
- CSRF protection (backend responsibility)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use TypeScript for all new files
- Follow ESLint and Prettier rules
- Write meaningful commit messages
- Add comments for complex logic

---

## 📝 Scripts Reference

| Script                 | Description                       |
| ---------------------- | --------------------------------- |
| `npm run dev`          | Start development server with HMR |
| `npm run build`        | Build for production              |
| `npm run preview`      | Preview production build locally  |
| `npm run lint`         | Run ESLint                        |
| `npm run lint:fix`     | Fix ESLint errors                 |
| `npm run format`       | Format code with Prettier         |
| `npm run format:check` | Check code formatting             |

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Change port in vite.config.ts or use:
npm run dev -- --port 5174
```

### Module Not Found

```bash
npm install  # Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

```bash
npx tsc --noEmit  # Check for type errors
```

### Build Fails

- Ensure Node.js version is 18+
- Clear cache: `rm -rf node_modules/.vite`
- Check environment variables

---

## 📚 Additional Resources

- [Original JavaFX App](https://github.com/Java-Project-IM/notified)
- [React Documentation](https://react.dev/)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [Vite Guide](https://vitejs.dev/guide/)
- [TanStack Query](https://tanstack.com/query/latest)

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👏 Acknowledgments

- Original JavaFX app by the [Notif1ed Development Team](https://github.com/Java-Project-IM/notified)
- UI components inspired by ShadCN/UI
- Icons by Lucide
- Built with ❤️ using modern web technologies

---

## 📞 Support

For issues, questions, or contributions:

- Open an issue on GitHub
- Contact: [your-email@example.com]
- Documentation: [Link to docs]

---

**Built by senior front-end architects with 30 years of combined experience in modernizing legacy applications** 🚀
