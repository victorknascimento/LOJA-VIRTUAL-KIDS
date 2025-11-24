/**
 * JUJU KIDS - Vanilla JS Implementation
 * Lógica consolidada para rodar sem build tools
 */

// --- CONSTANTES ---
const CONSTANTS = {
    STORE_PHONE: "5585999195930",
    OPERATING_HOURS: {
        morning: { start: 8, end: 12 },
        afternoon: { start: 14, end: 18 },
    },
    // ATENÇÃO: Para atualizar os produtos para TODOS os clientes,
    // você deve alterar esta lista abaixo manualmente ou usar o gerador no Admin.
    INITIAL_PRODUCTS: [
        { id: '1', name: 'Conjunto Verão Menina', description: '100% algodão.', price: 89.90, imageUrl: 'https://picsum.photos/seed/prod1/400/400', category: 'Meninas' },
        { id: '2', name: 'Vestido Floral Infantil', description: 'Vestido rodado.', price: 129.90, imageUrl: 'https://picsum.photos/seed/prod2/400/400', category: 'Meninas' },
        { id: '3', name: 'Camiseta Dinossauro', description: 'Brilha no escuro.', price: 59.90, imageUrl: 'https://picsum.photos/seed/prod3/400/400', category: 'Meninos' },
        { id: '4', name: 'Bermuda Jeans', description: 'Lavagem moderna.', price: 79.90, imageUrl: 'https://picsum.photos/seed/prod4/400/400', category: 'Meninos' },
        { id: '5', name: 'Macacão Bebê', description: 'Malha suave.', price: 69.90, imageUrl: 'https://picsum.photos/seed/prod5/400/400', category: 'Bebês' },
        { id: '6', name: 'Sandália Colorida', description: 'Divertida.', price: 49.90, imageUrl: 'https://picsum.photos/seed/prod6/400/400', category: 'Calçados' },
        { id: '7', name: 'Conjunto Moletom', description: 'Flanelado.', price: 149.90, imageUrl: 'https://picsum.photos/seed/prod7/400/400', category: 'Meninos' },
        { id: '8', name: 'Legging Unicórnio', description: 'Confortável.', price: 45.90, imageUrl: 'https://picsum.photos/seed/prod8/400/400', category: 'Meninas' }
    ]
};

// --- ESTADO DA APLICAÇÃO ---
const state = {
    currentUser: null,
    products: [],
    cart: [],
    users: [],
    orders: [],
    isStoreOpen: false
};

// --- SERVIÇOS LOCAL STORAGE ---
const Storage = {
    get: (key, def) => {
        const val = localStorage.getItem(key);
        return val ? JSON.parse(val) : def;
    },
    set: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
};

// --- UTILITÁRIOS ---
const Utils = {
    // Converte arquivo para Base64
    fileToBase64: (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }
};

