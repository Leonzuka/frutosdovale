// relatorios.js
document.addEventListener('DOMContentLoaded', () => {
    initializePage();
    setupEventListeners();
    loadInitialData();
});

function initializePage() {
    const dateDisplay = document.getElementById('current-date');
    const yearDisplay = document.getElementById('current-year');
    
    const currentDate = new Date();
    dateDisplay.textContent = currentDate.toLocaleDateString('pt-BR');
    yearDisplay.textContent = currentDate.getFullYear();

    // Inicializar data final como hoje
    document.getElementById('endDate').valueAsDate = new Date();
    
    // Inicializar data inicial como 30 dias atrás
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    document.getElementById('startDate').valueAsDate = startDate;
}

function loadInitialData() {
    const dateRange = document.getElementById('dateRange').value;
    updateDateRange(dateRange);
    loadAllData();
}

function updateDateRange(range) {
    const endDate = new Date();
    const startDate = new Date();
    
    switch(range) {
        case '30':
            startDate.setDate(endDate.getDate() - 30);
            break;
        case '90':
            startDate.setDate(endDate.getDate() - 90);
            break;
        case '365':
            startDate.setDate(endDate.getDate() - 365);
            break;
    }
    
    document.getElementById('startDate').valueAsDate = startDate;
    document.getElementById('endDate').valueAsDate = endDate;
}

function setupEventListeners() {
    document.getElementById('dateRange').addEventListener('change', (e) => {
        const customDateRange = document.getElementById('customDateRange');
        if (e.target.value === 'custom') {
            customDateRange.style.display = 'flex';
        } else {
            customDateRange.style.display = 'none';
            updateDateRange(e.target.value);
        }
    });

    document.getElementById('applyFilters').addEventListener('click', () => {
        loadAllData();
    });
    document.getElementById('anoVendas').addEventListener('change', updateVendasUvasChart);
}

