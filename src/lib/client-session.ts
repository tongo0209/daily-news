type ClientSessionUser = {
  id: string;
  email: string;
  displayName: string;
  preferredCategories?: string[];
  preferredSourceIds?: string[];
};

type ClientSessionResponse = {
  ok: boolean;
  user: ClientSessionUser | null;
};

let cachedSession: ClientSessionResponse | null = null;
let inflightSessionRequest: Promise<ClientSessionResponse> | null = null;

export async function getClientSession(force = false): Promise<ClientSessionResponse> {
  if (!force && cachedSession) {
    return cachedSession;
  }

  if (!force && inflightSessionRequest) {
    return inflightSessionRequest;
  }

  inflightSessionRequest = fetch("/api/auth/session", {
    cache: "no-store",
  })
    .then(async (response) => {
      if (!response.ok) {
        return {
          ok: false,
          user: null,
        };
      }

      return (await response.json()) as ClientSessionResponse;
    })
    .catch(() => {
      return {
        ok: false,
        user: null,
      } satisfies ClientSessionResponse;
    })
    .finally(() => {
      inflightSessionRequest = null;
    });

  const result = await inflightSessionRequest;
  cachedSession = result;
  return result;
}

export function resetClientSessionCache() {
  cachedSession = null;
  inflightSessionRequest = null;
}
