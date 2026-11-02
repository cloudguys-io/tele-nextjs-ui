// The typical invite page: a server component that hands the code to <TeleJoinPage>. Every prop is a string,
// so nothing has to be a client component here.
import { TeleJoinPage } from "@tele/nextjs-ui";

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
      chatHistoryUrl="/api/tele/calls/{callId}/messages"
      diagnosticsUrl="/api/tele/calls/{callId}/diagnostics"
      recordingUrl="/api/tele/calls/{callId}/recording/{action}"
      endForAllUrl="/api/tele/calls/{callId}/end"
      leaveHref="/?left=1"
      theme={{ accent: "#0a7cff" }}
    />
  );
}
