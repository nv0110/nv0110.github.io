// Boss data, grouped by boss name with difficulties as array
export const bossData = [
  {
    name: 'Pink Bean',
    difficulties: [
      { difficulty: 'Chaos', price: 64000000 },
      { difficulty: 'Normal', price: 7022500 },
    ],
    image: '/bosses/PinkBean.png',
  },
  {
    name: 'Cygnus',
    difficulties: [
      { difficulty: 'Easy', price: 45562500 },
      { difficulty: 'Normal', price: 72250000 },
    ],
    image: '/bosses/cygnus.png',
  },
  {
    name: 'Zakum',
    difficulties: [
      { difficulty: 'Easy', price: 1000000 },
      { difficulty: 'Normal', price: 3062500 },
      { difficulty: 'Chaos', price: 81000000 },
    ],
    image: '/bosses/zakum.png',
  },
  {
    name: 'Crimson Queen',
    difficulties: [
      { difficulty: 'Normal', price: 4840000 },
      { difficulty: 'Chaos', price: 81000000 },
    ],
    image: '/bosses/crimsonqueen.png',
  },
  {
    name: 'Von Bon',
    difficulties: [
      { difficulty: 'Normal', price: 4840000 },
      { difficulty: 'Chaos', price: 81000000 },
    ],
    image: '/bosses/von_bon.png',
  },
  {
    name: 'Pierre',
    difficulties: [
      { difficulty: 'Normal', price: 4840000 },
      { difficulty: 'Chaos', price: 81000000 },
    ],
    image: '/bosses/pierre.png',
  },
  {
    name: 'Magnus',
    difficulties: [
      { difficulty: 'Easy', price: 3610000 },
      { difficulty: 'Normal', price: 12960000 },
      { difficulty: 'Hard', price: 95062500 },
    ],
    image: '/bosses/magnus.png',
  },
  {
    name: 'Vellum',
    difficulties: [
      { difficulty: 'Normal', price: 4840000 },
      { difficulty: 'Chaos', price: 105062500 },
    ],
    image: '/bosses/vellum.png',
  },
  {
    name: 'Papulatus',
    difficulties: [
      { difficulty: 'Easy', price: 3422500 },
      { difficulty: 'Normal', price: 13322500 },
      { difficulty: 'Chaos', price: 132250000 },
    ],
    image: '/bosses/Papulatus.png',
  },
  {
    name: 'Aketchi',
    difficulties: [
      { difficulty: 'Normal', price: 144000000 },
    ],
    image: '/bosses/akechi.png',
  },
  {
    name: 'Lotus',
    difficulties: [
      { difficulty: 'Normal', price: 162562500 },
      { difficulty: 'Hard', price: 444675000 },
      { difficulty: 'Extreme', price: 1397500000 },
    ],
    image: '/bosses/lotus.png',
    pitchedItems: [
      { name: 'Black Heart', image: '/items/blackheart.png' },
      { name: 'Berserked', image: '/items/berserked.png' },
      { name: 'Total Control', image: '/items/tc.png' }
    ]
  },
  {
    name: 'Damien',
    difficulties: [
      { difficulty: 'Normal', price: 169000000 },
      { difficulty: 'Hard', price: 421875000 },
    ],
    image: '/bosses/damien.png',
    pitchedItems: [
      { name: 'Magic Eyepatch', image: '/items/eyepatch.webp' }
    ]
  },
  {
    name: 'Guardian Angel Slime',
    difficulties: [
      { difficulty: 'Normal', price: 231673500 },
      { difficulty: 'Chaos', price: 600578125 },
    ],
    image: '/bosses/slime.png',
  },
  {
    name: 'Lucid',
    difficulties: [
      { difficulty: 'Easy', price: 237009375 },
      { difficulty: 'Normal', price: 253828125 },
      { difficulty: 'Hard', price: 504000000 },
    ],
    image: '/bosses/lucid.png',
    pitchedItems: [
      { name: 'Dreamy Belt', image: '/items/dreamy.png' }
    ]
  },
  {
    name: 'Will',
    difficulties: [
      { difficulty: 'Easy', price: 246744750 },
      { difficulty: 'Normal', price: 279075000 },
      { difficulty: 'Hard', price: 621810000 },
    ],
    image: '/bosses/will.png',
    pitchedItems: [
      { name: 'Cursed Spellbook', image: '/items/book.webp' }
    ]
  },
  {
    name: 'Gloom',
    difficulties: [
      { difficulty: 'Normal', price: 297675000 },
      { difficulty: 'Chaos', price: 563945000 },
    ],
    image: '/bosses/gloom.png',
    pitchedItems: [
      { name: 'Endless Terror', image: '/items/et.webp' }
    ]
  },
  {
    name: 'Darknell',
    difficulties: [
      { difficulty: 'Normal', price: 316875000 },
      { difficulty: 'Hard', price: 667920000 },
    ],
    image: '/bosses/darknell.png',
    pitchedItems: [
      { name: 'Commanding Force Earring', image: '/items/cfe.webp' }
    ]
  },
  {
    name: 'Verus Hilla',
    difficulties: [
      { difficulty: 'Normal', price: 581880000 },
      { difficulty: 'Hard', price: 762105000 },
    ],
    image: '/bosses/verus_hilla.png',
    pitchedItems: [
      { name: 'Source of Suffering', image: '/items/sos.png' }
    ]
  },
  {
    name: 'Chosen Seren',
    difficulties: [
      { difficulty: 'Normal', price: 889021875 },
      { difficulty: 'Hard', price: 1096562500 },
      { difficulty: 'Extreme', price: 4235000000 },
    ],
    image: '/bosses/seren.png',
    pitchedItems: [
      { name: "Mitra's Rage", image: '/items/emblem.webp' },
      { name: 'Gravity Module', image: '/items/module.webp', difficulty: 'Extreme' }
    ]
  },
  {
    name: 'Watcher Kalos',
    difficulties: [
      { difficulty: 'Easy', price: 937500000 },
      { difficulty: 'Normal', price: 1300000000 },
      { difficulty: 'Chaos', price: 2600000000 },
      { difficulty: 'Extreme', price: 5200000000 },
    ],
    image: '/bosses/Kalos.png',
    pitchedItems: [
      { name: 'Mark of Destruction', image: '/items/mark.webp', difficulty: 'Extreme' },
      { name: 'Grindstone of Life', image: '/items/grindstone.webp', difficulties: ['Easy', 'Normal', 'Chaos', 'Extreme'] }
    ]
  },
  {
    name: 'Kaling',
    difficulties: [
      { difficulty: 'Easy', price: 1031250000 },
      { difficulty: 'Normal', price: 1506500000 },
      { difficulty: 'Hard', price: 2990000000 },
      { difficulty: 'Extreme', price: 6026000000 },
    ],
    image: '/bosses/Kaling.png',
    pitchedItems: [
      { name: 'Helmet of Loyalty', image: '/items/helm.webp', difficulty: 'Extreme' },
      { name: 'Grindstone of Life', image: '/items/grindstone.webp', difficulties: ['Easy', 'Normal', 'Hard', 'Extreme'] }
    ]
  },
  {
    name: 'Limbo',
    difficulties: [
      { difficulty: 'Normal', price: 2100000000 },
      { difficulty: 'Hard', price: 3745000000 }
    ],
    image: '/bosses/Limbo.png',
  },
  {
    name: 'Hilla',
    difficulties: [
      { difficulty: 'Normal', price: 4000000 },
      { difficulty: 'Hard', price: 56250000 },
    ],
    image: '/bosses/hilla.png',
  },
  {
    name: 'Princess No',
    difficulties: [
      { difficulty: 'Normal', price: 81000000 },
    ],
    image: '/bosses/pno.png',
  },
];

// Helper: get price for a boss/difficulty
export const getBossPrice = (boss, difficulty) => {
  const d = boss.difficulties.find(d => d.difficulty === difficulty);
  return d ? d.price : 0;
}; 