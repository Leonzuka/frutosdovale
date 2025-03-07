// Arquivo: theme.js

document.addEventListener('DOMContentLoaded', () => {
    // Verifica se há um tema salvo
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);

    // Adiciona o botão de tema em todas as páginas
    addThemeToggle();
});

function addThemeToggle() {
    const header = document.querySelector('.header-right');
    if (!header) return;

    const themeToggle = document.createElement('div');
    themeToggle.className = 'theme-toggle';
    themeToggle.innerHTML = `
        <button id="themeButton" class="theme-button">
            <i class="fas fa-sun light-icon"></i>
            <i class="fas fa-moon dark-icon"></i>
        </button>
    `;

    header.insertBefore(themeToggle, header.firstChild);

    document.getElementById('themeButton').addEventListener('click', toggleTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

function setTheme(theme) {
    // Remove classes existentes
    document.documentElement.classList.remove('theme-light', 'theme-dark');
    
    // Adiciona a nova classe
    document.documentElement.classList.add(`theme-${theme}`);
    
    // Define o atributo data-theme
    document.documentElement.setAttribute('data-theme', theme);
    
    // Salva no localStorage
    localStorage.setItem('theme', theme);
    
    // Atualiza o botão
    const themeButton = document.getElementById('themeButton');
    if (themeButton) {
        themeButton.classList.toggle('light-mode', theme === 'light');
        
        // Atualiza os ícones
        const sunIcon = themeButton.querySelector('.light-icon');
        const moonIcon = themeButton.querySelector('.dark-icon');
        
        if (theme === 'light') {
            sunIcon.style.display = 'inline-block';
            moonIcon.style.display = 'none';
        } else {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'inline-block';
        }
    }
    
    // Dispara um evento customizado para notificar outras partes da aplicação
    document.dispatchEvent(new CustomEvent('themeChanged', { detail: theme }));
}

window.mostrarEmailSuporte = function() {
    alert('Para suporte, entre em contato pelo email: leonardofeitosa789@gmail.com | Whatsapp: (11) 91125-8852');
}