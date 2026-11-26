# Chơi thử sáu chương sau đợt cải tiến

Bản đối chiếu là `0dd62b9`. Các lượt chơi dùng Chrome trên Windows. Khung điện thoại 390 × 844 dùng giả lập cảm ứng. Thời gian của trẻ lần đầu chơi và tốc độ trên điện thoại thật cần được đo riêng.

## Những lựa chọn mới của người chơi

- **Thắp đèn cùng Bé Gió.** Lần dùng Nắng đầu tiên ở sân lâu đài làm hai luồng gió hiện lên. Mây bước sang một bên để đón bạn, trở về giữa và chiếu Nắng lần nữa. Khi đèn sáng, hai bạn mới có đường ra hải đăng. Trạng thái đón bạn được lưu nếu đóng game giữa chừng. Lượt thử đã dùng sai phép, tải lại, di chuyển bằng nút chạm và giải khi tắt tiếng. [Ảnh ba thời điểm ở sân lâu đài](be-gio-tin-hieu.webp)
- **Đua lại.** Sáu đường đua có sao vàng để Mây rẽ qua nhặt. Mỗi sao cho thêm bốn giây trước khi hết giờ. Kỷ lục và ngôi sao chạy lại đường đua trước dùng thời gian thực của lượt. Đã lái bằng phím để nhặt hai sao ở mỗi vùng, thắng rồi nhặt hai sao đổi chỗ ở lượt kế tiếp. Lượt thử đầu phát hiện một sao nằm ngoài tầm nhảy ở Vương quốc Mây. Sau khi đặt nó trên đoạn cầu hoặc đảo đi được, lượt thử lại đã tới được sao.
- **Học sau khi trả lời sai.** Câu hỏi về số màu còn thiếu đưa trẻ sang một bài tính tiếp cùng dạng. Với câu đã tô bốn màu, gợi ý cho trẻ đếm từ bốn đến bảy. Sau khi sửa đúng, lượt thử nhận một câu khác với sáu màu đã tô.

## Hình ảnh và điều khiển

Các cụm san hô, đá đổ, bụi rừng, tinh thể và tuyết tạo chi tiết dọc hai mép đường. Riêng đường tuyết có vệt phân cách với bờ, cầu mây có lan can đậm hơn và vòng mục tiêu có màu nhìn được trên nền sáng. Phần chỉnh vật liệu và sương sau khi dựng thêm tiền cảnh giữ nguyên số lượt vẽ ở hai góc đối chiếu. Chrome ghi 27 lượt ở Tuyết và 49 lượt ở Mây. [Sáu vùng và phản ứng của nhân vật](my-thuat-mobile-truoc-sau.webp) · [Đường tuyết và cầu mây trước và sau](duong-tuyet-may-mobile.webp)

Mây mỉm cười khi bắt chuyện. Milo phản ứng khi Mây thắng và có thể giữ động tác đó trong cảnh quay. Khi bật giảm chuyển động của hệ thống, camera giữ một góc trong mỗi cảnh và tín hiệu cuối vẫn đọc được. Trên điện thoại, thanh phép nằm sau mục tiêu kể cả khi chữ xuống dòng. Đã thử di chuyển và xoay đồng thời bằng hai ngón, chọn và dùng phép, mở bản đồ. Nút tương tác cũng nhận Enter và Space. [Ảnh giao diện dọc, ngang và máy tính](giao-dien-choi.webp)

## Dữ liệu tải xuống

| Dữ liệu | Bản đối chiếu | Bản mới |
| --- | ---: | ---: |
| Mười model khi vào Đảo Mây | 4.555.948 byte | 1.667.350 byte với gzip |
| Năm model gấu, hươu, thỏ, thỏ núi và sói ở định dạng GLB | 6.208.712 byte | 3.092.132 byte |
| Bảy bản âm thanh môi trường | 4.480.308 byte WAV | 2.695.937 byte FLAC |

Hai hàng model có phần trùng nhau. Năm model giữ lưới, da, xương và texture. Đã đối chiếu giá trị chuyển động tại từng thời điểm khóa của bản gốc sau khi bỏ các khóa dư. Kiểm tra cả thư mục thu được 37 GLB đạt, 9 có cảnh báo, 0 lỗi. Chrome cũng giải mã và đối chiếu cả 2.240.000 mẫu âm thanh stereo giữa FLAC và WAV. Mỗi tệp model gzip giải ra đúng từng byte của GLB nguồn. Có thể tạo lại bằng `python tools/pack_start_models.py` và xác minh bằng tùy chọn `--check`.

