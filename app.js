// ... (mantenha o código anterior da câmera e variáveis até o início da função de captura)

// 2. Lógica de Captura e OCR REFINADA
btnCapturar.addEventListener('click', async () => {
    btnCapturar.innerText = "⏳ Lendo...";
    btnCapturar.disabled = true;

    // Tira um "print" do vídeo e joga no canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    try {
        // Envia a imagem para o Tesseract processar em Português
        // Pedimos dados extras sobre as posições das palavras
        const result = await Tesseract.recognize(canvas, 'por', { logger: m => console.log(m) });
        const dataExtraida = result.data;
        const textoPuro = dataExtraida.text;

        // FILTRO REFINADO DE PREÇO (igual ao anterior)
        const regexPreco = /(\d+[,.]\d{2})/;
        const matchPreco = textoPuro.match(regexPreco);
        if(matchPreco) {
            precoInput.value = matchPreco[0].replace(',', '.');
        } else {
            precoInput.value = ''; // Limpa se não achar
            // alert("Preço não encontrado. Digite manualmente."); 
        }

        // --- NOVA LÓGICA DE CAÇA AO NOME ---
        // A estratégia: Buscar palavras que não têm números e têm tamanho razoável.
        
        const blocosTexto = dataExtraida.words; // Pega cada palavra individual e sua posição
        
        // Filtra os blocos: remove os que parecem preço, data ou código de barras
        // Mantém apenas palavras que têm pelo menos 3 letras e nenhum número.
        const blocosCandidatosA Nome = blocosTexto.filter(bloco => {
            const texto = bloco.text.trim();
            // Verifica se a palavra não contém nenhum dígito decimal
            const temNumero = /\d/.test(texto); 
            return !temNumero && texto.length >= 3;
        });

        // Tenta achar o melhor palpite para o nome.
        // Se houver candidatos, pegamos os 3 primeiros para formar uma sugestão básica.
        if (blocosCandidatosA Nome.length > 0) {
            // Unimos as primeiras palavras limpas encontradas
            const palpiteNome = blocosCandidatosA Nome.slice(0, 3).map(b => b.text).join(' ');
            nomeInput.value = palpiteNome; 
        } else {
            nomeInput.value = ''; // Limpa se não achar nada bom
        }

    } catch (error) {
        alert("Erro na leitura da imagem.");
    }

    btnCapturar.innerText = "📸 Ler Etiqueta";
    btnCapturar.disabled = false;
});

// ... (mantenha o restante do código igual)