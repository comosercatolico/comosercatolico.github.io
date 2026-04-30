# História de uma Alma - Estrutura de Arquivos

## 📋 Descrição

Este diretório contém a estrutura completa para publicar "História de uma Alma" de Santa Teresinha do Menino Jesus no seu site `comosercatolico.github.io`, seguindo o mesmo padrão da Suma Teológica.

## 📁 Estrutura de Pastas

```
historia-de-uma-alma/
├── index.html                    # Página de índice principal
├── historia.css                  # Estilos CSS
├── historia.js                   # Scripts JavaScript
├── README.md                     # Este arquivo
├── historia1-30/                 # Bloco 1: Páginas 1-30
│   ├── historia-pagina1.html
│   ├── historia-pagina2.html
│   └── ... (até historia-pagina30.html)
├── historia31-60/                # Bloco 2: Páginas 31-60
│   ├── historia-pagina31.html
│   └── ... (até historia-pagina60.html)
├── historia61-90/                # Bloco 3: Páginas 61-90
├── historia91-120/               # Bloco 4: Páginas 91-120
└── historia121-150/              # Bloco 5: Páginas 121-150
```

## 🎯 Características

- **150 páginas** divididas em 5 blocos de 30 páginas cada
- **Navegação automática** entre páginas
- **Design responsivo** que funciona em desktop e mobile
- **Compatibilidade** com o padrão visual do seu site
- **Teclas de atalho**: Use as setas do teclado (← →) para navegar

## 🚀 Como Usar

### 1. Copiar os Arquivos para o Repositório

```bash
# Copie toda a pasta para o seu repositório
cp -r /home/ubuntu/historia-de-uma-alma /caminho/para/seu/repositorio/biblioteca/
```

### 2. Adicionar o Conteúdo das Páginas

Cada arquivo HTML contém um template com placeholders. Você precisa:

1. Abrir cada arquivo `historia-paginaX.html`
2. Localizar a seção `<div class="pagina-corpo">`
3. Substituir o texto de exemplo pelo conteúdo real da tradução de 1906

**Exemplo:**

```html
<div class="pagina-corpo">
  <p>Conteúdo da página 1 será adicionado aqui.</p>
  <!-- SUBSTITUIR POR: -->
  <p>À vós, querida Madre, que sois duplamente minha mãe...</p>
</div>
```

### 3. Atualizar o Index Principal do Site

Se você tiver um `index.html` principal na pasta `biblioteca/`, adicione um link para "História de uma Alma":

```html
<a href="historia-de-uma-alma/index.html">História de uma Alma</a>
```

## 📝 Fontes de Conteúdo

Para obter o texto completo da tradução de 1906, você pode:

1. **Internet Archive**: https://archive.org/details/historia-de-uma-alma-santa-teresa-do-menino-jesus
2. **Alexandria Católica**: https://alexandriacatolica.blogspot.com/
3. **Projeto Gutenberg** (original em francês): https://www.gutenberg.org/ebooks/author/6923

## 🎨 Personalização

### Alterar Cores

Edite o arquivo `historia.css` e procure por:

```css
.historia-header {
  background: linear-gradient(135deg, #8b4513 0%, #a0522d 100%);
}
```

Altere os códigos de cor conforme desejado.

### Alterar Número de Páginas

Se a obra tiver mais ou menos de 150 páginas, edite o script `gerar_paginas_historia.py`:

```python
TOTAL_PAGINAS = 150  # Altere este valor
PAGINAS_POR_BLOCO = 30  # Altere este valor também
```

Depois execute novamente:

```bash
python3 gerar_paginas_historia.py
```

## 📱 Funcionalidades

- ✅ Navegação entre páginas
- ✅ Indicador de página atual
- ✅ Links para página anterior/próxima
- ✅ Atalhos de teclado (setas)
- ✅ Design responsivo
- ✅ Compatível com o padrão da Suma Teológica
- ✅ Rodapé com informações de direitos autorais

## ⚖️ Informações Legais

**Status da Obra**: Domínio Público

- **Autora**: Santa Teresinha do Menino Jesus (1873-1897)
- **Tradução**: Laura Júlia Moreira (falecida há mais de 70 anos)
- **Revisor**: Pe. Manuel Fernandes de Santana (1864-1910)
- **Publicador**: Livraria Férin, Lisboa (1906)

Como a tradução foi publicada em 1906 e os tradutores faleceram há mais de 70 anos, esta obra está em domínio público em Portugal, Brasil e na maioria dos países.

## 🔧 Suporte Técnico

### Problema: Links de navegação não funcionam

Verifique se:
- Os arquivos estão nas pastas corretas
- Os nomes dos arquivos correspondem ao padrão `historia-paginaX.html`
- Os caminhos relativos estão corretos

### Problema: Estilos não aparecem

Verifique se:
- O arquivo `historia.css` está no diretório raiz de `historia-de-uma-alma/`
- Os caminhos nos arquivos HTML apontam para `../historia.css`

### Problema: JavaScript não funciona

Verifique se:
- O arquivo `historia.js` está no diretório raiz
- Os caminhos nos arquivos HTML apontam para `../historia.js`

## 📞 Próximos Passos

1. ✅ Estrutura de pastas criada
2. ✅ Templates HTML gerados
3. ✅ Estilos CSS criados
4. ✅ Scripts JavaScript configurados
5. ⏳ **Próximo**: Adicionar o conteúdo das páginas
6. ⏳ **Próximo**: Fazer upload para o repositório GitHub
7. ⏳ **Próximo**: Atualizar links no site principal

## 📄 Arquivos Inclusos

- `index.html` - Página de índice com links para cada bloco
- `historia.css` - Estilos CSS (648 KB total para toda a estrutura)
- `historia.js` - Scripts de navegação
- `historia1-30/` a `historia121-150/` - 150 arquivos HTML (um por página)
- `README.md` - Este arquivo

## 🎓 Referência

Esta estrutura segue o padrão usado na Suma Teológica do seu site:
- https://github.com/comosercatolico/comosercatolico.github.io/tree/main/biblioteca/suma-teologia

## ✨ Dicas

- Use um editor de texto como VS Code para editar os arquivos HTML
- Teste o site localmente antes de fazer upload
- Considere usar um script para automatizar a adição de conteúdo em lote
- Mantenha backups dos arquivos originais

---

**Criado em**: 29 de Abril de 2026
**Versão**: 1.0
**Status**: Pronto para preenchimento de conteúdo
