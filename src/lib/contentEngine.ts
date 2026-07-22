import communes from '../data/communes.json';
import { getSmartNearbyCommunes } from './geoLinks';

export interface Commune {
  nom: string;
  slug: string;
  codeInsee: string;
  codePostal: string;
  population: number;
  latitude?: number;
  longitude?: number;
  intercommunalite?: string;
  introText?: string;
  conseilLocal?: string;
  faq?: { q: string; a: string }[];
  marketData?: {
    installateursRGE: number;
    productionMoyenneKwc: number;
    delaiMoyenJours: number;
  };
}

export function getDynamicPrices(commune: Commune) {
  const prod = commune.marketData?.productionMoyenneKwc || 1400;
  
  return {
    kit3kwc: { min: 7000, max: 9500, prodAn: Math.round(3 * prod) },
    kit6kwc: { min: 12000, max: 16000, prodAn: Math.round(6 * prod) },
    kit9kwc: { min: 16000, max: 22000, prodAn: Math.round(9 * prod) },
    kit12kwc: { min: 20000, max: 30000, prodAn: Math.round(12 * prod) },
    batterie5kwh: { min: 4000, max: 6000 },
    batterie10kwh: { min: 6500, max: 8000 },
    microOnduleurs: { min: 800, max: 2000 },
    carportSolaire: { min: 8000, max: 15000 },
    entretienAnnuel: { min: 100, max: 200 }
  };
}

// Deterministic hashing helper to select variant consistently per commune slug
function getStringHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function selectVariant(slug: string, key: string, variants: string[]): string {
  const hash = getStringHash(slug + "-" + key);
  return variants[hash % variants.length];
}

