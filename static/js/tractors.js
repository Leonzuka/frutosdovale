document.addEventListener('DOMContentLoaded', () => {
    initializeCardHandlers();
    initializeFormHandlers();
    initializeTableSelector();
    
    // Define a data atual no campo de data
    document.getElementById('data').valueAsDate = new Date();
    
    // Adiciona listeners para os botões dos cards
    document.querySelectorAll('.card-button').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation(); // Impede a propagação do evento
            const type = button.closest('.action-card').id === 'fuelCard' 
                ? 'abastecimento' 
                : 'manutencao';
            showForm(type);
        });
    });
});

async function carregarTiposManutencao() {
    try {
        const response = await fetch('/get_maintenance_types');
        const data = await response.json();
        
        if (data.status === 'success') {
            const select = document.getElementById('tipoManutencao');
            // Mantém apenas a primeira opção (placeholder)
            select.innerHTML = '<option value="">Selecione o tipo de manutenção</option>';
            
            // Adiciona as opções da base de dados
            data.types.forEach(type => {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = type;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar tipos de manutenção:', error);
    }
}

function initializeCardHandlers() {
    // Adiciona listeners para os cards
    const cards = document.querySelectorAll('.action-card');
    cards.forEach(card => {
        card.addEventListener('click', (e) => {
            // Se o clique não foi no botão, executa a ação do card
            if (!e.target.closest('.card-button')) {
                if (card.id === 'reportsCard') {
                    showDownloadModal();
                } else {
                    const type = card.id === 'fuelCard' ? 'abastecimento' : 'manutencao';
                    showForm(type);
                }
            }
        });
    });
    
    // Adiciona listeners específicos para os botões
    const buttons = document.querySelectorAll('.card-button');
    buttons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation(); // Previne que o evento se propague para o card
            const card = button.closest('.action-card');
            if (card.id === 'reportsCard') {
                showDownloadModal();
            } else {
                const type = card.id === 'fuelCard' ? 'abastecimento' : 'manutencao';
                showForm(type);
            }
        });
    });
}

