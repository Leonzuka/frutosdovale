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

async function loadAllData() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    try {
        const [reportResponse, totalStockResponse, caldaResponse] = await Promise.all([
            fetch(`/get_report_data?startDate=${startDate}&endDate=${endDate}`),
            fetch('/get_total_stock'),
            fetch('/get_estoque_calda')
        ]);

        const reportData = await reportResponse.json();
        const totalStockData = await totalStockResponse.json();
        const caldaData = await caldaResponse.json();

        if (reportData.status === 'success') {
            updateMetrics(reportData.metrics);
            updateFuelConsumptionChart(reportData.metrics.fuel_data || []);
            updateLowStockProducts();
            updateCostsChart(reportData.tables);
            updateApplicationsChart(reportData.tables);
            updateVendasUvasChart();
            updateTables(reportData.tables);
            updateKPIs(reportData.kpis);
        }

        if (totalStockData.status === 'success') {
            document.getElementById('totalStock').textContent = 
                formatCurrency(totalStockData.valor_total || 0);
        }

        if (caldaData.status === 'success') {
            const estoqueCalda = caldaData.valor_total || 0;
            document.getElementById('totalCalda').textContent = 
                formatCurrency(estoqueCalda);

            const estoqueRegular = totalStockData.valor_total || 0;
            const estoqueTotal = estoqueRegular + estoqueCalda;
            
            document.getElementById('estoqueTotal').textContent = 
                formatCurrency(estoqueTotal);
        }
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

function updateMetrics(metrics) {
    const totalCosts = (metrics.totalCosts || 0);
    
    
    document.getElementById('totalCosts').textContent = formatCurrency(totalCosts);


    const totalFuelConsumption = metrics.fuel_data ? 
        metrics.fuel_data
            .filter(item => item.maquina !== 'POSTO DE COMBUSTÍVEL')
            .reduce((acc, curr) => acc + curr.consumo, 0) : 0;


    document.getElementById('fuelConsumption').textContent = 
        `${totalFuelConsumption.toLocaleString('pt-BR')} L`;

    // Área total fixa em 10 hectares
    const AREA_TOTAL = 10;
    const avgFuelPerHectare = totalFuelConsumption / AREA_TOTAL;

    document.getElementById('avgFuelConsumption').textContent = 
        `${avgFuelPerHectare.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })} L/ha`;

    document.getElementById('totalApplications').textContent = 
        (metrics.totalApplications || 0).toLocaleString('pt-BR');

    document.getElementById('activeEmployees').textContent = 
        (metrics.activeEmployees || 0).toLocaleString('pt-BR');
}

function updateCharts(tables, efficiency) {
    updateCostsChart(tables);
    updateFuelConsumptionChart(tables.fuelData || []);
    updateLowStockProducts();
    updateApplicationsChart(tables);
    updateEfficiencyChart(efficiency || []);
}

function updateCostsChart(tables) {
    const ctx = document.getElementById('costsPerValve').getContext('2d');
    
    if (window.costsChart) {
        window.costsChart.destroy();
    }

    // Filtrar dados válidos e ordenar por custo total
    const validData = tables.filter(item => item.totalCost > 0)
        .sort((a, b) => b.totalCost - a.totalCost);
    
    window.costsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: validData.map(item => item.valve),
            datasets: [{
                label: 'Custo Total (R$)',
                data: validData.map(item => item.totalCost),
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

function updateApplicationsChart() {
    const dataInicial = document.getElementById('startDate').value;
    const dataFinal = document.getElementById('endDate').value;
    
    fetch(`/get_aplicacoes_analytics?data_inicial=${dataInicial}&data_final=${dataFinal}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success' && data.aplicacoes) {
                data.aplicacoes.forEach(item => {
                    const taxa = Number(item.taxa_conclusao || 0);
                    
                    let prefix;
                    switch(item.tipo) {
                        case 'QUIMICOS':
                            prefix = 'def';
                            break;
                        case 'FERTIRRIGACAO':
                            prefix = 'fert';
                            break;
                        case 'FOLIAR':
                            prefix = 'fol';
                            break;
                        case 'HORMONAL':
                            prefix = 'hor';
                            break;
                    }
                    
                    if (prefix) {
                        document.getElementById(`${prefix}Concluidas`).textContent = item.realizadas;
                        document.getElementById(`${prefix}Pendentes`).textContent = item.pendentes;
                        document.getElementById(`${prefix}Taxa`).textContent = `${taxa.toFixed(1)}%`;
                    }
                });
            }
        })
        .catch(error => {
            console.error('Erro ao carregar dados de aplicações:', error);
        });
}

function updateTables(data) {
    const tbody = document.getElementById('costsTableBody');
    tbody.innerHTML = '';

    if (!data || data.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="5" style="text-align: center;">Nenhum dado disponível</td>';
        tbody.appendChild(tr);
        return;
    }

    data.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.valve}</td>
            <td>${formatCurrency(row.laborCost)}</td>
            <td>${formatCurrency(row.inputsCost)}</td>
            <td>${formatCurrency(row.machineryCost)}</td>
            <td>${formatCurrency(row.totalCost)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function updateKPIs(kpis) {
    // Custo médio por hectare
    document.getElementById('avgCostPerHectare').textContent = 
        `${formatCurrency(kpis.avgCostPerHectare || 0)} /ha`;

    // Consumo médio de combustível por hectare (melhorado)
    const fuelElement = document.getElementById('avgFuelConsumption');
    const avgFuelConsumption = kpis.avgFuelConsumption || 0;
    const totalFuelConsumption = kpis.totalFuelConsumption || 0;
    
    fuelElement.textContent = `${avgFuelConsumption.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })} L/ha`;
    
    // Tooltip informativo
    fuelElement.title = `Consumo total: ${totalFuelConsumption.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })} L em ${kpis.totalArea} hectares`;
}

// Função auxiliar para formatação de moeda
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
}

function updateVendasUvasChart() {
    const ctx = document.getElementById('vendasUvasChart').getContext('2d');
    
    if (window.vendasUvasChart instanceof Chart) {
        window.vendasUvasChart.destroy();
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

                window.vendasUvasChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: meses,
                        datasets: [{
                            label: `Volume de Vendas ${anoSelecionado}`,
                            data: dadosCompletos,
                            backgroundColor: 'rgba(12, 110, 175, 0.5)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title: {
                                display: true,
                                text: `Vendas Mensais de Uvas (kg) - ${anoSelecionado}`
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return `${context.parsed.y.toLocaleString('pt-BR')} kg`;
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Quilos'
                                },
                                ticks: {
                                    callback: function(value) {
                                        return value.toLocaleString('pt-BR') + ' kg';
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
            document.getElementById('totalStock').textContent = 
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

async function updateEstoqueCalda() {
    try {
        const response = await fetch('/get_estoque_calda');
        const data = await response.json();
        
        if (data.status === 'success') {
            // Atualizar estoque de calda
            const estoqueCalda = data.valor_total || 0;
            document.getElementById('totalCalda').textContent = 
                formatCurrency(estoqueCalda);
                
            // Pegar o valor do estoque regular
            const estoqueRegularText = document.getElementById('totalStock').textContent;
            const estoqueRegular = parseFloat(estoqueRegularText.replace(/[R$\s.]/g, '').replace(',', '.'));
            
            // Calcular e atualizar o total
            console.log('Estoque Regular:', estoqueRegular);
            console.log('Estoque Calda:', estoqueCalda);
            
            const estoqueTotal = estoqueRegular + estoqueCalda;
            document.getElementById('estoqueTotal').textContent = 
                formatCurrency(estoqueTotal);
        }
    } catch (error) {
        console.error('Erro ao buscar valor do estoque de calda:', error);
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

document.getElementById('csvFile').addEventListener('change', async (e) => {
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