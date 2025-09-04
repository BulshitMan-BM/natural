// auth.js - Authentication functionality
class AuthManager {
    constructor() {
        this.API_URL = "https://test.bulshitman1.workers.dev";
        this.currentUser = null;
        this.resendTimer = null;
        this.resendAttempts = 0;
        this.MAX_RESEND_ATTEMPTS = 5;
        this.otpCountdown = 60;
        this.countdownInterval = null;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkExistingLogin();
    }

    bindEvents() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('togglePassword').addEventListener('click', () => this.togglePasswordVisibility());
        
        // OTP form
        document.getElementById('otpForm').addEventListener('submit', (e) => this.handleOTPSubmit(e));
        document.getElementById('resendOtp').addEventListener('click', () => this.resendOTP());
        document.getElementById('backToLogin').addEventListener('click', () => this.backToLogin());
        
        // Input validation
        document.getElementById('nik').addEventListener('input', (e) => this.formatNIK(e));
        document.getElementById('password').addEventListener('input', () => this.updateLoginButton());
        
        // OTP inputs
        this.initOTPInputs();
    }

    checkExistingLogin() {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                this.showDashboard();
            } catch (error) {
                localStorage.removeItem('user');
                localStorage.removeItem('nik');
            }
        }
    }

    maskEmail(email) {
        if (!email || !email.includes('@')) return '***@***.com';
        
        const [localPart, domain] = email.split('@');
        const [domainName, extension] = domain.split('.');
        
        let maskedLocal;
        if (localPart.length <= 2) {
            maskedLocal = '*'.repeat(localPart.length);
        } else if (localPart.length <= 4) {
            maskedLocal = localPart[0] + '*'.repeat(localPart.length - 2) + localPart[localPart.length - 1];
        } else {
            maskedLocal = localPart.substring(0, 2) + '*'.repeat(localPart.length - 4) + localPart.substring(localPart.length - 2);
        }
        
        let maskedDomain;
        if (domainName.length <= 2) {
            maskedDomain = '*'.repeat(domainName.length);
        } else {
            maskedDomain = domainName[0] + '*'.repeat(domainName.length - 1);
        }
        
        return `${maskedLocal}@${maskedDomain}.${extension}`;
    }

    formatNIK(e) {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 16);
        this.updateLoginButton();
    }

    updateLoginButton() {
        const loginBtn = document.getElementById('loginBtn');
        const loginBtnText = document.getElementById('loginBtnText');
        const nik = document.getElementById('nik').value;
        const password = document.getElementById('password').value;
        
        const allFieldsFilled = nik.length === 16 && password.length > 0 && window.captchaManager.isVerified();
        
        if (allFieldsFilled) {
            loginBtn.disabled = false;
            loginBtn.className = 'w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center';
            loginBtnText.textContent = 'Masuk';
        } else {
            loginBtn.disabled = true;
            loginBtn.className = 'w-full bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center cursor-not-allowed opacity-60';
            loginBtnText.textContent = 'Masuk';
        }
    }

    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const toggleIcon = document.querySelector('#togglePassword i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.className = 'fas fa-eye-slash';
        } else {
            passwordInput.type = 'password';
            toggleIcon.className = 'fas fa-eye';
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const nik = document.getElementById('nik').value;
        const password = document.getElementById('password').value;
        const loginBtn = document.getElementById('loginBtn');
        const loginBtnText = document.getElementById('loginBtnText');
        const loginSpinner = document.getElementById('loginSpinner');
        const loginError = document.getElementById('loginError');

        if (!/^\d{16}$/.test(nik)) {
            this.showError('loginError', 'NIK harus terdiri dari 16 digit angka');
            return;
        }

        if (!window.captchaManager.isVerified()) {
            this.showError('loginError', 'Silakan verifikasi captcha terlebih dahulu');
            return;
        }

        loginBtn.disabled = true;
        loginBtnText.textContent = 'Memverifikasi...';
        loginSpinner.classList.remove('hidden');
        loginError.classList.add('hidden');

        try {
            const res = await fetch(this.API_URL, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ action: "login", nik, password })
            });

            const data = await res.json();
            
            if (data.success && data.step === "otp") {
                localStorage.setItem("nik", nik);
                this.currentUser = { nik, name: data.user?.name || 'User' };
                
                this.resendAttempts = 0;
                this.updateResendCounter();
                
                const userEmail = data.user?.email || data.user?.Email || data.email || data.Email || 'user@example.com';
                document.getElementById('userEmail').textContent = this.maskEmail(userEmail);
                
                this.showOTPPage();
            } else {
                this.showError('loginError', data.message || 'Login gagal');
            }
        } catch (error) {
            this.showError('loginError', 'Terjadi kesalahan koneksi');
        }

        loginBtn.disabled = false;
        loginBtnText.textContent = 'Masuk';
        loginSpinner.classList.add('hidden');
        
        window.captchaManager.generate();
    }

    showError(errorId, message) {
        const errorElement = document.getElementById(errorId);
        const errorText = document.getElementById(errorId + 'Text');
        errorText.textContent = message;
        errorElement.classList.remove('hidden');
    }

    showOTPPage() {
        document.getElementById('loginPage').classList.add('hidden');
        document.getElementById('otpPage').classList.remove('hidden');
        
        this.startOTPCountdown();
        this.startResendCooldown(60);
        
        document.querySelector('.otp-input').focus();
    }

    initOTPInputs() {
        const otpInputs = document.querySelectorAll('.otp-input');
        otpInputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                const value = e.target.value;
                
                if (!/^\d$/.test(value)) {
                    e.target.value = '';
                    return;
                }
                
                if (value && index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }
                
                const allFilled = Array.from(otpInputs).every(input => input.value);
                if (allFilled) {
                    setTimeout(() => this.handleOTPSubmit(), 100);
                }
            });
            
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    otpInputs[index - 1].focus();
                }
            });
        });
    }

    async handleOTPSubmit(e) {
        if (e) e.preventDefault();
        
        const otpInputs = document.querySelectorAll('.otp-input');
        const otpValue = Array.from(otpInputs).map(input => input.value).join('');
        const verifyBtn = document.getElementById('verifyBtn');
        const verifyBtnText = document.getElementById('verifyBtnText');
        const verifySpinner = document.getElementById('verifySpinner');
        const otpError = document.getElementById('otpError');

        if (otpValue.length !== 6) {
            this.showError('otpError', 'Masukkan 6 digit kode OTP');
            return;
        }

        verifyBtn.disabled = true;
        verifyBtnText.textContent = 'Memverifikasi...';
        verifySpinner.classList.remove('hidden');
        otpError.classList.add('hidden');

        try {
            const nik = localStorage.getItem("nik");
            const res = await fetch(this.API_URL, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ action: "verify-otp", nik, otp: otpValue })
            });

            const data = await res.json();
            
            if (data.success) {
                localStorage.setItem("user", JSON.stringify(data.user));
                this.currentUser = data.user;
                this.showDashboard();
            } else {
                this.showError('otpError', data.message || 'Kode OTP tidak valid');
                otpInputs.forEach(input => input.value = '');
                otpInputs[0].focus();
            }
        } catch (error) {
            this.showError('otpError', 'Terjadi kesalahan koneksi');
            otpInputs.forEach(input => input.value = '');
            otpInputs[0].focus();
        }

        verifyBtn.disabled = false;
        verifyBtnText.textContent = 'Verifikasi';
        verifySpinner.classList.add('hidden');
    }

    startOTPCountdown() {
        this.otpCountdown = 60;
        this.updateCountdownDisplay();
        
        this.countdownInterval = setInterval(() => {
            this.otpCountdown--;
            this.updateCountdownDisplay();
            
            if (this.otpCountdown <= 0) {
                clearInterval(this.countdownInterval);
                this.showError('otpError', 'Kode OTP telah kedaluwarsa. Silakan kirim ulang.');
            }
        }, 1000);
    }

    updateCountdownDisplay() {
        const minutes = Math.floor(this.otpCountdown / 60);
        const seconds = this.otpCountdown % 60;
        document.getElementById('countdown').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    updateResendCounter() {
        const remaining = this.MAX_RESEND_ATTEMPTS - this.resendAttempts;
        document.getElementById('remainingAttempts').textContent = remaining;
        
        const resendBtn = document.getElementById('resendOtp');
        if (remaining <= 0) {
            resendBtn.disabled = true;
            resendBtn.innerHTML = '<i class="fas fa-ban mr-2"></i>Batas Kirim Ulang Tercapai';
            resendBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
    }

    async resendOTP() {
        if (this.resendAttempts >= this.MAX_RESEND_ATTEMPTS) {
            this.showError('otpError', 'Batas maksimal kirim ulang OTP telah tercapai');
            return;
        }

        const nik = localStorage.getItem("nik");
        const resendBtn = document.getElementById('resendOtp');
        const originalText = resendBtn.innerHTML;
        
        resendBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Mengirim...';
        resendBtn.disabled = true;
        
        try {
            const res = await fetch(this.API_URL, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ action: "resend-otp", nik })
            });

            const data = await res.json();
            
            if (data.success) {
                this.resendAttempts++;
                this.updateResendCounter();
                
                clearInterval(this.countdownInterval);
                this.startOTPCountdown();
                document.querySelectorAll('.otp-input').forEach(input => input.value = '');
                document.querySelector('.otp-input').focus();
                document.getElementById('otpError').classList.add('hidden');
                
                resendBtn.innerHTML = '<i class="fas fa-check mr-2"></i>OTP Terkirim';
                
                const cooldownTimes = [60, 600, 1800, 3600, 7200];
                const cooldownTime = cooldownTimes[this.resendAttempts - 1] || 7200;
                
                setTimeout(() => {
                    if (this.resendAttempts < this.MAX_RESEND_ATTEMPTS) {
                        this.startResendCooldown(cooldownTime);
                    }
                }, 2000);
            } else {
                const match = data.message.match(/Tunggu (\d+) detik/);
                if (match) {
                    this.startResendCooldown(parseInt(match[1]));
                } else {
                    resendBtn.innerHTML = originalText;
                    resendBtn.disabled = false;
                    this.showError('otpError', data.message);
                }
            }
        } catch (error) {
            resendBtn.innerHTML = originalText;
            resendBtn.disabled = false;
            this.showError('otpError', 'Terjadi kesalahan koneksi');
        }
    }

    startResendCooldown(seconds) {
        const btn = document.getElementById("resendOtp");
        clearInterval(this.resendTimer);

        let remaining = seconds;
        btn.disabled = true;
        
        const formatTime = (seconds) => {
            if (seconds < 60) {
                return `${seconds} detik`;
            } else if (seconds < 3600) {
                const minutes = Math.floor(seconds / 60);
                const secs = seconds % 60;
                return secs > 0 ? `${minutes} menit ${secs} detik` : `${minutes} menit`;
            } else {
                const hours = Math.floor(seconds / 3600);
                const minutes = Math.floor((seconds % 3600) / 60);
                const secs = seconds % 60;
                let timeStr = `${hours} jam`;
                if (minutes > 0) timeStr += ` ${minutes} menit`;
                if (secs > 0) timeStr += ` ${secs} detik`;
                return timeStr;
            }
        };
        
        btn.innerHTML = `<i class="fas fa-clock mr-2"></i>Tunggu ${formatTime(remaining)}`;

        this.resendTimer = setInterval(() => {
            remaining--;
            if (remaining > 0) {
                btn.innerHTML = `<i class="fas fa-clock mr-2"></i>Tunggu ${formatTime(remaining)}`;
            } else {
                clearInterval(this.resendTimer);
                if (this.resendAttempts < this.MAX_RESEND_ATTEMPTS) {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-redo mr-2"></i>Kirim Ulang OTP';
                }
            }
        }, 1000);
    }

    backToLogin() {
        document.getElementById('otpPage').classList.add('hidden');
        document.getElementById('loginPage').classList.remove('hidden');
        clearInterval(this.countdownInterval);
        clearInterval(this.resendTimer);
        
        this.resendAttempts = 0;
        
        document.getElementById('loginForm').reset();
        document.querySelectorAll('.otp-input').forEach(input => input.value = '');
        document.getElementById('loginError').classList.add('hidden');
        document.getElementById('otpError').classList.add('hidden');
        
        const resendBtn = document.getElementById('resendOtp');
        resendBtn.disabled = false;
        resendBtn.innerHTML = '<i class="fas fa-redo mr-2"></i>Kirim Ulang OTP';
        resendBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        
        window.captchaManager.generate();
    }

    showDashboard() {
        document.getElementById('otpPage').classList.add('hidden');
        document.getElementById('dashboardPage').classList.remove('hidden');
        clearInterval(this.countdownInterval);
        
        this.updateUserProfile(this.currentUser);
        document.getElementById('loginTime').textContent = new Date().toLocaleString('id-ID');
        
        if (window.dashboardManager) {
            window.dashboardManager.init();
        }
    }

    updateUserProfile(user) {
        const userNameElement = document.getElementById('userName');
        const userName = user.Username || user.username || user.name || user.nama || user.full_name || user.fullname || 'User';
        userNameElement.textContent = userName;
        
        const userRoleElement = document.getElementById('userRole');
        const userRole = user.Role || user.role || user.jabatan || user.level || user.position || user.title || user.department || 'Pengguna';
        userRoleElement.textContent = userRole;
        
        const userAvatarElement = document.getElementById('userAvatar');
        const userInitialsContainer = document.getElementById('userInitials');
        const userInitialsText = userInitialsContainer.querySelector('span');
        
        if (user.ProfilAvatar && user.ProfilAvatar.trim() !== '') {
            userAvatarElement.src = `https://test.bulshitman1.workers.dev/avatar?url=${encodeURIComponent(user.ProfilAvatar)}`;
            userAvatarElement.style.display = 'block';
            userAvatarElement.classList.remove('hidden');
            userInitialsContainer.style.display = 'none';
        } else {
            userAvatarElement.style.display = 'none';
            userAvatarElement.classList.add('hidden');
            userInitialsContainer.style.display = 'flex';
            
            const initials = userName.split(' ')
                .filter(word => word.length > 0)
                .map(word => word.charAt(0).toUpperCase())
                .slice(0, 2)
                .join('');
            userInitialsText.textContent = initials || 'U';
        }
        
        const welcomeTitle = document.querySelector('main h2');
        if (welcomeTitle) {
            welcomeTitle.textContent = `Selamat Datang, ${userName}!`;
        }
        
        const headerTitle = document.querySelector('header h1');
        if (headerTitle) {
            headerTitle.textContent = `Selamat Datang, ${userName}`;
        }
    }

    logout() {
        localStorage.removeItem('user');
        localStorage.removeItem('nik');
        
        clearInterval(this.countdownInterval);
        clearInterval(this.resendTimer);
        
        this.currentUser = null;
        this.resendAttempts = 0;
        
        document.getElementById('dashboardPage').classList.add('hidden');
        document.getElementById('otpPage').classList.add('hidden');
        document.getElementById('loginPage').classList.remove('hidden');
        
        document.getElementById('loginForm').reset();
        document.querySelectorAll('.otp-input').forEach(input => input.value = '');
        document.getElementById('loginError').classList.add('hidden');
        document.getElementById('otpError').classList.add('hidden');
        
        window.captchaManager.generate();
        
        const resendBtn = document.getElementById('resendOtp');
        resendBtn.disabled = false;
        resendBtn.innerHTML = '<i class="fas fa-redo mr-2"></i>Kirim Ulang OTP';
    }
}
