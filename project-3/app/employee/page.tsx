export default function EmployeePage() {
  return (
    <main className="min-h-screen bg-[#eef1ec] px-6 py-10 text-[#1f2520]">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-4xl flex-col justify-center rounded-[28px] border border-[#c8d1c4] bg-[#f8faf7] p-8 shadow-[0_18px_48px_rgba(31,37,32,0.08)] sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#5d6b5e]">
          Team Matcha POS
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Employee View
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[#4c584d] sm:text-lg">
          This screen is reserved for employee order handling and day-to-day POS
          tasks.
        </p>
      </section>
    </main>
  );
}
