// Global variables
let countdownTimer;
let timeLeft = 60; // 1 minute in seconds
let resendTimer = null;
let resendCooldownTime = 60; // Initial cooldown time in seconds

// API Configuration
const API_URL = "https://test.bulshitman1.workers.dev"; // ganti dengan URL Worker kamu

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeLoginOTP();
});

// Initialize login and OTP functionality
function initializeLoginOTP() {
    // Add event listeners for forms
    const loginForm = document.querySelector('#loginForm form');
    const otpForm = document.querySelector('#otpForm form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (otpForm) {
        otpForm.addEventListener('submit', handleOTPVerification);
    }
    
    // Add event listeners for OTP inputs
    const otpInputs = document.querySelectorAll('.otp-input');
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => moveToNext(e.target, index));
        input.addEventListener('keydown', (e) => handleOTPKeydown(e, index));
    });
}

// Login form handler
async function handleLogin(event) {
    event.preventDefault();
    
    const nik = document.getElementById('nik').value;
    const password = document.getElementById('password').value;
    
    // Basic validation
    if (nik.length !== 16) {
        alert('NIK harus terdiri dari 16 digit');
        return;
    }
    
    if (password.length < 6) {
        alert('Password minimal 6 karakter');
        return;
    }
    
    // Show loading state
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalContent = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2 text-blue-200"></i>Memproses...';
    
    try {
        // Call API
        const res = await fetch(API_URL, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ action: "login", nik, password })
        });

        const data = await res.json();
        alert(data.message);

        if (data.success && data.step === "otp") {
            localStorage.setItem("nik", nik);
            
            // Get email from login response
            let userEmail = null;
            
            // Check all possible email fields in response
            if (data.email && data.email.includes('@')) {
                userEmail = data.email;
            } else if (data.user && data.user.email && data.user.email.includes('@')) {
                userEmail = data.user.email;
            } else if (data.data && data.data.email && data.data.email.includes('@')) {
                userEmail = data.data.email;
            } else if (data.userInfo && data.userInfo.email && data.userInfo.email.includes('@')) {
                userEmail = data.userInfo.email;
            } else if (data.profile && data.profile.email && data.profile.email.includes('@')) {
                userEmail = data.profile.email;
            }
            
            if (userEmail) {
                localStorage.setItem("userEmail", userEmail);
                updateEmailDisplay(userEmail);
            } else {
                // Show error message instead of trying API call
                updateEmailDisplay("Email tidak ditemukan dalam response login");
                
                // Try fallback API call as last resort
                await fetchUserEmail(nik);
            }
            
            // Reset cooldown time to initial value when starting new login
            resendCooldownTime = 60;
            
            // Hide login form and show OTP form
            document.getElementById('loginForm').classList.add('hidden');
            document.getElementById('otpForm').classList.remove('hidden');
            
            // Start countdown timer
            startCountdown();
            
            // Auto-disable resend button with initial cooldown
            startResendCooldown(60);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Terjadi kesalahan saat login. Silakan coba lagi.');
    } finally {
        // Reset button
        submitButton.disabled = false;
        submitButton.innerHTML = originalContent;
    }
}

// OTP input navigation
function moveToNext(current, index) {
    if (current.value.length === 1 && index < 5) {
        const nextInput = document.querySelectorAll('.otp-input')[index + 1];
        if (nextInput) {
            nextInput.focus();
        }
    }
    
    // Auto-submit when all fields are filled
    const otpInputs = document.querySelectorAll('.otp-input');
    const allFilled = Array.from(otpInputs).every(input => input.value.length === 1);
    if (allFilled) {
        // Small delay to show the last digit
        setTimeout(() => {
            const otpForm = document.querySelector('#otpForm form');
            if (otpForm) {
                otpForm.dispatchEvent(new Event('submit'));
            }
        }, 500);
    }
}

