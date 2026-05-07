import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import CreditTitlePage from './CreditTitlePage';
import PianoBarsArt from './PianoBarsArt';
import HumMixer from './HumMixer';
import SiphonGallery from './SiphonGallery';

function NoiseCanvas({ alpha = 20 }) {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    let rafId
    const draw = () => {
      if (!canvas) return
      const p = canvas.parentElement
      if (canvas.width !== p.offsetWidth) canvas.width = p.offsetWidth
      if (canvas.height !== p.offsetHeight) canvas.height = p.offsetHeight
      const ctx = canvas.getContext('2d')
      const img = ctx.createImageData(canvas.width, canvas.height)
      const d = img.data
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.random() * 255 | 0
        d[i] = d[i + 1] = d[i + 2] = v
        d[i + 3] = alpha
      }
      ctx.putImageData(img, 0, 0)
      rafId = requestAnimationFrame(draw)
    }
    rafId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafId)
  }, [alpha])
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
}

const DETROIT_IMAGES = [
  '/images/detroit/01.jpg','/images/detroit/02.jpg','/images/detroit/04.jpg',
  '/images/detroit/06.jpg','/images/detroit/07 copy 2.jpg','/images/detroit/07 copy.jpg',
  '/images/detroit/08.jpg','/images/detroit/08b copy.jpg','/images/detroit/09.jpg',
  '/images/detroit/10.jpg','/images/detroit/11.jpg','/images/detroit/12.jpg',
  '/images/detroit/13.jpg','/images/detroit/15.jpg','/images/detroit/16.jpg',
  '/images/detroit/17.jpg','/images/detroit/18.jpg','/images/detroit/20.jpg',
  '/images/detroit/21.jpg','/images/detroit/23.jpg','/images/detroit/24 copy.jpg',
  '/images/detroit/24.jpg','/images/detroit/25.jpg','/images/detroit/26.jpg',
  '/images/detroit/27.jpg','/images/detroit/28 copy.jpg','/images/detroit/28.jpg',
  '/images/detroit/29.jpg','/images/detroit/30.jpg','/images/detroit/31 copy.jpg',
  '/images/detroit/32b copy.jpg',
]

function StrobeImages({ triggerRef, viewMode }) {
  const containerRef = useRef(null)
  const viewModeRef = useRef(viewMode)
  useEffect(() => { viewModeRef.current = viewMode }, [viewMode])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    triggerRef.current = () => {
      if (viewModeRef.current === 'read') return
      const src = DETROIT_IMAGES[Math.floor(Math.random() * DETROIT_IMAGES.length)]
      const img = document.createElement('img')
      img.src = encodeURI(src)
      let x, y
      {
        x = Math.random() * (window.innerWidth - 220)
        y = Math.random() * (window.innerHeight - 220)
      }
      img.style.cssText = [
        'position:absolute',
        `left:${x}px`,
        `top:${y}px`,
        'height:200px',
        'width:auto',
        'opacity:0',
        'transition:opacity 150ms ease',
        'pointer-events:none',
        'z-index:1',
        'border-radius:3px',
        'mask-image:radial-gradient(ellipse 90% 90% at 50% 50%, black 60%, transparent 100%)',
        '-webkit-mask-image:radial-gradient(ellipse 90% 90% at 50% 50%, black 60%, transparent 100%)',
      ].join(';')
      container.appendChild(img)
      requestAnimationFrame(() => requestAnimationFrame(() => { img.style.opacity = '0.75' }))
      setTimeout(() => {
        img.style.transition = 'opacity 300ms ease'
        img.style.opacity = '0'
        setTimeout(() => img.remove(), 320)
      }, 1500)
    }

    return () => { triggerRef.current = null }
  }, [triggerRef])

  return <div ref={containerRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }} />
}

