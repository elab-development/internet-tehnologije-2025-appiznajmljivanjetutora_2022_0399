CREATE TABLE `zahtev_verifikacije` (
	`zahtev_id` int unsigned AUTO_INCREMENT NOT NULL,
	`tutor_id` int unsigned NOT NULL,
	`admin_id` int unsigned,
	`status_zahteva` enum('NOV','ODOBREN','ODBIJEN') NOT NULL DEFAULT 'NOV',
	`datum_podnosenja` datetime NOT NULL,
	`datum_odluke` datetime,
	`dokument_url` varchar(255) NOT NULL,
	CONSTRAINT `zahtev_verifikacije_zahtev_id` PRIMARY KEY(`zahtev_id`)
);
--> statement-breakpoint
ALTER TABLE `zahtev_verifikacije` ADD CONSTRAINT `zahtev_verifikacije_tutor_id_tutor_korisnik_id_fk` FOREIGN KEY (`tutor_id`) REFERENCES `tutor`(`korisnik_id`) ON DELETE cascade ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE `zahtev_verifikacije` ADD CONSTRAINT `zahtev_verifikacije_admin_id_administrator_korisnik_id_fk` FOREIGN KEY (`admin_id`) REFERENCES `administrator`(`korisnik_id`) ON DELETE set null ON UPDATE cascade;
--> statement-breakpoint
CREATE INDEX `idx_zahtev_verif_tutor` ON `zahtev_verifikacije` (`tutor_id`);
--> statement-breakpoint
CREATE INDEX `idx_zahtev_verif_status` ON `zahtev_verifikacije` (`status_zahteva`);
