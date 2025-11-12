// ====================================================================
// 1. GESTION DES DONNÉES DE DÉPART (Simulacre de base de données)
// Pour un site statique, nous stockons les données dans le navigateur (LocalStorage)

// Liste des codes et mots de passe autorisés
const USERS_AUTORISES = {
    // Code Entreprise: Mot de passe
    "ENTR001": "secret123",
    "ENTR002": "pass456"
};

// Initialisation de l'inventaire dans le LocalStorage (si vide)
if (!localStorage.getItem('inventaire')) {
    const inventaireInitial = [
        { nom: "Clavier Mécanique", categorie: "Bureau", stock: 25 },
        { nom: "Lampe LED", categorie: "Éclairage", stock: 3 },
        { nom: "Cartouche d'encre", categorie: "Consommable", stock: 0 }
    ];
    localStorage.setItem('inventaire', JSON.stringify(inventaireInitial));
}

// ====================================================================
// 2. LOGIQUE DE CONNEXION (login.html)
// ====================================================================

// Fonction pour gérer la soumission du formulaire de connexion
function gererConnexion(event) {
    // S'assurer que cette fonction n'est exécutée que sur login.html
    if (!document.getElementById('login-form')) return;

    event.preventDefault(); // Empêcher l'envoi du formulaire (et donc le rechargement de la page)

    const codeInput = document.getElementById('code_entreprise');
    const passInput = document.getElementById('mot_de_passe');
    const erreurMsg = document.getElementById('message-erreur');

    const code = codeInput.value;
    const motDePasse = passInput.value;

    // 1. Vérifier si le code d'entreprise existe
    if (USERS_AUTORISES[code]) {
        // 2. Vérifier si le mot de passe correspond
        if (USERS_AUTORISES[code] === motDePasse) {
            // Connexion réussie :
            // Stocker le code de l'entreprise pour pouvoir le récupérer sur la page du tableau de bord
            localStorage.setItem('entrepriseCode', code);

            // Rediriger vers la page du tableau de bord
            window.location.href = 'index.html';
            return;
        }
    }

    // Connexion échouée : Afficher le message d'erreur
    erreurMsg.style.visibility = 'visible';
    passInput.value = ''; // Effacer le mot de passe pour des raisons de sécurité
}


// Ajout de l'écouteur d'événement au formulaire de connexion (si présent)
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', gererConnexion);
}


// ====================================================================
// 3. LOGIQUE DU TABLEAU DE BORD (index.html)
// ====================================================================

// Fonction pour vérifier la connexion avant d'afficher le tableau de bord
function verifierAcces() {
    // S'assurer que cette fonction n'est exécutée que sur index.html
    if (!document.getElementById('inventory-table')) return;
    
    const code = localStorage.getItem('entrepriseCode');
    
    // Si l'utilisateur n'est pas connecté, le renvoyer à la page de connexion
    if (!code || !USERS_AUTORISES[code]) {
        window.location.href = 'login.html';
        return;
    }
    
    // Afficher l'inventaire de l'entreprise (même si l'inventaire est partagé pour cette démo)
    afficherInventaire();
}

// Fonction pour charger et afficher les données dans le tableau
function afficherInventaire() {
    const tableBody = document.querySelector('#inventory-table tbody');
    tableBody.innerHTML = ''; // Vider le tableau avant d'ajouter les nouvelles données

    const inventaire = JSON.parse(localStorage.getItem('inventaire')) || [];

    inventaire.forEach(produit => {
        const row = tableBody.insertRow();
        
        // Calcul du Statut
        let statutClass = '';
        let statutText = '';
        if (produit.stock <= 0) {
            statutClass = 'status-urgent';
            statutText = 'Rupture';
        } else if (produit.stock < 10) {
            statutClass = 'status-low';
            statutText = 'Stock Bas';
        } else {
            statutClass = 'status-ok';
            statutText = 'Stock OK';
        }

        row.insertCell().textContent = produit.nom;
        row.insertCell().textContent = produit.categorie;
        row.insertCell().textContent = produit.stock;
        
        const statutCell = row.insertCell();
        statutCell.innerHTML = `<span class="${statutClass}">${statutText}</span>`;
    });
}

// Fonction pour ajouter un nouveau produit
function ajouterProduit(event) {
    event.preventDefault(); // Empêcher l'envoi du formulaire

    const nom = document.getElementById('produit-nom').value;
    const stock = parseInt(document.getElementById('produit-stock').value);
    const categorie = document.getElementById('produit-categorie').value;

    if (nom && !isNaN(stock) && categorie) {
        const nouvelInventaire = JSON.parse(localStorage.getItem('inventaire')) || [];
        
        const nouveauProduit = { nom: nom, categorie: categorie, stock: stock };
        nouvelInventaire.push(nouveauProduit);
        
        localStorage.setItem('inventaire', JSON.stringify(nouvelInventaire));

        // Mettre à jour le tableau affiché
        afficherInventaire();
        
        // Vider le formulaire
        document.getElementById('add-product-form').reset();
    }
}

// Ajout des écouteurs d'événements pour le tableau de bord (si présent)
const addProductForm = document.getElementById('add-product-form');
if (addProductForm) {
    addProductForm.addEventListener('submit', ajouterProduit);
    // Exécuter la vérification d'accès et l'affichage de l'inventaire au chargement de la page
    window.addEventListener('load', verifierAcces); 
}
