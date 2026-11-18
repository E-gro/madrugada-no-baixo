# 🌙 Madrugada no Baixo — Tower Defense 3D (`Three.js`)

São **02:00 da manhã de uma quinta-feira**, todo mundo precisa acordar cedo, mas os **motoqueiros do "randandandan"** sem escapamento e os **carros de som treme-vidro** resolveram transformar as ruas boêmias do Baixo em pista de teste!

Reúna a **Associação dos Moradores Indignados** pelas calçadas e esquinas em um **Tower Defense 3D** feito para a web com **Three.js** e áudio procedural em **Web Audio API**.

---

## 🎮 A Vizinhança (Defensores)

| Atalho | Vizinho | Especialidade |
| :---: | :--- | :--- |
| `1` | **🩴 Seu Jorge da Chinelada** | Mira cirúrgica de longo alcance com Havaiana teleguiada. Causa dano bônus contra motos rápidas! |
| `2` | **🪣 Dona Neide do Balde** | Arremessa água gelada que molha em área e reduz a velocidade dos veículos barulhentos em até **45%**. |
| `3` | **🥚 República do Ovo** | Estudantes virados arremessando rajadas de ovos e tomates que quebram a "blindagem acústica" (+dano recebido). |
| `4` | **📡 Síndico do Jammer EMP** | Antena parabólica + transformador de micro-ondas que dispara raios em cadeia e frita **Carros de Som e Paredões**! |

Cada vizinho possui **3 níveis de evolução**, seleção de foco (`1º da Fila`, `Mais Barulhento`, `Mais Rápido`) e reembolso caso você mande o morador voltar a dormir.

---

## 🛵 Os Inimigos do Sono

1. **CG 125 sem Escapamento** — Rápida, barulhenta (`RAN-DAN-DAN!`) e vem em bando.
2. **Rei do Grau & Corte de Giro** — Empina na avenida em altíssima velocidade com neon rosa.
3. **Golzinho Rebaixado Treme-Vidro** — Porta-malas aberto batendo grave e acordando as janelas dos sobrados.
4. **Picape do Paredão Acústico** — Caminhonete blindada carregando uma parede de alto-falantes LED de 20.000W.
5. **Trio Elétrico Clandestino 3AM (Chefão)** — Carnaval fora de época tentando zerar o sossego da rua antes das 06:00!

 Sobreviva às **10 ondas** até o sol nascer às **06:00 da manhã** (com transição real de iluminação noturna para o amanhecer!) — ou continue jogando no **Modo Madrugada Infinita**!

---

## 🚀 Como Rodar Localmente

Pré-requisitos: **Node.js 18+**

```bash
npm install
npm run dev
```

Depois abra `http://localhost:5173` no navegador!

Para gerar a versão de produção (`dist/`):

```bash
npm run build
npm run preview
```

## 🕹️ Controles

- **Clique Esquerdo**: Posicionar vizinho nas calçadas iluminadas / Selecionar vizinho para evoluir
- **Arrastar Mouse**: Girar câmera 3D pelas ruas do Baixo
- **Scroll**: Zoom in / out
- **`1` - `4`**: Selecionar vizinhos rapidamente
- **`Espaço`**: Chamar próxima onda
- **`ESC`**: Cancelar seleção
