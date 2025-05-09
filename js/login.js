document.addEventListener('DOMContentLoaded', function () {
    console.log('[login.js] Página de login carregada');

    // Elementos DOM
    const loginForm = document.getElementById('loginForm');
    const matriculaInput = document.getElementById('matricula');
    const senhaInput = document.getElementById('senha');
    const lembrarCheckbox = document.getElementById('lembrar');
    const errorMessage = document.getElementById('errorMessage');
    const togglePassword = document.getElementById('togglePassword');
    const auxiliarModal = document.getElementById('auxiliarModal');
    const nomeAuxiliarInput = document.getElementById('nomeAuxiliar');
    const confirmarAuxiliar = document.getElementById('confirmarAuxiliar');
    const pularAuxiliar = document.getElementById('pularAuxiliar');
    const esqueciSenha = document.getElementById('esqueciSenha');

    // Função para sanitizar entradas
    function sanitizeInput(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }

    // Verificar se o usuário já está logado
    function verificarSeJaLogado() {
        console.log('[login.js] Verificando se já está logado...');
        const usuarioLogado = sessionStorage.getItem('usuarioLogado');

        if (usuarioLogado) {
            try {
                const dadosUsuario = JSON.parse(usuarioLogado);
                const dataLogin = new Date(dadosUsuario.dataLogin);
                const agora = new Date();
                const vinteQuatroHorasEmMs = 24 * 60 * 60 * 1000;

                if (agora - dataLogin < vinteQuatroHorasEmMs) {
                    console.log('[login.js] Usuário já logado e token válido. Redirecionando para index.html.');
                    window.location.replace('index.html');
                    return true;
                } else {
                    console.log('[login.js] Token expirado. Removendo dados.');
                    sessionStorage.removeItem('usuarioLogado');
                }
            } catch (e) {
                console.error('[login.js] Erro ao verificar login:', e);
                sessionStorage.removeItem('usuarioLogado');
            }
        }

        console.log('[login.js] Nenhum usuário logado válido encontrado.');
        return false;
    }

    // Se já estiver logado, redirecionar
    if (verificarSeJaLogado()) return;

    // Mostrar/ocultar senha
    if (togglePassword && senhaInput) {
        togglePassword.addEventListener('click', function () {
            const type = senhaInput.getAttribute('type') === 'password' ? 'text' : 'password';
            senhaInput.setAttribute('type', type);

            const icon = this.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    }

    // Link "Esqueci minha senha"
    if (esqueciSenha) {
        esqueciSenha.addEventListener('click', function (e) {
            e.preventDefault();
            alert('Entre em contato com o administrador do sistema para redefinir sua senha.');
        });
    }

    // Processar login
    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            // Esconder mensagens de erro anteriores
            if (errorMessage) {
                errorMessage.style.display = 'none';
            }
            
            const matricula = matriculaInput.value.trim();
            const senha = senhaInput.value.trim();
            
            if (!matricula || !senha) {
                mostrarErro('Por favor, preencha todos os campos');
                return;
            }
            
            try {
                // Mostrar indicador de carregamento
                loginForm.classList.add('loading');
                
                // Fazer login diretamente com a API Flask
                const response = await fetch('http://localhost:8000/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ matricula, senha })
                });
                
                // Debug
                console.log("Resposta do login:", response.status);
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.mensagem || 'Falha no login. Verifique suas credenciais.');
                }
                
                const data = await response.json();
                console.log("Dados retornados do login:", data);
                
                // Criar objeto de usuário logado
                const usuarioLogado = {
                    id: data.id || matricula,
                    nome: data.nome || 'Usuário',
                    matricula: data.matricula || matricula,
                    auxiliar: data.auxiliar || '',
                    token: data.token, // Importante! Armazenar o token
                    timestamp: new Date().getTime()
                };
                
                // Debug - verificar conteúdo do objeto
                console.log("Dados do usuário a serem armazenados:", usuarioLogado);
                
                // Salvar dados no sessionStorage
                sessionStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
                
                // Armazenar no localStorage se "lembrar-me" estiver marcado
                if (lembrarCheckbox && lembrarCheckbox.checked) {
                    localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
                }
                
                // Verificar se precisa preencher nome do auxiliar
                if (auxiliarModal) {
                    auxiliarModal.style.display = 'flex';
                } else {
                    // Se não tiver modal de auxiliar, redirecionar direto
                    window.location.replace('index.html');
                }
            } catch (error) {
                console.error('Erro ao fazer login:', error);
                mostrarErro(error.message || 'Falha no login. Verifique suas credenciais.');
            } finally {
                // Remover indicador de carregamento
                loginForm.classList.remove('loading');
            }
        });
    }

    // Configuração do modal de auxiliar
    if (auxiliarModal) {
        // Fechar modal ao clicar fora dele
        auxiliarModal.addEventListener('click', function(event) {
            if (event.target === auxiliarModal) {
                event.preventDefault();
                auxiliarModal.style.display = 'none';
                window.location.replace('index.html');
            }
        });
        
        // Botão confirmar auxiliar
        if (confirmarAuxiliar && nomeAuxiliarInput) {
            confirmarAuxiliar.addEventListener('click', function() {
                const nomeAuxiliar = nomeAuxiliarInput.value.trim();
                
                if (nomeAuxiliar) {
                    try {
                        const usuarioLogado = JSON.parse(sessionStorage.getItem('usuarioLogado') || '{}');
                        usuarioLogado.auxiliar = nomeAuxiliar;
                        sessionStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
                        
                        // Atualizar também no localStorage se necessário
                        if (localStorage.getItem('usuarioLogado')) {
                            localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
                        }
                    } catch (e) {
                        console.error('[login.js] Erro ao salvar nome do auxiliar:', e);
                    }
                }
                
                auxiliarModal.style.display = 'none';
                window.location.replace('index.html');
            });
        }
        
        // Botão pular auxiliar
        if (pularAuxiliar) {
            pularAuxiliar.addEventListener('click', function() {
                auxiliarModal.style.display = 'none';
                window.location.replace('index.html');
            });
        }
    }

    // Verificar URL para mensagens
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');

    if (status) {
        let mensagem = '';

        switch (status) {
            case 'logout':
                mensagem = 'Você saiu do sistema.';
                break;
            case 'expired':
                mensagem = 'Sua sessão expirou. Por favor, faça login novamente.';
                break;
            case 'unauthorized':
                mensagem = 'Acesso não autorizado. Por favor, faça login.';
                break;
            default:
                mensagem = '';
        }

        if (mensagem) {
            mostrarErro(mensagem, 'info');
        }
    }

    // Função para mostrar mensagens de erro
    function mostrarErro(mensagem, tipo = 'error') {
        if (errorMessage) {
            errorMessage.textContent = mensagem;
            errorMessage.className = `message ${tipo}`;
            errorMessage.style.display = 'block';
        } else {
            alert(mensagem);
        }
    }
});

