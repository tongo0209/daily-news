"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CLIENT_CATEGORY_META, CLIENT_CATEGORY_ORDER } from "@/lib/client-categories";
import type { SourceOption } from "@/lib/news/query";
import { getClientSession, resetClientSessionCache } from "@/lib/client-session";

type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  preferredCategories: string[];
  preferredSourceIds: string[];
};

type AlertItem = {
  id: string;
  keyword: string;
  status: "ACTIVE" | "PAUSED";
  lastCheckedAt: string | null;
};

type AlertCheckItem = {
  alert: AlertItem;
  newCount: number;
  items: Array<{
    id: string;
    slug: string;
    title: string;
    source: {
      name: string;
    };
  }>;
};

type AccountCenterProps = {
  initialUser: SessionUser | null;
  sourceOptions: SourceOption[];
};

async function readJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const data = (await response.json()) as T & { ok?: boolean; error?: string };

  if (!response.ok || data.ok === false) {
    const message = data.error ?? "Có lỗi xảy ra.";
    throw new Error(message);
  }

  return data;
}

export function AccountCenter({ initialUser, sourceOptions }: AccountCenterProps) {
  const [user, setUser] = useState<SessionUser | null>(initialUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [alertChecks, setAlertChecks] = useState<AlertCheckItem[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedCategories = useMemo(() => new Set(user?.preferredCategories ?? []), [user?.preferredCategories]);
  const selectedSources = useMemo(() => new Set(user?.preferredSourceIds ?? []), [user?.preferredSourceIds]);

  const refreshSession = useCallback(async () => {
    const result = (await getClientSession(true)) as { ok: boolean; user: SessionUser | null };
    setUser(result.user);
    return result.user;
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const refreshAlerts = useCallback(async () => {
    if (!user) {
      setAlerts([]);
      return;
    }

    const result = await readJson<{ ok: boolean; alerts: AlertItem[] }>("/api/alerts");
    setAlerts(result.alerts);
  }, [user]);

  useEffect(() => {
    void refreshAlerts();
  }, [refreshAlerts]);

  const onRegister = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await readJson("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          displayName,
        }),
      });
      resetClientSessionCache();
      await refreshSession();
      setMessage("Đăng ký thành công.");
      setPassword("");
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const onLogin = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await readJson("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          password,
        }),
      });
      resetClientSessionCache();
      await refreshSession();
      setMessage("Đăng nhập thành công.");
      setPassword("");
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const onLogout = async () => {
    setLoading(true);
    setMessage("");

    try {
      await readJson("/api/auth/logout", { method: "POST" });
      resetClientSessionCache();
      setUser(null);
      setAlerts([]);
      setAlertChecks([]);
      setMessage("Đã đăng xuất.");
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (nextCategories: string[], nextSources: string[]) => {
    await readJson("/api/preferences", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        preferredCategories: nextCategories,
        preferredSourceIds: nextSources,
      }),
    });

    const refreshed = await refreshSession();

    if (!refreshed) {
      return;
    }

    setMessage("Đã cập nhật sở thích cá nhân hóa.");
  };

  const toggleCategory = async (category: string) => {
    if (!user) {
      return;
    }

    const nextCategories = selectedCategories.has(category)
      ? user.preferredCategories.filter((item) => item !== category)
      : [...user.preferredCategories, category];

    await savePreferences(nextCategories, user.preferredSourceIds);
  };

  const toggleSource = async (sourceId: string) => {
    if (!user) {
      return;
    }

    const nextSources = selectedSources.has(sourceId)
      ? user.preferredSourceIds.filter((item) => item !== sourceId)
      : [...user.preferredSourceIds, sourceId];

    await savePreferences(user.preferredCategories, nextSources);
  };

  const createAlert = async (event: FormEvent) => {
    event.preventDefault();

    if (!newKeyword.trim()) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await readJson("/api/alerts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ keyword: newKeyword.trim() }),
      });
      setNewKeyword("");
      await refreshAlerts();
      setMessage("Đã tạo cảnh báo từ khóa.");
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const toggleAlert = async (alert: AlertItem) => {
    setLoading(true);
    setMessage("");

    try {
      await readJson("/api/alerts", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: alert.id,
          status: alert.status === "ACTIVE" ? "PAUSED" : "ACTIVE",
        }),
      });
      await refreshAlerts();
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const removeAlert = async (alertId: string) => {
    setLoading(true);
    setMessage("");

    try {
      await readJson(`/api/alerts?id=${encodeURIComponent(alertId)}`, {
        method: "DELETE",
      });
      await refreshAlerts();
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const checkAlerts = async () => {
    setLoading(true);
    setMessage("");

    try {
      const result = await readJson<{ ok: boolean; checks: AlertCheckItem[] }>("/api/alerts?check=1");
      setAlertChecks(result.checks);
      setMessage("Đã kiểm tra cảnh báo mới.");
      await refreshAlerts();
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <section className="news-shell section-enter rounded-2xl p-6">
        <h1 className="text-2xl font-black text-slate-900">Tài khoản người dùng</h1>
        <p className="mt-2 text-sm text-slate-600">
          Tạo tài khoản để đồng bộ đọc sau, sở thích cá nhân hóa và cảnh báo từ khóa trên nhiều thiết bị.
        </p>

        {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <form onSubmit={onRegister} className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-black text-slate-900">Đăng ký</h2>
            <div className="mt-3 space-y-2">
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Tên hiển thị"
                className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-900"
              />
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                placeholder="Email"
                className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-900"
              />
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                placeholder="Mật khẩu (>= 8 ký tự)"
                className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-900"
              />
            </div>
            <button
              disabled={loading}
              className="mt-3 h-10 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
            >
              Tạo tài khoản
            </button>
          </form>

          <form onSubmit={onLogin} className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-black text-slate-900">Đăng nhập</h2>
            <div className="mt-3 space-y-2">
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                placeholder="Email"
                className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-900"
              />
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                placeholder="Mật khẩu"
                className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-900"
              />
            </div>
            <button
              disabled={loading}
              className="mt-3 h-10 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
            >
              Đăng nhập
            </button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <section className="news-shell section-enter rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900">{user.displayName}</h1>
            <p className="text-sm text-slate-600">{user.email}</p>
          </div>
          <button
            onClick={onLogout}
            disabled={loading}
            className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
          >
            Đăng xuất
          </button>
        </div>
        {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
      </section>

      <section className="news-shell section-enter rounded-2xl p-6">
        <h2 className="text-xl font-black text-slate-900">Cá nhân hóa xếp hạng tin</h2>
        <p className="mt-1 text-sm text-slate-600">
          Chọn chuyên mục và nguồn ưu tiên để feed tự đẩy những tin bạn quan tâm lên trước.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {CLIENT_CATEGORY_ORDER.map((category) => {
            const active = selectedCategories.has(category);
            return (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`rounded-xl border px-3 py-1.5 text-sm font-semibold transition-colors ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-700"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-900 hover:bg-slate-900 hover:text-white"
                }`}
              >
                {CLIENT_CATEGORY_META[category].label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
          {sourceOptions.map((source) => {
            const active = selectedSources.has(source.id);
            return (
              <button
                key={source.id}
                onClick={() => toggleSource(source.id)}
                className={`rounded-xl border px-3 py-2 text-left text-sm font-semibold transition-colors ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-700"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-900 hover:bg-slate-900 hover:text-white"
                }`}
              >
                {source.name}
              </button>
            );
          })}
        </div>
      </section>

      <section className="news-shell section-enter rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-900">Cảnh báo theo từ khóa</h2>
            <p className="text-sm text-slate-600">Theo dõi từ khóa quan trọng và kiểm tra tin mới theo nhu cầu.</p>
          </div>
          <button
            onClick={checkAlerts}
            className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Kiểm tra ngay
          </button>
        </div>

        <form onSubmit={createAlert} className="mt-4 flex gap-2">
          <input
            value={newKeyword}
            onChange={(event) => setNewKeyword(event.target.value)}
            placeholder="Ví dụ: VN-Index, lãi suất, AI..."
            className="h-10 flex-1 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-900"
          />
          <button className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700">
            Thêm
          </button>
        </form>

        <div className="mt-4 space-y-2">
          {alerts.length === 0 ? (
            <p className="text-sm text-slate-600">Chưa có từ khóa cảnh báo.</p>
          ) : (
            alerts.map((alert) => {
              return (
                <div key={alert.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3">
                  <div>
                    <p className="font-semibold text-slate-900">{alert.keyword}</p>
                    <p className="text-xs text-slate-500">{alert.status === "ACTIVE" ? "Đang theo dõi" : "Đã tạm dừng"}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleAlert(alert)}
                      className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-slate-900 hover:bg-slate-900 hover:text-white"
                    >
                      {alert.status === "ACTIVE" ? "Tạm dừng" : "Bật lại"}
                    </button>
                    <button
                      onClick={() => removeAlert(alert.id)}
                      className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-slate-900 hover:bg-slate-900 hover:text-white"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {alertChecks.length > 0 ? (
          <div className="mt-5 space-y-3">
            {alertChecks.map((entry) => {
              return (
                <article key={entry.alert.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="font-semibold text-slate-900">
                    {entry.alert.keyword}: {entry.newCount} bài mới
                  </p>
                  {entry.items.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-sm text-slate-700">
                      {entry.items.map((item) => {
                        return (
                          <li key={item.id}>
                            <a href={`/article/${item.slug}`} className="hover:underline">
                              {item.title}
                            </a>{" "}
                            <span className="text-slate-500">({item.source.name})</span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : null}
      </section>
    </section>
  );
}
