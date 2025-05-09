const { jsPDF } = window.jspdf;

// Variáveis globais
let localizacaoCapturada = null;
let horaInicio = null;

const hamburger = document.querySelector(".hamburger"),
  navMenu = document.querySelector(".nav-menu");

hamburger.addEventListener("click", () => {
  hamburger.classList.toggle("active"),
    navMenu.classList.toggle("active")
});

document.querySelectorAll(".nav-menu a").forEach(a => a.addEventListener("click", () => {
  hamburger.classList.remove("active"),
    navMenu.classList.remove("active")
}));

// Função para formatar data e hora
function formatarDataHoraLocal(data) {
  const padZero = num => num.toString().padStart(2, "0");
  return `${padZero(data.getDate())}/${padZero(data.getMonth() + 1)}/${data.getFullYear()} ${padZero(data.getHours())}:${padZero(data.getMinutes())}`;
}

// Função para salvar operação no localStorage
function salvarOperacao(operacao) {
  let operacoes = JSON.parse(localStorage.getItem("operacoes")) || [];
  operacoes.push(operacao);
  localStorage.setItem("operacoes", JSON.stringify(operacoes));
}

// Adicione no início do arquivo, após as variáveis globais
document.addEventListener('DOMContentLoaded', () => {
  // Referências dos elementos de deslocamento
  const startBtn = document.getElementById('startBtn');
  const endBtn = document.getElementById('endBtn');
  const startKmInput = document.getElementById('startKm');
  const endKmInput = document.getElementById('endKm');
  const originInput = document.getElementById('origin');
  const destinationInput = document.getElementById('destination');
  const historyList = document.getElementById('historyList');
  const limparHistoricoBtn = document.getElementById("limparHistorico");

  // Inicialização dos botões
  if (startBtn && endBtn && endKmInput) {
    endBtn.disabled = true;
    endKmInput.disabled = true;
    startBtn.disabled = true;
  }

  // Função para validar campos iniciais
  function validarCamposIniciais() {
    return originInput && destinationInput && startKmInput &&
      originInput.value.trim() !== '' &&
      destinationInput.value.trim() !== '' &&
      startKmInput.value.trim() !== '';
  }

  // Eventos para validar campos ao digitar
  if (originInput && destinationInput && startKmInput) {
    [originInput, destinationInput, startKmInput].forEach(input => {
      input.addEventListener('input', () => {
        if (startBtn) {
          startBtn.disabled = !validarCamposIniciais();
        }
      });
    });
  }

  // Modifique o evento de iniciar deslocamento
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      if (validarCamposIniciais()) {
        // Desabilita campos iniciais
        originInput.disabled = true;
        destinationInput.disabled = true;
        startKmInput.disabled = true;
        startBtn.disabled = true;

        // Habilita campo KM final
        endKmInput.disabled = false;

        // Define valor mínimo para KM final
        endKmInput.min = startKmInput.value;

        // Quando o campo KM final for alterado, atualiza o campo de quilometragem inicial
        endKmInput.addEventListener('change', () => {
          const kmInicialOperacao = document.getElementById('kmInicial');
          if (kmInicialOperacao && endKmInput.value) {
            kmInicialOperacao.value = endKmInput.value;
          }
        });

        // Alerta personalizado com informações do deslocamento
        alert(`Deslocamento iniciado!\n\nOrigem: ${originInput.value}\nDestino: ${destinationInput.value}\nKM Inicial: ${startKmInput.value}`);
      }
    });
  }

  // Evento de finalizar deslocamento
  if (endBtn) {
    endBtn.addEventListener('click', () => {
      const kmInicial = parseFloat(startKmInput.value);
      const kmFinal = parseFloat(endKmInput.value);

      if (kmFinal <= kmInicial) {
        alert('O KM final deve ser maior que o KM inicial!');
        return;
      }

      const distancia = kmFinal - kmInicial;

      // Crie um objeto de operação com as informações de viagem
      const operacao = {
        inicioOperacao: formatarDataHoraLocal(new Date()),
        fimOperacao: formatarDataHoraLocal(new Date()),
        origem: originInput.value,
        destino: destinationInput.value,
        kmInicial: kmInicial,
        kmFinal: kmFinal,
        distanciaPercorrida: distancia,
        timestamp: new Date().toLocaleString()
      };

      // Salve a operação e adicione ao histórico
      salvarOperacao(operacao);
      adicionarOperacaoAoHistorico(operacao);

      // Resetar campos
      originInput.value = '';
      destinationInput.value = '';
      startKmInput.value = '';
      endKmInput.value = '';

      // Reseta estados
      originInput.disabled = false;
      destinationInput.disabled = false;
      startKmInput.disabled = false;
      endKmInput.disabled = true;
      startBtn.disabled = true;
      endBtn.disabled = true;

      alert('Deslocamento finalizado e salvo com sucesso!');
    });
  }

  // Validação do KM final
  if (endKmInput) {
    endKmInput.addEventListener('input', () => {
      const kmInicial = parseFloat(startKmInput.value);
      const kmFinal = parseFloat(endKmInput.value);
      if (endBtn) {
        endBtn.disabled = kmFinal <= kmInicial;
      }
    });
  }

  // Função para limpar histórico
  if (limparHistoricoBtn) {
    limparHistoricoBtn.addEventListener("click", function () {
      if (confirm("Tem certeza que deseja limpar todo o histórico? Esta ação não pode ser desfeita.")) {
        try {
          // Limpa o localStorage
          localStorage.removeItem("operacoes");

          // Limpa a lista de operações na tela
          const historicoElement = document.getElementById("historicoOperacoes");
          if (historicoElement) {
            historicoElement.innerHTML = "<li class=\"sem-operacoes\">Nenhuma operação registrada hoje</li>";
          }

          alert("Histórico limpo com sucesso!");
        } catch (erro) {
          console.error("Erro ao limpar histórico:", erro);
          alert("Erro ao limpar o histórico. Por favor, tente novamente.");
        }
      }
    });
  }
});

