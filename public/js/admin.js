document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('adminSidebar');
    const adminNav = document.getElementById('adminNav');
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);

    // Mostrar/ocultar sidebar en móvil
    function showSidebar() {
        sidebar.classList.add('show');
        overlay.classList.add('show');
    }
    function hideSidebar() {
        sidebar.classList.remove('show');
        overlay.classList.remove('show');
    }

    // Toggle con botón hamburguesa (opcional, si lo agregas)
    document.querySelector('.sidebar-toggler')?.addEventListener('click', showSidebar);

    overlay.addEventListener('click', hideSidebar);

    // Navegación entre secciones
    adminNav.addEventListener('click', (event) => {
        const link = event.target.closest('.nav-link');
        if (!link) return;

        // Solo interceptar si tiene data-target-section (es navegación interna)
        const sectionId = link.getAttribute('data-target-section');
        if (!sectionId) return; // Permite navegación normal para enlaces externos

        event.preventDefault();

        // Activar enlace
        adminNav.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
        link.classList.add('active');

        // Mostrar sección correspondiente
        document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
        document.getElementById(sectionId)?.classList.add('active');
    });

    // Cerrar sidebar al cambiar tamaño de pantalla
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 992) hideSidebar();
    });
});
