"""Référentiels du classeur APEX Budget : devises, catégories, listes de choix."""
from __future__ import annotations

APP_NAME = "BUDGET SMART"
APP_BRAND = "by APEX AFRICA"
APP_BASELINE = ("Planification et suivi financier — général, mariage, "
                "immobilier & terrain, business")
APP_COPYRIGHT = (
    "© 2026 APEX AFRICA. « Budget Smart » et son logo sont la propriété "
    "d'APEX AFRICA. Tous droits réservés — reproduction, diffusion ou revente "
    "interdites sans autorisation écrite.")
APP_SIGNATURE = "APEX AFRICA — African Premium Experience · Abidjan, Côte d'Ivoire"
APP_VERSION = "1.0"

MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
          "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"]
MONTHS_SHORT = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
                "Juil", "Août", "Sep", "Oct", "Nov", "Déc"]

# Devise : code, nom, symbole, cours indicatif (1 unité = X XOF), décimales
CURRENCIES = [
    ("XOF", "Franc CFA — UEMOA (BCEAO)", "FCFA", 1.0, 0),
    ("XAF", "Franc CFA — CEMAC (BEAC)", "FCFA", 1.0, 0),
    ("EUR", "Euro", "€", 655.957, 2),
    ("USD", "Dollar américain", "$", 600.0, 2),
    ("GBP", "Livre sterling", "£", 765.0, 2),
    ("CAD", "Dollar canadien", "C$", 440.0, 2),
    ("CHF", "Franc suisse", "CHF", 685.0, 2),
    ("MAD", "Dirham marocain", "DH", 60.0, 2),
    ("TND", "Dinar tunisien", "DT", 192.0, 3),
    ("DZD", "Dinar algérien", "DA", 4.45, 2),
    ("EGP", "Livre égyptienne", "E£", 12.5, 2),
    ("NGN", "Naira nigérian", "₦", 0.40, 2),
    ("GHS", "Cedi ghanéen", "₵", 50.0, 2),
    ("GNF", "Franc guinéen", "FG", 0.070, 0),
    ("CDF", "Franc congolais", "FC", 0.21, 0),
    ("MRU", "Ouguiya mauritanien", "UM", 15.0, 2),
    ("RWF", "Franc rwandais", "FRw", 0.46, 0),
    ("KES", "Shilling kényan", "KSh", 4.60, 2),
    ("UGX", "Shilling ougandais", "USh", 0.16, 0),
    ("TZS", "Shilling tanzanien", "TSh", 0.23, 0),
    ("ZAR", "Rand sud-africain", "R", 33.0, 2),
    ("AED", "Dirham des Émirats", "AED", 163.0, 2),
    ("SAR", "Riyal saoudien", "SR", 160.0, 2),
    ("CNY", "Yuan chinois", "¥", 83.0, 2),
    ("JPY", "Yen japonais", "¥", 4.0, 0),
    ("TRY", "Livre turque", "₺", 17.0, 2),
]

MODULES = ["Général", "Mariage", "Immobilier", "Business"]

TYPES = [
    "Revenu",
    "Dépense",
    "Épargne",
    "Investissement",
    "Remboursement crédit",
    "Transfert",
]

# Sens de chaque type d'opération — même ordre que TYPES
SENS_TYPES = ["▲ ENTRÉE", "▼ SORTIE", "▼ SORTIE", "▼ SORTIE", "▼ SORTIE", "↔ NEUTRE"]

NATURES = ["Fixe", "Variable", "Exceptionnelle"]

# Dîme : assiette de calcul possible
DIME_BASES = ["Salaire uniquement", "Salaire + primes", "Tous les revenus"]
CAT_DIME = "Dîme / Offrandes"

# Périmètre d'analyse du tableau de bord et de la synthèse annuelle
PERIMETRES = ["Général seul", "Tout confondu", "Mariage", "Immobilier", "Business"]

STATUTS = ["Payé", "Prévu", "En attente", "Annulé"]

MOYENS = ["Espèces", "Mobile Money", "Wave", "Orange Money", "MTN MoMo", "Moov Money",
          "Virement bancaire", "Carte bancaire", "Chèque", "Prélèvement",
          "PayPal", "Crypto", "Autre"]

FREQUENCES = ["Hebdomadaire", "Mensuelle", "Bimestrielle", "Trimestrielle",
              "Semestrielle", "Annuelle"]

OUI_NON = ["Oui", "Non"]

COMPTES_DEFAUT = [
    "Compte courant principal",
    "Compte courant secondaire",
    "Mobile Money 1",
    "Mobile Money 2",
    "Espèces / Caisse",
    "Compte épargne",
    "Compte projet",
    "Compte business",
]

# --------------------------------------------------------------------------
# Catégories par module
# --------------------------------------------------------------------------
CAT_GENERAL = [
    # Revenus
    "Salaire", "Prime / 13e mois", "Freelance / Consulting", "Commerce / Ventes",
    "Loyers perçus", "Dividendes", "Intérêts perçus", "Aide familiale",
    "Remboursement reçu", "Vente d'actifs", "Autre revenu",
    # Logement
    "Loyer", "Électricité", "Eau", "Gaz / Bouteille", "Internet / Box",
    "Téléphone", "Charges de copropriété", "Entretien & réparations logement",
    # Vie courante
    "Alimentation / Courses", "Restaurants / Déjeuners", "Transport en commun",
    "Carburant", "Taxi / VTC", "Entretien véhicule", "Assurance véhicule",
    "Santé / Pharmacie", "Assurance santé / Mutuelle", "Habillement",
    "Coiffure & soins", "Scolarité / Éducation", "Garde d'enfants",
    "Sport / Fitness", "Loisirs & sorties", "Abonnements (streaming, apps)",
    "Dîme / Offrandes", "Dons & solidarité", "Cadeaux", "Voyages / Vacances",
    # Obligations
    "Impôts & taxes", "Frais bancaires", "Assurance habitation",
    "Épargne (versement)", "Investissement", "Remboursement de crédit",
    "Aide à la famille élargie", "Frais administratifs", "Imprévus / Divers",
]

