# Kết quả kiểm tra bản thử Hang Pha Lê

Ngày 25/11/2026. Bản đối chiếu là `690dcef`. Máy Windows dùng Chrome 158, Intel UHD Graphics 630, driver 31.0.101.2141, ANGLE D3D11, màn 1180 × 760, chất lượng Vừa. Game chạy qua HTTP cục bộ. Các lượt đo dùng một cấu hình người chơi mới cho mỗi lần mở mới. Trình duyệt có thể dùng lại bộ nhớ đệm shader giữa các lượt trong cùng một tiến trình.

## Vào chơi và đổi vùng

| Mốc đồng hồ thực | Trước | Sau |
| --- | ---: | ---: |
| Nút Chơi bật, trung vị 5 lượt có service worker | 2,81 s | 1,01 s |
| Mây di chuyển sau khi bấm Chơi và bỏ qua phim, trung vị 5 lượt | 3,70 s | 1,97 s |
| Di chuyển ở lượt đầu của tiến trình Chrome mới | 22,28 s | 12,39 s |
| Vẽ khung đầu của Hang Pha Lê trong trace tắt cache shader trên đĩa | 12,95 s | 1,87 s |
| Khoảng ngắt lớn nhất của lượt trace đó | 13,04 s | 2,19 s |

`startup_controls.py` quan sát nút Chơi, kích hoạt nút, bỏ qua phim và gửi sự kiện phím W. Mốc cuối là khi tọa độ ngang thay đổi hơn 0,04 đơn vị. Bảng theo từng chương có cả lượt đi từ Đảo Mây, lượt đi liên tiếp và lượt quay lại. Mốc mở mới ≤4 giây đạt theo trung vị. Với độ trễ 150 ms và tốc độ tải xuống giả lập 1,6 Mbit/s, trung vị năm lượt tới nút Chơi và ba khung hình là 31,17 giây. Mục tiêu khoảng ngắt ≤200 ms còn mở. [Bảng đầy đủ, cách chạy và đồ thị tác vụ dài](performance-measurement.md)

## Đối chứng Hang Pha Lê

Mỗi cấu hình dưới đây bắt đầu bằng một tiến trình Chrome mới, tắt cache shader trên đĩa. Mỗi hàng là một lượt đo thời gian khung đầu trong `MAY.renderFrame`. Các chi phí của nhiều lượt vẽ có thể chồng lên nhau ở GPU, nên không cộng các chênh lệch giữa các hàng.

| Cấu hình của bản gốc | Dựng màn | Vẽ khung đầu | Số chương trình WebGL |
| --- | ---: | ---: | ---: |
| Nguyên bản | 137 ms | 12.955 ms | 118 |
| Tắt phản xạ | 131 ms | 5.813 ms | 88 |
| Tắt khúc xạ | 137 ms | 12.149 ms | 118 |
| Tắt hậu kỳ, vẽ trực tiếp ra màn hình | 129 ms | 18.833 ms | 148 |
| Tắt bóng của đèn đội đầu | 178 ms | 3.500 ms | 88 |
| Tắt tất cả bóng | 118 ms | 11.947 ms | 114 |
| Phản xạ và ánh sáng mức Vừa mới | 164 ms | 1.828 ms | 52 |
| Bản cuối, giải phóng tài nguyên cảnh cũ sau khi vẽ cảnh mới | 226 ms | 1.873 ms | 52 |

Đèn đội đầu vẫn chiếu sáng ở mức Vừa, bóng của đèn bật ở mức Cao. Camera phản xạ cắt cảnh bằng mặt phẳng chiếu, giúp dùng chung shader với khung chính. Chuyển mười lần giữa Vịnh San Hô và Hang Pha Lê phát hiện texture khung xương bị giữ lại mỗi lần rời màn. Sau khi giải phóng các texture đó, bốn lượt quay lại Hang đều có 334 geometry và 126 texture. Bốn lượt quay lại Vịnh có 244–247 geometry và 118 texture. Mười lượt có 38 collider tại Hang và không ghi nhận lỗi WebGL. [Trace gốc](../tools/crystal-before.json) · [Trace sau](../tools/crystal-after.json) · [Mười lần chuyển](../tools/water-crystal-revisits.json)

