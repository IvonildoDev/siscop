document.addEventListener('DOMContentLoaded', function () {
    // Recuperar dados do usuário das cookies ou sessionStorage
    function obterDadosUsuario() {
        // Tentar obter do sessionStorage primeiro
        let usuarioLogado = JSON.parse(sessionStorage.getItem('usuarioLogado') || '{}');
        
        // Se não encontrar no sessionStorage, tentar no localStorage
        if (!usuarioLogado.nome) {
            usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado') || '{}');
        }
        
        return {
            nome: usuarioLogado.nome || 'Não autenticado',
            matricula: usuarioLogado.matricula || '',
            auxiliar: usuarioLogado.auxiliar || ''
        };
    }

    // Exibir dados do usuário na interface, se necessário
    const dadosUsuario = obterDadosUsuario();
    const nomeUsuarioEl = document.getElementById('nomeUsuarioLogado');
    if (nomeUsuarioEl) {
        nomeUsuarioEl.textContent = dadosUsuario.nome;
    }
    
    const auxiliarInfoEl = document.getElementById('auxiliarInfo');
    if (auxiliarInfoEl) {
        auxiliarInfoEl.textContent = dadosUsuario.auxiliar || 'Não informado';
    }

    // Elementos da interface
    const btnIniciarMobilizacao = document.getElementById('iniciarMobilizacao');
    const btnFinalizarMobilizacao = document.getElementById('finalizarMobilizacao');
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    const horaRegistro = document.getElementById('horaRegistro');
    const formOverlay = document.getElementById('formOverlay');
    const operacaoForm = document.getElementById('operacaoForm');

    // Exibir informações do usuário logado
    const usuarioLogado = JSON.parse(sessionStorage.getItem('usuarioLogado') || '{}');
    const nomeOperador = usuarioLogado.nome || 'Sistema';
    const matriculaOperador = usuarioLogado.matricula || '';
    const nomeAuxiliar = usuarioLogado.auxiliar || '';

    // Preencher nome do operador automaticamente
    const nomeOperadorEl = document.getElementById('nomeOperador');
    if (nomeOperadorEl && nomeOperador) {
        nomeOperadorEl.value = nomeOperador;
    }

    // Adicionar informação do auxiliar também
    if (!auxiliarInfoEl) {
        // Se não existir, criar um novo elemento para mostrar o auxiliar
        const usuarioInfoEl = document.querySelector('.usuario-info');
        if (usuarioInfoEl) {
            const auxiliarDiv = document.createElement('div');
            auxiliarDiv.className = 'auxiliar-info';
            auxiliarDiv.innerHTML = `
                <i class="fas fa-user-friends"></i>
                <span>Auxiliar: <strong id="auxiliarInfo">${nomeAuxiliar || 'Não informado'}</strong></span>
            `;
            usuarioInfoEl.appendChild(auxiliarDiv);
        }
    }

    // Campos do formulário
    const formInputs = operacaoForm.querySelectorAll('input, select, textarea, button');
    const deslocamentoSelect = document.getElementById('deslocamentoSelect');
    const inicioOperacaoInput = document.getElementById('inicioOperacao');

    // Variáveis para controle da mobilização
    let mobilizacaoAtiva = false;
    let mobilizacaoData = {
        inicio: null,
        fim: null,
        status_inicio: "Equipe em montagem dos equipamentos",
        status_fim: "Equipe desmontando o equipamento"
    };

    // Verificar se existe uma mobilização em andamento
    verificarMobilizacaoAtiva();

    // Event Listeners
    btnIniciarMobilizacao.addEventListener('click', iniciarMobilizacao);
    btnFinalizarMobilizacao.addEventListener('click', finalizarMobilizacao);

    // Carregar deslocamentos para o select
    carregarDeslocamentos();

    // Iniciar Operação
    operacaoForm.addEventListener('submit', function (e) {
        e.preventDefault();
        salvarOperacao();
    });

    /**
     * Verifica se há uma mobilização ativa salva no localStorage
     */
    function verificarMobilizacaoAtiva() {
        const mobilizacaoSalva = localStorage.getItem('mobilizacaoAtiva');

        if (mobilizacaoSalva) {
            const dados = JSON.parse(mobilizacaoSalva);
            mobilizacaoAtiva = true;
            mobilizacaoData = dados;

            // Atualizar interface
            statusIndicator.classList.add('active');
            statusText.textContent = dados.status_inicio;
            horaRegistro.textContent = new Date(dados.inicio).toLocaleTimeString();

            btnIniciarMobilizacao.disabled = true;
            btnFinalizarMobilizacao.disabled = false;
        }
    }

    /**
     * Inicia o processo de mobilização
     */
    function iniciarMobilizacao() {
        const agora = new Date();

        mobilizacaoAtiva = true;
        mobilizacaoData = {
            inicio: agora.toISOString(),
            fim: null,
            status_inicio: "Equipe em montagem dos equipamentos",
            status_fim: "Equipe desmontando o equipamento"
        };

        // Salvar no localStorage
        localStorage.setItem('mobilizacaoAtiva', JSON.stringify(mobilizacaoData));

        // Atualizar interface
        statusIndicator.classList.add('active');
        statusText.textContent = mobilizacaoData.status_inicio;
        horaRegistro.textContent = agora.toLocaleTimeString();

        btnIniciarMobilizacao.disabled = true;
        btnFinalizarMobilizacao.disabled = false;

        console.log('Mobilização iniciada:', mobilizacaoData);
    }

    /**
     * Finaliza o processo de mobilização
     */
    function finalizarMobilizacao() {
        if (!mobilizacaoAtiva) return;

        const agora = new Date();
        mobilizacaoData.fim = agora.toISOString();

        // Limpar no localStorage
        localStorage.removeItem('mobilizacaoAtiva');

        // Atualizar interface
        statusIndicator.classList.remove('active');
        statusIndicator.classList.add('completed');
        statusText.textContent = mobilizacaoData.status_fim;
        horaRegistro.textContent = agora.toLocaleTimeString();

        btnIniciarMobilizacao.disabled = true;
        btnFinalizarMobilizacao.disabled = true;

        // Habilitar o formulário de operações
        habilitarFormularioOperacoes();

        // Definir o horário de início da operação para o momento atual
        const dataHoraLocal = agora.toISOString().slice(0, 16);
        inicioOperacaoInput.value = dataHoraLocal;

        console.log('Mobilização finalizada:', mobilizacaoData);
    }

    /**
     * Habilita o formulário de operações após a mobilização
     */
    function habilitarFormularioOperacoes() {
        // Remover overlay
        formOverlay.style.display = 'none';

        // Habilitar todos os campos
        formInputs.forEach(input => {
            input.disabled = false;
        });

        // Definir o horário de início da operação para o momento atual
        const agora = new Date();

        // Definir a data atual no formato YYYY-MM-DD para o campo de data
        const dataAtual = agora.toISOString().split('T')[0];
        document.getElementById('dataOperacao').value = dataAtual;

        // Definir o horário atual no formato HH:MM para o campo de início
        const horas = agora.getHours().toString().padStart(2, '0');
        const minutos = agora.getMinutes().toString().padStart(2, '0');
        document.getElementById('inicioOperacao').value = `${horas}:${minutos}`;
    }

    /**
     * Carrega os deslocamentos do backend para preencher o select
     */
    async function carregarDeslocamentos() {
        try {
            // Buscar deslocamentos do localStorage
            const deslocamentosString = localStorage.getItem('deslocamentos');

            if (!deslocamentosString) {
                console.warn('Nenhum deslocamento encontrado no localStorage');
                deslocamentoSelect.innerHTML = '<option value="">Nenhum deslocamento disponível</option>';
                return;
            }

            // Converter para objeto
            const deslocamentos = JSON.parse(deslocamentosString);

            if (deslocamentos && deslocamentos.length > 0) {
                // Limpar opções existentes
                deslocamentoSelect.innerHTML = '<option value="">Selecione um deslocamento</option>';

                // Filtrar deslocamentos do usuário atual (se necessário)
                const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                const userId = userData.id;

                // Mostrar deslocamentos em ordem cronológica inversa (mais recentes primeiro)
                const deslocamentosOrdenados = deslocamentos
                    .filter(desl => !userId || desl.userId === userId)
                    .sort((a, b) => new Date(b.data) - new Date(a.data));

                deslocamentosOrdenados.forEach(deslocamento => {
                    const option = document.createElement('option');
                    option.value = deslocamento.id || '';

                    // Formatar a data para exibição
                    let dataFormatada = '';
                    if (deslocamento.data) {
                        const data = new Date(deslocamento.data);
                        dataFormatada = data.toLocaleDateString('pt-BR');
                    }

                    option.textContent = `${dataFormatada} - ${deslocamento.origem || ''} → ${deslocamento.destino || ''}`;
                    deslocamentoSelect.appendChild(option);
                });

                console.log('Deslocamentos carregados:', deslocamentosOrdenados);
            } else {
                deslocamentoSelect.innerHTML = '<option value="">Nenhum deslocamento disponível</option>';
                console.log('Nenhum deslocamento encontrado');
            }
        } catch (error) {
            console.error('Erro ao carregar deslocamentos:', error);
            deslocamentoSelect.innerHTML = '<option value="">Erro ao carregar deslocamentos</option>';
        }
    }

    /**
     * Salva a operação no backend
     */
    async function salvarOperacao() {
        try {
            // Log dos elementos do formulário para depuração
            console.log("Verificando todos os elementos do formulário:");
            document.querySelectorAll('#operacaoForm input, #operacaoForm select, #operacaoForm textarea').forEach(el => {
                console.log(`Elemento: ${el.id || 'sem ID'}, Tipo: ${el.type}, Valor: ${el.value || 'vazio'}`);
            });

            // Obter elementos do formulário
            const tipoOperacaoEl = document.getElementById('tipoOperacao');
            const deslocamentoSelectEl = document.getElementById('deslocamentoSelect');
            const inicioOperacaoEl = document.getElementById('inicioOperacao');
            const nomePocoServEl = document.getElementById('nomePocoServ');
            const nomeOperadorEl = document.getElementById('nomeOperador');
            const volumeBblEl = document.getElementById('volumeBbl');
            const temperaturaEl = document.getElementById('temperatura');
            const pressaoEl = document.getElementById('pressao');
            const descricaoAtividadesEl = document.getElementById('descricaoAtividades');

            // Verificar se os elementos essenciais existem
            const elementosFaltantes = [];
            if (!tipoOperacaoEl) elementosFaltantes.push('tipoOperacao');
            if (!inicioOperacaoEl) elementosFaltantes.push('inicioOperacao');
            if (!nomePocoServEl) elementosFaltantes.push('nomePocoServ');

            if (elementosFaltantes.length > 0) {
                console.error('Elementos essenciais faltantes no formulário:', elementosFaltantes);
                alert(`Os elementos ${elementosFaltantes.join(', ')} não foram encontrados. Verifique seu HTML.`);
                return;
            }

            // Extrair data e hora do campo inicioOperacao (que é do tipo datetime-local)
            let data = '', horaInicio = '';
            if (inicioOperacaoEl.value) {
                const dataHora = new Date(inicioOperacaoEl.value);
                data = dataHora.toISOString().split('T')[0]; // YYYY-MM-DD
                horaInicio = dataHora.toTimeString().slice(0, 5); // HH:MM
            }

            // Coletar dados do formulário adaptados à estrutura real do formulário
            const operacao = {
                tipo: tipoOperacaoEl.value,
                deslocamentoId: deslocamentoSelectEl ? deslocamentoSelectEl.value : '',
                local: nomePocoServEl.value, // Usando nomePocoServ como localOperacao
                data: data, // Extraído do inicioOperacao
                horaInicio: horaInicio, // Extraído do inicioOperacao
                horaFim: '', // Não parece ter esse campo no formulário
                observacoes: descricaoAtividadesEl ? descricaoAtividadesEl.value : '',
                latitude: document.getElementById('latitude') ? document.getElementById('latitude').textContent || null : null,
                longitude: document.getElementById('longitude') ? document.getElementById('longitude').textContent || null : null,
                // Campos específicos do seu formulário
                nomeOperador: nomeOperadorEl ? nomeOperadorEl.value : nomeOperador,
                nomeAuxiliar: nomeAuxiliar || '',
                volumeBbl: volumeBblEl ? volumeBblEl.value : '',
                temperatura: temperaturaEl ? temperaturaEl.value : '',
                pressao: pressaoEl ? pressaoEl.value : '',
                // Timestamp de criação
                criadoEm: new Date().toISOString()
            };

            console.log("Objeto operacao criado:", operacao);

            // Verificar se os campos obrigatórios foram preenchidos
            if (!operacao.tipo || !operacao.local || !operacao.data || !operacao.horaInicio) {
                alert('Por favor, preencha todos os campos obrigatórios.');
                return;
            }

            // Adicionar userId da sessão atual
            operacao.userId = usuarioLogado.id || null;
            operacao.userName = nomeOperador;
            operacao.userMatricula = matriculaOperador;
            operacao.auxiliarName = nomeAuxiliar;

            // Adicionar informações do deslocamento associado (se selecionado)
            if (operacao.deslocamentoId) {
                const deslocamentos = JSON.parse(localStorage.getItem('deslocamentos') || '[]');
                const deslocamentoSelecionado = deslocamentos.find(d => d.id == operacao.deslocamentoId);

                if (deslocamentoSelecionado) {
                    operacao.deslocamentoOrigem = deslocamentoSelecionado.origem;
                    operacao.deslocamentoDestino = deslocamentoSelecionado.destino;
                    operacao.deslocamentoData = deslocamentoSelecionado.data;
                }
            }

            // Salvar no banco de dados
            const operacaoSalva = await createOperacao(operacao);

            console.log('Operação salva com sucesso:', operacaoSalva);

            // Atualizar UI ou fazer outras ações necessárias
            alert('Operação registrada com sucesso!');
            resetarMobilizacao();
            await carregarHistoricoOperacoes();

            return operacaoSalva;
        } catch (error) {
            console.error('Erro ao salvar operação:', error);
            alert('Erro ao salvar a operação: ' + (error.message || 'Tente novamente.'));
            throw error;
        }
    }

    /**
     * Resetar o estado da mobilização após salvar operação
     */
    function resetarMobilizacao() {
        mobilizacaoAtiva = false;
        mobilizacaoData = {
            inicio: null,
            fim: null,
            status_inicio: "Equipe em montagem dos equipamentos",
            status_fim: "Equipe desmontando o equipamento"
        };

        // Atualizar interface para estado inicial
        statusIndicator.classList.remove('active', 'completed');
        statusText.textContent = 'Aguardando mobilização';
        horaRegistro.textContent = '--:--:--';

        btnIniciarMobilizacao.disabled = false;
        btnFinalizarMobilizacao.disabled = true;

        // Desabilitar formulário novamente
        formInputs.forEach(input => {
            input.disabled = true;
        });

        formOverlay.style.display = 'flex';

        // Limpar formulário
        operacaoForm.reset();
        document.getElementById('localizacaoInfo').style.display = 'none';
        document.getElementById('latitude').textContent = '';
        document.getElementById('longitude').textContent = '';
    }

    /**
     * Capturar localização atual
     */
    document.getElementById('capturarLocalizacao').addEventListener('click', function () {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function (position) {
                    const latitude = position.coords.latitude;
                    const longitude = position.coords.longitude;

                    document.getElementById('latitude').textContent = latitude;
                    document.getElementById('longitude').textContent = longitude;
                    document.getElementById('localizacaoInfo').style.display = 'block';

                    console.log('Localização capturada:', latitude, longitude);
                },
                function (error) {
                    console.error('Erro ao capturar localização:', error);
                    alert('Não foi possível obter sua localização. Verifique as permissões do navegador.');
                }
            );
        } else {
            alert('Seu navegador não suporta geolocalização.');
        }
    });

    /**
     * Carregar histórico de operações
     */
    async function carregarHistoricoOperacoes() {
        const historicoElement = document.getElementById('historicoOperacoes');

        if (!historicoElement) return;

        try {
            const operacoes = await getOperacoes();

            if (operacoes.length === 0) {
                historicoElement.innerHTML = '<li class="sem-operacoes">Nenhuma operação registrada.</li>';
                return;
            }

            historicoElement.innerHTML = '';

            operacoes.forEach(op => {
                const item = document.createElement('li');
                item.classList.add('operacao-item');

                const dataHora = op.inicio_operacao ? new Date(op.inicio_operacao).toLocaleString() : 'N/A';
                const operador = op.nomeOperador || op.nome_operador || 'Não informado';
                const auxiliar = op.nomeAuxiliar || op.auxiliarName || op.nome_auxiliar || 'Não informado';

                item.innerHTML = `
                    <div class="operacao-header">
                        <h3>${op.tipo_operacao || op.tipo}</h3>
                        <span class="operacao-data">${dataHora}</span>
                    </div>
                    <div class="operacao-body">
                        <p><strong>Local:</strong> ${op.nome_cidade || op.cidade || ''}, ${op.nome_poco_serv || op.local || ''}</p>
                        <p><strong>Operador:</strong> ${operador}</p>
                        <p><strong>Auxiliar:</strong> ${auxiliar}</p>
                        <p><strong>Volume:</strong> ${op.volume_bbl || op.volumeBbl || 'N/A'} bbl</p>
                        <p><strong>Temperatura:</strong> ${op.temperatura || 'N/A'} °C</p>
                        <p><strong>Pressão:</strong> ${op.pressao || 'N/A'} PSI</p>
                        <p><strong>Observações:</strong> ${op.descricao_atividades || op.observacoes || 'Nenhuma observação'}</p>
                    </div>
                `;

                historicoElement.appendChild(item);
            });
        } catch (error) {
            console.error('Erro ao carregar histórico de operações:', error);
            historicoElement.innerHTML = '<li class="erro">Erro ao carregar histórico. Tente novamente mais tarde.</li>';
        }
    }

    // Inicializar a página carregando o histórico
    carregarHistoricoOperacoes();
});

// Função para salvar operação
async function createOperacao(operacao) {
    return await window.api.saveOperacao(operacao);
}

// Salvar uma mobilização
async function salvarMobilizacao(mobilizacao) {
    return await window.api.saveMobilizacao(mobilizacao);
}