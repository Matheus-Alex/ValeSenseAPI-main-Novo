# Proximos passos para executar o ValeSense

**Atualizado:** 09/10/2026

## Situacao atual

- O backend foi adaptado para MongoDB usando Prisma. O schema usa `ObjectId` e o comando de sincronizacao e `npm run db:push`.
- Validacoes de IDs da API foram alinhadas ao formato MongoDB (`ObjectId` hexadecimal de 24 caracteres); `npm run db:validate` foi adicionado para conferir futuras alteracoes do schema.
- O arquivo `FrontEnd/.env.example` ja contem uma URL local de exemplo. O `.env` local ainda precisa ser conferido e atualizado: ele foi configurado originalmente para PostgreSQL e pode conter `SUA_SENHA_DO_POSTGRES`.
- O MongoDB ainda nao foi confirmado como instalado ou configurado como replica set. A API usa transacoes na redefinicao de senha, portanto essa configuracao e obrigatoria.
- Dependencias instaladas, schema Prisma validado, Prisma Client gerado e `npm run check` aprovado apos a adaptacao.
- `db:push`, inicializacao da API e teste de `/health` ainda nao foram executados contra um MongoDB.
- O PostgreSQL local continua intacto. Nenhuma migration foi executada e nenhum dado foi convertido.

## O que fazer agora

1. Instale/inicie MongoDB Community localmente ou crie um cluster MongoDB Atlas. Para uso local, configure o servidor como replica set com o nome `rs0`; depois abra `mongosh` e execute `rs.initiate()` uma vez. Confirme que `rs.status()` mostra o membro como `PRIMARY`. Atlas ja oferece replica set.
2. No arquivo `.env` que fica na mesma pasta de `package.json` (`FrontEnd`), substitua a antiga `DATABASE_URL` do PostgreSQL pela URL MongoDB. Para uma instalacao local configurada como `rs0`, use:

	```env
	DATABASE_URL=mongodb://localhost:27017/valesense_pi?replicaSet=rs0
	```

	Para Atlas, use a URI fornecida pelo Atlas. Mantenha o `JWT_SECRET` existente. Nao compartilhe o `.env` nem coloque credenciais no frontend.
3. Abra um terminal na pasta `FrontEnd` e sincronize o schema. O banco `valesense_pi` e as collections serao criados se ainda nao existirem:

	```powershell
	npm run db:generate
	npm run db:push
	npm run check
	```

4. Inicie a API:

	```powershell
	npm run dev
	```

5. Abra `http://localhost:3333/health`. O esperado e HTTP 200 com `{"status":"ok","database":"connected"}`. Depois sirva a pasta `FrontEnd` com Live Server e teste cadastro/login. Se o health check falhar, confira a URI, se o MongoDB esta ativo e se o replica set esta em estado `PRIMARY`.

## Importante sobre os dados antigos

Nao execute `npm run db:deploy`, `prisma migrate` nem `banco.sql` contra o MongoDB: esses arquivos pertencem a configuracao PostgreSQL anterior. `db:push` configura o schema MongoDB, mas nao converte nem copia os dados PostgreSQL. Se precisar manter os dados antigos, pare antes do passo 3, faca backup do PostgreSQL e planeje uma exportacao, conversao de UUIDs para `ObjectId` e importacao separada.

O administrador inicial e opcional. Se quiser cria-lo no primeiro inicio, defina `ADMIN_NAME`, `ADMIN_EMAIL` e `ADMIN_PASSWORD` no `.env` usando valores reais e uma senha forte.

## Como alterar o banco futuramente

1. Faça a alteracao desejada em `FrontEnd/prisma/schema.prisma`. Para IDs e chaves estrangeiras MongoDB, mantenha campos `String @db.ObjectId` e relacoes `@relation` com referencias compatíveis. Use tipos aceitos pelo connector MongoDB; neste projeto valores numericos estao como `Float`.
2. Atualize juntos os validadores Zod, os tipos/rotas da API e as telas que leem ou enviam o campo. Para IDs, reutilize `src/lib/ids.ts` em vez de validar como UUID.
3. Valide e regenere o cliente antes de sincronizar:

	```powershell
	npm run db:validate
	npm run db:generate
	npm run check
	npm run build
	```

4. Em desenvolvimento, confirme que `DATABASE_URL` aponta para a base correta, faça backup se houver dados e só então execute `npm run db:push`. Revise o resultado e teste a API.
5. Para remover ou renomear campos, ou mudar o formato de IDs, planeje e teste um script de conversao de dados separado. `db:push` nao e um historico de migrations nem um mecanismo de rollback; nao o execute em uma base com dados importantes sem backup e revisao do impacto.

O banco local ainda nao foi criado/sincronizado neste ambiente porque a conexao MongoDB e o replica set nao foram confirmados. O arquivo `.env` local nao foi alterado nem suas credenciais presumidas.

## Validacoes e observacoes

- Node.js v24.21.0 e npm 11.19.0 estavam disponiveis; `npm ci` instalou 141 pacotes.
- `npx prisma validate`, `npm run db:generate` e `npm run check` passaram com a configuracao MongoDB.
- `npm run build` havia passado antes da adaptacao; nao foi repetido depois dela.
- A auditoria do npm reportou 3 vulnerabilidades altas na cadeia de ferramentas Prisma (`prisma` -> `@prisma/config` -> `deepmerge-ts`). A atualizacao nao foi aplicada.
- Os antigos campos `Decimal` foram convertidos para `Float`, pois o connector MongoDB do Prisma nao oferece `Decimal`. Valores numericos podem nao manter precisao decimal exata.