document.addEventListener('DOMContentLoaded', function() {
    // Configurar o botão de podas
    const showPodasBtn = document.getElementById('showPodasBtn');
    if (showPodasBtn) {
        showPodasBtn.addEventListener('click', function() {
            document.getElementById('podasModal').style.display = 'flex';
            loadPodasData();
        });
    }
    
    // Função para fechar o modal de podas
    window.closePodasModal = function() {
        document.getElementById('podasModal').style.display = 'none';
    };
    
    // Adicionar a função de carregar dados de podas
    window.loadPodasData = function() {
        fetch('/get_valvulas_poda')
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    renderPodasTable(data.valvulas);
                } else {
                    console.error('Erro ao carregar dados de poda:', data.message);
                }
            })
            .catch(error => {
                console.error('Erro na requisição:', error);
            });
    };
    
    // Função para renderizar a tabela de podas
    function renderPodasTable(valvulas) {
        const tbody = document.getElementById('podasTableBody');
        tbody.innerHTML = '';
        
        const today = new Date();
        
        valvulas.forEach(valvula => {
            const tr = document.createElement('tr');
            
            // Calcular DAP (Dias Após Poda)
            let dapText = 'Não podada';
            let dapValue = '';
            
            if (valvula.data_poda) {
                // Correção para o problema de timezone
                // Extrair ano, mês e dia diretamente da string da data
                let dataISO = valvula.data_poda;
                if (dataISO.includes('T')) {
                    dataISO = dataISO.split('T')[0];
                }
                
                // Criar a data usando o constructor de data com ano, mês (0-11) e dia
                const [ano, mes, dia] = dataISO.split('-').map(Number);
                const podaDate = new Date(ano, mes - 1, dia);  // Ajuste no mês (JS usa 0-11)
                
                const diffTime = Math.abs(today - podaDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                dapText = diffDays.toString();
                dapValue = diffDays;
                
                // Formatação da data para DD/MM/YYYY sem problemas de timezone
                const diaFormatado = dia.toString().padStart(2, '0');
                const mesFormatado = (mes).toString().padStart(2, '0');
                var dataFormatada = `${diaFormatado}/${mesFormatado}/${ano}`;
            } else {
                var dataFormatada = 'Não definida';
            }
            
            tr.innerHTML = `
                <td>${valvula.valvula}</td>
                <td>${valvula.variedade || '-'}</td>
                <td>${dataFormatada}</td>
                <td class="dap-value">${dapText}</td>
                <td>${valvula.area_hectare ? valvula.area_hectare.toFixed(2) : '-'}</td>
                <td>
                    <button class="edit-poda-btn" onclick="showEditPodaModal(${valvula.id}, '${valvula.valvula}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                </td>
            `;
            
            tbody.appendChild(tr);
        });
    }
    
    // Função para mostrar o modal de edição de poda
    window.showEditPodaModal = function(id, valvulaName) {
        const modal = document.getElementById('editPodaModal');
        document.getElementById('editPodaId').value = id;
        document.getElementById('editPodaValvulaLabel').textContent = `Válvula: ${valvulaName}`;
        
        // Buscar a data atual da poda para esta válvula
        fetch(`/get_valvula/${id}`)
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success' && data.valvula.data_poda) {
                    // Extrair apenas a parte da data (YYYY-MM-DD)
                    const dataPoda = data.valvula.data_poda;
                    let dataCorrigida;
                    
                    // Verificar diferentes formatos possíveis e extrair apenas a data YYYY-MM-DD
                    if (dataPoda.includes('T')) {
                        dataCorrigida = dataPoda.split('T')[0];
                    } else if (dataPoda.includes(' ')) {
                        dataCorrigida = dataPoda.split(' ')[0];
                    } else {
                        dataCorrigida = dataPoda;
                    }
                    
                    // Definir o valor no campo de data
                    document.getElementById('editPodaDate').value = dataCorrigida;
                    console.log("Data formatada para o formulário:", dataCorrigida);
                } else {
                    // Se não tem data, limpar o campo
                    document.getElementById('editPodaDate').value = '';
                }
                modal.style.display = 'flex';
            })
            .catch(error => {
                console.error('Erro ao buscar dados da válvula:', error);
                modal.style.display = 'flex';
            });
    };
    
    // Função para fechar o modal de edição de poda
    window.closeEditPodaModal = function() {
        document.getElementById('editPodaModal').style.display = 'none';
    };
    
    // Função para salvar a data de poda
    window.savePodaDate = function() {
        const id = document.getElementById('editPodaId').value;
        const date = document.getElementById('editPodaDate').value;
        
        if (!date) {
            alert('Por favor, selecione uma data válida.');
            return;
        }
        
        // Garantir que a data esteja no formato YYYY-MM-DD
        let dataFormatada = date;
        if (date.includes('/')) {
            const partes = date.split('/');
            dataFormatada = `${partes[2]}-${partes[1]}-${partes[0]}`;
        }
        
        fetch(`/update_poda_date/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ data_poda: dataFormatada })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                closeEditPodaModal();
                loadPodasData();
            } else {
                alert('Erro ao atualizar data de poda: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao atualizar data de poda');
        });
    };
    
    // Configurar o campo de busca para a tabela de podas
    const podasSearch = document.getElementById('podasSearch');
    if (podasSearch) {
        podasSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const rows = document.querySelectorAll('#podasTableBody tr');
            
            rows.forEach(row => {
                const valvula = row.querySelector('td:nth-child(1)').textContent.toLowerCase();
                const variedade = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
                
                if (valvula.includes(searchTerm) || variedade.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
    
    // Configurar o botão de exportação de podas
    const exportPodasBtn = document.getElementById('exportPodasBtn');
    if (exportPodasBtn) {
        exportPodasBtn.addEventListener('click', function() {
            window.location.href = '/download_podas_excel';
        });
    }
});

async function loadAllData() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    try {
        const [reportResponse, totalStockResponse] = await Promise.all([
            fetch(`/get_report_data?startDate=${startDate}&endDate=${endDate}`),
            fetch('/get_total_stock'),
        ]);

        const reportData = await reportResponse.json();
        const totalStockData = await totalStockResponse.json();

        if (reportData.status === 'success') {
            console.log('Estrutura completa dos dados recebidos:', reportData);
            console.log('reportData.tables:', reportData.tables);
            console.log('Tipo de reportData.tables:', typeof reportData.tables);
            console.log('É array?', Array.isArray(reportData.tables));
            
            // Verificar se as funções de atualização existem antes de chamar
            if (typeof updateMetrics === 'function') {
                updateMetrics(reportData.metrics || {});
            }
            
            if (typeof updateFuelConsumptionChart === 'function') {
                updateFuelConsumptionChart(reportData.metrics?.fuel_data || []);
            }
            
            if (typeof updateLowStockProducts === 'function') {
                updateLowStockProducts();
            }
            
            if (typeof updateCostsChart === 'function') {
                updateCostsChart(reportData.tables || []);
            }
            
            if (typeof updateVendasUvasChart === 'function') {
                updateVendasUvasChart();
            }
            
            if (typeof updateTables === 'function') {
                updateTables(reportData.tables || []);
            }
          
        } else {
            console.error('Erro na resposta do servidor:', reportData.message);
        }

        if (totalStockData.status === 'success') {
            const estoqueElement = document.getElementById('estoqueTotal');
            if (estoqueElement) {
                estoqueElement.textContent = formatCurrency(totalStockData.valor_total || 0);
            }
        }
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        // Mostrar erro na interface se possível
        if (typeof showMessage === 'function') {
            showMessage('Erro ao carregar dados do relatório', true);
        }
    }
}

function updateMetrics(metrics) {
    console.log('Atualizando métricas na tela:', metrics);
    
    // Garantir que metrics não seja nulo
    metrics = metrics || {};
    
    const totalCosts = metrics.totalCosts || 0;
    const totalFuelConsumption = metrics.fuel_data ? 
        metrics.fuel_data
            .filter(item => item.maquina !== 'POSTO DE COMBUSTÍVEL')
            .reduce((acc, curr) => acc + curr.consumo, 0) : 0;
    const totalApplications = metrics.totalApplications || 0;
    const activeEmployees = metrics.activeEmployees || metrics.active_employees || metrics.totalEmployees || 0;
    
    console.log('Valores a serem exibidos:', {
        totalCosts, totalFuelConsumption, totalApplications, activeEmployees
    });
    
    // Usar os IDs corretos conforme o HTML
    const costElement = document.getElementById('totalCosts');
    if (costElement) {
        costElement.textContent = formatCurrency(totalCosts);
    } else {
        console.warn('Elemento #totalCosts não encontrado na página');
    }
    
    const fuelElement = document.getElementById('fuelConsumption');
    if (fuelElement) {
        fuelElement.textContent = `${totalFuelConsumption.toLocaleString('pt-BR')} L`;
    } else {
        console.warn('Elemento #fuelConsumption não encontrado na página');
    }
    
    const empElement = document.getElementById('activeEmployees');
    if (empElement) {
        empElement.textContent = activeEmployees.toLocaleString('pt-BR');
    } else {
        console.warn('Elemento #activeEmployees não encontrado na página');
    }
    
    // Área total fixa em 10 hectares para cálculo médio
    const AREA_TOTAL = 10;
    const avgFuelPerHectare = totalFuelConsumption / AREA_TOTAL;

    const avgFuelElement = document.getElementById('avgFuelConsumption');
    if (avgFuelElement) {
        avgFuelElement.textContent = `${avgFuelPerHectare.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })} L/ha`;
    }
}

function updateCharts(tables, efficiency) {
    updateCostsChart(tables);
    updateFuelConsumptionChart(tables.fuelData || []);
    updateLowStockProducts();
    updateEfficiencyChart(efficiency || []);
}

function updateCostsChart(tables) {
    console.log('updateCostsChart recebeu:', tables);
    console.log('Tipo:', typeof tables);
    console.log('É array?', Array.isArray(tables));
    
    const ctx = document.getElementById('costsPerValve');
    if (!ctx) {
        console.warn('Elemento canvas #costsPerValve não encontrado');
        return;
    }
    
    const ctxContext = ctx.getContext('2d');
    
    if (window.costsChart) {
        window.costsChart.destroy();
    }

    // Verificar diferentes estruturas possíveis dos dados
    let dataArray = [];
    
    if (Array.isArray(tables)) {
        dataArray = tables;
    } else if (tables && typeof tables === 'object') {
        // Verificar diferentes possíveis estruturas
        if (Array.isArray(tables.valve_costs)) {
            dataArray = tables.valve_costs;
        } else if (Array.isArray(tables.costs)) {
            dataArray = tables.costs;
        } else if (Array.isArray(tables.costsData)) {
            dataArray = tables.costsData;
        } else {
            // Se não encontrou nenhum array, tentar converter as propriedades do objeto
            const keys = Object.keys(tables);
            console.log('Chaves disponíveis em tables:', keys);
            
            // Tentar encontrar alguma propriedade que seja array
            for (let key of keys) {
                if (Array.isArray(tables[key])) {
                    console.log(`Usando array encontrado em tables.${key}:`, tables[key]);
                    dataArray = tables[key];
                    break;
                }
            }
        }
    }
    
    console.log('Array final para o gráfico:', dataArray);
    
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
        console.warn('Nenhum dado válido encontrado para o gráfico de custos');
        // Criar gráfico vazio
        window.costsChart = new Chart(ctxContext, {
            type: 'bar',
            data: {
                labels: ['Sem dados'],
                datasets: [{
                    label: 'Custo Total (R$)',
                    data: [0],
                    backgroundColor: 'rgba(200, 200, 200, 0.5)',
                    borderColor: 'rgba(200, 200, 200, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + value.toLocaleString('pt-BR');
                            }
                        }
                    }
                }
            }
        });
        return;
    }

    // Filtrar dados válidos e ordenar por custo total
    const validData = dataArray.filter(item => 
        item && 
        typeof item === 'object' && 
        (item.totalCost > 0 || item.total_cost > 0 || item.custo_total > 0)
    ).sort((a, b) => {
        const costA = a.totalCost || a.total_cost || a.custo_total || 0;
        const costB = b.totalCost || b.total_cost || b.custo_total || 0;
        return costB - costA;
    });
    
    if (validData.length === 0) {
        console.warn('Nenhum dado válido após filtragem');
        // Criar gráfico vazio mesmo assim
        window.costsChart = new Chart(ctxContext, {
            type: 'bar',
            data: {
                labels: ['Sem dados válidos'],
                datasets: [{
                    label: 'Custo Total (R$)',
                    data: [0],
                    backgroundColor: 'rgba(200, 200, 200, 0.5)',
                    borderColor: 'rgba(200, 200, 200, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + value.toLocaleString('pt-BR');
                            }
                        }
                    }
                }
            }
        });
        return;
    }

    window.costsChart = new Chart(ctxContext, {
        type: 'bar',
        data: {
            labels: validData.map(item => 
                item.valve || item.valvula || item.nome || 'N/A'
            ),
            datasets: [{
                label: 'Custo Total (R$)',
                data: validData.map(item => 
                    item.totalCost || item.total_cost || item.custo_total || 0
                ),
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toLocaleString('pt-BR');
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'R$ ' + context.raw.toLocaleString('pt-BR');
                        }
                    }
                }
            }
        }
    });
}

function updateFuelConsumptionChart(fuelData) {
    const ctx = document.getElementById('fuelConsumptionChart').getContext('2d');
    
    if (window.fuelChart) {
        window.fuelChart.destroy();
    }
    
    // Filtrar dados excluindo o posto
    const consumoPorMaquina = Array.isArray(fuelData) ? 
        fuelData.filter(item => item.maquina !== 'POSTO DE COMBUSTÍVEL') : [];
    
    window.fuelChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: consumoPorMaquina.map(item => item.maquina),
            datasets: [{
                label: 'Consumo de Combustível (L)',
                data: consumoPorMaquina.map(item => item.consumo),
                backgroundColor: 'rgba(34, 197, 94, 0.5)',
                borderColor: 'rgba(34, 197, 94, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Litros'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y.toFixed(2)} L`;
                        }
                    }
                }
            }
        }
    });
}

