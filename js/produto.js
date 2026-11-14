/* Monta a página de um produto. Não precisa editar. */
(function () {
  "use strict";

  document.getElementById("loja-nome").textContent = LOJA.nome;

  // Se a pessoa veio do catálogo, "Voltar" usa o histórico do navegador
  document.getElementById("voltar").addEventListener("click", (e) => {
    if (history.length > 1 && document.referrer) {
      try {
        if (new URL(document.referrer).origin === location.origin) {
          e.preventDefault();
          history.back();
        }
      } catch (erro) {
        /* segue o link normal */
      }
    }
  });

  const raiz = document.getElementById("produto");
  raiz.textContent = "";

  const id = new URLSearchParams(location.search).get("id");
  const produto = PRODUTOS.find((p) => p.id === id);

  if (!produto) {
    document.title = "Produto não encontrado | " + LOJA.nome;
    const aviso = el("div", "aviso");
    aviso.append(
      el("h1", null, "Produto não encontrado"),
      el("p", null, "Esse link não leva a nenhum produto do catálogo. Volte e escolha outro.")
    );
    raiz.appendChild(aviso);
    return;
  }

  document.title = produto.nome + " | " + LOJA.nome;

  const fotos = produto.fotos && produto.fotos.length ? produto.fotos : [""];
  const layout = el("div", "produto-layout");

  /* ---------- Galeria ---------- */
  const galeria = el("div", "galeria");
  const palco = el("div", "palco");
  const slides = el("div", "slides");
  slides.tabIndex = 0;
  slides.setAttribute("role", "group");
  slides.setAttribute("aria-label", "Fotos de " + produto.nome);

  fotos.forEach((src, i) => {
    const quadro = el("figure", "slide");
    quadro.appendChild(
      criarImagem(src, produto.nome + ", foto " + (i + 1) + " de " + fotos.length, i === 0)
    );
    slides.appendChild(quadro);
  });
  palco.appendChild(slides);
  galeria.appendChild(palco);

  if (fotos.length > 1) {
    let atual = 0;
    const miniaturas = [];

    const anterior = criarSeta("Foto anterior", ICONES.esquerda);
    anterior.classList.add("seta-ant");
    const proxima = criarSeta("Próxima foto", ICONES.direita);
    proxima.classList.add("seta-prox");
    palco.append(anterior, proxima);

    const faixa = el("div", "miniaturas");
    fotos.forEach((src, i) => {
      const botao = el("button", "miniatura");
      botao.type = "button";
      botao.setAttribute("aria-label", "Ver foto " + (i + 1));
      botao.appendChild(criarImagem(src, ""));
      botao.addEventListener("click", () => irPara(i));
      miniaturas.push(botao);
      faixa.appendChild(botao);
    });
    galeria.appendChild(faixa);

    const irPara = (i) => {
      const alvo = Math.max(0, Math.min(fotos.length - 1, i));
      slides.scrollTo({ left: alvo * slides.clientWidth, behavior: comportamentoRolagem() });
    };

    const marcar = () => {
      miniaturas.forEach((botao, k) => {
        if (k === atual) botao.setAttribute("aria-current", "true");
        else botao.removeAttribute("aria-current");
      });
      anterior.disabled = atual === 0;
      proxima.disabled = atual === fotos.length - 1;
    };

    anterior.addEventListener("click", () => irPara(atual - 1));
    proxima.addEventListener("click", () => irPara(atual + 1));

    slides.addEventListener(
      "scroll",
      () => {
        const i = Math.round(slides.scrollLeft / slides.clientWidth);
        if (i !== atual) {
          atual = i;
          marcar();
        }
      },
      { passive: true }
    );

    marcar();
  }

  /* ---------- Nome e preço ---------- */
  const info = el("div", "info");
  info.append(el("h1", null, produto.nome), el("p", "preco", formatarPreco(produto.preco)));

  layout.append(galeria, info);
  raiz.appendChild(layout);
})();