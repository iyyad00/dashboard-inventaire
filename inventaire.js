// ====================================================================
// SECTION 1: GESTION DES DONNÉES ET ESPACE DE STOCKAGE DÉSIGNÉ (Local)
//
// ATTENTION: Les données sont stockées sur l'appareil de l'utilisateur (localStorage).
// C'est l'espace de stockage idéal pour ce projet de portfolio statique.
// Pour un usage commercial réel (sécurité contre le piratage), il faudrait un
// serveur externe et une base de données.
// ====================================================================

// Liste des codes d'entreprise, email et mots de passe autorisés
const USERS_AUTORISES = {
    "ENTR001": { motDePasse: "secret123", nom: "Société Alpha", email: "alpha@entreprise.ma" },
    "ENTR002": { motDePasse: "pass456", nom: "Atelier Beta", email: "beta@atelier.com" }
};

let nextId = 4; // ID pour les nouveaux produits

// Fonction pour initialiser l'inventaire dans le LocalStorage (si vide)
function initialiserStockage() {
    if (!localStorage.getItem('inventaire')) {
        const inventaireInitial = [
            { id: 1, nom: "Clavier Mécanique", categorie: "Bureau", stock: 25 },
            { id: 2, nom: "Lampe LED", categorie: "Éclairage", stock: 3 },
            { id: 3, nom: "Cartouche d'encre", categorie: "Consommable", stock: 0 }
        ];
        localStorage.setItem('inventaire', JSON.stringify(inventaireInitial));
    }
}
initialiserStockage(); // Exécuter l'initialisation dès le début du script

// ====================================================================
// SECTION 2: CONTRÔLE D'ACCÈS ET AFFICHAGE (Vérifie la connexion en premier)
// ====================================================================

// Fonction pour vérifier la connexion et rediriger si l'accès est refusé
function verifierAcces() {
    // Si la page n'est pas censée afficher l'inventaire, on arrête
    if (!document.getElementById('inventory-table')) return;
    
    const code = localStorage.getItem('entrepriseCode');
    
    // Si l'utilisateur n'est pas connecté, le renvoyer à la page de connexion
    if (!code || !USERS_AUTORISES[code]) {
        window.location.href = 'login.html';
        return;
    }
    
    // Si l'accès est vérifié, afficher les infos et l'inventaire
    afficherInfoEntreprise(code);
    afficherInventaire();
}

function afficherInfoEntreprise(code) {
    const infoDiv = document.getElementById('entreprise-info');
    const user = USERS_AUTORISES[code];
    // Affichage des informations demandées
    infoDiv.innerHTML = `<div class="info-box">
                         <h3>Entreprise Connectée : ${user.nom}</h3>
                         <p>Code d'Entreprise : <strong>${code}</strong></p>
                         <p>Email de Contact : <strong>${user.email}</strong></p>
                         <button onclick="deconnexion()">Déconnexion</button>
                         </div>`;
}

function deconnexion() {
    localStorage.removeItem('entrepriseCode');
    window.location.href = 'login.html';
}


// ====================================================================
// SECTION 3: LOGIQUE DE LA PAGE DE CONNEXION (login.html)
// ====================================================================

function gererConnexion(event) {
    if (!document.getElementById('login-form')) return;

    event.preventDefault();

    const codeInput = document.getElementById('code_entreprise');
    const passInput = document.getElementById('mot_de_passe');
    const erreurMsg = document.getElementById('message-erreur');

    const code = codeInput.value;
    const motDePasse = passInput.value;

    if (USERS_AUTORISES[code] && USERS_AUTORISES[code].motDePasse === motDePasse) {
        localStorage.setItem('entrepriseCode', code);
        window.location.href = 'index.html';
        return;
    }

    erreurMsg.style.visibility = 'visible';
    passInput.value = '';
}

const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', gererConnexion);
}


// ====================================================================
// SECTION 4: GESTION DU TABLEAU ET DES ACTIONS (index.html)
// (Ajouter, Modifier, Supprimer)
// ====================================================================

function afficherInventaire() {
    const tableBody = document.querySelector('#inventory-table tbody');
    tableBody.innerHTML = '';

    const inventaire = JSON.parse(localStorage.getItem('inventaire')) || [];
    if (inventaire.length > 0) {
        nextId = Math.max(...inventaire.map(p => p.id)) + 1;
    }


    inventaire.forEach(produit => {
        const row = tableBody.insertRow();
        row.setAttribute('data-id', produit.id); 
        
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
        
        const actionsCell = row.insertCell();
        actionsCell.innerHTML = `<button onclick="modifierProduit(${produit.id})">Modifier</button>
                                 <button onclick="supprimerProduit(${produit.id})" class="delete-btn">Supprimer</button>`;
    });
}

function ajouterProduit(event) {
    event.preventDefault();

    const nom = document.getElementById('produit-nom').value;
    const stock = parseInt(document.getElementById('produit-stock').value);
    const categorie = document.getElementById('produit-categorie').value;

    if (nom && !isNaN(stock) && categorie) {
        const nouvelInventaire = JSON.parse(localStorage.getItem('inventaire')) || [];
        
        const nouveauProduit = { id: nextId++, nom: nom, categorie: categorie, stock: stock };
        nouvelInventaire.push(nouveauProduit);
        
        localStorage.setItem('inventaire', JSON.stringify(nouvelInventaire));

        afficherInventaire();
        document.getElementById('add-product-form').reset();
    }
}

function modifierProduit(id) {
    let inventaire = JSON.parse(localStorage.getItem('inventaire')) || [];
    const produitIndex = inventaire.findIndex(p => p.id === id);

    if (produitIndex > -1) {
        const produit = inventaire[produitIndex];
        const nouveauStock = prompt(`Nouveau stock pour ${produit.nom} (Actuel: ${produit.stock}) :`);
        
        if (nouveauStock !== null && !isNaN(parseInt(nouveauStock))) {
            inventaire[produitIndex].stock = parseInt(nouveauStock);
            localStorage.setItem('inventaire', JSON.stringify(inventaire));
            afficherInventaire();
        }
    }
}

function supprimerProduit(id) {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce produit de l'inventaire ?")) {
        let inventaire = JSON.parse(localStorage.getItem('inventaire')) || [];
        const nouvelInventaire = inventaire.filter(p => p.id !== id);
        
        localStorage.setItem('inventaire', JSON.stringify(nouvelInventaire));
        afficherInventaire();
    }
}

// ====================================================================
// SECTION 5: INITIALISATION DES ÉCOUTEURS D'ÉVÉNEMENTS
// ====================================================================

const addProductForm = document.getElementById('add-product-form');
if (addProductForm) {
    addProductForm.addEventListener('submit', ajouterProduit);
}

// Lancer la vérification de l'accès au chargement de la page
if (document.getElementById('inventory-table') || document.getElementById('login-form')) {
    window.addEventListener('load', verifierAcces);
}
