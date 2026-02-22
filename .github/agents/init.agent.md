# Project Template Analyzer Agent

## Mục đích (Purpose)

Agent này được thiết kế để phân tích và tái tạo project template **Vue + Hono + PostgreSQL** fullstack application. Template này cung cấp một boilerplate hoàn chỉnh cho việc xây dựng ứng dụng web hiện đại với kiến trúc monorepo, containerization, và các best practices.

**Mục tiêu chính:**
- Phân tích và hiểu rõ cấu trúc project template
- Tái tạo project với các công nghệ tương tự hoặc thay thế
- Cung cấp template cho việc khởi tạo nhanh các dự án mới
- Hỗ trợ customization và thay đổi stack công nghệ theo nhu cầu

---

## 1. Phân tích Stack Công nghệ (Technology Stack Analysis)

### 1.1 Frontend Stack

#### Core Framework
- **Vue 3.5.18** - Progressive JavaScript framework
  - Composition API
  - TypeScript support
  - Reactive state management

#### Build Tool & Development
- **Vite 7.1.6** - Next generation frontend tooling
  - Hot Module Replacement (HMR)
  - Optimized build performance
  - Native ES modules
  - Plugin: `@vitejs/plugin-vue`

#### Styling & UI
- **Tailwind CSS 4.1.13** - Utility-first CSS framework
  - `@tailwindcss/vite` - Vite integration
  - `tailwind-merge` - Merge Tailwind classes
  - `clsx` - Conditional class names
  - `class-variance-authority` - Class variant utilities
  - `tw-animate-css` - Animation utilities

#### Component Libraries
- **Radix Vue 1.9.17** - Unstyled, accessible UI components
- **Reka UI 2.5.0** - Vue UI components
- **Lucide Vue Next 0.544.0** - Icon library

#### State Management & Routing
- **Pinia 3.0.3** - Official Vue state management
- **Vue Router 4.5.1** - Official Vue routing

#### Form Validation
- **VeeValidate 4.15.1** - Form validation for Vue
- **Yup 1.7.0** - Schema validation
- `@vee-validate/yup` - Integration package

#### HTTP Client & Utilities
- **ofetch 1.4.1** - Better fetch API
- **@vueuse/core 13.9.0** - Collection of Vue composition utilities

#### Data Tables
- **@tanstack/vue-table 8.21.3** - Headless table library

#### Notifications
- **vue-sonner 2.0.8** - Toast notifications

#### Development Tools
- **TypeScript 5.9.2** - Type safety
- **vue-tsc 3.0.5** - TypeScript checker for Vue
- **Knip 5.63.1** - Find unused files, dependencies
- **json-server 0.17.4** - Mock API server for development
- **concurrently 9.2.1** - Run multiple commands

### 1.2 Backend Stack

#### Core Framework
- **Hono 4.9.8** - Ultrafast web framework for edge
  - Lightweight and fast
  - TypeScript first
  - Middleware support
  - Edge runtime compatible

#### Hono Extensions
- **@hono/node-server 1.19.3** - Node.js server adapter
- **@hono/zod-openapi 1.1.2** - OpenAPI schema generation with Zod

#### Database
- **PostgreSQL 17.6** - Relational database
- **Kysely 0.28.7** - Type-safe SQL query builder
  - `kysely-codegen 0.19.0` - Generate types from database
  - `kysely-ctl 0.19.0` - Migration CLI
- **pg 8.16.3** - PostgreSQL client for Node.js

#### Validation
- **Zod 4.1.9** - TypeScript-first schema validation

#### Authentication & Security
- **bcrypt 6.0.0** - Password hashing
- **JWT (JSON Web Tokens)** - Token-based authentication
  - Environment-based secret configuration

#### Object Storage
- **MinIO 8.0.4** - S3-compatible object storage
  - Image upload handling
  - Presigned URL generation

#### Development Tools
- **TypeScript 5.8.3** - Type safety
- **tsx 4.20.5** - TypeScript executor for Node.js
- **dotenv 17.2.2** - Environment variable management

