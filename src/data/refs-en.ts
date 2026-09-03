/**
 * English referential — the delivered lists, mirroring src/data/refs.ts.
 *
 * These are only a starting point: they are copied into the user's settings on
 * first launch, and can then be renamed, extended or trimmed from the settings
 * page. Sub-category keys must match the category names above them exactly.
 */
import type { ModuleId } from '../types'

export const CAT_DIME_EN = 'Tithe'
export const CAT_OFFRANDE_EN = 'Offering'
export const CAT_DON_EN = 'Donation'
export const CAT_EPARGNE_EN = 'Savings (deposit)'
export const CAT_PRET_EN = 'Loan given to someone'
export const CAT_EMPRUNT_EN = 'Loan received from someone'
export const CAT_REMB_RECU_EN = 'Repayment received from someone'
export const EGLISE_DEFAUT_EN = 'Impact Centre Chrétien (ICC) — Riviera 2'

const REVENUS = ['Salary', 'Bonus / 13th month', 'Freelance / Consulting',
  'Trade / Sales', 'Rent received', 'Dividends', 'Interest received',
  'Family support', 'Repayment received', 'Sale of assets', 'Other income']

const DEPENSES = ['Rent', 'Electricity', 'Water', 'Gas / Cylinder',
  'Internet / Broadband', 'Phone', 'Service charges', 'Upkeep & repairs',
  'Food / Groceries', 'Restaurants / Lunches', 'Public transport',
  'Fuel', 'Taxi / Ride-hailing', 'Vehicle servicing', 'Vehicle insurance',
  'Health / Pharmacy', 'Health insurance', 'Clothing', 'Hair & grooming',
  'School fees / Education', 'Childcare', 'Sport / Fitness', 'Leisure & outings',
  'Subscriptions (streaming, apps)', CAT_DIME_EN, CAT_OFFRANDE_EN, CAT_DON_EN,
  'Charity & solidarity', 'Gifts',
  'Travel / Holidays', 'Taxes & duties', 'Bank charges', 'Home insurance',
  'Extended family support', 'Administrative fees', 'Unexpected / Other']

export const CAT_MARIAGE_EN = ['Dowry & customary rites', 'Civil ceremony',
  'Religious ceremony', 'Bride’s outfit', 'Groom’s outfit', 'Bridal party outfits',
  'Beauty, hair & make-up', 'Rings & jewellery', 'Venue & furniture',
  'Decoration', 'Catering & meals', 'Drinks', 'Cake',
  'Photographer', 'Videographer / Drone', 'DJ & entertainment', 'Band / Choir',
  'Transport & car hire', 'Invitations & stationery', 'Guest favours',
  'Guest accommodation', 'Wedding planner', 'Security & stewards',
  'Sound & lighting', 'Tableware hire', 'Honeymoon',
  'Visa / travel costs', 'Tips & extras', 'Wedding contingency']

export const CAT_IMMOBILIER_EN = ['Personal deposit', 'Land purchase price',
  'Built property purchase price', 'Notary fees', 'Registration duties',
  'Agency commission', 'Surveying & boundaries', 'Title deed',
  'Building permit', 'Soil survey', 'Architect & studies',
  'Foundations & structure', 'Masonry', 'Roof & framing', 'Joinery',
  'Electrical works', 'Plumbing & sanitary', 'Tiling & flooring',
  'Painting & finishes', 'Fencing & gate', 'Landscaping',
  'Labour', 'Building materials', 'Utility connections', 'Rent received',
  'Rental charges', 'Property tax', 'Building insurance',
  'Management fees', 'Upkeep & repairs', 'Mortgage payment',
  'Other property costs']

export const CAT_BUSINESS_EN = ['Capital contribution', 'Revenue',
  'Services rendered', 'Product sales', 'Grant / Funding',
  'Goods for resale', 'Raw materials', 'Subcontracting',
  'Wages & payroll charges', 'Professional fees', 'Business rent',
  'Electricity & water (business)', 'Internet & phone (business)', 'Marketing & advertising',
  'Social media management', 'Website & hosting', 'Software & subscriptions',
  'Equipment & hardware', 'Transport & logistics', 'Fuel (business)',
  'Travel & assignment costs', 'Business bank charges', 'Business taxes',
  'Training', 'Legal & accounting advice', 'Business insurance', 'Other business costs']

