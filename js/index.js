document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('leadForm');
    const inputs = form.querySelectorAll('input[required]');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const spinner = submitBtn.querySelector('.spinner');

    const telefoneInput = document.getElementById('telefone');
    telefoneInput.addEventListener('input', function (e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 11) {
            value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (value.length >= 7) {
            value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
        } else if (value.length >= 3) {
            value = value.replace(/(\d{2})(\d{0,5})/, '($1) $2');
        }
        e.target.value = value;
    });

    inputs.forEach(input => {
        input.addEventListener('input', function () {
            validateField(this);
        });

        input.addEventListener('blur', function () {
            validateField(this);
        });
    });

    function validateField(field) {
        const validIcon = field.parentNode.querySelector('.valid-icon');
        const invalidIcon = field.parentNode.querySelector('.invalid-icon');

        if (field.checkValidity() && field.value.trim() !== '') {
            field.classList.remove('invalid');
            field.classList.add('valid');
            validIcon.style.display = 'block';
            invalidIcon.style.display = 'none';
        } else {
            field.classList.remove('valid');
            field.classList.add('invalid');
            validIcon.style.display = 'none';
            invalidIcon.style.display = 'block';
        }
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault(); // Interceptar o envio

        const formData = new FormData(form);
        const nome = formData.get('nome');
        const telefone = formData.get('telefone');
        const email = formData.get('email');
        const interesse = formData.get('interesse');

        if (!nome || !telefone || !email) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        // Mostrar loading
        submitBtn.classList.add('loading');
        btnText.style.display = 'none';
        spinner.style.display = 'inline-block';

        // Salvar dados localmente como backup
        const dadosLead = {
            nome: nome,
            telefone: telefone.replace(/\D/g, ''),
            email: email,
            interesse: interesse || 'Nao informado',
            dataHora: new Date().toLocaleString('pt-BR'),
            origem: 'Landing Page Mérito Belenzinho'
        };

        // Salvar no localStorage
        const leads = JSON.parse(localStorage.getItem('leads') || '[]');
        leads.push(dadosLead);
        localStorage.setItem('leads', JSON.stringify(leads));
        
        // Salvar nome do último lead para mostrar no modal
        localStorage.setItem('ultimoLeadNome', nome);

        console.log('📊 Lead salvo localmente:', dadosLead);
        console.log('📧 Enviando via FormSubmit...');

        // Enviar via AJAX para FormSubmit
        enviarFormSubmitAJAX(formData);
    });

    async function enviarFormSubmitAJAX(formData) {
        try {
            console.log('📧 Enviando dados via AJAX para FormSubmit...');
            
            // Criar dados para envio
            const dadosEnvio = new FormData();
            dadosEnvio.append('nome', formData.get('nome'));
            dadosEnvio.append('telefone', formData.get('telefone'));
            dadosEnvio.append('email', formData.get('email'));
            dadosEnvio.append('interesse', formData.get('interesse') || 'Não informado');
            dadosEnvio.append('_subject', '🏠 Novo Lead - Mérito Belenzinho');
            dadosEnvio.append('_cc', 'ewertonalves725@gmail.com');
            dadosEnvio.append('_template', 'table');
            dadosEnvio.append('_captcha', 'false');
            dadosEnvio.append('_next', ''); // Vazio para evitar redirecionamento

            // Enviar via fetch
            const response = await fetch('https://formsubmit.co/alvesdesouzajoyce@gmail.com', {
                method: 'POST',
                body: dadosEnvio,
                mode: 'no-cors' // Necessário para evitar CORS
            });

            console.log('✅ Dados enviados para FormSubmit');
            
            // Mostrar modal de sucesso
            mostrarSucesso(formData.get('nome'));

        } catch (error) {
            console.error('❌ Erro ao enviar via FormSubmit:', error);
            
            // Mesmo com erro, mostrar sucesso pois dados foram salvos localmente
            mostrarSucesso(formData.get('nome'));
        } finally {
            // Resetar botão
            submitBtn.classList.remove('loading');
            btnText.style.display = 'inline-block';
            spinner.style.display = 'none';
        }
    }

    async function enviarFormSubmitComFallback(formData) {
        try {
            // Primeiro, tentar FormSubmit
            await enviarFormSubmit(formData);
        } catch (error) {
            console.error('❌ FormSubmit falhou, tentando método alternativo:', error);
            
            // Fallback: usar webhook público
            await enviarViaWebhook(formData);
        }
    }

    async function enviarViaWebhook(formData) {
        try {
            const dados = {
                nome: formData.get('nome'),
                telefone: formData.get('telefone'),
                email: formData.get('email'),
                interesse: formData.get('interesse') || 'Não informado',
                dataHora: new Date().toLocaleString('pt-BR'),
                origem: 'Landing Page Mérito Belenzinho'
            };

            // Usar webhook.site ou similar para teste
            const webhookUrl = 'https://webhook.site/your-unique-url'; // Substitua pela sua URL
            
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dados)
            });

            if (response.ok) {
                console.log('✅ Dados enviados via webhook');
                mostrarSucesso(formData.get('nome'));
            } else {
                throw new Error('Erro no webhook');
            }
        } catch (error) {
            console.error('❌ Webhook também falhou:', error);
            // Mesmo assim mostrar sucesso pois dados foram salvos localmente
            mostrarSucesso(formData.get('nome'));
        }
    }

    async function enviarFormSubmit(formData) {
        try {
            console.log('📧 Iniciando envio via FormSubmit...');
            console.log('📋 Dados do formulário:', {
                nome: formData.get('nome'),
                telefone: formData.get('telefone'),
                email: formData.get('email'),
                interesse: formData.get('interesse')
            });

            // Criar iframe oculto para enviar o formulário
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.name = 'formsubmit-iframe';
            iframe.id = 'formsubmit-iframe';
            document.body.appendChild(iframe);

            // Criar formulário temporário
            const tempForm = document.createElement('form');
            tempForm.action = 'https://formsubmit.co/alvesdesouzajoyce@gmail.com';
            tempForm.method = 'POST';
            tempForm.target = 'formsubmit-iframe';
            tempForm.style.display = 'none';

            // Adicionar campos do formulário original
            const campos = ['nome', 'telefone', 'email', 'interesse', '_subject', '_cc', '_template', '_captcha'];
            campos.forEach(campo => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = campo;
                input.value = formData.get(campo) || '';
                tempForm.appendChild(input);
            });

            // Adicionar campo _next vazio para evitar redirecionamento
            const nextInput = document.createElement('input');
            nextInput.type = 'hidden';
            nextInput.name = '_next';
            nextInput.value = '';
            tempForm.appendChild(nextInput);

            document.body.appendChild(tempForm);
            
            console.log('📤 Enviando formulário para FormSubmit...');
            tempForm.submit();

            // Aguardar um pouco e mostrar sucesso
            setTimeout(() => {
                console.log('✅ Formulário enviado via FormSubmit');
                mostrarSucesso(formData.get('nome'));
                
                // Limpar elementos temporários
                try {
                    if (document.body.contains(tempForm)) {
                        document.body.removeChild(tempForm);
                    }
                    if (document.body.contains(iframe)) {
                        document.body.removeChild(iframe);
                    }
                } catch (e) {
                    console.log('⚠️ Erro ao limpar elementos temporários:', e);
                }
            }, 3000);

        } catch (error) {
            console.error('❌ Erro ao enviar via FormSubmit:', error);
            // Mesmo com erro, mostrar sucesso pois os dados foram salvos localmente
            mostrarSucesso(formData.get('nome'));
        } finally {
            // Resetar botão
            submitBtn.classList.remove('loading');
            btnText.style.display = 'inline-block';
            spinner.style.display = 'none';
        }
    }

    async function enviarEmailLead(dadosLead, mensagem) {
        try {
            const assunto = `🏠 Novo Lead - Mérito Belenzinho - ${dadosLead.nome}`;
            const corpoEmail = `
🏠 NOVO LEAD CAPTADO - MÉRITO BELENZINHO

📋 DADOS DO INTERESSADO:
• Nome: ${dadosLead.nome}
• Telefone: ${dadosLead.telefone}
• Email: ${dadosLead.email}
• Interesse: ${dadosLead.interesse}

📅 INFORMAÇÕES DA CAPTAÇÃO:
• Data/Hora: ${dadosLead.dataHora}
• Origem: ${dadosLead.origem}

📝 INFORMAÇÕES SOLICITADAS:
• Planta do apartamento
• Tabela de preços
• Condições especiais

---
✅ Lead captado automaticamente pela landing page
📧 Responda diretamente para: ${dadosLead.email}
📱 Telefone: ${dadosLead.telefone}
        `;

            const mailtoLink = `mailto:alvesdesouzajoyce@gmail.com?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpoEmail)}`;

            window.open(mailtoLink, '_blank');

            mostrarSucesso(dadosLead.nome);

            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            leads.push(dadosLead);
            localStorage.setItem('leads', JSON.stringify(leads));

            console.log('📧 Cliente de email aberto com dados do lead');
            console.log('📊 Lead salvo localmente:', dadosLead);

        } catch (error) {
            console.error('❌ Erro ao enviar email:', error);

            mostrarSucesso(dadosLead.nome);

            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            leads.push(dadosLead);
            localStorage.setItem('leads', JSON.stringify(leads));

            console.log('💾 Dados salvos localmente para processamento posterior');
        }
    }

    function mostrarSucesso(nome) {

        form.reset();
        inputs.forEach(input => {
            input.classList.remove('valid', 'invalid');
            input.parentNode.querySelector('.valid-icon').style.display = 'none';
            input.parentNode.querySelector('.invalid-icon').style.display = 'none';
        });


        submitBtn.classList.remove('loading');
        btnText.style.display = 'inline';
        spinner.style.display = 'none';


        showSuccessMessage(nome);
    }


    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);


    document.querySelectorAll('.feature-card, .testimonial-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});


function updateBairro(nomeBairro) {
    document.getElementById('bairro').textContent = nomeBairro;
}


function updateWhatsAppNumber(novoNumero) {

    const linksWhatsApp = document.querySelectorAll('a[href*="wa.me"]');
    linksWhatsApp.forEach(link => {
        const urlAtual = link.href;
        const novaUrl = urlAtual.replace(/wa\.me\/\d+/, `wa.me/${novoNumero}`);
        link.href = novaUrl;
    });


    window.numeroWhatsApp = novoNumero;
}


function showSuccessMessage(nome) {
    const modal = document.getElementById('successModal');
    const successMessage = modal.querySelector('.success-message');


    successMessage.innerHTML = `
      Obrigado pelo seu interesse, <strong>${nome}</strong>! <br>
      Nossa equipe entrará em contato em até 10 minutos com todas as informações solicitadas.
    `;


    modal.classList.add('show');


    setTimeout(() => {
        closeSuccessModal();
    }, 10000);
}


function closeSuccessModal() {
    const modal = document.getElementById('successModal');
    modal.classList.remove('show');
}


document.addEventListener('click', function (e) {
    const modal = document.getElementById('successModal');
    if (e.target === modal) {
        closeSuccessModal();
    }
});


function startCountdown() {
    let hours = 23;
    let minutes = 59;
    let seconds = 59;

    const countdownInterval = setInterval(() => {
        seconds--;

        if (seconds < 0) {
            seconds = 59;
            minutes--;
        }

        if (minutes < 0) {
            minutes = 59;
            hours--;
        }

        if (hours < 0) {
            hours = 23;
            minutes = 59;
            seconds = 59;
        }

        document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
        document.getElementById('formCountdown').textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}


function animateNumbers() {
    const statNumbers = document.querySelectorAll('.stat-number');

    statNumbers.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-count'));
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            stat.textContent = Math.floor(current);
        }, 16);
    });
}


function simulateScarcity() {
    const remainingUnits = document.getElementById('remainingUnits');
    let units = 3;

    setInterval(() => {
        if (Math.random() < 0.1 && units > 1) {
            units--;
            remainingUnits.textContent = units;


            remainingUnits.style.transform = 'scale(1.3)';
            remainingUnits.style.color = '#dc2626';
            setTimeout(() => {
                remainingUnits.style.transform = 'scale(1)';
                remainingUnits.style.color = '';
            }, 300);
        }
    }, 30000);
}


document.addEventListener('DOMContentLoaded', function () {
    startCountdown();


    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateNumbers();
                observer.unobserve(entry.target);
            }
        });
    });

    const socialProofSection = document.querySelector('.social-proof-section');
    if (socialProofSection) {
        observer.observe(socialProofSection);
    }

    simulateScarcity();
});