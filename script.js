// REAL ESTATE LISTINGS DATA
let properties = [];

// STATE
let currentFilters = {
  status: 'buy', // buy, rent, sold
  search: '',
  minPrice: 0,
  maxPrice: Infinity,
  types: [],      // array of selected types
  beds: 'any',
  baths: 'any',
  sortBy: 'newest'
};

// DOM ELEMENTS
const gridContainer = document.getElementById('listingsGrid');
const resultsCount = document.getElementById('resultsCount');
const activeFiltersContainer = document.getElementById('activeFilters');

const searchTabs = document.querySelectorAll('.search-tab');
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');

const minPriceInput = document.getElementById('minPrice');
const maxPriceInput = document.getElementById('maxPrice');
const typeCheckboxes = document.querySelectorAll('input[name="type"]');
const bedsFilter = document.getElementById('bedsFilter');
const bathsFilter = document.getElementById('bathsFilter');
const sortFilter = document.getElementById('sortFilter');
const applyFiltersBtn = document.getElementById('applyFiltersBtn');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');

// FORMATTERS
const formatCurrency = (amount, status) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount) + (status === 'rent' ? '/mo' : '');
};

const timeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays/7)} weeks ago`;
  return `${Math.floor(diffDays/30)} months ago`;
};

// RENDER FUNCTION
function renderListings() {
  // 1. Filter
  let filtered = properties.filter(p => {
    // Status (Buy/Rent)
    if (p.status !== currentFilters.status) return false;
    
    // Search text
    if (currentFilters.search) {
      const searchStr = currentFilters.search.toLowerCase();
      if (!p.title.toLowerCase().includes(searchStr) && !p.address.toLowerCase().includes(searchStr)) {
        return false;
      }
    }
    
    // Price
    if (p.price < currentFilters.minPrice || p.price > currentFilters.maxPrice) return false;
    
    // Type
    if (currentFilters.types.length > 0 && !currentFilters.types.includes(p.type)) return false;
    
    // Beds
    if (currentFilters.beds !== 'any' && p.beds < parseInt(currentFilters.beds)) return false;
    
    // Baths
    if (currentFilters.baths !== 'any' && p.baths < parseInt(currentFilters.baths)) return false;
    
    return true;
  });

  // 2. Sort
  filtered.sort((a, b) => {
    if (currentFilters.sortBy === 'newest') {
      return new Date(b.date) - new Date(a.date);
    } else if (currentFilters.sortBy === 'price-low') {
      return a.price - b.price;
    } else if (currentFilters.sortBy === 'price-high') {
      return b.price - a.price;
    }
    return 0;
  });

  // 3. Update UI Count
  resultsCount.textContent = `${filtered.length} Homes for ${currentFilters.status.charAt(0).toUpperCase() + currentFilters.status.slice(1)}`;

  // 4. Render Grid
  gridContainer.innerHTML = '';
  
  if (filtered.length === 0) {
    gridContainer.innerHTML = `<div style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--text-muted); background: white; border-radius: 12px; border: 1px dashed var(--border);">No properties found matching your criteria.</div>`;
    return;
  }

  filtered.forEach(p => {
    const card = document.createElement('div');
    card.className = 'listing-card';
    card.style.cursor = 'pointer';
    card.onclick = (e) => {
        // Prevent clicking the heart icon from triggering the redirect
        if(!e.target.closest('.card-fav')) {
            window.location.href = `property.html?id=${p.id}`;
        }
    };
    card.innerHTML = `
      <div class="card-img-wrap">
        <img src="${p.image}" alt="${p.title}" loading="lazy"/>
        <div class="card-badges">
          ${p.isNew ? '<span class="badge new">New</span>' : ''}
          <span class="badge for-sale">For ${p.status}</span>
        </div>
        <button class="card-fav" title="Save Home"><i class="ph ph-heart"></i></button>
      </div>
      <div class="card-body">
        <div class="price">${formatCurrency(p.price, p.status)}</div>
        <div class="address">${p.address}</div>
        <div class="card-features">
          <span class="feature"><i class="ph ph-bed"></i> ${p.beds} Beds</span>
          <span class="feature"><i class="ph ph-shower"></i> ${p.baths} Baths</span>
          <span class="feature"><i class="ph ph-squares-four"></i> ${p.sqft.toLocaleString()} sqft</span>
        </div>
        <div class="card-footer">
          <div class="agent">
            <img src="${p.agent}" alt="Agent"/>
            <span>Vista Agent</span>
          </div>
          <span class="posted-date">${timeAgo(p.date)}</span>
        </div>
      </div>
    `;
    gridContainer.appendChild(card);
  });
  
  // Fav Toggle Logic
  document.querySelectorAll('.card-fav').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.currentTarget.classList.toggle('saved');
      const icon = e.currentTarget.querySelector('i');
      if (e.currentTarget.classList.contains('saved')) {
        icon.classList.remove('ph-heart');
        icon.classList.add('ph-fill', 'ph-heart');
      } else {
        icon.classList.remove('ph-fill', 'ph-heart');
        icon.classList.add('ph-heart');
      }
    });
  });

  updateActiveFilterTags();
}

