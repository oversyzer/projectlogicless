export async function onRequest(context) {
    const { searchParams } = new URL(context.request.url);
    const universeIds = searchParams.get('ids');
    
    // Pega o cookie que configuramos como um segredo
    const cookie = context.env.ROBLOX_COOKIE; 

    if (!universeIds || !cookie) {
        return new Response(JSON.stringify({ error: 'IDs ou cookie não fornecidos' }), { status: 400 });
    }

    const universeIdsArray = universeIds.split(',');
    
    // Passo 1: Converter Universe IDs para Place IDs usando uma API pública
    const gamesDetailsRes = await fetch(`https://games.roblox.com/v1/games?universeIds=${universeIds}`);
    if (!gamesDetailsRes.ok) {
        return new Response(JSON.stringify({ error: 'Falha ao buscar detalhes dos jogos' }), { status: 500 });
    }
    const gamesDetailsData = await gamesDetailsRes.json();
    
    const placeIdRequests = gamesDetailsData.data.map(game => {
        return {
            universeId: game.id,
            placeId: game.rootPlaceId
        };
    });

    // Mapa para guardar os resultados finais: { universeId: "Nome em Inglês" }
    const namesMap = {};

    // Passo 2: Buscar o nome em inglês para cada Place ID usando a API "develop" com o cookie
    await Promise.all(placeIdRequests.map(async (req) => {
        try {
            const response = await fetch(`https://develop.roblox.com/v2/places/${req.placeId}`, {
                headers: {
                    // É assim que usamos o cookie para autenticação
                    'Cookie': `.ROBLOSECURITY=${cookie}`
                }
            });
            
            if (!response.ok) {
                console.error(`Falha na API Develop para placeId ${req.placeId}: ${response.statusText}`);
                return;
            }

            const data = await response.json();
            
            // A mágica acontece aqui! "data.name" agora vem em inglês.
            if (data.name) {
                // Mapeamos de volta para o Universe ID original, que é o que o front-end usa
                namesMap[req.universeId] = data.name;
            }
        } catch (e) {
            console.error(`Erro ao buscar nome para o placeId ${req.placeId}:`, e);
        }
    }));

    return new Response(JSON.stringify(namesMap), {
        headers: { 'Content-Type': 'application/json' },
    });
}