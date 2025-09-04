// ===== AUTHENTICATION SYSTEM =====
// Login, OTP Verification, and CAPTCHA Handler
// Version: 1.0

// API Configuration
const API_URL = "https://test.bulshitman1.workers.dev"; // Backend Worker URL

// Login system variables
let currentUser = null;
let otpTimer = null;
let otpTimeLeft = 60; // 1 minute in seconds
let resendTimer = null;
let currentCaptcha = '';
let resendCount = 0; // Track number of resend attempts
let resendCooldownTime = 60; // Initial cooldown: 1 minute

// ===== CAPTCHA SYSTEM =====

/**
 * Generate new CAPTCHA code
 */
function generateCaptcha() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let captcha = '';
    
    // Generate 6 character captcha
    for (let i = 0; i < 6; i++) {
        captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    currentCaptcha = captcha;
    document.getElementById('captchaText').textContent = captcha;
    
    // Clear captcha input
    document.getElementById('captchaInput').value = '';
    
    // Add rotation animation to refresh button
    const refreshBtn = document.querySelector('[onclick="generateCaptcha()"] i');
    if (refreshBtn) {
        refreshBtn.style.transform = 'rotate(360deg)';
        refreshBtn.style.transition = 'transform 0.5s ease-in-out';
        
        setTimeout(() => {
            refreshBtn.style.transform = 'rotate(0deg)';
        }, 500);
    }
}

/**
 * Validate CAPTCHA input
 */
function validateCaptcha() {
    const userInput = document.getElementById('captchaInput').value.toUpperCase().trim();
    return userInput === currentCaptcha;
}

// ===== LOGIN SYSTEM =====

/**
 * Handle login form submission
 */
async function handleLogin(event) {
    event.preventDefault();
    
    const nik = document.getElementById('nikLogin').value.trim();
    const password = document.getElementById('passwordLogin').value;
    
    if (!nik || !password) {
        showAlert('Silakan masukkan NIK dan password!', 'error');
        return;
    }
    
    // Validate CAPTCHA
    if (!validateCaptcha()) {
        showAlert('Kode CAPTCHA salah! Silakan coba lagi.', 'error');
        generateCaptcha(); // Generate new captcha
        document.getElementById('captchaInput').focus();
        return;
    }
    
    // Show loading state
    showLoginLoading(true);
    
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ action: "login", nik, password })
        });

        const data = await response.json();
        
        showLoginLoading(false);
        
        if (data.success && data.step === "otp") {
            // Store NIK for OTP verification
            localStorage.setItem("nik", nik);
            
            // Debug: Log the complete API response
            console.log('Complete API Response:', JSON.stringify(data, null, 2));
            
            // Get email from API response with comprehensive search
            let userEmail = findEmailInResponse(data);
            
            showOTPForm(userEmail);
            showAlert(data.message, 'success');
        } else {
            showAlert(data.message || 'Login gagal!', 'error');
            // Generate new captcha on login failure
            generateCaptcha();
        }
    } catch (error) {
        showLoginLoading(false);
        showAlert('Terjadi kesalahan koneksi. Silakan coba lagi.', 'error');
        // Generate new captcha on connection error
        generateCaptcha();
        console.error('Login error:', error);
    }
}

/**
 * Find email in API response object
 */
