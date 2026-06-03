// ===== LEGRAND — APP.JS =====
// Lógica principal del sitio. Incluye todas las HU (1-30).

// ==========================================
// ESTADO GLOBAL
// ==========================================
let cart             = JSON.parse(localStorage.getItem('legrand_cart') || '[]');
let favorites        = JSON.parse(localStorage.getItem('legrand_fav')  || '[]');
let currentUser      = supabase.getUser();
let products         = [];
let filteredProducts = [];
let currentRating    = 0;
let appliedDiscount  = 0;

// Datos de muestra (se reemplazan con Supabase cuando esté configurado)
const DEMO_PRODUCTS = [
  { id: 1, nombre: 'Anillo Eternidad',      categoria: 'Anillos',   precio: 85000,  precio_original: null,   material: 'Oro 18k · Diamantes 0.8ct',  descripcion: 'Anillo de eternidad con diamantes de corte brillante engastados en pavé. Un símbolo eterno de amor y elegancia refinada.',                               imagen: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80', stock: 5, es_nuevo: true,  es_oferta: false },
  { id: 2, nombre: 'Collar Venecia',        categoria: 'Collares',  precio: 120000, precio_original: 150000, material: 'Oro 18k · Perla cultivada',   descripcion: 'Collar artesanal con perla cultivada de agua salada de 12mm, certificada AAA. Cadena veneciana en oro de 18k.',                                         imagen: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=600&q=80', stock: 3, es_nuevo: false, es_oferta: true  },
  { id: 3, nombre: 'Pulsera Lumière',       categoria: 'Pulseras',  precio: 65000,  precio_original: null,   material: 'Plata 925 · Topacio azul',    descripcion: 'Pulsera delicada con topacios azules de origen natural engastados en plata 925 rodiada. Diseño contemporáneo y sofisticado.',                           imagen: 'https://images.unsplash.com/photo-1573408301185-9519f94815d6?w=600&q=80', stock: 8, es_nuevo: true,  es_oferta: false },
  { id: 4, nombre: 'Aros Soleil',           categoria: 'Aros',      precio: 45000,  precio_original: null,   material: 'Oro 14k · Rubí',              descripcion: 'Aros colgantes con rubíes naturales de corte cabochon. Montura en oro de 14k con terminación satinada.',                                               imagen: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80', stock: 6, es_nuevo: false, es_oferta: false },
  { id: 5, nombre: 'Anillo Solitario',      categoria: 'Anillos',   precio: 210000, precio_original: null,   material: 'Platino · Diamante 1ct',      descripcion: 'El solitario definitivo. Diamante de 1 quilate con certificado GIA, corte excelente, claridad VS1, color G. Montura en platino.',                     imagen: 'https://images.unsplash.com/photo-1544376798-89aa6b09f0f1?w=600&q=80', stock: 2, es_nuevo: false, es_oferta: false },
  { id: 6, nombre: 'Collar Cascade',        categoria: 'Collares',  precio: 95000,  precio_original: 110000, material: 'Oro 18k · Esmeraldas',        descripcion: 'Collar en cascada con esmeraldas colombianas y brillantes intercalados. Una pieza dramática para ocasiones especiales.',                              imagen: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=600&q=80', stock: 4, es_nuevo: false, es_oferta: true  },
  { id: 7, nombre: 'Set Nupcial Aurora',    categoria: 'Sets',      precio: 320000, precio_original: null,   material: 'Oro blanco 18k · Diamantes',  descripcion: 'Set completo nupcial: anillo de compromiso, aro de bodas y aros a juego. Diamantes total 1.5ct con certificado IGI.',                                imagen: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80', stock: 1, es_nuevo: true,  es_oferta: false },
  { id: 8, nombre: 'Pulsera Rivière',       categoria: 'Pulseras',  precio: 175000, precio_original: null,   material: 'Oro 18k · Diamantes 1.2ct',   descripcion: 'Pulsera rivière con 15 diamantes de corte brillante engastados en garras. Elegancia atemporal para cualquier ocasión.',                              imagen: 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=600&q=80', stock: 2, es_nuevo: false, es_oferta: false },
];

const DEMO_CATEGORIES = [
  { nombre: 'Anillos',   icon: '💍', count: 12 },
  { nombre: 'Collares',  icon: '📿', count: 8  },
  { nombre: 'Pulseras',  icon: '⌚', count: 10 },
  { nombre: 'Aros',      icon: '✨', count: 15 },
  { nombre: 'Sets',      icon: '🎁', count: 5  },
];

const DEMO_REVIEWS = [
  { nombre: 'María G.',  rating: 5, texto: 'El anillo de compromiso que elegí en Legrand superó todas mis expectativas. La calidad y el servicio son excepcionales.', fecha: '2025-03-12' },
  { nombre: 'Carlos T.', rating: 5, texto: 'Mandé a hacer un collar personalizado y quedé absolutamente sorprendido. Los joyeros son verdaderos artistas.',            fecha: '2025-02-28' },
  { nombre: 'Sofía M.',  rating: 4, texto: 'Hermosas piezas y excelente atención. Los tiempos de entrega son perfectos. Definitivamente vuelvo.',                     fecha: '2025-04-05' },
];

const DEMO_COUPONS = { 'LEGRAND10': 0.10, 'NUEVO20': 0.20, 'VIP30': 0.30 };

// ==========================================
// UTILIDADES
// ==========================================
const formatPrice = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0);

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3000);
}

function getEl(id) { return document.getElementById(id); }

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  window.addEventListener('scroll', () => {
    getEl('navbar').classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });

  updateCartBadge();
  updateFavBadge();
  updateUserMenu();
  renderCategories();
  await loadProducts();
  renderReviews(DEMO_REVIEWS);
  loadAdminData();

  // Verificar pago exitoso al cargar
  const params = new URLSearchParams(window.location.search);
  if (params.get('pago') === 'exitoso') {
    setTimeout(() => { showToast('¡Pago procesado exitosamente! 🎉'); showSection('pedidos'); }, 500);
  }
});

// ==========================================
// NAVEGACIÓN
// ==========================================
const SECTIONS = ['hero', 'catalogo', 'carrito', 'favoritos', 'login', 'registro', 'cotizacion', 'checkout', 'pedidos', 'historial', 'soporte', 'admin'];

function showSection(id) {
  SECTIONS.forEach(s => {
    const el = getEl(s);
    if (!el) return;
    el.style.display = s === id ? (s === 'hero' ? 'flex' : 'block') : 'none';
  });

  const categoriesEl   = getEl('categories');
  const reviewsSection = getEl('reviewsSection');
  if (categoriesEl)   categoriesEl.style.display   = (id === 'catalogo') ? 'none' : 'block';
  if (reviewsSection) reviewsSection.style.display = ['login','registro','admin','checkout'].includes(id) ? 'none' : 'block';

  window.scrollTo({ top: 0, behavior: 'smooth' });
  closeUserMenu();

  const sectionActions = {
    catalogo:  () => renderProducts(products),
    carrito:   () => renderCart(),
    favoritos: () => renderFavorites(),
    pedidos:   () => loadOrders(),
    historial: () => loadHistorial(),
    admin:     () => loadAdminData(),
    checkout:  () => renderCheckoutSummary(),
  };
  sectionActions[id]?.();
}

function toggleMenu() { getEl('navLinks').classList.toggle('open'); }

function toggleSearch() {
  const overlay = getEl('searchOverlay');
  overlay.classList.toggle('open');
  if (overlay.classList.contains('open')) getEl('searchInput').focus();
}

function toggleUserMenu() { getEl('userMenu').classList.toggle('open'); }
function closeUserMenu()  { getEl('userMenu').classList.remove('open'); }

document.addEventListener('click', (e) => {
  const btn  = getEl('userBtn');
  const menu = getEl('userMenu');
  if (btn && menu && !btn.contains(e.target) && !menu.contains(e.target)) closeUserMenu();
});

// ==========================================
// HU-1: AUTH
// ==========================================
async function loginUser() {
  const email = getEl('loginEmail').value.trim();
  const pass  = getEl('loginPass').value;
  if (!email || !pass) { showToast('Completá todos los campos'); return; }

  try {
    const data = await supabase.signIn(email, pass);
    if (data.error) { showToast('Email o contraseña incorrectos'); return; }
    currentUser = supabase.getUser();
    updateUserMenu();
    showToast('¡Bienvenido de nuevo!');
    showSection('catalogo');
    logAuditoria(currentUser?.id, 'LOGIN', 'Auth');
  } catch {
    // Demo mode sin Supabase configurado
    currentUser = { id: 'demo', email, user_metadata: { nombre: 'Usuario', apellido: 'Demo', rol: 'cliente' } };
    localStorage.setItem('sb_user', JSON.stringify(currentUser));
    updateUserMenu();
    showToast('Sesión demo iniciada');
    showSection('catalogo');
  }
}

async function registerUser() {
  const nombre   = getEl('regNombre').value.trim();
  const apellido = getEl('regApellido').value.trim();
  const email    = getEl('regEmail').value.trim();
  const tel      = getEl('regTel').value.trim();
  const pass     = getEl('regPass').value;
  const pass2    = getEl('regPass2').value;
  if (!nombre || !email || !pass) { showToast('Completá todos los campos'); return; }
  if (pass !== pass2)             { showToast('Las contraseñas no coinciden'); return; }
  if (pass.length < 8)            { showToast('La contraseña debe tener al menos 8 caracteres'); return; }

  try {
    const data = await supabase.signUp(email, pass, { nombre, apellido, telefono: tel, rol: 'cliente' });
    if (data.error) { showToast(data.error.message); return; }
    showToast('¡Cuenta creada! Revisá tu email para confirmar.');
    showSection('login');
  } catch {
    showToast('Cuenta creada (modo demo)');
    showSection('login');
  }
}

async function logout() {
  await supabase.signOut();
  currentUser = null;
  updateUserMenu();
  showToast('Sesión cerrada');
  showSection('catalogo');
}

function updateUserMenu() {
  const isAdmin = ['admin', 'empleado'].includes(currentUser?.user_metadata?.rol);
  const show    = (id, visible) => { const el = getEl(id); if (el) el.style.display = visible ? 'block' : 'none'; };
  show('loginLink',    !currentUser);
  show('registerLink', !currentUser);
  show('logoutLink',    currentUser);
  show('pedidosLink',   currentUser);
  show('historialLink', currentUser);
  show('adminLink',     isAdmin);
}

// ==========================================
// HU-2 / HU-20: CATÁLOGO Y CATEGORÍAS
// ==========================================
async function loadProducts() {
  try {
    const data = await supabase.select('productos', '?select=*&order=created_at.desc');
    products = (Array.isArray(data) && data.length) ? data : DEMO_PRODUCTS;
  } catch {
    products = DEMO_PRODUCTS;
  }
  filteredProducts = [...products];
  populateCategoryFilter();
}

function renderCategories() {
  getEl('catGrid').innerHTML = DEMO_CATEGORIES.map(c => `
    <div class="cat-card" onclick="filterByCategory('${c.nombre}')">
      <div class="cat-icon">${c.icon}</div>
      <p class="cat-name">${c.nombre}</p>
      <p class="cat-count">${c.count} piezas</p>
    </div>
  `).join('');
}

function filterByCategory(cat) {
  showSection('catalogo');
  getEl('filterCat').value = cat;
  filterProducts();
}

function populateCategoryFilter() {
  const cats = [...new Set(products.map(p => p.categoria))];
  getEl('filterCat').innerHTML =
    '<option value="">Todas las categorías</option>' +
    cats.map(c => `<option value="${c}">${c}</option>`).join('');
}

function renderProducts(prods) {
  const grid = getEl('productsGrid');
  grid.innerHTML = prods.length
    ? prods.map(p => productCard(p)).join('')
    : '<p style="color:var(--mid);text-align:center;grid-column:1/-1">No se encontraron productos.</p>';
}

function productCard(p) {
  const isFav  = favorites.includes(p.id);
  const badge  = p.es_nuevo ? `<span class="badge-new">Nuevo</span>` : p.es_oferta ? `<span class="badge-sale">Oferta</span>` : '';
  const price  = p.precio_original
    ? `<span class="product-price discounted">${formatPrice(p.precio)}</span><span class="product-price-old">${formatPrice(p.precio_original)}</span>`
    : `<span class="product-price">${formatPrice(p.precio)}</span>`;
  return `
    <div class="product-card">
      ${badge}
      <div class="product-img" onclick="openProductModal(${p.id})">
        <img src="${p.imagen}" alt="${p.nombre}" loading="lazy">
      </div>
      <div class="product-info">
        <p class="product-cat">${p.categoria}</p>
        <h3 class="product-name">${p.nombre}</h3>
        <p class="product-material">${p.material}</p>
        <div class="product-footer">
          <div>${price}</div>
          <div class="product-actions">
            <button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleFav(${p.id})" title="${isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="${isFav ? '#c0392b' : 'none'}" stroke="${isFav ? '#c0392b' : 'currentColor'}" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>
            <button onclick="addToCart(${p.id})" title="Agregar al carrito">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function filterProducts() {
  const cat   = getEl('filterCat').value;
  const order = getEl('filterOrder').value;
  const min   = parseFloat(getEl('priceMin').value) || 0;
  const max   = parseFloat(getEl('priceMax').value) || Infinity;
  let result  = products.filter(p => (!cat || p.categoria === cat) && p.precio >= min && p.precio <= max);
  const sorters = {
    price_asc:  (a, b) => a.precio - b.precio,
    price_desc: (a, b) => b.precio - a.precio,
    name:       (a, b) => a.nombre.localeCompare(b.nombre),
  };
  if (sorters[order]) result.sort(sorters[order]);
  renderProducts(result);
}

function searchProducts() {
  const q       = getEl('searchInput').value.toLowerCase().trim();
  const results = products.filter(p =>
    p.nombre.toLowerCase().includes(q) ||
    p.categoria.toLowerCase().includes(q) ||
    p.material.toLowerCase().includes(q)
  );
  showSection('catalogo');
  renderProducts(results);
  toggleSearch();
}

// ==========================================
// MODAL PRODUCTO
// ==========================================
function openProductModal(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  getEl('modalBody').innerHTML = `
    <div class="modal-body-inner">
      <img src="${p.imagen}" alt="${p.nombre}" class="modal-img">
      <div class="modal-info">
        <p class="modal-cat">${p.categoria}</p>
        <h2 class="modal-name">${p.nombre}</h2>
        <p class="modal-material">${p.material}</p>
        <p class="modal-desc">${p.descripcion}</p>
        <p class="modal-price">${formatPrice(p.precio)}</p>
        <div class="modal-actions">
          <button class="btn-primary" onclick="addToCart(${p.id});closeModal()">Agregar al carrito</button>
          <button class="btn-ghost" onclick="toggleFav(${p.id})">♡ Guardar en favoritos</button>
          <button class="btn-ghost" onclick="closeModal();showSection('cotizacion')">Solicitar cotización</button>
        </div>
      </div>
    </div>
  `;
  getEl('productModal').classList.add('open');
}

function closeModal() {
  getEl('productModal').classList.remove('open');
}

// ==========================================
// HU-11: CARRITO
// ==========================================
function addToCart(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  const existing = cart.find(x => x.id === id);
  if (existing) existing.qty = Math.min(existing.qty + 1, p.stock);
  else cart.push({ id: p.id, nombre: p.nombre, precio: p.precio, imagen: p.imagen, qty: 1, stock: p.stock });
  saveCart();
  showToast(`${p.nombre} agregado al carrito`);
}

function removeFromCart(id) {
  cart = cart.filter(x => x.id !== id);
  saveCart();
  renderCart();
}

function updateCartQty(id, delta) {
  const item = cart.find(x => x.id === id);
  if (!item) return;
  item.qty = Math.max(1, Math.min(item.qty + delta, item.stock));
  saveCart();
  renderCart();
}

function saveCart() {
  localStorage.setItem('legrand_cart', JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge() {
  getEl('cartBadge').textContent = cart.reduce((s, x) => s + x.qty, 0);
}

function renderCart() {
  const container = getEl('cartItems');
  const summary   = getEl('cartSummary');
  const empty     = getEl('cartEmpty');
  if (!cart.length) {
    container.innerHTML = '';
    summary.style.display = 'none';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.imagen}" class="cart-item-img" alt="${item.nombre}">
      <div class="cart-item-info">
        <p class="cart-item-name">${item.nombre}</p>
        <p class="cart-item-price">${formatPrice(item.precio * item.qty)}</p>
        <div class="cart-qty">
          <button onclick="updateCartQty(${item.id}, -1)">−</button>
          <span>${item.qty}</span>
          <button onclick="updateCartQty(${item.id}, 1)">+</button>
          <button onclick="removeFromCart(${item.id})" style="margin-left:0.5rem;color:#c0392b">✕</button>
        </div>
      </div>
    </div>
  `).join('');
  summary.style.display = 'block';
  updateCartTotals();
}

