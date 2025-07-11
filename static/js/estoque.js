// ===== CONFIGURAÇÃO INICIAL =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('Iniciando página de estoque...');
    
    // Verificar se estamos na página correta
    const isEstoquePage = window.location.pathname.includes('/estoque');
    
    if (!isEstoquePage) {
        console.log('Não é a página de estoque, pulando inicialização');
        return;
    }
    
    // Inicializar componentes com verificação de existência
    initializePage();
    carregarDados();
    setupFormHandlers();
    
    // Adicionar listener para pesquisa se existir
    const searchInput = document.getElementById('searchProduto');
    if (searchInput) {
        searchInput.addEventListener('input', filtrarProdutos);
    }

    // Adicionar listener para tipo de movimento se existir
    const tipoMovimento = document.getElementById('tipo_movimento');
    if (tipoMovimento) {
        tipoMovimento.addEventListener('change', toggleCampos);
    }
    
    // Adicionar máscara para telefone se existir
    const telefoneInput = document.getElementById('telefoneLoja');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 11) {
                value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
                value = value.replace(/(\d)(\d{4})$/, '$1-$2');
                e.target.value = value;
            }
        });
    }
});

// ===== VARIÁVEIS GLOBAIS =====
let currentPage = 1;
let totalPages = 1;
let maxPagesShow = 8;

// ===== INICIALIZAÇÃO DA PÁGINA =====
function initializePage() {
    console.log('Inicializando página de estoque...');
    
    // Atualizar data e ano no cabeçalho
    const dateDisplay = document.getElementById('current-date');
    const yearDisplay = document.getElementById('current-year');
    
    const currentDate = new Date();
    if (dateDisplay) {
        dateDisplay.textContent = currentDate.toLocaleDateString('pt-BR');
    }
    if (yearDisplay) {
        yearDisplay.textContent = currentDate.getFullYear();
    }
    
    // Adicionar listeners para os cards de ação
    const cards = document.querySelectorAll('.action-card');
    cards.forEach(card => {
        card.addEventListener('click', (e) => {
            // Se o clique não foi no botão, executa a ação do card
            if (!e.target.closest('.card-button')) {
                if (card.id === 'registroCard') {
                    showModal('registroModal');
                } else if (card.id === 'addProdutoCard') {
                    showModal('addProdutoModal');
                } else if (card.id === 'removeProdutoCard') {
                    showModal('removeProdutoModal');
                } else if (card.id === 'addLojaCard') {
                    showModal('addLojaModal');
                } else if (card.id === 'removeLojaCard') {
                    showModal('removeLojaModal');
                } else if (card.id === 'downloadCard') {
                    showModal('downloadModal');
                }
            }
        });
    });
}

