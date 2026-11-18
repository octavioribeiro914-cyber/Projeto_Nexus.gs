/* ==========================================================================
   NEXUS — contato.js
   Validação do formulário de contato:
   - campos obrigatórios (nome, e-mail, assunto, mensagem)
   - formato do e-mail
   - tamanho mínimo/máximo
   - feedback visual por campo e mensagem de sucesso
   O envio é simulado (não há servidor).
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const successBox = document.getElementById("form-success");
  const successName = document.getElementById("success-name");
  const submitButton = form.querySelector("button[type='submit']");
  const messageField = document.getElementById("mensagem");
  const charCounter = document.getElementById("char-counter");
  const MAX_MESSAGE = 500;

  // Regras de cada campo: retorna a mensagem de erro ou "" se estiver ok
  const rules = {
    nome(value) {
      if (!value) return "Informe seu nome.";
      if (value.length < 3) return "O nome precisa ter pelo menos 3 letras.";
      if (!/^[A-Za-zÀ-ÿ\s'.-]+$/.test(value)) return "Use apenas letras no nome.";
      return "";
    },
    email(value) {
      if (!value) return "Informe seu e-mail.";
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!emailPattern.test(value)) return "Digite um e-mail válido, ex.: nome@dominio.com";
      return "";
    },
    assunto(value) {
      if (!value) return "Selecione um assunto.";
      return "";
    },
    mensagem(value) {
      if (!value) return "Escreva sua mensagem.";
      if (value.length < 10) return "A mensagem precisa ter pelo menos 10 caracteres.";
      if (value.length > MAX_MESSAGE) return `A mensagem pode ter no máximo ${MAX_MESSAGE} caracteres.`;
      return "";
    },
  };

  // Valida um campo, pinta a borda e mostra a mensagem abaixo dele
  function validateField(field) {
    const error = rules[field.name](field.value.trim());
    const errorEl = document.getElementById(`erro-${field.name}`);

    field.classList.toggle("is-invalid", Boolean(error));
    field.classList.toggle("is-valid", !error);
    field.setAttribute("aria-invalid", String(Boolean(error)));
    if (errorEl) errorEl.textContent = error;

    return !error;
  }

  const fields = Object.keys(rules).map((name) => form.elements[name]);

  // Valida ao sair do campo e, depois de errar, enquanto digita
  fields.forEach((field) => {
    field.addEventListener("blur", () => validateField(field));
    field.addEventListener("input", () => {
      if (field.classList.contains("is-invalid")) validateField(field);
      if (successBox) successBox.hidden = true;
    });
    field.addEventListener("change", () => validateField(field));
  });

  // Contador de caracteres da mensagem
  if (messageField && charCounter) {
    const updateCounter = () => {
      charCounter.textContent = `${messageField.value.length}/${MAX_MESSAGE}`;
    };
    messageField.addEventListener("input", updateCounter);
    updateCounter();
  }

  // Envio: só continua se todos os campos estiverem válidos
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const results = fields.map(validateField);
    const firstInvalid = fields.find((field, index) => !results[index]);

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    // Simulação de envio
    submitButton.disabled = true;
    submitButton.textContent = "Enviando...";

    setTimeout(() => {
      const firstName = form.elements.nome.value.trim().split(" ")[0];
      if (successName) successName.textContent = firstName;
      successBox.hidden = false;

      form.reset();
      fields.forEach((field) => field.classList.remove("is-valid"));
      if (charCounter) charCounter.textContent = `0/${MAX_MESSAGE}`;

      submitButton.disabled = false;
      submitButton.textContent = "Enviar mensagem";
      successBox.focus();
    }, 900);
  });
});