// Função de login - ajustar para armazenar informações do auxiliar
async function realizarLogin(event) {
    event.preventDefault();
    
    const matricula = document.getElementById('matricula').value;
    const senha = document.getElementById('senha').value;
    const lembrarMeCheckbox = document.getElementById('lembrar');
    
    try {
        // Simular chamada de API para autenticação
        // Em produção, isso seria substituído por uma chamada real à API
        const resposta = await simularAutenticacao(matricula, senha);
        
        if (resposta.sucesso) {
            // Dados do usuário a serem armazenados
            const dadosUsuario = {
                id: resposta.usuario.id,
                nome: resposta.usuario.nome,
                matricula: resposta.usuario.matricula,
                auxiliar: resposta.usuario.auxiliar || '',
                token: resposta.token,
                timestamp: new Date().getTime()
            };
            
            // Armazenar no sessionStorage
            sessionStorage.setItem('usuarioLogado', JSON.stringify(dadosUsuario));
            
            // Se "lembrar-me" estiver marcado, armazenar também no localStorage
            if (lembrarMeCheckbox && lembrarMeCheckbox.checked) {
                localStorage.setItem('usuarioLogado', JSON.stringify(dadosUsuario));
            }
            
            // Redirecionar para a página principal ou para a página solicitada anteriormente
            const urlParams = new URLSearchParams(window.location.search);
            const redirect = urlParams.get('redirect') || 'index.html';
            window.location.href = redirect;
        } else {
            exibirMensagemErro(resposta.mensagem || 'Credenciais inválidas');
        }
    } catch (erro) {
        console.error('Erro ao realizar login:', erro);
        exibirMensagemErro('Ocorreu um erro ao tentar fazer login. Tente novamente.');
    }
}

// Função para simular autenticação (seria substituída por chamada real à API)
async function simularAutenticacao(matricula, senha) {
    // Simular um pequeno atraso para emular a requisição à API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Dados simulados de autenticação
    const usuariosValidos = [
        {
            id: 1,
            matricula: '123456',
            senha: '123456',
            nome: 'João Silva',
            auxiliar: 'Maria Oliveira'
        },
        {
            id: 2,
            matricula: 'admin',
            senha: 'admin',
            nome: 'Administrador',
            auxiliar: 'Carlos Santos'
        }
    ];
    
    const usuarioEncontrado = usuariosValidos.find(u => 
        u.matricula === matricula && u.senha === senha
    );
    
    if (usuarioEncontrado) {
        return {
            sucesso: true,
            mensagem: 'Login realizado com sucesso',
            token: 'jwt-token-simulado-' + Date.now(),
            usuario: {
                id: usuarioEncontrado.id,
                nome: usuarioEncontrado.nome,
                matricula: usuarioEncontrado.matricula,
                auxiliar: usuarioEncontrado.auxiliar
            }
        };
    } else {
        return {
            sucesso: false,
            mensagem: 'Matrícula ou senha incorretos'
        };
    }
}