# Modelo de dados

Este documento descreve a persistencia PostgreSQL usada pela aplicacao.

## Tabelas

### usuarios

- `id`: UUID, chave primaria.
- `nome`: texto obrigatorio.
- `email`: texto obrigatorio e unico.
- `senha_hash`: texto obrigatorio.
- `tipo_usuario`: `admin`, `personal` ou `aluno`.
- `objetivo_treino`: texto opcional para alunos.
- `codigo_vinculo`: texto unico e opcional para personais.
- `criado_em` e `atualizado_em`: datas de auditoria.

### vinculos_acompanhamento

- `id`: UUID, chave primaria.
- `aluno_id`: referencia `usuarios.id`.
- `personal_id`: referencia `usuarios.id`.
- `status`: `pendente`, `ativo`, `recusado`, `cancelado` ou `encerrado`.
- `solicitado_em`, `respondido_em` e `encerrado_em`: datas do ciclo do vinculo.

Deve existir no maximo um vinculo `pendente` ou `ativo` por aluno. Manter essa tabela separada preserva o historico de acompanhamentos anteriores.

### fichas_treino

- `id`: UUID, chave primaria.
- `aluno_id`: referencia o dono da ficha.
- `personal_id`: referencia o personal criador, quando houver.
- `criada_por_id`: referencia o usuario que criou a ficha.
- `origem`: `aluno` ou `personal`.
- `status`: mantido como `ativa` para compatibilidade com a estrutura inicial.
- `nome`, `dia_semana`, `objetivo` e `observacoes`: dados do planejamento.
- `criada_em` e `atualizada_em`: datas de auditoria.

Ao excluir uma ficha, seus exercicios tambem sao removidos. Os treinos realizados continuam armazenados separadamente.

### exercicios_ficha

- `id`: UUID, chave primaria.
- `ficha_id`: referencia obrigatoria a `fichas_treino.id`; os exercicios sao removidos junto com a ficha.
- `ordem`: posicao do exercicio na ficha.
- `nome`, `grupo_muscular`, `series`, `repeticoes`, `carga`, `descanso` e `observacoes`.

### registros_treino

- `id`: UUID, chave primaria.
- `aluno_id`: referencia `usuarios.id`.
- `ficha_id`: referencia opcional a `fichas_treino.id`; recebe `NULL` quando a ficha e excluida.
- `nome_ficha`: copia do nome exibido na data do treino.
- `data_treino`, `observacoes` e `criado_em`.

### exercicios_registro

- `id`: UUID, chave primaria.
- `registro_id`: referencia `registros_treino.id`.
- `exercicio_ficha_id`: referencia opcional ao exercicio original.
- `nome`: copia do nome na data do treino.
- `series_planejadas`, `repeticoes_planejadas` e `carga_planejada`: snapshot do planejamento.
- `series_concluidas`, `repeticoes_realizadas` e `carga_utilizada`: resultado informado pelo aluno.

Os campos de snapshot sao intencionais: editar ou excluir uma ficha nunca deve modificar o historico ja registrado.

## Indices recomendados

- Indice unico em `usuarios.email`.
- Indice unico em `usuarios.codigo_vinculo`, ignorando valores nulos.
- Indices em `vinculos_acompanhamento.aluno_id` e `personal_id`.
- Indice em `fichas_treino.aluno_id` combinado com `status`.
- Indice em `registros_treino.aluno_id` combinado com `data_treino`.

## Implementacao

As migrations, os repositorios de usuarios, vinculos, fichas e registros, e a alternativa em memoria para testes ja estao implementados. A migration `002_exclusao_fisica_fichas.sql` preserva os registros ao excluir uma ficha.
