CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    tipo_usuario VARCHAR(20) NOT NULL
        CHECK (tipo_usuario IN ('admin', 'personal', 'aluno')),
    objetivo_treino VARCHAR(120),
    codigo_vinculo VARCHAR(20) UNIQUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vinculos_acompanhamento (
    id UUID PRIMARY KEY,
    aluno_id UUID NOT NULL REFERENCES usuarios(id),
    personal_id UUID NOT NULL REFERENCES usuarios(id),
    status VARCHAR(20) NOT NULL
        CHECK (status IN ('pendente', 'ativo', 'recusado', 'cancelado', 'encerrado')),
    solicitado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    respondido_em TIMESTAMPTZ,
    encerrado_em TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS vinculo_atual_unico_por_aluno
    ON vinculos_acompanhamento (aluno_id)
    WHERE status IN ('pendente', 'ativo');

CREATE INDEX IF NOT EXISTS vinculos_por_personal_status
    ON vinculos_acompanhamento (personal_id, status);

CREATE TABLE IF NOT EXISTS fichas_treino (
    id UUID PRIMARY KEY,
    aluno_id UUID NOT NULL REFERENCES usuarios(id),
    personal_id UUID REFERENCES usuarios(id),
    criada_por_id UUID NOT NULL REFERENCES usuarios(id),
    origem VARCHAR(20) NOT NULL CHECK (origem IN ('aluno', 'personal')),
    status VARCHAR(20) NOT NULL DEFAULT 'ativa'
        CHECK (status IN ('ativa', 'arquivada')),
    nome VARCHAR(80) NOT NULL,
    dia_semana VARCHAR(20) NOT NULL
        CHECK (dia_semana IN ('Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado', 'Domingo')),
    objetivo VARCHAR(120),
    observacoes VARCHAR(500),
    criada_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizada_em TIMESTAMPTZ,
    atualizada_por_id UUID REFERENCES usuarios(id),
    atualizada_por_tipo VARCHAR(20)
        CHECK (atualizada_por_tipo IN ('personal', 'aluno')),
    arquivada_em TIMESTAMPTZ,
    arquivada_por_id UUID REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS fichas_por_aluno_status
    ON fichas_treino (aluno_id, status);

CREATE INDEX IF NOT EXISTS fichas_por_personal
    ON fichas_treino (personal_id);

CREATE TABLE IF NOT EXISTS exercicios_ficha (
    id UUID PRIMARY KEY,
    ficha_id UUID NOT NULL REFERENCES fichas_treino(id) ON DELETE CASCADE,
    ordem SMALLINT NOT NULL CHECK (ordem > 0),
    nome VARCHAR(100) NOT NULL,
    grupo_muscular VARCHAR(60) NOT NULL,
    series SMALLINT NOT NULL CHECK (series > 0),
    repeticoes SMALLINT NOT NULL CHECK (repeticoes > 0),
    carga VARCHAR(40),
    descanso VARCHAR(40),
    observacoes VARCHAR(300),
    UNIQUE (ficha_id, ordem)
);

CREATE TABLE IF NOT EXISTS registros_treino (
    id UUID PRIMARY KEY,
    aluno_id UUID NOT NULL REFERENCES usuarios(id),
    ficha_id UUID NOT NULL REFERENCES fichas_treino(id),
    nome_ficha VARCHAR(80) NOT NULL,
    data_treino DATE NOT NULL,
    observacoes VARCHAR(500),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS registros_por_aluno_data
    ON registros_treino (aluno_id, data_treino DESC, criado_em DESC);

CREATE TABLE IF NOT EXISTS exercicios_registro (
    id UUID PRIMARY KEY,
    registro_id UUID NOT NULL REFERENCES registros_treino(id) ON DELETE CASCADE,
    exercicio_ficha_id UUID REFERENCES exercicios_ficha(id) ON DELETE SET NULL,
    ordem SMALLINT NOT NULL CHECK (ordem > 0),
    nome VARCHAR(100) NOT NULL,
    series_planejadas VARCHAR(20) NOT NULL,
    repeticoes_planejadas VARCHAR(40) NOT NULL,
    carga_planejada VARCHAR(40),
    series_concluidas VARCHAR(20) NOT NULL,
    repeticoes_realizadas VARCHAR(40) NOT NULL,
    carga_utilizada VARCHAR(40),
    UNIQUE (registro_id, ordem)
);
