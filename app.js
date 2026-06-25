
// ═══════════════════════════════════════════
// CONFIG — CAMBIA ESTOS 3 VALORES
// ═══════════════════════════════════════════
const SUPABASE_URL = 'https://xqaqsqumwpkuraiajmrk.supabase.co/rest/v1/';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxYXFzcXVtd3BrdXJhaWFqbXJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3NTYxMDksImV4cCI6MjA5NzMzMjEwOX0.-iOoIiCsBSE_vMdJV1QwFL0eNpIFQ3aBF4bjgcIJxjM';
const WA = '50375524443'; // tu número con código de país sin +

// ═══════════════════════════════════════════
// DEMO DATA
// ═══════════════════════════════════════════
const DEMO = [
  {id:1,name:'Camisa serigrafía premium',category:'camisas',price:12,description:'Camisa 100% algodón con estampado de alta resolución. Disponible en todas las tallas.',emoji:'👕',image_url:'',badge:'Popular',section:'featured',country:''},
  {id:2,name:'Taza personalizada full color',category:'tazas',price:8.5,description:'Taza cerámica 11oz con sublimación. Resistente al microondas y lavavajillas.',emoji:'☕',image_url:'',badge:'Nuevo',section:'featured',country:''},
  {id:3,name:'Botella termo estampada',category:'botellas',price:15,description:'Termo acero inoxidable 500ml. Frío 24h / calor 12h. Estampado duradero.',emoji:'🍶',image_url:'',badge:'',section:'general',country:''},
  {id:4,name:'Llavero acrílico personalizado',category:'llaveros',price:3.5,description:'Acrílico con diseño a todo color. Impresión UV de alta calidad.',emoji:'🔑',image_url:'',badge:'',section:'general',country:''},
  {id:5,name:'Gorra bordada',category:'gorras',price:10,description:'Gorra béisbol con logo bordado en alta definición. Ajustable.',emoji:'🧢',image_url:'',badge:'',section:'general',country:''},
  {id:6,name:'Bolsa ecológica estampada',category:'bolsas',price:5,description:'Tela no tejida resistente. Serigrafía un color o full color.',emoji:'👜',image_url:'',badge:'',section:'general',country:''},
  {id:7,name:'Camisa Argentina – Mundial 2026',category:'camisas',price:18,description:'Réplica selección argentina edición especial Mundial 2026. Serigrafía oficial.',emoji:'🇦🇷',image_url:'',badge:'Nuevo',section:'mundial',country:'Argentina'},
  {id:8,name:'Camisa México – Mundial 2026',category:'camisas',price:18,description:'Réplica verde y rojo de la selección mexicana. Edición especial.',emoji:'🇲🇽',image_url:'',badge:'Nuevo',section:'mundial',country:'Mexico'},
  {id:9,name:'Camisa Brasil – Mundial 2026',category:'camisas',price:18,description:'La canarinha para el Mundial 2026. Estampado oficial.',emoji:'🇧🇷',image_url:'',badge:'',section:'mundial',country:'Brasil'},
  {id:10,name:'Camisa El Salvador – Mundial 2026',category:'camisas',price:16,description:'Apoya a la Selecta. Orgullo salvadoreño en el mundial.',emoji:'🇸🇻',image_url:'',badge:'Popular',section:'mundial',country:'El Salvador'},
  {id:11,name:'Cuaderno personalizado A5',category:'cuadernos',price:7.5,description:'Portada serigrafíada. Pasta dura, 200 páginas rayadas.',emoji:'📓',image_url:'',badge:'',section:'general',country:''},
  {id:12,name:'Botella aluminio graduación',category:'botellas',price:14,description:'Ideal para regalos de graduación. Diseño personalizado incluido.',emoji:'🎓',image_url:'',badge:'Oferta',section:'featured',country:''},
];

