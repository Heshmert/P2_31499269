document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('search-contact');
    if (!searchInput) return;
    searchInput.addEventListener('input', function () {
        const filter = searchInput.value.toLowerCase();
        document.querySelectorAll('.contact-row').forEach(row => {
            const name = row.querySelector('.contact-name').textContent.toLowerCase();
            const email = row.querySelector('.contact-email').textContent.toLowerCase();
            row.style.display = (name.includes(filter) || email.includes(filter)) ? '' : 'none';
        });
    });
});