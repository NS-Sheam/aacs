/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createAssignment } from "../lib/api";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-[380px] rounded-2xl bg-gray-100 animate-pulse" />
  ),
});

export default function UploadAssignment() {
  const router = useRouter();

  const [form, setForm] = useState({
    assignmentNo: "",
    batch: "",
    title: "",
    figmaUrl: "",
    jsonText: "",
  });

  const [preview, setPreview] = useState<Record<string, any> | null>(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [assignmentId, setAssignmentId] = useState("");
  const [completed, setCompleted] = useState(false);

  const stats = useMemo(() => {
    if (!preview) return null;

    return {
      sections: Object.keys(preview).length,

      requirements: Object.values(preview).reduce(
        (sum: any, item: any) => sum + Object.keys(item).length,
        0,
      ),
    };
  }, [preview]);

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function parseJSON() {
    setError("");

    try {
      const json = JSON.parse(form.jsonText);

      setPreview(json);
    } catch {
      setPreview(null);

      setError("Invalid JSON format. Please check your syntax.");
    }
  }

  async function submit() {
    if (!preview) return;

    setLoading(true);
    setError("");

    try {
      const res = await createAssignment({
        assignmentNo: Number(form.assignmentNo),

        batch: Number(form.batch),

        title: form.title,

        figmaUrl: form.figmaUrl || undefined,

        originalRequirements: preview,
      });

      if (!res.success)
        throw new Error(res.message || "Unable to create assignment");

      setAssignmentId(res.data.assignmentId);

      setCompleted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (completed) {
    return (
      <div
        className="
      min-h-screen
      bg-gradient-to-br
      from-gray-50
      via-white
      to-gray-100
      flex
      items-center
      justify-center
      px-6
      "
      >
        <div
          className="
      max-w-xl
      w-full
      bg-white
      border
      border-gray-200
      rounded-3xl
      shadow-[0_25px_70px_rgba(0,0,0,.08)]
      p-12
      text-center
      "
        >
          <div
            className="
      mx-auto
      w-20
      h-20
      rounded-full
      bg-green-50
      border
      border-green-100
      flex
      items-center
      justify-center
      text-green-600
      text-4xl
      "
          >
            ✓
          </div>

          <h2
            className="
      mt-7
      text-2xl
      font-semibold
      tracking-tight
      "
          >
            Assignment created
          </h2>

          <p
            className="
      mt-3
      text-gray-500
      leading-relaxed
      "
          >
            AI is preparing evaluation criteria. You can now add student
            submissions.
          </p>

          <div
            className="
      grid
      grid-cols-2
      gap-4
      mt-9
      "
          >
            <button
              onClick={() => router.push("/dashboard")}
              className="
      rounded-xl
      bg-black
      text-white
      py-3
      font-medium
      transition
      hover:bg-gray-800
      "
            >
              Dashboard
            </button>

            <button
              onClick={() =>
                router.push(`/submissions/new?assignmentId=${assignmentId}`)
              }
              className="
      rounded-xl
      border
      py-3
      font-medium
      transition
      hover:bg-gray-50
      "
            >
              Submissions
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="
  min-h-screen
  bg-gradient-to-br
  from-gray-50
  via-white
  to-gray-100
  px-6
  py-12
  "
    >
      <div
        className="
  max-w-5xl
  mx-auto
  space-y-10
  "
      >
        <div>
          <div
            className="
  flex
  items-center
  gap-4
  "
          >
            <div
              className="
  w-12
  h-12
  rounded-2xl
  bg-black
  text-white
  flex
  items-center
  justify-center
  text-xl
  font-semibold
  "
            >
              +
            </div>

            <div>
              <h1
                className="
  text-3xl
  font-semibold
  tracking-tight
  "
              >
                Create assignment
              </h1>

              <p
                className="
  text-gray-500
  mt-1
  "
              >
                Configure requirements and generate AI checking criteria.
              </p>
            </div>
          </div>
        </div>

        <div
          className="
  bg-white/80
  backdrop-blur-xl
  border
  border-gray-200
  rounded-3xl
  shadow-[0_20px_60px_rgba(0,0,0,.06)]
  p-10
  space-y-10
  "
        >
          <section>
            <div className="mb-6">
              <h3
                className="
  text-lg
  font-semibold
  "
              >
                Assignment details
              </h3>

              <p
                className="
  text-sm
  text-gray-500
  mt-1
  "
              >
                Basic information about this assignment.
              </p>
            </div>

            <div
              className="
  grid
  md:grid-cols-2
  gap-5
  "
            >
              <Input
                label="Assignment number"
                type="number"
                value={form.assignmentNo}
                onChange={(v: string) => update("assignmentNo", v)}
              />

              <Input
                label="Batch"
                type="number"
                value={form.batch}
                onChange={(v: string) => update("batch", v)}
              />
            </div>

            <div className="mt-5">
              <Input
                label="Title"
                value={form.title}
                placeholder="Focus App UI"
                onChange={(v: string) => update("title", v)}
              />
            </div>

            <div className="mt-5">
              <Input
                label="Figma URL"
                value={form.figmaUrl}
                placeholder="https://figma.com/..."
                onChange={(v: string) => update("figmaUrl", v)}
              />
            </div>
          </section>
          <section>
            <div
              className="
  flex
  justify-between
  items-center
  mb-4
  "
            >
              <div>
                <h3
                  className="
  text-lg
  font-semibold
  "
                >
                  Requirements JSON
                </h3>

                <p
                  className="
  text-sm
  text-gray-500
  mt-1
  "
                >
                  Define assignment requirements for AI evaluation.
                </p>
              </div>

              <span
                className="
  px-3
  py-1
  rounded-full
  bg-gray-100
  text-xs
  text-gray-500
  "
              >
                JSON Editor
              </span>
            </div>

            <div
              className="
  overflow-hidden
  rounded-2xl
  border
  border-gray-200
  bg-gray-50
  shadow-inner
  "
            >
              <MonacoEditor
                height="380px"
                language="json"
                theme="light"
                value={form.jsonText}
                onChange={(v) => update("jsonText", v || "")}
                options={{
                  minimap: {
                    enabled: false,
                  },

                  fontSize: 14,

                  padding: {
                    top: 16,
                  },

                  automaticLayout: true,

                  scrollBeyondLastLine: false,
                }}
              />
            </div>
          </section>

          {error && (
            <div
              className="
  rounded-xl
  border
  border-red-200
  bg-red-50
  text-red-700
  px-4
  py-3
  text-sm
  "
            >
              {error}
            </div>
          )}

          {!preview ? (
            <button
              onClick={parseJSON}
              className="
  w-full
  rounded-xl
  bg-black
  text-white
  py-3.5

  font-medium

  shadow-lg
  shadow-black/10

  transition

  hover:-translate-y-0.5
  hover:shadow-xl

  "
            >
              Validate JSON
            </button>
          ) : (
            <div
              className="
  space-y-6
  "
            >
              <div
                className="
  grid
  grid-cols-2
  gap-5
  "
              >
                <Stat title="Sections" value={stats?.sections} />

                <Stat title="Requirements" value={stats?.requirements} />
              </div>

              <div
                className="
  rounded-2xl
  border
  border-gray-200
  overflow-hidden
  "
              >
                <div
                  className="px-5 py-3 bg-gray-50 border-b text-sm font-medium"
                >
                  Requirement overview
                </div>

                {Object.entries(preview).map(([key, value]: any) => (
                  <div
                    key={key}
                    className="flex items-center justify-between px-5 py-4 text-sm border-b last:border-b-0 hover:bg-gray-50 transition"
                  >
                    <div>
                      <p
                        className="font-medium"
                      >
                        {key}
                      </p>

                      <p
                        className="text-xs text-gray-400 mt-1"
                      >
                        Evaluation group
                      </p>
                    </div>

                    <span
                      className="rounded-full bg-gray-100 px-3 py-1  text-xs text-gray-600"
                    >
                      {Object.keys(value).length}
                      items
                    </span>
                  </div>
                ))}
              </div>

              <div
                className="flex gap-4"
              >
                <button
                  disabled={loading}
                  onClick={submit}
                  className="flex-1 rounded-xl  bg-black text-white py-3.5 font-medium shadow-lg shadow-black/10 transition hover:-translate-y-0.5 disabled:opacity-50 "
                >
                  {loading ? "Creating..." : "Create assignment"}
                </button>

                <button
                  onClick={() => setPreview(null)}
                  className="px-8 rounded-xl  border border-gray-200  font-medium hover:bg-gray-50 transition"
                >
                  Edit
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text" }: any) {
  return (
    <div
      className="
space-y-2
"
    >
      <label
        className="
text-sm
font-medium
text-gray-700
"
      >
        {label}
      </label>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm transition placeholder:text-gray-400 focus:outline-none focus:border-black focus:ring-4 focus:ring-black/5

"
      />
    </div>
  );
}

function Stat({ title, value }: any) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-gray-200 bg-linear-to-br from-white to-gray-50 p-5"
    >
      <div
        className="absolute right-0 top-0 w-24 h-24 rounded-full bg-black/5 blur-2xl"
      />

      <p
        className="relative text-xs uppercase tracking-wider text-gray-500"
      >
        {title}
      </p>

      <p
        className="relative mt-2 text-3xl font-semibold tracking-tight"
      >
        {value}
      </p>
    </div>
  );
}