function findEmailInResponse(data) {
    // Function to recursively search for email in nested objects
    function findEmailInObject(obj, path = '') {
        if (!obj || typeof obj !== 'object') return null;
        
        // List of possible email field names
        const emailFields = [
            'email', 'user_email', 'Email', 'USER_EMAIL',
            'emailAddress', 'email_address', 'userEmail', 'UserEmail',
            'mail', 'Mail', 'e_mail', 'E_MAIL', 'emailAddr'
        ];
        
        // Check direct properties
        for (const field of emailFields) {
            if (obj[field] && typeof obj[field] === 'string' && obj[field].includes('@')) {
                console.log(`Email found at ${path}.${field}:`, obj[field]);
                return obj[field];
            }
        }
        
        // Recursively search in nested objects
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'object' && value !== null) {
                const found = findEmailInObject(value, path ? `${path}.${key}` : key);
                if (found) return found;
            }
        }
        
        return null;
    }
    
    // Search for email in the entire response
    let userEmail = findEmailInObject(data);
    
    // Additional specific checks for common API response structures
    if (!userEmail) {
        const commonPaths = [
            data.user?.email,
            data.user?.user_email,
            data.userData?.email,
            data.result?.email,
            data.response?.email,
            data.account?.email,
            data.profile?.email
        ];
        
        for (const path of commonPaths) {
            if (path && typeof path === 'string' && path.includes('@')) {
                userEmail = path;
                console.log('Email found in common path:', userEmail);
                break;
            }
        }
    }
    
    // If still no email found, check if there's any string containing @ symbol
    if (!userEmail) {
        function findEmailString(obj) {
            if (typeof obj === 'string' && obj.includes('@') && obj.includes('.')) {
                // Basic email validation
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (emailRegex.test(obj)) {
                    return obj;
                }
            }
            if (typeof obj === 'object' && obj !== null) {
                for (const value of Object.values(obj)) {
                    const found = findEmailString(value);
                    if (found) return found;
                }
            }
            return null;
        }
        
        userEmail = findEmailString(data);
        if (userEmail) {
            console.log('Email found by pattern matching:', userEmail);
        }
    }
    
    // Final fallback
    if (!userEmail || !userEmail.includes('@')) {
        userEmail = 'email yang terdaftar';
        console.warn('No valid email found in API response. Using fallback email text');
    }
    
    return userEmail;
}

/**
 * Toggle password visibility
 */
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(inputId + 'Icon');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// ===== OTP SYSTEM =====

/**
 * Show OTP verification form
 */
function showOTPForm(email) {
    // Hide login form and show OTP form
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('otpForm').classList.remove('hidden');
    
    // Display masked email
    const maskedEmail = maskEmail(email);
    document.getElementById('emailDisplay').textContent = maskedEmail;
    
    // Reset resend count and cooldown for new login session
    resendCount = 0;
    resendCooldownTime = 60; // Reset to 1 minute
    
    // Start OTP timer
    startOTPTimer();
    
    // Start initial resend cooldown (1 minute)
    startResendCooldown(resendCooldownTime);
    
    // Focus on first OTP input
    document.querySelector('.otp-input').focus();
}

/**
 * Handle OTP verification
 */
async function handleOTPVerification(event) {
    event.preventDefault();
    
    const nik = localStorage.getItem("nik");
    const otpInputs = document.querySelectorAll('.otp-input');
    let otp = '';
    
    otpInputs.forEach(input => {
        otp += input.value;
    });
    
    if (otp.length !== 6) {
        showAlert('Silakan masukkan kode OTP 6 digit!', 'error');
        return;
    }
    
    // Show loading state
    showOTPLoading(true);
    
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ action: "verify-otp", nik, otp })
        });

        const data = await response.json();
        
        showOTPLoading(false);
        
        if (data.success) {
            // Store user data
            localStorage.setItem("user", JSON.stringify(data.user));
            currentUser = data.user;
            
            // Clear timers
            clearInterval(otpTimer);
            clearInterval(resendTimer);
            
            // Hide login container and show dashboard
            setTimeout(() => {
                document.getElementById('loginContainer').classList.add('hidden');
                document.getElementById('dashboardContainer').classList.remove('hidden');
                
                // Update user info in dashboard immediately
                updateDashboardUserInfo();
                
                // Also update welcome message
                updateWelcomeMessage();
            }, 500);
        } else {
            showAlert(data.message || 'Kode OTP salah!', 'error');
            
            // Clear OTP inputs and disable button
            otpInputs.forEach(input => {
                input.value = '';
            });
            checkOTPComplete(); // This will disable the button
            otpInputs[0].focus();
        }
    } catch (error) {
        showOTPLoading(false);
        showAlert('Terjadi kesalahan koneksi. Silakan coba lagi.', 'error');
        console.error('OTP verification error:', error);
    }
}

/**
 * Handle OTP input navigation
 */
function moveToNext(current, index) {
    // Only allow numbers
    current.value = current.value.replace(/[^0-9]/g, '');
    
    if (current.value.length === 1 && index < 5) {
        document.querySelectorAll('.otp-input')[index + 1].focus();
    }
    
    // Check if all OTP fields are filled and enable/disable verify button
    checkOTPComplete();
}

