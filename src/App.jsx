import React, { useState, useEffect, useRef } from 'react';

// Pulsing gradient logo component
const PulsingLogo = ({ variant = 'vibrant' }) => {
  const [interacted, setInteracted] = useState(false);

  const handleInteraction = () => {
    setInteracted(true);
    setTimeout(() => setInteracted(false), 3000);
  };

  // Color configurations
  const colorSchemes = {
    navy: {
    color1: 'rgb(10, 75, 120)',      // Richer navy blue
    color2: 'rgb(25, 45, 80)',       // Mid blue
    color3: 'rgb(10, 20, 40)',       // Deep blue-black
    accent: 'rgb(60, 90, 140)'       // Bright accent
  },
    vibrant: {
      color1: 'rgb(255, 215, 0)',    // Canary yellow
      color2: 'rgb(200, 150, 50)',   // Mid transition
      color3: 'rgb(65, 105, 225)',   // Royal blue
      accent: 'rgb(100, 150, 255)'
    }
  };

  const colors = colorSchemes[variant];

  return (
    <div 
      className="relative w-48 h-48 mx-auto cursor-pointer"
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
    >
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <radialGradient id={`gradient-${variant}`}>
            <stop offset="0%" stopColor={colors.color1}>
              <animate
                attributeName="stop-color"
                values={`${colors.color1};${colors.color2};${colors.color3};${colors.color2};${colors.color1}`}
                dur="12s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor={colors.color3}>
              <animate
                attributeName="stop-color"
                values={`${colors.color3};${colors.color2};${colors.color1};${colors.color2};${colors.color3}`}
                dur="16s"
                repeatCount="indefinite"
              />
            </stop>
          </radialGradient>

          <filter id={`softBlur-${variant}`}>
            <feGaussianBlur stdDeviation={interacted ? "3" : "1.5"} result="blur"/>
            <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"/>
          </filter>
        </defs>

        <g filter={`url(#softBlur-${variant})`}>
          <circle 
            cx="100" 
            cy="100" 
            r="90" 
            fill={`url(#gradient-${variant})`}
            opacity={interacted ? "0.7" : ".9"}
            style={{ transition: 'opacity 1s ease' }}
          >
            <animateTransform
              attributeName="transform"
              attributeType="XML"
              type="rotate"
              from="0 100 100"
              to="360 100 100"
              dur="180s"
              repeatCount="indefinite"
            />
          </circle>

          <circle 
            cx="100" 
            cy="100" 
            r="85"
            fill="none"
            stroke={colors.accent}
            strokeWidth="0.5"
            opacity="0.4"
          >
            <animateTransform
              attributeName="transform"
              attributeType="XML"
              type="rotate"
              from="360 100 100"
              to="0 100 100"
              dur="140s"
              repeatCount="indefinite"
            />
          </circle>

          <circle 
            cx="100" 
            cy="100" 
            r="40" 
            fill="white"
            style={{
              transform: interacted ? 'scale(1.05)' : 'scale(1)',
              transformOrigin: 'center',
              transition: 'transform 1s ease'
            }}
          />
        </g>
      </svg>
    </div>
  );
};

// Floating Audio Player
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
      {/* Collapsed: Play Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed z-50 flex items-center justify-center w-16 h-16 transition-all duration-300 bg-gray-800 rounded-full shadow-lg bottom-8 right-8 hover:bg-gray-700"
        >
          <div className="w-0 h-0 ml-1 border-t-8 border-b-8 border-t-transparent border-l-12 border-l-white border-b-transparent" />
        </button>
      )}

      {/* Expanded: Full Player */}
      {isOpen && (
        <div className="fixed z-50 overflow-hidden bg-gray-900 rounded-lg shadow-2xl bottom-8 right-8 w-96">
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
    </>
  );
};