// ===== CARREGAMENTO DE DADOS PRINCIPAL (CORRIGIDO) =====
async function carregarDados() {
    console.log('Carregando todos os dados da página...');
    
    try {
        // Carregar dados em paralelo
        await Promise.all([
            carregarProdutos(),
            carregarLojas(),
            carregarFuncionarios(),
            carregarEstatisticas(),           // ADICIONADO
            carregarMovimentacoesRecentes(),  // ADICIONADO
            carregarUltimasMovimentacoes(1)
        ]);
        
        console.log('Todos os dados carregados com sucesso!');
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

// ===== CARREGAR ESTATÍSTICAS DO DASHBOARD =====
async function carregarEstatisticas() {
    try {
        console.log('Carregando estatísticas do estoque...');
        
        const response = await fetch('/get_estatisticas_estoque');
        const data = await response.json();
        
        if (data.status === 'success') {
            const stats = data.estatisticas;
            
            // Atualizar produtos ativos
            const totalProdutosEl = document.getElementById('total-produtos');
            if (totalProdutosEl) {
                totalProdutosEl.textContent = stats.produtos.ativos || 0;
            }
            
            // Atualizar movimentações de hoje
            const totalMovimentacoesEl = document.getElementById('total-movimentacoes');
            if (totalMovimentacoesEl) {
                totalMovimentacoesEl.textContent = stats.movimentacoes_hoje.total || 0;
            }
            
            // Atualizar valor total do estoque
            const valorTotalEl = document.getElementById('valor-total');
            if (valorTotalEl) {
                const valor = parseFloat(stats.valor_total_estoque || 0);
                valorTotalEl.textContent = 'R$ ' + valor.toLocaleString('pt-BR', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                });
            }
            
            // Atualizar mini stats dos cards (entradas e saídas hoje)
            const entradasHojeEl = document.getElementById('entradas-hoje');
            if (entradasHojeEl) {
                entradasHojeEl.textContent = stats.movimentacoes_hoje.entradas || 0;
            }
            
            const saidasHojeEl = document.getElementById('saidas-hoje');
            if (saidasHojeEl) {
                saidasHojeEl.textContent = stats.movimentacoes_hoje.saidas || 0;
            }
            
            console.log('Estatísticas carregadas com sucesso!');
            
        } else {
            console.error('Erro ao carregar estatísticas:', data.message);
            setDefaultStatValues();
        }
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        setDefaultStatValues();
    }
}

// ===== CARREGAR MOVIMENTAÇÕES RECENTES =====
async function carregarMovimentacoesRecentes() {
    try {
        console.log('Carregando movimentações recentes...');
        
        const response = await fetch('/get_movimentacoes_recentes');
        const data = await response.json();
        
        if (data.status === 'success') {
            const container = document.getElementById('recent-movements');
            if (!container) {
                console.log('Container recent-movements não encontrado');
                return;
            }
            
            if (data.movimentacoes.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <p>Nenhuma movimentação recente</p>
                    </div>
                `;
                return;
            }
            
            // Renderizar movimentações recentes (máximo 5)
            container.innerHTML = data.movimentacoes.slice(0, 5).map(mov => {
                const dataFormatada = new Date(mov.data).toLocaleDateString('pt-BR');
                const horaFormatada = new Date(mov.data).toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                
                return `
                    <div class="movement-card ${mov.tipo_movimento.toLowerCase()}">
                        <div class="movement-icon">
                            <i class="fas fa-${mov.tipo_movimento === 'ENTRADA' ? 'arrow-down' : 'arrow-up'}"></i>
                        </div>
                        <div class="movement-content">
                            <div class="movement-header">
                                <span class="movement-type ${mov.tipo_movimento.toLowerCase()}">${mov.tipo_movimento}</span>
                                <span class="movement-date">${dataFormatada} ${horaFormatada}</span>
                            </div>
                            <div class="movement-details">
                                <span class="movement-product">${mov.produto_nome}</span>
                                <span class="movement-quantity">${mov.quantidade} ${mov.unidade}</span>
                                ${mov.valor_unitario ? `<span class="movement-value">R$ ${mov.valor_unitario.toFixed(2)}</span>` : ''}
                            </div>
                            <div class="movement-footer">
                                <span class="movement-employee">Por: ${mov.funcionario_nome}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            console.log('Movimentações recentes carregadas com sucesso!');
            
        } else {
            console.error('Erro ao carregar movimentações recentes:', data.message);
            const container = document.getElementById('recent-movements');
            if (container) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Erro ao carregar movimentações</p>
                    </div>
                `;
            }
        }
        
    } catch (error) {
        console.error('Erro ao carregar movimentações recentes:', error);
        const container = document.getElementById('recent-movements');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Erro ao carregar movimentações</p>
                </div>
            `;
        }
    }
}

// ===== FUNÇÃO PARA VALORES PADRÃO EM CASO DE ERRO =====
function setDefaultStatValues() {
    const elementos = [
        { id: 'total-produtos', valor: '0' },
        { id: 'total-movimentacoes', valor: '0' },
        { id: 'valor-total', valor: 'R$ 0,00' },
        { id: 'entradas-hoje', valor: '0' },
        { id: 'saidas-hoje', valor: '0' }
    ];
    
    elementos.forEach(elem => {
        const el = document.getElementById(elem.id);
        if (el) {
            el.textContent = elem.valor;
        }
    });
}

// ===== FUNÇÕES DE FILTRO =====
function filtrarProdutos() {
    const searchInput = document.getElementById('searchProduto');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const produtos = document.querySelectorAll('#listaProdutos .produto-item');

    produtos.forEach(produto => {
        const nome = produto.querySelector('span').textContent.toLowerCase();
        produto.style.display = nome.includes(searchTerm) ? 'block' : 'none';
    });
}

// ===== PRODUTOS =====
async function carregarProdutos() {
    try {
        const response = await fetch('/get_produtos');
        const data = await response.json();
        
        if (data.status === 'success') {
            // Atualizar select de produtos se existir
            const produtoSelect = document.getElementById('produto');
            if (produtoSelect) {
                produtoSelect.innerHTML = '<option value="">Selecione o produto</option>';
                data.produtos.forEach(produto => {
                    if (produto.ativo === 1) {
                        const option = document.createElement('option');
                        option.value = produto.id;
                        option.textContent = `${produto.produto} (${produto.tipo})`;
                        option.dataset.classificacao = produto.classificacao;
                        produtoSelect.appendChild(option);
                    }
                });
            }
            
            // Atualizar lista de produtos se existir
            atualizarListaProdutos(data.produtos);
        }
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
    }
}

// ===== LOJAS =====
async function carregarLojas() {
    try {
        const response = await fetch('/get_lojas');
        const data = await response.json();
        
        if (data.status === 'success') {
            const lojaSelect = document.getElementById('loja');
            if (lojaSelect) {
                lojaSelect.innerHTML = '<option value="">Selecione a loja</option>';
                data.lojas.forEach(loja => {
                    const option = document.createElement('option');
                    option.value = loja.id;
                    option.textContent = loja.nome;
                    lojaSelect.appendChild(option);
                });
            }
            
            // Atualizar lista de lojas se existir
            atualizarListaLojas(data.lojas);
        }
    } catch (error) {
        console.error('Erro ao carregar lojas:', error);
    }
}

// ===== FUNCIONÁRIOS =====
async function carregarFuncionarios() {
    try {
        const response = await fetch('/get_funcionarios');
        const data = await response.json();
        
        if (data.status === 'success') {
            const funcionarioSelect = document.getElementById('funcionario');
            if (funcionarioSelect) {
                funcionarioSelect.innerHTML = '<option value="">Selecione o funcionário</option>';
                data.funcionarios.forEach(funcionario => {
                    const option = document.createElement('option');
                    option.value = funcionario.id;
                    option.textContent = funcionario.nome;
                    funcionarioSelect.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Erro ao carregar funcionários:', error);
    }
}

// ===== ATUALIZAR LISTAS =====
function atualizarListaProdutos(produtos) {
    const listaProdutos = document.getElementById('listaProdutos');
    if (!listaProdutos) {
        console.log('Elemento listaProdutos não encontrado');
        return;
    }
    
    listaProdutos.innerHTML = '';

    produtos.forEach(produto => {
        const produtoDiv = document.createElement('div');
        produtoDiv.className = 'produto-item';
        produtoDiv.innerHTML = `
            <span>${produto.produto} (${produto.tipo || produto.unidade}) - ${produto.classificacao}</span>
            <button onclick="removerProduto(${produto.id})" class="btn-remove">
                <i class="fas fa-trash"></i>
            </button>
        `;
        listaProdutos.appendChild(produtoDiv);
    });
}

function atualizarListaLojas(lojas) {
    const listaLojas = document.getElementById('listaLojas');
    if (!listaLojas) {
        console.log('Elemento listaLojas não encontrado');
        return;
    }
    
    listaLojas.innerHTML = '';
    
    if (lojas.length === 0) {
        listaLojas.innerHTML = '<p class="no-data">Nenhuma loja cadastrada</p>';
    } else {
        lojas.forEach(loja => {
            const lojaDiv = document.createElement('div');
            lojaDiv.className = 'loja-item';
            lojaDiv.innerHTML = `
                <div class="loja-info">
                    <span class="loja-nome">${loja.nome}</span>
                    ${loja.telefone ? `<span class="loja-telefone">${loja.telefone}</span>` : ''}
                </div>
                <button onclick="removerLoja(${loja.id})" class="btn-remove">
                   <i class="fas fa-trash"></i>
                </button>
            `;
            listaLojas.appendChild(lojaDiv);
        });
    }
}

// ===== SETUP FORM HANDLERS =====
function setupFormHandlers() {
    // Verificar e adicionar handlers apenas se os elementos existirem
    const registroForm = document.getElementById('registroForm');
    const addProdutoForm = document.getElementById('addProdutoForm');
    const addLojaForm = document.getElementById('addLojaForm');

    if (registroForm) {
        registroForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await registrarMovimentacao(new FormData(registroForm));
        });
    } else {
        console.log('Formulário registroForm não encontrado');
    }

    if (addProdutoForm) {
        addProdutoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await adicionarProduto(new FormData(addProdutoForm));
        });
    } else {
        console.log('Formulário addProdutoForm não encontrado');
    }

    if (addLojaForm) {
        addLojaForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await adicionarLoja(new FormData(addLojaForm));
        });
    } else {
        console.log('Formulário addLojaForm não encontrado');
    }
}

