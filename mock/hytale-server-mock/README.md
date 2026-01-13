# Mock Hytale Server Bundle

Este é um bundle **MOCK** do servidor Hytale criado para testar o HyController.

## ⚠️ IMPORTANTE

O jogo Hytale ainda **NÃO FOI LANÇADO**. Estes arquivos são apenas simulações
para permitir testar as funcionalidades do painel de controle.

## Arquivos incluídos

- `HytaleServer.jar` - JAR mock (não executável)
- `Assets.zip` - Assets simulados
- `HytaleServer.aot` - Arquivo AOT simulado

## Como usar com HyController

1. Crie um ZIP com todos os arquivos:
   ```bash
   ./create-bundle.sh
   ```

2. No HyController, vá em Dashboard > Create Server

3. Faça upload do arquivo `hytale-server-bundle.zip`

4. Configure o servidor (nome, memória, etc)

5. Clique em Create

## Nota sobre execução

Como este é um mock, o "servidor" não irá realmente executar nada.
O HyController irá tentar executar `java -jar HytaleServer.jar`, mas
como não há código real, o processo terminará imediatamente.

Isso ainda permite testar:
- ✅ Upload de arquivos
- ✅ Gerenciamento de arquivos
- ✅ Criação e exclusão de servidores
- ✅ Interface do console (mesmo que vazia)
- ✅ Visualização de logs

Para testar funcionalidades reais de execução, aguarde o lançamento
oficial do Hytale.
