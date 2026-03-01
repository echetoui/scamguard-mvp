const fs = require('fs');
const path = require('path');

// Configuration
const ENV_FILE = path.join(__dirname, '.env');

// Lecture du fichier .env pour récupérer l'URL
let API_URL = '';
try {
  if (fs.existsSync(ENV_FILE)) {
    const envContent = fs.readFileSync(ENV_FILE, 'utf8');
    const match = envContent.match(/REACT_APP_LAMBDA_URL=(.*)/);
    if (match && match[1]) {
      API_URL = match[1].trim();
    }
  }
} catch (e) {
  console.error("Erreur lecture .env:", e);
}

if (!API_URL) {
  console.error("❌ Erreur: REACT_APP_LAMBDA_URL non trouvé dans .env");
  console.log("Assurez-vous d'avoir créé le fichier .env avec l'URL de l'API.");
  process.exit(1);
}

console.log(`🌐 API URL détectée: ${API_URL}`);

// Récupération des arguments
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log("\n⚠️  Usage: node test-api.js <email> <password>");
  console.log("   Exemple: node test-api.js test@example.com Password123!");
  process.exit(0);
}

async function testConnection() {
  console.log(`\n🔄 Test de connexion pour: ${email}`);
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      console.log("\n✅ SUCCÈS: Connexion réussie !");
      console.log("------------------------------------------------");
      console.log(`🔑 ID Token: ${data.data.id_token.substring(0, 20)}...`);
      console.log(`👤 User ID:  ${data.data.user.sub || data.data.user.id}`);
      console.log("------------------------------------------------");
      console.log("Le backend AWS est accessible et l'authentification fonctionne.");
    } else {
      console.log("\n❌ ÉCHEC: La connexion a été refusée.");
      console.log(`Status: ${response.status}`);
      console.log(`Message: ${data.message || JSON.stringify(data)}`);
      
      if (response.status === 400 && data.message?.includes("User does not exist")) {
        console.log("\n💡 Conseil: Cet utilisateur n'existe pas. Essayez de vous inscrire via l'application d'abord.");
      } else if (response.status === 400 && data.message?.includes("Incorrect username or password")) {
        console.log("\n💡 Conseil: Mot de passe incorrect.");
      } else if (response.status === 400 && data.message?.includes("User is not confirmed")) {
        console.log("\n💡 Conseil: L'utilisateur n'a pas vérifié son email.");
      }
    }
  } catch (error) {
    console.error("\n❌ ERREUR RÉSEAU:");
    console.error(error.message);
    console.log("\nCauses possibles:");
    console.log("1. L'URL de l'API dans .env est incorrecte.");
    console.log("2. L'API Gateway est hors ligne ou inaccessible.");
    console.log("3. Votre connexion internet est instable.");
  }
}

testConnection();