// A stand-in for @tele/call-ui/react's TeleCall: renders a plain <tele-call> element with the methods the
// real one has, and records the props it got, so tests can drive getJoin and fire the events.
import { forwardRef, useImperativeHandle, useRef } from "react";
import type { TeleCallProps } from "@tele/call-ui/react";

export type FakeElement = HTMLElement & {
  phase: string;
  leave: () => Promise<void>;
  setMicrophone: (on: boolean) => Promise<void>;
  setCamera: (on: boolean) => Promise<void>;
};

export const calls: { props: TeleCallProps; el: FakeElement | null }[] = [];
export const last = () => calls[calls.length - 1]!;

export const TeleCall = forwardRef<FakeElement | null, TeleCallProps>(function TeleCall(props, ref) {
  const node = useRef<FakeElement | null>(null);
  const entry = { props, el: null as FakeElement | null };
  calls.push(entry);
  useImperativeHandle(ref, () => {
    const el = node.current!;
    el.phase = "lobby";
    el.leave = async () => { el.phase = "left"; props.onLeave?.({ reason: "left" }); };
    el.setMicrophone = async (on) => { el.dataset.mic = String(on); };
    el.setCamera = async (on) => { el.dataset.cam = String(on); };
    return el;
  }, [props]);
  entry.el = node.current;
  const features = Array.isArray(props.features) ? props.features.join(" ") : props.features;
  return (
    <tele-call
      ref={node as never}
      class={props.className}
      style={props.style}
      lang={props.lang ?? "en"}
      theme={props.theme ?? "auto"}
      layout={props.layout ?? "grid"}
      features={features}
    />
  );
});

declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "tele-call": Record<string, unknown>;
    }
  }
}
