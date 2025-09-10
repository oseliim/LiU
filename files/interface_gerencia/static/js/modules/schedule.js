export function setupSchedule() {
    const scheduleForm = document.getElementById('scheduleForm');
    const frequencySelect = document.getElementById('frequency');
    const weeklyOptions = document.getElementById('weeklyOptions');
    const monthlyOptions = document.getElementById('monthlyOptions');

    if (frequencySelect) {
        frequencySelect.addEventListener('change', function() {
            const value = this.value;
            weeklyOptions.style.display = value === 'weekly' ? 'block' : 'none';
            monthlyOptions.style.display = value === 'monthly' ? 'block' : 'none';
        });
    }

    if (scheduleForm) {
        scheduleForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const frequency = document.getElementById('frequency').value;
            const scheduleTime = document.getElementById('scheduleTime').value;
            const labAction = document.getElementById('labAction').value;
            const feedbackDiv = document.getElementById('scheduleFeedback');
            if (!frequency || !scheduleTime || !labAction) {
                feedbackDiv.textContent = 'Por favor, preencha todos os campos obrigatórios.';
                return;
            }
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(scheduleTime)) {
                feedbackDiv.textContent = 'Horário deve estar no formato HH:MM (ex: 14:30).';
                return;
            }
            const [hour, minute] = scheduleTime.split(':');
            let cronExpression = '';
            switch (frequency) {
                case 'daily':
                    cronExpression = `${minute} ${hour} * * *`;
                    break;
                case 'weekly':
                    const dayOfWeek = document.getElementById('dayOfWeek').value;
                    cronExpression = `${minute} ${hour} * * ${dayOfWeek}`;
                    break;
                case 'monthly':
                    const dayOfMonth = document.getElementById('dayOfMonth').value;
                    if (!dayOfMonth || dayOfMonth < 1 || dayOfMonth > 31) {
                        feedbackDiv.textContent = 'Dia do mês deve ser entre 1 e 31.';
                        return;
                    }
                    cronExpression = `${minute} ${hour} ${dayOfMonth} * *`;
                    break;
                default:
                    feedbackDiv.textContent = 'Frequência inválida.';
                    return;
            }
            feedbackDiv.textContent = 'Agendando...';
            try {
                const response = await fetch('/schedule_lab_action', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: labAction, cron_expression: cronExpression })
                });
                const data = await response.json();
                if (response.ok && data.status === 'success') {
                    feedbackDiv.className = 'text-success';
                    feedbackDiv.textContent = data.message;
                    scheduleForm.reset();
                    weeklyOptions.style.display = 'none';
                    monthlyOptions.style.display = 'none';
                    setTimeout(() => {
                        const modal = bootstrap.Modal.getInstance(document.getElementById('scheduleModal'));
                        modal.hide();
                        feedbackDiv.className = 'text-danger';
                        feedbackDiv.textContent = '';
                    }, 2000);
                } else {
                    feedbackDiv.textContent = data.error || 'Erro ao agendar.';
                }
            } catch (error) {
                feedbackDiv.textContent = 'Erro de rede: ' + error.message;
            }
        });
    }
}

export function setupScheduleViewer() {
    const viewSchedulesBtn = document.getElementById('viewSchedulesBtn');
    let schedulesModal;
    async function loadSchedules() {
        const schedulesList = document.getElementById('schedulesList');
        schedulesList.innerHTML = '<p>Carregando agendamentos...</p>';
        try {
            const response = await fetch('/list_cron_jobs');
            const data = await response.json();
            if (data.status === 'success') {
                if (data.cron_jobs.length === 0) {
                    schedulesList.innerHTML = '<p>Nenhum agendamento encontrado.</p>';
                } else {
                    let html = '<div class="list-group">';
                    data.cron_jobs.forEach(job => {
                        const time = `${job.hour}:${job.minute}`;
                        let action = 'Ação Desconhecida';
                        let marker = '';
                        if (job.command.includes('desliga.sh')) { action = 'Desligamento de máquinas'; marker = '🔴'; }
                        else if (job.command.includes('liga.sh')) { action = 'Ligar máquinas'; marker = '🔵'; }
                        let scheduleDescription = '';
                        if (job.day === '*' && job.month === '*' && job.weekday === '*') {
                            scheduleDescription = `Todo dia às ${time}`;
                        } else if (job.weekday !== '*') {
                            const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                            const dayName = daysOfWeek[parseInt(job.weekday)] || job.weekday;
                            scheduleDescription = `Semanalmente às ${time} na ${dayName}`;
                        } else if (job.day !== '*') {
                            scheduleDescription = `Mensalmente às ${time} no dia ${job.day}`;
                        } else {
                            scheduleDescription = `Horário: ${time}`;
                        }
                        html += `
                        <div class="list-group-item d-flex justify-content-between align-items-start">
                            <div>
                                <h6 class="mb-1">${marker} ${action}</h6>
                                <p class="mb-1">${scheduleDescription}</p>
                                <small class="text-muted">Cron: ${job.minute} ${job.hour} ${job.day} ${job.month} ${job.weekday}</small>
                            </div>
                            <button class="btn btn-danger btn-sm remove-job-btn" data-command="${job.command.replace(/"/g, '"')}">Remover</button>
                        </div>`;
                    });
                    html += '</div>';
                    schedulesList.innerHTML = html;
                    document.querySelectorAll('.remove-job-btn').forEach(btn => {
                        btn.addEventListener('click', function() {
                            const command = this.getAttribute('data-command').replace(/"/g, '"');
                            removeCronJob(command);
                        });
                    });
                }
            } else {
                schedulesList.innerHTML = '<p class="text-danger">Erro ao carregar agendamentos.</p>';
            }
        } catch (error) {
            schedulesList.innerHTML = '<p class="text-danger">Erro de rede ao carregar agendamentos.</p>';
        }
    }
    async function removeCronJob(command) {
        if (!confirm('Tem certeza que deseja remover este agendamento?')) return;
        try {
            const response = await fetch('/remove_cron_job', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ command })
            });
            const data = await response.json();
            if (response.ok && data.status === 'success') {
                alert('Agendamento removido com sucesso!');
                await loadSchedules();
            } else {
                alert('Erro ao remover agendamento: ' + (data.error || 'Erro desconhecido'));
            }
        } catch (error) {
            alert('Erro de rede: ' + error.message);
        }
    }
    if (viewSchedulesBtn) {
        viewSchedulesBtn.addEventListener('click', async function() {
            schedulesModal = new bootstrap.Modal(document.getElementById('viewSchedulesModal'));
            schedulesModal.show();
            await loadSchedules();
        });
    }
}

