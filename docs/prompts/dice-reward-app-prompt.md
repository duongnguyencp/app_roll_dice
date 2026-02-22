# Dice Reward Web App

## 📋 Project Overview

Dice Reward là một web app cho phép người dùng tạo xúc xắc ảo với số mặt và phần thưởng tùy chỉnh, sau đó gieo xúc xắc để nhận phần thưởng ngẫu nhiên. Ứng dụng gamify hóa các hoạt động như học tập, tạo thói quen, mini game nhóm.

### Business Context
- **Vấn đề**: Người dùng muốn cơ chế "random thưởng" linh hoạt cho cả cá nhân lẫn nhóm, không bị ràng buộc bởi số mặt cố định
- **Mục tiêu**: Đơn giản hóa quá trình gamification — tạo dice → gán thưởng → gieo → nhận kết quả
- **Target users**:
  - **Persona A** – Cá nhân dùng offline/không đăng nhập, tự thưởng khi hoàn thành task
  - **Persona B** – Nhóm/team dùng chung, cần minh bạch kết quả

### Technical Context
- MVP không yêu cầu authentication — dữ liệu lưu backend (SQLite/PostgreSQL)
- 3D dice animation dùng Three.js
- Offline support: tùy chọn (Phase 2)

---

## 🎯 Functional Requirements

### Feature 1: Quản lý Xúc xắc (Dice Management)

**User Story**: Là người dùng, tôi muốn tạo/sửa/xóa xúc xắc ảo với số mặt tùy ý để dùng trong nhiều ngữ cảnh khác nhau.

**Acceptance Criteria**:
- [ ] Người dùng có thể tạo xúc xắc với tên và số mặt ≥ 2
- [ ] Danh sách xúc xắc hiển thị đầy đủ, có thể chọn để gieo
- [ ] Có thể sửa tên xúc xắc
- [ ] Xóa xúc xắc với confirm dialog

**Detailed Requirements**:

1. **Tạo xúc xắc (Create Dice)**
   - Validation rules:
     - `name`: bắt buộc, 1–100 ký tự, trim whitespace, không cho phép chỉ toàn khoảng trắng
     - `number_of_faces`: bắt buộc, integer, min = 2, max = 1000
   - Hành vi:
     - Auto-generate `dice_id` (UUID v4)
     - Auto-set `created_at` = current UTC timestamp
     - Sau khi tạo xong → tự động chuyển sang trang gán phần thưởng cho dice vừa tạo
   - Edge cases:
     - Tên trùng với dice khác → **cho phép** (người dùng có thể đặt tên tương tự)
     - `number_of_faces` không phải số nguyên (VD: 3.5) → reject, báo lỗi "Số mặt phải là số nguyên"
   - Error handling:
     - Empty name → "Tên xúc xắc không được để trống"
     - `number_of_faces` < 2 → "Xúc xắc phải có ít nhất 2 mặt"
     - `number_of_faces` > 1000 → "Số mặt tối đa là 1000"

2. **Đọc danh sách xúc xắc (List Dice)**
   - Hiển thị: tên dice, số mặt, số rewards đã gán
   - Sort: mới nhất trước (`created_at` DESC)
   - Empty state: "Chưa có xúc xắc nào. Tạo mới ngay!"
   - Loading skeleton khi fetch

3. **Sửa xúc xắc (Edit Dice)**
   - Chỉ cho phép sửa `name`
   - KHÔNG cho phép sửa `number_of_faces` nếu đã có rewards được gán (tránh mất mapping)
   - Nếu chưa có reward nào → cho phép sửa `number_of_faces`
   - Validation rules: tương tự Create

4. **Xóa xúc xắc (Delete Dice)**
   - Soft delete: set `deleted_at = now()`, KHÔNG xóa khỏi DB
   - Khi xóa dice → **cascade delete** tất cả rewards gán cho dice đó (soft delete)
   - Confirm dialog: "Xóa xúc xắc '[tên]'? Tất cả phần thưởng sẽ bị xóa theo."
   - Xóa thành công → reload danh sách

