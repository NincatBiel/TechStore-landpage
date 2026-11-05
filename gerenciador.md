# Gerenciador de Tarefas — Node.js + MySQL

**Material de apoio para os alunos** · HTML · CSS · JavaScript · Node.js (Express) · MySQL

Este material explica, arquivo por arquivo e função por função, como funciona o Gerenciador de Tarefas **com banco de dados MySQL**. Em cada trecho você vai encontrar:

- o **código**, com comentários;
- o **"Porquê usar"**, que explica a decisão por trás daquele trecho.

> Esta é a evolução da versão que guardava as tarefas em um arquivo `tasks.json`. A estrutura é a mesma (frontend + backend + API), mas agora os dados ficam em um banco de dados de verdade.

---

## Sumário

1. Porquê usar esta lógica
2. Estrutura do projeto
3. Como as partes se comunicam
4. O que mudou em relação à versão com `tasks.json`
5. FRONTEND — `index.html`, `style.css`, `script.js`
6. BACKEND — `db.js`, `server.js`
7. BANCO DE DADOS — `script.sql`
8. Como executar
9. Erros comuns
10. Melhorias para pensar
11. Glossário

---

## 1. Porquê usar esta lógica para o app de gerenciamento de tarefas?

**Separação de responsabilidades (Frontend/Backend):** o frontend (HTML, CSS e JavaScript rodando no navegador) cuida da apresentação e da interação com o usuário. O backend (Node.js + Express) cuida das regras e da comunicação com o banco de dados. Assim, cada parte pode ser alterada sem quebrar a outra. Por exemplo: dá para criar um app de celular que usa exatamente o mesmo backend.

**API RESTful:** o backend expõe uma API que usa os métodos HTTP padrão (`GET`, `POST`, `PUT`, `DELETE`) sobre o recurso `/tasks`. Isso deixa a comunicação previsível e fácil de ser usada por qualquer cliente.

**Persistência em banco de dados (MySQL):** na versão anterior, as tarefas eram gravadas em um arquivo JSON. Isso funciona para protótipos, mas o arquivo inteiro é lido e reescrito a cada operação, e duas requisições simultâneas podem se atrapalhar. Com o MySQL, os dados ficam organizados em tabelas, com tipos definidos, ids gerados automaticamente e acesso simultâneo tratado pelo próprio banco.

**Interatividade no frontend (JavaScript + Fetch):** o `fetch` permite enviar e receber dados do backend sem recarregar a página inteira, criando uma experiência mais fluida.

**Manipulação dinâmica do DOM:** o JavaScript altera a lista de tarefas diretamente no HTML (DOM), mostrando na hora o resultado das ações do usuário (adicionar, concluir, excluir).

**Consultas parametrizadas (segurança):** os comandos SQL usam `?` no lugar dos valores, que são enviados separadamente. Isso protege o sistema contra o ataque chamado *SQL Injection* (veja a seção 6).

**Simplicidade:** o código usa os conceitos fundamentais do desenvolvimento web (HTTP, JSON, DOM, eventos, SQL), sendo um bom ponto de partida para aprender uma aplicação *full-stack*.

**Em resumo:** a arquitetura demonstra o ciclo completo de uma aplicação web: o usuário interage com a página, o JavaScript chama a API, a API consulta o banco, e o resultado volta até a tela.

---

## 2. Estrutura do projeto

```text
projeto-gerenciador/
├── backend/
│   ├── server.js        ← servidor Express (rotas da API)
│   ├── db.js            ← conexão com o MySQL
│   └── package.json     ← criado pelo npm (lista de dependências)
├── database/
│   └── script.sql       ← cria o banco de dados e a tabela
└── frontend/
    ├── index.html
    ├── style.css
    └── script.js
```

**Observações:**

- O arquivo `tasks.json` **não é mais necessário**. Quem guarda os dados agora é o MySQL.
- A pasta `node_modules` vai aparecer dentro de `backend/` depois do `npm install`. Não edite nada dentro dela.

---

## 3. Como as partes se comunicam

```text
   NAVEGADOR (frontend)            SERVIDOR (backend)               BANCO DE DADOS
 ┌───────────────────────┐       ┌─────────────────────┐        ┌──────────────────┐
 │ index.html            │       │ server.js           │        │ MySQL            │
 │ style.css             │ ───►  │  rotas /tasks       │ ───►   │  tabela tasks    │
 │ script.js  (fetch)    │ HTTP  │ db.js (conexão)     │  SQL   │                  │
 │                       │ ◄───  │                     │ ◄───   │                  │
 └───────────────────────┘ JSON  └─────────────────────┘ dados  └──────────────────┘
```

### Quem faz o quê em cada ação (CRUD)

*CRUD* significa **C**reate (criar), **R**ead (ler), **U**pdate (atualizar) e **D**elete (excluir).

| Ação do usuário | Função no frontend | Requisição HTTP | Rota no backend | Comando SQL |
|---|---|---|---|---|
| Abrir a página | `loadTasks()` | `GET /tasks` | `app.get("/tasks")` | `SELECT * FROM tasks` |
| Adicionar tarefa | listener do `submit` | `POST /tasks` | `app.post("/tasks")` | `INSERT INTO tasks ...` |
| Marcar / desmarcar | `toggleComplete()` | `GET /tasks/:id` e depois `PUT /tasks/:id` | `app.get("/tasks/:id")` e `app.put("/tasks/:id")` | `SELECT ... WHERE id = ?` e `UPDATE ... WHERE id = ?` |
| Excluir tarefa | `deleteTask()` | `DELETE /tasks/:id` | `app.delete("/tasks/:id")` | `DELETE FROM tasks WHERE id = ?` |

### Passo a passo: o que acontece ao adicionar uma tarefa

1. O usuário preenche o formulário e clica em **Adicionar**. O navegador dispara o evento `submit`.
2. O `script.js` captura o evento e envia um `fetch` com método `POST`, levando `{ title, description }` em JSON.
3. O Express recebe a requisição e o middleware `express.json()` transforma o corpo em objeto (`req.body`).
4. A rota `POST /tasks` executa o `INSERT` no MySQL por meio do `db.js`.
5. O MySQL grava a linha, gera o `id` automaticamente e devolve esse número em `results.insertId`.
6. O servidor responde com status `201` e o JSON da nova tarefa.
7. O `script.js` recebe a resposta, limpa o formulário e chama `addTaskToUl(task)`, e a tarefa aparece na tela.

