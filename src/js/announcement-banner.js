/**
 * Announcement Banner System
 * Auto-scrolling carousel for announcements, discounts, and notifications
 */

class AnnouncementBanner {
    constructor() {
        this.announcements = [];
        this.currentIndex = 0;
        this.autoScrollInterval = null;
        this.autoScrollDelay = 5000; // 5 seconds per announcement
        this.isDismissed = sessionStorage.getItem('banner_dismissed') === 'true';
    }

    async init() {
        if (this.isDismissed) {
            console.log('Banner dismissed this session');
            return;
        }

        // Wait for supabaseClient to be available
        let attempts = 0;
        while (typeof supabaseClient === 'undefined' && attempts < 10) {
            console.log('Waiting for supabaseClient...');
            await new Promise(resolve => setTimeout(resolve, 300));
            attempts++;
        }

        if (typeof supabaseClient === 'undefined') {
            console.error('supabaseClient not available after waiting');
            return;
        }

        console.log('Loading announcements...');
        await this.loadAnnouncements();
        
        if (this.announcements.length > 0) {
            console.log(`Found ${this.announcements.length} active announcements`);
            this.render();
            this.startAutoScroll();
        } else {
            console.log('No active announcements to display');
        }
    }

    async loadAnnouncements() {
        try {
            const { data, error } = await supabaseClient
                .from('announcements')
                .select('*')
                .eq('is_active', true)
                .lte('start_date', new Date().toISOString())
                .or('end_date.is.null,end_date.gte.' + new Date().toISOString())
                .order('display_order', { ascending: true });

            if (error) {
                console.error('Error loading announcements:', error);
                return;
            }

            this.announcements = data || [];
            console.log('Loaded announcements:', this.announcements);
        } catch (error) {
            console.error('Error loading announcements:', error);
        }
    }

    render() {
        const container = document.getElementById('announcement-banner');
        if (!container || this.announcements.length === 0) return;

        const announcement = this.announcements[this.currentIndex];
        
        // Color schemes based on type
        const typeStyles = {
            discount: 'bg-gradient-to-r from-orange-500 to-red-500',
            info: 'bg-gradient-to-r from-blue-500 to-indigo-500',
            warning: 'bg-gradient-to-r from-yellow-500 to-orange-500',
            success: 'bg-gradient-to-r from-green-500 to-teal-500',
            urgent: 'bg-gradient-to-r from-red-600 to-pink-600'
        };

        const bgColor = typeStyles[announcement.type] || typeStyles.info;

        container.innerHTML = `
            <div class="${bgColor} text-white shadow-lg relative overflow-hidden">
                <!-- Animated background pattern -->
                <div class="absolute inset-0 opacity-10">
                    <div class="absolute transform rotate-45 bg-white h-32 w-1 -left-8 animate-slide"></div>
                    <div class="absolute transform rotate-45 bg-white h-32 w-1 left-1/4 animate-slide-delay-1"></div>
                    <div class="absolute transform rotate-45 bg-white h-32 w-1 left-1/2 animate-slide-delay-2"></div>
                    <div class="absolute transform rotate-45 bg-white h-32 w-1 left-3/4 animate-slide-delay-3"></div>
                </div>

                <div class="container mx-auto px-4 py-3 relative z-10">
                    <div class="flex items-center justify-between gap-4">
                        <!-- Icon -->
                        <div class="hidden md:flex items-center">
                            <i class="fas ${announcement.icon} text-2xl animate-pulse"></i>
                        </div>

                        <!-- Content -->
                        <div class="flex-1 text-center md:text-left">
                            <span class="font-bold mr-2">${announcement.title}</span>
                            <span class="opacity-90">${announcement.message}</span>
                            ${announcement.link_url ? `
                                <a href="${announcement.link_url}" 
                                   class="ml-3 inline-block bg-white text-gray-900 px-4 py-1 rounded-full text-sm font-semibold hover:bg-opacity-90 transition-all transform hover:scale-105">
                                    ${announcement.link_text || 'Learn More'} →
                                </a>
                            ` : ''}
                        </div>

                        <!-- Navigation & Close -->
                        <div class="flex items-center gap-2">
                            ${this.announcements.length > 1 ? `
                                <button onclick="announcementBanner.previous()" 
                                        class="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full w-8 h-8 flex items-center justify-center transition-all">
                                    <i class="fas fa-chevron-left text-sm"></i>
                                </button>
                                <span class="text-xs opacity-75 hidden sm:inline">
                                    ${this.currentIndex + 1}/${this.announcements.length}
                                </span>
                                <button onclick="announcementBanner.next()" 
                                        class="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full w-8 h-8 flex items-center justify-center transition-all">
                                    <i class="fas fa-chevron-right text-sm"></i>
                                </button>
                            ` : ''}
                            <button onclick="announcementBanner.dismiss()" 
                                    class="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full w-8 h-8 flex items-center justify-center transition-all ml-2"
                                    title="Dismiss">
                                <i class="fas fa-times text-sm"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.classList.remove('hidden');
    }

    next() {
        this.currentIndex = (this.currentIndex + 1) % this.announcements.length;
        this.render();
        this.resetAutoScroll();
    }

    previous() {
        this.currentIndex = (this.currentIndex - 1 + this.announcements.length) % this.announcements.length;
        this.render();
        this.resetAutoScroll();
    }

    dismiss() {
        const container = document.getElementById('announcement-banner');
        if (container) {
            container.classList.add('animate-fade-out');
            setTimeout(() => {
                container.classList.add('hidden');
                sessionStorage.setItem('banner_dismissed', 'true'); // Changed to sessionStorage
            }, 300);
        }
        this.stopAutoScroll();
    }

    startAutoScroll() {
        if (this.announcements.length <= 1) return;
        
        this.autoScrollInterval = setInterval(() => {
            this.next();
        }, this.autoScrollDelay);
    }

    stopAutoScroll() {
        if (this.autoScrollInterval) {
            clearInterval(this.autoScrollInterval);
            this.autoScrollInterval = null;
        }
    }

    resetAutoScroll() {
        this.stopAutoScroll();
        this.startAutoScroll();
    }
}

// Initialize banner when DOM is ready
let announcementBanner;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        announcementBanner = new AnnouncementBanner();
        await announcementBanner.init();
    });
} else {
    announcementBanner = new AnnouncementBanner();
    announcementBanner.init();
}

// Add custom animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slide {
        0% { transform: translateX(-100vw) rotate(45deg); }
        100% { transform: translateX(100vw) rotate(45deg); }
    }
    .animate-slide {
        animation: slide 3s linear infinite;
    }
    .animate-slide-delay-1 {
        animation: slide 3s linear infinite;
        animation-delay: 0.5s;
    }
    .animate-slide-delay-2 {
        animation: slide 3s linear infinite;
        animation-delay: 1s;
    }
    .animate-slide-delay-3 {
        animation: slide 3s linear infinite;
        animation-delay: 1.5s;
    }
    .animate-fade-out {
        animation: fadeOut 0.3s ease-out forwards;
    }
    @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-20px); }
    }
`;
document.head.appendChild(style);
