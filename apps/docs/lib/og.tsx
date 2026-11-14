import { ImageResponse } from 'takumi-js/response';
import { googleFonts } from 'takumi-js/helpers';
import type { ReactNode } from 'react';

export interface OgImageProps {
  title: ReactNode;
  description?: ReactNode;
  site?: ReactNode;
  icon?: ReactNode;
}

const primaryColor = '#DD5A8C';

export async function generateOgImage({ title, description, site = 'Yapmod', icon }: OgImageProps) {
  const fonts = await googleFonts([
    {
      name: 'Geist Pixel',
      weight: 400,
    },
    {
      name: 'Geist',
      weight: '400..900',
    },
  ]);

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: '#0c0c0c',
        color: 'white',
        padding: '4rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background pattern */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.03,
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* Content */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          zIndex: 1,
        }}
      >
        {/* Title */}
        <p
          style={{
            fontSize: '72px',
            fontWeight: 800,
            margin: 0,
            lineHeight: 1.1,
            fontFamily: 'Geist Pixel',
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </p>
        {/* Description */}
        {description && (
          <p
            style={{
              fontSize: '44px',
              color: 'rgba(240,240,240,0.7)',
              margin: 0,
              marginTop: '20px',
              lineHeight: 1.4,
              fontFamily: 'Geist',
            }}
          >
            {description}
          </p>
        )}
        {/* Footer */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '20px',
            marginTop: 'auto',
            paddingBottom: '2rem',
          }}
        >
          {icon || (
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                backgroundColor: primaryColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="white"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6zm4 4h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
            </div>
          )}
          <p
            style={{
              fontSize: '44px',
              fontWeight: 600,
              margin: 0,
              color: primaryColor,
              fontFamily: 'Geist',
            }}
          >
            {site}
          </p>
        </div>
      </div>
      {/* Bottom accent bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '18px',
          backgroundColor: primaryColor,
        }}
      />
    </div>,
    {
      width: 1200,
      height: 630,
      format: 'webp',
      fonts,
    },
  );
}
