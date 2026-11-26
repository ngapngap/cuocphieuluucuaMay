# 🌈 Cuộc Phiêu Lưu Của Mây

Phiên bản web 3D (PWA chơi offline hoàn toàn, sẵn sàng chạy trên GitHub Pages mà không cần bước build).

Ở chặng cuối, hãy nhìn theo luồng gió để đón Bé Gió và cùng thắp đèn. Trong sáu cuộc đua, Mây có thể rẽ khỏi đường chính để lấy sao tiếp sức. Trên điện thoại, kéo vòng tròn để đi, vuốt bằng ngón còn lại để nhìn và chạm lời nhắc để tương tác. [Ảnh trò chơi và kết quả chơi thử](docs/cai-tien-trai-nghiem.md)

## Thay đổi ở v11.0
- **Kiến trúc & Mô hình 3D hữu cơ sắc nét hơn**: Nâng cấp khuôn mặt/tóc Mây (tròng trắng + điểm sáng mắt + nơ tóc), điêu khắc lại Hươu/Tuần lộc/Kỳ lân/Chim/Phượng hoàng bằng `CapsuleGeometry` & cánh phân lớp, nâng cấp toàn bộ **6 mô hình Trùm**, **Ngọn Hải Đăng** (lan can sắt + cửa sổ tròn), **Cây Cổ Thụ Mẹ** (thân Lathe + hốc cổ tích + 5 cành uốn TubeGeometry), **Kim Tự Tháp** (chóp vàng + 2 trụ Obelisk), **Đấu Trường Tròn Golem Pha Lê** trên hồ ngầm và **Lâu Đài Cầu Vồng** (tường châu mai, cổng vòm vàng, cờ bay & lan can cầu vồng cong).
- **Camera điện ảnh & điều khiển không kẹt chuột**: Gỡ khóa con trỏ tự động gây kẹt nút hội thoại, hỗ trợ **click trực tiếp lên NPC/rương bằng con trỏ chuột**, xóa phím kẹt khi đóng hộp thoại (`clearKeys`), không còn bị Cổng Đố tự bật giữa nhiệm vụ, camera tự xoay giới thiệu Trùm khi xuất hiện (`triggerCamFocus`), và thay toàn bộ `setTimeout` đòn Boss bằng bộ hẹn giờ an toàn `ctx.scheduleEvent` tạm dừng theo modal.
- **Vật lý cầu & giải đố thật 100%**: Đi bộ vững trên Cầu gỗ Đảo Mây, Cầu vòm Rừng Nấm, Cầu đá & Đấu trường tròn Hang Pha Lê; 3 khe suối Chương 5 khoét sâu thật vào địa hình tuyết để phép `❄️` đóng băng thành Cầu Băng trượt qua; sửa trùng NPC ở cả 6 chương và tối ưu hiệu năng FPS (`PlanarReflector` xen kẽ khung hình trên mức `mid`).

## Nội dung cuộc phiêu lưu

Mây đi tìm sáu Ngọc để thắp lại hải đăng. Nửa đường, Bé Gió gửi tín hiệu xin Mây đổi hướng ánh sáng. Sáu vùng lần lượt mở rộng vào khoang tàu, tán nấm, kim tự tháp, hồ vọng âm, sườn tuyết và tháp chuông. Người chơi phải đưa người bạn cuối cùng về an toàn trước khi ngọn đèn lại tỏa sáng.

[Cốt truyện và thiết kế sáu chương](docs/noi-dung.md) · [Thời lượng và kết quả nghiệm thu](docs/nghiem-thu-sau-chuong.md) · [Những hoạt động sau khi nhận Ngọc](docs/nhip-choi-va-choi-lai.md)

## Nâng cấp kỹ thuật v10.0 (`js/story.js`, `js/pbr.js`, `js/audio.js`)
- **Hộp thoại RPG kể chuyện NPC (`!`/`?`/`★`/`♥`)**, **3 Trái Tim Ánh Sáng**, **Thanh Máu Trùm**, **Biến đổi khí quyển Sương Xám → Rực Rỡ** sau khi hạ Boss & **Chế độ Tự Do mở nhanh 6 phép** trong Sổ Tay (`J`).
- **47 đoạn giọng đọc tiếng Việt offline (`assets/voice/*.mp3`)** + **Âm thanh không gian 3D (`PannerNode`)** + Foley theo 8 chất liệu mặt sàn.
- **Mặt nước hấp thụ độ sâu Beer-Lambert + tán xạ sóng SSS + bọt bờ theo độ sâu thật**, **Planar Reflections**, **Depth-Buffer SSAO 32-bit sạch sọc**, **Decal Runic ôm độ dốc địa hình**, **Va chạm rắn 3D** & tạo hình thú hữu cơ mượt mà hơn.

## Cấu trúc mã nguồn

Tác giả, giấy phép và các thay đổi của mười mẫu thú được ghi trong [danh sách mô hình Polyfork](assets/models/POLYFORK.md).
Ảnh trước và sau của Mây, gấu, thỏ, Đảo Mây và cầu mây nằm trong [báo cáo kiểm tra hình ảnh](docs/kiem-tra-hinh-anh.md).
Ảnh từ lần dựng lại Mây, Milo, Cụ Rùa, bốn trùm và sáu vùng có trong [báo cáo mỹ thuật](docs/ra-soat-my-thuat.md). Cơ chế chuyển bờ, mở chốt cầu, sáu trạm sau Ngọc và thời lượng từng chương có trong [thiết kế nội dung](docs/noi-dung.md).
Các chặng cứu hộ, đài gương và hoạt động mở sau khi nhận Ngọc có trong [bảng nhịp chơi và chơi lại](docs/nhip-choi-va-choi-lai.md).

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
