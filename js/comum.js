/* Funções usadas pelas duas páginas. Não precisa editar. */

const formatadorPreco = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function formatarPreco(valor) {
  return formatadorPreco.format(valor);
}

/* Imagem cinza mostrada enquanto a foto real ainda não existe na pasta "img" */
const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">' +
      '<rect width="400" height="500" fill="#E3E7E4"/>' +
      '<g fill="none" stroke="#9AA59F" stroke-width="6" stroke-linejoin="round">' +
      '<rect x="130" y="210" width="140" height="100" rx="12"/>' +
      '<circle cx="200" cy="260" r="26"/></g></svg>'
  );

const ICONES = {
  esquerda:
    '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  direita:
    '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

function el(tag, classe, texto) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

function criarImagem(src, alt, prioridade) {
  const img = document.createElement("img");
  img.alt = alt;
  img.decoding = "async";
  img.loading = prioridade ? "eager" : "lazy";
  img.draggable = false;
  img.addEventListener(
    "error",
    () => {
      img.src = PLACEHOLDER;
    },
    { once: true }
  );
  img.src = src || PLACEHOLDER;
  return img;
}

function criarSeta(rotulo, icone) {
  const b = el("button", "seta");
  b.type = "button";
  b.setAttribute("aria-label", rotulo);
  b.innerHTML = icone;
  return b;
}

/* Respeita quem prefere menos animação */
function comportamentoRolagem() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}