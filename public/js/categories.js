document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('categories-table-body');
    const errorMessage = document.getElementById('error-message');
    const paginationControls = document.getElementById('pagination-controls');
    const viewAllProductsButton = document.getElementById('view-all-products');
    let currentPage = 1;
    const pageSize = 5; 

    // Get the page number from the URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const pageParam = urlParams.get('page');
    if (pageParam) {
        currentPage = parseInt(pageParam, 10); // Set currentPage based on the URL
    }

    // Fetch categories with pagination
    async function fetchCategories(page) {
        try {
            const response = await fetch(`/categories?page=${page}&pageSize=${pageSize}`, {
                method: 'GET',
                credentials: 'include', 
            });

            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch categories');
            }

            const data = await response.json();
            const { categories, pagination } = data;

            // Clear existing table and error message
            tableBody.innerHTML = '';
            errorMessage.textContent = '';

            // Populate the table with categories
            categories.forEach((category) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${category.C_id || 'N/A'}</td>
                    <td><a href="/products.html?page=1&categoryId=${category.C_id}">${category.C_name || 'N/A'}</a></td>
                    <td>${new Date(category.date_created).toLocaleDateString() || 'N/A'}</td>
                `;
                tableBody.appendChild(row);
            });

            // Render pagination controls
            renderPagination(pagination);
        } catch (error) {
            console.error('Error loading categories:', error);
            errorMessage.textContent = 'Failed to load categories. Please try again later.';
            window.location.href = '/login';
        }
    }

    // Render pagination controls
    function renderPagination({ page, totalPages }) {
        paginationControls.innerHTML = '';

        // Previous button
        const prevButton = document.createElement('li');
        prevButton.className = `page-item ${page === 1 ? 'disabled' : ''}`;
        prevButton.innerHTML = `<button class="page-link">Previous</button>`;
        prevButton.addEventListener('click', () => {
            if (page > 1) updateUrlAndFetch(page - 1);
        });
        paginationControls.appendChild(prevButton);

        // Page buttons
        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('li');
            pageButton.className = `page-item ${i === page ? 'active' : ''}`;
            pageButton.innerHTML = `<button class="page-link">${i}</button>`;
            pageButton.addEventListener('click', () => updateUrlAndFetch(i));
            paginationControls.appendChild(pageButton);
        }

        // Next button
        const nextButton = document.createElement('li');
        nextButton.className = `page-item ${page === totalPages ? 'disabled' : ''}`;
        nextButton.innerHTML = `<button class="page-link">Next</button>`;
        nextButton.addEventListener('click', () => {
            if (page < totalPages) updateUrlAndFetch(page + 1);
        });
        paginationControls.appendChild(nextButton);
    }

    // Function to update the URL and fetch categories for a specific page
    function updateUrlAndFetch(newPage) {
        currentPage = newPage;

        // Update the URL with the new page number, without reloading the page
        const newUrl = `/categories.html?page=${newPage}`;
        window.history.pushState({}, '', newUrl); // Update the URL in the browser

        // Fetch the categories for the new page
        fetchCategories(newPage);
    }

    // View all products button
    viewAllProductsButton.addEventListener('click', () => {
        window.location.href = '/allproducts.html'; // Redirect to allproducts.html
    });

    // Initial load of categories
    fetchCategories(currentPage);
});
