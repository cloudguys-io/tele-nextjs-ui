// The typical invite page: a server component that hands the code to <TeleJoinPage>. Every prop is a string,
// so nothing has to be a client component here.
// Previews and joins use the default routes (/api/tele/invites/{code}[/join]); rejoins use
// /api/tele/calls/{callId}/join. All are the shared Tele backend routes.
import { DEFAULT_CHAT_HISTORY_URL, DEFAULT_DIAGNOSTICS_URL, TeleJoinPage } from "@tele/nextjs-ui";

export default async function CallPage({ params, searchParams }: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { code } = await params;
  const { lang } = await searchParams;
  return (
    <TeleJoinPage
      code={code}
      lang={lang === "bn" ? "bn" : "en"}
      layout="speaker"
      chatHistoryUrl={DEFAULT_CHAT_HISTORY_URL}
      diagnosticsUrl={DEFAULT_DIAGNOSTICS_URL}
      leaveHref="/?left=1"
      theme={{ accent: "#0a7cff" }}
    />
  );
}