---

## 4. O que mudou em relação à versão com `tasks.json`

| Aspecto | Versão com JSON | Versão com MySQL (atual) |
|---|---|---|
| Onde os dados ficam | arquivo `tasks.json` | tabela `tasks` no MySQL |
| Como o backend acessa os dados | módulo `fs` (`readFileSync` / `writeFileSync`) | pacote `mysql2` (arquivo `db.js`) |
| Geração do `id` | `Date.now()` (feito no código) | `AUTO_INCREMENT` (feito pelo banco) |
| Buscar por id | `tasks.find(...)` | `SELECT ... WHERE id = ?` |
| Atualizar (`PUT`) | mescla o objeto antigo com o novo (`...spread`) | `UPDATE` substitui os 3 campos, então o frontend envia `title`, `description` e `completed` |
| Excluir | `tasks.filter(...)` | `DELETE ... WHERE id = ?` |
| Erros do servidor | apenas `404` | `500` (erro no banco) e `404` |
| Dependências do npm | `express`, `cors` | `express`, `cors`, **`mysql2`** |
| Exibição na tela | sempre `título - descrição` | **só o título** quando não há descrição |

---
## 5. FRONTEND

O frontend é tudo o que roda no navegador. Ele é formado por três arquivos que trabalham juntos:

| Arquivo | Papel |
|---|---|
| `index.html` | **Estrutura**: define o que existe na página |
| `style.css` | **Aparência**: cores, espaçamentos, fontes |
| `script.js` | **Comportamento**: reage aos cliques e conversa com o backend |

---

### 5.1 `FRONTEND/index.html`

Este arquivo define a estrutura da página que o usuário vê no navegador.

#### 1. Estrutura básica e `<head>`

```html
<!DOCTYPE html>
<html lang="pt-BR">

<head>
  <meta charset="UTF-8" />                                            <!-- Codificação UTF-8: aceita acentos e "ç" -->
  <meta name="description" content="Gerenciador para armazenar tarefas" />  <!-- Resumo da página (usado por buscadores) -->
  <meta name="keywords" content="Tarefas, Gerenciador, Lista de Tarefas" /> <!-- Palavras-chave -->
  <meta name="author" content="Leandro Ferreira" />                   <!-- Autor da página -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0" /> <!-- Adapta a página a telas de celular -->
  <title>Gerenciador de Tarefas</title>                               <!-- Título que aparece na aba do navegador -->
  <link rel="stylesheet" href="style.css" />                          <!-- Liga o arquivo CSS à página -->
</head>
```

**Porquê usar:**

- `<!DOCTYPE html>` avisa ao navegador que o documento usa HTML5.
- `lang="pt-BR"` informa o idioma da página. Ajuda leitores de tela, corretores ortográficos e tradutores automáticos.
- `charset="UTF-8"` garante que acentos e caracteres especiais apareçam corretamente.
- O `viewport` faz a página se ajustar à largura da tela do dispositivo. Sem ele, o celular mostra a página "encolhida".
- As metatags `description`, `keywords` e `author` não aparecem na tela, mas descrevem a página para buscadores e outras ferramentas.
- O `<link>` conecta o CSS. Sem ele, a página aparece sem estilo.

> **Atenção:** escreva `name="description"` (com **c**). Se você escrever `discription`, o navegador simplesmente ignora a tag e não avisa nenhum erro.

#### 2. Corpo da página (`<body>`)

```html
<body>
  <div class="container">                                    <!-- Caixa que agrupa e centraliza todo o conteúdo -->

    <h1>Gerenciador de Tarefas</h1>                          <!-- Título principal da página -->

    <form id="task-form">                                    <!-- Formulário para adicionar novas tarefas -->
      <input id="title" type="text" placeholder="Digite uma tarefa" required />   <!-- Título (obrigatório) -->
      <input id="description" type="text" placeholder="Descrição da tarefa" />    <!-- Descrição (opcional) -->
      <button type="submit">Adicionar</button>               <!-- Botão que envia o formulário -->
    </form>

    <ul id="task-list"></ul>                                 <!-- Lista vazia: o JavaScript preenche com as tarefas -->

  </div>
  <script src="script.js"></script>                          <!-- Liga o JavaScript (no final do body) -->
</body>

</html>
```

**Porquê usar:**

- A `<div class="container">` agrupa tudo em uma "caixa". Isso permite centralizar e estilizar o conteúdo como um cartão.
- Os **IDs** (`task-form`, `title`, `description`, `task-list`) são essenciais: é por eles que o JavaScript encontra e manipula os elementos.
- O atributo `required` no título impede o envio do formulário vazio (validação básica feita pelo navegador). A descrição **não** é obrigatória, por isso o JavaScript precisa lidar com tarefas sem descrição.
- O botão com `type="submit"` dispara o evento `submit` do formulário, e isso também acontece quando o usuário aperta **Enter** em um dos campos.
- A `<ul>` começa vazia porque as tarefas são criadas dinamicamente pelo JavaScript.
- O `<script>` fica no final do `<body>` para que o HTML seja carregado **antes** do JavaScript tentar acessar os elementos.

---

### 5.2 `FRONTEND/style.css`

Este arquivo contém as regras de estilo (CSS) que controlam a aparência dos elementos.

#### 1. Fonte e corpo da página

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Roboto:ital,wght@0,100..900;1,100..900&display=swap');

body {
  font-family: 'Roboto', sans-serif;   /* Usa Roboto; se não carregar, usa qualquer fonte sem serifa */
  background-color: #bebebe;           /* Cinza de fundo da página */
  padding: 20px;                       /* Espaço interno entre a borda e o conteúdo */
}
```

**Porquê usar:** o `@import` baixa fontes do Google Fonts (precisa ficar no **topo** do arquivo). O `sans-serif` depois da vírgula é a *fonte reserva*, usada se a Roboto não puder ser carregada. Repare que o código importa a fonte Inter, mas só a Roboto é usada. Remover a Inter deixaria o carregamento um pouco mais leve.

#### 2. Container (a "caixa" central)

```css
.container {
  max-width: 1200px;                          /* Largura máxima da caixa */
  margin: 40px auto;                          /* 40px em cima/embaixo; "auto" centraliza na horizontal */
  background-color: #e8e8e8;
  padding: 20px;
  border-radius: 8px;                         /* Cantos arredondados */
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);  /* Sombra suave: deslocamento X, Y, desfoque, cor */
  display: flex;                              /* Ativa o Flexbox */
  flex-direction: column;                     /* Organiza os filhos um embaixo do outro */
  justify-content: center;                    /* Centraliza no eixo vertical (principal) */
  align-items: center;                        /* Centraliza no eixo horizontal (cruzado) */
}
```

**Porquê usar:** o **Flexbox** é a forma moderna de alinhar elementos. Com `flex-direction: column`, o título, o formulário e a lista ficam empilhados e centralizados. O `rgba(0, 0, 0, 0.1)` é preto com 10% de opacidade: o último número é a transparência.

#### 3. Título, formulário e inputs (estilo geral)

```css
h1 {
  font-size: 3em;          /* 3 vezes o tamanho da fonte base */
}

