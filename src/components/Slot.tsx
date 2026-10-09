/** Placeholder untuk komponen eksternal. Ganti isinya nanti. */
export default function Slot({ name, className = "" }: { name: string; className?: string }) {
  return (
    <div className={`flex items-center justify-center rounded-3xl border border-dashed border-white/25 text-lg text-white/70 ${className}`}>
      “{name}”
    </div>
  );
}
