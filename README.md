> GitHub-Export: Beginne mit **GITHUB_START.md**. Die Sites-Hinweise unten beschreiben die bisherige Installation.

# OSCD – Onsite Control Desk

**OSCD ist ein Produkt der FB Spezialbau.** Webbasierte Facility-Management-Plattform für Gebäudeunterhalt über mehrere Kunden und Filialen. Deutsche Oberfläche, Schweizer Schreibweise. Aktueller Stand: private Entwicklungs- und Prüfversion; keine pauschale Freigabe für den produktiven Kundenbetrieb.

## Einstieg

- **Öffentliche GitHub-Pages-Adresse**: ausschliesslich die statische OSCD-Informations-Landingpage. Der Pages-Workflow liefert nur `index.html`, `landing.css`, `facility-building.png`, `404.html` und `.nojekyll` aus. Öffentliche Demo- und App-Dateien werden dort nicht mehr veröffentlicht; alte Demo-Pfade ergeben eine 404.
- **Neue, gekaufte Domain:** `oscd.ch` soll die Landingpage erhalten. **Domain-/DNS-/HTTPS-Verknüpfung ist noch nicht geprüft bzw. bestätigt.** Einrichtung siehe [`OSCD-DOMAIN.md`](OSCD-DOMAIN.md).
- **Private App**: `/dashboard` ist eine separate, geschützte Anwendung und darf erst nach Authentifizierung, Berechtigungsprüfung und Betriebsfreigabe auf dem späteren App-Host erreichbar sein.
- Die internen Browser-Demos und Programmdateien verbleiben vorerst im GitHub-Projekt zu Entwicklungs-/Testzwecken. **Da das Repository derzeit öffentlich ist, sind diese Quellen über GitHub selbst weiterhin abrufbar.** Der Pages-Dateifilter ersetzt keinen privaten Quellcode-Speicher. Für echten Code-/Kopierschutz muss die Entwicklungs-App in ein privates Repository und die öffentliche Landingpage in ein separates Marketing-Repository. Sichtbare Webseiteninhalte lassen sich technisch nicht vollständig gegen Kopieren schützen.
- Superadmin-Menü **Projektstand**: aktueller Funktionsstand, nachgewiesene Prüfungen, aufklappbarer Morgenrundgang mit erwarteten Ergebnissen und verständliche Hilfe bei typischen Fehlern.
- `PRUEFSTAND.md`: vollständiger Morgenrundgang und Ergebnisse; `BETRIEB.md`: konkrete Betriebsvorbereitung mit offenen Arbeiten und Abschlussnachweisen.

Die Website bleibt auf Sites privat. Die Landingpage ist vorbereitet, aber nicht eigenmächtig öffentlich freigegeben. Der derzeitige Login verwendet ChatGPT. Die Kunden benötigen eine aktive Zuordnung in der App **und** eine Sites-Freigabe. Eigene E-Mail-/Passwort-Konten sind noch nicht implementiert. Das ist vor einem eigenständigen Kundenstart zu lösen.

## Funktionen und Rollen

- Superadmin: Firmenprofile, Logos, Module, Filialen, Zugriffszuordnungen, alle Arbeiten, Design pro Unternehmen.
- Manager: nur eigene Firma und Filialen; gemeldete Mängel freigeben oder mit Pflichtnotiz ablehnen; Rapporte und Fotos ansehen; Filialleiter-Zuordnungen der eigenen Firma verwalten.
- Filialleiter: nur eigene Filiale; Mängel mit Titel, Beschreibung, Priorität und Fotos melden; eigene noch gemeldete Mängel bearbeiten.
- Mitarbeiter: nur ausdrücklich freigegebene Arbeiten; mit Text, positiven Stunden und optionalen Nachher-Fotos abschliessen.