**Data Model**:
```typescript
interface Dice {
  dice_id: string        // UUID v4, PK
  name: string           // 1–100 chars, required
  number_of_faces: number // integer, 2–1000
  created_at: Date       // UTC timestamp
  updated_at: Date       // UTC timestamp
  deleted_at?: Date      // null nếu chưa xóa
}
```

**API Endpoints**:
- `GET /api/dice` - Lấy danh sách dice (chỉ chưa bị xóa)
  - Response: `{ data: Dice[], total: number }`
- `POST /api/dice` - Tạo dice mới
  - Body: `{ name: string, number_of_faces: number }`
  - Response: `{ data: Dice }`
  - Errors: `400` validation fail
- `GET /api/dice/:dice_id` - Chi tiết 1 dice
  - Response: `{ data: Dice }`
  - Errors: `404` không tồn tại
- `PATCH /api/dice/:dice_id` - Sửa dice
  - Body: `{ name?: string, number_of_faces?: number }`
  - Errors: `400` validation, `409` có rewards nên không sửa được số mặt
- `DELETE /api/dice/:dice_id` - Xóa dice (soft delete)
  - Response: `{ success: true }`

---

### Feature 2: Quản lý Phần thưởng (Reward Mapping)

**User Story**: Là người dùng, tôi muốn gán phần thưởng cho từng mặt xúc xắc (hoặc điều chỉnh trọng số xác suất) để kết quả gieo có ý nghĩa.

**Acceptance Criteria**:
- [ ] Mỗi mặt (face_value 1 → N) phải có ít nhất 1 reward được gán trước khi có thể gieo
- [ ] Cho phép nhiều mặt chia sẻ cùng tên phần thưởng (thông qua weight)
- [ ] Hiển thị danh sách tất cả rewards của 1 dice, theo thứ tự face_value
- [ ] Có thể sửa/xóa reward từng mặt

**Detailed Requirements**:

1. **Gán phần thưởng (Create/Assign Reward)**
   - Mỗi `face_value` (từ 1 đến `number_of_faces`) cần 1 reward
   - UI hiển thị dạng bảng/grid: mỗi hàng = 1 mặt, người dùng điền reward
   - Validation rules:
     - `reward_title`: bắt buộc, 1–200 ký tự
     - `reward_description`: tùy chọn, max 500 ký tự
     - `weight`: số thực dương, default = 1.0, min = 0.1, max = 100
     - `face_value`: 1 ≤ face_value ≤ number_of_faces (system-enforced)
   - Hỗ trợ **bulk fill**: điền nhanh cùng 1 reward cho nhiều mặt được chọn
   - Edge cases:
     - Dice 100 mặt → UI phải cuộn được, không bị vỡ layout
     - Weight phân phối: weight được dùng để tính xác suất có trọng số khi gieo
       - VD: face 1 weight=1, face 2 weight=3 → face 2 xuất hiện gấp 3 lần face 1

2. **Weighted Probability Logic**
   ```
   totalWeight = sum(all face weights)
   rand = random(0, totalWeight)
   // Walk through faces theo cumulative weight để chọn face
   ```
   - Nếu tất cả weight = 1 → gieo đều như xúc xắc thông thường
   - Nếu weight khác nhau → gieo có trọng số

3. **Xóa reward**
   - Soft delete: `deleted_at = now()`
   - Nếu xóa reward của 1 mặt → mặt đó trạng thái "chưa có reward"
   - Cảnh báo: không thể gieo nếu có mặt chưa có reward

**Data Model**:
```typescript
interface Reward {
  reward_id: string          // UUID v4, PK
  dice_id: string            // FK → Dice.dice_id
  face_value: number         // 1 → number_of_faces
  reward_title: string       // 1–200 chars, required
  reward_description?: string // 0–500 chars, optional
  weight: number             // float, default=1.0, min=0.1
  created_at: Date
  updated_at: Date
  deleted_at?: Date
}
```

