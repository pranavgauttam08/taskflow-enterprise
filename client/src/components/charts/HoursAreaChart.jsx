import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
      padding: '0.75rem 1rem', fontSize: '0.8rem',
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Day {label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
          <span>{p.name}:</span>
          <span style={{ fontWeight: 600 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function HoursAreaChart({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="gradAssigned" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#5C4AE4" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#5C4AE4" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10D9A0" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10D9A0" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
        <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '0.75rem', color: 'var(--text-muted)' }} />
        <Area type="monotone" dataKey="assigned" name="Assigned" stroke="#5C4AE4" fill="url(#gradAssigned)" strokeWidth={2} dot={false} animationDuration={1500} />
        <Area type="monotone" dataKey="completed" name="Completed" stroke="#10D9A0" fill="url(#gradCompleted)" strokeWidth={2} dot={false} animationDuration={1500} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
