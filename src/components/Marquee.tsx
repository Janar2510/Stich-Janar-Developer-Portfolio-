interface MarqueeProps {
  items: string[];
}

function Track({ items, ariaHidden = false }: { items: string[]; ariaHidden?: boolean }) {
  return (
    <span aria-hidden={ariaHidden || undefined}>
      {items.map((item) => (
        <span key={item} className="inline-flex items-center">
          <span className="lbl text-accent px-8">{item}</span>
          <span className="lbl text-zinc-700 px-2">—</span>
        </span>
      ))}
    </span>
  );
}

export default function Marquee({ items }: MarqueeProps) {
  return (
    <div className="bg-zinc-950 border-y border-zinc-900 py-4 marquee-wrap">
      <div className="marquee-track">
        <Track items={items} />
        {/* Duplicate for the seamless loop — hidden from screen readers */}
        <Track items={items} ariaHidden />
      </div>
    </div>
  );
}
