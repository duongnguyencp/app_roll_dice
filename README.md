# 🎲 Dice Reward Web App

Web app gamification: tạo xúc xắc ảo với phần thưởng tùy chỉnh, gieo để nhận thưởng ngẫu nhiên.

## Stack

| Layer | Tech |
|-------|------|
| Backend | Node.js + [Hono](https://hono.dev) + TypeScript |
| Database | SQLite (better-sqlite3) |
| Frontend | Vue 3 + Vite + Pinia + TypeScript |
| 3D Animation | Three.js |
| Tests | Vitest |

## Cấu trúc

```
apps/
├── backend/       # Hono API server (port 3000)
│   ├── src/
│   │   ├── types/design.ts      ← Single source of truth
│   │   ├── services/            ← Business logic (pure, do-not-touch-frameworks)
│   │   ├── routes/              ← Hono adapters
│   │   ├── db/                  ← SQLite client + migrations
│   │   └── middleware/schemas.ts ← Zod validation
│   └── tests/
└── frontend/      # Vue 3 SPA (port 5173)
    └── src/
        ├── api/client.ts        ← HTTP adapter
        ├── stores/              ← Pinia state
        ├── views/               ← Routed pages
        └── components/          ← UI components
```

## 🐳 Chạy với Docker (khuyên dùng)

```bash
# Build + chạy toàn bộ stack
docker compose up --build

# Chạy nền
docker compose up --build -d

# Dừng
docker compose down

# Xem logs
docker compose logs -f
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000/api |

> Dữ liệu SQLite được lưu vào Docker volume `dice-data` — không mất khi restart.

## Chạy development (không Docker)

```bash
# 1. Cài dependencies
cd apps/backend && npm install
cd apps/frontend && npm install

# 2. Chạy backend (terminal 1)
cd apps/backend && npm run dev

# 3. Chạy frontend (terminal 2)
cd apps/frontend && npm run dev
```

Frontend tự proxy `/api` → `http://localhost:3000`

## Chạy tests

```bash
cd apps/backend
npm test                  # Run all tests
npm run test:coverage     # Coverage report (target ≥ 70%)
```

## API Endpoints

| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/api/dice` | Danh sách xúc xắc |
| POST | `/api/dice` | Tạo xúc xắc mới |
| PATCH | `/api/dice/:id` | Sửa xúc xắc |
| DELETE | `/api/dice/:id` | Xóa xúc xắc (soft) |
| GET | `/api/dice/:id/rewards` | Danh sách phần thưởng |
| POST | `/api/dice/:id/rewards` | Tạo/cập nhật reward (upsert) |
| POST | `/api/dice/:id/rewards/bulk` | Bulk upsert rewards |
| PATCH | `/api/dice/:id/rewards/:rid` | Sửa reward |
| DELETE | `/api/dice/:id/rewards/:rid` | Xóa reward (soft) |
| **POST** | **`/api/dice/:id/roll`** | **Gieo xúc xắc** |

## Roll Logic

```
totalWeight = Σ(face.weight)
rand = Math.random() * totalWeight
// Walk cumulative → pick face
```

Gieo luôn thực hiện ở **backend** để đảm bảo tính minh bạch.