form {
  margin-bottom: 20px;     /* Espaço entre o formulário e a lista */
}

input {
  margin-right: 10px;      /* Espaço entre um campo e o próximo */
  padding: 5px;
}
```

**Porquê usar:** regras gerais para todos os elementos daquele tipo. O `em` é uma unidade relativa, então `3em` significa "3 vezes o tamanho padrão do texto".

#### 4. Lista e itens (`ul` e `li`)

```css
/* DEIXAR UL, LI, COMPLETED POR ÚLTIMO */
ul {
  width: 530px;                 /* Largura fixa da lista */
  list-style-type: none;        /* Remove as bolinhas */
  padding: 0;                   /* Remove o recuo padrão do navegador */
}

li {
  background: white;
  margin: 5px 0;
  box-sizing: border-box;       /* O padding passa a ser contado dentro da largura */
  padding: 12px 14px;           /* 12px em cima/embaixo, 14px nas laterais */
  font-size: 16px;
  line-height: 1.3;             /* Altura da linha: 1.3x o tamanho da fonte */
  margin-bottom: 12px;          /* Sobrescreve apenas a margem de baixo definida acima */
  border-left: 5px solid #4caf50;  /* Faixa verde à esquerda de cada tarefa */
  border-radius: 8px;
  display: flex;
  justify-content: space-between;  /* Texto à esquerda e botões à direita */
  align-items: center;             /* Alinha texto e botões na vertical */
}
```

**Porquê usar:** cada tarefa vira um "cartão" branco com uma faixa verde. O `display: flex` com `justify-content: space-between` empurra o texto para a esquerda e os botões ✔️ 🗑️ para a direita. O `box-sizing: border-box` evita que o `padding` aumente a largura final do elemento. Note que `margin: 5px 0` é seguido por `margin-bottom: 12px`: como a segunda regra vem depois, ela vence apenas na margem de baixo.

> O comentário `DEIXAR UL, LI, COMPLETED POR ÚLTIMO` é uma convenção de organização do projeto. Quando duas regras têm a mesma força (especificidade), vence a que aparece **por último** no arquivo.

#### 5. Tarefa concluída

```css
.completed {
  text-decoration: line-through;   /* Texto riscado */
  opacity: 0.6;                    /* Deixa o item mais apagado */
}
```

**Porquê usar:** é a classe que o JavaScript adiciona ao `<li>` quando `task.completed` é verdadeiro. O estilo fica no CSS e a decisão de aplicá-lo fica no JavaScript, cada um cuidando do que sabe fazer.

#### 6. Inputs maiores e estado de foco

```css
/* Inputs maiores e mais confortáveis */
#task-form input {
  box-sizing: border-box;
  padding: 12px 14px;
  font-size: 16px;
  line-height: 1.3;
  margin-bottom: 12px;
  border: 1px solid #d6dbe6;
  border-radius: 8px;
  background: #fcfdff;
}

#task-form input[type='text']:focus {
  outline: none;                                   /* Remove o contorno padrão do navegador */
  border-color: #63c07a;                           /* Borda verde quando o campo está selecionado */
  box-shadow: 0 6px 18px rgba(99, 192, 122, 0.12); /* Brilho verde suave */
}
```

**Porquê usar:**

- O seletor `#task-form input` (ID + elemento) é **mais específico** que o simples `input`. Por isso o `padding: 12px 14px` vence o `padding: 5px` da regra geral.

  ```text
  input             → seletor de elemento  → especificidade baixa
  #task-form input  → ID + elemento        → especificidade alta (vence)
  ```

- `:focus` é uma *pseudo-classe*: aplica o estilo apenas enquanto o campo está selecionado.
- Ao remover o `outline`, é importante **substituir** por outro destaque visível (aqui, a borda verde e a sombra). Sem isso, quem navega pelo teclado não sabe em qual campo está.

#### 7. Botão com aparência moderna

```css
#task-form button {
  display: inline-block;
  padding: 12px 18px;
  font-size: 16px;
  font-weight: 600;                                          /* Texto semi-negrito */
  color: #fff;
  background: linear-gradient(90deg, #39a36b 0%, #2f8f5b 100%);  /* Degradê horizontal de verde claro para escuro */
  border: none;
  border-radius: 10px;
  cursor: pointer;                                           /* Mostra a "mãozinha" ao passar o mouse */
  box-shadow: 0 8px 20px rgba(47, 143, 91, 0.12);
}
```

**Porquê usar:** o `linear-gradient` cria o degradê (`90deg` = da esquerda para a direita). O `cursor: pointer` avisa visualmente que o elemento é clicável.

#### 8. Parte comentada (efeitos de hover e clique)

```css
/* PARTE COMENTADA
 #task-form button:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px rgba(47, 143, 91, 0.14);
    opacity: 0.98;
}

 #task-form button:active {
    transform: translateY(0);
    box-shadow: 0 6px 14px rgba(47, 143, 91, 0.10);
}

*/
```

**Porquê usar:** esse trecho está desativado (dentro de `/* ... */`). Se ativado, o botão **sobe 2px** quando o mouse passa por cima (`:hover`) e **volta** quando é clicado (`:active`). Para um movimento suave, seria preciso adicionar `transition: all 0.2s;` na regra do botão. Deixar código comentado é útil para testar variações, mas em projetos reais o ideal é apagá-lo quando não for mais necessário.

---

### 5.3 `FRONTEND/script.js`

Este arquivo contém a lógica do lado do cliente, escrita em JavaScript.

#### 1. Constantes e referências ao DOM

```javascript
const apiUrl = "http://localhost:3000/tasks";   // Endereço da API no backend

const form = document.getElementById("task-form");     // Referência ao <form>
const taskList = document.getElementById("task-list"); // Referência ao <ul>
```

