import ExportForm from "./exportForm";

export default function ExportPage() {
  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-6xl px-8 py-14">

        <div className="mb-12">
          <span className="rounded-full border border-slate-200 bg-white px-4 py-1 text-xs font-medium text-slate-600 shadow-sm">
            Instructor Portal
          </span>

          <h1 className="mt-5 text-5xl font-bold tracking-tight text-slate-900">
            Export Assignment
          </h1>

          <p className="mt-4 max-w-2xl text-slate-500 text-lg leading-8">
            Export a submission into the instructor portal JSON format.
            Responses are validated and automatically formatted.
          </p>
        </div>

        <ExportForm />
      </div>
    </main>
  );
}