// Handle OTP input keydown events
function handleOTPKeydown(event, index) {
    const otpInputs = document.querySelectorAll('.otp-input');
    
    // Handle backspace
    if (event.key === 'Backspace') {
        if (event.target.value === '' && index > 0) {
            otpInputs[index - 1].focus();
        }
    }
    
    // Handle arrow keys
    if (event.key === 'ArrowLeft' && index > 0) {
        otpInputs[index - 1].focus();
    }
    
    if (event.key === 'ArrowRight' && index < 5) {
        otpInputs[index + 1].focus();
    }
    
    // Only allow numbers
    if (!/[0-9]/.test(event.key) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();
    }
}

// OTP verification handler
async function handleOTPVerification(event) {
    event.preventDefault();
    
    const otpInputs = document.querySelectorAll('.otp-input');
    const otp = Array.from(otpInputs).map(input => input.value).join('');
    
    if (otp.length !== 6) {
        alert('Silakan masukkan kode OTP 6 digit');
        return;
    }
    
    // Show loading state
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalContent = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Memverifikasi...';
    
    try {
        const nik = localStorage.getItem("nik");
        
        // Call API
        const res = await fetch(API_URL, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ action: "verify-otp", nik, otp })
        });

        const data = await res.json();
        alert(data.message);

        if (data.success) {
            // Clear countdown timer
            if (countdownTimer) {
                clearInterval(countdownTimer);
            }
            
            // Clear resend timer
            if (resendTimer) {
                clearInterval(resendTimer);
            }
            
            // Store user info from API response
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('userNIK', nik);
            localStorage.setItem('userName', data.user.name || 'User');
            localStorage.setItem('isLoggedIn', 'true');
            
            // Show dashboard
            showDashboard();
        }
    } catch (error) {
        console.error('OTP verification error:', error);
        alert('Terjadi kesalahan saat verifikasi OTP. Silakan coba lagi.');
    } finally {
        // Reset button
        submitButton.disabled = false;
        submitButton.innerHTML = originalContent;
    }
}

// Countdown timer
function startCountdown() {
    timeLeft = 60; // Reset to 1 minute (60 seconds)
    const countdownElement = document.getElementById('countdown');
    
    countdownTimer = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        countdownElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            clearInterval(countdownTimer);
            // Don't show alert, just show expired message
            countdownElement.textContent = '00:00';
            countdownElement.classList.add('text-red-600', 'font-bold');
            
            // Disable OTP inputs when expired
            const otpInputs = document.querySelectorAll('.otp-input');
            otpInputs.forEach(input => {
                input.disabled = true;
                input.classList.add('bg-gray-100', 'dark:bg-gray-600');
            });
            
            // Show message to request new OTP
            const otpForm = document.getElementById('otpForm');
            if (otpForm && !otpForm.querySelector('.expired-message')) {
                const expiredMsg = document.createElement('div');
                expiredMsg.className = 'expired-message mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-center';
                expiredMsg.innerHTML = '<p class="text-red-600 dark:text-red-400 text-sm font-medium">Kode OTP telah kedaluwarsa. Silakan klik "Kirim ulang" untuk mendapatkan kode baru.</p>';
                otpForm.appendChild(expiredMsg);
            }
        }
        
        timeLeft--;
    }, 1000);
}

// Resend OTP
async function resendOTP() {
    const resendBtn = document.getElementById('resendBtn');
    const originalText = resendBtn.textContent;
    
    resendBtn.disabled = true;
    resendBtn.textContent = 'Mengirim...';
    
    try {
        const nik = localStorage.getItem("nik");
        
        // Call API
        const res = await fetch(API_URL, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ action: "resend-otp", nik })
        });

        const data = await res.json();
        alert(data.message);
        
        if (data.success) {
            // Clear existing OTP inputs and re-enable them
            document.querySelectorAll('.otp-input').forEach(input => {
                input.value = '';
                input.disabled = false;
                input.classList.remove('bg-gray-100', 'dark:bg-gray-600');
            });
            document.querySelector('.otp-input').focus();
            
            // Remove expired message if exists
            const expiredMsg = document.querySelector('.expired-message');
            if (expiredMsg) {
                expiredMsg.remove();
            }
            
            // Reset countdown display
            const countdownElement = document.getElementById('countdown');
            if (countdownElement) {
                countdownElement.classList.remove('text-red-600', 'font-bold');
            }
            
            // Restart countdown
            if (countdownTimer) {
                clearInterval(countdownTimer);
            }
            startCountdown();
            
            // Apply progressive cooldown - starts at 1 minute, then increases to 10 minutes
            startResendCooldown(resendCooldownTime);
            
            // Increase cooldown time for next resend (10 minutes = 600 seconds)
            resendCooldownTime = 600;
        } else {
            // If failed, re-enable button
            resendBtn.disabled = false;
            resendBtn.textContent = originalText;
        }
    } catch (error) {
        console.error('Resend OTP error:', error);
        alert('Terjadi kesalahan saat mengirim ulang OTP. Silakan coba lagi.');
        resendBtn.disabled = false;
        resendBtn.textContent = originalText;
    }
}

