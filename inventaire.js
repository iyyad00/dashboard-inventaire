// ====================================================================
// SECTION 1: GESTION DES DONNÉES ET ESPACE DE STOCKAGE DÉSIGNÉ (Local)
// (Mot de passe retiré pour des raisons de sécurité GitHub)
// ====================================================================

// Liste des codes d'entreprise et emails de test. La clé "valide: true" simule l'authentification.
let USERS_AUTORISES_DEFAUT = {
    "ENTR001": { valide: true, nom: "Société Alpha", email: "alpha.test@entreprise.ma" },
    "ENTR002": { valide: true, nom: "Atelier Beta", email: "beta.test@atelier.com" }
};

let USERS_AUTORISES = {};
let nextId = 4;
let sortDirection = 1; // 1 pour ASC (croissant), -1 pour DESC (décroissant)

// Fonction pour initialiser l'inventaire et les utilisateurs
function initialiserStockage() {
    // 1. Initialiser l'inventaire (produits)
    if (!localStorage.getItem('inventaire')) {
        const inventaireInitial = [
            { id: 1, nom: "Clavier Mécanique", categorie: "Bureau", stock: 25 },
            { id: 2, nom: "Lampe LED", categorie: "Éclairage", stock: 3 },
            { id: 3, nom: "Cartouche d'encre", categorie: "Consommable", stock: 0 }
        ];
        localStorage.setItem('inventaire', JSON.stringify(inventaireInitial));
    }

    // 2. Initialiser les utilisateurs 
    const storedUsers = localStorage.getItem('users');
    if (storedUsers) {
        USERS_AUTORISES = JSON.parse(storedUsers);
    } else {
        USERS_AUTORISES = USERS_AUTORISES_DEFAUT;
        localStorage.setItem('users', JSON.stringify(USERS_AUTORISES));
    }
}
initialiserStockage();


// ====================================================================
// SECTION 2: CONTRÔLE D'ACCÈS ET AFFICHAGE DES INFOS (index.html)
// ====================================================================

function verifierAcces() {
    const code = localStorage.getItem('entrepriseCode');
    
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

function modifierEmailEntreprise(code) {
    const user = USERS_AUTORISES[code];
    const nouveauEmail = prompt(`Entrez le nouvel email pour ${user.nom} (Actuel: ${user.email}) :`);

    if (nouveauEmail !== null && nouveauEmail.trim() !== "" && nouveauEmail.includes('@')) {
        USERS_AUTORISES[code].email = nouveauEmail.trim();
        localStorage.setItem('users', JSON.stringify(USERS_AUTORISES));
        afficherInfoEntreprise(code);
    } else if (nouveauEmail !== null && nouveauEmail.trim() !== "") {
        alert("Email invalide. Veuillez entrer une adresse email correcte.");
    }
}


function deconnexion() {
    localStorage.removeItem('entrepriseCode');
    window.location.href = 'login.html';
}


// ====================================================================
// SECTION 3: LOGIQUE DE LA PAGE DE CONNEXION (login.html)
// --- Vérifie seulement le CODE d'entreprise ---
// ====================================================================

function gererConnexion(event) {
    if (!document.getElementById('login-form')) return;

    event.preventDefault();

    const codeInput = document.getElementById('code_entreprise');
    const erreurMsg = document.getElementById('message-erreur');

    const code = codeInput.value;

    // La connexion vérifie seulement si le code existe dans notre liste et est valide
    if (USERS_AUTORISES[code] && USERS_AUTORISES[code].valide === true) {
        localStorage.setItem('entrepriseCode', code);
        window.location.href = 'index.html';
        return;
    }

    // Affiche l'erreur si le code n'est pas reconnu
    erreurMsg.style.visibility = 'visible';
}

const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', gererConnexion);
}


// ====================================================================
// SECTION 4: GESTION DU TABLEAU ET DES ACTIONS (CRUD + FILTRE/TRI)
// ====================================================================

/**
 * Calcule la classe et le texte du statut en fonction du stock.
 */
function getStatut(stock) {
    if (stock <= 0) {
        return { statutClass: 'status-urgent', statutText: 'Rupture', statutValue: 3 };
    } else if (stock < 10) {
        return { statutClass: 'status-low', statutText: 'Stock Bas', statutValue: 2 };
    } else {
        return { statutClass: 'status-ok', statutText: 'Stock OK', statutValue: 1 };
    }
}

// Fonction pour gérer le tri du tableau
function trierTableau(colIndex) {
    const inventaire = JSON.parse(localStorage.getItem('inventaire')) || [];

    let sortKey;
    if (colIndex === 0) sortKey = 'nom';
    else if (colIndex === 1) sortKey = 'categorie';
    else if (colIndex === 2) sortKey = 'stock';
    else return;

    inventaire.sort((a, b) => {
        let valA = a[sortKey];
        let valB = b[sortKey];

        if (typeof valA === 'string') {
            return valA.localeCompare(valB) * sortDirection;
        } else {
            return (valA - valB) * sortDirection;
        }
    });

    sortDirection = -sortDirection; 

    localStorage.setItem('inventaire', JSON.stringify(inventaire));
    afficherInventaire();
}

// Fonction principale d'affichage (intègre le filtrage)
function afficherInventaire() {
    const tableBody = document.querySelector('#inventory-table tbody');
    tableBody.innerHTML = '';

    const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
    const filterStatus = document.getElementById('filter-status')?.value || 'all';

    let inventaire = JSON.parse(localStorage.getItem('inventaire')) || [];

    // 1. FILTRAGE
    const inventaireFiltre = inventaire.filter(produit => {
        const matchesSearch = produit.nom.toLowerCase().includes(searchTerm);
        
        const statut = getStatut(produit.stock).statutClass.replace('status-', '');
        const matchesStatus = filterStatus === 'all' || filterStatus === statut;

        return matchesSearch && matchesStatus;
    });

    // Mettre à jour nextId
    if (inventaire.length > 0) {
        nextId = Math.max(...inventaire.map(p => p.id)) + 1;
    }

    // 2. AFFICHAGE DES LIGNES FILTRÉES
    inventaireFiltre.forEach(produit => {
        const row = tableBody.insertRow();
        row.setAttribute('data-id', produit.id); 
        
        const { statutClass, statutText } = getStatut(produit.stock);

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

window.addEventListener('load', verifierAcces);

// Écouteurs pour le FILTRAGE et la RECHERCHE
document.getElementById('search-input')?.addEventListener('input', afficherInventaire);
document.getElementById('filter-status')?.addEventListener('change', afficherInventaire);

// Écouteurs pour le TRI (clic sur les entêtes de colonnes)
const tableHeader = document.querySelector('#inventory-table thead tr');
if (tableHeader) {
    tableHeader.querySelectorAll('th').forEach((th, index) => {
        if (index < 3) { // Tri sur Nom, Catégorie, Stock
            th.addEventListener('click', () => trierTableau(index));
        }
    });
}
