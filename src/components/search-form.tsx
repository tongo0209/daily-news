type SearchFormProps = {
  initialValue?: string;
  action?: string;
  hiddenFields?: Record<string, string | undefined>;
};

export function SearchForm({
  initialValue = "",
  action = "/",
  hiddenFields = {},
}: SearchFormProps) {
  return (
    <form action={action} method="get" className="flex w-full flex-col gap-2 sm:flex-row">
      {Object.entries(hiddenFields).map(([key, value]) => {
        if (!value?.trim()) {
          return null;
        }

        return <input key={key} type="hidden" name={key} value={value} />;
      })}
      <input
        type="text"
        name="q"
        defaultValue={initialValue}
        placeholder="Nhập từ khóa: chuyển đổi số, bóng đá, chứng khoán..."
        className="h-11 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-900"
      />
      <button
        type="submit"
        className="h-11 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-700"
      >
        Tìm tin
      </button>
    </form>
  );
}