// UPDATE ACTIVE TAGS UI
function updateActiveFilterTags() {
  activeFiltersContainer.innerHTML = '';
  
  if (currentFilters.search) createTag(`Search: ${currentFilters.search}`, 'search');
  if (currentFilters.minPrice > 0 || currentFilters.maxPrice !== Infinity) {
    let text = '';
    if (currentFilters.minPrice > 0 && currentFilters.maxPrice !== Infinity) text = `$${currentFilters.minPrice/1000}k - $${currentFilters.maxPrice/1000}k`;
    else if (currentFilters.minPrice > 0) text = `Over $${currentFilters.minPrice/1000}k`;
    else text = `Under $${currentFilters.maxPrice/1000}k`;
    createTag(text, 'price');
  }
  if (currentFilters.types.length > 0) createTag(`${currentFilters.types.length} Home Types`, 'types');
  if (currentFilters.beds !== 'any') createTag(`${currentFilters.beds}+ Beds`, 'beds');
  if (currentFilters.baths !== 'any') createTag(`${currentFilters.baths}+ Baths`, 'baths');
}

function createTag(text, filterKey) {
  const tag = document.createElement('div');
  tag.className = 'filter-tag';
  tag.innerHTML = `<span>${text}</span> <button aria-label="Remove filter" onclick="removeFilter('${filterKey}')"><i class="ph ph-x"></i></button>`;
  activeFiltersContainer.appendChild(tag);
}

window.removeFilter = function(key) {
  if (key === 'search') { currentFilters.search = ''; searchInput.value = ''; }
  if (key === 'price') { currentFilters.minPrice = 0; currentFilters.maxPrice = Infinity; minPriceInput.value = ''; maxPriceInput.value = ''; }
  if (key === 'types') { currentFilters.types = []; typeCheckboxes.forEach(cb => cb.checked = false); }
  if (key === 'beds') { currentFilters.beds = 'any'; bedsFilter.value = 'any'; }
  if (key === 'baths') { currentFilters.baths = 'any'; bathsFilter.value = 'any'; }
  renderListings();
};

// EVENT LISTENERS

// Search Hero Buy/Rent Tabs
searchTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    searchTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentFilters.status = tab.textContent.toLowerCase();
    
    // reset price filters on switch since rent is much lower than buy
    currentFilters.minPrice = 0;
    currentFilters.maxPrice = Infinity;
    minPriceInput.value = '';
    maxPriceInput.value = '';
    
    renderListings();
  });
});

// Search Form
searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  currentFilters.search = searchInput.value.trim();
  renderListings();
  
  // smooth scroll to results
  document.querySelector('.grid-layout').scrollIntoView({ behavior: 'smooth' });
});

// Apply Sidebar Filters
applyFiltersBtn.addEventListener('click', () => {
  currentFilters.minPrice = minPriceInput.value ? parseInt(minPriceInput.value) : 0;
  currentFilters.maxPrice = maxPriceInput.value ? parseInt(maxPriceInput.value) : Infinity;
  
  currentFilters.types = Array.from(typeCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
  currentFilters.beds = bedsFilter.value;
  currentFilters.baths = bathsFilter.value;
  
  renderListings();
  
  if(window.innerWidth <= 1024) {
      document.querySelector('.listings-area').scrollIntoView({ behavior: 'smooth' });
  }
});

// Clear All Filters
clearFiltersBtn.addEventListener('click', () => {
  minPriceInput.value = '';
  maxPriceInput.value = '';
  typeCheckboxes.forEach(cb => cb.checked = false);
  bedsFilter.value = 'any';
  bathsFilter.value = 'any';
  
  currentFilters = {
    ...currentFilters,
    minPrice: 0,
    maxPrice: Infinity,
    types: [],
    beds: 'any',
    baths: 'any'
  };
  renderListings();
});

// Sort Changed
sortFilter.addEventListener('change', (e) => {
  currentFilters.sortBy = e.target.value;
  renderListings();
});

// INIT & AUTH OBSERVER
// INIT & AUTH OBSERVER
const initApp = async () => {
    gridContainer.innerHTML = '<div style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--text-muted);">Loading listings...</div>';
    
    // Auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
        const userBtn = document.getElementById('userAccountBtn');
        const listBtn = document.getElementById('listPropertyBtn');
        if (session && session.user && userBtn) {
            userBtn.innerHTML = '<i class="ph ph-user-check" style="color: var(--primary);"></i>';
            userBtn.href = 'profile.html';
            if(listBtn) listBtn.href = 'profile.html';
        } else if (userBtn) {
            userBtn.innerHTML = '<i class="ph ph-user"></i>';
            userBtn.href = 'login.html';
            if(listBtn) listBtn.href = 'login.html';
        }
    });

    try {
        const { data, error } = await supabase.from('properties').select('*');
        if (error) throw error;
        
        if (!data || data.length === 0) {
            properties = [];
        } else {
            properties = data.map(doc => ({
                id: doc.id,
                title: doc.title,
                address: doc.address,
                price: doc.price,
                beds: doc.beds,
                baths: doc.baths,
                sqft: doc.sqft,
                type: doc.type,
                status: doc.status,
                isNew: doc.is_new,
                image: doc.image,
                agent: doc.agent_avatar || `https://ui-avatars.com/api/?name=Agent&background=random`,
                date: doc.created_at
            }));
        }
        renderListings();
    } catch (error) {
        console.error("Error fetching listings:", error);
        gridContainer.innerHTML = '<div style="grid-column: 1/-1; padding: 40px; text-align: center; color: #ef4444;">Failed to load properties. Ensure Supabase config is set.</div>';
    }
};

initApp();
