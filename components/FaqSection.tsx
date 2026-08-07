import Reveal from "./Reveal";
import { faqs } from "@/lib/faq";

export default function FaqSection() {
  return (
    <section id="faq" className="container-hud py-12 md:py-20">
      <Reveal>
        <span className="font-hud text-xs uppercase tracking-[0.2em] text-phosphor-dim">FAQ</span>
        <h2 className="font-display mt-3 max-w-xl text-3xl font-semibold text-ink md:text-4xl">
          Questions worth answering up front
        </h2>
      </Reveal>

      <div className="mt-8 divide-y divide-line overflow-hidden rounded-2xl border border-line">
        {faqs.map((item) => (
          <details key={item.q} className="group px-5 py-4 transition-colors open:bg-phosphor/[0.03] hover:bg-white/[0.02]">
            <summary className="font-display flex cursor-pointer list-none items-center justify-between text-base font-medium text-ink marker:content-none">
              {item.q}
              <span className="font-hud ml-4 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line text-phosphor-dim transition-all group-open:rotate-45 group-open:border-phosphor group-open:text-phosphor">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
