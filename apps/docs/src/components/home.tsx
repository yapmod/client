import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { Card, Cards } from 'fumadocs-ui/components/card';
import {
  ArrowRight,
  BookOpen,
  Bug,
  Code,
  Layers,
  Lightbulb,
  MessageCircle,
  Palette,
  Puzzle,
  Settings as SettingsIcon,
  Shield,
  Sparkles,
  Terminal,
  Users,
} from 'lucide-react';
import { Provider, type ProviderProps } from '@/components/provider';
import { baseOptions } from '@/lib/layout.shared';

export interface HomeProps extends ProviderProps {
  children?: React.ReactNode;
}

// Gradient accent inspired by the yapmod website (pink → rose → light pink)
const ACCENT_GRADIENT = 'linear-gradient(135deg, #dd5a8c 0%, #e87da6 55%, #f2a3c5 100%)';

function GradientText({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={className}
      style={{
        background: ACCENT_GRADIENT,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}
    >
      {children}
    </span>
  );
}

function GradientButton({
  href,
  children,
  target,
  rel,
}: {
  href: string;
  children: React.ReactNode;
  target?: string;
  rel?: string;
}) {
  return (
    <a
      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-6 font-semibold text-white"
      href={href}
      target={target}
      rel={rel}
      style={{
        background: ACCENT_GRADIENT,
        color: '#1a0f16',
      }}
    >
      {children}
    </a>
  );
}

function OutlineButton({
  href,
  children,
  target,
  rel,
}: {
  href: string;
  children: React.ReactNode;
  target?: string;
  rel?: string;
}) {
  return (
    <a
      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-fd-border bg-fd-background px-6 font-semibold text-fd-foreground"
      href={href}
      target={target}
      rel={rel}
    >
      {children}
    </a>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-fd-border bg-fd-secondary/50 p-8">
      <div
        className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl"
        style={{ background: ACCENT_GRADIENT }}
      >
        {icon}
      </div>
      <h3 className="mb-2 text-xl font-bold">{title}</h3>
      <p className="text-fd-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

export function Home({ ...props }: HomeProps) {
  return (
    <Provider {...props}>
      <HomeLayout {...baseOptions()}>
        {/* Grid background glow */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[60vh] opacity-30"
          style={{
            background: 'radial-gradient(55% 60% at 72% 46%, #dd5a8c38, transparent 72%)',
            maskImage: 'linear-gradient(#0000 0%, #000 14% 74%, #0000 100%)',
            WebkitMaskImage: 'linear-gradient(#0000 0%, #000 14% 74%, #0000 100%)',
          }}
        />

        {/* Hero Section */}
        <section className="relative flex flex-col items-center text-center pt-32 pb-36 px-4">
          <div className="z-10">
            <h1 className="mb-6 text-5xl font-extrabold leading-[0.98] tracking-tight md:text-7xl lg:text-8xl">
              Yapin, made <GradientText>yours</GradientText>
              <span className="text-fd-foreground/30">.</span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-fd-muted-foreground md:text-xl">
              A free, open-source client mod for{' '}
              <a
                href="https://yapin.com"
                target="_blank"
                rel="noreferrer noopener"
                className="underline decoration-fd-accent/50 underline-offset-4"
              >
                Yapin
              </a>
              . Install themes, write plugins, and make it your own — all in one self-contained
              bundle.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <GradientButton href="/docs">
                <ArrowRight size={18} />
                Get Started
              </GradientButton>
              <OutlineButton
                href="https://github.com/yapmod/client"
                target="_blank"
                rel="noreferrer noopener"
              >
                <BookOpen size={18} />
                See the source
              </OutlineButton>
            </div>
            <p className="mt-5 text-sm text-fd-muted-foreground">
              Free and open-source · MIT License
            </p>
          </div>
        </section>

        {/* Why Yapmod — Feature Columns */}
        <section className="py-20 px-4">
          <div className="mx-auto max-w-(--fd-layout-width)">
            <h2 className="mb-4 text-3xl font-extrabold tracking-tight md:text-5xl">
              Its own mod, <GradientText>open to everyone</GradientText>
              <span className="text-fd-foreground/30">.</span>
            </h2>
            <p className="mb-12 max-w-3xl text-lg text-fd-muted-foreground">
              Yapmod gives Yapin a customizable client-side layer and keeps the whole project
              public, so the community can shape it.
            </p>
            <div className="grid gap-5 md:grid-cols-3">
              <FeatureCard
                icon={<Palette className="h-6 w-6 text-white" />}
                title="Make it yours"
                description="Choose a theme or create your own with CSS. Your settings and themes stay on your computer, persisted in localStorage."
              />
              <FeatureCard
                icon={<Code className="h-6 w-6 text-white" />}
                title="Extend with plugins"
                description="Write client-side plugins as plain JavaScript expressions. Evaluate them safely under CSP with no eval() or new Function()."
              />
              <FeatureCard
                icon={<Layers className="h-6 w-6 text-white" />}
                title="One bundle, zero config"
                description="A single IIFE file, injected into the live page. No build step on the host side. Works out of the box."
              />
            </div>
          </div>
        </section>

        {/* How It Works — Steps */}
        <section className="py-20 px-4">
          <div className="mx-auto max-w-(--fd-layout-width)">
            <h2 className="mb-4 text-3xl font-extrabold tracking-tight md:text-5xl">
              How it <GradientText>works</GradientText>
              <span className="text-fd-foreground/30">.</span>
            </h2>
            <p className="mb-12 max-w-3xl text-lg text-fd-muted-foreground">
              Three steps from zero to a customized Yapin.
            </p>
            <Cards>
              <Card title="1. Build" icon={<Terminal />}>
                Run <code>pnpm dev</code> or <code>pnpm build</code> to produce a single{' '}
                <code>yapmod-client.js</code> file in <code>apps/client/dist/</code>.
              </Card>
              <Card title="2. Inject" icon={<Sparkles />}>
                Paste the bundle into the browser console on Yapin or load it via a{' '}
                <code>&lt;script&gt;</code> tag. The bootstrap runs on import and installs all
                features.
              </Card>
              <Card title="3. Customize" icon={<SettingsIcon />}>
                Open the settings panel, upload themes, write plugins, and toggle features — all
                from the Yapmod UI inside Yapin.
              </Card>
            </Cards>
          </div>
        </section>

        {/* Architecture Highlights */}
        <section className="py-20 px-4">
          <div className="mx-auto max-w-(--fd-layout-width)">
            <h2 className="mb-4 text-3xl font-extrabold tracking-tight md:text-5xl">
              Built for the <GradientText>real world</GradientText>
              <span className="text-fd-foreground/30">.</span>
            </h2>
            <p className="mb-12 max-w-3xl text-lg text-fd-muted-foreground">
              Designed around Yapin's constraints from day one.
            </p>
            <div className="grid gap-5 md:grid-cols-3">
              <FeatureCard
                icon={<Shield className="h-6 w-6 text-white" />}
                title="CSP-Safe"
                description="No eval, no new Function. Plugins run through a temporary inline &lt;script&gt; element. External stylesheets are fetched and inlined."
              />
              <FeatureCard
                icon={<SettingsIcon className="h-6 w-6 text-white" />}
                title="React-Aware"
                description="Yapin replaces DOM nodes. Yapmod uses scoped MutationObservers and structural attributes to keep its UI attached without stale framework state."
              />
              <FeatureCard
                icon={<Puzzle className="h-6 w-6 text-white" />}
                title="Disposable"
                description="Every feature registers cleanup with client.onDispose(). Calling YapmodClient.dispose() tears everything down in one shot."
              />
            </div>
          </div>
        </section>

        {/* Get Involved */}
        <section className="py-20 px-4">
          <div className="mx-auto max-w-(--fd-layout-width)">
            <h2 className="mb-4 text-3xl font-extrabold tracking-tight md:text-5xl">
              Built in the <GradientText>open</GradientText>
              <span className="text-fd-foreground/30">.</span>
            </h2>
            <p className="mb-12 max-w-3xl text-lg text-fd-muted-foreground">
              Yapmod is made by the people who use it. Every change is public, every idea is
              welcome, and you can help decide what comes next.
            </p>
            <div className="grid gap-5 md:grid-cols-3">
              <a
                href="https://github.com/yapmod/client/issues"
                target="_blank"
                rel="noreferrer noopener"
                className="group flex items-start gap-4 rounded-2xl border border-fd-border bg-fd-secondary/50 p-6 text-fd-foreground no-underline"
              >
                <Bug className="mt-1 h-6 w-6 shrink-0 text-fd-primary" />
                <div>
                  <h3 className="mb-1 text-lg font-bold">Report a bug</h3>
                  <p className="text-fd-muted-foreground">
                    Something looks off or breaks? Tell us what happened and we'll take a look.
                  </p>
                </div>
              </a>
              <a
                href="https://github.com/yapmod/client/issues"
                target="_blank"
                rel="noreferrer noopener"
                className="group flex items-start gap-4 rounded-2xl border border-fd-border bg-fd-secondary/50 p-6 text-fd-foreground no-underline"
              >
                <Lightbulb className="mt-1 h-6 w-6 shrink-0 text-fd-primary" />
                <div>
                  <h3 className="mb-1 text-lg font-bold">Suggest a feature</h3>
                  <p className="text-fd-muted-foreground">
                    Tell us what you would love Yapmod to do next. The roadmap is open to everyone.
                  </p>
                </div>
              </a>
              <a
                href="https://discord.gg/yapin"
                target="_blank"
                rel="noreferrer noopener"
                className="group flex items-start gap-4 rounded-2xl border border-fd-border bg-fd-secondary/50 p-6 text-fd-foreground no-underline"
              >
                <MessageCircle className="mt-1 h-6 w-6 shrink-0 text-fd-primary" />
                <div>
                  <h3 className="mb-1 text-lg font-bold">Join the conversation</h3>
                  <p className="text-fd-muted-foreground">
                    Chat with the community on the official Yapin server and follow along.
                  </p>
                </div>
              </a>
            </div>
          </div>
        </section>

        {/* Footer CTA — Gradient banner */}
        <section className="px-4 pb-24 pt-16">
          <div
            className="mx-auto max-w-(--fd-layout-width) rounded-[2rem] px-10 py-20 text-center text-white"
            style={{ background: ACCENT_GRADIENT }}
          >
            <h2 className="mb-4 text-3xl font-extrabold tracking-tight md:text-5xl">
              Come yap with us.
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-lg text-white/80">
              Join the official Yapin server to chat with the community, ask questions, and follow
              along.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1a0f16] px-6 font-semibold text-white"
                href="https://discord.gg/yapin"
                target="_blank"
                rel="noreferrer noopener"
              >
                <Users size={18} />
                Join the Yapin server
              </a>
              <a
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border-2 border-[#1a0f16] px-6 font-semibold text-[#1a0f16]"
                href="/blog/welcome"
              >
                <BookOpen size={18} />
                Read the announcement
              </a>
            </div>
          </div>
          <p className="mt-6 text-center text-sm text-fd-muted-foreground">
            Yapmod is an unofficial client mod. Not affiliated with Yapin.
          </p>
        </section>
      </HomeLayout>
    </Provider>
  );
}
