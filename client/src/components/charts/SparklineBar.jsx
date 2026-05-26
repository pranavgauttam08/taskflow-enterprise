export default function SparklineBar({ data = [], height = 32, color = 'var(--accent)' }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height }}>
      {data.map((val, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: `${(val / max) * 100}%`,
            minHeight: 3,
            background: `linear-gradient(to top, ${color}, var(--accent-bright))`,
            borderRadius: 2,
            opacity: 0.7 + (val / max) * 0.3,
            transition: 'height 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      ))}
    </div>
  );
}
