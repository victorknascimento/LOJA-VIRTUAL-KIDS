/**
 * WONDER KIDS - Integração Híbrida (Demo + LocalStorage + Firebase)
 */

// --- 1. CONFIGURAÇÃO DO FIREBASE ---
const firebaseConfig = {
    apiKey: "SUA_API_KEY_AQUI", 
    authDomain: "wonder-kids.firebaseapp.com",
    projectId: "wonder-kids",
    storageBucket: "wonder-kids.appspot.com",
    messagingSenderId: "00000000000",
    appId: "1:00000000000:web:0000000000000"
};

// Verifica se está configurado
const isFirebaseConfigured = firebaseConfig.apiKey !== "SUA_API_KEY_AQUI";

// Inicializar Firebase apenas se configurado
let db = null;
if (isFirebaseConfigured && typeof firebase !== 'undefined') {
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    else firebase.app();
    db = firebase.firestore();
}

// --- CONSTANTES ---
const CONSTANTS = {
    STORE_PHONE: "5585999195930", // Seu número
    OPERATING_HOURS: {
        morning: { start: 8, end: 12 },
        afternoon: { start: 14, end: 18 },
    },
    PLACEHOLDER_IMG: "https://images.unsplash.com/photo-1519241047957-be31d7379a5d?q=80&w=800&auto=format&fit=crop"
};

// --- SERVIÇOS LOCAL STORAGE ---
const Storage = {
    get: (key, def) => {
        try {
            const val = localStorage.getItem(key);
            return val ? JSON.parse(val) : def;
        } catch (e) { return def; }
    },
    set: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
};

// --- ESTADO DA APLICAÇÃO ---
const state = {
    currentUser: null,
    products: [],
    cart: [],
    users: [],
    orders: [],
    isStoreOpen: true 
};

// --- PRODUTOS DE DEMONSTRAÇÃO (Para LinkedIn/Portfólio) ---
const DEMO_PRODUCTS = [
    {
        id: 'demo_1',
        name: 'Vestido Floral de Verão',
        category: 'Meninas',
        price: 89.90,
        imageUrl: 'https://images.unsplash.com/photo-1621452773781-0f992ee6191a?q=80&w=800&auto=format&fit=crop',
        description: 'Vestido leve e confortável para os dias quentes.'
    },
    {
        id: 'demo_2',
        name: 'Conjunto Aventura Dino',
        category: 'Meninos',
        price: 65.50,
        imageUrl: 'https://images.unsplash.com/photo-1519238263496-6362d74c1123?q=80&w=800&auto=format&fit=crop',
        description: 'Camiseta e bermuda temáticos.'
    },
    {
        id: 'demo_3',
        name: 'Jaqueta Jeans Kids',
        category: 'Meninas',
        price: 120.00,
        imageUrl: 'https://images.unsplash.com/photo-1604467794349-0b74285de7e7?q=80&w=800&auto=format&fit=crop',
        description: 'Estilo e proteção contra o vento.'
    },
    {
        id: 'demo_4',
        name: 'Tênis Colorido Confort',
        category: 'Calçados',
        price: 99.90,
        imageUrl: 'https://images.unsplash.com/photo-1514989940723-e8875ea6ab7d?q=80&w=800&auto=format&fit=crop',
        description: 'Ideal para brincar o dia todo.'
    },
    {
        id: 'demo_5',
        name: 'Macacão Bebê Urso',
        category: 'Bebês',
        price: 75.00,
        imageUrl: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?q=80&w=800&auto=format&fit=crop',
        description: 'Tecido 100% algodão hipoalergênico.'
    },
    {
        id: 'demo_6',
        name: 'Boné Estilo Urbano',
        category: 'Meninos',
        price: 35.00,
        imageUrl: 'https://images.unsplash.com/photo-1544778393-010e9f02377b?q=80&w=800&auto=format&fit=crop',
        description: 'Proteção solar com muito estilo.'
    }
];