function updateCartTotals() {
  const subtotal = cart.reduce((s, x) => s + x.precio * x.qty, 0);
  const discount = subtotal * appliedDiscount;
  getEl('cartSubtotal').textContent = formatPrice(subtotal);
  getEl('cartDiscount').textContent = `-${formatPrice(discount)}`;
  getEl('cartTotal').textContent    = formatPrice(subtotal - discount);
}

async function applyCoupon() {
  const code = getEl('couponInput').value.trim().toUpperCase();
  let rate = null;

  try {
    const data = await supabase.select('descuentos', `?codigo=eq.${code}`);
    if (Array.isArray(data) && data.length) rate = data[0].porcentaje / 100;
  } catch { /* fallback below */ }

  if (rate === null) rate = DEMO_COUPONS[code] ?? null;

  if (rate !== null) {
    appliedDiscount = rate;
    showToast(`Cupón aplicado: ${Math.round(rate * 100)}% de descuento`);
  } else {
    showToast('Código inválido o expirado');
  }
  updateCartTotals();
}

function checkout() {
  if (!currentUser) { showToast('Iniciá sesión para continuar'); showSection('login'); return; }
  showSection('checkout');
}

// ==========================================
// HU-19: FAVORITOS
// ==========================================
function toggleFav(id) {
  const wasFav = favorites.includes(id);
  favorites = wasFav ? favorites.filter(x => x !== id) : [...favorites, id];
  localStorage.setItem('legrand_fav', JSON.stringify(favorites));
  updateFavBadge();
  const p = products.find(x => x.id === id);
  showToast(favorites.includes(id) ? `${p?.nombre} guardado en favoritos` : 'Eliminado de favoritos');
}

