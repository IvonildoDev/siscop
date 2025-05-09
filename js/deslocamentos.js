document.addEventListener('DOMContentLoaded', function() {
    // Elementos do formulário
    const deslocamentoForm = document.getElementById('deslocamentoForm');
    const origemInput = document.getElementById('origem');
    const destinoInput = document.getElementById('destino');
    const kmInicialInput = document.getElementById('kmInicial');
    const kmFinalInput = document.getElementById('kmFinal');
    const btnIniciarDeslocamento = document.getElementById('iniciarDeslocamento');
    const btnFinalizarDeslocamento = document.getElementById('finalizarDeslocamento');
    const historicoDeslocamentos = document.getElementById('historicoDeslocamentos');
    const btnGerarPDFDeslocamentos = document.getElementById('gerarPDFDeslocamentos');
    const btnLimparHistoricoDeslocamentos = document.getElementById('limparHistoricoDeslocamentos');
    
    // Recuperar dados do usuário
    const usuarioLogado = JSON.parse(sessionStorage.getItem('usuarioLogado') || '{}');
    const nomeOperador = usuarioLogado.nome || 'Não autenticado';
    const matriculaOperador = usuarioLogado.matricula || '';
    const nomeAuxiliar = usuarioLogado.auxiliar || '';
    
    // Exibir informações do usuário na página
    const userInfoContainer = document.getElementById('userInfo');
    if (userInfoContainer) {
        let auxiliarText = nomeAuxiliar ? `<span class="usuario-auxiliar">Aux: ${nomeAuxiliar}</span>` : '';
        userInfoContainer.innerHTML = `
            <div class="usuario-nome">${nomeOperador}</div>
            ${matriculaOperador ? `<div class="usuario-matricula">${matriculaOperador}</div>` : ''}
            ${auxiliarText}
            <button id="btnLogout" class="btn-logout" title="Sair"><i class="fas fa-sign-out-alt"></i></button>
        `;
        const btnLogout = document.getElementById('btnLogout');
        if (btnLogout) {
            btnLogout.addEventListener('click', function() {
                sessionStorage.removeItem('usuarioLogado');
                localStorage.removeItem('usuarioLogado');
                window.location.replace('login.html?status=logout');
            });
        }
    }
    
    // Estado do deslocamento atual
    let deslocamentoAtual = {
        origem: '',
        destino: '',
        kmInicial: 0,
        operador: nomeOperador,
        matricula: matriculaOperador,
        auxiliar: nomeAuxiliar,
        latitude: null,
        longitude: null
    };
    
    // Verificar se há deslocamento ativo
    const deslocamentoAtivo = sessionStorage.getItem('deslocamentoAtivo') === 'true';
    
    if (deslocamentoAtivo && deslocamentoForm) {
        // Recuperar informações do deslocamento ativo
        const origem = sessionStorage.getItem('deslocamentoOrigem');
        const destino = sessionStorage.getItem('deslocamentoDestino');
        const kmInicial = sessionStorage.getItem('deslocamentoKmInicial');
        
        // Preencher formulário com dados do deslocamento ativo
        if (origemInput) origemInput.value = origem;
        if (destinoInput) destinoInput.value = destino;
        if (kmInicialInput) kmInicialInput.value = kmInicial;
        
        // Desabilitar campos e botões apropriados
        if (origemInput) origemInput.disabled = true;
        if (destinoInput) destinoInput.disabled = true;
        if (kmInicialInput) kmInicialInput.disabled = true;
        if (btnIniciarDeslocamento) btnIniciarDeslocamento.disabled = true;
        if (btnFinalizarDeslocamento) btnFinalizarDeslocamento.disabled = false;
        
        // Atualizar estado do deslocamento atual
        deslocamentoAtual.origem = origem;
        deslocamentoAtual.destino = destino;
        deslocamentoAtual.kmInicial = parseFloat(kmInicial);
    }
    
    // Carregar histórico de deslocamentos
    carregarHistoricoDeslocamentos();
    
    // Eventos dos elementos
    if (btnIniciarDeslocamento) {
        btnIniciarDeslocamento.addEventListener('click', iniciarDeslocamento);
    }
    
    if (btnFinalizarDeslocamento) {
        btnFinalizarDeslocamento.addEventListener('click', finalizarDeslocamento);
    }
    
    if (btnGerarPDFDeslocamentos) {
        btnGerarPDFDeslocamentos.addEventListener('click', gerarPDFDeslocamentos);
    }
    
    if (btnLimparHistoricoDeslocamentos) {
        btnLimparHistoricoDeslocamentos.addEventListener('click', limparHistoricoDeslocamentos);
    }
    
    // Função para iniciar deslocamento
    async function iniciarDeslocamento() {
        if (!origemInput || !destinoInput || !kmInicialInput) {
            alert('Formulário incompleto. Recarregue a página e tente novamente.');
            return;
        }
        
        const origem = origemInput.value.trim();
        const destino = destinoInput.value.trim();
        const kmInicial = parseFloat(kmInicialInput.value);
        
        if (!origem || !destino || isNaN(kmInicial) || kmInicial < 0) {
            alert('Por favor, preencha todos os campos corretamente.');
            return;
        }
        
        // Atualizar estado do deslocamento atual
        deslocamentoAtual.origem = origem;
        deslocamentoAtual.destino = destino;
        deslocamentoAtual.kmInicial = kmInicial;
        
        // Obter coordenadas geográficas se disponível
        try {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    function(position) {
                        deslocamentoAtual.latitude = position.coords.latitude;
                        deslocamentoAtual.longitude = position.coords.longitude;
                        iniciarDeslocamentoNoSistema();
                    },
                    function(error) {
                        console.warn('Erro ao obter geolocalização:', error);
                        iniciarDeslocamentoNoSistema();
                    }
                );
            } else {
                console.warn('Geolocalização não suportada pelo navegador');
                iniciarDeslocamentoNoSistema();
            }
        } catch (error) {
            console.error('Erro ao acessar geolocalização:', error);
            iniciarDeslocamentoNoSistema();
        }
    }
    
    // Função para iniciar deslocamento no sistema após obter (ou não) a geolocalização
    async function iniciarDeslocamentoNoSistema() {
        try {
            // Desabilitar campos e botões apropriados
            if (origemInput) origemInput.disabled = true;
            if (destinoInput) destinoInput.disabled = true;
            if (kmInicialInput) kmInicialInput.disabled = true;
            if (btnIniciarDeslocamento) btnIniciarDeslocamento.disabled = true;
            if (btnFinalizarDeslocamento) btnFinalizarDeslocamento.disabled = false;
            
            // Armazenar estado do deslocamento na sessão
            sessionStorage.setItem('deslocamentoAtivo', 'true');
            sessionStorage.setItem('deslocamentoOrigem', deslocamentoAtual.origem);
            sessionStorage.setItem('deslocamentoDestino', deslocamentoAtual.destino);
            sessionStorage.setItem('deslocamentoKmInicial', deslocamentoAtual.kmInicial.toString());
            sessionStorage.setItem('deslocamentoDataInicio', new Date().toISOString());
            sessionStorage.setItem('deslocamentoLatitude', deslocamentoAtual.latitude || '');
            sessionStorage.setItem('deslocamentoLongitude', deslocamentoAtual.longitude || '');
            
            // Não salvar no banco ainda, apenas quando finalizar o deslocamento
            console.log('Deslocamento iniciado:', {
                origem: deslocamentoAtual.origem,
                destino: deslocamentoAtual.destino,
                kmInicial: deslocamentoAtual.kmInicial,
                dataInicio: new Date().toISOString(),
                operador: deslocamentoAtual.operador,
                matricula: deslocamentoAtual.matricula,
                auxiliar: deslocamentoAtual.auxiliar,
                latitude: deslocamentoAtual.latitude,
                longitude: deslocamentoAtual.longitude
            });
        } catch (error) {
            console.error('Erro ao iniciar deslocamento:', error);
            alert('Ocorreu um erro ao iniciar o deslocamento. Tente novamente.');
        }
    }
    
    // Função para finalizar deslocamento
    async function finalizarDeslocamento() {
        try {
            if (!kmFinalInput) {
                alert('Campo de KM final não encontrado. Recarregue a página e tente novamente.');
                return;
            }
            
            const kmFinal = parseFloat(kmFinalInput.value);
            
            if (isNaN(kmFinal) || kmFinal <= 0) {
                alert('Por favor, insira a quilometragem final válida.');
                return;
            }
            
            const kmInicial = parseFloat(sessionStorage.getItem('deslocamentoKmInicial') || '0');
            
            if (kmFinal < kmInicial) {
                alert('A quilometragem final não pode ser menor que a inicial.');
                return;
            }
            
            const distanciaPercorrida = kmFinal - kmInicial;
            
            // Preparar dados do deslocamento
            const dadosDeslocamento = {
                origem: sessionStorage.getItem('deslocamentoOrigem'),
                destino: sessionStorage.getItem('deslocamentoDestino'),
                km_inicial: kmInicial,
                km_final: kmFinal,
                distancia_percorrida: distanciaPercorrida,
                data_inicio: sessionStorage.getItem('deslocamentoDataInicio'),
                data_fim: new Date().toISOString(),
                operador: nomeOperador,
                matricula: matriculaOperador,
                auxiliar: nomeAuxiliar,
                latitude: sessionStorage.getItem('deslocamentoLatitude') || null,
                longitude: sessionStorage.getItem('deslocamentoLongitude') || null
            };
            
            // Salvar deslocamento no banco de dados
            await window.api.saveDeslocamento(dadosDeslocamento);
            
            // Limpar estado do deslocamento na sessão
            sessionStorage.removeItem('deslocamentoAtivo');
            sessionStorage.removeItem('deslocamentoOrigem');
            sessionStorage.removeItem('deslocamentoDestino');
            sessionStorage.removeItem('deslocamentoKmInicial');
            sessionStorage.removeItem('deslocamentoDataInicio');
            sessionStorage.removeItem('deslocamentoLatitude');
            sessionStorage.removeItem('deslocamentoLongitude');
            
            // Resetar formulário
            if (deslocamentoForm) deslocamentoForm.reset();
            
            // Habilitar campos e botões apropriados
            if (origemInput) origemInput.disabled = false;
            if (destinoInput) destinoInput.disabled = false;
            if (kmInicialInput) kmInicialInput.disabled = false;
            if (btnIniciarDeslocamento) btnIniciarDeslocamento.disabled = false;
            if (btnFinalizarDeslocamento) btnFinalizarDeslocamento.disabled = true;
            
            // Atualizar histórico
            await carregarHistoricoDeslocamentos();
            
            alert('Deslocamento finalizado com sucesso!');
        } catch (error) {
            console.error('Erro ao finalizar deslocamento:', error);
            alert('Ocorreu um erro ao finalizar o deslocamento. Tente novamente.');
        }
    }
    
    // Função para carregar histórico de deslocamentos
    async function carregarHistoricoDeslocamentos() {
        if (!historicoDeslocamentos) return;
        
        try {
            historicoDeslocamentos.innerHTML = '<li class="loading">Carregando histórico...</li>';
            
            // Buscar deslocamentos do banco de dados
            const deslocamentos = await window.api.getDeslocamentos();
            
            if (deslocamentos.length === 0) {
                historicoDeslocamentos.innerHTML = '<li class="sem-historico">Nenhum deslocamento registrado.</li>';
                return;
            }
            
            // Ordenar por data (mais recentes primeiro)
            deslocamentos.sort((a, b) => {
                const dataA = new Date(a.data_inicio || a.data_fim || 0);
                const dataB = new Date(b.data_inicio || b.data_fim || 0);
                return dataB - dataA;
            });
            
            historicoDeslocamentos.innerHTML = '';
            
            // Criar elemento para cada deslocamento
            deslocamentos.forEach(deslocamento => {
                const dataInicio = deslocamento.data_inicio ? new Date(deslocamento.data_inicio).toLocaleString() : 'N/A';
                const dataFim = deslocamento.data_fim ? new Date(deslocamento.data_fim).toLocaleString() : 'Em andamento';
                const distancia = deslocamento.distancia_percorrida ? `${deslocamento.distancia_percorrida} km` : 'N/A';
                const status = deslocamento.pendenteSincronizacao ? '<span class="status-pendente">Pendente de sincronização</span>' : '';
                
                const itemHTML = `
                    <div class="historico-cabecalho">
                        <span class="historico-data">${dataInicio}</span>
                        ${status}
                    </div>
                    <div class="historico-corpo">
                        <div class="historico-info">
                            <span class="info-label">Origem:</span>
                            <span class="info-valor">${deslocamento.origem || 'N/A'}</span>
                        </div>
                        <div class="historico-info">
                            <span class="info-label">Destino:</span>
                            <span class="info-valor">${deslocamento.destino || 'N/A'}</span>
                        </div>
                        <div class="historico-info">
                            <span class="info-label">Distância:</span>
                            <span class="info-valor">${distancia}</span>
                        </div>
                        <div class="historico-info">
                            <span class="info-label">Término:</span>
                            <span class="info-valor">${dataFim}</span>
                        </div>
                        <div class="historico-info">
                            <span class="info-label">Operador:</span>
                            <span class="info-valor">${deslocamento.operador || 'N/A'}</span>
                        </div>
                        <div class="historico-info">
                            <span class="info-label">Auxiliar:</span>
                            <span class="info-valor">${deslocamento.auxiliar || 'N/A'}</span>
                        </div>
                    </div>
                `;
                
                const li = document.createElement('li');
                li.className = 'historico-item';
                li.innerHTML = itemHTML;
                historicoDeslocamentos.appendChild(li);
            });
        } catch (error) {
            console.error('Erro ao carregar histórico de deslocamentos:', error);
            historicoDeslocamentos.innerHTML = '<li class="erro">Erro ao carregar histórico. Tente novamente mais tarde.</li>';
        }
    }
    
    // Função para gerar PDF do histórico de deslocamentos
    async function gerarPDFDeslocamentos() {
        try {
            // Verificar se jsPDF está disponível
            if (!window.jspdf || !window.jspdf.jsPDF) {
                alert('Biblioteca de geração de PDF não carregada. Tente novamente mais tarde.');
                return;
            }
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Título do relatório
            doc.setFontSize(16);
            doc.text('Relatório de Deslocamentos', 20, 20);
            
            // Informações do operador
            doc.setFontSize(12);
            doc.text(`Operador: ${nomeOperador} (${matriculaOperador})`, 20, 30);
            if (nomeAuxiliar) {
                doc.text(`Auxiliar: ${nomeAuxiliar}`, 20, 40);
            }
            
            // Data de geração
            doc.setFontSize(10);
            doc.text(`Gerado em: ${new Date().toLocaleString()}`, 20, nomeAuxiliar ? 50 : 40);
            
            // Buscar deslocamentos
            const deslocamentos = await window.api.getDeslocamentos();
            
            if (deslocamentos.length === 0) {
                doc.setFontSize(12);
                doc.text('Nenhum deslocamento registrado.', 20, 60);
            } else {
                // Ordenar por data (mais recentes primeiro)
                deslocamentos.sort((a, b) => {
                    const dataA = new Date(a.data_inicio || a.data_fim || 0);
                    const dataB = new Date(b.data_inicio || b.data_fim || 0);
                    return dataB - dataA;
                });
                
                let y = 60;
                
                // Adicionar cada deslocamento ao PDF
                deslocamentos.forEach((d, index) => {
                    // Verificar se precisa adicionar nova página
                    if (y > 250) {
                        doc.addPage();
                        y = 20;
                    }
                    
                    const dataInicio = d.data_inicio ? new Date(d.data_inicio).toLocaleString() : 'N/A';
                    const dataFim = d.data_fim ? new Date(d.data_fim).toLocaleString() : 'Em andamento';
                    const distancia = d.distancia_percorrida ? `${d.distancia_percorrida} km` : 'N/A';
                    
                    doc.setFontSize(11);
                    doc.setFont(undefined, 'bold');
                    doc.text(`Deslocamento ${index + 1}`, 20, y);
                    y += 6;
                    
                    doc.setFontSize(10);
                    doc.setFont(undefined, 'normal');
                    doc.text(`Data/Hora: ${dataInicio}`, 20, y);
                    y += 5;
                    doc.text(`Origem: ${d.origem || 'N/A'}`, 20, y);
                    y += 5;
                    doc.text(`Destino: ${d.destino || 'N/A'}`, 20, y);
                    y += 5;
                    doc.text(`Distância: ${distancia}`, 20, y);
                    y += 5;
                    doc.text(`Término: ${dataFim}`, 20, y);
                    y += 5;
                    doc.text(`Operador: ${d.operador || 'N/A'}`, 20, y);
                    y += 5;
                    doc.text(`Auxiliar: ${d.auxiliar || 'N/A'}`, 20, y);
                    y += 10;
                });
            }
            
            // Salvar o PDF
            doc.save('relatorio_deslocamentos.pdf');
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            alert('Ocorreu um erro ao gerar o PDF. Tente novamente.');
        }
    }
    
    // Função para limpar histórico de deslocamentos
    function limparHistoricoDeslocamentos() {
        if (confirm('Tem certeza que deseja limpar todo o histórico de deslocamentos? Esta ação não pode ser desfeita.')) {
            try {
                // Aqui apenas limpa a visualização. Os dados continuam no banco.
                // Para realmente limpar os dados, seria necessário implementar uma 
                // função na API para excluir os registros.
                historicoDeslocamentos.innerHTML = '<li class="sem-historico">Nenhum deslocamento registrado.</li>';
                alert('Histórico de deslocamentos limpo com sucesso!');
            } catch (error) {
                console.error('Erro ao limpar histórico:', error);
                alert('Ocorreu um erro ao limpar o histórico. Tente novamente.');
            }
        }
    }
});