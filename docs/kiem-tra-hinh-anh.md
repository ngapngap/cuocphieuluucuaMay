# Kiểm tra hình ảnh trong game

Ngày 25/11/2026. Ảnh gấu, thỏ và Đảo Mây đối chiếu bản `3bcc5f8` với bản sửa ở cùng góc nhìn. Bảng động vật dùng ánh sáng chung để so hình dáng. Ảnh phong cảnh lấy trực tiếp từ màn chơi.

| Hạng mục | Thay đổi và kết quả quan sát |
| --- | --- |
| Nhân vật và sinh vật | Tóc Mây chuyển sang nâu sẫm, giảm độ bóng và tách lọn quanh búi tóc. Mây có nếp váy, động tác chớp mắt và nét cười. Milo có tai và bàn chân rõ hơn. Thỏ trắng, thỏ rừng và thỏ tuyết phân biệt qua màu lông, dáng đứng và tai. Gấu trúc, gấu Bắc Cực và quái gấu tuyết có thân và chân gấu. Đã chơi thử đoạn gấu tuyết đuổi theo và bị thanh tẩy bằng phép băng. |
| Môi trường | Hải đăng và cây cọ ở Đảo Mây có hình dáng mới. Ở Hang Pha Lê, ba trụ nhạc mang hình chuông, trống và chuông treo. Tám cầu ở Vương quốc Mây có mặt cầu cong, lan can và trụ. Đã đi từ đảo giữa đến đảo phía tây bằng phím W. |
| Chất liệu | Bờ Đảo Mây chuyển màu từ đá ướt lên đá khô. Giữa bãi cỏ có đường đất dẫn đến hải đăng và rẽ về nhà gỗ. Bề mặt khoáng trong hang có các mặt cắt sáng tối. |
| Ánh sáng | 18 tảng đá ven bờ lấy mẫu ánh sáng từ bản đồ ánh sáng địa hình theo tọa độ thực. Phạm vi kiểm tra là bờ Đảo Mây. |
| Hiệu ứng | Mảnh vỡ phép xoay và rơi trên GPU. Một lần vỡ có 32, 96 hoặc 192 mảnh tùy chất lượng. Trong đoạn thử ở Chrome, mỗi lần vỡ dùng một lượt vẽ instanced. Hiệu ứng kết thúc và kích hoạt lại được ở cả ba mức. |
| Hoạt ảnh và camera | Mây giữ 13 clip chuyển động và 6 trang phục. Camera lệch vai nhẹ trên cạn và nhìn xa hơn theo tốc độ chạy. Đã kiểm tra thao tác xoay và thu phóng. |
| Nhãn trong khung hình | Khi hai nhãn đè lên nhau, game ưu tiên nhãn nhiệm vụ. Đã kiểm tra ở 1180 × 760 và 390 × 844, vào cảnh cắt rồi bỏ qua để xác nhận nhãn ẩn và hiện lại đúng lúc. |

## Ảnh đối chiếu

- [Gấu và thỏ trước và sau](so-sanh-gau-tho.webp)
- [Mây từ sau lưng và khi biểu cảm](so-sanh-may.webp)
- [Đường lên hải đăng trước và sau](so-sanh-dao-may.webp)
- [Cầu mây trước](cau-may-truoc.webp) và [cầu mây sau](cau-may-sau.webp)
- [Cụm pha lê trong hang](hang-pha-le-sau.webp) và [đàn cá trong vịnh](dan-ca-sau.webp)
- [Bảng kiểm 51 mẫu sinh vật và 6 trùm](ra-soat-dong-vat.md)

## Kiểm tra khi chơi

Ở Vịnh San Hô, đã đặt Mây gần mép nước, dùng phím W để đi xuống nước rồi dùng S để quay lên bờ. Bình khí, chân vịt và kính hiện khi bơi rồi ẩn khi Mây lên cạn.

Kiểm tra ngoại tuyến đã thử ngắt tải giữa chừng, kết nối lại, tắt mạng, mở lại game và vào cả sáu chương. Bộ kiểm tra mô hình đã đọc đủ 45 tệp GLB. Có 38 tệp đạt và 7 tệp cảnh báo do gần trần dung lượng hoặc số tam giác. Không có tệp nào vượt ngưỡng kiểm tra.

## Phạm vi còn lại

Phần lớn đạo cụ tĩnh ở những chương khác vẫn dùng ánh sáng sẵn có của cảnh. Vòng rune còn lặp và HUD cố định vẫn dùng bố cục hiện tại. Kiểm tra bố cục dọc dùng cửa sổ trình duyệt mô phỏng. Hiệu năng GPU trên điện thoại thật, từng tuyến cầu và toàn bộ hoạt ảnh chiến đấu của sáu trùm còn cần được kiểm chứng.

Đợt rà tiếp theo có ảnh đối chiếu Mây, Milo, gấu, thỏ, bốn trùm và cả sáu vùng chơi. [Kết quả dựng lại và chơi thử](ra-soat-my-thuat.md).
