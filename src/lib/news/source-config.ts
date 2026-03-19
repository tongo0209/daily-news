import { Category } from "@prisma/client";

export type SourceDefinition = {
  name: string;
  homeUrl: string;
  feedUrl: string;
  category: Category;
};

export const NEWS_SOURCES: SourceDefinition[] = [
  {
    name: "VnExpress - Thời sự",
    homeUrl: "https://vnexpress.net/thoi-su",
    feedUrl: "https://vnexpress.net/rss/thoi-su.rss",
    category: Category.WORLD,
  },
  {
    name: "VnExpress - Thế giới",
    homeUrl: "https://vnexpress.net/the-gioi",
    feedUrl: "https://vnexpress.net/rss/the-gioi.rss",
    category: Category.WORLD,
  },
  {
    name: "Tuổi Trẻ - Tin mới nhất",
    homeUrl: "https://tuoitre.vn",
    feedUrl: "https://tuoitre.vn/rss/tin-moi-nhat.rss",
    category: Category.WORLD,
  },
  {
    name: "VnExpress - Số hóa",
    homeUrl: "https://vnexpress.net/so-hoa",
    feedUrl: "https://vnexpress.net/rss/so-hoa.rss",
    category: Category.TECHNOLOGY,
  },
  {
    name: "Vietnamnet - Công nghệ",
    homeUrl: "https://vietnamnet.vn/cong-nghe",
    feedUrl: "https://vietnamnet.vn/rss/cong-nghe.rss",
    category: Category.TECHNOLOGY,
  },
  {
    name: "VnExpress - Kinh doanh",
    homeUrl: "https://vnexpress.net/kinh-doanh",
    feedUrl: "https://vnexpress.net/rss/kinh-doanh.rss",
    category: Category.BUSINESS,
  },
  {
    name: "Tuổi Trẻ - Kinh doanh",
    homeUrl: "https://tuoitre.vn/kinh-doanh.htm",
    feedUrl: "https://tuoitre.vn/rss/kinh-doanh.rss",
    category: Category.BUSINESS,
  },
  {
    name: "VnExpress - Thể thao",
    homeUrl: "https://vnexpress.net/the-thao",
    feedUrl: "https://vnexpress.net/rss/the-thao.rss",
    category: Category.SPORTS,
  },
  {
    name: "Tuổi Trẻ - Thể thao",
    homeUrl: "https://tuoitre.vn/the-thao.htm",
    feedUrl: "https://tuoitre.vn/rss/the-thao.rss",
    category: Category.SPORTS,
  },
  {
    name: "VnExpress - Giải trí",
    homeUrl: "https://vnexpress.net/giai-tri",
    feedUrl: "https://vnexpress.net/rss/giai-tri.rss",
    category: Category.ENTERTAINMENT,
  },
  {
    name: "Tuổi Trẻ - Văn hóa",
    homeUrl: "https://tuoitre.vn/van-hoa.htm",
    feedUrl: "https://tuoitre.vn/rss/van-hoa.rss",
    category: Category.ENTERTAINMENT,
  },
  {
    name: "VnExpress - Sức khỏe",
    homeUrl: "https://vnexpress.net/suc-khoe",
    feedUrl: "https://vnexpress.net/rss/suc-khoe.rss",
    category: Category.HEALTH,
  },
  {
    name: "Tuổi Trẻ - Sức khỏe",
    homeUrl: "https://tuoitre.vn/suc-khoe.htm",
    feedUrl: "https://tuoitre.vn/rss/suc-khoe.rss",
    category: Category.HEALTH,
  },
  {
    name: "VnExpress - Khoa học",
    homeUrl: "https://vnexpress.net/khoa-hoc",
    feedUrl: "https://vnexpress.net/rss/khoa-hoc.rss",
    category: Category.SCIENCE,
  },
  {
    name: "Tuổi Trẻ - Khoa học",
    homeUrl: "https://tuoitre.vn/khoa-hoc.htm",
    feedUrl: "https://tuoitre.vn/rss/khoa-hoc.rss",
    category: Category.SCIENCE,
  },
];
