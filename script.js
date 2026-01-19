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
const proxy = "https://corsproxy.io/?";

function formatNumbers(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num;
}

// Função para gerenciar o Slider de cada card
function initSlider(card) {
    const container = card.querySelector('.banner-container');
    const slides = card.querySelectorAll('.banner-slide');
    const nextBtn = card.querySelector('.next-btn');
    const prevBtn = card.querySelector('.prev-btn');
    
    if (slides.length <= 1) {
        if (nextBtn) nextBtn.style.display = 'none';
        if (prevBtn) prevBtn.style.display = 'none';
        return;
    }

    let currentIndex = 0;

    function showSlide(index) {
        slides.forEach(s => s.classList.remove('active'));
        currentIndex = (index + slides.length) % slides.length;
        slides[currentIndex].classList.add('active');
    }

    nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showSlide(currentIndex + 1);
    });

    prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showSlide(currentIndex - 1);
    });

    // Auto-passagem (5 segundos)
    setInterval(() => showSlide(currentIndex + 1), 5000);
}

async function fetchRobloxData() {
    try {
        // 1. Busca Detalhes Básicos (Nome, Visitas e GÊNERO)
        const detailsRes = await fetch(`${proxy}https://games.roblox.com/v1/games?universeIds=${universeIds.join(',')}`);
        const detailsData = await detailsRes.json();

        // 2. Busca Dados de Votação
        const votesRes = await fetch(`${proxy}https://games.roblox.com/v1/games/votes?universeIds=${universeIds.join(',')}`);
        const votesData = await votesRes.json();

        // Processar cada jogo
        for (const game of detailsData.data) {
            const card = document.getElementById(`game-${game.id}`);
            if (!card) continue;

            // Atualiza Nome, Visitas e Gênero (Tag)
            card.querySelector('.game-name').innerText = game.name;
            card.querySelector('.game-visits').innerText = `👁️ ${formatNumbers(game.visits)} Visits`;
            card.querySelector('.tag-badge').innerText = game.genre || "Experience";

            // Calcula Approval
            const voteInfo = votesData.data.find(v => v.id === game.id);
            if (voteInfo) {
                const total = voteInfo.upVotes + voteInfo.downVotes;
                const percent = total > 0 ? Math.round((voteInfo.upVotes / total) * 100) : 100;
                card.querySelector('.game-approval').innerText = `👍 ${percent}% Approval`;
            }

            // 3. Busca Banners (Galeria do Jogo)
            const bannerRes = await fetch(`${proxy}https://thumbnails.roblox.com/v1/games/multiverse/thumbnails?universeIds=${game.id}&size=768x432&format=Png&isCircular=false`);
            const bannerData = await bannerRes.json();

            const bannerContainer = card.querySelector('.banner-container');
            
            // Se houver imagens na galeria
            if (bannerData.data && bannerData.data[0].thumbnails.length > 0) {
                bannerData.data[0].thumbnails.forEach((thumb, idx) => {
                    const slide = document.createElement('div');
                    slide.className = `banner-slide ${idx === 0 ? 'active' : ''}`;
                    slide.style.backgroundImage = `url('${thumb.imageUrl}')`;
                    bannerContainer.appendChild(slide);
                });
                
                // Inicia a lógica de passar as fotos para este card
                initSlider(card);
            }
        }
    } catch (error) {
        console.error("Erro ao carregar dados do Roblox:", error);
    }
}

document.addEventListener('DOMContentLoaded', fetchRobloxData);
