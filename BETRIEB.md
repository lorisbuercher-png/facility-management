# Betriebsvorbereitung · Facility Management

Stand: 31. Oktober 2026. Dies ist eine konkrete Vorbereitung für die private Prüfversion, keine bestätigte Betriebsfreigabe. Keine der unten offenen Betriebsarbeiten wurde als erledigt vorausgesetzt.

## Derzeitiger Aufbau

- Bestehender privater Site: https://facility-zentrale-loris.lorisbuercher.chatgpt.site
- `/` erklärt den Mehrwert; `/dashboard` lädt die App; `/demo.html` simuliert Rollen mit lokalen Beispieldaten.
- Vinext / Cloudflare Workers, D1-Bindung `DB` und R2-Bindung `BUCKET`.
- `platform_state`: validierter Snapshot je Plattforminhaber, aktuell maximal 4 MB. `team_access`: Rollen-/Firmen-/Filialzuordnungen.
- Fotos in R2; Metadaten und Verlauf im Snapshot. Fotozugriff erfolgt über `/api/photos` nach serverseitiger Berechtigungsprüfung.
- Aktuelle Anmeldung: ChatGPT über Sites. Die App-Zuordnung und die private Website-Freigabe sind zwei getrennte Voraussetzungen. Manager ändern keine Website-Freigaben.
- `FACILITY_ADMIN_EMAIL` ist eine Runtime-Konfiguration. Nicht in Dokumentation, Screenshots oder Quellcode durch Zugangsdaten ersetzen. Der Authentifizierungsaufbau vertraut den vom Sites-Gateway gesetzten Identitätsheadern.

## Vor dem ersten echten Kunden erforderlich

| Punkt | Konkrete Arbeit | Nachweis für Abschluss | Status |
| --- | --- | --- | --- |
| Authentifizierung | Eigene E-Mail-/Passwort-Anmeldung oder finalen Anbieter festlegen; Sitzung, Abmeldung, Wiederherstellung und Missbrauchsschutz umsetzen | Vollständiger Kontentest inklusive ungültigem/abgelaufenem Zugriff | Offen |
| Öffentliche Startseite | Öffentlichen Mehrwert-Einstieg und geschützte App sauber trennen; Publikum ausdrücklich durch Inhaber festlegen | Anonyme Person erreicht nur erlaubte Inhalte, keine Kundendaten | Offen; aktuelle Freigabe bleibt privat |
| Rollen / Mandanten | Freigegebene Testkonten für zwei Testfirmen, Manager, Filialleiter und Mitarbeiter verwenden | Firma A erreicht weder Daten noch Fotos von Firma B; Widerruf blockiert weitere Serverzugriffe | Technische Tests bestanden; echte Kontentests offen |
| Geräte / Dateien | Kamera-Upload und JPG/PNG/WebP auf den vorgesehenen Handys prüfen; PDF über Druckdialog als Datei speichern und öffnen | Lesbarer Rapport, richtige Fotos/Stunden/Verlauf, verständliche Fehlermeldungen | Demo-Druckansicht geprüft; echte Geräte-/Dateitests offen |
| Backup / Wiederherstellung | D1 und R2 inklusive Zuordnung gemeinsam sichern, Zugriff und Aufbewahrung festlegen, in separater Umgebung wiederherstellen | Daten, Rollen, Historie und Fotos nach Wiederherstellung vollständig und zugriffsgeschützt | Offen |
| Überwachung / Vorfälle | Zuständigkeit, Fehlersichtung, Reaktion und Wiederanlauf dokumentieren; keine Inhalte/Secrets in öffentliche Logs geben | Probevorfall mit nachvollziehbarer Diagnose und Wiederherstellung | Offen |
| Grenzen / Sicherheit | Header, Rate-Limits, Request-/Upload-Grenzen und Lastverhalten am finalen Hosting prüfen | Dokumentierte Ergebnisse und behobene Befunde | Gezielt getestete API-Regeln vorhanden; Gesamtprüfung offen |
| Datenlebenszyklus | Aufbewahrung, Löschung, unreferenzierte Bilder und Änderungsverlauf festlegen | Getesteter Abgleich ohne Verlust referenzierter Fotos, dokumentierter Löschablauf | Offen; keine automatischen Löschjobs eingerichtet |

