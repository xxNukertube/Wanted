document.addEventListener('DOMContentLoaded', () => {
    // Elementos do DOM
    const form = document.getElementById('operationalForm');
    const pdfInput = document.getElementById('pdfInput');
    const pdfArea = document.getElementById('pdfArea');
    const pdfInfo = document.getElementById('pdfInfo');
    const pdfName = document.getElementById('pdfName');
    const extractionStatus = document.getElementById('extractionStatus');
    
    const photoInput = document.getElementById('photoInput');
    const photoArea = document.getElementById('photoArea');
    const photoPreviewContainer = document.getElementById('photoPreviewContainer');
    const photoPreview = document.getElementById('photoPreview');
    const vehicleCheck = document.getElementById('vehicleCheck');
    const vehicleSection = document.getElementById('vehicleSection');
    const generateBtn = document.getElementById('generateBtn');
    const clearBtn = document.getElementById('clearBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const canvas = document.getElementById('resultCanvas');
    const ctx = canvas.getContext('2d');
    const hashDisplay = document.getElementById('hashDisplay');
    const hashValue = document.getElementById('hashValue');
    const resultSection = document.getElementById('resultSection');

    // Estado da aplicação
    let currentPhoto = null;
    let currentPhotoUrl = null;

    // Configuração do Canvas
    const CANVAS_WIDTH = 800;
    
    // Inicialização
    init();

    function init() {
        setupEventListeners();
        setupDragAndDrop();
    }

    function setupEventListeners() {
        // Toggle Veículo
        vehicleCheck.addEventListener('change', (e) => {
            if (e.target.checked) {
                vehicleSection.classList.remove('hidden');
            } else {
                vehicleSection.classList.add('hidden');
            }
        });

        // Upload PDF (Leitura direta via PDF.js)
        pdfInput.addEventListener('change', handlePdfUpload);

        // Upload Foto
        photoInput.addEventListener('change', handlePhotoUpload);

        // Botões de Ação
        generateBtn.addEventListener('click', generateImage);
        clearBtn.addEventListener('click', clearData);
        downloadBtn.addEventListener('click', downloadImage);
    }

    function setupDragAndDrop() {
        // PDF Area
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            pdfArea.addEventListener(eventName, preventDefaults, false);
            photoArea.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            pdfArea.addEventListener(eventName, () => pdfArea.classList.add('dragover'), false);
            photoArea.addEventListener(eventName, () => photoArea.classList.add('dragover'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            pdfArea.addEventListener(eventName, () => pdfArea.classList.remove('dragover'), false);
            photoArea.addEventListener(eventName, () => photoArea.classList.remove('dragover'), false);
        });

        pdfArea.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length) handlePdfFile(files[0]);
        });

        photoArea.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length) handlePhotoFile(files[0]);
        });
    }

    // Manipulação de PDF
    function handlePdfUpload(e) {
        if (e.target.files.length) {
            handlePdfFile(e.target.files[0]);
        }
    }

    async function handlePdfFile(file) {
        if (file.type !== 'application/pdf') {
            alert('Por favor, selecione um arquivo PDF.');
            return;
        }
        pdfName.textContent = file.name;
        pdfInfo.classList.add('active');
        
        // Leitura do PDF usando PDF.js
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            let fullText = '';
            
            // Ler todas as páginas (limite de 5 para performance)
            const maxPages = Math.min(pdf.numPages, 5);
            for (let i = 1; i <= maxPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + '\n';
            }
            
            processExtractedText(fullText);
            
        } catch (error) {
            console.error('Erro ao ler PDF:', error);
            alert('Erro ao processar o PDF. Certifique-se de que é um arquivo válido.');
        }
    }

    // Processamento do Texto Extraído
    function processExtractedText(text) {
        if (!text || text.length < 50) return;

        let extracted = false;

        // Helper para extrair via Regex
        const extract = (regex, group = 1) => {
            const match = text.match(regex);
            return match ? match[group].trim() : null;
        };

        // 1. Nome
        const nome = extract(/Nome da Pessoa:\s*([^\n]+?)(?:CPF|RG|RJI|$)/i) || extract(/Nome:\s*([^\n]+)/i);
        if (nome) {
            document.getElementById('nome').value = nome;
            extracted = true;
        }

        // 2. CPF
        const cpf = extract(/CPF:\s*([\d\.\-]+)/i);
        if (cpf) document.getElementById('documento').value = cpf;

        // 3. Nascimento
        const nascimento = extract(/Data de Nascimento:\s*(\d{2}\/\d{2}\/\d{4})/i);
        if (nascimento) document.getElementById('nascimento').value = nascimento;

        // 4. Filiação
        const filiacaoBlock = extract(/Filiação:\s*([\s\S]*?)(?:Marcas|Nome da Pessoa|$)/i);
        if (filiacaoBlock) {
            let mae = '';
            let pai = '';
            
            const maeMatch = filiacaoBlock.match(/(.*?)\(mãe\)/i);
            if (maeMatch) {
                mae = maeMatch[1].trim();
                const paiMatch = filiacaoBlock.match(/\(mãe\)\s*e\s*(.*)/i);
                if (paiMatch) pai = paiMatch[1].trim();
            } else {
                mae = filiacaoBlock.replace(/\n/g, ' ').trim();
            }

            if (mae) document.getElementById('mae').value = mae;
            if (pai) document.getElementById('pai').value = pai;
        }

        // 5. Mandado
        const mandado = extract(/N° do Mandado:\s*([\d\.\-]+)/i);
        if (mandado) document.getElementById('mandado').value = mandado;

        // 6. Processo
        const processo = extract(/Nº do processo:\s*([\d\.\-]+)/i);
        if (processo) document.getElementById('processo').value = processo;

        // 7. Validade
        const validade = extract(/Data de validade:\s*(\d{2}\/\d{2}\/\d{4})/i);
        if (validade) document.getElementById('validade').value = validade;

        // 8. Telefone
        const telefone = extract(/telefone:\s*([^\n\|]+)/i);
        if (telefone && !telefone.toLowerCase().includes('não informado')) {
            document.getElementById('telefone').value = telefone;
        }

        // 9. Endereços
        const enderecos = extract(/Endereços\s*([\s\S]*?)(?:Informações Processuais|$)/i);
        if (enderecos && !enderecos.toLowerCase().includes('não informado')) {
            document.getElementById('enderecos').value = enderecos.replace(/\s+/g, ' ').trim();
        }

        // 10. Crimes/Síntese
        const tipificacao = extract(/Tipificação Penal:\s*([\s\S]*?)(?:Prazo|$)/i);
        if (tipificacao) {
            document.getElementById('crimes').value = tipificacao.replace(/\s+/g, ' ').trim();
        } else {
            const sintese = extract(/Síntese da decisão:\s*([\s\S]{1,300})/i);
            if (sintese) document.getElementById('crimes').value = sintese.replace(/\s+/g, ' ').trim() + '...';
        }

        if (extracted) {
            extractionStatus.classList.remove('hidden');
        }
    }

    // Manipulação de Foto
    function handlePhotoUpload(e) {
        if (e.target.files.length) {
            handlePhotoFile(e.target.files[0]);
        }
    }

    function handlePhotoFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecione um arquivo de imagem.');
            return;
        }

        if (currentPhotoUrl) {
            URL.revokeObjectURL(currentPhotoUrl);
        }

        currentPhotoUrl = URL.createObjectURL(file);
        photoPreview.src = currentPhotoUrl;
        photoPreviewContainer.classList.add('active');
        
        const img = new Image();
        img.onload = function() {
            currentPhoto = img;
        };
        img.src = currentPhotoUrl;
    }

    // Geração da Imagem
    async function generateImage() {
        // Coletar dados
        const getVal = (id) => document.getElementById(id).value.toUpperCase() || '';
        const getValDef = (id, def) => document.getElementById(id).value.toUpperCase() || def;

        const data = {
            nome: getValDef('nome', 'NÃO INFORMADO'),
            mae: getVal('mae'),
            pai: getVal('pai'),
            nascimento: getVal('nascimento'),
            documento: getValDef('documento', 'NÃO INFORMADO'),
            telefone: getVal('telefone'),
            mandado: getVal('mandado'),
            processo: getValDef('processo', 'NÃO INFORMADO'),
            validade: getVal('validade'),
            crimes: getValDef('crimes', 'NÃO INFORMADO'),
            risco: document.querySelector('input[name="risco"]:checked')?.value || 'medio',
            veiculo: vehicleCheck.checked ? {
                placa: getVal('placa'),
                modelo: getVal('modelo'),
                cor: getVal('cor'),
                obs: getVal('obsVeiculo')
            } : null,
            enderecos: getVal('enderecos'),
            obs: getVal('obs'),
            orgao: getVal('orgao'),
            difusao: getVal('difusao')
        };

        // Configurar Canvas
        canvas.width = CANVAS_WIDTH;
        // Altura inicial dinâmica
        canvas.height = 1400; 

        // Fundo
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let y = 0;

        // 1. Cabeçalho de Risco
        const riskColors = {
            'baixo': '#22c55e',
            'medio': '#eab308',
            'alto': '#ef4444'
        };
        
        ctx.fillStyle = riskColors[data.risco];
        ctx.fillRect(0, 0, canvas.width, 80);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('MANDADO DE PRISÃO EM ABERTO', canvas.width / 2, 55);

        y += 100;

        // 2. Foto e Dados Principais
        const margin = 40;
        
        if (currentPhoto) {
            // Desenhar foto (lado esquerdo)
            const photoHeight = 400;
            const photoWidth = 300;
            
            // Aspect ratio fit
            const scale = Math.min(photoWidth / currentPhoto.width, photoHeight / currentPhoto.height);
            const w = currentPhoto.width * scale;
            const h = currentPhoto.height * scale;
            const x = margin + (photoWidth - w) / 2;
            
            ctx.save();
            ctx.beginPath();
            ctx.rect(margin, y, photoWidth, photoHeight);
            ctx.clip();
            ctx.drawImage(currentPhoto, x, y, w, h);
            ctx.restore();
            
            // Borda da foto
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeRect(margin, y, photoWidth, photoHeight);

            // Dados ao lado da foto
            drawDataBlock(margin * 2 + photoWidth, y, canvas.width - (margin * 2 + photoWidth) - margin, data);
            
            y += photoHeight + 40;
        } else {
            // Sem foto, dados ocupam largura total
            drawDataBlock(margin, y, canvas.width - (margin * 2), data);
            y += 450; // Aumentei o espaço pois tem mais dados agora
        }

        // 3. Seções Adicionais
        
        // Veículo
        if (data.veiculo) {
            drawSectionHeader(ctx, 'VEÍCULO ASSOCIADO', y, canvas.width);
            y += 40;
            
            ctx.font = 'bold 20px Arial';
            ctx.fillStyle = '#000';
            ctx.textAlign = 'left';
            
            const vText = `PLACA: ${data.veiculo.placa || '-'} | MODELO: ${data.veiculo.modelo || '-'} | COR: ${data.veiculo.cor || '-'}`;
            ctx.fillText(vText, margin, y + 30);
            y += 40;
            
            if (data.veiculo.obs) {
                ctx.font = '18px Arial';
                y = wrapText(ctx, `OBS: ${data.veiculo.obs}`, margin, y + 30, canvas.width - (margin * 2), 24);
                y += 10;
            }
            y += 20;
        }

        // Endereços
        if (data.enderecos) {
            drawSectionHeader(ctx, 'ENDEREÇOS / ÁREA DE ATUAÇÃO', y, canvas.width);
            y += 40;
            ctx.font = '18px Arial';
            ctx.fillStyle = '#000';
            y = wrapText(ctx, data.enderecos, margin, y + 30, canvas.width - (margin * 2), 24);
            y += 20;
        }

        // Observações
        if (data.obs) {
            drawSectionHeader(ctx, 'OBSERVAÇÕES OPERACIONAIS', y, canvas.width);
            y += 40;
            ctx.font = '18px Arial';
            ctx.fillStyle = '#000';
            y = wrapText(ctx, data.obs, margin, y + 30, canvas.width - (margin * 2), 24);
            y += 20;
        }

        // Rodapé
        y += 40;
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(0, y, canvas.width, 100);
        
        ctx.fillStyle = '#374151';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        
        const now = new Date();
        const dateStr = now.toLocaleDateString('pt-BR');
        const timeStr = now.toLocaleTimeString('pt-BR');
        
        ctx.fillText(`GERADO EM: ${dateStr} às ${timeStr}`, canvas.width / 2, y + 40);
        ctx.fillStyle = '#ef4444';
        ctx.fillText('DOCUMENTO DE USO EXCLUSIVO INSTITUCIONAL', canvas.width / 2, y + 70);

        // Recortar canvas para altura final
        const finalHeight = y + 100;
        const finalData = ctx.getImageData(0, 0, canvas.width, finalHeight);
        canvas.height = finalHeight;
        ctx.putImageData(finalData, 0, 0);

        // Mostrar resultado
        resultSection.classList.remove('hidden');
        resultSection.scrollIntoView({ behavior: 'smooth' });

        // Gerar Hash
        generateHash();
    }

    function drawDataBlock(x, y, w, data) {
        let curY = y;
        const lineHeight = 30;

        ctx.textAlign = 'left';
        
        // Nome
        ctx.fillStyle = '#374151';
        ctx.font = '14px Arial';
        ctx.fillText('NOME COMPLETO', x, curY + 10);
        
        ctx.fillStyle = '#000';
        ctx.font = 'bold 24px Arial';
        // Nome pode ser longo, wrap
        curY = wrapText(ctx, data.nome, x, curY + 35, w, 28);
        curY += 10;

        // Filiação
        if (data.mae || data.pai) {
            ctx.fillStyle = '#374151';
            ctx.font = '12px Arial';
            ctx.fillText('FILIAÇÃO', x, curY + 10);
            ctx.fillStyle = '#000';
            ctx.font = '16px Arial';
            let filiacaoText = '';
            if (data.mae) filiacaoText += `MÃE: ${data.mae}`;
            if (data.pai) filiacaoText += (filiacaoText ? ' | ' : '') + `PAI: ${data.pai}`;
            curY = wrapText(ctx, filiacaoText, x, curY + 30, w, 20);
            curY += 10;
        }

        // Grid de info
        const col2 = w / 2;
        
        // Linha 1: CPF e Nascimento
        drawLabelValue(ctx, 'CPF / RG', data.documento, x, curY);
        drawLabelValue(ctx, 'NASCIMENTO', data.nascimento || '-', x + col2, curY);
        curY += 50;

        // Linha 2: Mandado e Validade
        drawLabelValue(ctx, 'Nº MANDADO', data.mandado || '-', x, curY);
        drawLabelValue(ctx, 'VALIDADE', data.validade || '-', x + col2, curY);
        curY += 50;

        // Linha 3: Processo e Telefone
        drawLabelValue(ctx, 'PROCESSO', data.processo, x, curY);
        if (data.telefone) {
            drawLabelValue(ctx, 'TELEFONE', data.telefone, x + col2, curY);
        }
        curY += 50;

        // Crimes
        ctx.fillStyle = '#374151';
        ctx.font = '14px Arial';
        ctx.fillText('CRIMES / ARTIGOS', x, curY + 10);
        
        ctx.fillStyle = '#ef4444'; // Destaque vermelho
        ctx.font = 'bold 18px Arial';
        curY = wrapText(ctx, data.crimes, x, curY + 35, w, 22);
    }

    function drawLabelValue(ctx, label, value, x, y) {
        ctx.fillStyle = '#6b7280';
        ctx.font = '12px Arial';
        ctx.fillText(label, x, y + 10);
        
        ctx.fillStyle = '#000';
        ctx.font = 'bold 18px Arial';
        // Truncar se for muito longo para não sobrepor coluna
        let displayValue = value;
        if (value.length > 25) displayValue = value.substring(0, 22) + '...';
        ctx.fillText(displayValue, x, y + 30);
    }

    function drawSectionHeader(ctx, text, y, width) {
        ctx.fillStyle = '#e5e7eb';
        ctx.fillRect(0, y, width, 30);
        
        ctx.fillStyle = '#000';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(text, 20, y + 21);
    }

    function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let curY = y;

        for(let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, curY);
                line = words[n] + ' ';
                curY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, curY);
        return curY + lineHeight;
    }

    async function generateHash() {
        canvas.toBlob(async (blob) => {
            const arrayBuffer = await blob.arrayBuffer();
            const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            
            hashDisplay.classList.remove('hidden');
            hashValue.textContent = hashHex;
        }, 'image/png');
    }

    function downloadImage() {
        const nome = document.getElementById('nome').value.trim() || 'FORAGIDO';
        // Sanitizar nome para arquivo
        const safeName = nome.replace(/[^a-z0-9]/gi, '_').toUpperCase();
        
        const link = document.createElement('a');
        link.download = `${safeName}.png`;
        link.href = canvas.toDataURL();
        link.click();
    }

    function clearData() {
        if (confirm('Tem certeza? Isso apagará todos os dados preenchidos.')) {
            document.getElementById('operationalForm').reset();
            vehicleSection.classList.add('hidden');
            pdfInfo.classList.remove('active');
            photoPreviewContainer.classList.remove('active');
            resultSection.classList.add('hidden');
            hashDisplay.classList.add('hidden');
            extractionStatus.classList.add('hidden');
            
            if (currentPhotoUrl) {
                URL.revokeObjectURL(currentPhotoUrl);
                currentPhotoUrl = null;
            }
            currentPhoto = null;
            
            // Limpar canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            canvas.height = 0;
        }
    }
});