// ═══════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════
let db = null;
let products = [];
let cart = JSON.parse(localStorage.getItem('sgv_cart')||'[]');
let favs = JSON.parse(localStorage.getItem('sgv_fav')||'[]');
let reviews = {};
let isAdmin = false;
let currentProd = null;
let currentRating = 0;
let catFilter = 'all';
let wcFilter = 'all';

// ═══════════════════════════════════════════
// SUPABASE INIT (non-blocking)
// ═══════════════════════════════════════════
function initSupabase() {
  if (typeof window.supabase === 'undefined') return;
  if (SUPABASE_URL.includes('TU_PROYECTO')) return;
  try { db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY); } catch(e) {}
}

// ═══════════════════════════════════════════
// LOAD PRODUCTS
// ═══════════════════════════════════════════
async function loadProducts() {
  if (db) {
    try {
      const {data,error} = await db.from('products').select('*').order('created_at',{ascending:false});
      if (!error && data && data.length) { products = data; renderAll(); return; }
    } catch(e) {}
  }
  products = DEMO;
  renderAll();
}

// ═══════════════════════════════════════════
// RENDER ALL
// ═══════════════════════════════════════════
function renderAll() {
  renderFeatured();
  renderCatalog();
  renderWC();
  renderFavs();
  renderAdminBars();
}

function catLabel(c) {
  return {camisas:'👕 Camisas',tazas:'☕ Tazas',botellas:'🍶 Botellas',llaveros:'🔑 Llaveros',gorras:'🧢 Gorras',bolsas:'👜 Bolsas',cuadernos:'📓 Cuadernos'}[c]||c;
}

function starsHtml(id, showCount) {
  const rs = reviews[id]||[];
  const avg = rs.length ? rs.reduce((s,r)=>s+r.rating,0)/rs.length : 0;
  const full = Math.round(avg);
  let h='<div class="stars">';
  for(let i=1;i<=5;i++) h+=`<span class="${i<=full?'sf':'se'}">★</span>`;
  if(showCount && rs.length) h+=`<span class="rc">${avg.toFixed(1)} (${rs.length})</span>`;
  else if(showCount) h+='<span class="rc">Sin reseñas</span>';
  h+='</div>';
  return h;
}

function badgeHtml(b) {
  if(!b) return '';
  const cls = b==='Nuevo'?'pb-new':b==='Oferta'?'pb-sale':'pb-hot';
  return `<span class="prod-badge ${cls}">${b}</span>`;
}

function adminBtns(id) {
  if(!isAdmin) return '';
  return `<div style="display:flex;gap:4px;padding:8px;border-top:1px solid var(--border)">
    <button style="flex:1;padding:5px;background:rgba(212,245,66,.12);border:1px solid rgba(212,245,66,.25);color:var(--neon);border-radius:6px;font-size:11px;cursor:pointer;font-family:inherit" data-edit="${id}">✏ Editar</button>
    <button style="flex:1;padding:5px;background:rgba(255,45,135,.1);border:1px solid rgba(255,45,135,.25);color:var(--magenta);border-radius:6px;font-size:11px;cursor:pointer;font-family:inherit" data-del="${id}">✕ Eliminar</button>
  </div>`;
}

function cardHtml(p) {
  const isFav = favs.includes(p.id);
  const img = p.image_url
    ? `<img class="prod-img" src="${p.image_url}" alt="${p.name}" loading="lazy">`
    : `<div class="prod-emoji-placeholder">${p.emoji||'🛍️'}</div>`;
  return `<div class="prod-card" data-id="${p.id}">
    <div class="img-wrap">
      ${img}
      ${badgeHtml(p.badge)}
      <button class="fav-btn${isFav?' on':''}" data-fav="${p.id}">♥</button>
    </div>
    <div class="prod-info">
      <p class="prod-cat">${catLabel(p.category)}${p.country?' · '+p.country:''}</p>
      <p class="prod-name">${p.name}</p>
      ${starsHtml(p.id,false)}
      <div class="prod-footer">
        <div class="prod-price">$${Number(p.price).toFixed(2)} <small>USD</small></div>
        <button class="add-btn" data-add="${p.id}">+ Carrito</button>
      </div>
    </div>
    ${adminBtns(p.id)}
  </div>`;
}

