// Criamos o "Observador" que vigia os elementos
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        console.log(entry) // Opcional: só pra ver no console se está funcionando
        
        // Se o elemento estiver visível na tela
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
        } else {
            // Se o elemento saiu da tela, remove a classe.
            // Isso permite que a animação aconteça novamente ao rolar para cima ou para baixo.
            entry.target.classList.remove('show'); 
        }
    });
});

// Selecionamos todos os elementos que possuem a classe 'hidden' no HTML
const hiddenElements = document.querySelectorAll('.hidden');

// Mandamos o observador vigiar cada um desses elementos
hiddenElements.forEach((el) => observer.observe(el));
