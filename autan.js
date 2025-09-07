// ===== LOGIN & OTP SYSTEM FOR GITHUB =====
// Complete JavaScript for Login, OTP Verification, and User Management

// === GLOBAL VARIABLES ===
const API_URL = "https://test.bulshitman1.workers.dev";
let resendTimer = null;
let otpCountdown = null;
let resendAttempts = 0; // Track number of resend attempts

// === NOTIFICATION SYSTEM ===
function showNotification(message, type = 'info', duration = 5000) {
    const container = document.getElementById('notificationContainer');
    if (!container) return;
    
    const notification = document.createElement('div');
    const notificationId = 'notification-' + Date.now();
    notification.id = notificationId;
    
    let bgColor, textColor, icon;
    switch (type) {
        case 'success':
            bgColor = 'bg-green-500';
            textColor = 'text-white';
            icon = 'fas fa-check-circle';
            break;
        case 'error':
            bgColor = 'bg-red-500';
            textColor = 'text-white';
            icon = 'fas fa-exclamation-circle';
            break;
        case 'warning':
            bgColor = 'bg-yellow-500';
            textColor = 'text-white';
            icon = 'fas fa-exclamation-triangle';
            break;
        default:
            bgColor = 'bg-blue-500';
            textColor = 'text-white';
            icon = 'fas fa-info-circle';
    }
    
    notification.className = `${bgColor} ${textColor} px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3 transform translate-x-full transition-transform duration-300 max-w-sm`;
    notification.innerHTML = `
        <i class="${icon}"></i>
        <span class="flex-1 text-sm font-medium">${message}</span>
        <button onclick="removeNotification('${notificationId}')" class="text-white hover:text-gray-200 transition-colors duration-200">
            <i class="fas fa-times text-sm"></i>
        </button>
    `;
    
    container.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Auto remove
    setTimeout(() => {
        removeNotification(notificationId);
    }, duration);
}

function removeNotification(notificationId) {
    const notification = document.getElementById(notificationId);
    if (notification) {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
}

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', function() {
    initializeDarkMode();
    addInputFeedback();
    
    // Check if user is already logged in
    if (localStorage.getItem('isLoggedIn') === 'true') {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        showDashboard();
        updateUserInfo(userData);
    } else {
        showSection('login-form');
    }
});

// === DARK MODE FUNCTIONALITY ===
function initializeDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const dashboardDarkModeToggle = document.getElementById('dashboardDarkModeToggle');
    const html = document.documentElement;
    
    // Check for saved theme preference or default to light mode
    const currentTheme = localStorage.getItem('theme') || 'light';
    if (currentTheme === 'dark') {
        html.classList.add('dark');
    }

    // Update icons based on current theme
    function updateThemeIcons() {
        const moonIcon = document.getElementById('moonIcon');
        const sunIcon = document.getElementById('sunIcon');
        const dashboardMoonIcon = document.getElementById('dashboardMoonIcon');
        const dashboardSunIcon = document.getElementById('dashboardSunIcon');
        
        if (html.classList.contains('dark')) {
            if (moonIcon) moonIcon.style.display = 'none';
            if (sunIcon) sunIcon.style.display = 'inline';
            if (dashboardMoonIcon) dashboardMoonIcon.style.display = 'none';
            if (dashboardSunIcon) dashboardSunIcon.style.display = 'inline';
        } else {
            if (moonIcon) moonIcon.style.display = 'inline';
            if (sunIcon) sunIcon.style.display = 'none';
            if (dashboardMoonIcon) dashboardMoonIcon.style.display = 'inline';
            if (dashboardSunIcon) dashboardSunIcon.style.display = 'none';
        }
    }
    
    // Set initial icon state
    updateThemeIcons();

    // Dark mode toggle handlers
    function toggleDarkMode() {
        html.classList.toggle('dark');
        const theme = html.classList.contains('dark') ? 'dark' : 'light';
        localStorage.setItem('theme', theme);
        updateThemeIcons();
    }

    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
    }
    if (dashboardDarkModeToggle) {
        dashboardDarkModeToggle.addEventListener('click', toggleDarkMode);
    }
}

