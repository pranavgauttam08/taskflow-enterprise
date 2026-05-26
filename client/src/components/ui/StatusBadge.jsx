import { STATUS_CONFIG } from '../../utils/constants';

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <span
      className={`badge ${status === 'COMPLETED' ? 'badge-success' : status === 'NOT_COMPLETED' ? 'badge-danger' : 'badge-warning'}`}
      style={{ flexShrink: 0 }}
    >
      {status === 'COMPLETED' ? '✓ ' : status === 'NOT_COMPLETED' ? '✕ ' : '◷ '}
      {config.label}
    </span>
  );
}