// Modifique o evento de marcar início da operação
document.getElementById("marcarInicio")?.addEventListener("click", function () {
  const endKmInput = document.getElementById('endKm');

  // Verifica se o KM final está preenchido
  if (!endKmInput || !endKmInput.value) {
    alert('Por favor, preencha o KM final do deslocamento antes de iniciar a operação.');
    return;
  }

  const agora = new Date();
  horaInicio = agora;

  // Formata a data para o input datetime-local
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  const hora = String(agora.getHours()).padStart(2, '0');
  const minuto = String(agora.getMinutes()).padStart(2, '0');
  const dataInicioFormatada = `${ano}-${mes}-${dia}T${hora}:${minuto}`;

  // Atualiza campo de início
  const campoInicio = document.getElementById("inicioOperacao");
  if (campoInicio) {
    campoInicio.value = dataInicioFormatada;
  }

  // Habilita campos do formulário
  const campos = document.querySelectorAll("#operacaoForm input:not(#inicioOperacao), #operacaoForm select, #operacaoForm textarea");
  campos.forEach(campo => campo.removeAttribute("disabled"));

  // Preenche o campo de quilometragem inicial com o valor do campo de KM final do deslocamento
  const kmInicialOperacao = document.getElementById('kmInicial');
  if (kmInicialOperacao) {
    kmInicialOperacao.value = endKmInput.value;
  }

  // Desabilita botão de início
  this.disabled = true;
});

// Evento de captura de localização
document.getElementById("capturarLocalizacao")?.addEventListener("click", function () {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function (posicao) {
        const latitude = posicao.coords.latitude;
        const longitude = posicao.coords.longitude;
        const horaCaptura = new Date().toLocaleString();

        localizacaoCapturada = { latitude, longitude, hora: horaCaptura };
        alert(`Localização capturada: Latitude ${latitude}, Longitude ${longitude} às ${horaCaptura}`);
      },
      function (erro) {
        alert("Erro ao capturar localização: " + erro.message);
      }
    );
  } else {
    alert("Geolocalização não é suportada por este navegador.");
  }
});

// Modifique o trecho que lida com o submit do formulário