// === SECTION MANAGEMENT ===
function showSection(sectionId) {
    // Hide all sections
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('dashboardContainer').style.display = 'none';
    
    if (sectionId === 'login-form') {
        document.getElementById('loginContainer').style.display = 'flex';
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('otpForm').style.display = 'none';
    } else if (sectionId === 'otp-form') {
        document.getElementById('loginContainer').style.display = 'flex';
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('otpForm').style.display = 'block';
        
        // Start OTP countdown
        startOTPCountdown(60);
    } else if (sectionId === 'dashboard') {
        document.getElementById('dashboardContainer').style.display = 'block';
    }
}

function showDashboard() {
    showSection('dashboard');
    localStorage.setItem('isLoggedIn', 'true');
    
    // Update user info in dashboard
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    updateUserInfo(userData);
}

// === EMAIL MASKING FUNCTION ===
function maskEmail(email) {
    if (!email || !email.includes('@')) {
        return email;
    }
    
    const [localPart, domain] = email.split('@');
    
    if (localPart.length <= 2) {
        // For very short local parts, show first character + asterisks
        return localPart[0] + '*'.repeat(Math.max(1, localPart.length - 1)) + '@' + domain;
    } else if (localPart.length <= 4) {
        // For short local parts, show first 2 characters
        return localPart.substring(0, 2) + '*'.repeat(localPart.length - 2) + '@' + domain;
    } else {
        // For longer local parts, show first 3 characters and last 1
        const maskedLength = localPart.length - 4;
        return localPart.substring(0, 3) + '*'.repeat(Math.max(1, maskedLength)) + localPart.slice(-1) + '@' + domain;
    }
}

// === USER INFO UPDATE ===
function updateUserInfo(userData) {
    const userName = userData.Username || userData.Nama || userData.name || 'John Doe';
    const userRole = userData.Role || userData.Jabatan || userData.role || 'Administrator';
    const userEmail = userData.Email || userData.email || userData.Email_Pengguna || userData.EmailPengguna || 'user@example.com';
    const profileAvatar = userData.ProfilAvatar || null;
    
    // Update all user name elements
    const userNameElements = [
        'userNameSidebar', 'userNameMobile', 'userNameWelcome'
    ];
    userNameElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.textContent = userName;
    });
    
    // Update role elements
    const userRoleElements = ['userRoleSidebar', 'userRoleMobile'];
    userRoleElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.textContent = userRole;
    });
    
    // Update profile images
    const profileImageElements = ['sidebarProfileImage', 'mobileProfileImage'];
    profileImageElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            if (profileAvatar && profileAvatar.trim() !== '') {
                // Use custom avatar URL format
                const avatarUrl = `https://test.bulshitman1.workers.dev/avatar?url=${encodeURIComponent(profileAvatar)}`;
                element.innerHTML = `<img id="avatar" src="${avatarUrl}" alt="Profile" class="w-full h-full object-cover rounded-full" onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\\"fas fa-user text-white text-sm\\"></i>';">`;
                element.classList.remove('bg-gradient-to-r', 'from-blue-500', 'to-purple-600');
                element.classList.add('bg-gray-200', 'dark:bg-gray-600');
            } else {
                // Fallback to icon
                element.innerHTML = '<i class="fas fa-user text-white text-sm"></i>';
                element.classList.add('bg-gradient-to-r', 'from-blue-500', 'to-purple-600');
                element.classList.remove('bg-gray-200', 'dark:bg-gray-600');
            }
        }
    });
    
    // Update email in OTP form with masking - prioritize stored email from login
    const userEmailElement = document.getElementById('userEmail');
    if (userEmailElement) {
        const storedEmail = localStorage.getItem('userEmail');
        const tempUserData = localStorage.getItem('tempUser');
        
        let displayEmail = storedEmail;
        
        // If no stored email, try to get from temp user data
        if (!displayEmail && tempUserData) {
            try {
                const tempUser = JSON.parse(tempUserData);
                displayEmail = tempUser.Email || tempUser.email || tempUser.Email_Pengguna || tempUser.EmailPengguna || tempUser.user_email;
            } catch (e) {
                console.log('Error parsing temp user data:', e);
            }
        }
        
        // Final fallback
        if (!displayEmail) {
            displayEmail = userEmail;
        }
        
        // Apply email masking for privacy
        const maskedEmail = maskEmail(displayEmail);
        userEmailElement.textContent = maskedEmail;
    }
}

