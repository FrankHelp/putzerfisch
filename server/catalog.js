// Kategorien im Unterwasser-Theme
export const CATEGORIES = [
  { id: 'kueche',  label: 'Kombüse',         icon: '🍽️', hint: 'Küche & Abwasch',        color: '#ffb45c' },
  { id: 'bad',     label: 'Riffspalte',      icon: '🚿', hint: 'Bad & Sanitär',          color: '#5ad1ff' },
  { id: 'wohnen',  label: 'Wohnriff',        icon: '🛋️', hint: 'Wohn- & Gemeinschaft',   color: '#a78bfa' },
  { id: 'boden',   label: 'Meeresboden',     icon: '🧹', hint: 'Böden & Staub',          color: '#4ade80' },
  { id: 'muell',   label: 'Strandgut',       icon: '🗑️', hint: 'Müll & Recycling',       color: '#94a3b8' },
  { id: 'waesche', label: 'Strömung',        icon: '👕', hint: 'Wäsche & Textilien',     color: '#f472b6' },
  { id: 'schlafen',label: 'Muschelbett',     icon: '🛏️', hint: 'Schlafzimmer',           color: '#818cf8' },
  { id: 'aussen',  label: 'Außenriff',       icon: '🪴', hint: 'Balkon, Flur, Keller',   color: '#34d399' },
  { id: 'extra',   label: 'Perlen',          icon: '💎', hint: 'Seltene Großtaten',      color: '#fcd34d' },
];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);
export const categoryById = (id) => CATEGORIES.find((c) => c.id === id);

