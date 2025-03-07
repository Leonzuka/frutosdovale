// Configurações globais do sistema
const SYSTEM_CONFIG = {
    dateFormat: 'DD/MM/YYYY',
    apiTimeout: 30000, // 30 segundos
    defaultLanguage: 'pt-BR'
};

// Funções utilitárias globais
function formatarData(data) {
    if (!data) return '';
    const date = new Date(data);
    return date.toLocaleDateString(SYSTEM_CONFIG.defaultLanguage);
}

function formatarNumero(numero, decimais = 2) {
    if (isNaN(numero)) return '0';
    return Number(numero).toLocaleString(SYSTEM_CONFIG.defaultLanguage, {
        minimumFractionDigits: decimais,
        maximumFractionDigits: decimais
    });
}

// Handlers de erro globais
window.addEventListener('error', function(e) {
    console.error('Erro global:', e.error);
    // Aqui você pode adicionar uma lógica de relatório de erros
});

// Funções de feedback para o usuário
function mostrarMensagem(mensagem, tipo = 'info') {
    // Implementar lógica de exibição de mensagens
    alert(mensagem); // Temporário - pode ser melhorado com uma solução mais elegante
}

// Funções de validação comuns
function validarFormulario(formulario) {
    const camposObrigatorios = formulario.querySelectorAll('[required]');
    let valido = true;

    camposObrigatorios.forEach(campo => {
        if (!campo.value.trim()) {
            campo.classList.add('campo-invalido');
            valido = false;
        } else {
            campo.classList.remove('campo-invalido');
        }
    });

    return valido;
}

// Inicialização global
document.addEventListener('DOMContentLoaded', () => {
    console.log('Sistema VINES iniciado');
    // Adicionar outras inicializações globais conforme necessário
});
