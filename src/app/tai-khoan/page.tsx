import { AccountCenter } from "@/components/account-center";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/auth/session";
import { getSourceOptions } from "@/lib/news/query";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const [currentUser, sourceOptions] = await Promise.all([getCurrentUser(), getSourceOptions()]);

  return (
    <div className="min-h-screen">
      <SiteHeader activePage="account" currentUser={currentUser} />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-8">
        <AccountCenter
          initialUser={
            currentUser
              ? {
                  ...currentUser,
                  preferredCategories: [],
                  preferredSourceIds: [],
                }
              : null
          }
          sourceOptions={sourceOptions}
        />
      </main>
    </div>
  );
}
