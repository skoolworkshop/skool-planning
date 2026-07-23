-- Migratie bij de opschoning van juli 2026.
-- Draai dit ÉÉN KEER op de productiedatabase VOORDAT de nieuwe code live gaat.
-- Maak eerst een back-up. Bij Neon kan dat met een branch of een pg_dump.
--
-- Geraakte tabellen:
--   TeacherProfile      bio verwijderd, doelgroepen omgezet, tariefvelden erbij
--   TeacherWorkshopSkill niveau en zelfstandig vervangen door bevoegdheid
--   Assignment          reserve en bevestiging verwijderd
--   Application         status RESERVELIJST en BEVESTIGD omgezet
--   TeacherDocument     vervaldatum van VOG leeggemaakt
--   Client              doelgroep omgezet naar een vaste lijst
--   WorkshopSession     doelgroep omgezet naar een vaste lijst
--   Workshop            afbeeldingsvelden erbij
--
-- Rollback: zet de back-up terug. De verwijderde kolommen zijn niet terug te rekenen.

BEGIN;

-- 1. Aanmeldingen die op de reservelijst stonden gelden als afgewezen.
UPDATE "Application" SET status = 'AFGEWEZEN' WHERE status::text = 'RESERVELIJST';

-- 2. Bevestigde aanmeldingen worden gewoon toegewezen.
UPDATE "Application" SET status = 'GESELECTEERD' WHERE status::text = 'BEVESTIGD';

-- 3. Reservetoewijzingen bestaan niet meer. Ze worden verwijderd,
--    want ze bezetten geen echte plek.
DELETE FROM "Assignment" WHERE "reserve" = true;

-- 4. Een VOG heeft geen verloopdatum meer. Het document zelf blijft staan.
UPDATE "TeacherDocument" SET "vervaldatum" = NULL WHERE "type" = 'VOG';
UPDATE "TeacherDocument" SET "status" = 'GOEDGEKEURD'
  WHERE "type" = 'VOG' AND "status"::text = 'VERLOPEN';

-- 5. Zelfbeoordeling wordt een beheerstatus.
--    Niveau 1 was beginner, die mag voortaan assisteren.
--    De kolom bevoegdheid wordt door prisma db push aangemaakt met standaard ZELFSTANDIG.
--    Draai de regel hieronder NA de db push.
-- UPDATE "TeacherWorkshopSkill" SET "bevoegdheid" = 'ASSISTEREN' WHERE "niveau" = 1;

COMMIT;

-- 6. Doelgroepen omzetten van vrije tekst naar vaste waarden.
--    Dit gebeurt in de applicatie via /api/migratie, omdat de herkenning
--    daar in TypeScript staat en een rapport oplevert van wat niet lukte.
