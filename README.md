# 🌈 Cuộc Phiêu Lưu Của Mây v10.0 — Cốt Truyện 6 Chương, Kỹ Năng Thực Chiến & Đấu Trùm (Three.js PBR)

Phiên bản web 3D (PWA chơi offline hoàn toàn, sẵn sàng chạy trên GitHub Pages mà không cần bước build).

## Cốt truyện mới & 6 Chương Nhiệm Vụ Đa Dạng (Không lặp lại!)
**Vua Mây Bão (Bóng Xám)** đã cướp **6 Viên Ngọc Cầu Vồng**, bắt cóc **Bé Gió Lốc Tí Hon** và phủ Màn Sương Xám lên 6 vùng đất. Bé **Mây** xuất phát tại **Đảo Mây** với Cây Gậy Phép còn trống rỗng, trò chuyện với các **NPC Giao Nhiệm Vụ (`!`)**, thức tỉnh lần lượt **6 Kỹ Năng Nguyên Tố thực chiến**, dùng chúng giải đố/biến đổi thế giới và đánh bại **6 Trùm Sương Xám**:
1. **🌊 Chương 1 — Vịnh San Hô Xanh** *(Giải cứu & Phản đòn)*: Gặp **Cụ Rùa San Hô Cổ** nhận **Phép `1` Sóng Xung Kích (`🌊`)** -> phá lưới đá cứu Cá heo Bubi, thổi tan 3 Đám Mây Mực quanh Tàu Đắm -> đấu **Trùm Bạch Tuộc Mực Khổng Lồ** bằng cách đẩy ngược Ngọc Trai Đen Nổ!
2. **🌲 Chương 2 — Khu Rừng Nấm Xanh** *(Hồi sinh hệ sinh thái)*: Gặp **Bà Sóc Hạt Dẻ** -> rửa Ụ Bùn Đen bằng `🌊` để thức tỉnh **Phép `2` Nở Hoa Hồi Sinh (`🌿`)** -> **hồi sinh 3 Cây Cổ Thụ Chết Khô** mọc lá xanh, hoa & nấm lò xo -> phối hợp `🌊`+`🌿` đánh bại **Vua Nấm Khô Héo** hồi sinh Cây Cổ Thụ Mẹ!
3. **🏜️ Chương 3 — Sa Mạc Kim Tự Tháp** *(Giải đố 3 Đài Gương Laser)*: Gặp **Lạc Đà Kiki** -> hồi sinh Cây Chà Là Ốc Đảo bằng `🌿` để thức tỉnh **Phép `3` Tia Nắng Rực Rỡ (`☀️`)** -> đốt bóng tối kích hoạt **3 Đài Gương bắn tia Laser Vàng** hội tụ phá Phong Ấn Kim Tự Tháp -> hạ **Bọ Cạp Sa Mạc Khổng Lồ**!
4. **💎 Chương 4 — Hang Động Pha Lê** *(Phá hầm & Đàn Nhạc Đô-Mi-Son)*: Gặp **Nhạc Sư Cú Mèo** -> thắp 2 đuốc hang bằng `☀️` để thức tỉnh **Phép `4` Cộng Hưởng Pha Lê (`💎`)** -> đập vỡ Tường Pha Lê Nứt, chơi đúng thứ tự 3 nốt Đô→Mi→Son -> dùng `💎` phá Giáp Đá + `☀️` thanh tẩy **Golem Pha Lê Khổng Lồ**!
5. **❄️ Chương 5 — Thung Lũng Tuyết Trắng** *(Xây Cầu Băng & Đặt Bẫy)*: Gặp **Trưởng Làng Cánh Cụt Bông** -> phá tảng băng nứt bằng `💎` để thức tỉnh **Phép `5` Sương Băng Đóng Kết (`❄️`)** -> **đóng băng mặt suối xây 3 Cầu Băng đi bộ thật**, đóng cứng Quả Cầu Tuyết Lăn -> dựng Cột Băng bẫy **Sói Tuyết Băng Giá**!
6. **☁️ Chương 6 — Vương Quốc Trên Mây** *(Hất Văng Quái Lên Trời & Trùm Cuối 3 Pha)*: Gặp **Sứ Giả Phượng Hoàng** -> tới Đài Hợp Nhất thức tỉnh **Phép `6` Lốc Cầu Vồng (`🌈`)** -> **hất văng bầy Lính Mây Sấm bay thẳng lên bầu trời**, cưỡi cột khí nâng bay qua đảo cao -> quyết chiến **Trùm Cuối Vua Mây Bão** kết hợp đa kỹ năng & hất tung Bóng Xám tan thành Cầu Vồng 7 Sắc!

## Nâng cấp kỹ thuật v10.0 (`js/story.js`, `js/pbr.js`, `js/audio.js`)
- **Hộp thoại RPG kể chuyện NPC (`!`/`?`/`★`/`♥`)**, **3 Trái Tim Ánh Sáng**, **Thanh Máu Trùm**, **Biến đổi khí quyển Sương Xám → Rực Rỡ** sau khi hạ Boss & **Chế độ Tự Do mở nhanh 6 phép** trong Sổ Tay (`J`).
- **47 đoạn giọng đọc tiếng Việt offline (`assets/voice/*.mp3`)** + **Âm thanh không gian 3D (`PannerNode`)** + Foley theo 8 chất liệu mặt sàn.
- **Mặt nước hấp thụ độ sâu Beer-Lambert + tán xạ sóng SSS + bọt bờ theo độ sâu thật**, **Planar Reflections**, **Depth-Buffer SSAO 32-bit sạch sọc**, **Decal Runic ôm độ dốc địa hình**, **Va chạm rắn 3D** & tạo hình thú hữu cơ mượt mà hơn.

## Cấu trúc mã nguồn
- `index.html`, `style.css`, `game.js`: Giao diện HUD, Thanh Phép Thuật, Bản Đồ Thế Giới (`M`), Sổ Tay & Tủ Đồ (`J`), và vòng lặp chính.
- `js/data.js`: Dữ liệu 6 màn, 6 phép thuật, trang phục, trang bị, câu đố giáo dục & lưu `localStorage`.
- `js/audio.js`: Giọng đọc tiếng Việt offline (`assets/voice/*.mp3`), Foley bước chân theo chất liệu, nhạc nền từng vùng đất & âm thanh phép thuật.
- `js/core.js`: Renderer, Lights, tải 15 mô hình `.glb` & quản lý vòng đời màn chơi.
- `js/pbr.js`: Tổng hợp PBR 384px, Planar Reflections, shader nước/bầu trời/caustics, đồng cỏ gió, đèn lồng, vòng cảnh quan tầm xa & hậu kỳ Depth SSAO/Bloom/Film Grain.
- `js/vfx.js`: Vòng tròn Runic thủ tục & 6 kỹ năng VFX nguyên tố của Mây.
- `js/player.js`: Mô hình Mây 3D khớp 2 đoạn cầm Gậy Phép, vật lý di chuyển & camera tự nhiên.
- `js/systems.js`: Nhà máy thú 3D (35 loài), World Context, nhãn diegetic tự mờ theo khoảng cách, thử thách & modal.
- `js/levels/hub.js` và `level1_ocean.js` … `level6_clouds.js`: 7 bản đồ 3D hoàn chỉnh.
- `sw.js`, `manifest.json`: PWA cài đặt và chơi offline hoàn toàn.
