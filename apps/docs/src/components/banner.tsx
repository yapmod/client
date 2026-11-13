import { navigate } from 'astro:transitions/client';
import { Banner } from 'fumadocs-ui/components/banner';
import { RootProvider } from 'fumadocs-ui/provider/astro';
import SearchDialog from '@/components/search';

export function YapmodBanner() {
  return (
    <RootProvider pathname="/" params={{}} navigate={navigate} search={{ SearchDialog }}>
      <Banner id="yapmod-beta" variant="rainbow">
        Yapmod is currently in development —{' '}
        <a href="/blog/welcome" style={{ fontWeight: 600, textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.5)' }}>
          read the announcement
        </a>
        .
      </Banner>
    </RootProvider>
  );
}
