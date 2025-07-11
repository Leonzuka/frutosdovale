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

// ===== FUNÇÕES DE FILTRO =====
function filtrarProdutos() {
    const searchInput = document.getElementById('searchProduto');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const produtos = document.querySelectorAll('#listaProdutos .produto-item');

    produtos.forEach(produto => {
        const nome = produto.querySelector('span').textContent.toLowerCase();
        produto.style.display = nome.includes(searchTerm) ? 'flex' : 'none';
    });
}

// ===== TOGGLE DE CAMPOS =====
function toggleCampos() {
    const tipoMovimento = document.getElementById('tipo_movimento');
    if (!tipoMovimento) return;
    
    const lojaGroup = document.querySelector('.form-group:has(#loja)');
    const valorGroup = document.querySelector('.form-group:has(#valor_unitario)');
    const lojaInput = document.getElementById('loja');
    const valorInput = document.getElementById('valor_unitario');

    if (tipoMovimento.value === 'SAIDA') {
        if (lojaGroup) lojaGroup.style.display = 'none';
        if (valorGroup) valorGroup.style.display = 'none';
        if (lojaInput) lojaInput.removeAttribute('required');
        if (valorInput) valorInput.removeAttribute('required');
    } else {
        if (lojaGroup) lojaGroup.style.display = 'block';
        if (valorGroup) valorGroup.style.display = 'block';
        if (lojaInput) lojaInput.setAttribute('required', '');
        if (valorInput) valorInput.setAttribute('required', '');
    }
}

// ===== INICIALIZAÇÃO DA PÁGINA =====
function initializePage() {
    // Atualizar data e ano
    const dateDisplay = document.getElementById('current-date');
    const yearDisplay = document.getElementById('current-year');
    
    const currentDate = new Date();
    if (dateDisplay) dateDisplay.textContent = currentDate.toLocaleDateString('pt-BR');
    if (yearDisplay) yearDisplay.textContent = currentDate.getFullYear();

    // Adiciona listeners para os cards
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

// ===== CARREGAMENTO DE DADOS =====
async function carregarDados() {
    try {
        await Promise.all([
            carregarProdutos(),
            carregarLojas(),
            carregarFuncionarios(),
            carregarUltimasMovimentacoes(1)
        ]);
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
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
                        option.textContent = `${produto.nome} (${produto.tipo})`;
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
    
    // Adicionar listener para mudança de produto
    const produtoSelect = document.getElementById('produto');
    if (produtoSelect) {
        produtoSelect.addEventListener('change', mostrarClassificacaoProduto);
    }
}

// ===== MOSTRAR CLASSIFICAÇÃO DO PRODUTO =====
function mostrarClassificacaoProduto() {
    const produtoSelect = document.getElementById('produto');
    const classificacaoDiv = document.getElementById('classificacaoProduto');
    
    if (!produtoSelect || !classificacaoDiv) return;
    
    const selectedOption = produtoSelect.options[produtoSelect.selectedIndex];
    
    if (selectedOption && selectedOption.value) {
        const classificacao = selectedOption.dataset.classificacao;
        if (classificacao) {
            classificacaoDiv.style.display = 'block';
            classificacaoDiv.innerHTML = `
                <span class="classification-badge">
                    <i class="fas fa-tag"></i>
                    ${classificacao}
                </span>
            `;
        } else {
            classificacaoDiv.style.display = 'none';
        }
    } else {
        classificacaoDiv.style.display = 'none';
    }
}

// ===== MODAL FUNCTIONS =====
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
        console.error(`Modal com ID '${modalId}' não encontrado`);
        alert('Esta funcionalidade ainda não está disponível.');
        return;
    }
    
    modal.style.display = 'block';
    
    // Só chamar setupPaginationHandlers se o modal tiver paginação
    if (modalId === 'registroModal') {
        setTimeout(() => {
            setupPaginationHandlers();
        }, 100);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// ===== REGISTRAR MOVIMENTAÇÃO =====
async function registrarMovimentacao(formData) {
    try {
        // Se for saída, remove os campos de loja e valor unitário
        if (formData.get('tipo_movimento') === 'SAIDA') {
            formData.delete('loja_id');
            formData.delete('valor_unitario');
        }

        const response = await fetch('/registrar_estoque', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        
        if (data.status === 'success') {
            alert('Movimentação registrada com sucesso!');
            // Limpar formulário
            const form = document.getElementById('registroForm');
            if (form) form.reset();
            // Definir data atual novamente
            const dataInput = document.getElementById('data');
            if (dataInput) dataInput.valueAsDate = new Date();
            // Atualizar lista
            carregarUltimasMovimentacoes(1);
            // Limpar classificação
            const classificacaoDiv = document.getElementById('classificacaoProduto');
            if (classificacaoDiv) classificacaoDiv.style.display = 'none';
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
            const form = document.getElementById('addProdutoForm');
            if (form) form.reset();
            await carregarProdutos();
        } else {
            alert('Erro: ' + data.message);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao adicionar produto');
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
            const form = document.getElementById('addLojaForm');
            if (form) form.reset();
            await carregarLojas();
        } else {
            alert('Erro: ' + data.message);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao adicionar loja');
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
    buttons.push(`<button ${currentPage === 1 ? 'disabled' : ''} onclick="carregarUltimasMovimentacoes(${currentPage - 1})">❮</button>`);
    
    // Páginas
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            buttons.push(`<button onclick="carregarUltimasMovimentacoes(${i})" ${currentPage === i ? 'class="active"' : ''}>${i}</button>`);
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            buttons.push('<span>...</span>');
        }
    }
    
    // Botão Próxima
    buttons.push(`<button ${currentPage === totalPages ? 'disabled' : ''} onclick="carregarUltimasMovimentacoes(${currentPage + 1})">❯</button>`);
    
    paginationContainer.innerHTML = buttons.join('');
}

function setupPaginationHandlers() {
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    
    if (prevButton) {
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                carregarUltimasMovimentacoes(currentPage - 1);
            }
        });
    }
    
    if (nextButton) {
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                carregarUltimasMovimentacoes(currentPage + 1);
            }
        });
    }
}

// ===== EXCLUIR MOVIMENTAÇÃO =====
async function excluirMovimentacao(id) {
    if (!confirm('Tem certeza que deseja excluir este registro?')) {
        return;
    }

    try {
        const response = await fetch(`/excluir_movimentacao/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        
        if (data.status === 'success') {
            alert('Registro excluído com sucesso!');
            await carregarUltimasMovimentacoes(currentPage);
        } else {
            alert('Erro: ' + data.message);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao excluir registro');
    }
}

// ===== DOWNLOAD DE PLANILHAS =====
async function downloadPlanilha(tipo) {
    const loadingDiv = showLoading();
    
    try {
        const response = await fetch(`/download_estoque/${tipo}`);
        if (!response.ok) throw new Error('Erro ao gerar planilha');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `estoque_${tipo}_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        closeModal('downloadModal');
        
    } catch (error) {
        alert('Erro ao baixar planilha: ' + error.message);
    } finally {
        if (loadingDiv && loadingDiv.parentNode) {
            document.body.removeChild(loadingDiv);
        }
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

// ===== FUNÇÃO DE SUPORTE =====
function mostrarEmailSuporte() {
    alert('Para suporte, envie um email para: suporte@frutosdovale.com.br');
}