/**
 * Handle OTP keydown events (backspace navigation)
 */
function handleOTPKeydown(event, current, index) {
    if (event.key === 'Backspace') {
        // If current field is empty and backspace is pressed, move to previous field
        if (current.value === '' && index > 0) {
            event.preventDefault();
            const otpInputs = document.querySelectorAll('.otp-input');
            otpInputs[index - 1].focus();
            otpInputs[index - 1].value = '';
            checkOTPComplete();
        } else if (current.value !== '') {
            // If current field has value, clear it and check completion
            setTimeout(() => {
                checkOTPComplete();
            }, 10);
        }
    }
}

/**
 * Check if all OTP inputs are filled
 */
function checkOTPComplete() {
    const otpInputs = document.querySelectorAll('.otp-input');
    const otpButton = document.getElementById('otpButton');
    let allFilled = true;
    
    otpInputs.forEach(input => {
        if (input.value === '') {
            allFilled = false;
        }
    });
    
    // Enable/disable verify button based on completion
    if (allFilled) {
        otpButton.disabled = false;
        otpButton.classList.remove('opacity-50', 'cursor-not-allowed');
        otpButton.classList.add('hover:from-green-700', 'hover:to-teal-700', 'transform', 'hover:scale-105');
    } else {
        otpButton.disabled = true;
        otpButton.classList.add('opacity-50', 'cursor-not-allowed');
        otpButton.classList.remove('hover:from-green-700', 'hover:to-teal-700', 'transform', 'hover:scale-105');
    }
}

/**
 * Start OTP countdown timer
 */
function startOTPTimer() {
    otpTimeLeft = 60; // Reset to 1 minute
    const timerDisplay = document.getElementById('otpTimer');
    
    otpTimer = setInterval(() => {
        const minutes = Math.floor(otpTimeLeft / 60);
        const seconds = otpTimeLeft % 60;
        
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (otpTimeLeft <= 0) {
            clearInterval(otpTimer);
            showAlert('Kode OTP telah kedaluwarsa. Silakan kirim ulang.', 'error');
            
            // Disable OTP inputs
            document.querySelectorAll('.otp-input').forEach(input => {
                input.disabled = true;
            });
            
            document.getElementById('otpButton').disabled = true;
        }
        
        otpTimeLeft--;
    }, 1000);
}

/**
 * Resend OTP code
 */
async function resendOTP() {
    const nik = localStorage.getItem("nik");
    const resendButton = document.getElementById('resendButton');
    
    if (!nik) {
        showAlert('Sesi telah berakhir. Silakan login ulang.', 'error');
        backToLogin();
        return;
    }
    
    // Show loading state
    resendButton.disabled = true;
    resendButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Mengirim...';
    
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ action: "resend-otp", nik })
        });

        const data = await response.json();
        
        if (data.success) {
            // Increment resend count
            resendCount++;
            
            // Calculate new cooldown time: 1 minute + (resendCount * 10 minutes)
            resendCooldownTime = 60 + (resendCount * 600); // 600 seconds = 10 minutes
            
            showAlert(`OTP berhasil dikirim ulang. Tunggu ${formatCooldownTime(resendCooldownTime)} untuk kirim ulang berikutnya.`, 'success');
            
            // Start cooldown with progressive time
            startResendCooldown(resendCooldownTime);
            
            // Restart OTP timer
            startOTPTimer();
        } else {
            // Reset button if failed
            resendButton.disabled = false;
            resendButton.innerHTML = '<i class="fas fa-redo mr-2"></i>Kirim Ulang';
            showAlert(data.message || 'Gagal mengirim ulang OTP', 'error');
        }
    } catch (error) {
        resendButton.disabled = false;
        resendButton.innerHTML = '<i class="fas fa-redo mr-2"></i>Kirim Ulang';
        showAlert('Terjadi kesalahan koneksi. Silakan coba lagi.', 'error');
        console.error('Resend OTP error:', error);
    }
}

/**
 * Start resend cooldown timer
 */
