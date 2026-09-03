import { termsSections } from '@/lib/legal';

export function LegalTerms({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? 'space-y-6' : 'space-y-8'}>
      {termsSections.map((section) => (
        <section key={section.title}>
          <h2
            className={
              compact
                ? 'text-sm font-semibold tracking-[-0.02em] text-white/88'
                : 'text-xl font-semibold tracking-[-0.03em] text-white'
            }
          >
            {section.title}
          </h2>
          <div
            className={
              compact
                ? 'mt-2 space-y-2 text-[11px] leading-5 text-white/46'
                : 'mt-3 space-y-3 text-sm leading-7 text-white/52'
            }
          >
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
