import Link from "next/link";
import { Category } from "@prisma/client";
import { CATEGORY_ORDER, CATEGORY_META, categoryToSlug } from "@/lib/categories";
import type { CurrentUser } from "@/lib/auth/session";

type SiteHeaderProps = {
  activeCategory?: Category | null;
  activePage?: "home" | "readLater" | "admin" | "account";
  currentUser?: CurrentUser | null;
};

export function SiteHeader({
  activeCategory = null,
  activePage = "home",
  currentUser = null,
}: SiteHeaderProps) {
  const todayLabel = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date());

  const navButtonBase =
    "inline-flex items-center justify-center rounded-xl border px-3 py-1.5 font-semibold transition-colors";
  const navButtonInactive =
    "border-slate-300 bg-white text-slate-700 hover:border-slate-900 hover:bg-slate-900 hover:text-white";
  const navButtonActive = "border-slate-900 bg-slate-900 text-white hover:bg-slate-700";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 md:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Bản tin tiếng Việt
            </p>
            <Link
              href="/"
              className="inline-block text-3xl font-black tracking-tight text-slate-900"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              Tin Việt Mỗi Ngày
            </Link>
            <p className="mt-1 text-sm text-slate-600">
              Ưu tiên nguồn Việt Nam, cập nhật nhanh và dễ đọc.
            </p>
          </div>
          <p className="text-sm font-medium text-slate-500">{todayLabel}</p>
        </div>

        <nav className="flex flex-wrap items-center gap-2 text-sm">
          <Link
            href="/"
            className={`${navButtonBase} ${
              activeCategory === null && activePage === "home"
                ? navButtonActive
                : navButtonInactive
            }`}
          >
            Trang nhất
          </Link>

          {CATEGORY_ORDER.map((category) => {
            const isActive = category === activeCategory;

            return (
              <Link
                key={category}
                href={`/category/${categoryToSlug(category)}`}
                className={`${navButtonBase} ${
                  isActive ? navButtonActive : navButtonInactive
                }`}
              >
                {CATEGORY_META[category].label}
              </Link>
            );
          })}

          <Link
            href="/doc-sau"
            className={`${navButtonBase} ${
              activePage === "readLater" ? navButtonActive : navButtonInactive
            }`}
          >
            Đọc sau
          </Link>

          <Link
            href="/admin"
            className={`${navButtonBase} ${
              activePage === "admin" ? navButtonActive : navButtonInactive
            }`}
          >
            Tòa soạn
          </Link>

          <Link
            href="/tai-khoan"
            className={`${navButtonBase} ${
              activePage === "account" ? navButtonActive : navButtonInactive
            }`}
          >
            {currentUser ? `Tài khoản: ${currentUser.displayName}` : "Tài khoản"}
          </Link>
        </nav>
      </div>
    </header>
  );
}