### 1.3 Infrastructure & DevOps

#### Containerization
- **Docker** - Container platform
- **Docker Compose** - Multi-container orchestration
  - `compose.yml` configuration
  - Multi-service setup (frontend, backend, postgres, minio)

#### Services in Docker Compose
1. **PostgreSQL** - Database service
   - Port: 5432
   - Health checks
   - Named volumes for persistence
   
2. **Frontend** - Vue development server
   - Port: 5173
   - Volume mounting for hot reload
   - Environment-based configuration
   
3. **Backend** - Hono API server
   - Port: 3000
   - Database connection
   - MinIO integration
   
4. **MinIO** - Object storage
   - Port: 9000 (API), 9001 (Console)
   - CORS configuration

#### Node.js
- **Node.js 22.18.0** (bookworm-slim base image)

---

## 2. Phân tích Cấu trúc Thư mục (Directory Structure Analysis)

```
hkth3/                                      # Root project (monorepo)
│
├── .github/                                # GitHub configurations & agents
│   └── *.agent.md                         # Agent documentation files
│
├── apps/                                   # Application workspace
│   │
│   ├── backend/                           # Backend application (Hono + PostgreSQL)
│   │   ├── src/
│   │   │   ├── index.ts                  # Entry point - server startup & migrations
│   │   │   ├── app.ts                    # Hono app configuration, middleware, routes
│   │   │   │
│   │   │   ├── apis/                     # API route handlers
│   │   │   │   ├── index.ts             # Export aggregation
│   │   │   │   ├── auth.ts              # Authentication endpoints
│   │   │   │   ├── health.ts            # Health check endpoint
│   │   │   │   ├── images.ts            # Image upload/management
│   │   │   │   ├── items.ts             # Items CRUD
│   │   │   │   ├── surveys.ts           # Surveys endpoints
│   │   │   │   └── users.ts             # User management
│   │   │   │
│   │   │   ├── db/                       # Database layer
│   │   │   │   ├── connection.ts        # Kysely database connection
│   │   │   │   ├── migrate.ts           # Migration runner
│   │   │   │   ├── generated-types.ts   # Auto-generated DB types
│   │   │   │   └── migrations/          # SQL migration files
│   │   │   │
│   │   │   ├── middleware/               # Custom middleware
│   │   │   │   └── auth.ts              # JWT authentication middleware
│   │   │   │
│   │   │   ├── schemas/                  # Zod validation schemas
│   │   │   │   └── auth.ts              # Auth-related schemas
│   │   │   │
│   │   │   ├── types/                    # TypeScript type definitions
│   │   │   │   └── api.ts               # API types
│   │   │   │
│   │   │   └── utils/                    # Utility functions
│   │   │
│   │   ├── package.json                  # Backend dependencies & scripts
│   │   └── tsconfig.json                 # TypeScript configuration
│   │
│   └── frontend/                          # Frontend application (Vue + Vite)
│       ├── src/
│       │   ├── main.ts                   # Entry point - Vue app initialization
│       │   ├── App.vue                   # Root Vue component
│       │   ├── style.css                 # Global styles (Tailwind)
│       │   ├── vite-env.d.ts            # Vite TypeScript definitions
│       │   │
│       │   ├── assets/                   # Static assets (images, fonts, etc.)
│       │   ├── components/               # Reusable Vue components
│       │   ├── lib/                      # Third-party library configurations
│       │   ├── router/                   # Vue Router configuration
│       │   ├── services/                 # API service layer
│       │   ├── stores/                   # Pinia state stores
│       │   ├── styles/                   # Additional style files
│       │   ├── types/                    # TypeScript types
│       │   ├── utils/                    # Utility functions
│       │   └── views/                    # Page components (route views)
│       │
│       ├── public/                        # Public static files
│       ├── mock_server/                   # Development mock API
│       │   ├── db.json                   # Mock database
│       │   ├── routes.json               # Mock route mappings
│       │   └── middleware/               # Mock server middleware
│       │
│       ├── package.json                   # Frontend dependencies & scripts
│       ├── vite.config.ts                # Vite configuration
│       ├── tsconfig.json                 # TypeScript configuration
│       ├── tsconfig.app.json             # App-specific TS config
│       ├── components.json               # UI component configuration
│       ├── knip.config.js                # Unused code detection config
│       └── index.html                    # HTML entry point
│
├── docker/                                # Docker configurations
│   ├── Dockerfile.backend                # Backend container definition
│   └── Dockerfile.frontend               # Frontend container definition
│
├── dg.app_starter/                        # Template collection (meta-templates)
│   └── templates/                        # Various project templates
│       ├── react_hono_postgres/         # React variant
│       ├── vue_hono_postgres/           # Vue variant (this project)
│       └── vue_rails_postgres/          # Vue + Rails variant
│
├── compose.yml                            # Docker Compose configuration
├── README.md                              # Project documentation
└── *.md                                   # Additional documentation files
```

