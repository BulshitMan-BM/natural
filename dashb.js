// Dashboard System Module
const DashboardSystem = (function() {
    'use strict';
    
    // ===== PRIVATE VARIABLES =====
    let isCollapsed = false;
    let currentUser = null;
    
    // ===== DASHBOARD HTML TEMPLATE =====
    const dashboardHTML = `
        <div class="flex h-screen">
            <!-- Desktop Sidebar -->
            <div id="sidebar" class="hidden md:flex bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 ease-in-out w-64 flex-shrink-0 relative z-10">
                <div class="flex flex-col h-full w-full">
                    <!-- Logo Area -->
                    <div class="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
                        <div class="flex items-center space-x-3">
                            <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <i class="fas fa-cube text-white text-sm"></i>
                            </div>
                            <span id="logoText" class="font-bold text-xl text-gray-800 dark:text-white transition-opacity duration-300">Dashboard</span>
                        </div>
                        <!-- Toggle button for expanded sidebar (desktop) -->
                        <button id="sidebarToggleDesktop" class="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors duration-200">
                            <i class="fas fa-chevron-left text-sm"></i>
                        </button>
                    </div>

                    <!-- Navigation -->
                    <nav class="flex-1 p-3 space-y-2 overflow-y-auto">
                        <!-- DTKS Menu -->
                        <div class="space-y-1">
                            <button class="flex items-center justify-between w-full p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors duration-200" onclick="DashboardSystem.handleMenuClick('dtks')">
                                <div class="flex items-center space-x-3">
                                    <i class="fas fa-database w-5 text-center"></i>
                                    <span class="sidebar-text font-medium">DTKS</span>
                                </div>
                                <i class="fas fa-chevron-down sidebar-text transition-transform duration-200" id="dtks-arrow"></i>
                            </button>
                            <div id="dtks-submenu" class="hidden ml-8 space-y-1">
                                <a href="#" class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors duration-200">
                                    <span class="sidebar-text text-sm">View Data</span>
                                </a>
                                <a href="#" class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors duration-200">
                                    <span class="sidebar-text text-sm">Rekap Data</span>
                                </a>
                            </div>
                        </div>

                        <!-- Usulan Menu -->
                        <div class="space-y-1">
                            <button class="flex items-center justify-between w-full p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors duration-200" onclick="DashboardSystem.handleMenuClick('usulan')">
                                <div class="flex items-center space-x-3">
                                    <i class="fas fa-file-alt w-5 text-center"></i>
                                    <span class="sidebar-text font-medium">Usulan</span>
                                </div>
                                <i class="fas fa-chevron-down sidebar-text transition-transform duration-200" id="usulan-arrow"></i>
                            </button>
                            <div id="usulan-submenu" class="hidden ml-8 space-y-1">
                                <a href="#" class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors duration-200">
                                    <span class="sidebar-text text-sm">Data Baru</span>
                                </a>
                                <a href="#" class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors duration-200">
                                    <span class="sidebar-text text-sm">Pembaharuan</span>
                                </a>
                            </div>
                        </div>

                        <!-- Unduh Menu -->
                        <div class="space-y-1">
                            <button class="flex items-center justify-between w-full p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors duration-200" onclick="DashboardSystem.handleMenuClick('unduh')">
                                <div class="flex items-center space-x-3">
                                    <i class="fas fa-download w-5 text-center"></i>
                                    <span class="sidebar-text font-medium">Unduh</span>
                                </div>
                                <i class="fas fa-chevron-down sidebar-text transition-transform duration-200" id="unduh-arrow"></i>
                            </button>
                            <div id="unduh-submenu" class="hidden ml-8 space-y-1">
                                <a href="#" class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors duration-200">
                                    <span class="sidebar-text text-sm">Edaran & Informasi</span>
                                </a>
                            </div>
                        </div>

                        <!-- DTKS/Dusun Menu -->
                        <div class="space-y-1">
                            <button class="flex items-center justify-between w-full p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors duration-200" onclick="DashboardSystem.handleMenuClick('dusun')">
                                <div class="flex items-center space-x-3">
                                    <i class="fas fa-map-marker-alt w-5 text-center"></i>
                                    <span class="sidebar-text font-medium">DTKS/Dusun</span>
                                </div>
                                <i class="fas fa-chevron-down sidebar-text transition-transform duration-200" id="dusun-arrow"></i>
                            </button>
                            <div id="dusun-submenu" class="hidden ml-8 space-y-1">
                                <a href="#" class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors duration-200">
                                    <span class="sidebar-text text-sm">Dusun 1</span>
                                </a>
                                <a href="#" class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors duration-200">
                                    <span class="sidebar-text text-sm">Dusun 2</span>
                                </a>
                                <a href="#" class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors duration-200">
                                    <span class="sidebar-text text-sm">Dusun 3</span>
                                </a>
                                <a href="#" class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors duration-200">
                                    <span class="sidebar-text text-sm">Dusun 4</span>
                                </a>
                            </div>
                        </div>
                    </nav>

                    <!-- User Profile -->
                    <div class="p-3 border-t border-gray-200 dark:border-gray-700">
                        <div class="flex items-center space-x-3">
                            <div id="sidebarProfileImage" class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden">
                                <i class="fas fa-user text-white text-sm"></i>
                            </div>
                            <div class="sidebar-text">
                                <p class="font-medium text-gray-800 dark:text-white" id="userNameSidebar">User</p>
                                <p class="text-sm text-gray-500 dark:text-gray-400" id="userRoleSidebar">Member</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Mobile Overlay Navigation -->
            <div id="mobileOverlay" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden md:hidden">
                <div class="bg-white dark:bg-gray-800 w-full h-full flex flex-col">
                    <!-- Mobile Header -->
                    <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                        <div class="flex items-center space-x-3">
                            <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <i class="fas fa-cube text-white text-sm"></i>
                            </div>
                            <span class="font-bold text-xl text-gray-800 dark:text-white">Dashboard</span>
                        </div>
                        <button id="closeMobileMenu" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors duration-200">
                            <i class="fas fa-times text-lg"></i>
                        </button>
                    </div>

                    <!-- Mobile Navigation -->
                    <nav class="flex-1 p-4 space-y-2 overflow-y-auto">
                        <!-- Mobile menu items (similar structure) -->
                    </nav>

                    <!-- Mobile User Profile -->
                    <div class="p-4 border-t border-gray-200 dark:border-gray-700">
                        <div class="flex items-center space-x-3">
                            <div id="mobileProfileImage" class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden">
                                <i class="fas fa-user text-white text-sm"></i>
                            </div>
                            <div>
                                <p class="font-medium text-gray-800 dark:text-white" id="userNameMobile">User</p>
                                <p class="text-sm text-gray-500 dark:text-gray-400" id="userRoleMobile">Member</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Main Content -->
            <div class="flex-1 flex flex-col min-w-0">
                <!-- Header -->
                <header id="header" class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-all duration-300 relative z-20">
                    <div class="flex items-center justify-between p-3">
                        <div class="flex items-center space-x-4">
                            <!-- Toggle button for mobile -->
                            <button id="sidebarToggleMobile" class="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors duration-200">
                                <i class="fas fa-bars"></i>
                            </button>
                            <!-- Toggle button for desktop/laptop -->
                            <button id="sidebarToggleHeader" class="hidden md:block p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors duration-200">
                                <i class="fas fa-bars"></i>
                            </button>
                            <h1 class="text-2xl font-bold text-gray-800 dark:text-white">Selamat Datang</h1>
                        </div>
                        
                        <div class="flex items-center space-x-4">
                            <!-- Dark Mode Toggle -->
                            <button id="dashboardDarkModeToggle" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors duration-200">
                                <i id="dashboardMoonIcon" class="fas fa-moon"></i>
                                <i id="dashboardSunIcon" class="fas fa-sun" style="display: none;"></i>
                            </button>
                            
                            <!-- Notifications -->
                            <button class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors duration-200 relative">
                                <i class="fas fa-bell"></i>
                                <span class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                            </button>
                            
                            <!-- Logout Button -->
                            <button onclick="LoginSystem.logout()" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors duration-200">
                                <i class="fas fa-sign-out-alt"></i>
                            </button>
                        </div>
                    </div>
                </header>

                <!-- Page Content -->
                <main class="flex-1 p-6 overflow-auto bg-gray-50 dark:bg-gray-900">
                    <div class="max-w-7xl mx-auto">
                        <!-- Welcome Message -->
                        <div class="mb-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
                            <h2 class="text-2xl font-bold mb-2">Selamat Datang, <span id="userNameWelcome">User</span>!</h2>
                            <p class="opacity-90">Anda berhasil masuk ke sistem dashboard. Semua fitur telah tersedia untuk Anda.</p>
                        </div>

                        <!-- Stats Cards -->
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="text-sm text-gray-600 dark:text-gray-400">Total Pengguna</p>
                                        <p class="text-3xl font-bold text-gray-800 dark:text-white">1,234</p>
                                    </div>
                                    <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-users text-blue-600 dark:text-blue-400"></i>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="text-sm text-gray-600 dark:text-gray-400">Penjualan</p>
                                        <p class="text-3xl font-bold text-gray-800 dark:text-white">$12,345</p>
                                    </div>
                                    <div class="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-dollar-sign text-green-600 dark:text-green-400"></i>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="text-sm text-gray-600 dark:text-gray-400">Pesanan</p>
                                        <p class="text-3xl font-bold text-gray-800 dark:text-white">567</p>
                                    </div>
                                    <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-shopping-cart text-purple-600 dark:text-purple-400"></i>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="text-sm text-gray-600 dark:text-gray-400">Pertumbuhan</p>
                                        <p class="text-3xl font-bold text-gray-800 dark:text-white">+23%</p>
                                    </div>
                                    <div class="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-chart-line text-orange-600 dark:text-orange-400"></i>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Content Area -->
                        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <!-- Chart Area -->
                            <div class="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                                <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">Grafik Penjualan</h3>
                                <div class="h-64 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                    <p class="text-gray-500 dark:text-gray-400">Area untuk grafik</p>
                                </div>
                            </div>
                            
                            <!-- Activity Feed -->
                            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                                <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">Aktivitas Terbaru</h3>
                                <div class="space-y-4">
                                    <div class="flex items-start space-x-3">
                                        <div class="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                        <div>
                                            <p class="text-sm text-gray-800 dark:text-white">Pengguna baru mendaftar</p>
                                            <p class="text-xs text-gray-500 dark:text-gray-400">2 menit yang lalu</p>
                                        </div>
                                    </div>
                                    <div class="flex items-start space-x-3">
                                        <div class="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                                        <div>
                                            <p class="text-sm text-gray-800 dark:text-white">Pesanan baru diterima</p>
                                            <p class="text-xs text-gray-500 dark:text-gray-400">5 menit yang lalu</p>
                                        </div>
                                    </div>
                                    <div class="flex items-start space-x-3">
                                        <div class="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                                        <div>
                                            <p class="text-sm text-gray-800 dark:text-white">Sistem diperbarui</p>
                                            <p class="text-xs text-gray-500 dark:text-gray-400">1 jam yang lalu</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    `;
    
    // ===== PRIVATE FUNCTIONS =====
    function updateUserInfo(user) {
        const userName = user?.Username || user?.name || user?.nama || 'User';
        const userRole = user?.Role || user?.role || user?.jabatan || 'Member';
        const avatarUrl = user?.ProfilAvatar || null;
        
        // Update all user name elements
        const userNameElements = [
            'userNameSidebar',
            'userNameMobile', 
            'userNameWelcome'
        ];
        
        userNameElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = userName;
        });
        
        // Update role elements
        const userRoleElements = [
            'userRoleSidebar',
            'userRoleMobile'
        ];
        
        userRoleElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = userRole;
        });
        
        // Update profile images
        const profileImageElements = [
            'sidebarProfileImage',
            'mobileProfileImage'
        ];
        
        profileImageElements.forEach(id => {
            const element = document.getElementById(id);
            if (element && avatarUrl) {
                // Use the proxy service for avatar images
                const proxyAvatarUrl = `https://test.bulshitman1.workers.dev/avatar?url=${encodeURIComponent(avatarUrl)}`;
                element.innerHTML = `<img src="${proxyAvatarUrl}" alt="Profile" class="w-full h-full rounded-full object-cover" onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\\"fas fa-user text-white text-sm\\"></i>';">`;
            } else if (element) {
                // Keep default icon if no avatar URL
                element.innerHTML = '<i class="fas fa-user text-white text-sm"></i>';
            }
        });
    }

    function initializeSidebarComponents() {
        // Sidebar elements
        const sidebar = document.getElementById('sidebar');
        const header = document.getElementById('header');
        const sidebarToggleDesktop = document.getElementById('sidebarToggleDesktop');
        const sidebarToggleMobile = document.getElementById('sidebarToggleMobile');
        const mobileOverlay = document.getElementById('mobileOverlay');
        const closeMobileMenuBtn = document.getElementById('closeMobileMenu');
        const logoText = document.getElementById('logoText');
        const sidebarTexts = document.querySelectorAll('.sidebar-text');
        
        // Get header toggle button reference
        const sidebarToggleHeader = document.getElementById('sidebarToggleHeader');
        
        // Set initial state - hide header toggle when sidebar is expanded
        if (sidebarToggleHeader) {
            sidebarToggleHeader.style.display = 'none';
        }

        // Sidebar toggle function
        function toggleSidebar() {
            isCollapsed = !isCollapsed;
            
            if (isCollapsed) {
                sidebar.classList.remove('w-64');
                sidebar.classList.add('w-16');
                logoText.classList.add('opacity-0', 'hidden');
                sidebarTexts.forEach(text => text.classList.add('hidden'));
                sidebarToggleDesktop.innerHTML = '<i class="fas fa-chevron-right text-sm"></i>';
                if (sidebarToggleHeader) {
                    sidebarToggleHeader.style.display = 'block';
                }
                header.style.marginLeft = '-4rem';
                header.style.zIndex = '30';
                closeAllSubmenus();
                
                // Hide dropdown arrows when collapsed
                const dropdownArrows = document.querySelectorAll('#dtks-arrow, #usulan-arrow, #unduh-arrow, #dusun-arrow');
                dropdownArrows.forEach(arrow => {
                    if (arrow) arrow.style.display = 'none';
                });
            } else {
                sidebar.classList.remove('w-16');
                sidebar.classList.add('w-64');
                setTimeout(() => {
                    logoText.classList.remove('opacity-0', 'hidden');
                    sidebarTexts.forEach(text => text.classList.remove('hidden'));
                    
                    // Show dropdown arrows when expanded
                    const dropdownArrows = document.querySelectorAll('#dtks-arrow, #usulan-arrow, #unduh-arrow, #dusun-arrow');
                    dropdownArrows.forEach(arrow => {
                        if (arrow) arrow.style.display = 'block';
                    });
                }, 150);
                sidebarToggleDesktop.innerHTML = '<i class="fas fa-chevron-left text-sm"></i>';
                if (sidebarToggleHeader) {
                    sidebarToggleHeader.style.display = 'none';
                }
                header.style.marginLeft = '0';
                header.style.zIndex = '20';
            }
        }

        // Desktop sidebar toggle (from sidebar)
        if (sidebarToggleDesktop) {
            sidebarToggleDesktop.addEventListener('click', toggleSidebar);
        }

        // Header sidebar toggle (from header)
        if (sidebarToggleHeader) {
            sidebarToggleHeader.addEventListener('click', toggleSidebar);
        }

        // Mobile menu toggle
        if (sidebarToggleMobile) {
            sidebarToggleMobile.addEventListener('click', function() {
                mobileOverlay.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
            });
        }

        // Close mobile menu
        if (closeMobileMenuBtn) {
            closeMobileMenuBtn.addEventListener('click', function() {
                mobileOverlay.classList.add('hidden');
                document.body.style.overflow = 'auto';
            });
        }

        // Close mobile menu when clicking overlay
        if (mobileOverlay) {
            mobileOverlay.addEventListener('click', function(e) {
                if (e.target === mobileOverlay) {
                    mobileOverlay.classList.add('hidden');
                    document.body.style.overflow = 'auto';
                }
            });
        }

        // Handle responsive behavior
        function handleResize() {
            const isMobile = window.innerWidth < 768;
            
            if (!isMobile && mobileOverlay) {
                mobileOverlay.classList.add('hidden');
                document.body.style.overflow = 'auto';
            }
        }

        window.addEventListener('resize', handleResize);
    }

    function toggleSubmenu(menuId) {
        const submenu = document.getElementById(menuId + '-submenu');
        const arrow = document.getElementById(menuId + '-arrow');
        
        if (submenu && arrow) {
            if (submenu.classList.contains('hidden')) {
                submenu.classList.remove('hidden');
                arrow.classList.add('rotate-180');
            } else {
                submenu.classList.add('hidden');
                arrow.classList.remove('rotate-180');
            }
        }
    }

    function closeAllSubmenus() {
        const allSubmenus = ['dtks', 'usulan', 'unduh', 'dusun'];
        allSubmenus.forEach(menuId => {
            const submenu = document.getElementById(menuId + '-submenu');
            const arrow = document.getElementById(menuId + '-arrow');
            if (submenu && arrow) {
                submenu.classList.add('hidden');
                arrow.classList.remove('rotate-180');
            }
        });
    }

    function handleDesktopMenuClick(menuId) {
        if (isCollapsed) {
            // Expand sidebar first, then open submenu
            const sidebarToggleDesktop = document.getElementById('sidebarToggleDesktop');
            if (sidebarToggleDesktop) {
                sidebarToggleDesktop.click();
                setTimeout(() => {
                    closeAllSubmenus();
                    toggleSubmenu(menuId);
                }, 300);
            }
        } else {
            const currentSubmenu = document.getElementById(menuId + '-submenu');
            const isCurrentOpen = currentSubmenu && !currentSubmenu.classList.contains('hidden');
            
            closeAllSubmenus();
            
            if (!isCurrentOpen) {
                toggleSubmenu(menuId);
            }
        }
    }

    function initializeDashboardDarkMode() {
        const dashboardDarkModeToggle = document.getElementById('dashboardDarkModeToggle');
        
        // Check saved theme preference
        const savedTheme = localStorage.getItem('theme') || 'light';
        
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
            updateDashboardDarkModeIcons(true);
        }

        function toggleDarkMode() {
            const isDark = document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            updateDashboardDarkModeIcons(isDark);
        }

        if (dashboardDarkModeToggle) {
            dashboardDarkModeToggle.addEventListener('click', toggleDarkMode);
        }
    }

    function updateDashboardDarkModeIcons(isDark) {
        // Dashboard icons
        const dashboardMoonIcon = document.getElementById('dashboardMoonIcon');
        const dashboardSunIcon = document.getElementById('dashboardSunIcon');
        
        if (dashboardMoonIcon && dashboardSunIcon) {
            dashboardMoonIcon.style.display = isDark ? 'none' : 'block';
            dashboardSunIcon.style.display = isDark ? 'block' : 'none';
        }
    }
    
    // ===== PUBLIC API =====
    return {
        handleMenuClick: function(menuId) {
            handleDesktopMenuClick(menuId);
        },

        loadDashboard: function(user) {
            currentUser = user;
            
            // Load dashboard HTML
            const dashboardContent = document.getElementById('dashboardContent');
            if (dashboardContent) {
                dashboardContent.innerHTML = dashboardHTML;
            }
            
            // Update user info
            updateUserInfo(user);
            
            // Initialize sidebar components
            initializeSidebarComponents();
            
            // Initialize dashboard dark mode
            initializeDashboardDarkMode();
        },

        init: function() {
            console.log('Dashboard System Initialized');
        }
    };
})();

