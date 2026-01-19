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

// IDs dos Universos fornecidos
const universeIds = ["996458434", "6713567019", "8949221887"];
// Proxy para evitar erro de CORS no navegador
const proxy = "https://corsproxy.io/?";

// Função para formatar números grandes (ex: 1200500 -> 1.2M)
function formatNumbers(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num;
}

async function fetchRobloxData() {
    try {
        // 1. Busca Detalhes Básicos (Nome e Visitas)
        const detailsRes = await fetch(`${proxy}https://games.roblox.com/v1/games?universeIds=${universeIds.join(',')}`);
        const detailsData = await detailsRes.json();

        // 2. Busca Dados de Votação (Likes e Dislikes)
        const votesRes = await fetch(`${proxy}https://games.roblox.com/v1/games/votes?universeIds=${universeIds.join(',')}`);
        const votesData = await votesRes.json();

        // 3. Busca as Thumbnails (Ícones dos jogos)
        const thumbRes = await fetch(`${proxy}https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeIds.join(',')}&returnPolicy=PlaceHolder&size=512x512&format=Png&isCircular=false`);
        const thumbData = await thumbRes.json();

        // Mapeia e aplica os dados em cada Card
        detailsData.data.forEach((game) => {
            const card = document.getElementById(`game-${game.id}`);
            
            if (card) {
                // Atualiza o Título
                const nameElement = card.querySelector('.game-name');
                if (nameElement) nameElement.innerText = game.name;
                
                // Atualiza as Visitas (Formatadas)
                const visitsElement = card.querySelector('.game-visits');
                if (visitsElement) visitsElement.innerText = `👁️ ${formatNumbers(game.visits)} Visits`;

                // Calcula e atualiza a % de Aprovação
                const voteInfo = votesData.data.find(v => v.id === game.id);
                const approvalElement = card.querySelector('.game-approval');
                if (voteInfo && approvalElement) {
                    const totalVotes = voteInfo.upVotes + voteInfo.downVotes;
                    const percent = totalVotes > 0 ? Math.round((voteInfo.upVotes / totalVotes) * 100) : 100;
                    approvalElement.innerText = `👍 ${percent}% Approval`;
                }

                // Atualiza a Imagem de Fundo (Thumbnail)
                const imgInfo = thumbData.data.find(t => t.targetId === game.id);
                const thumbDiv = card.querySelector('.game-thumb');
                if (imgInfo && thumbDiv) {
                    thumbDiv.style.backgroundImage = `url('${imgInfo.imageUrl}')`;
                    thumbDiv.style.backgroundSize = 'cover';
                }
            }
        });
    } catch (error) {
        console.error("Erro ao carregar dados do Roblox:", error);
    }
}

// Inicia a busca assim que o DOM estiver pronto
document.addEventListener('DOMContentLoaded', fetchRobloxData);
