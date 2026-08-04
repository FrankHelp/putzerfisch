// Kategorien im Unterwasser-Theme
export const CATEGORIES = [
  { id: 'kombuese',    label: 'Kombüse',       icon: '🍽️', hint: 'Küche & Abwasch',        color: '#ffb45c' },
  { id: 'strandgut',   label: 'Strandgut',     icon: '🗑️', hint: 'Müll & Recycling',       color: '#94a3b8' },
  { id: 'riffspalte',  label: 'Riffspalte',    icon: '🚿', hint: 'Bad & Sanitär',          color: '#5ad1ff' },
  { id: 'wohnriff',    label: 'Wohnriff',      icon: '🛋️', hint: 'Wohn- & Gemeinschaft',   color: '#a78bfa' },
  { id: 'korallenkoje',label: 'Korallenkoje',  icon: '🛏️', hint: 'Schlafzimmer',           color: '#818cf8' },
  { id: 'stroemung',   label: 'Strömung',      icon: '👕', hint: 'Wäsche & Textilien',     color: '#f472b6' },
  { id: 'aussenriff',  label: 'Außenriff',     icon: '🪴', hint: 'Balkon, Flur, Keller',   color: '#34d399' },
  { id: 'perlen',      label: 'Perlen',        icon: '💎', hint: 'Seltene Großtaten',      color: '#fcd34d' },
];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);
export const categoryById = (id) => CATEGORIES.find((c) => c.id === id);

