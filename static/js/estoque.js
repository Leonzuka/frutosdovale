document.addEventListener('DOMContentLoaded', () => {
    initializePage();
    carregarDados();
    setupFormHandlers();
    
    // Adicionar listener para pesquisa
    const searchInput = document.getElementById('searchProduto');
    if (searchInput) {
        searchInput.addEventListener('input', filtrarProdutos);
    }

    // Adicionar listener para tipo de movimento
    const tipoMovimento = document.getElementById('tipo_movimento');
    if (tipoMovimento) {
        tipoMovimento.addEventListener('change', toggleCampos);
    }
});
let currentPage = 1;
let totalPages = 1;
let maxPagesShow = 8;

function filtrarProdutos() {
    const searchTerm = document.getElementById('searchProduto').value.toLowerCase();
    const produtos = document.querySelectorAll('#listaProdutos .produto-item');

    produtos.forEach(produto => {
        const nome = produto.querySelector('span').textContent.toLowerCase();
        produto.style.display = nome.includes(searchTerm) ? 'flex' : 'none';
    });
}

function toggleCampos() {
    const tipoMovimento = document.getElementById('tipo_movimento').value;
    const lojaGroup = document.querySelector('.form-group:has(#loja)');
    const valorGroup = document.querySelector('.form-group:has(#valor_unitario)');

    if (tipoMovimento === 'SAIDA') {
        lojaGroup.style.display = 'none';
        valorGroup.style.display = 'none';
        document.getElementById('loja').removeAttribute('required');
        document.getElementById('valor_unitario').removeAttribute('required');
    } else {
        lojaGroup.style.display = 'block';
        valorGroup.style.display = 'block';
        document.getElementById('loja').setAttribute('required', '');
        document.getElementById('valor_unitario').setAttribute('required', '');
    }
}

function initializePage() {
    const dateDisplay = document.getElementById('current-date');
    const yearDisplay = document.getElementById('current-year');

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
    
    const currentDate = new Date();
    dateDisplay.textContent = currentDate.toLocaleDateString('pt-BR');
    yearDisplay.textContent = currentDate.getFullYear();

    // Define a data atual no campo de data
    document.getElementById('data').valueAsDate = new Date();
}

async function carregarDados() {
    await Promise.all([
        carregarProdutos(),
        carregarFuncionarios(),
        carregarLojas()
    ]);
}

async function carregarProdutos() {
    try {
        const response = await fetch('/get_produtos');
        const data = await response.json();
        
        if (data.status === 'success') {
            const selectProduto = document.getElementById('produto');
            selectProduto.innerHTML = '<option value="">Selecione um produto</option>';
            
            data.produtos.forEach(produto => {
                const option = document.createElement('option');
                option.value = produto.id;
                option.textContent = produto.nome;
                option.dataset.classificacao = produto.classificacao; // Adiciona a classificação
                selectProduto.appendChild(option);
            });

            atualizarListaProdutos(data.produtos);
        }
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
    }
}

document.getElementById('produto').addEventListener('change', function(e) {
    const select = e.target;
    const classificacaoDiv = document.getElementById('classificacaoProduto');
    
    if (select.value) {
        const option = select.options[select.selectedIndex];
        const produto = {
            nome: option.textContent,
            classificacao: option.dataset.classificacao
        };
        
        classificacaoDiv.textContent = `Classificação: ${produto.classificacao}`;
        classificacaoDiv.style.display = 'block';
    } else {
        classificacaoDiv.style.display = 'none';
    }
});

