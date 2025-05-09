document.addEventListener('DOMContentLoaded', function () {
    console.log('[login.js] Página de login carregada');

    // Elementos DOM
    const loginForm = document.getElementById('loginForm');
    const btnLogin = document.getElementById('btnLogin');
    const togglePassword = document.getElementById('togglePassword');
    const senhaInput = document.getElementById('senha');
    const auxiliarModal = document.getElementById('auxiliarModal');
    const nomeAuxiliarInput = document.getElementById('nomeAuxiliar');
    const fecharModalAuxiliar = document.getElementById('fecharModalAuxiliar');
    const pularAdicao = document.getElementById('pularAdicao');
    const confirmarAuxiliar = document.getElementById('confirmarAuxiliar');
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
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const matricula = document.getElementById('matricula').value;
            const senha = document.getElementById('senha').value;

            if (!matricula || !senha) {
                alert('Por favor, preencha todos os campos!');
                return;
            }

            btnLogin.disabled = true;
            btnLogin.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Entrando...';

            // Simular login (para desenvolvimento)
            setTimeout(function () {
                // Credenciais de teste
                if (matricula === '12345' && senha === 'senha123') {
                    console.log('[login.js] Login bem-sucedido!');

                    // Salvar dados do usuário
                    const usuarioLogado = {
                        nome: 'Operador de Teste',
                        matricula: matricula,
                        token: 'token-simulado-' + Date.now(),
                        dataLogin: new Date().toISOString()
                    };

                    sessionStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));

                    // Mostrar modal de auxiliar
                    if (auxiliarModal) {
                        auxiliarModal.style.display = 'flex';
                    } else {
                        window.location.replace('index.html');
                    }
                } else {
                    console.log('[login.js] Credenciais inválidas!');
                    alert('Matrícula ou senha incorretos. Por favor, tente novamente.');
                    btnLogin.disabled = false;
                    btnLogin.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar';
                }
            }, 1000); // Simulação de delay de rede
        });
    }

    // Modal de auxiliar
    if (auxiliarModal) {
        if (fecharModalAuxiliar) {
            fecharModalAuxiliar.addEventListener('click', function () {
                auxiliarModal.style.display = 'none';
                window.location.replace('index.html');
            });
        }

        if (pularAdicao) {
            pularAdicao.addEventListener('click', function () {
                auxiliarModal.style.display = 'none';
                window.location.replace('index.html');
            });
        }

        if (confirmarAuxiliar && nomeAuxiliarInput) {
            confirmarAuxiliar.addEventListener('click', function () {
                const nomeAuxiliar = nomeAuxiliarInput.value.trim();

                if (nomeAuxiliar) {
                    try {
                        const usuarioLogado = JSON.parse(sessionStorage.getItem('usuarioLogado') || '{}');
                        usuarioLogado.auxiliar = nomeAuxiliar;
                        sessionStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
                    } catch (e) {
                        console.error('[login.js] Erro ao salvar nome do auxiliar:', e);
                    }
                }

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
            case 'expirado':
                mensagem = 'Sua sessão expirou. Por favor, faça login novamente.';
                break;
            case 'erro':
                mensagem = 'Ocorreu um erro. Por favor, faça login novamente.';
                break;
        }

        if (mensagem) {
            // Aqui você poderia mostrar a mensagem em um elemento da página
            // ou criar um elemento para isso
            alert(mensagem);
        }
    }
});