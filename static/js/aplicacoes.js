document.addEventListener('DOMContentLoaded', () => {
    initializePage();
    loadInitialData();
    setupFormHandlers();
    initializeFiltros();
    carregarAplicacoes();
    showForm('quimicos');
});

function getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function initializePage() {
    const dateDisplay = document.getElementById('current-date');
    const yearDisplay = document.getElementById('current-year');
    
    const currentDate = new Date();
    dateDisplay.textContent = currentDate.toLocaleDateString('pt-BR');
    yearDisplay.textContent = currentDate.getFullYear();

    // Inicializar a semana atual para ambos os formulários
    const semanaInputs = ['semana', 'semanaFert'];
    semanaInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            const currentWeek = getWeekNumber(currentDate);
            input.value = currentWeek;
        }
    });
}

function getUnidadeMedida(tipo) {
    switch(tipo.toUpperCase()) {
        case 'KG':
            return 'kg';
        case 'L':
            return 'L';
        default:
            return 'un';
    }
}

async function loadInitialData() {
    try {
        await Promise.all([
            carregarAplicadores(),
            carregarSetores()
        ]);
        // Adicionar chamada para carregar aplicações iniciais
        await carregarAplicacoes();
    } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
    }
}

async function carregarAplicadores() {
    const responseFunc = await fetch('/get_aplicador');
    const dataFunc = await responseFunc.json();
    
    if (dataFunc.status === 'success') {
        const seletores = ['aplicador', 'aplicadorFert'];
        seletores.forEach(seletorId => {
            const select = document.getElementById(seletorId);
            if (select) {
                select.innerHTML = '<option value="">Selecione o aplicador</option>';
                dataFunc.funcionarios.forEach(func => {
                    const option = document.createElement('option');
                    option.value = func.id;
                    option.textContent = func.nome;
                    select.appendChild(option);
                });
            }
        });
    }
}

async function carregarSetores() {
    const responseValv = await fetch('/get_valvulas');
    const dataValv = await responseValv.json();
    
    if (dataValv.status === 'success') {
        const seletores = ['setor', 'setorFert'];
        seletores.forEach(seletorId => {
            const select = document.getElementById(seletorId);
            if (select) {
                select.innerHTML = '<option value="">Selecione o setor</option>';
                dataValv.valvulas.forEach(valv => {
                    const option = document.createElement('option');
                    option.value = valv.id;
                    option.textContent = `${valv.valvula} - ${valv.variedade}`;
                    select.appendChild(option);
                });
            }
        });
    }
}