// Start cooldown timer for resend button
function startResendCooldown(seconds) {
    const btn = document.getElementById("resendBtn");
    clearInterval(resendTimer);

    let remaining = seconds;
    btn.disabled = true;
    btn.textContent = `Tunggu ${remaining} detik...`;

    resendTimer = setInterval(() => {
        remaining--;
        if (remaining > 0) {
            btn.textContent = `Tunggu ${remaining} detik...`;
        } else {
            clearInterval(resendTimer);
            btn.disabled = false;
            btn.textContent = "Kirim ulang";
        }
    }, 1000);
}

// Back to login
function backToLogin() {
    // Clear all timers
    if (countdownTimer) {
        clearInterval(countdownTimer);
    }
    if (resendTimer) {
        clearInterval(resendTimer);
    }
    
    // Reset resend button and cooldown time
    const resendBtn = document.getElementById('resendBtn');
    if (resendBtn) {
        resendBtn.disabled = false;
        resendBtn.textContent = 'Kirim ulang';
    }
    
    // Reset cooldown time to initial value
    resendCooldownTime = 60;
    
    // Clear stored data
    localStorage.removeItem('nik');
    localStorage.removeItem('userEmail');
    
    document.getElementById('otpForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
    
    // Clear OTP inputs
    document.querySelectorAll('.otp-input').forEach(input => {
        input.value = '';
    });
    
    // Reset email display
    const emailElement = document.getElementById('userEmail');
    if (emailElement) {
        emailElement.textContent = 'Loading...';
    }
}

// Fetch user email from NIK
async function fetchUserEmail(nik) {
    try {
        const requestData = { action: "get-user-email", nik };
        
        const res = await fetch(API_URL, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(requestData)
        });

        const data = await res.json();
        
        if (data.success && data.email) {
            localStorage.setItem("userEmail", data.email);
            updateEmailDisplay(data.email);
        } else {
            // Show loading state instead of fallback
            updateEmailDisplay("Mengambil data email...");
            
            // Try alternative approach - get from login response
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                try {
                    const userData = JSON.parse(storedUser);
                    if (userData.email) {
                        updateEmailDisplay(userData.email);
                        return;
                    }
                } catch (e) {
                    // Silent error handling
                }
            }
            
            // Final fallback
            updateEmailDisplay("Email tidak ditemukan");
        }
    } catch (error) {
        updateEmailDisplay("Gagal mengambil email");
    }
}

// Email masking function
function maskEmail(email) {
    if (!email || !email.includes('@')) {
        return email;
    }
    
    const [localPart, domain] = email.split('@');
    
    if (localPart.length <= 4) {
        // For short emails (4 chars or less), show first char + asterisks + @domain
        return localPart.charAt(0) + '***@' + domain;
    } else {
        // For longer emails, show first 2 chars + asterisks + last 2 chars + @domain
        const firstTwo = localPart.substring(0, 2);
        const lastTwo = localPart.substring(localPart.length - 2);
        const middleLength = localPart.length - 4;
        const asterisks = '*'.repeat(middleLength);
        
        return firstTwo + asterisks + lastTwo + '@' + domain;
    }
}

