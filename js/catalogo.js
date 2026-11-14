/* Monta a página inicial. Não precisa editar. */
(function () {
  "use strict";

  document.title = LOJA.nome;
  document.getElementById("loja-nome").textContent = LOJA.nome;
  document.getElementById("loja-titulo").textContent = LOJA.titulo;
  document.getElementById("loja-subtitulo").textContent = LOJA.subtitulo;

  const raiz = document.getElementById("catalogo");
  raiz.textContent = "";

  // Agrupa os produtos por categoria, mantendo a ordem da lista
  const grupos = new Map();
  PRODUTOS.forEach((p) => {
    if (!grupos.has(p.categoria)) grupos.set(p.categoria, []);
    grupos.get(p.categoria).push(p);
  });

  let indice = 0;
  grupos.forEach((lista, categoria) => {
    raiz.appendChild(criarCategoria(categoria, lista, indice++));
  });

  function criarCartao(produto) {
    const item = el("li", "item");
    const link = el("a", "produto");
    link.href = "produto.html?id=" + encodeURIComponent(produto.id);

    const foto = el("div", "foto");
    const capa = produto.fotos && produto.fotos.length ? produto.fotos[0] : "";
    foto.appendChild(criarImagem(capa, ""));

    link.append(foto, el("h3", null, produto.nome), el("p", "preco", formatarPreco(produto.preco)));
    item.appendChild(link);
    return item;
  }

  function criarCategoria(nome, lista, i) {
    const secao = el("section", "categoria");
    const idTitulo = "categoria-" + i;
    secao.setAttribute("aria-labelledby", idTitulo);

    const topo = el("div", "categoria-topo");
    const titulo = el("h2", null, nome);
    titulo.id = idTitulo;

    const setas = el("div", "setas");
    const anterior = criarSeta("Ver produtos anteriores", ICONES.esquerda);
    const proximo = criarSeta("Ver mais produtos", ICONES.direita);
    setas.append(anterior, proximo);
    topo.append(titulo, setas);

    const trilho = el("ul", "trilho");
    lista.forEach((p) => trilho.appendChild(criarCartao(p)));

    const passo = () => trilho.clientWidth * 0.85;
    anterior.addEventListener("click", () =>
      trilho.scrollBy({ left: -passo(), behavior: comportamentoRolagem() })
    );
    proximo.addEventListener("click", () =>
      trilho.scrollBy({ left: passo(), behavior: comportamentoRolagem() })
    );

    function atualizarSetas() {
      const max = trilho.scrollWidth - trilho.clientWidth;
      setas.hidden = max <= 4; // sem sobra de produtos, não precisa de setas
      anterior.disabled = trilho.scrollLeft <= 4;
      proximo.disabled = trilho.scrollLeft >= max - 4;
    }

    trilho.addEventListener("scroll", atualizarSetas, { passive: true });
    window.addEventListener("resize", atualizarSetas);
    window.addEventListener("load", atualizarSetas);
    requestAnimationFrame(atualizarSetas);

    secao.append(topo, trilho);
    return secao;
  }
})();