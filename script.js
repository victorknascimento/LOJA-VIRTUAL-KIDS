/**
 * WONDER KIDS - Script Principal
 * Focado em apresentação (Demo Mode)
 */

// --- CONSTANTES ---
const CONSTANTS = {
    STORE_PHONE: "5585999195930", // Seu número para receber pedidos
    OPERATING_HOURS: {
        morning: { start: 8, end: 12 },
        afternoon: { start: 14, end: 18 },
    },
    // Imagem padrão caso alguma falhe
    PLACEHOLDER_IMG: "https://images.unsplash.com/photo-1519241047957-be31d7379a5d?q=80&w=800&auto=format&fit=crop"
};

// --- SERVIÇOS LOCAL STORAGE ---
const Storage = {
    get: (key, def) => {
        try {
            const val = localStorage.getItem(key);
            if (val) {
                const parsed = JSON.parse(val);
                if (Array.isArray(parsed) && parsed.length === 0) return def;
                return parsed;
            }
            return def;
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

// --- CATÁLOGO WONDER KIDS (Produtos da Segunda Imagem) ---
const DEMO_PRODUCTS = [
    {
        id: 'wk_new_01',
        name: 'Bermuda infantil masculina',
        category: 'Meninos',
        price: 59.90,
        imageUrl: 'https://images.unsplash.com/photo-1519238263496-6362d74c1123?q=80&w=600&auto=format&fit=crop', // Menino de short
        description: 'Bermuda jeans confortável e estilosa para o dia a dia.'
    },
    {
        id: 'wk_new_02',
        name: 'Macacão Bebê',
        category: 'Bebês',
        price: 45.90,
        imageUrl: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?q=80&w=600&auto=format&fit=crop', // Macacão bege
        description: 'Conforto total para o seu bebê com tecido macio.'
    },
    {
        id: 'wk_new_03',
        name: 'Moletom Feminino (Conjunto)',
        category: 'Meninas',
        price: 79.80,
        imageUrl: 'https://images.unsplash.com/photo-1610419864275-c9607386c12b?q=80&w=600&auto=format&fit=crop', // Conjunto rosa
        description: 'Conjunto de frio super quentinho e na moda.'
    },
    {
        id: 'wk_new_04',
        name: 'Sandália Colorida',
        category: 'Calçados',
        price: 49.90,
        imageUrl: 'https://images.unsplash.com/photo-1514989940723-e8875ea6ab7d?q=80&w=600&auto=format&fit=crop', // Sandália
        description: 'Sandália anatômica e colorida para combinar com tudo.'
    },
    {
        id: 'wk_new_05',
        name: 'Camiseta Dinossauro',
        category: 'Meninos',
        price: 39.90,
        imageUrl: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?q=80&w=600&auto=format&fit=crop', // Camisa dino
        description: 'Estampa divertida de dinossauros que eles amam.'
    },
    {
        id: 'wk_new_06',
        name: 'Vestido Floral Infantil',
        category: 'Meninas',
        price: 89.90,
        imageUrl: 'https://images.unsplash.com/photo-1621452773781-0f992ee6191a?q=80&w=600&auto=format&fit=crop', // Vestido floral
        description: 'Elegância e leveza para os dias de sol.'
    },
    {
        id: 'wk_new_07',
        name: 'Bermuda Jeans',
        category: 'Meninos',
        price: 79.90,
        imageUrl: 'https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?q=80&w=600&auto=format&fit=crop',
        description: 'Jeans premium com ajuste na cintura.'
    },
    {
        id: 'wk_new_08',
        name: 'Conjunto Verão Menina',
        category: 'Meninas',
        price: 69.90,
        imageUrl: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?q=80&w=600&auto=format&fit=crop',
        description: 'Para brincar com liberdade e frescor.'
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

        // FORÇAR ATUALIZAÇÃO DOS PRODUTOS DEMO
        // Isso garante que as fotos antigas sejam substituídas pelas novas da lista acima
        console.log("Forçando atualização do catálogo Demo...");
        state.products = DEMO_PRODUCTS;
        Storage.set('products', DEMO_PRODUCTS);

        app.renderHome();

        // Verificar horário
        app.checkStoreStatus();
        setInterval(app.checkStoreStatus, 60000);

        // Renderizar inicial
        app.updateHeader();
        app.router('home');
    },

    // --- ROTEAMENTO ---
    router: (viewName) => {
        // Esconde todas as views
        document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));
        
        // Proteção de rotas
        if ((viewName === 'checkout' || viewName === 'admin') && !state.currentUser) {
            return app.router('login');
        }
        if (viewName === 'admin' && state.currentUser.role !== 'ADMIN') {
            return app.router('home');
        }

        // Mostra a view alvo
        const target = document.getElementById(`view-${viewName}`);
        if (target) {
            target.classList.remove('hidden');
            window.scrollTo(0, 0);
        }

        // Lógica específica de cada tela
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
        // Lógica simples: Aberto das 8h às 12h E das 14h às 18h
        state.isStoreOpen = (hour >= morning.start && hour < morning.end) || 
                           (hour >= afternoon.start && hour < afternoon.end);
        
        // Atualiza visualmente o badge
        const badges = document.querySelectorAll('.status-badge');
        badges.forEach(badge => {
            const label = badge.querySelector('.status-text-label');
            if(state.isStoreOpen) {
                badge.classList.remove('closed');
                badge.classList.add('open');
                if(label) label.innerText = 'Loja Aberta';
            } else {
                badge.classList.remove('open');
                badge.classList.add('closed');
                if(label) label.innerText = 'Fechado';
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

    // --- AUTENTICAÇÃO ---
    handleLogin: (e) => {
        e.preventDefault();
        const phoneInput = document.getElementById('login-phone').value;
        const phone = phoneInput.replace(/\D/g,''); // Remove não-números
        
        // Login facilitado para Admin
        if(phone === '123' || phone === '5585999195930') {
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
            err.innerText = 'Usuário não encontrado. Admin use: 5585999195930';
            err.classList.remove('hidden');
        }
    },

    handleRegister: (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const phone = document.getElementById('reg-phone').value.replace(/\D/g,'');

        if (state.users.some(u => u.phone === phone)) {
            const err = document.getElementById('register-error');
            err.classList.remove('hidden');
            err.innerText = 'Este telefone já possui cadastro.';
            return;
        }

        const newUser = { id: Date.now().toString(), name, phone, role: 'CUSTOMER' };
        state.users.push(newUser);
        Storage.set('users', state.users);
        
        alert('Cadastro realizado com sucesso!');
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

    // --- RENDERIZAÇÃO DA HOME ---
    renderHome: () => {
        const grid = document.getElementById('products-grid');
        const loadingEl = document.getElementById('loading-products');
        if(loadingEl) loadingEl.style.display = 'none';
        
        if (!state.products || state.products.length === 0) {
            grid.innerHTML = '<p class="text-center" style="grid-column:1/-1; padding: 2rem;">Carregando catálogo...</p>';
            return;
        }

        grid.innerHTML = state.products.map(p => `
            <div class="product-card">
                <img src="${p.imageUrl}" alt="${p.name}" loading="lazy"
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

    // --- CARRINHO ---
    addToCart: (id) => {
        // Alerta suave se a loja estiver fechada, mas permite adicionar
        if (!state.isStoreOpen) {
            const { morning, afternoon } = CONSTANTS.OPERATING_HOURS;
            alert(`A loja está fechada no momento.\nVocê pode montar o pedido, mas só responderemos no horário:\n${morning.start}h-${morning.end}h ou ${afternoon.start}h-${afternoon.end}h.`);
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

    // --- CHECKOUT ---
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
        
        // Reset form
        document.getElementById('prod-id').value = '';
        document.getElementById('prod-name').value = '';
        document.getElementById('prod-price').value = '';
        document.getElementById('prod-image-url').value = '';
        document.getElementById('prod-image-file').value = '';
        document.getElementById('prod-desc').value = '';
        preview.classList.remove('visible');

        // Se for edição
        if (productId) {
            let product = state.products.find(p => p.id === productId);
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

        // Se o usuário selecionou arquivo (Só funciona no dispositivo dele)
        if (fileInput) {
            try {
                imageUrl = await Utils.fileToBase64(fileInput);
            } catch(err) {
                console.error("Erro no arquivo", err);
            }
        }

        const productData = {
            id: id || Date.now().toString(),
            name, category, price, description: desc, imageUrl
        };
        
        // Salvar no LocalStorage
        if (id) {
            const idx = state.products.findIndex(p => p.id === id);
            if(idx >= 0) state.products[idx] = productData;
        } else {
            state.products.push(productData);
        }
        
        Storage.set('products', state.products);
        
        document.getElementById('modal-product').classList.add('hidden');
        app.renderHome();
        app.renderAdminProducts();
        app.showToast("Produto salvo (Localmente)!");
    },

    deleteProduct: (id) => {
        if(confirm("Remover este produto?")) {
            state.products = state.products.filter(p => p.id !== id);
            Storage.set('products', state.products);
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

// Iniciar Aplicação
document.addEventListener('DOMContentLoaded', app.init);