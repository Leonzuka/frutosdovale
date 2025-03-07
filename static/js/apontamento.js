// Inicialização quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
    initializePage();
    carregarDados();
    setupFormHandlers();
    setupModalHandlers(); 
    carregarUltimosApontamentos(1); 
    setupPaginationHandlers();
    carregarAtividadesLote()
});

let currentPage = 1;
let totalPages = 1;

function initializePage() {
    const dateDisplay = document.getElementById('current-date');
    const yearDisplay = document.getElementById('current-year');
    
    // Inicialização do estado dos campos baseado no tipo padrão (Meta)
    const extraGroup = document.getElementById('extraGroup');
    const valorUnitGroup = document.getElementById('valorUnitGroup');
    const horasGroup = document.querySelector('.form-group:has(#horas)');
    const metaLabel = document.querySelector('label[for="meta"]');
    const realizadoLabel = document.querySelector('label[for="realizado"]');
    
    // Define estados iniciais para tipo Meta
    if (extraGroup && valorUnitGroup && horasGroup && metaLabel && realizadoLabel) {
        extraGroup.style.display = 'block';
        valorUnitGroup.style.display = 'block';
        horasGroup.style.display = 'none';
        metaLabel.textContent = 'Meta:';
        realizadoLabel.textContent = 'Realizado:';
        
        // Adiciona o listener inicial para cálculo de extra
        const realizadoInput = document.getElementById('realizado');
        if (realizadoInput) {
            realizadoInput.addEventListener('input', calcularExtra);
        }
    }
    
    // Adiciona listeners para os cards
    const cards = document.querySelectorAll('.action-card');
    cards.forEach(card => {
        card.addEventListener('click', (e) => {
            // Se o clique não foi no botão, executa a ação do card
            if (!e.target.closest('.card-button')) {
                if (card.id === 'registroCard') {
                    showForm();
                } else if (card.id === 'downloadCard') {
                    showModal('downloadModal');
                } else if (card.id === 'addAtividadeCard') {
                    showModal('addAtividadeModal');
                } else if (card.id === 'desativarAtividadeCard') {
                    showModal('desativarAtividadeModal');
                } else if (card.id === 'registroLoteCard') {
                    showModal('registroLoteModal');
                }
            }
        });
    });
    
    // Configura data atual
    const currentDate = new Date();
    if (dateDisplay) {
        dateDisplay.textContent = currentDate.toLocaleDateString('pt-BR');
    }
    if (yearDisplay) {
        yearDisplay.textContent = currentDate.getFullYear();
    }

    // Define data atual no campo de data
    const dataInput = document.getElementById('data');
    if (dataInput) {
        dataInput.valueAsDate = new Date();
    }

    // Configuração inicial do campo de atividade
    const atividadeSelect = document.getElementById('atividade');
    atividadeSelect.addEventListener('change', (e) => {
        const selectedOption = e.target.selectedOptions[0];
        if (selectedOption) {
            const tipoApontamento = document.getElementById('tipoApontamento').value;
            
            if (tipoApontamento === 'Meta') {
                document.getElementById('meta').value = selectedOption.dataset.meta || '';
            } else if (tipoApontamento === 'Hora') {
                document.getElementById('meta').value = '8.00';
            }
            
            document.getElementById('valorUnit').value = selectedOption.dataset.valorUnit || '';
            document.getElementById('extra').value = '0.00';
            document.getElementById('horas').value = '0.00';
            document.getElementById('realizado').value = '';
        }
    });

    // Inicializa handlers de paginação
    setupPaginationHandlers();
}

