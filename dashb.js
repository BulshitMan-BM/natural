// dashboard.js - Dashboard management
class DashboardManager {
    constructor() {
        this.sidebarCollapsed = false;
        this.darkMode = localStorage.getItem('darkMode') === 'true';
    }

    init() {
        this.initializeDarkMode();
        this.bindEvents();
        this.initializeMenus();
        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());
    }

    initializeDarkMode() {
        if (this.darkMode) {
            document.documentElement.classList.add('dark');
        }
    }

    bindEvents() {
        // Dark mode toggles
        document.getElementById('darkModeToggleLogin').addEventListener('click', () => this.toggleDarkMode());
        document.getElementById('darkModeToggle').addEventListener('click', () => this.toggleDarkMode());
        
        // Sidebar toggles
        document.getElementById('sidebarToggleDesktop').addEventListener('click', () => this.toggleSidebar());
        document.getElementById('sidebarToggleMobile').addEventListener('click', () => this.toggleSidebar());
        
        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            if (window.authManager) {
                window.authManager.logout();
            }
        });
    }

    toggleDarkMode() {
        this.darkMode = !this.darkMode;
        document.documentElement.classList.toggle('dark');
        localStorage.setItem('darkMode', this.darkMode);
    }

    toggleSidebar() {
        this.sidebarCollapsed = !this.sidebarCollapsed;
        
        const sidebar = document.getElementById('sidebar');
        const header = document.getElementById('header');
        const logoText = document.getElementById('logoText');
        const sidebarTexts = document.querySelectorAll('.sidebar-text');
        const sidebarToggleMobile = document.getElementById('sidebarToggleMobile');
        const sidebarToggleDesktop = document.getElementById('sidebarToggleDesktop');
        
        if (this.sidebarCollapsed) {
            sidebar.classList.remove('w-64');
            sidebar.classList.add('w-16');
            
            logoText.style.opacity = '0';
            sidebarTexts.forEach(text => {
                text.style.opacity = '0';
            });
            
            const allSubmenus = document.querySelectorAll('.submenu');
            const allChevrons = document.querySelectorAll('.menu-button .fa-chevron-down');
            allSubmenus.forEach(menu => menu.classList.add('hidden'));
            allChevrons.forEach(chev => chev.style.transform = 'rotate(0deg)');
            
            header.style.marginLeft = '-4rem';
            header.classList.add('z-30');
            
            sidebarToggleMobile.classList.remove('hidden');
            sidebarToggleDesktop.style.opacity = '0';
            
        } else {
            sidebar.classList.remove('w-16');
            sidebar.classList.add('w-64');
            
            setTimeout(() => {
                logoText.style.opacity = '1';
                sidebarTexts.forEach(text => {
                    text.style.opacity = '1';
                });
            }, 150);
            
            header.style.marginLeft = '';
            header.classList.remove('z-30');
            
            sidebarToggleMobile.classList.add('hidden');
            sidebarToggleDesktop.style.opacity = '1';
        }
    }

    initializeMenus() {
        const menuButtons = document.querySelectorAll('.menu-button');
        
        menuButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const submenu = button.nextElementSibling;
                const chevron = button.querySelector('.fa-chevron-down');
                const isCurrentlyOpen = !submenu.classList.contains('hidden');
                
                if (this.sidebarCollapsed) {
                    this.toggleSidebar();
                    setTimeout(() => {
                        this.toggleSubmenu(submenu, chevron, isCurrentlyOpen);
                    }, 300);
                } else {
                    this.toggleSubmenu(submenu, chevron, isCurrentlyOpen);
                }
            });
        });
    }

    toggleSubmenu(submenu, chevron, isCurrentlyOpen) {
        const allSubmenus = document.querySelectorAll('.submenu');
        const allChevrons = document.querySelectorAll('.menu-button .fa-chevron-down');
        
        allSubmenus.forEach(menu => {
            if (menu !== submenu) {
                menu.classList.add('hidden');
            }
        });
        
        allChevrons.forEach(chev => {
            if (chev !== chevron) {
                chev.style.transform = 'rotate(0deg)';
            }
        });
        
        if (isCurrentlyOpen) {
            submenu.classList.add('hidden');
            chevron.style.transform = 'rotate(0deg)';
        } else {
            submenu.classList.remove('hidden');
            chevron.style.transform = 'rotate(180deg)';
        }
    }

    handleResize() {
        const isMobile = window.innerWidth < 768;
        const sidebar = document.getElementById('sidebar');
        const header = document.getElementById('header');
        
        if (isMobile && !this.sidebarCollapsed) {
            sidebar.classList.add('absolute', 'inset-y-0', 'left-0', 'z-40');
            header.classList.add('z-30');
        } else if (!isMobile) {
            sidebar.classList.remove('absolute', 'inset-y-0', 'left-0', 'z-40');
            if (!this.sidebarCollapsed) {
                header.classList.remove('z-30');
            }
        }
    }
}