**Porquê usar:** `apiUrl` centraliza o endereço do backend. Se ele mudar, você altera em um só lugar. As referências ao DOM (`form` e `taskList`) são guardadas em constantes para serem usadas várias vezes sem precisar procurar o elemento de novo.

#### 2. Listener do evento `submit` (adicionar tarefa)

```javascript
form.addEventListener('submit', async (e) => {
    e.preventDefault();   // Impede o comportamento padrão (recarregar a página)

    const title = document.getElementById("title").value;             // Texto do campo título
    const description = document.getElementById("description").value; // Texto do campo descrição ("" se vazio)

    try {
        // Envia uma requisição POST para criar a tarefa
        const res = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },   // Avisa que o corpo é JSON
            body: JSON.stringify({ title, description })        // Converte o objeto em texto JSON
        });

        if (!res.ok) throw new Error('Erro ao adicionar tarefa');  // Status fora de 200–299 vira erro

        const task = await res.json();   // Converte a resposta (a tarefa criada) em objeto JavaScript
        form.reset();                    // Limpa os campos
        addTaskToUl(task);               // Mostra a nova tarefa na lista
    } catch (err) {
        alert("Erro ao salvar tarefa: " + err.message);   // Avisa o usuário em caso de erro
    }
});
```

**Porquê usar:**

- O `addEventListener('submit', ...)` captura a tentativa de enviar o formulário.
- O `e.preventDefault()` é essencial: sem ele, o navegador recarregaria a página e a interação com o `fetch` seria perdida.
- O `fetch` é a API do navegador para fazer requisições HTTP. Com `async/await`, esperamos a resposta de forma fácil de ler, sem "pirâmides" de `.then()`.
- O cabeçalho `Content-Type: application/json` junto com `JSON.stringify` é o que permite ao `express.json()` do backend entender o corpo da requisição.
- O `res.ok` é `true` quando o status é de sucesso (200 a 299). Isso é necessário porque o `fetch` **não** lança erro para respostas como 404 ou 500, ele só falha quando há problema de rede.
- O `try...catch` captura os erros e mostra uma mensagem ao usuário.
- Se o usuário deixar a descrição em branco, o `value` do campo é uma **string vazia** (`""`), e é isso que vai para o backend.

#### 3. Função `addTaskToUl(task)` (mostrar só o título ou título + descrição)

```javascript
function addTaskToUl(task) {
    const li = document.createElement("li");                  // Cria um novo elemento <li>
    li.className = task.completed ? "completed" : "";         // Aplica a classe "completed" se estiver concluída

    // Limpa a descrição: se existir, remove espaços do começo e do fim; se não, usa texto vazio
    const description = task.description ? task.description.trim() : "";

    // Se há descrição → "Título - Descrição". Se não há → apenas "Título"
    const text = description ? `${task.title} - ${description}` : task.title;

    li.innerHTML = `
    <span>${text}</span>
    <div>
        <button onclick="toggleComplete(${task.id}, ${task.completed})">✔️</button>
        <button onclick="deleteTask(${task.id})">🗑️</button>
    </div>
    `;
    taskList.appendChild(li);                                 // Insere o <li> dentro da <ul>
}
```

**Porquê usar:** esta função cria a representação visual de uma tarefa. Ela manipula o DOM para adicionar elementos dinamicamente. A novidade desta versão é a regra de exibição:

| `title` | `description` recebida | Resultado na tela |
|---|---|---|
| `Estudar` | `"JavaScript"` | `Estudar - JavaScript` |
| `Estudar` | `""` (vazia) | `Estudar` |
| `Estudar` | `"   "` (só espaços) | `Estudar` |
| `Estudar` | `null` (sem valor no banco) | `Estudar` |

Como a lógica funciona, passo a passo:

1. `task.description ? task.description.trim() : ""` primeiro verifica se existe descrição. Isso é necessário porque a coluna `description` do banco aceita `NULL`, e chamar `.trim()` em `null` causaria um erro (`TypeError`). Se existir, o `trim()` remove espaços extras. Assim, uma descrição digitada só com espaços também é tratada como vazia.
2. Em JavaScript, uma string vazia (`""`) é considerada **falsa** em testes condicionais. Por isso `description ? A : B` escolhe `B` quando a descrição está vazia.
3. O operador `? :` (ternário) é um `if/else` em uma linha: `condição ? valorSeVerdadeiro : valorSeFalso`.
4. O hífen `-` só entra no texto quando há descrição, evitando o problema de aparecer `Estudar - ` sobrando.

Outros detalhes do código:

- O `onclick="..."` no HTML é uma forma simples de ligar os botões às funções, passando o `id` e o estado `completed`.
- O MySQL guarda `BOOLEAN` como número (`0` ou `1`). Por isso, as tarefas vindas do banco chegam com `completed: 0` ou `1`, enquanto a tarefa recém-criada chega com `false`. Nos dois casos o código funciona, porque `0` e `false` são "falsos" e `1` e `true` são "verdadeiros".

> **Atenção (segurança):** usar `innerHTML` com texto digitado pelo usuário permite que ele insira HTML ou scripts (ataque *XSS*). Veja a solução na seção 10.

#### 4. Função `loadTasks()`

```javascript
async function loadTasks() {
    try {
        const res = await fetch(apiUrl);                       // GET: busca todas as tarefas

        if (!res.ok) throw new Error("Erro ao carregar tarefas");

        const tasks = await res.json();                        // Converte o array JSON em array JavaScript

        taskList.innerHTML = "";                               // Limpa a lista atual
        tasks.forEach(addTaskToUl);                            // Adiciona cada tarefa na tela
    } catch (err) {
        alert("Erro ao carregar tarefas: " + err.message);
    }
}
```

**Porquê usar:** busca os dados do backend quando a página abre, e também é chamada para atualizar a lista depois de concluir ou excluir uma tarefa. O `taskList.innerHTML = ""` limpa a lista antes de redesenhá-la, para que as tarefas não apareçam duplicadas. O `forEach` percorre o array e chama `addTaskToUl` para cada tarefa.

#### 5. Função `toggleComplete(id, completed)`

