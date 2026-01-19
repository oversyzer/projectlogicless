// --- CONFIGURAÇÃO DE DEBUG ---
const DEBUG_MODE = true; // Altere para false para ativar a proteção novamente

// --- Lógica do Intersection Observer (Animações de Scroll) ---
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
        } else {
            entry.target.classList.remove('show');
        }
    });
});

const hiddenElements = document.querySelectorAll('.hidden');
hiddenElements.forEach((el) => observer.observe(el));

// --- Lógica do Menu Mobile ---
const mobileMenu = document.getElementById('mobile-menu');
const navMenu = document.getElementById('nav-menu');

if (mobileMenu && navMenu) {
    mobileMenu.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
        navMenu.classList.toggle('active');
        document.body.classList.toggle('menu-open');
    });

    document.querySelectorAll('#nav-menu a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.classList.remove('menu-open');
        });
    });
}

// --- Integração com a API do Roblox ---

const universeIds = ["996458434", "6713567019", "8949221887"];
// Adicionando um timestamp ao proxy para evitar cache viciado
const proxy = "https://corsproxy.io/?cache=" + new Date().getTime() + "&url=";

function formatNumbers(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num;
}

function initSlider(card) {
    const slides = card.querySelectorAll('.banner-slide');
    
    if (slides.length <= 1) {
        return;
    }

    let currentIndex = 0;
    function showSlide(index) {
        slides.forEach(s => s.classList.remove('active'));
        currentIndex = (index + slides.length) % slides.length;
        slides[currentIndex].classList.add('active');
    }

    setInterval(() => showSlide(currentIndex + 1), 5000);
}

async function fetchRobloxData() {
    try {
        const detailsRes = await fetch(`${proxy}${encodeURIComponent('https://games.roblox.com/v1/games?universeIds=' + universeIds.join(','))}`);
        const detailsData = await detailsRes.json();

        const votesRes = await fetch(`${proxy}${encodeURIComponent('https://games.roblox.com/v1/games/votes?universeIds=' + universeIds.join(','))}`);
        const votesData = await votesRes.json();

        for (const game of detailsData.data) {
            const card = document.getElementById(`game-${game.id}`);
            if (!card) continue;

            card.querySelector('.game-name').innerText = game.name;
            card.querySelector('.game-visits').innerText = `👁️ ${formatNumbers(game.visits)} Visits`;
            
            const genreText = game.genre_l1 || game.genre || "Experience";
            card.querySelector('.tag-badge').innerText = genreText.toUpperCase();

            const voteInfo = votesData.data.find(v => v.id === game.id);
            if (voteInfo) {
                const total = voteInfo.upVotes + voteInfo.downVotes;
                const percent = total > 0 ? Math.round((voteInfo.upVotes / total) * 100) : 100;
                card.querySelector('.game-approval').innerText = `👍 ${percent}% Approval`;
            }

            const mediaRes = await fetch(`${proxy}${encodeURIComponent('https://games.roblox.com/v1/games/' + game.id + '/media?fetchAllExperienceRelatedMedia=true')}`);
            const mediaData = await mediaRes.json();
            const container = card.querySelector('.banner-container');
            container.innerHTML = '';

            if (mediaData.data && mediaData.data.length > 0) {
                const imageIds = mediaData.data
                    .filter(item => item.assetTypeId === 1)
                    .map(item => item.imageId);

                if (imageIds.length > 0) {
                    const assetIdsParam = imageIds.join(',');
                    const thumbRes = await fetch(`${proxy}${encodeURIComponent('https://thumbnails.roblox.com/v1/assets?assetIds=' + assetIdsParam + '&size=420x420&format=Png')}`);
                    const thumbData = await thumbRes.json();

                    thumbData.data.forEach((thumb, idx) => {
                        if (thumb.imageUrl) {
                            const slide = document.createElement('div');
                            slide.className = `banner-slide ${idx === 0 ? 'active' : ''}`;
                            slide.style.backgroundImage = `url('${thumb.imageUrl}')`;
                            container.appendChild(slide);
                        }
                    });

                    if (imageIds.length > 1) initSlider(card);
                }
            } else {
                const iconRes = await fetch(`${proxy}${encodeURIComponent('https://thumbnails.roblox.com/v1/games/icons?universeIds=' + game.id + '&size=512x512&format=Png&isCircular=false')}`);
                const iconData = await iconRes.json();
                const iconInfo = iconData.data.find(i => i.targetId === game.id);
                if (iconInfo) {
                    const slide = document.createElement('div');
                    slide.className = 'banner-slide active';
                    slide.style.backgroundImage = `url('${iconInfo.imageUrl}')`;
                    container.appendChild(slide);
                }
            }
        }
    } catch (e) { 
        console.error("Erro na integração Roblox:", e); 
    }
}
document.addEventListener('DOMContentLoaded', fetchRobloxData);

// --- Lógica de Foco Automático no Centro da Tela (Mobile) ---
const mobileFocusObserver = new IntersectionObserver((entries) => {
    if (window.innerWidth <= 768) {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('mobile-focus');
            } else {
                entry.target.classList.remove('mobile-focus');
            }
        });
    }
}, {
    rootMargin: "-40% 0px -40% 0px",
    threshold: 0
});

document.querySelectorAll('.game-card').forEach((card) => {
    mobileFocusObserver.observe(card);
});

// --- Proteção Contra Inspeção e Cópia ---

if (!DEBUG_MODE) {
    // Bloquear clique direito
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    // Bloquear atalhos de teclado
    document.addEventListener('keydown', (e) => {
        if (
            e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
            (e.ctrlKey && e.key === 'u')
        ) {
            e.preventDefault();
        }
    });
}