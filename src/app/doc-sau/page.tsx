import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/auth/session";
import { ReadLaterPanel } from "@/components/read-later-panel";

export default async function ReadLaterPage() {
  const currentUser = await getCurrentUser();

  return (
    <div className="min-h-screen">
      <SiteHeader activePage="readLater" currentUser={currentUser} />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-8">
        <section className="news-shell rounded-2xl p-5 md:p-6">
          <h1 className="text-3xl font-black text-slate-900">Đọc sau</h1>
          <p className="mt-2 text-sm text-slate-600">
            Lưu lại các bài cần đọc kỹ để xem lại bất cứ lúc nào.
          </p>
        </section>

        <ReadLaterPanel />
      </main>
    </div>
  );
}
