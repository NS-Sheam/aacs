import Link from "next/link";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ExternalLink,
  FileText,
  GitBranch,
  GitCommit,
  Lock,
  ShieldCheck,
} from "lucide-react";
import Stat from "./submissions/mectricCard";
import { GitHubCheckResult } from "@/types";



interface GitHubWidgetProps {
  metrics: GitHubCheckResult;
  githubUrl: string;
}

const GitHubWidget = ({
  metrics,
  githubUrl,
}: GitHubWidgetProps) => {
  const formatDate = (date?: string | null) => {
    if (!date) return "--";

    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const repoName = githubUrl.replace(
    "https://github.com/",
    ""
  );

  const healthy =
    !metrics.commitSpreadFlag &&
    metrics.repoExists;

  if (!metrics.repoExists) {
    return (
      <div className="rounded-3xl bg-white p-8 shadow-[0_10px_40px_rgba(15,23,42,.08)] ring-1 ring-slate-200">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-800 shadow-lg">
            <GitBranch className="h-7 w-7 text-white" />
          </div>

          <div>
            <h2 className="text-xl font-semibold ">
              GitHub Repository
            </h2>

            <p className="text-sm text-slate-500">
              {repoName}
            </p>
          </div>
        </div>

        <div className="mt-10 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />

          <h3 className="mt-4 text-lg font-semibold text-slate-900">
            Repository unavailable
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            {metrics.error ||
              "Unable to fetch repository information."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-l-4 border-blue-900 overflow-hidden rounded-3xl bg-linear-to-b from-white to-slate-50 shadow-[0_10px_40px_rgba(15,23,42,.08)] ring-1 ring-slate-200">

      <div className="flex flex-col gap-6 p-8 lg:flex-row lg:items-center lg:justify-between">

        <div className="flex items-center gap-4">

          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-blue-950 to-blue-700 shadow-lg">
            <GitBranch className="h-8 w-8 text-white" />
          </div>


          <div>
            <h2 className="text-2xl font-semibold tracking-tight ">
              GitHub Repository
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              github.com/{repoName}
            </p>
          </div>

        </div>


        <div className="flex items-center gap-3">

          <span
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${
              healthy
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                healthy
                  ? "bg-emerald-500"
                  : "bg-amber-500"
              }`}
            />

            {healthy ? "Healthy" : "Needs Review"}
          </span>


          <Link
            href={githubUrl}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-900"
          >
            Repository
            <ExternalLink className="h-4 w-4" />
          </Link>

        </div>

      </div>


      {metrics.isPrivate && (
        <div className="mx-8 mb-6 flex gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-200">
          <Lock className="h-5 w-5 text-amber-600" />

          <div>
            <p className="font-medium">
              Private repository
            </p>

            <p>
              Repository visibility is restricted.
            </p>
          </div>
        </div>
      )}



      <div className="grid grid-cols-2 gap-px overflow-hidden bg-slate-200 mx-8 rounded-2xl lg:grid-cols-4">

        <Stat
          icon={<GitCommit />}
          title="Commits"
          value={metrics.totalCommits}
        />

        <Stat
          icon={<Calendar />}
          title="Last Commit"
          value={formatDate(metrics.lastCommitDate)}
        />

        <Stat
          icon={<FileText />}
          title="README"
          value={metrics.hasReadme ? "Present" : "Missing"}
        />

        <Stat
          icon={<ShieldCheck />}
          title="Status"
          value={healthy ? "Verified" : "Review"}
        />

      </div>



      <div className="mx-8 mt-8 rounded-2xl bg-white p-6 ring-1 ring-slate-200">

        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Latest Commit
        </p>


        <h3 className="mt-3 text-lg font-semibold text-slate-900">
          {metrics.lastCommitMessage || "--"}
        </h3>


        <p className="mt-2 text-sm text-slate-500">
          {formatDate(metrics.lastCommitDate)}
        </p>

      </div>



      <div className="p-8">

        {healthy ? (

          <div className="flex gap-4 rounded-2xl bg-emerald-50 p-6 ring-1 ring-emerald-200">

            <CheckCircle2 className="h-6 w-6 text-emerald-600"/>

            <div>
              <h3 className="font-semibold text-emerald-900">
                Repository looks healthy
              </h3>

              <p className="mt-1 text-sm text-emerald-700">
                No suspicious commit patterns detected.
              </p>
            </div>

          </div>

        ) : (

          <div className="flex gap-4 rounded-2xl bg-amber-50 p-6 ring-1 ring-amber-200">

            <AlertTriangle className="h-6 w-6 text-amber-600"/>

            <div>

              <h3 className="font-semibold text-amber-900">
                Manual review recommended
              </h3>


              <ul className="mt-3 space-y-1 text-sm text-amber-700">

                {metrics.totalCommits < 3 && (
                  <li>
                    • Less than 3 commits found
                  </li>
                )}

                {metrics.allCommitsSameDay && (
                  <li>
                    • All commits happened on the same day
                  </li>
                )}

                {!metrics.hasReadme && (
                  <li>
                    • README file missing
                  </li>
                )}

              </ul>

            </div>

          </div>

        )}

      </div>

    </div>
  );
};





export default GitHubWidget;