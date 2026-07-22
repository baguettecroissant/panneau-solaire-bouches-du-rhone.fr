#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const communesPath = join(__dirname, '..', 'src', 'data', 'communes.json');

if (!existsSync(communesPath)) {
  console.error('communes.json not found. Run fetch-cities.mjs first.');
  process.exit(1);
}

const communes = JSON.parse(readFileSync(communesPath, 'utf-8'));

function hash(slug, seed = 0) {
  let h = seed * 31;
  for (let i = 0; i < slug.length; i++) {
    h = ((h << 5) - h + slug.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// Map postal code/slug to Bouches-du-Rhône intercommunalities
function getIntercommunalite(cp, slug) {
  const codePostal = String(cp);
  
  if (['arles', 'tarascon', 'saint-martin-de-crau', 'boulbon'].includes(slug) || codePostal.startsWith('13200') || codePostal.startsWith('13150') || codePostal.startsWith('13310')) {
    return "Métropole d'Arles Crau Camargue Montagnette";
  }
  
  if (['chateaurenard', 'barbentane', 'noves', 'cabannes', 'rognonas', 'eyragues', 'orgon'].includes(slug) || ['13160', '13570', '13630', '13550', '13940', '13660'].includes(codePostal)) {
    return "Communauté d'agglomération Terre de Provence";
  }
  
  if (['saint-remy-de-provence', 'fontvieille', 'maussane-les-alpilles', 'mouries', 'eygalieres'].includes(slug) || ['13210', '13990', '13520', '13810', '13890'].includes(codePostal)) {
    return "Communauté de communes Vallée des Baux-Alpilles";
  }

  return "Métropole d'Aix-Marseille-Provence";
}

function getHabitatType(slug) {
  const h = hash(slug, 1);
  const types = [
    "bastides provençales traditionnelles et mas en pierre avec de grandes toitures inclinées orientées sud",
    "maisons individuelles contemporaines et pavillons récents disposant d'un excellent ensoleillement",
    "immeubles résidentiels et copropriétés urbaines en centre ancien",
    "villas provençales avec toitures en tuiles canal idéales pour la surimposition de panneaux",
    "bâtisses provençales, bastides de campagne et maisons de village"
  ];
  if (['marseille', 'aix-en-provence', 'arles', 'aubagne'].includes(slug)) {
    return "copropriétés urbaines, maisons de ville et villas individuelles en périphérie";
  }
  return types[h % types.length];
}

function getAnecdotePatrimoine(slug) {
  const anecdotes = [
    "la protection esthétique stricte imposée par les Architectes des Bâtiments de France (ABF) sur les toitures provençales visibles depuis les monuments historiques",
    "l'obligation de respecter les teintes de toiture traditionnelles en choisissant des panneaux solaires extra-noirs (full black) ultra-discrets",
    "l'architecture provençale locale où les génoises et tuiles canal exigent une pose en surimposition parfaitement intégrée à la pente du toit",
    "la nécessité de fixer solidement les structures en aluminium sur les chevrons de la charpente pour résister aux rafales violentes de Mistral",
    "les bastides locales dont la toiture à faible pente caractéristique offre un angle d'inclinaison de 30 degrés, optimal pour capter le rayonnement solaire"
  ];
  
  if (slug.includes('marseille')) {
    return "la proximité des Calanques (parc national) et du Vieux-Port, où les toitures plates ou les exigences esthétiques imposées par les ABF demandent une intégration minutieuse et parfois des panneaux de couleur neutre";
  }
  if (slug.includes('aix-en-provence')) {
    return "le patrimoine architectural exceptionnel des bastides d'Aix-en-Provence qui requiert des démarches de déclaration préalable soignées en mairie, notamment pour respecter l'inclinaison traditionnelle et les teintes de toiture";
  }
  if (slug.includes('arles')) {
    return "le patrimoine romain antique d'Arles et la proximité de la Camargue, imposant des contraintes d'intégration paysagère strictes pour ne pas dénaturer la silhouette des toits traditionnels en tuiles de récupération";
  }
  if (slug.includes('aubagne')) {
    return "la vallée de l'Huveaune et le massif du Garlaban, propices à l'installation de carports solaires dans les jardins provençaux pour abriter les véhicules tout en produisant de l'électricité";
  }
  if (slug.includes('martigues')) {
    return "l'étang de Berre et les canaux de Martigues, zones pionnières des Bouches-du-Rhône dans le développement d'installations photovoltaïques industrielles et résidentielles";
  }
  if (slug.includes('salon')) {
    return "Salon-de-Provence, la ville de Nostradamus — qui aurait sans doute apprécié de voir l'ensoleillement record de la Crau se transformer en énergie renouvelable propre";
  }
  
  const h = hash(slug, 2);
  return anecdotes[h % anecdotes.length];
}

function getLocalIntroText(commune) {
  const { nom, slug, population } = commune;
  const habitat = getHabitatType(slug);
  const anecdote = getAnecdotePatrimoine(slug);
  
  return `Avec ses ${population.toLocaleString('fr-FR')} habitants, la commune de ${nom} présente un parc immobilier idéal pour la transition énergétique, composé en grande partie de ${habitat}. Les Bouches-du-Rhône bénéficient de 2 900 heures d'ensoleillement par an — le département idéal pour rentabiliser vos panneaux solaires en 6 à 8 ans. De plus, ${anecdote}. C'est pourquoi faire appel à un installateur certifié QualiPV RGE est indispensable pour assurer la conformité de votre installation solaire photovoltaïque dans cette zone.`;
}

function getLocalAdvice(commune) {
  const { nom, slug } = commune;
  const h = hash(slug, 3);
  const advices = [
    `Pour votre projet solaire à ${nom}, sachez que la prime à l'autoconsommation et la revente du surplus d'électricité à EDF OA (Obligation d'Achat) permettent d'amortir votre investissement sur une période de 6 à 8 ans en moyenne.`,
    `À ${nom}, la déclaration préalable de travaux (DP) en mairie est obligatoire avant de poser des panneaux solaires. Un installateur RGE local s'occupe généralement de l'ensemble des démarches administratives et du raccordement au réseau Enedis 13.`,
    `Avant de signer votre devis solaire à ${nom}, exigez systématiquement la certification QualiPV de l'installateur à jour pour 2026. Cela vous garantit le droit aux aides publiques et à la revente du surplus d'électricité à tarif garanti.`,
    `Le mistral soufflant fort sur ${nom}, le choix d'un système de fixation certifié CSTB est capital. Une pose en surimposition sur rails en aluminium ancrés dans la charpente offre la meilleure résistance au vent sans risquer d'abîmer vos tuiles provençales.`
  ];
  return advices[h % advices.length];
}

function getLocalFAQ(commune) {
  const { nom, slug } = commune;
  
  const faqList = [
    {
      q: `Peut-on installer des panneaux solaires sur des tuiles provençales à ${nom} ?`,
      a: `Oui, c'est tout à fait possible et c'est la configuration la plus courante à ${nom}. Les installateurs solaires utilisent la technique de la surimposition : les panneaux sont fixés sur des rails en aluminium, eux-mêmes ancrés solidement aux chevrons de la charpente à travers les tuiles. Cela évite tout problème d'étanchéité et résiste parfaitement aux tempêtes de Mistral.`
    },
    {
      q: `Quel est le prix moyen d'une installation solaire à ${nom} en 2026 ?`,
      a: `À ${nom}, une installation photovoltaïque de 3 kWc (environ 8 panneaux solaires) coûte entre 7 000€ et 9 500€ TTC, matériel, pose et raccordement Enedis compris. Pour une installation de 6 kWc, comptez entre 12 000€ et 16 000€ TTC, et entre 16 000€ et 22 000€ TTC pour une puissance de 9 kWc.`
    },
    {
      q: `Quelles sont les aides financières disponibles pour le solaire à ${nom} ?`,
      a: `En 2026, vous pouvez bénéficier de la prime à l'autoconsommation versée par l'État (répartie sur les 5 premières années), de la TVA à taux réduit de 10% pour les installations ≤ 3 kWc, et du tarif garanti de revente du surplus d'électricité à EDF OA (13 cts/kWh). Les aides locales de la Métropole peuvent s'ajouter sous certaines conditions.`
    },
    {
      q: `Quelle production d'électricité espérer avec des panneaux solaires à ${nom} ?`,
      a: `Grâce aux 2 900 heures d'ensoleillement par an dans les Bouches-du-Rhône, une installation de 3 kWc produit environ 4 200 kWh d'électricité propre par an. Cela vous permet de couvrir entre 60% et 80% de votre consommation d'électricité annuelle et de réaliser des économies majeures sur votre facture.`
    }
  ];
  
  return faqList;
}

function getMarketData(commune) {
  const { slug, population } = commune;
  const h = hash(slug, 4);
  
  // Base values adjusted by population and a hash variation
  let rgeCount = 4;
  if (population > 100000) rgeCount = 38;      // Marseille
  else if (population > 50000) rgeCount = 18;   // Aix-en-Provence
  else if (population > 20000) rgeCount = 9;
  else if (population > 10000) rgeCount = 6;
  else if (population > 5000) rgeCount = 4;
  
  rgeCount += (h % 3);
  rgeCount = Math.max(2, rgeCount);
  
  // Production variation based on location (slightly higher on coast)
  const baseProd = 1350 + (h % 100); // 1350 - 1450 kWh/kWc/an
  
  return {
    installateursRGE: rgeCount,
    productionMoyenneKwc: baseProd,
    delaiMoyenJours: 15 + (h % 20) // 15 - 35 days lead time
  };
}

const enriched = communes.map(commune => {
  const intercommunalite = getIntercommunalite(commune.codePostal, commune.slug);
  const intro = getLocalIntroText(commune);
  const conseil = getLocalAdvice(commune);
  const faq = getLocalFAQ(commune);
  const market = getMarketData(commune);
  
  return {
    ...commune,
    intercommunalite,
    introText: intro,
    conseilLocal: conseil,
    faq: faq,
    marketData: market
  };
});

writeFileSync(communesPath, JSON.stringify(enriched, null, 2), 'utf-8');

console.log(`✅ Enriched ${enriched.length} Bouches-du-Rhône (13) communes with unique SEO solar data.`);
console.log('Sample Marseille:', JSON.stringify(enriched.find(c => c.slug.includes('marseille')), null, 2));
console.log('Sample Aix-en-Provence:', JSON.stringify(enriched.find(c => c.slug === 'aix-en-provence'), null, 2));
