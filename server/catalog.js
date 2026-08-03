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

// points ≈ Aufwand. minutes = Richtwert.
export const CATALOG = [
  // ---- Kombüse ----
  { slug: 'abwasch',          name: 'Abwasch machen',              category: 'kueche', icon: '🧼', points: 20, minutes: 15, keywords: ['spülen', 'geschirr', 'teller', 'abspülen'] },
  { slug: 'spuelmaschine-aus',name: 'Spülmaschine ausräumen',      category: 'kueche', icon: '🍴', points: 12, minutes: 6,  keywords: ['geschirrspüler', 'ausräumen'] },
  { slug: 'spuelmaschine-ein',name: 'Spülmaschine einräumen',      category: 'kueche', icon: '🥣', points: 10, minutes: 5,  keywords: ['geschirrspüler', 'einräumen', 'anstellen'] },
  { slug: 'arbeitsflaeche',   name: 'Arbeitsflächen wischen',      category: 'kueche', icon: '🧴', points: 12, minutes: 7,  keywords: ['küchenzeile', 'theke', 'abwischen'] },
  { slug: 'herd',             name: 'Herd & Ceranfeld schrubben',  category: 'kueche', icon: '🔥', points: 22, minutes: 15, keywords: ['kochfeld', 'platte', 'eingebrannt'] },
  { slug: 'backofen',         name: 'Backofen reinigen',           category: 'kueche', icon: '🍕', points: 45, minutes: 40, keywords: ['ofen', 'fett', 'eingebrannt'] },
  { slug: 'kuehlschrank',     name: 'Kühlschrank ausmisten',       category: 'kueche', icon: '🧊', points: 35, minutes: 25, keywords: ['fridge', 'abgelaufen', 'ausräumen'] },
  { slug: 'mikrowelle',       name: 'Mikrowelle auswischen',       category: 'kueche', icon: '📦', points: 12, minutes: 8,  keywords: ['spritzer'] },
  { slug: 'dunstabzug',       name: 'Dunstabzugsfilter reinigen',  category: 'kueche', icon: '💨', points: 30, minutes: 20, keywords: ['haube', 'fett', 'filter'] },
  { slug: 'kaffeemaschine',   name: 'Kaffeemaschine entkalken',    category: 'kueche', icon: '☕', points: 25, minutes: 20, keywords: ['kalk', 'siebträger', 'entkalken'] },
  { slug: 'vorratsschrank',   name: 'Vorratsschrank sortieren',    category: 'kueche', icon: '🥫', points: 28, minutes: 20, keywords: ['speisekammer', 'ordnen'] },

  // ---- Riffspalte ----
  { slug: 'klo',              name: 'Klo putzen',                  category: 'bad', icon: '🚽', points: 30, minutes: 12, keywords: ['toilette', 'wc', 'schüssel'] },
  { slug: 'dusche',           name: 'Dusche entkalken',            category: 'bad', icon: '🚿', points: 32, minutes: 20, keywords: ['kalk', 'duschkabine', 'glas'] },
  { slug: 'badewanne',        name: 'Badewanne schrubben',         category: 'bad', icon: '🛁', points: 28, minutes: 18, keywords: ['wanne', 'rand'] },
  { slug: 'waschbecken',      name: 'Waschbecken polieren',        category: 'bad', icon: '🚰', points: 14, minutes: 8,  keywords: ['armatur', 'hahn', 'becken'] },
  { slug: 'spiegel',          name: 'Spiegel streifenfrei putzen', category: 'bad', icon: '🪞', points: 12, minutes: 6,  keywords: ['glas', 'zahnpasta'] },
  { slug: 'fugen',            name: 'Fugen entschimmeln',          category: 'bad', icon: '🧱', points: 48, minutes: 40, keywords: ['schimmel', 'silikon', 'kacheln'] },
  { slug: 'abfluss',          name: 'Abfluss frei machen',         category: 'bad', icon: '🌀', points: 26, minutes: 15, keywords: ['haare', 'verstopft', 'siphon'] },
  { slug: 'handtuecher',      name: 'Frische Handtücher aufhängen',category: 'bad', icon: '🧻', points: 8,  minutes: 4,  keywords: ['wechseln', 'tauschen'] },
  { slug: 'badfliesen',       name: 'Badfliesen wischen',          category: 'bad', icon: '🧽', points: 22, minutes: 15, keywords: ['kacheln', 'wand'] },

  // ---- Wohnriff ----
  { slug: 'aufraeumen-wohn',  name: 'Wohnzimmer aufräumen',        category: 'wohnen', icon: '🛋️', points: 18, minutes: 12, keywords: ['ordnung', 'chaos', 'sofa'] },
  { slug: 'couchtisch',       name: 'Couchtisch abräumen',         category: 'wohnen', icon: '🫖', points: 10, minutes: 5,  keywords: ['tisch', 'gläser', 'tassen'] },
  { slug: 'sofa-saugen',      name: 'Sofa absaugen',               category: 'wohnen', icon: '🛏️', points: 20, minutes: 12, keywords: ['polster', 'krümel'] },
  { slug: 'staubwischen',     name: 'Staubwischen',                category: 'wohnen', icon: '🪶', points: 16, minutes: 12, keywords: ['regale', 'oberflächen', 'staub'] },
  { slug: 'fenster',          name: 'Fenster putzen',              category: 'wohnen', icon: '🪟', points: 38, minutes: 30, keywords: ['scheiben', 'glas', 'streifen'] },
  { slug: 'pflanzen',         name: 'Pflanzen gießen & entstauben',category: 'wohnen', icon: '🪴', points: 12, minutes: 8,  keywords: ['blumen', 'gießen', 'grünzeug'] },
  { slug: 'kabelchaos',       name: 'Kabelchaos entwirren',        category: 'wohnen', icon: '🔌', points: 20, minutes: 15, keywords: ['kabel', 'ordnen', 'technik'] },
  { slug: 'buecherregal',     name: 'Regal sortieren',             category: 'wohnen', icon: '📚', points: 22, minutes: 18, keywords: ['bücher', 'ordnen'] },

  // ---- Meeresboden ----
  { slug: 'staubsaugen',      name: 'Staubsaugen',                 category: 'boden', icon: '🌪️', points: 24, minutes: 18, keywords: ['saugen', 'teppich', 'boden'] },
  { slug: 'wischen',          name: 'Boden wischen',               category: 'boden', icon: '🧹', points: 28, minutes: 22, keywords: ['nass', 'wischmopp', 'putzen'] },
  { slug: 'kehren',           name: 'Kehren',                      category: 'boden', icon: '🧺', points: 12, minutes: 8,  keywords: ['besen', 'fegen'] },
  { slug: 'teppich',          name: 'Teppich tiefenreinigen',      category: 'boden', icon: '🟫', points: 40, minutes: 35, keywords: ['flecken', 'shampoo'] },
  { slug: 'ecken',            name: 'Ecken & Kanten entstauben',   category: 'boden', icon: '📐', points: 18, minutes: 12, keywords: ['sockelleiste', 'fussleiste', 'spinnweben'] },
  { slug: 'treppe',           name: 'Treppenhaus wischen',         category: 'boden', icon: '🪜', points: 34, minutes: 25, keywords: ['stufen', 'flur'] },

  // ---- Strandgut ----
  { slug: 'muell-raus',       name: 'Müll rausbringen',            category: 'muell', icon: '🗑️', points: 12, minutes: 5,  keywords: ['tonne', 'restmüll', 'eimer'] },
  { slug: 'gelber-sack',      name: 'Gelben Sack rausbringen',     category: 'muell', icon: '💛', points: 12, minutes: 5,  keywords: ['plastik', 'verpackung'] },
  { slug: 'altglas',          name: 'Altglas wegbringen',          category: 'muell', icon: '🍾', points: 22, minutes: 15, keywords: ['flaschen', 'container', 'glas'] },
  { slug: 'pfand',            name: 'Pfand zurückbringen',         category: 'muell', icon: '🥤', points: 25, minutes: 20, keywords: ['flaschen', 'automat', 'leergut'] },
  { slug: 'papier',           name: 'Altpapier entsorgen',         category: 'muell', icon: '📰', points: 14, minutes: 8,  keywords: ['karton', 'pappe'] },
  { slug: 'bio',              name: 'Biomüll entsorgen',           category: 'muell', icon: '🥬', points: 14, minutes: 6,  keywords: ['kompost', 'organisch'] },
  { slug: 'muelleimer-putzen',name: 'Mülleimer auswaschen',        category: 'muell', icon: '🪣', points: 24, minutes: 15, keywords: ['stinkt', 'eimer', 'desinfizieren'] },

  // ---- Strömung (Wäsche) ----
  { slug: 'waesche-waschen',  name: 'Wäsche waschen',              category: 'waesche', icon: '🫧', points: 14, minutes: 8,  keywords: ['maschine', 'anstellen'] },
  { slug: 'waesche-aufhaengen',name:'Wäsche aufhängen',            category: 'waesche', icon: '🧺', points: 16, minutes: 12, keywords: ['ständer', 'trocknen'] },
  { slug: 'waesche-falten',   name: 'Wäsche zusammenlegen',        category: 'waesche', icon: '👕', points: 18, minutes: 15, keywords: ['falten', 'einräumen'] },
  { slug: 'buegeln',          name: 'Bügeln',                      category: 'waesche', icon: '♨️', points: 26, minutes: 20, keywords: ['falten', 'hemden'] },
  { slug: 'gemeinschaftstextil',name:'Küchen- & Putztücher waschen',category:'waesche', icon: '🧣', points: 16, minutes: 10, keywords: ['lappen', 'geschirrtuch', 'kochen'] },
  { slug: 'waschmaschine-pflege',name:'Waschmaschine reinigen',    category: 'waesche', icon: '⚙️', points: 30, minutes: 20, keywords: ['flusensieb', 'gummi', 'kalk'] },

  // ---- Muschelbett ----
  { slug: 'bett-beziehen',    name: 'Bett frisch beziehen',        category: 'schlafen', icon: '🛏️', points: 20, minutes: 12, keywords: ['bettwäsche', 'laken', 'wechseln'] },
  { slug: 'zimmer-aufraeumen',name: 'Zimmer aufräumen',            category: 'schlafen', icon: '🪄', points: 20, minutes: 15, keywords: ['ordnung', 'klamotten'] },
  { slug: 'kleiderschrank',   name: 'Kleiderschrank ausmisten',    category: 'schlafen', icon: '🚪', points: 32, minutes: 30, keywords: ['klamotten', 'sortieren', 'spenden'] },
  { slug: 'lueften',          name: 'Gründlich durchlüften',       category: 'schlafen', icon: '🌬️', points: 6,  minutes: 10, keywords: ['stoßlüften', 'frischluft', 'fenster'] },
  { slug: 'unterm-bett',      name: 'Unterm Bett saugen',          category: 'schlafen', icon: '👻', points: 22, minutes: 15, keywords: ['staubmäuse', 'wollmäuse'] },

  // ---- Außenriff ----
  { slug: 'balkon',           name: 'Balkon fegen',                category: 'aussen', icon: '🌇', points: 22, minutes: 15, keywords: ['terrasse', 'draußen'] },
  { slug: 'flur',             name: 'Flur & Garderobe ordnen',     category: 'aussen', icon: '🧥', points: 18, minutes: 12, keywords: ['schuhe', 'jacken', 'eingang'] },
  { slug: 'keller',           name: 'Keller entrümpeln',           category: 'aussen', icon: '📦', points: 45, minutes: 45, keywords: ['abstellraum', 'lager', 'ausmisten'] },
  { slug: 'briefkasten',      name: 'Briefkasten leeren',          category: 'aussen', icon: '📬', points: 6,  minutes: 3,  keywords: ['post', 'werbung'] },
  { slug: 'fahrrad',          name: 'Fahrradkeller aufräumen',     category: 'aussen', icon: '🚲', points: 26, minutes: 20, keywords: ['räder', 'abstellen'] },
  { slug: 'schuhe',           name: 'Schuhregal sortieren',        category: 'aussen', icon: '👟', points: 14, minutes: 10, keywords: ['schuhe', 'ordnen'] },

  // ---- Perlen ----
  { slug: 'grossputz',        name: 'WG-Großputz',                 category: 'extra', icon: '🏆', points: 80, minutes: 90, keywords: ['putztag', 'komplett', 'alles'] },
  { slug: 'party-danach',     name: 'Nach der Party aufräumen',    category: 'extra', icon: '🎉', points: 55, minutes: 45, keywords: ['feier', 'chaos', 'flaschen'] },
  { slug: 'umzugskisten',     name: 'Umzugskisten wegräumen',      category: 'extra', icon: '📦', points: 40, minutes: 35, keywords: ['kartons', 'einzug'] },
  { slug: 'putzmittel',       name: 'Putzmittel nachkaufen',       category: 'extra', icon: '🛒', points: 25, minutes: 25, keywords: ['einkauf', 'nachschub', 'besorgen'] },
  { slug: 'kuehltruhe',       name: 'Gefrierfach abtauen',         category: 'extra', icon: '❄️', points: 42, minutes: 50, keywords: ['eis', 'abtauen', 'gefrierschrank'] },
  { slug: 'heizung',          name: 'Heizkörper entstauben',       category: 'extra', icon: '🌡️', points: 24, minutes: 18, keywords: ['rippen', 'lamellen'] },
  { slug: 'tuerklinken',      name: 'Türklinken & Schalter desinfizieren', category: 'extra', icon: '🚪', points: 16, minutes: 10, keywords: ['lichtschalter', 'griffe', 'keime'] },
];
