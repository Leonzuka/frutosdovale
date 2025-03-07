document.addEventListener('DOMContentLoaded', () => {
    initializePage();
    loadFuncionarios();
    setupFormValidation();
    setupModalHandlers(); 
});

function initializePage() {
    // Atualiza a data e ano no cabeçalho e rodapé
    const dateDisplay = document.getElementById('current-date');
    const yearDisplay = document.getElementById('current-year');

    // Adiciona listeners para os cards
    const cards = document.querySelectorAll('.action-card');
    cards.forEach(card => {
        card.addEventListener('click', (e) => {
            // Se o clique não foi no botão, executa a ação do card
            if (!e.target.closest('.card-button')) {
                const modalId = card.id.replace('Card', 'Modal');
                showModal(modalId);
            }
        });
    });
    
    const currentDate = new Date();
    dateDisplay.textContent = currentDate.toLocaleDateString('pt-BR');
    yearDisplay.textContent = currentDate.getFullYear();

    // Adiciona máscara ao campo CPF
    const cpfInput = document.getElementById('cpf');
    if (cpfInput) {
        cpfInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 11) {
                value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
                e.target.value = value;
            }
        });
    }
}

async function loadFuncionarios() {
    try {
        const response = await fetch('/get_funcionarios');
        const data = await response.json();
        
        if (data.status === 'success') {
            // Preencher select de remoção
            const selectRemover = document.getElementById('funcionarioRemover');
            if (selectRemover) {
                selectRemover.innerHTML = '<option value="">Selecione um funcionário</option>';
                data.funcionarios.forEach(funcionario => {
                    const option = document.createElement('option');
                    option.value = funcionario.id;
                    option.textContent = funcionario.nome;
                    selectRemover.appendChild(option);
                });
            }

            // Preencher select de alteração
            const selectAlterar = document.getElementById('funcionarioAlterar');
            if (selectAlterar) {
                selectAlterar.innerHTML = '<option value="">Selecione um funcionário</option>';
                data.funcionarios.forEach(funcionario => {
                    const option = document.createElement('option');
                    option.value = funcionario.id;
                    option.textContent = funcionario.nome;
                    selectAlterar.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Erro ao carregar funcionários:', error);
    }
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        if (modalId === 'desativarModal') {
            carregarListaFuncionarios();
        } else if (modalId === 'alterarModal') {
            loadFuncionarios(); // Adiciona esta linha
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function setupFormValidation() {
    const cadastroForm = document.getElementById('cadastroForm');
    const removerForm = document.getElementById('removerForm');

    if (cadastroForm) {
        cadastroForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (validateForm(cadastroForm)) {
                await submitCadastro(cadastroForm);
            }
        });
    }

    if (removerForm) {
        removerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitRemocao(removerForm);
        });
    }
}

function validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            field.classList.add('invalid');
        } else {
            field.classList.remove('invalid');
        }
    });

    return isValid;
}

