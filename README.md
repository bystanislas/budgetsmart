# Budget Smart — by APEX AFRICA

Application de planification et de suivi budgétaire, et classeur Excel compagnon,
pour quatre univers : **général**, **mariage**, **immobilier & terrain**,
**business & projets**. Multi-devises, hors ligne, synchronisé.

- **Application** : `src/` — PWA installable, utilisable tous les jours.
- **Classeur** : **`Budget-Smart-by-Apex-Africa.xlsx`** (racine du dépôt), généré par script.
- **Identité visuelle** : `assets/brand/` (logo SVG + PNG, monogramme, favicon, charte).

---

## L'application

Le classeur est la référence bureautique ; l'**application** est le compagnon de tous
les jours : on saisit une dépense en trois gestes et tout le reste se recalcule.

| Fichier | Rôle |
|---|---|
| `src/types.ts` | Modèle de données (écriture, compte, ligne d'estimation, poste, objectif, dette, récurrent, paramètres) |
| `src/data/refs.ts` | Référentiels partagés avec le classeur : modules, types, 26 devises, 143 catégories, sous-catégories, familles de mariage |
| `src/db.ts` | Base locale Dexie / IndexedDB, valeurs par défaut, amorçage des comptes |
| `src/lib/compute.ts` | Moteur de calcul — l'équivalent de la feuille « Calculs » |
| `src/lib/referentiel.ts` | Référentiel effectif : celui des paramètres, modifiable par chacun |
| `src/lib/money.ts` | Devises, conversion figée à la saisie, formatage |
| `src/lib/periode.ts` | Périodes de rapport — journalière, mensuelle, trimestrielle, annuelle |
| `src/lib/export-xlsx.ts` | Régénère un classeur Excel depuis les données saisies |
| `src/lib/export-pdf.ts` | Rapport PDF prêt à imprimer |
| `src/pages/` | Accueil, Paramètres, Estimation, Journal, Tableau de bord, Modules, Plus |

### Le parcours

① **Accueil** → le parcours en trois étapes et les boutons Mariage / Projet / Immo.
② **Paramètres** → identité, devise de base, comptes, dîme, seuils, référentiel.
③ **Estimation** → le budget de l'année, catégorie par catégorie et mois par mois.
④ **Journal** → la saisie de tous les jours.

La **saisie rapide**, en tête du journal, tient en quelques gestes : type (Dépense /
Revenu / Épargne), montant, catégorie, sous-catégorie, descriptif — les puces se
réordonnent selon vos habitudes. La date du jour, le module courant, le compte et le
moyen de paiement habituels sont déduits ; « Plus de détails → » ouvre le formulaire
complet. Chaque ligne du journal se repasse à la date du jour d'un seul bouton. Tout
le reste — indicateurs, graphiques, récapitulatifs, dîme, avancement des objectifs et
des crédits — se recalcule seul.

### Traçabilité de la saisie

Chaque opération se lit des mois plus tard sans effort de mémoire :

| Niveau | Exemple | Où on le saisit |
|---|---|---|
| Type | Dépense | saisie rapide |
| Catégorie | Taxi / VTC | puce ou menu « Autre catégorie… » |
| **Sous-catégorie** | Yango | puces du second niveau |
| **Descriptif** | maison → académie | champ libre sous les puces |
| **Tiers** | Koffi | prêts, emprunts, remboursements reçus |
| Compte / destination | Compte courant → Épargne | déduit, modifiable au détail |

**Prêts et emprunts.** Trois types dédiés : « Prêt accordé », « Emprunt reçu » et
« Remboursement reçu ». Un emprunt n'est pas un revenu et un prêt n'est pas une
dépense : ils entrent et sortent bien de la caisse, mais sont comptés à part.
L'onglet **Plus** affiche l'encours par personne — ce qu'on vous doit, ce que vous devez.

**Épargne.** Une épargne dit toujours *pour quoi* (sous-catégorie et descriptif) et
*où* : elle part vers un compte d'épargne, jamais vers le compte courant, et chaque
compte porte son établissement (banque, Wave, Orange Money…), sa référence et, pour
une épargne bloquée, sa date de déblocage.

**Dîme, offrande et don** sont trois catégories distinctes. Seule la **dîme** vient
en déduction de la dîme due. Pour les trois, le descriptif est pré-rempli avec
l'église enregistrée dans les paramètres et la date du jour — et reste modifiable.

### Tout se règle dans les paramètres

Les paramètres sont la seule page où l'on modifie l'application, et ils sont
numérotés avec un sommaire cliquable : ① identité, ② devise et période, ③ soldes et
objectifs, ④ comptes, ⑤ dîme / offrandes / dons, ⑥ **catégories et sous-catégories**,
⑦ moyens de paiement, ⑧ cours des devises.

Le référentiel livré (143 catégories, leurs sous-catégories, les moyens de paiement)
est recopié dans les paramètres au premier lancement. Il s'y renomme, s'y complète et
s'y supprime librement, module par module — de sorte que Budget Smart s'adapte au
pays, au vocabulaire et aux habitudes de chacun. Les opérations déjà saisies gardent
leur libellé d'origine : changer le référentiel change ce qui est proposé demain,
jamais ce qui a été enregistré hier.

### Rapports Excel et PDF

Onglet **Plus → Rapports**. On choisit la période — **journalière, mensuelle,
trimestrielle ou annuelle** — puis le format :

- **Excel** : un classeur aux couleurs APEX — Synthèse (indicateurs + tableau mensuel),
  Journal détaillé, Par catégorie et sous-catégorie, Épargne, Prêts & emprunts, Dîme,
  Estimation, modules, Objectifs, Crédits, Récurrents, Paramètres.
- **PDF** : un rapport paysage prêt à imprimer ou à envoyer — bandeau de marque,
  cinq indicateurs, puis les mêmes tableaux, avec pagination et pied de page.

### Sauvegardes et export

Onglet **Plus** : « Exporter en Excel » régénère le classeur aux couleurs APEX à
partir des données saisies ; « Sauvegarder (JSON) » et « Restaurer » assurent le
passage d'un appareil à l'autre. Rien ne transite par Internet.

### Installer

```bash
npm install
npm run dev       # développement, http://localhost:5173
npm run build     # production → dist/
npm run preview   # sert le build en local
```

- **Sur téléphone (PWA)** : ouvrir le site, puis « Ajouter à l'écran d'accueil ».
  L'application fonctionne ensuite hors ligne ; les données restent sur l'appareil.
- **Application native (Android / iOS)**, via Capacitor :

```bash
npm run mobile:install   # une seule fois
npm run mobile:add       # crée les projets android/ et ios/
npm run mobile:android   # build + sync + ouvre Android Studio
npm run mobile:ios       # build + sync + ouvre Xcode
```

`capacitor.config.ts` porte l'identifiant `com.apxafrica.budgetsmart`.

### Déploiement

Le projet est configuré pour **Vercel** (`vercel.json`) : `npm ci`, `npm run build`,
sortie `dist`. Une seule application, un seul domaine — aucune règle de routage
particulière n'est nécessaire.

1. Sur vercel.com, importer ce dépôt et déployer la branche voulue.
2. Projet → *Settings* → *Domains* → ajouter `budgetsmart.apxafrica.com`.
3. Chez le registrar d'`apxafrica.com`, créer l'enregistrement DNS indiqué par Vercel :
   `CNAME budgetsmart → cname.vercel-dns.com`.
4. Le certificat HTTPS est émis automatiquement en quelques minutes.

---

## Le classeur Excel

### Ce que contient le classeur

| Feuille | Rôle |
|---|---|
| **Accueil** | Logo, gros boutons du parcours (① mes informations → ② estimation annuelle → ③ Budget Smart), boutons Mariage / Projet / Immo, indicateurs de tête |
| **Budget 12 Mois** | La grille maîtresse, façon « Budget Gold » : postes en lignes, 12 mois en colonnes, Prévu et Réel côte à côte pour chaque mois, en 5 blocs (entrées, épargne, crédits, dépenses courantes, modules) + synthèse mensuelle |
| **Tableau de Bord** | 10 indicateurs du mois, 5 graphiques, top 10 des dépenses, prévu/réalisé par module, 7 alertes automatiques |
| **Journal** | 3 000 lignes en quatre blocs : ① à remplir (7 colonnes), ② calculé — sens, ENTRÉE, SORTIE, solde cumulé, ③ compléments facultatifs, ④ technique repliable |
| **Estimation Annuelle** | Budget prévisionnel par catégorie × 12 mois, sur plusieurs exercices, avec réalisé et écart |
| **Synthèse Annuelle** | Tableau des 12 mois, comparaison N/N-1, top 10 annuel, soldes par compte, 4 graphiques |
| **Mariage** | 30 postes, estimation + 3 devis comparés, paiements réels, plan de financement, compte à rebours |
| **Immobilier** | Biens et terrains (surface, prix/m², rendement, cash-flow), budget travaux par lot, échéancier de paiement, simulateur de crédit |
| **Business** | Projets (budget, CA, marge, ROI), compte de résultat mensuel, seuil de rentabilité |
| **Objectifs** | Objectifs chiffrés avec échéance et effort mensuel requis, simulateur d'intérêts composés sur 30 ans |
| **Dettes** | Crédits, mensualité calculée, capital restant dû, taux d'endettement, amortissement sur 240 échéances |
| **Récurrents** | Abonnements et prélèvements mensualisés, alertes J-30 / J-7 / retard |
| **Paramètres** | Identité & coordonnées complètes, devise de base, comptes et soldes, objectifs et seuils |
| **Listes** | Référentiels : 26 devises, 143 catégories, listes de choix |
| **Calculs** | Moteur d'agrégation (feuille technique) |
| **Guide** | Mode d'emploi complet |

### Les trois feuilles qui se répondent

| | Rôle | On y saisit ? |
|---|---|---|
| **Estimation Annuelle** | ce que je **décide** de dépenser, par catégorie et par mois | oui |
| **Journal** | ce que je dépense **vraiment**, ligne par ligne | oui |
| **Budget 12 Mois** | la **comparaison des deux**, mois par mois, sur une page | non — miroir calculé |

### Les automatismes

- **Une seule saisie.** Tout part du Journal ; dashboards, plan, modules, objectifs et
  crédits se recalculent par `SUMIFS` sur des plages nommées.
- **Multi-devises.** 26 devises, cours croisés recalculés dès que la devise de base
  change ; chaque ligne peut être saisie dans une autre monnaie et convertie.
- **Symbole monétaire dynamique.** Les montants s'affichent en FCFA, €, $, £, ₦, ₵…
  selon la devise choisie, via des formats conditionnels — sans macro.
- **Listes en cascade.** Les catégories proposées dépendent du module choisi.
- **Dîme.** Activable dans Paramètres avec son taux et son assiette (salaire seul,
  salaire + primes, tous les revenus). Le montant dû, le versé et le reste à verser
  sont calculés chaque mois et rappelés par une alerte.
- **Périmètre.** Le tableau de bord et la synthèse annuelle se limitent au module
  choisi — « Général seul » par défaut, pour que le mariage, l'immobilier et le
  business ne polluent pas le budget courant. Chaque module garde sa feuille
  complète avec son propre graphique mensuel.
- **Alertes.** Déficit, taux d'épargne, dépassement de budget, échéances en retard,
  engagements non décaissés, couverture de trésorerie, dîme restant à verser.
- **Contrôles de saisie.** Dates, montants positifs, signalement des lignes incomplètes.

Aucune macro : le classeur s'ouvre dans Excel, LibreOffice Calc, Google Sheets et les
applications mobiles Excel.

### Protection

Feuilles protégées, formules masquées dans la barre de formule, structure du classeur
verrouillée, feuille technique `Calculs` masquée. Seules les zones de saisie (fond
jaune pâle) restent modifiables — la carte de ces zones est la constante
`ZONES_SAISIE` du générateur.

Mot de passe par défaut : `APEX-2026`, constante `PASSWORD` — **à changer avant
diffusion**. La protection Excel empêche les modifications accidentelles et la recopie
des formules ; ce n'est pas du chiffrement. Voir `assets/brand/MARQUE-ET-DROITS.md`.

### Régénérer le fichier

```bash
pip install openpyxl pillow          # pillow : insertion du logo
python3 tools/budget-smart/build_budget_smart.py            # écrit le classeur à la racine
python3 tools/budget-smart/build_budget_smart.py /tmp/x.xlsx # ou vers un chemin choisi
```

### Ordre des feuilles — le parcours

`Accueil` → `Paramètres` → `Estimation Annuelle` → `Journal` → `Tableau de Bord` →
`Budget 12 Mois` → `Synthèse Annuelle` → `Mariage` → `Business` → `Immobilier` →
`Objectifs` → `Dettes` → `Récurrents` → `Listes` → `Guide`.

Une **barre de navigation** identique en ligne 3 de chaque feuille rappelle les cinq
destinations principales et met en évidence celle où l'on se trouve.

### Garde-fous automatiques à la génération

`check_merges()` refuse deux plages fusionnées qui se recoupent : Excel rejetterait
le fichier entier et proposerait de le « réparer ».

`check_layout()` calcule la boîte en pixels de chaque graphique et refuse la
génération si un graphique en recouvre un autre ou recouvre une cellule remplie.

`check_circular()` refuse une formule qui se trouve à l'intérieur d'une plage
qu'elle référence — la référence circulaire classique, qui empêche Excel de
calculer tout le classeur.

Les graphiques ne sont pas ancrés à la main : la classe `ChartZone` les empile
dans une colonne dédiée, en avançant automatiquement selon leur hauteur.

`percent_labels()` construit les étiquettes de secteur : tout est désactivé sauf le
pourcentage, pour éviter l'empilement « Général; Column C; 535 596; 43% » sur chaque
part. `tune_chart()` réduit la police des axes et de la légende, sort la légende du
tracé, et espace les étiquettes d'axe (`tickLblSkip`) quand les catégories sont
nombreuses. Les postes de mariage sont regroupés en six familles (`FAMILLES_MARIAGE`) :
un anneau à trente parts est illisible, un anneau à six se lit d'un coup d'œil.

`normalize_formulas()` remplace en dernière passe les appels `TEXT(x,"format")` par
`FIXED()` / `ROUND()` : les codes de format de `TEXT()` sont interprétés selon la
langue d'Excel et renvoient `#VALEUR!` sur un Excel français.

### Organisation du code

| Fichier | Contenu |
|---|---|
| `apex_style.py` | Palette, formats, briques de mise en page (bandeaux, cartes KPI, tableaux) |
| `apex_data.py` | Référentiels : devises, modules, catégories, listes de choix |
| `sheets_core.py` | Listes, Paramètres, Journal, Plan annuel, Récurrents |
| `sheets_dash.py` | Moteur de calcul et tableaux de bord mensuel / annuel |
| `sheets_budget12.py` | Grille « Budget 12 Mois » (entrées / sorties, prévu vs réel) |
| `sheets_modules.py` | Mariage, Immobilier & terrain, Business, Objectifs, Dettes |
| `build_budget_smart.py` | Accueil, Guide, plages nommées, assemblage et écriture |

### Identité visuelle

Le logo est **généré par code**, donc régénérable et modifiable :

```bash
python3 tools/budget-smart/build_logo.py            # produit les SVG dans assets/brand/
python3 tools/budget-smart/build_logo.py compare    # planche de comparaison des pistes
```

Le symbole : trois colonnes qui montent — le budget qui se construit mois après mois —
et une quatrième en pointe : l'apex, l'objectif atteint. Or sur bleu nuit, les deux
couleurs signature d'APEX AFRICA.

| Fichier | Usage |
|---|---|
| `budget-smart-logo.svg` / `-2400.png` | Logo principal, fond clair |
| `budget-smart-logo-fond-sombre.svg` / `.png` | Logo sur fond bleu nuit |
| `budget-smart-logo-vertical.svg` / `.png` | Version empilée (carré, avatar) |
| `budget-smart-monogramme.svg` / `-1024.png` / `-512.png` | Symbole seul |
| `budget-smart-favicon.svg` / `-256.png` | Onglet navigateur, petites tailles |
| `budget-smart-charte.svg` / `.png` | Planche de charte (symbole, déclinaisons, palette, typo, usages) |

Le classeur reprend la **charte APEX AFRICA** : bleu nuit `#1A3557`, or `#B8860B`,
crème `#FDF6E3`, orange `#E07B22`, gris ardoise `#404040`, typographie Arial.

---

**Contact** — contact@apxafrica.com · www.apxafrica.com