Workflow: `Gemeldet → Freigegeben / Abgelehnt → Erledigt`. Freigaben erfolgen nur durch Manager, Abschlüsse nur durch Mitarbeiter. Der Superadmin darf diese Aktionen nicht stellvertretend ausführen. Benutzer und Zeitpunkte werden serverseitig protokolliert. Legacy-Status `Offen`, `Geplant`, `In Arbeit` gelten als `Gemeldet`; daraus wird keine Freigabe abgeleitet.

Auftragslisten unterstützen Suche, Status, Unternehmen (Gesamtübersicht), Filiale, Priorität und Meldezeitraum. Die Rapportübersicht zeigt tatsächlich abgeschlossene Arbeiten mit Text/Stunden, Fotos und Verlauf. Die Druckansicht kann über den Browser als PDF gespeichert werden; es gibt noch keinen serverseitigen PDF-Download. Fehlende Bilder werden vor dem Druck gemeldet. Demorapporte tragen einen deutlichen Demo-Hinweis.

Firmenbranding: Primär-/Akzent-/Hintergrund-/Textfarben, Schriftstapel, Rundungen, Hell-/Dunkelmodus, Titel, Begrüssung und Modul-Sichtbarkeit. Acht Hintergrundvorlagen; Vorschau wird erst beim ausdrücklichen Übernehmen gespeichert. CSS-Variablen bleiben auf den Unternehmensbereich begrenzt. Liquid-Glass-inspirierte Navigation, Bento-Raster, grosse Typografie und Soft-3D-Symbole berücksichtigen reduzierte Bewegung/Transparenz und erhöhten Kontrast. Apple-Skills wurden als Referenz gelesen; keine externen Skill-Pakete wurden installiert.

## Runtime und Daten

Vinext auf Sites / Cloudflare Workers. Node gemäss `package.json`. `.openai/hosting.json` bindet D1 als `DB` und R2 als `BUCKET`. Sites provisioniert diese Ressourcen beim Deployment. D1-Migrationen stehen in `drizzle/`. Angewandte Migrationen nicht ändern; neue Migrationen append-only generieren. Lokal und gehostet sind getrennte Datenbanken.

Runtime-Variable: `FACILITY_ADMIN_EMAIL` muss der E-Mail-Adresse des Plattforminhabers entsprechen. Keine Secrets in Code oder Dateien ablegen. Die signierten Identitätsheader werden vom Sites-Gateway geliefert; bei einem anderen Hoster darf der Client diese Header nie selbst setzen können. Eine eigene Authentifizierung und vertrauenswürdige Middleware sind dann erforderlich.

Daten werden aktuell als validierter, auf 4 MB begrenzter Plattform-Snapshot in `platform_state` gespeichert. `team_access` enthält rollenbezogene Zuordnungen. Jede Änderung an bestehenden Aufträgen läuft über `/api/workflow`, mit Task-Revision und atomarem Compare-and-Swap der Plattform-Revision. Allgemeine Snapshot-Schreibvorgänge können Aufgaben und Verlauf nicht verändern. Gleichzeitige Änderungen liefern 409. Browser-Caches dienen nicht als Serverautorität und sind nach Benutzer-ID getrennt. Fehler beim Speichern werden sichtbar blockiert; lokale Entwürfe können exportiert werden.

Fotos liegen in R2 unter zufällig erzeugten IDs, Metadaten im Auftrag. JPG/PNG/WebP, bis 10 MB pro Foto, fünf neue Fotos / 20 MB je Vorgang, zehn pro Meldung bzw. Rapport. Server prüft Signatur/MIME/Endung, Rollen, Grenzen und Revisionen. Bekannte Konflikte und Uploadfehler räumen bereits geschriebene Objekte auf. Nur `/api/photos` liefert Bilder nach erneuter Rollen-/Mandantenprüfung mit `private, no-store`, `nosniff` und CSP aus. Kein öffentlicher Bucketzugriff. HEIC muss als JPG exportiert werden. Bestehende Fotos werden in dieser Version nicht gelöscht oder ersetzt.

## Installation und Prüfung

