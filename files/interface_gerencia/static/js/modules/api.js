export async function postJson(endpoint, body = {}) {
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!response.ok) {
            throw new Error(`Erro na rede: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Falha ao buscar dados de ${endpoint}:`, error);
    }
}

export async function getJson(endpoint) {
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error(`Erro na rede: ${response.statusText}`);
    return response.json();
}

