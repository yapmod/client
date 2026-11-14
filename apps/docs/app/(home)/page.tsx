import { Card, Cards } from 'fumadocs-ui/components/card';
import {
  ArrowRight,
  GitBranch,
  Heart,
  Lightbulb,
  MessageCircle,
  Palette,
  Puzzle,
  Sparkles,
  Zap,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center px-4 py-24 md:py-32">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl mb-6 font-heading">
            Yapin, made yours.
          </h1>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Yapmod is a free, open-source client mod for Yapin. Customize your experience with
            themes, plugins, and settings, all running directly in your browser.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="/docs"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Plugin Developer Docs
              <ArrowRight className="size-4" />
            </a>
            <a
              href="/blog"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border bg-background px-6 text-base font-medium transition-colors hover:bg-muted hover:text-foreground"
            >
              Read the Blog
              <ArrowRight className="size-4" />
            </a>
            <a
              href="#why"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border bg-background px-6 text-base font-medium transition-colors hover:bg-muted hover:text-foreground"
            >
              Learn more
              <ArrowRight className="size-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Why Yapmod Section */}
      <section id="why" className="flex flex-col items-center px-4 py-16 scroll-mt-16">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight mb-4 font-heading">Why Yapmod?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Yapmod enhances Yapin with powerful customization tools, giving you full control over
              your experience.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card
              title="Themes"
              description="Transform the look and feel of Yapin with community-created themes. Upload your own or browse the gallery."
              icon={<Palette className="h-5 w-5" />}
            />
            <Card
              title="Plugins"
              description="Extend functionality with plugins. Write your own or install from the community library."
              icon={<Puzzle className="h-5 w-5" />}
            />
            <Card
              title="Settings"
              description="Fine-tune every aspect of your experience with a dedicated settings panel built right into Yapin."
              icon={<Zap className="h-5 w-5" />}
            />
            <Card
              title="Lightweight"
              description="Runs as a single injected script with minimal overhead. No heavy background processes or native dependencies."
              icon={<Zap className="h-5 w-5" />}
            />
            <Card
              title="Stability Focus"
              description="The project prioritizes stability above all, so your customizations work reliably across updates."
              icon={<Sparkles className="h-5 w-5" />}
            />
            <Card
              title="Open Source"
              description="Fully open source and community-driven. Contribute features, report bugs, and shape the project."
              icon={<Sparkles className="h-5 w-5" />}
            />
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section id="community" className="flex flex-col items-center px-4 py-16 scroll-mt-16">
        <div className="max-w-4xl mx-auto w-full">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight mb-4 font-heading">Community</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join the conversation, share your creations, and get help from fellow Yapmod users.
            </p>
          </div>

          <Cards className="sm:grid-cols-3">
            <Card
              href="https://discord.gg/yapin"
              external
              title="Yapin"
              description="Chat with the community and get real-time help."
              icon={<MessageCircle className="h-5 w-5" />}
            />
            <Card
              href="https://github.com/yapmod/client"
              external
              title="GitHub"
              description="Report issues, request features, and contribute code."
              icon={<GitBranch className="h-5 w-5" />}
            />
            <Card
              href="https://github.com/yapmod/client/issues"
              external
              title="Find an idea"
              description="Browse open issues and good first picks to start contributing."
              icon={<Lightbulb className="h-5 w-5" />}
            />
          </Cards>
        </div>
      </section>

      {/* Footer */}
      <footer className="flex flex-col items-center border-t border-border px-4 py-8 mt-8">
        <p className="text-sm text-muted-foreground">
          Yapmod is not affiliated with Yapin. Made with{' '}
          <Heart className="inline size-3 text-red-500" /> by the community.
        </p>
      </footer>
    </div>
  );
}
