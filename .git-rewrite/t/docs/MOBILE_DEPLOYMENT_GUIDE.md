# 📱 Guide de Déploiement Mobile (iOS & Android)

Ce guide explique comment transformer l'application web ScamGuard (React) en application mobile native pour l'Apple App Store et le Google Play Store en utilisant **Capacitor**.

---

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

1.  **Node.js** et **npm** (déjà requis pour le projet).
2.  **Pour Android :** [Android Studio](https://developer.android.com/studio) (SDK Android installé).
3.  **Pour iOS :** Un Mac avec [Xcode](https://developer.apple.com/xcode/) installé (requis pour compiler pour iPhone).
4.  Un compte développeur Apple (99$/an) et/ou Google Play (25$ unique) pour publier.

---

## ⚙️ Installation et Configuration

Ces commandes doivent être exécutées dans le dossier `frontend`.

### 1. Installer Capacitor

```bash
cd frontend
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
```

### 2. Initialiser Capacitor

```bash
npx cap init
```
- **App Name:** ScamGuard
- **App Package ID:** com.scamguard.app (ou votre identifiant unique)
- **Web asset directory:** `build`

### 3. Configurer l'application

Vérifiez que le fichier de configuration généré (`capacitor.config.json` ou `.ts`) pointe bien vers le dossier de build :

```json
{
  "appId": "com.scamguard.app",
  "appName": "ScamGuard",
  "webDir": "build",
  "bundledWebRuntime": false
}
```

---

## 🏗️ Construction et Synchronisation

À chaque fois que vous modifiez le code React, suivez ces étapes pour mettre à jour les projets natifs.

### 1. Construire l'application Web

```bash
npm run build
```
*Cela génère le dossier `build` avec la version optimisée de l'app.*

### 2. Ajouter les plateformes (Première fois seulement)

```bash
npx cap add android
npx cap add ios
```

### 3. Synchroniser avec le natif

```bash
npx cap sync
```
*Cette commande copie le dossier `build` dans les projets Android et iOS.*

---

## 🚀 Déploiement sur Android (Google Play)

1.  **Ouvrir Android Studio :**
    ```bash
    npx cap open android
    ```

2.  **Configurer l'icône et le splash screen :**
    - Utilisez l'outil *Image Asset Studio* dans Android Studio (res > drawable).

3.  **Générer l'APK/Bundle pour le Store :**
    - Menu `Build` > `Generate Signed Bundle / APK`.
    - Choisissez `Android App Bundle` (recommandé pour le Play Store).
    - Créez ou sélectionnez votre clé de signature (Keystore).
    - Une fois généré, uploadez le fichier `.aab` sur la Google Play Console.

---

## 🍎 Déploiement sur iOS (App Store)

*Note : Nécessite un Mac.*

1.  **Ouvrir Xcode :**
    ```bash
    npx cap open ios
    ```

2.  **Configurer la signature :**
    - Cliquez sur "App" dans l'explorateur de projet (à gauche).
    - Allez dans l'onglet "Signing & Capabilities".
    - Sélectionnez votre "Team" (Compte développeur Apple).

3.  **Archiver pour l'App Store :**
    - Sélectionnez "Any iOS Device (arm64)" comme cible.
    - Menu `Product` > `Archive`.
    - Une fois l'archive créée, cliquez sur `Distribute App` pour l'envoyer sur App Store Connect.