// === LOADING FUNCTIONS ===
function setButtonLoading(buttonId, iconId, textId, loadingText) {
    const button = document.getElementById(buttonId);
    const icon = document.getElementById(iconId);
    const text = document.getElementById(textId);
    
    if (button && icon && text) {
        button.disabled = true;
        button.classList.add('button-loading');
        icon.className = 'fas fa-spinner loading-spinner mr-2';
        text.textContent = loadingText;
    }
}

function resetButtonLoading(buttonId, iconId, textId, originalIcon, originalText) {
    const button = document.getElementById(buttonId);
    const icon = document.getElementById(iconId);
    const text = document.getElementById(textId);
    
    if (button && icon && text) {
        button.disabled = false;
        button.classList.remove('button-loading');
        icon.className = originalIcon;
        text.textContent = originalText;
    }
}

// === LOGIN FUNCTION ===
async function login() {
    const nik = document.getElementById("nik").value;
    const password = document.getElementById("password").value;
    
    // Basic validation
    if (!nik || nik.length !== 16) {
        showNotification('NIK harus 16 digit', 'error');
        return;
    }
    
    if (!password) {
        showNotification('Password tidak boleh kosong', 'error');
        return;
    }

    // Set loading state
    setButtonLoading('loginButton', 'loginIcon', 'loginText', 'Memproses...');

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ action: "login", nik, password })
        });

        const data = await res.json();
        
        if (data.success && data.step === "otp") {
            localStorage.setItem("nik", nik);
            
            // Reset resend attempts on new login
            resendAttempts = 0;
            
            // Store and display user email from login response
            let userEmail = null;
            if (data.user) {
                // Try different possible email field names
                userEmail = data.user.Email || data.user.email || data.user.Email_Pengguna || data.user.EmailPengguna || data.user.user_email;
                
                if (userEmail) {
                    localStorage.setItem("userEmail", userEmail);
                }
                
                // Store complete user data for later use
                localStorage.setItem("tempUser", JSON.stringify(data.user));
            }
            
            // Update email display in OTP form immediately with masking
            const userEmailElement = document.getElementById('userEmail');
            if (userEmailElement) {
                if (userEmail) {
                    const maskedEmail = maskEmail(userEmail);
                    userEmailElement.textContent = maskedEmail;
                } else {
                    userEmailElement.textContent = 'Email terdaftar untuk NIK ini';
                }
            }
            
            // Reset button before changing section
            resetButtonLoading('loginButton', 'loginIcon', 'loginText', 'fas fa-sign-in-alt mr-2 text-blue-200 group-hover:text-blue-100', 'Masuk');
            
            showSection("otp-form");
            
            // Auto-disable resend button with cooldown (initial 60 seconds)
            startResendCooldown(60);
            
            // Show success message with masked email if available
            const successMessage = userEmail ? 
                `Kode OTP telah dikirim ke ${maskEmail(userEmail)}` : 
                'Kode OTP telah dikirim ke email yang terdaftar';
            showNotification(successMessage, 'success');
        } else {
            resetButtonLoading('loginButton', 'loginIcon', 'loginText', 'fas fa-sign-in-alt mr-2 text-blue-200 group-hover:text-blue-100', 'Masuk');
            showNotification(data.message || 'Login gagal', 'error');
        }
    } catch (error) {
        resetButtonLoading('loginButton', 'loginIcon', 'loginText', 'fas fa-sign-in-alt mr-2 text-blue-200 group-hover:text-blue-100', 'Masuk');
        showNotification('Terjadi kesalahan saat login. Silakan coba lagi.', 'error');
    }
}

async function handleLogin(event) {
    event.preventDefault();
    await login();
}

// === OTP VERIFICATION ===
async function verifyOtp() {
    const nik = localStorage.getItem("nik");
    const otpInputs = document.querySelectorAll('.otp-input');
    const otp = Array.from(otpInputs).map(input => input.value).join('');
    
    if (otp.length !== 6) {
        showNotification('Masukkan kode OTP 6 digit', 'error');
        return;
    }

    // Set loading state
    setButtonLoading('otpButton', 'otpIcon', 'otpText', 'Memverifikasi...');

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ action: "verify-otp", nik, otp })
        });

        const data = await res.json();
        
        if (data.success) {
            localStorage.setItem("user", JSON.stringify(data.user));
            
            // Reset button before changing section
            resetButtonLoading('otpButton', 'otpIcon', 'otpText', 'fas fa-shield-alt mr-2', 'Verifikasi OTP');
            
            showDashboard();
            showNotification(data.message || 'Login berhasil!', 'success');
        } else {
            resetButtonLoading('otpButton', 'otpIcon', 'otpText', 'fas fa-shield-alt mr-2', 'Verifikasi OTP');
            showNotification(data.message || 'Kode OTP tidak valid', 'error');
            
            // Clear OTP inputs on error
            otpInputs.forEach(input => input.value = '');
            otpInputs[0].focus();
        }
    } catch (error) {
        resetButtonLoading('otpButton', 'otpIcon', 'otpText', 'fas fa-shield-alt mr-2', 'Verifikasi OTP');
        showNotification('Terjadi kesalahan saat verifikasi OTP. Silakan coba lagi.', 'error');
    }
}

