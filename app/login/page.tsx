import { AuthPanel } from '@/components/auth-panel';

export default function LoginPage() {
  return (
    <main className="relative grid min-h-[100svh] place-items-center overflow-hidden bg-[#03040a] px-4 py-10">
      <div className="hero-grid absolute inset-0 opacity-35" />
      <div className="absolute left-1/2 top-1/2 size-[min(90vw,50rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/[0.08] blur-[110px]" />
      <div className="relative z-10 w-full max-w-md"><AuthPanel /></div>
    </main>
  );
}