### Từ mở trang đến khi Mây bước được

Mỗi bản chạy năm lần trong hồ sơ Chrome mới, luân phiên thứ tự hai bản. Công cụ bấm Chơi, bỏ qua cảnh mở đầu, giữ W và dừng đo khi tọa độ của Mây thay đổi. Ở mạng giả lập tải xuống 1,6 Mbit/s, độ trễ 150 ms, trung vị giảm từ **42,76 giây xuống 23,66 giây**, khoảng 45%. Trung vị dữ liệu tài nguyên tải xong tại mốc đó giảm từ 8,17 MB xuống 4,28 MB. Máy chủ là HTTP cục bộ, service worker bị chặn cho phép đo mạng chậm.

| Giây đến bước đầu | Lượt 1 | Lượt 2 | Lượt 3 | Lượt 4 | Lượt 5 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Bản đối chiếu | 64,21 | 42,76 | 42,36 | 43,54 | 42,72 |
| Bản mới | 23,37 | 23,66 | 24,38 | 24,37 | 23,46 |

Ở vòng giữa, việc bỏ khóa hoạt ảnh dư và hoãn tải các texture chưa dùng đã đưa trung vị mạng chậm xuống 35,17 giây. Sau đó nhóm mới nén mười model khởi động. Để đo lại với một bản cũ đã giải nén ở thư mục riêng, dùng `python tools/startup_controls.py . ket-qua.json --compare THU_MUC_BAN_CU --slow`.

Trên máy chủ cục bộ, cùng phép đo và cho phép service worker, trung vị năm lượt là **2,66 giây** trước và **2,36 giây** sau. Các lượt dao động theo lúc Chrome khởi động và tình trạng máy. Cải thiện lớn nhất trong phép đo này xuất hiện khi giới hạn băng thông.

## Lưu và chơi ngoại tuyến

Bản lưu có một bản dự phòng trên cùng trình duyệt. Đã thử làm hỏng JSON, ghi JSON sai cấu trúc, mở hai thẻ rồi ghi từ thẻ cũ, giả lập lỗi ghi và đặt lại hành trình. Mười hai bản lưu ở mốc trùm hoặc đã có Ngọc vẫn vào đúng chương.

Khi đang cập nhật và máy chủ trả lỗi cho một model, trình duyệt vẫn đọc được bản đã tải từ đợt trước. Khi tải đủ gói mới, game bỏ bộ đệm cũ của bản cài này. Nếu hết chỗ lưu ngoại tuyến, game báo trong Sổ tay và tiếp tục dùng tài nguyên tải được qua mạng.

Đã tắt máy chủ rồi mở cả sáu màn, tiếp tục từ checkpoint, di chuyển và trở về cửa. Bài thử chạy hai lần. Lần đầu dùng gói gzip và FLAC. Lần hai giả lập thiếu giải nén gzip và thiếu bộ giải mã FLAC của Web Audio. Chrome đã lưu đúng GLB và WAV dự phòng, giữ được 13 clip của Mây và 5 clip của Milo khi mở lại ngoại tuyến.

## Thời lượng tuyến truyện

Lượt đi từ bản lưu trắng đã nhận đủ sáu Ngọc, mở lễ hội và về lại Đảo Mây. Đồng hồ từng chương ghi 5:26, 6:22, 7:01, 5:21, 5:59 và 7:08, tổng **37:17**. Bài này tăng tốc khung hình ở các đoạn hành trình. Số đo ở tốc độ chơi bình thường gần nhất là **36:54** trên bản trước. [Phép đo thời lượng ở tốc độ thường](nghiem-thu-sau-chuong.md)

Để lặp lại lượt chơi và các phép thử từ thư mục gốc trên PowerShell:

```powershell
python -B -X utf8 tools/check_long_story.py "$env:TEMP/may-kiem-tra" --accelerated
python -B -X utf8 tools/check_race_replay.py
python -B -X utf8 tools/check_race_replay.py --boost-stars
python -B -X utf8 tools/check_late_difficulty.py
python -B -X utf8 tools/check_save_recovery.py
python -B -X utf8 tools/check_offline.py
python -B -X utf8 tools/check_offline.py --legacy-formats
python -B -X utf8 tools/check_ambience.py
```