Im vorhandenen Sites-Checkout die Sites-Helfer für Installation, Preview, Build, Source-Sicherung und Deployment verwenden. Abhängigkeiten anhand der mitgelieferten Lockdatei installieren. Es gibt keine mitgelieferte `.env` mit Zugangsdaten.

```sh
node tests/state-api.cjs
node tests/access.cjs
node tests/workflow.cjs
node tests/photos.cjs
node tests/team.cjs
node tests/workflow-api.cjs
node tests/browser-workflow.cjs
node node_modules/typescript/bin/tsc --noEmit
```

Framework-Skripte: `npm run dev`, `npm run build`. In der bereitgestellten Umgebung den Sites-Buildhelfer verwenden. Die echte API benötigt eine vom Gateway authentifizierte Identität; die isolierte Demo ist für die Sichtprüfung ohne echte Konten gedacht. Keine Authentifizierungsumgehung in Produktion einbauen.

Die Tests prüfen Identität, Owner-/Tenant-/Filialgrenzen, widerrufenen Zugriff, Statusrechte, Pflichtbegründungen/-stunden, Konflikte, unveränderlichen Verlauf sowie Fotos inklusive Typ-/Grössenprüfung, Bereinigung und geschützter Auslieferung. Browser-QA erfolgt separat mit Beispieldaten. Sie ersetzt keinen Test mit tatsächlich eingerichteten Kundenkonten.

## Vor Kundenbetrieb offen

1. Eigenständige E-Mail-/Passwort-Anmeldung bzw. finalen Auth-Anbieter und Hosting festlegen; öffentliche Startseite und geschützter App-Bereich sauber trennen.
2. Reale Personen/Kunden zuordnen und freigeben; jeden vollständigen Rollenablauf mit den echten Konten prüfen. Keine Einladungen oder Freigaben wurden automatisch verschickt.
3. Die neue Manager-Verwaltung eigener Filialleiter ist technisch geprüft; vor dem Kundenstart zusätzlich mit echten Manager- und Filialleiter-Konten testen.
4. Daten-/Dateisicherung, Wiederherstellung, Aufbewahrung, Löschkonzept und Betriebsüberwachung festlegen und praktisch testen.
5. Relationale Aufgaben-/Rapporttabellen statt des Snapshot-Modells für grössere Datenmengen und Parallelität vorsehen.
6. Externe E-Mail-/Push-Benachrichtigungen, wiederkehrende Wartungen und Dokumentenablage sind spätere Module; interne App-Benachrichtigungen sind bereits als eigenes Modul vorhanden. Modulschalter sind keine Behauptung, dass alle späteren Module bereits umgesetzt sind. Modulschalter sind keine Behauptung, dass alle späteren Module bereits umgesetzt sind.
7. Provider-HTTPS ist vorhanden; die umfassende Produktionsprüfung von Security-Headern, Rate-Limits und eigenständigem Login steht mit dem finalen Hosting/Auth-Aufbau noch aus.

GitHub kann den Code versionieren, betreibt allein aber keine Datenbank-/Datei-/Auth-Plattform. Bei eigenem Cloudflare-Hosting müssen D1/R2 und Auth eingerichtet sowie Daten und Bilder migriert werden. Die aktuelle Website bleibt privat, bis der Inhaber eine Änderung der Freigabe ausdrücklich veranlasst.

## Weiterarbeit

`NACHTARBEIT.md` enthält die priorisierte Fortsetzung für genehmigte Hintergrundläufe und den aktuellen Prüfstand. Keine Secrets dort speichern. Jede Veröffentlichung muss auf dem exakt gesicherten, gebauten Quellstand basieren.

## Verwaltung eigener Filialleiter durch Manager

Manager erhalten im Unternehmensbereich das Register **Filialleiter** (mobil **Team**). Sie können Name, E-Mail und Filiale für die Rolle `branch` ihrer eigenen Firma erfassen/ändern sowie diese Zuordnungen aktivieren/deaktivieren. Sie sehen ausschliesslich entsprechende Einträge. Rollen- und Firmenauswahl sind in diesem Formular nicht verfügbar. Die App-Zuordnung erstellt kein Passwort, verschickt keine Einladung und verändert keine private Sites-Freigabe.