document.getElementById("operacaoForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  try {
    // Verifique se você está incluindo todos os campos obrigatórios
    const dadosOperacao = {
      inicio_operacao: document.getElementById("inicioOperacao").value,
      fim_operacao: new Date().toISOString(),
      nome_op_aux: document.getElementById("nomeOpAux").value,
      tipo_operacao: document.getElementById("tipoOperacao").value,
      nome_cidade: document.getElementById("nomeCidade").value,
      nome_poco_serv: document.getElementById("nomePocoServ").value,
      nome_operador: document.getElementById("nomeOperador").value,
      volume_bbl: parseFloat(document.getElementById("volumeBbl").value),
      temperatura: parseFloat(document.getElementById("temperatura").value),
      pressao: parseFloat(document.getElementById("pressao").value),
      descricao_atividades: document.getElementById("descricaoAtividades").value,
      // Verifique se esses campos adicionais são necessários
      km_inicial: parseFloat(document.getElementById("kmInicial").value || 0),
      km_final: parseFloat(document.getElementById("kmFinal").value || 0),
      deslocamento_id: parseInt(localStorage.getItem("deslocamentoAtualId") || 0)
    };

    console.log("Enviando dados do formulário:", dadosOperacao);

    // Envia para a API em vez de apenas salvar no localStorage
    const response = await fetch("http://localhost:8000/operacoes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(dadosOperacao)
    });

    if (!response.ok) {
      throw new Error(`Erro ao salvar operação: ${response.status}`);
    }

    const resultado = await response.json();
    console.log("Operação salva com sucesso:", resultado);

    // Limpa o formulário e atualiza a interface
    this.reset();
    carregarHistoricoOperacoes(); // Função para atualizar a lista de operações

    alert("Operação salva com sucesso!");
  } catch (erro) {
    console.error("Erro ao salvar operação:", erro);
    alert("Erro ao salvar operação. Verifique o console para mais detalhes.");
  }
});

// Função para carregar o histórico via API em vez de localStorage
async function carregarHistoricoOperacoes() {
  try {
    const response = await fetch("http://localhost:8000/operacoes");
    if (!response.ok) {
      throw new Error(`Erro ao carregar operações: ${response.status}`);
    }

    const operacoes = await response.json();
    const historicoElement = document.getElementById("historicoOperacoes");
    historicoElement.innerHTML = "";

    // Renderiza cada operação na lista
    operacoes.forEach(operacao => {
      const listItem = document.createElement("li");
      // Preencha com os dados da operação
      listItem.innerHTML = `
        <strong>Data:</strong> ${new Date(operacao.inicio_operacao).toLocaleString()} <br>
        <strong>Volume:</strong> ${operacao.volume_bbl} bbl <br>
        <strong>Temperatura:</strong> ${operacao.temperatura} °C <br>
        <!-- Outros campos -->
      `;
      historicoElement.appendChild(listItem);
    });
  } catch (erro) {
    console.error("Erro ao carregar histórico:", erro);
  }
}

// Carrega o histórico quando a página é carregada
document.addEventListener("DOMContentLoaded", function () {
  carregarHistoricoOperacoes();
});

// Inicialização quando o DOM é carregado
document.addEventListener("DOMContentLoaded", function () {
  // Desabilita campos inicialmente
  const campos = document.querySelectorAll("#operacaoForm input:not(#inicioOperacao), #operacaoForm select, #operacaoForm textarea");
  campos?.forEach(campo => campo.setAttribute("disabled", "disabled"));

  // Carrega operações do dia
  if (document.getElementById("historicoOperacoes")) {
    carregarOperacoesDoDia();
  }
});

