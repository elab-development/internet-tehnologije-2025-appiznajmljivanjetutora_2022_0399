ALTER TABLE `recenzija` ADD CONSTRAINT `chk_recenzija_ocena` CHECK (`recenzija`.`ocena` BETWEEN 1 AND 5);--> statement-breakpoint
ALTER TABLE `zalba` ADD CONSTRAINT `chk_zalba_target_xor` CHECK ((
        (`zalba`.`tutor_id` IS NULL AND `zalba`.`recenzija_id` IS NOT NULL)
        OR
        (`zalba`.`tutor_id` IS NOT NULL AND `zalba`.`recenzija_id` IS NULL)
      ));