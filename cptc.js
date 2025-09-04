// captcha.js - Captcha management
class CaptchaManager {
    constructor() {
        this.currentCaptcha = '';
        this.verified = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.generate();
        this.initializeSensor();
    }

    bindEvents() {
        document.getElementById('refreshCaptcha').addEventListener('click', () => this.generate());
        document.getElementById('captchaInput').addEventListener('input', () => this.verify());
        document.getElementById('captchaInput').addEventListener('paste', () => {
            setTimeout(() => this.verify(), 10);
        });
    }

    generate() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let captcha = '';
        for (let i = 0; i < 6; i++) {
            captcha += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        this.currentCaptcha = captcha;
        
        const captchaDisplay = document.getElementById('captchaDisplay');
        
        const patterns = [
            'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            'linear-gradient(45deg, #f1f5f9 25%, #e2e8f0 25%, #e2e8f0 75%, #f1f5f9 75%), linear-gradient(-45deg, #f1f5f9 25%, #e2e8f0 25%, #e2e8f0 75%, #f1f5f9 75%)',
            'radial-gradient(circle at 30% 30%, #f8fafc 0%, #e2e8f0 50%), radial-gradient(circle at 70% 70%, #f1f5f9 0%, #cbd5e1 50%)',
            'repeating-linear-gradient(90deg, #f8fafc, #f8fafc 12px, #e2e8f0 12px, #e2e8f0 24px)',
            'linear-gradient(0deg, #f1f5f9 0%, #f8fafc 50%, #e2e8f0 100%)',
            'conic-gradient(from 45deg, #f8fafc, #e2e8f0, #f1f5f9, #cbd5e1, #f8fafc)'
        ];
        
        const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
        
        let noisePattern = '';
        for (let i = 0; i < 8; i++) {
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            const size = Math.random() * 1 + 0.5;
            const opacity = Math.random() * 0.3 + 0.1;
            noisePattern += `<div style="position: absolute; left: ${x}%; top: ${y}%; width: ${size}px; height: ${size}px; background: rgba(100,116,139,${opacity}); border-radius: 50%; pointer-events: none;"></div>`;
        }
        
        let linesPattern = '';
        for (let i = 0; i < 3; i++) {
            const x1 = Math.random() * 100;
            const y1 = Math.random() * 100;
            const x2 = Math.random() * 100;
            const y2 = Math.random() * 100;
            const opacity = Math.random() * 0.2 + 0.1;
            linesPattern += `<svg style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;"><line x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%" stroke="rgba(100,116,139,${opacity})" stroke-width="0.8"/></svg>`;
        }
        
        let styledCaptcha = '';
        const colors = ['#1e293b', '#334155', '#475569', '#64748b', '#0f172a', '#374151'];
        for (let i = 0; i < captcha.length; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            const rotation = (Math.random() - 0.5) * 15;
            const skew = (Math.random() - 0.5) * 6;
            const scale = 0.95 + Math.random() * 0.1;
            styledCaptcha += `<span style="color: ${color}; display: inline-block; transform: rotate(${rotation}deg) skew(${skew}deg) scale(${scale}); margin: 0 1px; text-shadow: 0.5px 0.5px 1px rgba(71,85,105,0.2);">${captcha[i]}</span>`;
        }
        
        captchaDisplay.style.background = randomPattern;
        captchaDisplay.style.backgroundSize = '16px 16px, 20px 20px';
        captchaDisplay.innerHTML = `
            <div style="position: relative; z-index: 2; display: flex; align-items: center; justify-content: center; height: 100%;">
                ${styledCaptcha}
            </div>
            ${noisePattern}
            ${linesPattern}
            <div id="captchaSensor" class="absolute inset-0 transition-opacity duration-300 pointer-events-none opacity-0">
            </div>
        `;
        
        captchaDisplay.style.filter = 'blur(3px)';
        
        this.verified = false;
        if (window.authManager) {
            window.authManager.updateLoginButton();
        }
        
        document.getElementById('captchaInput').value = '';
        document.getElementById('captchaCheck').classList.add('hidden');
        document.getElementById('captchaX').classList.add('hidden');
        document.getElementById('captchaError').classList.add('hidden');
    }

    verify() {
        const input = document.getElementById('captchaInput').value.toUpperCase();
        const checkIcon = document.getElementById('captchaCheck');
        const xIcon = document.getElementById('captchaX');
        const errorDiv = document.getElementById('captchaError');
        
        checkIcon.classList.add('hidden');
        xIcon.classList.add('hidden');
        errorDiv.classList.add('hidden');
        
        if (input.length === 6) {
            if (input === this.currentCaptcha) {
                this.verified = true;
                checkIcon.classList.remove('hidden');
                document.getElementById('captchaInput').classList.remove('border-red-300');
                document.getElementById('captchaInput').classList.add('border-green-300');
            } else {
                this.verified = false;
                xIcon.classList.remove('hidden');
                errorDiv.classList.remove('hidden');
                document.getElementById('captchaInput').classList.remove('border-green-300');
                document.getElementById('captchaInput').classList.add('border-red-300');
            }
            if (window.authManager) {
                window.authManager.updateLoginButton();
            }
        } else {
            this.verified = false;
            document.getElementById('captchaInput').classList.remove('border-green-300', 'border-red-300');
            if (window.authManager) {
                window.authManager.updateLoginButton();
            }
        }
    }

    initializeSensor() {
        const captchaContainer = document.querySelector('.bg-gradient-to-r.from-blue-50');
        const captchaDisplay = document.getElementById('captchaDisplay');
        const captchaSensor = document.getElementById('captchaSensor');
        
        captchaDisplay.style.filter = 'blur(3px)';
        captchaSensor.style.opacity = '1';
        
        captchaContainer.addEventListener('mouseenter', function() {
            captchaDisplay.style.filter = 'blur(0px)';
            captchaSensor.style.opacity = '0';
        });
        
        captchaContainer.addEventListener('mouseleave', function() {
            captchaDisplay.style.filter = 'blur(3px)';
            captchaSensor.style.opacity = '1';
        });
        
        captchaContainer.addEventListener('touchstart', function() {
            captchaDisplay.style.filter = 'blur(0px)';
            captchaSensor.style.opacity = '0';
        });
        
        captchaContainer.addEventListener('touchend', function() {
            captchaDisplay.style.filter = 'blur(3px)';
            captchaSensor.style.opacity = '1';
        });
    }

    isVerified() {
        return this.verified;
    }
}