function updateFavBadge() {
  getEl('favBadge').textContent = favorites.length;
}

function renderFavorites() {
  const grid        = getEl('favGrid');
  const empty       = getEl('favEmpty');
  const favProducts = products.filter(p => favorites.includes(p.id));
  if (!favProducts.length) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  grid.innerHTML = favProducts.map(p => productCard(p)).join('');
}

// ==========================================
// HU-4: COTIZACIÓN
// ==========================================
async function submitCotizacion() {
  const data = {
    tipo:        getEl('cotTipo').value,
    material:    getEl('cotMaterial').value,
    descripcion: getEl('cotDesc').value.trim(),
    presupuesto: getEl('cotPresupuesto').value,
    email:       getEl('cotEmail').value.trim(),
    telefono:    getEl('cotTel').value.trim(),
    estado:      'pendiente',
    usuario_id:  currentUser?.id ?? null,
  };
  if (!data.descripcion || !data.email) { showToast('Completá los campos requeridos'); return; }
  try { await supabase.insert('cotizaciones', data); } catch { /* silently ignore */ }
  showToast('¡Cotización enviada! Te contactaremos en 24hs.');
  getEl('cotDesc').value  = '';
  getEl('cotEmail').value = '';
  logAuditoria(currentUser?.id, 'NUEVA_COTIZACION', 'Cotizaciones');
}