function showForm(tipo) {
    // Remove a classe active de todos os botões
    const buttons = document.querySelectorAll('.type-button');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // Adiciona a classe active ao botão correto
    const activeButton = document.querySelector(`[onclick="showForm('${tipo}')"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    // Ocultar todos os formulários
    const pulverizacaoForm = document.getElementById('pulverizacaoForm');
    const fertirrigacaoForm = document.getElementById('fertirrigacaoForm');
    const pulverizacaoTitle = pulverizacaoForm.querySelector('h2');
    pulverizacaoForm.style.display = 'none';
    fertirrigacaoForm.style.display = 'none';
    
    // Configurar o tipo e mostrar o formulário correto
    switch(tipo) {
        case 'quimicos':
            pulverizacaoTitle.textContent = 'Registro de Aplicações de Químicos';
            pulverizacaoForm.querySelector('form').setAttribute('data-tipo', 'QUIMICOS');
            pulverizacaoForm.style.display = 'block';
            break;
        case 'foliar':
            pulverizacaoTitle.textContent = 'Registro de Aplicações Foliares';
            pulverizacaoForm.querySelector('form').setAttribute('data-tipo', 'FOLIAR');
            pulverizacaoForm.style.display = 'block';
            break;
        case 'hormonal':
            pulverizacaoTitle.textContent = 'Registro de Aplicações Hormonais';
            pulverizacaoForm.querySelector('form').setAttribute('data-tipo', 'HORMONAL');
            pulverizacaoForm.style.display = 'block';
            break;
        case 'fertirrigacao':
            fertirrigacaoForm.style.display = 'block';
            break;
    }
}
function formatarVolume(valor) {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(valor);
}

function setupFormHandlers() {
    const forms = {
        'formPulverizacao': 'QUIMICOS', 
        'formFertirrigacao': 'FERTIRRIGACAO'
    };

    Object.entries(forms).forEach(([formId, tipo]) => {
        const form = document.getElementById(formId);
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await registrarAplicacao(tipo);
            });

            // Adicionar listener para mudança de data
            const dataInput = form.querySelector('[name="data"]');
            const semanaInput = form.querySelector('[name="semana"]');
            
            dataInput.addEventListener('change', () => {
                if (dataInput.value) {
                    const data = new Date(dataInput.value);
                    const semana = getWeekNumber(data);
                    semanaInput.value = semana;
                }
            });
        }
    });
            
    // Event listener para mudança de setor (código existente)
    ['setor', 'setorFert'].forEach(seletorId => {
        const select = document.getElementById(seletorId);
        const dataInput = select.closest('form').querySelector('[name="data"]');
        
        select.addEventListener('change', async () => {
            if (select.value && dataInput.value) {
                const dap = await calcularDAP(select.value, dataInput.value);
                const dapInput = select.closest('form').querySelector('[name="dap"]');
                if (dapInput && dap !== null) {
                    dapInput.value = dap;
                }
            }
        });
        
        // Event listener para mudança de data (código existente)
        dataInput.addEventListener('change', async () => {
            if (select.value && dataInput.value) {
                const dap = await calcularDAP(select.value, dataInput.value);
                const dapInput = select.closest('form').querySelector('[name="dap"]');
                if (dapInput && dap !== null) {
                    dapInput.value = dap;
                }

                // Atualizar a semana quando a data mudar
                const semanaInput = dataInput.closest('form').querySelector('[name="semana"]');
                if (semanaInput) {
                    const data = new Date(dataInput.value);
                    const semana = getWeekNumber(data);
                    semanaInput.value = semana;
                }
            }
        });
    });
}

function criarItemProduto(isFertirrigacao = false) {
    const produtoItem = document.createElement('div');
    produtoItem.className = 'produto-item';
    
    let inputsHTML = `
        <select class="produto-select" required onchange="atualizarUnidadeMedida(this)">
            <option value="">Selecione um produto</option>
        </select>
        <div class="dosagem-container">
            <input type="number" class="dosagem" placeholder="Dosagem" step="0.01" required>
            <span class="unidade-medida">un</span>
        </div>
        <div class="total-container">
            <input type="number" class="total" placeholder="Total" step="0.01" readonly>
            <span class="unidade-medida">un</span>
        </div>
        <button type="button" class="btn-remove-produto" onclick="removerProduto(this)">
            <i class="fas fa-trash"></i>
        </button>`;
    
    produtoItem.innerHTML = inputsHTML;

    // Adicionar listeners para cálculo automático
    const dosagem = produtoItem.querySelector('.dosagem');

    if (isFertirrigacao) {
        dosagem.addEventListener('input', () => calcularTotalFertirrigacao(produtoItem));
        // Também recalcular quando mudar o setor
        const setorSelect = document.getElementById('setorFert');
        if (setorSelect) {
            setorSelect.addEventListener('change', () => calcularTotalFertirrigacao(produtoItem));
        }
    } else {
        const volumeCalda = document.getElementById('volumeCalda');
        dosagem.addEventListener('input', () => calcularTotal(produtoItem));
        volumeCalda.addEventListener('input', () => {
            document.querySelectorAll('#listaProdutos .produto-item').forEach(item => {
                calcularTotal(item);
            });
        });
    }
    
    return produtoItem;
}

function atualizarUnidadeMedida(select) {
    const produtoItem = select.closest('.produto-item');
    const tipo = select.options[select.selectedIndex].getAttribute('data-tipo');
    const unidade = getUnidadeMedida(tipo);
    
    produtoItem.querySelector('.dosagem-container .unidade-medida').textContent = unidade;
    produtoItem.querySelector('.total-container .unidade-medida').textContent = unidade;
}

function calcularTotal(produtoItem) {
    const volumeCalda = parseFloat(document.getElementById('volumeCalda').value) || 0;
    const dosagem = parseFloat(produtoItem.querySelector('.dosagem').value) || 0;
    const totalInput = produtoItem.querySelector('.total');
    const produtoSelect = produtoItem.querySelector('.produto-select');
    
    const option = produtoSelect.options[produtoSelect.selectedIndex];
    const tipo = option.getAttribute('data-tipo');
    
    let total;
    
    // Se o tipo for L ou KG, a dosagem já está em ml/g
    if (tipo === 'L' || tipo === 'KG') {
        total = (dosagem / 1000) * volumeCalda * 1000; // Convertendo corretamente
    } else {
        total = dosagem * volumeCalda;
    }
    
    if (!isNaN(total)) {
        totalInput.value = total.toFixed(2);
    } else {
        totalInput.value = '0';
    }
}

async function calcularTotalFertirrigacao(produtoItem) {
    const setorSelect = document.getElementById('setorFert');
    const dosagem = parseFloat(produtoItem.querySelector('.dosagem').value) || 0;
    const totalInput = produtoItem.querySelector('.total');

    if (!setorSelect.value || dosagem === 0) {
        totalInput.value = '0.00';
        return;
    }

    try {
        const response = await fetch(`/get_valvula/${setorSelect.value}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            const areaHectare = parseFloat(data.valvula.area_hectare) || 0;
            const total = dosagem * areaHectare;
            totalInput.value = total.toFixed(2);
        }
    } catch (error) {
        console.error('Erro ao calcular total da fertirrigação:', error);
        totalInput.value = '0.00';
    }
}