// Update email display with masking
function updateEmailDisplay(email) {
    const emailElement = document.getElementById('userEmail');
    if (emailElement && email && email !== 'undefined') {
        // Check if email contains @ symbol
        if (email.includes('@')) {
            // Display the masked email
            const maskedEmail = maskEmail(email);
            emailElement.textContent = maskedEmail;
        } else {
            emailElement.textContent = "Format email tidak valid";
        }
    } else {
        emailElement.textContent = "Email tidak tersedia";
    }
}

2. Script Utilitas (utils.js)

// Password toggle functionality
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('passwordToggleIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

// Show dashboard
function showDashboard() {
    document.getElementById('loginContainer').classList.add('hidden');
    document.getElementById('dashboardContainer').classList.remove('hidden');
    
    // Update user profile in dashboard
    updateUserProfile();
    
    // Change body background for dashboard
    document.body.className = 'h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-300';
}

// Update user profile information
function updateUserProfile() {
    const userDataString = localStorage.getItem('user');
    let userData = null;
    
    if (userDataString) {
        try {
            userData = JSON.parse(userDataString);
        } catch (error) {
            // Silent error handling
        }
    }
    
    // Get user information with fallbacks
    const userName = userData?.Username || localStorage.getItem('userName') || 'John Doe';
    const userRole = userData?.Role || 'Administrator';
    const profileAvatar = userData?.ProfilAvatar;
    
    // Update name displays
    document.getElementById('userNameSidebar').textContent = userName;
    document.getElementById('userNameMobile').textContent = userName;
    document.getElementById('userNameWelcome').textContent = userName;
    
    // Update role displays
    document.getElementById('userRoleSidebar').textContent = userRole;
    document.getElementById('userRoleMobile').textContent = userRole;
    
    // Update profile images
    updateProfileImage('sidebarProfileImage', profileAvatar);
    updateProfileImage('mobileProfileImage', profileAvatar);
}

// Update profile image
function updateProfileImage(elementId, avatarUrl) {
    const profileElement = document.getElementById(elementId);
    if (!profileElement) return;
    
    if (avatarUrl && avatarUrl.trim() !== '') {
        // Create image element using your proxy service
        const img = document.createElement('img');
        img.src = `https://test.bulshitman1.workers.dev/avatar?url=${encodeURIComponent(avatarUrl)}`;
        img.alt = 'Profile Avatar';
        img.className = 'w-full h-full object-cover rounded-full';
        
        // Handle image load success
        img.onload = function() {
            profileElement.innerHTML = '';
            profileElement.appendChild(img);
        };
        
        // Handle image load error - fallback to icon
        img.onerror = function() {
            profileElement.innerHTML = '<i class="fas fa-user text-white text-sm"></i>';
        };
        
        // Set a timeout fallback in case image takes too long
        setTimeout(() => {
            if (!profileElement.querySelector('img')) {
                profileElement.innerHTML = '<i class="fas fa-user text-white text-sm"></i>';
            }
        }, 10000); // 10 second timeout
    } else {
        // No avatar URL, use default icon
        profileElement.innerHTML = '<i class="fas fa-user text-white text-sm"></i>';
    }
}

// Logout function
function logout() {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
        // Clear all stored data
        localStorage.removeItem('userNIK');
        localStorage.removeItem('userName');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('nik');
        localStorage.removeItem('user');
        localStorage.removeItem('userEmail');
        
        // Reset forms
        document.getElementById('nik').value = '';
        document.getElementById('password').value = '';
        document.querySelectorAll('.otp-input').forEach(input => {
            input.value = '';
        });
        
        // Clear all timers
        if (countdownTimer) {
            clearInterval(countdownTimer);
        }
        if (resendTimer) {
            clearInterval(resendTimer);
        }
        
        // Reset resend button and cooldown time
        const resendBtn = document.getElementById('resendBtn');
        if (resendBtn) {
            resendBtn.disabled = false;
            resendBtn.textContent = 'Kirim ulang';
        }
        
        // Reset cooldown time to initial value
        resendCooldownTime = 60;
        
        // Show login container
        document.getElementById('dashboardContainer').classList.add('hidden');
        document.getElementById('loginContainer').classList.remove('hidden');
        document.getElementById('otpForm').classList.add('hidden');
        document.getElementById('loginForm').classList.remove('hidden');
        
        // Reset body background
        document.body.className = 'h-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300';
        
        // Reset email display
        const emailElement = document.getElementById('userEmail');
        if (emailElement) {
            emailElement.textContent = 'Loading...';
        }
    }
}

