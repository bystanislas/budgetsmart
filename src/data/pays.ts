/**
 * Pays et indicatifs téléphoniques.
 *
 * Toute l'Afrique, plus les pays où vit la diaspora et les partenaires
 * habituels d'APEX AFRICA. Côte d'Ivoire en tête — c'est le choix par défaut
 * le plus probable — puis le reste de l'UEMOA et de la CEMAC, puis l'Afrique
 * par ordre alphabétique, puis le reste du monde.
 */
export const PAYS: [code: string, nom: string, indicatif: string][] = [
  // Côte d'Ivoire d'abord : siège d'APEX AFRICA.
  ['CI', 'Côte d’Ivoire', '+225'],

  // UEMOA (zone franc CFA — XOF).
  ['BJ', 'Bénin', '+229'],
  ['BF', 'Burkina Faso', '+226'],
  ['GW', 'Guinée-Bissau', '+245'],
  ['ML', 'Mali', '+223'],
  ['NE', 'Niger', '+227'],
  ['SN', 'Sénégal', '+221'],
  ['TG', 'Togo', '+228'],

  // CEMAC (zone franc CFA — XAF).
  ['CM', 'Cameroun', '+237'],
  ['CF', 'République centrafricaine', '+236'],
  ['CG', 'République du Congo', '+242'],
  ['GA', 'Gabon', '+241'],
  ['GQ', 'Guinée équatoriale', '+240'],
  ['TD', 'Tchad', '+235'],

  // Reste de l'Afrique, par ordre alphabétique.
  ['DZ', 'Algérie', '+213'],
  ['AO', 'Angola', '+244'],
  ['BW', 'Botswana', '+267'],
  ['BI', 'Burundi', '+257'],
  ['CV', 'Cap-Vert', '+238'],
  ['KM', 'Comores', '+269'],
  ['CD', 'République démocratique du Congo', '+243'],
  ['DJ', 'Djibouti', '+253'],
  ['EG', 'Égypte', '+20'],
  ['ER', 'Érythrée', '+291'],
  ['SZ', 'Eswatini', '+268'],
  ['ET', 'Éthiopie', '+251'],
  ['GM', 'Gambie', '+220'],
  ['GH', 'Ghana', '+233'],
  ['GN', 'Guinée', '+224'],
  ['KE', 'Kenya', '+254'],
  ['LS', 'Lesotho', '+266'],
  ['LR', 'Libéria', '+231'],
  ['LY', 'Libye', '+218'],
  ['MG', 'Madagascar', '+261'],
  ['MW', 'Malawi', '+265'],
  ['MA', 'Maroc', '+212'],
  ['MR', 'Mauritanie', '+222'],
  ['MU', 'Maurice', '+230'],
  ['MZ', 'Mozambique', '+258'],
  ['NA', 'Namibie', '+264'],
  ['NG', 'Nigeria', '+234'],
  ['UG', 'Ouganda', '+256'],
  ['RW', 'Rwanda', '+250'],
  ['ST', 'Sao Tomé-et-Principe', '+239'],
  ['SC', 'Seychelles', '+248'],
  ['SL', 'Sierra Leone', '+232'],
  ['SO', 'Somalie', '+252'],
  ['SD', 'Soudan', '+249'],
  ['SS', 'Soudan du Sud', '+211'],
  ['ZA', 'Afrique du Sud', '+27'],
  ['TZ', 'Tanzanie', '+255'],
  ['TN', 'Tunisie', '+216'],
  ['ZM', 'Zambie', '+260'],
  ['ZW', 'Zimbabwe', '+263'],

  // Diaspora et partenaires habituels.
  ['FR', 'France', '+33'],
  ['BE', 'Belgique', '+32'],
  ['CH', 'Suisse', '+41'],
  ['DE', 'Allemagne', '+49'],
  ['GB', 'Royaume-Uni', '+44'],
  ['ES', 'Espagne', '+34'],
  ['IT', 'Italie', '+39'],
  ['PT', 'Portugal', '+351'],
  ['NL', 'Pays-Bas', '+31'],
  ['CA', 'Canada', '+1'],
  ['US', 'États-Unis', '+1'],
  ['BR', 'Brésil', '+55'],
  ['CN', 'Chine', '+86'],
  ['IN', 'Inde', '+91'],
  ['AE', 'Émirats arabes unis', '+971'],
  ['SA', 'Arabie saoudite', '+966'],
  ['QA', 'Qatar', '+974'],
  ['LB', 'Liban', '+961'],
  ['TR', 'Turquie', '+90'],
]

export const indicatifDe = (pays: string): string =>
  PAYS.find(([, nom]) => nom === pays)?.[2] ?? PAYS[0][2]