```javascript
async function toggleComplete(id, completed) {
  try {
    // 1) Buscar a tarefa atual no backend
    const res = await fetch(`${apiUrl}/${id}`);
    const task = await res.json();

    // 2) Enviar os dados COMPLETOS no PUT, trocando só o "completed"
    console.log(`Toggling task ${id} to ${!completed}`);   // Mensagem de teste (veja no console, tecla F12)
    await fetch(`${apiUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: task.title,
        description: task.description,
        completed: !completed,       // O contrário do estado atual
      }),
    });
    loadTasks();                     // Recarrega a lista para refletir a mudança
  } catch (err) {
    alert('Erro ao atualizar tarefa: ' + err.message);
  }
}
```

**Porquê usar:** é chamada quando o botão ✔️ é clicado. A lógica `!completed` inverte o valor: `false` vira `true` e vice-versa (e `0` vira `true`, `1` vira `false`).

**Por que buscar a tarefa antes de atualizar?** No backend, a rota `PUT` executa:

```sql
UPDATE tasks SET title = ?, description = ?, completed = ? WHERE id = ?
```

Ou seja, o `UPDATE` **substitui os três campos de uma vez**. Se o frontend enviasse apenas `{ completed: true }`, o título e a descrição chegariam vazios ao banco, e como `title` é `NOT NULL`, daria erro. Por isso o código primeiro faz um `GET` para obter o título e a descrição atuais, e depois reenvia tudo junto com o novo `completed`.

> **Diferença para a versão com JSON:** lá, o backend juntava o objeto antigo com o novo usando o *spread* (`...`), e bastava enviar `{ completed: !completed }`. Aqui, essa responsabilidade passou para o frontend.

O `console.log` é uma linha de depuração: ajuda a ver no console do navegador (F12) o que está acontecendo. Pode ser removida quando não for mais necessária. Chamar `loadTasks()` no final é uma estratégia simples para manter a tela sincronizada com o banco. Não é a mais eficiente (poderíamos atualizar apenas o item), mas é fácil de entender.

#### 6. Função `deleteTask(id)`

```javascript
async function deleteTask(id) {
    try {
        await fetch(`${apiUrl}/${id}`, {
            method: 'DELETE'          // Pede ao backend para excluir a tarefa com esse id
        });
        loadTasks();                  // Recarrega a lista sem a tarefa excluída
    } catch (err) {
        alert("Erro ao excluir tarefa: " + err.message);
    }
}
```

**Porquê usar:** chamada quando o botão 🗑️ é clicado. O `id` vai na própria URL (`/tasks/15`, por exemplo), e o método `DELETE` indica a intenção. Assim como em `toggleComplete`, o `loadTasks()` atualiza a tela.

#### 7. Chamada inicial

```javascript
loadTasks();   // Carrega as tarefas assim que o script é executado
```

**Porquê usar:** garante que, ao abrir a página, as tarefas que já estão no MySQL sejam buscadas e exibidas. É por isso que, ao recarregar a página (F5), as tarefas continuam lá: elas estão no banco, não no navegador.

---
## 6. BACKEND

O backend é o programa que roda no computador servidor (no nosso caso, o seu próprio computador). Ele recebe as requisições do frontend, conversa com o banco de dados e devolve as respostas em JSON. É formado por dois arquivos:

| Arquivo | Papel |
|---|---|
| `db.js` | Cria a **conexão com o MySQL** |
| `server.js` | Cria o **servidor Express** e define as **rotas da API** |

---

### 6.1 `BACKEND/db.js`

Este arquivo é responsável apenas por conectar o Node.js ao banco de dados MySQL.

#### 1. Importação do módulo

```javascript
const mysql = require("mysql2");   // Biblioteca que permite o Node.js conversar com o MySQL
```

**Porquê usar:** o Node.js não sabe falar com o MySQL sozinho. O pacote `mysql2` faz essa "tradução". Ele precisa ser instalado com `npm install mysql2`. Usamos `mysql2` (e não o antigo `mysql`) porque ele é mais moderno, mais rápido e compatível com as versões atuais do MySQL.

#### 2. Configuração da conexão

```javascript
const connection = mysql.createConnection({
    host: "localhost",     // Onde o MySQL está rodando (neste computador)
    user: "root",          // Usuário do MySQL
    password: "123456",    // Senha do usuário (use a SUA senha)
    database: "db_tasks",  // Nome do banco de dados (precisa ser igual ao do script SQL)
});
```

**Porquê usar:** esses quatro dados são o "endereço e a chave" para entrar no banco:

| Campo | O que significa |
|---|---|
| `host` | Endereço do servidor do banco. `localhost` quer dizer "este mesmo computador" |
| `user` | Usuário cadastrado no MySQL |
| `password` | Senha desse usuário |
| `database` | Qual banco usar dentro do MySQL |

> **Atenção:** o nome em `database` **precisa ser exatamente igual** ao nome criado no script SQL (`db_tasks`). Se forem diferentes, aparece o erro `Unknown database`.
>
> Outro cuidado: guardar a senha direto no código serve apenas para estudo. Em projetos reais usam-se variáveis de ambiente (arquivo `.env`), e esse arquivo nunca vai para o GitHub.

#### 3. Conectando de fato

```javascript
connection.connect((err) => {
    if (err) throw err;                                   // Se falhar, interrompe a aplicação mostrando o erro
    console.log("Conectado ao banco de dados MySql!");    // Se der certo, avisa no terminal
});
```

**Porquê usar:** o `createConnection` só prepara os dados; é o `connect` que abre a conexão. O parâmetro `err` recebe o erro caso algo dê errado (MySQL desligado, senha errada, banco inexistente). Essa forma de escrever, passando uma função que será chamada quando a operação terminar, se chama **callback**. Mostrar a mensagem no terminal ajuda a saber rapidamente se a conexão funcionou.

#### 4. Exportação

```javascript
module.exports = connection;   // Deixa a conexão disponível para outros arquivos
```

**Porquê usar:** no `server.js`, a linha `const db = require('./db')` recebe exatamente esse objeto `connection`. Separar a conexão em um arquivo próprio deixa o `server.js` mais limpo e permite reaproveitar a mesma conexão em vários lugares.

---

### 6.2 `BACKEND/server.js`

Este arquivo cria o servidor web que serve como API do gerenciador de tarefas.

#### 1. Importações de módulos

```javascript
const express = require('express');   // Framework para criar o servidor e as rotas
const cors = require('cors');         // Permite que o frontend (outra origem) acesse esta API

const app = express();                // Cria a aplicação Express
const db = require('./db');           // Importa a conexão com o MySQL (arquivo db.js)