async function carregarFuncionarios() {
    try {
        const response = await fetch('/get_funcionarios');
        const data = await response.json();
        
        if (data.status === 'success') {
            const selectFuncionario = document.getElementById('funcionario');
            selectFuncionario.innerHTML = '<option value="">Selecione um funcionário</option>';
            
            data.funcionarios.forEach(funcionario => {
                const option = document.createElement('option');
                option.value = funcionario.id;
                option.textContent = funcionario.nome;
                selectFuncionario.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar funcionários:', error);
    }
}

async function carregarLojas() {
    try {
        const response = await fetch('/get_lojas');
        const data = await response.json();
        
        if (data.status === 'success') {
            // Atualizar select de lojas
            const selectLoja = document.getElementById('loja');
            if (selectLoja) {
                selectLoja.innerHTML = '<option value="">Selecione uma loja</option>';
                data.lojas.forEach(loja => {
                    const option = document.createElement('option');
                    option.value = loja.id;
                    option.textContent = loja.nome;
                    selectLoja.appendChild(option);
                });
            }

            // Atualizar lista de lojas para remoção
            const listaLojas = document.getElementById('listaLojas');
            if (listaLojas) {
                listaLojas.innerHTML = '';
                data.lojas.forEach(loja => {
                    const lojaDiv = document.createElement('div');
                    lojaDiv.className = 'produto-item';
                    lojaDiv.innerHTML = `
                        <span>${loja.nome}</span>
                        <button onclick="removerLoja(${loja.id})" class="delete-button">
                            <i class="fas fa-trash"></i>
                        </button>
                    `;
                    listaLojas.appendChild(lojaDiv);
                });
            }
        }
    } catch (error) {
        console.error('Erro ao carregar lojas:', error);
    }
}

function atualizarListaProdutos(produtos) {
    const listaProdutos = document.getElementById('listaProdutos');
    listaProdutos.innerHTML = '';

    produtos.forEach(produto => {
        const produtoDiv = document.createElement('div');
        produtoDiv.className = 'produto-item';
        produtoDiv.innerHTML = `
            <span>${produto.nome} (${produto.tipo}) - ${produto.classificacao}</span>
            <button onclick="removerProduto(${produto.id})" class="btn-remove">
                <i class="fas fa-trash"></i>
            </button>
        `;
        listaProdutos.appendChild(produtoDiv);
    });
}

function setupFormHandlers() {
    const registroForm = document.getElementById('registroForm');
    const addProdutoForm = document.getElementById('addProdutoForm');

    registroForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await registrarMovimentacao(new FormData(registroForm));
    });

    addProdutoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await adicionarProduto(new FormData(addProdutoForm));
    });
}

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
            // Apenas limpa o formulário sem fechar o modal
            document.getElementById('registroForm').reset();
            // Define a data atual novamente
            document.getElementById('data').valueAsDate = new Date();
            // Atualiza a lista de movimentações
            carregarUltimasMovimentacoes(1);
            // Limpa o display de classificação
            document.getElementById('classificacaoProduto').style.display = 'none';
        } else {
            alert('Erro: ' + data.message);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao registrar movimentação');
    }
}

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

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function atualizarListaLojas(lojas) {
    const listaLojas = document.getElementById('listaLojas');
    listaLojas.innerHTML = '';

    lojas.forEach(loja => {
        const lojaDiv = document.createElement('div');
        lojaDiv.className = 'item-lista';
        lojaDiv.innerHTML = `
            <span>${loja.nome}</span>
            <button onclick="removerLoja(${loja.id})" class="btn-remove">
                <i class="fas fa-trash"></i>
            </button>
        `;
        listaLojas.appendChild(lojaDiv);
    });
}

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

// Adicionar também a máscara para o telefone
document.addEventListener('DOMContentLoaded', function() {
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

// Funções para download de planilhas
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
        document.body.removeChild(loadingDiv);
    }
}

// Atualizar setupFormHandlers
function setupFormHandlers() {
    const registroForm = document.getElementById('registroForm');
    const addProdutoForm = document.getElementById('addProdutoForm');
    const addLojaForm = document.getElementById('addLojaForm');

    registroForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await registrarMovimentacao(new FormData(registroForm));
    });

    addProdutoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await adicionarProduto(new FormData(addProdutoForm));
    });

    addLojaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await adicionarLoja(new FormData(addLojaForm));
    });
}

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

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        if (modalId === 'registroModal') {
            carregarUltimasMovimentacoes();
            setupPaginationHandlers();
        }
    }
}

async function carregarUltimasMovimentacoes(page = 1) {
    try {
        const response = await fetch(`/get_ultimas_movimentacoes?page=${page}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            const movimentacoesList = document.getElementById('movimentacoes-list');
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

// Adicionar função para renderizar paginação
function renderizarPaginacao() {
    const paginationContainer = document.querySelector('.pagination');
    if (!paginationContainer) return;

    let buttons = [];
    
    // Botão Anterior
    buttons.push(`<button ${currentPage === 1 ? 'disabled' : ''} onclick="carregarUltimasMovimentacoes(${currentPage - 1})">❮</button>`);
    
    // Primeira página
    if (currentPage > maxPagesShow - 2) {
        buttons.push(`<button onclick="carregarUltimasMovimentacoes(1)">1</button>`);
        buttons.push('<span>...</span>');
    }
    
    // Páginas do meio
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
        buttons.push(`<button onclick="carregarUltimasMovimentacoes(${i})" ${currentPage === i ? 'class="active"' : ''}>${i}</button>`);
    }
    
    // Última página
    if (currentPage < totalPages - (maxPagesShow - 3)) {
        buttons.push('<span>...</span>');
        buttons.push(`<button onclick="carregarUltimasMovimentacoes(${totalPages})">${totalPages}</button>`);
    }
    
    // Botão Próxima
    buttons.push(`<button ${currentPage === totalPages ? 'disabled' : ''} onclick="carregarUltimasMovimentacoes(${currentPage + 1})">❯</button>`);
    
    paginationContainer.innerHTML = buttons.join('');
}

function setupPaginationHandlers() {
    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            carregarUltimasMovimentacoes(currentPage - 1);
        }
    });
    
    document.getElementById('next-page').addEventListener('click', () => {
        if (currentPage < totalPages) {
            carregarUltimasMovimentacoes(currentPage + 1);
        }
    });
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

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
            alert('Movimentação excluída com sucesso!');
            // Recarregar a lista de movimentações
            carregarUltimasMovimentacoes(currentPage);
        } else {
            alert('Erro: ' + data.message);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao excluir movimentação');
    }
}