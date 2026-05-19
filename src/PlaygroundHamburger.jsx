import { useState } from 'react'

const SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif'

const EXPERIMENTS = [
  { name: 'cubes', label: 'Cubes' },
  { name: 'spin',  label: 'Spin'  },
]

export default function PlaygroundHamburger({ active, onSelect }) {
  const [open, setOpen] = useState(false)

  const bar = (transform, opacity = 0.6) => ({
    position: 'absolute',
    width: '28px',
    height: '2px',
    backgroundColor: '#1A1A1A',
    borderRadius: '9999px',
    opacity,
    transform,
    transformOrigin: 'center',
    transition: 'all 0.5s',
  })

  const handleSelect = (name) => {
    setOpen(false)
    if (onSelect) onSelect(name)
  }

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 200,
          width: '56px',
          height: '56px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={bar(open ? 'rotate(45deg)' : 'translateY(-6px)')} />
        <span style={bar('translateY(0)', open ? 0 : 0.6)} />
        <span style={bar(open ? 'rotate(-45deg)' : 'translateY(6px)')} />
      </button>

      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 190,
          backgroundColor: '#F7F7F5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.7s cubic-bezier(0.4, 0.0, 0.2, 1)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', textAlign: 'center' }}>
          <p style={{
            fontFamily: SANS, fontSize: 10, letterSpacing: '0.2em',
            textTransform: 'uppercase', color: 'rgba(26,26,26,0.35)',
          }}>
            playground
          </p>
          {EXPERIMENTS.map(({ name, label }, i) => {
            const isCurrent = name === active
            return (
              <button
                key={name}
                onClick={() => handleSelect(name)}
                style={{
                  fontFamily: SANS,
                  fontSize: '13px',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: isCurrent ? 'rgba(26,26,26,0.9)' : 'rgba(26,26,26,0.35)',
                  background: 'none',
                  border: 'none',
                  cursor: isCurrent ? 'default' : 'pointer',
                  padding: 0,
                  opacity: open ? 1 : 0,
                  transform: open ? 'translateY(0)' : 'translateY(20px)',
                  transition: `opacity 0.5s ${i * 0.05}s, transform 0.5s ${i * 0.05}s`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  justifyContent: 'center',
                }}
                onMouseEnter={isCurrent ? undefined : (e) => { e.currentTarget.style.color = 'rgba(26,26,26,0.8)' }}
                onMouseLeave={isCurrent ? undefined : (e) => { e.currentTarget.style.color = 'rgba(26,26,26,0.35)' }}
              >
                {isCurrent && (
                  <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#1A1A1A', opacity: 0.6, display: 'inline-block' }} />
                )}
                {label}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
