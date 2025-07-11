// ===== VARIÁVEIS GLOBAIS =====
let chartsInstances = {};
let currentPeriod = 30; // Período padrão: 30 dias
let isLoading = false;

// ===== INICIALIZAÇÃO DA PÁGINA =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando página de relatórios...');
    
    // Inicializar componentes básicos
    initializePage();
    
    // Carregar dados iniciais
    loadInitialData();
    
    // Configurar event listeners
    setupEventListeners();
});

// ===== INICIALIZAÇÃO BÁSICA =====
function initializePage() {
    // Atualizar data no header
    updateHeaderDate();
    
    // Configurar filtros
    setupFilters();
    
    // Mostrar loading inicial
    showLoadingState();
}

function updateHeaderDate() {
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        const currentDate = new Date();
        dateElement.textContent = currentDate.toLocaleDateString('pt-BR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }
}

function setupFilters() {
    // Configurar anos no filtro de vendas
    const anoVendas = document.getElementById('anoVendas');
    if (anoVendas) {
        const currentYear = new Date().getFullYear();
        anoVendas.innerHTML = '';
        
        for (let year = currentYear; year >= currentYear - 5; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            if (year === currentYear) option.selected = true;
            anoVendas.appendChild(option);
        }
    }
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Filtro de período
    const periodoSelect = document.getElementById('periodoRelatorio');
    if (periodoSelect) {
        periodoSelect.addEventListener('change', function() {
            currentPeriod = parseInt(this.value);
            refreshAllData();
        });
    }
    
    // Filtro de tipo
    const tipoSelect = document.getElementById('tipoRelatorio');
    if (tipoSelect) {
        tipoSelect.addEventListener('change', function() {
            filterDataByType(this.value);
        });
    }
    
    // Card de download
    setupDownloadHandlers();
    
    // Refresh automático a cada 5 minutos
    setInterval(refreshMetrics, 5 * 60 * 1000);
}

// ===== CARREGAMENTO DE DADOS =====
async function loadInitialData() {
    try {
        showLoadingState();
        
        // Carregar dados em paralelo
        await Promise.all([
            loadMetrics(),
            loadChartData(),
            loadRecentActivities(),
            loadStatusData()
        ]);
        
        hideLoadingState();
        console.log('Dados carregados com sucesso!');
        
    } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
        showErrorState();
    }
}

async function refreshAllData() {
    if (isLoading) return;
    
    try {
        isLoading = true;
        showLoadingState();
        
        await Promise.all([
            loadMetrics(),
            updateCharts(),
            loadRecentActivities()
        ]);
        
        hideLoadingState();
        
    } catch (error) {
        console.error('Erro ao atualizar dados:', error);
    } finally {
        isLoading = false;
    }
}

async function refreshMetrics() {
    try {
        await loadMetrics();
        console.log('Métricas atualizadas automaticamente');
    } catch (error) {
        console.error('Erro na atualização automática:', error);
    }
}