function renderGrid(elId, list) {
  const el = document.getElementById(elId);
  if(!el) return;
  if(!list.length){el.innerHTML='<div class="empty-state">Sin productos aún</div>';return;}
  el.innerHTML = list.map(cardHtml).join('');
}

function renderFeatured() {
  renderGrid('featured-grid', products.filter(p=>p.section==='featured'||p.featured).slice(0,4));
}

function renderCatalog() {
  let p = products.filter(p=>p.section!=='mundial');
  if(catFilter!=='all') p=p.filter(x=>x.category===catFilter);
  renderGrid('catalog-grid', p);
}

function renderWC() {
  let p = products.filter(p=>p.section==='mundial');
  if(wcFilter!=='all') p=p.filter(x=>x.country===wcFilter);
  renderGrid('wc-grid', p);
}

function renderFavs() {
  const p = products.filter(x=>favs.includes(x.id));
  const el = document.getElementById('fav-grid');
  if(!el) return;
  if(!p.length){
    el.innerHTML='<div class="fav-empty"><div class="big">♡</div><p>Aún no tienes favoritos.</p><p style="font-size:13px;margin-top:6px">Presiona ♥ en cualquier producto.</p></div>';
    return;
  }
  el.innerHTML = p.map(cardHtml).join('');
}

function renderAdminBars() {
  ['admin-bar-catalog','admin-bar-wc'].forEach(id=>{
    const el=document.getElementById(id);
    if(!el) return;
    if(!isAdmin){el.innerHTML='';return;}
    el.innerHTML=`<div class="admin-bar">
      <div class="admin-dot"></div><span>Modo administrador activo</span>
      <div class="admin-acts">
        <button class="admin-btn" id="${id}-add">+ Agregar producto</button>
        <button class="admin-btn red" id="${id}-logout">Cerrar sesión</button>
      </div>
    </div>`;
    document.getElementById(`${id}-add`).addEventListener('click', openAddProd);
    document.getElementById(`${id}-logout`).addEventListener('click', doLogout);
  });
}

// ═══════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════
function showPage(page) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-links button').forEach(b=>b.classList.remove('active'));
  const pg = document.getElementById('page-'+page);
  const nb = document.getElementById('nav-'+page);
  if(pg) pg.classList.add('active');
  if(nb) nb.classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});
  if(page==='favorites') renderFavs();
}

// ═══════════════════════════════════════════
// SEARCH
// ═══════════════════════════════════════════
function handleSearch(val) {
  const drop = document.getElementById('searchDrop');
  if(!val.trim()){drop.style.display='none';return;}
  const q=val.toLowerCase();
  const res=products.filter(p=>p.name.toLowerCase().includes(q)||p.category.toLowerCase().includes(q)).slice(0,6);
  if(!res.length){
    drop.innerHTML='<div style="padding:12px 14px;color:var(--muted);font-size:13px">Sin resultados</div>';
    drop.style.display='block';return;
  }
  drop.innerHTML=res.map(p=>`
    <div class="search-item" data-search-id="${p.id}">
      <div class="s-emoji">${p.emoji||'🛍️'}</div>
      <div><div class="s-name">${p.name}</div><div class="s-price">$${Number(p.price).toFixed(2)}</div></div>
    </div>`).join('');
  drop.style.display='block';
}

