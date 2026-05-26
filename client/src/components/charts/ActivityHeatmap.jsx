export default function ActivityHeatmap({ data = [] }) {
  if (!data.length) return <div className="empty-state"><p>No activity data</p></div>;
  const max = Math.max(...data.map(d => d.completed), 1);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${data.length}, 1fr)`, gap: 6 }}>
        {data.map((day, i) => {
          const intensity = day.completed / max;
          const bg = intensity === 0
            ? 'var(--surface-3)'
            : `rgba(92, 74, 228, ${0.2 + intensity * 0.8})`;
          return (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 4 }}>{day.dayName}</div>
              <div
                style={{
                  aspectRatio: '1', borderRadius: 'var(--radius-sm)', background: bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem', fontWeight: 600, color: intensity > 0.4 ? 'white' : 'var(--text-muted)',
                  transition: 'all 0.3s', cursor: 'default',
                  border: day.dayName === new Date().toLocaleDateString('en-US', { weekday: 'short' }) ? '2px solid var(--gold)' : '1px solid var(--border)',
                }}
                title={`${day.completed} tasks completed, ${day.hours?.toFixed(1) || 0}h`}
              >
                {day.completed}
              </div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {day.hours?.toFixed(1) || 0}h
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 12, fontSize: '0.6rem', color: 'var(--text-muted)' }}>
        <span>Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
          <div key={i} style={{ width: 12, height: 12, borderRadius: 2, background: v === 0 ? 'var(--surface-3)' : `rgba(92, 74, 228, ${0.2 + v * 0.8})` }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
