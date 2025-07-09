// consolidado.js
document.addEventListener('DOMContentLoaded', () => {
    initializePage();
    setupEventListeners();
    loadAllData();
});

function logError(message, error) {
    console.error(message, error);
    showMessage(message, true);
}

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

async function loadAllData() {
    try {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        console.log('Carregando dados de relatório consolidado...');
        showMessage('Carregando dados...', false);
        
        // 1. Carregue os dados do relatório consolidado
        try {
            const reportResponse = await fetch(`/get_consolidated_report_data?startDate=${startDate}&endDate=${endDate}`);
            const reportData = await reportResponse.json();
            
            console.log('Dados do relatório recebidos:', reportData);
            
            if (reportData.status === 'success') {
                console.log('Atualizando métricas com:', reportData.metrics);
                updateMetrics(reportData.metrics || {});
                
                console.log('Atualizando tabela de métricas por fazenda com:', reportData.farms);
                updateFarmMetricsTable(reportData.farms || []);
                
                console.log('Atualizando gráficos por fazenda com:', reportData.farms);
                updateFarmCharts(reportData.farms || []);
                
                console.log('Atualizando gráfico de consumo de combustível com:', reportData.fuelData);
                updateFuelConsumptionChart(reportData.fuelData || []);
                
                console.log('Atualizando tabela de custos com:', reportData.costsDetails);
                updateCostsTable(reportData.costsDetails || []);
                
                console.log('Atualizando KPIs com:', reportData.kpis);
                updateKPIs(reportData.kpis || {});
            } else {
                logError('Erro nos dados do relatório:', reportData.message);
            }
        } catch (error) {
            logError('Falha ao carregar dados do relatório:', error);
        }
        
        // 2. Carregue os dados de estoque
        try {
            const stockResponse = await fetch('/get_consolidated_stock');
            const stockData = await stockResponse.json();
            
            console.log('Dados de estoque recebidos:', stockData);
            
            if (stockData.status === 'success') {
                document.getElementById('totalStock').textContent = 
                    formatCurrency(stockData.valor_total || 0);
            } else {
                logError('Erro nos dados de estoque:', stockData.message);
            }
        } catch (error) {
            logError('Falha ao carregar dados de estoque:', error);
        }
        
        // 4. Carregue os dados de vendas
        try {
            const anoVendas = document.getElementById('anoVendas').value;
            const vendasResponse = await fetch(`/get_consolidated_vendas?ano=${anoVendas}`);
            const vendasData = await vendasResponse.json();
            
            console.log('Dados de vendas recebidos:', vendasData);
            
            if (vendasData.status === 'success') {
                updateVendasUvasChart(vendasData);
                updateVendasTable(vendasData.vendas_por_fazenda || []);
                
                // Atualizar preço médio por kg
                const avgPrice = vendasData.stats?.avg_price || 0;
                document.getElementById('avgGrapePrice').textContent = formatCurrency(avgPrice);
            } else {
                logError('Erro nos dados de vendas:', vendasData.message);
            }
        } catch (error) {
            logError('Falha ao carregar dados de vendas:', error);
        }
        
        showMessage('Dados carregados com sucesso!', false);
    } catch (error) {
        logError('Erro geral ao carregar dados:', error);
    }
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

function updateMetrics(metrics) {
    console.log('Atualizando métricas na tela:', metrics);
    
    // Garantir que metrics não seja nulo
    metrics = metrics || {};
    
    const totalCosts = metrics.totalCosts || 0;
    const totalFuelConsumption = metrics.totalFuelConsumption || 0;
    const totalApplications = metrics.totalApplications || 0;
    const totalEmployees = metrics.totalEmployees || 0;
    
    console.log('Valores a serem exibidos:', {
        totalCosts, totalFuelConsumption, totalApplications, totalEmployees
    });
    
    // Verificar se os elementos existem antes de tentar atualizá-los
    const costElement = document.getElementById('totalCosts');
    if (costElement) {
        costElement.textContent = formatCurrency(totalCosts);
    } else {
        console.error('Elemento #totalCosts não encontrado');
    }
    
    const fuelElement = document.getElementById('fuelConsumption');
    if (fuelElement) {
        fuelElement.textContent = `${totalFuelConsumption.toLocaleString('pt-BR')} L`;
    } else {
        console.error('Elemento #fuelConsumption não encontrado');
    }
    
    const appElement = document.getElementById('totalApplications');
    if (appElement) {
        appElement.textContent = totalApplications.toLocaleString('pt-BR');
    } else {
        console.error('Elemento #totalApplications não encontrado');
    }
    
    const empElement = document.getElementById('totalEmployees');
    if (empElement) {
        empElement.textContent = totalEmployees.toLocaleString('pt-BR');
    } else {
        console.error('Elemento #totalEmployees não encontrado');
    }
}

function updateFarmMetricsTable(farms) {
    const tbody = document.getElementById('farmMetricsTableBody');
    tbody.innerHTML = '';
    
    farms.forEach(farm => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${farm.nome}</td>
            <td>${formatCurrency(farm.custos || 0)}</td>
            <td>${farm.funcionarios || 0}</td>
            <td>${(farm.combustivel || 0).toLocaleString('pt-BR')} L</td>
            <td>${formatCurrency(farm.estoque || 0)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function updateFarmCharts(farms) {
    // Verificar se há dados
    if (!farms || farms.length === 0) {
        console.warn('Sem dados de fazendas para mostrar nos gráficos');
        return; // Sair da função se não houver dados
    }
    
    // Verificar se o elemento canvas existe
    const costsCtx = document.getElementById('farmCostsChart');
    if (!costsCtx) {
        console.error('Elemento #farmCostsChart não encontrado');
        return;
    }
    
    // Destruir gráfico existente se houver
    if (window.farmCostsChart && typeof window.farmCostsChart.destroy === 'function') {
        window.farmCostsChart.destroy();
    }
    
    window.farmCostsChart = new Chart(costsCtx, {
        type: 'bar',
        data: {
            labels: farms.map(farm => farm.nome),
            datasets: [{
                label: 'Custos Totais (R$)',
                data: farms.map(farm => farm.custos || 0),
                backgroundColor: [
                    'rgba(59, 130, 246, 0.6)',
                    'rgba(16, 185, 129, 0.6)',
                    'rgba(245, 158, 11, 0.6)'
                ],
                borderColor: [
                    'rgba(59, 130, 246, 1)',
                    'rgba(16, 185, 129, 1)',
                    'rgba(245, 158, 11, 1)'
                ],
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
    ;
}

function updateFuelConsumptionChart(fuelData) {
    const ctx = document.getElementById('fuelConsumptionChart');
    
    // Verificar se o elemento canvas existe
    if (!ctx) {
        console.error('Elemento #fuelConsumptionChart não encontrado');
        return;
    }
    
    // Destruir gráfico existente se houver
    if (window.fuelConsumptionChart && typeof window.fuelConsumptionChart.destroy === 'function') {
        window.fuelConsumptionChart.destroy();
    }
    
    // Organizar dados por fazenda e máquina
    const farms = [...new Set(fuelData.map(item => item.farm))];
    const machines = [...new Set(fuelData.map(item => item.maquina))];
    
    const datasets = farms.map((farm, index) => {
        const farmData = fuelData.filter(item => item.farm === farm);
        const colorIndex = index % 3;
        const colors = [
            'rgba(59, 130, 246, 0.6)',
            'rgba(16, 185, 129, 0.6)',
            'rgba(245, 158, 11, 0.6)'
        ];
        
        return {
            label: farm,
            data: machines.map(machine => {
                const machineData = farmData.find(item => item.maquina === machine);
                return machineData ? machineData.consumo : 0;
            }),
            backgroundColor: colors[colorIndex],
            borderColor: colors[colorIndex].replace('0.6', '1'),
            borderWidth: 1
        };
    });
    
    window.fuelConsumptionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: machines,
            datasets: datasets
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    stacked: false
                },
                y: {
                    stacked: false,
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
                            return context.dataset.label + ': ' + context.raw.toLocaleString('pt-BR') + ' L';
                        }
                    }
                }
            }
        }
    });
}

function getTipoLabel(tipo) {
    const labels = {
        'QUIMICOS': 'Químicos',
        'FERTIRRIGACAO': 'Fertirrigação',
        'FOLIAR': 'Foliar',
        'HORMONAL': 'Hormonal'
    };
    
    return labels[tipo] || tipo;
}

function updateVendasUvasChart(data) {
    // Verificar se é um evento ou dados
    if (data instanceof Event || !data) {
        // É um evento de mudança do select, buscar dados novamente
        const anoSelecionado = document.getElementById('anoVendas').value;
        fetch(`/get_consolidated_vendas?ano=${anoSelecionado}`)
            .then(response => response.json())
            .then(vendasData => {
                if (vendasData.status === 'success') {
                    renderVendasChart(vendasData);
                    updateVendasTable(vendasData.vendas_por_fazenda);
                    
                    // Atualizar preço médio por kg
                    const avgPrice = vendasData.stats.avg_price || 0;
                    document.getElementById('avgGrapePrice').textContent = formatCurrency(avgPrice);
                }
            })
            .catch(error => console.error('Erro ao atualizar dados de vendas:', error));
    } else {
        // São dados recebidos diretamente
        renderVendasChart(data);
    }
}

function renderVendasChart(data) {
    const ctx = document.getElementById('vendasUvasChart').getContext('2d');
    
    // Verifica se o gráfico existe antes de tentar destruí-lo
    if (window.vendasUvasChart && typeof window.vendasUvasChart.destroy === 'function') {
        window.vendasUvasChart.destroy();
    }
    
    const vendas = data.vendas || [];
    const anoSelecionado = document.getElementById('anoVendas').value;
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
                 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    // Organizar dados por fazenda e mês
    const farmNames = [...new Set(vendas.map(v => v.farm_name))];
    const datasets = farmNames.map((farm, index) => {
        const farmData = vendas.filter(v => v.farm_name === farm);
        const colorIndex = index % 3;
        const colors = [
            'rgba(59, 130, 246, 0.6)',
            'rgba(16, 185, 129, 0.6)',
            'rgba(245, 158, 11, 0.6)'
        ];
        
        // Organizar dados por mês
        const dataByMonth = meses.map((_, monthIndex) => {
            const monthData = farmData.find(v => {
                const [mes] = v.mes.split('/');
                return parseInt(mes) === monthIndex + 1;
            });
            
            return monthData ? monthData.quilo : 0;
        });
        
        return {
            label: farm,
            data: dataByMonth,
            backgroundColor: colors[colorIndex],
            borderColor: colors[colorIndex].replace('0.6', '1'),
            borderWidth: 1
        };
    });
    
    window.vendasUvasChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: meses,
            datasets: datasets
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    stacked: true
                },
                y: {
                    stacked: true,
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
            },
            plugins: {
                title: {
                    display: true,
                    text: `Vendas Mensais de Uvas (kg) - ${anoSelecionado}`
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.raw.toLocaleString('pt-BR') + ' kg';
                        }
                    }
                }
            }
        }
    });
}