`/api/team` prüft aktive Manager-Zuordnungen sowie die Existenz des zugewiesenen Unternehmens. Bei Änderungen werden die gespeicherte Zielzuordnung und die gewünschten Daten getrennt geprüft. Schreibabfragen begrenzen die bestehende Zielrolle/-firma und überprüfen im selben SQL-Statement die weiterhin aktive Manager-Zuordnung inklusive Revision und den Stand der Firmendaten. Fremde Firmen, andere Plattforminhaber und bestehende Manager-/Mitarbeiter-Zuordnungen sind nicht delegiert bearbeitbar. Konflikte und gleichzeitig kollidierende E-Mail-Adressen liefern 409. Die umfassenden Superadmin-Funktionen bleiben erhalten.

`tests/team.cjs` führt die tatsächlichen SQL-Abfragen gegen eine isolierte SQLite-In-Memory-Datenbank aus: eigene Filialleiter lesen/anlegen/bearbeiten/aktivieren/deaktivieren, Privilegien-/Mandantengrenzen, bestehende Zielrollen, widerrufene/entfernte Zuordnungen, veraltete Revisionen, Berechtigungs-/Zielrollen-/Daten-Rennen, E-Mail-Kollisionen sowie unveränderte Owner-Verwaltung. Keine echten Zuordnungen werden für diese Tests angelegt. Die interaktive Demo simuliert diese Funktion mit getrennten lokalen Demo-Zuordnungen.

## Fehler-/Sicherheitsprüfung vom 31.10.2026

- Der Statusworkflow überprüft beim atomaren SQL-Schreiben dieselbe aktive Zugangszuordnung (ID, Inhaber, E-Mail, Rolle, Firma, Filiale und Revision). Ein Entzug oder Wechsel während der Verarbeitung, auch während eines Foto-Uploads, verhindert den Schreibvorgang mit 409.
- Offene Bearbeitungs-/Entscheidungsformulare behalten die tatsächlich angezeigte Auftragsrevision. Zwischenzeitliche Änderungen werden nicht unbemerkt übernommen; ein neuer Dialog wird durch ein verspätetes Ergebnis nicht geschlossen.
- Bei einem Datenbankfehler wird der aktuelle Stand vor einer Foto-Bereinigung nachgelesen. Bereits referenzierte Fotos bleiben erhalten, auch wenn nur die Speicherantwort verloren ging. Ist das Ergebnis nicht feststellbar, bleiben möglicherweise unreferenzierte neue Objekte zur späteren Bereinigung erhalten. Automatisierte Abgleich-/Bereinigungsjobs fehlen noch. Vor einem erneuten Absenden nach 503 müssen die Daten aktualisiert und geprüft werden.
- Die Demo verwendet die gleichen reinen Statusregeln wie der Server. `scripts/demo-workflow.cjs` erzeugt `public/demo-workflow.js` aus `app/workflow.ts`, automatisch vor `dev` und `build`; der Regressionstest prüft den exakten Gleichstand. Die Demo schreibt ausschliesslich in ihre lokalen Demo-Speicher. Musterhinweis in Druckrapporten bleibt sichtbar.
- `tests/workflow-api.cjs` verwendet echtes SQLite für den Statuszyklus und Schreibzeit-Berechtigungsrennen. `tests/browser-workflow.cjs` prüft den Demo-Adapter sowie die Formularrevisionen in isolierten JavaScript-Kontexten; dies ist kein Ersatz für Browser- oder echte Kontentests.

Der vorhandene Filterablauf wurde durchgesehen; die Gesamtübersicht normalisiert ältere Statuswerte bereits über `allWork()`. Eine vollständige externe Sicherheitsprüfung, Lastprüfung, eigenständige Anmeldung und Betriebssicherung wurden damit nicht erledigt.

