import { useState, useEffect } from 'react'
import Spin from './spin/Spin'
import FilmStrip from './spin/FilmStrip'
import SingleFrame from './spin/SingleFrame'
import MidiPlayer from './spin/MidiPlayer'

const SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif'

const PAGES = [
  { hash: '',           label: 'Spin' },
  { hash: '#filmstrip', label: 'Film Strip' },
  { hash: '#single',    label: 'Single Frame' },
  { hash: '#midi',      label: 'Ruth' },
]

function SpinNav({ page }) {
  return (
    <nav style={{
      position: 'fixed', top: '50%', left: 24, transform: 'translateY(-50%)',
      zIndex: 100, display: 'flex', flexDirection: 'column', gap: 16,
      pointerEvents: 'none',
    }}>
      {PAGES.map(({ hash, label }) => {
        const active = page === hash
        return (
          <a
            key={hash}
            href={hash || '#'}
            style={{
              fontFamily: SANS, fontSize: 10, letterSpacing: '0.16em',
              textTransform: 'uppercase', textDecoration: 'none',
              color: active ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.25)',
              pointerEvents: 'all',
            }}
          >
            {label}
          </a>
        )
      })}
    </nav>
  )
}

export default function SpinApp() {
  const [page, setPage] = useState(window.location.hash)

  useEffect(() => {
    const onHash = () => setPage(window.location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return (
    <>
      <SpinNav page={page} />
      {page === '#filmstrip' ? <FilmStrip /> : page === '#single' ? <SingleFrame /> : page === '#midi' ? <MidiPlayer /> : <Spin />}
    </>
  )
}
