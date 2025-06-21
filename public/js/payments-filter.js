document.addEventListener('DOMContentLoaded', function () {
    const serviceTypeFilter = document.getElementById('filter-service-type');
    const serviceFilter = document.getElementById('filter-service');
    const statusFilter = document.getElementById('filter-status');
    const dateFrom = document.getElementById('filter-date-from');
    const dateTo = document.getElementById('filter-date-to');

    function filterRows() {
        document.querySelectorAll('.payment-row').forEach(row => {
            const serviceType = row.querySelector('.payment-service-type')?.getAttribute('data-service-type') || '';
            const service = row.querySelector('.payment-service').textContent.toLowerCase();
            const status = row.querySelector('.payment-status').textContent.toLowerCase();
            const date = row.querySelector('.payment-date').textContent.trim();

            let show = true;

            // Filtro por tipo de servicio (ahora exacto)
            if (serviceTypeFilter && serviceTypeFilter.value && serviceType !== serviceTypeFilter.value) {
                show = false;
            }
            if (serviceFilter && serviceFilter.value && !service.includes(serviceFilter.value.toLowerCase())) {
                show = false;
            }
            if (statusFilter && statusFilter.value && status !== statusFilter.value.toLowerCase()) {
                show = false;
            }
            if (dateFrom && dateFrom.value && date) {
                if (date < dateFrom.value) show = false;
            }
            if (dateTo && dateTo.value && date) {
                if (date > dateTo.value) show = false;
            }

            row.style.display = show ? '' : 'none';
        });
    }

    [serviceTypeFilter, serviceFilter, statusFilter, dateFrom, dateTo].forEach(input => {
        if (input) input.addEventListener('input', filterRows);
    });
});