## Kundenbereich und Managerzugriff

Ein Manager ist genau einem Unternehmen zugeordnet (`company_id`) und sieht alle Filialen, Mängel und Rapporte dieser Firma. Die State-API liefert keine anderen Unternehmen. Nach der Anmeldung unter `/dashboard` öffnet sich unmittelbar das zugeordnete Firmendashboard. Die Kundennavigation enthält Dashboard, Filialen, Arbeiten aller Filialen, Rapporte und Filialleiter gemäss aktivierten Modulen. Es gibt keine Unternehmensauswahl oder Rückkehr in die Plattformverwaltung. Der Filialfilter begrenzt die Arbeitsliste bei Bedarf auf einen Standort. Superadmin und ausführende Mitarbeiter behalten ihre übergreifenden Ansichten.

## Einheitliche Gebäudeakte für Manager

Im Manager-Kundenportal sind **Projektstand** und **Gebäudeakte** zu einer einzigen Navigation **Gebäudeakte** zusammengefasst. Sie führt die Projekt-/Filialübersicht, aggregierte Kennzahlen (offen, erledigt, Rapportstunden), chronologische Statusänderungen, Abschlussrapporte, Vorher-/Nachher-Fotovorschau, Suche sowie Filter zusammen. Der Standortfilter unterstützt eine einzelne Filiale oder alle Filialen der zugeordneten Firma. Standortbezogene Kontakt- und Zutrittshinweise bleiben verfügbar.

Die Projekt-/Filialkarten im Dashboard verlinken direkt auf die jeweilige Gebäudeakte; «Alle Gebäudeakten ansehen» öffnet die Gesamtübersicht. Die bisherigen Daten bleiben in den zentral gespeicherten Aufträgen und Rapporten, es entsteht **keine zweite Datenhaltung**. Die bestehenden serverseitigen Rollen-/Mandantenrechte und Workflows werden nicht geändert.

Der getrennte **Superadmin-Projektstand** ist ein internes Entwicklungs-/Prüfmodul und keine zweite Kunden-Gebäudeakte.

## Ausführungsteam

Mitarbeiter gehören zum ausführenden Bauunternehmen und starten in einer eigenen kundenübergreifenden Einsatzübersicht. Sie sehen freigegebene Arbeiten aller Kunden und das Archiv erledigter Arbeiten samt Rapporten, Stunden, Vorher-/Nachher-Fotos und Druckansicht. Ungeprüfte oder abgelehnte Meldungen bleiben ausgeschlossen. Filter: Kunde, Filiale, Priorität, Suche und Ansichten für offene/ausgeführte Arbeiten bzw. Rapporte. Abschliessen bleibt ausschliesslich bei freigegebenen Arbeiten möglich; erledigte Rapporte sind lesbar, aber nicht erneut abschliessbar. Kundendesign und Unternehmensverwaltung werden in dieser Ansicht nicht übernommen.

## Mitarbeiter-Einsatzkarte

Unter «Einsatzkarte» werden die gefilterten Arbeiten nach Kunde und Filiale gruppiert. Standardmässig zeigt die Karte zu erledigende Arbeiten; ausgeführte bzw. alle Arbeiten sind auswählbar. Die Auswahl einer Filiale öffnet ihre Adresse in einer eingebetteten Google-Karte. Unterhalb stehen ihre Arbeiten und Zutrittshinweise. Auf jeder Einsatzkarte führen «Auf Karte» in diese Ansicht und «Route planen» zur Google-Maps-Routenplanung ohne vorgegebenen Startpunkt. Es werden nur Standortadressen an Google übermittelt, keine Auftragstexte oder Rapporte.

Ohne Strasse zeigt die Karte ausdrücklich nur das Ortsgebiet; ohne Ort und PLZ wird keine Position geschätzt und kein Kartenabruf gestartet. Die Filialadresse wird durch die Plattformverwaltung gepflegt. Ein Link zu Google Maps dient als Alternative, wenn Einbettungen im Browser blockiert sind. Keine API-Schlüssel oder neue Datenbankfelder erforderlich.

