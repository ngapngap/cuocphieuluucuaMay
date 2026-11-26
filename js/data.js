"use strict";
/* ============================================================================
   CUỘC PHIÊU LƯU CỦA MÂY v10.0 — Dữ liệu 6 Chương Cốt Truyện, NPC Giao Nhiệm Vụ,
   Mở Khóa 6 Kỹ Năng Thực Chiến, Trang Phục, Trang Bị, Câu Đố & Lưu Tiến Độ
   ============================================================================ */
window.MAY = window.MAY || {};

(function (MAY) {

  MAY.SAVE_KEY = "may-adv-v10";
  MAY.V8_KEY = "may-adv-v8";
  MAY.LEGACY_KEY = "may-fps-v1";

  MAY.IMG = {
    hero: "assets/img/hero.jpg",
    sand: "assets/img/tex-sand.jpg",
    rock: "assets/img/tex-rock.jpg",
    wood: "assets/img/tex-wood.jpg",
    caustics: "assets/img/tex-caustics.jpg",
    pano: "assets/img/tex-pano.jpg",
    fan: "assets/img/tex-fan.jpg",
    fanAlpha: "assets/img/tex-fanalpha.jpg"
  };

  MAY.OUTFITS = {
    vayhong:  { id: "vayhong",  name: "Váy hồng",        img: "assets/img/outfit-preview-vayhong.webp",  body: 0xff8fb8, accent: 0xffd93d, unlockedBy: null, desc: "Bộ váy hồng xinh xắn của Mây" },
    haibim:   { id: "haibim",   name: "Hai bím",         img: "assets/img/outfit-preview-haibim.webp",   body: 0xffd93d, accent: 0xff7fa5, unlockedBy: null, desc: "Tóc hai bím năng động đáng yêu" },
    muvang:   { id: "muvang",   name: "Mũ vàng",         img: "assets/img/outfit-preview-muvang.webp",   body: 0x7fe3ff, accent: 0xffd93d, unlockedBy: null, desc: "Chiếc mũ vàng rực rỡ ánh nắng" },
    rungxanh: { id: "rungxanh", name: "Khám phá Rừng",   img: "assets/img/outfit-preview-rungxanh.webp", body: 0x43b581, accent: 0xffe066, unlockedBy: 2,    desc: "Mở khóa khi cứu sống Rừng Nấm Xanh" },
    tuyetbong:{ id: "tuyetbong",name: "Áo Tuyết Bông",   img: "assets/img/outfit-preview-tuyetbong.webp",body: 0x8ad8ff, accent: 0xffffff, unlockedBy: 5,    desc: "Mở khóa khi giải cứu Thung Lũng Tuyết" },
    cauvong:  { id: "cauvong",  name: "Công chúa Mây",   img: "assets/img/outfit-preview-cauvong.webp",  body: 0xd980fa, accent: 0xffd93d, unlockedBy: 6,    desc: "Mở khóa khi đánh bại Vua Mây Bão" }
  };

  MAY.GEARS = {
    1: { id: "fins",   icon: "🤿", name: "Chân Vịt & Kính Lặn",  desc: "Giúp Mây bơi nhanh tự do dưới biển sâu" },
    2: { id: "boots",  icon: "🥾", name: "Giày Nhảy Lò Xo Lá",   desc: "Nhảy cao hơn trên cạn và nảy êm trên nấm" },
    3: { id: "scarf",  icon: "🧣", name: "Khăn Choàng Gió Cát",  desc: "Chạy nhanh hơn trên cát và cồn sa mạc" },
    4: { id: "lamp",   icon: "🔦", name: "Đèn Pha Pha Lê",       desc: "Soi sáng hang tối và làm lộ bảo vật ẩn từ xa" },
    5: { id: "skis",   icon: "🎿", name: "Ván Trượt Tuyết Sao",  desc: "Trượt băng tuyết siêu mượt và tốc độ" },
    6: { id: "wings",  icon: "🪽", name: "Đôi Cánh Mây Cầu Vồng",desc: "Giữ Space trên không để lướt bay nhẹ nhàng!" }
  };

  MAY.SPELLS = [
    { key: "1", id: "wave",    chapter: 1, icon: "🌊", name: "Sóng Xung Kích",   color: 0x38bdf8, accent: 0x99f6e4, desc: "Đẩy bay đá mực, rửa sạch bùn đen, quét mây mực & hất ngược cầu nổ!" },
    { key: "2", id: "growth",  chapter: 2, icon: "🌿", name: "Nở Hoa Hồi Sinh",  color: 0x4ade80, accent: 0xfde047, desc: "Hồi sinh cây chết khô thành cầu/nấm nhảy & mọc dây leo trói quái vật!" },
    { key: "3", id: "solar",   chapter: 3, icon: "☀️", name: "Tia Nắng Rực Rỡ",  color: 0xff9f1c, accent: 0xfff3b0, desc: "Kích hoạt Đài Gương laser, đốt gai tối, làm tan băng & phá giáp cát!" },
    { key: "4", id: "crystal", chapter: 4, icon: "💎", name: "Cộng Hưởng Pha Lê",color: 0xc084fc, accent: 0x67e8f9, desc: "Đập vỡ tường pha lê nứt, chơi đàn nhạc mở cầu & phá giáp đá Golem!" },
    { key: "5", id: "frost",   chapter: 5, icon: "❄️", name: "Sương Băng Đóng Kết",color: 0x7dd3fc, accent: 0xe0f2fe, desc: "Đóng băng suối tạo Cầu Băng thật, đóng cứng cầu tuyết & dựng cột bẫy Sói!" },
    { key: "6", id: "tornado", chapter: 6, icon: "🌈", name: "Lốc Cầu Vồng",     color: 0xf472b6, accent: 0xfef08a, desc: "Hút xoáy & hất văng quái vật bay thẳng lên trời, tạo cột khí nâng bay cao!" }
  ];

  /* ---- Kịch bản Hội Thoại & Kể Chuyện Chi Tiết của 7 NPC Giao Nhiệm Vụ (Chống lặp lại!) ---- */
  MAY.STORY_SCRIPTS = {
    hub: {
      npcName: "Cụ Rùa Già Gác Đèn",
      npcRole: "Người Giữ Ngọn Hải Đăng Đảo Mây",
      npcIcon: "🐢",
      npcColor: "#38bdf8",
      intro: [
        "Mây ơi, nguy to rồi! Đêm qua, Vua Mây Bão — Bóng Xám đã tấn công Đảo Mây, cướp đi 6 Viên Ngọc Cầu Vồng và bắt Bé Gió Lốc Tí Hon lên đỉnh trời!",
        "Đêm qua Bé Gió còn hỏi cụ có thể nhìn thấy hải đăng từ bên kia biển không. Con đã hứa sẽ giữ cho bạn một đốm sáng để tìm đường về, phải không Mây?",
        "May sao Cây Gậy Phép Cầu Vồng vẫn còn đây, nhưng nó đang trống rỗng phép thuật. Mây hãy cầm Gậy Phép, bắt đầu từ Vịnh San Hô Xanh để đánh thức từng Kỹ Năng Nguyên Tố và cứu các vùng đất nhé!"
      ],
      introBtn: "✨ Mây nhận Gậy Phép lên đường!",
      inProgress: [
        "Có những hôm sương dày đến nỗi cụ phải áp tai lên cửa sổ mới nghe được tiếng chuông từ bờ bên kia. Nếu bạn gọi, con nhớ dừng lại nghe nhé.",
        "Mây có thể bước vào Cổng Ánh Sáng quanh đảo hoặc bấm phím M (Bản Đồ) để chọn vùng đất tiếp theo. Đừng quên khi học được Phép Nở Hoa ở Chương 2, hãy quay lại hồi sinh Cây Anh Đào khô cạnh nhà gỗ nhé!"
      ],
      treeQuestIntro: [
        "Ôi Mây học được Phép 🌿 Nở Hoa Hồi Sinh rồi kìa! Con có thấy Cây Anh Đào kỷ niệm cạnh căn nhà gỗ không? Màn Sương Xám đã làm nó khô héo mất rồi...",
        "Mây hãy dùng Phép 🌿 Nở Hoa (phím 2 + R) hồi sinh Cây Anh Đào giúp cụ nhé, cụ có giấu một phần thưởng bí mật dưới gốc cây đó!"
      ],
      treeQuestDone: [
        "Kỳ diệu quá! Hoa anh đào lại nở hồng rực khắp Đảo Mây rồi! Cảm ơn tấm lòng dũng cảm của bé Mây nhiều lắm!"
      ],
      complete: [
        "Cả 6 Viên Ngọc Cầu Vồng đã rực sáng trên Ngọn Hải Đăng! Bé Gió Lốc Tí Hon cũng đã an toàn trở về nhà rồi!",
        "Cảm ơn bé Mây — Người Hùng Cầu Vồng của Đảo Mây! Giờ Mây có thể tự do bay lượn với Đôi Cánh Mây và 6 Phép Thuật khắp thế giới!"
      ]
    },
    level1: {
      npcName: "Cụ Rùa San Hô Cổ",
      npcRole: "Trưởng Lão Vịnh San Hô Xanh",
      npcIcon: "🐢",
      npcColor: "#38bdf8",
      intro: [
        "Mây ơi, bạch tuộc đang phun mực từ con tàu đắm. Vịnh San Hô cần Mây giúp!",
        "Bubi bị kẹt dưới lưới đá. Ba đám mực đang che chuông tàu.",
        "Chọn phép Sóng, bơi đến lưới đá rồi tung phép để cứu Bubi. Dùng Sóng thổi tan ba đám mực quanh tàu đắm."
      ],
      introBtn: "🌊 Nhận Phép Sóng Xung Kích & Giải cứu!",
      inProgress: [
        "Chọn phép Sóng, bơi đến lưới đá rồi tung phép để cứu Bubi. Dùng Sóng thổi tan ba đám mực quanh tàu đắm.",
        "Nếu sứa đến gần, dùng phép Sóng đẩy sứa ra xa."
      ],
      bossIntro: [
        "Chuông tàu đã vang. Bạch tuộc đang chặn cổng đá!",
        "Chờ bạch tuộc nhả ngọc trai đen. Dùng Sóng đẩy ngọc trở lại ba lần."
      ],
      reward: [
        "Hoan hô bé Mây! Lớp mực đen đã tan sạch, Bạch Tuộc cũng tỉnh lại cười tươi rồi kìa! Cả Vịnh San Hô lại trong xanh lấp lánh ánh nắng!",
        "Cụ và Cá heo Bubi trân trọng trao tặng Mây 🔵 Viên Ngọc Xanh Dương! Phía trên bờ kia là Khu Rừng Nấm Xanh đang cầu cứu — Mây hãy mang sức mạnh Sóng Biển lên giúp Bà Sóc nhé!"
      ],
      rewardBtn: "🔵 Nhận Ngọc Xanh Dương!",
      complete: [
        "Đàn cá và rùa biển đều kể mãi về chiến công đẩy ngược ngọc trai mực của bé Mây đó! Chúc Mây thượng lộ bình an!"
      ]
    },
    level2: {
      npcName: "Bà Sóc Hạt Dẻ",
      npcRole: "Người Canh Giữ Cây Cổ Thụ Mẹ",
      npcIcon: "🐿️",
      npcColor: "#4ade80",
      intro: [
        "Hu hu... Mây ơi, may quá con tới rồi! Nhìn Cây Cổ Thụ Mẹ giữa rừng kìa... Từ khi Màn Sương Xám tràn qua, dòng suối đầu nguồn bị ụ bùn đen chặn cứng làm cạn sạch nước.",
        "Không có nước, 3 Cây Cổ Thụ Con quanh rừng và cả Cây Mẹ đều đã chết khô trơ trụi! Lũ chim non không còn cành lá để trú, còn Cún Milo leo lên đồi tìm nước thì bị Nấm Gai Xám bao vây mất rồi!",
        "Bà giữ Hạt Giống Nở Hoa cổ xưa, nhưng nó cần nước suối trong mới thức tỉnh được. Mây hãy dùng Phép 🌊 Sóng Xung Kích (Phím 1 + R) rửa trôi Ụ Bùn Đen ở đầu suối kia trước giúp bà nhé!"
      ],
      introBtn: "🌊 Mây đi rửa sạch suối ngay!",
      stage2GiveSkill: [
        "Tuyệt quá Mây ơi! Dòng suối trong vắt đã chảy về làm Hạt Giống Tổ bừng sáng rồi! Bà trao cho Mây Phép 🌿 Nở Hoa Hồi Sinh (Phím 2 + R)!",
        "Bây giờ Mây hãy tìm 3 Cây Cổ Thụ Chết Khô màu xám quanh rừng và tung 🌿 Nở Hoa để hồi sinh chúng! Mỗi cây sống lại sẽ mọc ra tán xanh rực rỡ và nấm lò xo giúp Mây vượt địa hình.",
        "Cẩn thận bầy Nấm Gai Xám hung dữ nhé — khi chúng lao tới, tung 🌿 Nở Hoa sẽ mọc dây leo trói chặt chúng biến gai nhọn thành hoa thơm đó!"
      ],
      stage2Btn: "🌿 Nhận Phép Nở Hoa & Hồi sinh rừng!",
      inProgress: [
        "Mây hãy nhìn cột sáng dẫn đường để tìm những Cây Cổ Thụ Chết Khô xám xịt nhé! Đứng gần rồi bấm phím 2 + R để hồi sinh cây!",
        "Nhớ trói bầy Nấm Gai Xám bằng 🌿 Nở Hoa nếu chúng đuổi theo con!"
      ],
      bossIntro: [
        "Cả 3 Cây Cổ Thụ Con đều nở hoa rồi! Nhưng Vua Nấm Khô Héo đang tức tối nhảy ra dưới gốc Cây Mẹ để ngăn chúng ta hồi sinh khu rừng!",
        "Mẹo đánh thắng nè Mây: lớp vỏ của Vua Nấm rất khô cứng! Trước tiên dùng 🌊 Sóng Xung Kích (Phím 1) làm ướt vỏ nó, rồi lập tức tung 🌿 Nở Hoa (Phím 2) để dây hoa quấn bung mũ nấm của nó (3 lần)!"
      ],
      reward: [
        "Ôi trời ơi nhìn kìa! Cây Cổ Thụ Mẹ đã hồi sinh rực rỡ, hoa lá phủ xanh cả bầu trời và Cún Milo cũng chạy về an toàn rồi!",
        "Bà Sóc và tất cả thú rừng gửi tặng Mây 🟢 Viên Ngọc Xanh Lá cùng đôi 🥾 Giày Nhảy Lò Xo Lá giúp con nhảy cao hơn! Phía sa mạc bên kia đang có bão cát, Mây hãy mang mầm xanh tới giúp Lạc Đà Kiki nhé!"
      ],
      rewardBtn: "🟢 Nhận Ngọc Xanh Lá & Giày Lò Xo!",
      complete: [
        "Khu rừng giờ rộn ràng tiếng chim hót và mùi hoa thơm nhờ có bé Mây hồi sinh cả 4 cây cổ thụ đó!"
      ]
    },
    level3: {
      npcName: "Lạc Đà Kiki",
      npcRole: "Người Giữ Ốc Đảo Ánh Nắng",
      npcIcon: "🐪",
      npcColor: "#facc15",
      intro: [
        "Chào Mây! Sa Mạc Kim Tự Tháp đang gặp hạn lớn! Bọ Cạp Sa Mạc Khổng Lồ bị Sương Xám nhập đã khóa chặt Kim Tự Tháp bằng 3 Phong Ấn Bóng Tối và làm khô héo Ốc Đảo.",
        "Ngày xưa tổ tiên đặt 3 Đài Gương Nắng quanh sa mạc để chiếu ánh sáng hội tụ lên đỉnh Kim Tự Tháp giữ cho cát vàng ấm áp và xua bão cát. Nhưng giờ Đĩa Mặt Trời bị vùi dưới hàng cây chà là khô mất rồi!",
        "Mây có Phép 🌿 Nở Hoa phải không? Hãy giúp Kiki hồi sinh Cây Chà Là Khô bên bờ Ốc Đảo để làm lộ Đĩa Mặt Trời Cổ nhé!"
      ],
      introBtn: "🌿 Mây sẽ hồi sinh Ốc Đảo ngay!",
      stage2GiveSkill: [
        "Ốc Đảo xanh mát trở lại và Đĩa Mặt Trời đã sáng rực rồi! Kiki trao cho Mây Phép ☀️ Tia Nắng Rực Rỡ (Phím 3 + R)!",
        "Tìm ba Đài Gương Cổ. Đến gần và bấm T, Enter hoặc chạm nút để xoay gương; nhìn tia vàng trên cát và hướng tới vòng ☀️, đừng nhầm vòng 🌙. Khi tia chạm đích, dùng ☀️ Tia Nắng (3 + R) để gửi ánh sáng lên Kim Tự Tháp!",
        "Coi chừng lũ Bọ Cạp Cát lẩn dưới cát nhé — tung ☀️ Tia Nắng sẽ làm chúng chói mắt bật tung khỏi cát!"
      ],
      stage2Btn: "☀️ Nhận Tia Nắng & Thắp 3 Đài Gương!",
      inProgress: [
        "Đến gần đài, bấm T, Enter hoặc chạm nút để xoay tia vàng tới vòng ☀️. Sau đó dùng Tia Nắng (3 + R); vòng 🌙 chỉ là hướng thử. Mây có thể xoay lại bất cứ lúc nào!"
      ],
      bossIntro: [
        "Cả 3 tia nắng đã hội tụ phá vỡ Phong Ấn Kim Tự Tháp! Cẩn thận — Bọ Cạp Sa Mạc Khổng Lồ vừa chui từ dưới cát lên ngay trước bậc thang!",
        "Lớp vỏ cát của nó cứng lắm! Hãy né vệt cát lao tới, rồi bắn ☀️ Tia Nắng Rực Rỡ (Phím 3 + R) nổ chói làm vỡ giáp cát khi nó trồi lên — 3 lần là Sương Xám sẽ tan biến!"
      ],
      reward: [
        "Bão cát xám tan biến sạch rồi! Cả Sa Mạc Kim Tự Tháp lại óng ánh sắc nắng vàng tuyệt đẹp!",
        "Kiki tặng Mây 🟡 Viên Ngọc Vàng Nắng và 🧣 Khăn Choàng Gió Cát chạy siêu nhanh! Lối xuống Hang Động Pha Lê dưới chân Kim Tự Tháp đang rất tối — hãy mang Tia Nắng xuống giúp Nhạc Sư Cú Mèo nhé!"
      ],
      rewardBtn: "🟡 Nhận Ngọc Vàng Nắng & Khăn Cát!",
      complete: [
        "3 tia nắng từ Đài Gương vẫn chiếu sáng rực rỡ trên Kim Tự Tháp nhờ tài giải đố của Mây đó!"
      ]
    },
    level4: {
      npcName: "Nhạc Sư Cú Mèo",
      npcRole: "Người Giữ Hộp Nhạc Hang Pha Lê",
      npcIcon: "🦉",
      npcColor: "#c084fc",
      intro: [
        "Chào Mây! Golem đã làm tắt đèn trong Hang Pha Lê. Mây giúp ta thắp sáng hang nhé!",
        "Hai ngọn đuốc ở đầu hang đã tắt. Hãy tìm cả hai.",
        "Chọn phép Tia Nắng rồi chiếu vào từng ngọn đuốc. Khi cả hai sáng, quay lại gặp cú mèo."
      ],
      introBtn: "☀️ Mây đi thắp đuốc hang ngay!",
      stage2GiveSkill: [
        "Đàn đá đã sáng. Mây nhận phép Cộng Hưởng Pha Lê.",
        "Dùng Cộng Hưởng phá vách nứt. Nghe và nhìn các trụ sáng lên, rồi gõ lại theo đúng thứ tự. Mây có thể nghe lại mẫu.",
        "Khi Golem nhỏ ném đá, dùng Cộng Hưởng phá đá."
      ],
      stage2Btn: "💎 Nhận Cộng Hưởng & Giải Đàn Nhạc!",
      inProgress: [
        "Dùng Cộng Hưởng phá vách nứt. Nghe và nhìn các trụ sáng lên, rồi gõ lại theo đúng thứ tự. Mây có thể nghe lại mẫu."
      ],
      bossIntro: [
        "Cầu ánh sáng đã mở. Golem đang đợi trên đảo giữa hồ.",
        "Gõ lại giai điệu để mở giáp. Khi lõi sáng, chọn Tia Nắng và chiếu vào lõi. Nếu giáp khép lại, dùng Cộng Hưởng mở giáp rồi chiếu tiếp."
      ],
      reward: [
        "Tuyệt diệu! Tiếng chuông pha lê lại ngân vang khắp hang động, mặt nước vũng đá phản chiếu ánh tím lung linh như bầu trời sao!",
        "Ta trao cho Mây 🟣 Viên Ngọc Tím Pha Lê và 🔦 Đèn Pha Pha Lê soi thấy mọi kho báu ẩn! Hãy đi tiếp lên Thung Lũng Tuyết Trắng — Trưởng làng Cánh Cụt Bông đang gặp bão tuyết!"
      ],
      rewardBtn: "🟣 Nhận Ngọc Tím & Đèn Pha Lê!",
      complete: [
        "Giai điệu Đô–Mi–Son của Mây vẫn đang vang vọng khắp vòm hang pha lê đó!"
      ]
    },
    level5: {
      npcName: "Trưởng Làng Cánh Cụt Bông",
      npcRole: "Trưởng Làng Igloo Xứ Tuyết",
      npcIcon: "🐧",
      npcColor: "#7dd3fc",
      intro: [
        "Lạch bạch... Mây ơi cứu làng tuyết với! Cơn bão Sương Xám làm sập mất cây cầu qua Dòng Suối Băng Chảy Xiết, còn tảng băng đen kia đang khóa chặt lối vào Động Suối Băng Cổ!",
        "Đoàn Tuần Lộc chở củi sưởi ấm bị mắc kẹt tít bên kia suối, còn Sói Tuyết Băng Giá thì đang gầm rú chiếm cả mặt hồ băng lớn!",
        "Mây hãy dùng 💎 Cộng Hưởng Pha Lê (Phím 4 + R) đập vỡ Tảng Băng Nứt chắn cửa Động Suối kia để lấy Tinh Chất Băng Cổ giúp làng nhé!"
      ],
      introBtn: "💎 Mây đi phá tảng băng ngay!",
      stage2GiveSkill: [
        "Cửa Động Suối mở rồi! Tinh Chất Băng đã nhập vào Gậy Phép — mở khóa Phép ❄️ Sương Băng Đóng Kết (Phím 5 + R)!",
        "Lần này Mây hãy hóa thành kỹ sư băng giá: dùng ❄️ Sương Băng bắn xuống 3 Khúc Suối Nước Lạnh để kết tinh thành 3 Nhịp Cầu Băng thật đi bộ qua được, và đóng băng Cối Đá / Quả Cầu Tuyết Lăn để cứu Tuần Lộc mang củi về làng!",
        "Gặp Gấu Tuyết Sương Xám húc tới, cứ tung ❄️ Sương Băng làm trơn trượt cho nó ngã lăn quay nhé!"
      ],
      stage2Btn: "❄️ Nhận Sương Băng & Xây Cầu Băng!",
      inProgress: [
        "Mây hãy đứng bên bờ 3 Khúc Suối Lạnh rồi tung ❄️ Sương Băng (Phím 5 + R) để tạo Cầu Băng cứng bước qua, sau đó đóng băng Cầu Tuyết Lăn chắn đường cứu Tuần Lộc nhé!"
      ],
      bossIntro: [
        "Làng Igloo sáng đèn ấm áp lại rồi! Nhưng Sói Tuyết Băng Giá đang chặn ngay giữa Hồ Băng và chuẩn bị lao vồ cực nhanh!",
        "Đặt bẫy thông minh nè Mây: khi Sói Tuyết hiện vạch đỏ chuẩn bị phóng tới, hãy tung ❄️ Sương Băng (Phím 5 + R) để dựng Cột Băng Cứng chặn mặt nó -> nó đâm sầm bị choáng, lập tức tung ☀️ Tia Nắng (Phím 3 + R) làm tan sương xám trên người nó (3 lần)!"
      ],
      reward: [
        "Cực quang bừng sáng cả bầu trời tuyết rồi! Sói Tuyết đã trở lại hiền lành vẫy đuôi cạnh đàn Tuần Lộc!",
        "Bông tặng Mây ⚪ Viên Ngọc Trắng Tuyết cùng đôi 🎿 Ván Trượt Tuyết Sao! Đủ 5 Viên Ngọc rồi — cánh cổng lên Vương Quốc Trên Mây đã mở, hãy đi giải cứu Bé Gió Lốc Tí Hon khỏi tay Vua Mây Bão nhé!"
      ],
      rewardBtn: "⚪ Nhận Ngọc Trắng & Ván Trượt Tuyết!",
      complete: [
        "Cả làng Igloo luôn giữ một tách cacao nóng chờ bé Mây ghé thăm mỗi khi trở lại xứ tuyết đó!"
      ]
    },
    level6: {
      npcName: "Sứ Giả Phượng Hoàng",
      npcRole: "Người Bảo Vệ Vương Quốc Trên Mây",
      npcIcon: "🦜",
      npcColor: "#f472b6",
      intro: [
        "Chào Mây — người hùng đã mang ánh sáng về cho 5 vùng đất! Chào mừng con đến trận chiến cuối cùng tại Vương Quốc Trên Mây!",
        "Vua Mây Bão (Bóng Xám) đang giam giữ Bé Gió Lốc Tí Hon trong lồng sét trên đỉnh Lâu Đài Cầu Vồng. Hắn đã xé đứt nhiều nhịp cầu vồng và thả bầy Lính Mây Sấm canh giữ 3 Ổ Khóa Sét!",
        "Ta đã chuẩn bị Đài Hợp Nhất ở Đảo Trung Tâm phía trước. Mây hãy bước qua cầu vồng đầu tiên tới Đài Hợp Nhất để hợp sức 5 Viên Ngọc thức tỉnh Kỹ Năng Tối Thượng thứ 6!"
      ],
      introBtn: "🪽 Bay tới Đài Hợp Nhất!",
      stage2GiveSkill: [
        "5 Viên Ngọc đã hòa làm một! Gậy Phép của Mây vừa thức tỉnh Phép Tối Thượng: 🌈 LỐC CẦU VỒNG (Phím 6 + R)!",
        "Sức mạnh của Lốc Cầu Vồng thật phi thường: bắn trúng Lính Mây Sấm sẽ cuốn xoay tít và HẤT VĂNG CHÚNG BAY THẲNG LÊN TRỜI nổ thành mưa sao! Và khi đứng vào tâm phễu lốc, cột khí nâng sẽ đẩy Mây bay vọt lên các đảo cao!",
        "Hãy dùng 🌈 Lốc Cầu Vồng hất bay bầy Lính Mây Sấm và phá hủy 3 Ổ Khóa Sét trên các đảo để mở cửa Lâu Đài Cầu Vồng!"
      ],
      stage2Btn: "🌈 Nhận Lốc Cầu Vồng & Tấn Công!",
      inProgress: [
        "Dùng 🌈 Lốc Cầu Vồng (Phím 6 + R) hất văng Lính Mây Sấm lên trời và phá đủ 3 Ổ Khóa Sét trên các đảo Tây, Đông và Trung Tâm để hạ tường sét Lâu Đài nhé!"
      ],
      bossIntro: [
        "3 Ổ Khóa Sét đã vỡ tan! VUA MÂY BÃO (BÓNG XÁM) đang lao xuống ngay trước Lâu Đài Cầu Vồng! Trận quyết chiến bắt đầu!",
        "Kết hợp tất cả những gì Mây đã học (3 pha): Pha 1 dùng 🌈 Lốc Cầu Vồng hất Lính Mây Sấm đâm vỡ Khiên Mây Đen; Pha 2 né sét & bắn ☀️ Tia Nắng xuyên tâm bão; Pha 3 dùng 🌿 Nở Hoa trói chặt rồi tung 🌈 Lốc Cầu Vồng HẤT TUNG BÓNG XÁM LÊN TRỜI!"
      ],
      reward: [
        "Bóng Xám đã tan thành cầu vồng bảy sắc! Bé Gió Lốc Tí Hon bay một vòng quanh lâu đài rồi sà vào ôm chầm lấy Mây.",
        "Bé Gió Lốc thì thầm: 'Cảm ơn Mây đã không bỏ rơi tớ! Tớ xin trao lại 🌈 Viên Ngọc Hồng Cầu Vồng cuối cùng và Đôi Cánh Mây Vĩnh Viễn!' Hãy trở về Đảo Mây dự Đại Tiệc Chiến Thắng thôi nào!"
      ],
      rewardBtn: "🌈 Nhận Ngọc Cuối & Mở Đại Tiệc!",
      complete: [
        "Vương Quốc Trên Mây giờ ngập tràn ánh nắng hồng tím và tiếng cười! Bé Gió Lốc luôn bay quanh bảo vệ bé Mây!"
      ]
    }
  };

  MAY.LEVEL_META = [
    {
      id: "hub", num: 0, icon: "🏝️", shortName: "Đảo Mây",
      title: "Đảo Mây — Ngọn Hải Đăng Cầu Vồng",
      theme: "#20a4d8", gemColor: 0xffd93d, gemIcon: "🌈", gemName: "Ngọn Hải Đăng Cầu Vồng",
      skillId: null,
      collectIcon: "🥥", collectName: "Quả dừa", collectTarget: 3,
      friendTarget: 4, treasureTarget: 0, souvenirIcon: "🐦", souvenirName: "Chim bay", souvenirTarget: 0,
      interactIcon: "🌺", interactName: "Hoa đảo", interactTarget: 0,
      hiddenName: "Ngọn Hải Đăng",
      companion: "🐶 Cún Milo",
      intro: "Đảo Mây đang tắt ánh sáng Ngọn Hải Đăng! Hãy lại trò chuyện với Cụ Rùa Già Gác Đèn (biểu tượng ! vàng) ngay trước mặt để nghe câu chuyện và nhận Gậy Phép nhé!"
    },
    {
      id: "level1", num: 1, icon: "🌊", shortName: "Vịnh San Hô",
      title: "Chương 1: Vịnh San Hô Xanh",
      theme: "#076b9e", gemColor: 0x38bdf8, gemIcon: "🔵", gemName: "Ngọc Xanh Dương",
      skillId: "wave",
      collectIcon: "⭐", collectName: "Sao biển", collectTarget: 10,
      friendTarget: 6, treasureTarget: 3,
      souvenirIcon: "🐚", souvenirName: "Vỏ sò", souvenirTarget: 3,
      interactIcon: "🪸", interactName: "San hô", interactTarget: 5,
      hiddenName: "Sao Vàng Ẩn",
      companion: "🐬 Cá heo Bubi",
      intro: "Vịnh San Hô đang bị mây mực đen bao phủ! Hãy gặp Cụ Rùa San Hô Cổ để nhận Phép Sóng Xung Kích và giải cứu Cá heo Bubi!"
    },
    {
      id: "level2", num: 2, icon: "🌲", shortName: "Rừng Nấm Xanh",
      title: "Chương 2: Khu Rừng Nấm Xanh",
      theme: "#2d8a56", gemColor: 0x4ade80, gemIcon: "🟢", gemName: "Ngọc Xanh Lá",
      skillId: "growth",
      collectIcon: "🍄", collectName: "Nấm sáng", collectTarget: 10,
      friendTarget: 5, treasureTarget: 3,
      souvenirIcon: "🌰", souvenirName: "Hạt dẻ", souvenirTarget: 5,
      interactIcon: "🌸", interactName: "Hoa nở", interactTarget: 5,
      hiddenName: "Lá Vàng Cổ Tích",
      companion: "🐶 Cún Milo",
      intro: "Cây Cổ Thụ Mẹ trong Khu Rừng Nấm Xanh đang chết khô! Hãy gặp Bà Sóc Hạt Dẻ đầu rừng để nghe chuyện và tìm cách hồi sinh khu rừng!"
    },
    {
      id: "level3", num: 3, icon: "🏜️", shortName: "Sa Mạc",
      title: "Chương 3: Sa Mạc Kim Tự Tháp",
      theme: "#c8862b", gemColor: 0xfacc15, gemIcon: "🟡", gemName: "Ngọc Vàng Nắng",
      skillId: "solar",
      collectIcon: "☀️", collectName: "Đá mặt trời", collectTarget: 10,
      friendTarget: 5, treasureTarget: 3,
      souvenirIcon: "🏺", souvenirName: "Bình cổ", souvenirTarget: 4,
      interactIcon: "🌵", interactName: "Hoa xương rồng", interactTarget: 5,
      hiddenName: "Bọ Hung Vàng",
      companion: "🐪 Lạc đà Kiki",
      intro: "Bão cát Sương Xám đã khóa chặt Kim Tự Tháp! Hãy gặp Lạc Đà Kiki bên bờ Ốc Đảo để đánh thức Tia Nắng và giải mã 3 Đài Gương!"
    },
    {
      id: "level4", num: 4, icon: "💎", shortName: "Hang Pha Lê",
      title: "Chương 4: Hang Động Pha Lê",
      theme: "#5b3a9e", gemColor: 0xc084fc, gemIcon: "🟣", gemName: "Ngọc Tím Pha Lê",
      skillId: "crystal",
      collectIcon: "💎", collectName: "Tinh thể", collectTarget: 10,
      friendTarget: 5, treasureTarget: 3,
      souvenirIcon: "🍄", souvenirName: "Nấm đèn", souvenirTarget: 4,
      interactIcon: "🎵", interactName: "Pha lê nhạc", interactTarget: 5,
      hiddenName: "Ngọc Trai Ánh Trăng",
      companion: "🦇 Dơi nhỏ Bibi",
      intro: "Hang Động Pha Lê đang chìm trong bóng tối im lặng! Hãy gặp Nhạc Sư Cú Mèo đầu hang để khôi phục bản giao hưởng Đô–Mi–Son!"
    },
    {
      id: "level5", num: 5, icon: "❄️", shortName: "Thung Lũng Tuyết",
      title: "Chương 5: Thung Lũng Tuyết Trắng",
      theme: "#3d90c8", gemColor: 0xe0f2fe, gemIcon: "⚪", gemName: "Ngọc Trắng Tuyết",
      skillId: "frost",
      collectIcon: "❄️", collectName: "Bông tuyết", collectTarget: 10,
      friendTarget: 5, treasureTarget: 3,
      souvenirIcon: "🌲", souvenirName: "Quả thông", souvenirTarget: 5,
      interactIcon: "⛄", interactName: "Người tuyết bé", interactTarget: 5,
      hiddenName: "Quả Cầu Tuyết",
      companion: "🐧 Cánh cụt Bông",
      intro: "Cây cầu sang Làng Tuyết đã sập trong bão! Hãy gặp Trưởng Làng Cánh Cụt Bông để lấy Phép Sương Băng xây cầu và đặt bẫy Sói Tuyết!"
    },
    {
      id: "level6", num: 6, icon: "☁️", shortName: "Vương Quốc Mây",
      title: "Chương 6: Vương Quốc Trên Mây",
      theme: "#c46bb8", gemColor: 0xf472b6, gemIcon: "🌈", gemName: "Ngọc Hồng Cầu Vồng",
      skillId: "tornado",
      collectIcon: "🪶", collectName: "Lông vũ", collectTarget: 10,
      friendTarget: 5, treasureTarget: 3,
      souvenirIcon: "✨", souvenirName: "Hũ bụi sao", souvenirTarget: 5,
      interactIcon: "🎈", interactName: "Bóng mây", interactTarget: 5,
      hiddenName: "Vương Miện Mây Vàng",
      companion: "🐶✨ Milo Có Cánh",
      intro: "Trận chiến cuối cùng đã đến! Gặp Sứ Giả Phượng Hoàng trên đảo đầu tiên để thức tỉnh Lốc Cầu Vồng hất tung quái mây lên trời và cứu Bé Gió Lốc!"
    }
  ];

  MAY.getMeta = function (id) {
    for (var i = 0; i < MAY.LEVEL_META.length; i++) {
      if (MAY.LEVEL_META[i].id === id) return MAY.LEVEL_META[i];
    }
    return MAY.LEVEL_META[0];
  };

  /* ---- 7 NHIỆM VỤ PHỤ TƯƠNG TÁC THỰC SỰ (Mỗi vùng đất 1 tuyến nhiệm vụ NPC -> Hành động -> Trả nhiệm vụ!) ---- */
  MAY.SIDE_QUESTS = {
    hub: {
      id: "sq_hub", title: "Ngọn Đèn Bến Cảng & Chai Thư Biển", icon: "🏮",
      npcName: "Khỉ Nâu Bến Thuyền", npcRole: "Người Giữ Bến Cảng Đảo Mây", npcIcon: "🐒", npcKind: "monkey",
      acceptPages: [
        "Mây ơi! Đêm bão hôm qua làm tắt 2 Ngọn Đèn Hải Âu ngoài bến tàu và có một Chai Thư Phát Sáng trôi dạt vào gần mũi thuyền kìa!",
        "Mây giúp tớ nhặt Chai Thư rồi thắp sáng 2 Trụ Đèn Bến Cảng để đàn chim hải âu tìm được đường về đảo nhé!"
      ],
      remindPages: [
        "Hãy ra mũi thuyền gỗ nhặt Chai Thư Biển và chạm vào 2 Trụ Đèn Bến Cảng đang tắt ngoài cầu gỗ nhé Mây!"
      ],
      donePages: [
        "Tuyệt vời quá! Đèn bến cảng sáng ấm áp trở lại và bức thư trong chai viết lời cảm ơn của những người bạn phương xa gửi tới bé Mây đó!",
        "Tớ tặng Mây Huy Hiệu Người Giữ Bến Cảng và hồi đầy 3 Trái Tim Ánh Sáng nhé!"
      ],
      rewardMsg: "🏅 Hoàn thành Nhiệm vụ phụ Đảo Mây: Đèn Bến Cảng & Chai Thư Biển!"
    },
    level1: {
      id: "sq_l1", title: "Bản Hợp Xướng Ốc Biển Hát", icon: "🐚",
      npcName: "Bạch Tuộc Nhạc Sĩ", npcRole: "Nhạc Trưởng Vịnh San Hô", npcIcon: "🐙", npcKind: "octopus",
      acceptPages: [
        "Chào bé Mây! Cơn bão mực làm 3 Chiếc Ốc Biển Hát của dàn nhạc san hô bị mắc kẹt ở 3 góc vịnh: mạn Tàu Đắm, Vườn San Hô và Thềm Đá Đông.",
        "Mây hãy bơi tới đánh thức cả 3 Chiếc Ốc Biển Hát (chạm tương tác hoặc tung phép 🌊) rồi quay lại đây nghe hòa nhạc nhé!"
      ],
      remindPages: [
        "Còn Ốc Biển Hát đang chờ Mây đánh thức ở quanh vịnh (nhìn cột sáng màu ngọc lam nhé)!"
      ],
      donePages: [
        "Nghe kìa! Tiếng 3 Chiếc Ốc Biển hòa âm vang vọng khắp Vịnh San Hô rồi! Đàn cá vui sướng nhảy múa quanh Mây kìa!",
        "Cảm ơn Mây nhiều lắm! Tặng Mây Huy Hiệu Nhạc Sĩ Đại Dương!"
      ],
      rewardMsg: "🏅 Hoàn thành Nhiệm vụ phụ Vịnh San Hô: Bản Hợp Xướng Ốc Biển!"
    },
    level2: {
      id: "sq_l2", title: "Bữa Tiệc Đèn Lồng Rừng Nấm", icon: "🧺",
      npcName: "Thỏ Rừng Bông", npcRole: "Đầu Bếp Tiệc Rừng Xanh", npcIcon: "🐇", npcKind: "forestrabbit",
      acceptPages: [
        "Mây ơi giúp tớ với! Tớ chuẩn bị bữa tiệc hạt dẻ cho cả khu rừng, nhưng Giỏ Hạt Dẻ Vàng bị gió thổi kẹt bên kia suối và 2 Đèn Nấm Tiệc bị tắt mất rồi!",
        "Mây lấy giùm tớ Giỏ Hạt Dẻ và thắp sáng 2 Đèn Nấm quanh cầu gỗ rồi mang về cho tớ nhé!"
      ],
      remindPages: [
        "Hãy tìm Giỏ Hạt Dẻ Vàng và thắp sáng 2 Đèn Nấm Tiệc ven suối rồi quay lại gặp Thỏ Rừng Bông nhé!"
      ],
      donePages: [
        "Hoan hô! Bữa tiệc hạt dẻ rừng xanh lung linh ánh đèn nấm rồi! Cả Hươu Sao và Gấu Trúc đều vỗ tay cảm ơn bé Mây đó!",
        "Tặng Mây Huy Hiệu Bạn Thân Rừng Nấm & hồi đầy Trái Tim!"
      ],
      rewardMsg: "🏅 Hoàn thành Nhiệm vụ phụ Rừng Nấm: Bữa Tiệc Đèn Lồng!"
    },
    level3: {
      id: "sq_l3", title: "Bí Ẩn Đồng Hồ Mặt Trời Cổ", icon: "🧭",
      npcName: "Cáo Tai To Kính Lúp", npcRole: "Nhà Khảo Cổ Sa Mạc", npcIcon: "🦊", npcKind: "fennec",
      acceptPages: [
        "Hí hí! Tớ tìm thấy Đồng Hồ Mặt Trời cổ đại trong Khu Tàn Tích Tây Sa Mạc, nhưng Kim Vàng bị rơi bên bờ Ốc Đảo và 2 Cột Đo Bóng bị cát vùi!",
        "Mây hãy nhặt Kim Đồng Hồ Vàng bên Ốc Đảo, phủi cát 2 Cột Đo Bóng rồi gắn lên bệ ở Tàn Tích giúp tớ nhé!"
      ],
      remindPages: [
        "Nhớ tìm Kim Vàng ven Ốc Đảo và kích hoạt 2 Cột Đo Bóng ở Khu Tàn Tích phía Tây rồi báo tin cho tớ nhé!"
      ],
      donePages: [
        "Ôi tuyệt đỉnh khảo cổ học! Đồng Hồ Mặt Trời quay đúng hướng nắng vàng và mở ra bản đồ sao cổ đại rồi!",
        "Tặng Mây Huy Hiệu Nhà Khảo Cổ Sa Mạc!"
      ],
      rewardMsg: "🏅 Hoàn thành Nhiệm vụ phụ Sa Mạc: Đồng Hồ Mặt Trời Cổ!"
    },
    level4: {
      id: "sq_l4", title: "Mạng Lưới Đèn Pha Lê Thợ Mỏ", icon: "🔦",
      npcName: "Chuột Chũi Kỹ Sư", npcRole: "Thợ Mỏ Ánh Sáng Hang Pha Lê", npcIcon: "🦡", npcKind: "mole",
      acceptPages: [
        "Cẩn thận trơn nhé Mây! Khi Golem rung chuyển hang động, 3 Trạm Tiếp Sáng Pha Lê dẫn đường cho các bạn thú nhỏ trong hang bị tắt ngấm!",
        "Mây hãy tới kích hoạt lại cả 3 Trạm Tiếp Sáng (ở Hốc Tây, Bờ Bắc và Cột Đông) bằng tương tác hoặc phép thuật nhé!"
      ],
      remindPages: [
        "Vẫn còn Trạm Tiếp Sáng Pha Lê chưa sáng trong hang! Mây tìm theo dấu vòng sáng ngọc lam nhé!"
      ],
      donePages: [
        "Sáng rực cả hang động rồi! Giờ Kỳ Nhông và Dơi Nhỏ đi đâu cũng thấy đường lung linh lấp lánh!",
        "Tặng Mây Huy Hiệu Kỹ Sư Ánh Sáng Hang Pha Lê!"
      ],
      rewardMsg: "🏅 Hoàn thành Nhiệm vụ phụ Hang Pha Lê: Mạng Lưới Đèn Pha Lê!"
    },
    level5: {
      id: "sq_l5", title: "Chuyến Củi Ấm Cho Làng Igloo", icon: "🔥",
      npcName: "Tuần Lộc Mũi Đỏ", npcRole: "Đội Trưởng Vận Chuyển Xứ Tuyết", npcIcon: "🦌", npcKind: "reindeer",
      acceptPages: [
        "Bão tuyết mạnh quá làm tớ đánh rơi 3 Bó Củi Thông Thơm dọc thung lũng, làm Lò Sưởi Làng Igloo sắp tắt mất rồi!",
        "Mây giúp tớ gom lại 3 Bó Củi Thông và thắp ấm Lò Sưởi giữa làng Igloo nhé!"
      ],
      remindPages: [
        "Mây hãy gom đủ 3 Bó Củi Thông Thơm rải quanh thung lũng rồi mang về thắp Lò Sưởi Làng Igloo nhé!"
      ],
      donePages: [
        "Ấm áp quá trời luôn! Ngọn lửa làng Igloo bập bùng sưởi ấm cả Cánh Cụt Bông lẫn Gấu Bắc Cực Nhí rồi!",
        "Tặng Mây Huy Hiệu Ngọn Lửa Ấm Xứ Tuyết!"
      ],
      rewardMsg: "🏅 Hoàn thành Nhiệm vụ phụ Xứ Tuyết: Ngọn Lửa Ấm Làng Igloo!"
    },
    level6: {
      id: "sq_l6", title: "Khúc Nhạc Chuông Gió Trên Mây", icon: "🎐",
      npcName: "Kỳ Lân Mây Nhí", npcRole: "Người Canh Chuông Gió Vương Quốc", npcIcon: "🦄", npcKind: "unicorn",
      acceptPages: [
        "Chào người hùng Mây! Bão sét của Vua Mây Bão làm 3 Chiếc Chuông Gió Cầu Vồng ở Đảo Tây, Cối Xay Gió Đông và Đảo Đông Bắc bị lệch nhịp!",
        "Mây hãy bay lướt qua 3 hòn đảo để lên dây lại cả 3 Chiếc Chuông Gió Cầu Vồng cho Vương Quốc Mây ngân vang nhé!"
      ],
      remindPages: [
        "Hãy ghé Đảo Tây, Cối Xay Gió Đảo Đông và Đảo Đông Bắc để chạm lên dây 3 Chiếc Chuông Gió Cầu Vồng nhé!"
      ],
      donePages: [
        "Đẹp như giấc mơ! Tiếng Chuông Gió Cầu Vồng ngân vang hòa cùng cánh Cối Xay Gió làm cả bầu trời bừng sáng!",
        "Tặng Mây Huy Hiệu Nhạc Trưởng Trên Mây!"
      ],
      rewardMsg: "🏅 Hoàn thành Nhiệm vụ phụ Vương Quốc Mây: Khúc Nhạc Chuông Gió!"
    }
  };

  function readRaceRecord(raw) {
    if (!raw || !Number.isFinite(raw.best) || raw.best <= 0 ||
        !Array.isArray(raw.path) || raw.path.length < 2 || raw.path.length > 400 ||
        !Array.isArray(raw.splits) || !raw.splits.every(Number.isFinite)) return null;
    for (var i = 0; i < raw.path.length; i++) {
      var point = raw.path[i];
      if (!Array.isArray(point) || point.length !== 4 || !point.every(Number.isFinite) ||
          (i === 0 ? point[0] !== 0 : point[0] <= raw.path[i - 1][0])) return null;
    }
    return { best: raw.best, wins: Number.isSafeInteger(raw.wins) && raw.wins > 0 ? raw.wins : 1, splits: raw.splits, path: raw.path };
  }

  MAY.badgeCount = function (level) {
    return ["rings", "race", "quiz"].filter(function (key) { return !!level.challenges[key]; }).length;
  };

  function freshLevelSave() {
    return {
      items: [],
      friends: [],
      treasures: [],
      souvenirs: [],
      interacts: [],
      hidden: false,
      challenges: {},
      raceRecord: null,
      quizDone: 0,
      quizLearning: { firstRight: 0, afterHint: 0, recent: [], pending: null },
      gem: false,
      bestTime: 0,
      playSecs: 0,
      introSeen: false,
      sideQuest: { stage: 0, doneIds: [], done: false },
      story: { stage: 0, steps: {}, bossDown: false, rewarded: false }
    };
  }

  function createDefaultSave() {
    var lvls = {};
    MAY.LEVEL_META.forEach(function (m) { lvls[m.id] = freshLevelSave(); });
    return {
      version: 10,
      progressionVersion: 1,
      legacyAccess: [],
      outfit: "vayhong",
      currentLevel: "hub",
      storySeen: false,
      finaleSeen: false,
      festivalConcerts: 0,
      freeSpells: false,
      freeExplore: false,
      quality: "mid",
      voiceOn: true,
      camDist: 4.8,
      unlockedSpells: [],
      gems: [],
      gears: [1],
      levels: lvls
    };
  }

  var backupKey = MAY.SAVE_KEY + "-backup";
  var lastPrimary = null, lastGood = null;
  MAY.saveStatus = "";
  function saveStatus(value) {
    if (value === MAY.saveStatus) return;
    MAY.saveStatus = value;
    if (MAY.onSaveStatus) MAY.onSaveStatus(value);
  }

  function parseSave(text, allowPartial) {
    try {
      var raw = JSON.parse(text);
      if (!raw || raw.version !== 10) return null;
      var table = raw.levels;
      var isRecord = function (value) { return value && typeof value === "object" && !Array.isArray(value); };
      if (table !== undefined && !isRecord(table)) return null;
      if ((!table || !Object.keys(table).length) && !Array.isArray(raw.gems) &&
          !(allowPartial && Object.keys(raw).some(function (key) { return key !== "version"; }))) return null;
      if (raw.gems !== undefined && !Array.isArray(raw.gems)) return null;
      if (table && MAY.LEVEL_META.some(function (level) {
        var entry = table[level.id];
        if (entry === undefined) return false;
        return !isRecord(entry) || (entry.story !== undefined && (!isRecord(entry.story) ||
          (entry.story.steps !== undefined && !isRecord(entry.story.steps))));
      })) return null;
      return raw;
    } catch (error) { return null; }
  }

  function writeSave(save, reset) {
    try {
      var text = JSON.stringify(save);
      var current = localStorage.getItem(MAY.SAVE_KEY);
      // A tab left on the title screen must not overwrite another tab's adventure.
      if (current !== lastPrimary && current !== text) {
        saveStatus("changed");
        return false;
      }
      if (reset || current !== text) {
        localStorage.setItem(MAY.SAVE_KEY, text);
        lastPrimary = text;
        var backup = reset ? text : lastGood || text;
        lastGood = text;
        try { localStorage.setItem(backupKey, backup); } catch (error) {
          // On reset even an old backup must no longer restore the previous adventure.
          if (reset) localStorage.removeItem(backupKey);
        }
      } else {
        lastPrimary = lastGood = text;
      }
      if (reset || (MAY.saveStatus !== "recovered" && MAY.saveStatus !== "damaged")) saveStatus("");
      return true;
    } catch (error) {
      saveStatus("unavailable");
      return false;
    }
  }

  MAY.loadSave = function () {
    var s = createDefaultSave();
    try {
      lastPrimary = localStorage.getItem(MAY.SAVE_KEY);
      lastGood = lastPrimary;
      var raw = parseSave(lastPrimary);
      if (!raw) {
        lastGood = localStorage.getItem(backupKey);
        raw = parseSave(lastGood);
        if (raw) saveStatus("recovered");
        else if ((raw = parseSave(lastPrimary, true))) {
          // Keep settings from a sparse older save when there is no complete backup.
          lastGood = lastPrimary;
        } else {
          if (lastPrimary || lastGood) saveStatus("damaged");
          lastGood = null;
        }
      } else if (!localStorage.getItem(backupKey)) {
        // On the first visit after updating, an existing adventure also gets a backup.
        try { localStorage.setItem(backupKey, lastPrimary); } catch (error) { /* Primary is still valid. */ }
      }
      if (raw) {
        s.outfit = MAY.OUTFITS[raw.outfit] ? raw.outfit : "vayhong";
        s.currentLevel = MAY.getMeta(raw.currentLevel).id;
        s.storySeen = !!raw.storySeen;
        s.finaleSeen = !!raw.finaleSeen;
        s.festivalConcerts = Number.isSafeInteger(raw.festivalConcerts) && raw.festivalConcerts > 0 ? raw.festivalConcerts : 0;
        s.freeSpells = !!raw.freeSpells;
        s.freeExplore = !!raw.freeExplore;
        s.quality = (raw.quality === "low" || raw.quality === "mid" || raw.quality === "high") ? raw.quality : "mid";
        s.voiceOn = raw.voiceOn !== undefined ? !!raw.voiceOn : true;
        s.camDist = (typeof raw.camDist === "number" && raw.camDist >= 3.0 && raw.camDist <= 10.5) ? raw.camDist : 4.8;
        s.unlockedSpells = Array.isArray(raw.unlockedSpells) ? raw.unlockedSpells : [];
        s.gems = Array.isArray(raw.gems) ? raw.gems : [];
        s.gears = Array.isArray(raw.gears) ? raw.gears : [1];
        s.legacyAccess = Array.isArray(raw.legacyAccess) ? raw.legacyAccess : [];
        if (s.gears.indexOf(1) === -1) s.gears.push(1);
        var progressionChanged = false;
        MAY.LEVEL_META.forEach(function (m) {
          var src = (raw.levels && raw.levels[m.id]) || {};
          var dst = freshLevelSave();
          dst.items = Array.isArray(src.items) ? src.items : [];
          dst.friends = Array.isArray(src.friends) ? src.friends : [];
          dst.treasures = Array.isArray(src.treasures) ? src.treasures : [];
          dst.souvenirs = Array.isArray(src.souvenirs) ? src.souvenirs : [];
          dst.interacts = Array.isArray(src.interacts) ? src.interacts : [];
          dst.hidden = !!src.hidden;
          dst.challenges = src.challenges && typeof src.challenges === "object" && !Array.isArray(src.challenges) ? src.challenges : {};
          dst.raceRecord = readRaceRecord(src.raceRecord);
          dst.quizDone = src.quizDone || 0;
          var learning = src.quizLearning || {};
          dst.quizLearning = {
            firstRight: Number(learning.firstRight) || 0,
            afterHint: Number(learning.afterHint) || 0,
            recent: Array.isArray(learning.recent) ? learning.recent.slice(-3) : [],
            pending: learning.pending && typeof learning.pending === "object" ? learning.pending : null
          };
          dst.gem = !!src.gem;
          dst.bestTime = src.bestTime || 0;
          dst.playSecs = src.playSecs || 0;
          dst.introSeen = !!src.introSeen;
          dst.sideQuest = src.sideQuest && typeof src.sideQuest === "object"
            ? { stage: src.sideQuest.stage || 0, doneIds: Array.isArray(src.sideQuest.doneIds) ? src.sideQuest.doneIds : [], done: !!src.sideQuest.done }
            : { stage: 0, doneIds: [], done: false };
          dst.story = src.story && typeof src.story === "object"
            ? { stage: src.story.stage || 0, steps: src.story.steps || {}, bossDown: !!src.story.bossDown, rewarded: !!src.story.rewarded }
            : { stage: 0, steps: {}, bossDown: false, rewarded: false };
          s.levels[m.id] = dst;
          // Existing collectors may already have passed the new reward threshold.
          if (m.num > 1 && dst.items.length >= 5 && s.gears.indexOf(m.num) === -1) {
            s.gears.push(m.num);
            progressionChanged = true;
          }
        });
        // Preserve both representations of previously awarded gems. The marker
        // makes the one-time reconciliation explicit without inventing boss wins.
        if (!raw.progressionVersion) {
          MAY.LEVEL_META.forEach(function (m) {
            if (m.num <= 0) return;
            var level = s.levels[m.id];
            if (level.gem && s.gems.indexOf(m.num) === -1) s.gems.push(m.num);
            if (s.gems.indexOf(m.num) !== -1) level.gem = true;
            if (level.story.bossDown && m.num < 6 && s.legacyAccess.indexOf(m.num + 1) === -1) s.legacyAccess.push(m.num + 1);
          });
        }
        if (!raw.progressionVersion || progressionChanged || MAY.saveStatus === "recovered") writeSave(s);
      } else {
        /* Bảo toàn trang phục nếu người chơi nâng cấp từ v8/v9 lên v10 */
        var old8 = JSON.parse(localStorage.getItem(MAY.V8_KEY) || "null");
        if (old8 && MAY.OUTFITS[old8.outfit] && !MAY.OUTFITS[old8.outfit].unlockedBy) {
          s.outfit = old8.outfit;
        }
      }
    } catch (e) { saveStatus("unavailable"); }
    return s;
  };

  MAY.save = MAY.loadSave();

  MAY.persist = function () {
    return writeSave(MAY.save);
  };

  MAY.resetSave = function () {
    var fresh = createDefaultSave();
    var outfit = MAY.OUTFITS[MAY.save.outfit];
    if (outfit && !outfit.unlockedBy) fresh.outfit = MAY.save.outfit;
    fresh.quality = MAY.save.quality;
    fresh.voiceOn = MAY.save.voiceOn;
    fresh.camDist = MAY.save.camDist;
    if (!writeSave(fresh, true)) return false;
    MAY.save = fresh;
    return true;
  };

  MAY.isLevelUnlocked = function (levelId) {
    if (!levelId || levelId === "hub" || levelId === "level1") return true;
    if (MAY.save.freeExplore || MAY.save.freeSpells) return true;
    var meta = MAY.getMeta(levelId);
    if (!meta || meta.num <= 1) return true;
    if (MAY.getLevelSave(levelId).gem) return true;
    var prevNum = meta.num - 1;
    return MAY.save.gems.indexOf(prevNum) !== -1 || (MAY.save.legacyAccess || []).indexOf(meta.num) !== -1;
  };

  MAY.isOutfitUnlocked = function (id) {
    var o = MAY.OUTFITS[id];
    if (!o) return false;
    if (!o.unlockedBy) return true;
    return MAY.save.gems.indexOf(o.unlockedBy) !== -1;
  };

  MAY.hasGear = function (num) {
    return MAY.save.gears.indexOf(num) !== -1 || MAY.save.gems.indexOf(num) !== -1;
  };

  MAY.isSpellUnlocked = function (spellId) {
    if (MAY.save.freeSpells) return true;
    var ctx = MAY.currentCtx;
    if (ctx && ctx.fishRescueActive && spellId === "wave") return true;
    if (ctx && ctx.id === "level5" && ctx.bossRematchActive && (spellId === "frost" || spellId === "solar")) return true;
    return MAY.save.unlockedSpells.indexOf(spellId) !== -1;
  };

  MAY.getSpellById = function (spellId) {
    for (var i = 0; i < MAY.SPELLS.length; i++) {
      if (MAY.SPELLS[i].id === spellId) return MAY.SPELLS[i];
    }
    return null;
  };

  MAY.unlockSpell = function (spellId, silent) {
    var sp = MAY.getSpellById(spellId);
    if (!sp) return false;
    var isNew = MAY.save.unlockedSpells.indexOf(spellId) === -1;
    if (isNew) {
      MAY.save.unlockedSpells.push(spellId);
      MAY.persist();
    }
    var idx = MAY.SPELLS.indexOf(sp);
    if (MAY.selectSpell) MAY.selectSpell(idx, true);
    if (MAY.VFX && MAY.VFX.syncSpellUI) MAY.VFX.syncSpellUI();
    if (isNew && !silent && MAY.showSkillBanner) {
      MAY.showSkillBanner(sp);
    }
    return isNew;
  };

  MAY.toggleFreeSpells = function () {
    MAY.save.freeSpells = !MAY.save.freeSpells;
    MAY.persist();
    if (MAY.VFX && MAY.VFX.syncSpellUI) MAY.VFX.syncSpellUI();
    if (MAY.syncFreeExploreUI) MAY.syncFreeExploreUI();
    if (MAY.renderAlbum) MAY.renderAlbum();
    MAY.toast(MAY.save.freeSpells ? "🔓 Đã mở Chế Độ Tự Do: Dùng ngay cả 6 Phép Thuật!" : "🔒 Đã trở về Chế Độ Cốt Truyện: Mở khóa từng phép theo chương!");
  };

  MAY.getLevelSave = function (id) {
    if (!MAY.save.levels[id]) MAY.save.levels[id] = freshLevelSave();
    if (!MAY.save.levels[id].story) MAY.save.levels[id].story = { stage: 0, steps: {}, bossDown: false, rewarded: false };
    if (!MAY.save.levels[id].sideQuest) MAY.save.levels[id].sideQuest = { stage: 0, doneIds: [], done: false };
    return MAY.save.levels[id];
  };

  MAY.nextRecommendedLevel = function () {
    for (var n = 1; n <= 6; n++) {
      if (MAY.save.gems.indexOf(n) === -1) return "level" + n;
    }
    return "hub";
  };

  /* ---- Hệ thống câu đố giáo dục theo từng màn ---- */
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function uniqueNumOpts(ans, minVal) {
    var lo = minVal === undefined ? 0 : minVal;
    var pool = [String(ans)];
    var deltas = shuffle([-2, -1, 1, 2, 3]);
    for (var i = 0; i < deltas.length && pool.length < 3; i++) {
      var v = ans + deltas[i];
      if (v >= lo && pool.indexOf(String(v)) === -1) pool.push(String(v));
    }
    return shuffle(pool);
  }

  var STATIC_QUIZZES = {
    level1: [
      { q: "Chữ cái đầu của từ 'cá heo' là gì?", ans: "C", opts: ["C", "S", "B"] },
      { q: "Chữ cái đầu của từ 'sao biển' là gì?", ans: "S", opts: ["S", "T", "R"] },
      { q: "Chữ cái đầu của từ 'rùa biển' là gì?", ans: "R", opts: ["R", "C", "B"] },
      { q: "Chữ cái đầu của từ 'bạch tuộc' là gì?", ans: "B", opts: ["B", "M", "S"] },
      { q: "Chữ cái đầu của từ 'san hô' là gì?", ans: "S", opts: ["S", "N", "H"] }
    ],
    level2: [
      { q: "Chữ cái đầu của từ 'sóc nâu' là gì?", ans: "S", opts: ["S", "H", "G"] },
      { q: "Chữ cái đầu của từ 'hươu sao' là gì?", ans: "H", opts: ["H", "C", "N"] },
      { q: "Chữ cái đầu của từ 'nấm xanh' là gì?", ans: "N", opts: ["N", "M", "L"] },
      { q: "Chữ cái đầu của từ 'gấu trúc' là gì?", ans: "G", opts: ["G", "C", "T"] },
      { q: "Trong hai số 14 và 9, số nào LỚN hơn?", ans: "14", opts: ["14", "9", "Bằng nhau"] },
      { q: "Trong hai số 6 và 11, số nào LỚN hơn?", ans: "11", opts: ["6", "11", "Bằng nhau"] },
      { q: "Trong hai số 8 và 3, số nào BÉ hơn?", ans: "3", opts: ["8", "3", "Bằng nhau"] },
      { q: "Trong hai số 7 và 12, số nào BÉ hơn?", ans: "7", opts: ["7", "12", "Bằng nhau"] }
    ],
    level3: [
      { q: "Chữ cái đầu của từ 'lạc đà' là gì?", ans: "L", opts: ["L", "C", "X"] },
      { q: "Chữ cái đầu của từ 'xương rồng' là gì?", ans: "X", opts: ["X", "S", "K"] },
      { q: "Chữ cái đầu của từ 'ốc đảo' là gì?", ans: "Ô", opts: ["Ô", "O", "Ơ"] },
      { q: "Nơi có nước xanh mát giữa sa mạc gọi là gì?", ans: "Ốc đảo", opts: ["Ốc đảo", "Sông băng", "Đỉnh mây"] },
      { q: "Bạn thú nào có bướu trên lưng ở sa mạc?", ans: "Lạc đà", opts: ["Lạc đà", "Cánh cụt", "Cá heo"] }
    ],
    level4: [
      { q: "Hình Tam Giác có mấy cạnh?", ans: "3 cạnh", opts: ["3 cạnh", "4 cạnh", "5 cạnh"] },
      { q: "Hình Vuông có mấy cạnh bằng nhau?", ans: "4 cạnh", opts: ["4 cạnh", "3 cạnh", "2 cạnh"] },
      { q: "Hình chữ nhật có mấy cạnh?", ans: "4 cạnh", opts: ["4 cạnh", "5 cạnh", "6 cạnh"] },
      { q: "Pha màu Vàng và màu Đỏ ra màu gì?", ans: "Màu Cam", opts: ["Màu Cam", "Màu Tím", "Xanh lá"] },
      { q: "Pha màu Đỏ và màu Vàng ra màu gì?", ans: "Màu Cam", opts: ["Màu Cam", "Màu Xanh lá", "Màu Tím"] },
      { q: "Pha màu Xanh dương và màu Vàng ra màu gì?", ans: "Xanh lá", opts: ["Xanh lá", "Màu Hồng", "Màu Đỏ"] },
      { q: "Pha màu Đỏ và Xanh dương ra màu gì?", ans: "Màu Tím", opts: ["Màu Tím", "Màu Vàng", "Màu Trắng"] },
      { q: "Ngôi sao nhỏ có mấy cánh nhọn?", ans: "5 cánh", opts: ["5 cánh", "3 cánh", "4 cánh"] }
    ],
    level5: [
      { q: "Số tiếp theo của dãy: 2, 4, 6, ... là số nào?", ans: "8", opts: ["8", "7", "9"] },
      { q: "Số tiếp theo của dãy: 1, 3, 5, ... là số nào?", ans: "7", opts: ["7", "6", "8"] },
      { q: "Số tiếp theo của dãy: 3, 6, 9, ... là số nào?", ans: "12", opts: ["10", "11", "12"] },
      { q: "Hình tiếp theo: ◆ ● ◆ ● ... là gì?", ans: "◆", opts: ["◆", "●", "▲"] },
      { q: "Hình tiếp theo: ▲ ◆ ▲ ◆ ... là gì?", ans: "▲", opts: ["◆", "▲", "●"] },
      { q: "Hình tiếp theo: ☀️ ❄️ ☀️ ❄️ ☀️ ... là gì?", ans: "❄️", opts: ["⭐", "❄️", "☀️"] },
      { q: "Hình tiếp theo: ❄️ ⭐ ❄️ ⭐ ❄️ ... là gì?", ans: "⭐", opts: ["⭐", "❄️", "☀️"] },
      { q: "Số tiếp theo của dãy: 5, 10, 15, ... là số nào?", ans: "20", opts: ["20", "16", "18"] },
      { q: "Bạn chim nào biết bơi giỏi ở xứ tuyết?", ans: "Cánh cụt", opts: ["Cánh cụt", "Vẹt đỏ", "Đại bàng"] },
      { q: "Chữ cái đầu của từ 'tuần lộc' là gì?", ans: "T", opts: ["T", "N", "B"] }
    ],
    level6: [
      { q: "Cá heo Bubi sống ở vùng đất nào?", ans: "Vịnh San Hô", opts: ["Vịnh San Hô", "Sa Mạc", "Xứ Tuyết"] },
      { q: "Lạc đà nhí Kiki sống ở đâu nhỉ?", ans: "Sa Mạc", opts: ["Sa Mạc", "Hang Pha Lê", "Rừng Nấm"] },
      { q: "Con cá trong tiếng Anh đọc là gì?", ans: "Fish", opts: ["Fish", "Cat", "Bird"] },
      { q: "Con mèo trong tiếng Anh là từ nào?", ans: "Cat", opts: ["Cat", "Cloud", "Fish"] },
      { q: "Con chim trong tiếng Anh là từ nào?", ans: "Bird", opts: ["Bird", "Tree", "Sun"] },
      { q: "Đám mây trong tiếng Anh là từ nào?", ans: "Cloud", opts: ["Cloud", "Sun", "Tree"] },
      { q: "Nếu đã tô 6 trong 7 màu cầu vồng, Mây còn cần mấy màu?", ans: "1 màu", opts: ["1 màu", "2 màu", "3 màu"] },
      { q: "Mây tô 5 màu cầu vồng. Cần thêm mấy màu cho đủ 7?", ans: "2 màu", opts: ["1 màu", "2 màu", "4 màu"] },
      { q: "Đã tô 4 màu cầu vồng, còn mấy màu mới đủ 7?", ans: "3 màu", opts: ["2 màu", "3 màu", "4 màu"] },
      { q: "Cầu vồng rực rỡ có mấy sắc màu chính?", ans: "7 màu", opts: ["7 màu", "3 màu", "2 màu"] },
      { q: "Một cầu vồng có bao nhiêu màu chính?", ans: "7 màu", opts: ["7 màu", "5 màu", "6 màu"] },
      { q: "Chim cánh cụt Bông sống ở vùng nào?", ans: "Thung Lũng Tuyết", opts: ["Thung Lũng Tuyết", "Sa Mạc", "Vịnh San Hô"] }
    ]
  };

  function generatedQuiz(levelId, skill) {
    if (levelId === "level1") {
      if (skill === "addition" || (skill !== "subtraction" && Math.random() < 0.5)) {
        var a = 1 + Math.floor(Math.random() * 9), b = 1 + Math.floor(Math.random() * (20 - a));
        var s = a + b;
        return { q: a + " + " + b + " = ?", ans: String(s), opts: uniqueNumOpts(s, 1) };
      } else {
        var a2 = 6 + Math.floor(Math.random() * 14), b2 = 1 + Math.floor(Math.random() * (a2 - 1));
        var d = a2 - b2;
        return { q: a2 + " - " + b2 + " = ?", ans: String(d), opts: uniqueNumOpts(d, 0) };
      }
    }
    if (levelId === "level2") {
      var x = 2 + Math.floor(Math.random() * 8), y = 1 + Math.floor(Math.random() * 8);
      return { q: "Mây có " + x + " cây nấm, nhặt thêm " + y + " cây. Hỏi có tất cả mấy cây?", ans: String(x + y), opts: uniqueNumOpts(x + y, 1) };
    }
    if (levelId === "level3") {
      var m1 = 2 + Math.floor(Math.random() * 7), m2 = 2 + Math.floor(Math.random() * 8);
      var tot = m1 + m2;
      return { q: "? + " + m2 + " = " + tot + " (Số còn thiếu là mấy?)", ans: String(m1), opts: uniqueNumOpts(m1, 1) };
    }
    if (levelId === "level4") {
      var c1 = 3 + Math.floor(Math.random() * 7), c2 = 2 + Math.floor(Math.random() * 6);
      return { q: "Có " + c1 + " tinh thể tím và " + c2 + " tinh thể xanh. Tổng cộng mấy tinh thể?", ans: String(c1 + c2), opts: uniqueNumOpts(c1 + c2, 1) };
    }
    if (levelId === "level5") {
      var s1 = 10 + Math.floor(Math.random() * 9), s2 = 2 + Math.floor(Math.random() * 7);
      return { q: "Có " + s1 + " bông tuyết, gió thổi đi " + s2 + " bông. Còn lại mấy bông?", ans: String(s1 - s2), opts: uniqueNumOpts(s1 - s2, 0) };
    }
    if (levelId === "level6") {
      var k1 = 4 + Math.floor(Math.random() * 8), k2 = 3 + Math.floor(Math.random() * 8);
      return { q: k1 + " + " + k2 + " = ?", ans: String(k1 + k2), opts: uniqueNumOpts(k1 + k2, 1) };
    }
  }

  MAY.quizKind = function (q) {
    if (/Chữ cái đầu/.test(q.q)) return "letter";
    if (/^\? \+/.test(q.q)) return "missing";
    if (/\+|nhặt thêm|tổng cộng/i.test(q.q)) return "addition";
    if (/ - |thổi đi/.test(q.q)) return "subtraction";
    if (/Hình tiếp theo/.test(q.q)) return "symbolPattern";
    if (/dãy/.test(q.q)) return "pattern";
    if (/lớn hơn|bé hơn/i.test(q.q)) return "compare";
    if (/cạnh|cánh nhọn/.test(q.q)) return "shape";
    if (/Pha màu/.test(q.q)) return "colour";
    if (/tiếng Anh/.test(q.q)) return "english";
    if (/sống ở|bướu|bơi giỏi|sa mạc/.test(q.q)) return "habitat";
    if (/cầu vồng/i.test(q.q)) return /còn|thêm/i.test(q.q) ? "rainbowMissing" : "rainbowCount";
    return "rainbow";
  };

  MAY.makeQuizForLevel = function (levelId, recent, skill) {
    recent = recent || [];
    var bank = STATIC_QUIZZES[levelId] || STATIC_QUIZZES.level1;
    var choices = bank.filter(function (q) {
      return !recent.includes(q.q) && (!skill || MAY.quizKind(q) === skill);
    });
    var chance = levelId === "level1" ? 0.65 : levelId === "level2" || levelId === "level3" ? 0.55 : 0.35;
    if (!choices.length || Math.random() < chance) {
      var generated = generatedQuiz(levelId, skill);
      if (generated && (!skill || MAY.quizKind(generated) === skill) && !recent.includes(generated.q)) return generated;
    }
    if (!choices.length && skill) {
      choices = Object.values(STATIC_QUIZZES).flat().filter(function (q) {
        return MAY.quizKind(q) === skill && !recent.includes(q.q);
      });
    }
    if (!choices.length && skill) {
      // Arithmetic banks have many valid pairs. Move the first operand on a repeat.
      var q = generatedQuiz(levelId, skill);
      if (q && MAY.quizKind(q) === skill) {
        var nums = q.q.match(/\d+/g).map(Number);
        for (var delta = 1; delta <= recent.length + 1; delta++) {
          var answer = Number(q.ans) + delta;
          var prompt = skill === "missing" ? "? + " + nums[0] + " = " + (nums[1] + delta)
            : (nums[0] + delta) + (skill === "subtraction" ? " - " : " + ") + nums[1] + " = ?";
          if (!recent.includes(prompt)) return { q: prompt, ans: String(answer), opts: uniqueNumOpts(answer, 0) };
        }
      }
    }
    // For a small exhausted bank, revisit the least recently attempted example.
    if (!choices.length && skill) {
      choices = Object.values(STATIC_QUIZZES).flat().filter(function (q) { return MAY.quizKind(q) === skill; });
      choices.sort(function (a, b) { return recent.lastIndexOf(a.q) - recent.lastIndexOf(b.q); });
      choices = choices.slice(0, 1);
    }
    if (!choices.length) choices = bank.filter(function (q) { return !recent.includes(q.q); });
    var pick = choices[Math.floor(Math.random() * choices.length)];
    return { q: pick.q, ans: pick.ans, opts: shuffle(pick.opts) };
  };

})(window.MAY);
