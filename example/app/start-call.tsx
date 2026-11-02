"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// EXAMPLE ONLY: asks the example backend to create an instant call, then opens its invite link.
export function StartCall() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          const res = await fetch("/api/example/calls", { method: "POST" });
          const body = (await res.json()) as { code?: string; error?: { message: string } };
          setBusy(false);
          if (!res.ok || !body.code) return setError(body.error?.message ?? "Couldn't create a call");
          router.push(`/call/${encodeURIComponent(body.code)}`);
        }}
      >
        Start a test call
      </button>
      {error ? <p role="alert">{error}</p> : null}
    </>
  );
}
