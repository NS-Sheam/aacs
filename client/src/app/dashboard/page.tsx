import StatsCard from "@/components/dashboard/statsCard";
import { SubmissionsList } from "@/components/dashboard/submissionList";
import { Activity, CheckCircle2, AlertCircle, XCircle } from 'lucide-react'

const stats = {
  total: 100,
  autoChecked: 60,
  needsReview: 30,
  failed: 10,
};



const Dashboard = () => {
    const forcedelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    forcedelay(50000);
    return (
       <main className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600 mt-2">Real-time assignment submission tracking and automated checking status</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard
              label="Total Submissions"
              value={stats.total}
              icon={<Activity />}
              color="blue"
              description={`across all assignments`}
            />
            <StatsCard
              label="Auto-Checked"
              value={stats.autoChecked}
              icon={<CheckCircle2 />}
              color="green"
              description={`${Math.round((stats.autoChecked / stats.total) * 100)}% completed`}
            />
            <StatsCard
              label="Needs Review"
              value={stats.needsReview}
              icon={<AlertCircle />}
              color="amber"
              description={`awaiting instructor approval`}
            />
            <StatsCard
              label="Failed"
              value={stats.failed}
              icon={<XCircle />}
              color="red"
              description={`require attention`}
            />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">Recent Submissions</h2>
              <p className="text-sm text-slate-600 mt-1">Click on any submission to view detailed check results</p>
            </div>

            <SubmissionsList/>
          </div>
        </div>
      </main>
    );
};

export default Dashboard;