// Funções para o modal de download
function showDownloadModal() {
    const modal = document.getElementById('downloadModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}


function closeDownloadModal() {
    const modal = document.getElementById('downloadModal');
    if (modal) {
        modal.style.display = 'none';
    }
}
async function carregarMaquinas() {
    try {
        const response = await fetch('/get_maquinas');
        const data = await response.json();
        
        if (data.status === 'success') {
            const select = document.getElementById('tipoTrator');
            // Mantém apenas a primeira opção (placeholder)
            select.innerHTML = '<option value="">Selecione o trator</option>';
            
            // Adiciona as opções da base de dados
            data.maquinas.forEach(maquina => {
                const option = document.createElement('option');
                option.value = maquina;
                option.textContent = maquina;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar máquinas:', error);
    }
}

function showForm(type) {
    const formSection = document.getElementById('formSection');
    const formTitle = document.getElementById('formTitle');
    
    // Reseta o formulário
    document.getElementById('tractorForm').reset();
    
    // Define a data atual
    document.getElementById('data').valueAsDate = new Date();
    
    // Carrega as máquinas
    carregarMaquinas();
    
    const combustivelSelect = document.getElementById('combustivel');
    if (combustivelSelect) {
        combustivelSelect.addEventListener('change', (e) => {
            if (e.target.value) {
                buscarTotalCombustivel(e.target.value);
            } else {
                document.getElementById('totalCombustivel').style.display = 'none';
            }
        });
    }
    // Atualiza o título
    formTitle.textContent = type === 'abastecimento' 
        ? 'Registro de Abastecimento' 
        : 'Registro de Manutenção';
    
    // Mostra o formulário
    formSection.style.display = 'flex';
    
    // Configura os campos baseado no tipo
    const combustivelGroup = document.getElementById('combustivelGroup');
    const quantidadeGroup = document.getElementById('quantidadeGroup');
    const tipoManutencaoGroup = document.getElementById('tipoManutencaoGroup');
    const operadorGroup = document.getElementById('operadorGroup');
    
    if (type === 'abastecimento') {
        mostrarCamposAbastecimento(combustivelGroup, quantidadeGroup, tipoManutencaoGroup, operadorGroup);
    } else {
        mostrarCamposManutencao(combustivelGroup, quantidadeGroup, tipoManutencaoGroup, operadorGroup);
        carregarTiposManutencao();
    }
}

function closeForm() {
    const formSection = document.getElementById('formSection');
    formSection.classList.remove('active');
    setTimeout(() => {
        formSection.style.display = 'none';
    }, 300);
}

function mostrarCamposAbastecimento(combustivelGroup, quantidadeGroup, tipoManutencaoGroup, operadorGroup) {
    combustivelGroup.style.display = 'block';
    quantidadeGroup.style.display = 'block';
    tipoManutencaoGroup.style.display = 'none';
    operadorGroup.style.display = 'none';
}

function mostrarCamposManutencao(combustivelGroup, quantidadeGroup, tipoManutencaoGroup, operadorGroup) {
    combustivelGroup.style.display = 'none';
    quantidadeGroup.style.display = 'none';
    tipoManutencaoGroup.style.display = 'block';
    operadorGroup.style.display = 'block';
}

function initializeFormHandlers() {
    // Handler para o botão cancelar
    document.querySelectorAll('button[type="button"]').forEach(button => {
        if (button.textContent.toLowerCase() === 'cancelar') {
            button.onclick = closeForm;
        }
    });
}

function ocultarTodosCampos(combustivelGroup, quantidadeGroup, tipoManutencaoGroup, operadorGroup) {
    combustivelGroup.style.display = 'none';
    quantidadeGroup.style.display = 'none';
    tipoManutencaoGroup.style.display = 'none';
    operadorGroup.style.display = 'none';
}

function atualizarTabelaAtual() {
    const tableSelector = document.getElementById('tableSelector');
    const currentTable = tableSelector ? tableSelector.value : 
        (document.getElementById('tractorForm')?.querySelector('[name="atividade"]')?.value || 'abastecimento');
    
    switchTable(currentTable);
}

// Registro de Operações
async function registrar() {
    const form = document.getElementById('tractorForm');
    const formData = new FormData(form);
    
    // Determina o tipo baseado nos campos visíveis
    const type = document.getElementById('combustivelGroup').style.display === 'block' 
        ? 'abastecimento' 
        : 'manutencao';

    if (!validarFormulario(formData, type)) {
        return;
    }

    try {
        const endpoint = type === 'manutencao' ? '/register_manutencao' : '/register_abastecimento';
        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            alert(data.message);
            
            if (type === 'abastecimento') {
                const horimetro = formData.get('horimetro');
                const tipoTrator = formData.get('tipoTrator');
                await checkMaintenance(horimetro, tipoTrator);
            }
            
            form.reset();
            closeForm();
            atualizarTabelaAtual();
        } else {
            alert('Erro: ' + data.message);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao registrar: ' + error.message);
    }
}

function validarFormulario(formData, atividade) {
    if (!formData.get('data') || !formData.get('tipoTrator')) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return false;
    }

    const tipoTrator = formData.get('tipoTrator');
    
    // Verifica horímetro apenas se não for posto
    if (tipoTrator !== 'POSTO DE COMBUSTÍVEL' && !formData.get('horimetro')) {
        alert('Por favor, preencha o horímetro.');
        return false;
    }

    if (atividade === 'abastecimento' && (!formData.get('combustivel') || !formData.get('quantidade'))) {
        alert('Por favor, preencha todos os campos de abastecimento.');
        return false;
    }

    if (atividade === 'manutencao' && (!formData.get('tipoManutencao') || !formData.get('operador'))) {
        alert('Por favor, preencha todos os campos de manutenção.');
        return false;
    }

    return true;
}

// Visualização de Tabelas
function initializeTableSelector() {
    const tableSelector = document.getElementById('tableSelector');
    if (tableSelector) {
        tableSelector.addEventListener('change', (e) => {
            switchTable(e.target.value);
        });
    }
}

function switchTable(tableType) {
    if (!tableType) return;
    
    console.log('Alterando para tabela:', tableType);
    
    const endpoints = {
        'abastecimento': '/view_abastecimento',
        'manutencao': '/view_manutencao'
    };

    fetch(endpoints[tableType])
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                displayTable(data.logs, tableType === 'abastecimento');
            } else {
                console.error('Erro ao buscar dados:', data.message);
            }
        })
        .catch(error => console.error('Erro:', error));
}

function displayTable(logs, isAbastecimento) {
    const tableContainer = document.getElementById('tractor-logs-table');
    if (!tableContainer) return;
    
    tableContainer.innerHTML = '';
    const table = criarEstruturaTabela(logs, isAbastecimento);
    tableContainer.appendChild(table);
}

function criarEstruturaTabela(logs, isAbastecimento) {
    const table = document.createElement('table');
    table.className = 'w-full';
    
    const headers = isAbastecimento 
        ? ['Data', 'Combustível', 'Tipo Trator', 'Quantidade', 'Horímetro']
        : ['Data', 'Tipo Trator', 'Tipo Manutenção', 'Horímetro', 'Operador'];
    
    table.appendChild(criarCabecalhoTabela(headers));
    table.appendChild(criarCorpoTabela(logs, isAbastecimento));
    
    return table;
}

function criarCabecalhoTabela(headers) {
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        th.className = 'p-2 text-left border-b';
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    return thead;
}

function criarCorpoTabela(logs, isAbastecimento) {
    const tbody = document.createElement('tbody');
    
    logs.forEach(log => {
        const row = document.createElement('tr');
        
        const values = isAbastecimento 
            ? [
                // Alterando a formatação da data aqui
                new Date(log.data + 'T00:00:00').toLocaleDateString('pt-BR', {
                    timeZone: 'UTC'  // Importante para evitar problemas de timezone
                }),
                log.combustivel,
                log.tipo_trator,
                log.quantidade + ' L',
                log.horimetro
              ]
            : [
                new Date(log.data + 'T00:00:00').toLocaleDateString('pt-BR', {
                    timeZone: 'UTC'  // Importante para evitar problemas de timezone
                }),
                log.tipo_trator,
                log.tipo_manutencao,
                log.horimetro,
                log.operador
              ];
        
        values.forEach(value => {
            const td = document.createElement('td');
            td.textContent = value;
            td.className = 'p-2 border-b';
            row.appendChild(td);
        });

        // Adiciona a célula com o botão de exclusão
        const deleteCell = document.createElement('td');
        deleteCell.className = 'p-2 border-b';
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';
        deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
        deleteButton.onclick = () => confirmarExclusao(log.id, isAbastecimento);
        deleteCell.appendChild(deleteButton);
        row.appendChild(deleteCell);
        
        tbody.appendChild(row);
    });
    
    return tbody;
}

// Verificação de Manutenção
async function checkMaintenance(horimeter, tractorType) {
    try {
        const response = await fetch('/check_maintenance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                horimeter: parseFloat(horimeter),
                tractorType: tractorType
            })
        });

        const data = await response.json();

        // Só mostra o alerta se houver tarefas pendentes
        if (data.status === 'success' && data.tasks && data.tasks.length > 0) {
            // Filtra as tarefas para mostrar apenas as que realmente estão atrasadas
            const tarefasAtrasadas = data.tasks.filter(task => {
                if (task.type === 'HORIMETRO') {
                    // Verifica se o horímetro atual é maior que o próximo horímetro de manutenção
                    return parseFloat(data.current_horimeter) > parseFloat(task.horimeter);
                } else if (task.type === 'DIAS') {
                    // Para manutenções baseadas em dias, verifica se está realmente atrasada
                    return task.days_passed > task.interval;
                }
                return false;
            });

            // Só mostra o alerta se houver tarefas realmente atrasadas
            if (tarefasAtrasadas.length > 0) {
                const existingAlert = document.querySelector('.maintenance-alert');
                if (existingAlert) {
                    existingAlert.remove();
                }

                const alertDiv = document.createElement('div');
                alertDiv.className = 'maintenance-alert';

                const content = document.createElement('div');
                content.className = 'alert-content';
                content.innerHTML = `
                    <h3>Alerta de Manutenção Necessária</h3>
                    <div class="tractor-info">
                        <h4>Trator: ${data.machine_name}</h4>
                        <h4>Horímetro Atual: ${data.current_horimeter}</h4>
                    </div>
                    <ul>
                        ${tarefasAtrasadas.map(task => {
                            if (task.type === 'HORIMETRO') {
                                return `
                                    <li>
                                        <strong>MANUTENÇÃO NECESSÁRIA</strong><br>
                                        Horímetro da Manutenção: ${task.horimeter}<br>
                                        Serviço: ${task.maintenance}<br>
                                        <span class="alert-difference">
                                            Atrasado por: ${parseFloat(task.difference).toFixed(1)} horas
                                        </span>
                                    </li>
                                `;
                            } else {
                                return `
                                    <li>
                                        <strong>MANUTENÇÃO NECESSÁRIA</strong><br>
                                        Última Manutenção: ${task.last_date}<br>
                                        Serviço: ${task.maintenance}<br>
                                        <span class="alert-difference">
                                            Atrasado por: ${task.days_passed} dias
                                            (Intervalo: ${task.interval} dias)
                                        </span>
                                    </li>
                                `;
                            }
                        }).join('')}
                    </ul>
                    <button onclick="this.closest('.maintenance-alert').remove()">Fechar</button>
                `;

                alertDiv.appendChild(content);
                document.body.appendChild(alertDiv);
            }
        }
    } catch (error) {
        console.error('Erro ao verificar manutenção:', error);
    }
}

