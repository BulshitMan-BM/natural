const loginHTML = `
  <!-- Login Page -->
  <div id="login-page">   <!-- Login Page -->
    <div id="login-page" class="min-h-screen flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
        <div class="max-w-lg w-full space-y-6">
            <div class="text-center fade-in">
                <div class="mx-auto w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                    <i class="fas fa-cube text-white text-2xl"></i>
                </div>
                <h2 class="text-3xl font-bold text-gray-900 dark:text-white">Masuk ke Akun Anda</h2>
                <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Silakan masukkan NIK dan password Anda</p>
            </div>
            
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 fade-in">
                <form id="login-form" class="space-y-5">
                    <div>
                        <label for="nik" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <i class="fas fa-id-card mr-2"></i>NIK (Nomor Induk Kependudukan)
                        </label>
                        <input 
                            id="nik" 
                            name="nik" 
                            type="text" 
                            required 
                            maxlength="16"
                            class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                            placeholder="Masukkan 16 digit NIK"
                        >
                        <div id="nik-error" class="hidden text-red-500 text-sm mt-1">
                            <i class="fas fa-exclamation-circle mr-1"></i>NIK harus 16 digit angka
                        </div>
                    </div>
                    
                    <div>
                        <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <i class="fas fa-lock mr-2"></i>Password
                        </label>
                        <div class="relative">
                            <input 
                                id="password" 
                                name="password" 
                                type="password" 
                                required 
                                class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white pr-12 transition-colors"
                                placeholder="Masukkan password"
                            >
                            <button 
                                type="button" 
                                id="toggle-password"
                                class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Text CAPTCHA with Auto Verification -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <i class="fas fa-shield-alt mr-2"></i>Verifikasi Keamanan
                        </label>
                        <!-- CAPTCHA Container -->
                        <div class="captcha-container relative bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-700 dark:to-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg p-3 overflow-hidden">
                            <!-- Outer Container Background Pattern -->
                            <div id="outer-captcha-bg" class="absolute inset-0 opacity-20 dark:opacity-15"></div>
                            <!-- CAPTCHA Content -->
                            <div class="relative z-10">
                                <!-- CAPTCHA Display and Input in One Row -->
                                <div class="flex items-center justify-between space-x-3">
                                    <!-- CAPTCHA Text Display -->
                                    <div class="flex items-center space-x-2 flex-1">
                                        <div id="captcha-icon" class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                            <i class="fas fa-font text-white text-xs"></i>
                                        </div>
                                        <div class="flex-1">
                                            <!-- CAPTCHA Text with background pattern -->
                                            <div id="captcha-text-display" class="relative bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 font-mono text-base font-bold text-center tracking-wider transform -skew-x-3 select-none overflow-hidden">
                                                <!-- Random Background Pattern for CAPTCHA Box -->
                                                <div id="verification-bg" class="absolute inset-0 opacity-40 dark:opacity-35"></div>
                                                <span id="captcha-text" class="relative z-10 text-blue-600 dark:text-blue-400 drop-shadow-sm" style="filter: blur(3px); transition: filter 0.3s ease-in-out;">ABC123</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Input and Status -->
                                    <div class="flex items-center space-x-2 flex-shrink-0">
                                        <div class="flex flex-col items-center space-y-1">
                                            <input 
                                                type="text" 
                                                id="captcha-input"
                                                maxlength="6"
                                                class="w-28 px-3 py-1 text-center text-base font-bold border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                                                placeholder="Ketik..."
                                                autocomplete="off"
                                            >
                                        </div>
                                        
                                        <!-- Refresh Button -->
                                        <button type="button" id="refresh-captcha" class="p-1.5 rounded hover:bg-white hover:bg-opacity-20 text-gray-600 dark:text-gray-300 transition-colors" title="Ganti teks">
                                            <i class="fas fa-sync-alt text-sm"></i>
                                        </button>
                                    </div>
                                </div>
                                
                                <!-- Auto Verification Status -->
                                <div id="captcha-message" class="mt-2 text-xs text-gray-600 dark:text-gray-400 text-center">
                                    Masukkan teks yang sama persis untuk verifikasi otomatis
                                </div>
                            </div>
                        </div>
                        <div id="captcha-error-msg" class="hidden text-red-500 text-sm mt-1">
                            <i class="fas fa-exclamation-circle mr-1"></i>Teks CAPTCHA tidak sesuai
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <input 
                                id="remember-me" 
                                name="remember-me" 
                                type="checkbox" 
                                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            >
                            <label for="remember-me" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                Ingat saya
                            </label>
                        </div>
                        
                        <div class="text-sm">
                            <a href="#" class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
                                Lupa password?
                            </a>
                        </div>
                    </div>
                    
                    <button 
                        type="submit" 
                        id="login-btn"
                        class="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-gray-400 to-gray-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled
                    >
                        <span id="login-btn-text" class="transition-opacity duration-200">Masuk</span>
                        <div id="login-spinner" class="hidden ml-2 flex items-center">
                            <div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        </div>
                    </button>
                </form>
                
                <div class="mt-6 text-center">
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                        Belum punya akun? 
                        <a href="#" class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
                            Daftar sekarang
                        </a>
                    </p>
                </div>
            </div>
            
            <!-- Dark Mode Toggle -->
            <div class="text-center">
                <button id="dark-mode-toggle-login" class="inline-flex items-center px-4 py-2 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow text-gray-700 dark:text-gray-300">
                    <i id="dark-mode-icon-login" class="fas fa-moon mr-2"></i>
                    <span id="dark-mode-text">Mode Gelap</span>
                </button>
            </div>
        </div>
    </div>

    <!-- OTP Verification Page -->
    <div id="otp-page" class="min-h-screen flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 hidden">
        <div class="max-w-lg w-full space-y-6">
            <div class="text-center fade-in">
                <div class="mx-auto w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center mb-6">
                    <i class="fas fa-shield-alt text-white text-2xl"></i>
                </div>
                <h2 class="text-3xl font-bold text-gray-900 dark:text-white">Verifikasi OTP</h2>
                <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Kode OTP telah dikirim ke email: <span id="masked-email" class="font-medium text-blue-600"></span>
                </p>
            </div>
            
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 fade-in">
                <form id="otp-form" class="space-y-6">
                    <div>
                        <label for="otp-code" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 text-center">
                            <i class="fas fa-key mr-2"></i>Masukkan Kode OTP (6 digit)
                        </label>
                        <div class="flex justify-center space-x-2">
                            <input type="text" maxlength="1" class="otp-input w-12 h-12 text-center text-xl font-bold border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white" data-index="0">
                            <input type="text" maxlength="1" class="otp-input w-12 h-12 text-center text-xl font-bold border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white" data-index="1">
                            <input type="text" maxlength="1" class="otp-input w-12 h-12 text-center text-xl font-bold border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white" data-index="2">
                            <input type="text" maxlength="1" class="otp-input w-12 h-12 text-center text-xl font-bold border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white" data-index="3">
                            <input type="text" maxlength="1" class="otp-input w-12 h-12 text-center text-xl font-bold border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white" data-index="4">
                            <input type="text" maxlength="1" class="otp-input w-12 h-12 text-center text-xl font-bold border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white" data-index="5">
                        </div>
                        <div id="otp-error" class="hidden text-red-500 text-sm mt-2 text-center">
                            <i class="fas fa-exclamation-circle mr-1"></i>Kode OTP tidak valid
                        </div>
                    </div>
                    
                    <div class="text-center">
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Waktu tersisa: <span id="countdown" class="font-bold text-red-600">05:00</span>
                        </p>
                        <button 
                            type="button" 
                            id="resend-otp"
                            class="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:transform-none"
                            disabled
                            onclick="resendOTP()"
                        >
                            <i class="fas fa-redo mr-2 transition-transform duration-200"></i>
                            <span>Kirim ulang OTP</span>
                        </button>
                    </div>
                    
                    <button 
                        type="submit" 
                        id="verify-btn"
                        class="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500 transform hover:scale-105 active:scale-95 disabled:transform-none"
                        disabled
                    >
                        <span id="verify-btn-text" class="transition-opacity duration-200">Verifikasi</span>
                        <div id="verify-spinner" class="hidden ml-2 flex items-center">
                            <div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        </div>
                    </button>
                </form>
                
                <div class="mt-6 text-center">
                    <button 
                        id="back-to-login"
                        class="text-sm font-medium text-gray-600 hover:text-gray-500 dark:text-gray-400"
                    >
                        <i class="fas fa-arrow-left mr-1"></i>Kembali ke login
                    </button>
                </div>
            </div>
        </div>
    </div> </div>
`;

document.body.innerHTML += loginHTML;
