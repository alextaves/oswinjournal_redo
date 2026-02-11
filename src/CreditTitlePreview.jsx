import React, { useState, useEffect } from 'react';
import CreditTitlePage from './CreditTitlePage';

const pageIds = ['ballet', 'womens-3000m', 'figure-skating', 'wall-street'];

function CreditTitlePreview() {
  const [screenSize, setScreenSize] = useState('desktop');

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      setScreenSize(w < 768 ? 'phone' : w < 1024 ? 'tablet' : 'desktop');
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <div>
      {pageIds.map((id) => (
        <div key={id} style={{ borderBottom: '2px solid #eee' }}>
          <CreditTitlePage pageId={id} screenSize={screenSize} />
        </div>
      ))}
    </div>
  );
}

export default CreditTitlePreview;
