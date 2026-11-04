const apiUrl = 'http://localhost:3000/'; //o que seria aqui?

const form = document.getElementById('form-inscricao');

form.addEventListener('submit', async(e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;

    try{

    }catch (err) {
        alert('Erro ao salvar tarefa: ' + err.message)
    }

});


// factory e objetos

// factory atraves de class (provavelmente eu vou usar)
class createProduct{
    constructor(id,nome,descricao,preco,imagem){
        this.id = id;
        this.nome = nome;
        this.descricao = descricao;
        this.preco = preco;
        this.imagem = imagem;
    }

}

const fone = new 
const smartwatch = new
const camera = new


// factory atraves de function
function createProduct(id,nome,descricao,preco,imagem){


}

// objetos
[
{
"id": 1,
"nome": "Fone Bluetooth Premium",
"descricao": "Fone de ouvido sem fio com qualidade de som excelente",
"preco": 199.90,
"imagem":
"https://grupomateus.vtexassets.com/arquivos/ids/4277626-1200-1200?v=638894764984400000&widt
h=1200&height=1200&aspect=true"
},

{
"id": 2,
"nome": "Smartwatch Inteligente",
"descricao": "Relógio inteligente com monitor de saúde e notificações",
"preco": 349.90,
"imagem": "https://cdn.mos.cms.futurecdn.net/FkGweMeB7hdPgaSFQdgsfj-970-80.jpg.webp"
},
{
"id": 3,
"nome": "Câmera Profissional HD",
"descricao": "Câmera Sony profissional com resolução Full HD e zoom digital",
"preco": 4999.90,
"imagem": "https://pro.sony/s3/2025/01/12102234/1000x700.png"
}
]


// link da foto do fone https://images.kabum.com.br/produtos/fotos/sync_mirakl/498842/xlarge/Fone-de-Ouvido-Gamer-Lenovo-Think-Livepods-Gm2-Pro-Bluetooth-Preto_1790620748.png