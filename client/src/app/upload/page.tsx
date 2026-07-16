
import UploadAssignment from "./upload";

export const metadata = {
  title: "Create Assignment",
};

export default function NewAssignmentPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <UploadAssignment />
      </div>
    </main>
  );
}