// ===== REGISTRAR MOVIMENTAÇÃO =====
async function registrarMovimentacao(formData) {
    try {
        const response = await fetch('/adicionar_movimentacao', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        
        if (data.status === 'success') {
            alert('Movimentação registrada com sucesso!');
            closeModal('registroModal');
            document.getElementById('registroForm').reset();
            
            // Recarregar dados
            await carregarEstatisticas();
            await carregarMovimentacoesRecentes();
            await carregarUltimasMovimentacoes(1);
            
        } else {
            alert('Erro: ' + data.message);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao registrar movimentação');
    }
}

// ===== ADICIONAR PRODUTO =====
async function adicionarProduto(formData) {
    try {
        const response = await fetch('/adicionar_produto', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        
        if (data.status === 'success') {
            alert('Produto adicionado com sucesso!');
            closeModal('addProdutoModal');
            document.getElementById('addProdutoForm').reset();
            await carregarProdutos();
        } else {
            alert('Erro: ' + data.message);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao adicionar produto');
    }
}

// ===== ADICIONAR LOJA =====
async function adicionarLoja(formData) {
    try {
        const response = await fetch('/adicionar_loja', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        
        if (data.status === 'success') {
            alert('Loja adicionada com sucesso!');
            closeModal('addLojaModal');
            document.getElementById('addLojaForm').reset();
            await carregarLojas();
        } else {
            alert('Erro: ' + data.message);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao adicionar loja');
    }
}

// ===== REMOVER PRODUTO =====
async function removerProduto(id) {
    if (!confirm('Tem certeza que deseja remover este produto?')) {
        return;
    }

    try {
        const response = await fetch(`/remover_produto/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        
        if (data.status === 'success') {
            alert('Produto removido com sucesso!');
            await carregarProdutos();
        } else {
            alert('Erro: ' + data.message);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao remover produto');
    }
}

// ===== REMOVER LOJA =====
async function removerLoja(id) {
    if (!confirm('Tem certeza que deseja remover esta loja?')) {
        return;
    }

    try {
        const response = await fetch(`/remover_loja/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        
        if (data.status === 'success') {
            alert('Loja removida com sucesso!');
            await carregarLojas();
        } else {
            alert('Erro: ' + data.message);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao remover loja');
    }
}

// ===== ÚLTIMAS MOVIMENTAÇÕES =====
async function carregarUltimasMovimentacoes(page = 1) {
    try {
        const response = await fetch(`/get_ultimas_movimentacoes?page=${page}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            const movimentacoesList = document.getElementById('movimentacoes-list');
            if (!movimentacoesList) {
                console.log('Elemento movimentacoes-list não encontrado');
                return;
            }
            
            currentPage = data.current_page;
            totalPages = data.total_pages;
            
            // Atualizar lista de movimentações
            movimentacoesList.innerHTML = data.movimentacoes.map(mov => `
                <div class="movimentacao-item">
                    <div class="movimentacao-info">
                        <span class="movimentacao-data">${mov.data}</span>
                        <span class="movimentacao-produto">${mov.produto}</span>
                        <span class="movimentacao-detalhes">
                            ${mov.tipo_movimento}: ${mov.quantidade} ${mov.tipo_movimento === 'ENTRADA' ? 
                            `(R$ ${mov.valor_unitario.toFixed(2)})` : ''}<br>
                            Funcionário: ${mov.funcionario}<br>
                            ${mov.tipo_movimento === 'ENTRADA' ? `Loja: ${mov.loja}` : ''}
                        </span>
                    </div>
                    <button onclick="excluirMovimentacao(${mov.id})" class="delete-button">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('');
            
            // Atualizar paginação
            renderizarPaginacao();
        }
    } catch (error) {
        console.error('Erro ao carregar movimentações:', error);
    }
}

// ===== PAGINAÇÃO =====
function renderizarPaginacao() {
    const paginationContainer = document.querySelector('.pagination');
    if (!paginationContainer) {
        console.log('Container de paginação não encontrado');
        return;
    }

    let buttons = [];
    
    // Se não houver páginas, não renderizar
    if (totalPages === 0) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    // Botão Anterior
    buttons.push(`<button ${currentPage === 1 ? 'disabled' : ''} onclick="carregarUltimasMovimentacoes(${currentPage - 1})">
        <i class="fas fa-chevron-left"></i> Anterior
    </button>`);
    
    // Páginas
    const startPage = Math.max(1, currentPage - Math.floor(maxPagesShow / 2));
    const endPage = Math.min(totalPages, startPage + maxPagesShow - 1);
    
    for (let i = startPage; i <= endPage; i++) {
        buttons.push(`<button ${i === currentPage ? 'class="active"' : ''} onclick="carregarUltimasMovimentacoes(${i})">
            ${i}
        </button>`);
    }
    
    // Botão Próximo
    buttons.push(`<button ${currentPage === totalPages ? 'disabled' : ''} onclick="carregarUltimasMovimentacoes(${currentPage + 1})">
        Próximo <i class="fas fa-chevron-right"></i>
    </button>`);
    
    paginationContainer.innerHTML = buttons.join('');
}

// ===== EXCLUIR MOVIMENTAÇÃO =====
async function excluirMovimentacao(id) {
    if (!confirm('Tem certeza que deseja excluir esta movimentação?')) {
        return;
    }
    
    try {
        const response = await fetch(`/excluir_movimentacao/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            alert('Movimentação excluída com sucesso!');
            await carregarUltimasMovimentacoes(currentPage);
            await carregarEstatisticas();
            await carregarMovimentacoesRecentes();
        } else {
            alert('Erro: ' + data.message);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao excluir movimentação');
    }
}

// ===== FUNÇÕES DE MODAL =====
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// ===== TOGGLE CAMPOS =====
function toggleCampos() {
    const tipoMovimento = document.getElementById('tipo_movimento');
    const lojaGroup = document.querySelector('.form-group:has(#loja)');
    const valorGroup = document.querySelector('.form-group:has(#valor_unitario)');
    
    if (tipoMovimento && lojaGroup && valorGroup) {
        if (tipoMovimento.value === 'ENTRADA') {
            lojaGroup.style.display = 'block';
            valorGroup.style.display = 'block';
        } else {
            lojaGroup.style.display = 'none';
            valorGroup.style.display = 'none';
        }
    }
}

// ===== DOWNLOAD DE PLANILHA =====
function downloadPlanilha(tipo) {
    const urls = {
        'completo': '/download_estoque/movimentacoes',
        'resumo': '/download_estoque/produtos',
        'mensal': '/download_estoque/resumo'
    };
    
    if (urls[tipo]) {
        window.location.href = urls[tipo];
        closeModal('downloadModal');
    }
}