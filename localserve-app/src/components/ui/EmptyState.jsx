export default function EmptyState({ icon = "search_off", title = "No results found", description = "Try adjusting your filters or search query.", action, actionLabel }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-on-surface-variant text-4xl">{icon}</span>
      </div>
      <h3 className="text-lg font-bold text-on-surface mb-2">{title}</h3>
      <p className="text-on-surface-variant text-sm max-w-xs leading-relaxed">{description}</p>
      {action && (
        <button
          onClick={action}
          className="mt-6 bg-primary text-on-primary px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-primary-dim transition-all hover:scale-95"
        >
          {actionLabel || "Try Again"}
        </button>
      )}
    </div>
  );
}
