import { RunStatus } from "@prisma/client";
import { SiteHeader } from "@/components/site-header";
import { RunIngestionButton } from "@/components/run-ingestion-button";
import { getCurrentUser } from "@/lib/auth/session";
import { categoryLabel } from "@/lib/categories";
import { formatDateTime } from "@/lib/news/date";
import { getDashboardData } from "@/lib/news/query";

export const dynamic = "force-dynamic";

function statusClass(status: RunStatus): string {
  if (status === RunStatus.SUCCESS) {
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }

  if (status === RunStatus.PARTIAL) {
    return "bg-amber-100 text-amber-700 border-amber-200";
  }

  return "bg-rose-100 text-rose-700 border-rose-200";
}

export default async function AdminPage() {
  const [data, currentUser] = await Promise.all([getDashboardData(), getCurrentUser()]);

  return (
    <div className="min-h-screen">
      <SiteHeader activePage="admin" currentUser={currentUser} />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-8">
        <section className="news-shell section-enter rounded-2xl p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-black text-slate-900">Bảng điều hành tòa soạn</h1>
              <p className="mt-2 text-sm text-slate-600">
                Theo dõi phiên cập nhật, số bài viết và chất lượng dữ liệu nguồn RSS tiếng Việt.
              </p>
            </div>
            <RunIngestionButton />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="section-enter rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Tổng bài viết</p>
            <p className="mt-2 text-3xl font-black">{data.articleCount}</p>
          </div>
          <div className="section-enter rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Tổng nguồn</p>
            <p className="mt-2 text-3xl font-black">{data.sourceCount}</p>
          </div>
          <div className="section-enter rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2">
            <p className="text-sm text-slate-500">Số bài theo chuyên mục</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.categoryBreakdown.map((entry) => {
                return (
                  <span
                    key={entry.category}
                    className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-semibold"
                  >
                    {categoryLabel(entry.category)}: {entry._count._all}
                  </span>
                );
              })}
            </div>
          </div>
        </section>

        <section className="section-enter rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black">Lịch sử cập nhật gần nhất</h2>

          {data.recentRuns.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">Chưa có phiên cập nhật nào.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="px-3 py-2 font-semibold">Bắt đầu</th>
                    <th className="px-3 py-2 font-semibold">Kết thúc</th>
                    <th className="px-3 py-2 font-semibold">Trạng thái</th>
                    <th className="px-3 py-2 font-semibold">Đọc được</th>
                    <th className="px-3 py-2 font-semibold">Thêm mới</th>
                    <th className="px-3 py-2 font-semibold">Bỏ qua</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentRuns.map((run) => {
                    return (
                      <tr key={run.id} className="border-b border-slate-100 last:border-b-0">
                        <td className="px-3 py-3">{formatDateTime(run.startedAt)}</td>
                        <td className="px-3 py-3">
                          {run.finishedAt ? formatDateTime(run.finishedAt) : "Đang chạy"}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`rounded-full border px-2 py-1 text-xs font-semibold ${statusClass(run.status)}`}
                          >
                            {run.status}
                          </span>
                        </td>
                        <td className="px-3 py-3">{run.totalFetched}</td>
                        <td className="px-3 py-3">{run.insertedCount}</td>
                        <td className="px-3 py-3">{run.skippedCount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="section-enter rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black">Sức khỏe nguồn RSS</h2>
          <p className="mt-1 text-sm text-slate-600">
            Theo dõi nguồn nào ổn định, nguồn nào lỗi nhiều để ưu tiên xử lý.
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="px-3 py-2 font-semibold">Nguồn</th>
                  <th className="px-3 py-2 font-semibold">Lần đọc</th>
                  <th className="px-3 py-2 font-semibold">Thành công</th>
                  <th className="px-3 py-2 font-semibold">Lỗi</th>
                  <th className="px-3 py-2 font-semibold">Lần thành công gần nhất</th>
                  <th className="px-3 py-2 font-semibold">Lần lỗi gần nhất</th>
                </tr>
              </thead>
              <tbody>
                {data.sourceHealth.map((source) => {
                  return (
                    <tr key={source.id} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-3 py-3 font-semibold text-slate-800">{source.name}</td>
                      <td className="px-3 py-3">{source.fetchCount}</td>
                      <td className="px-3 py-3 text-emerald-700">{source.successCount}</td>
                      <td className="px-3 py-3 text-rose-700">{source.errorCount}</td>
                      <td className="px-3 py-3">
                        {source.lastSuccessAt ? formatDateTime(source.lastSuccessAt) : "Chưa có"}
                      </td>
                      <td className="px-3 py-3">
                        {source.lastErrorAt ? formatDateTime(source.lastErrorAt) : "Không có"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="section-enter rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black">Nhật ký chi tiết theo nguồn</h2>
          {data.recentSourceRuns.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">Chưa có dữ liệu chi tiết.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="px-3 py-2 font-semibold">Nguồn</th>
                    <th className="px-3 py-2 font-semibold">Bắt đầu</th>
                    <th className="px-3 py-2 font-semibold">Trạng thái</th>
                    <th className="px-3 py-2 font-semibold">Đọc được</th>
                    <th className="px-3 py-2 font-semibold">Thêm mới</th>
                    <th className="px-3 py-2 font-semibold">Bỏ qua</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentSourceRuns.map((run) => {
                    return (
                      <tr key={run.id} className="border-b border-slate-100 last:border-b-0">
                        <td className="px-3 py-3 font-semibold">{run.source.name}</td>
                        <td className="px-3 py-3">{formatDateTime(run.startedAt)}</td>
                        <td className="px-3 py-3">
                          <span
                            className={`rounded-full border px-2 py-1 text-xs font-semibold ${statusClass(run.status)}`}
                          >
                            {run.status}
                          </span>
                        </td>
                        <td className="px-3 py-3">{run.fetchedCount}</td>
                        <td className="px-3 py-3">{run.insertedCount}</td>
                        <td className="px-3 py-3">{run.skippedCount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
