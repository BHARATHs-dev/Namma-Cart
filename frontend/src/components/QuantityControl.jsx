export default function QuantityControl({ value, max = 99, onChange }) {
  return <div className="quantity"><button aria-label="Decrease quantity" onClick={() => onChange(Math.max(1, value - 1))}>−</button><span>{value}</span><button aria-label="Increase quantity" disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}>＋</button></div>;
}