// ═══════════════════════════════════════════
// PRODUCT MODAL
// ═══════════════════════════════════════════
function openProduct(id) {
  const p=products.find(x=>x.id==id);
  if(!p) return;
  currentProd=p;
  document.getElementById('modal-cat').textContent=catLabel(p.category);
  document.getElementById('modal-name').textContent=p.name;
  document.getElementById('modal-price').textContent='$'+Number(p.price).toFixed(2)+' USD';
  document.getElementById('modal-desc').textContent=p.description||'Producto de alta calidad con acabado profesional.';
  document.getElementById('modal-img').innerHTML=p.image_url
    ?`<img src="${p.image_url}" style="width:100%;height:100%;object-fit:cover;border-radius:16px 0 0 16px" alt="${p.name}">`
    :`<div style="font-size:80px">${p.emoji||'🛍️'}</div>`;
  document.getElementById('modal-stars').innerHTML=starsHtml(p.id,true).replace('<div class="stars">','').replace('</div>','');
  renderRevList(p.id);
  currentRating=0;
  document.querySelectorAll('.sp').forEach(s=>s.classList.remove('lit'));
  document.getElementById('rev-text').value='';
  document.getElementById('rev-author').value='';
  document.getElementById('prodOverlay').classList.add('open');
  document.body.style.overflow='hidden';
}

function closeProductModal() {
  document.getElementById('prodOverlay').classList.remove('open');
  document.body.style.overflow='';
  currentProd=null;
}

// ═══════════════════════════════════════════
// REVIEWS
// ═══════════════════════════════════════════
function setRating(n) {
  currentRating=n;
  document.querySelectorAll('.sp').forEach(s=>s.classList.toggle('lit',parseInt(s.dataset.r)<=n));
}

function submitReview() {
  if(!currentProd) return;
  if(!currentRating){toast('Selecciona una calificación','err');return;}
  const text=document.getElementById('rev-text').value.trim();
  const author=document.getElementById('rev-author').value.trim()||'Anónimo';
  if(!text){toast('Escribe tu reseña','err');return;}
  if(!reviews[currentProd.id]) reviews[currentProd.id]=[];
  reviews[currentProd.id].unshift({rating:currentRating,text,author,date:new Date().toLocaleDateString('es-SV')});
  if(db){
    db.from('reviews').insert({product_id:currentProd.id,rating:currentRating,text,author}).catch(()=>{});
  }
  toast('¡Reseña publicada!','ok');
  document.getElementById('rev-text').value='';
  document.getElementById('rev-author').value='';
  currentRating=0;
  document.querySelectorAll('.sp').forEach(s=>s.classList.remove('lit'));
  renderRevList(currentProd.id);
  renderAll();
}

function renderRevList(id) {
  const rs=reviews[id]||[];
  const el=document.getElementById('rev-list');
  if(!rs.length){el.innerHTML='<p style="font-size:13px;color:var(--muted)">Sé el primero en reseñar este producto.</p>';return;}
  el.innerHTML=rs.map(r=>`<div class="rev-item">
    <div class="rev-meta">
      <div class="stars">${'<span class="sf">★</span>'.repeat(r.rating)}${'<span class="se">★</span>'.repeat(5-r.rating)}</div>
      <span class="rev-author">${r.author}</span>
      <span class="rev-date">· ${r.date}</span>
    </div>
    <p class="rev-text">${r.text}</p>
  </div>`).join('');
}

// ═══════════════════════════════════════════
// FAVORITES
// ═══════════════════════════════════════════
function toggleFav(id) {
  const i=favs.indexOf(id);
  if(i===-1){favs.push(id);toast('Añadido a favoritos ♥','ok');}
  else{favs.splice(i,1);toast('Eliminado de favoritos');}
  localStorage.setItem('sgv_fav',JSON.stringify(favs));
  updateBadges();
  renderAll();
}

// ═══════════════════════════════════════════
// CART
// ═══════════════════════════════════════════
function addToCart(id) {
  const p=products.find(x=>x.id==id);
  if(!p) return;
  const ex=cart.find(c=>c.id==id);
  if(ex) ex.qty++;
  else cart.push({id:p.id,name:p.name,price:p.price,emoji:p.emoji||'🛍️',qty:1});
  localStorage.setItem('sgv_cart',JSON.stringify(cart));
  updateBadges();
  renderCart();
  toast('Agregado al carrito 🛒','ok');
}

