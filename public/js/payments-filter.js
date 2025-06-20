document.addEventListener('DOMContentLoaded', function () {
    const serviceFilter = document.getElementById('filter-service');
    const statusFilter = document.getElementById('filter-status');
    const dateFrom = document.getElementById('filter-date-from');
    const dateTo = document.getElementById('filter-date-to');

    function filterRows() {
        document.querySelectorAll('.payment-row').forEach(row => {
            const service = row.querySelector('.payment-service').textContent.toLowerCase();
            const status = row.querySelector('.payment-status').textContent.toLowerCase();
            const date = row.querySelector('.payment-date').textContent.trim(); // YYYY-MM-DD

            let show = true;

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

    [serviceFilter, statusFilter, dateFrom, dateTo].forEach(input => {
        if (input) input.addEventListener('input', filterRows);
    });
});