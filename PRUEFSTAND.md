# Prüfrundgang für Loris · 31. Oktober 2026

## Guten Morgen – hier startest du

Die drei vorgesehenen Abschnitte sind bearbeitet: Manager-Verwaltung eigener Filialleiter, gezielte Fehler-/Sicherheitsprüfung und dieser morgendliche Review. Die Plattform bleibt eine **private Prüfversion**. Es wurden keine echten Kundendaten überschrieben, keine Personen eingeladen und keine Website-Freigaben geändert.

- [Startseite](https://facility-zentrale-loris.lorisbuercher.chatgpt.site/): Mehrwert und Login-Einstieg ansehen. Auch diese Seite bleibt derzeit privat.
- [Demo](https://facility-zentrale-loris.lorisbuercher.chatgpt.site/demo.html): Rollen und Abläufe mit lokalen Beispieldaten ausprobieren.
- [Dashboard](https://facility-zentrale-loris.lorisbuercher.chatgpt.site/dashboard): echte Plattform mit Anmeldung; im Superadmin-Menü **Projektstand** findest du denselben verständlichen Rundgang.

### Dein Rundgang in etwa 10–15 Minuten

| Schritt | Ausprobieren | Erwartetes Ergebnis |
| --- | --- | --- |
| 1 · Einstieg | Startseite öffnen; Funktionen und Login ansehen | Klarer Mehrwert und Weg ins Dashboard; aktueller Login über ChatGPT |
| 2 · Ambiente | Demo als Superadmin öffnen; bei Carglass «Ambiente anpassen» und «Hintergrund wählen» ausprobieren | Live-Vorschau für Farben, Schrift, Rundungen und Vorlagen; Speicherung erst bei «Übernehmen», ausschliesslich lokale Demo-Daten |
| 3 · Melden | In derselben Demo oben «Filialleiter» wählen; «Prüfrundgang Wand» in Basel mit Beschreibung/Priorität melden, Fotos leer lassen | «Gemeldet», nur die eigene Filiale; Demo akzeptiert keine echten Foto-Uploads |
| 4 · Prüfen | Oben «Manager» wählen; die Meldung freigeben; eine zweite Meldung mit Begründung ablehnen | Nur der Manager entscheidet; Status und Verlauf sind nachvollziehbar |
| 5 · Team | Als Manager unter «Filialleiter» (mobil «Team») eine Beispiel-Zuordnung mit `pruefung@example.invalid` erfassen, bearbeiten und deaktivieren | Nur eigene Filialleiter, keine Rollenbeförderung, Einladung oder Änderung der Site-Freigabe |
| 6 · Ausführen | Oben «Mitarbeiter» wählen; freigegebene Arbeit mit Text und 1.5 Stunden abschliessen | Arbeit verschwindet aus der Liste freigegebener Arbeiten; Abschluss bleibt für den Manager sichtbar |
| 7 · Rapport | Zurück als Manager «Rapporte» öffnen und «Druckansicht / PDF» ansehen | Text, Stunden, Verlauf und Musterbilder; deutlicher DEMO-Hinweis; PDF-Speichern über Browser-Druckdialog |
| 8 · Filter / Handy | Filiale, Status, Priorität und Meldezeitraum kombinieren, zurücksetzen; auf dem eigenen Handy ansehen | Passende Treffer oder Leermeldung; ungültiger Datumsbereich verständlich; fünf Manager-Register erreichbar |

Die Demo behält Meldungen beim Rollenwechsel im selben Browser. «Demo zurücksetzen» setzt ausschliesslich Demo-Meldungen und Demo-Zuordnungen zurück. Das echte Dashboard verwendet zentrale Daten; Änderungen dort sind keine Simulation.

### Was der Review belegt – und was noch fehlt

Sieben automatisierte Testsuiten sowie TypeScript haben im vorigen Abschnitt bestanden. SQL-Tests verwenden isoliertes SQLite, Formular-/Demo-Tests isolierte JavaScript-Kontexte. Browserprüfungen belegen den Demoablauf, die Druckansicht und die mobile Navigation; sie ersetzen keine echten Konto-/Gerätetests. Die folgenden Abschnitte enthalten die einzelnen Ergebnisse.

Vor einem Kundenstart fehlen weiterhin eigene Authentifizierung bzw. der finale Anbieter, echtes Kunden-Onboarding mit Kontentests, öffentliches Landing-Hosting, Backup und getestete Wiederherstellung sowie die umfassende Betriebs-/Sicherheitsprüfung. **BETRIEB.md** beschreibt konkrete Arbeiten, Abschlussnachweise und das Verhalten bei 401/403/409/503. Quellcode-Sicherung ist kein Backup der Daten und Fotos.

## Neu umgesetzt am 31.10.2026

- Startseite erklärt Mehrwert, Funktionen, Rollen und Ablauf. Login führt zur bestehenden ChatGPT-Anmeldung mit Rückkehr zu `/dashboard`.
- Plattform bleibt privat. Landingpage ist vorbereitet, noch nicht öffentlich für beliebige Kunden freigegeben.
- Demo mit Carglass-Beispiel, drei Filialen und vier lokalen Rollen. Keine echten Aufträge oder Zugänge werden dadurch geändert.
- Mängellisten mit Status, Filiale, Priorität, Meldezeitraum; Gesamtansicht zusätzlich mit Unternehmensfilter.
- Rapportübersicht mit Stunden und Suche, Detailansicht, Vorher-/Nachher-Fotos und Druckansicht zum Speichern als PDF über den Browser.
- Superadmin-Bereich Projektstand mit Prüfliste und offenen Punkten.

## Bereits geprüft

- API-Tests: Identität, Datentrennung, Statusrechte, Konflikte, Fotos und widerrufene Zugriffe bestanden.
- TypeScript-Prüfung bestanden.
- Demo im Browser: Filialleiter meldet neuen Mangel, Manager gibt frei, Mitarbeiter schliesst mit 1.5 Stunden ab, Manager sieht den neuen Rapport.
- Druckansicht zeigt geladene Musterbilder, Beschreibung, Stunden und Verlauf. Ein echter PDF-Ausdruck wurde noch nicht als Datei geprüft.
- Startseite auf Desktop und Handy visuell geprüft. Vier mobile Register und Rapportliste geprüft. Keine seitliche Überbreite bei 375 CSS-Pixeln. Kombinierte Filial-/Prioritäts-/Statusfilter liefern den erwarteten einzelnen Auftrag.

## Wichtig vor einem Kundenstart

Eigener E-Mail-/Passwort-Login, Kundenfreigaben, echte Rollenprüfungen mit den Konten der Beteiligten, Backup/Wiederherstellung und Betriebsprüfung bleiben offen. Die derzeitige Anmeldung benötigt ChatGPT und eine zusätzliche private Site-Freigabe. Spätere Module sind nicht pauschal fertig. Die Manager-Verwaltung eigener Filialleiter ist implementiert; die Freigabe echter Konten und der Test mit diesen Konten bleiben offen.

Der aktuelle Prüfrundgang ist auch in der Plattform unter Projektstand verfügbar. Weitere Produktarbeit benötigt einen neuen konkreten Auftrag.

## Ergänzung: Filialleiter-Verwaltung

Manager können nun im Unternehmensregister **Filialleiter** (mobil **Team**) eigene Filialleiter-Zuordnungen lesen, erfassen, bearbeiten und aktivieren/deaktivieren. Rolle und Firma sind nicht frei wählbar. Bestehende Manager und Mitarbeiter sowie andere Kunden/Plattforminhaber können damit nicht verändert werden. Die bestehende Superadmin-Verwaltung bleibt erhalten. Die Demo enthält getrennte lokale Beispiel-Zuordnungen zum Ausprobieren.

Sicherheitstests verwenden die tatsächlichen SQL-Abfragen gegen eine isolierte SQLite-Datenbank und prüfen auch Berechtigungsentzug zwischen Prüfung und Schreiben, gleichzeitig geänderte Zielrollen, Datenrevisionen und doppelte E-Mail-Adressen. Prüfung mit echten, freigegebenen Manager-/Filialleiter-Konten ist noch erforderlich.

### Prüfergebnisse dieses Abschnitts

- `node tests/access.cjs`, `node tests/state-api.cjs`, `node tests/workflow.cjs`, `node tests/photos.cjs` und `node tests/team.cjs`: bestanden.
- TypeScript (`tsc --noEmit`) und Syntaxprüfung der geänderten JavaScript-Dateien: bestanden.
- Browserprüfung ausschliesslich in der isolierten Demo: neue Filialleiter-Zuordnung erfasst, Name bearbeitet und Zuordnung deaktiviert; erwarteter Listenstatus sichtbar. Desktop sowie 390-Pixel-Vorschau mit fünf erreichbaren mobilen Registern geprüft. Keine echten Zugänge angelegt oder geändert.
- Die Fehler-/Sicherheitsprüfung ist im folgenden Abschnitt dokumentiert; der vollständige morgendliche Prüfrundgang steht am Anfang dieser Datei. Echte Kundenkonten, eigener Passwort-Login, Backup/Wiederherstellung und Betriebsreife bleiben offen.

## Ergänzung: Fehler- und Sicherheitsprüfung am 31.10.2026

**Behoben:**

- Eine laufende Statusänderung konnte zuvor nach einem Berechtigungsentzug noch speichern. Der tatsächliche SQL-Schreibvorgang prüft jetzt die unveränderte aktive Zuordnung. Getestet für Filialleiter-Meldung, Managerfreigabe und Mitarbeiterabschluss.
- Offene Formulare verwendeten beim Absenden die neueste Revision statt des angezeigten Stands. Sie behalten jetzt ihre ursprüngliche Revision; ein Konflikt bleibt sichtbar. Verspätete Ergebnisse schliessen keine neu geöffneten Dialoge.
- Bei Datenbankfehlern werden neue Bilder nur nach Prüfung des Speicherstands bereinigt. Erfolgreich referenzierte Fotos bleiben auch bei verlorener Antwort erhalten. Ist kein Nachlesen möglich, bleiben mögliche verwaiste Objekte erhalten; ein automatischer Bereinigungsprozess ist noch offen.
- Die Demo hatte abweichende Status-/Revisionsregeln. Sie wird jetzt aus derselben reinen Workflow-Implementierung wie der Server erzeugt; abgelehnte Aktionen verändern den lokalen Masterstand nicht.

**Tatsächlich geprüft:**

- Sieben Testsuiten: Zugriff, State-API, Workflow-Regeln, Fotos, Team-API, neuer SQLite-Workflow-API-Test und neuer Formular-/Demo-Regressionstest bestanden. Tests nutzen isolierte Daten; keine Live-Kundendaten geändert.
- Neue SQL-Tests: Entzug/Änderung von Rolle, Firma, Filiale, Inhaber, E-Mail oder Zuordnungsrevision während einer laufenden Anfrage; Entzug während Upload; Plattformkonflikt; Datenbankfehler vor dem Schreiben, verlorene Antwort nach Commit und nicht feststellbares Speicherergebnis.
- TypeScript und JavaScript-Syntaxprüfungen bestanden.
- Isolierte Browserdemo mit gemeinsamen Regeln: Manager gibt «Wand beim Eingang ausbessern» frei, Mitarbeiter schliesst mit 1.5 Stunden ab, Manager sieht den Rapport mit Verlauf. Druckansicht zeigt «Rapport bereit» und den deutlichen Demo-/Beispielhinweis. Kein echter PDF-Dateiexport behauptet.
- Filterimplementierung durchgesehen; die Gesamtübersicht normalisiert Legacy-Status bereits. Kein zusätzlicher Filterfehler bestätigt. Mobile Darstellung aus dem vorigen Abschnitt bleibt unverändert; kein erneuter vollständiger Mobiltest in diesem Abschnitt.

**Grenzen:** Dies ist eine gezielte Code-/Funktionsprüfung, keine externe Sicherheitszertifizierung. Echte freigegebene Konten, eigener Passwort-Login, öffentliches Landing-Hosting, Backup/Wiederherstellung, Lastprüfung sowie umfassende Header-/Rate-Limit-Prüfung bleiben offen. Der morgendliche Rundgang und die konkrete Betriebsvorbereitung sind am Anfang dieser Datei und in BETRIEB.md dokumentiert.

## Abschluss: Morgenreview und Betriebsvorbereitung

- Projektstand in der App ergänzt: direkte Einstiege, sechs aufklappbare Prüfschritte, erwartete Ergebnisse, nachgewiesene Tests, klare offene Punkte und Hilfen bei typischen Fehlern.
- BETRIEB.md ergänzt: bestehende Architektur, notwendige Entscheidungen, Abschlussnachweise für echte Konten, Geräte und Dateien, Backup/Restore, Überwachung, Datenlebenszyklus sowie sichere Veröffentlichung und Rückkehr.
- README.md und NACHTARBEIT.md synchronisiert. Keine neue Backend-Funktion oder produktive Datenmigration in diesem Abschnitt.
- Browserprüfung des neuen Projektstands in der isolierten Demo: Desktop-Ansicht, Öffnen eines Prüfschritts und mobile Navigation über das aufklappbare Menü bestanden. Sechs Schritte und die drei Einstiegsziele im DOM bestätigt. Bei 375 CSS-Pixeln Breite ebenfalls 375 Pixel Scrollbreite; kein seitlicher Überlauf. Mobiler Schritt «Mangel melden» lässt sich öffnen.
- JavaScript-Syntaxprüfung der geänderten Oberfläche bestanden. Die sieben API-/Regel-/Formularsuiten aus Abschnitt 2 betreffen unveränderte Logik und wurden für diese reine Review-/Dokumentationsänderung nicht erneut ausgeführt. Der aktuelle Stand wird vor Veröffentlichung erneut gebaut.
- Vollständige Betriebsreife bleibt ausdrücklich unbestätigt. Keine echten Konten, Kundenmeldungen, Fotos oder Website-Freigaben für diesen Review verändert.
