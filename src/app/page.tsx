import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-gradient-to-b from-brand-50 to-white">
      <span className="text-sm font-semibold tracking-wide text-brand-600 uppercase mb-3">
        Project LOOP
      </span>
      <h1 className="text-4xl sm:text-5xl font-bold max-w-2xl leading-tight">
        Turn scattered customer feedback into decisions your team can act on
      </h1>
      <p className="mt-4 max-w-xl text-gray-600">
        Collect feedback from every channel, let AI classify sentiment and themes
        automatically, and ask questions or generate Voice-of-Customer reports in seconds.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/signup"
          className="px-6 py-3 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 transition"
        >
          Get started free
        </Link>
        <Link
          href="/login"
          className="px-6 py-3 rounded-lg border border-gray-300 font-medium hover:bg-gray-100 transition"
        >
          Log in
        </Link>
      </div>
    </main>
  );
}