## Vereinfachter Filialbereich

Filialleitungen sehen ausschliesslich «Meine Filiale» und «Meine Mängel». Das Dashboard benennt den konkreten Standort und bietet «Mangel melden», Statuszahlen und die Dokumentation der Meldungen. Unternehmensübersichten, Standortverwaltung, separate Rapportübersicht und Teamverwaltung gehören nicht zu dieser Ansicht. Das Meldeformular fragt Titel, Beschreibung, Priorität und Fotos ab; Firma und Filiale werden aus der Zuordnung übernommen, Termin-/Personalplanung wird nicht abgefragt. Bestehende serverseitige Filialrechte und Managerfreigaben bleiben unverändert. Eine fehlende Filialzuordnung führt zu einem Hinweis statt zum Ausweichen auf einen anderen Standort.

## Auftraggeber-Manager und Produktzuordnung

Der Manager überblickt und kontrolliert die Unterhaltsarbeiten der eigenen Firma. Er prüft Meldungen, gibt sie frei oder lehnt sie mit Begründung ab und bestätigt Ausführungstermine freigegebener Arbeiten. Das Melden oder allgemeine Bearbeiten von Mängeln ist für Manager auch serverseitig gesperrt. Die Terminfreigabe schreibt Datum, Benutzer und Zeitpunkt in den Verlauf, erhöht die Auftragsrevision und ändert den Arbeitsstatus nicht. Sie ist keine automatische Einsatzplanung oder Benachrichtigung.

Die Plattform trägt auf Startseite und Anwendungsseiten den Hinweis «Facility Management – ein Produkt der Firma F&B Spezialbau». Die Fortschrittsanzeige heisst «Stand der Unterhaltsarbeiten».


## Erweiterung 02.11.2026 · Gebäudeakte, Einsatzplanung, Kundenchat

**Digitale Gebäudeakte:** Im Kundenmanager und Superadmin unter «Gebäudeakte». Jede Filiale besitzt ihre chronologisch geordnete Geschichte, die aus den protokollierten Statusänderungen der bestehenden Aufträge entsteht. Die Ansicht zeigt erledigte Arbeiten, offene Aufträge, Stunden, vorhandene Bilder und Links auf echte Rapporte. Es gibt keine doppelte manuelle Erfassung; alte Aufträge ohne History sind als unvollständige Bestandsdaten gekennzeichnet. Kosten werden ohne echte Preis-/Materialdaten ausdrücklich nicht erfunden.

**Mitarbeiter-Tages- und Wochenplanung:** Menüeinträge «Mein Tag» und «Wochenplan» sowie die direkte Tagesübersicht auf dem Einsatzdashboard. Der Manager kann bei «Termin freigeben» ein Datum, eine optionale Startzeit und eine geschätzte Dauer (15–720 Minuten) erfassen. Die Angabe ist Bestandteil der Aufgabe und damit sofort beim ausführenden Team sichtbar. Es findet keine automatische Mitarbeiterzuteilung oder Kalender-Synchronisierung statt; Zuständigkeit bleibt wie bisher ein Freitextfeld.

**Kundenchat:** «Kundenchat» ist eine direkte, getrennte Unterhaltung zwischen dem Manager eines Unternehmens und der F&B-Plattformverwaltung. Ein optionaler Bezug zu einem Auftrag ist möglich. Nachrichten und Autoren werden serverseitig gespeichert, niemals aus beliebigen Clientfeldern übernommen. Filialleiter und Mitarbeiter haben keinen Zugriff. Die D1-Migration `0002_customer_messages.sql` muss vor Nutzung eingespielt werden. Die API liegt unter `/api/chat`; das Frontend lädt die letzten 500 Nachrichten nach Abruf. Es gibt keine externen Push-/E-Mail-Benachrichtigungen und keine dauerhafte WebSocket-Verbindung. Stattdessen werden neue Nachrichten in der App-Benachrichtigungsglocke angezeigt; der Verlauf selbst kann weiterhin mit «Aktualisieren» geladen werden.