Nạp texture lên GPU trước khung đầu mất 98 ms và khung vẽ tiếp theo vẫn mất 15,50 s. Chuẩn bị vật liệu bằng `renderer.compile` mất 7,36 s, khung vẽ tiếp theo mất 6,62 s. Trên máy này, biên dịch đồng bộ trước khung đầu chuyển phần lớn thời gian chờ sang bước chuẩn bị. Đã kiểm tra hình ảnh mặt nước, nền hang, tuyết và cầu mây ở bốn vùng trong Chrome. [Dữ liệu đối chứng chuẩn bị sớm](../tools/crystal-preparation.json)

Ở bản cuối, cảnh cũ giữ vật liệu tới khi cảnh mới đã dùng được các shader chung. Trong bốn lượt quay lại mỗi vùng, khoảng ngắt ở Vịnh giảm từ 387–427 ms xuống 160–213 ms, ở Hang từ 467–520 ms xuống 213–320 ms. Số texture ổn định ở 115–116 tại Vịnh và 124 tại Hang. [Trace cuối](../tools/crystal-final.json) · [Mười lần chuyển ở bản cuối](../tools/water-crystal-final.json)

## Tuyến biết đường ở Vịnh San Hô

Chạy qua bản đồ ở chế độ Cốt truyện từ bản lưu mới. Kịch bản đọc vị trí để gửi phím di chuyển, nhận Sóng từ Cụ Rùa, cứu Bubi, phá ba đám mực, đẩy ngọc trai rồi bơi tới bệ Ngọc. Cả hai lượt nhận một Ngọc với 1/10 vật phẩm, 0 câu đố, 0 thử thách và 0 nhiệm vụ phụ. Thời gian giữa các hoạt động đo bằng đồng hồ thực của trình duyệt.

| Một lượt tự động biết đường | Chờ chuyển sang Vịnh | Chơi chủ động | Thoại bỏ qua | Phim bỏ qua |
| --- | ---: | ---: | ---: | ---: |
| Bản gốc | 2,48 s | 23,57 s | 0,08 s | 0,65 s |
| Bản thử | 2,43 s | 21,58 s | 0,05 s | 0,55 s |

[Kịch bản điều khiển](../tools/ocean_route.py) · [Lượt gốc](../tools/ocean-before.json) · [Lượt mới](../tools/ocean-after.json)

## Ngoại tuyến, giao diện và tiến trình

| Hạng mục | Kết quả |
| --- | --- |
| Tải bị ngắt | Máy chủ trả 503 giữa gói Golem. Game vào được Đảo Mây. Kết nối lại tải tiếp đến khi báo đủ nội dung. |
| Chơi khi mất mạng | Tắt máy chủ và cho trình duyệt ngoại tuyến. Tải lại game, mở đủ sáu vùng qua bản đồ, tải lại ở chương 6. Trang phục giải mã đủ sáu ảnh và đoạn thoại trả đúng 128 byte được yêu cầu. |
| Nội dung | 36/36 GLB qua bộ kiểm tra. Ở đợt đo trước #17, cache có 47 đoạn thoại, bảy âm thanh vùng và sáu ảnh trang phục. |
| Điều khiển | Nút Chơi nằm trong khung 360 × 640, 390 × 844 và 844 × 390. Đã thử thao tác NPC, thoại, Sổ tay và chọn/tung phép trong Chrome. Có kiểm tra bố cục thanh máu trùm khi đủ sáu phép. |
| Trang phục | Tên, trạng thái khóa, đang mặc và toàn thân được kiểm tra ở 390 × 844 và 1180 × 760. Sáu ảnh WebP dùng 48.794 byte. Ba ảnh cũ và ảnh đại diện dùng chung trước đây chiếm 139.902 byte tính theo tệp duy nhất. Ảnh đại diện vẫn dùng ở màn mở đầu. |
| Câu đố | Đã thử sai, xem gợi ý, tự sửa, bỏ qua, mở lại và tải lại khi tắt tiếng, ngoại tuyến. Điểm được lưu một lần cho mỗi đáp án đúng. |
| Bản lưu | Đã thử giữa chương, cờ hạ trùm cũ, đã có Ngọc, đã mở đủ vùng và thưởng vật phẩm. Bản mới cần nhận Ngọc để mở chương kế. |
| Hang Pha Lê | Đã thử nốt đúng/sai, hai nút phát lại, tín hiệu sáng, tải lại giữa câu, hai mẫu và mở giáp rồi chiếu Nắng gây sát thương. |

