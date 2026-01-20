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

// Adicionando um timestamp ao proxy para evitar cache viciado
const proxy = "https://corsproxy.io/?cache=" + new Date().getTime() + "&url=";

function formatNumbers(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num;
}

function formatCreationDate(isoString) {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

async function fetchRobloxData() {
    // 1. Extrai os IDs dinamicamente do HTML
    const gameCards = document.querySelectorAll('.game-card');
    const placeIds = [];
    const universeIds = [];

    gameCards.forEach(card => {
        const href = card.getAttribute('href');
        const placeIdMatch = href.match(/games\/(\d+)/); // Extrai o número (placeId) da URL

        if (placeIdMatch && placeIdMatch[1]) {
            placeIds.push(placeIdMatch[1]);
        }
        
        // Extrai o universeId do ID do card (formato: "game-UNIVERSEID")
        const universeId = card.id.replace('game-', '');
        if (universeId) {
            universeIds.push(universeId);
        }
    });

    if (universeIds.length === 0 || placeIds.length === 0) {
        console.error("Nenhum ID de jogo encontrado nos cards.");
        return;
    }

    try {
        // 2. Faz as chamadas de API
        // Chamada NOVA para pegar 'sourceName' usando placeIds
        const placeDetailsRes = await fetch(`${proxy}${encodeURIComponent('https://games.roblox.com/v1/games/multiget-place-details?placeIds=' + placeIds.join(','))}`);
        const placeDetailsData = await placeDetailsRes.json();

        // Chamadas EXISTENTES para estatísticas e ícones usando universeIds
        const detailsRes = await fetch(`${proxy}${encodeURIComponent('https://games.roblox.com/v1/games?universeIds=' + universeIds.join(','))}`);
        const detailsData = await detailsRes.json();

        const votesRes = await fetch(`${proxy}${encodeURIComponent('https://games.roblox.com/v1/games/votes?universeIds=' + universeIds.join(','))}`);
        const votesData = await votesRes.json();

        const iconsRes = await fetch(`${proxy}${encodeURIComponent('https://thumbnails.roblox.com/v1/games/icons?universeIds=' + universeIds.join(',') + '&size=512x512&format=Png&isCircular=false')}`);
        const iconsData = await iconsRes.json();

        // 3. Combina os dados e atualiza a página
        for (const game of detailsData.data) {
            const card = document.getElementById(`game-${game.id}`);
            if (!card) continue;

            // Encontra os detalhes do "place" correspondentes usando o universeId
            const placeDetail = placeDetailsData.find(pd => pd.universeId === game.id);
            
            // Prioriza o 'sourceName', se não existir, usa o 'name' normal
            const displayName = placeDetail && placeDetail.sourceName ? placeDetail.sourceName : game.name;
            card.querySelector('.game-name').innerText = displayName;

            // O resto das informações continua igual
            card.querySelector('.game-visits .stat-text').innerText = `${formatNumbers(game.visits)} Visits`;
            
            const genreText = game.genre_l1 || game.genre || "Experience";
            card.querySelector('.game-genre .stat-text').innerText = `${genreText}`;

            card.querySelector('.game-date .stat-text').innerText = `${formatCreationDate(game.created)}`;

            const voteInfo = votesData.data.find(v => v.id === game.id);
            if (voteInfo) {
                const total = voteInfo.upVotes + voteInfo.downVotes;
                const percent = total > 0 ? Math.round((voteInfo.upVotes / total) * 100) : 100;
                card.querySelector('.game-approval .stat-text').innerText = `${percent}% Approval`;
            }

            const thumbContainer = card.querySelector('.game-thumb');
            const iconInfo = iconsData.data.find(i => i.targetId === game.id);

            if (iconInfo && iconInfo.imageUrl) {
                thumbContainer.style.backgroundImage = `url('${iconInfo.imageUrl}')`;
            } else {
                thumbContainer.style.backgroundColor = '#222';
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
    document.addEventListener('contextmenu', (e) => e.preventDefault());
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