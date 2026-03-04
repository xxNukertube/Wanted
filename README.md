# Gerador de Imagem Operacional

Uma aplicação web segura, client-side, para geração de imagens operacionais de segurança pública.

## Funcionalidades

- **Segurança**: Processamento 100% local (no navegador). Nenhum dado é enviado para servidores.
- **Offline**: Funciona sem internet após o carregamento inicial.
- **Geração de Imagem**: Cria cards padronizados com foto, dados do mandado, nível de risco e informações operacionais.
- **Integridade**: Gera hash SHA-256 da imagem produzida para verificação.

## Como Usar

1. Abra o arquivo `index.html` em qualquer navegador moderno.
2. Preencha os dados do mandado.
3. (Opcional) Anexe o PDF para referência.
4. (Opcional) Carregue a foto do alvo.
5. Clique em "Gerar Imagem Operacional".
6. Baixe o arquivo PNG gerado.

## Instalação (GitHub Pages)

Basta fazer o upload dos arquivos (`index.html`, `style.css`, `script.js`) para um repositório GitHub e ativar o GitHub Pages nas configurações.

## Requisitos

- Navegador moderno (Chrome, Firefox, Edge, Safari).
- Não requer backend ou banco de dados.
