document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');

    if (!token) {
        // If no token is found, redirect to the login page
        window.location.href = '/login.html';
        return;
    }

    // Fetch categories with the token
    fetch('/categories', {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    })
        .then(response => {
            if (response.status === 401 || response.status === 403) {
                // Token is invalid or expired
                alert('Session expired. Please log in again.');
                localStorage.removeItem('token'); // Clear token
                window.location.href = '/login.html'; // Redirect to login
            } else if (!response.ok) {
                throw new Error('Failed to fetch categories');
            }
            return response.json();
        })
        .then(data => {
            console.log(data);
            // Render categories on the page
            const categoriesList = document.getElementById('categories-list');
            categoriesList.innerHTML = data.categories.map(category => `<li>${category.C_name}</li>`).join('');
        })
        .catch(error => {
            console.error(error);
        });
});