async function updateLowStockProducts() {
    try {
        const response = await fetch('/get_low_stock_products');
        const data = await response.json();
        
        if (data.status === 'success') {
            const tbody = document.getElementById('lowStockTableBody');
            const classificacaoFilter = document.getElementById('classificacaoFilter');
            const selectedClassificacao = classificacaoFilter.value;
            
            tbody.innerHTML = ''; // Limpa a tabela atual

            data.produtos
                .filter(product => selectedClassificacao === 'TODOS' || product.classificacao === selectedClassificacao)
                .forEach(product => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${product.produto}</td>
                        <td>${product.saldo_atual.toFixed(2)} ${product.tipo}</td>
                        <td>${product.tipo}</td>
                        <td>${product.classificacao}</td>
                    `;
                    tbody.appendChild(tr);
                });
        }
    } catch (error) {
        console.error('Erro ao carregar produtos com baixo estoque:', error);
    }
}

// Adicione este evento após a função
document.addEventListener('DOMContentLoaded', function() {
    const classificacaoFilter = document.getElementById('classificacaoFilter');
    if (classificacaoFilter) {
        classificacaoFilter.addEventListener('change', updateLowStockProducts);
    }
});

function updateTables(data) {
    const tbody = document.getElementById('costsTableBody');
    if (!tbody) {
        console.warn('Elemento costsTableBody não encontrado');
        return;
    }
    
    tbody.innerHTML = '';

    // Tratar diferentes estruturas de dados
    let tableData = [];
    
    if (Array.isArray(data)) {
        tableData = data;
    } else if (data && typeof data === 'object') {
        // Verificar se tem valve_costs
        if (Array.isArray(data.valve_costs)) {
            tableData = data.valve_costs;
        } else if (Array.isArray(data.costs)) {
            tableData = data.costs;
        } else if (Array.isArray(data.costsData)) {
            tableData = data.costsData;
        } else {
            console.log('Estrutura de dados não reconhecida em updateTables:', data);
        }
    }

    if (!tableData || tableData.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="5" style="text-align: center;">Nenhum dado disponível</td>';
        tbody.appendChild(tr);
        return;
    }

    tableData.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.valve || row.valvula || 'N/A'}</td>
            <td>${formatCurrency(row.laborCost || row.labor_cost || 0)}</td>
            <td>${formatCurrency(row.inputsCost || row.inputs_cost || 0)}</td>
            <td>${formatCurrency(row.totalCost || row.total_cost || 0)}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Função auxiliar para formatação de moeda
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
}

function updateVendasUvasChart() {
    const ctx = document.getElementById('vendasUvasChart');
    if (!ctx) {
        console.warn('Elemento canvas #vendasUvasChart não encontrado');
        return;
    }
    
    const ctxContext = ctx.getContext('2d');
    
    // Destruir gráfico existente se houver
    if (window.vendasUvasChart && typeof window.vendasUvasChart.destroy === 'function') {
        window.vendasUvasChart.destroy();
        window.vendasUvasChart = null;
    }

    const anoSelecionado = document.getElementById('anoVendas').value;
    const dataInicial = `${anoSelecionado}-01-01`;
    const dataFinal = `${anoSelecionado}-12-31`;

    fetch(`/get_vendas_uvas?data_inicial=${dataInicial}&data_final=${dataFinal}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro na resposta da rede');
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
                             'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                
                // Criar objeto com vendas mapeadas por mês
                const vendasPorMes = {};
                data.vendas.forEach(venda => {
                    const [mes] = venda.mes.split('/');
                    vendasPorMes[parseInt(mes)] = venda.quilo;
                });

                // Criar array de dados com todos os meses
                const dadosCompletos = meses.map((_, index) => 
                    vendasPorMes[index + 1] || 0
                );

                window.vendasUvasChart = new Chart(ctxContext, {
                    type: 'bar',
                    data: {
                        labels: meses,
                        datasets: [{
                            label: 'Vendas (kg)',
                            data: dadosCompletos,
                            backgroundColor: 'rgba(34, 197, 94, 0.5)',
                            borderColor: 'rgba(34, 197, 94, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: function(value) {
                                        return value.toLocaleString('pt-BR') + ' kg';
                                    }
                                }
                            }
                        },
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return context.raw.toLocaleString('pt-BR') + ' kg';
                                    }
                                }
                            }
                        }
                    }
                });
            }
        })
        .catch(error => {
            console.error('Erro ao carregar dados de vendas:', error);
        });
}

