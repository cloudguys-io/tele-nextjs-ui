import { StartCall } from "./start-call";

export default async function Home({ searchParams }: { searchParams: Promise<{ left?: string }> }) {
  const { left } = await searchParams;
  return (
    <main style={{ maxWidth: "36rem", margin: "0 auto", padding: "3rem 1rem" }}>
      <h1 style={{ fontSize: "1.75rem", margin: 0 }}>Tele Next.js UI example</h1>
      {left ? <p role="status">You left the call.</p> : null}
      <p>Open an invite link at <code>/call/&lt;code&gt;</code>, or start a test call hosted by you.</p>
      <StartCall />
    </main>
  );
}
