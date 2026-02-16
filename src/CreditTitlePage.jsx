import React from 'react';

const creditPages = [
  {
    id: 'ballet',
    lines: ['Ballet with Edward Villella', '1970 - A/V Geeks 16mm Films'],
  },
  {
    id: 'womens-3000m',
    lines: ["Women's 3000m Los Angeles 1984", 'BBC Coverage'],
  },
  {
    id: 'figure-skating',
    lines: ['Figure Skating Grenoble 1968', 'Olympic Coverage'],
  },
  {
    id: 'wall-street',
    lines: ['Man On The Street Interviews From Wall Street', '1979 - David Hoffman'],
  },
  {
    id: 'melbourne-1500m',
    lines: ['1500 Metre Race Melbourne 1956', 'Olympic Coverage'],
  },
];

function CreditTitlePage({ pageId, screenSize = 'desktop' }) {
  const page = creditPages.find((p) => p.id === pageId);
  if (!page) return null;

  const isMobile = screenSize === 'phone';

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        backgroundColor: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* OSWIN JOURNAL */}
      <div
        style={{
          paddingTop: isMobile ? 54 : 32,
          fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
          fontSize: isMobile ? 18 : 22,
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: '#C0C0C0',
          textAlign: 'center',
          width: '100%',
        }}
      >
        OSWIN JOURNAL
      </div>

      {/* Center credit text */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          paddingLeft: 24,
          paddingRight: 24,
        }}
      >
        {page.lines.map((line, i) => (
          <div
            key={i}
            style={{
              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              fontSize: isMobile ? 24 : 35,
              fontStyle: 'italic',
              fontWeight: 400,
              color: '#666666',
              lineHeight: `${isMobile ? 48 : 65}px`,
            }}
          >
            {line}
          </div>
        ))}
      </div>

      {/* VIDEO CREDITS */}
      <div
        style={{
          paddingBottom: isMobile ? (pageId === 'melbourne-1500m' ? 60 : 24) : 32,
          fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
          fontSize: isMobile ? 18 : 22,
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: '#C0C0C0',
          textAlign: 'center',
          width: '100%',
        }}
      >
        VIDEO CREDITS
      </div>

      {/* Swipe hint - mobile Melbourne only */}
      {isMobile && pageId === 'melbourne-1500m' && (
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: '#C0C0C0',
          }}
        >
          swipe →
        </div>
      )}
    </div>
  );
}

export { creditPages };
export default CreditTitlePage;