async function handleOTPVerification(event) {
    event.preventDefault();
    await verifyOtp();
}

// === RESEND OTP WITH PROGRESSIVE COOLDOWN ===
async function resendOtp() {
    const nik = localStorage.getItem("nik");
    const btn = document.getElementById("resendBtn");
    
    if (!nik) {
        showNotification('Session expired. Please login again.', 'error');
        backToLogin();
        return;
    }

    // Set loading state for resend button
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner loading-spinner mr-1"></i> Mengirim...';
    }

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ action: "resend-otp", nik })
        });

        const data = await res.json();
        showNotification(data.message || 'Kode OTP baru telah dikirim', 'success');

        // Increment resend attempts
        resendAttempts++;
        
        // Reset OTP expiry countdown to 1 minute (60 seconds)
        startOTPCountdown(60);
        
        // Calculate progressive cooldown: 1 min, 10 min, 20 min, 30 min, etc.
        let cooldownSeconds;
        if (resendAttempts === 1) {
            cooldownSeconds = 60; // 1 minute for first resend
        } else {
            cooldownSeconds = resendAttempts * 600; // 10 minutes * attempt number
        }
        
        startResendCooldown(cooldownSeconds);
        
        // Show cooldown info to user
        const cooldownMinutes = Math.floor(cooldownSeconds / 60);
        if (cooldownMinutes > 1) {
            showNotification(`Kode OTP baru telah dikirim. Tunggu ${cooldownMinutes} menit untuk kirim ulang berikutnya.`, 'info');
        }
        
    } catch (error) {
        showNotification('Terjadi kesalahan saat mengirim ulang OTP. Silakan coba lagi.', 'error');
        
        // Reset button on error
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = 'Kirim ulang';
        }
    }
}

// Alias for backward compatibility
async function resendOTP() {
    await resendOtp();
}

// === COOLDOWN TIMER WITH PROGRESSIVE TIMING ===
function startResendCooldown(seconds) {
    const btn = document.getElementById("resendBtn");
    if (!btn) return;
    
    clearInterval(resendTimer);

    let remaining = seconds;
    btn.disabled = true;
    
    // Format initial display
    updateCooldownDisplay(btn, remaining);

    resendTimer = setInterval(() => {
        remaining--;
        if (remaining > 0) {
            updateCooldownDisplay(btn, remaining);
        } else {
            clearInterval(resendTimer);
            btn.disabled = false;
            btn.innerHTML = 'Kirim ulang';
        }
    }, 1000);
}

function updateCooldownDisplay(btn, seconds) {
    if (seconds >= 60) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            btn.innerHTML = `Tunggu ${hours}j ${remainingMinutes}m ${remainingSeconds}d...`;
        } else {
            btn.innerHTML = `Tunggu ${minutes}m ${remainingSeconds}d...`;
        }
    } else {
        btn.innerHTML = `Tunggu ${seconds} detik...`;
    }
}

// === OTP COUNTDOWN ===
function startOTPCountdown(seconds) {
    const countdownElement = document.getElementById('countdown');
    if (!countdownElement) return;
    
    clearInterval(otpCountdown);
    
    let remaining = seconds;
    
    otpCountdown = setInterval(() => {
        const minutes = Math.floor(remaining / 60);
        const secs = remaining % 60;
        countdownElement.textContent = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        if (remaining <= 0) {
            clearInterval(otpCountdown);
            countdownElement.textContent = '00:00';
            alert('Kode OTP telah kedaluwarsa. Silakan minta kode baru.');
        }
        remaining--;
    }, 1000);
}

