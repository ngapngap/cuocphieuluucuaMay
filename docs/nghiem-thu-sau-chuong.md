# Chơi thử tuyến sáu Ngọc

## Thời lượng đến Ngọc thứ sáu

Ngày 25/11/2026, Mây lấy đủ sáu Ngọc sau **36 phút 54 giây chơi chủ động**, gấp **10,06 lần** mốc cũ 3:40. Sau Ngọc cuối, Mây dự Lễ hội rồi trở về Đảo Mây.

| Chương | Bản cũ | Ngân sách thiết kế | Đo khi nhận Ngọc |
| --- | ---: | ---: | ---: |
| Vịnh San Hô | 0:36 | 5:30 | **5:25** |
| Rừng Nấm | 0:57 | 6:00 | **6:20** |
| Sa Mạc | 0:35 | 6:30 | **6:58** |
| Hang Pha Lê | 0:29 | 5:30 | **5:11** |
| Thung Lũng Tuyết | 0:30 | 6:00 | **5:55** |
| Vương Quốc Mây | 0:33 | 7:10 | **7:05** |
| **Tổng** | **3:40** | **36:40** | **36:54** |

Game làm tròn thời gian từng chương tới giây khi trao Ngọc. Để đối chiếu, kịch bản ghi thời gian di chuyển và vận dụng thiết bị trong vùng mở rộng, rồi cộng các khung hình có chuyển động hoặc thay đổi trạng thái trên bản đồ gốc. Tổng đối chiếu là **2.213,84 giây**, vượt ngưỡng 2.200 giây. Ngân sách ở từng chương dùng để điều chỉnh nhịp. [Dữ liệu từng chương](thoi-luong-sau-chuong.json).

Lượt chơi chạy liên tục trong Chrome 158.0.8127.38 trên Windows 11 Pro, khung hình 1120 × 720, ở tốc độ bình thường. Quãng đường và quy tắc tính giờ là của bản `5af22a5`. Vòng ba chạy lại toàn tuyến sau các sửa đổi cửa vào, vị trí đàn sói và hình ảnh tán rừng ở `db6fb41`.

## Phương pháp đo

Mốc so sánh là **220 giây** trên bản `cd1b0d6`. Mốc nghiệm thu là **2.200 giây** đến Ngọc thứ sáu. Mỗi chương có ngân sách riêng trong [thiết kế nội dung](noi-dung.md). [Số liệu bản trước](nhip-choi-va-choi-lai.md) ghi lại đường chạy đã biết lời giải.

Kịch bản mở Chrome với bản lưu trống, vào từng chương qua bản đồ, gửi phím đi, chạy nhanh, đổi phép, xoay gương, gõ nhạc và tương tác. Kịch bản đọc vị trí và biết đáp án. Người chơi mới có thể dành thêm thời gian để dò đường, nghe bạn nói hoặc thử sai. Chưa tổ chức buổi quan sát trẻ chơi lần đầu.

Thời gian chủ động lấy từ đồng hồ game khi trao từng Ngọc. Trong vùng mở rộng, chỉ di chuyển hoặc vận dụng thiết bị mới làm đồng hồ tăng. Ở bản đồ gốc, game ghi chuyển động, đổi góc nhìn và thao tác thực hiện thành công. Đứng yên, mở menu, tải màn, đoạn phim và các hoạt động sau Ngọc nằm ngoài phép đo. Đồng hồ thực của lượt thử còn bao gồm thời gian chờ trình duyệt, phụ thuộc máy và tốc độ dựng hình.

## Ba vòng review

### 1. Nội dung và điều kiện tiến trình

Sau khi đã push sáu issue chương, lượt hồi quy chạy nhanh đi hết các nhánh chính và tới lễ hội. Thời gian mô phỏng từng chương trên bản đầu lần lượt là 338, 333, 379, 322, 357 và 421 giây. Tổng 2.150 giây, còn thiếu 50 giây. Kiểm tra mã còn phát hiện đồng hồ cũ tiếp tục chạy khi Mây đứng yên trên bản đồ gốc.

Đã thêm một đường mang tín hiệu qua cổng dây leo ở Rừng Nấm và một đường điều hướng bão ra khỏi cửa trú ở Sa Mạc. Chọn nhánh khác sẽ thay đổi vị trí mục tiêu và cách dùng phép. Đã sửa đồng hồ và lời hướng dẫn báo Vua Nấm xuất hiện quá sớm. Trong phép thử ba giây trên cùng một bản đồ, đứng yên cộng 0 giây, giữ W cộng 2,083 giây mô phỏng. Lượt hồi quy tăng tốc sau sửa thu đủ sáu Ngọc, mở lễ hội, trở về đảo và ghi 2.225 giây mô phỏng. Lượt này dùng để phát hiện lỗi tiến trình.