3. Script Konfigurasi API (api-config.js)

// API Configuration
const API_CONFIG = {
    BASE_URL: "https://test.bulshitman1.workers.dev",
    ENDPOINTS: {
        LOGIN: "/login",
        VERIFY_OTP: "/verify-otp", 
        RESEND_OTP: "/resend-otp",
        GET_USER_EMAIL: "/get-user-email",
        AVATAR_PROXY: "/avatar"
    },
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3
};

// API Helper Functions
class APIClient {
    constructor(baseURL = API_CONFIG.BASE_URL) {
        this.baseURL = baseURL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    async login(nik, password) {
        return this.request('', {
            body: JSON.stringify({ 
                action: "login", 
                nik, 
                password 
            })
        });
    }

    async verifyOTP(nik, otp) {
        return this.request('', {
            body: JSON.stringify({ 
                action: "verify-otp", 
                nik, 
                otp 
            })
        });
    }

    async resendOTP(nik) {
        return this.request('', {
            body: JSON.stringify({ 
                action: "resend-otp", 
                nik 
            })
        });
    }

    async getUserEmail(nik) {
        return this.request('', {
            body: JSON.stringify({ 
                action: "get-user-email", 
                nik 
            })
        });
    }

    getAvatarURL(avatarUrl) {
        return `${this.baseURL}/avatar?url=${encodeURIComponent(avatarUrl)}`;
    }
}

// Create global API client instance
const apiClient = new APIClient();

4. Script Validasi (validation.js)

// Validation Functions
class Validator {
    static validateNIK(nik) {
        if (!nik) {
            return { valid: false, message: 'NIK tidak boleh kosong' };
        }
        
        if (nik.length !== 16) {
            return { valid: false, message: 'NIK harus terdiri dari 16 digit' };
        }
        
        if (!/^\d+$/.test(nik)) {
            return { valid: false, message: 'NIK hanya boleh berisi angka' };
        }
        
        return { valid: true, message: 'NIK valid' };
    }

    static validatePassword(password) {
        if (!password) {
            return { valid: false, message: 'Password tidak boleh kosong' };
        }
        
        if (password.length < 6) {
            return { valid: false, message: 'Password minimal 6 karakter' };
        }
        
        return { valid: true, message: 'Password valid' };
    }

    static validateOTP(otp) {
        if (!otp) {
            return { valid: false, message: 'Kode OTP tidak boleh kosong' };
        }
        
        if (otp.length !== 6) {
            return { valid: false, message: 'Kode OTP harus 6 digit' };
        }
        
        if (!/^\d+$/.test(otp)) {
            return { valid: false, message: 'Kode OTP hanya boleh berisi angka' };
        }
        
        return { valid: true, message: 'Kode OTP valid' };
    }

    static validateEmail(email) {
        if (!email) {
            return { valid: false, message: 'Email tidak boleh kosong' };
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { valid: false, message: 'Format email tidak valid' };
        }
        
        return { valid: true, message: 'Email valid' };
    }
}

// Form validation helpers
function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    // Remove existing error
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Add error styling
    field.classList.add('border-red-500', 'focus:ring-red-500');
    field.classList.remove('border-gray-300', 'focus:ring-blue-500');
    
    // Add error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error mt-1 text-sm text-red-600 dark:text-red-400';
    errorDiv.textContent = message;
    field.parentNode.appendChild(errorDiv);
}

function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    // Remove error styling
    field.classList.remove('border-red-500', 'focus:ring-red-500');
    field.classList.add('border-gray-300', 'focus:ring-blue-500');
    
    // Remove error message
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

