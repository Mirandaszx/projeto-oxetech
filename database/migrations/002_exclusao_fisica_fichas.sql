ALTER TABLE registros_treino
    DROP CONSTRAINT IF EXISTS registros_treino_ficha_id_fkey;

ALTER TABLE registros_treino
    ALTER COLUMN ficha_id DROP NOT NULL;

ALTER TABLE registros_treino
    ADD CONSTRAINT registros_treino_ficha_id_fkey
    FOREIGN KEY (ficha_id)
    REFERENCES fichas_treino(id)
    ON DELETE SET NULL;

-- Remove fichas arquivadas pela versao anterior sem apagar os registros realizados.
DELETE FROM fichas_treino
WHERE status = 'arquivada';