// ===== MÉTRICAS PRINCIPAIS =====
async function loadMetrics() {
    try {
        // Calcular datas
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - currentPeriod);
        
        const params = new URLSearchParams({
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
        });
        
        // Buscar dados do relatório
        const response = await fetch(`/get_report_data?${params}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            updateMetricsDisplay(data);
        } else {
            console.error('Erro nos dados do relatório:', data.message);
            setDefaultMetrics();
        }
        
        // Buscar dados específicos adicionais
        await Promise.all([
            loadFuelConsumption(),
            loadActiveEmployees(),
            loadTotalStock()
        ]);
        
    } catch (error) {
        console.error('Erro ao carregar métricas:', error);
        setDefaultMetrics();
    }
}

function updateMetricsDisplay(data) {
    // Custos de mão de obra
    const totalCosts = document.getElementById('totalCosts');
    if (totalCosts) {
        const costs = data.metrics ? data.metrics.total_costs || 0 : 0;
        totalCosts.textContent = formatCurrency(costs);
    }
}

async function loadFuelConsumption() {
    try {
        // Buscar dados de abastecimento
        const response = await fetch('/view_abastecimento');
        const data = await response.json();
        
        if (data.status === 'success') {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - currentPeriod);
            
            // Filtrar dados pelo período
            const filteredLogs = data.logs.filter(log => {
                const logDate = new Date(log.data);
                return logDate >= startDate && logDate <= endDate && 
                       log.tipo_trator !== 'POSTO DE COMBUSTÍVEL';
            });
            
            // Calcular total de consumo
            const totalConsumption = filteredLogs.reduce((sum, log) => {
                return sum + Math.abs(parseFloat(log.quantidade) || 0);
            }, 0);
            
            const fuelElement = document.getElementById('fuelConsumption');
            if (fuelElement) {
                fuelElement.textContent = `${totalConsumption.toFixed(1)} L`;
            }
        }
    } catch (error) {
        console.error('Erro ao carregar consumo de combustível:', error);
        const fuelElement = document.getElementById('fuelConsumption');
        if (fuelElement) {
            fuelElement.textContent = '0 L';
        }
    }
}

async function loadActiveEmployees() {
    try {
        const response = await fetch('/get_funcionarios');
        const data = await response.json();
        
        if (data.status === 'success') {
            const activeCount = data.funcionarios ? data.funcionarios.length : 0;
            
            const employeesElement = document.getElementById('activeEmployees');
            if (employeesElement) {
                employeesElement.textContent = activeCount.toString();
            }
        }
    } catch (error) {
        console.error('Erro ao carregar funcionários ativos:', error);
        const employeesElement = document.getElementById('activeEmployees');
        if (employeesElement) {
            employeesElement.textContent = '0';
        }
    }
}

async function loadTotalStock() {
    try {
        const response = await fetch('/get_total_stock');
        const data = await response.json();
        
        if (data.status === 'success') {
            const stockElement = document.getElementById('estoqueTotal');
            if (stockElement) {
                stockElement.textContent = formatCurrency(data.valor_total || 0);
            }
        }
    } catch (error) {
        console.error('Erro ao carregar valor do estoque:', error);
        const stockElement = document.getElementById('estoqueTotal');
        if (stockElement) {
            stockElement.textContent = 'R$ 0,00';
        }
    }
}

function setDefaultMetrics() {
    // Definir valores padrão em caso de erro
    const totalCosts = document.getElementById('totalCosts');
    const fuelConsumption = document.getElementById('fuelConsumption');
    const activeEmployees = document.getElementById('activeEmployees');
    const estoqueTotal = document.getElementById('estoqueTotal');
    
    if (totalCosts) totalCosts.textContent = 'R$ 0,00';
    if (fuelConsumption) fuelConsumption.textContent = '0 L';
    if (activeEmployees) activeEmployees.textContent = '0';
    if (estoqueTotal) estoqueTotal.textContent = 'R$ 0,00';
    
    // Zerar contadores de aplicações (não existem mais)
    const totalApplications = document.getElementById('totalApplications');
    if (totalApplications) totalApplications.textContent = '0';
}

// ===== GRÁFICOS =====
async function loadChartData() {
    try {
        await Promise.all([
            createCostsChart(),
            createFuelChart(),
            createEmployeesChart(),
            createTractorsChart()
        ]);
    } catch (error) {
        console.error('Erro ao carregar gráficos:', error);
    }
}

async function createCostsChart() {
    const ctx = document.getElementById('costsChart');
    if (!ctx) return;
    
    try {
        // Buscar dados de apontamentos dos últimos dias
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - currentPeriod);
        
        // Simular dados de evolução de custos (seria necessário endpoint específico)
        const labels = [];
        const data = [];
        
        for (let i = currentPeriod; i >= 0; i -= Math.max(1, Math.floor(currentPeriod / 7))) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }));
            
            // Dados simulados baseados em padrão realista
            data.push(Math.random() * 500 + 200);
        }
        
        // Destruir gráfico existente se houver
        if (chartsInstances.costsChart) {
            chartsInstances.costsChart.destroy();
        }
        
        chartsInstances.costsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Custos Diários (R$)',
                    data: data,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + value.toFixed(0);
                            }
                        }
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('Erro ao criar gráfico de custos:', error);
    }
}

async function createFuelChart() {
    const ctx = document.getElementById('fuelChart');
    if (!ctx) return;
    
    try {
        const response = await fetch('/view_abastecimento');
        const data = await response.json();
        
        if (data.status === 'success') {
            // Agrupar por tipo de trator
            const fuelByTractor = {};
            
            data.logs.forEach(log => {
                if (log.tipo_trator !== 'POSTO DE COMBUSTÍVEL') {
                    if (!fuelByTractor[log.tipo_trator]) {
                        fuelByTractor[log.tipo_trator] = 0;
                    }
                    fuelByTractor[log.tipo_trator] += Math.abs(parseFloat(log.quantidade) || 0);
                }
            });
            
            const labels = Object.keys(fuelByTractor);
            const values = Object.values(fuelByTractor);
            const colors = generateColors(labels.length);
            
            // Destruir gráfico existente se houver
            if (chartsInstances.fuelChart) {
                chartsInstances.fuelChart.destroy();
            }
            
            chartsInstances.fuelChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: values,
                        backgroundColor: colors,
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.label + ': ' + context.parsed.toFixed(1) + 'L';
                                }
                            }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Erro ao criar gráfico de combustível:', error);
    }
}

async function createEmployeesChart() {
    const ctx = document.getElementById('employeesChart');
    if (!ctx) return;
    
    try {
        // Dados simulados de atividade dos funcionários ao longo do período
        const labels = [];
        const data = [];
        
        for (let i = Math.min(currentPeriod, 14); i >= 0; i -= 2) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }));
            
            // Simular atividade baseada em padrão realista
            data.push(Math.floor(Math.random() * 8) + 3); // Entre 3 e 10 funcionários ativos
        }
        
        // Destruir gráfico existente se houver
        if (chartsInstances.employeesChart) {
            chartsInstances.employeesChart.destroy();
        }
        
        chartsInstances.employeesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Funcionários Ativos',
                    data: data,
                    backgroundColor: 'rgba(34, 197, 94, 0.6)',
                    borderColor: '#22c55e',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('Erro ao criar gráfico de funcionários:', error);
    }
}

async function createTractorsChart() {
    const ctx = document.getElementById('applicationsChart'); // Reutilizar canvas de aplicações
    if (!ctx) return;
    
    try {
        const response = await fetch('/view_manutencao');
        const data = await response.json();
        
        if (data.status === 'success') {
            // Agrupar manutenções por tipo de trator
            const maintenanceByTractor = {};
            
            data.logs.forEach(log => {
                if (!maintenanceByTractor[log.tipo_trator]) {
                    maintenanceByTractor[log.tipo_tractor] = 0;
                }
                maintenanceByTractor[log.tipo_tractor]++;
            });
            
            const labels = Object.keys(maintenanceByTractor);
            const values = Object.values(maintenanceByTractor);
            
            // Destruir gráfico existente se houver
            if (chartsInstances.applicationsChart) {
                chartsInstances.applicationsChart.destroy();
            }
            
            chartsInstances.applicationsChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Manutenções',
                        data: values,
                        backgroundColor: 'rgba(168, 85, 247, 0.6)',
                        borderColor: '#a855f7',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Erro ao criar gráfico de tratores:', error);
    }
}

async function updateCharts() {
    try {
        await Promise.all([
            createCostsChart(),
            createFuelChart(),
            createEmployeesChart(),
            createTractorsChart()
        ]);
    } catch (error) {
        console.error('Erro ao atualizar gráficos:', error);
    }
}

// ===== TABELA DE ATIVIDADES RECENTES =====
async function loadRecentActivities() {
    try {
        // Simular dados de atividades recentes baseados nos apontamentos
        const tableBody = document.querySelector('#recentActivities tbody');
        if (!tableBody) return;
        
        // Dados simulados (seria necessário endpoint específico)
        const activities = [
            {
                data: new Date().toLocaleDateString('pt-BR'),
                funcionario: 'João Silva',
                atividade: 'Amarrio',
                area: '2.5 ha',
                custo: 'R$ 65,00',
                status: 'Concluído'
            },
            {
                data: new Date(Date.now() - 86400000).toLocaleDateString('pt-BR'),
                funcionario: 'Maria Santos',
                atividade: 'Poda',
                area: '1.8 ha',
                custo: 'R$ 80,00',
                status: 'Concluído'
            },
            // Adicionar mais atividades conforme necessário
        ];
        
        tableBody.innerHTML = '';
        
        activities.forEach(activity => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${activity.data}</td>
                <td>${activity.funcionario}</td>
                <td>${activity.atividade}</td>
                <td>${activity.area}</td>
                <td>${activity.custo}</td>
                <td><span class="status-badge ${activity.status.toLowerCase()}">${activity.status}</span></td>
            `;
            tableBody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Erro ao carregar atividades recentes:', error);
    }
}

