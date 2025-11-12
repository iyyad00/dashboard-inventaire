// ====================================================================
// 1. GESTION DES DONNÉES DE DÉPART (Simulacre de base de données)
// Ajout de l'email pour chaque entreprise
const USERS_AUTORISES = {
    "ENTR001": { motDePasse: "secret123", nom: "Société Alpha", email: "alpha@entreprise.ma" },
    "ENTR002": { motDePasse: "pass456", nom: "Atelier Beta", email: "beta@atelier.com" }
};

// Initialisation de l'inventaire dans le LocalStorage (si vide)
if (!localStorage.getItem('inventaire')) {
    const inventaireInitial = [
        { id: 1, nom: "Clavier Mécanique", categorie: "Bureau", stock: 25 },
        { id: 2, nom: "Lampe LED", categorie: "Éclairage", stock: 3 },
        { id: 3, nom: "Cartouche d'encre", categorie: "Consommable", stock: 0 }
    ];
    localStorage.setItem('inventaire', JSON.stringify(inventaireInitial));
}
let nextId = 4; // ID pour les nouveaux produits

// ====================================================================
// 2. LOGIQUE DE CONNEXION (login.html)
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
// 3. LOGIQUE DU TABLEAU DE BORD (index.html)
// ====================================================================

function verifierAcces() {
    if (!document.getElementById('inventory-table')) return;
    
    const code = localStorage.getItem('entrepriseCode');
    
    if (!code || !USERS_AUTORISES[code]) {
        window.location.href = 'login.html';
        return;
    }
    
    afficherInfoEntreprise(code); // Afficher le nom et l'email de l'entreprise
    afficherInventaire();
}

function afficherInfoEntreprise(code) {
    const infoDiv = document.getElementById('entreprise-info');
    const user = USERS_AUTORISES[code];
    infoDiv.innerHTML = `<h3>Bienvenue, ${user.nom}</h3>
                         <p>Code d'accès : <strong>${code}</strong></p>
                         <p>Email de contact : <strong>${user.email}</strong></p>
                         <button onclick="deconnexion()">Déconnexion</button>`;
}

function deconnexion() {
    localStorage.removeItem('entrepriseCode');
    window.location.href = 'login.html';
}

function afficherInventaire() {
    const tableBody = document.querySelector('#inventory-table tbody');
    tableBody.innerHTML = '';

    const inventaire = JSON.parse(localStorage.getItem('inventaire')) || [];
    if (inventaire.length > 0) {
        // Mettre à jour nextId pour éviter les doublons
        nextId = Math.max(...inventaire.map(p => p.id)) + 1;
    }


    inventaire.forEach(produit => {
        const row = tableBody.insertRow();
        row.setAttribute('data-id', produit.id); // Lier la ligne à l'ID du produit
        
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
        
        // Colonne d'Actions
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

// Nouvelle fonction: Modifier un produit (via une boîte de dialogue simple)
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

// Nouvelle fonction: Supprimer un produit
function supprimerProduit(id) {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce produit de l'inventaire ?")) {
        let inventaire = JSON.parse(localStorage.getItem('inventaire')) || [];
        const nouvelInventaire = inventaire.filter(p => p.id !== id);
        
        localStorage.setItem('inventaire', JSON.stringify(nouvelInventaire));
        afficherInventaire();
    }
}


// Ajout des écouteurs d'événements pour le tableau de bord (si présent)
const addProductForm = document.getElementById('add-product-form');
if (addProductForm) {
    addProductForm.addEventListener('submit', ajouterProduit);
    window.addEventListener('load', verifierAcces); 
} else {
    // Si ce n'est pas index.html, nous devons quand même vérifier la connexion au chargement (pour login.html)
    window.addEventListener('load', verifierAcces); 
}

// Si la page est index.html, on veut juste lancer la vérification et l'affichage (login.html fera la redirection)
if (document.getElementById('inventory-table')) {
    window.addEventListener('load', verifierAcces);
}
