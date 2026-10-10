/* ===================== Avilair — App Logic ===================== */
(function(){
  "use strict";

  /* ---------- helpers ---------- */
  const $  = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
  const money = n => "₹" + Number(n).toLocaleString("en-IN");
  const store = {
    get(key, fallback){ try{ const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }catch(e){ return fallback; } },
    set(key, val){ try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){} }
  };

  const CATEGORIES = [...new Set(PRODUCTS.map(p => p.category))];
  const ALL_SIZES  = [...new Set(PRODUCTS.flatMap(p => p.sizes))];
  const ALL_COLORS = [...new Set(PRODUCTS.flatMap(p => p.colours.map(c => c.name.replace(/\s\d+$/,''))))];

  const CATEGORY_BANNER = {
    "Block Heel Mules":     {banner:"assets/banners/banner-mules.jpg",  card:"assets/banners/card-mules.jpg",  eyebrow:"The Signature Edit", title:"Move in Style", sub:"Glossy patent block-heel mules, made for everyday polish.", cta:"Shop Block Heel Mules"},
    "Heeled Sandals":       {banner:"assets/banners/banner-heeled.jpg", card:"assets/banners/card-heeled.jpg", eyebrow:"Party & Festive", title:"Step Up The Occasion", sub:"Buckle ankle-strap sandals on a walkable block heel.", cta:"Shop Heeled Sandals"},
    "Flat Sandals":         {banner:"assets/banners/banner-flat.jpg",   card:"assets/banners/card-flat.jpg",   eyebrow:"Everyday Comfort", title:"Easy, All Day", sub:"Embellished flat slides for warm-weather wear.", cta:"Shop Flat Sandals"},
    "Kids Knit Slip-Ons":   {banner:"assets/banners/banner-kids.jpg",   card:"assets/banners/card-kids.jpg",   eyebrow:"Little Feet", title:"Playground Ready", sub:"Sock-fit knit slip-ons kids can wear all on their own.", cta:"Shop Kids Collection"},
    "Wedge Sandals":        {banner:"assets/products/wedge-77-black/1.jpg", card:"assets/products/wedge-77-black/1.jpg", eyebrow:"Warm-Weather Edit", title:"Height, Comfortably", sub:"Cork and raffia-effect wedge sandals for all-day wear.", cta:"Shop Wedge Sandals"},
  };

  /* ---------- state ---------- */
  let cart     = store.get("avilair_cart", []);       // {productId, colour, size, qty}
  let wishlist = store.get("avilair_wishlist", []);   // [productId]
  let filters  = { categories:new Set(), colors:new Set(), sizes:new Set(), priceMin:null, priceMax:null, query:"" };
  let sortMode = "featured";

  function productById(id){ return PRODUCTS.find(p => p.id === id); }

  /* ================= HEADER / NAV ================= */
  const hamburgerBtn = $("#hamburgerBtn"), mobileNav = $("#mobileNav"), mobileNavClose = $("#mobileNavClose"), scrim = $("#scrim");
  function openMobileNav(){ mobileNav.classList.add("open"); scrim.classList.add("show"); }
  function closeMobileNav(){ mobileNav.classList.remove("open"); scrim.classList.remove("show"); }
  hamburgerBtn.addEventListener("click", openMobileNav);
  mobileNavClose.addEventListener("click", closeMobileNav);
  scrim.addEventListener("click", () => { closeMobileNav(); closeFilters(); });
  $$("#mobileNav a").forEach(a => a.addEventListener("click", closeMobileNav));

  const searchToggle = $("#searchToggle"), searchBox = $("#searchBox"), searchInput = $("#searchInput");
  searchToggle.addEventListener("click", () => {
    searchBox.classList.toggle("open");
    if (searchBox.classList.contains("open")) searchInput.focus();
  });
  searchInput.addEventListener("input", () => {
    filters.query = searchInput.value.trim().toLowerCase();
    renderShop();
  });
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { document.getElementById("shop").scrollIntoView({behavior:"smooth"}); }
  });

  // nav links that pre-filter shop
  $$('a[href="#shop"]').forEach(a => {
    a.addEventListener("click", () => {
      const cat = a.dataset.cat, gender = a.dataset.gender;
      if (cat === "all") { filters.categories.clear(); }
      else if (cat) { filters.categories = new Set([cat]); }
      if (gender) { filters.query = gender.toLowerCase(); searchInput.value = ""; }
      else if (cat) { filters.query = ""; searchInput.value = ""; }
      syncFilterUI();
      renderShop();
    });
  });

  /* ================= INFO MODAL (footer links) ================= */
  const INFO_CONTENT = {
    about: {title:"About Avilair", body:"Avilair began with a simple frustration: shoes that looked good rarely felt good by the end of the day. So we set out to design footwear that doesn't ask you to choose between the two — block-heel mules, strappy sandals and wedges built on comfort-first soles, finished with the kind of detailing that holds up to a closer look. Every pair is designed to be worn, not just admired: to a desk, a dinner, a wedding, a walk to the school gate. We design in small, considered batches rather than chasing every trend, and we make sure the little ones are looked after too, with soft, easy knit slip-ons built for small feet on the move. Avilair is for anyone who wants their shoes to keep up with their day — comfortably, and in style."},
    contact: {title:"Contact Us", body:"9599951397"},
    shipping: {title:"Shipping Info", body:"Orders are typically processed within 1–2 business days and dispatched via our courier partners. Standard delivery takes 3–6 business days depending on location; metro pincodes may receive orders sooner. A tracking link is shared by email/SMS once your order ships. Shipping is free above a minimum order value, with a flat fee applied below that threshold."},
    returns: {title:"Returns & Exchanges", body:"Unworn items in their original packaging can be returned or exchanged within 7 days of delivery. To start a return, contact customer support with your order number; once the item passes a quality check, refunds are issued to the original payment method within 5–7 business days, or an exchange is dispatched. Sale items are typically final unless faulty."},
  };
  const infoModal = $("#infoModal"), infoModalBox = $("#infoModalBox");
  $$('[data-info]').forEach(a => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const d = INFO_CONTENT[a.dataset.info];
      infoModalBox.innerHTML = `<button class="modal-close" id="infoCloseX">&times;</button>
        <h3 class="serif" style="margin-top:0;">${d.title}</h3>
        <p style="color:var(--ink-soft);line-height:1.7;font-size:14px;">${d.body}</p>`;
      infoModal.classList.add("show");
      $("#infoCloseX").addEventListener("click", () => infoModal.classList.remove("show"));
    });
  });
  infoModal.addEventListener("click", e => { if (e.target === infoModal) infoModal.classList.remove("show"); });

  /* ================= SIZE GUIDE ================= */
  const WOMENS_SIZE_CHART = [
    {in:"36", uk:"3", eu:"36", cm:"22.9"},
    {in:"37", uk:"4", eu:"37", cm:"23.5"},
    {in:"38", uk:"5", eu:"38", cm:"24.1"},
    {in:"39", uk:"6", eu:"39", cm:"24.8"},
    {in:"40", uk:"7", eu:"40", cm:"25.4"},
  ];
  const KIDS_SIZE_CHART = [
    {uk:"4", eu:"20", cm:"12.5"},
    {uk:"5", eu:"21", cm:"13.3"},
    {uk:"6", eu:"23", cm:"14.0"},
    {uk:"7", eu:"24", cm:"14.8"},
    {uk:"8", eu:"25", cm:"15.5"},
    {uk:"9", eu:"27", cm:"16.3"},
    {uk:"10", eu:"28", cm:"17.0"},
  ];
  function openSizeGuide(gender){
    const isKids = gender === "Kids";
    const rows = isKids
      ? KIDS_SIZE_CHART.map(r => `<tr><td>${r.uk}</td><td>${r.eu}</td><td>${r.cm} cm</td></tr>`).join("")
      : WOMENS_SIZE_CHART.map(r => `<tr><td>${r.in}</td><td>${r.uk}</td><td>${r.eu}</td><td>${r.cm} cm</td></tr>`).join("");
    const head = isKids
      ? `<tr><th>UK</th><th>EU</th><th>Foot Length</th></tr>`
      : `<tr><th>IN</th><th>UK</th><th>EU</th><th>Foot Length</th></tr>`;
    infoModalBox.innerHTML = `<button class="modal-close" id="infoCloseX">&times;</button>
      <h3 class="serif" style="margin-top:0;">${isKids ? "Kids" : "Women's"} Size Guide</h3>
      <p style="color:var(--ink-soft);line-height:1.6;font-size:13px;">Measure foot length from heel to the longest toe, standing, in the evening when feet are largest. If between sizes, size up.</p>
      <table class="size-chart"><thead>${head}</thead><tbody>${rows}</tbody></table>`;
    infoModal.classList.add("show");
    $("#infoCloseX").addEventListener("click", () => infoModal.classList.remove("show"));
  }

  /* ================= HERO SLIDER ================= */
  const heroSlidesEl = $("#heroSlides"), heroDotsEl = $("#heroDots");
  let heroIndex = 0, heroTimer = null;
  const heroCats = CATEGORIES.filter(c => CATEGORY_BANNER[c]);

  function buildHero(){
    heroSlidesEl.innerHTML = heroCats.map((cat, i) => {
      const b = CATEGORY_BANNER[cat];
      return `<div class="hero-slide ${i===0?'active':''}" data-cat="${cat}" style="background-image:url('${b.banner}')">
        <div class="hero-slide-content">
          <span class="hero-eyebrow">${b.eyebrow}</span>
          <h1 class="hero-title serif">${b.title}</h1>
          <p class="hero-sub">${b.sub}</p>
          <button class="btn btn-gold hero-cta" data-cat="${cat}">${b.cta}</button>
        </div>
      </div>`;
    }).join("");
    heroDotsEl.innerHTML = heroCats.map((_, i) => `<button class="hero-dot ${i===0?'active':''}" data-i="${i}" aria-label="Go to slide ${i+1}"></button>`).join("");
    $$(".hero-cta").forEach(btn => btn.addEventListener("click", () => {
      filters.categories = new Set([btn.dataset.cat]);
      filters.query = ""; searchInput.value = "";
      syncFilterUI(); renderShop();
      document.getElementById("shop").scrollIntoView({behavior:"smooth"});
    }));
    $$(".hero-dot").forEach(d => d.addEventListener("click", () => goToHero(parseInt(d.dataset.i))));
  }
  function goToHero(i){
    heroIndex = (i + heroCats.length) % heroCats.length;
    $$(".hero-slide").forEach((s, idx) => s.classList.toggle("active", idx === heroIndex));
    $$(".hero-dot").forEach((d, idx) => d.classList.toggle("active", idx === heroIndex));
    resetHeroTimer();
  }
  function resetHeroTimer(){ clearInterval(heroTimer); heroTimer = setInterval(() => goToHero(heroIndex+1), 5500); }
  $("#heroPrev").addEventListener("click", () => goToHero(heroIndex-1));
  $("#heroNext").addEventListener("click", () => goToHero(heroIndex+1));
  // swipe support
  (function(){
    const hero = $(".hero"); let sx = 0;
    hero.addEventListener("touchstart", e => sx = e.touches[0].clientX, {passive:true});
    hero.addEventListener("touchend", e => {
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 40) goToHero(heroIndex + (dx < 0 ? 1 : -1));
    }, {passive:true});
    hero.addEventListener("mouseenter", () => clearInterval(heroTimer));
    hero.addEventListener("mouseleave", resetHeroTimer);
  })();

  /* ================= CATEGORY GRID ================= */
  function buildCategoryGrid(){
    $("#categoryGrid").innerHTML = CATEGORIES.map(cat => {
      const b = CATEGORY_BANNER[cat] || {};
      const count = PRODUCTS.filter(p => p.category === cat).length;
      return `<div class="cat-card reveal">
        <img src="${b.card || ''}" alt="${cat}" loading="lazy">
        <div class="cat-card-info">
          <h3 class="serif">${cat}</h3>
          <button class="btn btn-outline" data-cat="${cat}">Explore (${count})</button>
        </div>
      </div>`;
    }).join("");
    $$("#categoryGrid button").forEach(btn => btn.addEventListener("click", () => {
      filters.categories = new Set([btn.dataset.cat]);
      filters.query = ""; searchInput.value = "";
      syncFilterUI(); renderShop();
      document.getElementById("shop").scrollIntoView({behavior:"smooth"});
    }));
  }

  /* ================= PRODUCT CARD (shared) ================= */
  function productCardHTML(p){
    const c0 = p.colours[0];
    const imgA = c0.images[0], imgB = c0.images[1] || c0.images[0];
    const isWished = wishlist.includes(p.id);
    return `<div class="product-card" data-id="${p.id}">
      <div class="product-media">
        ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ""}
        <button class="wish-btn ${isWished?'active':''}" data-wish="${p.id}" aria-label="Toggle wishlist">
          <svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-10-9.1C0.3 8.4 2 4.8 5.6 4.2c2-.3 3.9.6 5 2.2 1.1-1.6 3-2.5 5-2.2 3.6.6 5.3 4.2 3.6 7.7C19.5 16.4 12 21 12 21z"/></svg>
        </button>
        <img class="img-a" src="${imgA}" alt="${p.name}" loading="lazy">
        <img class="img-b" src="${imgB}" alt="${p.name} alternate view" loading="lazy">
        <button class="qv-btn" data-quickview="${p.id}">Quick View</button>
      </div>
      <div class="product-info">
        <div class="product-cat">${p.category}</div>
        <h3 class="product-name">${p.name}</h3>
        <div class="product-meta">
          <span class="product-price">${money(p.price)}</span>
          <span class="product-colors">${p.colours[0].name}</span>
        </div>
        <button class="add-cart-mini" data-quickadd="${p.id}">Add to Cart</button>
      </div>
    </div>`;
  }

  function bindProductCardEvents(container){
    $$("[data-id]", container).forEach(card => {
      card.addEventListener("click", (e) => {
        if (e.target.closest("[data-wish],[data-quickview],[data-quickadd]")) return;
        openProductModal(parseInt(card.dataset.id), false);
      });
    });
    $$("[data-wish]", container).forEach(btn => btn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleWishlist(parseInt(btn.dataset.wish));
    }));
    $$("[data-quickview]", container).forEach(btn => btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openProductModal(parseInt(btn.dataset.quickview), true);
    }));
    $$("[data-quickadd]", container).forEach(btn => btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const p = productById(parseInt(btn.dataset.quickadd));
      addToCart(p.id, p.colours[0].name, p.sizes[0], 1);
    }));
  }

  /* ================= NEW ARRIVALS ================= */
  function buildNewArrivals(){
    let picks = PRODUCTS.filter(p => p.badge === "New Arrival");
    if (picks.length < 8) {
      const rest = PRODUCTS.filter(p => !picks.includes(p));
      picks = picks.concat(rest.slice(0, 10 - picks.length));
    }
    picks = picks.slice(0, 10);
    const track = $("#newArrivalsTrack");
    track.innerHTML = picks.map(productCardHTML).join("");
    bindProductCardEvents(track);
  }
  $("#carouselPrev").addEventListener("click", () => $("#newArrivalsTrack").scrollBy({left:-560, behavior:"smooth"}));
  $("#carouselNext").addEventListener("click", () => $("#newArrivalsTrack").scrollBy({left:560, behavior:"smooth"}));

  /* ================= SHOP: FILTERS ================= */
  function buildFilterPanel(){
    $("#filterCategory").innerHTML = CATEGORIES.map(cat => `
      <label class="filter-opt"><input type="checkbox" value="${cat}" data-filter="category"> ${cat} <span style="margin-left:auto;color:#b9b3a2;">(${PRODUCTS.filter(p=>p.category===cat).length})</span></label>
    `).join("");
    $("#filterSize").innerHTML = ALL_SIZES.map(sz => `
      <label class="filter-opt" style="width:auto;padding:6px 10px;border:1px solid var(--line);border-radius:6px;margin:0;">
        <input type="checkbox" value="${sz}" data-filter="size" style="display:none;"> ${sz}
      </label>
    `).join("");
    $("#filterColor").innerHTML = ALL_COLORS.map(col => `
      <span class="swatch-opt" data-filter="color" data-color="${col}" title="${col}" style="background:${cssColor(col)}"></span>
    `).join("");

    $$('[data-filter="category"]').forEach(cb => cb.addEventListener("change", () => {
      cb.checked ? filters.categories.add(cb.value) : filters.categories.delete(cb.value);
      renderShop();
    }));
    $$('[data-filter="size"]').forEach(cb => cb.addEventListener("change", () => {
      cb.checked ? filters.sizes.add(cb.value) : filters.sizes.delete(cb.value);
      cb.closest("label").style.background = cb.checked ? "var(--navy)" : "";
      cb.closest("label").style.color = cb.checked ? "#fff" : "";
      cb.closest("label").style.borderColor = cb.checked ? "var(--navy)" : "var(--line)";
      renderShop();
    }));
    $$('[data-filter="color"]').forEach(sw => sw.addEventListener("click", () => {
      const col = sw.dataset.color;
      if (filters.colors.has(col)) { filters.colors.delete(col); sw.classList.remove("checked"); }
      else { filters.colors.add(col); sw.classList.add("checked"); }
      renderShop();
    }));
    $("#priceMin").addEventListener("input", e => { filters.priceMin = e.target.value ? +e.target.value : null; renderShop(); });
    $("#priceMax").addEventListener("input", e => { filters.priceMax = e.target.value ? +e.target.value : null; renderShop(); });
    $("#clearFilters").addEventListener("click", () => {
      filters = { categories:new Set(), colors:new Set(), sizes:new Set(), priceMin:null, priceMax:null, query:"" };
      searchInput.value = "";
      $("#priceMin").value = ""; $("#priceMax").value = "";
      syncFilterUI(); renderShop();
    });
    $("#sortSelect").addEventListener("change", e => { sortMode = e.target.value; renderShop(); });
  }
  function syncFilterUI(){
    $$('[data-filter="category"]').forEach(cb => cb.checked = filters.categories.has(cb.value));
    $$('[data-filter="size"]').forEach(cb => {
      cb.checked = filters.sizes.has(cb.value);
      cb.closest("label").style.background = cb.checked ? "var(--navy)" : "";
      cb.closest("label").style.color = cb.checked ? "#fff" : "";
    });
    $$('[data-filter="color"]').forEach(sw => sw.classList.toggle("checked", filters.colors.has(sw.dataset.color)));
  }
  const COLOR_CSS = {Black:"#222",White:"#f5f5f5",Cream:"#f0e5c8",Beige:"#dec8a0",Nude:"#dfb298",Tan:"#c49a6c",
    Brown:"#6e4a2d",Maroon:"#6c1e28",Red:"#b41e23",Pink:"#ebaabe","Rose Gold":"#c8968a",Gold:"#c8a550",
    Silver:"#c3c3c8",Grey:"#8c8c8c",Navy:"#1e2846",Blue:"#3c5aa0",Green:"#3c6e50",Olive:"#646934",
    Yellow:"#e1c850",Orange:"#d7783c",Purple:"#6e4678",Mauve:"#966e78",Peach:"#f0bea0",Wine:"#5f1e2d",Multicolour:"linear-gradient(135deg,#e1c850,#b41e23,#3c5aa0)"};
  function cssColor(name){ return COLOR_CSS[name] || "#999"; }

  /* ================= SHOP: RENDER ================= */
  function getFilteredSorted(){
    let list = PRODUCTS.filter(p => {
      if (filters.categories.size && !filters.categories.has(p.category)) return false;
      if (filters.sizes.size && !p.sizes.some(s => filters.sizes.has(s))) return false;
      if (filters.colors.size && !p.colours.some(c => filters.colors.has(c.name.replace(/\s\d+$/,'')))) return false;
      if (filters.priceMin != null && p.price < filters.priceMin) return false;
      if (filters.priceMax != null && p.price > filters.priceMax) return false;
      if (filters.query){
        const hay = (p.name + " " + p.category + " " + p.gender + " " + p.colours.map(c=>c.name).join(" ")).toLowerCase();
        if (!hay.includes(filters.query)) return false;
      }
      return true;
    });
    if (sortMode === "price-asc") list.sort((a,b)=>a.price-b.price);
    else if (sortMode === "price-desc") list.sort((a,b)=>b.price-a.price);
    else if (sortMode === "name-asc") list.sort((a,b)=>a.name.localeCompare(b.name));
    return list;
  }
  function renderShop(){
    const list = getFilteredSorted();
    const grid = $("#shopGrid");
    grid.innerHTML = list.map(productCardHTML).join("");
    bindProductCardEvents(grid);
    $("#resultCount").textContent = `${list.length} product${list.length!==1?'s':''}`;
    $("#noResults").style.display = list.length ? "none" : "block";
    grid.style.display = list.length ? "grid" : "none";
    revealObserve();
  }

  /* mobile filter drawer */
  const filtersPanel = $("#filtersPanel");
  $("#filterToggleMobile").addEventListener("click", () => { filtersPanel.classList.add("open"); $("#filtersClose").style.display="block"; scrim.classList.add("show"); });
  function closeFilters(){ filtersPanel.classList.remove("open"); }
  $("#filtersClose").addEventListener("click", () => { closeFilters(); scrim.classList.remove("show"); });

  /* ================= WISHLIST ================= */
  function toggleWishlist(id){
    if (wishlist.includes(id)) wishlist = wishlist.filter(x => x !== id);
    else { wishlist.push(id); showToast("Added to wishlist"); }
    store.set("avilair_wishlist", wishlist);
    updateWishBadge();
    renderShop(); buildNewArrivals(); renderWishDrawer();
    // keep modal heart in sync if open
    const modalWish = $("#pdWishBtn");
    if (modalWish) modalWish.classList.toggle("active", wishlist.includes(id));
  }
  function updateWishBadge(){
    const el = $("#wishCount");
    el.textContent = wishlist.length;
    el.style.display = wishlist.length ? "flex" : "none";
  }
  function renderWishDrawer(){
    const body = $("#wishBody");
    if (!wishlist.length){ body.innerHTML = `<div class="empty-state">Your wishlist is empty.<br>Tap the heart on any product to save it here.</div>`; return; }
    body.innerHTML = wishlist.map(id => {
      const p = productById(id); if (!p) return "";
      return `<div class="drawer-item" data-id="${p.id}">
        <img src="${p.colours[0].images[0]}" alt="${p.name}">
        <div class="drawer-item-info">
          <p class="nm">${p.name}</p>
          <p class="meta">${p.category} · ${money(p.price)}</p>
          <div style="display:flex;gap:10px;align-items:center;">
            <button class="btn btn-ghost" style="padding:7px 12px;font-size:10.5px;" data-wl-add="${p.id}">Add to Cart</button>
            <button class="remove-link" data-wl-remove="${p.id}">Remove</button>
          </div>
        </div>
      </div>`;
    }).join("");
    $$("[data-wl-remove]", body).forEach(b => b.addEventListener("click", () => toggleWishlist(parseInt(b.dataset.wlRemove))));
    $$("[data-wl-add]", body).forEach(b => b.addEventListener("click", () => {
      const p = productById(parseInt(b.dataset.wlAdd));
      addToCart(p.id, p.colours[0].name, p.sizes[0], 1);
    }));
  }
  $("#wishToggle").addEventListener("click", () => { renderWishDrawer(); $("#wishDrawer").classList.add("open"); scrim.classList.add("show"); });
  $("#wishClose").addEventListener("click", closeDrawers);

  /* ================= CART ================= */
  function addToCart(productId, colour, size, qty){
    const existing = cart.find(i => i.productId===productId && i.colour===colour && i.size===size);
    if (existing) existing.qty += qty;
    else cart.push({productId, colour, size, qty});
    store.set("avilair_cart", cart);
    updateCartBadge(); renderCartDrawer();
    showToast("Added to cart");
  }
  function updateCartQty(idx, delta){
    cart[idx].qty += delta;
    if (cart[idx].qty <= 0) cart.splice(idx,1);
    store.set("avilair_cart", cart);
    updateCartBadge(); renderCartDrawer();
  }
  function removeCartItem(idx){
    cart.splice(idx,1);
    store.set("avilair_cart", cart);
    updateCartBadge(); renderCartDrawer();
  }
  function updateCartBadge(){
    const count = cart.reduce((s,i)=>s+i.qty,0);
    const el = $("#cartCount");
    el.textContent = count;
    el.style.display = count ? "flex" : "none";
  }
  function renderCartDrawer(){
    const body = $("#cartBody");
    if (!cart.length){ body.innerHTML = `<div class="empty-state">Your cart is empty.<br>Start adding your favourite styles.</div>`; $("#cartSubtotal").textContent = money(0); return; }
    let subtotal = 0;
    body.innerHTML = cart.map((item, idx) => {
      const p = productById(item.productId); if (!p) return "";
      const colourObj = p.colours.find(c => c.name === item.colour) || p.colours[0];
      subtotal += p.price * item.qty;
      return `<div class="drawer-item">
        <img src="${colourObj.images[0]}" alt="${p.name}">
        <div class="drawer-item-info">
          <p class="nm">${p.name}</p>
          <p class="meta">${item.colour} · Size ${item.size} · ${money(p.price)}</p>
          <div class="qty-stepper">
            <button data-dec="${idx}">−</button>
            <span>${item.qty}</span>
            <button data-inc="${idx}">+</button>
            <button class="remove-link" data-remove="${idx}">Remove</button>
          </div>
        </div>
      </div>`;
    }).join("");
    $("#cartSubtotal").textContent = money(subtotal);
    $$("[data-inc]", body).forEach(b => b.addEventListener("click", () => updateCartQty(parseInt(b.dataset.inc), 1)));
    $$("[data-dec]", body).forEach(b => b.addEventListener("click", () => updateCartQty(parseInt(b.dataset.dec), -1)));
    $$("[data-remove]", body).forEach(b => b.addEventListener("click", () => removeCartItem(parseInt(b.dataset.remove))));
  }
  $("#cartToggle").addEventListener("click", () => { renderCartDrawer(); $("#cartDrawer").classList.add("open"); scrim.classList.add("show"); });
  $("#cartClose").addEventListener("click", closeDrawers);
  $("#checkoutBtn").addEventListener("click", () => {
    if (!cart.length) return;
    closeDrawers();
    openCheckout();
  });

  /* ================= CHECKOUT ================= */
  const checkoutModal = $("#checkoutModal"), checkoutModalBox = $("#checkoutModalBox");

  function orderTotal(items){
    return items.reduce((s,i)=>{ const p = productById(i.productId); return s + (p ? p.price * i.qty : 0); }, 0);
  }

  function openCheckout(){
    const saved = store.get("avilair_customer", null);
    const items = cart.map(i => { const p = productById(i.productId); return { ...i, name: p ? p.name : "Item", price: p ? p.price : 0 }; });
    const subtotal = orderTotal(cart);

    checkoutModalBox.innerHTML = `
      <button class="modal-close" id="checkoutCloseX">&times;</button>
      <h3 class="serif" style="margin-top:0;">Checkout</h3>
      <div class="checkout-summary">
        ${items.map(i => `<div class="checkout-line"><span>${i.name} · ${i.colour} · Size ${i.size} × ${i.qty}</span><span>${money(i.price*i.qty)}</span></div>`).join("")}
        <div class="checkout-line checkout-total"><span>Total</span><span>${money(subtotal)}</span></div>
      </div>
      <form id="checkoutForm" class="checkout-form" novalidate>
        <h5>Delivery Details</h5>
        <div class="form-row">
          <div class="form-field">
            <label for="ckName">Full Name *</label>
            <input type="text" id="ckName" name="name" required value="${saved?.name || ""}">
          </div>
          <div class="form-field">
            <label for="ckPhone">Phone Number *</label>
            <input type="tel" id="ckPhone" name="phone" required value="${saved?.phone || ""}">
          </div>
        </div>
        <div class="form-field">
          <label for="ckEmail">Email *</label>
          <input type="email" id="ckEmail" name="email" required value="${saved?.email || ""}">
        </div>
        <div class="form-field">
          <label for="ckAddr1">Address Line 1 *</label>
          <input type="text" id="ckAddr1" name="address1" required value="${saved?.address1 || ""}" placeholder="House no., building, street">
        </div>
        <div class="form-field">
          <label for="ckAddr2">Address Line 2</label>
          <input type="text" id="ckAddr2" name="address2" value="${saved?.address2 || ""}" placeholder="Landmark, area (optional)">
        </div>
        <div class="form-row">
          <div class="form-field">
            <label for="ckCity">City *</label>
            <input type="text" id="ckCity" name="city" required value="${saved?.city || ""}">
          </div>
          <div class="form-field">
            <label for="ckState">State *</label>
            <input type="text" id="ckState" name="state" required value="${saved?.state || ""}">
          </div>
          <div class="form-field">
            <label for="ckPincode">Pincode *</label>
            <input type="text" id="ckPincode" name="pincode" required value="${saved?.pincode || ""}" inputmode="numeric">
          </div>
        </div>
        <p class="checkout-note">We'll use these details only to deliver your order and share updates about it.</p>
        <button type="submit" class="btn btn-navy btn-full">Place Order</button>
      </form>
    `;
    checkoutModal.classList.add("show");
    $("#checkoutCloseX").addEventListener("click", () => checkoutModal.classList.remove("show"));

    $("#checkoutForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const form = e.target;
      const required = ["name","phone","email","address1","city","state","pincode"];
      let valid = true;
      required.forEach(field => {
        const el = form.elements[field];
        if (!el.value.trim()){ valid = false; el.style.borderColor = "#c0392b"; }
        else { el.style.borderColor = ""; }
      });
      if (!valid) return;

      const customer = {
        name: form.elements.name.value.trim(),
        phone: form.elements.phone.value.trim(),
        email: form.elements.email.value.trim(),
        address1: form.elements.address1.value.trim(),
        address2: form.elements.address2.value.trim(),
        city: form.elements.city.value.trim(),
        state: form.elements.state.value.trim(),
        pincode: form.elements.pincode.value.trim(),
      };
      store.set("avilair_customer", customer); // remembered for next visit / prefill

      const orderId = "AVL" + Date.now().toString().slice(-8);
      const order = {
        id: orderId,
        date: new Date().toISOString(),
        customer,
        items,
        subtotal,
      };
      const orders = store.get("avilair_orders", []);
      orders.push(order);
      store.set("avilair_orders", orders); // all orders saved locally so they can be looked up later

      cart = [];
      store.set("avilair_cart", cart);
      updateCartBadge();

      renderOrderSuccess(order);
    });
  }

  function renderOrderSuccess(order){
    checkoutModalBox.innerHTML = `
      <button class="modal-close" id="checkoutCloseX2">&times;</button>
      <div class="order-success">
        <div class="order-success-icon">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="8 12.5 11 15.5 16 9"/></svg>
        </div>
        <h3 class="serif">Order Successful!</h3>
        <p class="order-success-sub">Thank you, ${order.customer.name.split(" ")[0]}. Your order <strong>#${order.id}</strong> has been placed.</p>
        <div class="order-success-details">
          <p>We'll deliver to:<br>${order.customer.address1}${order.customer.address2 ? ", " + order.customer.address2 : ""}, ${order.customer.city}, ${order.customer.state} – ${order.customer.pincode}</p>
          <p>Order updates will be sent to ${order.customer.email} / ${order.customer.phone}.</p>
        </div>
        <button class="btn btn-navy" id="ckContinueShopping">Continue Shopping</button>
      </div>
    `;
    $("#checkoutCloseX2").addEventListener("click", () => checkoutModal.classList.remove("show"));
    $("#ckContinueShopping").addEventListener("click", () => checkoutModal.classList.remove("show"));
  }
  checkoutModal.addEventListener("click", e => { if (e.target === checkoutModal) checkoutModal.classList.remove("show"); });

  function closeDrawers(){
    $("#cartDrawer").classList.remove("open");
    $("#wishDrawer").classList.remove("open");
    scrim.classList.remove("show");
  }
  scrim.addEventListener("click", closeDrawers);

  /* ================= PRODUCT MODAL (detail / quick view) ================= */
  const productModal = $("#productModal"), productModalBox = $("#productModalBox");
  function openProductModal(id, isQuickView){
    const p = productById(id);
    let colourIdx = 0, imgIdx = 0, sizeIdx = 0;

    function render(){
      const colour = p.colours[colourIdx];
      const related = PRODUCTS.filter(r => r.category === p.category && r.id !== p.id).slice(0,4);
      productModalBox.innerHTML = `
        <button class="modal-close" id="pdCloseX">&times;</button>
        <div class="pd-layout">
          <div class="pd-gallery">
            <div class="pd-main-img"><img id="pdMainImg" src="${colour.images[imgIdx]}" alt="${p.name}"></div>
            <div class="pd-thumbs" id="pdThumbs">
              ${colour.images.map((im,i)=>`<img src="${im}" class="${i===imgIdx?'active':''}" data-i="${i}" alt="${p.name} view ${i+1}">`).join("")}
            </div>
          </div>
          <div class="pd-info">
            <div class="pd-cat">${p.category} · ${p.gender}</div>
            <h2 class="pd-name serif">${p.name}</h2>
            <div class="pd-price">${money(p.price)}</div>
            <p class="pd-desc">${p.description}</p>

            <div class="pd-block">
              <h5>Colour: <span class="pd-color-static">${colour.name}</span></h5>
            </div>

            <div class="pd-block">
              <h5>Size <button class="pd-size-guide" id="pdSizeGuide">Size Guide</button></h5>
              <div class="pd-sizes" id="pdSizes">
                ${p.sizes.map((s,i)=>`<button class="pd-size-opt ${i===sizeIdx?'active':''}" data-i="${i}">${s}</button>`).join("")}
              </div>
            </div>

            <div class="pd-actions">
              <button class="btn btn-navy" id="pdAddCart">Add to Cart</button>
              <button class="btn btn-gold" id="pdBuyNow">Buy Now</button>
              <button class="pd-wish ${wishlist.includes(p.id)?'active':''}" id="pdWishBtn" aria-label="Toggle wishlist">
                <svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-10-9.1C0.3 8.4 2 4.8 5.6 4.2c2-.3 3.9.6 5 2.2 1.1-1.6 3-2.5 5-2.2 3.6.6 5.3 4.2 3.6 7.7C19.5 16.4 12 21 12 21z"/></svg>
              </button>
            </div>

            ${isQuickView ? `<a href="#" id="pdViewFull" style="font-size:12.5px;text-decoration:underline;color:var(--ink-soft);">View full details</a>` : `
            <div class="accordion" id="pdAccordion">
              <div class="accordion-item">
                <button class="accordion-head">Product Details <svg class="chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></button>
                <div class="accordion-body"><div class="accordion-body-inner">SKU: ${p.sku}. ${p.description} Colour shown: ${colour.name}.</div></div>
              </div>
              <div class="accordion-item">
                <button class="accordion-head">Shipping <svg class="chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></button>
                <div class="accordion-body"><div class="accordion-body-inner">${INFO_CONTENT.shipping.body}</div></div>
              </div>
              <div class="accordion-item">
                <button class="accordion-head">Returns <svg class="chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></button>
                <div class="accordion-body"><div class="accordion-body-inner">${INFO_CONTENT.returns.body}</div></div>
              </div>
            </div>`}
          </div>
        </div>
        ${!isQuickView && related.length ? `<div class="related-strip">
          <h5>You May Also Like</h5>
          <div class="related-grid">
            ${related.map(r => `<div class="mini-card" data-related="${r.id}">
              <img src="${r.colours[0].images[0]}" alt="${r.name}">
              <p class="nm">${r.name}</p>
              <p class="pr">${money(r.price)}</p>
            </div>`).join("")}
          </div>
        </div>` : ""}
      `;

      $("#pdCloseX").addEventListener("click", closeProductModal);
      $$("#pdThumbs img").forEach(img => img.addEventListener("click", () => { imgIdx = parseInt(img.dataset.i); render(); }));
      $$("#pdSizes .pd-size-opt").forEach(opt => opt.addEventListener("click", () => { sizeIdx = parseInt(opt.dataset.i); render(); }));
      $("#pdSizeGuide").addEventListener("click", (e) => { e.preventDefault(); openSizeGuide(p.gender); });
      $("#pdAddCart").addEventListener("click", () => addToCart(p.id, p.colours[colourIdx].name, p.sizes[sizeIdx], 1));
      $("#pdBuyNow").addEventListener("click", () => { addToCart(p.id, p.colours[colourIdx].name, p.sizes[sizeIdx], 1); closeProductModal(); $("#cartToggle").click(); });
      $("#pdWishBtn").addEventListener("click", (e) => { toggleWishlist(p.id); e.currentTarget.classList.toggle("active", wishlist.includes(p.id)); });
      if (isQuickView) $("#pdViewFull").addEventListener("click", (e) => { e.preventDefault(); openProductModal(p.id, false); });
      $$(".accordion-head").forEach(h => h.addEventListener("click", () => h.closest(".accordion-item").classList.toggle("open")));
      $$("[data-related]").forEach(card => card.addEventListener("click", () => openProductModal(parseInt(card.dataset.related), false)));
    }
    render();
    productModal.classList.add("show");
  }
  function closeProductModal(){ productModal.classList.remove("show"); }
  productModal.addEventListener("click", e => { if (e.target === productModal) closeProductModal(); });

  /* ================= TOAST ================= */
  let toastTimer;
  function showToast(msg){
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
  }

  /* ================= SCROLL REVEAL ================= */
  let revealObserver;
  function revealObserve(){
    if (!revealObserver){
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting){ e.target.classList.add("in"); revealObserver.unobserve(e.target); } });
      }, {threshold:0.12});
    }
    $$(".reveal:not(.in)").forEach(el => revealObserver.observe(el));
    $$(".product-card, .cat-card").forEach(el => { el.classList.add("reveal"); revealObserver.observe(el); });
  }

  /* ================= ESC key closes overlays ================= */
  document.addEventListener("keydown", e => {
    if (e.key === "Escape"){
      closeProductModal(); closeDrawers(); closeMobileNav(); closeFilters();
      infoModal.classList.remove("show");
    }
  });

  /* ================= INIT ================= */
  function init(){
    $("#year").textContent = new Date().getFullYear();
    buildHero();
    resetHeroTimer();
    buildCategoryGrid();
    buildNewArrivals();
    buildFilterPanel();
    renderShop();
    updateWishBadge();
    updateCartBadge();
    revealObserve();
  }
  document.addEventListener("DOMContentLoaded", init);
})();
