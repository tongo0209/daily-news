import Link from "next/link";
import type { SourceOption, TimeWindow } from "@/lib/news/query";

type FilterToolbarProps = {
  actionPath: string;
  sourceOptions: SourceOption[];
  selectedSourceId: string;
  selectedWindow: TimeWindow;
  keyword?: string;
};

const WINDOW_ITEMS: Array<{ value: TimeWindow; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "24h", label: "24 giờ" },
  { value: "7d", label: "7 ngày" },
  { value: "30d", label: "30 ngày" },
];

function buildWindowHref(
  actionPath: string,
  windowValue: TimeWindow,
  sourceId: string,
  keyword?: string,
): string {
  const query = new URLSearchParams();

  if (windowValue !== "all") {
    query.set("window", windowValue);
  }

  if (sourceId) {
    query.set("source", sourceId);
  }

  if (keyword?.trim()) {
    query.set("q", keyword.trim());
  }

  const queryString = query.toString();

  return queryString ? `${actionPath}?${queryString}` : actionPath;
}

export function FilterToolbar({
  actionPath,
  sourceOptions,
  selectedSourceId,
  selectedWindow,
  keyword = "",
}: FilterToolbarProps) {
  return (
    <section className="section-enter rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {WINDOW_ITEMS.map((item) => {
            const isActive = item.value === selectedWindow;

            return (
              <Link
                key={item.value}
                href={buildWindowHref(actionPath, item.value, selectedSourceId, keyword)}
                className={`inline-flex items-center justify-center rounded-xl border px-3 py-1.5 font-semibold transition-colors ${
                  isActive
                    ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-700"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-900 hover:bg-slate-900 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <form action={actionPath} method="get" className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {keyword.trim() ? <input type="hidden" name="q" value={keyword.trim()} /> : null}
          {selectedWindow !== "all" ? (
            <input type="hidden" name="window" value={selectedWindow} />
          ) : null}

          <label className="text-sm font-semibold text-slate-600" htmlFor="source-filter">
            Nguồn:
          </label>
          <select
            id="source-filter"
            name="source"
            defaultValue={selectedSourceId}
            className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-slate-900"
          >
            <option value="">Tất cả nguồn</option>
            {sourceOptions.map((source) => {
              return (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              );
            })}
          </select>

          <button
            type="submit"
            className="h-10 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Áp dụng
          </button>
        </form>
      </div>
    </section>
  );
}