// === UTILITY FUNCTIONS ===
function backToLogin() {
    showSection('login-form');
    localStorage.removeItem('nik');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('tempUser');
    clearInterval(resendTimer);
    clearInterval(otpCountdown);
    
    // Reset resend attempts
    resendAttempts = 0;
    
    // Clear form data
    document.getElementById('nik').value = '';
    document.getElementById('password').value = '';
    document.querySelectorAll('.otp-input').forEach(input => input.value = '');
    
    // Reset email display
    const userEmailElement = document.getElementById('userEmail');
    if (userEmailElement) {
        userEmailElement.textContent = 'Loading...';
    }
}

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

function moveToNext(current, index) {
    if (current.value.length === 1 && index < 5) {
        const nextInput = document.querySelectorAll('.otp-input')[index + 1];
        if (nextInput) nextInput.focus();
    }
    
    // Auto-submit when all 6 digits are entered
    const otpInputs = document.querySelectorAll('.otp-input');
    const otp = Array.from(otpInputs).map(input => input.value).join('');
    if (otp.length === 6) {
        // Small delay to ensure last digit is processed
        setTimeout(() => {
            const otpForm = document.querySelector('#otpForm form');
            if (otpForm) {
                otpForm.dispatchEvent(new Event('submit'));
            }
        }, 100);
    }
}

function logout() {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('user');
        localStorage.removeItem('nik');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('tempUser');
        clearInterval(resendTimer);
        clearInterval(otpCountdown);
        
        // Reset resend attempts
        resendAttempts = 0;
        
        showSection('login-form');
        
        // Clear all form data
        document.getElementById('nik').value = '';
        document.getElementById('password').value = '';
        document.querySelectorAll('.otp-input').forEach(input => input.value = '');
        
        // Reset email display
        const userEmailElement = document.getElementById('userEmail');
        if (userEmailElement) {
            userEmailElement.textContent = 'Loading...';
        }
    }
}

// === KEYBOARD NAVIGATION FOR OTP ===
document.addEventListener('DOMContentLoaded', function() {
    const otpInputs = document.querySelectorAll('.otp-input');
    
    otpInputs.forEach((input, index) => {
        input.addEventListener('keydown', function(e) {
            // Handle backspace
            if (e.key === 'Backspace' && !input.value && index > 0) {
                otpInputs[index - 1].focus();
            }
            
            // Handle arrow keys
            if (e.key === 'ArrowLeft' && index > 0) {
                otpInputs[index - 1].focus();
            }
            if (e.key === 'ArrowRight' && index < 5) {
                otpInputs[index + 1].focus();
            }
        });
        
        // Only allow numbers
        input.addEventListener('input', function(e) {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    });
});

// === INPUT VALIDATION ===
function validateNIK(input) {
    // Only allow numbers
    input.value = input.value.replace(/[^0-9]/g, '');
    
    // Remove error styling if exists
    input.classList.remove('border-red-500', 'focus:ring-red-500');
    input.classList.add('border-gray-300', 'dark:border-gray-600', 'focus:ring-blue-500');
}

function validateNIKOnBlur(input) {
    if (input.value.length > 0 && input.value.length !== 16) {
        input.classList.remove('border-gray-300', 'dark:border-gray-600', 'focus:ring-blue-500');
        input.classList.add('border-red-500', 'focus:ring-red-500');
        
        // Add shake animation
        input.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            input.style.animation = '';
        }, 500);
    }
}

function addInputFeedback() {
    const nikInput = document.getElementById('nik');
    const passwordInput = document.getElementById('password');
    
    // Add real-time feedback
    if (nikInput) {
        nikInput.addEventListener('input', function() {
            const length = this.value.length;
            const icon = this.parentElement.querySelector('i');
            
            if (length === 16) {
                icon.className = 'fas fa-check text-green-500';
            } else if (length > 0) {
                icon.className = 'fas fa-id-card text-blue-500';
            } else {
                icon.className = 'fas fa-id-card text-gray-400';
            }
        });
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            const icon = this.parentElement.querySelector('.fa-lock');
            
            if (this.value.length >= 6) {
                icon.className = 'fas fa-lock text-green-500';
            } else if (this.value.length > 0) {
                icon.className = 'fas fa-lock text-blue-500';
            } else {
                icon.className = 'fas fa-lock text-gray-400';
            }
        });
    }
}