const PORT = 3000;                    // Porta onde o servidor vai "escutar"
```

**Porquê usar:**

- O **Express** é o framework padrão do mercado para criar APIs em Node.js, por ser simples e ter um ecossistema grande.
- O **CORS** (*Cross-Origin Resource Sharing*) é uma regra de segurança dos navegadores: por padrão, uma página só pode chamar o servidor de onde veio. Como o frontend abre em uma origem (por exemplo, `file://` ou outra porta) e a API em `localhost:3000`, precisamos do `cors` para liberar essa comunicação.
- O `./db` (com `./`) indica que é um arquivo **nosso**, na mesma pasta. Sem `./`, o Node procuraria um pacote instalado.
- Diferente da versão com JSON, **não usamos mais o módulo `fs`**, porque quem lê e grava os dados agora é o MySQL.
- A `PORT` fica em uma constante para ser fácil de alterar. Lembre que o `apiUrl` do frontend usa essa mesma porta.

#### 2. Middlewares

```javascript
app.use(cors());           // Libera o acesso do frontend à API
app.use(express.json());   // Converte o JSON recebido no corpo da requisição em objeto (req.body)
```

**Porquê usar:** *middleware* é uma função que **fica no meio do caminho**: toda requisição passa por ela antes de chegar na rota. O `cors()` adiciona os cabeçalhos que liberam o acesso. O `express.json()` é necessário porque o frontend envia título e descrição em JSON, e sem ele o `req.body` chegaria vazio. Os middlewares devem ser declarados **antes** das rotas.

#### 3. Como funciona o `db.query`

Todas as rotas abaixo usam o mesmo formato:

```javascript
db.query("COMANDO SQL", [valores], (err, results) => {
    // err      → o erro, se algo deu errado (senão fica vazio)
    // results  → o resultado do comando
});
```

O que vem em `results` depende do comando:

| Comando | O que `results` contém |
|---|---|
| `SELECT` | Um **array** com as linhas encontradas (pode ser vazio) |
| `INSERT` | Um objeto com `insertId` (o id gerado pelo banco) |
| `UPDATE` / `DELETE` | Um objeto com `affectedRows` (quantas linhas foram afetadas) |

**Os `?` (placeholders) e a segurança.** Em vez de montar o comando juntando textos, usamos `?` e passamos os valores em um array separado. O `mysql2` cuida de inserir cada valor de forma segura.

```javascript
// ❌ PERIGOSO: nunca monte SQL juntando texto vindo do usuário
db.query("DELETE FROM tasks WHERE id = " + req.params.id, ...);
// Se alguém enviar o id "1 OR 1=1", o comando vira
//   DELETE FROM tasks WHERE id = 1 OR 1=1   → apaga TODAS as tarefas!

// ✅ CORRETO: use ? e envie os valores separados
db.query("DELETE FROM tasks WHERE id = ?", [req.params.id], ...);
```

Esse ataque se chama **SQL Injection**, e usar `?` é a principal defesa contra ele.

#### 4. Rotas da API (endpoints)

##### `GET /tasks` — listar todas as tarefas

```javascript
app.get("/tasks", (req, res) => {
    db.query("SELECT * FROM tasks", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });  // Erro no banco → status 500
        res.json(results);                                             // Envia o array de tarefas em JSON
    });
});
```

**Porquê usar:** o método `GET` é o padrão para buscar dados. `SELECT * FROM tasks` traz todas as linhas e colunas da tabela. O `req` representa a requisição que chegou e o `res` é a resposta que vamos enviar. Nesta rota não há valores para passar, então não precisa do array.

O `return` antes do `res.status(500)...` é importante: ele **encerra a função** ali. Sem o `return`, o código continuaria e tentaria enviar uma segunda resposta, causando outro erro.

##### `GET /tasks/:id` — buscar uma tarefa específica

```javascript
app.get("/tasks/:id", (req, res) => {
    db.query("SELECT * FROM tasks WHERE id = ?", [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: "Tarefa não encontrada" });
        res.json(results[0]);   // O SELECT sempre devolve array; pegamos o primeiro (e único) item
    });
});
```

**Porquê usar:** o `:id` é um **parâmetro de rota**: se o frontend chamar `/tasks/15`, o valor `15` fica em `req.params.id`. O `WHERE id = ?` filtra a linha desejada. Se `results.length === 0`, nenhuma tarefa tem esse id, e a resposta correta é o status **404 (Not Found)**. O `toggleComplete` do frontend usa esta rota para buscar o título e a descrição atuais antes de atualizar.

##### `POST /tasks` — criar uma tarefa

```javascript
app.post("/tasks", (req, res) => {
    const { title, description } = req.body;   // Extrai título e descrição do corpo da requisição
    db.query("INSERT INTO tasks (title, description) VALUES (?, ?)", [title, description],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: results.insertId, title, description, completed: false });
        }
    );
});
```

**Porquê usar:** o método `POST` é o padrão para criar recursos.

- `const { title, description } = req.body` é a *desestruturação*: uma forma curta de escrever `const title = req.body.title; const description = req.body.description;`.
- Os dois `?` são preenchidos, na ordem, pelos valores do array `[title, description]`.
- Não enviamos o `id` nem o `completed`: o banco gera o `id` sozinho (`AUTO_INCREMENT`) e usa `FALSE` como padrão em `completed`.
- O `results.insertId` traz o id que o banco acabou de gerar. Com ele, montamos a resposta completa, que o frontend usa para desenhar a nova tarefa na tela.
- O status **201 (Created)** indica que algo novo foi criado com sucesso.

##### `PUT /tasks/:id` — atualizar uma tarefa

```javascript
app.put("/tasks/:id", (req, res) => {
    const { title, description, completed } = req.body;
    db.query("UPDATE tasks SET title = ?, description = ?, completed = ? WHERE id = ?",
        [title, description, completed, req.params.id], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.affectedRows === 0) return res.status(404).json({ error: "Tarefa não encontrada" });
            res.json({ id: req.params.id, title, description, completed });
        }
    );
});
```

**Porquê usar:** o método `PUT` é usado para atualizar um recurso existente. Os quatro `?` recebem, na ordem: `title`, `description`, `completed` e o `id` da URL. O `WHERE id = ?` é **fundamental**: sem ele, o `UPDATE` alteraria *todas* as linhas da tabela. O `affectedRows === 0` indica que nenhuma linha foi encontrada com aquele id, então devolvemos **404**.