function removeFromCart(id) {
  cart=cart.filter(c=>c.id!=id);
  localStorage.setItem('sgv_cart',JSON.stringify(cart));
  updateBadges();renderCart();
}

function changeQty(id,d) {
  const item=cart.find(c=>c.id==id);
  if(!item) return;
  item.qty+=d;
  if(item.qty<1){removeFromCart(id);return;}
  localStorage.setItem('sgv_cart',JSON.stringify(cart));
  updateBadges();renderCart();
}

function renderCart() {
  const el=document.getElementById('cart-items');
  const em=document.getElementById('cart-empty');
  const ft=document.getElementById('cart-ft');
  if(!cart.length){el.style.display='none';ft.style.display='none';em.style.display='flex';return;}
  em.style.display='none';el.style.display='block';ft.style.display='block';
  let total=0;
  el.innerHTML=cart.map(c=>{
    total+=c.price*c.qty;
    return `<div class="cart-item">
      <div class="ci-emoji">${c.emoji}</div>
      <div class="ci-info">
        <div class="ci-name">${c.name}</div>
        <div class="ci-price">$${(c.price*c.qty).toFixed(2)}</div>
      </div>
      <div class="qty-row">
        <button class="qty-btn" data-qminus="${c.id}">−</button>
        <span class="qty-n">${c.qty}</span>
        <button class="qty-btn" data-qplus="${c.id}">+</button>
      </div>
      <button class="ci-rm" data-rm="${c.id}">✕</button>
    </div>`;
  }).join('');
  document.getElementById('cart-total').textContent='$'+total.toFixed(2);
}

function toggleCart() {
  document.getElementById('cartSide').classList.toggle('open');
  renderCart();
}