**API Endpoints**:
- `GET /api/dice/:dice_id/rewards` - Lấy tất cả rewards của dice (chưa xóa)
  - Response: `{ data: Reward[] }` (sorted by face_value ASC)
- `POST /api/dice/:dice_id/rewards` - Tạo/cập nhật reward cho 1 mặt
  - Body: `{ face_value, reward_title, reward_description?, weight? }`
  - Logic: upsert (nếu face_value đã có reward → update, chưa có → create)
- `POST /api/dice/:dice_id/rewards/bulk` - Bulk upsert rewards
  - Body: `{ rewards: Array<{ face_value, reward_title, reward_description?, weight? }> }`
- `PATCH /api/dice/:dice_id/rewards/:reward_id` - Sửa reward
- `DELETE /api/dice/:dice_id/rewards/:reward_id` - Xóa reward (soft delete)

---

### Feature 3: Gieo Xúc xắc (Roll Dice)

**User Story**: Là người dùng, tôi muốn gieo xúc xắc và nhận kết quả + phần thưởng tức thì để trải nghiệm cảm giác random thật sự.

**Acceptance Criteria**:
- [ ] Chỉ gieo được khi tất cả `number_of_faces` mặt đều đã có reward
- [ ] Kết quả random phải có tính ngẫu nhiên tốt
- [ ] Hỗ trợ weighted probability qua trường `weight`
- [ ] Hiển thị animation 3D (Three.js) trước khi reveal kết quả

**Detailed Requirements**:

1. **Pre-roll Validation**
   - Kiểm tra: dice tồn tại, không bị xóa
   - Kiểm tra: số rewards active = `number_of_faces` (toàn bộ mặt đã có reward)
   - Nếu không đủ reward → trả `400` với thông báo rõ mặt nào còn thiếu

2. **Roll Logic (Backend)**
   ```
   faces = getAllActiveFacesWithWeights(dice_id)
   totalWeight = sum(face.weight for face in faces)
   rand = Math.random() * totalWeight
   
   cumulative = 0
   for face in faces (sorted by face_value ASC):
       cumulative += face.weight
       if rand < cumulative:
           return face
   ```
   - Luôn thực hiện roll ở **backend** để đảm bảo không thể can thiệp từ client
   - Lưu kết quả vào bảng `roll_history` (dù Phase 2 mới hiển thị UI history)

3. **Animation Flow (Frontend)**
   - Bước 1: User bấm nút "🎲 GIEO"
   - Bước 2: Play 3D dice animation (Three.js) — dice lăn ngẫu nhiên ~2-3 giây
   - Bước 3: Trong khi animation chạy → gọi API `POST /api/dice/:id/roll`
   - Bước 4: Animation kết thúc → reveal kết quả (số + phần thưởng)
   - Bước 5: Celebration effect (confetti nhỏ, sound optional)
   - Nguyên tắc: KHÔNG hiển thị kết quả cho đến khi animation xong

4. **Edge cases**:
   - Dice chỉ có 2 mặt, 1 mặt weight=99, 1 mặt weight=1 → vẫn hoạt động đúng
   - Network error trong khi animation chạy → sau animation hiển thị "Lỗi kết nối, thử lại"
   - User bấm "Gieo" nhiều lần liên tiếp → debounce 500ms + disable button trong khi processing

**API Endpoints**:
- `POST /api/dice/:dice_id/roll`
  - Response:
    ```json
    {
      "roll": 4,
      "reward": {
        "reward_id": "uuid",
        "title": "Nghỉ 30 phút",
        "description": "Thoải mái nghỉ ngơi"
      },
      "rolled_at": "2026-02-22T10:00:00Z"
    }
    ```
  - Errors:
    - `404`: dice không tồn tại
    - `400`: "Dice chưa đủ phần thưởng. Mặt còn thiếu: [2, 5, 7]"

