import React, { useState, useEffect, useRef } from 'react';

// Simple breathing circle logo with viewport-based responsive sizing
const PulsingLogo = ({ headerHeight, isPhone }) => {
  const logoSize = isPhone ? headerHeight * 0.5 : headerHeight * 0.75;
  
  return (
    <div 
      className="relative mx-auto"
      style={{
        width: `${logoSize}px`,
        height: `${logoSize}px`
      }}
    >
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <circle 
          cx="100" 
          cy="100" 
          r="90" 
          fill="#4C4C58"
          style={{
            transformOrigin: 'center',
            animation: 'breathe 10s ease-in-out infinite'
          }}
        />
      </svg>
      
      <style>{`
        @keyframes breathe {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
};

// Floating Audio Player with soft pulsing white button
const FloatingAudioPlayer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const tracks = [
    { id: 1, name: 'luke/eno', artist: 'Alex Taves', duration: '04:32', src: '/audio/luke-eno.mp3' },
    { id: 2, name: 'plane', artist: 'Alex Taves', duration: '03:15', src: '/audio/plane.mp3' },
    { id: 3, name: 'atom', artist: 'Alex Taves', duration: '05:47', src: '/audio/atom.mp3' }
  ];

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.log('Play prevented:', e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const selectTrack = (index) => {
    setCurrentTrack(index);
    setIsPlaying(false);
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.log('Play prevented:', e));
        setIsPlaying(true);
      }
    }, 100);
  };

  const nextTrack = () => {
    const next = (currentTrack + 1) % tracks.length;
    selectTrack(next);
  };

  const prevTrack = () => {
    const prev = currentTrack === 0 ? tracks.length - 1 : currentTrack - 1;
    selectTrack(prev);
  };

  return (
    <>
      {/* Collapsed: Play Button with soft pulsing white */}
      {!isOpen && (
        <div className="fixed z-50 bottom-8 right-8">
          <button
            onClick={() => setIsOpen(true)}
            className="relative flex items-center justify-center w-16 h-16 overflow-hidden transition-all duration-300 rounded-full shadow-lg"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)'
            }}
          >
            {/* Triangle with subtle transparency - appears as cutout */}
            <svg width="24" height="24" viewBox="0 0 24 24" className="relative z-10">
              <polygon points="8,6 8,18 18,12" fill="rgba(56, 56, 69, 0.8)" />
            </svg>
            
            {/* Pulsing effect */}
            <div 
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                animation: 'soft-pulse 4s ease-in-out infinite'
              }}
            />
          </button>
        </div>
      )}

      {/* Expanded: Full Player */}
      {isOpen && (
        <div 
          className="fixed z-50 overflow-hidden bg-gray-900 rounded-lg shadow-2xl bottom-8 right-8"
          style={{
            width: 'min(384px, 95vw)',
            right: 'max(32px, 2.5vw)'
          }}
        >
          {/* Header with album art and close button */}
          <div className="flex items-center justify-between p-4 bg-black">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded bg-gradient-to-br from-purple-500 to-blue-500" />
              <div>
                <div className="font-medium text-white">Issue 01</div>
                <div className="text-sm text-gray-400">Alex Taves</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center w-8 h-8 transition-colors bg-gray-800 rounded-full hover:bg-gray-700"
            >
              <span className="text-lg text-white">×</span>
            </button>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6 p-4 bg-gray-800">
            <button
              onClick={prevTrack}
              className="text-white transition-colors hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
              </svg>
            </button>

            <button
              onClick={togglePlay}
              className="flex items-center justify-center w-12 h-12 transition-transform bg-white rounded-full hover:scale-105"
            >
              {isPlaying ? (
                <svg className="w-5 h-5" fill="black" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6zm8 0h4v16h-4z"/>
                </svg>
              ) : (
                <div className="w-0 h-0 ml-1 border-t-6 border-t-transparent border-l-10 border-l-black border-b-6 border-b-transparent" />
              )}
            </button>

            <button
              onClick={nextTrack}
              className="text-white transition-colors hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 18h2V6h-2zm-11-6l8.5-6v12z"/>
              </svg>
            </button>
          </div>

          {/* Track List */}
          <div className="p-4 overflow-y-auto bg-gray-900 max-h-64">
            {tracks.map((track, index) => (
              <button
                key={track.id}
                onClick={() => selectTrack(index)}
                className={`w-full flex items-center justify-between p-3 rounded hover:bg-gray-800 transition-colors ${
                  currentTrack === index ? 'bg-gray-800' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-sm w-6 ${
                    currentTrack === index ? 'text-blue-400' : 'text-gray-500'
                  }`}>
                    {track.id}
                  </span>
                  <div className="text-left">
                    <div className={`text-sm ${
                      currentTrack === index ? 'text-white' : 'text-gray-300'
                    }`}>
                      {track.name}
                    </div>
                    <div className="text-xs text-gray-500">{track.artist}</div>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{track.duration}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Audio element stays mounted even when player is closed */}
      <audio
        ref={audioRef}
        src={tracks[currentTrack].src}
        loop
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* CSS for soft pulsing animation */}
      <style>{`
        @keyframes soft-pulse {
          0%, 100% {
            opacity: 0.15;
            transform: scale(1);
          }
          50% {
            opacity: 0.3;
            transform: scale(1.05);
          }
        }
      `}</style>
    </>
  );
};

// Hero section with ambient slideshow and responsive aspect ratios
const HeroSection = ({ onScrollPrompt }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isPhone, setIsPhone] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [imageHeight, setImageHeight] = useState(0);
  
  const images = {
    desktop: [
      '/images/tokyo-09.jpg',
      '/images/tokyo-10.jpg',
      '/images/tokyo-11.jpg'
    ],
    mobile: [
      '/images/tokyo-09-mobile.jpg',
      '/images/tokyo-10-mobile.jpg',
      '/images/tokyo-11-mobile.jpg'
    ]
  };

  useEffect(() => {
    const calculateLayout = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Phone: < 768px uses 4:5 ratio
      // iPad: 768-1439px uses 1:1 ratio
      // Desktop: >= 1440px uses desktop layout
      const phone = width < 768;
      const mobile = width < 1440;
      
      setIsPhone(phone);
      setIsMobile(mobile);
      
      if (mobile) {
        // Calculate image height based on aspect ratio and viewport width
        const aspectRatio = phone ? 4/5 : 1/1;
        // Add space for the text label (approximately 25px for text + margin)
        const textLabelHeight = 25;
        const calculatedImageHeight = width / aspectRatio;
        
        // Header is remaining space (including the text label area)
        const calculatedHeaderHeight = height - calculatedImageHeight - textLabelHeight;
        
        setImageHeight(calculatedImageHeight);
        setHeaderHeight(calculatedHeaderHeight);
      }
    };
    
    calculateLayout();
    window.addEventListener('resize', calculateLayout);
    
    return () => window.removeEventListener('resize', calculateLayout);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.desktop.length);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const currentImages = (isMobile && isPhone) ? images.mobile : images.desktop;

  // Mobile/iPad layout
  if (isMobile) {
    return (
      <section className="relative flex flex-col h-screen overflow-hidden" style={{ backgroundColor: '#383845' }}>
        {/* Hamburger menu */}
        <div className="absolute z-50 top-8 right-8">
          <button className="flex flex-col gap-1.5" aria-label="Menu">
            <span className="w-8 h-1 rounded-sm" style={{ backgroundColor: '#4C4C58' }}></span>
            <span className="w-8 h-1 rounded-sm" style={{ backgroundColor: '#4C4C58' }}></span>
            <span className="w-8 h-1 rounded-sm" style={{ backgroundColor: '#4C4C58' }}></span>
          </button>
        </div>

        {/* Header area with logo */}
        <div 
          className="flex items-center justify-center"
          style={{ height: `${headerHeight}px` }}
        >
          <PulsingLogo headerHeight={headerHeight} isPhone={isPhone} />
        </div>

        {/* Image fixed to bottom - no margins */}
        <div className="w-full" style={{ height: `${imageHeight}px` }}>
          <div 
            className="flex items-start justify-between mb-1 text-sm tracking-wider" 
            style={{ 
              paddingLeft: '12px', 
              paddingRight: '12px', 
              color: '#4C4C58'
            }}
          >
            <span>ISSUE 1</span>
            <span>TOKYO OLYMPICS 1964</span>
          </div>
          
          <div className="relative w-full h-full overflow-hidden bg-gray-100">
            {currentImages.map((src, index) => (
              <img 
                key={src}
                src={src}
                alt={`Tokyo Olympics 1964 - Image ${index + 1}`}
                className="absolute inset-0 object-cover w-full h-full transition-opacity"
                style={{
                  opacity: currentImageIndex === index ? 1 : 0,
                  transitionDuration: '5000ms'
                }}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Desktop layout (unchanged)
  return (
    <section className="relative flex flex-col items-center min-h-screen" style={{ backgroundColor: '#383845' }}>
      <div className="absolute z-50 top-8 right-8">
        <button className="flex flex-col gap-1.5" aria-label="Menu">
          <span className="w-8 h-1 rounded-sm" style={{ backgroundColor: '#4C4C58' }}></span>
          <span className="w-8 h-1 rounded-sm" style={{ backgroundColor: '#4C4C58' }}></span>
          <span className="w-8 h-1 rounded-sm" style={{ backgroundColor: '#4C4C58' }}></span>
        </button>
      </div>

      <div style={{ flex: '1' }} />

      <div>
        <PulsingLogo headerHeight={180} isPhone={false} />
      </div>
      
      <div style={{ flex: '1' }} />

      <div className="w-full max-w-4xl">
        <div 
          className="flex items-start justify-between mb-1 text-sm tracking-wider" 
          style={{ 
            paddingLeft: '6px', 
            paddingRight: '6px', 
            color: '#4C4C58'
          }}
        >
          <span>ISSUE 1</span>
          <span>TOKYO OLYMPICS 1964</span>
        </div>
        
        <div className="relative w-full overflow-hidden bg-gray-100 aspect-square">
          {images.desktop.map((src, index) => (
            <img 
              key={src}
              src={src}
              alt={`Tokyo Olympics 1964 - Image ${index + 1}`}
              className="absolute inset-0 object-cover w-full h-full transition-opacity"
              style={{
                opacity: currentImageIndex === index ? 1 : 0,
                transitionDuration: '5000ms'
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

// Manifesto section with Enter button
const ManifestoSection = ({ onEnter }) => {
  return (
    <section className="flex items-center justify-center min-h-screen px-3 py-24" style={{ backgroundColor: '#383845' }}>
      <div className="max-w-3xl">
        <div className="space-y-6 text-base leading-relaxed" style={{ color: '#4C4C58' }}>
          <p>
            Tokyo Olympics 1964 by Criterion is a mesmerising collection of footage that depicts the games in 
            beautifully curated sequence. The footage on its own merit is flawless and needs no help to bring 
            itself to life. However, this issue of Oswin Journal (the first issue) aims to draw attention to the details 
            that may not be visible within the larger frame. When freezing frames and looking at the blurred 
            images of the faces in the crowd, it suddenly dawned on me that there were other micro realities 
            taking place all at once. There are simultaneously other main events taking place within the same 
            moment, depending on what you're looking for.
          </p>
          
          <p>
            There is music that was tailor-made and created to accompany these visuals, so both the visual and 
            audio elements hold equal weight. Use the audio player in the bottom right corner to select your soundtrack.
          </p>
        </div>
        
        {/* Enter button 75px below manifesto text */}
        <div className="text-center" style={{ marginTop: '75px' }}>
          <button
            onClick={onEnter}
            className="text-lg tracking-widest transition-opacity duration-500 hover:opacity-60"
            style={{ color: '#4C4C58' }}
          >
            ENTER
          </button>
        </div>
      </div>
    </section>
  );
};

// Video/Image section component with friction scroll
const MediaSection = ({ src, type, title, index }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const mediaRef = useRef(null);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        
        if (mediaRef.current && type === 'video') {
          if (entry.isIntersecting) {
            mediaRef.current.play().catch(e => console.log('Play prevented:', e));
          } else {
            mediaRef.current.pause();
          }
        }
      },
      { threshold: 0.5 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [type]);

  return (
    <section 
      ref={sectionRef}
      className="relative flex items-center justify-center w-full h-screen overflow-hidden snap-start snap-always"
      style={{
        background: `linear-gradient(${index * 137}deg, rgba(0,0,0,0.95), rgba(20,20,40,0.95))`
      }}
    >
      <div 
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          opacity: isVisible ? 0.3 : 0.1,
          background: 'radial-gradient(circle at center, rgba(100,100,255,0.1), transparent)'
        }}
      />
      
      {/* Media container - 4:5 ratio, centered and fills screen */}
      <div className="relative flex items-center justify-center w-full h-full">
        <div 
          className="relative w-full h-full"
          style={{
            maxWidth: '100vw',
            aspectRatio: '4/5'
          }}
        >
          {type === 'video' ? (
            <video
              ref={mediaRef}
              className="absolute inset-0 object-cover w-full h-full transition-opacity"
              style={{ opacity: isLoaded ? 1 : 0 }}
              loop
              muted
              playsInline
              preload="metadata"
              onLoadedData={() => setIsLoaded(true)}
            >
              <source src={src} type="video/mp4" />
            </video>
          ) : (
            <img
              ref={mediaRef}
              src={src}
              alt={title}
              className="absolute inset-0 object-cover w-full h-full transition-opacity"
              style={{ opacity: isLoaded ? 1 : 0 }}
              onLoad={() => setIsLoaded(true)}
            />
          )}
          
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 border-2 border-white opacity-20 animate-pulse" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

// Main App
function App() {
  const [showExperience, setShowExperience] = useState(false);
  const [shuffledContent, setShuffledContent] = useState([]);
  const scrollContainerRef = useRef(null);

  // Content pool - mix of videos and images
  const contentPool = [
    { type: 'video', src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', title: 'THRESHOLD' },
    { type: 'video', src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', title: 'SUSPENSION' },
    { type: 'video', src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', title: 'DISSOLUTION' },
    { type: 'video', src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', title: 'EMERGENCE' },
    { type: 'video', src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', title: 'RESONANCE' },
    { type: 'video', src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', title: 'INTERVALS' },
    { type: 'video', src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', title: 'FRAGMENTS' },
    { type: 'video', src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', title: 'APERTURE' },
    { type: 'image', src: '/images/tokyo-09.jpg', title: 'STILLNESS I' },
    { type: 'image', src: '/images/tokyo-10.jpg', title: 'STILLNESS II' },
    { type: 'image', src: '/images/tokyo-11.jpg', title: 'STILLNESS III' },
  ];

  // Fisher-Yates shuffle algorithm
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const scrollToNextSection = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    });
  };

  const handleEnterExperience = () => {
    // Shuffle content when entering
    setShuffledContent(shuffleArray(contentPool));
    setShowExperience(true);
    window.scrollTo({ top: 0 });
  };

  // Add friction scrolling effect
  useEffect(() => {
    if (!showExperience || !scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    let isScrolling = false;
    let scrollTimeout;

    const handleScroll = () => {
      if (!isScrolling) {
        isScrolling = true;
      }

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
      }, 150);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [showExperience]);

  if (showExperience) {
    return (
      <div 
        ref={scrollContainerRef}
        className="relative h-screen overflow-y-scroll bg-black snap-y snap-mandatory"
        style={{
          scrollBehavior: 'smooth',
          overscrollBehavior: 'none'
        }}
      >
        <FloatingAudioPlayer />
        
        {shuffledContent.map((content, index) => (
          <MediaSection
            key={`${content.type}-${index}`}
            src={content.src}
            type={content.type}
            title={content.title}
            index={index}
          />
        ))}
        
        <footer className="flex items-center justify-center h-screen bg-black snap-start snap-always">
          <div className="text-center text-white opacity-60">
            <p className="mb-4 text-sm tracking-widest">END ISSUE 01</p>
            <button 
              onClick={() => {
                setShowExperience(false);
                window.scrollTo({ top: 0 });
              }}
              className="px-6 py-3 text-xs tracking-wider transition-all duration-500 border border-white border-opacity-30 hover:bg-white hover:text-black"
            >
              RETURN TO START
            </button>
            
            {/* OSWIN JOURNAL at bottom of experience */}
            <div className="mt-12 text-xs tracking-wider text-gray-400">
              OSWIN JOURNAL ©
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="relative">
      <FloatingAudioPlayer />
      <HeroSection onScrollPrompt={scrollToNextSection} />
      <ManifestoSection onEnter={handleEnterExperience} />
      
      {/* Footer at bottom of landing page */}
      <footer className="px-8 py-8" style={{ backgroundColor: '#383845' }}>
        <div className="text-xs tracking-wider" style={{ color: '#4C4C58' }}>
          OSWIN JOURNAL ©
        </div>
      </footer>
    </div>
  );
}

export default App;