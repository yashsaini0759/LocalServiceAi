export default function LoadingSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden animate-pulse">
          <div className="p-5 pb-3">
            <div className="flex gap-4">
              <div className="w-16 h-16 rounded-2xl bg-surface-container-high" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-4 bg-surface-container-high rounded-full w-3/4" />
                <div className="h-3 bg-surface-container rounded-full w-1/2" />
                <div className="flex gap-1 mt-1">
                  {[1,2,3,4,5].map(s => <div key={s} className="w-3 h-3 rounded-full bg-surface-container-high" />)}
                </div>
              </div>
            </div>
          </div>
          <div className="px-5 pb-3 flex gap-2">
            <div className="h-5 w-20 bg-surface-container rounded-full" />
            <div className="h-5 w-24 bg-surface-container rounded-full" />
          </div>
          <div className="px-5 pb-5">
            <div className="h-3 bg-surface-container rounded-full w-full mb-2" />
            <div className="h-3 bg-surface-container rounded-full w-2/3" />
          </div>
          <div className="px-5 pb-5 pt-3 border-t border-outline-variant/10 flex gap-2">
            <div className="h-10 flex-1 bg-surface-container rounded-xl" />
            <div className="h-10 flex-1 bg-primary/20 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