// --- LÓGICA PRINCIPAL ---
const app = {
    init: () => {
        // Carregar Usuários Locais
        state.users = Storage.get('users', []);
        if (state.users.length === 0) {
            state.users.push({ id: 'admin001', name: 'Admin', phone: '5585999195930', role: 'ADMIN' });
            Storage.set('users', state.users);
        }

        // Recuperar Sessão e Carrinho
        state.cart = Storage.get('cart', []);
        const sessionUser = sessionStorage.getItem('currentUser');
        if (sessionUser) {
            state.currentUser = JSON.parse(sessionUser);
        }

        // Carregar produtos
        app.loadProducts();

        // Verificar horário
        app.checkStoreStatus();
        setInterval(app.checkStoreStatus, 60000);

        // Renderizar inicial
        app.updateHeader();
        app.router('home');
    },

    loadProducts: () => {
        const loadingEl = document.getElementById('loading-products');
        
        // 1. Prioridade: Se Firebase estiver configurado E funcionando
        if (isFirebaseConfigured && db) {
            db.collection("products").onSnapshot((querySnapshot) => {
                state.products = [];
                querySnapshot.forEach((doc) => {
                    state.products.push({ id: doc.id, ...doc.data() });
                });
                if (state.products.length === 0) state.products = DEMO_PRODUCTS;
                
                if(loadingEl) loadingEl.style.display = 'none';
                app.renderHome();
                if(!document.getElementById('view-admin').classList.contains('hidden')) app.renderAdminProducts();
            }, (error) => {
                console.error("Erro Firebase, fallback local:", error);
                app.loadLocalOrDemo(loadingEl);
            });
        } else {
            // 2. Fallback: LocalStorage ou Demo
            app.loadLocalOrDemo(loadingEl);
        }
    },

    loadLocalOrDemo: (loadingEl) => {
        // Tenta pegar do LocalStorage primeiro (para salvar edições do admin)
        const localProducts = Storage.get('products', null);
        
        if (localProducts && localProducts.length > 0) {
            console.log("Carregando produtos salvos localmente.");
            state.products = localProducts;
        } else {
            console.log("Nenhum produto salvo. Carregando Demo.");
            state.products = DEMO_PRODUCTS;
            // Salva o demo no localstorage para permitir edições futuras
            Storage.set('products', DEMO_PRODUCTS);
        }

        if(loadingEl) loadingEl.style.display = 'none';
        app.renderHome();
        if(!document.getElementById('view-admin').classList.contains('hidden')) app.renderAdminProducts();
    },

    // --- ROTEAMENTO ---
    router: (viewName) => {
        document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));
        
        if ((viewName === 'checkout' || viewName === 'admin') && !state.currentUser) {
            return app.router('login');
        }
        if (viewName === 'admin' && state.currentUser.role !== 'ADMIN') {
            return app.router('home');
        }

        const target = document.getElementById(`view-${viewName}`);
        if (target) {
            target.classList.remove('hidden');
            window.scrollTo(0, 0);
        }

        if (viewName === 'home') app.renderHome();
        if (viewName === 'cart') app.renderCart();
        if (viewName === 'checkout') app.renderCheckout();
        if (viewName === 'admin') {
            app.renderAdminProducts();
            app.switchAdminTab('products');
        }
    },

    checkStoreStatus: () => {
        const now = new Date();
        const hour = now.getHours();
        const { morning, afternoon } = CONSTANTS.OPERATING_HOURS;
        state.isStoreOpen = (hour >= morning.start && hour < morning.end) || 
                           (hour >= afternoon.start && hour < afternoon.end);
        
        const badges = document.querySelectorAll('.status-badge');
        badges.forEach(badge => {
            if(state.isStoreOpen) {
                badge.classList.remove('closed');
                badge.classList.add('open');
                badge.querySelector('.status-text-label').innerText = 'Loja Aberta';
            } else {
                badge.classList.remove('open');
                badge.classList.add('closed');
                badge.querySelector('.status-text-label').innerText = 'Fechado';
            }
        });
    },

    showToast: (message) => {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.innerText = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    },

    // --- AUTH ---
    handleLogin: (e) => {
        e.preventDefault();
        const phone = document.getElementById('login-phone').value.replace(/\D/g,'');
        if(phone === '123') {
            state.currentUser = state.users.find(u => u.role === 'ADMIN');
        } else {
            state.currentUser = state.users.find(u => u.phone === phone);
        }
        
        if (state.currentUser) {
            sessionStorage.setItem('currentUser', JSON.stringify(state.currentUser));
            app.updateHeader();
            app.router('home');
        } else {
            const err = document.getElementById('login-error');
            err.innerText = 'Usuário não encontrado. Use "5585999195930" para Admin.';
            err.classList.remove('hidden');
        }
    },

    handleRegister: (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const phone = document.getElementById('reg-phone').value.replace(/\D/g,'');

        if (state.users.some(u => u.phone === phone)) {
            document.getElementById('register-error').classList.remove('hidden');
            document.getElementById('register-error').innerText = 'Telefone já cadastrado.';
            return;
        }

        const newUser = { id: Date.now().toString(), name, phone, role: 'CUSTOMER' };
        state.users.push(newUser);
        Storage.set('users', state.users);
        
        alert('Cadastro realizado! Faça login.');
        app.router('login');
    },

    logout: () => {
        state.currentUser = null;
        sessionStorage.removeItem('currentUser');
        app.updateHeader();
        app.router('home');
    },

    updateHeader: () => {
        const loginBtn = document.getElementById('btn-login-nav');
        const userArea = document.getElementById('user-logged-in');
        const userNameDisplay = document.getElementById('user-name-display');
        const navAdmin = document.getElementById('nav-admin');
        const cartCount = document.getElementById('cart-count');

        if (state.currentUser) {
            loginBtn.classList.add('hidden');
            userArea.classList.remove('hidden');
            userNameDisplay.innerText = state.currentUser.name.split(' ')[0];
            
            if (state.currentUser.role === 'ADMIN') navAdmin.classList.remove('hidden');
            else navAdmin.classList.add('hidden');
        } else {
            loginBtn.classList.remove('hidden');
            userArea.classList.add('hidden');
            navAdmin.classList.add('hidden');
        }

        const totalItems = state.cart.reduce((acc, item) => acc + item.quantity, 0);
        cartCount.innerText = totalItems;
        if (totalItems > 0) cartCount.classList.remove('hidden');
        else cartCount.classList.add('hidden');
    },

    // --- RENDER ---
    renderHome: () => {
        const grid = document.getElementById('products-grid');
        
        if (!state.products || state.products.length === 0) {
            grid.innerHTML = '<p class="text-center" style="grid-column:1/-1">Nenhum produto disponível.</p>';
            return;
        }

        grid.innerHTML = state.products.map(p => `
            <div class="product-card">
                <img src="${p.imageUrl}" alt="${p.name}" 
                     onerror="this.onerror=null;this.src='${CONSTANTS.PLACEHOLDER_IMG}';">
                <div class="card-body">
                    <h3>${p.name}</h3>
                    <div class="card-footer">
                        <span class="price">R$ ${parseFloat(p.price).toFixed(2).replace('.', ',')}</span>
                        <button class="btn-primary" onclick="app.addToCart('${p.id}')">
                            Adicionar
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    },

    addToCart: (id) => {
        if (!state.isStoreOpen) {
            const { morning, afternoon } = CONSTANTS.OPERATING_HOURS;
            alert(`Atenção: A loja está fechada agora.\nSeus pedidos serão processados no próximo horário:\n${morning.start}h-${morning.end}h ou ${afternoon.start}h-${afternoon.end}h.`);
        }

        const product = state.products.find(p => p.id === id);
        if(!product) return;

        const existing = state.cart.find(item => item.id === id);
        if (existing) {
            existing.quantity++;
        } else {
            state.cart.push({ ...product, price: parseFloat(product.price), quantity: 1 });
        }
        
        Storage.set('cart', state.cart);
        app.updateHeader();
        app.showToast('Produto adicionado ao carrinho!');
    },

    renderCart: () => {
        const container = document.getElementById('cart-items-container');
        const summary = document.getElementById('cart-summary');
        
        if (state.cart.length === 0) {
            container.innerHTML = '<p class="text-center" style="padding:2rem;">Seu carrinho está vazio.</p>';
            summary.classList.add('hidden');
            return;
        }

        summary.classList.remove('hidden');
        container.innerHTML = state.cart.map(item => `
            <div class="cart-item">
                <div style="display:flex; align-items:center;">
                    <img src="${item.imageUrl}" alt="${item.name}" 
                         style="width:60px; height:60px; object-fit:cover; border-radius:4px; margin-right:1rem;"
                         onerror="this.src='${CONSTANTS.PLACEHOLDER_IMG}'">
                    <div class="cart-info">
                        <strong>${item.name}</strong><br>
                        <small>R$ ${item.price.toFixed(2).replace('.', ',')}</small>
                    </div>
                </div>
                <div class="cart-actions">
                    <input type="number" class="qty-input" min="1" value="${item.quantity}" 
                        onchange="app.updateCartQty('${item.id}', this.value)">
                    <span style="min-width:70px; text-align:right;">R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                    <button class="btn-remove" onclick="app.removeFromCart('${item.id}')">
                        <span class="material-icons">delete</span>
                    </button>
                </div>
            </div>
        `).join('');

        const total = state.cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        document.getElementById('cart-total').innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
    },

    updateCartQty: (id, qty) => {
        const val = parseInt(qty);
        if (val < 1) return app.removeFromCart(id);
        const item = state.cart.find(i => i.id === id);
        if (item) item.quantity = val;
        Storage.set('cart', state.cart);
        app.renderCart();
        app.updateHeader();
    },

    removeFromCart: (id) => {
        state.cart = state.cart.filter(i => i.id !== id);
        Storage.set('cart', state.cart);
        app.renderCart();
        app.updateHeader();
    },

    renderCheckout: () => {
        const summaryDiv = document.getElementById('checkout-summary');
        const total = state.cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        summaryDiv.innerHTML = state.cart.map(item => `
            <div class="flex-between" style="margin-bottom:0.5rem; font-size:0.9rem;">
                <span>${item.quantity}x ${item.name}</span>
                <span>R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
            </div>
        `).join('') + `
        <div class="flex-between" style="border-top:1px solid #ccc; margin-top:1rem; padding-top:1rem; font-weight:bold;">
            <span>Total</span>
            <span>R$ ${total.toFixed(2).replace('.', ',')}</span>
        </div>`;
    },

    handleCheckout: async (e) => {
        e.preventDefault();
        const street = document.getElementById('addr-street').value;
        const city = document.getElementById('addr-city').value;
        const total = state.cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        if (isFirebaseConfigured && db) {
            try {
                await db.collection("orders").add({
                    userId: state.currentUser.id,
                    customer: state.currentUser.name,
                    phone: state.currentUser.phone,
                    items: state.cart,
                    total: total,
                    address: `${street}, ${city}`,
                    timestamp: new Date().toISOString()
                });
            } catch(e) { console.log("Erro ao salvar pedido (modo demo?)", e); }
        }

        const itemsText = state.cart.map(i => `${i.quantity}x ${i.name}`).join('%0A');
        const msg = `*NOVO PEDIDO - WONDER KIDS*%0A%0A${itemsText}%0A%0A*Total: R$ ${total.toFixed(2)}*%0A%0A📍 Endereço:%0A${street}, ${city}%0A%0A👤 Cliente: ${state.currentUser.name}`;
        
        window.open(`https://wa.me/${CONSTANTS.STORE_PHONE}?text=${msg}`, '_blank');

        state.cart = [];
        Storage.set('cart', []);
        app.updateHeader();
        app.router('confirmation');
    },

    // --- ADMIN ---
    switchAdminTab: (tab) => {
        document.querySelectorAll('.admin-section').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.btn-tab').forEach(el => el.classList.remove('active'));
        
        document.getElementById(`admin-tab-${tab}`).classList.remove('hidden');
        const tabs = ['products', 'orders', 'users', 'reports'];
        const idx = tabs.indexOf(tab);
        if (idx >= 0) document.querySelectorAll('.btn-tab')[idx].classList.add('active');
    },

    renderAdminProducts: () => {
        const tbody = document.getElementById('admin-products-list');
        tbody.innerHTML = state.products.map(p => `
            <tr>
                <td><img src="${p.imageUrl}" alt="img" onerror="this.src='${CONSTANTS.PLACEHOLDER_IMG}'"></td>
                <td>${p.name}</td>
                <td>R$ ${parseFloat(p.price).toFixed(2)}</td>
                <td>
                    <button class="btn-text-light" style="color:blue;" onclick="app.openProductModal('${p.id}')">Editar</button>
                    <button class="btn-text-light" style="color:red;" onclick="app.deleteProduct('${p.id}')">Excluir</button>
                </td>
            </tr>
        `).join('');
    },

    openProductModal: (productId = null) => {
        const modal = document.getElementById('modal-product');
        modal.classList.remove('hidden');
        const preview = document.getElementById('prod-image-preview');
        
        document.getElementById('prod-id').value = '';
        document.getElementById('prod-name').value = '';
        document.getElementById('prod-price').value = '';
        document.getElementById('prod-image-url').value = '';
        document.getElementById('prod-image-file').value = '';
        document.getElementById('prod-desc').value = '';
        preview.classList.remove('visible');

        if (productId) {
            let product = state.products.find(p => p.id === productId);
            if (typeof productId === 'object') product = productId;

            if (product) {
                document.getElementById('prod-id').value = product.id;
                document.getElementById('prod-name').value = product.name;
                document.getElementById('prod-price').value = product.price;
                document.getElementById('prod-category').value = product.category;
                document.getElementById('prod-desc').value = product.description || '';
                
                if (product.imageUrl) {
                    document.getElementById('prod-image-url').value = product.imageUrl;
                    document.getElementById('prod-image-current').value = product.imageUrl;
                    preview.src = product.imageUrl;
                    preview.classList.add('visible');
                }
            }
        }
    },

    handleSaveProduct: async (e) => {
        e.preventDefault();
        const id = document.getElementById('prod-id').value;
        const name = document.getElementById('prod-name').value;
        const category = document.getElementById('prod-category').value;
        const price = document.getElementById('prod-price').value;
        const desc = document.getElementById('prod-desc').value;
        const urlInput = document.getElementById('prod-image-url').value;
        const fileInput = document.getElementById('prod-image-file').files[0];
        
        let imageUrl = urlInput || document.getElementById('prod-image-current').value || CONSTANTS.PLACEHOLDER_IMG;

        // Se tiver arquivo (Base64) - Aviso: Isso enche o LocalStorage rápido
        if (fileInput) {
            try {
                imageUrl = await Utils.fileToBase64(fileInput);
            } catch(err) {
                console.error("Erro arquivo", err);
            }
        }

        const productData = {
            id: id || Date.now().toString(),
            name, category, price, description: desc, imageUrl
        };

        // Salvar Lógica (Híbrida)
        if (isFirebaseConfigured && db) {
            // Salvar no Firebase
            // ...
        } 
        
        // SEMPRE Salvar no LocalStorage (Modo Demo Persistente)
        if (id) {
            const idx = state.products.findIndex(p => p.id === id);
            if(idx >= 0) state.products[idx] = productData;
        } else {
            state.products.push(productData);
        }
        
        // Persistir
        Storage.set('products', state.products);
        
        document.getElementById('modal-product').classList.add('hidden');
        app.renderHome();
        app.renderAdminProducts();
        app.showToast("Produto salvo (Localmente)!");
    },

    deleteProduct: (id) => {
        if(confirm("Remover este produto?")) {
            state.products = state.products.filter(p => p.id !== id);
            Storage.set('products', state.products); // Salvar remoção
            app.renderHome();
            app.renderAdminProducts();
        }
    },
    
    exportUsersToExcel: () => {
        const headers = ['Nome', 'Telefone', 'Perfil', 'ID'];
        const rows = state.users.map(u => [u.name, u.phone, u.role, u.id]);
        let csvContent = '\uFEFF' + headers.join(';') + '\n';
        rows.forEach(row => { csvContent += row.join(';') + '\n'; });
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `clientes_wonderkids.csv`;
        link.click();
    }
};

// Utils para conversão de arquivo
const Utils = {
    fileToBase64: (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    })
};

// Iniciar
document.addEventListener('DOMContentLoaded', app.init);