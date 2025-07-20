# TrackApp - Application de suivi du temps pour développeurs

Une application desktop Electron moderne pour le suivi du temps de travail, spécialement conçue pour les développeurs.

## 🚀 Fonctionnalités

### Suivi du temps
- **Démarrage/arrêt facile** du suivi du temps
- **Détection d'inactivité** automatique (pause du suivi quand vous n'utilisez pas votre ordinateur)
- **Affichage en temps réel** du temps écoulé
- **Interface dans la barre de menu** macOS

### Gestion des projets
- **Création et gestion** de projets
- **Codes couleur** pour identifier facilement les projets
- **Archivage** des projets terminés
- **Intégration Notion** pour synchroniser les projets

### Gestion des tâches
- **Création de tâches** avec descriptions détaillées
- **Association aux projets** existants
- **Tags et étiquettes** pour organiser les tâches
- **Statut payé/non payé** pour le suivi financier
- **Archivage** des tâches terminées

### Filtres et recherche
- **Filtrage par projet** pour voir les tâches spécifiques
- **Filtrage par statut** (payé/non payé)
- **Filtrage par date** (plage personnalisable)
- **Recherche textuelle** dans les descriptions et noms de projets

### Rapports et analyses
- **Génération de rapports** détaillés
- **Statistiques par projet** (heures, nombre de tâches)
- **Résumé quotidien** de l'activité
- **Export des données** pour analyse externe

### Intégration Notion
- **Synchronisation automatique** des tâches vers Notion
- **Création de pages** Notion pour chaque tâche
- **Mise à jour en temps réel** des statuts
- **Liaison des projets** avec les bases de données Notion

## 🛠️ Technologies utilisées

- **Electron** - Framework desktop cross-platform
- **React 18** - Interface utilisateur
- **TypeScript** - Typage statique
- **Tailwind CSS v4** - Styling moderne
- **SQLite** - Base de données locale
- **shadcn/ui** - Composants UI
- **Zustand** - Gestion d'état
- **React Hook Form** - Gestion des formulaires
- **date-fns** - Manipulation des dates
- **Lucide React** - Icônes

## 📦 Installation

### Prérequis
- Node.js 18+ 
- pnpm (recommandé) ou npm

### Installation des dépendances
```bash
# Installer les dépendances
pnpm install

# Ou avec npm
npm install
```

### Développement
```bash
# Lancer en mode développement
pnpm dev

# Ou avec npm
npm run dev
```

### Build
```bash
# Construire l'application
pnpm build

# Créer un package distributable pour macOS
pnpm dist:mac
```

## 🏗️ Architecture

```
track-app/
├── src/
│   ├── main/           # Processus principal Electron
│   │   ├── main.ts     # Point d'entrée principal
│   │   ├── database.ts # Gestion de la base de données SQLite
│   │   ├── time-tracker.ts # Logique de suivi du temps
│   │   ├── idle-detector.ts # Détection d'inactivité
│   │   ├── notion-integration.ts # Intégration Notion
│   │   └── preload.ts  # Script de préchargement sécurisé
│   ├── renderer/       # Processus de rendu React
│   │   ├── main.tsx    # Point d'entrée React
│   │   ├── App.tsx     # Composant principal
│   │   ├── contexts/   # Contextes React
│   │   ├── components/ # Composants réutilisables
│   │   ├── pages/      # Pages de l'application
│   │   └── lib/        # Utilitaires et helpers
│   └── types/          # Définitions TypeScript
├── assets/             # Ressources (icônes, images)
└── dist/               # Fichiers de build
```

## 🔧 Configuration

### Variables d'environnement
Créez un fichier `.env` à la racine du projet :

```env
# Clé API Notion (optionnelle)
NOTION_API_KEY=your_notion_api_key_here

# Configuration de la base de données
DB_PATH=~/.trackapp/trackapp.db
```

### Configuration Notion
1. Créez une intégration dans [Notion Developers](https://developers.notion.com)
2. Obtenez votre clé API
3. Ajoutez la clé dans les variables d'environnement
4. Partagez vos bases de données avec l'intégration

## 📱 Utilisation

### Première utilisation
1. Lancez l'application
2. Créez votre premier projet
3. Commencez à suivre votre temps !

### Suivi du temps
- Cliquez sur "Démarrer" pour commencer le suivi
- Sélectionnez un projet et ajoutez une description
- L'application détectera automatiquement votre inactivité
- Cliquez sur "Arrêter" pour terminer le suivi

### Gestion des projets
- Accédez à la page "Projets"
- Créez de nouveaux projets avec des couleurs personnalisées
- Archivez les projets terminés
- Synchronisez avec Notion si configuré

### Rapports
- Consultez les rapports dans la page dédiée
- Filtrez par période, projet ou statut
- Exportez les données pour analyse externe

## 🎨 Interface utilisateur

L'application utilise un design moderne avec :
- **Mode sombre/clair** automatique
- **Interface responsive** adaptée à différentes tailles d'écran
- **Animations fluides** pour une meilleure expérience utilisateur
- **Icônes intuitives** pour une navigation facile

## 🔒 Sécurité

- **Context isolation** pour séparer les processus
- **Preload scripts** sécurisés pour l'IPC
- **Validation des données** côté serveur et client
- **Stockage local sécurisé** des données sensibles

## 🚀 Déploiement

### Build pour production
```bash
# Build complet
pnpm build

# Package pour macOS
pnpm dist:mac

# Package pour Windows (si configuré)
pnpm dist:win

# Package pour Linux (si configuré)
pnpm dist:linux
```

### Distribution
Les fichiers de distribution se trouvent dans le dossier `release/`.

## 🤝 Contribution

1. Fork le projet
2. Créez une branche pour votre fonctionnalité
3. Committez vos changements
4. Poussez vers la branche
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème :
- Ouvrez une issue sur GitHub
- Consultez la documentation
- Contactez l'équipe de développement

---

**TrackApp** - Suivez votre temps, maximisez votre productivité ! ⏱️ 