> Lembre: este `UPDATE` troca os três campos de uma vez. Por isso o frontend envia `title`, `description` e `completed` juntos.

##### `DELETE /tasks/:id` — excluir uma tarefa

```javascript
app.delete("/tasks/:id", (req, res) => {
    db.query("DELETE FROM tasks WHERE id = ?", [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.affectedRows === 0) return res.status(404).json({ error: "Tarefa não encontrada" });
        res.status(204).send();   // Sucesso, sem conteúdo para devolver
    });
});
```

**Porquê usar:** o método `DELETE` é o padrão para remover recursos. Novamente o `WHERE id = ?` garante que apenas a tarefa desejada seja apagada. O status **204 (No Content)** significa "deu certo e não há nada para enviar de volta".

##### Resumo dos status HTTP usados

| Status | Nome | Quando usamos |
|---|---|---|
| `200` | OK | Resposta de sucesso padrão (`GET`, `PUT`) |
| `201` | Created | Tarefa criada com sucesso (`POST`) |
| `204` | No Content | Exclusão feita com sucesso (`DELETE`) |
| `404` | Not Found | Não existe tarefa com o id informado |
| `500` | Internal Server Error | Erro no servidor ou no banco de dados |

#### 5. Inicialização do servidor

```javascript
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
```

**Porquê usar:** liga o servidor e o faz "escutar" requisições na porta definida. A função de dentro é executada quando o servidor está pronto e mostra a mensagem no terminal.

---

## 7. BANCO DE DADOS

### `DATABASE/script.sql`

Este script cria o banco e a tabela onde as tarefas serão guardadas. **Deve ser executado uma vez, antes de iniciar o servidor.**

```sql
CREATE DATABASE IF NOT EXISTS db_tasks;   -- Cria o banco, caso ainda não exista

USE db_tasks;                             -- Seleciona o banco para os próximos comandos

CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,    -- Número único, gerado automaticamente
    title VARCHAR(255) NOT NULL,          -- Título: texto de até 255 caracteres, obrigatório
    description TEXT,                     -- Descrição: texto longo, opcional
    completed BOOLEAN DEFAULT FALSE       -- Concluída? Começa como falso
);

SELECT * FROM tasks;                      -- Mostra o conteúdo da tabela (para conferir)
```

**Porquê usar:**

| Trecho | O que faz e por que usar |
|---|---|
| `CREATE DATABASE IF NOT EXISTS` | Cria o banco. O `IF NOT EXISTS` evita erro se você rodar o script mais de uma vez |
| `USE db_tasks` | Diz ao MySQL em qual banco os comandos seguintes devem agir |
| `INT AUTO_INCREMENT PRIMARY KEY` | `INT` é número inteiro. `AUTO_INCREMENT` faz o banco numerar sozinho (1, 2, 3...). `PRIMARY KEY` identifica cada linha de forma única, e é isso que usamos no `WHERE id = ?` |
| `VARCHAR(255) NOT NULL` | Texto curto de até 255 caracteres. `NOT NULL` obriga a ter valor, por isso o título é obrigatório também no banco |
| `TEXT` | Texto longo. Sem `NOT NULL`, a descrição pode ficar vazia (`NULL`) |
| `BOOLEAN DEFAULT FALSE` | Verdadeiro/falso. Toda tarefa nova nasce como não concluída. Internamente o MySQL guarda `0` (falso) e `1` (verdadeiro) |
| `SELECT * FROM tasks` | Lista todas as linhas. Útil para conferir o que foi salvo |

Para testar o banco sem usar a página, você pode inserir uma tarefa manualmente:

```sql
INSERT INTO tasks (title, description) VALUES ('Estudar Node', 'Revisar rotas do Express');
INSERT INTO tasks (title) VALUES ('Tarefa só com título');
SELECT * FROM tasks;
```

---
## 8. Como executar

### Pré-requisitos

- **Node.js** (versão LTS) instalado. Teste com `node -v` no terminal.
- **MySQL Server** instalado e em execução. Pode-se usar o **MySQL Workbench** para executar scripts.
- Um editor de código (por exemplo, o VS Code).

### Passo 1 — Criar o banco de dados

Abra o MySQL Workbench (ou o terminal), copie o conteúdo de `database/script.sql` e execute. Ou, pelo terminal:

```bash
mysql -u root -p < database/script.sql
```

Confira se a tabela foi criada:

```sql
USE db_tasks;
SHOW TABLES;
```

### Passo 2 — Preparar o backend (Node.js)

Abra o terminal e vá até a pasta do backend:

```bash
cd backend
```

Crie o arquivo `package.json` automaticamente. O `npm init -y` inicializa um projeto Node.js rapidamente, aceitando todas as opções padrão:

```bash
npm init -y
```

Instale as três dependências do projeto:

```bash
npm install express cors mysql2
```

| Pacote | Para que serve |
|---|---|
| `express` | Cria o servidor e as rotas |
| `cors` | Libera o acesso do frontend à API |
| `mysql2` | Conecta o Node.js ao MySQL |

Confira se o seu `package.json` ficou parecido com este (as versões podem ser diferentes, o npm preenche sozinho):

```json
{
  "name": "backend",
  "version": "1.0.0",
  "description": "",
  "main": "server.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "start": "node server.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "type": "commonjs",
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^5.1.0",
    "mysql2": "^3.14.0"
  }
}
```

> O `"type": "commonjs"` indica que o projeto usa `require()` para importar módulos (como no nosso código). Em alguns casos o `npm init` não gera essa linha; nesse caso, o padrão já é `commonjs`.

Ajuste o `db.js` com o **seu** usuário e a **sua** senha do MySQL e inicie o servidor:

```bash
node server.js
```

Se tudo estiver certo, o terminal mostra as duas mensagens (a ordem pode variar):

```text
Servidor rodando na porta 3000
Conectado ao banco de dados MySql!
```

### Passo 3 — Abrir o frontend

Com o servidor rodando, abra o arquivo `frontend/index.html` no navegador (dois cliques no arquivo ou, no VS Code, botão direito → *Open with Live Server*, se a extensão estiver instalada).

### Passo 4 — Testar o sistema

