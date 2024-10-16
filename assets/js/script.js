document.addEventListener('DOMContentLoaded', () => {
    const productList = document.getElementById('product-list');
    const loadMoreBtn = document.getElementById('load-more');
    const searchBar = document.getElementById('search-bar');
    const sortOptions = document.getElementById('sort-options');

    const modal = document.getElementById('error-modal');
    const modalMessage = document.getElementById('modal-message');
    const closeModalBtn = document.querySelector('.close-btn');
    const menuHamburger = document.querySelector('.menu');

    const categoryCheckboxContainer = document.getElementById('category-checkboxes');

    let allProducts = [];
    let filteredProducts = [];
    let selectedCategories = [];
    let limit = 10;
    let currentPage = 1;

    // Select the filter elements
    const minPriceInput = document.getElementById('min-price');
    const maxPriceInput = document.getElementById('max-price');
    const availabilityCheckbox = document.getElementById('availability');

    // Event listeners for price range filter
    minPriceInput.addEventListener('input', filterProducts);
    maxPriceInput.addEventListener('input', filterProducts);

    // Event listener for availability filter
    availabilityCheckbox.addEventListener('change', filterProducts);

    document.querySelector(".openbtn").addEventListener("click", function() {
        this.classList.toggle("active");
        menuHamburger.classList.toggle("open");
    });

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Show the preloader
    function showPreloader() {
        const preloader = document.getElementById('preloader');
        preloader.classList.remove('hidden');
    }

    // Hide the preloader
    function hidePreloader() {
        const preloader = document.getElementById('preloader');
        preloader.classList.add('hidden');
    }

    // Show the shimmer
    function showShimmer() {
        const shimmer = document.querySelectorAll('.shimmer');
        shimmer.forEach(shimmer => shimmer.classList.remove('hidden'));
    }

    // Hide the shimmer
    function hideShimmer() {
        const shimmer = document.querySelectorAll('.shimmer');
        shimmer.forEach(shimmer => shimmer.classList.add('hidden'));
    }

    function fetchWithTimeout(url, options, timeout = 8000) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error('Request timed out'));
            }, timeout);

            fetch(url, options)
                .then(response => {
                    clearTimeout(timer);
                    resolve(response);
                })
                .catch(err => {
                    clearTimeout(timer);
                    reject(err);
                });
        });
    }

    async function fetchProducts() {
        try {
            // showPreloader();
            showShimmer();
            const response = await fetchWithTimeout('https://fakestoreapi.com/products');
            if (!response.ok) throw new Error(`Failed to fetch products: ${response.statusText}`);
            const data = await response.json();
            allProducts = data;
            filteredProducts = allProducts;
            displayProducts(currentPage);
            loadMoreBtn.hidden = allProducts.length <= limit;
        } catch (error) {
            // Check if it's a network error or a timeout
            if (error.message === 'Failed to fetch' || error.message === 'Network error when attempting to fetch resource.') {
                showModal('Network error. Please check your internet connection and try again.');
            } else if (error.message === 'Request timed out') {
                showModal('The request timed out. Please try again later.');
            } else {
                showModal('Error fetching products. Please try again later.');
            }
            console.error('Error fetching products:', error);
        } finally {
            hideShimmer();
            // hidePreloader();
        }
    }

    // Display products for the current page
    function displayProducts(page) {
        try {
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const productsToDisplay = filteredProducts.slice(startIndex, endIndex);

            if (productsToDisplay.length === 0 && page === 1) {
                showModal('No products found.');
            }

            productList.innerHTML += productsToDisplay.map(product => `
                <div class="product-card">
                    <img src="${product.image}" alt="${product.title}" class="product-image">
                    <div class="product-info">
                        <h3>${product.title}</h3>
                        <p>${product.description.substring(0, 100)}...</p>
                        <p>Price: $${product.price}</p>
                    </div>
                </div>
            `).join('');

            if (endIndex >= filteredProducts.length) {
                loadMoreBtn.hidden = true;
            }
        } catch (error) {
            showModal('Error displaying products. Please try again later.');
            console.error('Error displaying products:', error);
        }
    }

    // Reset product list
    function resetProductList() {
        try {
            productList.innerHTML = '';
            currentPage = 1;
            loadMoreBtn.hidden = filteredProducts.length <= limit;
            displayProducts(currentPage);
        } catch (error) {
            showModal('Error resetting product list. Please try again later.');
            console.error('Error resetting product list:', error);
        }
    }

    // Search products
    searchBar.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filteredProducts = allProducts.filter(product =>
            product.title.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) || 
            product.category.toLowerCase().includes(searchTerm)
        );

        if (filteredProducts.length === 0) {
            showModal('No products found for the search term.');
        }

        resetProductList();
    });

    // Sort products
    sortOptions.addEventListener('change', (e) => {
        const sortBy = e.target.value;
        try {
            filteredProducts = filteredProducts.sort((a, b) => {
                if (sortBy === 'low-to-high') return a.price - b.price;
                if (sortBy === 'high-to-low') return b.price - a.price;
            });
            resetProductList();
        } catch (error) {
            showModal('Error sorting products. Please try again later.');
            console.error('Error sorting products:', error);
        }
    });

    // Filter products by category, price range, and availability
    function filterProducts() {
        try {
            const minPrice = parseFloat(minPriceInput.value) || 0;
            const maxPrice = parseFloat(maxPriceInput.value) || Infinity;
            const availabilityChecked = availabilityCheckbox.checked;

            filteredProducts = allProducts.filter(product => {
                const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(product.category);
                const priceMatch = product.price >= minPrice && product.price <= maxPrice;
                const availabilityMatch = !availabilityChecked || (availabilityChecked && product.stock > 0);

                return categoryMatch && priceMatch && availabilityMatch;
            });

            if (filteredProducts.length === 0) {
                showModal('No products found based on the selected filters.');
            }

            resetProductList();
        } catch (error) {
            showModal('Error applying filters. Please try again later.');
            console.error('Error applying filters:', error);
        }
    }

    loadMoreBtn.addEventListener('click', async () => {
        try {
            showPreloader();
            await delay(1000);
            currentPage++;
            displayProducts(currentPage);
        } catch (error) {
            showModal('Error loading more products. Please try again later.');
            console.error('Error loading more products:', error);
        } finally {
            hidePreloader();
        }
    });

    // Show modal
    function showModal(message) {
        modalMessage.textContent = message;
        modal.classList.remove('hidden');
        modal.style.display = 'block';
    }

    // Close modal
    closeModalBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    });

    async function fetchCategories() {
        try {
            // showPreloader();
            showShimmer();
            const response = await fetch('https://fakestoreapi.com/products/categories');
            const categories = await response.json();
            generateCategoryCheckboxes(categories);
        } catch (error) {
            showModal('Error fetching categories. Please try again later.');
        } finally {
            hideShimmer();
            // hidePreloader();
        }
    }

    function generateCategoryCheckboxes(categories) {
        categories.forEach(category => {
            const checkboxContainer = document.createElement('div');
            checkboxContainer.classList.add('checkbox-container');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = category;
            checkbox.id = `category-${category}`;
            checkbox.addEventListener('change', handleCategoryFilter);

            const label = document.createElement('label');
            label.htmlFor = `category-${category}`;
            label.textContent = category;

            checkboxContainer.appendChild(checkbox);
            checkboxContainer.appendChild(label);
            categoryCheckboxContainer.appendChild(checkboxContainer);
        });
    }

    // Handle category checkbox filtering
    function handleCategoryFilter() {
        const checkboxes = document.querySelectorAll('#category-checkboxes input[type="checkbox"]');
        selectedCategories = Array.from(checkboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);

        filterProducts();
    }
    
    fetchProducts();
    fetchCategories();
});
