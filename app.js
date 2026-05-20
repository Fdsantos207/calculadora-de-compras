const video = document.getElementById('camera');
const canvas = document.getElementById('canvas');
const btnCapturar = document.getElementById('btnCapturar');
const nomeInput = document.getElementById('nomeProduto');
const precoInput = document.getElementById('precoProduto');
const btnAdicionar = document.getElementById('btnAdicionar');
const lista = document.getElementById('listaCompras');
const totalSpan = document.getElementById('total');

let carrinho = [];
let totalGeral = 0;

// Ligar Câmera
navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then(stream => { video.srcObject = stream; })
    .catch(err => {
        console.error("Erro na câmera: ", err);
        alert("Erro ao acessar a câmera. Verifique as permissões.");
    });

// OCR Inteligente
btnCapturar.addEventListener('click', async () => {
    btnCapturar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    try {
        const result = await Tesseract.recognize(canvas, 'por');
        const words = result.data.words;
        
        // Busca Preço
        const regexPreco = /(\d+[,.]\d{2})/;
        const precoMatch = result.data.text.match(regexPreco);
        if(precoMatch) {
            precoInput.value = precoMatch[0].replace(',', '.');
        }

        // Busca Nome (Primeiras palavras sem números)
        const nomeCandidato = words.filter(w => !/\d/.test(w.text) && w.text.length > 2).slice(0, 3).map(w => w.text).join(' ');
        if(nomeCandidato) {
            nomeInput.value = nomeCandidato;
        }

    } catch (e) { 
        console.error(e); 
        alert("Erro na leitura da imagem.");
    }
    btnCapturar.innerHTML = '<i class="fa-solid fa-camera"></i>';
});

// Adicionar/Atualizar Lista
btnAdicionar.addEventListener('click', () => {
    const nome = nomeInput.value || "Produto";
    const preco = parseFloat(precoInput.value);

    if(isNaN(preco) || preco <= 0) {
        return alert("Por favor, insira um preço válido!");
    }

    const item = { id: Date.now(), nome, preco };
    carrinho.push(item);
    renderLista();
    
    // Limpa os campos após adicionar
    nomeInput.value = ''; 
    precoInput.value = '';
});

// Renderizar a lista na tela
function renderLista() {
    lista.innerHTML = '';
    totalGeral = 0;
    
    carrinho.forEach(item => {
        totalGeral += item.preco;
        const div = document.createElement('div');
        div.className = 'item-card';
        div.innerHTML = `
            <div class="item-info">
                <b>${item.nome}</b>
                <span>R$ ${item.preco.toFixed(2)}</span>
            </div>
            <div class="actions">
                <button class="btn-action edit" onclick="editar(${item.id})"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-action delete" onclick="excluir(${item.id})"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        lista.appendChild(div);
    });
    
    totalSpan.innerText = totalGeral.toFixed(2);
}

// Funções globais para os botões funcionarem
window.excluir = (id) => {
    carrinho = carrinho.filter(i => i.id !== id);
    renderLista();
};

window.editar = (id) => {
    const item = carrinho.find(i => i.id === id);
    if(item) {
        nomeInput.value = item.nome;
        precoInput.value = item.preco;
        excluir(id); // Remove o item antigo para você poder salvar a versão nova
        window.scrollTo(0, 0); // Rola a página para cima
    }
};