function updateVendasTable(vendas) {
    const tbody = document.getElementById('vendasTableBody');
    tbody.innerHTML = '';
    
    vendas.forEach(farm => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${farm.nome}</td>
            <td>${farm.total_kg.toLocaleString('pt-BR')} kg</td>
            <td>${formatCurrency(farm.valor_total)}</td>
            <td>${formatCurrency(farm.preco_medio)}</td>
        `;
        tbody.appendChild(tr);
    });
    
    // Adicionar linha de total
    const totalKg = vendas.reduce((sum, farm) => sum + farm.total_kg, 0);
    const totalValor = vendas.reduce((sum, farm) => sum + farm.valor_total, 0);
    const precoMedioGeral = totalKg > 0 ? totalValor / totalKg : 0;
    
    const trTotal = document.createElement('tr');
    trTotal.style.fontWeight = 'bold';
    trTotal.innerHTML = `
        <td>TOTAL GERAL</td>
        <td>${totalKg.toLocaleString('pt-BR')} kg</td>
        <td>${formatCurrency(totalValor)}</td>
        <td>${formatCurrency(precoMedioGeral)}</td>
    `;
    tbody.appendChild(trTotal);
}

function updateCostsTable(costsDetails) {
    const tbody = document.getElementById('costsTableBody');
    tbody.innerHTML = '';
    
    costsDetails.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.farm_name}</td>
            <td>${item.valve}</td>
            <td>${formatCurrency(item.laborCost)}</td>
            <td>${formatCurrency(item.inputsCost)}</td>
            <td>${formatCurrency(item.totalCost)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function updateKPIs(kpis) {
    document.getElementById('avgCostPerHectare').textContent = formatCurrency(kpis.avgCostPerHectare || 0);
    document.getElementById('avgFuelConsumption').textContent = 
        `${(kpis.avgFuelConsumption || 0).toLocaleString('pt-BR', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2 
        })} L/ha`;
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
}

function showMessage(message, isError = false) {
    // Verificar se já existe um elemento de mensagem
    let messageEl = document.getElementById('feedback-message');
    
    if (!messageEl) {
        // Criar um novo elemento
        messageEl = document.createElement('div');
        messageEl.id = 'feedback-message';
        messageEl.style.position = 'fixed';
        messageEl.style.top = '20px';
        messageEl.style.right = '20px';
        messageEl.style.padding = '10px 20px';
        messageEl.style.borderRadius = '5px';
        messageEl.style.zIndex = '1000';
        messageEl.style.transition = 'opacity 0.3s';
        document.body.appendChild(messageEl);
    }
    
    // Definir estilo e conteúdo
    messageEl.style.backgroundColor = isError ? '#f44336' : '#4CAF50';
    messageEl.style.color = 'white';
    messageEl.textContent = message;
    
    // Mostrar a mensagem
    messageEl.style.opacity = '1';
    
    // Esconder após 3 segundos
    setTimeout(() => {
        messageEl.style.opacity = '0';
    }, 3000);
}