export function generateCommuneContent(commune: Commune, pageType: 'panneau' | 'installateur') {
  const prod = commune.marketData?.productionMoyenneKwc || 1400;
  const rge = commune.marketData?.installateursRGE || 3;
  const delays = commune.marketData?.delaiMoyenJours || 20;

  const slug = commune.slug;

  // 1. Geographic Classification (Coastal, Camargue/West, Inland/Mountain)
  const lat = commune.latitude || 43.5;
  const lon = commune.longitude || 5.2;
  const pop = commune.population || 5000;
  
  let geoZone: 'coastal' | 'camargue' | 'inland' = 'inland';
  if (lon < 4.9) {
    geoZone = 'camargue';
  } else if (lat < 43.37) {
    geoZone = 'coastal';
  }

  // 2. City Density Classification
  const density: 'city' | 'village' = pop > 30000 ? 'city' : 'village';

  // 3. Smart local neighbor communes (dynamic semantic internal linking)
  const nearby = getSmartNearbyCommunes(slug, communes as any[], 3, 0);
  const nearbyNames = nearby.map(n => n.nom).join(', ');

  // --- Dynamic text spinning pools ---

  // Title spinning
  let title = "";
  if (pageType === 'panneau') {
    title = selectVariant(slug, 'title_panneau', [
      `Installation de Panneaux Solaires à ${commune.nom} (${commune.codePostal}) — Devis RGE`,
      `Panneaux Photovoltaïques à ${commune.nom} (13) : Tarif & Rentabilité Solaire`,
      `Panneau Solaire à ${commune.nom} : Produisez votre Électricité Autoconsommation`
    ]);
  } else {
    title = selectVariant(slug, 'title_installateur', [
      `Installateur Solaire RGE à ${commune.nom} (${commune.codePostal}) — Étude Gratuite`,
      `Trouver un Installateur de Panneaux Solaires QualiPV à ${commune.nom}`,
      `Meilleurs Installateurs Solaires de ${commune.nom} (13) : Comparez 3 Tarifs`
    ]);
  }

  // Intro Paragraph spinning
  let introParagraph = "";
  if (pageType === 'panneau') {
    introParagraph = selectVariant(slug, 'intro_panneau', [
      `Vous souhaitez installer des panneaux solaires photovoltaïques à ${commune.nom} dans les Bouches-du-Rhône ? Les Bouches-du-Rhône bénéficient de 2 900 heures d'ensoleillement par an — le département idéal pour rentabiliser vos panneaux solaires en 6 à 8 ans. Bénéficiez d'une production moyenne de ${prod} kWh par kWc installé et divisez votre facture d'électricité par trois grâce à l'autoconsommation.`,
      `Envisager la pose de panneaux solaires à ${commune.nom} vous permet de tirer profit de l'ensoleillement exceptionnel du 13. Spécialisés dans le solaire résidentiel et les toitures provençales, nos installateurs partenaires RGE QualiPV estiment votre production annuelle moyenne à ${prod} kWh/kWc. Prévoyez un amortissement rapide grâce à la revente de votre surplus à EDF OA.`,
      `Le prix de l'électricité a augmenté de 15% récemment — à ${commune.nom}, l'installation de panneaux solaires photovoltaïques offre une indépendance énergétique sur plus de 30 ans. Avec une productivité estimée à ${prod} kWh/kWc/an sur votre commune, les subventions de l'État (prime à l'autoconsommation et TVA à 10%) soutiennent le financement de votre transition énergétique.`
    ]);
  } else {
    introParagraph = selectVariant(slug, 'intro_installateur', [
      `Trouver un installateur de panneaux solaires certifié RGE QualiPV à ${commune.nom} est indispensable pour obtenir les aides de l'État et le raccordement au réseau de revente EDF OA. Nos artisans locaux RGE installent vos modules photovoltaïques en surimposition sécurisée contre le Mistral et réalisent l'ensemble de vos démarches d'urbanisme.`,
      `Besoin d'un professionnel qualifié pour poser vos panneaux solaires à ${commune.nom} ? Comparez les offres de ${rge} installateurs photovoltaïques agréés RGE QualiPV actifs sur votre secteur. Obtenez une étude de rentabilité gratuite et profitez des tarifs de raccordement Enedis et de revente de surplus garantis en 2026.`,
      `À ${commune.nom}, faire appel à un installateur solaire QualiPV certifié vous garantit une pose respectueuse des normes électriques NF C 15-100 et des DTU de couverture. Profitez des conseils de nos ${rge} partenaires locaux pour configurer au mieux votre système (micro-onduleurs Enphase, batterie de stockage ou carport solaire).`
    ]);
  }

  // Climate Context spinning (based on actual coordinates)
  let climateContext = "";
  if (geoZone === 'coastal') {
    climateContext = selectVariant(slug, 'climate_coastal', [
      `Exposée directement aux vents côtiers à ${commune.nom}, votre installation photovoltaïque doit faire face aux rafales maritimes et à la corrosion saline des embruns. Les rails de fixation en aluminium anodisé et la visserie en inox de classe marine sont indispensables. De plus, nos poseurs renforcent les ancrages dans la charpente pour prévenir les arrachements en cas de tempête.`,
      `Le climat littoral de ${commune.nom} offre une excellente luminosité mais soumet les onduleurs et panneaux à l'air salin. Nous préconisons des modules photovoltaïques dotés d'une certification de résistance au brouillard salin et un système de fixation robuste en surimposition pour laisser circuler l'air marin sous les panneaux solaires.`
    ]);
  } else if (geoZone === 'camargue') {
    climateContext = selectVariant(slug, 'climate_camargue', [
      `La proximité des étangs camarguais crée à ${commune.nom} une humidité résiduelle et des vents réguliers. L'ensoleillement y est exceptionnel, mais l'accumulation de poussières de sel ou de sable peut réduire le rendement de vos panneaux photovoltaïques. Un nettoyage régulier à l'eau claire (sans calcaire ni chlore) après le passage des vents du sud assure une production maximale.`,
      `Sur le secteur humide de ${commune.nom}, l'étanchéité des passages de câbles et la protection IP67 des micro-onduleurs sont cruciales. Nos installateurs certifiés RGE QualiPV veillent au positionnement sécurisé des équipements sous toiture pour garantir une longévité de 25 ans à votre système.`
    ]);
  } else {
    climateContext = selectVariant(slug, 'climate_inland', [
      `Balayée par le Mistral qui s'engouffre dans la vallée du Rhône vers ${commune.nom}, votre toiture photovoltaïque subit de fortes contraintes mécaniques de pression et de dépression. Une pose en surimposition conforme au DTU, avec des crochets de chevrons robustes fixés directement sur la charpente bois, est requise pour assurer la parfaite stabilité aérodynamique des panneaux solaires.`,
      `Les températures élevées de l'arrière-pays provençal à ${commune.nom} peuvent surchauffer les cellules en été, ce qui réduit temporairement leur rendement. Pour y faire face, nos techniciens locaux favorisent une pose en surimposition surélevée de 10 cm au-dessus des tuiles canal, permettant une ventilation naturelle optimale et le maintien de la productivité.`
    ]);
  }

  // ABF / Urban regulations spinning
  const abfRegulations = selectVariant(slug, 'abf_regulations', [
    `Dans les secteurs protégés de ${commune.nom} ou à proximité de monuments classés, les Architectes des Bâtiments de France (ABF) imposent des critères rigoureux. Les panneaux solaires doivent généralement être d'aspect uniforme extra-noir (full black), alignés parallèlement à la toiture et exclus des versants directement visibles depuis l'espace public historique.`,
    `Toute pose de panneaux solaires à ${commune.nom} exige au préalable le dépôt d'une Déclaration Préalable (DP) en mairie pour valider la conformité avec le Plan Local d'Urbanisme (PLU). En zone classée, l'obtention de l'avis de l'Architecte des Bâtiments de France est une étape obligatoire que nos installateurs partenaires prennent en charge.`,
    `La réglementation à ${commune.nom} interdit l'intégration au bâti (IAB) déstructurant les toitures provençales anciennes dans certaines zones. Nous privilégions la surimposition avec des kits full black, de couleur sombre neutre, pour allier intégration visuelle élégante et préservation du patrimoine provençal.`
  ]);

  // Housing Typology spinning (based on population / city density)
  let housingTypologyInsight = "";
  if (density === 'city') {
    housingTypologyInsight = selectVariant(slug, 'typology_city', [
      `À ${commune.nom}, le tissu urbain dense et les copropriétés exigent des solutions solaires spécifiques. Les appartements en dernier étage avec toits-terrasses peuvent opter pour des installations collectives ou des kits solaires d'autoconsommation individuelle. Les autorisations de copropriété sont nécessaires avant toute pose en toiture commune.`,
      `Les résidences et habitations mitoyennes de ${commune.nom} présentent parfois des ombrages portés (arbres, cheminées, immeubles voisins). L'utilisation de micro-onduleurs indépendants (type Enphase IQ8) ou d'optimiseurs de puissance est indispensable pour éviter qu'une ombre sur un seul panneau ne fasse chuter la production de toute l'installation.`
    ]);
  } else {
    housingTypologyInsight = selectVariant(slug, 'typology_village', [
      `L'habitat individuel à ${commune.nom}, composé de villas provençales et de bastides avec de grandes toitures en tuiles canal orientées sud/sud-ouest, est optimal pour le solaire. Ces surfaces permettent de poser des installations de 6 à 9 kWc capables de couvrir la totalité de la consommation d'une pompe à chaleur, d'une piscine et d'une climatisation en été.`,
      `Les toitures des villas à ${commune.nom} sont idéales pour l'installation photovoltaïque surimposée. La structure de charpente traditionnelle en pannes et chevrons permet un ancrage solide des supports de rails, garantissant une longévité structurelle face au vent et éliminant tout risque d'infiltration d'eau pluviale.`
    ]);
  }

  // Energy Profile spinning
  const energyProfileText = selectVariant(slug, 'energy_profile', [
    `Avec l'augmentation constante des prix de l'électricité (+15% par an en moyenne), la production solaire en autoconsommation à ${commune.nom} amortit les factures d'énergie élevées des maisons climatisées. L'électricité produite en journée est consommée en direct par les appareils énergivores (filtration piscine, climatisation, pompe à chaleur).`,
    `Le profil énergétique des villas à ${commune.nom} montre une consommation élevée en été en raison de l'utilisation de climatiseurs. Le solaire photovoltaïque coïncide idéalement avec cette demande : la production d'électricité est à son maximum au moment précis où le besoin de rafraîchissement est le plus fort.`,
    `À ${commune.nom}, installer des panneaux solaires permet d'améliorer le DPE (Diagnostic de Performance Énergétique) de votre maison. Associé à une pompe à chaleur ou à un ballon thermodynamique, le photovoltaïque est un atout majeur de valorisation verte de votre patrimoine immobilier.`
  ]);

  // Master Roofer tip spinning
  const vitrageRecommendation = selectVariant(slug, 'master_roofer_tip', [
    `Note de l'installateur : À ${commune.nom}, optez pour des micro-onduleurs plutôt qu'un onduleur central classique. En cas d'ombrage partiel dû à la végétation ou à une cheminée provençale, chaque panneau fonctionne de manière indépendante, préservant 100% de la production des autres modules solaires.`,
    `Conseil solaire : Pour une installation pérenne sur ${commune.nom}, privilégiez les modules monocristallins bifaciaux. Ils captent le rayonnement direct du soleil ainsi que la lumière réfléchie sur les tuiles ocre claires de Provence, générant un gain de production allant jusqu'à 15% par rapport aux panneaux standards.`,
    `Information technique : Toutes les installations photovoltaïques de moins de 3 kWc à ${commune.nom} bénéficient d'un taux de TVA réduit à 10% sur le matériel et la main-d'œuvre, et de la possibilité de revente du surplus d'électricité entièrement exonérée d'impôt sur le revenu.`
  ]);

  // Table Intro spinning
  const tableIntro = selectVariant(slug, 'table_intro', [
    `Voici la grille des tarifs indicatifs moyens constatés pour l'installation de panneaux solaires photovoltaïques à ${commune.nom} en 2026. Ces prix incluent le matériel haut de gamme, la pose par un artisan certifié RGE QualiPV et le raccordement Enedis.`,
    `Grille tarifaire 2026 : Budget estimatif pour votre projet de panneaux solaires à ${commune.nom}. Les prix varient selon l'accessibilité de la toiture, la puissance de l'installation (3 kWc, 6 kWc, 9 kWc) et le choix des micro-onduleurs.`,
    `Consultez les prix moyens pratiqués par nos installateurs solaires partenaires QualiPV dans la région de ${commune.nom}. Obtenez des chiffrages précis en effectuant une demande de devis comparatif gratuit.`
  ]);

  // Expert tip spinning
  const expertTip = selectVariant(slug, 'expert_tip', [
    `Pour optimiser la production de votre centrale solaire à ${commune.nom}, nettoyez les panneaux une à deux fois par an à l'eau claire pour retirer les poussières de chantiers et la pellicule ocre de sable du Sahara apportée par le vent du sud.`,
    `Vérifiez l'application mobile de monitoring de votre système de micro-onduleurs (ex: application Enphase Envoy) à ${commune.nom} pour détecter toute baisse suspecte de productivité panneau par panneau.`,
    `L'inclinaison optimale des panneaux solaires dans le 13 est de 30 à 35 degrés, orientée plein Sud. Une orientation Sud-Ouest reste très intéressante pour couvrir les consommations de climatisation en fin d'après-midi à ${commune.nom}.`
  ]);

  // Savings estimate spinning
  const savingsEstimate = selectVariant(slug, 'savings_estimate', [
    `Une installation solaire de 3 kWc bien exposée à ${commune.nom} réduit votre facture annuelle d'électricité de 600€ à 900€ et génère environ 300€ de gain via la revente du surplus.`,
    `L'autoconsommation solaire directe permet de réduire jusqu'à 70% de la facture d'électricité des villas équipées d'une piscine et d'une climatisation sur la commune de ${commune.nom}.`,
    `Avec un temps de retour sur investissement de 6 ans, l'énergie solaire à ${commune.nom} représente un placement financier sûr et rentable à plus de 12% par an.`
  ]);

  // Local profile text spinning
  const localProfileParagraph = selectVariant(slug, 'local_profile', [
    `Située au cœur du département des Bouches-du-Rhône au sein de la collectivité ${commune.intercommunalite || 'de votre secteur'}, la commune de ${commune.nom} dispose d'un potentiel solaire parmi les plus élevés d'Europe, propice à l'indépendance énergétique.`,
    `Riche de son ensoleillement méditerranéen et intégrée à ${commune.intercommunalite || 'la métropole locale'}, la commune de ${commune.nom} accélère sa transition écologique en incitant les propriétaires de maisons individuelles à s'équiper en photovoltaïque.`,
    `L'ensoleillement exceptionnel de la Crau et de la Provence fait de ${commune.nom} un territoire privilégié pour le développement de la micro-production d'électricité verte par les particuliers.`
  ]);

  // Diagnostic Énergétique spinning
  const diagnosticEnergetique = selectVariant(slug, 'diagnostic', [
    `Une étude de faisabilité solaire complète à ${commune.nom} comprend l'analyse des masques d'ombrage, la vérification de la capacité portante de la charpente bois et le dimensionnement précis du nombre de panneaux requis selon vos factures passées.`,
    `Nos installateurs partenaires RGE réalisent une étude technique de votre coffret électrique et du câblage à ${commune.nom} afin de s'assurer de la compatibilité avec l'onduleur ou les passerelles de communication solaires.`,
    `Un diagnostic de rentabilité photovoltaïque permet de mesurer avec exactitude le taux d'autoconsommation théorique de votre foyer à ${commune.nom} et d'ajuster la pertinence de l'ajout d'une batterie physique.`
  ]);

  // Dynamic Pose steps spinning (different formulations for step details)
  const step1Desc = selectVariant(slug, 'step1', [
    `Étude technique sur site à ${commune.nom}, modélisation de la toiture, calcul de l'exposition optimale et dépôt de la Déclaration Préalable de travaux (DP) en mairie du 13.`,
    `Visite technique par un installateur RGE, élaboration du schéma d'implantation sur ${commune.nom} et montage du dossier administratif de déclaration d'urbanisme.`
  ]);
  const step2Desc = selectVariant(slug, 'step2', [
    `Mise en sécurité du toit provençal, décalage temporaire des tuiles canal pour fixer les crochets en inox sur les chevrons de la charpente, et pose des rails en aluminium.`,
    `Sécurisation du chantier à ${commune.nom}, fixation mécanique des crochets de fixation traversant la toiture en tuiles, et alignement au cordeau des rails porteurs.`
  ]);
  const step3Desc = selectVariant(slug, 'step3', [
    `Pose des micro-onduleurs (type Enphase IQ8) sous les rails, liaison à la terre de l'ensemble de la structure et raccordement du câblage DC étanche sous gaine protectrice.`,
    `Installation des micro-onduleurs individuels, câblage électrique sécurisé en sous-face des rails et mise en conformité de la liaison équipotentielle (terre).`
  ]);
  const step4Desc = selectVariant(slug, 'step4', [
    `Fixation par brides de serrage des panneaux solaires photovoltaïques monocristallins full black et test électrique de continuité de la production en journée.`,
    `Montage et verrouillage des panneaux solaires sur les rails en aluminium, connexion des fiches rapides MC4 et vérification de la tension de chaque module.`
  ]);
  const step5Desc = selectVariant(slug, 'step5', [
    `Raccordement au tableau de répartition général, pose du coffret de protection AC avec disjoncteur différentiel, mise en service et demande de Consuel dans le 13.`,
    `Raccordement final au tableau électrique, liaison avec la passerelle internet de monitoring de production, obtention du Consuel et signature du contrat de revente EDF OA.`
  ]);

  const poseSteps = [
    { title: selectVariant(slug, 'step1_title', ["Étude & Déclaration Prioritaire", "Étude Technique & Mairie"]), description: step1Desc },
    { title: selectVariant(slug, 'step2_title', ["Fixation des Crochets & Rails", "Montage de la Structure Alu"]), description: step2Desc },
    { title: selectVariant(slug, 'step3_title', ["Pose des Micro-Onduleurs & Terre", "Câblage Électrique Sécurisé"]), description: step3Desc },
    { title: selectVariant(slug, 'step4_title', ["Montage des Panneaux Solaires", "Pose des Panneaux Photovoltaïques"]), description: step4Desc },
    { title: selectVariant(slug, 'step5_title', ["Coffret AC, Consuel & Enedis", "Raccordement & Contrat EDF OA"]), description: step5Desc }
  ];

  // Dynamic internal links
  const guideLinks = [
    { href: "/guides/prix-panneaux-solaires-bouches-du-rhone-2026/", label: selectVariant(slug, 'g1', ["Tarifs Panneaux Solaires 2026", "Budget Solaire BDR 2026"]), desc: selectVariant(slug, 'g1_d', ["Quel budget prévoir pour une installation photovoltaïque ?", "Le prix moyen au kWc posé par un RGE."]) },
    { href: "/guides/rentabilite-panneaux-solaires-marseille-roi-economies/", label: selectVariant(slug, 'g2', ["Rentabilité Solaire Marseille", "Calcul de ROI Solaire BDR"]), desc: selectVariant(slug, 'g2_d', ["Combien rapporte une installation solaire dans le 13 ?", "Temps de retour sur investissement et économies."]) },
    { href: "/guides/panneaux-solaires-tuiles-provencales-integration-surimposition/", label: selectVariant(slug, 'g3', ["Panneaux sur Tuiles Provençales", "Solaire et Tuiles Canal"]), desc: selectVariant(slug, 'g3_d', ["Comment installer des rails sur une toiture provençale.", "Intégration au bâti vs surimposition et étanchéité."]) }
  ];

  // --- Dynamic FAQ Pool & Spinning ---
  const allFAQs = [
    {
      q: `Peut-on installer des panneaux solaires sur des tuiles provençales à ${commune.nom} ?`,
      a: selectVariant(slug, 'faq1', [
        `Oui, c'est la configuration standard pour les habitations individuelles à ${commune.nom}. Les installateurs solaires certifiés utilisent la méthode de pose en surimposition : les crochets en acier inoxydable sont fixés directement sous les tuiles canal sur les chevrons de la charpente, et les rails en aluminium viennent s'y clipser. Les panneaux solaires y sont fermement verrouillés. Cette technique ne nécessite aucune dépose de toiture, préserve l'étanchéité d'origine et résiste parfaitement aux vents violents (Mistral).`,
        `Absolument, la méthode par surimposition est idéale sur les tuiles canal de Provence à ${commune.nom}. Elle n'affecte pas l'étanchéité car les tuiles ne sont pas découpées ni percées, mais simplement surélevées au niveau des points d'ancrage de la charpente. Le flux d'air naturel circulant sous les panneaux solaires permet également de refroidir le système en été, préservant la productivité.`
      ])
    },
    {
      q: `Quel est le temps de retour sur investissement d'un kit solaire à ${commune.nom} ?`,
      a: selectVariant(slug, 'faq2', [
        `Grâce à l'ensoleillement exceptionnel de 2 900 heures par an dont bénéficie le département du 13, une installation solaire à ${commune.nom} s'amortit en seulement 6 à 8 ans. Ce retour sur investissement rapide est favorisé par la prime à l'autoconsommation versée par l'État et la revente du surplus d'électricité produit à EDF OA au tarif réglementé de 13 centimes d'euro par kWh.`,
        `Le ROI d'une installation solaire photovoltaïque sur ${commune.nom} oscille entre 6 et 9 ans selon votre profil de consommation en journée. Si vous possédez des équipements gourmands en électricité fonctionnant le jour (climatisation, pompe à chaleur, filtration de piscine), vous autoconsommez la majorité de votre production, ce qui accélère la rentabilisation.`
      ])
    },
    {
      q: `Quels sont les critères pour qu'un projet solaire soit validé par les ABF à ${commune.nom} ?`,
      a: selectVariant(slug, 'faq3', [
        `Si votre maison à ${commune.nom} se trouve dans le périmètre d'un monument historique ou en zone protégée, l'avis des Architectes des Bâtiments de France (ABF) est obligatoire. L'installation doit respecter l'aspect esthétique provençal : ils imposent généralement des modules de type full black (cadres et cellules uniformément noirs), installés parallèlement à la toiture et de façon compacte pour conserver la géométrie traditionnelle du toit.`,
        `Les ABF de la région de ${commune.nom} exigent une intégration visuelle discrète. Les panneaux solaires doivent être de couleur sombre uniforme, sans reflets bleus ou cadres en aluminium brillant. La pose au sol ou sur abri de jardin (carport) est parfois une excellente alternative acceptée en cas de refus sur le toit principal.`
      ])
    },
    {
      q: `Faut-il installer une batterie de stockage physique avec ses panneaux à ${commune.nom} ?`,
      a: selectVariant(slug, 'faq4', [
        `À ${commune.nom}, installer une batterie physique (lithium LFP de 5 à 10 kWh) permet de stocker le surplus d'électricité produit durant la journée pour le restituer la nuit. Toutefois, la batterie augmente significativement le coût initial du projet. La revente du surplus d'électricité en direct sur le réseau à EDF OA à 13 cts/kWh reste souvent plus rentable financièrement, bien que la batterie offre une autonomie supérieure face aux coupures de réseau.`,
        `Une batterie de stockage est recommandée à ${commune.nom} si vous visez l'autonomie énergétique ou consommez beaucoup d'électricité en soirée. Cependant, avec la revente du surplus à tarif garanti, de nombreux foyers préfèrent utiliser le réseau Enedis comme une « batterie virtuelle » pour revendre leur électricité excédentaire en journée et l'acheter la nuit.`
      ])
    },
    {
      q: `Comment se passe le raccordement au réseau Enedis à ${commune.nom} ?`,
      a: selectVariant(slug, 'faq5', [
        `Une fois l'installation de vos panneaux solaires finalisée et le certificat de conformité Consuel obtenu, votre installateur RGE effectue la demande de raccordement auprès d'Enedis 13. Un compteur Linky communicant (déjà installé dans la majorité des foyers de ${commune.nom}) enregistre automatiquement votre production injectée sur le réseau et votre consommation, activant ainsi votre contrat d'autoconsommation ou de revente.`,
        `Le raccordement à ${commune.nom} est entièrement géré par l'installateur RGE QualiPV auprès d'Enedis. Si votre logement dispose d'un compteur Linky, aucun remplacement d'appareil de mesure n'est requis. Le compteur intelligent calcule à la fois le flux de soutirage (achat d'électricité) et d'injection (vente de surplus).`
      ])
    },
    {
      q: `Quelle est la durée de vie des panneaux solaires photovoltaïques posés à ${commune.nom} ?`,
      a: selectVariant(slug, 'faq6', [
        `Les panneaux solaires de dernière génération installés par nos partenaires à ${commune.nom} ont une durée de vie moyenne de 30 à 40 ans. La majorité des fabricants offrent une garantie de puissance linéaire supérieure à 85% après 25 ans de service. Les micro-onduleurs (ex: Enphase) disposent d'une garantie de 25 ans, tandis que les onduleurs centraux doivent généralement être remplacés après 10 à 12 ans.`,
        `Les modules photovoltaïques monocristallins posés sur les toits de ${commune.nom} résistent extrêmement bien au vieillissement. Sans pièces mobiles, ils ne subissent pas d'usure mécanique. Les garanties constructeur couvrent généralement la perte d'efficacité sur plus de 25 ans de fonctionnement ininterrompu.`
      ])
    },
    {
      q: `Est-il nécessaire de nettoyer les panneaux solaires à ${commune.nom} ?`,
      a: selectVariant(slug, 'faq7', [
        `Oui, bien que les pluies nettoient naturellement les surfaces, le climat provençal à ${commune.nom} est marqué par le Mistral qui apporte de la poussière fine et par le vent du sud qui dépose du sable ocre. Un nettoyage annuel à l'eau tempérée non calcaire à l'aide d'une perche télescopique douce permet de maintenir le rendement de vos panneaux photovoltaïques au maximum de son potentiel.`,
        `Un entretien minimal est conseillé à ${commune.nom}. La poussière ou le pollen accumulé sur le verre trempé peut réduire la production d'environ 3% à 5% par an. Il suffit de rincer les modules à l'eau claire le matin ou en fin de journée (quand les verres sont froids) pour éviter les chocs thermiques.`
      ])
    },
    {
      q: `Comment choisir un installateur de panneaux solaires de confiance à ${commune.nom} ?`,
      a: selectVariant(slug, 'faq8', [
        `Pour votre projet solaire à ${commune.nom}, sélectionnez impérativement une entreprise disposant de la certification RGE QualiPV active pour l'année en cours (2026). Demandez ses attestations d'assurances décennale et de responsabilité civile couvrant l'activité photovoltaïque dans le 13. Enfin, comparez 3 devis détaillés mentionnant les marques de panneaux solaires (ex: DualSun, SunPower) et d'onduleurs.`,
        `Privilégiez les installateurs locaux basés dans les Bouches-du-Rhône pour faciliter le service après-vente à ${commune.nom}. Fuyez les démarcheurs par téléphone promettant des installations solaires « gratuites » financées par l'État : le gouvernement ne propose aucun financement à 100%, il s'agit d'une arnaque.`
      ])
    }
  ];

  // Deterministically select 4 FAQs based on the pageType and the commune slug
  const faqIndices: number[] = [];
  const seed = getStringHash(slug + "-" + pageType);
  
  if (pageType === 'panneau') {
    faqIndices.push(0, 1, 3, 7);
  } else {
    faqIndices.push(7, 2, 4, 5);
  }

  const selectedFAQs = faqIndices.map(idx => allFAQs[idx]);
  const finalFAQs = [
    selectedFAQs[seed % 4],
    selectedFAQs[(seed + 1) % 4],
    selectedFAQs[(seed + 2) % 4],
    selectedFAQs[(seed + 3) % 4]
  ].filter((v, i, a) => a.indexOf(v) === i); // Deduplicate just in case

  while (finalFAQs.length < 4) {
    const missing = allFAQs.find(f => !finalFAQs.includes(f));
    if (missing) finalFAQs.push(missing);
    else break;
  }

  const faqItems = finalFAQs.map(f => ({
    question: f.q,
    answer: f.a
  }));

  // Secteur info text
  const marketDataText = selectVariant(slug, 'market_data', [
    `Secteur ${commune.nom} (${commune.codePostal}) : ${rge} installateurs certifiés RGE QualiPV disponibles sous ${delays} jours pour votre étude de faisabilité photovoltaïque.`,
    `Marché local ${commune.nom} : nous comptons actuellement ${rge} artisans de confiance certifiés disposant de créneaux d'installation et de raccordement sous ${delays} jours.`,
    `Zone ${commune.nom} : planifiez une visite avec l'un de nos ${rge} installateurs solaires qualifiés RGE. Délai moyen de raccordement Enedis constaté de ${delays} jours.`
  ]);

  // Real estate insight
  const realEstateInsight = selectVariant(slug, 'real_estate', [
    `Faire poser des panneaux solaires photovoltaïques à ${commune.nom} valorise de manière significative votre patrimoine immobilier. Une maison autonome avec un excellent Diagnostic de Performance Énergétique (DPE) est un argument de vente majeur qui justifie une plus-value sur le marché immobilier des Bouches-du-Rhône.`,
    `Dans le cadre d'une revente à ${commune.nom}, disposer d'une centrale solaire et d'un contrat de revente EDF OA actif rassure les acquéreurs en leur garantissant des factures d'énergie minimales sur les 20 prochaines années.`,
    `L'autonomie énergétique apportée par le solaire photovoltaïque à ${commune.nom} protège durablement les propriétaires contre l'inflation à venir du coût de l'électricité du réseau.`
  ]);

  // General local agencies helper
  const localAgencyName = selectVariant(slug, 'agency_name', [
    `l'Espace Conseil France Rénov' des Bouches-du-Rhône`,
    `l'ADIL du 13 (Agence Départementale d'Information sur le Logement)`,
    `le guichet unique de la rénovation de la Métropole Aix-Marseille`
  ]);

  const localAgencyDetail = selectVariant(slug, 'agency_detail', [
    `le service public chargé d'accompagner gratuitement les propriétaires dans leur transition écologique et de valider les dossiers d'obtention de la prime à l'autoconsommation`,
    `l'agence publique départementale qui conseille gratuitement sur les dispositifs d'éco-prêt à taux zéro (éco-PTZ) et la fiscalité de vos panneaux solaires photovoltaïques`,
    `le service métropolitain de conseil en énergie renouvelable qui vous guide dans la demande des aides locales applicables sur le département 13`
  ]);

  // Calendar
  const calendrierRenovation = selectVariant(slug, 'calendar', [
    `L'installation physique des panneaux photovoltaïques à ${commune.nom} prend généralement 1 à 2 jours de travail par une équipe de techniciens QualiPV.`,
    `La pose des modules et le câblage de l'onduleur sur ${commune.nom} s'effectuent sur deux journées consécutives, hors intempéries ou grand Mistral empêchant le travail en hauteur.`,
    `Prévoyez 24 à 48 heures de chantier actif pour le montage complet de votre kit solaire résidentiel par nos poseurs agréés.`
  ]);

  // Local agencies
  const conseilAides = selectVariant(slug, 'aides', [
    `L'installation de panneaux solaires en autoconsommation avec revente ouvre droit à la prime à l'autoconsommation de l'État versée en une fois en 2026.`,
    `Les centrales solaires d'une puissance inférieure ou égale à 3 kWc bénéficient d'une TVA réduite à 10% sur le matériel et la pose par un installateur RGE.`,
    `Le surplus d'électricité injecté sur le réseau de ${commune.nom} est vendu obligatoirement à EDF OA au tarif réglementé garanti pendant 20 ans.`
  ]);

  return {
    title,
    introParagraph,
    tableIntro,
    marketDataText,
    realEstateInsight,
    abfRegulations,
    climateContext,
    poseSteps,
    diagnosticEnergetique,
    vitrageRecommendation,
    calendrierRenovation,
    faqItems,
    sourcesCitation: "Données de production estimées pour l'année 2026 issues des rapports de PVGIS, de l'ANAH et du comité national Qualit'Enr.",
    conseilAides,
    localAgencyName,
    localAgencyDetail,
    guideLinks,
    expertTip,
    savingsEstimate,
    localProfileParagraph,
    housingTypologyInsight,
    energyProfileText,
    smartNearbyCommunesText: `Nous intervenons également activement pour des études solaires sur les communes voisines de ${commune.nom} : ${nearbyNames}.`
  };
}
