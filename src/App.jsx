import React, { useState, useEffect, useRef } from 'react';

// Main App Component
function App() {
  const [view, setView] = useState('archive'); // 'archive', 'issue-detail', 'experience'
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [showExitButton, setShowExitButton] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showAudioMenu, setShowAudioMenu] = useState(false); // Mini audio menu in experience view
  const audioRef = useRef(null);
  const exitButtonTimeout = useRef(null);

  // Smooth view transition helper
  const transitionToView = (newView, callback) => {
    setIsTransitioning(true);
    setTimeout(() => {
      if (callback) callback();
      setView(newView);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 400);
  };

  // Import refined fonts
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  // Track viewport size for responsive alignment and images
  const [screenSize, setScreenSize] = useState('desktop'); // 'phone', 'tablet', 'desktop'

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize('phone');
        setIsDesktop(false);
      } else if (width < 1024) {
        setScreenSize('tablet');
        setIsDesktop(false);
      } else {
        setScreenSize('desktop');
        setIsDesktop(true);
      }
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Issue data
  const issues = [
    {
      id: 1,
      title: 'LOW FLUNG',
      artist: 'Alex Taves',
      albumArt: '#D4FF00',
      tracks: [
        { name: 'luke/eno', src: '/audio/luke-eno.mp3', available: true },
        { name: 'plane', src: '/audio/plane.mp3', available: true },
        { name: 'outside bubble', src: '/audio/outside-bubble.mp3', available: true },
        { name: '[ no audio ]', src: null, available: false }
      ],
      videos: {
        desktop: [
          '/videos/desktop_preRace2.mp4',
          '/videos/desktop_raceStart.mp4',
          '/videos/desktop_hurdles.mp4',
          '/videos/desktop_legs.mp4',
          '/videos/desktop-zoom.mp4',
          '/videos/desktop-marathon.mp4'
        ],
        tablet: [
          '/videos/tablet_PreRace.mp4',
          '/videos/tablet_crowd.mp4',
          '/videos/tablet_hurdles.mp4',
          '/videos/tablet_zoom.mp4'
        ],
        phone: [
          '/videos/phone_PreRace.mp4',
          '/videos/phone_crowd.mp4',
          '/videos/phone_hurdles.mp4',
          '/videos/phone_zoom.mp4'
        ]
      },
      slideshow: [
        '/images/SLIDESHOW/tokyo-01.jpg',
        '/images/SLIDESHOW/tokyo-02.jpg',
        '/images/SLIDESHOW/tokyo-03.jpg',
        '/images/SLIDESHOW/tokyo-04.jpg',
        '/images/SLIDESHOW/tokyo-05.jpg',
        '/images/SLIDESHOW/tokyo-06.jpg',
        '/images/SLIDESHOW/tokyo-07.jpg',
        '/images/SLIDESHOW/tokyo-08.jpg',
        '/images/SLIDESHOW/tokyo-09.jpg',
        '/images/SLIDESHOW/tokyo-10.jpg',
        '/images/SLIDESHOW/tokyo-11.jpg',
        '/images/SLIDESHOW/tokyo-12.jpg',
        '/images/SLIDESHOW/tokyo-13.jpg'
      ]
    }
  ];

  const handleIssueClick = (issue) => {
    setSelectedIssue(issue);
    transitionToView('issue-detail');
  };

  const handleTrackClick = (track) => {
    if (!track.available) return;
    setSelectedTrack(track);
    if (audioRef.current) {
      audioRef.current.src = track.src;
      audioRef.current.play().then(() => setAudioPlaying(true));
    }
  };

  const handleEnterSite = () => {
    if (!selectedTrack) return;
    setView('experience');
  };

  const handleBackToArchive = () => {
    transitionToView('archive', () => {
      setSelectedIssue(null);
      setSelectedTrack(null);
      if (audioRef.current) {
        audioRef.current.pause();
        setAudioPlaying(false);
      }
    });
  };

  const handleExitExperience = () => {
    // Return to audio screen (issue-detail), not archive
    setView('issue-detail');
  };

  const handleInteraction = () => {
    setShowExitButton(true);
    clearTimeout(exitButtonTimeout.current);
    exitButtonTimeout.current = setTimeout(() => {
      setShowExitButton(false);
    }, 3000);
  };

  // Render content based on view
  const renderArchiveView = () => (
    <div
      className="min-h-screen transition-opacity duration-500 ease-out"
      style={{
        backgroundColor: '#F7F7F5',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Helvetica Neue", sans-serif',
        opacity: isTransitioning ? 0 : 1
      }}
    >
        {/* Hamburger Menu - Refined (transforms to X) */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="fixed z-50 flex flex-col items-center justify-center gap-2 p-4 transition-all duration-500 -translate-x-1/2 bottom-8 left-1/2"
          style={{ 
            width: '56px',
            height: '56px',
            transition: 'transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)'
          }}
        >
          <span 
            className="absolute h-0.5 rounded-full transition-all duration-500"
            style={{ 
              width: '28px',
              backgroundColor: '#1A1A1A',
              opacity: 0.6,
              transform: menuOpen ? 'rotate(45deg)' : 'translateY(-6px)',
              transformOrigin: 'center'
            }}
          />
          <span 
            className="absolute h-0.5 rounded-full transition-all duration-500"
            style={{ 
              width: '28px',
              backgroundColor: '#1A1A1A',
              opacity: menuOpen ? 0 : 0.6,
              transform: 'translateY(0)'
            }}
          />
          <span 
            className="absolute h-0.5 rounded-full transition-all duration-500"
            style={{ 
              width: '28px',
              backgroundColor: '#1A1A1A',
              opacity: 0.6,
              transform: menuOpen ? 'rotate(-45deg)' : 'translateY(6px)',
              transformOrigin: 'center'
            }}
          />
        </button>

        {/* Menu Overlay - Staggered animation */}
        <div 
          className={`fixed inset-0 z-40 flex items-center justify-center transition-all duration-700 ${
            menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          style={{ 
            backgroundColor: '#F7F7F5',
            transition: 'opacity 0.7s cubic-bezier(0.4, 0.0, 0.2, 1)'
          }}
        >
          <div className="space-y-6">
            {[
              { name: 'substack', href: 'https://alextaves.substack.com/' },
              { name: 'tik tok', href: '#' },
              { name: 'instagram', href: 'https://www.instagram.com/more_flowers_please/' },
              { name: 'spotify', href: 'https://open.spotify.com/playlist/7juVwU9jg6dsYs9DwgR7ss?si=b098eb9263ab4e90' },
              { name: 'alextaves@gmail.com', href: 'mailto:alextaves@gmail.com' }
            ].map((item, i) => (
              <a
                key={item.name}
                href={item.href}
                target={item.href.startsWith('http') ? '_blank' : undefined}
                rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="relative block overflow-hidden text-left group"
                style={{
                  opacity: menuOpen ? 1 : 0,
                  transform: menuOpen ? 'translateY(0)' : 'translateY(20px)',
                  transition: `all 0.6s cubic-bezier(0.4, 0.0, 0.2, 1) ${i * 0.05}s`
                }}
              >
                <span
                  className="block text-2xl font-medium transition-all duration-500 md:text-4xl lg:text-5xl"
                  style={{
                    color: '#D1D1D1',
                    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.color = '#1A1A1A';
                    e.target.style.transform = 'translateX(8px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = '#D1D1D1';
                    e.target.style.transform = 'translateX(0)';
                  }}
                >
                  {item.name}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div
          className="flex flex-col items-center justify-center min-h-screen px-6 text-center"
          style={{
            paddingTop: window.innerWidth <= 768 ? '3rem' : '4rem',
            paddingBottom: window.innerWidth <= 768 ? '3rem' : '8rem'
          }}
        >
          {/* Title with refined spacing */}
          <h1
            className="mb-3 font-semibold whitespace-nowrap"
            style={{
              fontSize: 'clamp(1.75rem, 4.5vw, 4.5rem)',
              letterSpacing: '0.18em',
              color: '#1A1A1A',
              fontWeight: 600,
              lineHeight: 1
            }}
          >
            OSWIN JOURNAL
          </h1>
          <p
            className="mb-24 text-lg italic"
            style={{
              color: '#6B7280',
              fontWeight: 400,
              letterSpacing: '0.01em'
            }}
          >
            it's audio/visual
          </p>

          {/* Issue Grid - 8px grid system */}
          <div className="grid grid-cols-3 gap-12 mb-8 md:gap-16"
            style={{
              columnGap: window.innerWidth <= 1280 && window.innerWidth > 768 ? '2.82rem' : undefined,
              rowGap: window.innerWidth <= 1280 && window.innerWidth > 768 ? '2.17rem' : undefined
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => num === 1 && handleIssueClick(issues[0])}
                className="relative transition-all duration-500"
                style={{
                  color: '#D1D1D1',
                  cursor: num === 1 ? 'pointer' : 'default',
                  fontSize: window.innerWidth > 1280 ? 'clamp(2.5rem, 5vw, 4rem)' :
                           window.innerWidth > 768 ? 'clamp(1.546rem, 3.98vw, 3.98rem)' :
                           'clamp(1.75rem, 4.5vw, 4.5rem)',
                  fontWeight: 500,
                  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                  letterSpacing: '-0.02em',
                  transform: 'scale(1)'
                }}
                onMouseEnter={(e) => {
                  if (num === 1) {
                    e.target.style.color = '#1A1A1A';
                    e.target.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (num === 1) {
                    e.target.style.color = '#D1D1D1';
                    e.target.style.transform = 'scale(1)';
                  }
                }}
                onMouseDown={(e) => {
                  if (num === 1) {
                    e.target.style.transform = 'scale(0.95)';
                  }
                }}
                onMouseUp={(e) => {
                  if (num === 1) {
                    e.target.style.transform = 'scale(1.05)';
                  }
                }}
              >
                {String(num).padStart(2, '0')}
              </button>
            ))}
          </div>

          <p
            className="text-base italic"
            style={{
              color: '#6B7280',
              fontWeight: 400,
              letterSpacing: '0.02em'
            }}
          >
            issue
          </p>
        </div>
      </div>
  );

  const renderIssueDetailView = () => (
    <div
      className="relative min-h-screen overflow-hidden transition-opacity duration-500 ease-out"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Helvetica Neue", sans-serif',
        opacity: isTransitioning ? 0 : 1
      }}
    >
        {/* Full-bleed background image */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url(/images/audio_desktop.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />

        {/* Triangle back button - top on mobile, left side on larger screens */}
        <button
          onClick={handleBackToArchive}
          className="fixed z-50 transition-all duration-300"
          style={{
            top: isDesktop ? '50%' : '40px',
            left: isDesktop ? '40px' : '50%',
            transform: isDesktop ? 'translateY(-50%)' : 'translateX(-50%)',
            cursor: 'pointer',
            opacity: 0.9
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.9'}
        >
          <svg
            width={isDesktop ? "32" : "28"}
            height={isDesktop ? "32" : "28"}
            viewBox="0 0 24 24"
            fill="white"
          >
            <polygon points="20,2 4,12 20,22" />
          </svg>
        </button>

        {/* Centered frosted glass card */}
        <div className="relative z-10 flex items-center justify-center min-h-screen px-6 pt-20 pb-32 md:py-24">
          <div
            className="w-full max-w-sm px-8 py-10 md:max-w-md md:px-10 md:py-12"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            {/* AUDIO Section */}
            <div className="mb-8">
              <p
                className="mb-2 text-xs font-semibold tracking-widest uppercase"
                style={{ color: 'rgba(50, 50, 50, 0.7)' }}
              >
                AUDIO
              </p>
              <h2
                className="mb-6 font-bold"
                style={{
                  fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
                  color: '#2A2A2A',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1
                }}
              >
                {selectedIssue.title}
              </h2>

              {/* Track list */}
              <div className="space-y-3">
                {selectedIssue.tracks.filter(t => t.available).map((track, i) => (
                  <button
                    key={i}
                    onClick={() => handleTrackClick(track)}
                    className="block w-full text-left transition-all duration-300"
                    style={{
                      fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
                      fontWeight: 600,
                      color: selectedTrack?.name === track.name ? '#1A1A1A' : 'rgba(40, 40, 40, 0.8)',
                      letterSpacing: '-0.01em',
                      opacity: selectedTrack?.name === track.name ? 1 : 0.85
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => {
                      if (selectedTrack?.name !== track.name) {
                        e.currentTarget.style.opacity = '0.85';
                      }
                    }}
                  >
                    {track.name}
                  </button>
                ))}
                {/* Silent mode option */}
                <button
                  onClick={() => {
                    setSelectedTrack(null);
                    if (audioRef.current) {
                      audioRef.current.pause();
                      audioRef.current.src = '';
                      setAudioPlaying(false);
                    }
                  }}
                  className="block w-full text-left transition-all duration-300 italic"
                  style={{
                    fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
                    fontWeight: 400,
                    color: !selectedTrack ? '#1A1A1A' : 'rgba(40, 40, 40, 0.6)',
                    letterSpacing: '-0.01em',
                    opacity: !selectedTrack ? 1 : 0.7
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={(e) => {
                    if (selectedTrack) {
                      e.currentTarget.style.opacity = '0.7';
                    }
                  }}
                >
                  silent mode
                </button>
              </div>
            </div>

            {/* VIDEO Section */}
            <div className="mb-8">
              <p
                className="mb-2 text-xs font-semibold tracking-widest uppercase"
                style={{ color: 'rgba(50, 50, 50, 0.7)' }}
              >
                VIDEO
              </p>
              <p
                style={{
                  fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
                  fontWeight: 600,
                  color: 'rgba(40, 40, 40, 0.8)',
                  letterSpacing: '-0.01em'
                }}
              >
                OSWIN
              </p>
            </div>

            {/* CREDIT INFO */}
            <div>
              <p
                className="text-xs font-semibold tracking-widest uppercase"
                style={{ color: 'rgba(50, 50, 50, 0.7)' }}
              >
                CREDIT INFO
              </p>
            </div>
          </div>
        </div>

        {/* Circle button at bottom - enter experience */}
        <div className="fixed z-50 bottom-12 left-0 right-0 flex justify-center">
          <button
            onClick={handleEnterSite}
            className="transition-all duration-300"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              cursor: selectedTrack ? 'pointer' : 'default',
              opacity: selectedTrack ? 0.9 : 0.4
            }}
            disabled={!selectedTrack}
            onMouseEnter={(e) => {
              if (selectedTrack) e.currentTarget.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              if (selectedTrack) e.currentTarget.style.opacity = '0.9';
            }}
          />
        </div>

        {/* Preload video for experience view */}
        <link
          rel="preload"
          as="video"
          href={screenSize === 'desktop' ? '/videos/desktop_preRace2.mp4' : '/videos/mobile_PreRace.mp4'}
        />
        <video
          style={{ display: 'none' }}
          preload="auto"
          src={screenSize === 'desktop' ? '/videos/desktop_preRace2.mp4' : '/videos/mobile_PreRace.mp4'}
          muted
          playsInline
        />

      </div>
  );

  // Get videos based on screen size
  const getVideos = () => {
    if (!selectedIssue?.videos) return [];
    return selectedIssue.videos[screenSize] || selectedIssue.videos.phone;
  };

  // Ref for scroll container
  const scrollContainerRef = useRef(null);
  const loopingRef = useRef(false);
  const canLoopRef = useRef(false);
  const bottomTimerRef = useRef(null);

  // Check if at bottom and enable looping after delay
  const checkIfAtBottom = () => {
    const container = scrollContainerRef.current;
    if (!container) return false;

    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    return scrollTop >= scrollHeight - clientHeight - 5;
  };

  // Track when we reach the bottom to enable looping after 2 seconds
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const onScroll = () => {
      if (checkIfAtBottom()) {
        if (!bottomTimerRef.current && !canLoopRef.current) {
          bottomTimerRef.current = setTimeout(() => {
            canLoopRef.current = true;
          }, 2000);
        }
      } else {
        canLoopRef.current = false;
        if (bottomTimerRef.current) {
          clearTimeout(bottomTimerRef.current);
          bottomTimerRef.current = null;
        }
      }
    };

    container.addEventListener('scroll', onScroll);
    return () => container.removeEventListener('scroll', onScroll);
  }, [view]);

  // Check if at bottom and user is trying to scroll down
  const handleWheel = (e) => {
    if (loopingRef.current || !canLoopRef.current) return;

    // If can loop and scrolling down, loop to top
    if (e.deltaY > 0) {
      loopingRef.current = true;
      canLoopRef.current = false;
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        loopingRef.current = false;
      }, 1000);
    }
  };

  // Handle touch swipe for mobile
  const touchStartY = useRef(0);

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (loopingRef.current || !canLoopRef.current) return;

    const touchEndY = e.changedTouches[0].clientY;
    const swipeUp = touchStartY.current - touchEndY > 50;

    if (swipeUp) {
      loopingRef.current = true;
      canLoopRef.current = false;
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        loopingRef.current = false;
      }, 1000);
    }
  };

  const renderExperienceView = () => {
    const videos = getVideos();

    return (
    <div
      ref={scrollContainerRef}
      className="relative w-full h-screen overflow-y-scroll"
      style={{
        backgroundColor: '#000',
        scrollSnapType: 'y mandatory',
        WebkitOverflowScrolling: 'touch'
      }}
      onWheel={handleWheel}
      onTouchStart={(e) => {
        handleTouchStart(e);
        handleInteraction();
      }}
      onTouchEnd={handleTouchEnd}
      onMouseMove={handleInteraction}
      onClick={(e) => {
        // Don't trigger interaction if clicking on menu
        if (!showAudioMenu) handleInteraction();
      }}
    >
      {/* Scroll-snap video sections */}
      {videos.map((videoSrc, index) => (
        <VideoSection key={index} src={videoSrc} index={index} total={videos.length} />
      ))}

      {/* Slideshow section */}
      {selectedIssue?.slideshow && (
        <section
          className="relative w-full flex items-center justify-center"
          style={{
            height: '100vh',
            scrollSnapAlign: 'start',
            scrollSnapStop: 'always',
            backgroundColor: '#000'
          }}
        >
          <Slideshow images={selectedIssue.slideshow} />
        </section>
      )}

      {/* Mini Audio Menu Overlay */}
      {showAudioMenu && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
          onClick={(e) => {
            // Close menu if clicking outside the card
            if (e.target === e.currentTarget) setShowAudioMenu(false);
          }}
        >
          <div
            className="w-full max-w-xs px-8 py-8 mx-6"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            {/* Track list only */}
            <div className="space-y-3">
              {selectedIssue.tracks.filter(t => t.available).map((track, i) => (
                <button
                  key={i}
                  onClick={() => {
                    handleTrackClick(track);
                  }}
                  className="block w-full text-left transition-all duration-300"
                  style={{
                    fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
                    fontWeight: 600,
                    color: selectedTrack?.name === track.name ? '#1A1A1A' : 'rgba(40, 40, 40, 0.8)',
                    letterSpacing: '-0.01em',
                    opacity: selectedTrack?.name === track.name ? 1 : 0.85
                  }}
                >
                  {track.name}
                </button>
              ))}
              {/* Silent mode option */}
              <button
                onClick={() => {
                  setSelectedTrack(null);
                  if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.src = '';
                    setAudioPlaying(false);
                  }
                }}
                className="block w-full text-left transition-all duration-300 italic"
                style={{
                  fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
                  fontWeight: 400,
                  color: !selectedTrack ? '#1A1A1A' : 'rgba(40, 40, 40, 0.6)',
                  letterSpacing: '-0.01em',
                  opacity: !selectedTrack ? 1 : 0.7
                }}
              >
                silent mode
              </button>
              {/* Home option - smaller font */}
              <button
                onClick={() => {
                  setShowAudioMenu(false);
                  handleBackToArchive();
                }}
                className="block w-full text-left transition-all duration-300 mt-4"
                style={{
                  fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                  fontWeight: 500,
                  color: 'rgba(40, 40, 40, 0.6)',
                  letterSpacing: '-0.01em'
                }}
              >
                home
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Circle button - toggles audio menu, appears on interaction */}
      <div className="fixed z-50 bottom-12 left-0 right-0 flex justify-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowAudioMenu(!showAudioMenu);
          }}
          className="transition-all duration-500"
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            cursor: 'pointer',
            opacity: (showExitButton || showAudioMenu) ? 0.9 : 0,
            transform: (showExitButton || showAudioMenu) ? 'scale(1)' : 'scale(0.8)',
            pointerEvents: (showExitButton || showAudioMenu) ? 'auto' : 'none'
          }}
          onMouseEnter={(e) => {
            if (showExitButton || showAudioMenu) e.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            if (showExitButton || showAudioMenu) e.currentTarget.style.opacity = '0.9';
          }}
        />
      </div>
    </div>
    );
  };

  // Single return with persistent audio element
  return (
    <>
      {/* Global audio element - persists across all views */}
      <audio ref={audioRef} loop />

      {/* Render the active view */}
      {view === 'archive' && renderArchiveView()}
      {view === 'issue-detail' && selectedIssue && renderIssueDetailView()}
      {view === 'experience' && selectedIssue && renderExperienceView()}
    </>
  );
}

// Video Section Component for scroll-snap experience
const VideoSection = ({ src, index, total }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showButton, setShowButton] = useState(true);
  const videoRef = useRef(null);
  const sectionRef = useRef(null);
  const hideButtonTimeout = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (videoRef.current) {
          if (entry.isIntersecting) {
            videoRef.current.play().catch(e => console.log('Play prevented:', e));
          } else {
            videoRef.current.pause();
          }
        }
      },
      { threshold: 0.5 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement || !!document.webkitFullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!isFullscreen) return;

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        // Scroll to next section
        const nextSection = sectionRef.current?.nextElementSibling;
        if (nextSection) {
          nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        // Scroll to previous section
        const prevSection = sectionRef.current?.previousElementSibling;
        if (prevSection) {
          prevSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyPress);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isFullscreen]);

  const handleMouseMove = () => {
    if (isFullscreen) {
      setShowButton(true);
      clearTimeout(hideButtonTimeout.current);
      hideButtonTimeout.current = setTimeout(() => {
        setShowButton(false);
      }, 2000);
    }
  };

  const handleFullscreen = (e) => {
    e.stopPropagation();

    if (isFullscreen) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    } else {
      if (sectionRef.current) {
        if (sectionRef.current.requestFullscreen) {
          sectionRef.current.requestFullscreen();
        } else if (sectionRef.current.webkitRequestFullscreen) {
          sectionRef.current.webkitRequestFullscreen();
        }
      }
    }
  };

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-screen"
      style={{
        scrollSnapAlign: 'start',
        scrollSnapStop: 'always'
      }}
      onMouseMove={handleMouseMove}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 object-cover w-full h-full"
        style={{
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.5s ease-out'
        }}
        src={src}
        loop
        muted
        playsInline
        preload="auto"
        onLoadedData={(e) => {
          e.target.playbackRate = 0.75;
          setIsLoaded(true);
        }}
      />

      {/* Fullscreen button */}
      {isLoaded && (
        <button
          onClick={handleFullscreen}
          className="absolute top-6 right-6 z-50 transition-opacity duration-300 hover:opacity-100"
          style={{
            opacity: (!isFullscreen || showButton) ? 0.7 : 0,
            padding: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '4px',
            pointerEvents: (!isFullscreen || showButton) ? 'auto' : 'none'
          }}
        >
          {isFullscreen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          )}
        </button>
      )}

      {/* Loading state */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div
            className="w-8 h-8 border-2 border-white rounded-full"
            style={{
              borderTopColor: 'transparent',
              animation: 'spin 1s linear infinite'
            }}
          />
        </div>
      )}
    </section>
  );
};

// Media Section Component - Enhanced
const MediaSection = ({ item, index, total }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const mediaRef = useRef(null);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        if (mediaRef.current && item.type === 'video') {
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
  }, [item.type]);

  return (
    <section
      ref={sectionRef}
      className="relative flex items-center justify-center w-full h-screen snap-start snap-always"
      style={{ backgroundColor: '#000' }}
    >
      {/* Media container with subtle parallax */}
      <div 
        className="relative w-full h-full"
        style={{ 
          maxWidth: '100vw',
          aspectRatio: '4/5',
          transform: isVisible ? 'scale(1)' : 'scale(1.05)',
          transition: 'transform 1s cubic-bezier(0.4, 0.0, 0.2, 1)'
        }}
      >
        {item.type === 'video' ? (
          <video
            ref={mediaRef}
            className="absolute inset-0 object-cover w-full h-full"
            style={{ 
              opacity: isLoaded ? 1 : 0,
              transition: 'opacity 1.2s cubic-bezier(0.4, 0.0, 0.2, 1)'
            }}
            loop
            muted 
            playsInline
            preload="metadata"
            onLoadedData={() => setIsLoaded(true)}
          >
            <source src={item.src} type="video/mp4" />
          </video>
        ) : (
          <img
            ref={mediaRef}
            src={item.src}
            className="absolute inset-0 object-cover w-full h-full"
            style={{ 
              opacity: isLoaded ? 1 : 0,
              transition: 'opacity 1.2s cubic-bezier(0.4, 0.0, 0.2, 1)'
            }}
            onLoad={() => setIsLoaded(true)}
            alt=""
          />
        )}

        {/* Refined loading state */}
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className="w-12 h-12 border border-white rounded-full"
              style={{
                opacity: 0.2,
                animation: 'pulse 2s cubic-bezier(0.4, 0.0, 0.6, 1) infinite'
              }}
            />
          </div>
        )}

        {/* Metadata overlay - fades in on interaction */}
        {isVisible && isLoaded && (
          <div
            className="absolute px-8 py-6 transition-all duration-700 bottom-8 left-8"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(20px)',
              borderRadius: '4px',
              opacity: 0.8,
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.875rem',
              color: 'rgba(255, 255, 255, 0.9)',
              letterSpacing: '0.02em'
            }}
          >
            {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </div>
        )}
      </div>
    </section>
  );
};

// Slideshow Component - crossfade between images
const Slideshow = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Cycle through images every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div
      className="relative"
      style={{
        width: '100%',
        height: '90vh'
      }}
    >
      {images.map((src, index) => (
        <img
          key={src}
          src={src}
          alt=""
          className="absolute inset-0 w-full h-full"
          style={{
            opacity: currentIndex === index ? 1 : 0,
            transition: 'opacity 1s ease-in-out',
            objectFit: 'contain',
            objectPosition: 'center'
          }}
        />
      ))}
    </div>
  );
};

export default App;