import Image from "next/image";
import { StaggerReveal, StaggerItem } from "@/components/Reveal";

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  image?: string;
}

interface TestimonialsProps {
  badge: string;
  heading: string;
  items: Testimonial[];
}

// Renders nothing until real testimonials exist in the dictionary — no
// placeholder/lorem-ipsum cards. Add entries to `home.testimonials.items`
// (or wherever this is used) in both et.json and en.json and this section
// appears automatically.
export default function Testimonials({ badge, heading, items }: TestimonialsProps) {
  if (!items || items.length === 0) return null;

  // Track the item count so a single quote doesn't leave empty grid cells
  // showing the zinc-900 gap colour as dead panels.
  const columns =
    items.length === 1
      ? "max-w-2xl"
      : items.length === 2
        ? "md:grid-cols-2"
        : "md:grid-cols-2 lg:grid-cols-3";

  return (
    <section id="testimonials" className="py-40 px-8 bg-zinc-950">
      <div className="max-w-[1440px] mx-auto">
        <div className="lbl text-accent mb-4">{badge}</div>
        <h2 className="font-manrope font-bold text-4xl md:text-5xl uppercase tracking-tight text-white mb-20">
          {heading}
        </h2>
        <StaggerReveal className={`grid ${columns} gap-px bg-zinc-900`}>
          {items.map((t) => (
            <StaggerItem key={t.name}>
              <div className="bg-black p-10 h-full flex flex-col">
                <span className="material-symbols-outlined text-accent text-3xl mb-6 block">format_quote</span>
                <p className="text-zinc-300 leading-relaxed flex-1 mb-8">&quot;{t.quote}&quot;</p>
                <div className="flex items-center gap-4">
                  {t.image && (
                    <Image
                      src={t.image}
                      alt={t.name}
                      width={96}
                      height={96}
                      className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover shrink-0 grayscale"
                    />
                  )}
                  <div>
                    <div className="font-manrope font-bold text-white">{t.name}</div>
                    <div className="lbl text-zinc-600 mt-1">{t.role}</div>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerReveal>
      </div>
    </section>
  );
}