---

### Feature 4: Hiển thị Kết quả (Result Display)

**User Story**: Là người dùng, tôi muốn thấy kết quả gieo rõ ràng và ấn tượng để cảm thấy hứng khởi với phần thưởng.

**Acceptance Criteria**:
- [ ] Hiển thị số vừa gieo (face value)
- [ ] Hiển thị tên phần thưởng (reward_title) nổi bật
- [ ] Hiển thị mô tả phần thưởng (nếu có)
- [ ] Có nút "Gieo lại" ngay sau kết quả

**Detailed Requirements**:

1. **Result Card**
   - Layout:
     ```
     ┌─────────────────────────┐
     │   🎲   Kết quả: 4       │
     │                         │
     │   🎁  Nghỉ 30 phút      │  ← reward_title (large, bold)
     │                         │
     │   📝  Thoải mái nghỉ... │  ← description (nếu có)
     │                         │
     │   [Gieo lại] [Đổi dice] │
     └─────────────────────────┘
     ```
   - Result card animate-in (slide up / fade in) sau khi animation 3D kết thúc
   - Màu sắc kết quả: dùng màu nổi bật, tạo cảm giác ăn mừng

2. **Share Result (Cơ bản)**
   - Nút "Copy kết quả" → copy text vào clipboard: "Tôi vừa gieo [dice_name] và được: [reward_title]! 🎲"
   - Không cần tích hợp mạng xã hội trong MVP

---

### Feature 5: Lịch sử Gieo (Roll History) — Phase 2

**User Story**: Là người dùng (nhóm/team), tôi muốn xem lại lịch sử gieo để minh bạch kết quả với mọi người.

> ⚠️ **Phase 2 only** — Backend vẫn nên ghi `roll_history` ngay từ MVP để không mất dữ liệu.

**Data Model**:
```typescript
interface RollHistory {
  history_id: string    // UUID v4
  dice_id: string       // FK
  dice_name: string     // snapshot tên dice lúc gieo
  rolled_value: number  // mặt xúc xắc ra
  reward_title: string  // snapshot tên phần thưởng lúc gieo
  reward_description?: string
  rolled_at: Date       // UTC timestamp
}
```

---

## 🔒 Non-Functional Requirements

### Security
- [ ] Validate + sanitize tất cả input (XSS prevention)
- [ ] Parameterized queries (chống SQL injection)
- [ ] Rate limiting trên endpoint roll: max 30 rolls/phút/IP
- [ ] CORS: chỉ cho phép origin của frontend

### Performance
- [ ] API roll response: < 200ms (p95)
- [ ] Page load: < 3s trên 3G
- [ ] Three.js animation: 60fps trên thiết bị mid-range

### Usability
- [ ] **Mobile-first**: responsive trên 320px – 1440px
- [ ] Dice với 2–20 mặt: hiển thị bảng rewards gọn
- [ ] Dice với 21–1000 mặt: virtualized list / scroll
- [ ] Font size đủ lớn cho kết quả (reward title >= 24px)

### Reliability
- [ ] Luôn ghi `roll_history` dù Phase 2 chưa có UI
- [ ] Không lag khi gieo (animation không block API call)

---

## 🚫 Out of Scope / Anti-Patterns

### What NOT to do:

- ❌ **Don't**: Thực hiện roll logic ở frontend (Math.random ở client)
  - **Why**: Có thể bị can thiệp, không minh bạch
  - **Instead**: Luôn gọi backend API để roll

- ❌ **Don't**: Hard delete dice/rewards khỏi DB
  - **Why**: Mất dữ liệu lịch sử, không audit trail
  - **Instead**: Soft delete với `deleted_at`

- ❌ **Don't**: Block UI trong khi chờ API roll response
  - **Why**: Trải nghiệm kém
  - **Instead**: Gọi API song song với animation, reveal sau khi cả hai xong