document.getElementById('exportVendasExcel').addEventListener('click', async () => {
    const ano = document.getElementById('anoVendas').value;
    
    try {
        const response = await fetch(`/download_vendas_excel?ano=${ano}`);
        const contentType = response.headers.get('content-type');
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao gerar relatório');
        }
        
        if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao gerar relatório');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vendas_uvas_${ano}_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    } catch (error) {
        console.error('Erro:', error);
        alert(`Erro ao gerar relatório Excel: ${error.message}`);
    }
});

async function updateTotalStock() {
    try {
        const response = await fetch('/get_total_stock');
        const data = await response.json();
        if (data.status === 'success') {
            document.getElementById('estoqueTotal').textContent = 
                formatCurrency(data.valor_total || 0);
        }
    } catch (error) {
        console.error('Erro ao buscar valor total do estoque:', error);
    }
}

// Manipulador do card de download
document.addEventListener('DOMContentLoaded', function() {
    const downloadCard = document.getElementById('downloadCard');
    const downloadOptions = document.querySelector('.download-options');
    
    downloadCard.addEventListener('click', function() {
        downloadOptions.style.display = 
            downloadOptions.style.display === 'none' ? 'block' : 'none';
    });
    
    // Fechar ao clicar fora
    document.addEventListener('click', function(event) {
        if (!downloadCard.contains(event.target)) {
            downloadOptions.style.display = 'none';
        }
    });
});

