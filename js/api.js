// URL base da API
const API_URL = 'http://localhost:8000';
const DEV_MODE = true; // Definir como false em produção

// Função para obter token de autenticação do sessionStorage
function getAuthToken() {
    // Tentar obter token do sessionStorage primeiro
    let usuarioLogado = JSON.parse(sessionStorage.getItem('usuarioLogado') || '{}');

    // Se não encontrar no sessionStorage, tentar no localStorage
    if (!usuarioLogado.token) {
        usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado') || '{}');
    }

    // Para debug, vamos imprimir o token no console
    console.log('Token de autenticação:', usuarioLogado.token);

    return usuarioLogado.token || '';
}

// Função para obter todos os deslocamentos
async function getDeslocamentos() {
    try {
        // Modo de desenvolvimento - retorna dados fictícios
        if (DEV_MODE) {
            console.warn('MODO DEV: Retornando deslocamentos fictícios');

            // Aguardar um pouco para simular tempo de resposta
            await new Promise(resolve => setTimeout(resolve, 500));

            // Dados fictícios para desenvolvimento
            return [
                {
                    id: 1,
                    origem: "Base Central",
                    destino: "Cliente XYZ",
                    km_inicial: 10200,
                    km_final: 10250,
                    distancia_percorrida: 50,
                    data_inicio: "2025-05-08T08:30:00",
                    data_fim: "2025-05-08T12:45:00"
                },
                {
                    id: 2,
                    origem: "Cliente ABC",
                    destino: "Base Central",
                    km_inicial: 10250,
                    km_final: 10300,
                    distancia_percorrida: 50,
                    data_inicio: "2025-05-08T13:15:00",
                    data_fim: "2025-05-08T17:30:00"
                }
            ];
        }

        // Código normal de produção
        const response = await fetch(`${API_URL}/deslocamentos`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.mensagem || 'Erro ao obter deslocamentos');
        }

        return await response.json();
    } catch (error) {
        console.error('Erro ao buscar deslocamentos:', error);

        // Em modo de desenvolvimento, retornar dados fictícios mesmo com erro
        if (DEV_MODE) {
            console.warn('MODO DEV: Retornando dados fictícios apesar do erro');
            return [
                {
                    id: 1,
                    origem: "Base Central",
                    destino: "Cliente XYZ",
                    km_inicial: 10200,
                    km_final: 10250,
                    distancia_percorrida: 50,
                    data_inicio: "2025-05-08T08:30:00",
                    data_fim: "2025-05-08T12:45:00"
                },
                {
                    id: 2,
                    origem: "Cliente ABC",
                    destino: "Base Central",
                    km_inicial: 10250,
                    km_final: 10300,
                    distancia_percorrida: 50,
                    data_inicio: "2025-05-08T13:15:00",
                    data_fim: "2025-05-08T17:30:00"
                }
            ];
        }

        throw error;
    }
}

// Função para criar um novo deslocamento
async function createDeslocamento(dadosDeslocamento) {
    try {
        // Modo de desenvolvimento - simula operação de sucesso
        if (DEV_MODE) {
            console.warn('MODO DEV: Simulando criação de deslocamento');

            // Aguardar um pouco para simular tempo de resposta do servidor
            await new Promise(resolve => setTimeout(resolve, 500));

            return {
                id: Math.floor(Math.random() * 1000) + 1,
                ...dadosDeslocamento,
                mensagem: 'Deslocamento criado com sucesso (modo DEV)'
            };
        }

        // Código normal de produção
        const response = await fetch(`${API_URL}/deslocamentos`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dadosDeslocamento)
        });

        // Adicionar debug para resposta do servidor
        console.log('Status da resposta:', response.status);
        const responseData = await response.json();
        console.log('Resposta completa:', responseData);

        if (!response.ok) {
            throw new Error(responseData.mensagem || 'Erro ao criar deslocamento');
        }

        return responseData;
    } catch (error) {
        console.error('Erro ao criar deslocamento:', error);

        // Em modo de desenvolvimento, retornar dados fictícios mesmo com erro
        if (DEV_MODE) {
            console.warn('MODO DEV: Retornando dados fictícios apesar do erro');
            return {
                id: Math.floor(Math.random() * 1000) + 1,
                ...dadosDeslocamento,
                mensagem: 'Deslocamento criado com sucesso (modo DEV após erro)'
            };
        }

        throw error;
    }
}