function validateLoginForm() {
    const nik = document.getElementById('nik').value;
    const password = document.getElementById('password').value;
    
    let isValid = true;
    
    // Clear previous errors
    clearFieldError('nik');
    clearFieldError('password');
    
    // Validate NIK
    const nikValidation = Validator.validateNIK(nik);
    if (!nikValidation.valid) {
        showFieldError('nik', nikValidation.message);
        isValid = false;
    }
    
    // Validate Password
    const passwordValidation = Validator.validatePassword(password);
    if (!passwordValidation.valid) {
        showFieldError('password', passwordValidation.message);
        isValid = false;
    }
    
    return isValid;
}

function validateOTPForm() {
    const otpInputs = document.querySelectorAll('.otp-input');
    const otp = Array.from(otpInputs).map(input => input.value).join('');
    
    const otpValidation = Validator.validateOTP(otp);
    
    if (!otpValidation.valid) {
        // Highlight OTP inputs with error
        otpInputs.forEach(input => {
            input.classList.add('border-red-500', 'focus:ring-red-500');
            input.classList.remove('border-gray-300', 'focus:ring-blue-500');
        });
        
        // Show error message
        alert(otpValidation.message);
        return false;
    }
    
    // Clear error styling
    otpInputs.forEach(input => {
        input.classList.remove('border-red-500', 'focus:ring-red-500');
        input.classList.add('border-gray-300', 'focus:ring-blue-500');
    });
    
    return true;
}

5. Script Konstanta (constants.js)

// Application Constants
const APP_CONSTANTS = {
    // Timer settings
    OTP_COUNTDOWN_SECONDS: 60, // 1 minute
    INITIAL_RESEND_COOLDOWN: 60, // 1 minute
    EXTENDED_RESEND_COOLDOWN: 600, // 10 minutes
    
    // Validation rules
    NIK_LENGTH: 16,
    MIN_PASSWORD_LENGTH: 6,
    OTP_LENGTH: 6,
    
    // Local storage keys
    STORAGE_KEYS: {
        NIK: 'nik',
        USER_EMAIL: 'userEmail',
        USER_DATA: 'user',
        USER_NIK: 'userNIK',
        USER_NAME: 'userName',
        IS_LOGGED_IN: 'isLoggedIn'
    },
    
    // CSS classes
    CSS_CLASSES: {
        HIDDEN: 'hidden',
        ERROR_BORDER: 'border-red-500',
        ERROR_RING: 'focus:ring-red-500',
        SUCCESS_BORDER: 'border-green-500',
        SUCCESS_RING: 'focus:ring-green-500',
        DEFAULT_BORDER: 'border-gray-300',
        DEFAULT_RING: 'focus:ring-blue-500'
    },
    
    // Messages
    MESSAGES: {
        NIK_REQUIRED: 'NIK tidak boleh kosong',
        NIK_INVALID_LENGTH: 'NIK harus terdiri dari 16 digit',
        NIK_INVALID_FORMAT: 'NIK hanya boleh berisi angka',
        PASSWORD_REQUIRED: 'Password tidak boleh kosong',
        PASSWORD_TOO_SHORT: 'Password minimal 6 karakter',
        OTP_REQUIRED: 'Kode OTP tidak boleh kosong',
        OTP_INVALID_LENGTH: 'Kode OTP harus 6 digit',
        OTP_INVALID_FORMAT: 'Kode OTP hanya boleh berisi angka',
        OTP_EXPIRED: 'Kode OTP telah kedaluwarsa. Silakan klik "Kirim ulang" untuk mendapatkan kode baru.',
        LOGIN_ERROR: 'Terjadi kesalahan saat login. Silakan coba lagi.',
        OTP_ERROR: 'Terjadi kesalahan saat verifikasi OTP. Silakan coba lagi.',
        RESEND_ERROR: 'Terjadi kesalahan saat mengirim ulang OTP. Silakan coba lagi.',
        LOGOUT_CONFIRM: 'Apakah Anda yakin ingin keluar?'
    }
};

// Export constants for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APP_CONSTANTS;
}