function startResendCooldown(seconds) {
    const resendButton = document.getElementById('resendButton');
    clearInterval(resendTimer);

    let remaining = seconds;
    resendButton.disabled = true;
    
    // Update button text with formatted time
    const updateButtonText = () => {
        const minutes = Math.floor(remaining / 60);
        const secs = remaining % 60;
        
        if (minutes > 0) {
            resendButton.innerHTML = `<i class="fas fa-clock mr-2"></i>Tunggu ${minutes}:${secs.toString().padStart(2, '0')}`;
        } else {
            resendButton.innerHTML = `<i class="fas fa-clock mr-2"></i>Tunggu ${secs} detik`;
        }
    };
    
    updateButtonText();

    resendTimer = setInterval(() => {
        remaining--;
        if (remaining > 0) {
            updateButtonText();
        } else {
            clearInterval(resendTimer);
            resendButton.disabled = false;
            resendButton.innerHTML = '<i class="fas fa-redo mr-2"></i>Kirim Ulang';
        }
    }, 1000);
}

/**
 * Format cooldown time for display
 */
function formatCooldownTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
        return `${minutes} menit ${remainingSeconds > 0 ? remainingSeconds + ' detik' : ''}`.trim();
    } else {
        return `${remainingSeconds} detik`;
    }
}

/**
 * Go back to login form
 */
function backToLogin() {
    document.getElementById('otpForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
    
    // Clear OTP inputs and reset button state
    document.querySelectorAll('.otp-input').forEach(input => {
        input.value = '';
    });
    
    // Reset OTP button to disabled state
    const otpButton = document.getElementById('otpButton');
    if (otpButton) {
        otpButton.disabled = true;
        otpButton.classList.add('opacity-50', 'cursor-not-allowed');
        otpButton.classList.remove('hover:from-green-700', 'hover:to-teal-700', 'transform', 'hover:scale-105');
    }
    
    // Clear timers
    if (otpTimer) {
        clearInterval(otpTimer);
    }
    if (resendTimer) {
        clearInterval(resendTimer);
    }
    
    // Reset resend cooldown system
    resendCount = 0;
    resendCooldownTime = 60;
    
    // Reset resend button
    const resendButton = document.getElementById('resendButton');
    if (resendButton) {
        resendButton.disabled = false;
        resendButton.innerHTML = '<i class="fas fa-redo mr-2"></i>Kirim Ulang';
    }
    
    // Generate new captcha when returning to login
    generateCaptcha();
    
    currentUser = null;
}

// ===== UTILITY FUNCTIONS =====

/**
 * Mask email for display
 */
function maskEmail(email) {
    // Handle case where email might not contain @
    if (!email || !email.includes('@')) {
        return 'email yang terdaftar';
    }
    
    const [username, domain] = email.split('@');
    
    // Handle very short usernames
    if (username.length <= 2) {
        const maskedUsername = username.charAt(0) + '*';
        return maskedUsername + '@' + domain;
    }
    
    // Normal masking for longer usernames
    const maskedUsername = username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1);
    return maskedUsername + '@' + domain;
}

/**
 * Show login loading state
 */
function showLoginLoading(show) {
    const button = document.getElementById('loginButton');
    const buttonText = document.getElementById('loginButtonText');
    const buttonLoading = document.getElementById('loginButtonLoading');
    
    if (show) {
        button.disabled = true;
        buttonText.classList.add('hidden');
        buttonLoading.classList.remove('hidden');
    } else {
        button.disabled = false;
        buttonText.classList.remove('hidden');
        buttonLoading.classList.add('hidden');
    }
}

/**
 * Show OTP loading state
 */
function showOTPLoading(show) {
    const button = document.getElementById('otpButton');
    const buttonText = document.getElementById('otpButtonText');
    const buttonLoading = document.getElementById('otpButtonLoading');
    
    if (show) {
        button.disabled = true;
        buttonText.classList.add('hidden');
        buttonLoading.classList.remove('hidden');
    } else {
        button.disabled = false;
        buttonText.classList.remove('hidden');
        buttonLoading.classList.add('hidden');
    }
}

/**
 * Show alert notification
 */