// Função para atualizar um deslocamento existente
async function updateDeslocamento(id, dadosDeslocamento) {
    try {
        const response = await fetch(`${API_URL}/deslocamentos/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dadosDeslocamento)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.mensagem || 'Erro ao atualizar deslocamento');
        }

        return await response.json();
    } catch (error) {
        console.error('Erro ao atualizar deslocamento:', error);
        throw error;
    }
}

// Função para obter detalhes de um deslocamento específico
async function getDeslocamentoById(id) {
    try {
        const response = await fetch(`${API_URL}/deslocamentos/${id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.mensagem || 'Erro ao obter deslocamento');
        }

        return await response.json();
    } catch (error) {
        console.error(`Erro ao buscar deslocamento ID ${id}:`, error);
        throw error;
    }
}

// Função para obter operações de um deslocamento
async function getOperacoesByDeslocamento(deslocamentoId) {
    try {
        const response = await fetch(`${API_URL}/deslocamentos/${deslocamentoId}/operacoes`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.mensagem || 'Erro ao obter operações');
        }

        return await response.json();
    } catch (error) {
        console.error('Erro ao buscar operações do deslocamento:', error);
        throw error;
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const btnLogin = document.getElementById('btnLogin');
    const togglePassword = document.getElementById('togglePassword');
    const senhaInput = document.getElementById('senha');
    const auxiliarModal = document.getElementById('auxiliarModal');
    const nomeAuxiliarInput = document.getElementById('nomeAuxiliar');
    const fecharModalAuxiliar = document.getElementById('fecharModalAuxiliar');
    const pularAdicao = document.getElementById('pularAdicao');
    const confirmarAuxiliar = document.getElementById('confirmarAuxiliar');

    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const matricula = document.getElementById('matricula').value;
            const senha = senhaInput.value;

            if (!matricula || !senha) {
                alert('Por favor, preencha todos os campos!');
                return;
            }

            btnLogin.disabled = true;
            btnLogin.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Entrando...';

            try {
                const respostaLogin = await fazerLogin(matricula, senha);

                const dadosUsuario = {
                    nome: respostaLogin.nome,
                    matricula: respostaLogin.matricula,
                    token: respostaLogin.token,
                    dataLogin: new Date().toISOString()
                };
                sessionStorage.setItem('usuarioLogado', JSON.stringify(dadosUsuario));

                if (auxiliarModal) {
                    console.log('[login.js] Mostrando modal de auxiliar.');
                    auxiliarModal.style.display = 'flex';
                } else {
                    window.location.replace('index.html');
                }

            } catch (error) {
                console.error('[login.js] Erro no login:', error);
                alert(`Falha no login: ${error.message}`);
                btnLogin.disabled = false;
                btnLogin.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar';
            }
        });
    }

    if (togglePassword && senhaInput) {
        togglePassword.addEventListener('click', function () {
            const type = senhaInput.getAttribute('type') === 'password' ? 'text' : 'password';
            senhaInput.setAttribute('type', type);
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }

    if (fecharModalAuxiliar) {
        fecharModalAuxiliar.addEventListener('click', function () {
            if (auxiliarModal) auxiliarModal.style.display = 'none';
            window.location.replace('index.html');
        });
    }
    if (pularAdicao) {
        pularAdicao.addEventListener('click', function () {
            if (auxiliarModal) auxiliarModal.style.display = 'none';
            window.location.replace('index.html');
        });
    }
    if (confirmarAuxiliar && nomeAuxiliarInput) {
        confirmarAuxiliar.addEventListener('click', function () {
            const nomeAux = nomeAuxiliarInput.value.trim();
            if (nomeAux) {
                const dadosUsuario = JSON.parse(sessionStorage.getItem('usuarioLogado') || '{}');
                dadosUsuario.auxiliar = nomeAux;
                sessionStorage.setItem('usuarioLogado', JSON.stringify(dadosUsuario));
            }
            if (auxiliarModal) auxiliarModal.style.display = 'none';
            window.location.replace('index.html');
        });
    }
});