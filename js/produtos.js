/* ==========================================================
   ESTE É O ÚNICO ARQUIVO QUE VOCÊ PRECISA EDITAR.

   1) Coloque as fotos na pasta "img" (pode criar uma subpasta por produto).
   2) Adicione ou altere os produtos na lista abaixo.

   Cada produto tem:
     id         -> texto único, sem espaços nem acentos (ex.: "bolsa-couro")
     nome       -> nome que aparece no catálogo
     categoria  -> produtos com a mesma categoria ficam no mesmo carrossel
     preco      -> número com ponto nos centavos (ex.: 149.9)
     fotos      -> lista de fotos; a primeira é a capa
   ========================================================== */

const LOJA = {
  nome: "Nome da sua loja",
  titulo: "Catálogo de produtos",
  subtitulo: "Veja os produtos disponíveis e toque em um para ver mais fotos.",
};

const PRODUTOS = [
  {
    id: "produto-1",
    nome: "Produto 1",
    categoria: "Categoria A",
    preco: 89.9,
    fotos: ["img/produto-1/1.jpg", "img/produto-1/2.jpg", "img/produto-1/3.jpg"],
  },
  {
    id: "produto-2",
    nome: "Produto 2",
    categoria: "Categoria A",
    preco: 129.0,
    fotos: ["img/produto-2/1.jpg", "img/produto-2/2.jpg"],
  },
  {
    id: "produto-3",
    nome: "Produto 3",
    categoria: "Categoria A",
    preco: 59.5,
    fotos: ["img/produto-3/1.jpg", "img/produto-3/2.jpg", "img/produto-3/3.jpg", "img/produto-3/4.jpg"],
  },
  {
    id: "produto-4",
    nome: "Produto 4",
    categoria: "Categoria A",
    preco: 199.9,
    fotos: ["img/produto-4/1.jpg", "img/produto-4/2.jpg"],
  },
  {
    id: "produto-5",
    nome: "Produto 5",
    categoria: "Categoria A",
    preco: 74.0,
    fotos: ["img/produto-5/1.jpg"],
  },
  {
    id: "produto-6",
    nome: "Produto 6",
    categoria: "Categoria B",
    preco: 249.0,
    fotos: ["img/produto-6/1.jpg", "img/produto-6/2.jpg", "img/produto-6/3.jpg"],
  },
  {
    id: "produto-7",
    nome: "Produto 7",
    categoria: "Categoria B",
    preco: 39.9,
    fotos: ["img/produto-7/1.jpg", "img/produto-7/2.jpg"],
  },
  {
    id: "produto-8",
    nome: "Produto 8",
    categoria: "Categoria B",
    preco: 159.9,
    fotos: ["img/produto-8/1.jpg", "img/produto-8/2.jpg", "img/produto-8/3.jpg"],
  },
];