### Giải thích Kiến trúc (Architecture Explanation)

#### Monorepo Structure
- **apps/**: Chứa các ứng dụng độc lập (frontend, backend)
- Mỗi app có dependencies và configuration riêng
- Cho phép chia sẻ types và utilities giữa các apps

#### Backend Architecture (Layered Architecture)
1. **Entry Layer** (`index.ts`): Server bootstrap, migration runner
2. **Application Layer** (`app.ts`): Route registration, middleware configuration
3. **API Layer** (`apis/`): Route handlers, OpenAPI definitions
4. **Middleware Layer** (`middleware/`): Authentication, validation
5. **Schema Layer** (`schemas/`): Request/response validation
6. **Database Layer** (`db/`): Query builders, migrations, type generation
7. **Types Layer** (`types/`): Shared type definitions
8. **Utils Layer** (`utils/`): Helper functions

#### Frontend Architecture (Feature-based)
1. **Entry Point** (`main.ts`): App initialization, plugin registration
2. **Views** (`views/`): Page-level components (route targets)
3. **Components** (`components/`): Reusable UI components
4. **Services** (`services/`): API communication layer
5. **Stores** (`stores/`): State management (Pinia)
6. **Router** (`router/`): Route definitions
7. **Utils** (`utils/`): Helper functions
8. **Types** (`types/`): TypeScript interfaces

---

## 3. Phân tích Mẫu Code (Code Pattern Analysis)

### 3.1 Backend Patterns (Hono + Kysely)

#### Pattern 1: API Route Definition với OpenAPI
```typescript
// apps/backend/src/apis/auth.ts
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'

// Schema definition với Zod
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

// OpenAPI route definition
const loginRoute = createRoute({
  method: 'post',
  path: '/api/auth/login',
  request: {
    body: {
      content: {
        'application/json': {
          schema: loginSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Successful login',
      content: {
        'application/json': {
          schema: z.object({
            token: z.string(),
            user: z.object({
              id: z.number(),
              email: z.string()
            })
          })
        }
      }
    }
  }
})

// Handler implementation
export function storeAuthApi(app: OpenAPIHono) {
  app.openapi(loginRoute, async (c) => {
    const { email, password } = c.req.valid('json')
    // Implementation...
    return c.json({ token, user })
  })
}
```

**Đặc điểm:**
- Type-safe với Zod schema
- Auto-generate OpenAPI documentation
- Request/response validation
- Clear separation of concerns

#### Pattern 2: Database Query với Kysely
```typescript
// apps/backend/src/db/connection.ts
import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import type { DB } from './generated-types.js'

const dialect = new PostgresDialect({
  pool: new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    // ... config
  })
})

export const db = new Kysely<DB>({ dialect })

// Usage in API
import { db } from '../db/connection.js'

const users = await db
  .selectFrom('users')
  .select(['id', 'email', 'name'])
  .where('email', '=', email)
  .execute()
```

**Đặc điểm:**
- Type-safe SQL queries
- Auto-completion
- Compile-time type checking
- Migration support

#### Pattern 3: Migration System
```typescript
// apps/backend/src/db/migrate.ts
import { Migrator, FileMigrationProvider } from 'kysely'
import { promises as fs } from 'fs'
import * as path from 'path'
import { db } from './connection.js'

export async function migrateToLatest() {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(__dirname, 'migrations')
    })
  })

  const { error, results } = await migrator.migrateToLatest()
  // Handle results...
}
```

**NPM Scripts:**
```json
{
  "scripts": {
    "migrate": "tsx src/db/migrate.ts",
    "migrate:down": "tsx src/db/migrate.ts down",
    "db:generate-types": "kysely-codegen --out-file src/db/generated-types.ts",
    "db:migrate-and-generate": "npm run migrate && npm run db:generate-types"
  }
}
```

#### Pattern 4: JWT Authentication Middleware
```typescript
// apps/backend/src/middleware/auth.ts
import { createMiddleware } from 'hono/factory'
import jwt from 'jsonwebtoken'

export const authMiddleware = createMiddleware(async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!)
    c.set('user', decoded)
    await next()
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401)
  }
})

// Usage
app.use('/api/protected/*', authMiddleware)
```

#### Pattern 5: File Upload với MinIO
```typescript
// apps/backend/src/apis/images.ts
import { Client } from 'minio'

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT!,
  port: Number(process.env.MINIO_PORT),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY!,
  secretKey: process.env.MINIO_SECRET_KEY!
})

export async function uploadImage(file: File) {
  const bucket = process.env.MINIO_BUCKET!
  const fileName = `${Date.now()}-${file.name}`
  
  await minioClient.putObject(bucket, fileName, file.stream(), file.size)
  
  // Generate presigned URL
  const url = await minioClient.presignedGetObject(
    bucket, 
    fileName, 
    Number(process.env.MINIO_UPLOAD_URL_EXPIRY)
  )
  
  return { url, fileName }
}
```

### 3.2 Frontend Patterns (Vue 3 + Composition API)

#### Pattern 1: Vue Component với Composition API
```typescript
// apps/frontend/src/components/LoginForm.vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)

async function handleLogin() {
  loading.value = true
  try {
    await authStore.login(email.value, password.value)
    router.push('/dashboard')
  } catch (error) {
    console.error('Login failed', error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form @submit.prevent="handleLogin">
    <input v-model="email" type="email" />
    <input v-model="password" type="password" />
    <button :disabled="loading">Login</button>
  </form>
</template>
```

**Đặc điểm:**
- `<script setup>` syntax
- Composition API (ref, computed, watch)
- Auto-import components
- Type inference

#### Pattern 2: Pinia Store
```typescript
// apps/frontend/src/stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types/user'
import { authApi } from '@/services/auth'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!token.value)

  // Actions
  async function login(email: string, password: string) {
    const response = await authApi.login(email, password)
    user.value = response.user
    token.value = response.token
    localStorage.setItem('token', response.token)
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
  }

  return {
    user,
    token,
    isAuthenticated,
    login,
    logout
  }
})
```

**Đặc điểm:**
- Setup syntax store
- Composition API style
- Reactive state
- Computed getters
- Async actions

#### Pattern 3: API Service Layer với ofetch
```typescript
// apps/frontend/src/services/auth.ts
import { ofetch } from 'ofetch'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

export const authApi = {
  login: async (email: string, password: string) => {
    return await ofetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      body: { email, password }
    })
  },

  register: async (email: string, password: string, name: string) => {
    return await ofetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      body: { email, password, name }
    })
  },

  getCurrentUser: async (token: string) => {
    return await ofetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  }
}
```

**Đặc điểm:**
- Centralized API calls
- Type-safe requests
- Auto JSON parsing
- Error handling
- Environment-based configuration

#### Pattern 4: Form Validation với VeeValidate + Yup
```typescript
// apps/frontend/src/utils/vee-validate-config.ts
import { configure } from 'vee-validate'

export function setupVeeValidate() {
  configure({
    validateOnInput: true,
    validateOnBlur: true,
    validateOnChange: true
  })
}

// Component usage
<script setup lang="ts">
import { useForm } from 'vee-validate'
import * as yup from 'yup'

const schema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().min(8).required(),
  name: yup.string().required()
})

const { handleSubmit, errors, defineField } = useForm({
  validationSchema: schema
})

const [email] = defineField('email')
const [password] = defineField('password')
const [name] = defineField('name')

const onSubmit = handleSubmit(async (values) => {
  // Submit logic
})
</script>
```

#### Pattern 5: Vue Router Configuration
```typescript
// apps/frontend/src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Navigation guards
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
```

### 3.3 Infrastructure Patterns

#### Pattern 1: Multi-stage Docker Build (Development)
```dockerfile
# docker/Dockerfile.backend
FROM node:22.18.0-bookworm-slim

WORKDIR /workspace/apps/backend

COPY apps/backend/package*.json ./

RUN npm ci --prefer-offline --no-audit

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

**Đặc điểm:**
- Optimized for development
- Volume mounting for hot reload
- Layer caching for dependencies

#### Pattern 2: Docker Compose Service Orchestration
```yaml
# compose.yml
services:
  postgres:
    image: postgres:17.6
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./
      dockerfile: ./docker/Dockerfile.backend
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/dev
      - JWT_SECRET=dev-secret-key
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  postgres-data:

networks:
  app_network:
```

**Đặc điểm:**
- Service dependencies
- Health checks
- Environment-based configuration
- Named volumes
- Custom networks

#### Pattern 3: Environment Configuration
```typescript
// Backend environment pattern
const config = {
  port: parseInt(process.env.PORT || '3000'),
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || 'dev',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password'
  },
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  }
}

// Frontend environment pattern
// vite.config.ts
export default defineConfig({
  base: process.env.BASE_PATH ? `${process.env.BASE_PATH}/` : '/',
  // ...
})

// Usage in code
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
```

---

## 4. Hướng dẫn Tái tạo Project (Project Recreation Guide)

### 4.1 Khởi tạo Project Mới

#### Bước 1: Tạo Cấu trúc Thư mục
```bash
mkdir my-new-project
cd my-new-project

# Create monorepo structure
mkdir -p apps/{backend,frontend}
mkdir -p docker
mkdir -p .github
```

#### Bước 2: Initialize Backend (Hono + PostgreSQL)
```bash
cd apps/backend
npm init -y

# Install dependencies
npm install hono @hono/node-server @hono/zod-openapi zod kysely pg bcrypt minio

# Install dev dependencies
npm install -D typescript @types/node @types/pg @types/bcrypt @types/minio tsx dotenv kysely-codegen kysely-ctl

# Create TypeScript config
cat > tsconfig.json << EOF
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "NodeNext",
    "strict": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "types": ["node"],
    "jsx": "react-jsx",
    "jsxImportSource": "hono/jsx",
    "outDir": "./dist"
  },
  "exclude": ["node_modules"]
}
EOF
```

#### Bước 3: Initialize Frontend (Vue + Vite)
```bash
cd apps/frontend
npm create vite@latest . -- --template vue-ts

# Install additional dependencies
npm install vue-router pinia @vueuse/core
npm install tailwindcss @tailwindcss/vite
npm install radix-vue lucide-vue-next
npm install vee-validate yup @vee-validate/yup
npm install ofetch
npm install @tanstack/vue-table
npm install vue-sonner

# Install dev dependencies
npm install -D @types/node knip json-server concurrently
```

#### Bước 4: Setup Docker
```bash
# Create backend Dockerfile
cat > docker/Dockerfile.backend << EOF
FROM node:22.18.0-bookworm-slim
WORKDIR /workspace/apps/backend
COPY apps/backend/package*.json ./
RUN npm ci --prefer-offline --no-audit
EXPOSE 3000
CMD ["npm", "run", "dev"]
EOF

# Create frontend Dockerfile
cat > docker/Dockerfile.frontend << EOF
FROM node:22.18.0-bookworm-slim
WORKDIR /workspace/apps/frontend
COPY apps/frontend/package*.json ./
RUN npm ci --prefer-offline --no-audit
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
EOF
```

#### Bước 5: Create Docker Compose
```bash
# Copy compose.yml from template or create new one
# Include services: postgres, backend, frontend, minio
```

### 4.2 Thay đổi Stack Công nghệ

#### Thay thế Backend Framework

**Từ Hono → Express**
```typescript
// Before (Hono)
import { Hono } from 'hono'
const app = new Hono()

app.get('/api/users', (c) => {
  return c.json({ users: [] })
})

// After (Express)
import express from 'express'
const app = express()

app.get('/api/users', (req, res) => {
  res.json({ users: [] })
})
```

**Từ Hono → Fastify**
```typescript
// After (Fastify)
import Fastify from 'fastify'
const fastify = Fastify()

fastify.get('/api/users', async (request, reply) => {
  return { users: [] }
})
```

#### Thay thế Frontend Framework

**Từ Vue → React**
```typescript
// Before (Vue)
<script setup lang="ts">
import { ref } from 'vue'
const count = ref(0)
</script>
<template>
  <button @click="count++">{{ count }}</button>
</template>

// After (React)
import { useState } from 'react'

function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

#### Thay thế Database

**Từ PostgreSQL → MySQL**
```typescript
// Update Kysely dialect
import { MysqlDialect } from 'kysely'
import { createPool } from 'mysql2'

const dialect = new MysqlDialect({
  pool: createPool({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  })
})
```

**Từ Kysely → Prisma**
```prisma
// schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id    Int    @id @default(autoincrement())
  email String @unique
  name  String
}
```

### 4.3 Customization Points

#### 1. API Structure
- Thay đổi endpoint patterns
- Thêm versioning (`/api/v1/...`)
- Custom error handling
- Rate limiting
- Request logging

#### 2. Authentication
- OAuth 2.0 integration
- Social login (Google, GitHub)
- Multi-factor authentication
- Refresh token rotation

#### 3. Database Schema
- Add/remove tables
- Change relationships
- Add indexes
- Implement soft deletes

#### 4. Frontend Theming
- Custom Tailwind configuration
- Dark mode support
- Multiple color schemes
- Component library customization

#### 5. DevOps
- CI/CD pipelines
- Production Dockerfiles
- Kubernetes deployment
- Monitoring & logging

---

## 5. Best Practices & Recommendations

### 5.1 Code Organization
- ✅ Separate concerns (API, DB, Services)
- ✅ Use TypeScript for type safety
- ✅ Implement proper error handling
- ✅ Follow consistent naming conventions
- ✅ Use environment variables for configuration

### 5.2 Security
- ✅ Hash passwords with bcrypt
- ✅ Use JWT for authentication
- ✅ Implement CORS properly
- ✅ Validate all inputs with Zod/Yup
- ✅ Use HTTPS in production
- ✅ Implement rate limiting
- ✅ Keep dependencies updated

### 5.3 Performance
- ✅ Use database indexes
- ✅ Implement caching (Redis)
- ✅ Optimize SQL queries
- ✅ Use CDN for static assets
- ✅ Enable gzip compression
- ✅ Lazy load routes and components

### 5.4 Development Workflow
- ✅ Use hot reload for development
- ✅ Implement proper logging
- ✅ Write migrations for database changes
- ✅ Use TypeScript strict mode
- ✅ Set up linting and formatting
- ✅ Write tests (unit, integration, e2e)

### 5.5 Documentation
- ✅ Auto-generate API docs (OpenAPI/Swagger)
- ✅ Document environment variables
- ✅ Maintain README with setup instructions
- ✅ Document architecture decisions
- ✅ Keep CHANGELOG updated

---

## 6. Common Tasks & Commands

### Development
```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Stop services
docker compose stop

# Remove everything
docker compose down -v
```

### Database
```bash
# Run migrations
cd apps/backend
npm run migrate

# Rollback migration
npm run migrate:down

# Generate types from DB
npm run db:generate-types

# Access database
PGPASSWORD=password psql -h localhost -p 5432 -U postgres -d dev
```

### Frontend
```bash
cd apps/frontend

# Development with real API
npm run dev

# Development with mock API
npm run dev:mock

# Build for production
npm run build

# Preview production build
npm run preview
```

### Backend
```bash
cd apps/backend

# Development mode
npm run dev

# Build TypeScript
npm run build

# Run production build
npm start
```

---

## 7. Template Variants

Trong thư mục `dg.app_starter/templates/`, có các variants:

### 7.1 `vue_hono_postgres/` (Current)
- Frontend: Vue 3 + Vite + Tailwind
- Backend: Hono + TypeScript
- Database: PostgreSQL + Kysely
- Storage: MinIO

### 7.2 `react_hono_postgres/`
- Frontend: React + Vite + Tailwind
- Backend: Hono + TypeScript
- Database: PostgreSQL + Kysely
- Storage: MinIO

### 7.3 `vue_rails_postgres/`
- Frontend: Vue 3 + Vite
- Backend: Ruby on Rails
- Database: PostgreSQL + ActiveRecord

---

## 8. Agent Usage Instructions

### Để tái tạo project này với agent khác:

```markdown
@agent Hãy tạo một project fullstack mới dựa trên template sau:

**Stack:**
- Frontend: Vue 3 + TypeScript + Vite + Tailwind CSS + Pinia
- Backend: Hono + TypeScript + Kysely + PostgreSQL
- Infrastructure: Docker + Docker Compose
- Storage: MinIO (S3-compatible)

**Requirements:**
1. Monorepo structure với apps/backend và apps/frontend
2. OpenAPI documentation với Swagger UI
3. JWT authentication
4. Database migrations với Kysely
5. Type-safe database queries
6. Form validation (VeeValidate + Yup)
7. Development và production Docker configurations

**Customizations:**
- [Specify your customizations here]
- Thay đổi database sang MySQL
- Thêm Redis cho caching
- Thêm email service
- etc.

Sử dụng file .github/project-template-analyzer.agent.md làm reference.
```

### Thay đổi công nghệ:
```markdown
@agent Dựa trên template Vue + Hono + PostgreSQL, hãy tạo variant mới với:

**Changes:**
- Frontend: Vue → React (Next.js)
- Backend: Hono → NestJS
- Database: PostgreSQL → MongoDB
- Storage: MinIO → AWS S3

Giữ nguyên cấu trúc monorepo và Docker setup.
Tham khảo patterns từ .github/project-template-analyzer.agent.md
```

---

## 9. Checklist khi Init Project Mới

- [ ] Clone/copy template structure
- [ ] Update package.json (name, version, description)
- [ ] Configure environment variables
- [ ] Update README.md with project-specific info
- [ ] Set up git repository
- [ ] Initialize database
- [ ] Run migrations
- [ ] Generate TypeScript types
- [ ] Test Docker Compose setup
- [ ] Verify all services are running
- [ ] Test API endpoints
- [ ] Test frontend routing
- [ ] Configure CI/CD (if needed)
- [ ] Set up monitoring/logging
- [ ] Document custom configurations

---

## 10. Troubleshooting

### Common Issues:

**Database connection failed**
```bash
# Check if PostgreSQL is running
docker compose ps postgres

# Check logs
docker compose logs postgres

# Verify connection string
echo $DATABASE_URL
```

**Port already in use**
```bash
# Find process using port
lsof -i :3000
lsof -i :5173

# Kill process or change port in compose.yml
```

**TypeScript errors**
```bash
# Regenerate database types
cd apps/backend
npm run db:generate-types

# Clean and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Docker build fails**
```bash
# Clear Docker cache
docker compose down -v
docker system prune -a

# Rebuild
docker compose build --no-cache
```

---

## Kết luận

File agent này cung cấp một blueprint hoàn chỉnh để:
1. ✅ Phân tích và hiểu rõ template project
2. ✅ Tái tạo project từ đầu
3. ✅ Customize và thay đổi stack công nghệ
4. ✅ Follow best practices
5. ✅ Troubleshoot common issues

Sử dụng file này như một reference document khi làm việc với AI agents để init hoặc customize projects.
