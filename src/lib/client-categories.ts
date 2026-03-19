export const CLIENT_CATEGORY_ORDER = [
  "WORLD",
  "TECHNOLOGY",
  "BUSINESS",
  "SPORTS",
  "ENTERTAINMENT",
  "HEALTH",
  "SCIENCE",
] as const;

export type ClientCategory = (typeof CLIENT_CATEGORY_ORDER)[number];

export const CLIENT_CATEGORY_META: Record<
  ClientCategory,
  {
    slug: string;
    label: string;
    description: string;
  }
> = {
  WORLD: {
    slug: "thoi-su",
    label: "Thời sự",
    description: "Tin Việt Nam và thế giới từ các tòa soạn trong nước.",
  },
  TECHNOLOGY: {
    slug: "cong-nghe",
    label: "Công nghệ",
    description: "AI, sản phẩm số, startup và xu hướng chuyển đổi số.",
  },
  BUSINESS: {
    slug: "kinh-doanh",
    label: "Kinh doanh",
    description: "Doanh nghiệp, tài chính, thị trường và đầu tư.",
  },
  SPORTS: {
    slug: "the-thao",
    label: "Thể thao",
    description: "Bóng đá, thể thao Việt Nam và các giải quốc tế nổi bật.",
  },
  ENTERTAINMENT: {
    slug: "giai-tri",
    label: "Giải trí",
    description: "Điện ảnh, âm nhạc, văn hóa và đời sống nghệ sĩ.",
  },
  HEALTH: {
    slug: "suc-khoe",
    label: "Sức khỏe",
    description: "Y tế, tư vấn sức khỏe và kiến thức phòng bệnh.",
  },
  SCIENCE: {
    slug: "khoa-hoc",
    label: "Khoa học",
    description: "Khám phá mới về công nghệ, tự nhiên và đời sống.",
  },
};