// Hero section
const HeroSection = ({ onScrollPrompt }) => {
  return (
    <section className="relative flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="absolute z-50 top-8 right-8">
        <button className="flex flex-col gap-1.5" aria-label="Menu">
          <span className="w-8 h-0.5 bg-black"></span>
          <span className="w-8 h-0.5 bg-black"></span>
          <span className="w-8 h-0.5 bg-black"></span>
        </button>
      </div>

      <PulsingLogo variant="navy" />
      {/* To switch to vibrant: <PulsingLogo variant="vibrant" /> */}
      
      <div className="w-full max-w-4xl px-6 mt-16">
        <div className="flex items-start justify-between mb-4 text-sm tracking-wider text-gray-500">
          <span>ISSUE 1</span>
          <span>TOKYO OLYMPICS 1964</span>
        </div>
        
        <div className="w-full overflow-hidden bg-gray-100 aspect-square">
          <img 
            src="/images/tokyo-09.jpg"
            alt="Tokyo Olympics 1964"
            className="object-cover w-full h-full"
          />
        </div>
      </div>

      <div 
        className="absolute transform -translate-x-1/2 cursor-pointer bottom-12 left-1/2 animate-bounce"
        onClick={onScrollPrompt}
      >
        <div className="flex items-start justify-center w-6 h-10 p-2 border-2 border-gray-400 rounded-full">
          <div className="w-1 h-2 bg-gray-400 rounded-full"></div>
        </div>
      </div>
    </section>
  );
};

// Manifesto section
const ManifestoSection = () => {
  return (
    <section className="flex items-center justify-center min-h-screen px-6 py-24 bg-white">
      <div className="max-w-3xl">
        <div className="space-y-6 text-base leading-relaxed text-gray-800">
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
      </div>
    </section>
  );
};

// Enter section
const EnterSection = ({ onEnter }) => {
  return (
    <section className="relative flex items-center justify-center min-h-screen px-6 bg-white">
      <div className="text-center">
        <button
          onClick={onEnter}
          className="flex items-center justify-center gap-4 mx-auto transition-all duration-500 group"
        >
          <span className="text-sm tracking-widest">ENTER</span>
          <div className="w-0 h-0 border-t-[20px] border-t-transparent border-l-[30px] border-b-[20px] border-b-transparent border-l-blue-500 group-hover:border-l-blue-600 transition-colors duration-300" />
        </button>
      </div>

      <div className="fixed text-xs tracking-wider text-gray-400 bottom-8 left-8">
        OSWIN JOURNAL ©
      </div>
    </section>
  );
};

// Video section component
const VideoSection = ({ src, title, index }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const videoRef = useRef(null);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        
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

  return (
    <section 
      ref={sectionRef}
      className="relative flex items-center justify-center min-h-screen overflow-hidden"
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
      
      <div className="relative z-10 w-full max-w-6xl px-6">
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <video
            ref={videoRef}
            className="absolute inset-0 object-cover w-full h-full transition-opacity opacity-0 duration-2000"
            style={{ opacity: isLoaded ? 1 : 0 }}
            loop
            muted
            playsInline
            preload="metadata"
            onLoadedData={() => setIsLoaded(true)}
          >
            <source src={src} type="video/mp4" />
          </video>
          
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 border-2 border-white opacity-20 animate-pulse" />
            </div>
          )}
        </div>
        
        <div 
          className="mt-8 text-center transition-all duration-2000"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)'
          }}
        >
          <h2 className="text-4xl font-light tracking-widest text-white">
            {title}
          </h2>
          <div className="w-24 h-px mx-auto mt-4 bg-white opacity-30" />
        </div>
      </div>
    </section>
  );
};

// Main App
function App() {
  const [showExperience, setShowExperience] = useState(false);

  const scrollToNextSection = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    });
  };

  const handleEnterExperience = () => {
    setShowExperience(true);
    window.scrollTo({ top: 0 });
  };

  const sections = [
    { 
      title: 'THRESHOLD', 
      src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' 
    },
    { 
      title: 'SUSPENSION', 
      src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' 
    },
    { 
      title: 'DISSOLUTION', 
      src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' 
    }
  ];

  if (showExperience) {
    return (
      <div className="relative bg-black">
        <FloatingAudioPlayer />
        
        {sections.map((section, index) => (
          <VideoSection
            key={index}
            src={section.src}
            title={section.title}
            index={index}
          />
        ))}
        
        <footer className="flex items-center justify-center min-h-screen bg-black">
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
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="relative">
      <FloatingAudioPlayer />
      <HeroSection onScrollPrompt={scrollToNextSection} />
      <ManifestoSection />
      <EnterSection onEnter={handleEnterExperience} />
    </div>
  );
}

export default App;