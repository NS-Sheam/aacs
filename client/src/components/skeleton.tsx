type SkeletonProps = React.HTMLAttributes<HTMLDivElement>

const Skeleton=({
  className = "",
  ...props
}: SkeletonProps) =>{
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200 ${className}`}
      {...props}
    />
  );
}
export default Skeleton;