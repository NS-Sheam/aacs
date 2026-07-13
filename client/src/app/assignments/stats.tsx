interface DashboardStat {
  name: string;
  value: number;
}

interface StatsProps {
  stats: DashboardStat[];
}

const cardStyles: Record<
  string,
  {
    border: string;
    text: string;
    value: string;
    subtext: string;
  }
> = {
  "Total Assignments": {
    border: "border-slate-200",
    text: "text-slate-600",
    value: "text-slate-900",
    subtext: "Total assignments",
  },
  "Total Submissions": {
    border: "border-purple-200",
    text: "text-purple-700",
    value: "text-purple-600",
    subtext: "Student submissions",
  },
  Active: {
    border: "border-emerald-200",
    text: "text-emerald-700",
    value: "text-emerald-600",
    subtext: "Currently active",
  },
  Draft: {
    border: "border-amber-200",
    text: "text-amber-700",
    value: "text-amber-600",
    subtext: "Draft assignments",
  },
};

export default function Stats({ stats }: StatsProps) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const style = cardStyles[stat.name];

        return (
          <div
            key={stat.name}
            className={`rounded-lg border ${style.border} bg-white p-6 shadow-sm transition-shadow hover:shadow-md`}
          >
            <p className={`text-sm font-medium ${style.text}`}>
              {stat.name}
            </p>

            <p className={`mt-2 text-3xl font-bold ${style.value}`}>
              {stat.value}
            </p>

            <p className={`mt-1 text-xs ${style.text}`}>
              {style.subtext}
            </p>
          </div>
        );
      })}
    </div>
  );
}