// /js/view-transition-demo.js
document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('toggleTransitionBtnDemo');
    const container = document.getElementById('vtContainerDemo');
    const textElement = document.getElementById('vtTextDemo');

    // Ensure all elements are present
    if (!toggleButton || !container || !textElement) {
        console.warn('View Transition Demo elements not found. Script will not run.');
        return;
    }

    const textStates = [
        "Hello!",
        "Welcome to this demonstration!",
        "Aspect Ratios can be tricky...",
        "...but View Transitions offer solutions!",
        "Short & Sweet",
        "This text is a bit longer to show how it adapts."
    ];
    let currentStateIndex = 0;
    let isToggledState = false;

    // Function to update the DOM (classes and text content)
    const updateDOMState = () => {
        isToggledState = !isToggledState;
        container.classList.toggle('toggled', isToggledState);
        textElement.classList.toggle('toggled', isToggledState); // For font-size changes etc.

        currentStateIndex = (currentStateIndex + 1) % textStates.length;
        textElement.textContent = textStates[currentStateIndex];
    };

    // Set initial text
    textElement.textContent = textStates[currentStateIndex];

    // Attach event listener to the button
    toggleButton.addEventListener('click', () => {
        // Check for View Transitions API support
        if (!document.startViewTransition) {
            console.log("View Transitions API not supported. Updating DOM directly.");
            updateDOMState();
            return;
        }

        // Use the View Transitions API
        document.startViewTransition(() => {
            updateDOMState();
        });
    });
});