# Rà soát động vật và sinh vật trong game

Ngày 25/11/2026, đã chụp **51 mẫu sinh vật và 6 trùm**. Có 38 mẫu từ `makeAnimal`, 3 mẫu cá rạn, 7 quái và 3 sinh vật biển trang trí. Một số mẫu là biến thể cùng loài. Sáu ảnh trùm dùng mô hình thực tế sau khi vào từng màn. [Bảng mẫu 1](ra-soat-dong-vat-01.jpg) · [Bảng mẫu 2](ra-soat-dong-vat-02.jpg) · [Bảng mẫu 3](ra-soat-dong-vat-03.jpg) · [Sáu trùm](ra-soat-trum.jpg)

Để so dáng, các bảng dùng cùng ánh sáng và tư thế nghỉ. Khung ảnh bao quanh mô hình sau khi xương đã tạo dáng. Cá heo và cá đuối còn chiếm ít diện tích trong ô ảnh. Ảnh đối chiếu riêng của gấu và thỏ cho thấy cùng một vai trước và sau khi thay mẫu. [Gấu và thỏ trước và sau](so-sanh-gau-tho.webp)

## Theo khu vực

| Khu vực | Những gì thấy trong game |
| --- | --- |
| Đảo Mây | Thỏ trắng có chân sau gập và lòng tai hồng. Cừu có hình riêng. Khỉ và sóc đã có tay chân. Bảng cũng ghi nhận cua và Milo. |
| Vịnh San Hô | Sao biển tím hiện đúng hình sao. Bạch tuộc có tám tay. Cá voi, cá đuối, sứa, rùa, cua, cá heo, ngọc trai và cá rạn có trong bảng. Đàn 140 cá ở xa có thân, đuôi chẻ và vây lưng, dùng chung một InstancedMesh. Dáng trùm bạch tuộc còn đơn giản. [Đàn cá trong vịnh](dan-ca-sau.webp) |
| Rừng | Thỏ rừng có lông nâu. Hươu sao có hai hàng đốm kem trên sườn và có động tác đứng, đi, chạy. Gấu trúc có mảng đen ở mắt, vai và chân. Bảng có cả cáo, sóc, bướm và Milo. Cánh bướm nhìn rất mỏng ở góc chụp. |
| Sa mạc | Cáo fennec có tai rộng và lông màu cát. Lạc đà có mẫu riêng. Thằn lằn có ngón chân, chồn đất có dáng đứng và đại bàng có lông cánh. Bảng có cả rùa và bọ cạp ở hai vai quái và trùm. |
| Hang Pha Lê | Đom đóm có thân, cánh và bụng phát sáng. Dơi có màng cánh và tai riêng. Cú có mẫu riêng. Rùa, kỳ nhông và chuột chũi cũng có trong bảng. |
| Xứ Tuyết | Thỏ tuyết có tai dài chóp đen, gấu Bắc Cực đi bốn chân, cáo tuyết có lông trắng và trưởng làng chim cánh cụt có khăn đỏ. Tuần lộc và hải cẩu có trong bảng. Quái gấu tuyết có mô hình gấu và hoạt ảnh đuổi theo. |
| Vương quốc Mây | Cừu có mẫu riêng, Milo có cánh, phượng hoàng có lông cánh và đuôi tách biệt. Kỳ lân và chim có trong bảng. |

## Khi tệp mô hình tải lỗi

Mã dự phòng dùng cùng thân bầu dục và đuôi nón cho một số cá, gồm cả cá hề và cá heo. Rùa dự phòng chỉ có mai và đầu. Sứa dự phòng có phần thân tròn và sáu tua. Cá đuối trang trí phụ thuộc vào tệp mô hình. Nhiều vai rùa cạn dùng chung bộ xương của rùa cụ già. Phần dự phòng được rà bằng mã nguồn. Bộ ảnh ghi lại các mô hình đã tải và chưa bao phủ mọi trạng thái chiến đấu.

## Chơi thử trong cảnh

Ở Vương quốc Mây, đã dùng phím W để đi từ đảo giữa sang đảo phía tây trên cả hai bản. Cầu mới có mặt cong liên tục, thành dày, lan can và trụ. Tại một khung hình cuối tuyến với cùng thiết lập, số lệnh vẽ giảm từ 233 còn 226 và số geometry trong cảnh giảm từ 576 còn 459. Số đo chỉ áp dụng cho vị trí này. [Cầu trước khi sửa](cau-may-truoc.webp) · [Cầu sau khi sửa](cau-may-sau.webp)

Ở Hang Pha Lê, các cụm khoáng có chân đá, mặt cắt và bóng tiếp xúc. [Ảnh trong hang](hang-pha-le-sau.webp)
