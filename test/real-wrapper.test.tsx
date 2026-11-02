// Against the real <TeleCall> from @tele/call-ui/react (and so the real <tele-call> element), in StrictMode.
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRef, Profiler, StrictMode } from "react";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { TeleCallRoom, type TeleCallRoomHandle } from "../src/TeleCallRoom.js";

vi.mock("next/navigation.js", () => ({ useRouter: () => ({ push: vi.fn() }) }));

afterEach(cleanup);

describe("TeleCallRoom with the real TeleCall", () => {
  it("mounts the element once, settles, and keeps the handle and slot across re-renders", async () => {
    let renders = 0;
    const ref = createRef<TeleCallRoomHandle>();
    const ui = (label: string) => (
      <StrictMode>
        <Profiler id="room" onRender={() => { renders++; }}>
          <TeleCallRoom ref={ref} joinUrl="/j" features="lobby chat" controls={<button>{label}</button>} />
        </Profiler>
      </StrictMode>
    );
    const { rerender } = render(ui("Raise hand"));
    await waitFor(() => expect(customElements.get("tele-call")).toBeDefined());
    const el = document.querySelector("tele-call")!;
    await waitFor(() => expect(el.shadowRoot).not.toBeNull());
    await waitFor(() => expect(el.querySelector('[slot="controls"]')?.textContent).toBe("Raise hand"));

    // No render loop: nothing renders while idle.
    const settled = renders;
    await act(async () => { await new Promise((r) => setTimeout(r, 300)); });
    expect(renders).toBe(settled);

    expect(ref.current?.element).toBe(el);
    expect(ref.current?.phase).toBe("lobby");

    const before = renders;
    rerender(ui("Raise hand 2"));
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
    // One commit for the parent's render; an unstable callback ref would detach and reattach the element
    // and commit again.
    expect(renders - before).toBe(1);
    await waitFor(() => expect(el.querySelector('[slot="controls"]')?.textContent).toBe("Raise hand 2"));
    expect(document.querySelectorAll("tele-call")).toHaveLength(1);
    expect(ref.current?.element).toBe(el);
  });
});