function adicionarProduto(containerId = 'listaProdutos') {
    const container = document.getElementById(containerId);
    const isFertirrigacao = containerId === 'listaProdutosFert';
    const produtoItem = criarItemProduto(isFertirrigacao);
    container.appendChild(produtoItem);
    carregarProdutos(produtoItem.querySelector('.produto-select'));
}

// Função para compatibilidade com o HTML existente
function adicionarProdutoFert() {
    adicionarProduto('listaProdutosFert');
}

async function carregarProdutos(select) {
    try {
        const response = await fetch('/get_produtos');
        const data = await response.json();
        
        if (data.status === 'success') {
            select.innerHTML = '<option value="">Selecione um produto</option>';
            
            const isFertirrigacao = select.closest('form').id === 'formFertirrigacao';
            
            const produtosFiltrados = data.produtos.filter(produto => {
                const classificacao = produto.classificacao.toUpperCase();
                
                if (isFertirrigacao) {
                    return classificacao === 'FERTILIZANTE';
                } else {
                    return ['DEFENSIVOS', 'FOLIAR', 'ESPALHANTE', 'HORMONAL'].includes(classificacao);
                }
            });
            
            produtosFiltrados.forEach(produto => {
                const option = document.createElement('option');
                option.value = produto.id;
                option.textContent = produto.nome;
                option.setAttribute('data-tipo', produto.tipo); // Adicionando o tipo como atributo
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
    }
}

function removerProduto(button) {
    button.closest('.produto-item').remove();
}

async function registrarAplicacao(tipo) {
    try {
        const formId = tipo === 'FERTIRRIGACAO' ? 'formFertirrigacao' : 'formPulverizacao';
        const form = document.getElementById(formId);
        const formData = new FormData(form);
        
        // Adicione um console.log para depuração
        console.log('Tipo do formulário:', form.getAttribute('data-tipo'));
        
        // Use o parâmetro 'tipo' se o atributo não funcionar
        const tipoAplicacao = form.getAttribute('data-tipo') || tipo;
       
        formData.append('tipo', tipoAplicacao);
        
        // Ajuste aqui para pegar o container correto
        const produtosContainer = tipo === 'FERTIRRIGACAO' ? 
            document.getElementById('listaProdutosFert') : 
            document.getElementById('listaProdutos');
            
        // Adiciona console.log para debug
        console.log('Container:', produtosContainer);
        console.log('Produtos encontrados:', produtosContainer.querySelectorAll('.produto-item'));
            
        const produtos = Array.from(produtosContainer.querySelectorAll('.produto-item'))
            .filter(item => {
                const select = item.querySelector('.produto-select');
                const dosagem = item.querySelector('.dosagem').value;
                const total = item.querySelector('.total').value;
                
                console.log('Produto:', {
                    select: select.value,
                    dosagem: dosagem,
                    total: total
                });
                
                return select.value && parseFloat(dosagem) > 0 && parseFloat(total) > 0;
            })
            .map(item => ({
                id: item.querySelector('.produto-select').value,
                dosagem: parseFloat(item.querySelector('.dosagem').value),
                total: parseFloat(item.querySelector('.total').value)
            }));
        
        console.log('Produtos filtrados:', produtos);
        
        if (produtos.length === 0) {
            throw new Error('Adicione pelo menos um produto válido à aplicação');
        }
        
        formData.append('produtos', JSON.stringify(produtos));
        
        const response = await fetch('/registrar_aplicacao', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            alert('Aplicação registrada com sucesso!');
            limparFormulario();
            await carregarAplicacoes();
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Erro ao registrar aplicação:', error);
        alert(`Erro ao registrar aplicação: ${error.message}`);
    }
}

async function calcularDAP(setorId, dataAplicacao) {
    try {
        console.log('Calculando DAP para setor:', setorId, 'data:', dataAplicacao);
        const response = await fetch(`/get_valvula/${setorId}`);
        const data = await response.json();
        
        console.log('Resposta da API:', data);
        
        if (data.status === 'success' && data.valvula.data_poda) {
            const dataPoda = new Date(data.valvula.data_poda);
            const dataApl = new Date(dataAplicacao);
            
            const diffTime = Math.abs(dataApl - dataPoda);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            console.log('DAP calculado:', diffDays);
            return diffDays;
        }
        console.log('Não foi possível calcular DAP - data de poda não encontrada');
        return null;
    } catch (error) {
        console.error('Erro ao calcular DAP:', error);
        return null;
    }
}

function limparFormulario() {
    document.getElementById('formPulverizacao').reset();
    document.getElementById('formFertirrigacao').reset();
    document.getElementById('listaProdutos').innerHTML = '';
    document.getElementById('listaProdutosFert').innerHTML = '';
}

async function carregarAplicacoes() {
    try {
        const setor = document.querySelector('.filters select[name="setor"]').value;
        const tipo = document.querySelector('.filters select[name="tipo"]').value; 
        const dataInicial = document.getElementById('dataInicial').value;
        const dataFinal = document.getElementById('dataFinal').value;
        const apenas_pendentes = document.getElementById('apenas_pendentes').checked;
        const semana = document.querySelector('.filters input[name="semana"]').value;
                
        let params = new URLSearchParams();
                
        if (setor) params.append('setor', setor);
        if (tipo) params.append('tipo', tipo); 
        if (dataInicial) params.append('data_inicial', dataInicial);
        if (dataFinal) params.append('data_final', dataFinal);
        if (apenas_pendentes) params.append('apenas_pendentes', apenas_pendentes);
        if (semana) params.append('semana', parseInt(semana));

        const response = await fetch(`/get_aplicacoes?${params}`);
        const data = await response.json();

        if (data.status === 'success' && data.aplicacoes) {
            const tbody = document.getElementById('aplicacoes-tbody');
            tbody.innerHTML = ''; // Limpa a tabela antes de adicionar novos dados

            if (data.aplicacoes.length === 0) {
                // Se não houver aplicações, mostrar mensagem
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center">Nenhuma aplicação encontrada</td>
                    </tr>
                `;
                return;
            }

            data.aplicacoes.forEach(app => {
                const tr = document.createElement('tr');
                tr.setAttribute('data-id', app.id); 
                // Formatando o tipo da aplicação
                let tipoFormatado = '';
                switch (app.tipo) {
                    case 'PULVERIZACAO':
                        tipoFormatado = 'PULVERIZAÇÃO';
                        break;
                    case 'FERTIRRIGACAO':
                        tipoFormatado = 'FERTIRRIGAÇÃO';
                        break;
                    case 'QUIMICOS':
                        tipoFormatado = 'QUÍMICOS';
                        break;
                    default:
                        tipoFormatado = app.tipo;
                }
            
                tr.innerHTML = `
                    <td>${app.setor}</td>
                    <td>${tipoFormatado}</td>
                    <td>${app.data}</td>
                    <td>${app.aplicador.split(' ')[0]} ${app.aplicador.split(' ').slice(-1)}</td>
                    <td>${app.volume_calda || 0}</td>
                    <td>
                        <input type="checkbox" class="concluido-checkbox" 
                            onchange="marcarConcluido(this, ${app.id})" 
                            ${app.realizado ? 'checked' : ''}>
                    </td>
                    <td>
                        <button onclick="verDetalhes(${app.id})" class="btn-icon">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="baixarPDF(${app.id})" class="btn-icon">
                            <i class="fas fa-file-pdf"></i>
                        </button>
                        <button onclick="excluirAplicacao(${app.id})" class="btn-icon delete-btn">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                
                // Adiciona classe para linha concluída
                if (app.realizado) {
                    tr.classList.add('concluido');
                }
                
                tbody.appendChild(tr);
            });
        } else {
            console.error('Erro nos dados retornados:', data);
        }
    } catch (error) {
        console.error('Erro ao carregar aplicações:', error);
    }
}

async function marcarConcluido(checkbox, id) {
    try {
        const response = await fetch(`/atualizar_aplicacao/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                realizado: checkbox.checked ? 1 : 0
            })
        });

        const data = await response.json();
        
        if (data.status === 'success') {
            // Atualização bem-sucedida
            console.log('Status atualizado com sucesso');
    
            if (checkbox.checked) {
                const inputCostsElement = document.getElementById('inputCosts');
                if (inputCostsElement) {
                    const currentValue = parseFloat(inputCostsElement.textContent.replace('R$ ', '').replace('.', '').replace(',', '.'));
                    inputCostsElement.textContent = `R$ ${(currentValue + valor_total).toFixed(2)}`;
                }
            }
        } else {
            // Se houver erro, reverter o checkbox
            checkbox.checked = !checkbox.checked;
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        alert('Erro ao atualizar status da aplicação');
        checkbox.checked = !checkbox.checked;
    }
}

function formatarUnidade(valor, tipo, is_total=false) {
    try {
        valor = parseFloat(valor) || 0;
        
        // Se for tipo L ou KG, ajustar para ml/g se menor que 1
        if (tipo === 'L' || tipo === 'KG') {
            if (valor < 1) {
                // Converter para ml/g
                return `${(valor * 1000).toFixed(0)}${tipo === 'L' ? 'ml' : 'g'}`;
            }
            // Manter em L/KG
            return `${valor.toFixed(2)}${tipo}`;
        }
        
        // Para outros tipos (UN)
        return `${valor.toFixed(2)}`;
    } catch (error) {
        console.error('Erro ao formatar unidade:', error);
        return "0";
    }
}

// Função para ver detalhes
async function verDetalhes(id) {
    try {
        const response = await fetch(`/get_produtos_aplicacao/${id}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            const modal = document.getElementById('detalhesModal');
            const tbody = modal.querySelector('tbody');
            tbody.innerHTML = '';

            // Atualizar o volume de calda no modal
            modal.querySelector('#volumeCalda').textContent = 
                `${data.aplicacao.volume_calda ? data.aplicacao.volume_calda.toFixed(2) : '0'} L`;

            data.produtos.forEach(produto => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${produto.produto}</td>
                    <td>${produto.dosagem}</td>
                    <td>${produto.total}</td>
                `;
                tbody.appendChild(tr);
            });

            // Adicionar o custo total e o aviso
            const valorTotal = modal.querySelector('.valor-total');
            valorTotal.textContent = `Custo Total: ${formatarMoeda(data.custo_total)}`;
            
            // Verificar se há produtos sem valor unitário
            const produtosSemValor = data.produtos.filter(p => !p.valor_unitario || p.valor_unitario === 0);
            const avisoValor = modal.querySelector('.aviso-valor');
            
            if (produtosSemValor.length > 0) {
                // Se não existir o elemento de aviso, criar
                if (!avisoValor) {
                    const novoAviso = document.createElement('p');
                    novoAviso.className = 'aviso-valor';
                    valorTotal.parentNode.insertBefore(novoAviso, valorTotal.nextSibling);
                }
                
                const mensagem = produtosSemValor.length === 1 
                    ? 'Atenção: O produto ' + produtosSemValor[0].produto + ' não possui valor unitário definido.'
                    : 'Atenção: Alguns produtos não possuem valor unitário definido.';
                
                modal.querySelector('.aviso-valor').textContent = mensagem;
                modal.querySelector('.aviso-valor').style.display = 'block';
            } else if (avisoValor) {
                avisoValor.style.display = 'none';
            }

            modal.style.display = 'flex';
        } else {
            console.error('Erro ao buscar detalhes:', data.message);
        }
    } catch (error) {
        console.error('Erro ao carregar detalhes da aplicação:', error);
    }
}

// Função auxiliar para formatar moeda
function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

// Função para baixar PDF
function baixarPDF(id) {
    window.location.href = `/get_produtos_aplicacao_pdf/${id}`;
}

async function excluirAplicacao(id) {
    if (!confirm('Tem certeza que deseja excluir esta aplicação?')) {
        return;
    }
    
    try {
        const response = await fetch(`/excluir_aplicacao/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            // Remover linha da tabela imediatamente
            const linha = document.querySelector(`tr[data-id="${id}"]`);
            if (linha) {
                linha.remove();
            }
            
            // Fechar modal se estiver aberto
            const modal = document.getElementById('detalhesModal');
            if (modal && modal.style.display === 'flex') {
                modal.style.display = 'none';
            }
            
            // Recarregar dados da tabela
            await carregarAplicacoes();
            
            alert('Aplicação excluída com sucesso!');
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Erro ao excluir aplicação:', error);
        alert('Erro ao excluir aplicação: ' + error.message);
    }
}

async function initializeFiltros() {
    const dataInicial = document.getElementById('dataInicial');
    const dataFinal = document.getElementById('dataFinal');
    const apenas_pendentes = document.getElementById('apenas_pendentes');
    const limparFiltros = document.getElementById('limpar-filtros');
    const semanaFilter = document.querySelector('.filters input[name="semana"]');
    const aplicarFiltros = document.getElementById('aplicar-filtros');
    
    // Validação da semana
    if (semanaFilter) {
        semanaFilter.addEventListener('input', () => {
            const valor = parseInt(semanaFilter.value);
            if (valor < 1 || valor > 52) {
                semanaFilter.classList.add('invalid');
                document.getElementById('semana-error').style.display = 'block';
            } else {
                semanaFilter.classList.remove('invalid');
                document.getElementById('semana-error').style.display = 'none';
            }
        });
    }

    // Validação de datas
    dataInicial.addEventListener('change', () => {
        if (dataFinal.value && dataInicial.value > dataFinal.value) {
            dataInicial.classList.add('invalid');
            document.getElementById('data-error').style.display = 'block';
            aplicarFiltros.disabled = true;
        } else {
            dataInicial.classList.remove('invalid');
            document.getElementById('data-error').style.display = 'none';
            aplicarFiltros.disabled = false;
        }
    });

    dataFinal.addEventListener('change', () => {
        if (dataInicial.value && dataInicial.value > dataFinal.value) {
            dataFinal.classList.add('invalid');
            document.getElementById('data-error').style.display = 'block';
            aplicarFiltros.disabled = true;
        } else {
            dataFinal.classList.remove('invalid');
            document.getElementById('data-error').style.display = 'none';
            aplicarFiltros.disabled = false;
        }
    });

    // Carregar setores no filtro com loading state
    try {
        const setorSelect = document.querySelector('.filters select[name="setor"]');
        setorSelect.disabled = true;
        setorSelect.innerHTML = '<option value="">Carregando setores...</option>';
        
        const response = await fetch('/get_valvulas');
        const data = await response.json();
        
        if (data.status === 'success') {
            setorSelect.innerHTML = '<option value="">Todos os Setores</option>';
            
            data.valvulas.forEach(valvula => {
                const option = document.createElement('option');
                option.value = valvula.id;
                option.textContent = `${valvula.valvula} - ${valvula.variedade}`;
                setorSelect.appendChild(option);
            });
        }
        setorSelect.disabled = false;
    } catch (error) {
        console.error('Erro ao carregar setores:', error);
        document.querySelector('.filters select[name="setor"]').innerHTML = 
            '<option value="">Erro ao carregar setores</option>';
    }

    // Aplicar filtros com feedback visual
    aplicarFiltros.addEventListener('click', async () => {
        const loadingIndicator = document.createElement('span');
        loadingIndicator.className = 'loading-spinner';
        aplicarFiltros.disabled = true;
        aplicarFiltros.appendChild(loadingIndicator);
        
        try {
            await carregarAplicacoes();
            
            // Feedback visual de sucesso
            aplicarFiltros.classList.add('success');
            setTimeout(() => {
                aplicarFiltros.classList.remove('success');
            }, 1000);
            
        } catch (error) {
            console.error('Erro ao aplicar filtros:', error);
            
            // Feedback visual de erro
            aplicarFiltros.classList.add('error');
            setTimeout(() => {
                aplicarFiltros.classList.remove('error');
            }, 1000);
            
        } finally {
            aplicarFiltros.removeChild(loadingIndicator);
            aplicarFiltros.disabled = false;
        }
    });

    // Limpar filtros com animação
    limparFiltros.addEventListener('click', async () => {
        limparFiltros.classList.add('rotating');
        
        // Resetar todos os filtros
        document.getElementById('dataInicial').value = '';
        document.getElementById('dataFinal').value = '';
        document.querySelector('.filters select[name="setor"]').value = '';
        document.querySelector('.filters select[name="tipo"]').value = '';
        document.querySelector('.filters input[name="semana"]').value = '';
        document.getElementById('apenas_pendentes').checked = false;
        
        // Remover classes de erro
        document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
        document.querySelectorAll('.error-message').forEach(el => el.style.display = 'none');
        
        try {
            await carregarAplicacoes();
        } catch (error) {
            console.error('Erro ao recarregar aplicações:', error);
        } finally {
            setTimeout(() => {
                limparFiltros.classList.remove('rotating');
            }, 500);
        }
    });
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarAplicacoes();
});