**Demo:** Die neuen Module sind im vorhandenen `/demo.html` mit getrennten, lokalen Demo-Nachrichten verfügbar. Änderungen der Demo gelangen niemals zu Live-Kunden. Der Kundenchat ist erst nach erfolgter Migration in der echten Site einsatzbereit. In der produktiven Site bleiben Login, Mandantenfreigabe, Backups und Security-Audit vor Kundeneinführung Voraussetzung.

**Tests:** `NODE_PATH=$(npm root -g) node tests/new-modules.cjs` prüft Chat-Mandantengrenzen, Eingabevalidierung, Zeitplanung und Gebäudeakte. `npm test` führt diesen Test zusammen mit den bestehenden Regressionstests aus. Vor produktivem Einsatz sind ein E2E-Browsertest und ein Test mit realen Berechtigungen auf dem finalen Hosting erforderlich.


## Erweiterung 03.11.2026 · Automatische Benachrichtigungen

**Benachrichtigungsglocke:** Alle aktiven Rollen erhalten oben rechts einen Posteingang mit Anzahl ungelesener Meldungen, einer Liste, Datum/Uhrzeit und Schnellzugriff auf Auftrag oder Kundenchat. Abruf beim Öffnen und anschliessend ca. alle 45 Sekunden, solange die Seite sichtbar ist. Einzeln oder gesammelt als gelesen markieren. In der isolierten `/demo.html` wird dies vollständig lokal simuliert und verändert keine Live-Daten.

**Auslöser:** Neue/aktualisierte Mängel, Freigaben, Ablehnungen, bestätigte Einsatztermine, Abschlussrapporte sowie Chatnachrichten. Das Backend erzeugt Nachrichten erst nach einem erfolgreichen Speichern. Empfänger werden ausschliesslich serverseitig anhand aktiver Teamrechte ausgewählt: Kundenmanager nur für ihre Firma, Filialleiter nur für ihre Filiale, Ausführungsteam für freigegebene Einsätze (bei exakter Mitarbeiterzuordnung nur der zugewiesene Mitarbeiter), Superadmin für neue Meldungen/Abschlüsse und Kundennachrichten. Nachrichtenersteller erhalten keine Selbstbenachrichtigung.

**Datenschutz:** `/api/notifications` authentifiziert jede Anfrage; GET und PATCH filtern nach Inhaber, empfangender E-Mail und (für Manager/Filialleiter) Unternehmens-/Filialzuordnung. PATCH verwendet Origin- und grant-Revision-Prüfung. Inhalte werden HTML-escaped, Nachrichten serverseitig gespeichert. Es werden **keine** E-Mails oder nativen iPad-Push-Mitteilungen versendet. Ein Versandkanal und Benachrichtigungspräferenzen wären ein späterer Ausbau.

**Deployment:** Die neue, additive D1-Migration `drizzle/0003_notifications.sql` ist auf der Zielumgebung einzuspielen, bevor das Modul live genutzt wird. Bestehende Migrationen nicht zurücksetzen oder bearbeiten. Eine automatische nachträgliche Benachrichtigung für historische Aufträge wird nicht erzeugt. Bei Fehlern der Benachrichtigungsablage bleibt ein zuvor korrekt gespeicherter Auftrag bzw. Chat erhalten; für garantierte Eventzustellung wäre später eine transaktionale Outbox sinnvoll.

**Tests:** `tests/notifications.cjs` prüft Routing, Datenschutz zwischen Kunden/Filialen, persönliche Einsatzzuweisung, ungelesen/Gelesen, Rechtewechsel und Fehlzugriffe. `npm test` führt alle Tests aus. Ein finaler Browser-/Hosting-Integrationstest ist vor der Kundeneinführung noch erforderlich.
