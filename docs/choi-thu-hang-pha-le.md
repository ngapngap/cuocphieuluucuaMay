# Phiếu chơi thử Hang Pha Lê

Người điều phối dùng cùng một bản game cho ít nhất năm trẻ chơi lần đầu. Ghi mã commit, ngày thử, trình duyệt, thiết bị và cách điều khiển. Bố trí cả lượt dùng bàn phím và lượt dùng cảm ứng. Chỉ bắt đầu sau khi người giám hộ đồng ý và trẻ muốn tham gia. Trẻ có thể dừng bất cứ lúc nào.

1. Dùng hồ sơ chơi riêng cho từng lượt. Chuẩn bị bản lưu ngay trước khi Nhạc Sư giới thiệu ba trụ. Với lượt thử tắt âm thanh, ghi lại thiết lập đó.
2. Nói “Con thử giúp Nhạc Sư mở lối trong hang nhé”. Để trẻ tự tìm cách bắt đầu, xem hoặc nghe mẫu, thử nốt và sửa. Mỗi lần trẻ bấm nghe lại, dùng gợi ý hoặc nhờ người lớn, ghi riêng từng loại.
3. Đưa mẫu vận dụng cho trẻ sau phần làm quen. Ghi trẻ có tự bắt đầu và hoàn thành bằng các gợi ý trong game hay cần người điều phối chỉ nốt. Ghi điểm đầu tiên trẻ bị kẹt và thao tác giúp trẻ tiếp tục.
4. Mời trẻ chọn đi tiếp hoặc khám phá, rồi hỏi “Đoạn nào con muốn chơi lại?”. Quan sát khoảng 5–8 phút chơi chủ động nếu trẻ muốn tiếp tục.

Dùng đồng hồ thực. Mỗi thời điểm chỉ ghi một hoạt động trong các nhóm tải, đọc/nghe thoại, di chuyển, giải hoặc tự chọn khám phá. Thời gian chủ động bằng di chuyển cộng giải và khám phá. Ghi riêng thời gian tạm ngừng.

| Dữ liệu tổng hợp để cập nhật issue #10 | Kết quả |
| --- | --- |
| Bản game, thiết bị và số lượt theo cách điều khiển | |
| Số trẻ tự bắt đầu / tổng số lượt | |
| Số trẻ tự nhận ra ba trụ chơi được / tổng số lượt | |
| Số trẻ tìm lại được trụ vừa vang / tổng số lượt | |
| Số trẻ tự giải được mẫu mới, kể cả dùng gợi ý trong game / tổng số lượt | |
| Số lượt cần người lớn chỉ cách giải | |
| Trung vị thời gian tải, đọc, di chuyển, giải và tự chọn khám phá | |
| Trung vị số lần nghe lại, xem gợi ý và nhờ người lớn | |
| Thao tác trẻ muốn lặp lại hoặc hay bị kẹt | |
| Quyết định giữ/sửa cho phát mẫu, nhập nốt, sửa nốt, gợi ý, luyện thêm | |

Ngưỡng đề xuất để xem xét nhân rộng là ít nhất 4/5 trẻ tự bắt đầu và giải được mẫu mới. Chỉ đăng số liệu tổng hợp và quyết định thiết kế vào issue công khai.

## Đối chiếu đạo cụ #15

Ngày 25/11/2026, Chrome headless dùng ANGLE Direct3D11 trên Intel UHD Graphics 630; cùng góc máy tại từng trụ, bản trước trích bằng `git archive` từ commit `fbe31fdd32fbbc33fc9c0f2134b4c88e6a6eadfd`, bản sau là cây làm việc. Đô là hình tròn ●, Mi tam giác ▲, Son kim cương ◆; ba bệ đồng nhất. Pha lê nền tối hơn, dùng lại hình học/vật liệu, đá vụn dùng chung hình học/vật liệu và bớt nổi. Hình so sánh đen trắng ở [Nhẹ 390×844](../tools/issue15-qa/grayscale-low-390.webp), [Nhẹ 1180×760](../tools/issue15-qa/grayscale-low-1180.webp), [Vừa 390×844](../tools/issue15-qa/grayscale-mid-390.webp), [Vừa 1180×760](../tools/issue15-qa/grayscale-mid-1180.webp). Các ảnh màu đầy đủ và số liệu máy đọc được nằm cùng thư mục.

Mỗi ô dưới đây là **một lượt**, không phải trung vị: tắt tự xóa `renderer.info`, đặt lại ngay trước `MAY.renderFrame` rồi đọc sau khi hàm trả về, gồm các lượt vẽ phản xạ, khúc xạ, bóng, cảnh chính và hậu kỳ được thực hiện trong hàm đó. Các lượt dựng tài nguyên ngoài `renderFrame` không nằm trong số lượt vẽ. Thời gian tính từ yêu cầu chuyển màn tới khung đầu hoàn tất; khoảng ngắt là `requestAnimationFrame` lớn nhất trong khoảng đó. Bối cảnh có tải không đồng đều và bản sau còn chứa các thay đổi khác ngoài #15; không thể quy mức chênh thời gian cho riêng đạo cụ.

| Mức / viewport | Lượt vẽ trước → sau | Khung đầu trước → sau (ms) | Ngắt lớn nhất trước → sau (ms) |
| --- | ---: | ---: | ---: |
| Nhẹ / 1180×760 | 429 → 423 | 2356 → 3844 | 2293 → 3733 |
| Nhẹ / 390×844 | 206 → 192 | 551 → 988 | 507 → 854 |
| Vừa / 1180×760 | 1039 → 929 | 2421 → 2901 | 2373 → 2773 |
| Vừa / 390×844 | 528 → 539 | 651 → 664 | 600 → 600 |

Kiểm tra tự động xác nhận ba hình và ba đích còn hoạt động khi tắt tiếng, trở về màn và tải ngoại tuyến; nhấn tạo xung rồi trở về trạng thái nghỉ. Đã chụp hình ở cả hai mức chất lượng. Chưa có lượt chơi với trẻ: số trẻ nhận ra ba trụ và tìm lại trụ vừa vang vẫn cần ghi trong lượt #10, không suy ra từ ảnh hoặc kiểm thử tự động.
