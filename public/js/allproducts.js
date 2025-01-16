document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('products-table-body');
    const paginationControls = document.getElementById('pagination-controls');
    const applyFiltersButton = document.getElementById('apply-filters');
    const searchInput = document.getElementById('search');
    const searchButton = document.getElementById('search-btn');
    const minPriceInput = document.getElementById('minPrice');
    const maxPriceInput = document.getElementById('maxPrice');
    const minItemsInput = document.getElementById('minItems');
    const maxItemsInput = document.getElementById('maxItems');
    const minDiscountInput = document.getElementById('minDiscount');
    const maxDiscountInput = document.getElementById('maxDiscount');
    const categoriesCheckboxesDiv = document.getElementById('categories-checkboxes');
    const viewAllCategoriesButton = document.getElementById('view-categories');
    const toggleFiltersButton = document.getElementById('toggle-filters');
    const filterDiv = document.getElementById('filterDiv');

    let currentPage = 1;
    const pageSize = 10;

    toggleFiltersButton.addEventListener('click', () => {
        filterDiv.style.display = filterDiv.style.display === 'none' ? 'block' : 'none';
    });

    // Fetch Categories
    async function fetchCategories() {
        try {
            const response = await fetch('/allproducts/categories');
            const data = await response.json();
            
            categoriesCheckboxesDiv.innerHTML = '';
            data.categories.forEach((category) => {
                const checkboxWrapper = document.createElement('div');
                checkboxWrapper.classList.add('form-check');

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'form-check-input';
                checkbox.id = `category-${category.C_id}`;
                checkbox.value = category.C_id;

                const label = document.createElement('label');
                label.className = 'form-check-label';
                label.htmlFor = `category-${category.C_id}`;
                label.textContent = category.C_name;

                checkboxWrapper.appendChild(checkbox);
                checkboxWrapper.appendChild(label);
                categoriesCheckboxesDiv.appendChild(checkboxWrapper);
            });
        } catch (error) {
            console.error('Failed to fetch categories:', error.message);
        }
    }

    // Fetch Products
    async function fetchProducts(page) {
        const selectedCategories = Array.from(
            categoriesCheckboxesDiv.querySelectorAll('input[type="checkbox"]:checked')
        ).map((checkbox) => checkbox.value);

        const queryParams = new URLSearchParams({
            page,
            pageSize,
            search: processSearchQuery(searchInput.value.trim()),
            minPrice: minPriceInput.value || 0,
            maxPrice: maxPriceInput.value || 999999,
            minItems: minItemsInput.value || 0,
            maxItems: maxItemsInput.value || 999999,
            minDiscount: minDiscountInput.value || 0,
            maxDiscount: maxDiscountInput.value || 999999,
            categories: selectedCategories.join(','),
            useSolr: 'true',
        });

        try {
            const response = await fetch(`/allproducts?${queryParams.toString()}`);
            const data = await response.json();
            const { products, pagination, spellcheck } = data;

            // Display spellcheck suggestions
            if (spellcheck && spellcheck.length > 0) {
                displaySpellcheckSuggestions(spellcheck);
            }

            tableBody.innerHTML = '';
            products.forEach((product) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${product.P_id}</td>
                    <td>${product.P_name}</td>
                    <td>${product.MRP}</td>
                    <td>${product.discount_price}</td>
                    <td>${product.no_of_items}</td>
                    <td>${product.category_name}</td>
                `;
                tableBody.appendChild(row);
            });

            renderPagination(pagination);

            // Update the URL to reflect the current page number (using allproducts.html)
            window.history.pushState(null, '', `/allproducts.html?${queryParams.toString()}`);
        } catch (error) {
            console.error('Failed to fetch products:', error.message);
        }
    }

    // Function to process search queries for "above" or "below" price conditions
    function processSearchQuery(query) {
        const priceMatch = query.match(/(above|greater than|higher than|below|under|less than)\s*(\d+)/gi);
        if (!priceMatch) return query;

        priceMatch.forEach((condition) => {
            const match = condition.match(/(above|greater than|higher than|below|under|less than)\s*(\d+)/i);
            if (match) {
                const direction = match[1].toLowerCase();
                const value = parseFloat(match[2]);

                if (direction === 'above' || direction === 'greater than' || direction === 'higher than') {
                    minPriceInput.value = value;
                } else if (direction === 'below' || direction === 'under' || direction === 'less than') {
                    maxPriceInput.value = value;
                }
            }
            query = query.replace(condition, '').trim();
        });

        return query;
    }

    // Function to display spellcheck suggestions
    function displaySpellcheckSuggestions(suggestions) {
        const suggestionBox = document.getElementById('spellcheck-suggestions');
        suggestionBox.innerHTML = '';  // Clear previous suggestions

        if (suggestions.length > 0) {
            const suggestionList = document.createElement('ul');
            suggestions.forEach((suggestion) => {
                const suggestionItem = document.createElement('li');
                suggestionItem.textContent = suggestion;
                suggestionItem.addEventListener('click', () => {
                    searchInput.value = suggestion;  // Use suggestion in search
                    fetchProducts(1);  // Search with suggested query
                });
                suggestionList.appendChild(suggestionItem);
            });
            suggestionBox.appendChild(suggestionList);
        }
    }

    // Render Pagination
    function renderPagination({ page, totalPages }) {
        paginationControls.innerHTML = '';

        const prevButton = document.createElement('li');
        prevButton.className = `page-item ${page === 1 ? 'disabled' : ''}`;
        prevButton.innerHTML = `<button class="page-link">Previous</button>`;
        prevButton.addEventListener('click', () => {
            if (page > 1) fetchProducts(page - 1);
        });
        paginationControls.appendChild(prevButton);

        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('li');
            pageButton.className = `page-item ${i === page ? 'active' : ''}`;
            pageButton.innerHTML = `<button class="page-link">${i}</button>`;
            pageButton.addEventListener('click', () => fetchProducts(i));
            paginationControls.appendChild(pageButton);
        }

        const nextButton = document.createElement('li');
        nextButton.className = `page-item ${page === totalPages ? 'disabled' : ''}`;
        nextButton.innerHTML = `<button class="page-link">Next</button>`;
        nextButton.addEventListener('click', () => {
            if (page < totalPages) fetchProducts(page + 1);
        });
        paginationControls.appendChild(nextButton);
    }

    // Event listeners
    applyFiltersButton.addEventListener('click', () => fetchProducts(1));
    searchButton.addEventListener('click', () => fetchProducts(1));
    viewAllCategoriesButton.addEventListener('click', () => {
        window.location.href = '/categories.html?page=1';
    });

    // Initial fetch calls
    fetchCategories();

    // Parse initial page number from URL
    const urlParams = new URLSearchParams(window.location.search);
    const pageParam = parseInt(urlParams.get('page')) || 1;
    fetchProducts(pageParam);
});