- ❌ **Don't**: Cho phép gieo khi số rewards < number_of_faces
  - **Why**: Có mặt không có phần thưởng → lỗi runtime
  - **Instead**: Validate và báo lỗi rõ mặt nào thiếu

- ❌ **Don't**: Lưu toàn bộ Reward object vào RollHistory
  - **Why**: Nếu reward bị sửa sau đó, history bị sai
  - **Instead**: Snapshot `reward_title` + `reward_description` tại thời điểm gieo

- ❌ **Don't**: Render 1000 input fields cùng lúc cho dice 1000 mặt
  - **Why**: Hang browser
  - **Instead**: Virtualized list, lazy render

### Out of Scope (MVP):
- Tài khoản người dùng / authentication
- Chia sẻ link xúc xắc
- Thống kê / biểu đồ phân phối
- Export CSV
- Daily reward / Level / XP
- Public dice gallery
- Anti-cheat seed công khai

---

## 🏗️ Implementation Guide

### Step-by-step Plan

**Phase 1: Setup & Core Backend**
1. [ ] Khởi tạo project structure (monorepo hoặc 2 repo riêng)
2. [ ] Setup database, migrations cho bảng `dice`, `rewards`, `roll_history`
3. [ ] Implement CRUD API cho Dice (`/api/dice`)
4. [ ] Implement CRUD API cho Rewards (`/api/dice/:id/rewards`)
5. [ ] Implement Roll API (`/api/dice/:id/roll`) với weighted random logic
6. [ ] Viết unit tests cho roll logic

**Phase 2: Frontend Core**
1. [ ] Setup routing: `/` (home/roll page), `/manage` (manage dice page)
2. [ ] Trang quản lý dice: danh sách, tạo, sửa, xóa
3. [ ] Trang gán rewards: bảng mặt → reward, bulk fill
4. [ ] Trang gieo: dropdown chọn dice, nút gieo, result card
5. [ ] Tích hợp Three.js cho 3D dice animation

**Phase 3: Polish**
1. [ ] Error handling toàn diện (network errors, validation errors)
2. [ ] Loading states, skeleton screens
3. [ ] Mobile responsive kiểm tra trên nhiều breakpoints
4. [ ] Performance: lazy load Three.js

**Phase 4: Phase 2 Features (tương lai)**
1. [ ] UI lịch sử gieo
2. [ ] Thống kê / biểu đồ
3. [ ] Tài khoản người dùng

### File Structure Gợi ý
```
app_roll_dice/
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── dice.routes.ts
│   │   │   │   ├── rewards.routes.ts
│   │   │   │   └── roll.routes.ts
│   │   │   ├── services/
│   │   │   │   ├── dice.service.ts
│   │   │   │   ├── rewards.service.ts
│   │   │   │   └── roll.service.ts    ← weighted random logic ở đây
│   │   │   ├── db/
│   │   │   │   ├── schema.ts
│   │   │   │   └── migrations/
│   │   │   └── middleware/
│   │   │       ├── validate.ts
│   │   │       └── rateLimiter.ts
│   │   └── tests/
│   │       └── roll.service.test.ts
│   └── frontend/
│       ├── src/
│       │   ├── components/
│       │   │   ├── DiceList/
│       │   │   ├── DiceForm/
│       │   │   ├── RewardTable/
│       │   │   ├── DiceRoller/          ← Three.js animation
│       │   │   └── ResultCard/
│       │   ├── views/
│       │   │   ├── HomeView.vue
│       │   │   └── ManageView.vue
│       │   ├── stores/
│       │   │   ├── dice.store.ts
│       │   │   └── roll.store.ts
│       │   └── api/
│       │       └── client.ts
│       └── tests/
```

---

## 📝 Detailed Examples

### Example 1: Tạo dice học tập

**Context**: Người dùng tạo dice "Thưởng học tập" 6 mặt