CAT_MARIAGE = [
    "Dot & coutume", "Mairie / État civil", "Cérémonie religieuse",
    "Tenue de la mariée", "Tenue du marié", "Tenues des cortèges",
    "Beauté, coiffure & maquillage", "Alliances & bijoux",
    "Salle & mobilier", "Décoration", "Traiteur & repas", "Boissons",
    "Gâteau / pièce montée", "Photographe", "Vidéaste / Drone",
    "DJ & animation", "Orchestre / Chorale", "Transport & location de voitures",
    "Faire-parts & papeterie", "Cadeaux invités", "Hébergement invités",
    "Wedding planner", "Sécurité & service d'ordre", "Sonorisation & éclairage",
    "Location de vaisselle", "Lune de miel", "Frais de visa / voyage",
    "Pourboires & extras", "Imprévus mariage",
]

CAT_IMMOBILIER = [
    "Apport personnel", "Prix d'achat terrain", "Prix d'achat bien bâti",
    "Frais de notaire", "Droits d'enregistrement", "Commission d'agence",
    "Bornage & topographie", "ACD / Titre foncier", "Permis de construire",
    "Étude de sol", "Architecte & études", "Fondations & gros œuvre",
    "Maçonnerie", "Charpente & toiture", "Menuiserie", "Électricité (travaux)",
    "Plomberie & sanitaires", "Carrelage & revêtements", "Peinture & finitions",
    "Clôture & portail", "Aménagement extérieur", "Main d'œuvre",
    "Matériaux de construction", "Raccordements (eau, électricité)",
    "Loyers perçus", "Dépôt de garantie", "Charges locatives",
    "Taxe foncière", "Assurance habitation / PNO", "Frais de gérance",
    "Entretien & réparations", "Mensualité crédit immobilier",
    "Intérêts d'emprunt", "Divers immobilier",
]

CAT_BUSINESS = [
    "Apport en capital", "Chiffre d'affaires", "Prestation de service",
    "Vente de produits", "Subvention / Financement", "Prêt reçu",
    "Achats de marchandises", "Matières premières", "Sous-traitance",
    "Salaires & charges", "Honoraires", "Loyer professionnel",
    "Électricité & eau (pro)", "Internet & téléphonie (pro)",
    "Marketing & publicité", "Community management", "Site web & hébergement",
    "Logiciels & abonnements", "Équipement & matériel", "Mobilier de bureau",
    "Transport & logistique", "Carburant (pro)", "Frais de mission & déplacement",
    "Frais bancaires pro", "Commissions & frais de plateforme",
    "Impôts & taxes pro", "Formation", "Conseil juridique & comptable",
    "Assurances pro", "Licences & agréments", "Amortissements",
    "Divers business",
]

CATEGORIES = {
    "Général": CAT_GENERAL,
    "Mariage": CAT_MARIAGE,
    "Immobilier": CAT_IMMOBILIER,
    "Business": CAT_BUSINESS,
}

TYPES_BIENS = ["Terrain nu", "Terrain viabilisé", "Maison", "Villa", "Appartement",
               "Immeuble", "Local commercial", "Entrepôt", "Bureau"]

STATUTS_BIEN = ["Prospection", "Sous compromis", "Acquis", "En construction",
                "Achevé", "En location", "Vendu"]

TITRES_FONCIERS = ["Attestation villageoise", "Lettre d'attribution", "ACD",
                   "Titre foncier", "Bail emphytéotique", "Acte notarié", "En cours"]

STATUTS_PROJET = ["Idée", "Étude", "Lancement", "En cours", "En pause",
                  "Terminé", "Abandonné"]

TYPES_PROJET = ["Commerce", "Service", "Agriculture", "Immobilier", "Technologie",
                "Transport", "Formation", "Événementiel", "Import-export", "Autre"]

POSTES_MARIAGE = CAT_MARIAGE

# Regroupement des postes de mariage : un anneau à 30 parts est illisible,
# un anneau à 6 familles se lit d'un coup d'œil.
FAMILLES_MARIAGE = [
    ("Cérémonies & coutume", [0, 1, 2, 7]),
    ("Tenues & beauté", [3, 4, 5, 6]),
    ("Réception", [8, 9, 10, 11, 12, 23, 24]),
    ("Prestataires", [13, 14, 15, 16, 21, 22]),
    ("Invités & logistique", [17, 18, 19, 20]),
    ("Voyage & divers", [25, 26, 27, 28]),
]

LOTS_CONSTRUCTION = [
    "Études & autorisations", "Terrassement", "Fondations", "Élévation / Maçonnerie",
    "Charpente & toiture", "Menuiserie", "Électricité", "Plomberie",
    "Carrelage & revêtements", "Peinture & finitions", "Clôture & portail",
    "Aménagement extérieur", "Raccordements", "Imprévus travaux",
]

OBJECTIFS_DEFAUT = [
    ("Fonds d'urgence (6 mois de charges)", "Général"),
    ("Apport immobilier", "Immobilier"),
    ("Budget mariage", "Mariage"),
    ("Capital de lancement business", "Business"),
    ("Achat véhicule", "Général"),
    ("Études des enfants", "Général"),
    ("Retraite / long terme", "Général"),
    ("Voyage", "Général"),
]