// ═══════════════════════════════════════════
// WHATSAPP
// ═══════════════════════════════════════════
function waOpen(msg) {
  window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`,'_blank');
}
function orderByWA() {
  if(!currentProd) return;
  waOpen(`Hola SerigrafSV! 👋\n\nQuiero información sobre:\n\n🛍️ *${currentProd.name}*\n💵 Precio: $${Number(currentProd.price).toFixed(2)} USD\n\n¿Pueden ayudarme?`);
}
function checkoutWA() {
  if(!cart.length) return;
  let msg='Hola SerigrafSV! 👋\n\nQuiero hacer el siguiente pedido:\n\n';
  let total=0;
  cart.forEach(c=>{msg+=`• ${c.name} x${c.qty} — $${(c.price*c.qty).toFixed(2)}\n`;total+=c.price*c.qty;});
  msg+=`\n💵 *Total: $${total.toFixed(2)} USD*\n\n¡Gracias!`;
  waOpen(msg);
}

// ═══════════════════════════════════════════
// BADGES
// ═══════════════════════════════════════════
function updateBadges() {
  const cc=cart.reduce((s,c)=>s+c.qty,0);
  const fc=favs.length;
  const cb=document.getElementById('cart-badge');
  cb.textContent=cc;cb.style.display=cc?'flex':'none';
  const fb=document.getElementById('fav-badge');
  fb.textContent=fc;fb.style.display=fc?'flex':'none';
  const fn=document.getElementById('fav-nav-count');
  if(fn) fn.textContent=fc?`(${fc})`:'';
}

// ═══════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════
async function doLogin() {
  const email=document.getElementById('login-email').value;
  const pass=document.getElementById('login-pass').value;
  if(!email||!pass){toast('Ingresa correo y contraseña','err');return;}
  if(db){
    try{
      const {data,error}=await db.auth.signInWithPassword({email,password:pass});
      if(error){toast('Credenciales incorrectas','err');return;}
    }catch(e){toast('Error de conexión','err');return;}
  }
  isAdmin=true;
  document.getElementById('auth-btn').textContent='👑';
  closeOverlay('authOverlay');
  toast('¡Bienvenido, administrador! 👑','ok');
  renderAll();
}

function doLogout() {
  if(db){db.auth.signOut().catch(()=>{});}
  isAdmin=false;
  document.getElementById('auth-btn').textContent='👤';
  toast('Sesión cerrada');
  renderAll();
}

// ═══════════════════════════════════════════
// ADD/EDIT PRODUCT
// ═══════════════════════════════════════════
function openAddProd(prodData) {
  const editing = prodData && prodData.id;
  document.getElementById('ap-title').textContent=editing?'Editar producto':'Agregar producto';
  document.getElementById('edit-id').value=editing?prodData.id:'';
  document.getElementById('p-name').value=editing?prodData.name:'';
  document.getElementById('p-cat').value=editing?prodData.category:'camisas';
  document.getElementById('p-price').value=editing?prodData.price:'';
  document.getElementById('p-desc').value=editing?prodData.description||'':'';
  document.getElementById('p-emoji').value=editing?prodData.emoji||'':'';
  document.getElementById('p-img').value=editing?prodData.image_url||'':'';
  document.getElementById('p-badge').value=editing?prodData.badge||'':'';
  document.getElementById('p-section').value=editing?prodData.section||'general':'general';
  document.getElementById('p-country').value=editing?prodData.country||'':'';
  document.getElementById('country-field').style.display=(editing&&prodData.section==='mundial')?'block':'none';
  document.getElementById('aprodOverlay').classList.add('open');
  document.body.style.overflow='hidden';
}

async function saveProd() {
  const id=document.getElementById('edit-id').value;
  const prod={
    name:document.getElementById('p-name').value.trim(),
    category:document.getElementById('p-cat').value,
    price:parseFloat(document.getElementById('p-price').value),
    description:document.getElementById('p-desc').value.trim(),
    emoji:document.getElementById('p-emoji').value.trim(),
    image_url:document.getElementById('p-img').value.trim(),
    badge:document.getElementById('p-badge').value,
    section:document.getElementById('p-section').value,
    country:document.getElementById('p-country').value,
  };
  if(!prod.name||isNaN(prod.price)){toast('Nombre y precio son requeridos','err');return;}
  if(db){
    try{
      if(id){await db.from('products').update(prod).eq('id',id);}
      else{await db.from('products').insert(prod);}
      await loadProducts();
    }catch(e){toast('Error guardando en base de datos','err');return;}
  } else {
    if(id){const i=products.findIndex(x=>x.id==id);if(i!==-1)products[i]={...products[i],...prod};}
    else{prod.id=Date.now();products.unshift(prod);}
    renderAll();
  }
  closeOverlay('aprodOverlay');
  toast(id?'Producto actualizado ✓':'Producto agregado ✓','ok');
}

async function deleteProd(id) {
  if(!confirm('¿Eliminar este producto?')) return;
  if(db){try{await db.from('products').delete().eq('id',id);await loadProducts();}catch(e){toast('Error eliminando','err');return;}}
  else{products=products.filter(p=>p.id!=id);renderAll();}
  toast('Producto eliminado');
}

// ═══════════════════════════════════════════
// OVERLAYS
// ═══════════════════════════════════════════
function closeOverlay(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow='';
}

// ═══════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════
function toast(msg,type='') {
  const el=document.createElement('div');
  el.className=`toast ${type}`;el.textContent=msg;
  document.getElementById('toasts').appendChild(el);
  setTimeout(()=>el.remove(),3000);
}

// ═══════════════════════════════════════════
// EVENT LISTENERS — toda la interactividad
// ═══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {

  // NAV LINKS
  document.getElementById('brand').addEventListener('click',()=>showPage('home'));
  document.getElementById('nav-home').addEventListener('click',()=>showPage('home'));
  document.getElementById('nav-catalog').addEventListener('click',()=>showPage('catalog'));
  document.getElementById('nav-wc').addEventListener('click',()=>showPage('wc'));
  document.getElementById('nav-favorites').addEventListener('click',()=>showPage('favorites'));

  // NAV ACTIONS
  document.getElementById('fav-nav-btn').addEventListener('click',()=>showPage('favorites'));
  document.getElementById('cart-nav-btn').addEventListener('click',toggleCart);
  document.getElementById('auth-btn').addEventListener('click',()=>{
    if(isAdmin){if(confirm('¿Cerrar sesión?'))doLogout();}
    else{document.getElementById('authOverlay').classList.add('open');document.body.style.overflow='hidden';}
  });

  // HERO BUTTONS
  document.getElementById('hero-catalog-btn').addEventListener('click',()=>showPage('catalog'));
  document.getElementById('hero-wc-btn').addEventListener('click',()=>showPage('wc'));
  document.getElementById('hero-wa-btn').addEventListener('click',()=>waOpen('Hola SerigrafSV! Quiero información sobre sus productos.'));
  document.getElementById('see-all-btn').addEventListener('click',()=>showPage('catalog'));
  document.getElementById('footer-wa-btn').addEventListener('click',()=>waOpen('Hola SerigrafSV! Quiero información sobre sus productos.'));

  // CATEGORY PILLS
  document.getElementById('cat-row').addEventListener('click',function(e){
    const pill=e.target.closest('.cat-pill');
    if(!pill) return;
    catFilter=pill.dataset.cat;
    document.querySelectorAll('#cat-row .cat-pill').forEach(b=>b.classList.remove('active'));
    pill.classList.add('active');
    renderCatalog();
  });

  // WC FLAGS
  document.getElementById('flag-row').addEventListener('click',function(e){
    const pill=e.target.closest('.flag-pill');
    if(!pill) return;
    wcFilter=pill.dataset.country;
    document.querySelectorAll('#flag-row .flag-pill').forEach(b=>b.classList.remove('active'));
    pill.classList.add('active');
    renderWC();
  });

  // SEARCH
  document.getElementById('searchInput').addEventListener('input',function(){handleSearch(this.value);});
  document.getElementById('searchDrop').addEventListener('click',function(e){
    const item=e.target.closest('[data-search-id]');
    if(!item) return;
    openProduct(parseInt(item.dataset.searchId));
    this.style.display='none';
    document.getElementById('searchInput').value='';
  });
  document.addEventListener('click',function(e){
    if(!document.getElementById('searchDrop').contains(e.target)&&e.target.id!=='searchInput'){
      document.getElementById('searchDrop').style.display='none';
    }
  });

  // PRODUCT CARDS (delegated)
  document.addEventListener('click',function(e){
    // FAV BUTTON
    const favBtn=e.target.closest('[data-fav]');
    if(favBtn){e.stopPropagation();toggleFav(parseInt(favBtn.dataset.fav));return;}
    // ADD TO CART
    const addBtn=e.target.closest('[data-add]');
    if(addBtn){e.stopPropagation();addToCart(parseInt(addBtn.dataset.add));return;}
    // EDIT
    const editBtn=e.target.closest('[data-edit]');
    if(editBtn){e.stopPropagation();const p=products.find(x=>x.id==editBtn.dataset.edit);if(p)openAddProd(p);return;}
    // DELETE
    const delBtn=e.target.closest('[data-del]');
    if(delBtn){e.stopPropagation();deleteProd(parseInt(delBtn.dataset.del));return;}
    // CARD CLICK → open modal
    const card=e.target.closest('.prod-card');
    if(card&&card.dataset.id){openProduct(parseInt(card.dataset.id));return;}
  });

  // PRODUCT MODAL
  document.getElementById('modal-close-btn').addEventListener('click',closeProductModal);
  document.getElementById('prodOverlay').addEventListener('click',function(e){if(e.target===this)closeProductModal();});
  document.getElementById('modal-wa-btn').addEventListener('click',orderByWA);
  document.getElementById('modal-cart-btn').addEventListener('click',()=>{if(currentProd)addToCart(currentProd.id);});

  // REVIEWS
  document.getElementById('star-pick').addEventListener('click',function(e){
    const btn=e.target.closest('.sp');
    if(btn) setRating(parseInt(btn.dataset.r));
  });
  document.getElementById('rev-submit-btn').addEventListener('click',submitReview);

  // CART
  document.getElementById('cart-close-btn').addEventListener('click',toggleCart);
  document.getElementById('checkout-btn').addEventListener('click',checkoutWA);
  document.getElementById('cart-items').addEventListener('click',function(e){
    const rm=e.target.closest('[data-rm]');
    if(rm){removeFromCart(parseInt(rm.dataset.rm));return;}
    const qm=e.target.closest('[data-qminus]');
    if(qm){changeQty(parseInt(qm.dataset.qminus),-1);return;}
    const qp=e.target.closest('[data-qplus]');
    if(qp){changeQty(parseInt(qp.dataset.qplus),1);}
  });

  // AUTH MODAL
  document.getElementById('auth-close-btn').addEventListener('click',()=>closeOverlay('authOverlay'));
  document.getElementById('authOverlay').addEventListener('click',function(e){if(e.target===this)closeOverlay('authOverlay');});
  document.getElementById('login-btn').addEventListener('click',doLogin);
  document.getElementById('login-pass').addEventListener('keydown',function(e){if(e.key==='Enter')doLogin();});

  // ADD PRODUCT MODAL
  document.getElementById('cancel-prod-btn').addEventListener('click',()=>closeOverlay('aprodOverlay'));
  document.getElementById('aprodOverlay').addEventListener('click',function(e){if(e.target===this)closeOverlay('aprodOverlay');});
  document.getElementById('save-prod-btn').addEventListener('click',saveProd);
  document.getElementById('p-section').addEventListener('change',function(){
    document.getElementById('country-field').style.display=this.value==='mundial'?'block':'none';
  });

  // INIT
  initSupabase();
  loadProducts();
  updateBadges();
});

async function cargarProductos() {
    // 1. Pedimos los productos a la tabla 'productos'
    const { data, error } = await supabase.from('productos').select('*');

    if (error) {
        console.error("Error al cargar:", error);
        return;
    }

    // 2. Limpiamos el contenedor donde se muestran los productos
    const contenedor = document.getElementById('cat-row'); // Asegúrate que este sea el ID correcto
    contenedor.innerHTML = ''; 

    // 3. Dibujamos cada producto en el HTML
    data.forEach(prod => {
        const div = document.createElement('div');
        div.className = 'producto-card'; // Usa la clase CSS que ya tengas
        div.innerHTML = `
            <img src="${prod.imagen_url}" alt="${prod.nombre}">
            <h3>${prod.nombre}</h3>
            <p>$${prod.precio}</p>
        `;
        contenedor.appendChild(div);
    });
}

// Ejecutamos esto apenas cargue la página
window.onload = cargarProductos;

async function saveProd() {
    const nombre = document.getElementById('nombre-input').value; // Ajusta los IDs a los tuyos
    const precio = document.getElementById('precio-input').value;
    const url = document.getElementById('url-input').value;
    const cat = document.getElementById('p-section').value;

    const { data, error } = await supabase
        .from('productos')
        .insert([{ nombre, precio, imagen_url: url, categoria: cat }]);

    if (error) {
        alert("Error al guardar: " + error.message);
    } else {
        alert("¡Producto guardado!");
        cargarProductos(); // <-- ¡Aquí está la magia! Esto refresca la pantalla sola
    }
}