export const CATEGORIES_EN: Record<ModuleId, string[]> = {
  general: [...REVENUS, ...DEPENSES, CAT_EPARGNE_EN,
    'Investment', 'Loan repayment',
    CAT_PRET_EN, CAT_EMPRUNT_EN, CAT_REMB_RECU_EN],
  mariage: CAT_MARIAGE_EN,
  immobilier: CAT_IMMOBILIER_EN,
  business: CAT_BUSINESS_EN,
}

export const CAT_REVENUS_EN = new Set([...REVENUS, 'Revenue',
  'Services rendered', 'Product sales', 'Rent received'])

export const MOYENS_EN = ['Cash', 'Mobile Money', 'Wave', 'Orange Money', 'MTN MoMo',
  'Moov Money', 'Bank transfer', 'Bank card', 'Cheque', 'Direct debit',
  'PayPal', 'Other']

export const ETABLISSEMENTS_EN = ['Wave', 'Orange Money', 'MTN MoMo', 'Moov Money',
  'Djamo', 'Ecobank', 'Société Générale', 'NSIA Bank', 'BACI', 'BICICI',
  'BNI', 'Bridge Bank', 'Coris Bank', 'UBA', 'Bank of Africa', 'Versus Bank',
  'Savings bank', 'Microfinance / Credit union', 'Tontine', 'Safe / at home', 'Other']

export const FAMILLES_MARIAGE_EN: [string, number[]][] = [
  ['Ceremonies & customs', [0, 1, 2, 7]],
  ['Outfits & beauty', [3, 4, 5, 6]],
  ['Reception', [8, 9, 10, 11, 12, 23, 24]],
  ['Suppliers', [13, 14, 15, 16, 21, 22]],
  ['Guests & logistics', [17, 18, 19, 20]],
  ['Travel & other', [25, 26, 27, 28]],
]

