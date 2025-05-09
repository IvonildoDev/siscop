document.addEventListener('DOMContentLoaded', function () {
    // Função para sanitizar entradas
    function sanitizeInput(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }

    // Verificar se o usuário está logado e redirecionar para o login se necessário
    function verificarAutenticacao() {
        const usuarioLogado = JSON.parse(sessionStorage.getItem('usuarioLogado') || '{}');
        const paginaAtual = window.location.pathname.split('/').pop();

        // Não verificar autenticação na página de login
        if (paginaAtual === 'login.html') {
            return;
        }

        // Se não houver token de autenticação, redirecionar para o login
        if (!usuarioLogado.token) {
            window.location.replace('login.html?redirect=' + encodeURIComponent(paginaAtual));
        }
    }

    // Verificar se o token está válido e não expirado
    function verificarSessao() {
        try {
            // Obter dados do usuário
            const usuarioLogado = JSON.parse(sessionStorage.getItem('usuarioLogado') || '{}');
            
            // Se não há token, redirecionar para o login
            if (!usuarioLogado.token) {
                console.warn("Nenhum token encontrado, redirecionando para login");
                window.location.href = 'login.html?status=unauthorized';
                return false;
            }
            
            // Verificar se o token não expirou (assumindo validade de 24 horas)
            const agora = new Date().getTime();
            const tempoDecorrido = agora - (usuarioLogado.timestamp || 0);
            const umDiaEmMs = 24 * 60 * 60 * 1000;
            
            if (tempoDecorrido > umDiaEmMs) {
                console.warn("Token expirado, redirecionando para login");
                sessionStorage.removeItem('usuarioLogado');
                window.location.href = 'login.html?status=expired';
                return false;
            }
            
            return true;
        } catch (error) {
            console.error("Erro ao verificar sessão:", error);
            return false;
        }
    }

    // Executar verificação em todas as páginas exceto login
    if (!window.location.pathname.includes('login.html')) {
        verificarSessao();
    }

    // Função para inicializar elementos comuns em todas as páginas
    function inicializarElementosComuns() {
        // Inicializar menu hamburger
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');

        if (hamburger && navMenu) {
            hamburger.addEventListener('click', function () {
                hamburger.classList.toggle('active');
                navMenu.classList.toggle('active');
            });

            document.querySelectorAll('.nav-menu a').forEach(n => n.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            }));
        }

        // Exibir informações do usuário logado na barra de navegação
        const userInfoContainer = document.getElementById('userInfo');
        if (userInfoContainer) {
            // Obter dados do usuário da sessão
            const usuarioLogado = JSON.parse(sessionStorage.getItem('usuarioLogado') || '{}');
            const nomeOperador = usuarioLogado.nome || 'Não autenticado';
            const matriculaOperador = usuarioLogado.matricula || '';
            const nomeAuxiliar = usuarioLogado.auxiliar || '';

            // Construir conteúdo HTML para mostrar informações do usuário
            let infoHTML = `
                <div class="usuario-nome">${sanitizeInput(nomeOperador)}</div>
            `;

            // Adicionar matrícula se existir
            if (matriculaOperador) {
                infoHTML += `<div class="usuario-matricula">${sanitizeInput(matriculaOperador)}</div>`;
            }

            // Adicionar auxiliar se existir
            if (nomeAuxiliar) {
                infoHTML += `<div class="usuario-auxiliar">Aux: ${sanitizeInput(nomeAuxiliar)}</div>`;
            }

            // Adicionar botão de logout
            infoHTML += `
                <button id="btnLogout" class="btn-logout" title="Sair">
                    <i class="fas fa-sign-out-alt"></i>
                </button>
            `;

            // Inserir o HTML no container
            userInfoContainer.innerHTML = infoHTML;

            // Adicionar evento ao botão de logout
            const btnLogout = document.getElementById('btnLogout');
            if (btnLogout) {
                btnLogout.addEventListener('click', function () {
                    console.log('[comum.js] Fazendo logout.');
                    sessionStorage.removeItem('usuarioLogado');
                    localStorage.removeItem('usuarioLogado');
                    window.location.replace('login.html?status=logout');
                });
            }
        }
    }

    // Inicializar elementos comuns
    inicializarElementosComuns();

    // Executar verificação de autenticação
    verificarAutenticacao();
});