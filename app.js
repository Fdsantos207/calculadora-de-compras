const video = document.getElementById('camera');
const canvas = document.getElementById('canvas');
const btnCapturar = document.getElementById('btnCapturar');
const nomeInput = document.getElementById('nomeProduto');
const precoInput = document.getElementById('precoProduto');
const btnAdicionar = document.getElementById('btnAdicionar');
const lista = document.getElementById('listaCompras');
const totalSpan = document.getElementById('total');

// Variável para guardar o controle da mira
const targetBox = document.querySelector('.target-box');

let carrinho = [];
let totalGeral = 0;

// Ligar Câmera
navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then(stream => { video.srcObject = stream; })
    .catch(err => {
        console.error("Erro na câmera: ", err);
        alert("Erro ao acessar a câmera. Verifique as permissões.");
    });

// OCR Inteligente com Correção de Coordenadas da Mira
btnCapturar.addEventListener('click', async () => {
    btnCapturar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    btnCapturar.disabled = true;

    // 1. Get raw video dimensions (e.g., 1920x1080)
    const vWidth = video.videoWidth;
    const vHeight = video.videoHeight;

    // 2. Get visual dimensions of the camera CONTAINER and video element on the SCREEN
    const rectVideoContainer = video.parentElement.getBoundingClientRect();
    
    // 3. Get visual dimensions of the TARGET BOX on the SCREEN
    const rectTarget = targetBox.getBoundingClientRect();

    // 4. Calculate scaling factor between SCREEN and RAW VIDEO
    const scaleX = vWidth / rectVideoContainer.width;
    const scaleY = vHeight / rectVideoContainer.height;

    // 5. Calculate the mathematical CROP area on the RAW VIDEO based on the visual mapping
    // Precisamos subtrair a posição inicial do container do vídeo para ter as coordenadas relativas da mira.
    const cropX = (rectTarget.left - rectVideoContainer.left) * scaleX;
    const cropY = (rectTarget.top - rectVideoContainer.top) * scaleY;
    const cropWidth = rectTarget.width * scaleX;
    const cropHeight = rectTarget.height * scaleY;

    // 6. Set canvas to the mathematically calculated crop size
    canvas.width = cropWidth;
    canvas.height = cropHeight;

    // 7. Draw ONLY the calculated area from the raw video to the invisible Canvas
    const ctx = canvas.getContext('2d');
    
    // drawImage(video, cropX, cropY, cropWidth, cropHeight, targetX, targetY, targetWidth, targetHeight)
    ctx.drawImage(
        video, 
        cropX, cropY, cropWidth, cropHeight, // De onde ele corta no vídeo real
        0, 0, cropWidth, cropHeight          // Onde ele cola no Canvas invisível
    );

    try {
        // Envia apenas o Canvas cortado e alinhado para o OCR (MUITO mais rápido e preciso)
        const result = await Tesseract.recognize(canvas, 'por');
        const words = result.data.words;
        
        // Busca Preço
        const regexPreco = /(\d+[,.]\d{2})/;
        const precoMatch = result.data.text.match(regexPreco);
        if(precoMatch) {
            precoInput.value = precoMatch[0].replace(',', '.');
        } else {
            precoInput.value = '';
        }

        // Busca Nome (Palavras limpas)
        const nomeCandidato = words.filter(w => !/\d/.test(w.text) && w.text.length > 2).slice(0, 3).map(w => w.text).join(' ');
        if(nomeCandidato) {
            nomeInput.value = nomeCandidato;
        } else {
            nomeInput.value = '';
        }

    } catch (e) { 
        console.error(e); 
        // alert("Erro na leitura da imagem.");
    }
    
    btnCapturar.innerHTML = '<i class="fa-solid fa-camera"></i>';
    btnCapturar.disabled = false;
});

// Adicionar Lista
btnAdicionar.addEventListener('click', () => {
    const nome = nomeInput.value || "Produto";
    const preco = parseFloat(precoInput.value);

    if(isNaN(preco) || preco <= 0) {
        return alert("Por favor, insira um preço válido!");
    }

    const item = { id: Date.now(), nome, preco };
    carrinho.push(item);
    renderLista();
    nomeInput.value = ''; precoInput.value = '';
});

// Render Lista
function renderLista() {
    lista.innerHTML = ''; totalGeral = 0;
    carrinho.forEach(item => {
        totalGeral += item.preco;
        const div = document.createElement('div');
        div.className = 'item-card';
        div.innerHTML = `
            <div class="item-info"><b>${item.nome}</b><span>R$ ${item.preco.toFixed(2)}</span></div>
            <div class="actions">
                <button class="btn-action edit" onclick="editar(${item.id})"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-action delete" onclick="excluir(${item.id})"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        lista.appendChild(div);
    });
    totalSpan.innerText = totalGeral.toFixed(2);
}

window.excluir = (id) => { carrinho = carrinho.filter(i => i.id !== id); renderLista(); };
window.editar = (id) => {
    const item = carrinho.find(i => i.id === id);
    if(item) { nomeInput.value = item.nome; precoInput.value = item.preco; excluir(id); window.scrollTo(0, 0); }
};