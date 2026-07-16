const Stat = ({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: React.ReactNode;
}) => (
  <div className="bg-white p-5">

    <div className="flex items-center gap-2 text-slate-400">
      <span className="h-5 w-5">
        {icon}
      </span>

      <span className="text-sm">
        {title}
      </span>
    </div>


    <p className="mt-3 text-xl font-semibold text-slate-900">
      {value}
    </p>

  </div>
);
export default Stat;