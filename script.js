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
    // 1. Extrai os Universe IDs do HTML (isso continua igual)
    const gameCards = document.querySelectorAll('.game-card');
    const universeIds = [];
    gameCards.forEach(card => {
        const universeId = card.id.replace('game-', '');
        if (universeId) universeIds.push(universeId);
    });

    if (universeIds.length === 0) return;

    const idsString = universeIds.join(',');

    try {
        // 2. Busca todos os dados em paralelo para máxima velocidade
        const [
            namesMap,       // Nomes em inglês da nossa API segura
            detailsData,    // Visitas, data, etc da API pública
            votesData,      // Votos da API pública
            iconsData       // Ícones da API pública
        ] = await Promise.all([
            fetch(`/api/roblox-data?ids=${idsString}`).then(res => res.json()),
            fetch(`${proxy}${encodeURIComponent('https://games.roblox.com/v1/games?universeIds=' + idsString)}`).then(res => res.json()),
            fetch(`${proxy}${encodeURIComponent('https://games.roblox.com/v1/games/votes?universeIds=' + idsString)}`).then(res => res.json()),
            fetch(`${proxy}${encodeURIComponent('https://thumbnails.roblox.com/v1/games/icons?universeIds=' + idsString + '&size=512x512&format=Png&isCircular=false')}`).then(res => res.json())
        ]);

        // 3. Combina os dados e atualiza a página
        for (const game of detailsData.data) {
            const card = document.getElementById(`game-${game.id}`);
            if (!card) continue;

            // Pega o nome em inglês do nosso mapa, ou usa o nome traduzido como fallback
            const englishName = namesMap[game.id] || game.name;
            card.querySelector('.game-name').innerText = englishName;

            // O resto dos dados vem das APIs públicas, como antes
            card.querySelector('.game-visits .stat-text').innerText = `${formatNumbers(game.visits)} Visits`;
            card.querySelector('.game-genre .stat-text').innerText = `${game.genre_l1 || game.genre || "Experience"}`;
            card.querySelector('.game-date .stat-text').innerText = `${formatCreationDate(game.created)}`;

            const voteInfo = votesData.data.find(v => v.id === game.id);
            if (voteInfo) {
                const total = voteInfo.upVotes + voteInfo.downVotes;
                const percent = total > 0 ? Math.round((voteInfo.upVotes / total) * 100) : 100;
                card.querySelector('.game-approval .stat-text').innerText = `${percent}% Approval`;
            }

            const iconInfo = iconsData.data.find(i => i.targetId === game.id);
            const thumbContainer = card.querySelector('.game-thumb');
            if (iconInfo && iconInfo.imageUrl) {
                thumbContainer.style.backgroundImage = `url('${iconInfo.imageUrl}')`;
            } else {
                thumbContainer.style.backgroundColor = '#222';
            }
        }
    } catch (e) { 
        console.error("Erro ao buscar e combinar os dados dos jogos:", e); 
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