// Funções de carregamento de dados
async function carregarDadosFuncionario(id) {
    try {
        const response = await fetch(`/get_funcionario/${id}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            const form = document.getElementById('alterarForm');
            form.style.display = 'block';
            
            // Verificar se os campos existem antes de atribuir valores
            const campos = {
                'nomeAlterar': data.funcionario.nome,
                'cpfAlterar': data.funcionario.cpf,
                'dataNascimentoAlterar': data.funcionario.data_nascimento,
                'sexoAlterar': data.funcionario.sexo,
                'funcaoAlterar': data.funcionario.funcao,
                'dataAdmissaoAlterar': data.funcionario.data_admissao,
                'tipoContratacaoAlterar': data.funcionario.tipo_contratacao,
                'pixAlterar': data.funcionario.pix || '',
                'enderecoAlterar': data.funcionario.endereco || ''
            };

            // Atribuir valores apenas se o campo existir
            Object.entries(campos).forEach(([id, valor]) => {
                const campo = document.getElementById(id);
                if (campo && valor !== undefined) {
                    campo.value = valor;
                }
            });

            console.log('Dados do funcionário carregados:', data.funcionario);
        } else {
            console.error('Erro ao carregar dados:', data.message);
            alert('Erro ao carregar dados do funcionário');
        }
    } catch (error) {
        console.error('Erro ao carregar dados do funcionário:', error);
        alert('Erro ao carregar dados do funcionário');
    }
}

async function carregarValvulas(retryCount = 3, delay = 1000) {
    for (let attempt = 1; attempt <= retryCount; attempt++) {
        try {
            const response = await fetch('/get_valvulas');
            const data = await response.json();
            
            if (data.status === 'success') {
                const select = document.getElementById('valvula');
                select.innerHTML = '<option value="">Selecione a válvula</option>';
                
                data.valvulas.forEach(valvula => {
                    const option = document.createElement('option');
                    option.value = valvula.id;
                    option.textContent = `${valvula.valvula} - ${valvula.variedade}`;
                    select.appendChild(option);
                });
                
                return; // Sucesso, sai da função
            } else {
                console.warn(`Tentativa ${attempt}: Erro ao carregar válvulas:`, data.message);
                
                if (attempt === retryCount) {
                    throw new Error(data.message);
                }
            }
        } catch (error) {
            console.warn(`Tentativa ${attempt}: Erro ao carregar válvulas:`, error);
            
            if (attempt === retryCount) {
                console.error('Todas as tentativas falharam ao carregar válvulas:', error);
                const select = document.getElementById('valvula');
                if (select) {
                    select.innerHTML = '<option value="">Erro ao carregar válvulas</option>';
                }
                break;
            }
            
            // Espera antes da próxima tentativa
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

async function carregarAtividades() {
    try {
        const response = await fetch('/get_atividades');
        const data = await response.json();
        
        if (data.status === 'success') {
            const select = document.getElementById('atividade');
            select.innerHTML = '<option value="">Selecione a atividade</option>';
            
            data.atividades.forEach(atividade => {
                const option = document.createElement('option');
                option.value = atividade.id;
                option.textContent = atividade.atividade;
                option.dataset.meta = atividade.meta;
                option.dataset.valorUnit = atividade.valor_unit;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar atividades:', error);
    }
}

async function carregarListaAtividades() {
    console.log('Iniciando carregamento da lista de atividades');
    try {
        const response = await fetch('/get_atividades');
        const data = await response.json();
        console.log('Dados recebidos:', data);
        
        if (data.status === 'success') {
            const listaAtividades = document.getElementById('listaAtividades');
            console.log('Elemento listaAtividades:', listaAtividades);
            
            if (!listaAtividades) {
                console.error('Elemento listaAtividades não encontrado');
                return;
            }
            
            listaAtividades.innerHTML = '';
            
            if (data.atividades.length === 0) {
                console.log('Nenhuma atividade encontrada');
                listaAtividades.innerHTML = '<div class="atividade-item">Nenhuma atividade cadastrada</div>';
                return;
            }
            
            data.atividades.forEach(atividade => {
                console.log('Criando elemento para atividade:', atividade);
                const div = document.createElement('div');
                div.className = 'atividade-item';
                div.innerHTML = `
                    <span>${atividade.atividade} - Meta: ${atividade.meta || 'N/A'} - Valor: R$ ${atividade.valor_unit.toFixed(2)}</span>
                    <button onclick="desativarAtividade(${atividade.id})" class="btn-remove">
                        <i class="fas fa-trash"></i>
                    </button>
                `;
                listaAtividades.appendChild(div);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar lista de atividades:', error);
    }
}

async function carregarDados() {
    await Promise.all([
        carregarFuncionarios(),
        carregarValvulas(),
        carregarAtividades()
    ]);
}

async function carregarFuncionarios() {
    try {
        const response = await fetch('/get_funcionarios');
        const data = await response.json();
        
        if (data.status === 'success') {
            // Array com os IDs dos selects que precisam ser preenchidos
            const selectIds = ['funcionario', 'funcionarioLote'];
            
            selectIds.forEach(selectId => {
                const select = document.getElementById(selectId);
                if (select) {
                    select.innerHTML = '<option value="">Selecione o funcionário</option>';
                    
                    data.funcionarios.forEach(funcionario => {
                        const option = document.createElement('option');
                        option.value = funcionario.id;
                        option.textContent = funcionario.nome;
                        select.appendChild(option);
                    });
                }
            });
        }
    } catch (error) {
        console.error('Erro ao carregar funcionários:', error);
    }
}

// Setup de handlers
function setupFormHandlers() {
    const tipoApontamentoSelect = document.getElementById('tipoApontamento');
    const realizadoInput = document.getElementById('realizado');
    const metaInput = document.getElementById('meta');
    const horasInput = document.getElementById('horas');
    const extraGroup = document.getElementById('extraGroup');
    const valorUnitGroup = document.getElementById('valorUnitGroup');
    const form = document.getElementById('registroApontamentoForm');

    if (tipoApontamentoSelect) {
        tipoApontamentoSelect.addEventListener('change', function(e) {
            const tipo = e.target.value;
            const metaLabel = document.querySelector('label[for="meta"]');
            const realizadoLabel = document.querySelector('label[for="realizado"]');
            const horasLabel = document.querySelector('label[for="horas"]');
            const extraGroup = document.getElementById('extraGroup');
            const valorUnitGroup = document.getElementById('valorUnitGroup');
            const horasGroup = document.querySelector('.form-group:has(#horas)');
            const metaInput = document.getElementById('meta');
            
            // Resetar todos os campos
            realizadoInput.value = '';
            horasInput.value = '0.00';
            document.getElementById('extra').value = '0.00';
            
            switch(tipo) {
                case 'Hora':
                    // Para tipo Hora, mostrar apenas horas
                    extraGroup.style.display = 'none';
                    valorUnitGroup.style.display = 'none';
                    horasGroup.style.display = 'block';
                    metaLabel.textContent = 'Meta (Horas):';
                    realizadoLabel.textContent = 'Horas Realizadas:';
                    horasLabel.textContent = 'Horas Extras:';
                    metaInput.value = '8.00'; // Meta fixa de 8 horas
                    
                    // Reabilitar cálculo para tipo Hora
                    realizadoInput.addEventListener('input', calcularHorasExtras);
                    realizadoInput.removeEventListener('input', calcularExtra);
                    break;
                
                case 'Meta':
                    // Para tipo Meta, mostrar valor unitário e extra, esconder horas
                    extraGroup.style.display = 'block';
                    valorUnitGroup.style.display = 'block';
                    horasGroup.style.display = 'none';
                    metaLabel.textContent = 'Meta:';
                    realizadoLabel.textContent = 'Realizado:';
                    metaInput.readOnly = false; // Permitir edição
                    
                    // Carregar meta e valor unitário da atividade selecionada
                    const atividadeOpt = document.getElementById('atividade').selectedOptions[0];
                    if (atividadeOpt) {
                        metaInput.value = atividadeOpt.dataset.meta || '';
                        document.getElementById('valorUnit').value = atividadeOpt.dataset.valorUnit || '';
                    }
                    
                    // Adicionar cálculo de extra
                    realizadoInput.addEventListener('input', calcularExtra);
                    realizadoInput.removeEventListener('input', calcularHorasExtras);
                    break;
                
                case 'Compensado':
                    // Para tipo Compensado, mostrar apenas horas
                    extraGroup.style.display = 'none';
                    valorUnitGroup.style.display = 'none';
                    horasGroup.style.display = 'block';
                    metaLabel.textContent = 'Meta:';
                    realizadoLabel.textContent = 'Realizado:';
                    horasLabel.textContent = 'Horas Compensadas:';
                    metaInput.readOnly = false; // Permitir edição
                    
                    // Carregar meta da atividade selecionada
                    const atividadeSelect = document.getElementById('atividade');
                    const selectedOption = atividadeSelect.selectedOptions[0];
                    if (selectedOption) {
                        metaInput.value = selectedOption.dataset.meta || '';
                    }
                    
                    // Remover listeners antigos e adicionar apenas cálculo de horas
                    realizadoInput.removeEventListener('input', calcularExtra);
                    realizadoInput.removeEventListener('input', calcularHorasExtras);
                    realizadoInput.addEventListener('input', calcularHoras);
                    break;
            }
        });
    }

    // Handler para mudança de atividade
    const atividadeSelect = document.getElementById('atividade');
    atividadeSelect.addEventListener('change', (e) => {
        const selectedOption = e.target.selectedOptions[0];
        const tipoApontamento = document.getElementById('tipoApontamento').value;
        
        if (selectedOption) {
            const atividadeNome = selectedOption.textContent;
            const valvulaSelect = document.getElementById('valvula');
            
            if (isAtividadeEspecial(atividadeNome)) {
                document.getElementById('valorUnit').value = atividadeNome.toLowerCase() === 'falta' ? '0.00' : '0.00';
                document.getElementById('meta').value = tipoApontamento === 'Hora' ? '8.00' : '1';
                document.getElementById('realizado').value = '1';
                document.getElementById('extra').value = atividadeNome.toLowerCase() === 'falta' ? '0.00' : '0.00';
                document.getElementById('horas').value = '0.00';
                realizadoInput.readOnly = true;
                valvulaSelect.value = '33';
                valvulaSelect.disabled = true;
            } else {
                // Aqui está a correção principal
                if (tipoApontamento === 'Meta') {
                    document.getElementById('meta').value = selectedOption.dataset.meta || '';
                } else if (tipoApontamento === 'Hora') {
                    document.getElementById('meta').value = '8.00';
                }
                
                document.getElementById('valorUnit').value = selectedOption.dataset.valorUnit || '';
                document.getElementById('extra').value = '0.00';
                document.getElementById('horas').value = '0.00';
                realizadoInput.readOnly = false;
                realizadoInput.value = '';
                valvulaSelect.disabled = false;
            }
        }
    });

    // Handler para envio do formulário
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const tipo = formData.get('tipo_apontamento');

            // Remove campos desnecessários baseado no tipo
            if (tipo === 'Meta' || tipo === 'Compensado') {
                formData.delete('extra');
                formData.delete('valor_unit');
            }

            await registrarApontamento(formData);
        });
    }

    // Handler para o campo realizado
    if (realizadoInput) {
        realizadoInput.addEventListener('input', function() {
            const tipo = document.getElementById('tipoApontamento').value;
            if (tipo === 'Hora') {
                calcularExtra();
                calcularHorasExtras();
            } else if (tipo === 'Compensado') {
                calcularHoras();
            }
        });
    }
}

function setupModalHandlers() {
    // Configurar o handler de busca
    const searchInput = document.getElementById('searchAtividade');
    if (searchInput) {
        searchInput.addEventListener('input', filtrarAtividades);
    }

    // Configurar handlers dos formulários modais
    const addAtividadeForm = document.getElementById('addAtividadeForm');
    if (addAtividadeForm) {
        addAtividadeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await adicionarAtividade(new FormData(addAtividadeForm));
        });
    }
}

// Funções de UI
function showModal(modalId) {
    console.log('Abrindo modal:', modalId);
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        if (modalId === 'desativarAtividadeModal') {
            console.log('Chamando carregarListaAtividades');
            carregarListaAtividades();
        }
    } else {
        console.error('Modal não encontrado:', modalId);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function filtrarAtividades(e) {
    const searchTerm = e.target.value.toLowerCase();
    const atividades = document.querySelectorAll('.atividade-item');
    
    atividades.forEach(atividade => {
        const texto = atividade.querySelector('span').textContent.toLowerCase();
        atividade.style.display = texto.includes(searchTerm) ? 'flex' : 'none';
    });
}
// Funções de cálculo e operações
function calcularExtra() {
    const meta = parseFloat(document.getElementById('meta').value) || 0;
    const realizado = parseFloat(document.getElementById('realizado').value) || 0;
    const valorUnit = parseFloat(document.getElementById('valorUnit').value) || 0;
    
    const extra = Math.max(0, (realizado - meta) * valorUnit);
    document.getElementById('extra').value = extra.toFixed(2);
}

function calcularHoras() {
    const tipoApontamento = document.getElementById('tipoApontamento').value;
    const atividadeSelect = document.getElementById('atividade');
    const atividadeNome = atividadeSelect.selectedOptions[0]?.textContent || '';
    const meta = parseFloat(document.getElementById('meta').value) || 0;
    const realizado = parseFloat(document.getElementById('realizado').value) || 0;
    const horasInput = document.getElementById('horas');

    // Verificar primeiro se é uma atividade especial
    if (isAtividadeEspecial(atividadeNome)) {
        // Todas as atividades especiais agora terão valor 0 para não descontar
        horasInput.value = '0.00';
        return;
    }

    // Tratamento específico para cada tipo de apontamento
    switch (tipoApontamento) {
        case 'Hora':
            // Para tipo Hora, calcula apenas se houver horas extras
            const horasExtras = Math.max(0, realizado - 8);
            horasInput.value = horasExtras.toFixed(2);
            break;

        case 'Compensado':
            // Para tipo Compensado, calcula horas proporcionais
            if (realizado > 0 && meta > 0) {
                const proporcao = realizado / meta;
                const horasCompensadas = 8 * proporcao;
                horasInput.value = horasCompensadas.toFixed(2);
            } else {
                horasInput.value = '0.00';
            }
            break;

        case 'Meta':
            // Para tipo Meta, sempre será 8 horas
            horasInput.value = '8.00';
            break;

        default:
            horasInput.value = '0.00';
            break;
    }
}

function calcularHorasExtras() {
    const meta = parseFloat(document.getElementById('meta').value) || 8;
    const realizado = parseFloat(document.getElementById('realizado').value) || 0;
    const horasInput = document.getElementById('horas');
    
    const horasExtras = Math.max(0, realizado - meta);
    horasInput.value = horasExtras.toFixed(2);
}

document.getElementById('tipoApontamento').addEventListener('change', calcularHoras);
document.getElementById('realizado').addEventListener('input', calcularHoras);
document.getElementById('meta').addEventListener('input', calcularHoras);

async function registrarApontamento(formData) {
    try {
        const atividade = document.getElementById('atividade');
        const funcionario = document.getElementById('funcionario').value;
        const dataApontamento = document.getElementById('data').value;
        const realizado = parseFloat(document.getElementById('realizado').value) || 0;
        const meta = parseFloat(document.getElementById('meta').value) || 0;
        const valorUnit = parseFloat(document.getElementById('valorUnit').value) || 0;
        const valvula = document.getElementById('valvula').value;
        const tipoApontamento = document.getElementById('tipoApontamento').value;
        const hora = parseFloat(document.getElementById('horas').value) || 0;

        if (!atividade.value || !funcionario || !dataApontamento || !valvula) {
            alert('Por favor, preencha os campos obrigatórios');
            return;
        }

        // Garantir que todos os valores numéricos sejam números válidos
        formData.set('meta', meta);
        formData.set('realizado', realizado);
        formData.set('valor_unit', valorUnit);
        formData.set('tipo_apontamento', tipoApontamento);
        
        // Tratar campos específicos baseado no tipo de apontamento
        if (tipoApontamento === 'Meta') {
            formData.set('hora', '0');
            const extraValue = Math.max(0, (realizado - meta) * valorUnit);
            formData.set('extra', extraValue.toFixed(2));
        } else {
            formData.set('extra', '0.00');
            formData.set('hora', hora.toFixed(2));
        }

        const response = await fetch('/registrar_apontamento', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao registrar apontamento');
        }

        const responseData = await response.json();
        
        if (responseData.status === 'success') {
            alert('Apontamento registrado com sucesso!');
            await carregarUltimosApontamentos();
            
            // Preservar campos importantes
            const funcionarioValue = document.getElementById('funcionario').value;
            const dataValue = document.getElementById('data').value;
            const tipoApontamentoValue = document.getElementById('tipoApontamento').value;
            
            // Resetar o formulário
            document.getElementById('registroApontamentoForm').reset();
            
            // Restaurar valores que queremos manter
            document.getElementById('funcionario').value = funcionarioValue;
            document.getElementById('data').value = dataValue;
            document.getElementById('tipoApontamento').value = tipoApontamentoValue;
            
            // Resetar apenas os campos específicos do apontamento
            document.getElementById('meta').value = tipoApontamentoValue === 'Hora' ? '8.00' : '';
            document.getElementById('realizado').value = '';
            document.getElementById('extra').value = '0.00';
            document.getElementById('horas').value = '0.00';
            document.getElementById('valorUnit').value = '';
            document.getElementById('observacao').value = '';
            
            // Manter o campo de atividade focado para o próximo registro
            document.getElementById('atividade').focus();

        } else {
            throw new Error(responseData.message || 'Erro ao registrar apontamento');
        }
    } catch (error) {
        console.error('Erro ao registrar apontamento:', error);
        alert(`Erro ao registrar apontamento: ${error.message}`);
    }
}

async function adicionarAtividade(formData) {
    try {
        const response = await fetch('/adicionar_atividade', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        
        if (data.status === 'success') {
            alert('Atividade adicionada com sucesso!');
            closeModal('addAtividadeModal');
            document.getElementById('addAtividadeForm').reset();
            await carregarAtividades();
            await carregarListaAtividades();
        } else {
            alert('Erro: ' + data.message);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao adicionar atividade');
    }
}

async function desativarAtividade(id) {
    if (!confirm('Tem certeza que deseja desativar esta atividade?')) {
        return;
    }

    try {
        const response = await fetch(`/desativar_atividade/${id}`, {
            method: 'PUT'
        });

        const data = await response.json();
        
        if (data.status === 'success') {
            alert('Atividade desativada com sucesso!');
            await carregarListaAtividades();
            await carregarAtividades();
        } else {
            alert('Erro: ' + data.message);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao desativar atividade');
    }
}

// Funções de utilidade
function showForm() {
    const formContainer = document.getElementById('apontamentoForm');
    formContainer.style.display = 'flex';
}

// Funções para download de planilhas
async function downloadPlanilha(tipo) {
    const loadingDiv = showLoading();
    
    try {
        const response = await fetch(`/download_apontamento/${tipo}`);
        if (!response.ok) throw new Error('Erro ao gerar planilha');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `apontamento_${tipo}_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        closeModal('downloadModal');
        
    } catch (error) {
        alert('Erro ao baixar planilha: ' + error.message);
    } finally {
        document.body.removeChild(loadingDiv);
    }
}

function showLoading() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-overlay';
    loadingDiv.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <div>Gerando planilha...</div>
        </div>
    `;
    document.body.appendChild(loadingDiv);
    return loadingDiv;
}

function showResumoModal() {
    closeModal('downloadModal');
    showModal('resumoModal');
    
    // Só vamos definir as datas se elas ainda não estiverem preenchidas
    const dataInicial = document.getElementById('dataInicial');
    const dataFinal = document.getElementById('dataFinal');
    
    if (!dataInicial.value || !dataFinal.value) {
        // Configurar datas iniciais apenas se estiverem vazias
        const hoje = new Date();
        const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
        
        // Formatar as datas para YYYY-MM-DD
        const dataInicialPadrao = primeiroDiaMes.toISOString().split('T')[0];
        const dataFinalPadrao = ultimoDiaMes.toISOString().split('T')[0];
        
        // Definir valores padrão apenas se estiverem vazios
        dataInicial.value = dataInicialPadrao;
        dataFinal.value = dataFinalPadrao;
    }
}

document.getElementById('resumoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const dataInicialInput = document.getElementById('dataInicial');
    const dataFinalInput = document.getElementById('dataFinal');
    
    if (!dataInicialInput.value || !dataFinalInput.value) {
        alert('Por favor, selecione as datas inicial e final');
        return;
    }

    const loadingDiv = showLoading();
    try {
        const response = await fetch(`/download_apontamento/resumo?dataInicial=${dataInicialInput.value}&dataFinal=${dataFinalInput.value}`);
        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
            // Se a resposta for JSON, provavelmente é um erro
            const errorData = await response.json();
            throw new Error(errorData.error || 'Não foram encontrados registros para o período selecionado');
        }

        if (!response.ok) {
            throw new Error('Erro ao gerar planilha');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `apontamento_resumo_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        closeModal('resumoModal');
        
    } catch (error) {
        console.error('Erro:', error);
        alert(error.message || 'Erro ao gerar planilha de resumo');
    } finally {
        document.body.removeChild(loadingDiv);
    }
});