1. Digite **apenas o título** e clique em *Adicionar*. A tarefa aparece só com o título, sem o `-`.
2. Digite **título e descrição**. A tarefa aparece como `Título - Descrição`.
3. Clique em ✔️ para marcar como concluída (texto riscado) e clique de novo para desmarcar.
4. Clique em 🗑️ para excluir.
5. Aperte **F5** para recarregar a página. As tarefas continuam lá porque estão salvas no MySQL.
6. No MySQL, rode `SELECT * FROM tasks;` e veja os mesmos dados na tabela.

### Testando a API sem o frontend

Com o servidor ligado, abra no navegador:

```text
http://localhost:3000/tasks
```

Você verá o JSON com todas as tarefas. Para testar os outros métodos pelo terminal:

```bash
# Criar uma tarefa
curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d '{"title":"Teste","description":"Via curl"}'

# Buscar a tarefa de id 1
curl http://localhost:3000/tasks/1

# Excluir a tarefa de id 1
curl -X DELETE http://localhost:3000/tasks/1
```

---

## 9. Erros comuns

| Mensagem / sintoma | Provável causa | Como resolver |
|---|---|---|
| `ECONNREFUSED 127.0.0.1:3306` | O MySQL não está em execução | Inicie o serviço do MySQL |
| `ER_ACCESS_DENIED_ERROR` | Usuário ou senha incorretos | Corrija `user` e `password` no `db.js` |
| `ER_BAD_DB_ERROR: Unknown database` | O script SQL não foi executado, ou o nome do banco no `db.js` é diferente do criado | Execute o `script.sql` e confira se o nome é `db_tasks` nos dois lugares |
| `ER_NO_SUCH_TABLE` | A tabela `tasks` não existe | Execute o `script.sql` completo |
| `Cannot find module 'mysql2'` (ou `'express'`) | Falta instalar o pacote, ou o comando foi executado na pasta errada | Dentro de `backend/`, rode `npm install express cors mysql2` |
| `EADDRINUSE: address already in use :::3000` | Já existe um programa usando a porta 3000 (talvez o servidor aberto em outro terminal) | Feche o outro processo ou mude a `PORT` (e o `apiUrl` do frontend) |
| Alerta "Erro ao carregar tarefas" / `Failed to fetch` | O backend está desligado ou o endereço do `apiUrl` está errado | Verifique se o `node server.js` está rodando e se a porta confere |
| Erro de **CORS** no console do navegador (F12) | `app.use(cors())` ausente ou depois das rotas | Coloque o `cors()` antes das rotas |
| Tarefa criada, mas nada aparece na tela | Erro no JavaScript | Abra o console (F12) e leia a mensagem de erro |

**Dica de depuração:** quando algo não funcionar, olhe sempre dois lugares: o **terminal** onde o servidor está rodando (erros do backend e do banco) e o **console do navegador** (tecla F12, aba *Console* e aba *Network*, para erros do frontend).

---

## 10. Melhorias para pensar

Estas ideias não fazem parte do código atual, mas são ótimos próximos passos de estudo:

1. **Evitar XSS.** O `innerHTML` interpreta como HTML tudo o que o usuário digita (por exemplo, `<img src=x onerror=alert(1)>`). Uma alternativa segura é montar o texto com `textContent`:

   ```javascript
   li.innerHTML = `
   <span></span>
   <div>
       <button onclick="toggleComplete(${task.id}, ${task.completed})">✔️</button>
       <button onclick="deleteTask(${task.id})">🗑️</button>
   </div>
   `;
   li.querySelector("span").textContent = text;   // Sempre tratado como texto puro
   ```

2. **Variáveis de ambiente.** Guardar usuário e senha do banco em um arquivo `.env` (com o pacote `dotenv`), em vez de deixá-los no `db.js`.
3. **Pool de conexões.** Trocar `createConnection` por `createPool`, que gerencia várias conexões e é mais adequado a sistemas com muitos usuários.
4. **Promises no backend.** Usar `mysql2/promise` com `async/await`, deixando o `server.js` com o mesmo estilo do frontend, sem callbacks.
5. **Validação no backend.** Verificar se `title` foi enviado antes de executar o `INSERT`, devolvendo status `400 (Bad Request)` quando faltar.
6. **Checar `res.ok` em `toggleComplete` e `deleteTask`.** Hoje, se o servidor responder 404 ou 500 nessas funções, o erro passa despercebido.
7. **Atualização parcial.** Criar uma rota `PATCH` que altere apenas os campos enviados, eliminando o `GET` extra do `toggleComplete`.
8. **Atualizar só o item na tela.** Em vez de recarregar a lista inteira a cada ação, alterar apenas o `<li>` afetado.
9. **Layout responsivo.** A lista tem largura fixa de `530px`. Usar `width: 100%` com `max-width` melhoraria a exibição no celular.
10. **Editar tarefas.** Adicionar um botão para alterar título e descrição, aproveitando a rota `PUT` que já existe.

---

## 11. Glossário

| Termo | Significado |
|---|---|
| **API** | Conjunto de rotas pelas quais um programa conversa com outro. Aqui, o frontend conversa com o backend |
| **REST** | Estilo de API que usa os métodos HTTP (`GET`, `POST`, `PUT`, `DELETE`) sobre recursos como `/tasks` |
| **CRUD** | Create, Read, Update, Delete: as quatro operações básicas sobre dados |
| **Endpoint / Rota** | Endereço específico da API, como `GET /tasks/:id` |
| **JSON** | Formato de texto para trocar dados, como `{"title":"Estudar","completed":false}` |
| **DOM** | Representação da página HTML na memória do navegador, que o JavaScript pode alterar |
| **Middleware** | Função que processa a requisição antes de ela chegar à rota (`cors()`, `express.json()`) |
| **CORS** | Regra do navegador que controla se uma página pode chamar um servidor de outra origem |
| **Callback** | Função passada para outra, que será executada quando uma operação terminar |
| **Promise / async / await** | Recursos do JavaScript para lidar com operações que demoram (como `fetch`) de forma legível |
| **Placeholder (`?`)** | Marcador no comando SQL, substituído de forma segura pelos valores enviados |
| **SQL Injection** | Ataque que insere comandos SQL maliciosos em campos de entrada |
| **XSS** | Ataque que insere HTML ou JavaScript malicioso em uma página |
| **Chave primária** | Coluna que identifica cada linha de forma única (aqui, o `id`) |
| **`AUTO_INCREMENT`** | O banco gera o número do `id` sozinho, somando 1 a cada novo registro |

---

================ FIM ================
Exibindo gerenciador_tarefas_mysql_explicado.md…