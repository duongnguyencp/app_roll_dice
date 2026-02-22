📘 ĐẶC TẢ WEB APP
🎲 Dice Reward Web App
1. Mục tiêu sản phẩm (Product Goal)

Xây dựng một web app cho phép người dùng:

Tạo xúc xắc ảo (dice) với số mặt tùy ý

Tự định nghĩa phần thưởng cho mỗi mặt (hoặc mỗi khoảng kết quả)

Thực hiện gieo xúc xắc ngẫu nhiên

Nhận kết quả + phần thưởng tương ứng

(Tuỳ chọn) Lưu lịch sử gieo & thống kê

Ứng dụng hướng đến:

Cá nhân (gamify học tập, thói quen)

Nhóm nhỏ / team

Mini game / random reward

2. Đối tượng người dùng (User Personas)
Persona A – Cá nhân

Muốn tự thưởng khi hoàn thành việc

Ưu tiên đơn giản, không cần đăng nhập

Persona B – Nhóm / team

Muốn tạo trò chơi thưởng chung

Cần lưu lịch sử, minh bạch kết quả

3. Phạm vi tính năng (Scope)
3.1 MVP (bắt buộc)

Tạo xúc xắc

Gieo xúc xắc

Gán phần thưởng

Hiển thị kết quả

3.2 Nâng cao (có thể làm sau)

Lưu lịch sử

Thống kê

Tài khoản người dùng

Chia sẻ link xúc xắc

4. Chức năng chi tiết (Functional Specification)
4.1 Quản lý xúc xắc (Dice Management)
4.1.1 Tạo xúc xắc

Người dùng có thể tạo 1 xúc xắc mới với các thuộc tính:

Thuộc tính	Kiểu	Mô tả
dice_id	UUID	ID duy nhất
name	string	Tên xúc xắc
number_of_faces	number	Số mặt (>=2)
created_at	datetime	Ngày tạo
4.2 Quản lý phần thưởng (Reward Mapping)
4.2.1 Gán phần thưởng cho từng mặt

Mỗi mặt xúc xắc có 1 phần thưởng tương ứng.

Thuộc tính	Kiểu	Mô tả
reward_id	UUID	
dice_id	UUID	
face_value	number	Giá trị mặt (1 → N)
reward_title	string	Tên phần thưởng
reward_description	string	Mô tả (optional)
weight	number	Trọng số xác suất (default = 1)

📌 Lưu ý:

Cho phép nhiều mặt trỏ đến cùng 1 phần thưởng

Hoặc dùng weight để điều chỉnh xác suất

4.3 Gieo xúc xắc (Roll Dice)
4.3.1 Logic gieo

Khi người dùng bấm nút Gieo 🎲

Hệ thống:

Sinh số ngẫu nhiên hợp lệ

Ánh xạ sang phần thưởng

Trả kết quả cho UI

Pseudo logic:

roll = random(1, number_of_faces)
reward = getRewardByFace(roll)
4.4 Hiển thị kết quả (Result Display)

Sau khi gieo:

Hiển thị:

🎲 Số vừa gieo

🎁 Tên phần thưởng

📝 Mô tả (nếu có)

Có animation xúc xắc (optional)

4.5 Lịch sử gieo (Optional – Phase 2)
Thuộc tính	Kiểu
history_id	UUID
dice_id	UUID
rolled_value	number
reward_title	string
rolled_at	datetime

Chức năng:

Xem lịch sử theo ngày

Export CSV (optional)

5. Giao diện người dùng (UI/UX Spec)
5.1 Trang chính

Dropdown chọn xúc xắc

Nút 🎲 GIEO

Khu vực hiển thị kết quả

5.2 Trang quản lý xúc xắc

Tạo / sửa / xoá xúc xắc

Danh sách mặt + phần thưởng

5.3 Nguyên tắc UX

Ít thao tác

Kết quả rõ ràng

Có cảm giác “random thật”

7. API cơ bản (Example)
7.1 Roll dice
POST /api/dice/{dice_id}/roll
Response:
{
  "roll": 4,
  "reward": {
    "title": "Nghỉ 30 phút",
    "description": "Thoải mái nghỉ ngơi"
  }
}
8. Phi chức năng (Non-functional Requirements)

Random phải đủ tốt (Math.random + seed optional)

Responsive (mobile-first)

Không lag khi gieo

Có thể dùng offline (optional)

9. Hướng mở rộng tương lai

Daily reward

Level / XP

Anti-cheat (seed 공개)

Public dice gallery