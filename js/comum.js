document.addEventListener('DOMContentLoaded', function () {
    // Função para sanitizar entradas
    function sanitizeInput(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }

    function verificarAutenticacao() {
        const paginaAtual = window.location.pathname.split('/').pop();
        console.log('[comum.js] Verificando autenticação para:', paginaAtual);

        if (paginaAtual === 'login.html') {
            console.log('[comum.js] Página de login, não verificar autenticação aqui.');
            return;
        }

        const usuarioLogado = sessionStorage.getItem('usuarioLogado');

        if (!usuarioLogado) {
            console.log('[comum.js] Usuário não logado. Redirecionando para login.html.');
            window.location.replace('login.html');
            return;
        }

        try {
            const usuario = JSON.parse(usuarioLogado);
            const dataLogin = new Date(usuario.dataLogin);
            const agora = new Date();
            const vinteQuatroHorasEmMs = 24 * 60 * 60 * 1000;

            if (agora - dataLogin > vinteQuatroHorasEmMs) {
                console.log('[comum.js] Token expirado. Removendo sessionStorage e redirecionando.');
                sessionStorage.removeItem('usuarioLogado');
                window.location.replace('login.html?status=expirado');
                return;
            }

            console.log('[comum.js] Usuário autenticado e token válido.');
            if (typeof atualizarInfoUsuario === 'function') {
                atualizarInfoUsuario(usuario);
            }

        } catch (error) {
            console.error('[comum.js] Erro ao verificar autenticação:', error);
            sessionStorage.removeItem('usuarioLogado');
            window.location.replace('login.html?status=erro');
            return;
        }
    }

    function atualizarInfoUsuario(usuario) {
        const userInfoElement = document.getElementById('userInfo');
        if (userInfoElement) {
            let auxiliarText = usuario.auxiliar ? `<span class="usuario-auxiliar">Aux: ${sanitizeInput(usuario.auxiliar)}</span>` : '';
            userInfoElement.innerHTML = `
                <div class="usuario-nome">${sanitizeInput(usuario.nome)} (${sanitizeInput(usuario.matricula)})</div>
                ${auxiliarText}
                <button id="btnLogout" class="btn-logout" title="Sair"><i class="fas fa-sign-out-alt"></i></button>
            `;
            const btnLogout = document.getElementById('btnLogout');
            if (btnLogout) {
                btnLogout.addEventListener('click', fazerLogout);
            }
        }
    }

    function fazerLogout() {
        console.log('[comum.js] Fazendo logout.');
        sessionStorage.removeItem('usuarioLogado');
        window.location.replace('login.html?status=logout');
    }

    verificarAutenticacao();

    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        document.querySelectorAll('.nav-menu a').forEach(n => n.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        }));
    }
});