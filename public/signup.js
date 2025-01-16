document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();
        if (response.ok) {
            alert('Signup successful!');
            window.location.href = '/login'; // Redirect to login page
        } else {
            alert(data.error || 'Signup failed!');
        }
    } catch (error) {
        console.error(error);
        alert('An error occurred. Please try again.');
    }
});