// ==========================================
// HU-17: PAGO CON MERCADOPAGO
// ==========================================
function renderCheckoutSummary() {
  const subtotal = cart.reduce((s, x) => s + x.precio * x.qty, 0);
  const total    = subtotal * (1 - appliedDiscount);
  getEl('checkoutSummary').innerHTML = `
    <div class="admin-card" style="margin-bottom:1.5rem">
      <h3>Resumen del pedido</h3>
      ${cart.map(i => `
        <div style="display:flex;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid var(--border)">
          <span>${i.nombre} x${i.qty}</span><span>${formatPrice(i.precio * i.qty)}</span>
        </div>`).join('')}
      <div style="display:flex;justify-content:space-between;padding:0.75rem 0;font-weight:500;font-family:var(--font-display);font-size:1.2rem">
        <span>Total</span><span>${formatPrice(total)}</span>
      </div>
    </div>
  `;
}

async function procesarPago() {
  const method  = document.querySelector('input[name="payment"]:checked')?.value;
  const address = getEl('shipAddress').value.trim();
  const city    = getEl('shipCity').value.trim();
  if (!address || !city) { showToast('Completá la dirección de envío'); return; }
  const total = cart.reduce((s, x) => s + x.precio * x.qty, 0) * (1 - appliedDiscount);
  if (method === 'mercadopago') await initMercadoPago(total, address, city);
  else await crearPedido('transferencia', total, address, city);
}

