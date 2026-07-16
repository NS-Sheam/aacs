import SubmissionForm from "./submissionForm";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ assignmentId?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen flex justify-center bg-linear-to-br from-slate-50 via-white to-gray-100">
      <div className="mx-auto max-w-7xl px-8 py-20">

        <div className="max-w-2xl mb-10">
          <p className="text-sm font-medium text-gray-500 tracking-widest uppercase">
            Make submission
          </p>

          <h1 className="mt-3 text-5xl font-bold tracking-tight text-gray-900">
            Submit Assignment
          </h1>

          <p className="mt-5 text-lg leading-8 text-gray-500">
            Upload your project links for instructor review. Ensure both the
            live deployment and GitHub repository are accessible.
          </p>
        </div>

        <SubmissionForm assignmentId={params.assignmentId || ""} />

      </div>
    </main>
  );
}