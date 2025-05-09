// URL base da API
const API_URL = 'http://localhost:8000';

// Função para obter token de autenticação do sessionStorage
function getAuthToken() {
    try {
        // Tentar obter token do sessionStorage primeiro
        let usuarioLogado = JSON.parse(sessionStorage.getItem('usuarioLogado') || '{}');

        // Se não encontrar no sessionStorage, tentar no localStorage
        if (!usuarioLogado.token) {
            usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado') || '{}');
        }

        // Verificar se o token existe e retorná-lo
        if (usuarioLogado && usuarioLogado.token) {
            console.log("Token obtido com sucesso:", usuarioLogado.token.substring(0, 10) + "...");
            return usuarioLogado.token;
        } else {
            console.warn("Nenhum token encontrado no armazenamento");
            return null;
        }
    } catch (error) {
        console.error("Erro ao obter token:", error);
        return null;
    }
}

/**
 * Função para realizar login no sistema
 * @param {string} matricula - Matrícula do usuário
 * @param {string} senha - Senha do usuário
 * @returns {Promise<Object>} - Promessa resolvida com os dados do usuário e token
 */
async function login(matricula, senha) {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ matricula, senha })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.mensagem || 'Erro ao fazer login');
        }

        const data = await response.json();
        
        // Salvar dados do usuário no sessionStorage
        const usuarioLogado = {
            token: data.token,
            nome: data.nome,
            matricula: data.matricula,
            id: data.id || matricula,
            auxiliar: '' // Será adicionado depois na tela de auxiliar
        };
        
        sessionStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
        
        return data;
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        throw error;
    }
}

/**
 * Função para salvar um deslocamento no banco de dados
 * @param {Object} deslocamento - Objeto contendo dados do deslocamento
 * @returns {Promise<Object>} - Promessa resolvida com o deslocamento salvo
 */