**Input** `POST /api/dice`:
```json
{
  "name": "Thưởng học tập",
  "number_of_faces": 6
}
```

**Output**:
```json
{
  "data": {
    "dice_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Thưởng học tập",
    "number_of_faces": 6,
    "created_at": "2026-02-22T10:00:00Z"
  }
}
```

---

### Example 2: Gán rewards cho 6 mặt (Bulk)

**Input** `POST /api/dice/550e.../rewards/bulk`:
```json
{
  "rewards": [
    { "face_value": 1, "reward_title": "Nghỉ 5 phút", "weight": 1 },
    { "face_value": 2, "reward_title": "Xem 1 video YouTube", "weight": 1 },
    { "face_value": 3, "reward_title": "Ăn snack yêu thích", "weight": 1 },
    { "face_value": 4, "reward_title": "Nghỉ 30 phút", "reward_description": "Thoải mái nghỉ ngơi", "weight": 0.5 },
    { "face_value": 5, "reward_title": "Chơi game 15 phút", "weight": 0.5 },
    { "face_value": 6, "reward_title": "Xem phim tối nay", "weight": 0.2 }
  ]
}
```

---

### Example 3: Gieo xúc xắc

**Input** `POST /api/dice/550e.../roll`:
```json
{}
```

**Output**:
```json
{
  "roll": 4,
  "reward": {
    "reward_id": "abc123",
    "title": "Nghỉ 30 phút",
    "description": "Thoải mái nghỉ ngơi"
  },
  "rolled_at": "2026-02-22T10:05:00Z"
}
```

---

### Example 4: Lỗi khi chưa đủ rewards

**Dice** "Team Game" có 4 mặt, mới gán 2 rewards (mặt 1 và 2).

**Input** `POST /api/dice/abc.../roll`

**Output** `400 Bad Request`:
```json
{
  "error": "INCOMPLETE_REWARDS",
  "message": "Dice chưa đủ phần thưởng. Mặt còn thiếu: [3, 4]",
  "missing_faces": [3, 4]
}
```

---

### Example 5: Weighted probability — Dice "Thưởng đặc biệt" 3 mặt

| Mặt | Reward | Weight | Xác suất thực |
|-----|--------|--------|---------------|
| 1 | Nghỉ 5p | 5 | 5/7 ≈ 71% |
| 2 | Bonus snack | 1 | 1/7 ≈ 14% |
| 3 | Ngày nghỉ tự do | 1 | 1/7 ≈ 14% |

*Mặt 1 xuất hiện nhiều gấp 5 lần mặt 2 và 3.*

---

## ✅ Testing Requirements

### Unit Tests
- [ ] `roll.service`: Test weighted random với 10,000 lần gieo → phân phối đúng với sai số < 5%
- [ ] Validation functions: mỗi validation rule có ít nhất 1 test case
- [ ] Edge: dice 2 mặt, 1 weight cực cao

### Integration Tests
- [ ] `POST /api/dice` → tạo thành công + fail validation
- [ ] `POST /api/dice/:id/roll` → roll thành công, roll khi thiếu rewards
- [ ] Soft delete dice → không còn xuất hiện trong list

### E2E Tests
- [ ] Flow: Tạo dice → gán rewards → gieo → thấy kết quả
- [ ] Flow: Xóa dice → confirm → hết trong danh sách

### Test Coverage Target
- Roll service: **100%** (logic nghiệp vụ quan trọng nhất)
- API routes: **≥ 80%**
- Overall: **≥ 70%**

---

## 📚 References & Resources

- [Three.js Dice Examples](https://threejs.org/examples/)
- [UUID v4 (crypto.randomUUID)](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID)
- [Weighted Random Algorithm](https://en.wikipedia.org/wiki/Alias_method)

---

## 🔄 Change Log

- **v1.0** (2026-02-22): Initial requirements analysis từ roll_dice_requirements.md
