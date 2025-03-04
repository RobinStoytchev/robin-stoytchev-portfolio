document.addEventListener('DOMContentLoaded', function() {
    // Ensure the form exists
    const form = document.querySelector('.contact-form');
    if (!form) {
        console.error('Form with class "contact-form" not found.');
        return;
    }

    const inputs = form.querySelectorAll('input, textarea');
    const submitBtn = form.querySelector('.submit-btn');
    const errorMessages = form.querySelectorAll('.error-message');

    // Function to show/hide error messages
    function showError(input, message) {
        const error = input.nextElementSibling; // Get the error message span
        if (error && error.classList.contains('error-message')) {
            error.style.display = 'block';
            error.textContent = message;
            input.style.borderColor = 'red';
        }
    }

    function hideError(input) {
        const error = input.nextElementSibling;
        if (error && error.classList.contains('error-message')) {
            error.style.display = 'none';
            input.style.borderColor = '';
        }
    }

    // Real-time validation for each input (with safety check)
    if (inputs.length > 0) {
        inputs.forEach(input => {
            input.addEventListener('input', function() {
                hideError(this);

                if (this.id === 'name' && this.value.length < 2) {
                    showError(this, 'Please enter a valid name with at least 2 characters.');
                } else if (this.id === 'email' && !this.value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                    showError(this, 'Please enter a valid email address.');
                } else if (this.id === 'subject' && this.value.length < 2) {
                    showError(this, 'Please enter a subject with at least 2 characters.');
                } else if (this.id === 'message' && this.value.length < 10) {
                    showError(this, 'Please enter a message with at least 10 characters.');
                }
            });
        });
    } else {
        console.error('No input or textarea elements found in the form.');
    }

    // Check URL parameters for success/error messages (optional, keep or remove based on preference)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("status") === "success") {
        alert("Thank you! Your message has been sent.");
    } else if (urlParams.get("status") === "error") {
        alert("Oops! Something went wrong.");
    }
});