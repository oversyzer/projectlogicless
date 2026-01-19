// --- Lógica do Intersection Observer ---
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
        } else {
            entry.target.classList.remove('show');
        }
    });
});

const hiddenElements = document.querySelectorAll('.hidden');
hiddenElements.forEach((el) => observer.observe(el));

// --- Lógica do Menu Mobile Atualizada ---
const mobileMenu = document.getElementById('mobile-menu');
const navMenu = document.getElementById('nav-menu');

if (mobileMenu && navMenu) {
    mobileMenu.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
        navMenu.classList.toggle('active');
        // Adiciona/remove classe no body para unificar o blur
        document.body.classList.toggle('menu-open');
    });

    // Fecha o menu ao clicar em qualquer link
    document.querySelectorAll('#nav-menu a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.classList.remove('menu-open');
        });
    });
}