// points ≈ Aufwand. minutes = Richtwert (realistisch).
export const CATALOG = [
  // ---- Kombüse ----
  { slug: 'abwasch',          name: 'WG-Abwasch machen',           category: 'kueche', icon: '🧼', points: 24, minutes: 15, keywords: ['spülen', 'geschirr', 'teller', 'abspülen'] },
  { slug: 'spuele-putzen',    name: 'Spüle reinigen',              category: 'kueche', icon: '🪣', points: 8, minutes: 5,  keywords: ['becken', 'ablauf', 'scheuern'] },
  { slug: 'spuelmaschine-aus',name: 'Spülmaschine ausräumen',      category: 'kueche', icon: '🍴', points: 10, minutes: 6,  keywords: ['geschirrspüler', 'ausräumen'] },
  { slug: 'arbeitsflaeche',   name: 'Arbeitsflächen wischen',      category: 'kueche', icon: '🧴', points: 4, minutes: 3,  keywords: ['küchenzeile', 'theke', 'abwischen'] },
  { slug: 'herd',             name: 'Herd & Ceranfeld schrubben',  category: 'kueche', icon: '🔥', points: 7, minutes: 5, keywords: ['kochfeld', 'platte', 'eingebrannt'] },
  { slug: 'backofen',         name: 'Backofen reinigen',           category: 'kueche', icon: '🍕', points: 50, minutes: 30, keywords: ['ofen', 'fett', 'eingebrannt'] },
  { slug: 'airfryer',         name: 'Airfryer reinigen',           category: 'kueche', icon: '🍟', points: 20, minutes: 15, keywords: ['ofen', 'fett', 'eingebrannt'] },
  { slug: 'kuehlschrank',     name: 'Kühlschrank ausmisten',       category: 'kueche', icon: '🧊', points: 30, minutes: 20, keywords: ['fridge', 'abgelaufen', 'ausräumen'] },
  { slug: 'mikrowelle',       name: 'Mikrowelle auswischen',       category: 'kueche', icon: '📦', points: 12, minutes: 8,  keywords: ['spritzer'] },
  { slug: 'vorratsschrank',   name: 'Vorratsschrank sortieren',    category: 'kueche', icon: '🥫', points: 15, minutes: 10, keywords: ['speisekammer', 'ordnen'] },
  { slug: 'staubsaugen',      name: 'Küche staubsaugen',           category: 'kueche', icon: '🌪️', points: 8, minutes: 5, keywords: ['saugen', 'teppich', 'boden'] },
  { slug: 'wischen',          name: 'Küchenboden wischen',         category: 'kueche', icon: '🧹', points: 12, minutes: 8, keywords: ['nass', 'wischmopp', 'putzen'] },

  // ---- Riffspalte ----
  { slug: 'klo',              name: 'Klo putzen',                  category: 'bad', icon: '🚽', points: 12, minutes: 5,  keywords: ['toilette', 'wc', 'schüssel'] },
  { slug: 'dusche',           name: 'Duschkopf entkalken',         category: 'bad', icon: '🚿', points: 15, minutes: 10, keywords: ['kalk', 'duschkabine', 'glas'] },
  { slug: 'badewanne',        name: 'Dusche/Badewanne schrubben',  category: 'bad', icon: '🛁', points: 18, minutes: 10, keywords: ['wanne', 'rand', 'dusche'] },
  { slug: 'waschbecken',      name: 'Waschbecken polieren',        category: 'bad', icon: '🚰', points: 8,  minutes: 5,  keywords: ['armatur', 'hahn', 'becken'] },
  { slug: 'spiegel',          name: 'Spiegel streifenfrei putzen', category: 'bad', icon: '🪞', points: 4,  minutes: 2,  keywords: ['glas', 'zahnpasta'] },
  { slug: 'fugen',            name: 'Fugen entschimmeln',          category: 'bad', icon: '🧱', points: 50, minutes: 25, keywords: ['schimmel', 'silikon', 'kacheln'] },
  { slug: 'abfluss',          name: 'Abfluss frei machen',         category: 'bad', icon: '🌀', points: 12, minutes: 5, keywords: ['haare', 'verstopft', 'siphon'] },
  { slug: 'handtuecher',      name: 'WG-Handtuch waschen',         category: 'bad', icon: '🧻', points: 8,  minutes: 5,  keywords: ['wechseln', 'tauschen'] },
  { slug: 'staubsaugen',      name: 'Bad staubsaugen',             category: 'bad', icon: '🌪️', points: 8, minutes: 5, keywords: ['saugen', 'teppich', 'boden'] },
  { slug: 'badfliesen',       name: 'Badfliesen wischen',          category: 'bad', icon: '🧽', points: 16, minutes: 10, keywords: ['kacheln', 'wand'] },

  // ---- Wohnriff ----
  { slug: 'aufraeumen-wohn',  name: 'Wohnzimmer aufräumen',        category: 'wohnen', icon: '🛋️', points: 14, minutes: 10, keywords: ['ordnung', 'chaos', 'sofa'] },
  { slug: 'couchtisch',       name: 'Couchtisch abräumen',         category: 'wohnen', icon: '🫖', points: 8,  minutes: 5,  keywords: ['tisch', 'gläser', 'tassen'] },
  { slug: 'sofa-saugen',      name: 'Sofa absaugen',               category: 'wohnen', icon: '🛏️', points: 16, minutes: 10, keywords: ['polster', 'krümel'] },
  { slug: 'staubwischen',     name: 'Staubwischen',                category: 'wohnen', icon: '🪶', points: 16, minutes: 10, keywords: ['regale', 'oberflächen', 'staub'] },
  { slug: 'fenster',          name: 'Fenster putzen',              category: 'wohnen', icon: '🪟', points: 40, minutes: 25, keywords: ['scheiben', 'glas', 'streifen'] },
  { slug: 'pflanzen',         name: 'Pflanzen gießen & entstauben',category: 'wohnen', icon: '🪴', points: 8,  minutes: 5,  keywords: ['blumen', 'gießen', 'grünzeug'] },
  { slug: 'kabelchaos',       name: 'Kabelchaos entwirren',        category: 'wohnen', icon: '🔌', points: 14, minutes: 10, keywords: ['kabel', 'ordnen', 'technik'] },
  { slug: 'buecherregal',     name: 'Regal sortieren',             category: 'wohnen', icon: '📚', points: 22, minutes: 15, keywords: ['bücher', 'ordnen'] },

  // ---- Meeresboden ----
  { slug: 'staubsaugen',      name: 'Staubsaugen',                 category: 'boden', icon: '🌪️', points: 24, minutes: 15, keywords: ['saugen', 'teppich', 'boden'] },
  { slug: 'wischen',          name: 'Boden wischen',               category: 'boden', icon: '🧹', points: 32, minutes: 20, keywords: ['nass', 'wischmopp', 'putzen'] },
  { slug: 'kehren',           name: 'Kehren',                      category: 'boden', icon: '🧺', points: 8,  minutes: 5,  keywords: ['besen', 'fegen'] },
  { slug: 'teppich',          name: 'Teppich tiefenreinigen',      category: 'boden', icon: '🟫', points: 54, minutes: 30, keywords: ['flecken', 'shampoo'] },
  { slug: 'ecken',            name: 'Ecken & Kanten entstauben',   category: 'boden', icon: '📐', points: 16, minutes: 10, keywords: ['sockelleiste', 'fussleiste', 'spinnweben'] },

  // ---- Strandgut ----
  { slug: 'muell-raus',       name: 'Müll rausbringen',            category: 'muell', icon: '🗑️', points: 4,  minutes: 3,  keywords: ['tonne', 'restmüll', 'eimer'] },
  { slug: 'gelber-sack',      name: 'Gelben Sack rausbringen',     category: 'muell', icon: '💛', points: 4,  minutes: 3,  keywords: ['plastik', 'verpackung'] },
  { slug: 'altglas',          name: 'Altglas wegbringen',          category: 'muell', icon: '🍾', points: 22, minutes: 15, keywords: ['flaschen', 'container', 'glas'] },
  { slug: 'pfand',            name: 'Pfand zurückbringen',         category: 'muell', icon: '🥤', points: 22, minutes: 12, keywords: ['flaschen', 'automat', 'leergut'] },
  { slug: 'papier',           name: 'Altpapier entsorgen',         category: 'muell', icon: '📰', points: 12,  minutes: 10,  keywords: ['karton', 'pappe'] },
  { slug: 'bio',              name: 'Biomüll entsorgen',           category: 'muell', icon: '🥬', points: 4,  minutes: 3,  keywords: ['kompost', 'organisch'] },
  { slug: 'muelleimer-putzen',name: 'Mülleimer auswaschen',        category: 'muell', icon: '🪣', points: 20, minutes: 10, keywords: ['stinkt', 'eimer', 'desinfizieren'] },

  // ---- Strömung (Wäsche) ----
  { slug: 'waesche-waschen',  name: 'Wäsche waschen',              category: 'waesche', icon: '🫧', points: 6,  minutes: 5,  keywords: ['maschine', 'anstellen'] },
  { slug: 'waesche-aufhaengen',name:'Wäsche aufhängen',            category: 'waesche', icon: '🧺', points: 16, minutes: 10, keywords: ['ständer', 'trocknen'] },
  { slug: 'waesche-falten',   name: 'Wäsche zusammenlegen',        category: 'waesche', icon: '👕', points: 18, minutes: 12, keywords: ['falten', 'einräumen'] },
  { slug: 'buegeln',          name: 'Bügeln',                      category: 'waesche', icon: '♨️', points: 32, minutes: 20, keywords: ['falten', 'hemden'] },
  { slug: 'gemeinschaftstextil',name:'Küchen- & Putztücher waschen',category:'waesche', icon: '🧣', points: 6,  minutes: 5,  keywords: ['lappen', 'geschirrtuch', 'kochen'] },
  { slug: 'waschmaschine-pflege',name:'Waschmaschine reinigen',    category: 'waesche', icon: '⚙️', points: 18, minutes: 10, keywords: ['flusensieb', 'gummi', 'kalk'] },

  // ---- Muschelbett ----
  { slug: 'bett-beziehen',    name: 'Bett frisch beziehen',        category: 'schlafen', icon: '🛏️', points: 10, minutes: 10, keywords: ['bettwäsche', 'laken', 'wechseln'] },
  { slug: 'zimmer-aufraeumen',name: 'Zimmer aufräumen',            category: 'schlafen', icon: '🪄', points: 12, minutes: 12, keywords: ['ordnung', 'klamotten'] },
  { slug: 'unterm-bett',      name: 'Unterm Bett saugen',          category: 'schlafen', icon: '👻', points: 16, minutes: 10, keywords: ['staubmäuse', 'wollmäuse'] },

  // ---- Außenriff ----
  { slug: 'balkon',           name: 'Balkon fegen',                category: 'aussen', icon: '🌇', points: 16, minutes: 10, keywords: ['terrasse', 'draußen'] },
  { slug: 'flur',             name: 'Flur & Garderobe ordnen',     category: 'aussen', icon: '🧥', points: 16, minutes: 10, keywords: ['schuhe', 'jacken', 'eingang'] },
  { slug: 'Kammer',           name: 'Abstellkammer entrümpeln',    category: 'aussen', icon: '📦', points: 72, minutes: 45, keywords: ['abstellraum', 'lager', 'ausmisten'] },
  { slug: 'schuhe',           name: 'Schuhregal sortieren',        category: 'aussen', icon: '👟', points: 7, minutes: 5,  keywords: ['schuhe', 'ordnen'] },

  // ---- Perlen (Seltene Großtaten - bewusst hoher Bonus) ----
  { slug: 'grossputz',        name: 'WG-Großputz',                 category: 'extra', icon: '🏆', points: 240, minutes: 120, keywords: ['putztag', 'komplett', 'alles'] },
  { slug: 'party-danach',     name: 'Nach der Party aufräumen',    category: 'extra', icon: '🎉', points: 120, minutes: 60, keywords: ['feier', 'chaos', 'flaschen'] },
  { slug: 'kuehltruhe',       name: 'Gefrierfach abtauen',         category: 'extra', icon: '❄️', points: 55, minutes: 30, keywords: ['eis', 'abtauen', 'gefrierschrank'] },
  { slug: 'heizung',          name: 'Heizkörper entstauben',       category: 'extra', icon: '🌡️', points: 24, minutes: 15, keywords: ['rippen', 'lamellen'] },
  { slug: 'tuerklinken',      name: 'Türklinken & Schalter desinfizieren', category: 'extra', icon: '🚪', points: 12, minutes: 8, keywords: ['lichtschalter', 'griffe', 'keime'] },
];