const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            // Se entrou na tela, mostra
            entry.target.classList.add('show');
        } else {
            // Se saiu da tela, esconde (para animar de novo quando voltar)
            entry.target.classList.remove('show');
        }
    });
});

const hiddenElements = document.querySelectorAll('.hidden');
hiddenElements.forEach((el) => observer.observe(el));