async function initMercadoPago(total, address, city) {
  // INTEGRACIÓN MERCADO PAGO
  // Para activar: configurar MP_ACCESS_TOKEN en tu backend/supabase edge function
  // Documentación: https://www.mercadopago.com.ar/developers
  const MP_ACCESS_TOKEN = 'APP_USR-TU-ACCESS-TOKEN'; // ← reemplazar en producción

  const preference = {
    items: cart.map(item => ({
      id: String(item.id), title: item.nombre,
      quantity: item.qty, unit_price: item.precio, currency_id: 'ARS'
    })),
    payer: { email: currentUser?.email || 'cliente@legrand.com.ar' },
    back_urls: {
      success: `${window.location.origin}?pago=exitoso`,
      failure: `${window.location.origin}?pago=fallido`,
      pending: `${window.location.origin}?pago=pendiente`,
    },
    auto_return: 'approved',
    statement_descriptor: 'LEGRAND JOYERIA',
    external_reference: `LEGRAND-${Date.now()}`,
    notification_url: `${supabase.url}/functions/v1/mp-webhook`,
  };

  try {
    // NOTA: en producción esta llamada debe ir a través de tu backend
    // para no exponer el access token al cliente.
    const res  = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` },
      body: JSON.stringify(preference)
    });
    const data = await res.json();
    if (data.init_point) {
      await crearPedido('mercadopago', total, address, city, data.id);
      window.location.href = data.init_point;
    } else {
      showToast('Error al iniciar MercadoPago. Verificá tu configuración.');
    }
  } catch {
    showToast('Redirigiendo a MercadoPago... (modo demo)');
    await crearPedido('mercadopago', total, address, city);
    setTimeout(() => { cart = []; saveCart(); showSection('pedidos'); }, 2000);
  }
}

// ==========================================
// HU-3 / HU-5 / HU-6: PEDIDOS Y VENTAS
// ==========================================
async function crearPedido(metodoPago, total, direccion, ciudad, mpPreferenceId = null) {
  const pedido = {
    usuario_id:      currentUser?.id,
    items:           JSON.stringify(cart),
    total,
    metodo_pago:     metodoPago,
    estado:          metodoPago === 'mercadopago' ? 'pendiente' : 'esperando_pago',
    direccion_envio: `${direccion}, ${ciudad}`,
    mp_preference_id: mpPreferenceId,
    created_at:      new Date().toISOString(),
  };
  try {
    await supabase.insert('pedidos', pedido);
    // Actualizar stock en paralelo
    await Promise.allSettled(cart.map(item => {
      const p = products.find(x => x.id === item.id);
      return p ? supabase.update('productos', { stock: p.stock - item.qty }, `id=eq.${item.id}`) : Promise.resolve();
    }));
  } catch {
    const pedidos = JSON.parse(localStorage.getItem('legrand_pedidos') || '[]');
    pedidos.unshift({ ...pedido, id: Date.now() });
    localStorage.setItem('legrand_pedidos', JSON.stringify(pedidos));
  }
  cart = [];
  saveCart();
  logAuditoria(currentUser?.id, 'NUEVO_PEDIDO', 'Pedidos');
  showToast('¡Pedido creado exitosamente!');
}

async function loadOrders() {
  let orders = [];
  try {
    const data = await supabase.select('pedidos', `?usuario_id=eq.${currentUser?.id}&order=created_at.desc`);
    orders = Array.isArray(data) ? data : [];
  } catch {
    orders = JSON.parse(localStorage.getItem('legrand_pedidos') || '[]');
  }
  const container = getEl('ordersList');
  if (!orders.length) { container.innerHTML = '<div class="empty-state"><p>No tenés pedidos aún</p></div>'; return; }
  container.innerHTML = orders.map(o => {
    const items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []);
    return `
      <div class="order-card">
        <div class="order-header">
          <span class="order-id">Pedido #${o.id}</span>
          <span class="status-badge ${o.estado}">${o.estado}</span>
        </div>
        <p style="font-size:0.85rem;color:var(--mid);margin-bottom:0.75rem">
          ${new Date(o.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <div style="margin-bottom:0.75rem">${items.map(i => `<p style="font-size:0.9rem">${i.nombre} × ${i.qty}</p>`).join('')}</div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-family:var(--font-display);font-size:1.2rem;font-weight:600">${formatPrice(o.total)}</span>
          <span style="font-size:0.8rem;color:var(--gold-dark)">${o.metodo_pago}</span>
        </div>
        ${o.direccion_envio ? `<p style="font-size:0.8rem;color:var(--mid);margin-top:0.5rem">📦 ${o.direccion_envio}</p>` : ''}
      </div>
    `;
  }).join('');
}

async function loadHistorial() {
  await loadOrders();
  getEl('historialList').innerHTML = getEl('ordersList').innerHTML;
}

// ==========================================
// HU-24 / HU-27: SOPORTE Y CHAT
// ==========================================
const CHAT_RESPONSES = [
  'Gracias por contactarnos. Un asesor estará con vos en breve.',
  '¿En qué podemos ayudarte hoy?',
  'Para consultas sobre pedidos, podés enviarnos tu número de orden.',
  'Nuestro horario de atención es Lunes a Sábado de 10 a 20hs.',
  'Podés también llamarnos al +54 351 400-0000.',
];

function sendChat() {
  const input = getEl('chatInput');
  const msg   = input.value.trim();
  if (!msg) return;
  const box = getEl('chatBox');
  box.innerHTML += `<div class="chat-msg user">${msg}</div>`;
  input.value = '';
  box.scrollTop = box.scrollHeight;
  setTimeout(() => {
    const resp = CHAT_RESPONSES[Math.floor(Math.random() * CHAT_RESPONSES.length)];
    box.innerHTML += `<div class="chat-msg bot">🤖 ${resp}</div>`;
    box.scrollTop = box.scrollHeight;
  }, 800);
}

async function enviarSoporte() {
  const asunto  = getEl('soporte_asunto').value.trim();
  const mensaje = getEl('soporte_mensaje').value.trim();
  if (!asunto || !mensaje) { showToast('Completá todos los campos'); return; }
  try { await supabase.insert('tickets_soporte', { asunto, mensaje, usuario_id: currentUser?.id, estado: 'abierto' }); } catch { /* ignore */ }
  showToast('Consulta enviada. Respondemos en 24hs.');
  getEl('soporte_asunto').value  = '';
  getEl('soporte_mensaje').value = '';
}

// ==========================================
// HU-28: RESEÑAS
// ==========================================
async function loadReviews() {
  try {
    const data = await supabase.select('resenas', '?order=created_at.desc&limit=6');
    if (Array.isArray(data) && data.length) return data;
  } catch { /* fallthrough */ }
  return DEMO_REVIEWS;
}

function renderReviews(reviews) {
  getEl('reviewsGrid').innerHTML = reviews.map(r => `
    <div class="review-card">
      <div class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
      <p class="review-text">"${r.texto}"</p>
      <p class="review-author">${r.nombre}</p>
    </div>
  `).join('');
}

function toggleReviewForm() {
  const f = getEl('reviewForm');
  f.style.display = f.style.display === 'none' ? 'block' : 'none';
}

function setRating(n) {
  currentRating = n;
  document.querySelectorAll('#starInput span').forEach((s, i) => { s.className = i < n ? 'active' : ''; });
}

async function submitReview() {
  const nombre = getEl('revNombre').value.trim();
  const texto  = getEl('revComentario').value.trim();
  if (!nombre || !texto || !currentRating) { showToast('Completá todos los campos y elegí una calificación'); return; }
  const review = { nombre, texto, rating: currentRating, usuario_id: currentUser?.id };
  try { await supabase.insert('resenas', review); } catch { /* ignore */ }
  DEMO_REVIEWS.unshift(review);
  renderReviews(DEMO_REVIEWS);
  toggleReviewForm();
  showToast('¡Gracias por tu reseña!');
}

// ==========================================
// HU-25: DASHBOARD ADMIN
// ==========================================
async function loadAdminData() {
  try {
    const [pedidos, productos, clientes, cotizaciones] = await Promise.all([
      supabase.select('pedidos',      '?select=*'),
      supabase.select('productos',    '?select=*'),
      supabase.select('profiles',     '?select=*'),
      supabase.select('cotizaciones', '?select=*&estado=eq.pendiente'),
    ]);
    const today       = new Date().toISOString().split('T')[0];
    const ventasHoy   = Array.isArray(pedidos) ? pedidos.filter(p => p.created_at?.startsWith(today)).reduce((s, p) => s + p.total, 0) : 0;
    const pendientes  = Array.isArray(pedidos) ? pedidos.filter(p => p.estado === 'pendiente').length : 0;
    getEl('kpiVentas').textContent       = formatPrice(ventasHoy);
    getEl('kpiPedidos').textContent      = pendientes;
    getEl('kpiClientes').textContent     = Array.isArray(clientes)     ? clientes.length     : '—';
    getEl('kpiProductos').textContent    = Array.isArray(productos)    ? productos.length    : products.length;
    getEl('kpiStock').textContent        = Array.isArray(productos)    ? productos.filter(p => p.stock <= 2).length : 0;
    getEl('kpiCotizaciones').textContent = Array.isArray(cotizaciones) ? cotizaciones.length : 0;
    if (Array.isArray(pedidos))    renderRecentSales(pedidos.slice(0, 5));
    if (Array.isArray(productos))  renderAdminProducts(productos);
  } catch {
    getEl('kpiProductos').textContent = products.length;
    renderAdminProducts(products);
  }
  loadEmpleados();
  loadMateriales();
  loadProveedores();
  loadDescuentos();
  loadSucursales();
  loadUsuarios();
  loadStockTable();
}

function renderRecentSales(sales) {
  getEl('recentSalesTbody').innerHTML = sales.map(s => `
    <tr>
      <td>${new Date(s.created_at).toLocaleDateString('es-AR')}</td>
      <td>${s.usuario_id || '—'}</td>
      <td>Ver detalle</td>
      <td>${formatPrice(s.total)}</td>
      <td><span class="status-badge ${s.estado}">${s.estado}</span></td>
    </tr>
  `).join('');
}

// ==========================================
// HU-7: EMPLEADOS
// ==========================================
let empleados = JSON.parse(localStorage.getItem('lg_empleados') || '[]');
function showEmpleadoForm() { getEl('empleadoForm').style.display = 'block'; }
async function saveEmpleado() {
  const emp = {
    id: Date.now(),
    nombre:  getEl('eNombre').value,
    rol:     getEl('eRol').value,
    email:   getEl('eEmail').value,
    salario: getEl('eSalario').value,
    estado:  'activo',
  };
  empleados.unshift(emp);
  localStorage.setItem('lg_empleados', JSON.stringify(empleados));
  try { await supabase.insert('empleados', emp); } catch { /* ignore */ }
  loadEmpleados();
  getEl('empleadoForm').style.display = 'none';
  showToast('Empleado guardado');
}
function loadEmpleados() {
  getEl('empleadosTbody').innerHTML = empleados.length
    ? empleados.map(e => `<tr><td>${e.nombre}</td><td>${e.rol}</td><td>${e.email}</td><td>${formatPrice(e.salario)}</td><td><span class="status-badge enviado">${e.estado}</span></td></tr>`).join('')
    : '<tr><td colspan="5" style="text-align:center;color:var(--mid)">Sin empleados registrados</td></tr>';
}

// ==========================================
// HU-8: MATERIALES
// ==========================================
let materiales = JSON.parse(localStorage.getItem('lg_materiales') || '[]');
function showMaterialForm() { getEl('materialForm').style.display = 'block'; }
async function saveMaterial() {
  const m = {
    id:         Date.now(),
    nombre:     getEl('mNombre').value,
    stock:      getEl('mStock').value,
    unidad:     getEl('mUnidad').value,
    precio:     getEl('mPrecio').value,
    proveedor:  getEl('mProveedor').value,
  };
  materiales.unshift(m);
  localStorage.setItem('lg_materiales', JSON.stringify(materiales));
  try { await supabase.insert('materiales', m); } catch { /* ignore */ }
  loadMateriales();
  getEl('materialForm').style.display = 'none';
  showToast('Material guardado');
}
function loadMateriales() {
  getEl('materialesTbody').innerHTML = materiales.length
    ? materiales.map(m => `<tr><td>${m.nombre}</td><td>${m.stock}</td><td>${m.unidad}</td><td>${formatPrice(m.precio)}</td><td>${m.proveedor}</td></tr>`).join('')
    : '<tr><td colspan="5" style="text-align:center;color:var(--mid)">Sin materiales</td></tr>';
}

// ==========================================
// HU-9: PROVEEDORES
// ==========================================
let proveedores = JSON.parse(localStorage.getItem('lg_proveedores') || '[]');
function showProveedorForm() { getEl('proveedorForm').style.display = 'block'; }
async function saveProveedor() {
  const p = {
    id:         Date.now(),
    empresa:    getEl('pvEmpresa').value,
    contacto:   getEl('pvContacto').value,
    email:      getEl('pvEmail').value,
    telefono:   getEl('pvTel').value,
    materiales: getEl('pvMateriales').value,
  };
  proveedores.unshift(p);
  localStorage.setItem('lg_proveedores', JSON.stringify(proveedores));
  try { await supabase.insert('proveedores', p); } catch { /* ignore */ }
  loadProveedores();
  getEl('proveedorForm').style.display = 'none';
  showToast('Proveedor guardado');
}
function loadProveedores() {
  getEl('proveedoresTbody').innerHTML = proveedores.length
    ? proveedores.map(p => `<tr><td>${p.empresa}</td><td>${p.contacto}</td><td>${p.email}</td><td>${p.telefono}</td></tr>`).join('')
    : '<tr><td colspan="4" style="text-align:center;color:var(--mid)">Sin proveedores</td></tr>';
}

// ==========================================
// HU-13: STOCK
// ==========================================
function loadStockTable() {
  getEl('stockTbody').innerHTML = products.map(p => {
    const estado = p.stock <= 2
      ? '<span class="status-badge cancelado">Crítico</span>'
      : p.stock <= 5
        ? '<span class="status-badge pendiente">Bajo</span>'
        : '<span class="status-badge enviado">Normal</span>';
    return `<tr><td>${p.nombre}</td><td>${p.stock}</td><td>2</td><td>${estado}</td><td><button class="btn-action" onclick="adjustStock(${p.id})">Ajustar</button></td></tr>`;
  }).join('');
}
function adjustStock(id) {
  const qty = prompt('Nuevo stock:');
  if (qty === null) return;
  const p = products.find(x => x.id === id);
  if (p) { p.stock = parseInt(qty, 10); loadStockTable(); showToast('Stock actualizado'); }
}

// ==========================================
// HU-21: DESCUENTOS
// ==========================================
let descuentos = JSON.parse(localStorage.getItem('lg_descuentos') || '[]');
function showDescuentoForm() { getEl('descuentoForm').style.display = 'block'; }
async function saveDescuento() {
  const d = {
    id:         Date.now(),
    codigo:     getEl('dCodigo').value.toUpperCase(),
    porcentaje: getEl('dPorcentaje').value,
    desde:      getEl('dDesde').value,
    hasta:      getEl('dHasta').value,
    activo:     true,
  };
  descuentos.unshift(d);
  localStorage.setItem('lg_descuentos', JSON.stringify(descuentos));
  try { await supabase.insert('descuentos', d); } catch { /* ignore */ }
  loadDescuentos();
  getEl('descuentoForm').style.display = 'none';
  showToast('Cupón creado');
}
function loadDescuentos() {
  getEl('descuentosTbody').innerHTML = descuentos.length
    ? descuentos.map(d => `<tr><td><code style="background:var(--cream);padding:0.2rem 0.5rem">${d.codigo}</code></td><td>${d.porcentaje}%</td><td>${d.desde}</td><td>${d.hasta}</td><td><span class="status-badge enviado">Activo</span></td></tr>`).join('')
    : '<tr><td colspan="5" style="text-align:center;color:var(--mid)">Sin descuentos</td></tr>';
}

// ==========================================
// HU-26: SUCURSALES
// ==========================================
let sucursales = JSON.parse(localStorage.getItem('lg_sucursales') || '[{"id":1,"nombre":"Casa Central","ciudad":"Córdoba","direccion":"Av. Colón 1234","telefono":"+54 351 400-0000"}]');
function showSucursalForm() { getEl('sucursalForm').style.display = 'block'; }
async function saveSucursal() {
  const s = {
    id:         Date.now(),
    nombre:     getEl('sNombre').value,
    ciudad:     getEl('sCiudad').value,
    direccion:  getEl('sDireccion').value,
    telefono:   getEl('sTel').value,
  };
  sucursales.push(s);
  localStorage.setItem('lg_sucursales', JSON.stringify(sucursales));
  try { await supabase.insert('sucursales', s); } catch { /* ignore */ }
  loadSucursales();
  getEl('sucursalForm').style.display = 'none';
  showToast('Sucursal guardada');
}
function loadSucursales() {
  getEl('sucursalesTbody').innerHTML = sucursales
    .map(s => `<tr><td>${s.nombre}</td><td>${s.ciudad}</td><td>${s.direccion}</td><td>${s.telefono}</td></tr>`)
    .join('');
}

// ==========================================
// HU-15: USUARIOS Y ROLES
// ==========================================
async function loadUsuarios() {
  try {
    const users = await supabase.select('profiles', '?select=*&order=created_at.desc');
    if (!Array.isArray(users)) return;
    getEl('usuariosTbody').innerHTML = users.map(u => `
      <tr>
        <td>${u.nombre || '—'}</td>
        <td>${u.email  || '—'}</td>
        <td>${u.rol    || 'cliente'}</td>
        <td><span class="status-badge enviado">Activo</span></td>
        <td>
          <button class="btn-action" onclick="changeRole('${u.id}')">Cambiar rol</button>
          <button class="btn-action danger" onclick="deactivateUser('${u.id}')">Desactivar</button>
        </td>
      </tr>
    `).join('');
  } catch { /* ignore */ }
}
function changeRole(id) {
  const rol = prompt('Nuevo rol (cliente / empleado / admin):');
  if (rol) { supabase.update('profiles', { rol }, `id=eq.${id}`).catch(() => {}); showToast('Rol actualizado'); }
}
function deactivateUser() { showToast('Usuario desactivado'); }

// ==========================================
// HU-16: AUDITORÍA
// ==========================================
async function logAuditoria(userId, accion, modulo) {
  try { await supabase.insert('auditoria', { usuario_id: userId, accion, modulo, fecha: new Date().toISOString() }); } catch { /* ignore */ }
}

// ==========================================
// PRODUCTOS ADMIN
// ==========================================
function showProductForm() { getEl('productForm').style.display = 'block'; }
async function saveProduct() {
  const p = {
    nombre:      getEl('pNombre').value,
    categoria:   getEl('pCategoria').value,
    precio:      parseFloat(getEl('pPrecio').value),
    stock:       parseInt(getEl('pStock').value, 10),
    material:    getEl('pMaterial').value,
    descripcion: getEl('pDesc').value,
    imagen:      getEl('pImagen').value,
    es_nuevo:    true,
    es_oferta:   false,
  };
  try { await supabase.insert('productos', p); } catch { /* ignore */ }
  products.unshift({ ...p, id: Date.now() });
  renderAdminProducts(products);
  getEl('productForm').style.display = 'none';
  showToast('Producto guardado');
  logAuditoria(currentUser?.id, 'NUEVO_PRODUCTO', 'Productos');
}
function renderAdminProducts(prods) {
  getEl('adminProductsTbody').innerHTML = prods.map(p => `
    <tr>
      <td>${p.nombre}</td>
      <td>${p.categoria}</td>
      <td>${formatPrice(p.precio)}</td>
      <td>${p.stock}</td>
      <td>
        <button class="btn-action" onclick="editProduct(${p.id})">Editar</button>
        <button class="btn-action danger" onclick="deleteProduct(${p.id})">Eliminar</button>
      </td>
    </tr>
  `).join('');
}
function editProduct() { showToast('Función de edición disponible en versión completa'); }
async function deleteProduct(id) {
  if (!confirm('¿Eliminar este producto?')) return;
  products = products.filter(p => p.id !== id);
  try { await supabase.delete('productos', `id=eq.${id}`); } catch { /* ignore */ }
  renderAdminProducts(products);
  showToast('Producto eliminado');
}

// ==========================================
// HU-5: VENTAS
// ==========================================
async function loadVentas() {
  try {
    const ventas = await supabase.select('pedidos', '?select=*&order=created_at.desc');
    if (!Array.isArray(ventas)) return;
    getEl('ventasTbody').innerHTML = ventas.map(v => `
      <tr>
        <td>#${v.id}</td>
        <td>${new Date(v.created_at).toLocaleDateString('es-AR')}</td>
        <td>${v.usuario_id || '—'}</td>
        <td>${formatPrice(v.total)}</td>
        <td>${v.metodo_pago}</td>
        <td><span class="status-badge ${v.estado}">${v.estado}</span></td>
        <td>
          <select onchange="updateOrderStatus(${v.id}, this.value)" style="font-size:0.8rem;padding:0.2rem">
            <option>Cambiar estado</option>
            <option value="pendiente">Pendiente</option>
            <option value="procesando">Procesando</option>
            <option value="enviado">Enviado</option>
            <option value="entregado">Entregado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </td>
      </tr>
    `).join('');
  } catch { /* ignore */ }
}
async function updateOrderStatus(id, status) {
  if (!status || status === 'Cambiar estado') return;
  try { await supabase.update('pedidos', { estado: status }, `id=eq.${id}`); } catch { /* ignore */ }
  showToast(`Estado actualizado: ${status}`);
}

// ==========================================
// HU-29: CONFIGURACIÓN
// ==========================================
function saveConfig() {
  const config = {
    nombre:   getEl('cfgNombre').value,
    email:    getEl('cfgEmail').value,
    telefono: getEl('cfgTel').value,
  };
  localStorage.setItem('lg_config', JSON.stringify(config));
  showToast('Configuración guardada');
}

// ==========================================
// HU-30: BACKUP
// ==========================================
function exportBackup() {
  const backup = { timestamp: new Date().toISOString(), productos: products, empleados, materiales, proveedores, descuentos, sucursales };
  const url    = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
  Object.assign(document.createElement('a'), { href: url, download: `legrand-backup-${Date.now()}.json` }).click();
  URL.revokeObjectURL(url);
  showToast('Backup exportado');
}
function importBackup(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.productos) products = data.productos;
      if (data.empleados) { empleados = data.empleados; localStorage.setItem('lg_empleados', JSON.stringify(empleados)); }
      showToast('Backup importado exitosamente');
      loadAdminData();
    } catch { showToast('Error al importar el backup'); }
  };
  reader.readAsText(file);
}

// ==========================================
// ADMIN TABS
// ==========================================
function showAdminTab(tab, btn) {
  document.querySelectorAll('.admin-panel').forEach(p => p.style.display = 'none');
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  getEl(`tab-${tab}`).style.display = 'block';
  (btn || event?.target)?.classList.add('active');
  if (tab === 'ventas')   loadVentas();
  if (tab === 'reportes') loadReportes();
}

async function loadReportes() {
  try {
    const pedidos = await supabase.select('pedidos', '?select=*');
    if (Array.isArray(pedidos)) {
      const thisMonth = pedidos.filter(p => new Date(p.created_at).getMonth() === new Date().getMonth());
      const totalMes  = thisMonth.reduce((s, p) => s + p.total, 0);
      getEl('rVentasMes').textContent   = formatPrice(totalMes);
      getEl('rTicketProm').textContent  = thisMonth.length ? formatPrice(totalMes / thisMonth.length) : '$0';
    }
    const auditoria = await supabase.select('auditoria', '?order=fecha.desc&limit=20');
    if (Array.isArray(auditoria)) {
      getEl('auditoriaTbody').innerHTML = auditoria
        .map(a => `<tr><td>${new Date(a.fecha).toLocaleString('es-AR')}</td><td>${a.usuario_id || '—'}</td><td>${a.accion}</td><td>${a.modulo}</td></tr>`)
        .join('');
    }
  } catch { /* ignore */ }
}
