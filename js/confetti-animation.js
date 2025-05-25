document.addEventListener('DOMContentLoaded', () => {
    const confettiWrapper = document.getElementById('confetti-wrapper');
    if (!confettiWrapper) {
        // console.error('Confetti wrapper not found!');
        return;
    }

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionQuery.matches) {
        confettiWrapper.style.display = 'none';
        return;
    }

    const numConfetti = 100;
    const numSparkles = 25;
    const confettiColors = ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71', '#9b59b6', '#1abc9c', '#e67e22']; // Vibrant colors
    const confettiShapes = ['square', 'circle', 'triangle'];
    const animationDurationBase = 3; // seconds
    const animationDurationVariance = 2; // seconds (total duration will be 3-5s)
    const totalAnimationWindow = 6000; // ms, time after which wrapper starts fading

    function createParticles() {
        for (let i = 0; i < numConfetti; i++) {
            const particle = document.createElement('div');
            particle.classList.add('confetti-particle');

            const shape = confettiShapes[Math.floor(Math.random() * confettiShapes.length)];
            particle.classList.add(shape);

            const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
            if (shape === 'triangle') {
                particle.style.borderBottomColor = color;
            } else {
                particle.style.backgroundColor = color;
            }

            particle.style.left = `${Math.random() * 100}vw`;
            
            const duration = animationDurationBase + Math.random() * animationDurationVariance;
            particle.style.animationDuration = `${duration}s`;
            particle.style.animationDelay = `${Math.random() * 0.8}s`; // Stagger start

            // Set CSS variables for varied animation
            particle.style.setProperty('--initial-rotation', `${(Math.random() * 360).toFixed(2)}deg`);
            particle.style.setProperty('--random-spin-factor', (Math.random() * 1.5 + 0.5).toFixed(2));
            particle.style.setProperty('--random-horizontal-sway', `${(Math.random() - 0.5) * 70}px`);
            particle.style.setProperty('--random-start-y-offset', `${(Math.random() * 15).toFixed(2)}vh`);
            
            // Optional: Vary particle size slightly
            const size = Math.random() * 6 + 8; // 8px to 14px
            particle.style.width = `${size}px`;
            particle.style.height = (shape === 'triangle') ? '0px' : `${size}px`; // Height is border for triangle
            if (shape === 'triangle') {
                particle.style.borderLeftWidth = `${size / 2}px`;
                particle.style.borderRightWidth = `${size / 2}px`;
                particle.style.borderBottomWidth = `${size * 0.866}px`; // Maintain equilateral-ish shape
            }


            particle.addEventListener('animationend', () => {
                if (particle.parentElement) {
                    particle.parentElement.removeChild(particle);
                }
            });

            confettiWrapper.appendChild(particle);
        }

        for (let i = 0; i < numSparkles; i++) {
            const sparkle = document.createElement('div');
            sparkle.classList.add('sparkle');
            
            sparkle.style.left = `${Math.random() * 95 + 2.5}vw`;
            sparkle.style.top = `${Math.random() * 90 + 5}vh`;
            
            const sparkleDuration = 0.5 + Math.random() * 0.5; // 0.5s to 1s
            sparkle.style.animationDuration = `${sparkleDuration}s`;
            // Appear throughout the confetti fall period
            sparkle.style.animationDelay = `${Math.random() * (animationDurationBase + animationDurationVariance - sparkleDuration)}s`;

            const sparkleSize = Math.random() * 5 + 4; // 4px to 9px
            sparkle.style.width = `${sparkleSize}px`;
            sparkle.style.height = `${sparkleSize}px`;

            sparkle.addEventListener('animationend', () => {
                if (sparkle.parentElement) {
                    sparkle.parentElement.removeChild(sparkle);
                }
            });
            confettiWrapper.appendChild(sparkle);
        }
    }

    createParticles();

    // Fade out and remove the wrapper after animations are mostly done
    setTimeout(() => {
        confettiWrapper.style.transition = 'opacity 0.5s ease-out';
        confettiWrapper.style.opacity = '0';
        setTimeout(() => {
            if (confettiWrapper.parentElement) {
                // confettiWrapper.parentElement.removeChild(confettiWrapper); // Option 1: Remove wrapper
                confettiWrapper.innerHTML = ''; // Option 2: Clear content, keep wrapper (safer if other scripts might reference it)
                confettiWrapper.style.display = 'none'; // And hide it
            }
        }, 500); // Wait for opacity transition
    }, totalAnimationWindow);

    motionQuery.addEventListener('change', () => {
        if (motionQuery.matches) {
            confettiWrapper.innerHTML = ''; // Clear any existing particles
            confettiWrapper.style.display = 'none';
        } else {
            // If motion is re-enabled, you could re-trigger the animation if desired,
            // but for a success page, it's typically a one-time effect on load.
            // For simplicity, we don't re-trigger here. If the page reloads, it will run.
            // If you want to re-enable it, you'd need to reset opacity and call createParticles().
        }
    });
});