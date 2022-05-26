# NodeJS Selenium - outil d'envoie de demande de connexion aux profils issue d'une recherche LinkedIn.

## Démarrage rapide (dev only)

0. Installer l'ensemble des dépendances du projet

```bash
npm i
```

1. Configurer les variables d'environnement

- A la racine du projet créer un fichier .env.developement

```bash
touch .env.development
```

- Referencer les paramètres suivants avec vos propres configurations

```
LINKEDIN_AUTH_TOKEN="YOUR AUTH TOKEN (li_at cookie in dev explorer console)"
LINKEDIN_SEARCH_URL="URL DES RESULTAT DE LA RECHERCHE LINKEDIN"
CONNECT_MESSAGE="Message à envoyer lors de l'invitation \n pour aller a la ligne"
```

2. Lancer le serveur de developement pour verifier vos configurations

```
npm run start
```

## Troubleshots

- Vérifier la version du chromedriver présent dans src/drivers

## Project Resources

- [Visual Studio Code](https://code.visualstudio.com/)
- [nodejs](https://nodejs.org/en/)
- [selenium](https://github.com/SeleniumHQ/selenium)
- [chromedirver](https://chromedriver.chromium.org/downloads)
