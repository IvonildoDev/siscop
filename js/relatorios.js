document.addEventListener('DOMContentLoaded', function () {
    // Elementos DOM
    const relatorioForm = document.getElementById('relatorioForm');
    const tipoRelatorioSelect = document.getElementById('tipoRelatorio');
    const dataInicioInput = document.getElementById('dataInicio');
    const dataFimInput = document.getElementById('dataFim');
    const relatorioResultado = document.getElementById('relatorioResultado');
    const relatorioTitulo = document.getElementById('relatorioTitulo');
    const relatorioPeriodo = document.getElementById('relatorioPeriodo');
    const relatorioOperador = document.getElementById('relatorioOperador');
    const relatorioMatricula = document.getElementById('relatorioMatricula');
    const relatorioAuxiliar = document.getElementById('relatorioAuxiliar');
    const gerarPDFBtn = document.getElementById('gerarPDF');
    const compartilharRelatorioBtn = document.getElementById('compartilharRelatorio');
    const secaoDeslocamentos = document.getElementById('secaoDeslocamentos');
    const secaoOperacoes = document.getElementById('secaoOperacoes');
    const deslocamentosContainer = document.getElementById('deslocamentosContainer');
    const operacoesContainer = document.getElementById('operacoesContainer');
    const semDados = document.getElementById('semDados');
    const totalDeslocamentos = document.getElementById('totalDeslocamentos');
    const totalKm = document.getElementById('totalKm');
    const totalOperacoes = document.getElementById('totalOperacoes');
    const totalMobilizacao = document.getElementById('totalMobilizacao');

    // Dados do usuário logado
    const usuarioLogado = JSON.parse(sessionStorage.getItem('usuarioLogado') || '{}');
    const nomeOperador = usuarioLogado.nome || 'Sistema';
    const matriculaOperador = usuarioLogado.matricula || 'N/A';
    const nomeAuxiliar = usuarioLogado.auxiliar || 'Não informado';

    // Exibir informações do usuário
    const userInfoContainer = document.getElementById('userInfo');
    if (userInfoContainer) {
        let auxiliarText = nomeAuxiliar !== 'Não informado' ? `<span class="usuario-auxiliar">Aux: ${nomeAuxiliar}</span>` : '';
        userInfoContainer.innerHTML = `
            <div class="usuario-nome">${nomeOperador} (${matriculaOperador})</div>
            ${auxiliarText}
            <button id="btnLogout" class="btn-logout" title="Sair"><i class="fas fa-sign-out-alt"></i></button>
        `;
        const btnLogout = document.getElementById('btnLogout');
        if (btnLogout) {
            btnLogout.addEventListener('click', function () {
                sessionStorage.removeItem('usuarioLogado');
                window.location.replace('login.html?status=logout');
            });
        }
    }

    // Inicializar datas (mês atual)
    function inicializarDatas() {
        const hoje = new Date();
        const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

        dataInicioInput.valueAsDate = primeiroDiaMes;
        dataFimInput.valueAsDate = ultimoDiaMes;
    }

    inicializarDatas();

    // Event listeners
    relatorioForm.addEventListener('submit', gerarRelatorio);
    gerarPDFBtn.addEventListener('click', gerarPDF);
    compartilharRelatorioBtn.addEventListener('click', compartilharRelatorio);

    // Função para gerar relatório
    async function gerarRelatorio(e) {
        e.preventDefault();

        const tipoRelatorio = tipoRelatorioSelect.value;
        const dataInicio = dataInicioInput.value;
        const dataFim = dataFimInput.value;

        // Validar datas
        if (!dataInicio || !dataFim) {
            alert('Por favor, preencha as datas de início e fim.');
            return;
        }

        if (new Date(dataInicio) > new Date(dataFim)) {
            alert('A data de início não pode ser posterior à data de fim.');
            return;
        }

        try {
            // Mostrar spinner ou indicador de carregamento aqui

            // Buscar dados com base no tipo de relatório
            let deslocamentos = [];
            let operacoes = [];

            if (tipoRelatorio === 'deslocamentos' || tipoRelatorio === 'completo') {
                deslocamentos = await window.api.getDeslocamentos(null, dataInicio, dataFim);
            }

            if (tipoRelatorio === 'operacoes' || tipoRelatorio === 'completo') {
                operacoes = await window.api.getOperacoes(null, dataInicio, dataFim);
            }

            // Verificar se há dados para exibir
            if ((tipoRelatorio === 'deslocamentos' && deslocamentos.length === 0) ||
                (tipoRelatorio === 'operacoes' && operacoes.length === 0) ||
                (tipoRelatorio === 'completo' && deslocamentos.length === 0 && operacoes.length === 0)) {

                // Não há dados para o período selecionado
                relatorioResultado.style.display = 'block';
                secaoDeslocamentos.style.display = 'none';
                secaoOperacoes.style.display = 'none';
                semDados.style.display = 'block';
                return;
            }

            // Atualizar título e período do relatório
            let tituloTexto = 'Relatório de ';
            if (tipoRelatorio === 'deslocamentos') {
                tituloTexto += 'Deslocamentos';
                secaoDeslocamentos.style.display = 'block';
                secaoOperacoes.style.display = 'none';
            } else if (tipoRelatorio === 'operacoes') {
                tituloTexto += 'Operações';
                secaoDeslocamentos.style.display = 'none';
                secaoOperacoes.style.display = 'block';
            } else {
                tituloTexto += 'Completo';
                secaoDeslocamentos.style.display = deslocamentos.length > 0 ? 'block' : 'none';
                secaoOperacoes.style.display = operacoes.length > 0 ? 'block' : 'none';
            }

            relatorioTitulo.textContent = tituloTexto;
            relatorioPeriodo.textContent = `${formatarData(dataInicio)} a ${formatarData(dataFim)}`;

            // Atualizar informações do operador
            relatorioOperador.textContent = nomeOperador;
            relatorioMatricula.textContent = matriculaOperador;
            relatorioAuxiliar.textContent = nomeAuxiliar;

            // Calcular e exibir resumo
            let kmTotal = 0;
            let tempoMobilizacao = 0;

            if (deslocamentos.length > 0) {
                deslocamentos.forEach(d => {
                    if (d.distancia_percorrida) {
                        kmTotal += parseFloat(d.distancia_percorrida);
                    }
                });

                totalDeslocamentos.textContent = deslocamentos.length;
                totalKm.textContent = kmTotal.toFixed(1);
            } else {
                totalDeslocamentos.textContent = 0;
                totalKm.textContent = 0;
            }

            if (operacoes.length > 0) {
                // Calcular tempo de mobilização (estimativa baseada em 1h por operação se não tiver dados reais)
                operacoes.forEach(op => {
                    if (op.mobilizacao_inicio && op.mobilizacao_fim) {
                        const inicio = new Date(op.mobilizacao_inicio);
                        const fim = new Date(op.mobilizacao_fim);
                        tempoMobilizacao += (fim - inicio) / (1000 * 60 * 60); // em horas
                    } else {
                        tempoMobilizacao += 1; // estimativa de 1h se não tiver dados reais
                    }
                });

                totalOperacoes.textContent = operacoes.length;
                totalMobilizacao.textContent = formatarTempoHoras(tempoMobilizacao);
            } else {
                totalOperacoes.textContent = 0;
                totalMobilizacao.textContent = '00:00';
            }

            // Preencher dados de deslocamentos
            if (deslocamentos.length > 0) {
                renderizarDeslocamentos(deslocamentos);
            }

            // Preencher dados de operações
            if (operacoes.length > 0) {
                renderizarOperacoes(operacoes);
            }

            // Exibir o relatório
            relatorioResultado.style.display = 'block';
            semDados.style.display = 'none';

        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            alert('Ocorreu um erro ao gerar o relatório. Por favor, tente novamente.');
        }
    }

    // Função para renderizar deslocamentos
    function renderizarDeslocamentos(deslocamentos) {
        deslocamentosContainer.innerHTML = '';

        // Ordenar por data (mais recentes primeiro)
        deslocamentos.sort((a, b) => new Date(b.data_inicio) - new Date(a.data_inicio));

        // Criar tabela de deslocamentos
        const tabela = document.createElement('table');
        tabela.className = 'data-table';

        tabela.innerHTML = `
            <thead>
                <tr>
                    <th>Data/Hora</th>
                    <th>Origem</th>
                    <th>Destino</th>
                    <th>Distância</th>
                    <th>Operador</th>
                    <th>Auxiliar</th>
                </tr>
            </thead>
            <tbody>
                ${deslocamentos.map(d => `
                    <tr>
                        <td>${formatarDataHora(d.data_inicio)}</td>
                        <td>${d.origem || 'N/A'}</td>
                        <td>${d.destino || 'N/A'}</td>
                        <td>${d.distancia_percorrida ? d.distancia_percorrida + ' km' : 'N/A'}</td>
                        <td>${d.operador || nomeOperador}</td>
                        <td>${d.auxiliar || nomeAuxiliar}</td>
                    </tr>
                `).join('')}
            </tbody>
        `;

        deslocamentosContainer.appendChild(tabela);
    }

    // Função para renderizar operações
    function renderizarOperacoes(operacoes) {
        operacoesContainer.innerHTML = '';

        // Ordenar por data (mais recentes primeiro)
        operacoes.sort((a, b) => {
            const dataA = a.inicio_operacao || a.data;
            const dataB = b.inicio_operacao || b.data;
            return new Date(dataB) - new Date(dataA);
        });

        // Criar cards para cada operação
        operacoes.forEach(op => {
            const card = document.createElement('div');
            card.className = 'operacao-card';

            // Obter os dados formatados
            const dataHora = formatarDataHora(op.inicio_operacao || op.data);
            const operador = op.nome_operador || op.nomeOperador || nomeOperador;
            const auxiliar = op.nome_auxiliar || op.nomeAuxiliar || nomeAuxiliar;
            const tipo = op.tipo_operacao || op.tipo || 'N/A';
            const local = op.nome_poco_serv || op.local || 'N/A';
            const cidade = op.nome_cidade || op.cidade || '';
            const volume = op.volume_bbl || op.volumeBbl || 'N/A';
            const temperatura = op.temperatura || 'N/A';
            const pressao = op.pressao || 'N/A';
            const observacoes = op.descricao_atividades || op.observacoes || 'Sem observações';

            card.innerHTML = `
                <div class="operacao-card-header">
                    <h4>${tipo}</h4>
                    <span class="operacao-data">${dataHora}</span>
                </div>
                <div class="operacao-card-body">
                    <div class="operacao-info-grid">
                        <div class="operacao-info-item">
                            <span class="info-label">Local:</span>
                            <span class="info-value">${cidade ? cidade + ', ' : ''}${local}</span>
                        </div>
                        <div class="operacao-info-item">
                            <span class="info-label">Operador:</span>
                            <span class="info-value">${operador}</span>
                        </div>
                        <div class="operacao-info-item">
                            <span class="info-label">Auxiliar:</span>
                            <span class="info-value">${auxiliar}</span>
                        </div>
                        <div class="operacao-info-item">
                            <span class="info-label">Volume:</span>
                            <span class="info-value">${volume} bbl</span>
                        </div>
                        <div class="operacao-info-item">
                            <span class="info-label">Temperatura:</span>
                            <span class="info-value">${temperatura} °C</span>
                        </div>
                        <div class="operacao-info-item">
                            <span class="info-label">Pressão:</span>
                            <span class="info-value">${pressao} PSI</span>
                        </div>
                    </div>
                    <div class="operacao-observacoes">
                        <span class="info-label">Observações:</span>
                        <p class="info-value">${observacoes}</p>
                    </div>
                </div>
            `;

            operacoesContainer.appendChild(card);
        });
    }

    // Função para gerar PDF do relatório
    function gerarPDF() {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Configurações do PDF
            const margemEsquerda = 20;
            const margemTopo = 20;
            const espacoLinha = 7;
            let posicaoY = margemTopo;

            // Título do relatório
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text(relatorioTitulo.textContent, margemEsquerda, posicaoY);
            posicaoY += espacoLinha * 1.5;

            // Período
            doc.setFontSize(12);
            doc.text(`Período: ${relatorioPeriodo.textContent}`, margemEsquerda, posicaoY);
            posicaoY += espacoLinha * 1.5;

            // Informações do operador
            doc.setFontSize(11);
            doc.text(`Operador: ${relatorioOperador.textContent} (Matrícula: ${relatorioMatricula.textContent})`, margemEsquerda, posicaoY);
            posicaoY += espacoLinha;
            doc.text(`Auxiliar: ${relatorioAuxiliar.textContent}`, margemEsquerda, posicaoY);
            posicaoY += espacoLinha * 1.5;

            // Resumo
            doc.setFontSize(14);
            doc.text("Resumo", margemEsquerda, posicaoY);
            posicaoY += espacoLinha;

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");

            doc.text(`Deslocamentos: ${totalDeslocamentos.textContent}`, margemEsquerda, posicaoY);
            posicaoY += espacoLinha;

            doc.text(`Km Percorridos: ${totalKm.textContent}`, margemEsquerda, posicaoY);
            posicaoY += espacoLinha;

            doc.text(`Operações: ${totalOperacoes.textContent}`, margemEsquerda, posicaoY);
            posicaoY += espacoLinha;

            doc.text(`Tempo de Mobilização: ${totalMobilizacao.textContent}`, margemEsquerda, posicaoY);
            posicaoY += espacoLinha * 2;

            // Adicionar as seções de acordo com o tipo de relatório
            if (secaoDeslocamentos.style.display !== 'none') {
                // Adicionar seção de deslocamentos
                doc.setFontSize(14);
                doc.setFont("helvetica", "bold");
                doc.text("Deslocamentos", margemEsquerda, posicaoY);
                posicaoY += espacoLinha * 1.5;

                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");

                // Buscar dados da tabela de deslocamentos
                const tabelaDeslocamentos = deslocamentosContainer.querySelector('table');
                if (tabelaDeslocamentos) {
                    const rows = tabelaDeslocamentos.querySelectorAll('tbody tr');
                    if (rows.length > 0) {
                        rows.forEach((row, index) => {
                            // Verificar se precisa de nova página
                            if (posicaoY > 250) {
                                doc.addPage();
                                posicaoY = margemTopo;
                            }

                            const cells = row.querySelectorAll('td');
                            const data = cells[0].textContent;
                            const origem = cells[1].textContent;
                            const destino = cells[2].textContent;
                            const distancia = cells[3].textContent;

                            doc.text(`${index + 1}. ${data}`, margemEsquerda, posicaoY);
                            posicaoY += espacoLinha;
                            doc.text(`   De: ${origem} Para: ${destino}`, margemEsquerda, posicaoY);
                            posicaoY += espacoLinha;
                            doc.text(`   Distância: ${distancia}`, margemEsquerda, posicaoY);
                            posicaoY += espacoLinha * 1.5;
                        });
                    } else {
                        doc.text("Nenhum deslocamento encontrado para o período.", margemEsquerda, posicaoY);
                        posicaoY += espacoLinha * 1.5;
                    }
                }
            }

            if (secaoOperacoes.style.display !== 'none') {
                // Verificar se precisa de nova página
                if (posicaoY > 220) {
                    doc.addPage();
                    posicaoY = margemTopo;
                }

                // Adicionar seção de operações
                doc.setFontSize(14);
                doc.setFont("helvetica", "bold");
                doc.text("Operações", margemEsquerda, posicaoY);
                posicaoY += espacoLinha * 1.5;

                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");

                // Buscar dados dos cards de operações
                const cardsOperacoes = operacoesContainer.querySelectorAll('.operacao-card');
                if (cardsOperacoes.length > 0) {
                    cardsOperacoes.forEach((card, index) => {
                        // Verificar se precisa de nova página
                        if (posicaoY > 240) {
                            doc.addPage();
                            posicaoY = margemTopo;
                        }

                        const header = card.querySelector('.operacao-card-header');
                        const tipo = header.querySelector('h4').textContent;
                        const data = header.querySelector('.operacao-data').textContent;

                        const infoItems = card.querySelectorAll('.operacao-info-item');
                        const observacoes = card.querySelector('.operacao-observacoes p').textContent;

                        doc.setFont("helvetica", "bold");
                        doc.text(`${index + 1}. ${tipo} - ${data}`, margemEsquerda, posicaoY);
                        posicaoY += espacoLinha;

                        doc.setFont("helvetica", "normal");

                        // Extrair informações dos itens
                        let infoText = "";
                        infoItems.forEach(item => {
                            const label = item.querySelector('.info-label').textContent;
                            const value = item.querySelector('.info-value').textContent;
                            infoText += `${label} ${value}   `;
                        });

                        // Quebrar o texto em linhas
                        const infoLinhas = doc.splitTextToSize(infoText, 170);
                        doc.text(infoLinhas, margemEsquerda, posicaoY);
                        posicaoY += infoLinhas.length * espacoLinha;

                        doc.setFont("helvetica", "bold");
                        doc.text("Observações:", margemEsquerda, posicaoY);
                        posicaoY += espacoLinha;

                        doc.setFont("helvetica", "normal");
                        const obsLinhas = doc.splitTextToSize(observacoes, 170);
                        doc.text(obsLinhas, margemEsquerda, posicaoY);
                        posicaoY += obsLinhas.length * espacoLinha + 5;

                        // Linha separadora entre operações
                        if (index < cardsOperacoes.length - 1) {
                            doc.setDrawColor(200);
                            doc.line(margemEsquerda, posicaoY - 2, 190, posicaoY - 2);
                            posicaoY += 3;
                        }
                    });
                } else {
                    doc.text("Nenhuma operação encontrada para o período.", margemEsquerda, posicaoY);
                    posicaoY += espacoLinha * 1.5;
                }
            }

            // Rodapé
            doc.setFontSize(8);
            doc.text(`Relatório gerado em ${new Date().toLocaleString()}`, margemEsquerda, 285);

            // Salvar o PDF
            const tipoRel = tipoRelatorioSelect.value;
            const nomeArquivo = `relatorio_${tipoRel}_${formatarDataArquivo(dataInicioInput.value)}_a_${formatarDataArquivo(dataFimInput.value)}.pdf`;
            doc.save(nomeArquivo);
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            alert('Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.');
        }
    }

    // Função para compartilhar relatório via WhatsApp
    function compartilharRelatorio() {
        // Preparar texto para compartilhamento
        const tipoRel = tipoRelatorioSelect.value;
        let tipoTexto = '';

        switch (tipoRel) {
            case 'deslocamentos':
                tipoTexto = 'Deslocamentos';
                break;
            case 'operacoes':
                tipoTexto = 'Operações';
                break;
            case 'completo':
                tipoTexto = 'Completo';
                break;
        }

        const textoCompartilhamento = `
📊 *Relatório ${tipoTexto}*
📅 *Período:* ${relatorioPeriodo.textContent}
👤 *Operador:* ${relatorioOperador.textContent}
👥 *Auxiliar:* ${relatorioAuxiliar.textContent}

📈 *Resumo:*
🚗 Deslocamentos: ${totalDeslocamentos.textContent}
🛣️ Km Percorridos: ${totalKm.textContent}
⚙️ Operações: ${totalOperacoes.textContent}
⏱️ Tempo Mobilização: ${totalMobilizacao.textContent}

Relatório gerado em ${new Date().toLocaleString()}
        `.trim();

        // Criar link para compartilhar no WhatsApp
        const urlWhatsApp = `https://wa.me/?text=${encodeURIComponent(textoCompartilhamento)}`;
        window.open(urlWhatsApp, '_blank');
    }

    // Funções auxiliares
    function formatarData(dataISO) {
        const partes = dataISO.split('-');
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    function formatarDataHora(dataISO) {
        if (!dataISO) return 'N/A';

        const data = new Date(dataISO);
        return data.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function formatarTempoHoras(horas) {
        const horasInteiras = Math.floor(horas);
        const minutos = Math.round((horas - horasInteiras) * 60);
        return `${horasInteiras.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
    }

    function formatarDataArquivo(dataISO) {
        return dataISO.replace(/-/g, '');
    }
});