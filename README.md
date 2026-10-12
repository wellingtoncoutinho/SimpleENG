# 🚀 SimpleENG

> **Transforme suas anotações de aula de conversação em um roteiro interativo de estudos estilo Duolingo.**

O **SimpleENG** foi criado para estudantes de inglês que fazem aulas semanais focadas em conversação e precisam de um método prático e gamificado para fixar o vocabulário, as correções e os temas abordados durante a semana.

---

## ✨ Funcionalidades

- 📅 **Planejador Semanal de 7 Dias**: Gera um cronograma estruturado (ex: 20 min/dia) para praticar o vocabulário e a gramática da última aula.
- 🎮 **Exercícios Interativos**:
  - *Sentence Build*: Monte frases usando blocos de palavras.
  - *Listen & Type*: Ditado interativo com áudio nativo e banco de palavras.
  - *Grammar Fix*: Identificação e correção de erros comuns e preposições.
  - *Speak & Verify*: Prática de pronúncia usando reconhecimento de fala.
  - *Roleplay com Leo/Engy*: Desafio conversacional com feedback imediato.
- 🤖 **IA com Google Gemini**: Cria lições sob demanda baseadas nas suas anotações reais e gera síntese de voz (TTS).
- 🏆 **Gamificação**: Streaks diários, XP, conquistas e níveis CEFR (A1 a C2).
- ⚡ **Modo Offline/Fallback**: Mesmo sem chave de API, o app conta com um gerador pedagógico local para você nunca parar de estudar.

---

## 🛠️ Tecnologias

- **Frontend**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Motion](https://motion.dev/), [Lucide React](https://lucide.dev/)
- **Backend / APIs**: Google Gemini API (`@google/genai`), Node.js / Express, Vercel Serverless Functions
- **Voz & Áudio**: Web Speech API + Gemini TTS

---

## 💻 Como Rodar Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 20+ recomendada)
- Chave de API do [Google AI Studio](https://aistudio.google.com/app/apikey) (gratuita)

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/SEU-USUARIO/SimpleENG.git
   cd SimpleENG
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   Crie um arquivo `.env` na raiz do projeto (ou copie do `.env.example`):
   ```env
   GEMINI_API_KEY=sua_chave_gemini_aqui
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse no navegador: `http://localhost:3000`

---

## ☁️ Deploy na Vercel

O projeto já está configurado com `vercel.json` e funções serverless em `api/` para rodar na Vercel sem configurações extras.

1. Suba o projeto para o seu GitHub.
2. Acesse [vercel.com](https://vercel.com) e importe o repositório.
3. Nas configurações de **Environment Variables** na Vercel, adicione:
   - `GEMINI_API_KEY`: sua chave do Google Gemini.
4. Clique em **Deploy**.

---

## 🗺️ Próximos Passos (Roadmap)

- [ ] Integração com Banco de Dados na nuvem (Supabase / PostgreSQL) para persistência dos planos e histórico
- [ ] Autenticação de Usuários (Login / Cadastro via email ou Google)
- [ ] Exportação de relatórios de progresso semanal
- [ ] Notificações e lembretes diários de estudo