// points ≈ Aufwand. minutes = Richtwert (realistisch).
// prio ≈ wie oft die Aktivität im Jahr anfällt (Sortierung in der Add-View).
export const CATALOG = [
  // ---- Kombüse ----
  { slug: 'abwasch',           name: 'WG-Abwasch machen',           category: 'kombuese', icon: '🧼', points: 10, minutes: 8,  prio: 150, keywords: ['spülen', 'geschirr', 'teller', 'abspülen'] },
  { slug: 'spuele-putzen',     name: 'Spüle reinigen',              category: 'kombuese', icon: '🪣', points: 7,  minutes: 5,  prio: 48,  keywords: ['becken', 'ablauf', 'scheuern'] },
  { slug: 'spuelmaschine-aus', name: 'Spülmaschine ausräumen',      category: 'kombuese', icon: '🍴', points: 5,  minutes: 5,  prio: 180, keywords: ['geschirrspüler', 'ausräumen'] },
  { slug: 'arbeitsflaeche',    name: 'Arbeitsflächen wischen',      category: 'kombuese', icon: '🧴', points: 3,  minutes: 3,  prio: 365, keywords: ['küchenzeile', 'theke', 'abwischen'] },
  { slug: 'herd',              name: 'Herd & Ceranfeld schrubben',  category: 'kombuese', icon: '🔥', points: 7,  minutes: 5,  prio: 48,  keywords: ['kochfeld', 'platte', 'eingebrannt'] },
  { slug: 'backofen',          name: 'Backofen reinigen',           category: 'kombuese', icon: '🍕', points: 50, minutes: 30, prio: 12,  keywords: ['ofen', 'fett', 'eingebrannt'] },
  { slug: 'airfryer',          name: 'Airfryer reinigen',           category: 'kombuese', icon: '🍟', points: 20, minutes: 15, prio: 24,  keywords: ['korb', 'fett', 'eingebrannt'] },
  { slug: 'kuehlschrank',      name: 'Kühlschrank ausmisten und auswischen', category: 'kombuese', icon: '🧊', points: 30, minutes: 20, prio: 24, keywords: ['fridge', 'abgelaufen', 'ausräumen'] },
  { slug: 'mikrowelle',        name: 'Mikrowelle auswischen',       category: 'kombuese', icon: '📦', points: 12, minutes: 8,  prio: 12,  keywords: ['spritzer', 'innenraum'] },
  { slug: 'vorratsschrank',    name: 'Vorratsschrank sortieren',    category: 'kombuese', icon: '🥫', points: 25, minutes: 20, prio: 12,  keywords: ['speisekammer', 'ordnen'] },
  { slug: 'dunstabzug',        name: 'Dunstabzugshaube reinigen',   category: 'kombuese', icon: '💨', points: 40, minutes: 30, prio: 6,   keywords: ['fettfilter', 'haube', 'küche'] },
  { slug: 'kuechentuecher-waschen', name: 'Küchen- & Putztücher waschen', category: 'kombuese', icon: '🧣', points: 6, minutes: 5, prio: 24, keywords: ['lappen', 'geschirrtuch', 'kochen'] },
  { slug: 'kueche-saugen',     name: 'Küche staubsaugen',           category: 'kombuese', icon: '🌪️', points: 8,  minutes: 5,  prio: 104, keywords: ['saugen', 'boden', 'krümel'] },
  { slug: 'kueche-wischen',    name: 'Küchenboden wischen',         category: 'kombuese', icon: '🧹', points: 15, minutes: 10, prio: 52,  keywords: ['nass', 'wischmopp', 'putzen'] },

  // ---- Strandgut ----
  { slug: 'muell-raus',        name: 'Müll rausbringen',            category: 'strandgut', icon: '🗑️', points: 4,  minutes: 3,  prio: 156, keywords: ['tonne', 'restmüll', 'eimer'] },
  { slug: 'altglas',           name: 'Altglas wegbringen',          category: 'strandgut', icon: '🍾', points: 18, minutes: 15, prio: 12,  keywords: ['flaschen', 'container', 'glas'] },
  { slug: 'pfand',             name: 'Pfand zurückbringen',         category: 'strandgut', icon: '🥤', points: 15, minutes: 12, prio: 24,  keywords: ['flaschen', 'automat', 'leergut'] },
  { slug: 'papier',            name: 'Altpapier entsorgen',         category: 'strandgut', icon: '📰', points: 10, minutes: 10, prio: 26,  keywords: ['karton', 'pappe'] },
  { slug: 'muelleimer-putzen', name: 'Mülleimer auswaschen',        category: 'strandgut', icon: '🪣', points: 25, minutes: 15, prio: 12,  keywords: ['stinkt', 'eimer', 'desinfizieren'] },

  // ---- Riffspalte ----
  { slug: 'klo',               name: 'Klo putzen',                  category: 'riffspalte', icon: '🚽', points: 15, minutes: 8,  prio: 56,  keywords: ['toilette', 'wc', 'schüssel'] },
  { slug: 'dusche',            name: 'Duschkopf entkalken',         category: 'riffspalte', icon: '🚿', points: 15, minutes: 10, prio: 6,   keywords: ['kalk', 'duschkabine', 'glas'] },
  { slug: 'badewanne',         name: 'Dusche/Badewanne schrubben',  category: 'riffspalte', icon: '🛁', points: 25, minutes: 15, prio: 12,  keywords: ['wanne', 'rand', 'dusche'] },
  { slug: 'waschbecken',       name: 'Waschbecken polieren',        category: 'riffspalte', icon: '🚰', points: 8,  minutes: 5,  prio: 52,  keywords: ['armatur', 'hahn', 'becken'] },
  { slug: 'spiegel',           name: 'Spiegel streifenfrei putzen', category: 'riffspalte', icon: '🪞', points: 4,  minutes: 2,  prio: 52,  keywords: ['glas', 'zahnpasta'] },
  { slug: 'fugen',             name: 'Fugen entschimmeln',          category: 'riffspalte', icon: '🧱', points: 50, minutes: 25, prio: 4,   keywords: ['schimmel', 'silikon', 'kacheln'] },
  { slug: 'abfluss',           name: 'Abfluss frei machen',         category: 'riffspalte', icon: '🌀', points: 12, minutes: 5,  prio: 12,  keywords: ['haare', 'verstopft', 'siphon'] },
  { slug: 'bad-handtuecher-waschen', name: 'WG-Handtücher waschen', category: 'riffspalte', icon: '🔹', points: 4,  minutes: 3,  prio: 52,  keywords: ['wechseln', 'tauschen', 'bad'] },
  { slug: 'bad-saugen',        name: 'Bad staubsaugen',             category: 'riffspalte', icon: '🌪️', points: 8,  minutes: 5,  prio: 52,  keywords: ['saugen', 'boden', 'teppich'] },
  { slug: 'bad-wischen',       name: 'Badboden wischen',            category: 'riffspalte', icon: '🧽', points: 15, minutes: 8,  prio: 24,  keywords: ['boden', 'nass', 'wischmopp'] },
  { slug: 'badfliesen',        name: 'Badfliesen wischen',          category: 'riffspalte', icon: '🧽', points: 16, minutes: 10, prio: 26,  keywords: ['kacheln', 'wand'] },

  // ---- Wohnriff ----
  { slug: 'aufraeumen-wohn',   name: 'Wohnzimmer aufräumen',        category: 'wohnriff', icon: '🛋️', points: 10, minutes: 8,  prio: 104, keywords: ['ordnung', 'chaos', 'sofa'] },
  { slug: 'sofa-saugen',       name: 'Sofa absaugen',               category: 'wohnriff', icon: '🛏️', points: 12, minutes: 10, prio: 26,  keywords: ['polster', 'krümel'] },
  { slug: 'wohn-staubwischen', name: 'Staubwischen',                category: 'wohnriff', icon: '🪶', points: 7,  minutes: 5,  prio: 52,  keywords: ['regale', 'oberflächen', 'staub'] },
  { slug: 'pflanzen',          name: 'Pflanzen gießen & entstauben',category: 'wohnriff', icon: '🪴', points: 8,  minutes: 5,  prio: 52,  keywords: ['blumen', 'gießen', 'grünzeug'] },
  { slug: 'pflanzen-umtopfen', name: 'Zimmerpflanzen umtopfen',     category: 'wohnriff', icon: '🪴', points: 30, minutes: 20, prio: 1,   keywords: ['erde', 'topf', 'wurzeln'] },
  { slug: 'kabelchaos',        name: 'Kabelchaos entwirren',        category: 'wohnriff', icon: '🔌', points: 14, minutes: 10, prio: 12,  keywords: ['kabel', 'ordnen', 'technik'] },
  { slug: 'buecherregal',      name: 'Regal sortieren',             category: 'wohnriff', icon: '📚', points: 22, minutes: 15, prio: 6,   keywords: ['bücher', 'ordnen'] },
  { slug: 'wohnriff-saugen',   name: 'Wohnzimmer staubsaugen',      category: 'wohnriff', icon: '🌪️', points: 10, minutes: 6,  prio: 52,  keywords: ['saugen', 'boden', 'teppich'] },
  { slug: 'wohnriff-wischen',  name: 'Wohnzimmerboden wischen',     category: 'wohnriff', icon: '🧹', points: 15, minutes: 10, prio: 26,  keywords: ['boden', 'nass', 'wischmopp'] },
  { slug: 'teppich',           name: 'Teppich tiefenreinigen',      category: 'wohnriff', icon: '🟫', points: 54, minutes: 30, prio: 4,   keywords: ['flecken', 'shampoo', 'wohnzimmer'] },

  // ---- Korallenkoje ----
  { slug: 'bett-beziehen',     name: 'Bett frisch beziehen',        category: 'korallenkoje', icon: '🛏️', points: 10, minutes: 10, prio: 52,  keywords: ['bettwäsche', 'laken', 'wechseln'] },
  { slug: 'matratze-wenden',   name: 'Matratze wenden & absaugen',  category: 'korallenkoje', icon: '🛌', points: 10, minutes: 8,  prio: 2,   keywords: ['matratze', 'absaugen', 'pflege'] },
  { slug: 'zimmer-aufraeumen', name: 'Zimmer aufräumen',            category: 'korallenkoje', icon: '🪄', points: 12, minutes: 12, prio: 156, keywords: ['ordnung', 'klamotten'] },
  { slug: 'koje-oberflaechen', name: 'Schreibtisch / Tisch aufräumen', category: 'korallenkoje', icon: '🧺', points: 5, minutes: 5, prio: 104, keywords: ['schreibtisch', 'nachttisch', 'freiräumen'] },
  { slug: 'unterm-bett',       name: 'Unterm Bett saugen',          category: 'korallenkoje', icon: '👻', points: 12, minutes: 10, prio: 12,  keywords: ['staubmäuse', 'wollmäuse'] },
  { slug: 'korallenkoje-saugen', name: 'Zimmer staubsaugen',        category: 'korallenkoje', icon: '🌪️', points: 8,  minutes: 8,  prio: 52,  keywords: ['saugen', 'boden', 'ecken'] },
  { slug: 'korallenkoje-wischen', name: 'Zimmerboden wischen',      category: 'korallenkoje', icon: '🧹', points: 12, minutes: 10, prio: 26,  keywords: ['boden', 'nass', 'wischmopp'] },
  { slug: 'zimmer-decluttern', name: 'Zimmer decluttern',           category: 'korallenkoje', icon: '🧺', points: 60, minutes: 60, prio: 8,   keywords: ['ordnung', 'entrümpeln'] },

  // ---- Strömung ----
  { slug: 'waesche-waschen',   name: 'Wäsche waschen',              category: 'stroemung', icon: '🫧', points: 6,  minutes: 5,  prio: 104, keywords: ['maschine', 'anstellen'] },
  { slug: 'waesche-aufhaengen',name: 'Wäsche aufhängen',            category: 'stroemung', icon: '🪺', points: 6,  minutes: 5,  prio: 104, keywords: ['ständer', 'trocknen'] },
  { slug: 'buegeln',           name: 'Bügeln',                      category: 'stroemung', icon: '♨️', points: 20, minutes: 20, prio: 12,  keywords: ['hemden', 'glätten'] },
  { slug: 'gardinen-waschen',  name: 'Gardinen / Vorhänge waschen', category: 'stroemung', icon: '🪟', points: 30, minutes: 20, prio: 2,   keywords: ['vorhang', 'stoff', 'waschen'] },
  { slug: 'waschmaschine-pflege', name: 'Waschmaschine reinigen',   category: 'stroemung', icon: '⚙️', points: 15, minutes: 10, prio: 6,   keywords: ['flusensieb', 'gummi', 'kalk'] },

  // ---- Außenriff ----
  { slug: 'flur',              name: 'Flur & Garderobe ordnen',     category: 'aussenriff', icon: '🧥', points: 16, minutes: 10, prio: 52,  keywords: ['schuhe', 'jacken', 'eingang'] },
  { slug: 'flur-saugen',       name: 'Flur staubsaugen',            category: 'aussenriff', icon: '🌪️', points: 8,  minutes: 5,  prio: 52,  keywords: ['saugen', 'eingang', 'dreck'] },
  { slug: 'flur-wischen',      name: 'Flurboden wischen',           category: 'aussenriff', icon: '🧽', points: 10, minutes: 6,  prio: 26,  keywords: ['boden', 'eingang', 'nass'] },
  { slug: 'balkon',            name: 'Balkon fegen',                category: 'aussenriff', icon: '🌇', points: 12, minutes: 10, prio: 12,  keywords: ['terrasse', 'draußen', 'laub'] },
  { slug: 'balkon-reinigen',   name: 'Balkon aufräumen',            category: 'aussenriff', icon: '🌇', points: 15, minutes: 15, prio: 24,  keywords: ['balkon', 'bier', 'polster'] },
  { slug: 'schuhe',            name: 'Schuhregal sortieren',        category: 'aussenriff', icon: '👟', points: 7,  minutes: 5,  prio: 12,  keywords: ['schuhe', 'ordnen'] },
  { slug: 'kammer',            name: 'Abstellkammer entrümpeln',    category: 'aussenriff', icon: '📦', points: 60, minutes: 45, prio: 2,   keywords: ['abstellraum', 'lager', 'ausmisten'] },

  // ---- Perlen (raumübergreifend, bewusst hoher Bonus) ----
  { slug: 'grossputz',         name: 'WG-Großputz',                 category: 'perlen', icon: '🏆', points: 240, minutes: 120, prio: 2,   keywords: ['putztag', 'komplett', 'alles'] },
  { slug: 'party-danach',      name: 'Nach der Party aufräumen',    category: 'perlen', icon: '🎉', points: 60, minutes: 45, prio: 12,  keywords: ['feier', 'chaos', 'flaschen'] },
  { slug: 'kuehltruhe',        name: 'Gefrierfach abtauen',         category: 'perlen', icon: '❄️', points: 55, minutes: 30, prio: 2,   keywords: ['eis', 'abtauen', 'gefrierschrank'] },
  { slug: 'heizung',           name: 'Heizkörper entstauben',       category: 'perlen', icon: '🌡️', points: 24, minutes: 15, prio: 2,   keywords: ['rippen', 'lamellen'] },
  { slug: 'hinter-moebel',     name: 'Hinter/unter Möbel reinigen', category: 'perlen', icon: '🧰', points: 60, minutes: 30, prio: 4,   keywords: ['schwer erreichbar', 'tiefenreinigung'] },
  { slug: 'ecken',             name: 'Fußleisten schrubben',        category: 'perlen', icon: '📐', points: 16, minutes: 10, prio: 12,  keywords: ['sockelleiste', 'spinnweben', 'leisten'] },
  { slug: 'fenster',           name: 'Fenster putzen',              category: 'perlen', icon: '🪟', points: 40, minutes: 25, prio: 6,   keywords: ['scheiben', 'glas', 'streifen'] },
];
