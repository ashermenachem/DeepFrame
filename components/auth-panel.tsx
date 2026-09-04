'use client';

import { useEffect, useState, type SyntheticEvent } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  GitBranch,
  LockKeyhole,
  Mail,
  ShieldCheck,
  X,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DeepFrameLogo } from '@/components/deepframe-logo';
import { useAuth } from '@/components/auth-provider';

export function AuthPanel({ onClose }: { onClose?: () => void }) {
  const reduceMotion = useReducedMotion();
  const { signInWithEmail, signInWithOAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(() => {
    if (typeof window === 'undefined') return 0;
    const storedUntil = Number(
      window.localStorage.getItem('deepframe-email-cooldown') ?? 0,
    );
    return Math.max(0, Math.ceil((storedUntil - Date.now()) / 1_000));
  });
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true';
  const githubEnabled = process.env.NEXT_PUBLIC_GITHUB_AUTH_ENABLED === 'true';

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((current) => {
        const next = Math.max(0, current - 1);
        if (next === 0) {
          window.localStorage.removeItem('deepframe-email-cooldown');
        }
        return next;
      });
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const emailSignIn = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (cooldown > 0) return;
    setBusy(true);
    setMessage(null);
    try {
      setMessage(await signInWithEmail(email, username || undefined));
      const cooldownUntil = Date.now() + 60_000;
      window.localStorage.setItem(
        'deepframe-email-cooldown',
        String(cooldownUntil),
      );
      setCooldown(60);
    } catch (reason) {
      const nextMessage =
        reason instanceof Error ? reason.message : 'Sign-in failed.';
      setMessage(nextMessage);
      if (nextMessage.includes('temporarily busy')) {
        const cooldownUntil = Date.now() + 60_000;
        window.localStorage.setItem(
          'deepframe-email-cooldown',
          String(cooldownUntil),
        );
        setCooldown(60);
      }
    } finally {
      setBusy(false);
    }
  };

  const oauth = async (provider: 'google' | 'github') => {
    setBusy(true);
    setMessage(null);
    try {
      await signInWithOAuth(provider);
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Sign-in failed.');
      setBusy(false);
    }
  };

  return (
    <motion.section
      aria-labelledby="account-title"
      className="glass-panel relative w-full max-w-md overflow-hidden rounded-[2rem] p-6 shadow-[0_36px_120px_rgba(0,0,0,.65)] sm:p-8"
      initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
    >
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close sign in"
          className="absolute right-5 top-5 grid size-8 place-items-center rounded-full border border-white/10 text-white/45 transition hover:text-white"
        >
          <X className="size-4" />
        </button>
      ) : null}
      <DeepFrameLogo />
      <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-cyan-100/12 bg-cyan-100/[0.045] px-3 py-1.5 font-mono text-[8px] uppercase tracking-[0.18em] text-cyan-100/65">
        <LockKeyhole className="size-3" /> Private account
      </div>
      <h1
        id="account-title"
        className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white"
      >
        Save your photo history.
      </h1>
      <p className="mt-3 text-sm leading-6 text-white/45">
        Sign in to inspect photos, keep reports across devices, and manage your
        data. DeepFrame never stores your password.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          disabled={busy || !googleEnabled}
          onClick={() => void oauth('google')}
          className="h-11 rounded-xl border-white/10 bg-white/[0.035] text-white/70 disabled:text-white/25"
        >
          <span className="font-semibold">G</span>{' '}
          {googleEnabled ? 'Google' : 'Google soon'}
        </Button>
        <Button
          variant="outline"
          disabled={busy || !githubEnabled}
          onClick={() => void oauth('github')}
          className="h-11 rounded-xl border-white/10 bg-white/[0.035] text-white/70 disabled:text-white/25"
        >
          <GitBranch className="size-4" />{' '}
          {githubEnabled ? 'GitHub' : 'GitHub soon'}
        </Button>
      </div>

      <div className="my-5 flex items-center gap-3 text-[9px] uppercase tracking-[0.16em] text-white/22">
        <span className="h-px flex-1 bg-white/[0.07]" /> or use email{' '}
        <span className="h-px flex-1 bg-white/[0.07]" />
      </div>

      <form onSubmit={emailSignIn} className="space-y-3">
        <Input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Username for new accounts"
          autoComplete="username"
          className="h-11 border-white/10 bg-black/20"
        />
        <Input
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          type="email"
          autoComplete="email"
          className="h-11 border-white/10 bg-black/20"
        />
        <Button
          type="submit"
          disabled={busy || cooldown > 0}
          className="h-11 w-full rounded-xl bg-white font-semibold text-[#070810] hover:bg-cyan-50"
        >
          <Mail className="size-4" />{' '}
          {busy
            ? 'Connecting…'
            : cooldown > 0
              ? `Send again in ${cooldown}s`
              : 'Email me a sign-in link'}{' '}
          <ArrowRight className="ml-auto size-4" />
        </Button>
      </form>

      {message ? (
        <p
          role="status"
          className="mt-4 rounded-xl border border-cyan-100/10 bg-cyan-100/[0.04] px-3 py-2 text-xs text-cyan-50/70"
        >
          {message}
        </p>
      ) : null}

      <div className="mt-6 flex gap-2 text-[10px] leading-5 text-white/30">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-200/65" />
        <p>
          Continuing means you accept the{' '}
          <Link href="/terms" className="text-white/55 hover:text-white">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-white/55 hover:text-white">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </motion.section>
  );
}
