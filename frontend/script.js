const apiUrl = 'http://localhost:3000/emailadd'; //o que seria aqui?

const form = document.getElementById('form-inscricao');

// POST do input ao db
form.addEventListener('submit', async(e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;

    try{
        const res = await fetch(apiUrl, {
            method:'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({email})
        });

        if (!res.ok) throw new Error('Erro ao enviar o e-mail!');
         
        // const emailadd = await res.json();

        form.reset();

    }catch (err) {
        alert('Erro ao enviar o email: ' + err.message)
    }

});

// Adição de cards
function createCard(product){
    const productList = document.getElementById('produtos-lista');
    const card = document.createElement('li');
    
    card.innerHTML = `
    <div class="card">
    <img class="card-imagem" src="${product.imagem}" alt="img">
        <p>${product.nome}</p>
        <p>${product.descricao}</p>
        <p>${product.preco}</p>
        <button>Detalhes</button>
    </div>
    `;

    // document.querySelectorAll(".card-image").src = product.imagem; // resultado, n precisei, mas ta aqui, pra informar
    
    productList.appendChild(card)

};

/* imagem variavel, testar em casa
var imgVar = "https://www.jqueryscript.net/images/Simplest-Responsive-jQuery-Image-Lightbox-Plugin-simple-lightbox.jpg";
document.querySelector(".id-of-img-tag").src = imgVar;
<img class="id-of-img-tag" src="" alt="img">
*/

// factory

function createProduct (id, nome, descricao, preco, imagem){
    const product = {
        id: id,
        nome: nome,
        descricao: descricao,
        preco: preco,
        imagem: imagem
    };

    return product;
};

// imagens
const foneImagem = "https://images.kabum.com.br/produtos/fotos/sync_mirakl/498842/xlarge/Fone-de-Ouvido-Gamer-Lenovo-Think-Livepods-Gm2-Pro-Bluetooth-Preto_1790620748.png";
const smartwatchImagem = "https://cdn.mos.cms.futurecdn.net/FkGweMeB7hdPgaSFQdgsfj-970-80.jpg.webp";
const cameraImagem = "https://pro.sony/s3/2025/01/12102234/1000x700.png";

// objetos
const fone = createProduct(1, "Fone Bluetooth Premium", "Fone de ouvido sem fio com qualidade de som excelente", 199.90, foneImagem);
const smartwatch = createProduct(2,"Smartwatch Inteligente", "Relógio inteligente com monitor de saúde e notificações", 349.90, smartwatchImagem);
const camera = createProduct(3,"Câmera Profissional HD", "Câmera Sony profissional com resolução Full HD e zoom digital", 4999.90, cameraImagem);



const produtos = [fone, smartwatch, camera];


for ( let i = 0; i < produtos.length; i++) {
    createCard(produtos[i]);
};