**Bản thử** sẵn sàng cho buổi chơi thử. Chờ kết quả tổng hợp của ít nhất năm trẻ ở #10 để quyết định cơ chế cho #11–#13. Việc chơi xuyên sáu chương mới và kiểm tra trên điện thoại thật của #14 vẫn cần thực hiện trước khi phát hành. [Phiếu buổi thử](choi-thu-hang-pha-le.md)

## Giọng hướng dẫn và âm thanh ở Vịnh và Hang (#17–#18)

Bản thử bổ sung 14 câu tiếng Việt được tổng hợp sẵn thành MP3. Sáu tệp của Vịnh San Hô chiếm 283.584 byte, tám tệp của Hang Pha Lê chiếm 413.952 byte. Mỗi câu gắn với một trang thoại. Nút **Nghe lại** phát lại trang đang mở. Service worker lưu các tệp theo chương sau khi nút Chơi đã bật. Bảy tệp WAV môi trường hiện có chiếm 4.480.308 byte. Bản thử giữ định dạng WAV cho vòng lặp và dùng Web Audio cho tiếng san hô khi cứu Bubi và tiếng nước nhỏ giọt trong hang.

- Trên Chrome ở khung cảm ứng 390 × 844, đã mở hội thoại của Cụ Rùa và Cú Mèo, đi qua sáu trang, nghe lại, tắt/bật tiếng và nhấn Escape. Sự kiện của phần tử âm thanh thật ghi mỗi trang dừng MP3 cũ, nghe lại đúng câu và tối đa một giọng phát. Bài kiểm tra riêng gửi phím và sự kiện chạm trên Chrome, mô phỏng cả thiết bị có và thiếu giọng tiếng Việt. Giữ phím và bấm đúp chỉ chuyển một trang. [Kiểm tra hội thoại](../tools/check_voice.py)
- Sau khi dừng máy chủ, Chrome tải lại game, giải mã đủ 14 câu từ bộ nhớ đệm và vào đủ sáu chương. [Kiểm tra ngoại tuyến](../tools/check_offline.py)
- Đầu ra Web Audio của Vịnh được lấy mẫu trong 60,43 giây và của Hang trong 60,08 giây. Cả 119 mẫu của Vịnh và 118 mẫu của Hang đều có tín hiệu. Lúc phát nốt câu đố, mức nền giảm và tiếng nước nhỏ giọt tạm dừng. Thử nghe qua loa điện thoại và tai nghe thật, đánh giá mối nối và chọn định dạng cuối vẫn cần người thử. [Đo tín hiệu âm thanh](../tools/check_ambience.py)

Đo lại trên cùng cấu hình sau khi thêm các câu thu sẵn, trung vị năm lần mở mới đến khi Mây di chuyển là 1,79 giây, so với 1,97 giây trước khi thêm âm thanh và 3,70 giây ở bản gốc. Lượt đầu trong tiến trình Chrome mới mất 10,89 giây. [Năm lượt đo sau khi thêm giọng](../tools/startup-audio.json)
