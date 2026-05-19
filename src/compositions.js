// Each composition is a named mix of MIDI tracks.
// To add a new one: copy an entry, give it a unique id, name it, and set tracks.
//   vol:    dB  (-30 to 6)
//   detune: cents (-1200 to 1200)
//   dist:   optional { distortion: 0–1, wet: 0–1 }

export const COMPOSITIONS = [
  {
    id: 'schoenberg',
    name: 'Yellow',
    bg: '#F5DD33',
    image: '/images/giftshop-yellow.jpg',
    tracks: [
      { midi: '/midi/op19.mid',    volume: -2,  detune: -100, dist: { distortion: 0.15, wet: 0.2 } },
      { midi: '/midi/op19no2.mid', volume: -11, detune: -600 },
    ],
  },
  {
    id: '33',
    name: 'Green',
    bg: '#22C55E',
    image: '/images/giftshop-green.jpg',
    tracks: [
      { midi: '/midi/33.mid', volume: -2, detune: 0, dist: { distortion: 0.15, wet: 0.2 } },
    ],
  },
  {
    id: 'op19no6-33',
    name: 'Blue',
    bg: '#00BFFF',
    image: '/images/giftshop-blue.jpg',
    tracks: [
      { midi: '/midi/op19no6.mid', volume: 0,   detune: 0 },
      { midi: '/midi/33.mid',      volume: -21, detune: 0 },
    ],
  },
  {
    id: 'op11no2-no3-33',
    name: 'Purple',
    bg: '#9333EA',
    image: '/images/giftshop-purple.jpg',
    tracks: [
      { midi: '/midi/33.mid',      volume: -19, detune: 0 },
      { midi: '/midi/op11no2.mid', volume: -6,  detune: 0 },
      { midi: '/midi/op11no3.mid', volume: -22, detune: -600 },
    ],
  },
  {
    id: 'op11no3-33',
    name: 'Red',
    bg: '#E8196A',
    image: '/images/giftshop-red.jpg',
    tracks: [
      { midi: '/midi/33.mid',      volume: -19, detune: 0 },
      { midi: '/midi/op11no3.mid', volume: 0,   detune: 0 },
    ],
  },
  {
    id: 'op19-no2-33',
    name: 'Orange',
    bg: '#F97316',
    image: '/images/giftshop-orange.jpg',
    tracks: [
      { midi: '/midi/op19.mid',    volume: 6,   detune: 0 },
      { midi: '/midi/op19no2.mid', volume: -27, detune: 0 },
      { midi: '/midi/33.mid',      volume: -21, detune: 0 },
    ],
  },
]