export const SOUS_CATEGORIES_EN: Record<string, string[]> = {
  /* --- getting around ---------------------------------------------------- */
  'Public transport': ['Gbaka (minibus)', 'Woro-woro (shared taxi)', 'City bus',
    'Ferry', 'Intercity coach', 'Motorbike taxi', 'Train', 'Other transport'],
  'Taxi / Ride-hailing': ['Yango', 'inDrive', 'Uber', 'Heetch', 'Metered taxi',
    'Local taxi', 'Motorbike taxi', 'Night fare', 'Other ride-hailing'],
  Fuel: ['Petrol', 'Diesel', 'Electric charging', 'Spare can'],
  'Vehicle servicing': ['Oil change', 'Tyres', 'Battery', 'Car wash', 'Garage / mechanic',
    'Spare parts', 'Roadworthiness test', 'Parking', 'Toll', 'Fine'],
  'Travel / Holidays': ['Flight', 'Hotel', 'Rental', 'Visa', 'Local transport',
    'Meals', 'Excursions', 'Travel insurance'],

  /* --- everyday life ------------------------------------------------------ */
  'Food / Groceries': ['Market (fresh produce)', 'Supermarket', 'Corner shop',
    'Butcher / Fishmonger', 'Bakery', 'Fruit & vegetables', 'Water & drinks',
    'Cleaning products', 'Toiletries & beauty', 'Delivery', 'Monthly stock-up'],
  'Restaurants / Lunches': ['Maquis (local eatery)', 'Restaurant', 'Fast food', 'Street food',
    'Canteen / office', 'Delivery', 'Café / pastry', 'Outing with friends'],
  'Gas / Cylinder': ['6 kg refill', '12 kg refill', 'New cylinder', 'Regulator / hose'],
  Clothing: ['Clothes', 'Shoes', 'Wax & fabrics', 'Tailoring / alterations',
    'Bags & accessories', 'Children’s clothes', 'Uniforms'],
  'Hair & grooming': ['Hairdresser', 'Barber', 'Manicure / pedicure', 'Salon / spa',
    'Hair products', 'Cosmetics'],
  'Health / Pharmacy': ['Consultation', 'Pharmacy', 'Tests / laboratory',
    'Imaging', 'Dentist', 'Optician', 'Hospital stay', 'Physiotherapy', 'Emergency'],

  /* --- home --------------------------------------------------------------- */
  Rent: ['Monthly rent', 'Advance / deposit', 'Arrears', 'Agency commission'],
  Electricity: ['Utility bill', 'Prepaid top-up', 'Generator', 'Connection'],
  Water: ['Utility bill', 'Jerrycans / tanker', 'Connection'],
  'Internet / Broadband': ['Fibre subscription', 'Dongle / 4G box', 'Installation', 'Repair'],
  Phone: ['Airtime', 'Plan', 'Data pass', 'Handset', 'Repair'],
  'Upkeep & repairs': ['Plumbing', 'Electrical', 'Painting', 'Carpentry',
    'Air conditioning', 'Appliances', 'Cleaning', 'Gardening', 'Pest control'],

  /* --- family & obligations ------------------------------------------------ */
  'School fees / Education': ['Tuition', 'Enrolment', 'Supplies', 'Uniform',
    'Extra tuition', 'Canteen', 'School transport', 'Training / certification',
    'Books', 'Exam / entrance fee'],
  Childcare: ['Nanny', 'Nursery', 'Occasional childcare'],
  'Extended family support': ['Parents', 'Siblings', 'Home village', 'Family ceremony',
    'A relative’s health', 'A relative’s schooling', 'Funeral'],
  [CAT_DIME_EN]: ['Monthly tithe', 'Tithe on a bonus', 'Tithe on exceptional income',
    'Catch-up tithe'],
  [CAT_OFFRANDE_EN]: ['Service offering', 'Thanksgiving', 'First fruits', 'Vow / pledge',
    'Church project', 'Mission / outreach', 'Special offering', 'Seed'],
  [CAT_DON_EN]: ['Association', 'Orphanage', 'Hospital / patient',
    'Person in need', 'School / bursary', 'Disaster / emergency', 'Contribution', 'Collection'],
  'Charity & solidarity': ['Association', 'Church / mosque', 'Collection', 'Person in need',
    'Disaster / emergency'],
  Gifts: ['Birthday', 'Wedding', 'Birth', 'End-of-year', 'Thank you'],

  /* --- money --------------------------------------------------------------- */
  [CAT_EPARGNE_EN]: ['Emergency fund', 'Property project', 'Wedding', 'Studies',
    'Travel', 'Retirement', 'Tontine', 'Locked savings', 'Vehicle purchase', 'Health'],
  Investment: ['Land', 'Rental property', 'Business', 'Shares',
    'Bonds', 'Farming / livestock', 'Cryptocurrency', 'Productive equipment'],
  'Loan repayment': ['Bank loan', 'Car loan', 'Mortgage',
    'Microcredit', 'Overdraft', 'Family debt', 'Supplier'],
  [CAT_PRET_EN]: ['Family', 'Friend', 'Colleague', 'Employee', 'Business partner', 'Tontine'],
  [CAT_EMPRUNT_EN]: ['Family', 'Friend', 'Colleague', 'Bank', 'Microfinance', 'Tontine',
    'Business partner'],
  [CAT_REMB_RECU_EN]: ['Family', 'Friend', 'Colleague', 'Employee', 'Business partner',
    'Tontine'],
  'Bank charges': ['Account fees', 'Withdrawal', 'Transfer', 'Bank card',
    'Overdraft interest', 'Mobile money fees', 'Currency exchange'],
  'Taxes & duties': ['Income tax', 'Property tax', 'Trading licence', 'VAT',
    'Vehicle tax', 'Local rates'],
  'Administrative fees': ['ID card', 'Passport', 'Driving licence',
    'Certification', 'Duty stamp', 'Notary', 'Lawyer', 'Translation'],

  /* --- leisure -------------------------------------------------------------- */
  'Leisure & outings': ['Cinema', 'Concert', 'Sport / match', 'Family outing',
    'Beach / pool', 'Games', 'Bar / night out'],
  'Subscriptions (streaming, apps)': ['Netflix', 'Canal+', 'Music streaming', 'YouTube Premium',
    'Cloud storage', 'Software', 'Gym', 'News'],
  'Sport / Fitness': ['Gym membership', 'Coach', 'Equipment', 'Race / entry fee'],

  /* --- income ---------------------------------------------------------------- */
  Salary: ['Monthly net salary', 'Overtime', 'Back pay',
    'Transport allowance', 'Housing allowance', 'Salary advance'],
  'Bonus / 13th month': ['13th month', 'Performance bonus', 'Year-end bonus',
    'Exceptional bonus', 'Profit share'],
  'Freelance / Consulting': ['One-off assignment', 'Retainer', 'Deposit',
    'Final invoice', 'Training delivered'],
  'Trade / Sales': ['In-store sales', 'Online sales', 'Wholesale',
    'Market / fair', 'Commission'],
  'Rent received': ['Residential rent', 'Commercial rent', 'Deposit received', 'Arrears received'],
  'Family support': ['Parents', 'Spouse', 'Siblings', 'Diaspora'],
}