// Atualizar a função submitCadastro em funcionarios.js
async function submitCadastro(form) {
    try {
        const formData = new FormData(form);
        
        const response = await fetch('/cadastrar_funcionario', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.status === 'success') {
            alert('Funcionário cadastrado com sucesso!');
            form.reset();
            closeModal('cadastroModal');
            await loadFuncionarios();
        } else {
            alert('Erro ao cadastrar funcionário: ' + data.message);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao cadastrar funcionário');
    }
}

async function submitRemocao(form) {
    try {
        const funcionarioId = form.funcionario.value;
        
        if (!funcionarioId) {
            alert('Por favor, selecione um funcionário');
            return;
        }

        if (!confirm('Tem certeza que deseja remover este funcionário?')) {
            return;
        }

        const response = await fetch(`/remover_funcionario/${funcionarioId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.status === 'success') {
            alert('Funcionário removido com sucesso!');
            form.reset();
            closeModal('removerModal');
            await loadFuncionarios();
        } else {
            alert('Erro ao remover funcionário: ' + data.message);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao remover funcionário');
    }
}

function setupModalHandlers() {
    const searchInput = document.getElementById('searchFuncionario');
    if (searchInput) {
        searchInput.addEventListener('input', filtrarFuncionarios);
    }
}

async function carregarListaFuncionarios() {
    try {
        const response = await fetch('/get_funcionarios');
        const data = await response.json();
        
        if (data.status === 'success') {
            const listaFuncionarios = document.getElementById('listaFuncionarios');
            listaFuncionarios.innerHTML = '';
            
            data.funcionarios.forEach(funcionario => {
                const div = document.createElement('div');
                div.className = 'funcionario-item';
                div.innerHTML = `
                    <span>${funcionario.nome}</span>
                    <button onclick="desativarFuncionario(${funcionario.id})" class="btn-remove">
                        <i class="fas fa-user-slash"></i>
                    </button>
                `;
                listaFuncionarios.appendChild(div);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar lista de funcionários:', error);
    }
}

async function desativarFuncionario(id) {
    if (!confirm('Tem certeza que deseja desativar este funcionário?')) {
        return;
    }

    try {
        const response = await fetch(`/desativar_funcionario/${id}`, {
            method: 'PUT'
        });

        const data = await response.json();
        
        if (data.status === 'success') {
            alert('Funcionário desativado com sucesso!');
            await carregarListaFuncionarios();
            await loadFuncionarios();
        } else {
            alert('Erro: ' + data.message);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao desativar funcionário');
    }
}

function filtrarFuncionarios(e) {
    const searchTerm = e.target.value.toLowerCase();
    const funcionarios = document.querySelectorAll('.funcionario-item');
    
    funcionarios.forEach(funcionario => {
        const texto = funcionario.querySelector('span').textContent.toLowerCase();
        funcionario.style.display = texto.includes(searchTerm) ? 'flex' : 'none';
    });
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
        const response = await fetch(`/download_funcionarios/${tipo}`);
        if (!response.ok) throw new Error('Erro ao gerar planilha');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `funcionarios_${new Date().toISOString().split('T')[0]}.xlsx`;
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

document.getElementById('funcionarioAlterar')?.addEventListener('change', async function(e) {
    const funcionarioId = e.target.value;
    if (funcionarioId) {
        await carregarDadosFuncionario(funcionarioId);
    }
});

async function carregarDadosFuncionario(id) {
    try {
        const response = await fetch(`/get_funcionario/${id}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            const form = document.getElementById('alterarForm');
            form.style.display = 'block';
            
            // Preencher os campos com os dados do funcionário
            document.getElementById('nomeAlterar').value = data.funcionario.nome;
            document.getElementById('cpfAlterar').value = data.funcionario.cpf;
            document.getElementById('dataNascimentoAlterar').value = data.funcionario.data_nascimento;
            document.getElementById('sexoAlterar').value = data.funcionario.sexo;
            document.getElementById('funcaoAlterar').value = data.funcionario.funcao;
            document.getElementById('dataAdmissaoAlterar').value = data.funcionario.data_admissao;
            document.getElementById('ultimasFeriasAlterar').value = data.funcionario.ultimas_ferias;
            document.getElementById('tipoContratacaoAlterar').value = data.funcionario.tipo_contratacao;
            document.getElementById('pixAlterar').value = data.funcionario.pix;
            document.getElementById('enderecoAlterar').value = data.funcionario.endereco;
        }
    } catch (error) {
        console.error('Erro ao carregar dados do funcionário:', error);
        alert('Erro ao carregar dados do funcionário');
    }
}

// Adicionar handler para o formulário de alteração
document.getElementById('alterarForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const funcionarioId = document.getElementById('funcionarioAlterar').value;
    
    if (!funcionarioId) {
        alert('Por favor, selecione um funcionário');
        return;
    }

    const formData = new FormData(this);
    
    try {
        const response = await fetch(`/alterar_funcionario/${funcionarioId}`, {
            method: 'PUT',
            body: formData
        });

        const data = await response.json();
        
        if (data.status === 'success') {
            alert('Funcionário atualizado com sucesso!');
            closeModal('alterarModal');
            await loadFuncionarios(); // Recarrega a lista de funcionários
        } else {
            alert('Erro: ' + data.message);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao atualizar funcionário');
    }
});