function showMaintenanceAlert(data) {
    const existingAlert = document.querySelector('.maintenance-alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    const alertDiv = document.createElement('div');
    alertDiv.className = 'maintenance-alert';

    const content = document.createElement('div');
    content.className = 'alert-content';

    content.innerHTML = `
        <h3>Alerta de Manutenção Necessária</h3>
        <div class="tractor-info">
            <h4>Trator: ${data.machine_name}</h4>
            ${data.current_horimeter ? `<h4>Horímetro Atual: ${data.current_horimeter}</h4>` : ''}
        </div>
        <ul>
            ${data.tasks.map(task => {
                if (task.type === 'HORIMETRO') {
                    return `
                        <li>
                            <strong>MANUTENÇÃO NECESSÁRIA</strong><br>
                            Horímetro da Manutenção: ${task.horimeter}<br>
                            Serviço: ${task.maintenance}<br>
                            <span class="alert-difference">
                                Atrasado por: ${parseFloat(task.difference).toFixed(1)} horas
                            </span>
                        </li>
                    `;
                } else { // DIAS
                    return `
                        <li>
                            <strong>MANUTENÇÃO NECESSÁRIA</strong><br>
                            Última Manutenção: ${task.last_date}<br>
                            Serviço: ${task.maintenance}<br>
                            <span class="alert-difference">
                                Atrasado por: ${task.days_passed} dias
                                (Intervalo: ${task.interval} dias)
                            </span>
                        </li>
                    `;
                }
            }).join('')}
        </ul>
    `;

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Fechar';
    closeButton.onclick = () => alertDiv.remove();
    content.appendChild(closeButton);

    alertDiv.appendChild(content);
    document.body.appendChild(alertDiv);
}

function criarAlertaManutencao() {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'maintenance-alert';
    return alertDiv;
}

function criarConteudoAlerta(data) {
    const content = document.createElement('div');
    content.className = 'alert-content';
    
    content.innerHTML = `
        <h3>Alerta de Manutenção Necessária</h3>
        <div class="tractor-info">
            <h4>Trator:</h4>
            <h4>${data.tractor_name}</h4>
        </div>
    `;
    
    const list = criarListaTarefas(data);
    content.appendChild(list);
    
    const closeButton = criarBotaoFechar();
    content.appendChild(closeButton);
    
    return content;
}

function criarListaTarefas(data) {
    const list = document.createElement('ul');
    
    data.tasks.forEach(task => {
        const li = document.createElement('li');
        li.innerHTML = `
            <strong>MANUTENÇÃO NECESSÁRIA</strong>
            Horímetro Atual: ${data.current_horimeter}<br>
            Horímetro da Manutenção: ${task.horimeter}<br>
            Serviço: ${task.maintenance}<br>
            <span class="alert-difference">Atrasado por: ${task.difference.toFixed(1)} horas</span>
        `;
        list.appendChild(li);
    });
    
    return list;
}

function criarBotaoFechar() {
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Fechar';
    closeButton.onclick = function() {
        this.closest('.maintenance-alert').remove();
    };
    return closeButton;
}

// AVISO DE CONFIRMAÇÃO DE EXCLUSÃO
function confirmarExclusao(id, isAbastecimento) {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
        const endpoint = isAbastecimento ? `/delete_abastecimento/${id}` : `/delete_manutencao/${id}`;
        
        fetch(endpoint, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                alert(data.message);
                // Atualiza a tabela após a exclusão
                atualizarTabelaAtual();
            } else {
                alert('Erro: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao excluir registro');
        });
    }
}