function carregarOperacoesDoDia() {
  const a = JSON.parse(localStorage.getItem("operacoes")) || [],
    b = new Date().toLocaleDateString(),
    c = a.filter(a => {
      const c = new Date(a.timestamp).toLocaleDateString();
      return c === b;
    }),
    d = document.getElementById("historicoOperacoes");

  if (d) {
    d.innerHTML = "";
    if (0 === c.length) {
      d.innerHTML = "<li class=\"sem-operacoes\">Nenhuma operação registrada hoje</li>";
    } else {
      c.forEach(a => {
        const b = document.createElement("li");
        let c = a.localizacao ? `Lat: ${a.localizacao.latitude.toFixed(4)}, Long: ${a.localizacao.longitude.toFixed(4)}` : "Não capturada";
        b.innerHTML = `
          <div class="operacao-item">
            <div class="operacao-grid">
              <div class="grid-item">
                <strong>Início:</strong><br>
                ${a.inicioOperacao}
              </div>
              <div class="grid-item">
                <strong>Fim:</strong><br>
                ${a.fimOperacao}
              </div>
              <div class="grid-item">
                <strong>Quilometragem:</strong><br>
                Inicial: ${a.kmInicial}km<br>
                Final: ${a.kmFinal}km<br>
                Percorrido: ${a.distanciaPercorrida}km
              </div>
              <div class="grid-item">
                <strong>OP/Aux:</strong><br>
                ${a.nomeOpAux}
              </div>
              <div class="grid-item">
                <strong>Tipo Operação:</strong><br>
                ${a.tipoOperacao}
              </div>
              <div class="grid-item">
                <strong>Cidade:</strong><br>
                ${a.nomeCidade}
              </div>
              <div class="grid-item">
                <strong>Poço/Serviço:</strong><br>
                ${a.nomePocoServ}
              </div>
              <div class="grid-item">
                <strong>Operador:</strong><br>
                ${a.nomeOperador}
              </div>
              <div class="grid-item">
                <strong>Volume:</strong><br>
                ${a.volumeBbl} bbl
              </div>
              <div class="grid-item">
                <strong>Temperatura:</strong><br>
                ${a.temperatura}°C
              </div>
              <div class="grid-item">
                <strong>Pressão:</strong><br>
                ${a.pressao} PSI
              </div>
              <div class="grid-item grid-item-full">
                <strong>Localização:</strong><br>
                ${c}
              </div>
              <div class="grid-item grid-item-full">
                <strong>Descrição:</strong><br>
                ${a.descricaoAtividades}
              </div>
            </div>
          </div>
        `;
        d.appendChild(b);
      });
    }
  }
}

// Modifique a função de adicionar operação ao histórico
function adicionarOperacaoAoHistorico(operacao) {
  const listItem = document.createElement("li");
  listItem.innerHTML = `
    <div class="operacao-item">
      <div class="operacao-grid">
        <div class="grid-item">
          <strong>Início:</strong><br>
          ${operacao.inicioOperacao}
        </div>
        <div class="grid-item">
          <strong>Fim:</strong><br>
          ${operacao.fimOperacao}
        </div>
        <div class="grid-item">
          <strong>Origem:</strong><br>
          ${operacao.origem || 'Não informado'}
        </div>
        <div class="grid-item">
          <strong>Destino:</strong><br>
          ${operacao.destino || 'Não informado'}
        </div>
        <div class="grid-item">
          <strong>Quilometragem:</strong><br>
          Inicial: ${operacao.kmInicial}km<br>
          Final: ${operacao.kmFinal}km<br>
          Percorrido: ${operacao.distanciaPercorrida}km
        </div>
        <div class="grid-item">
          <strong>OP/Aux:</strong><br>
          ${operacao.nomeOpAux}
        </div>
        <div class="grid-item">
          <strong>Tipo Operação:</strong><br>
          ${operacao.tipoOperacao}
        </div>
        <div class="grid-item">
          <strong>Cidade:</strong><br>
          ${operacao.nomeCidade}
        </div>
        <div class="grid-item">
          <strong>Poço/Serviço:</strong><br>
          ${operacao.nomePocoServ}
        </div>
        <div class="grid-item">
          <strong>Operador:</strong><br>
          ${operacao.nomeOperador}
        </div>
        <div class="grid-item">
          <strong>Volume:</strong><br>
          ${operacao.volumeBbl} bbl
        </div>
        <div class="grid-item">
          <strong>Temperatura:</strong><br>
          ${operacao.temperatura}°C
        </div>
        <div class="grid-item">
          <strong>Pressão:</strong><br>
          ${operacao.pressao} PSI
        </div>
        <div class="grid-item grid-item-full">
          <strong>Descrição:</strong><br>
          ${operacao.descricaoAtividades}
        </div>
      </div>
    </div>
  `;
  const historicoOperacoes = document.getElementById("historicoOperacoes");
  if (historicoOperacoes) {
    historicoOperacoes.insertBefore(listItem, historicoOperacoes.firstChild);
  }
}

function excluirOperacao(a) {
  if (confirm("Tem certeza que deseja excluir esta operação?")) {
    const b = JSON.parse(localStorage.getItem("historicoOperacoes")) || [],
      c = b.filter(b => b.timestamp !== a);
    localStorage.setItem("historicoOperacoes", JSON.stringify(c));
    exibirHistorico();
  }
}

document.addEventListener("DOMContentLoaded", exibirHistorico);