// Função para download dos arquivos
async function downloadFile(type) {
    try {
        const response = await fetch(`/download_${type}`);
        if (!response.ok) throw new Error('Erro ao baixar arquivo');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    } catch (error) {
        console.error('Erro ao baixar arquivo:', error);
        alert('Erro ao baixar arquivo. Tente novamente.');
    }
}

function showExtraPaymentModal() {
    document.getElementById('dateSelectionModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('dateSelectionModal').style.display = 'none';
}

function downloadExtraPayment() {
    const startDate = document.getElementById('extraStartDate').value;
    const endDate = document.getElementById('extraEndDate').value;

    if (!startDate || !endDate) {
        alert('Por favor, selecione as datas inicial e final.');
        return;
    }

    window.location.href = `/download_apontamento/resumo?dataInicial=${startDate}&dataFinal=${endDate}`;
    closeModal();
}

// Verificar se o elemento existe antes de adicionar o evento
const csvFileInput = document.getElementById('csvFile');
if (csvFileInput) {
    csvFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/importar_vendas', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            
            if (response.ok) {
                alert('Dados importados com sucesso!');
                updateVendasUvasChart(); // Atualiza o gráfico
            } else {
                alert('Erro ao importar dados: ' + data.error);
            }
        } catch (error) {
            alert('Erro ao importar arquivo: ' + error);
        }

        // Limpar o input para permitir selecionar o mesmo arquivo novamente
        e.target.value = '';
    });
}