/**
 * Devine le pays depuis le fuseau horaire du navigateur — aucune permission,
 * aucun réseau. Une estimation, pas une certitude : reste modifiable dans la
 * liste. Les zones partagées (ex. Africa/Abidjan pour plusieurs pays ouest-
 * africains à l'heure identique) retiennent le pays le plus probable.
 */
const FUSEAU_VERS_PAYS: Record<string, string> = {
  'Africa/Abidjan': 'Côte d’Ivoire',
  'Africa/Accra': 'Ghana',
  'Africa/Bamako': 'Mali',
  'Africa/Banjul': 'Gambie',
  'Africa/Bissau': 'Guinée-Bissau',
  'Africa/Conakry': 'Guinée',
  'Africa/Dakar': 'Sénégal',
  'Africa/Freetown': 'Sierra Leone',
  'Africa/Lome': 'Togo',
  'Africa/Monrovia': 'Libéria',
  'Africa/Nouakchott': 'Mauritanie',
  'Africa/Ouagadougou': 'Burkina Faso',
  'Africa/Porto-Novo': 'Bénin',
  'Africa/Lagos': 'Nigeria',
  'Africa/Niamey': 'Niger',
  'Africa/Douala': 'Cameroun',
  'Africa/Bangui': 'République centrafricaine',
  'Africa/Ndjamena': 'Tchad',
  'Africa/Brazzaville': 'République du Congo',
  'Africa/Kinshasa': 'République démocratique du Congo',
  'Africa/Lubumbashi': 'République démocratique du Congo',
  'Africa/Libreville': 'Gabon',
  'Africa/Malabo': 'Guinée équatoriale',
  'Africa/Casablanca': 'Maroc',
  'Africa/El_Aaiun': 'Maroc',
  'Africa/Algiers': 'Algérie',
  'Africa/Tunis': 'Tunisie',
  'Africa/Tripoli': 'Libye',
  'Africa/Cairo': 'Égypte',
  'Africa/Khartoum': 'Soudan',
  'Africa/Juba': 'Soudan du Sud',
  'Africa/Addis_Ababa': 'Éthiopie',
  'Africa/Nairobi': 'Kenya',
  'Africa/Kampala': 'Ouganda',
  'Africa/Kigali': 'Rwanda',
  'Africa/Bujumbura': 'Burundi',
  'Africa/Dar_es_Salaam': 'Tanzanie',
  'Africa/Lusaka': 'Zambie',
  'Africa/Harare': 'Zimbabwe',
  'Africa/Blantyre': 'Malawi',
  'Africa/Maputo': 'Mozambique',
  'Africa/Windhoek': 'Namibie',
  'Africa/Gaborone': 'Botswana',
  'Africa/Maseru': 'Lesotho',
  'Africa/Mbabane': 'Eswatini',
  'Africa/Johannesburg': 'Afrique du Sud',
  'Africa/Luanda': 'Angola',
  'Africa/Djibouti': 'Djibouti',
  'Africa/Mogadishu': 'Somalie',
  'Africa/Asmara': 'Érythrée',
  'Africa/Sao_Tome': 'Sao Tomé-et-Principe',
  'Indian/Antananarivo': 'Madagascar',
  'Indian/Mauritius': 'Maurice',
  'Indian/Comoro': 'Comores',
  'Indian/Mahe': 'Seychelles',
  'Atlantic/Cape_Verde': 'Cap-Vert',
  'Europe/Paris': 'France',
  'Europe/Brussels': 'Belgique',
  'Europe/Zurich': 'Suisse',
  'Europe/Berlin': 'Allemagne',
  'Europe/London': 'Royaume-Uni',
  'Europe/Madrid': 'Espagne',
  'Europe/Rome': 'Italie',
  'Europe/Lisbon': 'Portugal',
  'Europe/Amsterdam': 'Pays-Bas',
  'Europe/Istanbul': 'Turquie',
  'America/Toronto': 'Canada',
  'America/Montreal': 'Canada',
  'America/Vancouver': 'Canada',
  'America/New_York': 'États-Unis',
  'America/Chicago': 'États-Unis',
  'America/Denver': 'États-Unis',
  'America/Los_Angeles': 'États-Unis',
  'America/Sao_Paulo': 'Brésil',
  'Asia/Shanghai': 'Chine',
  'Asia/Kolkata': 'Inde',
  'Asia/Dubai': 'Émirats arabes unis',
  'Asia/Riyadh': 'Arabie saoudite',
  'Asia/Qatar': 'Qatar',
  'Asia/Beirut': 'Liban',
}

export function devinerPays(): string | undefined {
  try {
    const fuseau = Intl.DateTimeFormat().resolvedOptions().timeZone
    return FUSEAU_VERS_PAYS[fuseau]
  } catch {
    return undefined
  }
}
