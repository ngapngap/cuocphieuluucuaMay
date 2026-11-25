# 🌈 Cuộc Phiêu Lưu Của Mây v11.0 — Cốt Truyện 6 Chương, Kỹ Năng Thực Chiến & Đấu Trùm (Three.js PBR)

Phiên bản web 3D (PWA chơi offline hoàn toàn, sẵn sàng chạy trên GitHub Pages mà không cần bước build).

## Nâng cấp mới ở v11.0 (Điêu khắc 3D + Sửa toàn bộ lỗi gameplay)
- **Kiến trúc & Mô hình 3D hữu cơ sắc nét hơn**: Nâng cấp khuôn mặt/tóc Mây (tròng trắng + điểm sáng mắt + nơ tóc), điêu khắc lại Hươu/Tuần lộc/Kỳ lân/Chim/Phượng hoàng bằng `CapsuleGeometry` & cánh phân lớp, nâng cấp toàn bộ **6 mô hình Trùm**, **Ngọn Hải Đăng** (lan can sắt + cửa sổ tròn), **Cây Cổ Thụ Mẹ** (thân Lathe + hốc cổ tích + 5 cành uốn TubeGeometry), **Kim Tự Tháp** (chóp vàng + 2 trụ Obelisk), **Đấu Trường Tròn Golem Pha Lê** trên hồ ngầm và **Lâu Đài Cầu Vồng** (tường châu mai, cổng vòm vàng, cờ bay & lan can cầu vồng cong).
- **Camera điện ảnh & điều khiển không kẹt chuột**: Gỡ khóa con trỏ tự động gây kẹt nút hội thoại, hỗ trợ **click trực tiếp lên NPC/rương bằng con trỏ chuột**, xóa phím kẹt khi đóng hộp thoại (`clearKeys`), không còn bị Cổng Đố tự bật giữa nhiệm vụ, camera tự xoay giới thiệu Trùm khi xuất hiện (`triggerCamFocus`), và thay toàn bộ `setTimeout` đòn Boss bằng bộ hẹn giờ an toàn `ctx.scheduleEvent` tạm dừng theo modal.
- **Vật lý cầu & giải đố thật 100%**: Đi bộ vững trên Cầu gỗ Đảo Mây, Cầu vòm Rừng Nấm, Cầu đá & Đấu trường tròn Hang Pha Lê; 3 khe suối Chương 5 khoét sâu thật vào địa hình tuyết để phép `❄️` đóng băng thành Cầu Băng trượt qua; sửa trùng NPC ở cả 6 chương và tối ưu hiệu năng FPS (`PlanarReflector` xen kẽ khung hình trên mức `mid`).

## Cốt truyện & 6 Chương Nhiệm Vụ Đa Dạng (Không lặp lại!)

Nhặt vật phẩm là nhánh khám phá tùy chọn: mỗi vật phẩm hồi một tim nếu Mây bị thương; tìm 5 vật phẩm ở chương 2–6 nhận sớm trang bị của vùng. Ở chương 1, kính lặn có sẵn giúp bơi nhanh. Ngọc được nhận sau khi hạ trùm, tại NPC hoặc bệ Ngọc; chỉ sưu tầm đủ không thay thế việc vận dụng phép. Huy hiệu tốc độ dành cho cuộc đua.

| Chương | Học và tự vận dụng | Điều kiện Ngọc | Công dụng vật phẩm / thưởng tùy chọn | Khi thử sai |
| --- | --- | --- | --- | --- |
| 1 – Biển | Học Sóng cứu Bubi, tự phá mây mực và đẩy ngọc trai về trùm | Hạ Bạch Tuộc | Sao biển hồi tim; tìm rương, kỷ vật và bảo vật ẩn | Chờ trùm nhả ngọc trai rồi dùng Sóng đẩy ngược |
| 2 – Rừng | Rửa bùn, học Nở Hoa và chọn cây chết để hồi sinh | Hạ Vua Nấm | Nấm sáng hồi tim; 5 nấm mở giày nhảy; khám phá rương và bảo vật | Tiến lại gần cây chết rồi chọn Nở Hoa |
| 3 – Sa mạc | Hồi sinh ốc đảo, dùng Nắng kích hoạt các gương | Hạ Bọ Cạp | Đá mặt trời hồi tim; 5 đá mở khăn gió; khám phá rương và bảo vật | Chọn Nắng và hướng tới gương chưa sáng |
| 4 – Pha lê | Thắp đuốc, dùng Cộng Hưởng phá tường và chơi Đô–Mi–Son | Hạ Golem | Tinh thể hồi tim; 5 tinh thể mở đèn pha; khám phá rương và bảo vật | Nghe lại thứ tự Đô–Mi–Son và thử từ đầu |
| 5 – Tuyết | Phá băng nứt, dùng Sương Băng xây cầu và đóng cầu tuyết | Hạ Sói Tuyết | Bông tuyết hồi tim; 5 bông mở ván trượt; khám phá rương và bảo vật | Dùng Sương Băng gần khe suối hoặc cầu tuyết |
| 6 – Mây | Học Lốc Cầu Vồng, tự phá ổ khóa và phối hợp phép đấu trùm | Hạ Vua Mây Bão | Lông vũ hồi tim; 5 lông mở cánh lướt; khám phá rương và bảo vật | Chọn phép theo pha trùm và tránh đòn trước khi phản công |
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
- `BLENDER_ASSET_SPEC.md` & `tools/check_glb.py`: Đặc tả thiết kế model/rig/animation/lightmap bằng Blender và script kiểm định Đạt/Không Đạt (PASS/WARN/FAIL) cho tệp `.glb` (`python tools/check_glb.py assets/models/`).