// Download de Planilhas
function showDownloadModal() {
    document.getElementById('downloadModal').style.display = 'flex';
}

function closeDownloadModal() {
    document.getElementById('downloadModal').style.display = 'none';
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

async function downloadPlanilha(tipo) {
    const loadingDiv = showLoading();
    
    try {
        const response = await fetch(`/download_excel/${tipo}`);
        if (!response.ok) throw new Error('Erro ao gerar planilha');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${tipo}_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        closeDownloadModal();
        
    } catch (error) {
        alert('Erro ao baixar planilha: ' + error.message);
    } finally {
        document.body.removeChild(loadingDiv);
    }
}

async function buscarTotalCombustivel(combustivel) {
    try {
        const response = await fetch(`/get_total_combustivel/${combustivel}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            const totalDiv = document.getElementById('totalCombustivel');
            // Remover o abs() e adicionar o sinal
            totalDiv.textContent = `Total em Estoque: ${data.total.toFixed(2)} L`;
            totalDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Erro ao buscar total de combustível:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const dateDisplay = document.getElementById('current-date');
    const yearDisplay = document.getElementById('current-year');
    
    const currentDate = new Date();
    dateDisplay.textContent = currentDate.toLocaleDateString('pt-BR');
    yearDisplay.textContent = currentDate.getFullYear();
});

document.getElementById('tipoTrator').addEventListener('change', function(e) {
    const horimetroGroup = document.getElementById('horimetroGroup');
    const horimetroInput = document.getElementById('horimetro');
    
    if (e.target.value === 'POSTO DE COMBUSTÍVEL') {
        horimetroGroup.style.display = 'none';
        horimetroInput.removeAttribute('required');
        horimetroInput.value = '0';
    } else {
        horimetroGroup.style.display = 'block';
        horimetroInput.setAttribute('required', '');
    }
});
