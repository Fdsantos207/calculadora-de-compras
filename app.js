const video = document.getElementById('camera');
const canvas = document.getElementById('canvas');
const btnCapturar = document.getElementById('btnCapturar');
const nomeInput = document.getElementById('nomeProduto');
const precoInput = document.getElementById('precoProduto');
const btnAdicionar = document.getElementById('btnAdicionar');
const lista = document.getElementById('listaCompras');
const totalSpan = document.getElementById('total');

let totalGeral = 0;

// 1. Ligar a Câmera Traseira do Celular
navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then(stream => { video.srcObject = stream; })
    .catch(err => {
        alert("Erro ao acessar a câmera. Verifique as permissões.");
        console.error(err);
    });

// 2. Lógica de Captura e OCR
btnCapturar.addEventListener('click', async () => {
    btnCapturar.innerText = "⏳ Lendo...";
    btnCapturar.disabled = true;

    // Tira um "print" do vídeo e joga no canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    try {
        // Envia a imagem para o Tesseract processar em Português
        const result = await Tesseract.recognize(canvas, 'por');
        const textoExtraido = result.data.text;

        // Filtro MVP: Tenta pegar a primeira linha com letras para o Nome
        const linhas = textoExtraido.split('\n').filter(l => l.trim().length > 2);
        if(linhas.length > 0) {
            nomeInput.value = linhas[0].trim(); 
        }

        // Filtro MVP: Procura por algo que pareça dinheiro (ex: 15,99 ou 15.99)
        const regexPreco = /(\d+[,.]\d{2})/;
        const match = textoExtraido.match(regexPreco);
        if(match) {
            // Converte vírgula pra ponto para o cálculo matemático funcionar
            precoInput.value = match[0].replace(',', '.');
        } else {
            alert("Preço não encontrado na etiqueta. Digite manualmente.");
        }

    } catch (error) {
        alert("Erro na leitura da imagem.");
    }

    btnCapturar.innerText = "📸 Ler Etiqueta";
    btnCapturar.disabled = false;
});

// 3. Adicionar na Lista e Somar
btnAdicionar.addEventListener('click', () => {
    const nome = nomeInput.value || "Item sem nome";
    const preco = parseFloat(precoInput.value);

    if(isNaN(preco) || preco <= 0) {
        return alert("Por favor, insira um preço válido!");
    }

    // Soma o total
    totalGeral += preco;
    totalSpan.innerText = totalGeral.toFixed(2);

    // Cria o item na tela
    const li = document.createElement('li');
    li.innerHTML = `<span>${nome}</span> <strong>R$ ${preco.toFixed(2)}</strong>`;
    lista.appendChild(li);

    // Limpa os campos para a próxima leitura
    nomeInput.value = '';
    precoInput.value = '';
});