async function carregarUltimosApontamentos(page = 1) {
    try {
        const response = await fetch(`/get_ultimos_apontamentos_paginado?page=${page}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        const data = await response.json();
        
        if (data.status === 'success') {
            currentPage = data.current_page;
            totalPages = data.total_pages;
            
            renderizarUltimosRegistros(data.apontamentos);
            
            // Atualizar os botões de paginação
            document.getElementById('prev-page').disabled = currentPage === 1;
            document.getElementById('next-page').disabled = currentPage === totalPages;
            document.getElementById('current-page').textContent = currentPage;
            document.getElementById('total-pages').textContent = totalPages;
        }
    } catch (error) {
        console.error('Erro ao carregar apontamentos:', error);
    }
}

function setupPaginationHandlers() {
    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            carregarUltimosApontamentos(currentPage - 1);
        }
    });
    
    document.getElementById('next-page').addEventListener('click', () => {
        if (currentPage < totalPages) {
            carregarUltimosApontamentos(currentPage + 1);
        }
    });
}

async function excluirApontamento(id) {
    if (!confirm('Tem certeza que deseja excluir este apontamento?')) {
        return;
    }

    try {
        const response = await fetch(`/excluir_apontamento/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        
        if (data.status === 'success') {
            alert('Apontamento excluído com sucesso!');
            carregarUltimosApontamentos(currentPage);
        } else {
            alert('Erro: ' + data.message);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao excluir apontamento');
    }
}

function renderizarUltimosRegistros(registros) {
    const container = document.getElementById('registros-list');
    if (!container) return;

    container.innerHTML = registros.map(registro => {
        // Função para pegar apenas primeiro e último nome
        const formatarNome = (nomeCompleto) => {
            const nomes = nomeCompleto.split(' ');
            if (nomes.length > 1) {
                return `${nomes[0]} ${nomes[nomes.length - 1]}`;
            }
            return nomes[0];
        };

        // Define a classe CSS para o extra
        let extraClass = '';
        let extraValue = registro.extra;
        
        // Se for atividade "FALTA", mantém o valor negativo
        if (registro.atividade.toUpperCase() === 'FALTA') {
            extraClass = 'negativo';
        } else {
            // Para todas as outras atividades, o extra nunca pode ser negativo
            extraValue = Math.max(0, registro.extra);
            if (extraValue > 0) {
                extraClass = 'positivo';
            }
        }

        return `
            <div class="registro-item">
                <div>${new Date(registro.data + 'T00:00:00').toLocaleDateString('pt-BR', {
                    timeZone: 'UTC'
                })}</div>
                <div>${formatarNome(registro.funcionario)}</div>
                <div>${registro.atividade}</div>
                <div class="registro-valor">${registro.meta.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <div class="registro-valor">${registro.realizado.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <div class="registro-valor">${registro.hora ? registro.hora.toLocaleString('pt-BR', {minimumFractionDigits: 2}) : '0.00'}</div>
                <div class="registro-valor ${extraClass}">
                    R$ ${Math.abs(extraValue).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                </div>
                <button onclick="excluirApontamento(${registro.id})" class="delete-button">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }).join('');
}

document.getElementById('registroLoteForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    try {
        const formData = new FormData(this);
        const dataInicial = new Date(formData.get('data_inicial'));
        const dataFinal = new Date(formData.get('data_final'));
        const funcionarioId = formData.get('funcionario_id');
        const atividadeId = formData.get('atividade_id');
        
        // Itera sobre cada dia no intervalo
        for (let data = new Date(dataInicial); data <= dataFinal; data.setDate(data.getDate() + 1)) {
            // Pula finais de semana
            if (data.getDay() === 0 || data.getDay() === 6) continue;
            
            const dadosApontamento = new FormData();
            dadosApontamento.append('funcionario_id', funcionarioId);
            dadosApontamento.append('atividade_id', atividadeId);
            dadosApontamento.append('data', data.toISOString().split('T')[0]);
            dadosApontamento.append('tipo_apontamento', 'Meta');
            dadosApontamento.append('meta', '1');
            dadosApontamento.append('realizado', '1');
            dadosApontamento.append('valvula', '33'); // Válvula ADM
            
            await fetch('/registrar_apontamento', {
                method: 'POST',
                body: dadosApontamento
            });
        }
        
        alert('Registros em lote realizados com sucesso!');
        closeModal('registroLoteModal');
        carregarUltimosApontamentos();
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao realizar registros em lote');
    }
});

// Função para carregar apenas atividades específicas no select de lote
async function carregarAtividadesLote() {
    try {
        const response = await fetch('/get_atividades');
        const data = await response.json();
        
        if (data.status === 'success') {
            const select = document.getElementById('atividadeLote');
            select.innerHTML = '<option value="">Selecione o tipo</option>';
            
            const atividadesPermitidas = ['FÉRIAS', 'FOLGA', 'ATESTADO', 'COMPENSAÇÃO', 'FALTA'];
            
            data.atividades
                .filter(atividade => atividadesPermitidas.includes(atividade.atividade.toUpperCase()))
                .forEach(atividade => {
                    const option = document.createElement('option');
                    option.value = atividade.id;
                    option.textContent = atividade.atividade;
                    select.appendChild(option);
                });
        }
    } catch (error) {
        console.error('Erro ao carregar atividades:', error);
    }
}