// --- LÓGICA PRINCIPAL ---
const app = {
    init: () => {
        // Carregar dados
        state.users = Storage.get('users', []);
        if (state.users.length === 0) {
            state.users.push({ id: 'admin001', name: 'Admin', phone: '5585999195930', role: 'ADMIN' });
            Storage.set('users', state.users);
        }

        // Carrega produtos. Se o LocalStorage estiver vazio ou diferente do código, prioriza o código para garantir consistência em updates
        // Mas permite edições locais.
        const storedProducts = Storage.get('products', []);
        if (storedProducts.length === 0) {
            state.products = CONSTANTS.INITIAL_PRODUCTS;
            Storage.set('products', state.products);
        } else {
            state.products = storedProducts;
        }

        state.cart = Storage.get('cart', []);
        state.orders = Storage.get('orders', []);

        // Verificar sessão
        const sessionUser = sessionStorage.getItem('currentUser');
        if (sessionUser) {
            state.currentUser = JSON.parse(sessionUser);
        }

        // Verificar horário
        app.checkStoreStatus();
        setInterval(app.checkStoreStatus, 60000);

        // Renderizar inicial
        app.updateHeader();
        app.router('home');
    },

    // --- ROTEAMENTO SIMPLES ---
    router: (viewName) => {
        // Esconder todas as views
        document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));
        
        // Proteção de rotas
        if ((viewName === 'checkout' || viewName === 'admin') && !state.currentUser) {
            return app.router('login');
        }
        if (viewName === 'admin' && state.currentUser.role !== 'ADMIN') {
            return app.router('home');
        }

        // Mostrar view atual
        const target = document.getElementById(`view-${viewName}`);
        if (target) {
            target.classList.remove('hidden');
            window.scrollTo(0, 0);
        }

        // Lógica específica da view ao carregar
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
        
        // Atualiza apenas o estado interno
        state.isStoreOpen = (hour >= morning.start && hour < morning.end) || 
                           (hour >= afternoon.start && hour < afternoon.end);
    },

    // --- NOTIFICAÇÃO TOAST ---
    showToast: (message) => {
        const toast = document.getElementById('toast');
        if (!toast) return;

        toast.innerText = message;
        toast.classList.add('show');

        // Remove após 3 segundos
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    },

    // --- AUTH ---
    handleLogin: (e) => {
        e.preventDefault();
        const phone = document.getElementById('login-phone').value;
        const user = state.users.find(u => u.phone === phone);
        
        if (user) {
            state.currentUser = user;
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            app.updateHeader();
            app.router('home');
        } else {
            const err = document.getElementById('login-error');
            err.innerText = 'Telefone não encontrado.';
            err.classList.remove('hidden');
        }
    },

    handleRegister: (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const phone = document.getElementById('reg-phone').value;

        if (state.users.some(u => u.phone === phone)) {
            const err = document.getElementById('register-error');
            err.innerText = 'Telefone já cadastrado.';
            err.classList.remove('hidden');
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
            
            if (state.currentUser.role === 'ADMIN') {
                navAdmin.classList.remove('hidden');
            } else {
                navAdmin.classList.add('hidden');
            }
        } else {
            loginBtn.classList.remove('hidden');
            userArea.classList.add('hidden');
            navAdmin.classList.add('hidden');
        }

        // Atualizar Carrinho
        const totalItems = state.cart.reduce((acc, item) => acc + item.quantity, 0);
        cartCount.innerText = totalItems;
        if (totalItems > 0) cartCount.classList.remove('hidden');
        else cartCount.classList.add('hidden');
    },

    // --- HOME & PRODUTOS ---
    renderHome: () => {
        const grid = document.getElementById('products-grid');
        
        grid.innerHTML = state.products.map(p => `
            <div class="product-card">
                <img src="${p.imageUrl}" alt="${p.name}" loading="lazy">
                <div class="card-body">
                    <h3>${p.name}</h3>
                    <div class="card-footer">
                        <span class="price">R$ ${p.price.toFixed(2).replace('.', ',')}</span>
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
        if (!state.isStoreOpen) {
            const { morning, afternoon } = CONSTANTS.OPERATING_HOURS;
            alert(`A LOJA ESTÁ FECHADA AGORA!\n\nAtendimento:\n${morning.start}h às ${morning.end}h\n${afternoon.start}h às ${afternoon.end}h\n\nAguardamos você!`);
        }

        // Permite adicionar mesmo fechado, mas avisa
        const product = state.products.find(p => p.id === id);
        const existing = state.cart.find(item => item.id === id);
        
        if (existing) {
            existing.quantity++;
        } else {
            state.cart.push({ ...product, quantity: 1 });
        }
        
        Storage.set('cart', state.cart);
        app.updateHeader();
        app.showToast('Produto adicionado ao carrinho!');
    },

    renderCart: () => {
        const container = document.getElementById('cart-items-container');
        const summary = document.getElementById('cart-summary');
        
        if (state.cart.length === 0) {
            container.innerHTML = '<p class="text-center">Seu carrinho está vazio.</p>';
            summary.classList.add('hidden');
            return;
        }

        summary.classList.remove('hidden');
        container.innerHTML = state.cart.map(item => `
            <div class="cart-item">
                <div style="display:flex; align-items:center;">
                    <img src="${item.imageUrl}" alt="${item.name}">
                    <div class="cart-info">
                        <strong>${item.name}</strong><br>
                        <small>R$ ${item.price.toFixed(2).replace('.', ',')}</small>
                    </div>
                </div>
                <div class="cart-actions">
                    <input type="number" class="qty-input" min="1" value="${item.quantity}" 
                        onchange="app.updateCartQty('${item.id}', this.value)">
                    <span>R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                    <button class="btn-remove" onclick="app.removeFromCart('${item.id}')">X</button>
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
        </div>
        `;
    },

    handleCheckout: (e) => {
        e.preventDefault();
        const street = document.getElementById('addr-street').value;
        const city = document.getElementById('addr-city').value;
        const zip = document.getElementById('addr-zip').value;
        const total = state.cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        // Salvar pedido
        const order = {
            id: Date.now().toString(),
            userId: state.currentUser.id,
            customerName: state.currentUser.name,
            customerPhone: state.currentUser.phone,
            items: [...state.cart],
            total,
            address: { street, city, zip },
            timestamp: new Date().toISOString()
        };
        state.orders.push(order);
        Storage.set('orders', state.orders);

        // WhatsApp Link
        const itemsText = state.cart.map(i => `${i.quantity}x ${i.name}`).join('%0A');
        const msg = `Olá! Novo pedido:%0A%0A${itemsText}%0A%0ATotal: R$ ${total.toFixed(2)}%0A%0AEntregar em:%0A${street}, ${city}%0A%0ACliente: ${state.currentUser.name}`;
        window.open(`https://wa.me/${CONSTANTS.STORE_PHONE}?text=${msg}`, '_blank');

        // Limpar e Redirecionar
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
        
        const buttons = document.querySelectorAll('.btn-tab');
        if(tab === 'products') buttons[0].classList.add('active');
        if(tab === 'orders') {
            buttons[1].classList.add('active');
            app.renderAdminOrders();
        }
        if(tab === 'users') {
            buttons[2].classList.add('active');
            app.renderAdminUsers();
        }
        if(tab === 'reports') buttons[3].classList.add('active');
    },

    renderAdminProducts: () => {
        const tbody = document.getElementById('admin-products-list');
        tbody.innerHTML = state.products.map(p => `
            <tr>
                <td><img src="${p.imageUrl}" alt="img"></td>
                <td>${p.name}</td>
                <td>R$ ${p.price.toFixed(2)}</td>
                <td>
                    <button class="btn-text-light" style="color:blue;" onclick="app.editProduct('${p.id}')">Editar</button>
                    <button class="btn-text-light" style="color:red;" onclick="app.deleteProduct('${p.id}')">Excluir</button>
                </td>
            </tr>
        `).join('');
    },

    openProductModal: (product = null) => {
        const modal = document.getElementById('modal-product');
        modal.classList.remove('hidden');
        const preview = document.getElementById('prod-image-preview');
        const fileInput = document.getElementById('prod-image-file');
        const urlInput = document.getElementById('prod-image-url');
        
        fileInput.value = '';
        urlInput.value = '';

        if (product) {
            document.getElementById('prod-id').value = product.id;
            document.getElementById('prod-name').value = product.name;
            document.getElementById('prod-category').value = product.category;
            document.getElementById('prod-price').value = product.price;
            document.getElementById('prod-desc').value = product.description;
            
            document.getElementById('prod-image-current').value = product.imageUrl;
            if (product.imageUrl.startsWith('http')) {
                urlInput.value = product.imageUrl;
            }
            preview.src = product.imageUrl;
            preview.classList.add('visible');
        } else {
            document.getElementById('prod-id').value = '';
            document.getElementById('prod-name').value = '';
            document.getElementById('prod-category').value = 'Meninas';
            document.getElementById('prod-price').value = '';
            document.getElementById('prod-desc').value = '';
            document.getElementById('prod-image-current').value = '';
            preview.classList.remove('visible');
            preview.src = '';
        }
    },

    handleSaveProduct: async (e) => {
        e.preventDefault();
        const id = document.getElementById('prod-id').value;
        const fileInput = document.getElementById('prod-image-file');
        const urlInput = document.getElementById('prod-image-url');
        let finalImageUrl = document.getElementById('prod-image-current').value;
        let isLocalFile = false;

        if (urlInput.value && urlInput.value.trim() !== '') {
             finalImageUrl = urlInput.value.trim();
        } else if (fileInput.files && fileInput.files[0]) {
            try {
                finalImageUrl = await Utils.fileToBase64(fileInput.files[0]);
                isLocalFile = true;
            } catch (err) {
                alert('Erro ao processar arquivo');
                return;
            }
        } else if (!finalImageUrl) {
            finalImageUrl = 'https://via.placeholder.com/400';
        }

        const prodData = {
            name: document.getElementById('prod-name').value,
            category: document.getElementById('prod-category').value,
            price: parseFloat(document.getElementById('prod-price').value),
            imageUrl: finalImageUrl,
            description: document.getElementById('prod-desc').value,
        };

        if (id) {
            const index = state.products.findIndex(p => p.id === id);
            if (index > -1) state.products[index] = { ...prodData, id };
        } else {
            state.products.push({ ...prodData, id: Date.now().toString() });
        }

        // Salvar localmente
        Storage.set('products', state.products);
        document.getElementById('modal-product').classList.add('hidden');
        app.renderAdminProducts();
        if (document.getElementById('view-home').style.display !== 'none') app.renderHome();

        // ----------------------------------------------------
        // CRÍTICO: Explicar ao usuário que ele precisa atualizar o código
        // ----------------------------------------------------
        if (isLocalFile) {
            alert("ATENÇÃO: Você usou uma imagem do celular (arquivo). O código gerado será GIGANTE. \n\nRecomendamos usar links da internet (URL) para que o site fique leve e fácil de atualizar.");
        }

        app.showToast("Produto Salvo Localmente!");
        
        setTimeout(() => {
            alert("IMPORTANTE: Para que seus clientes vejam as mudanças, você precisa copiar o CÓDIGO NOVO e atualizar o site. \n\nVou gerar o código agora!");
            app.generateUpdateCode();
        }, 500);
    },

    editProduct: (id) => {
        const p = state.products.find(i => i.id === id);
        if(p) app.openProductModal(p);
    },

    deleteProduct: (id) => {
        if(confirm('Excluir este produto?')) {
            state.products = state.products.filter(p => p.id !== id);
            Storage.set('products', state.products);
            app.renderAdminProducts();
            
            setTimeout(() => {
                alert("IMPORTANTE: Para remover o produto para os clientes, gere o código e atualize o site.");
                app.generateUpdateCode();
            }, 500);
        }
    },

    // --- GERAÇÃO DE CÓDIGO PARA ATUALIZAÇÃO ---
    generateUpdateCode: () => {
        const currentProducts = Storage.get('products', CONSTANTS.INITIAL_PRODUCTS);
        
        const productsString = JSON.stringify(currentProducts, null, 4);
        
        const codeBlock = `
// CÓDIGO DE ATUALIZAÇÃO - Juju Kids
// 1. Abra o arquivo "script.js"
// 2. Procure onde diz "INITIAL_PRODUCTS"
// 3. APAGUE tudo que estiver dentro dos colchetes [ ... ] do INITIAL_PRODUCTS e cole o código abaixo.
// OU simplesmente substitua a constante inteira por:

INITIAL_PRODUCTS: ${productsString}
        `;

        const txtArea = document.getElementById('generated-code-area');
        txtArea.value = codeBlock.trim();
        
        document.getElementById('modal-code').classList.remove('hidden');
    },

    renderAdminOrders: () => {
        const container = document.getElementById('admin-orders-list');
        if (state.orders.length === 0) {
            container.innerHTML = '<p>Sem pedidos.</p>';
            return;
        }
        const sorted = [...state.orders].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        container.innerHTML = sorted.map(o => `
            <div class="card" style="margin-bottom:1rem;">
                <div class="flex-between">
                    <strong>Pedido #${o.id}</strong>
                    <strong>R$ ${o.total.toFixed(2)}</strong>
                </div>
                <small>${new Date(o.timestamp).toLocaleString()}</small>
                <p>Cliente: ${o.customerName} (${o.customerPhone})</p>
                <p>Endereço: ${o.address.street}, ${o.address.city}</p>
                <ul style="margin-top:0.5rem; padding-left:1rem;">
                    ${o.items.map(i => `<li>${i.quantity}x ${i.name}</li>`).join('')}
                </ul>
            </div>
        `).join('');
    },

    renderAdminUsers: () => {
        const tbody = document.getElementById('admin-users-list');
        tbody.innerHTML = state.users.map(u => `
            <tr>
                <td>${u.name}</td>
                <td>${u.phone}</td>
                <td>${u.role}</td>
            </tr>
        `).join('');
    },

    exportUsersToExcel: () => {
        const headers = ['Nome', 'Telefone', 'Perfil', 'ID'];
        const rows = state.users.map(u => [u.name, u.phone, u.role, u.id]);

        let csvContent = '\uFEFF' + headers.join(';') + '\n';
        rows.forEach(row => {
            csvContent += row.join(';') + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `clientes_jujukids_${new Date().toISOString().slice(0,10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

document.addEventListener('DOMContentLoaded', app.init);