function showAlert(message, type) {
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full`;
    
    if (type === 'success') {
        alert.classList.add('bg-green-500', 'text-white');
        alert.innerHTML = `<i class="fas fa-check-circle mr-2"></i>${message}`;
    } else if (type === 'info') {
        alert.classList.add('bg-blue-500', 'text-white');
        alert.innerHTML = `<i class="fas fa-info-circle mr-2"></i>${message}`;
    } else {
        alert.classList.add('bg-red-500', 'text-white');
        alert.innerHTML = `<i class="fas fa-exclamation-circle mr-2"></i>${message}`;
    }
    
    document.body.appendChild(alert);
    
    // Animate in
    setTimeout(() => {
        alert.classList.remove('translate-x-full');
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        alert.classList.add('translate-x-full');
        setTimeout(() => {
            document.body.removeChild(alert);
        }, 300);
    }, 5000);
}

// ===== USER MANAGEMENT FUNCTIONS =====

/**
 * Update dashboard user information
 */
function updateDashboardUserInfo() {
    if (!currentUser) {
        console.log('No current user data available');
        return;
    }
    
    console.log('Updating dashboard with user data:', currentUser);
    
    // Extract username from various possible fields
    const username = currentUser.Username || 
                    currentUser.username || 
                    currentUser.name || 
                    currentUser.Name || 
                    currentUser.fullName || 
                    currentUser.full_name || 
                    'User';
    
    // Extract role from various possible fields
    const userRole = currentUser.Role || 
                   currentUser.role || 
                   currentUser.jabatan || 
                   currentUser.Jabatan || 
                   currentUser.position || 
                   currentUser.Position || 
                   'User';
    
    // Extract profile avatar URL if available
    const profileImageUrl = currentUser.ProfilAvatar || 
                          currentUser.profileAvatar || 
                          currentUser.avatar || 
                          currentUser.Avatar || 
                          currentUser.profileImage || 
                          currentUser.profile_image || 
                          null;
    
    console.log('Extracted data:', {
        username: username,
        role: userRole,
        avatar: profileImageUrl
    });
    
    // Update user name in dashboard
    const userNameElements = document.querySelectorAll('.user-name');
    userNameElements.forEach(element => {
        element.textContent = username;
    });
    
    // Update user role
    const userRoleElements = document.querySelectorAll('.user-role');
    userRoleElements.forEach(element => {
        element.textContent = userRole;
    });
    
    // Update profile avatars (use image if available, otherwise generate initials)
    if (profileImageUrl) {
        updateProfileAvatarWithImage(profileImageUrl, username);
    } else {
        generateProfileAvatar(username);
    }
}

/**
 * Update welcome message with user name
 */
function updateWelcomeMessage() {
    if (!currentUser) return;
    
    const username = currentUser.Username || 
                    currentUser.username || 
                    currentUser.name || 
                    currentUser.Name || 
                    currentUser.fullName || 
                    currentUser.full_name || 
                    'User';
    
    const welcomeText = document.querySelector('#welcomePage p');
    if (welcomeText) {
        welcomeText.textContent = `Halo ${username}, semoga hari Anda menyenangkan!`;
    }
}

/**
 * Update profile avatar with actual image
 */
function updateProfileAvatarWithImage(imageUrl, fallbackName) {
    const avatarHTML = `
        <img id="avatar" src="https://test.bulshitman1.workers.dev/avatar?url=${encodeURIComponent(imageUrl)}" 
             alt="Profile Avatar" 
             class="w-full h-full rounded-full object-cover"
             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
             onload="this.nextElementSibling.style.display='none';">
        <div class="w-full h-full bg-blue-500 rounded-full flex items-center justify-center" style="display: none;">
            <span class="text-white font-semibold text-sm">${getInitials(fallbackName)}</span>
        </div>
    `;
    
    // Update desktop, mobile, and welcome page avatars
    const profileAvatar = document.getElementById('profileAvatar');
    const mobileProfileAvatar = document.getElementById('mobileProfileAvatar');
    const welcomeProfileAvatar = document.getElementById('welcomeProfileAvatar');
    
    if (profileAvatar) {
        profileAvatar.innerHTML = avatarHTML;
    }
    if (mobileProfileAvatar) {
        mobileProfileAvatar.innerHTML = avatarHTML;
    }
    if (welcomeProfileAvatar) {
        welcomeProfileAvatar.innerHTML = avatarHTML;
    }
}

/**
 * Generate profile avatar from name initials
 */
function generateProfileAvatar(name) {
    const initials = getInitials(name);
    const colors = [
        'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 
        'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500'
    ];
    
    // Generate consistent color based on name
    const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    const bgColor = colors[colorIndex];
    
    // Create avatar HTML
    const avatarHTML = `
        <div class="w-full h-full ${bgColor} rounded-full flex items-center justify-center">
            <span class="text-white font-semibold text-sm">${initials}</span>
        </div>
    `;
    
    // Update desktop, mobile, and welcome page avatars
    const profileAvatar = document.getElementById('profileAvatar');
    const mobileProfileAvatar = document.getElementById('mobileProfileAvatar');
    const welcomeProfileAvatar = document.getElementById('welcomeProfileAvatar');
    
    if (profileAvatar) {
        profileAvatar.innerHTML = avatarHTML;
    }
    if (mobileProfileAvatar) {
        mobileProfileAvatar.innerHTML = avatarHTML;
    }
    if (welcomeProfileAvatar) {
        welcomeProfileAvatar.innerHTML = avatarHTML;
    }
}

/**
 * Get initials from full name
 */
function getInitials(name) {
    if (!name) return 'U';
    
    const words = name.trim().split(' ');
    if (words.length === 1) {
        return words[0].charAt(0).toUpperCase();
    } else if (words.length >= 2) {
        return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
    }
    return 'U';
}

// ===== INITIALIZATION =====

/**
 * Initialize authentication system
 */
function initializeAuth() {
    // Generate initial CAPTCHA
    generateCaptcha();
    
    // Check for existing user session
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        try {
            currentUser = JSON.parse(storedUser);
            console.log('Found stored user:', currentUser);
            
            // If user is already logged in, show dashboard
            document.getElementById('loginContainer').classList.add('hidden');
            document.getElementById('dashboardContainer').classList.remove('hidden');
            
            // Update user info
            updateDashboardUserInfo();
            updateWelcomeMessage();
        } catch (error) {
            console.error('Error parsing stored user data:', error);
            localStorage.removeItem('user');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeAuth);

// ===== LOGOUT FUNCTION =====

/**
 * Logout user and clear session
 */
function logout() {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
        // Clear stored data
        localStorage.removeItem('user');
        localStorage.removeItem('nik');
        currentUser = null;
        
        // Clear timers
        if (otpTimer) clearInterval(otpTimer);
        if (resendTimer) clearInterval(resendTimer);
        
        // Reset resend cooldown system
        resendCount = 0;
        resendCooldownTime = 60;
        
        // Reset forms
        document.getElementById('nikLogin').value = '';
        document.getElementById('passwordLogin').value = '';
        document.getElementById('captchaInput').value = '';
        document.querySelectorAll('.otp-input').forEach(input => {
            input.value = '';
            input.disabled = false;
        });
        
        // Reset OTP button state
        const otpButton = document.getElementById('otpButton');
        if (otpButton) otpButton.disabled = false;
        
        // Generate new captcha
        generateCaptcha();
        
        // Hide dashboard and show login with smooth transition
        const dashboardContainer = document.getElementById('dashboardContainer');
        const loginContainer = document.getElementById('loginContainer');
        
        dashboardContainer.style.opacity = '1';
        dashboardContainer.style.transition = 'opacity 0.3s ease-out';
        dashboardContainer.style.opacity = '0';
        
        setTimeout(() => {
            dashboardContainer.classList.add('hidden');
            loginContainer.classList.remove('hidden');
            document.getElementById('otpForm').classList.add('hidden');
            document.getElementById('loginForm').classList.remove('hidden');
            
            // Fade in login container
            loginContainer.style.opacity = '0';
            loginContainer.style.transition = 'opacity 0.3s ease-in';
            setTimeout(() => {
                loginContainer.style.opacity = '1';
            }, 50);
        }, 300);
        
        showAlert('Anda telah berhasil keluar', 'success');
    }
}
