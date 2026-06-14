import VoiceWidget from "@/components/VoiceWidget";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-5 py-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-white font-bold">ہ</span>
          <span className="text-xl font-bold tracking-tight text-ink">
            HumQadam <span className="font-urdu text-primary">ہم قدم</span>
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="mt-12 text-center">
        <h1 className="mx-auto max-w-3xl animate-fadeUp text-4xl font-extrabold leading-tight text-ink sm:text-5xl">
          Your vote starts with a{" "}
          <span className="text-primary">conversation</span>, not a form.
        </h1>
        <p className="mx-auto mt-4 max-w-xl animate-fadeUp text-lg text-ink/70 [animation-delay:120ms]">
          Just talk — in Urdu, Punjabi or Pashto. No reading, no app, no literacy needed.
        </p>

        {/* Stat strip */}
        <div className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-3 text-sm animate-fadeUp [animation-delay:240ms]">
          <Stat big="3.5M" small="women off the voter rolls" />
          <Stat big="26%" small="of women own a smartphone" />
          <Stat big="43% vs 52%" small="women vs men turnout, 2024" />
        </div>
      </section>

      {/* Voice widget card */}
      <section className="mt-10 flex-1">
        <div className="glass mx-auto max-w-3xl animate-fadeUp rounded-3xl border border-white/60 p-6 shadow-2xl [animation-delay:360ms] sm:p-10">
          <VoiceWidget />
        </div>
      </section>

      {/* Footer note */}
      <footer className="mt-10 text-center text-xs text-ink/40">
        Guidance only — always confirm with NADRA (1777) or the Election Commission of Pakistan.
        HumQadam is strictly non-partisan and never recommends any party or candidate.
      </footer>
    </main>
  );
}

function Stat({ big, small }: { big: string; small: string }) {
  return (
    <div className="glass rounded-2xl px-4 py-2 text-left">
      <div className="text-lg font-bold text-primary">{big}</div>
      <div className="text-xs text-ink/60">{small}</div>
    </div>
  );
}
