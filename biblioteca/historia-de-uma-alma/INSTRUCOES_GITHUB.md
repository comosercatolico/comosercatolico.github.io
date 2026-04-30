# Instruções para Upload no GitHub

## 📤 Como Fazer Upload para o Seu Repositório

### Opção 1: Usando Git (Recomendado)

```bash
# 1. Clone seu repositório (se ainda não tiver)
git clone https://github.com/comosercatolico/comosercatolico.github.io.git
cd comosercatolico.github.io

# 2. Copie a pasta historia-de-uma-alma para a pasta biblioteca
cp -r /home/ubuntu/historia-de-uma-alma ./biblioteca/

# 3. Adicione os arquivos ao Git
git add biblioteca/historia-de-uma-alma/

# 4. Faça o commit
git commit -m "Adicionar 'História de uma Alma' à biblioteca"

# 5. Faça o push para o GitHub
git push origin main
```

### Opção 2: Usando a Interface do GitHub

1. Acesse seu repositório: https://github.com/comosercatolico/comosercatolico.github.io
2. Navegue até a pasta `biblioteca/`
3. Clique em "Add file" → "Upload files"
4. Arraste e solte a pasta `historia-de-uma-alma/` ou selecione os arquivos
5. Escreva uma mensagem de commit
6. Clique em "Commit changes"

## 📋 Checklist Antes de Fazer Upload

- [ ] Todos os 150 arquivos HTML foram criados
- [ ] O arquivo `historia.css` está presente
- [ ] O arquivo `historia.js` está presente
- [ ] O arquivo `index.html` está presente
- [ ] O arquivo `README.md` está presente
- [ ] Os conteúdos das páginas foram preenchidos (opcional, pode ser feito depois)
- [ ] Os links de navegação funcionam localmente
- [ ] O site foi testado em um navegador

## 🔗 URL Final

Após o upload, sua obra estará disponível em:

```
https://comosercatolico.github.io/biblioteca/historia-de-uma-alma/
```

## 📝 Atualizar o Index da Biblioteca

Se você tiver um arquivo `biblioteca/index.html` ou similar, adicione um link:

```html
<a href="historia-de-uma-alma/index.html">História de uma Alma - Santa Teresinha</a>
```

## ✅ Verificação Final

Após o upload, verifique:

1. Acesse: https://comosercatolico.github.io/biblioteca/historia-de-uma-alma/
2. Clique em um bloco de páginas
3. Teste a navegação entre páginas
4. Teste os atalhos de teclado (setas)
5. Verifique em mobile (responsividade)

## 🆘 Troubleshooting

### Erro: "arquivo muito grande"
- GitHub tem limite de 100MB por arquivo
- Todos os nossos arquivos são pequenos, não deve haver problema

### Erro: "caminho muito longo"
- Windows tem limite de 260 caracteres
- Use `git config core.longpaths true` para resolver

### Páginas não carregam
- Verifique se os caminhos relativos estão corretos
- Verifique se todos os arquivos foram enviados

## 📞 Suporte

Se tiver dúvidas sobre Git ou GitHub, consulte:
- https://docs.github.com/pt/repositories/working-with-files/managing-files/adding-a-file-to-a-repository
- https://git-scm.com/book/pt-br/v2

