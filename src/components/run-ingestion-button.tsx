"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type IngestResponse = {
  ok: boolean;
  result?: {
    insertedCount: number;
    skippedCount: number;
    totalFetched: number;
  };
  error?: string;
};

export function RunIngestionButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string>("");

  const onRun = () => {
    startTransition(async () => {
      setMessage("Đang cập nhật nguồn tin...");

      try {
        const response = await fetch("/api/ingest", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
        });

        const data = (await response.json()) as IngestResponse;

        if (!response.ok || !data.ok || !data.result) {
          throw new Error(data.error ?? "Không thể chạy cập nhật nguồn tin");
        }

        setMessage(
          `Xong: +${data.result.insertedCount} bài mới, bỏ qua ${data.result.skippedCount}, đã đọc ${data.result.totalFetched} mục.`,
        );
        router.refresh();
      } catch (error) {
        setMessage((error as Error).message);
      }
    });
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onRun}
        disabled={isPending}
        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Đang chạy..." : "Cập nhật tin ngay"}
      </button>
      {message ? <p className="text-xs text-slate-600">{message}</p> : null}
    </div>
  );
}
