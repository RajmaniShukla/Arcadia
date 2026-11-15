import type { ReactNode } from "react";

const TONES = {
  info: "bg-sky-50 text-sky-800 ring-sky-200",
  error: "bg-red-50 text-red-800 ring-red-200",
} as const;

export default function Banner({
  tone,
  children,
}: {
  tone: keyof typeof TONES;
  children: ReactNode;
}) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-xl px-4 py-3 text-sm ring-1 ${TONES[tone]}`}
    >
      {children}
    </p>
  );
}