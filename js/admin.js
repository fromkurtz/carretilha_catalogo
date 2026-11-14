/* Página de administração. Não precisa editar. */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const CHAVE = "catalogo_admin_cofre";
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  let config = null; // { dono, repo, branch, token } só na memória enquanto a página está aberta
  let lista = [];
  let primeiroAcesso = false;
  let senhaSessao = null; // só na memória; usada para cifrar e abrir os links dos fornecedores

  $("loja-nome").textContent = LOJA.nome;

  /* ---------- Telas ---------- */
  function mostrar(id) {
    ["tela-entrada", "tela-painel", "tela-form"].forEach((t) => ($(t).hidden = t !== id));
  }

  function telaEntrada(novo) {
    primeiroAcesso = novo;
    $("campos-config").hidden = !novo;
    $("reconfigurar").hidden = novo;
    $("entrada-titulo").textContent = novo ? "Configurar acesso" : "Entrar";
    $("entrada-texto").textContent = novo
      ? "Faça isso uma vez por navegador. Escolha uma senha para proteger o token."
      : "Digite a senha de administrador.";
    $("rotulo-senha").textContent = novo ? "Crie uma senha (mínimo 12 caracteres)" : "Senha";
    $("senha").autocomplete = novo ? "new-password" : "current-password";
    $("entrada-erro").textContent = "";

    if (novo) {
      // Sugere usuário e repositório quando o site está no GitHub Pages
      const host = location.hostname;
      if (host.endsWith(".github.io")) {
        const segmento = location.pathname.split("/")[1];
        $("dono").value = host.split(".")[0];
        $("repo").value = segmento && !segmento.endsWith(".html") ? segmento : host;
      }
    }
    mostrar("tela-entrada");
  }

  /* ---------- Cofre: o token fica criptografado com a senha ---------- */
  const paraB64 = (bytes) => btoa(String.fromCharCode(...bytes));
  const deB64 = (texto) => Uint8Array.from(atob(texto), (c) => c.charCodeAt(0));

  async function derivarChave(senha, sal) {
    const base = await crypto.subtle.importKey("raw", enc.encode(senha), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: sal, iterations: 250000, hash: "SHA-256" },
      base,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  async function cifrar(senha, dados) {
    const sal = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const chave = await derivarChave(senha, sal);
    const cifrado = new Uint8Array(
      await crypto.subtle.encrypt({ name: "AES-GCM", iv }, chave, enc.encode(JSON.stringify(dados)))
    );
    return { sal: paraB64(sal), iv: paraB64(iv), dados: paraB64(cifrado) };
  }

  async function decifrar(senha, c) {
    const chave = await derivarChave(senha, deB64(c.sal));
    const claro = await crypto.subtle.decrypt({ name: "AES-GCM", iv: deB64(c.iv) }, chave, deB64(c.dados));
    return JSON.parse(dec.decode(claro));
  }

  async function guardar(senha, dados) {
    localStorage.setItem(CHAVE, JSON.stringify(await cifrar(senha, dados)));
  }

  function abrirCofre(senha) {
    return decifrar(senha, JSON.parse(localStorage.getItem(CHAVE)));
  }

  /* ---------- API do GitHub ---------- */
  async function gh(caminho, opcoes, texto) {
    const o = opcoes || {};
    let resposta;
    try {
      resposta = await fetch("https://api.github.com/repos/" + config.dono + "/" + config.repo + caminho, {
        method: o.method || "GET",
        body: o.body,
        headers: Object.assign(
          {
            Authorization: "Bearer " + config.token,
            Accept: texto ? "application/vnd.github.raw+json" : "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
          o.body ? { "Content-Type": "application/json" } : {}
        ),
      });
    } catch (e) {
      throw new Error("Sem conexão com o GitHub. Verifique a internet e tente de novo.");
    }
    if (!resposta.ok) {
      const erro = new Error(
        resposta.status === 401
          ? "Token inválido ou expirado."
          : resposta.status === 403 || resposta.status === 404
          ? "Repositório não encontrado ou sem permissão. Confira usuário, nome do repositório, branch e as permissões do token."
          : "O GitHub respondeu com erro " + resposta.status + "."
      );
      erro.status = resposta.status;
      throw erro;
    }
    return texto ? resposta.text() : resposta.json();
  }

  const enviar = (caminho, metodo, corpo) => gh(caminho, { method: metodo, body: JSON.stringify(corpo) });

  async function validar() {
    const info = await gh("");
    if (info.permissions && !info.permissions.push) {
      throw new Error("O token não tem permissão de escrita. Em Contents, escolha Read and write.");
    }
  }

  async function lerLista() {
    try {
      const texto = await gh("/contents/produtos.json?ref=" + encodeURIComponent(config.branch), {}, true);
      return JSON.parse(texto);
    } catch (e) {
      if (e.status === 404) return [];
      throw e;
    }
  }

  /* ---------- Entrada ---------- */
  $("form-entrada").addEventListener("submit", async (e) => {
    e.preventDefault();
    const botao = $("entrar");
    const senha = $("senha").value;
    $("entrada-erro").textContent = "";
    botao.disabled = true;
    try {
      if (primeiroAcesso) {
        if (senha.length < 12) throw new Error("Use uma senha com pelo menos 12 caracteres: ela também protege os links dos fornecedores.");
        const cfg = {
          dono: $("dono").value.trim(),
          repo: $("repo").value.trim(),
          branch: $("branch").value.trim() || "main",
          token: $("token").value.trim(),
        };
        if (!cfg.dono || !cfg.repo || !cfg.token) throw new Error("Preencha usuário, repositório e token.");
        config = cfg;
        await validar();
        await guardar(senha, cfg);
      } else {
        try {
          config = await abrirCofre(senha);
        } catch (erro) {
          throw new Error("Senha incorreta.");
        }
        await validar();
      }
      senhaSessao = senha;
      $("senha").value = "";
      $("token").value = "";
      await abrirPainel();
    } catch (erro) {
      config = null;
      $("entrada-erro").textContent = erro.message;
    } finally {
      botao.disabled = false;
    }
  });

  $("reconfigurar").addEventListener("click", () => {
    if (confirm("Isso apaga o token guardado neste navegador. Você precisará informá-lo de novo. Continuar?")) {
      localStorage.removeItem(CHAVE);
      telaEntrada(true);
    }
  });

  $("sair").addEventListener("click", () => {
    config = null;
    senhaSessao = null;
    lista = [];
    telaEntrada(false);
  });

  /* ---------- Painel ---------- */
  async function abrirPainel() {
    lista = await lerLista();
    const n = lista.length;
    $("painel-resumo").textContent =
      n === 0 ? "Nenhum produto cadastrado ainda." : n === 1 ? "1 produto no catálogo." : n + " produtos no catálogo.";
    const categorias = Array.from(new Set(lista.map((p) => p.categoria)));
    $("lista-categorias").replaceChildren(
      ...categorias.map((c) => {
        const o = document.createElement("option");
        o.value = c;
        return o;
      })
    );
    renderLista();
    mostrar("tela-painel");
  }

  function renderLista() {
    $("titulo-lista").hidden = lista.length === 0;
    $("lista-produtos").replaceChildren(
      ...lista
        .slice()
        .reverse()
        .map((p) => {
          const li = document.createElement("li");
          const titulo = document.createElement("span");
          titulo.textContent = "Item nº " + p.numero + " — " + p.nome;

          const acoes = document.createElement("div");
          acoes.className = "acoes-item";
          const botao = (texto, classe, aoClicar) => {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "botao botao-sec botao-pequeno " + classe;
            b.textContent = texto;
            b.addEventListener("click", () => aoClicar(b));
            return b;
          };
          acoes.append(
            botao("Editar", "", () => abrirFormulario(p)),
            botao("Excluir", "botao-perigo", () => excluir(p))
          );

          const saida = document.createElement("div");
          saida.className = "link-fornecedor";
          saida.hidden = true;

          if (p.linkFornecedor) {
            acoes.appendChild(
              botao("Ver link do fornecedor", "", async (b) => {
                if (!saida.hidden) {
                  saida.hidden = true;
                  b.textContent = "Ver link do fornecedor";
                  return;
                }
                b.disabled = true;
                saida.replaceChildren();
                try {
                  const url = await decifrar(senhaSessao, p.linkFornecedor);
                  const a = document.createElement("a");
                  a.href = /^https?:\/\//i.test(url) ? url : "#";
                  a.textContent = url;
                  a.target = "_blank";
                  a.rel = "noopener noreferrer";
                  saida.appendChild(a);
                  b.textContent = "Esconder link";
                } catch (erro) {
                  saida.textContent = "Não foi possível abrir este link com a senha atual.";
                  b.textContent = "Esconder";
                }
                saida.hidden = false;
                b.disabled = false;
              })
            );
          }

          li.append(titulo, acoes, saida);
          return li;
        })
    );
  }

  /* ---------- Formulário (novo produto ou edição) ---------- */
  let editando = null; // produto sendo editado (null = novo produto)
  let linkAtual = ""; // link salvo, já aberto com a senha
  let linkIlegivel = false; // true se o link salvo não abriu com a senha atual

  async function abrirFormulario(produto) {
    editando = produto || null;
    linkAtual = "";
    linkIlegivel = false;
    $("form-produto").reset();
    $("previa").replaceChildren();
    $("lista-fotos-atuais").replaceChildren();
    $("form-erro").textContent = "";
    $("form-status").textContent = "";
    $("form-titulo").textContent = produto ? "Editar item nº " + produto.numero : "Novo produto";
    $("publicar").textContent = produto ? "Salvar alterações" : "Publicar produto";
    $("rotulo-fotos").textContent = produto ? "Adicionar fotos" : "Fotos";
    $("fotos").required = !produto;
    $("fotos-atuais").hidden = !produto;

    if (produto) {
      $("nome").value = produto.nome;
      $("descricao").value = produto.descricao || "";
      $("categoria").value = produto.categoria;
      $("preco").value = String(produto.preco).replace(".", ",");
      produto.fotos.forEach((caminho) => {
        const rotulo = document.createElement("label");
        rotulo.className = "foto-atual";
        const img = document.createElement("img");
        img.alt = "";
        img.src = caminho;
        const marca = document.createElement("input");
        marca.type = "checkbox";
        marca.value = caminho;
        const texto = document.createElement("span");
        texto.textContent = "Remover";
        rotulo.append(img, marca, texto);
        $("lista-fotos-atuais").appendChild(rotulo);
      });
    }

    mostrar("tela-form");
    $("nome").focus();

    if (produto && produto.linkFornecedor) {
      try {
        linkAtual = await decifrar(senhaSessao, produto.linkFornecedor);
        $("link").value = linkAtual;
      } catch (erro) {
        linkIlegivel = true;
        $("link").placeholder = "Não foi possível abrir o link salvo; deixe em branco para mantê-lo";
      }
    }
  }

  $("abrir-form").addEventListener("click", () => abrirFormulario(null));
  $("cancelar").addEventListener("click", () => mostrar("tela-painel"));

  /* ---------- Novo produto ---------- */
  $("fotos").addEventListener("change", () => {
    const imagens = Array.from($("fotos").files)
      .slice(0, 8)
      .map((arquivo) => {
        const img = document.createElement("img");
        img.alt = "";
        img.src = URL.createObjectURL(arquivo);
        img.onload = () => URL.revokeObjectURL(img.src);
        return img;
      });
    $("previa").replaceChildren(...imagens);
  });

  function lerPreco(texto) {
    const t = texto.trim().replace(/^R\$\s*/, "");
    return parseFloat(t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t);
  }

  // Reduz a foto (máx. 1600 px) para o site carregar rápido
  function reduzir(arquivo) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(arquivo);
      const img = new Image();
      img.onload = () => {
        const escala = Math.min(1, 1600 / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("Não foi possível processar " + arquivo.name))),
          "image/jpeg",
          0.85
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Não foi possível abrir a imagem " + arquivo.name));
      };
      img.src = url;
    });
  }

  async function blobParaBase64(blob) {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let texto = "";
    for (let i = 0; i < bytes.length; i += 0x8000) {
      texto += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return btoa(texto);
  }

  // Faz um único commit: "alterar" muda a lista e diz quais fotos entram e saem
  async function commitar(alterar) {
    const ref = await gh("/git/ref/heads/" + encodeURIComponent(config.branch));
    const base = ref.object.sha;
    const commitBase = await gh("/git/commits/" + base);

    const atual = await lerLista();
    const r = await alterar(atual);
    const arquivos = r.arquivos || [];
    const remover = r.remover || [];

    const blobsFotos = await Promise.all(
      arquivos.map(async (a) =>
        enviar("/git/blobs", "POST", { content: await blobParaBase64(a.blob), encoding: "base64" })
      )
    );
    const blobJson = await enviar("/git/blobs", "POST", {
      content: JSON.stringify(atual, null, 2) + "\n",
      encoding: "utf-8",
    });

    const arvore = await enviar("/git/trees", "POST", {
      base_tree: commitBase.tree.sha,
      tree: arquivos
        .map((a, i) => ({ path: a.path, mode: "100644", type: "blob", sha: blobsFotos[i].sha }))
        .concat(remover.map((path) => ({ path: path, mode: "100644", type: "blob", sha: null })))
        .concat([{ path: "produtos.json", mode: "100644", type: "blob", sha: blobJson.sha }]),
    });
    const commit = await enviar("/git/commits", "POST", {
      message: r.mensagem,
      tree: arvore.sha,
      parents: [base],
    });
    await enviar("/git/refs/heads/" + encodeURIComponent(config.branch), "PATCH", { sha: commit.sha });
    return r.resultado;
  }

  const publicar = (dados, fotos) =>
    commitar(async (atual) => {
      const numero = atual.reduce((maior, p) => Math.max(maior, p.numero || 0), 0) + 1;
      const caminhos = fotos.map((_, i) => "img/item-" + numero + "/" + (i + 1) + ".jpg");
      const item = {
        id: "item-" + numero,
        numero: numero,
        nome: dados.nome,
        descricao: dados.descricao,
        categoria: dados.categoria,
        preco: dados.preco,
        fotos: caminhos,
      };
      // O link do fornecedor vai criptografado: no repositório público ninguém consegue ler
      if (dados.link) item.linkFornecedor = await cifrar(senhaSessao, dados.link);
      atual.push(item);
      return {
        mensagem: "Adiciona item " + numero + ": " + dados.nome,
        arquivos: caminhos.map((path, i) => ({ path: path, blob: fotos[i] })),
        resultado: "Produto publicado como item nº " + numero + ". O site atualiza em 1 a 2 minutos.",
      };
    });

  const salvarEdicao = (dados, fotos, removidas) =>
    commitar(async (atual) => {
      const p = atual.find((x) => x.id === editando.id);
      if (!p) throw new Error("Esse produto não existe mais. Volte ao painel e tente de novo.");

      p.nome = dados.nome;
      p.descricao = dados.descricao;
      p.categoria = dados.categoria;
      p.preco = dados.preco;

      const manter = linkIlegivel ? !dados.link : dados.link === linkAtual;
      if (!manter) {
        if (dados.link) p.linkFornecedor = await cifrar(senhaSessao, dados.link);
        else delete p.linkFornecedor;
      }

      const remover = p.fotos.filter((f) => removidas.has(f));
      const novos = fotos.map(
        (_, i) => "img/item-" + p.numero + "/" + Date.now().toString(36) + "-" + (i + 1) + ".jpg"
      );
      p.fotos = p.fotos.filter((f) => !removidas.has(f)).concat(novos);

      return {
        mensagem: "Edita item " + p.numero + ": " + p.nome,
        arquivos: novos.map((path, i) => ({ path: path, blob: fotos[i] })),
        remover: remover,
        resultado: "Item nº " + p.numero + " atualizado. O site atualiza em 1 a 2 minutos.",
      };
    });

  async function excluir(produto) {
    if (!confirm("Excluir o item nº " + produto.numero + " (" + produto.nome + ")? As fotos também serão removidas.")) return;
    $("painel-resumo").textContent = "Excluindo…";
    try {
      const aviso = await commitar(async (atual) => {
        const i = atual.findIndex((x) => x.id === produto.id);
        if (i < 0) throw new Error("Esse produto não existe mais.");
        const removido = atual.splice(i, 1)[0];
        return {
          mensagem: "Remove item " + removido.numero + ": " + removido.nome,
          remover: removido.fotos,
          resultado: "Item nº " + removido.numero + " excluído. O site atualiza em 1 a 2 minutos.",
        };
      });
      await abrirPainel();
      $("painel-resumo").textContent = aviso + " " + $("painel-resumo").textContent;
    } catch (err) {
      $("painel-resumo").textContent = err.message;
    }
  }

  $("form-produto").addEventListener("submit", async (e) => {
    e.preventDefault();
    const erro = $("form-erro");
    const status = $("form-status");
    const botao = $("publicar");
    erro.textContent = "";

    const dados = {
      nome: $("nome").value.trim(),
      descricao: $("descricao").value.trim(),
      categoria: $("categoria").value.trim(),
      preco: lerPreco($("preco").value),
      link: $("link").value.trim(),
    };
    const arquivos = Array.from($("fotos").files);
    const removidas = new Set(
      Array.from($("lista-fotos-atuais").querySelectorAll("input:checked")).map((c) => c.value)
    );
    const total = (editando ? editando.fotos.length - removidas.size : 0) + arquivos.length;

    if (!dados.nome || !dados.categoria) return void (erro.textContent = "Preencha título e categoria.");
    if (isNaN(dados.preco) || dados.preco < 0) return void (erro.textContent = "Informe um preço válido, como 89,90.");
    if (dados.link && !/^https?:\/\//i.test(dados.link)) return void (erro.textContent = "O link do fornecedor deve começar com http:// ou https://.");
    if (total < 1 || total > 8) return void (erro.textContent = "O produto precisa ter de 1 a 8 fotos no total.");

    botao.disabled = true;
    try {
      status.textContent = "Preparando as fotos…";
      const fotos = await Promise.all(arquivos.map(reduzir));
      status.textContent = "Publicando…";
      const aviso = editando ? await salvarEdicao(dados, fotos, removidas) : await publicar(dados, fotos);
      await abrirPainel();
      $("painel-resumo").textContent = aviso + " " + $("painel-resumo").textContent;
    } catch (err) {
      erro.textContent = err.message;
    } finally {
      status.textContent = "";
      botao.disabled = false;
    }
  });

  /* ---------- Início ---------- */
  if (!window.crypto || !crypto.subtle) {
    telaEntrada(true);
    $("entrada-erro").textContent = "Este navegador não permite criptografia aqui. Abra a página pelo link https do GitHub Pages.";
    $("entrar").disabled = true;
  } else {
    telaEntrada(!localStorage.getItem(CHAVE));
  }
})();