Eine Sicherung des Quellcodes enthält weder die D1-Kundendaten noch die R2-Fotos. Ein erneutes Deployment ist kein Restore dieser Daten. Sicherungsintervalle und zulässiger Datenverlust müssen vor einem Kundenstart festgelegt werden; hier wird kein bereits eingerichteter Sicherungsdienst behauptet.

## Sicher veröffentlichen und zurückgehen

1. Aktuelle Quelle des bestehenden Sites-Projekts mit dem Sites-Source-Workflow öffnen. Projekt-ID, vorhandene Bindungen und private Zielgruppe beibehalten.
2. Änderungen prüfen; die sieben Testsuiten und TypeScript stehen in README.md. Geänderte Oberfläche separat in der isolierten Demo prüfen.
3. Aktuellen Stand über den Sites-Workflow bauen, sichern und verpacken. Exakt den zurückgegebenen Commit und das unveränderte Archiv veröffentlichen.
4. Eine erfolgreiche native Deployment-Antwort ist der Veröffentlichungsnachweis. Bei einem Fehler keine zweite Veröffentlichung blind starten, sondern den bestehenden Vorgang prüfen.
5. Bei einem Fehler nach der Veröffentlichung kann ein bekannter vorheriger Quell-/Site-Stand als Ausgangspunkt dienen. Vor einer Rückkehr Kompatibilität mit Migrationen und aktuellen Daten prüfen. Ein alter Code-Stand macht Datenänderungen nicht rückgängig. Eine echte Rückkehr und ein Daten-Restore wurden noch nicht praktisch getestet.

Bereits angewandte Migrationen nicht umschreiben. Vor Schemaänderungen ein überprüftes Backup erstellen und die Wiederherstellung getrennt testen. Diese Vorbereitung führt keine produktiven Datenexporte oder Datenbankänderungen durch.

## Wenn ein Fehler auftritt

| Meldung / Situation | Vorgehen | Woran der Abschluss erkennbar ist |
| --- | --- | --- |
| Anmeldung fehlt (401) | Über den vorgesehenen ChatGPT-Einstieg anmelden; danach `/dashboard` öffnen | App lädt die Daten der angemeldeten Identität |
| Keine Berechtigung (403) | Plattformverwaltung prüft aktive App-Zuordnung, Firma/Filiale und private Site-Freigabe. Keine Freigabe eigenmächtig erweitern | Vorgesehene Rolle lädt nur ihre erlaubten Daten |
| Daten inzwischen geändert (409) | Text vor dem Neuladen sichern, aktuelle Daten laden, Änderungen vergleichen und erst dann erneut absenden | Aktueller Stand gespeichert, Verlauf unverändert nachvollziehbar |
| Speicherergebnis unklar (503) | Zuerst aktualisieren und prüfen, ob die Aktion bereits gespeichert wurde. Nicht mehrfach blind absenden | Eindeutig gespeicherter Auftrag / Rapport ohne doppelte Erfassung |
| Verbindung beim allgemeinen Speichern gestört | Speicherstatus oben beachten; angebotenen lokalen Entwurf sichern, dann neu laden und mit zentralem Stand vergleichen | Bestätigter zentraler Speicherstatus |
| Foto fehlt / abgelehnt | Dateityp und Grenzen prüfen: JPG/PNG/WebP, bis 10 MB je Foto, höchstens fünf neue / 20 MB je Vorgang. Bei Druckhinweis fehlendes Bild prüfen | Foto sichtbar; Druckansicht meldet «Rapport bereit» |
| Datenbankantwort verloren | Die API versucht den aktuellen Stand nachzulesen und erhält referenzierte Fotos. Bei nicht feststellbarem Ergebnis bleiben mögliche unreferenzierte Objekte bestehen | Ergebnis nach Neuladen geklärt; späterer sicherer Abgleich erforderlich |

Der Widerruf einer Zuordnung verhindert weitere berechtigte Serverzugriffe. Bereits geladene Inhalte, lokale Browser-Caches oder exportierte Dateien verschwinden dadurch nicht automatisch von anderen Geräten. Gerätezugriff, Abmeldung und Umgang mit Exporten gehören in die spätere Betriebsregelung.

## Unabhängige spätere Erweiterungen

Relationale Aufgaben-/Rapporttabellen, automatische PDF-Erstellung, E-Mail-Benachrichtigungen, wiederkehrende Wartungen und erweiterte Terminplanung sind nicht Teil der abgeschlossenen Prüfrunde. Modulschalter allein belegen keine fertig implementierte Funktion.
