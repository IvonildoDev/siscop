document.addEventListener('DOMContentLoaded', function () {
    // Elementos da interface
    const btnIniciarMobilizacao = document.getElementById('iniciarMobilizacao');
    const btnFinalizarMobilizacao = document.getElementById('finalizarMobilizacao');
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    const horaRegistro = document.getElementById('horaRegistro');
    const formOverlay = document.getElementById('formOverlay');
    const operacaoForm = document.getElementById('operacaoForm');

    // Exibir informações do usuário logado
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado') || '{}');
    const nomeUsuarioEl = document.getElementById('nomeUsuarioLogado');

    if (nomeUsuarioEl) {
        if (usuarioLogado.nome) {
            nomeUsuarioEl.textContent = usuarioLogado.nome;
        } else {
            nomeUsuarioEl.textContent = 'Sistema (não autenticado)';
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
    }

    /**
     * Carrega os deslocamentos do backend para preencher o select
     */
    async function carregarDeslocamentos() {
        try {
            const deslocamentos = await getDeslocamentos();

            if (deslocamentos && deslocamentos.length > 0) {
                deslocamentoSelect.innerHTML = '<option value="">Selecione um deslocamento</option>';

                deslocamentos.forEach(deslocamento => {
                    const option = document.createElement('option');
                    option.value = deslocamento.id;
                    option.textContent = `${deslocamento.origem} → ${deslocamento.destino}`;
                    deslocamentoSelect.appendChild(option);
                });
            } else {
                deslocamentoSelect.innerHTML = '<option value="">Nenhum deslocamento disponível</option>';
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
            // Obter todos os valores dos campos
            const dadosOperacao = {
                deslocamento_id: deslocamentoSelect.value || null,
                inicio_operacao: inicioOperacaoInput.value,
                tipo_operacao: document.getElementById('tipoOperacao').value,
                nome_poco_serv: document.getElementById('nomePocoServ').value,
                nome_operador: document.getElementById('nomeOperador').value,
                volume_bbl: parseFloat(document.getElementById('volumeBbl').value),
                temperatura: parseFloat(document.getElementById('temperatura').value),
                pressao: parseFloat(document.getElementById('pressao').value),
                descricao_atividades: document.getElementById('descricaoAtividades').value,

                // Adicionar informações da mobilização
                mobilizacao_inicio: mobilizacaoData.inicio,
                mobilizacao_fim: mobilizacaoData.fim,
                mobilizacao_status_inicio: mobilizacaoData.status_inicio,
                mobilizacao_status_fim: mobilizacaoData.status_fim
            };

            // Obter informações do operador logado
            const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado') || '{}');

            // Adicionar informações do operador e auxiliar
            if (usuarioLogado.nome) {
                dadosOperacao.nome_operador = usuarioLogado.nome;
                dadosOperacao.matricula_operador = usuarioLogado.matricula;
            }

            if (usuarioLogado.auxiliar) {
                dadosOperacao.nome_auxiliar = usuarioLogado.auxiliar;
            }

            // Verificar localização se estiver disponível
            const latitudeEl = document.getElementById('latitude');
            const longitudeEl = document.getElementById('longitude');

            if (latitudeEl && longitudeEl &&
                latitudeEl.textContent && longitudeEl.textContent) {
                dadosOperacao.latitude = parseFloat(latitudeEl.textContent);
                dadosOperacao.longitude = parseFloat(longitudeEl.textContent);
            }

            console.log('Enviando dados da operação:', dadosOperacao);

            // Enviar para o backend
            const resultado = await createOperacao(dadosOperacao);

            console.log('Operação salva com sucesso:', resultado);
            alert('Operação salva com sucesso!');

            // Resetar formulário
            operacaoForm.reset();

            // Resetar status de mobilização
            resetarMobilizacao();

            // Atualizar histórico
            carregarHistoricoOperacoes();

        } catch (error) {
            console.error('Erro ao salvar operação:', error);
            alert('Erro ao salvar operação. Verifique os dados e tente novamente.');
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

                item.innerHTML = `
                    <div class="operacao-header">
                        <h3>${op.tipo_operacao}</h3>
                        <span class="operacao-data">${dataHora}</span>
                    </div>
                    <div class="operacao-body">
                        <p><strong>Local:</strong> ${op.nome_cidade}, ${op.nome_poco_serv}</p>
                        <p><strong>Operador:</strong> ${op.nome_operador}</p>
                        <p><strong>OP/Auxiliar:</strong> ${op.nome_op_aux || 'Sistema'}</p>
                        <p><strong>Volume:</strong> ${op.volume_bbl} bbl</p>
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