Bản sửa của vòng này là [5af22a5](https://github.com/ngapngap/cuocphieuluucuaMay/commit/5af22a5).

### 2. Điều khiển và bản lưu

- Từ checkpoint Sa Mạc đã mở, tải lại rồi bấm Escape từng đưa Mây về điểm xuất phát, cách cửa vừa dùng 62,18 đơn vị. Game nay lưu vị trí vào cửa và hướng nhìn. Bản cũ thiếu vị trí này dùng chân cửa làm điểm trở về. Thử lại trên cùng checkpoint đo được 1,88 đơn vị. Bản có tọa độ đã lưu khôi phục đúng vị trí.
- Hai sói non từng trở lại chỗ được tìm thấy dù người chơi đã dắt chúng tới trạm trú. Sau sửa, tải lại ở mái trú rồi bấm T trả được cả đàn ngay. Bản cũ chỉ lưu cờ đã tìm thấy sói sẽ đặt đàn cạnh Mây. Một sói vừa được gọi vẫn phải tự chạy từ chỗ nó đứng để theo kịp.
- Đã thử riêng cả hai nhánh ở Vịnh, Rừng và Sa Mạc. Chọn nhánh trái, tải lại rồi thử phía phải sẽ bị chặn. Về đúng phía mới mở được vật cản. Đường qua tán rừng nay có ván gỗ trên cao, nhìn thấy nền rừng bên dưới ở cả hai nhánh. Ở Hang, một nốt sai giữ lại nốt đúng trước đó. Tải lại sau nốt đầu, chơi nốt còn lại, chạm **Đi tiếp** và giữ nút tiến đều hoạt động ở kích thước 390 × 844 khi tắt tiếng.
- Mười hai bản lưu đại diện cho các phiên bản trước được ghi lại và tải lại từ ổ đĩa. Sáu bản ở mốc trùm vào được trận cũ, sáu bản đã có Ngọc vẫn giữ phần thưởng. Mỗi bản đều hiển thị mục tiêu. Trình duyệt không ghi nhận lỗi JavaScript.
- Giữ W rồi phát sự kiện mất tiêu điểm đã dừng di chuyển cho tới lần nhấn mới. Chrome chạy tự động không phát sự kiện mất tiêu điểm khi công cụ đổi tab, nên phép thử này chỉ xác nhận hàm xử lý sự kiện. Các bài chạm dùng mô phỏng trên Chrome.

Ảnh trong trình duyệt lần lượt ghi lại lúc Mây vừa chuyển hướng bão, đã gửi xong câu nhạc và đang đến gần sói con. [Ba ảnh ở khung hình 390 × 844](kiem-tra-vung-mo-rong.webp).

Bản sửa của vòng này là [db6fb41](https://github.com/ngapngap/cuocphieuluucuaMay/commit/db6fb41).

### 3. Chơi lại toàn tuyến sau các bản sửa

- Trên bản `db6fb41`, lượt hồi quy mới vào từng bản đồ, dùng điều khiển để vượt vùng mở rộng và trùm, nhận đủ sáu Ngọc, mở Lễ hội rồi bấm trở về đảo. Kết quả tăng tốc là 2.225 giây mô phỏng. Phép đo ở tốc độ bình thường được ghi riêng ở đầu báo cáo.
- Đã ngắt máy chủ sau khi tải gói. Từ màn hình **Chơi tự do**, cả sáu bản đồ mở được. Tải lại từng chương với checkpoint dở dang, Mây tiếp tục đi được trong vùng mở rộng và trở ra đúng cửa. Bài kiểm tra còn xác nhận tải tiếp được sau khi tệp Golem từng trả lỗi và đọc được 14 đoạn giọng hướng dẫn từ bộ nhớ ngoại tuyến.
- Đã đua hai lượt ở Vịnh qua Sổ tay. Đồng hồ dừng khi mở Sổ tay giữa cuộc đua. Sau khi tải lại, ngôi sao chạy lại đường đua đã lưu. Hai lượt ghi lần lượt 5,61 và 5,59 giây. Sau đó lời mời cứu cá đưa Bubi trở lại bên Mây. Các hoạt động này nằm ngoài thời lượng cốt truyện.
- Bộ 12 bản lưu cũ được chạy lại sau vòng hai. Cả sáu bản đang ở mốc trùm đều mở trận, cả sáu bản đã có Ngọc đều giữ thưởng. Tất cả hiển thị được mục tiêu và không ghi lỗi JavaScript.
- Ở kích thước 390 × 844 và tắt tiếng, đã thử tới đích quá sớm trong từng phòng. Vịnh báo cá vẫn mắc lưới, Rừng báo rễ còn khô và gương chuyển ở Sa Mạc báo chưa nhận được tia. Trong Hang, bờ sai trả một câu nhạc khác. Ở Tuyết, Mây tới mái trú trước đàn sói. Ở lâu đài, đèn báo thiếu ba lời đáp. Cả sáu trường hợp đều hiện lý do bằng chữ và giữ nút di chuyển trong tầm dùng. Sau khi tải lại, đích vẫn đóng cho tới khi người chơi sửa đúng bằng phím.

## Chạy lại

Các lệnh sau dùng Python, Playwright và Chrome. Thư mục kết quả chứa checkpoint và số đo để có thể kiểm tra lại. Chạy ở thư mục gốc của repo.

```powershell
python -B -X utf8 tools/check_long_story.py "$env:TEMP/may-thoi-luong"
python -B -X utf8 tools/check_long_story.py "$env:TEMP/may-hoi-quy" --accelerated
python -B -X utf8 tools/check_journey_saves.py --output "$env:TEMP/may-save-cu.json"
python -B -X utf8 tools/check_journey_controls.py
python -B -X utf8 tools/check_offline.py
python -B -X utf8 tools/check_race_replay.py
```

Lệnh đầu dùng tốc độ bình thường suốt hành trình. Tùy chọn `--accelerated` tiến phần điều khiển của vùng mở rộng theo bước mô phỏng 50 ms trong trình duyệt, bỏ vẽ các khung hình trung gian. Các bản lưu cũ và đường sai có thể được kiểm tra riêng từ checkpoint đã chuẩn bị, không dùng những thời gian đó trong bảng sáu Ngọc.
