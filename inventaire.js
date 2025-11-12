// ====================================================================
// SECTION 1: GESTION DES DONNÉES ET ESPACE DE STOCKAGE DÉSIGNÉ (Local)
// ====================================================================

// Liste des codes d'entreprise, email et mots de passe autorisés
let USERS_AUTORISES = { // Utilisez 'let' car cette variable sera mise à jour
    "ENTR001": { motDePasse: "secret123", nom: "Société Alpha", email: "alpha@entreprise.ma" },
    "ENTR002": { motDePasse: "pass456", nom: "Atelier Beta", email: "beta@atelier.com" }
};

let nextId = 4;

// Fonction pour initialiser l'inventaire et les utilisateurs
function initialiserStockage() {
    // 1. Initialiser l'inventaire
    if (!localStorage.getItem('inventaire')) {
        const inventaireInitial = [
            { id: 1, nom: "Clavier Mécanique", categorie: "Bureau", stock: 25 },
            { id: 2, nom: "Lampe LED", categorie: "Éclairage", stock: 3 },
            { id: 3, nom: "Cartouche d'encre", categorie: "Consommable", stock: 0 }
        ];
        localStorage.setItem('inventaire', JSON.stringify(inventaireInitial));
    }

    // 2. Initialiser les utilisateurs (Si des emails ont été modifiés par l'utilisateur)
    const storedUsers = localStorage.getItem('users');
    if (storedUsers) {
        // Si des utilisateurs stockés existent, les fusionner avec la liste par défaut
        USERS_AUTORISES = JSON.parse(storedUsers);
    } else {
        // Stocker la liste par défaut si elle n'existe pas encore
        localStorage.setItem('users', JSON.stringify(USERS_AUTORISES));
    }
}
initialiserStockage();


// ====================================================================
// SECTION 2: CONTRÔLE D'ACCÈS ET AFFICHAGE (Vérifie la connexion en premier)
// ====================================================================

function verifierAcces() {
    if (!document.getElementById('inventory-table') && !document.getElementById('login-form')) return; // Vérification générale

    const code = localStorage.getItem('entrepriseCode');
    
    // Si on est sur la page d'inventaire (index.html)
    if (document.getElementById('inventory-table')) {
        if (!code || !USERS_AUTORISES[code]) {
            window.location.href = 'login.html';
            return;
        }
        afficherInfoEntreprise(code);
        afficherInventaire();
    }
}

function afficherInfoEntreprise(code) {
    const infoDiv = document.getElementById('entreprise-info');
    const user = USERS_AUTORISES[code];
    infoDiv.innerHTML = `<div class="info-box">
                         <h3>Entreprise Connectée : ${user.nom}</h3>
                         <p>Code d'Entreprise : <strong>${code}</strong></p>
                         <p>Email de Contact : <strong id="current-email">${user.email}</strong> 
                         <button onclick="modifierEmailEntreprise('${code}')">Modifier Email</button></p> 
                         <button onclick="deconnexion()">Déconnexion</button>
                         </div>`;
}

// NOUVELLE FONCTION: Permet à l'entreprise connectée de modifier son email
function modifierEmailEntreprise(code) {
    const user = USERS_AUTORISES[code];
    const nouveauEmail = prompt(`Entrez le nouvel email pour ${user.nom} (Actuel: ${user.email}) :`);

    if (nouveauEmail !== null && nouveauEmail.trim() !== "" && nouveauEmail.includes('@')) {
        // 1. Mettre à jour dans l'objet en mémoire
        USERS_AUTORISES[code].email = nouveauEmail.trim();

        // 2. Mettre à jour dans le stockage local pour persistance
        localStorage.setItem('users', JSON.stringify(USERS_AUTORISES));

        // 3. Mettre à jour l'affichage immédiatement
        afficherInfoEntreprise(code);
    } else if (nouveauEmail !== null) {
        alert("Email invalide. Veuillez entrer une adresse email correcte.");
    }
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
                                 <button onclick="supprimerProduit(${produuit.id})" class="delete-btn">Supprimer</button>`;
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
window.addEventListener('load', verifierAcces);