async function saveDeslocamento(deslocamento) {
    try {
        const token = getAuthToken();
        
        // Log para debugging
        console.log("Salvando deslocamento com token:", token ? "Token presente" : "Token ausente");
        
        if (!token) {
            console.warn("Token não encontrado, salvando offline");
            // Salvar localmente quando não há token
            const deslocamentosOffline = JSON.parse(localStorage.getItem('deslocamentosOffline') || '[]');
            const deslocamentoTemp = {
                ...deslocamento,
                id: `temp-${Date.now()}`,
                pendenteSincronizacao: true
            };
            deslocamentosOffline.push(deslocamentoTemp);
            localStorage.setItem('deslocamentosOffline', JSON.stringify(deslocamentosOffline));
            return deslocamentoTemp;
        }
        
        // Tentar fazer a requisição com o token
        const response = await fetch(`${API_URL}/deslocamentos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(deslocamento)
        });
        
        // Log para debugging
        console.log("Resposta da API:", response.status, response.statusText);
        
        if (!response.ok) {
            // Para facilitar o debugging, tentar ler a mensagem de erro
            let errorDetail = "";
            try {
                const errorData = await response.json();
                errorDetail = errorData.mensagem || errorData.message || response.statusText;
            } catch (e) {
                errorDetail = response.statusText;
            }
            
            // Se o servidor estiver offline ou retornar erro de autorização
            if (!navigator.onLine || response.status >= 500 || response.status === 401) {
                console.warn(`Servidor indisponível ou erro de autenticação (${response.status}), salvando deslocamento localmente`);
                const deslocamentosOffline = JSON.parse(localStorage.getItem('deslocamentosOffline') || '[]');
                const deslocamentoTemp = {
                    ...deslocamento,
                    id: `temp-${Date.now()}`,
                    pendenteSincronizacao: true
                };
                deslocamentosOffline.push(deslocamentoTemp);
                localStorage.setItem('deslocamentosOffline', JSON.stringify(deslocamentosOffline));
                
                // Se for erro de autenticação, redirecionar para o login
                if (response.status === 401) {
                    alert("Sua sessão expirou. Você será redirecionado para fazer login novamente.");
                    sessionStorage.removeItem('usuarioLogado');
                    setTimeout(() => {
                        window.location.href = 'login.html?status=expired';
                    }, 1000);
                }
                
                return deslocamentoTemp;
            }
            
            throw new Error(errorDetail || `Erro ao salvar deslocamento: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Deslocamento salvo com sucesso:', data);
        return data;
    } catch (error) {
        console.error('Erro ao salvar deslocamento:', error);
        
        // Em caso de erro de rede, salvar offline
        if (!navigator.onLine || error.message.includes('Failed to fetch')) {
            console.warn('Erro de conexão, salvando deslocamento localmente');
            const deslocamentosOffline = JSON.parse(localStorage.getItem('deslocamentosOffline') || '[]');
            const deslocamentoTemp = {
                ...deslocamento,
                id: `temp-${Date.now()}`,
                pendenteSincronizacao: true
            };
            deslocamentosOffline.push(deslocamentoTemp);
            localStorage.setItem('deslocamentosOffline', JSON.stringify(deslocamentosOffline));
            return deslocamentoTemp;
        }
        
        throw error;
    }
}

/**
 * Função para buscar deslocamentos do banco de dados
 * @param {string} startDate - Data inicial (opcional)
 * @param {string} endDate - Data final (opcional)
 * @returns {Promise<Array>} - Promessa resolvida com array de deslocamentos
 */
async function getDeslocamentos(startDate = null, endDate = null) {
    try {
        const token = getAuthToken();
        
        if (!token) {
            throw new Error('Usuário não autenticado');
        }
        
        // Construir URL com parâmetros de consulta
        let url = `${API_URL}/deslocamentos`;
        const params = new URLSearchParams();
        
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erro ao buscar deslocamentos: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Combinar com os deslocamentos offline que ainda não foram sincronizados
        const deslocamentosOffline = JSON.parse(localStorage.getItem('deslocamentosOffline') || '[]');
        
        const resultado = [...data, ...deslocamentosOffline];
        
        // Filtrar por intervalo de datas se especificado
        let filtrados = resultado;
        if (startDate && endDate) {
            filtrados = filtrados.filter(d => {
                const dataDeslocamento = new Date(d.data_inicio);
                const dataInicio = new Date(startDate);
                const dataFim = new Date(endDate);
                dataFim.setDate(dataFim.getDate() + 1); // Incluir o último dia
                
                return dataDeslocamento >= dataInicio && dataDeslocamento < dataFim;
            });
        }
        
        console.log('Deslocamentos encontrados:', filtrados);
        return filtrados;
    } catch (error) {
        console.error('Erro ao buscar deslocamentos:', error);
        
        // Em caso de erro de rede, retornar dados do localStorage
        if (!navigator.onLine || error.message.includes('Failed to fetch')) {
            console.warn('Erro de conexão, retornando deslocamentos do armazenamento local');
            const deslocamentosOffline = JSON.parse(localStorage.getItem('deslocamentosOffline') || '[]');
            
            // Filtrar por intervalo de datas se especificado
            if (startDate && endDate) {
                return deslocamentosOffline.filter(d => {
                    const dataDeslocamento = new Date(d.data_inicio);
                    const dataInicio = new Date(startDate);
                    const dataFim = new Date(endDate);
                    dataFim.setDate(dataFim.getDate() + 1); // Incluir o último dia
                    
                    return dataDeslocamento >= dataInicio && dataDeslocamento < dataFim;
                });
            }
            
            return deslocamentosOffline;
        }
        
        throw error;
    }
}

/**
 * Função para salvar uma operação no banco de dados
 * @param {Object} operacao - Objeto contendo dados da operação
 * @returns {Promise<Object>} - Promessa resolvida com a operação salva
 */
async function saveOperacao(operacao) {
    try {
        const token = getAuthToken();
        
        if (!token) {
            throw new Error('Usuário não autenticado');
        }
        
        const response = await fetch(`${API_URL}/operacoes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(operacao)
        });
        
        if (!response.ok) {
            // Se o servidor estiver offline, salvar temporariamente no localStorage
            if (!navigator.onLine || response.status >= 500) {
                console.warn('Servidor indisponível, salvando operação localmente');
                const operacoesOffline = JSON.parse(localStorage.getItem('operacoesOffline') || '[]');
                const operacaoTemp = {
                    ...operacao,
                    id: `temp-${Date.now()}`,
                    pendenteSincronizacao: true
                };
                operacoesOffline.push(operacaoTemp);
                localStorage.setItem('operacoesOffline', JSON.stringify(operacoesOffline));
                return operacaoTemp;
            }
            
            const errorData = await response.json();
            throw new Error(errorData.mensagem || `Erro ao salvar operação: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Operação salva com sucesso:', data);
        return data;
    } catch (error) {
        console.error('Erro ao salvar operação:', error);
        
        // Em caso de erro de rede, salvar offline
        if (!navigator.onLine || error.message.includes('Failed to fetch')) {
            console.warn('Erro de conexão, salvando operação localmente');
            const operacoesOffline = JSON.parse(localStorage.getItem('operacoesOffline') || '[]');
            const operacaoTemp = {
                ...operacao,
                id: `temp-${Date.now()}`,
                pendenteSincronizacao: true
            };
            operacoesOffline.push(operacaoTemp);
            localStorage.setItem('operacoesOffline', JSON.stringify(operacoesOffline));
            return operacaoTemp;
        }
        
        throw error;
    }
}

/**
 * Função para buscar operações do banco de dados
 * @param {string} startDate - Data inicial (opcional)
 * @param {string} endDate - Data final (opcional)
 * @returns {Promise<Array>} - Promessa resolvida com array de operações
 */
async function getOperacoes(startDate = null, endDate = null) {
    try {
        const token = getAuthToken();
        
        if (!token) {
            throw new Error('Usuário não autenticado');
        }
        
        // Construir URL com parâmetros de consulta
        let url = `${API_URL}/operacoes`;
        const params = new URLSearchParams();
        
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erro ao buscar operações: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Combinar com as operações offline que ainda não foram sincronizadas
        const operacoesOffline = JSON.parse(localStorage.getItem('operacoesOffline') || '[]');
        
        const resultado = [...data, ...operacoesOffline];
        
        // Filtrar por intervalo de datas se especificado
        let filtrados = resultado;
        if (startDate && endDate) {
            filtrados = filtrados.filter(op => {
                const dataOperacao = new Date(op.inicio_operacao);
                const dataInicio = new Date(startDate);
                const dataFim = new Date(endDate);
                dataFim.setDate(dataFim.getDate() + 1); // Incluir o último dia
                
                return dataOperacao >= dataInicio && dataOperacao < dataFim;
            });
        }
        
        console.log('Operações encontradas:', filtrados);
        return filtrados;
    } catch (error) {
        console.error('Erro ao buscar operações:', error);
        
        // Em caso de erro de rede, retornar dados do localStorage
        if (!navigator.onLine || error.message.includes('Failed to fetch')) {
            console.warn('Erro de conexão, retornando operações do armazenamento local');
            const operacoesOffline = JSON.parse(localStorage.getItem('operacoesOffline') || '[]');
            
            // Filtrar por intervalo de datas se especificado
            if (startDate && endDate) {
                return operacoesOffline.filter(op => {
                    const dataOperacao = new Date(op.inicio_operacao);
                    const dataInicio = new Date(startDate);
                    const dataFim = new Date(endDate);
                    dataFim.setDate(dataFim.getDate() + 1); // Incluir o último dia
                    
                    return dataOperacao >= dataInicio && dataOperacao < dataFim;
                });
            }
            
            return operacoesOffline;
        }
        
        throw error;
    }
}

/**
 * Função para tentar sincronizar dados offline com o servidor
 * Deve ser chamada periodicamente ou quando a conexão for restabelecida
 */
async function sincronizarDadosOffline() {
    if (!navigator.onLine) {
        console.log('Dispositivo offline, sincronização adiada');
        return;
    }
    
    const token = getAuthToken();
    if (!token) {
        console.log('Usuário não autenticado, sincronização adiada');
        return;
    }
    
    try {
        // Sincronizar deslocamentos
        const deslocamentosOffline = JSON.parse(localStorage.getItem('deslocamentosOffline') || '[]');
        if (deslocamentosOffline.length > 0) {
            console.log(`Tentando sincronizar ${deslocamentosOffline.length} deslocamentos offline`);
            
            const deslocamentosSincronizados = [];
            
            for (const deslocamento of deslocamentosOffline) {
                try {
                    // Remover propriedades temporárias
                    const { id, pendenteSincronizacao, ...dadosDeslocamento } = deslocamento;
                    
                    const response = await fetch(`${API_URL}/deslocamentos`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(dadosDeslocamento)
                    });
                    
                    if (response.ok) {
                        deslocamentosSincronizados.push(deslocamento);
                        console.log(`Deslocamento ${id} sincronizado com sucesso`);
                    }
                } catch (err) {
                    console.error(`Erro ao sincronizar deslocamento ${deslocamento.id}:`, err);
                }
            }
            
            // Remover os deslocamentos sincronizados da lista offline
            if (deslocamentosSincronizados.length > 0) {
                const deslocamentosRestantes = deslocamentosOffline.filter(
                    d => !deslocamentosSincronizados.some(s => s.id === d.id)
                );
                localStorage.setItem('deslocamentosOffline', JSON.stringify(deslocamentosRestantes));
                console.log(`${deslocamentosSincronizados.length} deslocamentos sincronizados, ${deslocamentosRestantes.length} restantes`);
            }
        }
        
        // Sincronizar operações
        const operacoesOffline = JSON.parse(localStorage.getItem('operacoesOffline') || '[]');
        if (operacoesOffline.length > 0) {
            console.log(`Tentando sincronizar ${operacoesOffline.length} operações offline`);
            
            const operacoesSincronizadas = [];
            
            for (const operacao of operacoesOffline) {
                try {
                    // Remover propriedades temporárias
                    const { id, pendenteSincronizacao, ...dadosOperacao } = operacao;
                    
                    const response = await fetch(`${API_URL}/operacoes`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(dadosOperacao)
                    });
                    
                    if (response.ok) {
                        operacoesSincronizadas.push(operacao);
                        console.log(`Operação ${id} sincronizada com sucesso`);
                    }
                } catch (err) {
                    console.error(`Erro ao sincronizar operação ${operacao.id}:`, err);
                }
            }
            
            // Remover as operações sincronizadas da lista offline
            if (operacoesSincronizadas.length > 0) {
                const operacoesRestantes = operacoesOffline.filter(
                    o => !operacoesSincronizadas.some(s => s.id === o.id)
                );
                localStorage.setItem('operacoesOffline', JSON.stringify(operacoesRestantes));
                console.log(`${operacoesSincronizadas.length} operações sincronizadas, ${operacoesRestantes.length} restantes`);
            }
        }
    } catch (error) {
        console.error('Erro durante a sincronização de dados offline:', error);
    }
}

// Exportar as funções para uso em outros arquivos
window.api = {
    login,
    getDeslocamentos,
    saveDeslocamento,
    getOperacoes,
    saveOperacao,
    sincronizarDadosOffline
};

// Tentar sincronizar dados offline quando a conexão for restabelecida
window.addEventListener('online', function() {
    console.log('Conexão restabelecida, iniciando sincronização...');
    sincronizarDadosOffline();
});

// Configurar sincronização periódica (a cada 5 minutos)
setInterval(sincronizarDadosOffline, 5 * 60 * 1000);

// Executar sincronização quando o script for carregado
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(sincronizarDadosOffline, 5000); // Atraso de 5 segundos para garantir que a página carregou completamente
});