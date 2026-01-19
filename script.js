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
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num;
}

function initSlider(card) {
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

    nextBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); showSlide(currentIndex + 1); });
    prevBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); showSlide(currentIndex - 1); });

    setInterval(() => showSlide(currentIndex + 1), 5000);
}

async function fetchRobloxData() {
    try {
        // 1. Detalhes (Nome, Visitas e o GENRE_L1 que você encontrou)
        const detailsRes = await fetch(`${proxy}https://games.roblox.com/v1/games?universeIds=${universeIds.join(',')}`);
        const detailsData = await detailsRes.json();

        // 2. Votos
        const votesRes = await fetch(`${proxy}https://games.roblox.com/v1/games/votes?universeIds=${universeIds.join(',')}`);
        const votesData = await votesRes.json();

        for (const game of detailsData.data) {
            const card = document.getElementById(`game-${game.id}`);
            if (!card) continue;

            // Atualiza Nome, Visitas e o Gênero Correto (genre_l1)
            card.querySelector('.game-name').innerText = game.name;
            card.querySelector('.game-visits').innerText = `👁️ ${formatNumbers(game.visits)} Visits`;
            
            // Exibe o gênero_l1. Se estiver vazio, usa o gênero padrão.
            const genreDisplay = game.genre_l1 || game.genre || "Experience";
            card.querySelector('.tag-badge').innerText = genreDisplay;

            // Atualiza Aprovação
            const voteInfo = votesData.data.find(v => v.id === game.id);
            if (voteInfo) {
                const total = voteInfo.upVotes + voteInfo.downVotes;
                const percent = total > 0 ? Math.round((voteInfo.upVotes / total) * 100) : 100;
                card.querySelector('.game-approval').innerText = `👍 ${percent}% Approval`;
            }

            // 3. Busca de Banners (Ajustado para usar a API de Thumbnails correta)
            const mediaRes = await fetch(`${proxy}https://games.roblox.com/v2/games/${game.id}/media?fetchAllExperienceRelatedMedia=true`);
            const mediaData = await mediaRes.json();
            const container = card.querySelector('.banner-container');
            container.innerHTML = ''; // Limpa o estado de loading

            if (mediaData.data && mediaData.data.length > 0) {
                const images = mediaData.data.filter(item => item.assetTypeId === 1);
                
                // Para garantir que as imagens carreguem, usamos o endpoint de batch da Thumbnails API
                const assetIds = images.map(img => img.imageId).join(',');
                const thumbRes = await fetch(`${proxy}https://thumbnails.roblox.com/v1/assets?assetIds=${assetIds}&size=768x432&format=Png&isCircular=false`);
                const thumbData = await thumbRes.json();

                thumbData.data.forEach((thumb, idx) => {
                    const slide = document.createElement('div');
                    slide.className = `banner-slide ${idx === 0 ? 'active' : ''}`;
                    slide.style.backgroundImage = `url('${thumb.imageUrl}')`;
                    container.appendChild(slide);
                });
                
                if (images.length > 0) initSlider(card);
            } else {
                // Fallback para o ícone caso não existam banners configurados
                const iconRes = await fetch(`${proxy}https://thumbnails.roblox.com/v1/games/icons?universeIds=${game.id}&size=512x512&format=Png&isCircular=false`);
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
        console.error("Erro Roblox:", e); 
    }
}

document.addEventListener('DOMContentLoaded', fetchRobloxData);
