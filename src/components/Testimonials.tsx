import { StaggerReveal, StaggerItem } from "@/components/Reveal";

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
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

  return (
    <section className="py-40 px-8 bg-zinc-950">
      <div className="max-w-[1440px] mx-auto">
        <div className="lbl text-accent mb-4">{badge}</div>
        <h2 className="font-manrope font-bold text-4xl md:text-5xl uppercase tracking-tight text-white mb-20">
          {heading}
        </h2>
        <StaggerReveal className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-900">
          {items.map((t) => (
            <StaggerItem key={t.name}>
              <div className="bg-black p-10 h-full flex flex-col">
                <span className="material-symbols-outlined text-accent text-3xl mb-6 block">format_quote</span>
                <p className="text-zinc-300 leading-relaxed flex-1 mb-8">&quot;{t.quote}&quot;</p>
                <div>
                  <div className="font-manrope font-bold text-white">{t.name}</div>
                  <div className="lbl text-zinc-600 mt-1">{t.role}</div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerReveal>
      </div>
    </section>
  );
}
