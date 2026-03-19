import type { Metadata } from "next";
import { Noto_Sans, Noto_Serif } from "next/font/google";
import "./globals.css";

const notoSans = Noto_Sans({
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
});

const notoSerif = Noto_Serif({
  subsets: ["latin", "vietnamese"],
  variable: "--font-serif",
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000"),
  title: {
    default: "Tin Việt Mỗi Ngày",
    template: "%s | Tin Việt Mỗi Ngày",
  },
  description:
    "Trang tổng hợp tin tức tiếng Việt: thời sự, công nghệ, kinh doanh, thể thao, giải trí, sức khỏe, khoa học.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${notoSans.variable} ${notoSerif.variable}`}>{children}</body>
    </html>
  );
}
