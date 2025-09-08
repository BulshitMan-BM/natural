class AuthSystem {
    constructor() {
        this.currentPage = 'login';
        this.darkMode = localStorage.getItem('darkMode') === 'true';
        this.otpCountdown = 300; // 5 minutes
        this.countdownInterval = null;
        this.resendTimer = null;
        this.currentUser = null;
        this.generatedOTP = null;
        this.API_URL = "https://test.bulshitman1.workers.dev"; // Your Worker URL
        
        this.init();
    }

    // Initialize the authentication system
    init() {
        this.initDarkMode();
        this.setupEventListeners();
        this.setupOTPInputs();
        this.checkExistingSession();
    }

    // Initialize dark mode
    initDarkMode() {
        const darkModeIcon = document.getElementById('dark-mode-icon');
        const darkModeIconLogin = document.getElementById('dark-mode-icon-login');
        const darkModeText = document.getElementById('dark-mode-text');
        
        if (this.darkMode) {
            document.documentElement.classList.add('dark');
            if (darkModeIcon) darkModeIcon.className = 'fas fa-sun';
            if (darkModeIconLogin) darkModeIconLogin.className = 'fas fa-sun';
            if (darkModeText) darkModeText.textContent = 'Mode Terang';
        } else {
            document.documentElement.classList.remove('dark');
            if (darkModeIcon) darkModeIcon.className = 'fas fa-moon';
            if (darkModeIconLogin) darkModeIconLogin.className = 'fas fa-moon';
            if (darkModeText) darkModeText.textContent = 'Mode Gelap';
        }
    }

    // Toggle dark mode
    toggleDarkMode() {
        this.darkMode = !this.darkMode;
        localStorage.setItem('darkMode', this.darkMode);
        this.initDarkMode();
    }

    // Show specific page
    showPage(pageName) {
        const pages = ['login-page', 'otp-page', 'dashboard-page'];
        pages.forEach(page => {
            const element = document.getElementById(page);
            if (element) {
                element.classList.add('hidden');
            }
        });
        
        const targetPage = document.getElementById(pageName);
        if (targetPage) {
            targetPage.classList.remove('hidden');
            this.currentPage = pageName.replace('-page', '');
        }
    }

    // Validate NIK (16 digits)
    validateNIK(nik) {
        return /^\d{16}$/.test(nik);
    }

    // Mask email for display
    maskEmail(email) {
        const [username, domain] = email.split('@');
        const maskedUsername = username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1);
        return maskedUsername + '@' + domain;
    }

    // Show form notification
    showFormNotification(formId, message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.form-notification');
        existingNotifications.forEach(notif => notif.remove());
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `form-notification p-4 rounded-lg mb-4 border transition-all duration-300`;
        
        if (type === 'success') {
            notification.classList.add('bg-green-50', 'border-green-200', 'text-green-800', 'dark:bg-green-900/20', 'dark:border-green-800', 'dark:text-green-200');
        } else if (type === 'error') {
            notification.classList.add('bg-red-50', 'border-red-200', 'text-red-800', 'dark:bg-red-900/20', 'dark:border-red-800', 'dark:text-red-200');
        } else {
            notification.classList.add('bg-blue-50', 'border-blue-200', 'text-blue-800', 'dark:bg-blue-900/20', 'dark:border-blue-800', 'dark:text-blue-200');
        }
        
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span class="text-sm font-medium">${message}</span>
            </div>
        `;
        
        // Find the form and insert notification at the top
        const form = document.getElementById(formId);
        if (form) {
            form.insertBefore(notification, form.firstChild);
            
            // Auto-remove after 5 seconds for success messages
            if (type === 'success') {
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.style.opacity = '0';
                        setTimeout(() => {
                            notification.remove();
                        }, 300);
                    }
                }, 5000);
            }
        }
    }

    // Handle login form submission
    async handleLogin(event) {
        event.preventDefault();
        
        const nik = document.getElementById('nik').value.trim();
        const password = document.getElementById('password').value;
        const nikError = document.getElementById('nik-error');
        const loginBtn = document.getElementById('login-btn');
        const loginBtnText = document.getElementById('login-btn-text');
        const loginSpinner = document.getElementById('login-spinner');
        
        // Reset errors
        nikError.classList.add('hidden');
        
        // Validate NIK
        if (!this.validateNIK(nik)) {
            nikError.classList.remove('hidden');
            return;
        }
        
        // Show loading
        loginBtn.disabled = true;
        loginBtn.classList.add('btn-loading');
        loginBtnText.textContent = 'Memverifikasi...';
        loginSpinner.classList.remove('hidden');
        
        try {
            const response = await fetch(this.API_URL, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ action: "login", nik, password })
            });

            const data = await response.json();
            
            if (data.success && data.step === "otp") {
                localStorage.setItem("nik", nik);
                
                // Set masked email if provided
                if (data.email) {
                    document.getElementById('masked-email').textContent = this.maskEmail(data.email);
                }
                
                this.showPage('otp-page');
                this.startOTPCountdown();
                
                // Auto-disable resend button with cooldown
                this.startResendCooldown(60);
                
                // Focus first OTP input
                document.querySelector('.otp-input').focus();
                
                // Show success message in OTP form
                setTimeout(() => {
                    this.showFormNotification('otp-form', data.message || 'OTP telah dikirim ke email Anda', 'success');
                }, 100);
            } else {
                this.showFormNotification('login-form', data.message || 'Login gagal', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showFormNotification('login-form', 'Terjadi kesalahan koneksi. Silakan coba lagi.', 'error');
        } finally {
            loginBtn.disabled = false;
            loginBtn.classList.remove('btn-loading');
            loginBtnText.textContent = 'Masuk';
            loginSpinner.classList.add('hidden');
        }
    }

    // Setup OTP inputs behavior
    setupOTPInputs() {
        const otpInputs = document.querySelectorAll('.otp-input');
        const verifyBtn = document.getElementById('verify-btn');
        
        otpInputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                const value = e.target.value;
                
                // Only allow numbers
                if (!/^\d*$/.test(value)) {
                    e.target.value = '';
                    return;
                }
                
                // Add visual feedback
                if (value) {
                    e.target.classList.add('filled');
                } else {
                    e.target.classList.remove('filled');
                }
                
                // Move to next input
                if (value && index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }
                
                // Check if all inputs are filled
                const allFilled = Array.from(otpInputs).every(input => input.value);
                if (verifyBtn) verifyBtn.disabled = !allFilled;
            });
            
            input.addEventListener('keydown', (e) => {
                // Move to previous input on backspace
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    otpInputs[index - 1].focus();
                }
            });
            
            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const pastedData = e.clipboardData.getData('text');
                
                if (/^\d{6}$/.test(pastedData)) {
                    pastedData.split('').forEach((digit, i) => {
                        if (otpInputs[i]) {
                            otpInputs[i].value = digit;
                            otpInputs[i].classList.add('filled');
                        }
                    });
                    if (verifyBtn) verifyBtn.disabled = false;
                }
            });
        });
    }

    // Start OTP countdown timer
    startOTPCountdown() {
        this.otpCountdown = 300; // 5 minutes
        const countdownElement = document.getElementById('countdown');
        const resendButton = document.getElementById('resend-otp');
        
        if (resendButton) resendButton.disabled = true;
        
        this.countdownInterval = setInterval(() => {
            const minutes = Math.floor(this.otpCountdown / 60);
            const seconds = this.otpCountdown % 60;
            if (countdownElement) {
                countdownElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
            
            if (this.otpCountdown <= 0) {
                clearInterval(this.countdownInterval);
                if (countdownElement) countdownElement.textContent = '00:00';
                if (resendButton) resendButton.disabled = false;
                this.showFormNotification('otp-form', 'Kode OTP telah kedaluwarsa. Silakan kirim ulang.', 'error');
            }
            
            this.otpCountdown--;
        }, 1000);
    }

    // Handle OTP verification
    async handleOTPVerification(event) {
        event.preventDefault();
        
        const otpInputs = document.querySelectorAll('.otp-input');
        const enteredOTP = Array.from(otpInputs).map(input => input.value).join('');
        const nik = localStorage.getItem("nik");
        const otpError = document.getElementById('otp-error');
        const verifyBtn = document.getElementById('verify-btn');
        const verifyBtnText = document.getElementById('verify-btn-text');
        const verifySpinner = document.getElementById('verify-spinner');
        
        // Reset errors
        if (otpError) otpError.classList.add('hidden');
        
        // Show loading
        if (verifyBtn) {
            verifyBtn.disabled = true;
            verifyBtn.classList.add('btn-loading');
        }
        if (verifyBtnText) verifyBtnText.textContent = 'Memverifikasi...';
        if (verifySpinner) verifySpinner.classList.remove('hidden');
        
        try {
            const response = await fetch(this.API_URL, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ action: "verify-otp", nik, otp: enteredOTP })
            });

            const data = await response.json();
            
            if (data.success) {
                // OTP verification successful
                clearInterval(this.countdownInterval);
                clearInterval(this.resendTimer);
                
                // Store user data
                localStorage.setItem("user", JSON.stringify(data.user));
                this.currentUser = data.user;
                
                // Show success message before redirecting
                this.showFormNotification('otp-form', data.message || 'Verifikasi berhasil! Selamat datang.', 'success');
                
                // Delay redirect to show success message
                setTimeout(() => {
                    // Show dashboard
                    this.showPage('dashboard-page');
                    
                    // Initialize dashboard if function exists
                    if (typeof window.initDashboard === 'function') {
                        window.initDashboard();
                    }
                    
                    // Update user info in dashboard after a short delay
                    setTimeout(() => {
                        this.updateDashboardUserInfo();
                    }, 100);
                }, 1500);
            } else {
                // OTP verification failed
                if (otpError) otpError.classList.remove('hidden');
                this.showFormNotification('otp-form', data.message || 'Kode OTP tidak valid', 'error');
                
                // Clear OTP inputs with error animation
                otpInputs.forEach(input => {
                    input.value = '';
                    input.classList.remove('filled');
                    input.classList.add('error', 'border-red-500');
                    setTimeout(() => {
                        input.classList.remove('error', 'border-red-500');
                    }, 2000);
                });
                
                // Focus first input
                if (otpInputs[0]) otpInputs[0].focus();
            }
        } catch (error) {
            console.error('OTP verification error:', error);
            this.showFormNotification('otp-form', 'Terjadi kesalahan koneksi. Silakan coba lagi.', 'error');
            if (otpError) otpError.classList.remove('hidden');
        } finally {
            if (verifyBtn) {
                verifyBtn.disabled = true;
                verifyBtn.classList.remove('btn-loading');
            }
            if (verifyBtnText) verifyBtnText.textContent = 'Verifikasi';
            if (verifySpinner) verifySpinner.classList.add('hidden');
        }
    }

    // Start resend cooldown timer
    startResendCooldown(seconds) {
        const btn = document.getElementById("resend-otp");
        if (!btn) return;
        
        clearInterval(this.resendTimer);
        btn.classList.remove('btn-loading');

        let remaining = seconds;
        btn.disabled = true;
        btn.innerHTML = `
            <i class="fas fa-clock mr-2 pulse-animation"></i>
            <span>Tunggu ${remaining} detik...</span>
        `;

        this.resendTimer = setInterval(() => {
            remaining--;
            if (remaining > 0) {
                btn.innerHTML = `
                    <i class="fas fa-clock mr-2 pulse-animation"></i>
                    <span>Tunggu ${remaining} detik...</span>
                `;
            } else {
                clearInterval(this.resendTimer);
                btn.disabled = false;
                btn.innerHTML = `
                    <i class="fas fa-redo mr-2 transition-transform duration-200"></i>
                    <span>Kirim ulang OTP</span>
                `;
            }
        }, 1000);
    }

    // Resend OTP
    async resendOTP() {
        const nik = localStorage.getItem("nik");
        const btn = document.getElementById("resend-otp");

        if (!nik) {
            this.showFormNotification('otp-form', 'Sesi telah berakhir. Silakan login kembali.', 'error');
            setTimeout(() => {
                this.showPage('login-page');
            }, 2000);
            return;
        }

        if (!btn) return;

        try {
            btn.disabled = true;
            btn.classList.add('btn-loading');
            btn.innerHTML = `
                <div class="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent mr-2"></div>
                <span>Mengirim...</span>
            `;

            const response = await fetch(this.API_URL, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ action: "resend-otp", nik })
            });

            const data = await response.json();
            this.showFormNotification('otp-form', data.message, data.success ? 'success' : 'error');

            // Extract cooldown time from message
            const match = data.message.match(/Tunggu (\d+) detik/);
            if (match) {
                this.startResendCooldown(parseInt(match[1]));
            } else if (data.success) {
                // If successful but no cooldown specified, use default
                this.startResendCooldown(60);
                
                // Clear OTP inputs and restart countdown
                document.querySelectorAll('.otp-input').forEach(input => {
                    input.value = '';
                    input.classList.remove('filled');
                });
                const verifyBtn = document.getElementById('verify-btn');
                if (verifyBtn) verifyBtn.disabled = true;
                
                const firstInput = document.querySelector('.otp-input');
                if (firstInput) firstInput.focus();
                
                this.startOTPCountdown();
            }
        } catch (error) {
            console.error('Resend OTP error:', error);
            this.showFormNotification('otp-form', 'Terjadi kesalahan koneksi. Silakan coba lagi.', 'error');
            btn.disabled = false;
            btn.classList.remove('btn-loading');
            btn.innerHTML = `
                <i class="fas fa-redo mr-2 transition-transform duration-200"></i>
                <span>Kirim ulang OTP</span>
            `;
        }
    }

    // Update dashboard user info
    updateDashboardUserInfo() {
        if (this.currentUser) {
            // Extract username and role from different possible field names
            const username = this.currentUser.Username || this.currentUser.username || this.currentUser.name || this.currentUser.Nama || 'User';
            const role = this.currentUser.Role || this.currentUser.role || this.currentUser.jabatan || this.currentUser.Jabatan || 'User';
            
            // Update username displays
            const usernameElements = [
                'welcome-user-name',
                'sidebar-user-name',
                'mobile-user-name'
            ];
            
            usernameElements.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = username;
                }
            });
            
            // Update role displays
            const roleElements = [
                'sidebar-user-role',
                'mobile-user-role'
            ];
            
            roleElements.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = role;
                }
            });
            
            // Update avatar displays
            const avatarElements = [
                'sidebar-user-avatar',
                'mobile-user-avatar',
                'header-user-avatar'
            ];
            
            avatarElements.forEach(id => {
                const element = document.getElementById(id);
                if (element && (this.currentUser.ProfilAvatar || this.currentUser.avatar)) {
                    const avatarUrl = this.currentUser.ProfilAvatar || this.currentUser.avatar;
                    // Create image element for avatar using the specified format
                    element.innerHTML = `<img id="avatar" src="${this.API_URL}/avatar?url=${encodeURIComponent(avatarUrl)}" alt="Profile" class="w-full h-full rounded-full object-cover" onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\\"fas fa-user text-gray-600 dark:text-gray-300 text-sm\\"></i>';">`;
                }
            });
        }
    }

    // Handle logout
    handleLogout() {
        this.currentUser = null;
        this.generatedOTP = null;
        
        // Clear localStorage
        localStorage.removeItem("user");
        localStorage.removeItem("nik");
        
        // Clear forms
        const loginForm = document.getElementById('login-form');
        if (loginForm) loginForm.reset();
        
        document.querySelectorAll('.otp-input').forEach(input => {
            input.value = '';
            input.classList.remove('filled');
        });
        
        // Clear any intervals
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
        if (this.resendTimer) {
            clearInterval(this.resendTimer);
        }
        
        // Reset resend button
        const resendBtn = document.getElementById("resend-otp");
        if (resendBtn) {
            resendBtn.disabled = true;
            resendBtn.innerHTML = `<i class="fas fa-redo mr-1"></i>Kirim ulang OTP`;
        }
        
        this.showPage('login-page');
        setTimeout(() => {
            this.showFormNotification('login-form', 'Anda telah keluar dari sistem', 'info');
        }, 100);
    }

    // Check for existing session
    checkExistingSession() {
        const storedUser = localStorage.getItem("user");
        const storedNik = localStorage.getItem("nik");
        
        if (storedUser) {
            try {
                this.currentUser = JSON.parse(storedUser);
                
                this.showPage('dashboard-page');
                
                // Initialize dashboard if function exists
                if (typeof window.initDashboard === 'function') {
                    window.initDashboard();
                }
                
                // Update user info after DOM is ready
                setTimeout(() => {
                    this.updateDashboardUserInfo();
                }, 100);
                
                return true;
            } catch (error) {
                console.error('Error parsing stored user:', error);
                localStorage.removeItem("user");
                localStorage.removeItem("nik");
            }
        } else if (storedNik) {
            // User was in OTP verification process
            this.showPage('otp-page');
            this.startOTPCountdown();
            this.startResendCooldown(60);
            const firstInput = document.querySelector('.otp-input');
            if (firstInput) firstInput.focus();
            return true;
        }
        
        return false;
    }

    // Setup event listeners
    setupEventListeners() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.bindEvents());
        } else {
            this.bindEvents();
        }
    }

    // Bind all events
    bindEvents() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        // OTP form
        const otpForm = document.getElementById('otp-form');
        if (otpForm) {
            otpForm.addEventListener('submit', (e) => this.handleOTPVerification(e));
        }
        
        // Password toggle
        const togglePassword = document.getElementById('toggle-password');
        if (togglePassword) {
            togglePassword.addEventListener('click', function() {
                const passwordInput = document.getElementById('password');
                const icon = this.querySelector('i');
                
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    icon.className = 'fas fa-eye-slash';
                } else {
                    passwordInput.type = 'password';
                    icon.className = 'fas fa-eye';
                }
            });
        }
        
        // Dark mode toggles
        const darkModeToggleLogin = document.getElementById('dark-mode-toggle-login');
        if (darkModeToggleLogin) {
            darkModeToggleLogin.addEventListener('click', () => this.toggleDarkMode());
        }
        
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', () => this.toggleDarkMode());
        }
        
        // Back to login
        const backToLogin = document.getElementById('back-to-login');
        if (backToLogin) {
            backToLogin.addEventListener('click', () => {
                if (this.countdownInterval) {
                    clearInterval(this.countdownInterval);
                }
                this.showPage('login-page');
            });
        }
        
        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    }
}

// Global functions for backward compatibility
window.resendOTP = function() {
    if (window.authSystem) {
        window.authSystem.resendOTP();
    }
};

// Initialize authentication system when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        window.authSystem = new AuthSystem();
    });
} else {
    window.authSystem = new AuthSystem();
}

// Export for module usage (optional)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthSystem;
}
