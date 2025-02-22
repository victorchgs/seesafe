# SeeSafe App

## 📌 Introdução

De acordo com o IBGE, em 2023, o Brasil contava com mais de 6 milhões de pessoas com deficiência visual, sendo aproximadamente 500 mil delas cegas. Para se locomover, essas pessoas geralmente utilizam recursos como cães-guia ou bengalas. Embora eficientes, essas alternativas apresentam limitações, como o alto custo associado aos cães-guia e a incapacidade das bengalas de detectar obstáculos elevados.

Nos últimos anos, surgiram soluções tecnológicas que oferecem suporte mais avançado, mas seu custo elevado ainda representa uma barreira para ampla adoção. Diante disso, propomos desenvolver um sistema de baixo custo que utiliza a câmera do celular para detectar obstáculos e emitir alertas de áudio ou vibração para o usuário. Esse sistema democratizaria o acesso a soluções tecnológicas e contribuiria para uma maior autonomia de pessoas com deficiência visual.

## 📱 Descrição do aplicativo

O aplicativo utiliza visão computacional para processar imagens capturadas pela câmera do celular e identificar obstáculos no caminho do usuário. Além disso, descreve o ambiente ao redor em tempo real por meio de mensagens de áudio ou vibração.

### 🔹 Funcionalidades principais

- Identificação de obstáculos;
- Notificação de perigos no caminho;
- Interface simples e acessível para pessoas com deficiência visual;
- Possibilidade de envio de informações a um responsável.

## 🎯 Público-alvo

O SeeSafe é destinado a pessoas com deficiência visual parcial ou total que buscam uma ferramenta acessível e eficiente para auxiliar na locomoção diária, especialmente em áreas urbanas. Além disso, o aplicativo também atende responsáveis ou cuidadores dessas pessoas, que poderão monitorar informações importantes, como a localização do usuário principal e receber avisos de emergência.

---

## 🚀 Como executar o aplicativo

Para executar o aplicativo SeeSafe, siga os passos abaixo:

### 1️⃣ Pré-requisitos

- É necessário ter instalado no computador:

  - **Android Studio** e **Java Development Kit (JDK)** (caso este não seja instalado junto do Android Studio).

  Ou

  - **SDK do Android** e o **JDK** separadamente.

- **Variáveis de ambiente**: Certifique-se de que as variáveis de ambiente do Windows para o Android Studio (Android SDK) e o JDK estão corretamente configuradas.
- **Node.js**: A versão utilizada para desenvolvimento é a `22.13.0 LTS`.
- **Emulador ou dispositivo real**: Para compilar o aplicativo, é necessário ter uma das seguintes opções configuradas:
  - Emulador de Android executando.
  - Dispositivo Android real conectado via cabo USB com **Depuração via USB** habilitada (opções de desenvolvedor do dispositivo).
- **IP do servidor**: Por causa de alguns problemas com relação ao framework Expo, variáveis de ambiente não foram implementadas. Dessa forma, em todos os lugares que o aplicativo precisa fazer requisição para o servidor, é necessário modificar o IP local do servidor que está escrito manualmente.
- **Chave de API do Google**: Como o aplicativo substitui o Expo Workflow pelo Bare Workflow, o mapa fornecido pelo React Native precisa de uma chave da API do Google para funcionar corretamente. Pelo mesmo motivo anterior, variáveis de ambiente não puderam ser criadas, então a chave da API estava sendo colocada manualmente em código. Para a versão final do protótipo do aplicativo, essa chave vai ser removida do código por questões de segurança.

### 2️⃣ Instalar as dependências do aplicativo

```bash
npm install
```

### 3️⃣ Compilar o aplicativo

```bash
npm run build-app
```

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e enviar pull requests.

## 📜 Licença

Este projeto está licenciado sob a **Creative Commons BY-NC**. Isso significa que você pode usar, modificar e distribuir o código **desde que não o utilize para fins comerciais**. Para mais detalhes, consulte o arquivo LICENSE.
