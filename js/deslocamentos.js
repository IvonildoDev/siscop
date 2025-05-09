document.addEventListener('DOMContentLoaded', function () {
    const compartilharModal = document.getElementById('compartilharModal');
    const fecharModal = document.getElementById('fecharModal');
    const continuar = document.getElementById('continuar');
    const confirmarCompartilhar = document.getElementById('confirmarCompartilhar');
    const btnIniciarDeslocamento = document.getElementById('iniciarDeslocamento');
    const btnFinalizarDeslocamento = document.getElementById('finalizarDeslocamento');

    if (!compartilharModal) {
        console.error("Elemento 'compartilharModal' não encontrado!");
    }

    let deslocamentoAtual = {
        origem: '',
        destino: '',
        kmInicial: 0,
        latitude: null,
        longitude: null
    };

    function mostrarModal() {
        if (compartilharModal) {
            compartilharModal.classList.add('active');
        } else {
            console.error("Modal de compartilhamento não encontrado!");
        }
    }

    if (btnIniciarDeslocamento) {
        btnIniciarDeslocamento.addEventListener('click', function () {
            const origem = document.getElementById('origem').value;
            const destino = document.getElementById('destino').value;
            const kmInicial = parseFloat(document.getElementById('kmInicial').value);

            if (!origem || !destino || isNaN(kmInicial)) {
                alert('Por favor, preencha todos os campos obrigatórios.');
                return;
            }

            deslocamentoAtual = {
                origem: origem,
                destino: destino,
                kmInicial: kmInicial
            };

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    function (position) {
                        deslocamentoAtual.latitude = position.coords.latitude;
                        deslocamentoAtual.longitude = position.coords.longitude;
                        mostrarModal();
                    },
                    function (error) {
                        console.error("Erro ao obter localização:", error);
                        deslocamentoAtual.latitude = null;
                        deslocamentoAtual.longitude = null;
                        mostrarModal();
                    },
                    { timeout: 5000 }
                );
            } else {
                alert("Seu navegador não suporta geolocalização.");
                mostrarModal();
            }
        });
    }

    if (fecharModal) {
        fecharModal.addEventListener('click', function () {
            compartilharModal.classList.remove('active');
        });
    }

    if (continuar) {
        continuar.addEventListener('click', function () {
            compartilharModal.classList.remove('active');
            iniciarDeslocamentoNoSistema();
        });
    }

    if (confirmarCompartilhar) {
        confirmarCompartilhar.addEventListener('click', function () {
            compartilharWhatsApp();
            compartilharModal.classList.remove('active');
            iniciarDeslocamentoNoSistema();
        });
    }

    function compartilharWhatsApp() {
        const mensagem = `🚗 Estou iniciando um deslocamento:
📍 De: ${deslocamentoAtual.origem}
🏁 Para: ${deslocamentoAtual.destino}
🕒 Horário: ${new Date().toLocaleString()}`;

        let whatsappURL = '';
        if (deslocamentoAtual.latitude && deslocamentoAtual.longitude) {
            const localizacao = `\n📌 Minha localização atual: https://www.google.com/maps?q=${deslocamentoAtual.latitude},${deslocamentoAtual.longitude}`;
            whatsappURL = `https://wa.me/?text=${encodeURIComponent(mensagem + localizacao)}`;
        } else {
            whatsappURL = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
        }

        window.open(whatsappURL, '_blank');
    }

    async function iniciarDeslocamentoNoSistema() {
        try {
            document.getElementById('origem').disabled = true;
            document.getElementById('destino').disabled = true;
            document.getElementById('kmInicial').disabled = true;

            if (btnIniciarDeslocamento) btnIniciarDeslocamento.disabled = true;
            if (btnFinalizarDeslocamento) btnFinalizarDeslocamento.disabled = false;

            sessionStorage.setItem('deslocamentoAtivo', 'true');
            sessionStorage.setItem('deslocamentoOrigem', deslocamentoAtual.origem);
            sessionStorage.setItem('deslocamentoDestino', deslocamentoAtual.destino);
            sessionStorage.setItem('deslocamentoKmInicial', deslocamentoAtual.kmInicial);
            sessionStorage.setItem('deslocamentoDataInicio', new Date().toISOString());

            console.log('Deslocamento iniciado:', {
                origem: deslocamentoAtual.origem,
                destino: deslocamentoAtual.destino,
                kmInicial: deslocamentoAtual.kmInicial,
                dataInicio: new Date().toISOString()
            });
        } catch (error) {
            console.error('Erro ao iniciar deslocamento:', error);
            alert('Ocorreu um erro ao iniciar o deslocamento. Tente novamente.');
        }
    }

    const deslocamentoAtivo = sessionStorage.getItem('deslocamentoAtivo') === 'true';

    if (deslocamentoAtivo) {
        const origemEl = document.getElementById('origem');
        const destinoEl = document.getElementById('destino');
        const kmInicialEl = document.getElementById('kmInicial');

        if (origemEl) origemEl.value = sessionStorage.getItem('deslocamentoOrigem');
        if (destinoEl) destinoEl.value = sessionStorage.getItem('deslocamentoDestino');
        if (kmInicialEl) kmInicialEl.value = sessionStorage.getItem('deslocamentoKmInicial');

        if (origemEl) origemEl.disabled = true;
        if (destinoEl) destinoEl.disabled = true;
        if (kmInicialEl) kmInicialEl.disabled = true;

        if (btnIniciarDeslocamento) btnIniciarDeslocamento.disabled = true;
        if (btnFinalizarDeslocamento) btnFinalizarDeslocamento.disabled = false;
    }

    if (btnFinalizarDeslocamento) {
        btnFinalizarDeslocamento.addEventListener('click', function () {
            finalizarDeslocamento();
        });
    }

    async function finalizarDeslocamento() {
        try {
            const kmFinal = parseFloat(document.getElementById('kmFinal').value);

            if (isNaN(kmFinal)) {
                alert('Por favor, insira a quilometragem final.');
                return;
            }

            const kmInicial = parseFloat(sessionStorage.getItem('deslocamentoKmInicial') || '0');
            if (kmFinal < kmInicial) {
                alert('A quilometragem final não pode ser menor que a inicial.');
                return;
            }

            const distanciaPercorrida = kmFinal - kmInicial;

            const dadosDeslocamento = {
                origem: sessionStorage.getItem('deslocamentoOrigem'),
                destino: sessionStorage.getItem('deslocamentoDestino'),
                km_inicial: kmInicial,
                km_final: kmFinal,
                distancia_percorrida: distanciaPercorrida,
                data_inicio: sessionStorage.getItem('deslocamentoDataInicio'),
                data_fim: new Date().toISOString()
            };

            console.log('Salvando deslocamento completo:', dadosDeslocamento);

            try {
                console.log('Enviando dados para o backend:', dadosDeslocamento);

                // Verificar se temos um token válido antes de prosseguir
                const token = getAuthToken(); // Assumindo que esta função existe em api.js
                if (!token) {
                    throw new Error('Token de autenticação não encontrado. Faça login novamente.');
                }

                const resultado = await createDeslocamento({
                    origem: dadosDeslocamento.origem,
                    destino: dadosDeslocamento.destino,
                    km_inicial: dadosDeslocamento.km_inicial,
                    km_final: dadosDeslocamento.km_final,
                    distancia_percorrida: dadosDeslocamento.distancia_percorrida,
                    data_inicio: new Date(dadosDeslocamento.data_inicio).toISOString(),
                    data_fim: new Date(dadosDeslocamento.data_fim).toISOString()
                });

                console.log('Deslocamento salvo no backend:', resultado);
                alert('Deslocamento finalizado e salvo com sucesso!');
            } catch (apiError) {
                console.error('Erro ao salvar no backend:', apiError);

                // Verificar se o erro é de autenticação
                if (apiError.message && apiError.message.includes('401')) {
                    if (confirm('Sua sessão expirou. Deseja fazer login novamente?')) {
                        window.location.replace('login.html?status=sessao_expirada');
                        return;
                    }
                }

                if (!confirm('Não foi possível salvar o deslocamento no servidor. Deseja salvar os dados localmente e tentar novamente mais tarde?')) {
                    return;
                }

                const pendentes = JSON.parse(localStorage.getItem('deslocamentosPendentes') || '[]');
                pendentes.push(dadosDeslocamento);
                localStorage.setItem('deslocamentosPendentes', JSON.stringify(pendentes));
                alert('Deslocamento salvo localmente. Será sincronizado quando a conexão com o servidor for restabelecida.');
            }

            document.getElementById('origem').disabled = false;
            document.getElementById('destino').disabled = false;
            document.getElementById('kmInicial').disabled = false;

            if (btnIniciarDeslocamento) btnIniciarDeslocamento.disabled = false;
            if (btnFinalizarDeslocamento) btnFinalizarDeslocamento.disabled = true;

            sessionStorage.removeItem('deslocamentoAtivo');
            sessionStorage.removeItem('deslocamentoOrigem');
            sessionStorage.removeItem('deslocamentoDestino');
            sessionStorage.removeItem('deslocamentoKmInicial');
            sessionStorage.removeItem('deslocamentoDataInicio');

            document.getElementById('deslocamentoForm').reset();
            await carregarHistoricoDeslocamentos();
        } catch (error) {
            console.error('Erro ao finalizar deslocamento:', error);
            alert('Ocorreu um erro ao finalizar o deslocamento: ' + error.message);
        }
    }

    carregarHistoricoDeslocamentos();

    async function carregarHistoricoDeslocamentos() {
        try {
            const historicoElement = document.getElementById('historicoDeslocamentos');
            if (!historicoElement) return;

            historicoElement.innerHTML = '';
            const deslocamentos = await getDeslocamentos();

            if (deslocamentos.length === 0) {
                historicoElement.innerHTML = '<li class="sem-registros">Nenhum deslocamento registrado.</li>';
                return;
            }

            deslocamentos.forEach(deslocamento => {
                const dataInicio = new Date(deslocamento.data_inicio).toLocaleString();
                const dataFim = deslocamento.data_fim ? new Date(deslocamento.data_fim).toLocaleString() : 'Em andamento';

                const item = document.createElement('li');
                item.classList.add('historico-item');
                item.innerHTML = `
                    <div class="historico-detalhe">
                        <strong>Origem:</strong> ${deslocamento.origem}
                    </div>
                    <div class="historico-detalhe">
                        <strong>Destino:</strong> ${deslocamento.destino}
                    </div>
                    <div class="historico-detalhe">
                        <strong>Distância:</strong> ${deslocamento.distancia_percorrida || 'N/A'} km
                    </div>
                    <div class="historico-detalhe">
                        <strong>Início:</strong> ${dataInicio}
                    </div>
                    <div class="historico-detalhe">
                        <strong>Término:</strong> ${dataFim}
                    </div>
                `;
                historicoElement.appendChild(item);
            });
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
            const historicoElement = document.getElementById('historicoDeslocamentos');
            if (historicoElement) {
                historicoElement.innerHTML = '<li class="erro">Erro ao carregar histórico. Tente novamente mais tarde.</li>';
            }
        }
    }

    const btnGerarPDF = document.getElementById('gerarPDFDeslocamentos');
    if (btnGerarPDF) {
        btnGerarPDF.addEventListener('click', function () {
            gerarPDFHistoricoDeslocamentos();
        });
    }

    function gerarPDFHistoricoDeslocamentos() {
        alert('Função de gerar PDF será implementada em breve!');
    }

    const btnLimparHistorico = document.getElementById('limparHistoricoDeslocamentos');
    if (btnLimparHistorico) {
        btnLimparHistorico.addEventListener('click', function () {
            if (confirm('Tem certeza que deseja limpar todo o histórico de deslocamentos?')) {
                alert('Função de limpar histórico será implementada em breve!');
            }
        });
    }

    setTimeout(async function () {
        try {
            await fetch(`${API_URL}/status`);
            await enviarDadosPendentes();
        } catch (error) {
            console.log('Backend não está disponível no momento. Dados pendentes permanecerão armazenados localmente.');
        }
    }, 3000);
});

async function enviarDadosPendentes() {
    const pendentes = JSON.parse(localStorage.getItem('deslocamentosPendentes') || '[]');

    if (pendentes.length === 0) return;

    console.log(`Tentando enviar ${pendentes.length} deslocamentos pendentes...`);

    const novosPendentes = [];

    for (const deslocamento of pendentes) {
        try {
            await createDeslocamento(deslocamento);
            console.log('Deslocamento pendente enviado com sucesso:', deslocamento);
        } catch (error) {
            console.error('Falha ao enviar deslocamento pendente:', error);
            novosPendentes.push(deslocamento);
        }
    }

    localStorage.setItem('deslocamentosPendentes', JSON.stringify(novosPendentes));

    if (novosPendentes.length === 0) {
        console.log('Todos os deslocamentos pendentes foram enviados com sucesso!');
    } else {
        console.log(`${novosPendentes.length} deslocamentos ainda estão pendentes.`);
    }
}