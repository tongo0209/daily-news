import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="news-shell section-enter max-w-md rounded-2xl p-8 text-center">
        <h1 className="text-3xl font-black text-slate-900">Không tìm thấy trang</h1>
        <p className="mt-3 text-sm text-slate-600">
          Nội dung bạn cần có thể đã được di chuyển hoặc không còn tồn tại.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          Về trang nhất
        </Link>
      </div>
    </main>
  );
}
