import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function EinladungPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: invData } = await supabase.rpc("get_invitation_by_token", {
    p_token: token,
  });
  const inv = invData?.[0];

  if (!inv) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-zinc-900">Einladung ungültig</p>
          <p className="mt-2 text-sm text-zinc-500">
            Der Link ist abgelaufen oder wurde bereits verwendet.
          </p>
          <Link href="/login" className="mt-4 inline-block text-sm text-teal-700 hover:underline">
            Zur Anmeldung
          </Link>
        </div>
      </div>
    );
  }

  if (inv.accepted_at) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-zinc-900">Bereits angenommen</p>
          <p className="mt-2 text-sm text-zinc-500">Diese Einladung wurde schon verwendet.</p>
          <Link href="/chat" className="mt-4 inline-block text-sm text-teal-700 hover:underline">
            Zum Chat
          </Link>
        </div>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.rpc("accept_invitation", { p_token: token });
    redirect("/chat");
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <p className="text-lg font-semibold text-zinc-900">
          Einladung zu {inv.workspace_name}
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          Melde dich an um der Einladung beizutreten. Danach diesen Link erneut öffnen.
        </p>
        <div className="mt-6 space-y-3">
          <Link
            href="/login"
            className="block w-full rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
          >
            Anmelden
          </Link>
          <Link
            href="/register"
            className="block w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Neu registrieren
          </Link>
        </div>
      </div>
    </div>
  );
}
