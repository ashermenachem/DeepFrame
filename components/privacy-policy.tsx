import { privacySections } from '@/lib/legal';

export function PrivacyPolicy({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? 'space-y-5' : 'space-y-8'}>
      {privacySections.map((section) => (
        <section key={section.title}>
          <h2
            className={
              compact
                ? 'text-[12px] font-semibold text-white/80'
                : 'text-xl font-semibold tracking-[-0.025em] text-white/90'
            }
          >
            {section.title}
          </h2>
          <div
            className={
              compact
                ? 'mt-2 space-y-2 text-[10px] leading-5 text-white/40'
                : 'mt-3 space-y-3 text-sm leading-7 text-white/45'
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