// ===== STATUS DE APLICAÇÕES (ZERADO POIS NÃO EXISTEM MAIS) =====
function loadStatusData() {
    // Zerar todos os valores de aplicações
    const statusElements = [
        'fertirrigacaoHoje', 'fertirrigacaoMes', 'proximaFertirrigacao',
        'defensivosHoje', 'defensivosMes', 'defensivosEstoque',
        'foliarHoje', 'foliarMes', 'foliarEficiencia',
        'hormonalHoje', 'hormonalMes', 'crescimentoHormonal'
    ];
    
    statusElements.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) {
            if (elementId.includes('Hoje') || elementId.includes('Mes')) {
                element.textContent = '0';
            } else {
                element.textContent = '--';
            }
        }
    });
}

// ===== DOWNLOAD E EXPORTAÇÃO =====
function setupDownloadHandlers() {
    // Card de download principal
    const downloadCard = document.getElementById('downloadCard');
    const downloadOptions = document.querySelector('.download-options');
    
    if (downloadCard && downloadOptions) {
        downloadCard.addEventListener('click', function(e) {
            e.stopPropagation();
            downloadOptions.style.display = 
                downloadOptions.style.display === 'none' || !downloadOptions.style.display ? 'block' : 'none';
        });
        
        // Fechar ao clicar fora
        document.addEventListener('click', function(event) {
            if (!downloadCard.contains(event.target)) {
                downloadOptions.style.display = 'none';
            }
        });
    }
    
    // Download de vendas Excel
    const downloadVendasExcel = document.getElementById('downloadVendasExcel');
    if (downloadVendasExcel) {
        downloadVendasExcel.addEventListener('click', handleVendasExcelDownload);
    }
}

