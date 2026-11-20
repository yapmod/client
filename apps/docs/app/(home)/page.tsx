import { ArrowRight, ArrowUpRight, Code2, Palette, Puzzle, SlidersHorizontal } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PixelHero } from '@/components/hero';
import { getPosts } from '@/lib/blog';
import { blogAuthors, blogSource } from '@/lib/source';
import './home.css';

export const metadata: Metadata = {
  title: 'Yapmod • Yapin, made yours.',
  description:
    'Customize the Yapin interface with CSS themes and plugins that run in your browser.',
};

const features = [
  {
    title: 'Themes',
    text: 'Change the colors and spacing in Yapin with a CSS file you can edit yourself.',
    action: 'Add a theme',
    href: '/docs/get-started#add-a-theme',
    icon: Palette,
  },
  {
    title: 'Plugins',
    text: 'Load a plugin from its author, then turn it on or off from your Plugins panel.',
    action: 'How plugins are shared',
    href: '/docs/development/distribution',
    icon: Puzzle,
  },
  {
    title: 'Settings',
    text: 'Give your plugin a place in the Yapin sidebar with the same switches and controls as the host.',
    action: 'Explore the controls',
    href: '/docs/development/ui-components',
    icon: SlidersHorizontal,
  },
];

export default function HomePage() {
  const [latest] = getPosts(blogSource.getPages(), blogAuthors);

  return (
    <>
      <PixelHero>
        <div className="home-wrap relative py-16 text-center">
          <div>
            <h1 className="font-heading text-[clamp(3.5rem,8vw,7.25rem)] leading-[0.95] tracking-tight">
              Yapin,
              <br />
              made yours.
            </h1>
            <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Yapmod is a free, open-source client mod for Yapin. Use themes and plugins to change
              the interface right in your browser.
            </p>
            <div className="mt-7 flex justify-center flex-wrap gap-3">
              <Link href="/docs/get-started" className="home-action home-primary">
                Get started <ArrowRight size={16} />
              </Link>
              <Link href="/docs" className="home-action home-secondary">
                <Code2 size={16} /> Build a plugin
              </Link>
            </div>
          </div>
        </div>
      </PixelHero>

      <section id="why" className="home-wrap text-center scroll-mt-16 py-14 md:py-20">
        <h2 className="font-heading text-4xl tracking-tight">Inside Yapin</h2>
        <div className="mt-7 grid gap-x-9 gap-y-8 sm:grid-cols-3">
          {features.map(({ title, icon: Icon, text, action, href }) => (
            <div key={title} className="flex flex-col items-center border-t pt-5">
              <Icon className="mb-4 size-5" aria-hidden="true" />
              <h3 className="font-heading text-2xl">{title}</h3>
              <p className="mb-4 mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
              <Link href={href} className="home-link mt-auto">
                {action} <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {latest && (
        <section className="border-y bg-muted/40">
          <div className="home-wrap grid justify-items-center gap-6 py-12 text-center md:py-16">
            <div>
              <h2 className="font-heading text-3xl">From the blog</h2>
              <Link className="home-link mt-3" href="/blog">
                All posts <ArrowRight size={14} />
              </Link>
            </div>
            <div>
              <h3 className="font-heading text-3xl tracking-tight md:text-4xl">
                <Link className="hover:underline" href={latest.url}>
                  {latest.title}
                </Link>
              </h3>
              <p className="mx-auto mt-3 max-w-xl leading-relaxed text-muted-foreground">
                {latest.description}
              </p>
              <Link className="home-link mt-4" href={latest.url}>
                Read the story <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      )}

      <footer
        id="community"
        className="home-wrap flex flex-col items-center text-center gap-5 py-8 text-sm"
      >
        <p className="text-muted-foreground">
          An independent mod for Yapin, built by the community.
        </p>
        <nav className="flex justify-center flex-wrap gap-4" aria-label="Community">
          <a className="home-link" href="https://yapin.gg/invite/YappMod">
            Official Yapmod server on Yapin <ArrowUpRight size={14} />
          </a>
          <a className="home-link" href="https://github.com/yapmod/client">
            GitHub <ArrowUpRight size={14} />
          </a>
          <a className="home-link" href="https://github.com/yapmod/client/issues">
            Issues <ArrowUpRight size={14} />
          </a>
        </nav>
      </footer>
    </>
  );
}
