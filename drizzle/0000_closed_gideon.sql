CREATE TABLE `administrator` (
	`korisnik_id` int unsigned NOT NULL,
	CONSTRAINT `administrator_korisnik_id` PRIMARY KEY(`korisnik_id`)
);
--> statement-breakpoint
CREATE TABLE `bedz` (
	`bedz_id` int unsigned AUTO_INCREMENT NOT NULL,
	`naziv` varchar(120) NOT NULL,
	`opis` text,
	CONSTRAINT `bedz_bedz_id` PRIMARY KEY(`bedz_id`)
);
--> statement-breakpoint
CREATE TABLE `favorit` (
	`ucenik_id` int unsigned NOT NULL,
	`tutor_id` int unsigned NOT NULL,
	`datum_dodavanja` date NOT NULL,
	CONSTRAINT `ux_favorit_ucenik_tutor` UNIQUE(`ucenik_id`,`tutor_id`)
);
--> statement-breakpoint
CREATE TABLE `jezik` (
	`jezik_id` int unsigned AUTO_INCREMENT NOT NULL,
	`naziv` varchar(80) NOT NULL,
	CONSTRAINT `jezik_jezik_id` PRIMARY KEY(`jezik_id`),
	CONSTRAINT `ux_jezik_naziv` UNIQUE(`naziv`)
);
--> statement-breakpoint
CREATE TABLE `korisnik` (
	`korisnik_id` int unsigned AUTO_INCREMENT NOT NULL,
	`ime` varchar(100) NOT NULL,
	`prezime` varchar(100) NOT NULL,
	`email` varchar(190) NOT NULL,
	`lozinka` varchar(255) NOT NULL,
	`status_naloga` enum('AKTIVAN','BLOKIRAN') NOT NULL DEFAULT 'AKTIVAN',
	CONSTRAINT `korisnik_korisnik_id` PRIMARY KEY(`korisnik_id`),
	CONSTRAINT `ux_korisnik_email` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `recenzija` (
	`recenzija_id` int unsigned AUTO_INCREMENT NOT NULL,
	`rezervacija_id` int unsigned NOT NULL,
	`ocena` int NOT NULL,
	`komentar` text,
	CONSTRAINT `recenzija_recenzija_id` PRIMARY KEY(`recenzija_id`),
	CONSTRAINT `ux_recenzija_rezervacija` UNIQUE(`rezervacija_id`)
);
--> statement-breakpoint
CREATE TABLE `rezervacija` (
	`rezervacija_id` int unsigned AUTO_INCREMENT NOT NULL,
	`termin_id` int unsigned NOT NULL,
	`ucenik_id` int unsigned NOT NULL,
	`status_rezervacije` enum('AKTIVNA','OTKAZANA','ODRZANA') NOT NULL DEFAULT 'AKTIVNA',
	CONSTRAINT `rezervacija_rezervacija_id` PRIMARY KEY(`rezervacija_id`),
	CONSTRAINT `ux_rezervacija_termin` UNIQUE(`termin_id`)
);
--> statement-breakpoint
CREATE TABLE `termin` (
	`termin_id` int unsigned AUTO_INCREMENT NOT NULL,
	`tutor_id` int unsigned NOT NULL,
	`datum` date NOT NULL,
	`vreme_od` time NOT NULL,
	`vreme_do` time NOT NULL,
	`status_termina` enum('SLOBODAN','REZERVISAN','OTKAZAN') NOT NULL DEFAULT 'SLOBODAN',
	CONSTRAINT `termin_termin_id` PRIMARY KEY(`termin_id`)
);
--> statement-breakpoint
CREATE TABLE `tutor` (
	`korisnik_id` int unsigned NOT NULL,
	`biografija` text,
	`cena_po_casu` decimal(10,2) NOT NULL DEFAULT '0.00',
	`verifikovan` boolean NOT NULL DEFAULT false,
	`prosecna_ocena` decimal(3,2) NOT NULL DEFAULT '0.00',
	CONSTRAINT `tutor_korisnik_id` PRIMARY KEY(`korisnik_id`)
);
--> statement-breakpoint
CREATE TABLE `tutor_jezik` (
	`tutor_id` int unsigned NOT NULL,
	`jezik_id` int unsigned NOT NULL,
	`nivo` enum('A1','A2','B1','B2','C1','C2') NOT NULL,
	CONSTRAINT `ux_tutor_jezik` UNIQUE(`tutor_id`,`jezik_id`)
);
--> statement-breakpoint
CREATE TABLE `ucenik` (
	`korisnik_id` int unsigned NOT NULL,
	`ukupan_broj_casova` int NOT NULL DEFAULT 0,
	CONSTRAINT `ucenik_korisnik_id` PRIMARY KEY(`korisnik_id`)
);
--> statement-breakpoint
CREATE TABLE `ucenik_bedz` (
	`ucenik_id` int unsigned NOT NULL,
	`bedz_id` int unsigned NOT NULL,
	`datum_dodele` date NOT NULL,
	CONSTRAINT `ux_ucenik_bedz` UNIQUE(`ucenik_id`,`bedz_id`)
);
--> statement-breakpoint
CREATE TABLE `zalba` (
	`zalba_id` int unsigned AUTO_INCREMENT NOT NULL,
	`opis` text NOT NULL,
	`datum_podnosenja` datetime NOT NULL,
	`status_zalbe` enum('NOVA','U_OBRADI','RESENA','ODBIJENA') NOT NULL DEFAULT 'NOVA',
	`podnosilac_id` int unsigned NOT NULL,
	`obradivac_admin_id` int unsigned,
	`tutor_id` int unsigned,
	`recenzija_id` int unsigned,
	CONSTRAINT `zalba_zalba_id` PRIMARY KEY(`zalba_id`)
);
--> statement-breakpoint
ALTER TABLE `administrator` ADD CONSTRAINT `administrator_korisnik_id_korisnik_korisnik_id_fk` FOREIGN KEY (`korisnik_id`) REFERENCES `korisnik`(`korisnik_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `favorit` ADD CONSTRAINT `favorit_ucenik_id_ucenik_korisnik_id_fk` FOREIGN KEY (`ucenik_id`) REFERENCES `ucenik`(`korisnik_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `favorit` ADD CONSTRAINT `favorit_tutor_id_tutor_korisnik_id_fk` FOREIGN KEY (`tutor_id`) REFERENCES `tutor`(`korisnik_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `recenzija` ADD CONSTRAINT `recenzija_rezervacija_id_rezervacija_rezervacija_id_fk` FOREIGN KEY (`rezervacija_id`) REFERENCES `rezervacija`(`rezervacija_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rezervacija` ADD CONSTRAINT `rezervacija_termin_id_termin_termin_id_fk` FOREIGN KEY (`termin_id`) REFERENCES `termin`(`termin_id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rezervacija` ADD CONSTRAINT `rezervacija_ucenik_id_ucenik_korisnik_id_fk` FOREIGN KEY (`ucenik_id`) REFERENCES `ucenik`(`korisnik_id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `termin` ADD CONSTRAINT `termin_tutor_id_tutor_korisnik_id_fk` FOREIGN KEY (`tutor_id`) REFERENCES `tutor`(`korisnik_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tutor` ADD CONSTRAINT `tutor_korisnik_id_korisnik_korisnik_id_fk` FOREIGN KEY (`korisnik_id`) REFERENCES `korisnik`(`korisnik_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tutor_jezik` ADD CONSTRAINT `tutor_jezik_tutor_id_tutor_korisnik_id_fk` FOREIGN KEY (`tutor_id`) REFERENCES `tutor`(`korisnik_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tutor_jezik` ADD CONSTRAINT `tutor_jezik_jezik_id_jezik_jezik_id_fk` FOREIGN KEY (`jezik_id`) REFERENCES `jezik`(`jezik_id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `ucenik` ADD CONSTRAINT `ucenik_korisnik_id_korisnik_korisnik_id_fk` FOREIGN KEY (`korisnik_id`) REFERENCES `korisnik`(`korisnik_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `ucenik_bedz` ADD CONSTRAINT `ucenik_bedz_ucenik_id_ucenik_korisnik_id_fk` FOREIGN KEY (`ucenik_id`) REFERENCES `ucenik`(`korisnik_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `ucenik_bedz` ADD CONSTRAINT `ucenik_bedz_bedz_id_bedz_bedz_id_fk` FOREIGN KEY (`bedz_id`) REFERENCES `bedz`(`bedz_id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `zalba` ADD CONSTRAINT `zalba_podnosilac_id_korisnik_korisnik_id_fk` FOREIGN KEY (`podnosilac_id`) REFERENCES `korisnik`(`korisnik_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `zalba` ADD CONSTRAINT `zalba_obradivac_admin_id_administrator_korisnik_id_fk` FOREIGN KEY (`obradivac_admin_id`) REFERENCES `administrator`(`korisnik_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `zalba` ADD CONSTRAINT `zalba_tutor_id_tutor_korisnik_id_fk` FOREIGN KEY (`tutor_id`) REFERENCES `tutor`(`korisnik_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `zalba` ADD CONSTRAINT `zalba_recenzija_id_recenzija_recenzija_id_fk` FOREIGN KEY (`recenzija_id`) REFERENCES `recenzija`(`recenzija_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_favorit_tutor` ON `favorit` (`tutor_id`);--> statement-breakpoint
CREATE INDEX `idx_rezervacija_ucenik` ON `rezervacija` (`ucenik_id`);--> statement-breakpoint
CREATE INDEX `idx_termin_tutor_datum` ON `termin` (`tutor_id`,`datum`);--> statement-breakpoint
CREATE INDEX `idx_tutor_jezik_tutor` ON `tutor_jezik` (`tutor_id`);--> statement-breakpoint
CREATE INDEX `idx_tutor_jezik_jezik` ON `tutor_jezik` (`jezik_id`);--> statement-breakpoint
CREATE INDEX `idx_ucenik_bedz_bedz` ON `ucenik_bedz` (`bedz_id`);--> statement-breakpoint
CREATE INDEX `idx_zalba_podnosilac` ON `zalba` (`podnosilac_id`);--> statement-breakpoint
CREATE INDEX `idx_zalba_status` ON `zalba` (`status_zalbe`);