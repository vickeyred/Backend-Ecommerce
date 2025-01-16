document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('products-table-body');
    const errorMessage = document.getElementById('error-message');
    const paginationControls = document.getElementById('pagination-controls');
    const toggleFiltersButton = document.getElementById('toggle-filters');
    const filterDiv = document.getElementById('filterDiv');
    const applyFiltersButton = document.getElementById('apply-filters');
    const searchInput = document.getElementById('search');
    const minPriceInput = document.getElementById('minPrice');
    const maxPriceInput = document.getElementById('maxPrice');
    const minItemsInput = document.getElementById('minItems');
    const maxItemsInput = document.getElementById('maxItems');
    const minDiscountInput = document.getElementById('minDiscount');
    const maxDiscountInput = document.getElementById('maxDiscount');
    const viewAllCategoriesButton = document.getElementById('view-categories');

    let currentPage = 1;
    const pageSize = 5;

    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('categoryId');  // Get categoryId from the URL

    // Toggle the filter section visibility
    toggleFiltersButton.addEventListener('click', () => {
        filterDiv.style.display = filterDiv.style.display === 'none' ? 'block' : 'none';
    });

    // Function to fetch products from the backend
    async function fetchProducts(page) {
        const search = encodeURIComponent(searchInput.value.trim());
        const minPrice = parseInt(minPriceInput.value) || 0;
        const maxPrice = parseInt(maxPriceInput.value) || 1000000;
        const minItems = parseInt(minItemsInput.value) || 0;
        const maxItems = parseInt(maxItemsInput.value) || 1000000;
        const minDiscount = parseInt(minDiscountInput.value) || 0;
        const maxDiscount = parseInt(maxDiscountInput.value) || 1000000;

        try {
            // Pass the categoryId if it exists in the URL
            const response = await fetch(`/products?page=${page}&pageSize=${pageSize}&categoryId=${categoryId}&search=${search}&minPrice=${minPrice}&maxPrice=${maxPrice}&minItems=${minItems}&maxItems=${maxItems}&minDiscount=${minDiscount}&maxDiscount=${maxDiscount}`);

            if (!response.ok) throw new Error('Failed to fetch products');

            const data = await response.json();
            const { products, pagination } = data;

            tableBody.innerHTML = '';
            errorMessage.textContent = '';

            if (products.length === 0) {
                errorMessage.textContent = 'No products found for the given search and filters.';
                return;
            }

            products.forEach(product => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${product.P_id}</td>
                    <td>${product.P_name}</td>
                    <td>${product.no_of_items}</td>
                    <td>${product.MRP}</td>
                    <td>${product.discount_price}</td>
                `;
                tableBody.appendChild(row);
            });

            renderPagination(pagination);
        } catch (error) {
            console.error('Error:', error);
            errorMessage.textContent = error.message || 'Failed to load products. Please try again later.';
        }
    }

    // Initial load with page=1
    fetchProducts(currentPage);

    // Event listener for applying filters
    applyFiltersButton.addEventListener('click', () => {
        currentPage = 1; // Reset to first page when applying new filters
        fetchProducts(currentPage);
    });

    // View all categories button
    viewAllCategoriesButton.addEventListener('click', () => {
        window.location.href = '/categories.html?page=1';
    });

    // Render pagination controls based on total pages
    function renderPagination({ page, totalPages }) {
        paginationControls.innerHTML = '';

        const prevButton = createPaginationButton('Previous', page > 1, () => updateUrlAndFetch(page - 1));
        paginationControls.appendChild(prevButton);

        for (let i = 1; i <= totalPages; i++) {
            const pageButton = createPaginationButton(i, i !== page, () => updateUrlAndFetch(i));
            paginationControls.appendChild(pageButton);
        }

        const nextButton = createPaginationButton('Next', page < totalPages, () => updateUrlAndFetch(page + 1));
        paginationControls.appendChild(nextButton);
    }

    // Create a pagination button
    function createPaginationButton(label, enabled, onClick) {
        const li = document.createElement('li');
        li.className = `page-item ${enabled ? '' : 'disabled'}`;
        li.innerHTML = `<button class="page-link">${label}</button>`;
        if (enabled) li.addEventListener('click', onClick);
        return li;
    }

    // Update the URL with page number and categoryId, and fetch products for the given page
    function updateUrlAndFetch(newPage) {
        currentPage = newPage;

        // Update URL to only include page number and categoryId (other parameters remain in the request body)
        const newUrl = `/products?page=${newPage}&categoryId=${categoryId}`;
        window.history.pushState({}, '', newUrl); // Update URL without reloading

        fetchProducts(newPage); // Fetch products for the updated page
    }
});