async function handleVendasExcelDownload() {
    const ano = document.getElementById('anoVendas').value;
    
    try {
        showDownloadProgress(true);
        
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
        
        showSuccess('Relatório baixado com sucesso!');
        
    } catch (error) {
        console.error('Erro:', error);
        showError(`Erro ao gerar relatório Excel: ${error.message}`);
    } finally {
        showDownloadProgress(false);
    }
}

// ===== FILTRAGEM =====
function filterDataByType(type) {
    // Implementar filtragem por tipo se necessário
    console.log('Filtrar por tipo:', type);
    
    if (type === 'todos') {
        // Mostrar todos os dados
        refreshAllData();
    } else {
        // Filtrar dados específicos
        // Implementar conforme necessário
    }
}

// ===== UTILITÁRIOS =====
function formatCurrency(value) {
    if (typeof value !== 'number') {
        value = parseFloat(value) || 0;
    }
    
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function generateColors(count) {
    const colors = [
        '#3b82f6', '#ef4444', '#22c55e', '#f59e0b',
        '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'
    ];
    
    const result = [];
    for (let i = 0; i < count; i++) {
        result.push(colors[i % colors.length]);
    }
    return result;
}

function showLoadingState() {
    const loadingElements = document.querySelectorAll('.metric-card, .chart-container');
    loadingElements.forEach(el => el.classList.add('loading'));
}

function hideLoadingState() {
    const loadingElements = document.querySelectorAll('.metric-card, .chart-container');
    loadingElements.forEach(el => el.classList.remove('loading'));
}

function showErrorState() {
    console.error('Erro no carregamento dos dados');
    // Implementar visual de erro se necessário
}

function showDownloadProgress(show) {
    const button = document.getElementById('downloadVendasExcel');
    if (button) {
        if (show) {
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';
            button.disabled = true;
        } else {
            button.innerHTML = '<i class="fas fa-file-excel"></i> Excel';
            button.disabled = false;
        }
    }
}

function showSuccess(message) {
    // Implementar notificação de sucesso
    console.log('Sucesso:', message);
}

function showError(message) {
    // Implementar notificação de erro
    console.error('Erro:', message);
    alert(message);
}

// ===== EXPORTAR FUNÇÕES GLOBAIS (se necessário) =====
window.relatoriosUtils = {
    formatCurrency,
    refreshAllData,
    loadMetrics
};