function StackedHum({ word = 'HUM', color = 'rgba(0, 55, 193, 0.69)', fontSize = 'clamp(1.125rem, 1.968vw, 2.25rem)' }) {
  const letterRefs = useRef([])
  const raf = useRef(null)
  const startTime = useRef(null)
  const letters = word.split('')

  useEffect(() => {
    const speed = 0.0005
    const amplitude = () => (letterRefs.current[0]?.offsetWidth ?? 25) * 0.75

    const tick = (ts) => {
      if (!startTime.current) startTime.current = ts
      const offset = Math.sin((ts - startTime.current) * speed) * amplitude()
      letterRefs.current.forEach((el, i) => {
        if (el) el.style.transform = `translateX(${i % 2 === 0 ? offset : -offset}px)`
      })
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [])

  const letterStyle = {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
    fontSize,
    fontWeight: 600,
    color,
    userSelect: 'none',
    lineHeight: 0.9,
    marginBottom: '5px',
    willChange: 'transform',
    display: 'block',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {letters.map((l, i) => (
        <span key={i} ref={el => letterRefs.current[i] = el} style={letterStyle}>{l}</span>
      ))}
    </div>
  )
}

// Main App Component
function App() {
  const [view, setView] = useState('archive'); // 'archive', 'issue-detail', 'experience', 'reads', 'listens', 'hum'
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [showExitButton, setShowExitButton] = useState(false);
  const [issue3Fullscreen, setIssue3Fullscreen] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showAudioMenu, setShowAudioMenu] = useState(false); // Mini audio menu in experience view
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [showCreditInfo, setShowCreditInfo] = useState(false);
  const [showNotesOnOswin, setShowNotesOnOswin] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState({});
  const [expandedPlaylist, setExpandedPlaylist] = useState(null);
  const [visitedIssues, setVisitedIssues] = useState(new Set());
  const [hoveredIssue, setHoveredIssue] = useState(null);
  const [expandedRead, setExpandedRead] = useState(null);
  const [activeIssue, setActiveIssue] = useState(3); // newest published issue
  const [issue3Screen, setIssue3Screen] = useState(0);
  const [issue3ViewMode, setIssue3ViewMode] = useState('read');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const audioRef = useRef(null);
  const wallaRef = useRef(null);
  const wallaFadeRef = useRef(null);
  const rainRef = useRef(null);
  const rainFadeRef = useRef(null);
  const strobeSpawnRef = useRef(null);
  const exitButtonTimeout = useRef(null);
  const trackPositionsRef = useRef({});
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const deferredInstallPrompt = useRef(null);

  // Detect if running as installed PWA
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;

  // Show install banner on first mobile visit (if not already installed)
  useEffect(() => {
    if (isStandalone) return;
    const dismissed = localStorage.getItem('oswin-install-dismissed');
    if (!dismissed) {
      const timer = setTimeout(() => setShowInstallBanner(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Capture Android install prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      deferredInstallPrompt.current = e;
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismissInstallBanner = () => {
    setShowInstallBanner(false);
    localStorage.setItem('oswin-install-dismissed', 'true');
  };

  const handleInstallClick = async () => {
    if (deferredInstallPrompt.current) {
      deferredInstallPrompt.current.prompt();
      await deferredInstallPrompt.current.userChoice;
      deferredInstallPrompt.current = null;
      setShowInstallBanner(false);
    } else {
      setShowInstallBanner(true);
    }
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  // Load Substack embed script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://substack.com/embedjs/embed.js';
    script.async = true;
    script.charset = 'utf-8';
    if (!document.querySelector('script[src="https://substack.com/embedjs/embed.js"]')) {
      document.body.appendChild(script);
    }
  }, []);

  // Reload Substack embeds when expandedRead changes
  useEffect(() => {
    if (expandedRead !== null && window.SubstackFeedWidget) {
      window.SubstackFeedWidget.load();
    }
  }, [expandedRead]);

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

  // Check if user is a first-time visitor
  useEffect(() => {
    const hasVisited = localStorage.getItem('oswin-has-visited');
    if (!hasVisited) {
      setIsFirstTimeUser(true);
    }
  }, []);

  // Import refined fonts
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  // Dynamic document title
  useEffect(() => {
    const base = "Oswin Journal";
    const titleMap = {
      archive: `${base} — a slow web experience`,
      experience: `Issue 0${activeIssue} — ${base}`,
      'issue-detail': `Issue 0${activeIssue} — ${base}`,
      reads: `Reads — ${base}`,
      listens: `Listens — ${base}`,
    };
    document.title = titleMap[view] ?? `${base} — a slow web experience`;
  }, [view, activeIssue]);

  // Track viewport size for responsive alignment and images
  const [screenSize, setScreenSize] = useState('desktop'); // 'phone', 'tablet', 'desktop'

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      if (width < 1400) {
        setScreenSize('phone');
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

  // Listens data
  const listensData = [
    {
      id: 1,
      title: 'thinking upbeat',
      color: '#EAE413',
      imageUrl: '/images/thinking_upbeat.png',
      spotifyUrl: 'https://open.spotify.com/playlist/2pkOJQlNqjJiuLrY1gaVFM',
      spotifyEmbed: 'https://open.spotify.com/embed/playlist/2pkOJQlNqjJiuLrY1gaVFM?utm_source=generator',
      appleUrl: 'https://placeholder-apple.com/thinking-upbeat'
    },
    {
      id: 2,
      title: 'thinking ambient',
      color: '#3d493d',
      imageUrl: '/images/thinking_ambient.png',
      spotifyUrl: 'https://open.spotify.com/playlist/00enCKRA8K6srlr4iYhmMA',
      spotifyEmbed: 'https://open.spotify.com/embed/playlist/00enCKRA8K6srlr4iYhmMA?utm_source=generator',
      appleUrl: 'https://placeholder-apple.com/thinking-ambient'
    },
    {
      id: 3,
      title: 'sit down house',
      color: '#8C7B65',
      imageUrl: '/images/sit_down_house.png',
      spotifyUrl: 'https://open.spotify.com/playlist/4uBXLn4lpPM9l2Jd24rCGf',
      spotifyEmbed: 'https://open.spotify.com/embed/playlist/4uBXLn4lpPM9l2Jd24rCGf?utm_source=generator',
      appleUrl: 'https://placeholder-apple.com/sit-down-house'
    },
    {
      id: 4,
      title: 'oddities',
      color: '#191E2F',
      imageUrl: '/images/oddities.png',
      spotifyUrl: 'https://open.spotify.com/playlist/7nnAhtnx8Xe3vs4wQC633q',
      spotifyEmbed: 'https://open.spotify.com/embed/playlist/7nnAhtnx8Xe3vs4wQC633q?utm_source=generator',
      appleUrl: 'https://placeholder-apple.com/oddities'
    },
    {
      id: 5,
      title: '',
      color: '#D1D1D1',
      spotifyUrl: '',
      appleUrl: ''
    },
    {
      id: 6,
      title: '',
      color: '#D1D1D1',
      spotifyUrl: '',
      appleUrl: ''
    },
    {
      id: 7,
      title: '',
      color: '#D1D1D1',
      spotifyUrl: '',
      appleUrl: ''
    },
    {
      id: 8,
      title: '',
      color: '#D1D1D1',
      spotifyUrl: '',
      appleUrl: ''
    },
    {
      id: 9,
      title: '',
      color: '#D1D1D1',
      spotifyUrl: '',
      appleUrl: ''
    }
  ];

  // Reads data
  const readsData = [
    {
      id: 1,
      title: 'casual knife fight',
      type: 'story',
      color: '#D4FF00',
      imageUrl: '/images/casual.png',
      url: 'https://open.substack.com/pub/oswinjournal/p/casual-knife-fight?r=28jcyn&utm_campaign=post&utm_medium=web&showWelcomeOnShare=true'
    },
    {
      id: 2,
      title: 'slam',
      type: 'story',
      color: '#FF4500',
      imageUrl: '/images/slam.png',
      url: 'https://open.substack.com/pub/oswinjournal/p/slam?r=28jcyn&utm_campaign=post&utm_medium=web&showWelcomeOnShare=true'
    },
    {
      id: 3,
      title: 'boogie',
      type: 'story',
      color: '#1E90FF',
      imageUrl: '/images/boogie.png',
      url: 'https://open.substack.com/pub/oswinjournal/p/boogie?utm_campaign=post-expanded-share&utm_medium=web'
    },
    {
      id: 4,
      title: 'elon',
      type: 'story',
      color: '#9D4EDD',
      imageUrl: '/images/elon.png',
      url: 'https://open.substack.com/pub/oswinjournal/p/elon?utm_campaign=post-expanded-share&utm_medium=web'
    },
    {
      id: 5,
      title: 'A Thousand Miles Away',
      subtitle: 'Yoni Newman aka Karla',
      type: 'interview',
      color: '#000000',
      imageUrl: '/images/karla.png',
      url: 'https://open.substack.com/pub/oswinjournal/p/a-thousand-entry-points?utm_campaign=post-expanded-share&utm_medium=web'
    },
    {
      id: 6,
      title: 'dorothy sotherby',
      type: 'story',
      color: '#00FF00',
      imageUrl: '/images/sotherby.png',
      url: 'https://open.substack.com/pub/oswinjournal/p/dorothy-sotherby?r=28jcyn&utm_campaign=post&utm_medium=web&showWelcomeOnShare=true'
    },
    {
      id: 7,
      color: '#D1D1D1'
    },
    {
      id: 8,
      color: '#D1D1D1'
    },
    {
      id: 9,
      color: '#D1D1D1'
    }
  ];

  // Issue data
  const issues = [
    {
      id: 1,
      title: 'KARLA',
      artist: 'Alex Taves',
      albumArt: '#D4FF00',
      tracks: [
        { name: 'begin', src: '/audio/begin.mp3', available: true },
        { name: 'automobile', src: '/audio/automobile.mp3', available: true },
        { name: 'float', src: '/audio/float.mp3', available: true },
        { name: 'night walk', src: '/audio/night walk.mp3', available: true }
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
    },
    {
      id: 2,
      title: 'Christopher Bissonnette',
      artist: 'Christopher Bissonnette',
      albumArt: '#4A90D9',
      tracks: [
        { name: 'Overture', src: '/audio/c_bissonnette/overture.mp3', available: true },
        { name: 'Orffyreus Wheel', src: '/audio/c_bissonnette/orffyreus_wheel.mp3', available: true },
        { name: 'Undertow', src: '/audio/c_bissonnette/undertow.mp3', available: true },
        { name: 'Color Deceives Continuously', src: '/audio/c_bissonnette/color_deceives.mp3', available: true }
      ],
      videos: {
        desktop: [
          '/videos/issue2/chris_desktop_bluedancer.mp4',
          '/videos/issue2/chris_desktop_franticspin.mp4',
          '/videos/issue2/chris_desktop_blue3_gradual.mp4',
          '/videos/issue2/chris_desktop_technocolor.mp4',
          '/videos/issue2/chris_desktop_maybe.mp4',
          '/videos/issue2/chris_desktop_blue3_fifth.mp4',
          '/videos/issue2/chris_desktop_pink_spin.mp4',
          '/videos/issue2/chris_desktop_frantic_slowdown.mp4'
        ],
        tablet: [
          '/videos/issue2/chris_mobile_ballet01.mp4',
          '/videos/issue2/chris_mobile_ballet02.mp4',
          '/videos/issue2/chris_mobile_cropped_runner.mp4',
          '/videos/issue2/chris_mobile_streetrun.mp4',
          '/videos/issue2/chris_mobile_loopedMan.mp4'
        ],
        phone: [
          { type: 'title', pageId: 'melbourne-1500m' },
          '/videos/issue2/chris_mobile_cropped_runner_1.mp4',
          '/videos/issue2/chris_mobile_cropped_runner_2.mp4',
          '/videos/issue2/chris_mobile_cropped_runner_3.mp4',
          '/videos/issue2/chris_mobile_cropped_runner_still.mp4',
          '/videos/issue2/chris_mobile_a1.mp4',
          '/videos/issue2/chris_mobile_a2.mp4',
          '/videos/issue2/chris_mobile_a3.mp4',
          '/videos/issue2/chris_mobile_a4.mp4',
          '/videos/issue2/chris_mobile_b1.mp4',
          '/videos/issue2/chris_mobile_b2.mp4',
          '/videos/issue2/chris_mobile_looped_run.mp4',
          '/videos/issue2/chris_mobile_b3.mp4',
          '/videos/issue2/chris_mobile_b4.mp4',
          '/videos/issue2/chris_mobile_b5.mp4',
          { type: 'title', pageId: 'figure-skating' },
          '/videos/issue2/chris_mobile_closeup_spin_01.mp4',
          '/videos/issue2/chris_mobile_closeup_spin_02.mp4',
          '/videos/issue2/chris_mobile_closeup_spin_03.mp4',
          '/videos/issue2/chris_mobile_closeup_spin_04.mp4',
          '/videos/issue2/chris_mobile_bluespin_fifth.mp4',
          '/videos/issue2/chris_mobile_bluespin_gradual01.mp4',
          '/videos/issue2/chris_mobile_bluespin_gradual02.mp4',
          '/videos/issue2/chris_mobile_bluespin_gradual03.mp4',
          { type: 'title', pageId: 'wall-street' },
          '/videos/issue2/chris_mobile_wallstreet_01.mp4',
          '/videos/issue2/chris_mobile_wallstreet_02.mp4',
          '/videos/issue2/chris_mobile_wallstreet_03.mp4',
          '/videos/issue2/chris_mobile_wallstreet_04.mp4',
          '/videos/issue2/chris_mobile_wallstreet_05.mp4',
          '/videos/issue2/chris_mobile_wallstreet_06.mp4',
          '/videos/issue2/chris_mobile_wallstreet_07_scroll.mp4',
          '/videos/issue2/chris_mobile_wallstreet_07.mp4',
          '/videos/issue2/chris_mobile_wallstreet_08.mp4',
          '/videos/issue2/chris_mobile_wallstreet_6.mp4'
        ]
      },
      slideshow: null,
      panelSets: [
        {
          name: 'guy_corner',
          panels: [
            '/videos/issue2/panels/guy_corner_panel1.mp4',
            '/videos/issue2/panels/guy_corner_panel2.mp4',
            '/videos/issue2/panels/guy_corner_panel3.mp4'
          ]
        },
        {
          name: 'newyork',
          panels: [
            '/videos/issue2/panels/newyork_panel1.mp4',
            '/videos/issue2/panels/newyork_panel2.mp4',
            '/videos/issue2/panels/newyork_panel3.mp4'
          ]
        },
        {
          name: 'streetnoise',
          panels: [
            '/videos/issue2/panels/streetnoise_panel1.mp4',
            '/videos/issue2/panels/streetnoise_panel2.mp4',
            '/videos/issue2/panels/streetnoise_panel3.mp4'
          ]
        },
        {
          name: 'wallstreetwalking',
          panels: [
            '/videos/issue2/panels/wallstreetwalking_panel1.mp4',
            '/videos/issue2/panels/wallstreetwalking_panel2.mp4',
            '/videos/issue2/panels/wallstreetwalking_panel3.mp4'
          ]
        },
        {
          name: 'cool_guy',
          panels: [
            '/videos/issue2/panels/cool_guy_panel1.mp4',
            '/videos/issue2/panels/cool_guy_panel2.mp4',
            '/videos/issue2/panels/cool_guy_panel3.mp4'
          ]
        },
        {
          name: 'cropped_runner',
          panels: [
            '/videos/issue2/panels/cropped_runner_panel1.mp4',
            '/videos/issue2/panels/cropped_runner_panel2.mp4',
            '/videos/issue2/panels/cropped_runner_panel3.mp4'
          ]
        },
        {
          name: 'cropped_runner_mobile',
          offsets: [0, 0.5, 1.0],
          panels: [
            '/videos/issue2/panels/cropped_runner_left.mp4',
            '/videos/issue2/panels/cropped_runner_middle.mp4',
            '/videos/issue2/panels/cropped_runner_right.mp4'
          ]
        }
      ]
    },
    {
      id: 3,
      title: 'Arnold Schoenberg Piano 1908–1917',
      artist: 'Audio Study',
      albumArt: '#F5DD33',
      tracks: [],
      videos: { desktop: [], tablet: [], phone: [] },
      slideshow: [],
    }
  ];

  const HUM_PARAGRAPHS = [
    `As you walk through a store, the music and screens change to your taste. But the music is in your head. Everyone has their version. The screens are Hum's, billboards, store displays, transit panels, the lobby screen at your building. Designated surfaces. If you're WOCCA, they go black. I've lowered my glasses a few times out of curiosity. Not wearing them seems sad and lonely.`,
    `Those who hear no music or see no visuals at all are known as WOCCA. Apparently they're around, I don't know any.`,
    `The glasses are part of it. Mandatory since UV-C started punching through the atmosphere. Class 4 tinted frames, revised Radiation Protection Standard, you can't legally leave the house without them. Everyone knows they track. The sneakers you linger on, the sports team whose scores you check, the exact blue you keep returning to. What most people don't clock is the depth. Every fixation timestamped, every saccade logged. The glasses see what you see, and the audio responds.`,
    `You near the wine aisle at a grocery store and a signal fires from one of the Knowisphere mesh beacons above the shelving. Newer stores use KWM III, most still run the old mesh. The musak shifts to what you'd be doing that night. At least, a prediction. Most nights after work, you buy wine and watch a show. The musak knows the show and will play something that alludes to it. Not the melody per se. A hint. Or if you are heading to see your sport team play, the atmosphere shifts through sight and sound to let you pre-enjoy self. Of course you can adjust the settings. I'm hungry, or I need to prep for an exam. Billboard screens turn into cue cards.`,
    `Every glance is noted and saved. Except in your own home, or at night, though there's a beta program to push the night frames, softer tint, still tracking, marketed as reducing contrast fatigue. It's catching on. People love the glasses. Chanel. Burberry. Prada does a really beautiful pair in tortoiseshell.`,
    `Every industry is vying for its share, particularly the dodgier ones. It really took off in the adult industry, it counts on men having types. Social media used to guess. Hum doesn't have to. Someone you saw on the subway reappears later as a tease.`,
    `So your glance at anything shifts the sound, ever so slightly. It's not music we're talking about here. This is purely generative, the model spitting out audio per frame based on what your eyes just did. But at the same time it could be music. And it's impossible to hear the same thing twice.`,
    `WOCCA hear nothing. They see a grey city. Everyone else, the whole thing is illuminated.`,
  ];

  const GRAFT_PARAGRAPHS = [
    `Synthetic to organic. Fibreglass to oak. Silicone to rose stem.`,
    `It started with lawns. The first generation focused on creating a self-caring lawn. The grass blades grew exactly an inch and stopped. It smelled, and more or less looked, real, and was sold to families wanting the perfect lawn but lacking the time to really care for it. The pitch was set and forget it. It gained popularity fast, but then the backlash came. It looked too perfect. No lawn looks like that. The second generation fixed it. The science got smarter. It introduced irregularity. Some blades were wider, some thin, some deep green, some struggling to survive. A random variable was introduced into the code and the outcome was a real-looking lawn. A patch near the driveway looked worn in. A slight dip in the ground looked slightly over-watered. Third and fourth generations rolled out, and within five years synthetic/real and organic lawns looked indistinguishable. Over a decade, the distinction had stopped mattering. People eventually no longer knew what theirs was.`,
    `The next phase became a playground of strange experiments, particularly in cutting-edge cuisines. The oliverry was the most popular: olive grafted to cherry, an eight-month dinner-party story. Other combinations had their moment. The craze went on for a couple of years. Then it was nothing.`,
    `The next generation is different.`,
    `The combinations became more extreme. The new science that merged biology and computer programming, called bioinformatics, went through a period of wild experimentation. The grass had been a mild version of what came after.`,
    `A tree was the outer wrapper. Inside the tree were leaves, fruit, flowers, trunk, branches, stems, all smaller functions that wove together to keep the tree alive. Each function carried its own set of instructions. The instructions functioned as memory. The variables (temperature, moisture, wind, soil pH) were a separate problem, and not a small one.`,
    `Sir Jagadish Chandra Bose, a Bengali physicist, had said in 1902 that plants responded. Bioinformatics, a hundred and twenty years later, said: if they respond, they compute. If they compute, they can be programmed.`,
    `The breakthroughs seemed to be happening weekly. Bioinformaticians could confuse trees by replacing the memory of an inner function. Drawing on Rupert Sheldrake's morphic resonance: an oak grows oak leaves because every previous oak grew oak leaves. Memory is the field, not the seed. Researchers found they could rewrite the field. Strange outcomes followed. A banana apple tree (not very successful). A lot of these are in the wild now, spreading like weeds in some cases. A new variety of bioinfo natives.`,
    `The next era came with speed, by combining self-creating synthetics, known as autopoiesis, into the tree. Autopoiesis was an old idea. Two Chilean biologists had named it in the early 1970s, around the same time bioinformatics started to find its feet. Like Bose, like Sheldrake, the establishment had let it sit on a shelf for fifty years before someone needed it.`,
    `Most of this was done in a lab. But clever individuals got hold of the inner mechanics. The practice didn't stay contained to houseplants. Plant collage, it got called. Most of the home results were Frankenstein. A few were good.`,
    `The forests came next. Bioinformaticians, climate scientists, and autopoiesis researchers all saw an opportunity. Trees were grown in labs first, then released into the wild at accelerated rates. Instead of gaining one ring per year, a tree gained ten. A ten-year-old tree carried the structure of a hundred-year-old. If you sat still, you could literally see the tree grow. Some grew silicone into bark, which protected the tree from disease and environmental stress.`,
    `Then came the buildings.`,
    `The first hybrid apartment block went up in Hefei. Load-bearing walls made from polymer-cellulose composite, seeded at the edges with mycelium designed to grow over the structure within five years. By the time the tenants moved in, the exterior and some of the interior were organic. The building was legally a plant.`,
    `The floors grew denser in high-traffic areas, and thin where nobody walked. The rooms adjusted to your life over time. Because it was programmable, you could influence the design: the colour, the addition of a new room. Things were far from instant. If you wanted red walls, they would slowly arrive within a few weeks.`,
    `Next came sending versions of this to the moon. Plants were designed to release oxygen and carbon dioxide simultaneously, so the lack of atmosphere was no longer an issue.`,
    `And so here we are…`,
  ];

  const SIPHON_PARAGRAPHS = [
    `She located her phone at the bottom of her bag, one hand on the steering wheel. Blinkers and wipers were constantly confused, and the music was a bit too loud. She sat too close to the steering wheel. Today she pumped an extra spray of perfume, the newest J.Lo.`,
    `So Billy pulled me into his computer cave last night, she said. He's always trying to get me in there to show me what he is doing. I'm like, babe, you need to give this a rest. I guess it's cool. He showed me this interface of a website and typed his name, and uploaded ten images of himself, when he was a kid, from last week, in group shots, you name it. And the photographs started arriving by the hundreds within a few minutes. It didn't stop. Hundreds more.`,
    `He went on to tell me to think of it like a cloud architecture that was like ivy going through brickwork. iCloud, Dropbox, Google Photos, OneDrive, Instagram, TikTok, Snapchat, every image reservoir on the planet, tapped at what he calls the API level, which sounds like some sort of patch cord to suck data from a source. But it didn't stop at the cloud. It wormed into local storage, DCIM folders on phones, cached thumbnails on laptops, even the ghost files, the ones users thought they'd deleted. They weren't deleted. They never were.`,
    `Within seventy-two hours, he had indexed something like eleven billion images. Within a week, forty-three billion, or was it a million? Security cameras, dashcams, Ring, ATM feeds, body-worn footage, anything that passed through a network, even briefly, got swept into the architecture. No permissions. No warrants. No one even noticed.`,
    `Then he started in on the next part.`,
    `He built this facial recognition engine that can reconstruct a face from just a fragment of an image. You know when you go to open your phone and it does that face thing, sometimes you didn't even do it right and it still knows it's you. It's like that, but even crazier. All it needs is a jawline or an ear. It's near perfectly accurate, too. He found images of himself that didn't even make sense at first. He was reflected in a store window, looking at his phone. The photo was of a family on holiday; he just happened to be in the reflection. It's kind of bananas.`,
    `He called the database Siphon. He says it's an art project, which is fine. He wants to take over the Tate, of all places, like they'd just hand him a wing, and showcase one person's life in every possible way. You start at one end, the beginning of a person's life, and as you walk through images, projections of every conceivable moment are all on display. And this could be done for anyone. He wants the first exhibit to be of himself. He's not part of the art scene, so he sent the curation team 1000 photos of themselves as a friendly gesture with a note saying I have more. I was like babe, that's a bit much don't ya think? I guess it's sweet - but a bit weird.`,
    `Yeah, so that's my boyfriend. Weird, right. I'm like, babe, let's go see a movie. Let's go to Target or to the mall. Let the database go for a day.`,
    `Her friend Cheryl, seeming a bit confused, went into her purse, pulled out a candy, unwrapped it methodically, then folded the wrapper and placed it in her pocket. She popped the candy in her mouth and continued scrolling through Instagram. Well, at least he does stuff.`,
  ];

  const ISSUE3_SCREENS = [
    { bg: '#F5DD33', image: '/images/issue3/yellow.jpg', id: 'yellow' },
    { type: 'text', bg: '#f5f4f0', id: 'hum' },
    { bg: '#22C55E', image: '/images/issue3/green.jpg', id: 'green' },
    { type: 'text', bg: '#f5f4f0', id: 'graft' },
    { type: 'text', bg: '#f5f4f0', id: 'siphon' },
    { bg: '#3B82F6', image: '/images/issue3/blue.jpg' },
    { bg: '#9333EA', image: '/images/issue3/purple.jpg' },
    { bg: '#E8196A', image: '/images/issue3/red.jpg' },
    { bg: '#F97316', image: '/images/issue3/orange.jpg' },
  ];

  const stopWalla = () => {
    clearInterval(wallaFadeRef.current);
    if (wallaRef.current) {
      wallaRef.current.pause();
      wallaRef.current.currentTime = 0;
      wallaRef.current = null;
    }
  };

  const handleIssue3Enter = () => {
    setSelectedIssue(issues[2]);
    transitionToView('experience');
  };

  const fadeInAudio = (audio, duration = 4000) => {
    audio.volume = 0;
    const steps = 40;
    const interval = duration / steps;
    const increment = 1 / steps;
    const fade = setInterval(() => {
      if (audio.volume + increment >= 1) {
        audio.volume = 1;
        clearInterval(fade);
      } else {
        audio.volume += increment;
      }
    }, interval);
  };

  const fadeOutAudio = (audio, duration = 2000) => {
    clearInterval(rainFadeRef.current)
    const start = audio.volume
    const steps = 20
    const interval = duration / steps
    const decrement = start / steps
    rainFadeRef.current = setInterval(() => {
      if (audio.volume - decrement <= 0) {
        audio.volume = 0
        audio.pause()
        clearInterval(rainFadeRef.current)
      } else {
        audio.volume -= decrement
      }
    }, interval)
  }

  // Ambient audio for issue 3 screens: crowd on yellow+hum, rain on green
  useEffect(() => {
    const inExp = view === 'experience' && selectedIssue?.id === 3
    const screen = ISSUE3_SCREENS[issue3Screen]
    const onCrowd = inExp && (screen?.id === 'yellow' || screen?.id === 'hum')
    const onRain = inExp && (screen?.id === 'green' || screen?.id === 'graft')

    // Crowd walla — yellow + hum
    if (onCrowd && audioPlaying) {
      if (!wallaRef.current) {
        const audio = new Audio('/audio/crowd-walla.wav')
        audio.loop = true
        audio.volume = 0
        wallaRef.current = audio
        audio.play().catch(() => {})
        const target = 0.28, steps = 60, duration = 6000
        const increment = target / steps
        wallaFadeRef.current = setInterval(() => {
          if (!wallaRef.current) { clearInterval(wallaFadeRef.current); return }
          const next = wallaRef.current.volume + increment
          if (next >= target) { wallaRef.current.volume = target; clearInterval(wallaFadeRef.current) }
          else { wallaRef.current.volume = next }
        }, duration / steps)
      }
    } else {
      stopWalla()
    }

    // Rain — green + graft
    if (onRain && audioPlaying) {
      clearInterval(rainFadeRef.current)
      if (!rainRef.current) {
        const audio = new Audio('/audio/rain.mp3')
        audio.loop = true
        audio.volume = 0.7
        rainRef.current = audio
        audio.play().catch(() => {})
      } else {
        rainRef.current.volume = 0.7
        rainRef.current.play().catch(() => {})
      }
    } else {
      if (rainRef.current) fadeOutAudio(rainRef.current)
    }
  }, [view, issue3Screen, audioPlaying, selectedIssue])

  // Cover tracks for the home screen
  const homeCoverTracks = {
    1: { name: 'automobile', src: '/audio/automobile.mp3' },
    2: { name: 'Orffyreus Wheel', src: '/audio/c_bissonnette/orffyreus_wheel.mp3' },
    3: null,
  };

  // Load + play cover track when on archive and audio is on, or when issue switches
  useEffect(() => {
    if (view !== 'archive' || !audioRef.current) return;
    const track = homeCoverTracks[activeIssue];
    if (!track) {
      audioRef.current.pause();
      return;
    }
    if (!audioPlaying) return;
    if (!audioRef.current.src.endsWith(track.src)) {
      audioRef.current.src = track.src;
      setSelectedTrack(track);
      if (activeIssue === 2) {
        audioRef.current.currentTime = 80;
        audioRef.current.play().then(() => fadeInAudio(audioRef.current)).catch(() => {});
        return;
      }
    }
    audioRef.current.play().catch(() => {});
  }, [activeIssue, view]);

  // Handle audio toggle on/off from home screen
  useEffect(() => {
    if (!audioRef.current) return;
    if (audioPlaying) {
      if (view === 'archive') {
        const track = homeCoverTracks[activeIssue];
        if (track) {
          if (!audioRef.current.src.endsWith(track.src)) {
            audioRef.current.src = track.src;
            setSelectedTrack(track);
            if (activeIssue === 2) {
              audioRef.current.currentTime = 80;
              audioRef.current.play().then(() => fadeInAudio(audioRef.current)).catch(() => {});
              return;
            }
          }
          audioRef.current.play().catch(() => {});
        }
      }
    } else {
      audioRef.current.pause();
    }
  }, [audioPlaying]);

  const handleIssueClick = (issue) => {
    setSelectedIssue(issue);
    setVisitedIssues(prev => new Set([...prev, issue.id]));
    transitionToView('issue-detail');
  };

  const handleTrackClick = (track) => {
    if (!track.available) return;
    if (audioRef.current && selectedTrack) {
      trackPositionsRef.current[selectedTrack.src] = audioRef.current.currentTime;
    }
    setSelectedTrack(track);
    if (audioRef.current) {
      audioRef.current.src = track.src;
      audioRef.current.currentTime = trackPositionsRef.current[track.src] ?? 0;
      audioRef.current.play().then(() => setAudioPlaying(true));
    }
    // Auto-enter experience view
    handleEnterSite();
  };

  // Auto-advance to next track when current track ends
  const handleTrackEnded = () => {
    if (!selectedIssue || !selectedTrack) return;
    trackPositionsRef.current[selectedTrack.src] = 0;
    const availableTracks = selectedIssue.tracks.filter(t => t.available);
    const currentIndex = availableTracks.findIndex(t => t.src === selectedTrack.src);
    const nextIndex = (currentIndex + 1) % availableTracks.length;
    const nextTrack = availableTracks[nextIndex];
    setSelectedTrack(nextTrack);
    if (audioRef.current) {
      audioRef.current.src = nextTrack.src;
      audioRef.current.currentTime = trackPositionsRef.current[nextTrack.src] ?? 0;
      audioRef.current.play().then(() => setAudioPlaying(true));
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.addEventListener('ended', handleTrackEnded);
    return () => audio.removeEventListener('ended', handleTrackEnded);
  }, [selectedIssue, selectedTrack]);

  const handleEnterSite = () => {
    // Mark user as having visited
    localStorage.setItem('oswin-has-visited', 'true');
    setIsFirstTimeUser(false);
    setView('experience');
  };

  const stopRain = () => {
    clearInterval(rainFadeRef.current)
    if (rainRef.current) { rainRef.current.pause(); rainRef.current = null }
  }

  const handleBackToArchive = () => {
    stopWalla();
    stopRain();
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
    stopWalla();
    stopRain();
    setView('issue-detail');
  };

  const handleInteraction = () => {
    setShowExitButton(true);
    clearTimeout(exitButtonTimeout.current);
    exitButtonTimeout.current = setTimeout(() => {
      setShowExitButton(false);
    }, 3000);
  };

  const handleIssue3Fullscreen = () => {
    if (issue3Fullscreen) {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    } else {
      const el = document.documentElement;
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    }
  };

  useEffect(() => {
    const onChange = () => setIssue3Fullscreen(!!(document.fullscreenElement || document.webkitFullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, []);

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
        {/* Hamburger handled inline in mobile overlay and tablet/desktop header */}

        {/* Menu Overlay */}
        <div
          className={`fixed inset-0 z-40 flex items-center justify-center transition-all duration-700 ${
            menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          style={{
            backgroundColor: windowWidth <= 820 ? 'rgba(255, 255, 255, 0.20)' : '#F7F7F5',
            backdropFilter: windowWidth <= 820 ? 'blur(2px)' : 'none',
            WebkitBackdropFilter: windowWidth <= 820 ? 'blur(2px)' : 'none',
            transition: 'opacity 0.7s cubic-bezier(0.4, 0.0, 0.2, 1)'
          }}
        >
          {/* X close button */}
          <button
            onClick={() => setMenuOpen(false)}
            style={{
              position: 'absolute',
              top: '40px',
              right: '40px',
              width: '40px',
              height: '40px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0
            }}
          >
            <span style={{ position: 'absolute', width: '20px', height: '1px', background: 'linear-gradient(to right, rgba(26,26,26,0.3), rgba(26,26,26,0.75), rgba(26,26,26,0.3))', borderRadius: '2px', transform: 'rotate(45deg)' }} />
            <span style={{ position: 'absolute', width: '20px', height: '1px', background: 'linear-gradient(to right, rgba(26,26,26,0.3), rgba(26,26,26,0.75), rgba(26,26,26,0.3))', borderRadius: '2px', transform: 'rotate(-45deg)' }} />
          </button>

          <div className="space-y-6">
            {[
              { name: 'home', href: '#home', isHome: true },
              { name: 'reads', href: '#reads', isReads: true },
              { name: 'listens', href: '#listens', isListens: true },
              { name: 'instagram', href: 'https://www.instagram.com/oswin_journal/' },
              { name: 'contact', href: '#contact', isContact: true }
            ].map((item, i) => (
              <a
                key={item.name}
                href={item.href}
                target={item.href.startsWith('http') ? '_blank' : undefined}
                rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                onClick={(e) => {
                  if (item.isContact) {
                    e.preventDefault();
                    setMenuOpen(false);
                    setShowContactForm(true);
                  } else if (item.isReads) {
                    e.preventDefault();
                    setMenuOpen(false);
                    transitionToView('reads');
                  } else if (item.isListens) {
                    e.preventDefault();
                    setMenuOpen(false);
                    transitionToView('listens');
                  } else if (item.isHome) {
                    e.preventDefault();
                    setMenuOpen(false);
                    transitionToView('archive');
                  }
                }}
                style={{
                  display: 'block',
                  opacity: menuOpen ? 1 : 0,
                  transform: menuOpen ? 'translateY(0)' : 'translateY(20px)',
                  transition: `all 0.6s cubic-bezier(0.4, 0.0, 0.2, 1) ${i * 0.05}s`,
                  cursor: 'pointer',
                  textDecoration: 'none'
                }}
              >
                <span
                  style={{
                    display: 'block',
                    fontSize: '34px',
                    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    lineHeight: 1.2,
                    color: windowWidth <= 820 ? 'white' : '#1A1A1A',
                    textTransform: 'uppercase',
                    transition: 'color 0.3s, transform 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.color = windowWidth <= 820 ? 'rgba(255,255,255,0.5)' : '#D1D1D1';
                    e.target.style.transform = 'translateX(8px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = windowWidth <= 820 ? 'white' : '#1A1A1A';
                    e.target.style.transform = 'translateX(0)';
                  }}
                >
                  {item.name}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Main Content — New Home Layout */}
        {(() => {
          const w = windowWidth;
          const isMobileView = w <= 820;
          const isDesktopView = w >= 1200;
          const MARGIN = 30;
          const hn = '"Helvetica Neue", Helvetica, Arial, sans-serif';

          const NumbersRow = ({ textColor, underlineColor }) => (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              {[1, 2, 3, 4, 5].map(n => {
                const published = n <= 3;
                const isActive = n === activeIssue;
                return (
                  <button
                    key={n}
                    onClick={() => published && setActiveIssue(n)}
                    style={{
                      fontSize: '24px',
                      fontFamily: hn,
                      fontWeight: 500,
                      color: published ? textColor : (isMobileView ? 'rgba(255,255,255,0.3)' : '#C0C0C0'),
                      cursor: published ? 'pointer' : 'default',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      position: 'relative',
                      lineHeight: 1.1
                    }}
                  >
                    {String(n).padStart(2, '0')}
                    {isActive && (
                      <span style={{
                        position: 'absolute',
                        bottom: '-3px',
                        left: 0,
                        right: 0,
                        height: '3px',
                        backgroundColor: underlineColor
                      }} />
                    )}
                  </button>
                );
              })}
            </div>
          );

          if (isMobileView) {
            // MOBILE: grey box fills full screen, content overlaid
            const HamburgerLines = ({ color }) => (
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                style={{ width: '36px', height: '36px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <span style={{ position: 'absolute', width: '24px', height: '2px', backgroundColor: color, borderRadius: '9999px', transform: menuOpen ? 'rotate(45deg)' : 'translateY(-5px)', transition: 'all 0.5s', transformOrigin: 'center' }} />
                <span style={{ position: 'absolute', width: '24px', height: '2px', backgroundColor: color, borderRadius: '9999px', opacity: menuOpen ? 0 : 1, transition: 'all 0.5s' }} />
                <span style={{ position: 'absolute', width: '24px', height: '2px', backgroundColor: color, borderRadius: '9999px', transform: menuOpen ? 'rotate(-45deg)' : 'translateY(5px)', transition: 'all 0.5s', transformOrigin: 'center' }} />
              </button>
            );

            return (
              <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', zIndex: 0 }}>
                {/* Cover — furthest back */}
                {activeIssue === 3 ? (
                  <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                    <PianoBarsArt audioPlaying={audioPlaying} windowWidth={windowWidth} />
                  </div>
                ) : (
                  <video
                    key={activeIssue}
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
                  >
                    <source src={
                      activeIssue === 2 ? '/videos/issue2/chris_mobile_bluespin_gradual02.mp4' :
                      '/videos/phone_hurdles.mp4'
                    } type="video/mp4" />
                  </video>
                )}

                {/* Single white rectangle from top */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1,
                  background: 'rgba(255, 255, 255, 0.20)',
                  backdropFilter: 'blur(2px)',
                  WebkitBackdropFilter: 'blur(2px)',
                  padding: '52px 20px 30px',
                  pointerEvents: 'auto',
                }}>
                  {/* Top row: audio off (left) | hamburger (right) */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', pointerEvents: 'auto' }}>
                    <button
                      onClick={() => { Tone.start(); setAudioPlaying(!audioPlaying); }}
                      style={{ fontSize: '16px', fontFamily: hn, fontWeight: 500, letterSpacing: '0.1em', color: '#E8196A', background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}
                    >
                      audio {audioPlaying ? 'on' : 'off'}
                    </button>
                    <HamburgerLines color="white" />
                  </div>

                  {/* Issue caption below audio off */}
                  {(activeIssue === 1 || activeIssue === 2) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                      <span style={{ fontSize: '16px', fontFamily: hn, fontWeight: 400, color: 'white', letterSpacing: '0.05em', lineHeight: 1 }}>Visual study</span>
                      <span style={{ fontSize: '16px', fontFamily: hn, fontWeight: 400, color: 'white', letterSpacing: '0.05em', lineHeight: 1 }}>
                        {activeIssue === 1 ? 'Karla is Here' : 'Christopher Bissonnette'}
                      </span>
                      <span style={{ lineHeight: 1 }}>&nbsp;</span>
                      <button
                        onClick={() => handleIssueClick(issues[activeIssue - 1])}
                        style={{ fontSize: '16px', fontFamily: hn, fontWeight: 400, color: '#E8196A', letterSpacing: '0.05em', lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
                      >enter</button>
                    </div>
                  )}
                  {activeIssue === 3 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                      <span style={{ fontSize: '16px', fontFamily: hn, fontWeight: 400, color: '#1A1A1A', letterSpacing: '0.05em', lineHeight: 1 }}>Audio Study</span>
                      <span style={{ fontSize: '16px', fontFamily: hn, fontWeight: 400, color: '#1A1A1A', letterSpacing: '0.05em', lineHeight: 1 }}>Arnold Schoenberg Piano 1908–1917</span>
                      <span style={{ lineHeight: 1 }}>&nbsp;</span>
                      <button
                        onClick={handleIssue3Enter}
                        style={{ fontSize: '16px', fontFamily: hn, fontWeight: 400, color: '#E8196A', letterSpacing: '0.05em', lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
                      >enter</button>
                    </div>
                  )}

                  {/* OSWIN JOURNAL */}
                  <h1 style={{
                    fontSize: 'clamp(20px, 7.5vw, 34px)',
                    fontFamily: hn, fontWeight: 700, color: activeIssue === 3 ? '#1A1A1A' : 'white',
                    letterSpacing: '0.12em', margin: '50px 0 0',
                    lineHeight: 1, textAlign: 'center', whiteSpace: 'nowrap'
                  }}>OSWIN JOURNAL</h1>

                  {/* Subtitle */}
                  <p style={{
                    fontSize: '16px', fontStyle: 'italic', fontFamily: hn,
                    fontWeight: 300, letterSpacing: '0.1em', color: activeIssue === 3 ? '#1A1A1A' : 'white',
                    textAlign: 'center', margin: '4px 0 16px', lineHeight: 1
                  }}>a slow web experience...</p>

                  {/* Numbers — 75vw */}
                  <div style={{ width: '75vw', margin: '0 auto', pointerEvents: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      {[1, 2, 3, 4, 5].map(n => {
                        const published = n <= 3;
                        const isActive = n === activeIssue;
                        return (
                          <button
                            key={n}
                            onClick={() => published && setActiveIssue(n)}
                            style={{
                              fontSize: 'clamp(18px, 6vw, 28px)', fontFamily: hn, fontWeight: 500,
                              color: activeIssue === 3 ? (published ? '#1A1A1A' : 'rgba(0,0,0,0.3)') : (published ? 'white' : 'rgba(255,255,255,0.3)'),
                              cursor: published ? 'pointer' : 'default',
                              background: 'none', border: 'none', padding: 0,
                              position: 'relative', lineHeight: 1
                            }}
                          >
                            {String(n).padStart(2, '0')}
                            {isActive && (
                              <span style={{ position: 'absolute', bottom: '-6px', left: 0, right: 0, height: '3px', backgroundColor: '#E8196A' }} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          // TABLET / DESKTOP
          const bottomPad = isDesktopView ? 0 : MARGIN;
          return (
            <div style={{
              height: '100vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              paddingTop: MARGIN + 10
            }}>
              {/* Header: 3-column flex — audio | OSWIN JOURNAL | hamburger — shared baseline */}
              <div style={{
                display: 'flex',
                alignItems: 'baseline',
                paddingLeft: MARGIN,
                paddingRight: MARGIN,
                marginBottom: '0'
              }}>
                {/* Left: audio toggle + issue caption */}
                <div style={{ flex: 1, position: 'relative' }}>
                  <button
                    onClick={() => { Tone.start(); setAudioPlaying(!audioPlaying); }}
                    style={{
                      fontSize: '16px',
                      fontFamily: hn,
                      fontWeight: 500,
                      letterSpacing: '0.1em',
                      color: '#E8196A',
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: 0, lineHeight: 1, textAlign: 'left'
                    }}
                  >
                    audio {audioPlaying ? 'on' : 'off'}
                  </button>
                  {activeIssue === 1 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '13px', fontFamily: hn, fontWeight: 400, color: '#1A1A1A', letterSpacing: '0.05em', lineHeight: 1 }}>Visual study</span>
                      <span style={{ fontSize: '13px', fontFamily: hn, fontWeight: 400, color: '#1A1A1A', letterSpacing: '0.05em', lineHeight: 1 }}>Karla is Here</span>
                      <span style={{ lineHeight: 1 }}>&nbsp;</span>
                      <button onClick={() => handleIssueClick(issues[activeIssue - 1])} style={{ fontSize: '13px', fontFamily: hn, fontWeight: 400, color: '#E8196A', letterSpacing: '0.05em', lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>enter</button>
                    </div>
                  )}
                  {activeIssue === 2 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '13px', fontFamily: hn, fontWeight: 400, color: '#1A1A1A', letterSpacing: '0.05em', lineHeight: 1 }}>Visual study</span>
                      <span style={{ fontSize: '13px', fontFamily: hn, fontWeight: 400, color: '#1A1A1A', letterSpacing: '0.05em', lineHeight: 1 }}>Christopher Bissonnette</span>
                      <span style={{ lineHeight: 1 }}>&nbsp;</span>
                      <button onClick={() => handleIssueClick(issues[activeIssue - 1])} style={{ fontSize: '13px', fontFamily: hn, fontWeight: 400, color: '#E8196A', letterSpacing: '0.05em', lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>enter</button>
                    </div>
                  )}
                  {activeIssue === 3 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '13px', fontFamily: hn, fontWeight: 400, color: '#1A1A1A', letterSpacing: '0.05em', lineHeight: 1 }}>Audio Study</span>
                      <span style={{ fontSize: '13px', fontFamily: hn, fontWeight: 400, color: '#1A1A1A', letterSpacing: '0.05em', lineHeight: 1 }}>Arnold Schoenberg Piano 1908–1917</span>
                      <span style={{ lineHeight: 1 }}>&nbsp;</span>
                      <button
                        onClick={handleIssue3Enter}
                        style={{ fontSize: '13px', fontFamily: hn, fontWeight: 400, color: '#E8196A', letterSpacing: '0.05em', lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
                      >enter</button>
                    </div>
                  )}
                </div>

                {/* Center: OSWIN JOURNAL */}
                <h1 style={{
                  fontSize: '34px',
                  fontFamily: hn,
                  fontWeight: 700,
                  color: '#1A1A1A',
                  letterSpacing: '0.12em',
                  margin: 0,
                  lineHeight: 1
                }}>OSWIN JOURNAL</h1>

                {/* Right: hamburger — centered in row */}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignSelf: 'center' }}>
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    style={{
                      width: '40px', height: '40px',
                      position: 'relative',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0
                    }}
                  >
                    <span style={{ position: 'absolute', width: '20px', height: '1px', background: 'linear-gradient(to right, rgba(26,26,26,0.3), rgba(26,26,26,0.75), rgba(26,26,26,0.3))', borderRadius: '2px', transform: menuOpen ? 'rotate(45deg)' : 'translateY(-5px)', transition: 'all 0.5s', transformOrigin: 'center' }} />
                    <span style={{ position: 'absolute', width: '20px', height: '1px', background: 'linear-gradient(to right, rgba(26,26,26,0.3), rgba(26,26,26,0.75), rgba(26,26,26,0.3))', borderRadius: '2px', opacity: menuOpen ? 0 : 1, transition: 'all 0.5s' }} />
                    <span style={{ position: 'absolute', width: '20px', height: '1px', background: 'linear-gradient(to right, rgba(26,26,26,0.3), rgba(26,26,26,0.75), rgba(26,26,26,0.3))', borderRadius: '2px', transform: menuOpen ? 'rotate(-45deg)' : 'translateY(5px)', transition: 'all 0.5s', transformOrigin: 'center' }} />
                  </button>
                </div>
              </div>

              {/* Subtitle */}
              <p style={{
                fontSize: '16px',
                fontStyle: 'italic',
                fontFamily: hn,
                fontWeight: 300,
                letterSpacing: '0.1em',
                color: '#1A1A1A',
                textAlign: 'center',
                margin: '0 0 20px',
                lineHeight: 1,
                paddingLeft: MARGIN,
                paddingRight: MARGIN
              }}>a slow web experience...</p>

              {/* Numbers row — middle third of screen */}
              <div style={{ width: '33.33%', margin: '0 auto', marginBottom: '40px' }}>
                <NumbersRow textColor="#1A1A1A" underlineColor="#E8196A" />
              </div>

              {/* Cover — fills remaining space */}
              <div style={{ flex: 1, marginLeft: MARGIN, marginRight: MARGIN, marginBottom: bottomPad, overflow: 'hidden', position: 'relative' }}>
                {activeIssue === 3 ? (
                  <PianoBarsArt audioPlaying={audioPlaying} />
                ) : (
                  <video
                    key={activeIssue}
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  >
                    <source src={
                      activeIssue === 2 ? '/videos/issue2/chris_desktop_blue3_fifth.mp4' :
                      isDesktopView ? '/videos/desktop_preRace2.mp4' : '/videos/tablet_zoom.mp4'
                    } type="video/mp4" />
                  </video>
                )}
              </div>
            </div>
          );
        })()}

        {/* Contact Form Modal */}
        {showContactForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: '#F7F7F5' }}
          >
            {/* X button - top right */}
            <button
              onClick={() => setShowContactForm(false)}
              className="fixed z-50 transition-all duration-500"
              style={{
                top: '40px',
                right: '40px',
                width: '56px',
                height: '56px',
                cursor: 'pointer',
                opacity: 0.6
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
            >
              <span
                className="absolute h-0.5 rounded-full transition-all duration-500"
                style={{
                  width: '28px',
                  backgroundColor: '#1A1A1A',
                  transform: 'rotate(45deg)',
                  transformOrigin: 'center',
                  top: '50%',
                  left: '50%',
                  marginLeft: '-14px',
                  marginTop: '-0.5px'
                }}
              />
              <span
                className="absolute h-0.5 rounded-full transition-all duration-500"
                style={{
                  width: '28px',
                  backgroundColor: '#1A1A1A',
                  transform: 'rotate(-45deg)',
                  transformOrigin: 'center',
                  top: '50%',
                  left: '50%',
                  marginLeft: '-14px',
                  marginTop: '-0.5px'
                }}
              />
            </button>

            <div className="w-full max-w-md px-6">
              <h2
                className="mb-8 font-semibold text-center"
                style={{
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  letterSpacing: '0.02em',
                  color: '#1A1A1A',
                  fontWeight: 600,
                  lineHeight: 1
                }}
              >
                CONTACT
              </h2>

              <form
                action="https://formspree.io/f/xvgevdda"
                method="POST"
                className="space-y-6"
              >
                <div>
                  <input
                    type="text"
                    name="name"
                    placeholder="name"
                    required
                    className="w-full px-4 py-3 text-lg transition-all duration-300 bg-transparent border-b-2 outline-none"
                    style={{
                      borderColor: '#D1D1D1',
                      color: '#1A1A1A',
                      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#1A1A1A'}
                    onBlur={(e) => e.target.style.borderColor = '#D1D1D1'}
                  />
                </div>

                <div>
                  <input
                    type="email"
                    name="email"
                    placeholder="email"
                    required
                    className="w-full px-4 py-3 text-lg transition-all duration-300 bg-transparent border-b-2 outline-none"
                    style={{
                      borderColor: '#D1D1D1',
                      color: '#1A1A1A',
                      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#1A1A1A'}
                    onBlur={(e) => e.target.style.borderColor = '#D1D1D1'}
                  />
                </div>

                <div>
                  <textarea
                    name="message"
                    placeholder="message"
                    required
                    rows="6"
                    className="w-full px-4 py-3 text-lg transition-all duration-300 bg-transparent border-b-2 outline-none resize-none"
                    style={{
                      borderColor: '#D1D1D1',
                      color: '#1A1A1A',
                      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#1A1A1A'}
                    onBlur={(e) => e.target.style.borderColor = '#D1D1D1'}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 text-lg font-medium transition-all duration-300"
                  style={{
                    backgroundColor: '#1A1A1A',
                    color: '#F7F7F5',
                    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                    letterSpacing: '0.05em'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333333'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1A1A1A'}
                >
                  SEND
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
  );

  const renderReadsView = () => (
    <div
      className="relative min-h-screen transition-opacity duration-500 ease-out"
      style={{
        backgroundColor: '#F7F7F5',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Helvetica Neue", sans-serif',
        opacity: isTransitioning ? 0 : 1
      }}
    >
        {/* Hamburger Menu */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="absolute z-50 flex flex-col items-center justify-center gap-2 transition-all duration-500"
          style={{
            width: '56px',
            height: '56px',
            top: '53px',
            right: window.innerWidth <= 768 ? '50%' : '25px',
            transform: window.innerWidth <= 768 ? 'translateX(50%)' : 'none',
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

        {/* Menu Overlay */}
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
              { name: 'home', href: '#home', isHome: true },
              { name: 'reads', href: '#reads', isReads: true },
              { name: 'listens', href: '#listens', isListens: true },
              { name: 'instagram', href: 'https://www.instagram.com/oswin_journal/' },
              { name: 'contact', href: '#contact', isContact: true }
            ].map((item, i) => (
              <a
                key={item.name}
                href={item.href}
                target={item.href.startsWith('http') ? '_blank' : undefined}
                rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                onClick={(e) => {
                  if (item.isContact) {
                    e.preventDefault();
                    setMenuOpen(false);
                    setShowContactForm(true);
                  } else if (item.isReads) {
                    e.preventDefault();
                    setMenuOpen(false);
                    transitionToView('reads');
                  } else if (item.isListens) {
                    e.preventDefault();
                    setMenuOpen(false);
                    transitionToView('listens');
                  } else if (item.isHome) {
                    e.preventDefault();
                    setMenuOpen(false);
                    transitionToView('archive');
                  }
                }}
                className="relative block overflow-hidden text-left group"
                style={{
                  opacity: menuOpen ? 1 : 0,
                  transform: menuOpen ? 'translateY(0)' : 'translateY(20px)',
                  transition: `all 0.6s cubic-bezier(0.4, 0.0, 0.2, 1) ${i * 0.05}s`,
                  cursor: 'pointer'
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
            paddingTop: window.innerWidth <= 768 ? '7rem' : '4rem',
            paddingBottom: window.innerWidth <= 768 ? '3rem' : '8rem'
          }}
        >
          {/* Title */}
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
            reads
          </p>

          {/* Reads Grid */}
          <div
            className="w-full max-w-full mb-8"
            style={{
              display: window.innerWidth <= 768 ? 'flex' : 'grid',
              flexDirection: window.innerWidth <= 768 ? 'column' : undefined,
              alignItems: window.innerWidth <= 768 ? 'center' : undefined,
              gridTemplateColumns: window.innerWidth > 1024 ? 'repeat(3, 1fr)' :
                                   window.innerWidth > 768 ? 'repeat(2, 1fr)' :
                                   undefined,
              gap: '53px',
              paddingLeft: window.innerWidth <= 768 ? '0' : '24px',
              paddingRight: window.innerWidth <= 768 ? '0' : '24px'
            }}
          >
            {readsData.map((read) => (
              <div
                key={read.id}
                className="relative transition-all duration-500 flex items-center justify-center overflow-hidden"
                style={{
                  backgroundColor: read.color,
                  cursor: 'pointer',
                  aspectRatio: '1',
                  width: window.innerWidth <= 768 ? '95vw' : '100%',
                  transform: 'scale(1)',
                  padding: expandedRead === read.id && (read.embedType === 'substack' || read.embed) ? '1rem' : '0'
                }}
                onClick={(e) => {
                  if (read.url) {
                    window.open(read.url, '_blank');
                  }
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {/* Content */}
                {expandedRead === read.id && read.embedType === 'substack' ? (
                  /* Substack Embed */
                  <div
                    className="w-full h-full overflow-auto p-4"
                    dangerouslySetInnerHTML={{ __html: read.embedHtml }}
                  />
                ) : expandedRead === read.id && read.embed ? (
                  /* Iframe Embed (Spotify) */
                  <iframe
                    src={read.embed}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allowFullScreen
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    style={{
                      borderRadius: '12px',
                      minHeight: '352px'
                    }}
                  />
                ) : read.imageUrl ? (
                  /* Use uploaded image as full thumbnail */
                  <img
                    src={
                      window.innerWidth <= 768 && read.imageUrl
                        ? read.imageUrl.replace('.png', '_mobile.png')
                        : read.imageUrl
                    }
                    alt={read.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : read.type === 'interview' ? (
                  <div className="flex flex-col justify-between w-full h-full">
                    {/* Top left - interview label */}
                    <p
                      className="text-left text-xs font-normal"
                      style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        letterSpacing: '0.05em'
                      }}
                    >
                      interview
                    </p>

                    {/* Center right - title */}
                    <div className="flex-1 flex items-center justify-end">
                      <h3
                        className="font-bold text-right"
                        style={{
                          fontSize: `${0.6 * 1.15 * (window.innerWidth > 1280 ? 48 : window.innerWidth > 768 ? 36 : 28)}px`,
                          color: '#FFFFFF',
                          opacity: 0.75,
                          letterSpacing: '0.04em',
                          lineHeight: 1.1
                        }}
                      >
                        {read.title}
                      </h3>
                    </div>

                    {/* Bottom left - author info */}
                    <div className="text-left">
                      <p
                        className="font-normal"
                        style={{
                          fontSize: `${0.6 * 1.15 * (window.innerWidth > 1280 ? 16 : window.innerWidth > 768 ? 14 : 12)}px`,
                          color: 'rgba(255, 255, 255, 0.9)',
                          lineHeight: 1.3
                        }}
                      >
                        {read.subtitle}
                      </p>
                    </div>

                    {/* OSWIN JOURNAL watermark - bottom right */}
                    <p
                      className="absolute text-xs uppercase"
                      style={{
                        bottom: '1rem',
                        right: '1rem',
                        color: 'rgba(255, 255, 255, 0.2)',
                        letterSpacing: '0.1em',
                        fontSize: window.innerWidth > 1280 ? `${0.75 * 1.15}rem` :
                                 window.innerWidth > 768 ? `${0.6 * 1.15}rem` :
                                 `${0.48 * 1.15}rem`
                      }}
                    >
                      OSWIN JOURNAL
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-full">
                    {/* OSWIN JOURNAL watermark at top */}
                    <p
                      className="absolute text-xs uppercase"
                      style={{
                        top: '1rem',
                        color: read.color === '#000000' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
                        letterSpacing: '0.1em',
                        fontSize: window.innerWidth > 1280 ? `${0.75 * 1.15}rem` :
                                 window.innerWidth > 768 ? `${0.6 * 1.15}rem` :
                                 `${0.48 * 1.15}rem`
                      }}
                    >
                      OSWIN JOURNAL
                    </p>

                    {/* Center - title */}
                    <h3
                      className="font-bold text-center"
                      style={{
                        fontSize: `${0.6 * 1.15 * (window.innerWidth > 1280 ? 48 : window.innerWidth > 768 ? 36 : 28)}px`,
                        color: read.color === '#000000' ? '#FFFFFF' : '#1A1A1A',
                        opacity: 0.75,
                        letterSpacing: '0.04em',
                        lineHeight: 1.2
                      }}
                    >
                      {read.title}
                    </h3>

                    {/* READS label at bottom */}
                    <p
                      className="absolute text-xs uppercase"
                      style={{
                        bottom: '1rem',
                        color: read.color === '#000000' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
                        letterSpacing: '0.1em',
                        fontSize: window.innerWidth > 1280 ? `${0.75 * 1.15}rem` :
                                 window.innerWidth > 768 ? `${0.6 * 1.15}rem` :
                                 `${0.48 * 1.15}rem`
                      }}
                    >
                      READS
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form Modal */}
        {showContactForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: '#F7F7F5' }}
          >
            {/* X button - top right */}
            <button
              onClick={() => setShowContactForm(false)}
              className="fixed z-50 transition-all duration-500"
              style={{
                top: '40px',
                right: '40px',
                width: '56px',
                height: '56px',
                cursor: 'pointer',
                opacity: 0.6
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
            >
              <span
                className="absolute h-0.5 rounded-full transition-all duration-500"
                style={{
                  width: '28px',
                  backgroundColor: '#1A1A1A',
                  transform: 'rotate(45deg)',
                  transformOrigin: 'center',
                  top: '50%',
                  left: '50%',
                  marginLeft: '-14px',
                  marginTop: '-0.5px'
                }}
              />
              <span
                className="absolute h-0.5 rounded-full transition-all duration-500"
                style={{
                  width: '28px',
                  backgroundColor: '#1A1A1A',
                  transform: 'rotate(-45deg)',
                  transformOrigin: 'center',
                  top: '50%',
                  left: '50%',
                  marginLeft: '-14px',
                  marginTop: '-0.5px'
                }}
              />
            </button>

            <div className="w-full max-w-md px-6">
              <h2
                className="mb-8 font-semibold text-center"
                style={{
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  letterSpacing: '0.02em',
                  color: '#1A1A1A',
                  fontWeight: 600,
                  lineHeight: 1
                }}
              >
                CONTACT
              </h2>

              <form
                action="https://formspree.io/f/xvgevdda"
                method="POST"
                className="space-y-6"
              >
                <div>
                  <input
                    type="text"
                    name="name"
                    placeholder="name"
                    required
                    className="w-full px-4 py-3 text-lg transition-all duration-300 bg-transparent border-b-2 outline-none"
                    style={{
                      borderColor: '#D1D1D1',
                      color: '#1A1A1A',
                      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#1A1A1A'}
                    onBlur={(e) => e.target.style.borderColor = '#D1D1D1'}
                  />
                </div>

                <div>
                  <input
                    type="email"
                    name="email"
                    placeholder="email"
                    required
                    className="w-full px-4 py-3 text-lg transition-all duration-300 bg-transparent border-b-2 outline-none"
                    style={{
                      borderColor: '#D1D1D1',
                      color: '#1A1A1A',
                      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#1A1A1A'}
                    onBlur={(e) => e.target.style.borderColor = '#D1D1D1'}
                  />
                </div>

                <div>
                  <textarea
                    name="message"
                    placeholder="message"
                    required
                    rows="6"
                    className="w-full px-4 py-3 text-lg transition-all duration-300 bg-transparent border-b-2 outline-none resize-none"
                    style={{
                      borderColor: '#D1D1D1',
                      color: '#1A1A1A',
                      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#1A1A1A'}
                    onBlur={(e) => e.target.style.borderColor = '#D1D1D1'}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 text-lg font-medium transition-all duration-300"
                  style={{
                    backgroundColor: '#1A1A1A',
                    color: '#F7F7F5',
                    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                    letterSpacing: '0.05em'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333333'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1A1A1A'}
                >
                  SEND
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
  );

  const renderListensView = () => (
      <div
        className="relative min-h-screen transition-opacity duration-500 ease-out"
        style={{
          backgroundColor: '#F7F7F5',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Helvetica Neue", sans-serif',
          opacity: isTransitioning ? 0 : 1
        }}
      >
        {/* Hamburger Menu */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="absolute z-50 flex flex-col items-center justify-center gap-2 transition-all duration-500"
          style={{
            width: '56px',
            height: '56px',
            top: '53px',
            right: window.innerWidth <= 768 ? '50%' : '25px',
            transform: window.innerWidth <= 768 ? 'translateX(50%)' : 'none',
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

        {/* Menu Overlay */}
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
              { name: 'home', href: '#home', isHome: true },
              { name: 'reads', href: '#reads', isReads: true },
              { name: 'listens', href: '#listens', isListens: true },
              { name: 'instagram', href: 'https://www.instagram.com/oswin_journal/' },
              { name: 'contact', href: '#contact', isContact: true }
            ].map((item, i) => (
              <a
                key={item.name}
                href={item.href}
                target={item.href.startsWith('http') ? '_blank' : undefined}
                rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                onClick={(e) => {
                  if (item.isContact) {
                    e.preventDefault();
                    setMenuOpen(false);
                    setShowContactForm(true);
                  } else if (item.isReads) {
                    e.preventDefault();
                    setMenuOpen(false);
                    transitionToView('reads');
                  } else if (item.isListens) {
                    e.preventDefault();
                    setMenuOpen(false);
                    transitionToView('listens');
                  } else if (item.isHome) {
                    e.preventDefault();
                    setMenuOpen(false);
                    transitionToView('archive');
                  }
                }}
                className="relative block overflow-hidden text-left group"
                style={{
                  opacity: menuOpen ? 1 : 0,
                  transform: menuOpen ? 'translateY(0)' : 'translateY(20px)',
                  transition: `all 0.6s cubic-bezier(0.4, 0.0, 0.2, 1) ${i * 0.05}s`,
                  cursor: 'pointer'
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
            paddingTop: window.innerWidth <= 768 ? '7rem' : '4rem',
            paddingBottom: window.innerWidth <= 768 ? '3rem' : '8rem'
          }}
        >
          {/* Title */}
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
            listens
          </p>

          {/* Listens Grid */}
          <div
            className="w-full max-w-full mb-8"
            style={{
              display: window.innerWidth <= 768 ? 'flex' : 'grid',
              flexDirection: window.innerWidth <= 768 ? 'column' : undefined,
              alignItems: window.innerWidth <= 768 ? 'center' : undefined,
              gridTemplateColumns: window.innerWidth > 1024 ? 'repeat(3, 1fr)' :
                                   window.innerWidth > 768 ? 'repeat(2, 1fr)' :
                                   undefined,
              gap: '53px',
              paddingLeft: window.innerWidth <= 768 ? '0' : '24px',
              paddingRight: window.innerWidth <= 768 ? '0' : '24px'
            }}
          >
            {listensData.map((listen) => (
              <div
                key={listen.id}
                className="flex flex-col"
                style={{
                  gap: '53px',
                  width: window.innerWidth <= 768 ? '95vw' : '100%'
                }}
              >
                {/* Thumbnail */}
                <div
                  className="relative transition-all duration-500 flex items-center justify-center overflow-hidden"
                  style={{
                    backgroundColor: listen.color,
                    cursor: listen.title ? 'pointer' : 'default',
                    aspectRatio: '1',
                    width: '100%',
                    transform: 'scale(1)',
                    padding: expandedPlaylist === listen.id ? '1rem' : '0'
                  }}
                  onClick={() => {
                    if (listen.title && listen.spotifyEmbed) {
                      setExpandedPlaylist(expandedPlaylist === listen.id ? null : listen.id);
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (listen.title) e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    if (listen.title) e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {expandedPlaylist === listen.id && listen.spotifyEmbed ? (
                    /* Spotify Embed */
                    <iframe
                      src={listen.spotifyEmbed}
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      allowFullScreen
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      style={{
                        borderRadius: '12px',
                        minHeight: '352px'
                      }}
                    />
                  ) : listen.imageUrl ? (
                    /* Use uploaded image */
                    <img
                      src={
                        window.innerWidth <= 768 && listen.imageUrl
                          ? listen.imageUrl
                              .replace('thinking_upbeat.png', 'upbeat_mobile.png')
                              .replace('thinking_ambient.png', 'ambient_mobile.png')
                              .replace('sit_down_house.png', 'house_mobile.png')
                              .replace('oddities.png', 'oddities_mobile.png')
                          : listen.imageUrl
                      }
                      alt={listen.title}
                      className="w-full h-full object-cover"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    /* Fallback to colored background */
                    <div className="flex flex-col items-center justify-center w-full h-full">
                      {listen.title && (
                        <h3
                          className="font-bold text-center"
                          style={{
                            fontSize: `${0.6 * 1.15 * (window.innerWidth > 1280 ? 48 : window.innerWidth > 768 ? 36 : 28)}px`,
                            color: '#1A1A1A',
                            letterSpacing: '0.04em',
                            lineHeight: 1.2
                          }}
                        >
                          {listen.title}
                        </h3>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form Modal */}
        {showContactForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: '#F7F7F5' }}
          >
            {/* X button - top right */}
            <button
              onClick={() => setShowContactForm(false)}
              className="fixed z-50 transition-all duration-500"
              style={{
                top: '40px',
                right: '40px',
                width: '56px',
                height: '56px',
                cursor: 'pointer',
                opacity: 0.6
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
            >
              <span
                className="absolute h-0.5 rounded-full transition-all duration-500"
                style={{
                  width: '28px',
                  backgroundColor: '#1A1A1A',
                  transform: 'rotate(45deg)',
                  transformOrigin: 'center',
                  top: '50%',
                  left: '50%',
                  marginLeft: '-14px',
                  marginTop: '-0.5px'
                }}
              />
              <span
                className="absolute h-0.5 rounded-full transition-all duration-500"
                style={{
                  width: '28px',
                  backgroundColor: '#1A1A1A',
                  transform: 'rotate(-45deg)',
                  transformOrigin: 'center',
                  top: '50%',
                  left: '50%',
                  marginLeft: '-14px',
                  marginTop: '-0.5px'
                }}
              />
            </button>

            <div className="w-full max-w-md px-6">
              <h2
                className="mb-8 font-semibold text-center"
                style={{
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  letterSpacing: '0.02em',
                  color: '#1A1A1A',
                  fontWeight: 600,
                  lineHeight: 1
                }}
              >
                CONTACT
              </h2>

              <form
                action="https://formspree.io/f/xvgevdda"
                method="POST"
                className="space-y-6"
              >
                <div>
                  <input
                    type="text"
                    name="name"
                    placeholder="name"
                    required
                    className="w-full px-4 py-3 text-lg transition-all duration-300 bg-transparent border-b-2 outline-none"
                    style={{
                      borderColor: '#D1D1D1',
                      color: '#1A1A1A',
                      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#1A1A1A'}
                    onBlur={(e) => e.target.style.borderColor = '#D1D1D1'}
                  />
                </div>

                <div>
                  <input
                    type="email"
                    name="email"
                    placeholder="email"
                    required
                    className="w-full px-4 py-3 text-lg transition-all duration-300 bg-transparent border-b-2 outline-none"
                    style={{
                      borderColor: '#D1D1D1',
                      color: '#1A1A1A',
                      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#1A1A1A'}
                    onBlur={(e) => e.target.style.borderColor = '#D1D1D1'}
                  />
                </div>

                <div>
                  <textarea
                    name="message"
                    placeholder="message"
                    required
                    rows="6"
                    className="w-full px-4 py-3 text-lg transition-all duration-300 bg-transparent border-b-2 outline-none resize-none"
                    style={{
                      borderColor: '#D1D1D1',
                      color: '#1A1A1A',
                      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#1A1A1A'}
                    onBlur={(e) => e.target.style.borderColor = '#D1D1D1'}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 text-lg font-medium transition-all duration-300"
                  style={{
                    backgroundColor: '#1A1A1A',
                    color: '#F7F7F5',
                    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                    letterSpacing: '0.05em'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333333'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1A1A1A'}
                >
                  SEND
                </button>
              </form>
            </div>
          </div>
        )}
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
            backgroundImage: selectedIssue?.id === 2
              ? `url(/images/issue2/${screenSize === 'phone' ? 'audio_mobile_2.png' : 'audio_desktop_2.png'})`
              : 'url(/images/audio_desktop.jpg)',
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
        <div
          className="relative z-10 flex items-center justify-center min-h-screen px-6 pt-20 pb-32 md:py-24"
          style={{
            transform: window.innerWidth <= 1280 ? 'translateY(-15px)' : 'none'
          }}
        >
          <div
            className="w-full max-w-md px-8 py-10 mx-6 md:px-10 md:py-12"
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
                      opacity: selectedTrack?.name === track.name ? 1 : 0.85,
                      cursor: 'pointer',
                      transform: 'scale(1)',
                      filter: 'drop-shadow(0 0 0px rgba(26, 26, 26, 0))'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '1';
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.filter = 'drop-shadow(0 0 8px rgba(26, 26, 26, 0.3))';
                    }}
                    onMouseLeave={(e) => {
                      if (selectedTrack?.name !== track.name) {
                        e.currentTarget.style.opacity = '0.85';
                      }
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.filter = 'drop-shadow(0 0 0px rgba(26, 26, 26, 0))';
                    }}
                  >
                    {track.name}
                    {selectedTrack?.name === track.name && audioPlaying && (
                      <span className="eq-bars">
                        <span /><span /><span /><span />
                      </span>
                    )}
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
                    // Auto-enter experience view
                    handleEnterSite();
                  }}
                  className="block w-full text-left transition-all duration-300 italic"
                  style={{
                    fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
                    fontWeight: 400,
                    color: !selectedTrack ? '#1A1A1A' : 'rgba(40, 40, 40, 0.6)',
                    letterSpacing: '-0.01em',
                    opacity: !selectedTrack ? 1 : 0.7,
                    cursor: 'pointer',
                    transform: 'scale(1)',
                    filter: 'drop-shadow(0 0 0px rgba(26, 26, 26, 0))'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.filter = 'drop-shadow(0 0 8px rgba(26, 26, 26, 0.3))';
                  }}
                  onMouseLeave={(e) => {
                    if (selectedTrack) {
                      e.currentTarget.style.opacity = '0.7';
                    }
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.filter = 'drop-shadow(0 0 0px rgba(26, 26, 26, 0))';
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
            <div className="mb-3">
              <button
                onClick={() => setShowCreditInfo(true)}
                className="text-xs font-semibold tracking-widest uppercase transition-all duration-300"
                style={{
                  color: 'rgba(50, 50, 50, 0.7)',
                  cursor: 'pointer',
                  transform: 'scale(1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'rgba(26, 26, 26, 0.9)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(50, 50, 50, 0.7)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                CREDIT INFO
              </button>
            </div>

            {/* NOTES ON OSWIN */}
            <div>
              <button
                onClick={() => setShowNotesOnOswin(true)}
                className="text-xs font-semibold tracking-widest uppercase transition-all duration-300"
                style={{
                  color: 'rgba(50, 50, 50, 0.7)',
                  cursor: 'pointer',
                  transform: 'scale(1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'rgba(26, 26, 26, 0.9)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(50, 50, 50, 0.7)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                NOTES ON OSWIN
              </button>
            </div>
          </div>
        </div>

        {/* Circle button at bottom - enter experience */}
        <div
          className="fixed z-50 left-0 right-0 flex flex-col items-center"
          style={{
            bottom: window.innerWidth <= 1280 ? 'calc(3rem - 17px)' : '3rem'
          }}
        >
          {/* Instructional text for first-time users - above circle on larger screens */}
          {isFirstTimeUser && window.innerWidth > 1280 && (
            <p
              className="mb-3 text-sm italic transition-all duration-500"
              style={{
                color: 'rgba(255, 255, 255, 0.48)',
                textShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                fontWeight: 400,
                letterSpacing: '0.01em',
                opacity: isFirstTimeUser ? 1 : 0,
                transform: isFirstTimeUser ? 'translateY(0)' : 'translateY(10px)'
              }}
            >
              select audio, then click here to enter
            </p>
          )}
          <button
            onClick={handleEnterSite}
            className="transition-all duration-300"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              cursor: 'pointer',
              opacity: 0.9
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.9';
            }}
          />
          {/* Instructional text for first-time users - below circle on smaller screens */}
          {isFirstTimeUser && window.innerWidth <= 1280 && (
            <p
              className="mt-3 text-sm italic transition-all duration-500"
              style={{
                color: 'rgba(255, 255, 255, 0.48)',
                textShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                fontWeight: 400,
                letterSpacing: '0.01em',
                opacity: isFirstTimeUser ? 1 : 0,
                transform: isFirstTimeUser ? 'translateY(0)' : 'translateY(-10px)'
              }}
            >
              select audio, then click here to enter
            </p>
          )}
        </div>

        {/* Credit Info Modal Overlay */}
        {showCreditInfo && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={(e) => {
              // Close modal if clicking outside the card
              if (e.target === e.currentTarget) setShowCreditInfo(false);
            }}
          >
            <div
              className="relative w-full max-w-md px-8 py-10 mx-6 md:px-10 md:py-12"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(40px)',
                WebkitBackdropFilter: 'blur(40px)',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                maxHeight: '80vh',
                overflowY: 'auto'
              }}
            >
              {/* X button - top right */}
              <button
                onClick={() => setShowCreditInfo(false)}
                className="absolute transition-all duration-300"
                style={{
                  top: '20px',
                  right: '20px',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  opacity: 0.7
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(40, 40, 40, 0.8)"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              {/* Title */}
              <h3
                className="mb-4 font-bold"
                style={{
                  fontSize: 'clamp(1.5rem, 3vw, 1.75rem)',
                  color: '#2A2A2A',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2
                }}
              >
                CREDIT INFO
              </h3>

              {/* Credit Info text */}
              <div
                style={{
                  fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                  color: 'rgba(40, 40, 40, 0.85)',
                  lineHeight: 1.6,
                  letterSpacing: '0.01em'
                }}
              >
                <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Audio</h4>
                <p>
                  {selectedIssue?.id === 2
                    ? 'Christopher Bissonnette is a Canadian musician/sound artist/graphic designer living and working in Windsor/Detroit. He has released four full-length albums for the independent record label Kranky, a release through Russian label Dronarivm, and a collaborative recording with David Wenngren (Library Tapes) on Home Normal. Bissonnette has actively explored visual art, sound and video in a variety of contexts ranging from art galleries to music venues. Over the past twenty years Bissonnette has continued to expand his aural vocabulary and production techniques incorporating elements of music concrete, electroacoustics, field recording and modular synthesis.'
                    : 'Yoni Newman is a musician, artist, and sound designer based in Toronto. As one half of the electronic music and arts duo Karla, he has performed frequently since 2019. As an organizer, he produces the monthly live electronic performance series Hitplay and Rogue Waves festival, and serves as a coordinator for Technowalk Toronto. Following the album "Karla Is Here" in 2019, Karla expanded beyond live music into installation art with the Music Gallery Residency project "Temple Block" in 2022, which rigged actuator motors onto the wooden joists of an old meditation hall and sequenced the playing of the structure itself. He holds a background in fine arts through an MFA studio program at Pennsylvania Academy of the Fine Arts, where he built an AI-driven drawbot and expanded his studio practice. He still maintains a painting and drawing practice, most recently as Resident Artist at the MERZ residency program in Scotland in August 2024.'
                  }
                </p>
                <a
                  href={selectedIssue?.id === 2
                    ? 'https://open.substack.com/pub/oswinjournal/p/christopher-bissonnette?r=28jcyn&utm_campaign=post&utm_medium=web&showWelcomeOnShare=true'
                    : 'https://oswinjournal.substack.com/p/a-thousand-entry-points'
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-3 font-semibold transition-all duration-300"
                  style={{
                    color: '#0C49D5',
                    fontSize: 'clamp(0.875rem, 2vw, 1rem)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#3A6FE8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#0C49D5';
                  }}
                >
                  {selectedIssue?.id === 2
                    ? 'Read: Noticing the Unnoticed →'
                    : 'Read: A Thousand Entry Points →'
                  }
                </a>
                <h4 style={{ fontWeight: 600, marginTop: '1rem', marginBottom: '0.5rem' }}>Visuals</h4>
                <p>
                  Alex Taves is a writer, illustrator, painter, and web developer working at the intersection of visual art, sound, and digital experience. He founded Oswald Gallery in Hamilton, Ontario, which earned mention in The New York Times within six months of opening. For the past three years, he has been an instructor at Whitehouse Institute of Design, a prestigious fashion school in Australia. His roots trace back to a small farm in southern Ontario, but his creative consciousness came online through the warehouse parties of 1990s Detroit—an influence that continues to shape his work exploring the liminal space between music, atmosphere, and image.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Notes on Oswin Modal Overlay */}
        {showNotesOnOswin && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={(e) => {
              // Close modal if clicking outside the card
              if (e.target === e.currentTarget) setShowNotesOnOswin(false);
            }}
          >
            <div
              className="relative w-full max-w-md px-8 py-10 mx-6 md:px-10 md:py-12"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(40px)',
                WebkitBackdropFilter: 'blur(40px)',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                maxHeight: '80vh',
                overflowY: 'auto'
              }}
            >
              {/* X button - top right */}
              <button
                onClick={() => setShowNotesOnOswin(false)}
                className="absolute transition-all duration-300"
                style={{
                  top: '20px',
                  right: '20px',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  opacity: 0.7
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(40, 40, 40, 0.8)"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              {/* Title */}
              <h3
                className="mb-4 font-bold"
                style={{
                  fontSize: 'clamp(1.5rem, 3vw, 1.75rem)',
                  color: '#2A2A2A',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2
                }}
              >
                NOTES ON OSWIN
              </h3>

              {/* Content */}
              <div
                style={{
                  fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                  color: 'rgba(40, 40, 40, 0.85)',
                  lineHeight: 1.6,
                  letterSpacing: '0.01em'
                }}
              >
                <p>
                  For over 20 years, I've been obsessively returning to footage from the 1964 Tokyo Olympics—not as a sports fan or historian, but because something in those images demands to be watched differently. I've paired these moments with selected ambient and electronic music countless times, searching for combinations that amplify each other.
                </p>
                <p className="mt-3">
                  What started as a private compulsion became a practice: screen recording segments, adjusting saturation, slowing motion, looping footage until the experience seemed seamless. When image and sound align, they stop being separate media. They become immersive space—the feeling of being at a gig without the gig, the atmosphere of presence without requiring you to go anywhere.
                </p>
                <p className="mt-3">
                  Oswin Journal merges both art forms into something that doesn't exist yet—not music video, not background ambience, but a third thing. Each medium makes the other more itself. The music gives the images weight; the images give the sound a place to live. They become symbiotic, inseparable, greater than either alone.
                </p>
                <p className="mt-3">
                  This is work that asks for your time and rewards it. Not content to scroll past, but digital space designed to pull you in and hold you there.
                </p>
                <a
                  href="https://alextaves.substack.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-6 font-bold transition-all duration-300"
                  style={{
                    fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                    color: '#0C49D5'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#3A6FE8';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#0C49D5';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  For more words by Oswin Journal →
                </a>
              </div>
            </div>
          </div>
        )}

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

  // Check if at top
  const checkIfAtTop = () => {
    const container = scrollContainerRef.current;
    if (!container) return false;
    return container.scrollTop <= 5;
  };

  // Initialize scroll position to first real content (skip clone at start if present)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || view !== 'experience') return;

    const hasClone = selectedIssue?.slideshow;
    const sections = container.querySelectorAll('section');
    const startIndex = hasClone ? 1 : 0;
    if (sections.length > startIndex) {
      sections[startIndex].scrollIntoView({ behavior: 'auto', block: 'start' });
    }
  }, [view]);

  // Detect when user scrolls to a clone and reposition to real content
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || view !== 'experience') return;

    const onScroll = () => {
      if (loopingRef.current) return;

      const sections = container.querySelectorAll('section');
      const containerRect = container.getBoundingClientRect();

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const isInView = rect.top <= containerRect.top + 10 && rect.bottom >= containerRect.bottom - 10;

        if (isInView) {
          // If we're viewing the cloned slideshow at start, jump to real slideshow
          if (section.dataset.clone === 'slideshow-start') {
            loopingRef.current = true;
            const realSlideshow = container.querySelector('[data-original="slideshow"]');
            if (realSlideshow) {
              realSlideshow.scrollIntoView({ behavior: 'auto', block: 'start' });
              setTimeout(() => { loopingRef.current = false; }, 100);
            }
          }
          // If we're viewing the cloned first video at end, jump to real first video
          else if (section === sections[sections.length - 1] && sections.length > 2) {
            loopingRef.current = true;
            sections[1].scrollIntoView({ behavior: 'auto', block: 'start' });
            setTimeout(() => { loopingRef.current = false; }, 100);
          }
        }
      });
    };

    container.addEventListener('scroll', onScroll);
    return () => container.removeEventListener('scroll', onScroll);
  }, [view]);

  // Let natural scroll happen - repositioning is handled by scroll detection
  const handleWheel = (e) => {
    // Natural scrolling - clones will be detected and repositioned automatically
  };

  // Handle touch swipe for mobile
  const touchStartY = useRef(0);

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    // Natural scrolling - clones will be detected and repositioned automatically
  };

  // Horizontal carousel for Issue 2 mobile
  const [activePhoneIndex, setActivePhoneIndex] = useState(0);
  const phoneScrollRef = useRef(null);
  const phoneVideoRefs = useRef([]);
  const phoneScrollTimeout = useRef(null);

  // Pause all media when app is backgrounded, resume when foregrounded
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        document.querySelectorAll('video').forEach(v => v.pause());
        if (audioRef.current) audioRef.current.pause();
      } else if (view === 'experience') {
        phoneVideoRefs.current.forEach((v, i) => {
          if (v && Math.abs(i - activePhoneIndex) <= 2) v.play().catch(() => {});
        });
        if (audioRef.current && audioRef.current.src && audioPlaying) {
          audioRef.current.play().catch(() => {});
        }
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [view, activePhoneIndex, audioPlaying]);

  useEffect(() => {
    const container = phoneScrollRef.current;
    if (!container) return;
    const onScroll = () => {
      // Throttle: only update after scrolling stops for 100ms
      clearTimeout(phoneScrollTimeout.current);
      phoneScrollTimeout.current = setTimeout(() => {
        const idx = Math.round(container.scrollLeft / window.innerWidth);
        setActivePhoneIndex(idx);
      }, 100);
    };
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', onScroll);
      clearTimeout(phoneScrollTimeout.current);
    };
  }, [view]);

  // Play nearby videos, pause distant ones
  useEffect(() => {
    phoneVideoRefs.current.forEach((video, i) => {
      if (!video) return;
      if (Math.abs(i - activePhoneIndex) <= 2) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, [activePhoneIndex]);

  const renderHorizontalExperienceView = () => {
    const slides = getVideos();

    return (
      <>
        <div
          ref={(el) => { scrollContainerRef.current = el; phoneScrollRef.current = el; }}
          onClick={() => { if (!showAudioMenu) handleInteraction(); }}
          style={{
            display: 'flex',
            flexDirection: 'row',
            width: '100%',
            height: '100%',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflowX: 'scroll',
            overflowY: 'hidden',
            backgroundColor: '#000',
            scrollSnapType: 'x proximity',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {slides.map((slide, index) => {
            const isTitlePage = typeof slide === 'object' && slide.type === 'title';
            const distance = Math.abs(index - activePhoneIndex);
            const isLoaded = distance <= 2;

            return (
              <div
                key={index}
                style={{
                  flexShrink: 0,
                  width: '100vw',
                  height: '100%',
                  scrollSnapAlign: 'center',
                  scrollSnapStop: 'always',
                  position: 'relative',
                  backgroundColor: isTitlePage ? '#FFFFFF' : '#000'
                }}
              >
                {isTitlePage ? (
                  <CreditTitlePage pageId={slide.pageId} screenSize="phone" />
                ) : (
                  <video
                    ref={(el) => { phoneVideoRefs.current[index] = el; }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    src={isLoaded ? slide : undefined}
                    loop
                    muted
                    playsInline
                    preload={isLoaded ? 'auto' : 'none'}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Mini Audio Menu Overlay */}
        {showAudioMenu && (
          <div
            className="fixed inset-0 z-40 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
            onClick={(e) => {
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
              <div className="space-y-3">
                {selectedIssue.tracks.filter(t => t.available).map((track, i) => (
                  <button
                    key={i}
                    onClick={() => { handleTrackClick(track); }}
                    className="block w-full text-left transition-all duration-300"
                    style={{
                      fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
                      fontWeight: 600,
                      color: selectedTrack?.name === track.name ? '#1A1A1A' : 'rgba(40, 40, 40, 0.8)',
                      letterSpacing: '-0.01em',
                      opacity: selectedTrack?.name === track.name ? 1 : 0.85,
                      cursor: 'pointer'
                    }}
                  >
                    {track.name}
                    {selectedTrack?.name === track.name && audioPlaying && (
                      <span className="eq-bars">
                        <span /><span /><span /><span />
                      </span>
                    )}
                  </button>
                ))}
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
                    opacity: !selectedTrack ? 1 : 0.7,
                    cursor: 'pointer'
                  }}
                >
                  silent mode
                </button>
                <button
                  onClick={() => {
                    setShowAudioMenu(false);
                    handleBackToArchive();
                  }}
                  className="block w-full text-left transition-all duration-300"
                  style={{
                    fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                    fontWeight: 500,
                    color: 'rgba(40, 40, 40, 0.6)',
                    letterSpacing: '-0.01em',
                    cursor: 'pointer'
                  }}
                >
                  home
                </button>
                {!isStandalone && (
                  <button
                    onClick={() => {
                      setShowAudioMenu(false);
                      handleInstallClick();
                    }}
                    className="block w-full text-left transition-all duration-300"
                    style={{
                      fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                      fontWeight: 500,
                      color: 'rgba(40, 40, 40, 0.6)',
                      letterSpacing: '-0.01em',
                      cursor: 'pointer'
                    }}
                  >
                    install app
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Circle button */}
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
          />
        </div>
      </>
    );
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
      {/* Clone of slideshow at the beginning for seamless loop */}
      {selectedIssue?.slideshow && (
        <section
          data-clone="slideshow-start"
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

      {/* Credit title page - Figure Skating */}
      {isDesktop && selectedIssue?.id === 2 && (
        <section
          className="relative w-full"
          style={{
            height: '100vh',
            scrollSnapAlign: 'start',
            scrollSnapStop: 'always',
          }}
        >
          <CreditTitlePage pageId="figure-skating" screenSize={screenSize} />
        </section>
      )}

      {/* Scroll-snap video sections */}
      {videos.map((videoSrc, index) => (
        <VideoSection
          key={index}
          src={videoSrc}
          index={index}
          total={videos.length}
          showAudioMenu={showAudioMenu}
          setShowAudioMenu={setShowAudioMenu}
          selectedIssue={selectedIssue}
          selectedTrack={selectedTrack}
          handleTrackClick={handleTrackClick}
          setSelectedTrack={setSelectedTrack}
          audioRef={audioRef}
          setAudioPlaying={setAudioPlaying}
          handleBackToArchive={handleBackToArchive}
          scrollContainerRef={scrollContainerRef}
          setShowCreditInfo={setShowCreditInfo}
        />
      ))}

      {/* Credit title page - Wall Street */}
      {isDesktop && selectedIssue?.id === 2 && (
        <section
          className="relative w-full"
          style={{
            height: '100vh',
            scrollSnapAlign: 'start',
            scrollSnapStop: 'always',
          }}
        >
          <CreditTitlePage pageId="wall-street" screenSize={screenSize} />
        </section>
      )}

      {/* Triple Panel Sections - desktop only, with Melbourne title after cool_guy */}
      {isDesktop && selectedIssue?.panelSets?.map((panelSet, index) => (
        <React.Fragment key={`panel-${panelSet.name}`}>
          <TriplePanelSection
            panelSet={panelSet}
            isDesktop={isDesktop}
            scrollContainerRef={scrollContainerRef}
          />
          {panelSet.name === 'cool_guy' && selectedIssue?.id === 2 && (
            <section
              className="relative w-full"
              style={{
                height: '100vh',
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always',
              }}
            >
              <CreditTitlePage pageId="melbourne-1500m" screenSize={screenSize} />
            </section>
          )}
        </React.Fragment>
      ))}

      {/* Slideshow section */}
      {selectedIssue?.slideshow && (
        <section
          data-original="slideshow"
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

      {/* Clone of first video at the end for seamless loop */}
      {videos.length > 0 && (
        <VideoSection
          key="clone-first"
          src={videos[0]}
          index={0}
          total={videos.length}
          showAudioMenu={showAudioMenu}
          setShowAudioMenu={setShowAudioMenu}
          selectedIssue={selectedIssue}
          selectedTrack={selectedTrack}
          handleTrackClick={handleTrackClick}
          setSelectedTrack={setSelectedTrack}
          audioRef={audioRef}
          setAudioPlaying={setAudioPlaying}
          handleBackToArchive={handleBackToArchive}
          scrollContainerRef={scrollContainerRef}
          setShowCreditInfo={setShowCreditInfo}
          isClone={true}
        />
      )}

      {/* Mini Audio Menu Overlay */}
      {showAudioMenu && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
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
                    opacity: selectedTrack?.name === track.name ? 1 : 0.85,
                    cursor: 'pointer',
                    transform: 'scale(1)',
                    filter: 'drop-shadow(0 0 0px rgba(26, 26, 26, 0))'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.filter = 'drop-shadow(0 0 8px rgba(26, 26, 26, 0.3))';
                  }}
                  onMouseLeave={(e) => {
                    if (selectedTrack?.name !== track.name) {
                      e.currentTarget.style.opacity = '0.85';
                    }
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.filter = 'drop-shadow(0 0 0px rgba(26, 26, 26, 0))';
                  }}
                >
                  {track.name}
                  {selectedTrack?.name === track.name && audioPlaying && (
                    <span className="eq-bars">
                      <span /><span /><span /><span />
                    </span>
                  )}
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
                  opacity: !selectedTrack ? 1 : 0.7,
                  cursor: 'pointer',
                  transform: 'scale(1)',
                  filter: 'drop-shadow(0 0 0px rgba(26, 26, 26, 0))'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.filter = 'drop-shadow(0 0 8px rgba(26, 26, 26, 0.3))';
                }}
                onMouseLeave={(e) => {
                  if (selectedTrack) {
                    e.currentTarget.style.opacity = '0.7';
                  }
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.filter = 'drop-shadow(0 0 0px rgba(26, 26, 26, 0))';
                }}
              >
                silent mode
              </button>
              {/* Credit Info option */}
              <button
                onClick={() => {
                  setShowCreditInfo(true);
                  setShowAudioMenu(false);
                }}
                className="block w-full text-left transition-all duration-300 mt-4"
                style={{
                  fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                  fontWeight: 500,
                  color: 'rgba(40, 40, 40, 0.6)',
                  letterSpacing: '-0.01em',
                  cursor: 'pointer',
                  transform: 'scale(1)',
                  filter: 'drop-shadow(0 0 0px rgba(26, 26, 26, 0))'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.filter = 'drop-shadow(0 0 8px rgba(26, 26, 26, 0.3))';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.filter = 'drop-shadow(0 0 0px rgba(26, 26, 26, 0))';
                }}
              >
                credit info
              </button>

              {/* Notes on Oswin option */}
              <button
                onClick={() => {
                  setShowNotesOnOswin(true);
                  setShowAudioMenu(false);
                }}
                className="block w-full text-left transition-all duration-300"
                style={{
                  fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                  fontWeight: 500,
                  color: 'rgba(40, 40, 40, 0.6)',
                  letterSpacing: '-0.01em',
                  cursor: 'pointer',
                  transform: 'scale(1)',
                  filter: 'drop-shadow(0 0 0px rgba(26, 26, 26, 0))'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.filter = 'drop-shadow(0 0 8px rgba(26, 26, 26, 0.3))';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.filter = 'drop-shadow(0 0 0px rgba(26, 26, 26, 0))';
                }}
              >
                notes on oswin
              </button>

              {/* Home option - smaller font */}
              <button
                onClick={() => {
                  setShowAudioMenu(false);
                  handleBackToArchive();
                }}
                className="block w-full text-left transition-all duration-300"
                style={{
                  fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                  fontWeight: 500,
                  color: 'rgba(40, 40, 40, 0.6)',
                  letterSpacing: '-0.01em',
                  cursor: 'pointer',
                  transform: 'scale(1)',
                  filter: 'drop-shadow(0 0 0px rgba(26, 26, 26, 0))'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.filter = 'drop-shadow(0 0 8px rgba(26, 26, 26, 0.3))';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.filter = 'drop-shadow(0 0 0px rgba(26, 26, 26, 0))';
                }}
              >
                home
              </button>
              {!isStandalone && (
                <button
                  onClick={() => {
                    setShowAudioMenu(false);
                    handleInstallClick();
                  }}
                  className="block w-full text-left transition-all duration-300"
                  style={{
                    fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                    fontWeight: 500,
                    color: 'rgba(40, 40, 40, 0.6)',
                    letterSpacing: '-0.01em',
                    cursor: 'pointer',
                    transform: 'scale(1)',
                    filter: 'drop-shadow(0 0 0px rgba(26, 26, 26, 0))'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.filter = 'drop-shadow(0 0 8px rgba(26, 26, 26, 0.3))';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.filter = 'drop-shadow(0 0 0px rgba(26, 26, 26, 0))';
                  }}
                >
                  install app
                </button>
              )}
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

      {/* Credit Info Modal Overlay - in experience view */}
      {showCreditInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={(e) => {
            // Close modal if clicking outside the card
            if (e.target === e.currentTarget) setShowCreditInfo(false);
          }}
        >
          <div
            className="relative w-full max-w-md px-8 py-10 mx-6 md:px-10 md:py-12"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
          >
            {/* X button - top right */}
            <button
              onClick={() => setShowCreditInfo(false)}
              className="absolute transition-all duration-300"
              style={{
                top: '20px',
                right: '20px',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                opacity: 0.7
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(40, 40, 40, 0.8)"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Title */}
            <h3
              className="mb-4 font-bold"
              style={{
                fontSize: 'clamp(1.5rem, 3vw, 1.75rem)',
                color: '#2A2A2A',
                letterSpacing: '-0.02em',
                lineHeight: 1.2
              }}
            >
              CREDIT INFO
            </h3>

            {/* Credit Info text */}
            <div
              style={{
                fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                color: 'rgba(40, 40, 40, 0.85)',
                lineHeight: 1.6,
                letterSpacing: '0.01em'
              }}
            >
              <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Audio</h4>
              <p>
                Yoni Newman is a musician, artist, and sound designer based in Toronto. As one half of the electronic music and arts duo Karla, he has performed frequently since 2019. As an organizer, he produces the monthly live electronic performance series Hitplay and Rogue Waves festival, and serves as a coordinator for Technowalk Toronto. Following the album "Karla Is Here" in 2019, Karla expanded beyond live music into installation art with the Music Gallery Residency project "Temple Block" in 2022, which rigged actuator motors onto the wooden joists of an old meditation hall and sequenced the playing of the structure itself. He holds a background in fine arts through an MFA studio program at Pennsylvania Academy of the Fine Arts, where he built an AI-driven drawbot and expanded his studio practice. He still maintains a painting and drawing practice, most recently as Resident Artist at the MERZ residency program in Scotland in August 2024.
              </p>
              <a
                href={selectedIssue?.id === 2
                  ? 'https://open.substack.com/pub/oswinjournal/p/christopher-bissonnette?r=28jcyn&utm_campaign=post&utm_medium=web&showWelcomeOnShare=true'
                  : 'https://oswinjournal.substack.com/p/a-thousand-entry-points'
                }
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-3 font-semibold transition-all duration-300"
                style={{
                  color: '#0C49D5',
                  fontSize: 'clamp(0.875rem, 2vw, 1rem)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#3A6FE8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#0C49D5';
                }}
              >
                {selectedIssue?.id === 2
                  ? 'Read: Noticing the Unnoticed →'
                  : 'Read: A Thousand Entry Points →'
                }
              </a>
              <h4 style={{ fontWeight: 600, marginTop: '1rem', marginBottom: '0.5rem' }}>Visuals</h4>
              <p>
                Alex Taves is a writer, illustrator, painter, and web developer working at the intersection of visual art, sound, and digital experience. He founded Oswald Gallery in Hamilton, Ontario, which earned mention in The New York Times within six months of opening. For the past three years, he has been an instructor at Whitehouse Institute of Design, a prestigious fashion school in Australia. His roots trace back to a small farm in southern Ontario, but his creative consciousness came online through the warehouse parties of 1990s Detroit—an influence that continues to shape his work exploring the liminal space between music, atmosphere, and image.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Notes on Oswin Modal Overlay - in experience view */}
      {showNotesOnOswin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={(e) => {
            // Close modal if clicking outside the card
            if (e.target === e.currentTarget) setShowNotesOnOswin(false);
          }}
        >
          <div
            className="relative w-full max-w-md px-8 py-10 mx-6 md:px-10 md:py-12"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
          >
            {/* X button - top right */}
            <button
              onClick={() => setShowNotesOnOswin(false)}
              className="absolute transition-all duration-300"
              style={{
                top: '20px',
                right: '20px',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                opacity: 0.7
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(40, 40, 40, 0.8)"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Title */}
            <h3
              className="mb-4 font-bold"
              style={{
                fontSize: 'clamp(1.5rem, 3vw, 1.75rem)',
                color: '#2A2A2A',
                letterSpacing: '-0.02em',
                lineHeight: 1.2
              }}
            >
              NOTES ON OSWIN
            </h3>

            {/* Content */}
            <div
              style={{
                fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                color: 'rgba(40, 40, 40, 0.85)',
                lineHeight: 1.6,
                letterSpacing: '0.01em'
              }}
            >
              <p>
                For over 20 years, I've been obsessively returning to footage from the 1964 Tokyo Olympics—not as a sports fan or historian, but because something in those images demands to be watched differently. I've paired these moments with selected ambient and electronic music countless times, searching for combinations that amplify each other.
              </p>
              <p className="mt-3">
                What started as a private compulsion became a practice: screen recording segments, adjusting saturation, slowing motion, looping footage until the experience seemed seamless. When image and sound align, they stop being separate media. They become immersive space—the feeling of being at a gig without the gig, the atmosphere of presence without requiring you to go anywhere.
              </p>
              <p className="mt-3">
                Oswin Journal merges both art forms into something that doesn't exist yet—not music video, not background ambience, but a third thing. Each medium makes the other more itself. The music gives the images weight; the images give the sound a place to live. They become symbiotic, inseparable, greater than either alone.
              </p>
              <p className="mt-3">
                This is work that asks for your time and rewards it. Not content to scroll past, but digital space designed to pull you in and hold you there.
              </p>
              <a
                href="https://alextaves.substack.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-6 font-bold transition-all duration-300"
                style={{
                  fontSize: 'clamp(2.625rem, 6vw, 3rem)',
                  color: '#0C49D5',
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                  lineHeight: 1.2
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#3A6FE8';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#0C49D5';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                For more words by Oswin Journal →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
    );
  };

  const renderIssue3Experience = () => {
    const HN = '"Helvetica Neue", Helvetica, Arial, sans-serif';
    const isDesktopView = windowWidth > 820;
    const blueScale = {
      C4: 'rgba(232, 232, 228, 0.28)', D4: 'rgba(199, 207, 223, 0.34)',
      E4: 'rgba(166, 181, 218, 0.40)', F4: 'rgba(133, 156, 213, 0.46)',
      G4: 'rgba(100, 131, 208, 0.51)', A4: 'rgba(66,  106, 203, 0.57)',
      B4: 'rgba(33,  80,  198, 0.63)', C5: 'rgba(0,   55,  193, 0.69)',
    };
    const redScale = {
      C4: 'rgba(232, 232, 228, 0.28)', D4: 'rgba(232, 205, 200, 0.34)',
      E4: 'rgba(229, 178, 171, 0.40)', F4: 'rgba(226, 152, 143, 0.46)',
      G4: 'rgba(223, 125, 114, 0.51)', A4: 'rgba(220,  98,  86, 0.57)',
      B4: 'rgba(217,  72,  58, 0.63)', C5: 'rgba(210,  45,  30, 0.69)',
    };
    const greenScale = {
      C4: 'rgba(232, 232, 228, 0.28)', D4: 'rgba(209, 229, 214, 0.34)',
      E4: 'rgba(178, 218, 189, 0.40)', F4: 'rgba(144, 203, 161, 0.46)',
      G4: 'rgba(108, 185, 132, 0.51)', A4: 'rgba(72,  163, 100, 0.57)',
      B4: 'rgba(39,  135,  68, 0.63)', C5: 'rgba(22,  101,  52, 0.69)',
    };
    const screen = ISSUE3_SCREENS[issue3Screen];
    const { bg } = screen;
    const isTextScreen = screen.type === 'text';
    const textParagraphs = screen.id === 'siphon' ? SIPHON_PARAGRAPHS : screen.id === 'graft' ? GRAFT_PARAGRAPHS : HUM_PARAGRAPHS;
    const stackedWord = screen.id === 'siphon' ? 'SIPHON' : screen.id === 'graft' ? 'GRAFT' : 'HUM';
    const keyScale = screen.id === 'siphon' ? redScale : screen.id === 'graft' ? greenScale : blueScale;
    const total = ISSUE3_SCREENS.length;
    const screenBarImages = isTextScreen ? null : Array(8).fill(screen.image);
    const goPrev = () => { setIssue3Screen(s => (s - 1 + total) % total); setIssue3ViewMode('read'); };
    const goNext = () => { setIssue3Screen(s => (s + 1) % total); setIssue3ViewMode('read'); };

    const arrowStyle = {
      position: 'absolute', top: '50%', transform: 'translateY(-50%)',
      zIndex: 20, background: 'none', border: 'none', cursor: 'pointer',
      padding: 12, color: 'rgba(26,26,26,0.35)',
      display: 'flex', alignItems: 'center',
    };

    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: bg, transition: 'background-color 0.5s ease' }} onMouseMove={handleInteraction}>

        {isTextScreen ? (
          <div style={{ position: 'absolute', inset: 0, fontFamily: "'Avenir Next', Avenir, 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
            {/* Background static */}
            <NoiseCanvas alpha={22} />
            {/* Strobing detroit images — triggered by notes */}
            {screen.id === 'siphon' && <StrobeImages triggerRef={strobeSpawnRef} viewMode={issue3ViewMode} />}
            {/* Read / Visual tabs — always visible, pinned near top */}
            <div style={{ position: 'absolute', top: isDesktopView ? 20 : Math.floor(windowWidth / 4) * 2 + 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 20, zIndex: 20 }}>
              {[{ id: 'read', label: 'Read' }, { id: 'visual', label: 'Enhanced Sound' }].map(({ id, label }) => (
                <button key={id} onClick={() => setIssue3ViewMode(id)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                  fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: issue3ViewMode === id ? 'rgba(26,26,26,0.75)' : 'rgba(26,26,26,0.3)',
                  borderBottom: issue3ViewMode === id ? '1px solid rgba(26,26,26,0.4)' : '1px solid transparent',
                  paddingBottom: 2,
                }}>
                  {label}
                </button>
              ))}
            </div>
            {/* Horizontal key bar — mobile/tablet only, fixed at top */}
            {!isDesktopView && (
              <PianoBarsArt
                horizontal
                audioPlaying={audioPlaying}
                windowWidth={windowWidth}
                barImages={[]}
                barColors={keyScale}
                onNote={() => strobeSpawnRef.current?.()}
              />
            )}

            {/* Scrollable text + rectangle — hidden in visual mode */}
            <div
              style={{ position: 'absolute', inset: 0, overflowY: 'auto', display: issue3ViewMode === 'read' ? 'flex' : 'none', justifyContent: 'center', alignItems: 'flex-start', padding: isDesktopView ? '72px 48px 96px' : `${Math.floor(windowWidth / 4) * 2 + 42}px 20px 80px`, zIndex: 2 }}
              onTouchStart={(e) => { const t = e.touches[0]; e.currentTarget._tx = t.clientX; e.currentTarget._ty = t.clientY; }}
              onTouchEnd={(e) => {
                const dx = e.changedTouches[0].clientX - (e.currentTarget._tx ?? 0);
                const dy = e.changedTouches[0].clientY - (e.currentTarget._ty ?? 0);
                if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                  dx < 0 ? goNext() : goPrev();
                }
              }}
            >
              <div style={{ width: isDesktopView ? '50vw' : '92vw', maxWidth: '680px', background: 'rgba(255,255,255,0.45)', padding: isDesktopView ? '80px 56px 52px' : '32px 24px 48px', boxShadow: '0 2px 40px rgba(0,0,0,0.07)', backdropFilter: 'blur(2px)' }}>
                {textParagraphs.map((p, i) => {
                  const humColor = screen.id === 'siphon' ? 'rgba(210, 45, 30, 0.69)' : screen.id === 'graft' ? 'rgba(22, 101, 52, 0.69)' : 'rgba(0, 55, 193, 0.69)';
                  const indentW = isDesktopView ? 52 : 40;
                  const gap = 14;
                  if (i === 0) return (
                    <div key={i} style={{ display: 'flex', gap, marginBottom: 24, alignItems: 'flex-start' }}>
                      <div style={{ flexShrink: 0, width: indentW, paddingTop: 4 }}>
                        <StackedHum word={stackedWord} color={humColor} fontSize={isDesktopView ? 'clamp(0.844rem, 1.476vw, 1.688rem)' : 'clamp(1.125rem, 1.968vw, 2.25rem)'} />
                      </div>
                      <p style={{ fontSize: 15, lineHeight: 1.8, color: '#1a1a1a', margin: 0, fontWeight: 400, letterSpacing: '0.01em' }}>{p}</p>
                    </div>
                  );
                  return (
                    <p key={i} style={{ fontSize: 15, lineHeight: 1.8, color: '#1a1a1a', marginBottom: 24, fontWeight: 400, letterSpacing: '0.01em' }}>
                      {p}
                    </p>
                  );
                })}
              </div>
            </div>
            {/* HumMixer — always mounted on HUM screen so audio persists across READ/VISUAL toggle */}
            {screen.id === 'hum' && (
              <div style={{ position: 'absolute', inset: 0, zIndex: 4, display: issue3ViewMode === 'visual' ? 'block' : 'none' }}>
                <HumMixer audioPlaying={audioPlaying} />
              </div>
            )}
            {/* SiphonGallery — Three.js spatial gallery for SIPHON Enhanced Sound */}
            {screen.id === 'siphon' && (
              <div style={{ position: 'absolute', inset: 0, zIndex: 4, display: issue3ViewMode === 'visual' ? 'block' : 'none' }}>
                <SiphonGallery />
              </div>
            )}
            {/* Small bar rectangles — centred in left and right margins; hidden (not unmounted) in HUM visual so Schoenberg keeps playing */}
            {isDesktopView && (
              <>
                <div style={{ position: 'absolute', left: 'calc((50vw - min(25vw, 340px)) / 2 - 50px)', top: '50%', transform: 'translateY(-50%)', width: 100, height: 350, overflow: 'hidden', zIndex: 3, visibility: (screen.id === 'hum' && issue3ViewMode === 'visual') ? 'hidden' : 'visible' }}>
                  <PianoBarsArt
                    audioPlaying={audioPlaying}
                    windowWidth={windowWidth}
                    background="#ece9e2"
                    barImages={[]}
                    barColors={keyScale}
                    onNote={() => strobeSpawnRef.current?.()}
                  />
                </div>
                <div style={{ position: 'absolute', left: 'calc(100vw - (50vw - min(25vw, 340px)) / 2 - 50px)', top: '50%', transform: 'translateY(-50%)', width: 100, height: 350, overflow: 'hidden', zIndex: 3, visibility: (screen.id === 'hum' && issue3ViewMode === 'visual') ? 'hidden' : 'visible' }}>
                  <PianoBarsArt
                    audioPlaying={audioPlaying}
                    windowWidth={windowWidth}
                    background="#ece9e2"
                    barImages={[]}
                    barColors={keyScale}
                    onNote={() => strobeSpawnRef.current?.()}
                  />
                </div>
              </>
            )}
          </div>
        ) : (
          <PianoBarsArt
            audioPlaying={audioPlaying}
            windowWidth={windowWidth}
            barImages={screenBarImages}
            background="transparent"
            onSwipeLeft={goNext}
            onSwipeRight={goPrev}
          />
        )}

        {/* Touch-anywhere-to-start overlay when audio is off */}
        {!audioPlaying && (
          <div
            style={{ position: 'absolute', inset: 0, zIndex: 10, cursor: 'pointer', touchAction: 'manipulation' }}
            onClick={() => { Tone.start(); setAudioPlaying(true); }}
            onTouchStart={(e) => { e.preventDefault(); Tone.start(); setAudioPlaying(true); }}
          >
            <div style={{ position: 'absolute', top: 24, left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
              <span style={{ fontFamily: HN, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(26,26,26,0.45)' }}>touch to begin</span>
            </div>
          </div>
        )}

        {/* Desktop prev/next arrows */}
        {isDesktopView && (
          <>
            <button onClick={goPrev} style={{ ...arrowStyle, left: 20 }} aria-label="Previous">
              <svg width="13" height="22" viewBox="0 0 13 22" fill="none">
                <polyline points="11,1 1,11 11,21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button onClick={goNext} style={{ ...arrowStyle, right: 20 }} aria-label="Next">
              <svg width="13" height="22" viewBox="0 0 13 22" fill="none">
                <polyline points="1,1 11,11 1,21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </>
        )}

        {/* Circle — go home, fades in on mouse activity */}
        <div style={{ position: 'fixed', bottom: 48, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 20 }}>
          <button
            onClick={(e) => { e.stopPropagation(); handleBackToArchive(); }}
            className="transition-all duration-500"
            style={{
              width: 48, height: 48, borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.5)',
              border: 'none', cursor: 'pointer',
              opacity: showExitButton ? 0.9 : 0,
              transform: showExitButton ? 'scale(1)' : 'scale(0.8)',
              pointerEvents: showExitButton ? 'auto' : 'none',
            }}
            onMouseEnter={(e) => { if (showExitButton) e.currentTarget.style.opacity = '1'; }}
            onMouseLeave={(e) => { if (showExitButton) e.currentTarget.style.opacity = '0.9'; }}
          />
        </div>

        {/* Fullscreen button — desktop only, fades in on mouse activity */}
        {isDesktopView && (
          <button
            onClick={handleIssue3Fullscreen}
            className="transition-all duration-500"
            style={{
              position: 'fixed', top: 20, right: 20, zIndex: 20,
              background: 'rgba(0,0,0,0.15)', border: 'none', cursor: 'pointer',
              borderRadius: 4, padding: 8,
              opacity: showExitButton ? 0.7 : 0,
              pointerEvents: showExitButton ? 'auto' : 'none',
            }}
          >
            {issue3Fullscreen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(26,26,26,0.8)" strokeWidth="2">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(26,26,26,0.8)" strokeWidth="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            )}
          </button>
        )}
      </div>
    );
  };

  // Single return with persistent audio element
  return (
    <>
      {/* Global audio element - persists across all views */}
      <audio ref={audioRef} onEnded={handleTrackEnded} />

      {/* Render the active view */}
      {view === 'archive' && renderArchiveView()}
      {view === 'reads' && renderReadsView()}
      {view === 'listens' && renderListensView()}
      {view === 'issue-detail' && selectedIssue && renderIssueDetailView()}
      {view === 'experience' && selectedIssue?.id === 3 && renderIssue3Experience()}
      {view === 'experience' && selectedIssue && selectedIssue.id !== 3 && (
        selectedIssue.id === 2 && screenSize === 'phone'
          ? renderHorizontalExperienceView()
          : renderExperienceView()
      )}

      {/* Install PWA Banner */}
      {showInstallBanner && !isStandalone && screenSize === 'phone' && (
        <div
          className="fixed z-50 bottom-0 left-0 right-0 flex justify-center"
          style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}
        >
          <div
            style={{
              backgroundColor: 'rgba(30, 30, 30, 0.7)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '16px 20px',
              margin: '0 20px',
              maxWidth: '340px',
              width: '100%'
            }}
          >
            <div style={{
              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              fontSize: '14px',
              fontWeight: 500,
              color: '#fff',
              lineHeight: '1.4',
              textAlign: 'center',
              marginBottom: '12px'
            }}>
              {isIOS
                ? 'For the best experience, tap the share button then "Add to Home Screen"'
                : 'Install Oswin for a fullscreen experience'}
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              {!isIOS && (
                <button
                  onClick={() => { handleInstallClick(); dismissInstallBanner(); }}
                  style={{
                    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#000',
                    backgroundColor: 'rgba(255, 255, 255, 0.85)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    cursor: 'pointer'
                  }}
                >
                  install
                </button>
              )}
              <button
                onClick={dismissInstallBanner}
                style={{
                  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'rgba(255, 255, 255, 0.7)',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  cursor: 'pointer'
                }}
              >
                not now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Video Section Component for scroll-snap experience
const VideoSection = ({
  src,
  index,
  total,
  showAudioMenu,
  setShowAudioMenu,
  selectedIssue,
  selectedTrack,
  handleTrackClick,
  setSelectedTrack,
  audioRef,
  setAudioPlaying,
  handleBackToArchive,
  scrollContainerRef,
  setShowCreditInfo
}) => {
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

      let targetSection;

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        targetSection = sectionRef.current?.nextElementSibling;
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        targetSection = sectionRef.current?.previousElementSibling;
      }

      if (targetSection) {
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  // Scroll/wheel and touch navigation work normally in fullscreen
  // No special handlers needed - browser handles scrolling within fullscreen container

  const handleFullscreen = (e) => {
    e.stopPropagation();

    if (isFullscreen) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    } else {
      // Make the scroll container fullscreen, not the individual section
      if (scrollContainerRef?.current) {
        if (scrollContainerRef.current.requestFullscreen) {
          scrollContainerRef.current.requestFullscreen();
        } else if (scrollContainerRef.current.webkitRequestFullscreen) {
          scrollContainerRef.current.webkitRequestFullscreen();
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

      {/* Audio menu overlay - only in fullscreen */}
      {isFullscreen && showAudioMenu && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
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
                    opacity: selectedTrack?.name === track.name ? 1 : 0.85,
                    cursor: 'pointer',
                    transform: 'scale(1)',
                    filter: 'drop-shadow(0 0 0px rgba(26, 26, 26, 0))'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.filter = 'drop-shadow(0 0 8px rgba(26, 26, 26, 0.3))';
                  }}
                  onMouseLeave={(e) => {
                    if (selectedTrack?.name !== track.name) {
                      e.currentTarget.style.opacity = '0.85';
                    }
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.filter = 'drop-shadow(0 0 0px rgba(26, 26, 26, 0))';
                  }}
                >
                  {track.name}
                  {selectedTrack?.name === track.name && audioPlaying && (
                    <span className="eq-bars">
                      <span /><span /><span /><span />
                    </span>
                  )}
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
                  opacity: !selectedTrack ? 1 : 0.7,
                  cursor: 'pointer',
                  transform: 'scale(1)',
                  filter: 'drop-shadow(0 0 0px rgba(26, 26, 26, 0))'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.filter = 'drop-shadow(0 0 8px rgba(26, 26, 26, 0.3))';
                }}
                onMouseLeave={(e) => {
                  if (selectedTrack) {
                    e.currentTarget.style.opacity = '0.7';
                  }
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.filter = 'drop-shadow(0 0 0px rgba(26, 26, 26, 0))';
                }}
              >
                silent mode
              </button>
              {/* Credit Info option */}
              <button
                onClick={() => {
                  setShowCreditInfo(true);
                  setShowAudioMenu(false);
                }}
                className="block w-full text-left transition-all duration-300 mt-4"
                style={{
                  fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                  fontWeight: 500,
                  color: 'rgba(40, 40, 40, 0.6)',
                  letterSpacing: '-0.01em',
                  cursor: 'pointer',
                  transform: 'scale(1)',
                  filter: 'drop-shadow(0 0 0px rgba(26, 26, 26, 0))'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.filter = 'drop-shadow(0 0 8px rgba(26, 26, 26, 0.3))';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.filter = 'drop-shadow(0 0 0px rgba(26, 26, 26, 0))';
                }}
              >
                credit info
              </button>

              {/* Notes on Oswin option */}
              <button
                onClick={() => {
                  setShowNotesOnOswin(true);
                  setShowAudioMenu(false);
                }}
                className="block w-full text-left transition-all duration-300"
                style={{
                  fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                  fontWeight: 500,
                  color: 'rgba(40, 40, 40, 0.6)',
                  letterSpacing: '-0.01em',
                  cursor: 'pointer',
                  transform: 'scale(1)',
                  filter: 'drop-shadow(0 0 0px rgba(26, 26, 26, 0))'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.filter = 'drop-shadow(0 0 8px rgba(26, 26, 26, 0.3))';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.filter = 'drop-shadow(0 0 0px rgba(26, 26, 26, 0))';
                }}
              >
                notes on oswin
              </button>

              {/* Home option - smaller font */}
              <button
                onClick={() => {
                  setShowAudioMenu(false);
                  handleBackToArchive();
                }}
                className="block w-full text-left transition-all duration-300"
                style={{
                  fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                  fontWeight: 500,
                  color: 'rgba(40, 40, 40, 0.6)',
                  letterSpacing: '-0.01em',
                  cursor: 'pointer',
                  transform: 'scale(1)',
                  filter: 'drop-shadow(0 0 0px rgba(26, 26, 26, 0))'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.filter = 'drop-shadow(0 0 8px rgba(26, 26, 26, 0.3))';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.filter = 'drop-shadow(0 0 0px rgba(26, 26, 26, 0))';
                }}
              >
                home
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Circle button - toggles audio menu in fullscreen */}
      {isFullscreen && (
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
              opacity: (showButton || showAudioMenu) ? 0.9 : 0,
              transform: (showButton || showAudioMenu) ? 'scale(1)' : 'scale(0.8)',
              pointerEvents: (showButton || showAudioMenu) ? 'auto' : 'none'
            }}
            onMouseEnter={(e) => {
              if (showButton || showAudioMenu) e.currentTarget.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              if (showButton || showAudioMenu) e.currentTarget.style.opacity = '0.9';
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

// Triple Panel Section - 3 videos side by side (desktop only)
const TriplePanelSection = ({ panelSet, isDesktop, scrollContainerRef }) => {
  const videoRefs = useRef([null, null, null]);
  const sectionRef = useRef(null);
  const hideButtonTimeout = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showButton, setShowButton] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // Start each video at a random position when section becomes visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        if (entry.isIntersecting) {
          // Play all videos - sync start with optional per-panel offsets
          const firstVideo = videoRefs.current.find(v => v);
          const duration = firstVideo?.duration || 30;
          const syncedStart = Math.random() * duration;
          const offsets = panelSet.offsets || [0, 0, 0];
          videoRefs.current.forEach((video, i) => {
            if (video) {
              video.currentTime = (syncedStart + (offsets[i] || 0)) % duration;
              video.play().catch(e => console.log('Play prevented:', e));
            }
          });
        } else {
          // Pause all videos when not visible
          videoRefs.current.forEach(video => {
            if (video) video.pause();
          });
        }
      },
      { threshold: 0.5 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Track fullscreen state
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
      if (scrollContainerRef?.current) {
        if (scrollContainerRef.current.requestFullscreen) {
          scrollContainerRef.current.requestFullscreen();
        } else if (scrollContainerRef.current.webkitRequestFullscreen) {
          scrollContainerRef.current.webkitRequestFullscreen();
        }
      }
    }
  };

  // Track when videos are loaded
  const handleVideoLoaded = () => {
    const allLoaded = videoRefs.current.every(v => v && v.readyState >= 3);
    if (allLoaded) setIsLoaded(true);
  };

  if (!isDesktop) return null;

  return (
    <section
      ref={sectionRef}
      className="relative w-full"
      style={{
        height: '100vh',
        scrollSnapAlign: 'start',
        scrollSnapStop: 'always',
        backgroundColor: '#000',
        overflow: 'hidden'
      }}
      onMouseMove={handleMouseMove}
    >
      <div
        className="flex h-full"
        style={{
          width: '100vw'
        }}
      >
        {panelSet.panels.map((src, index) => (
          <div
            key={index}
            className="flex-shrink-0"
            style={{
              width: 'calc(100vw / 3)',
              height: '100vh',
              overflow: 'hidden'
            }}
          >
            <video
              ref={el => videoRefs.current[index] = el}
              src={src}
              muted
              loop
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center'
              }}
              onLoadedData={handleVideoLoaded}
            />
          </div>
        ))}
      </div>

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
    </section>
  );
};

export default App;