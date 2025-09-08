// CAPTCHA System - External Script
// Manual CAPTCHA with Auto Verification System
let captchaCompleted = false;
let captchaInProgress = false;
let currentCaptcha = { question: '', answer: 0 };

// Login button control functions
function enableLoginButton() {
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.className = 'w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95';
    }
}

function disableLoginButton() {
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.className = 'w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-gray-400 to-gray-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed';
    }
}

function generateCaptcha() {
    // Generate random text with mix of letters and numbers
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let captchaText = '';
    
    // Generate 5-6 character CAPTCHA
    const length = Math.floor(Math.random() * 2) + 5; // 5 or 6 characters
    for (let i = 0; i < length; i++) {
        captchaText += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    currentCaptcha = { text: captchaText };
    
    // Display the CAPTCHA text with visual effects
    const captchaTextElement = document.getElementById('captcha-text');
    if (captchaTextElement) {
        captchaTextElement.textContent = captchaText;
        
        // Add random visual distortions
        const rotations = [-2, -1, 0, 1, 2];
        const colors = ['text-blue-600 dark:text-blue-400', 'text-purple-600 dark:text-purple-400', 'text-green-600 dark:text-green-400', 'text-red-600 dark:text-red-400'];
        
        captchaTextElement.style.transform = `rotate(${rotations[Math.floor(Math.random() * rotations.length)]}deg)`;
        captchaTextElement.className = `${colors[Math.floor(Math.random() * colors.length)]} drop-shadow-sm`;
    }
    
    // Reset input and status
    const captchaInput = document.getElementById('captcha-input');
    if (captchaInput) {
        captchaInput.value = '';
        captchaInput.maxLength = length;
        captchaInput.classList.remove('border-green-500', 'border-red-500');
    }
    
    resetCaptchaStatus();
    captchaCompleted = false;
    
    // Disable login button when new CAPTCHA is generated
    disableLoginButton();
}

function resetCaptchaInputStatus() {
    const captchaInput = document.getElementById('captcha-input');
    const message = document.getElementById('captcha-message');
    const errorMsg = document.getElementById('captcha-error-msg');
    
    if (captchaInput) {
        captchaInput.classList.remove('border-green-500', 'border-red-500');
    }
    
    if (errorMsg) {
        errorMsg.classList.add('hidden');
    }
    
    if (message) {
        message.textContent = 'Masukkan teks yang sama persis untuk verifikasi otomatis';
        message.className = 'mt-2 text-xs text-gray-600 dark:text-gray-400 text-center';
    }
    
    // Reset completion status if user is editing
    if (captchaCompleted) {
        captchaCompleted = false;
        disableLoginButton();
    }
}

function resetCaptchaStatus() {
    const loadingIcon = document.getElementById('captcha-loading');
    const successIcon = document.getElementById('captcha-success');
    const errorIcon = document.getElementById('captcha-error');
    const message = document.getElementById('captcha-message');
    const errorMsg = document.getElementById('captcha-error-msg');
    
    if (loadingIcon) loadingIcon.classList.add('hidden');
    if (successIcon) successIcon.classList.add('hidden');
    if (errorIcon) errorIcon.classList.add('hidden');
    if (errorMsg) errorMsg.classList.add('hidden');
    
    if (message) {
        message.textContent = 'Masukkan teks yang sama persis untuk verifikasi otomatis';
        message.className = 'mt-3 text-xs text-gray-600 dark:text-gray-400 text-center';
    }
}

function verifyCaptcha(userInput) {
    if (captchaInProgress) return;
    
    captchaInProgress = true;
    const loadingIcon = document.getElementById('captcha-loading');
    const successIcon = document.getElementById('captcha-success');
    const errorIcon = document.getElementById('captcha-error');
    const message = document.getElementById('captcha-message');
    const errorMsg = document.getElementById('captcha-error-msg');
    const captchaInput = document.getElementById('captcha-input');
    
    // Show loading
    resetCaptchaStatus();
    if (loadingIcon) loadingIcon.classList.remove('hidden');
    if (message) {
        message.textContent = 'Memverifikasi teks...';
        message.className = 'mt-3 text-xs text-blue-600 dark:text-blue-400 text-center';
    }
    
    // Simulate verification delay
    setTimeout(() => {
        // Case-sensitive comparison
        const isCorrect = userInput === currentCaptcha.text;
        
        if (loadingIcon) loadingIcon.classList.add('hidden');
        
        if (isCorrect) {
            // Success
            captchaCompleted = true;
            if (successIcon) successIcon.classList.remove('hidden');
            if (message) {
                message.textContent = 'Verifikasi berhasil! ✓';
                message.className = 'mt-3 text-xs text-green-600 dark:text-green-400 text-center';
            }
            if (captchaInput) {
                captchaInput.classList.remove('border-red-500');
                captchaInput.classList.add('border-green-500');
            }
            
            // Enable login button
            enableLoginButton();
        } else {
            // Error
            captchaCompleted = false;
            if (errorIcon) errorIcon.classList.remove('hidden');
            if (message) {
                message.textContent = 'Teks tidak sesuai, coba lagi';
                message.className = 'mt-3 text-xs text-red-600 dark:text-red-400 text-center';
            }
            if (errorMsg) errorMsg.classList.remove('hidden');
            if (captchaInput) {
                captchaInput.classList.remove('border-green-500');
                captchaInput.classList.add('border-red-500');
                captchaInput.value = '';
                captchaInput.focus();
            }
            
            // Keep the same CAPTCHA, just reset the error state after 3 seconds
            setTimeout(() => {
                resetCaptchaStatus();
                if (captchaInput) {
                    captchaInput.classList.remove('border-red-500');
                }
            }, 3000);
        }
        
        captchaInProgress = false;
    }, 800 + Math.random() * 400); // Random delay 800-1200ms
}

function isCaptchaComplete() {
    return captchaCompleted;
}

// Random background patterns with dark mode support
function getBackgroundPatterns() {
    const isDarkMode = document.documentElement.classList.contains('dark');
    const lightColor = 'rgba(59, 130, 246, 0.25)'; // Blue with higher opacity for light mode
    const darkColor = 'rgba(156, 163, 175, 0.3)'; // Gray with higher opacity for dark mode
    const patternColor = isDarkMode ? darkColor : lightColor;
    
    return [
        // Geometric patterns with dynamic colors
        `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="pattern1" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                    <circle cx="20" cy="20" r="3" fill="${patternColor}"/>
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pattern1)"/>
        </svg>`,
        
        `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="pattern2" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                    <rect x="0" y="0" width="15" height="15" fill="${patternColor}"/>
                    <rect x="15" y="15" width="15" height="15" fill="${patternColor}"/>
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pattern2)"/>
        </svg>`,
        
        `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="pattern3" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
                    <polygon points="25,5 45,20 45,35 25,50 5,35 5,20" fill="${patternColor}"/>
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pattern3)"/>
        </svg>`,
        
        `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="pattern4" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                    <path d="M30 10 L50 30 L30 50 L10 30 Z" fill="${patternColor}"/>
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pattern4)"/>
        </svg>`,
        
        `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="pattern5" x="0" y="0" width="35" height="35" patternUnits="userSpaceOnUse">
                    <circle cx="17.5" cy="17.5" r="8" fill="none" stroke="${patternColor}" stroke-width="2"/>
                    <circle cx="17.5" cy="17.5" r="3" fill="${patternColor}"/>
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pattern5)"/>
        </svg>`,
        
        `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="pattern6" x="0" y="0" width="45" height="45" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="22.5" x2="45" y2="22.5" stroke="${patternColor}" stroke-width="2"/>
                    <line x1="22.5" y1="0" x2="22.5" y2="45" stroke="${patternColor}" stroke-width="2"/>
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pattern6)"/>
        </svg>`,
        
        `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="pattern7" x="0" y="0" width="25" height="25" patternUnits="userSpaceOnUse">
                    <rect x="5" y="5" width="15" height="15" fill="none" stroke="${patternColor}" stroke-width="1"/>
                    <circle cx="12.5" cy="12.5" r="2" fill="${patternColor}"/>
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pattern7)"/>
        </svg>`
    ];
}

function setRandomBackground() {
    const bgElement = document.getElementById('verification-bg');
    const outerBgElement = document.getElementById('outer-captcha-bg');
    
    if (bgElement || outerBgElement) {
        const patterns = getBackgroundPatterns();
        const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
        const randomPattern2 = patterns[Math.floor(Math.random() * patterns.length)];
        
        // Set pattern for inner CAPTCHA text box
        if (bgElement) {
            bgElement.innerHTML = randomPattern;
        }
        
        // Set different pattern for outer container
        if (outerBgElement) {
            outerBgElement.innerHTML = randomPattern2;
        }
    }
}

// Initialize CAPTCHA when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize CAPTCHA on page load
    setTimeout(() => {
        generateCaptcha();
        setRandomBackground();
    }, 500);
    
    // CAPTCHA event listeners
    const captchaInput = document.getElementById('captcha-input');
    if (captchaInput) {
        // Auto verify on input
        captchaInput.addEventListener('input', function(e) {
            const value = e.target.value.trim().toUpperCase();
            e.target.value = value; // Convert to uppercase as user types
            
            // Reset status if user is still typing (not at correct length)
            if (value.length !== currentCaptcha.text.length) {
                resetCaptchaInputStatus();
                clearTimeout(window.captchaTimeout);
                return;
            }
            
            // Only verify when length matches exactly
            if (value.length === currentCaptcha.text.length) {
                // Delay verification slightly to allow user to finish typing
                clearTimeout(window.captchaTimeout);
                window.captchaTimeout = setTimeout(() => {
                    verifyCaptcha(value);
                }, 300);
            }
        });
        
        // Verify on Enter key
        captchaInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const value = e.target.value.trim().toUpperCase();
                if (value && value.length >= 4) {
                    clearTimeout(window.captchaTimeout);
                    verifyCaptcha(value);
                }
            }
        });
        
        // Only allow letters and numbers
        captchaInput.addEventListener('keypress', function(e) {
            if (!/[A-Za-z0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Enter') {
                e.preventDefault();
            }
        });
    }
    
    // Refresh CAPTCHA button
    const refreshButton = document.getElementById('refresh-captcha');
    if (refreshButton) {
        refreshButton.addEventListener('click', function() {
            // Add rotation animation
            const icon = this.querySelector('i');
            if (icon) {
                icon.style.transform = 'rotate(360deg)';
                icon.style.transition = 'transform 0.5s ease';
                setTimeout(() => {
                    icon.style.transform = 'rotate(0deg)';
                }, 500);
            }
            generateCaptcha();
            setRandomBackground();
        });
    }
});

// Make functions globally available
window.generateCaptcha = generateCaptcha;
window.verifyCaptcha = verifyCaptcha;
window.isCaptchaComplete = isCaptchaComplete;
window.setRandomBackground = setRandomBackground;
window.enableLoginButton = enableLoginButton;
window.disableLoginButton = disableLoginButton;