function exibirHistorico() {
  const a = document.getElementById("historicoOperacoes");
  a.innerHTML = "";
  const b = JSON.parse(localStorage.getItem("historicoOperacoes")) || [];
  b.forEach((b, c) => {
    const d = document.createElement("li");
    d.innerHTML = `
      <div class="operacao-item">
        <div class="operacao-info">
          <strong>Data/Hora:</strong> ${b.dataHora}<br>
          <strong>OP/Aux:</strong> ${b.nomeOpAux}<br>
          <strong>Tipo de Operação:</strong> ${b.tipoOperacao}<br>
          <strong>Cidade:</strong> ${b.nomeCidade}<br>
          <strong>Poço/Serviço:</strong> ${b.nomePocoServ}
        </div>
        <button class="btn-excluir" data-index="${c}">Excluir</button>
      </div>
    `;
    a.appendChild(d);
  });
  document.querySelectorAll(".btn-excluir").forEach(a => {
    a.addEventListener("click", function () {
      const a = this.getAttribute("data-index");
      excluirOperacao(a);
    });
  });
}

// Evento para gerar PDF
document.getElementById("gerarPDF")?.addEventListener("click", function () {
  try {
    const doc = new jsPDF();
    const operacoes = JSON.parse(localStorage.getItem("operacoes")) || [];
    const dataAtual = new Date().toLocaleDateString();

    // Configurações do PDF
    const margemEsquerda = 20;
    const margemTopo = 20;
    const espacoLinha = 7;
    let posicaoY = margemTopo;

    // Título do relatório
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`Relatório de Operações - ${dataAtual}`, margemEsquerda, posicaoY);
    posicaoY += espacoLinha * 2;

    // Configuração para o conteúdo
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    // Função auxiliar para adicionar texto com título em negrito
    const adicionarCampo = (titulo, valor) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${titulo}: `, margemEsquerda, posicaoY);
      doc.setFont("helvetica", "normal");

      // Quebra de texto para valores longos
      const texto = valor.toString();
      const linhas = doc.splitTextToSize(texto, 170);
      doc.text(linhas, margemEsquerda + 40, posicaoY);
      posicaoY += linhas.length * espacoLinha;
    };

    // Adiciona cada operação ao PDF
    operacoes.forEach(operacao => {
      // Verifica se precisa de nova página
      if (posicaoY > 250) {
        doc.addPage();
        posicaoY = margemTopo;
      }

      adicionarCampo("Data/Hora Início", operacao.inicioOperacao);
      adicionarCampo("Data/Hora Fim", operacao.fimOperacao);
      adicionarCampo("Quilometragem", `Inicial: ${operacao.kmInicial}km | Final: ${operacao.kmFinal}km | Percorrido: ${operacao.distanciaPercorrida}km`);
      adicionarCampo("OP/Aux", operacao.nomeOpAux);
      adicionarCampo("Tipo de Operação", operacao.tipoOperacao);
      adicionarCampo("Cidade", operacao.nomeCidade);
      adicionarCampo("Poço/Serviço", operacao.nomePocoServ);
      adicionarCampo("Operador", operacao.nomeOperador);
      adicionarCampo("Volume", `${operacao.volumeBbl} bbl`);
      adicionarCampo("Temperatura", `${operacao.temperatura} °C`);
      adicionarCampo("Pressão", `${operacao.pressao} PSI`);

      if (operacao.localizacao) {
        adicionarCampo("Localização", `Lat: ${operacao.localizacao.latitude.toFixed(4)}, Long: ${operacao.localizacao.longitude.toFixed(4)}`);
      }

      adicionarCampo("Descrição", operacao.descricaoAtividades);

      // Adiciona linha separadora entre operações
      posicaoY += espacoLinha;
      doc.setDrawColor(200);
      doc.line(margemEsquerda, posicaoY, 190, posicaoY);
      posicaoY += espacoLinha;
    });

    // Adiciona rodapé com data de geração
    doc.setFontSize(8);
    doc.text(`Relatório gerado em ${dataAtual}`, margemEsquerda, 285);

    // Salva o PDF
    doc.save(`relatorio_operacoes_${dataAtual.replace(/\//g, "-")}.pdf`);

    alert("PDF gerado com sucesso!");
  } catch (erro) {
    console.error("Erro ao gerar PDF:", erro);
    alert("Erro ao gerar o PDF. Por favor, tente novamente.");
  }
});