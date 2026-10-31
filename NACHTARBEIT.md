# Facility – Fortsetzung bis zum morgendlichen Review

Der Inhaber Loris Bürcher hat am 31.10.2026 die autonome Weiterarbeit an der Facility-Management-Plattform während seiner Schlafenszeit beauftragt. Ziel: morgen Startseite, Dashboard und nachvollziehbaren Stand ansehen. Keine Rückfragen für Routineentscheidungen. Keine vollständige Produktionsreife behaupten.

## Unverändert beibehalten

Site `appgprj_6ae343e59218819187d7d9cb690d6b36`; bestehende Quelle über Sites öffnen, kein neues Projekt. Aktuellen Quellstand holen, README lesen. Keine Laufzeit-Credentials speichern. Bestehende private Freigabe erhalten; keine Personen einladen, keine Mails verschicken, keine echten Kundendaten überschreiben. Keine globale Skill-Installation. UI: Liquid Glass für Navigation, Bento-Raster, Giant Type, Soft 3D, anpassbare Firmenfarben und Hintergründe. Schweizer Schreibweise. Bei Änderungen Tests und Build passend ausführen und über den bestehenden privaten Sites-Workflow veröffentlichen.

## Aktueller Stand

Landingpage unter `/`, App unter `/dashboard`, isolierte Demo unter `/demo.html`. Demo hat drei Filialen und lokale Rollenumschaltung. Superadmin-Menü Projektstand zeigt Prüfrundgang und wichtige Grenzen. Auftragsfilter, Rapportübersicht und Browser-Druckansicht/PDF wurden ergänzt. Der vollständige Demoablauf Melden → Managerfreigabe → Mitarbeiterabschluss → Manager-Rapport wurde im Browser geprüft. Druckansicht mit geladenen Fotos wurde geprüft; kein automatisch erzeugter PDF-Export wurde behauptet. Sieben Testsuiten und TypeScript-Prüfung bestanden im Abschnitt Fehler-/Sicherheitsprüfung. Der Build muss vor Veröffentlichung aus dem aktuellen Quellstand laufen.

## Pro Lauf genau einen sinnvollen, prüfbaren Abschnitt fertigstellen

1. **ABGESCHLOSSEN – Manager verwaltet eigene Filialleiter:** `/api/team` so erweitern, dass nur aktive Manager Zuordnungen für die eigene Firma und Rolle `branch` lesen/anlegen/ändern/aktivieren/deaktivieren können. Keine Beförderung zu Manager/Employee/Superadmin, kein Zugriff auf andere Firmen oder bestehende nicht-branch-Einträge. Zugriff auf gespeicherte Zuordnung und neue Daten separat prüfen, CAS beibehalten, Origin-/Input-Checks beibehalten. UI im Unternehmensbereich anbinden. Tests für cross-tenant, privilege escalation, revoked manager, stale revision und vorhandene Owner-Funktionen. Kein Native-Site-Sharing ändern und keine Nachrichten senden. Danach diesen Punkt hier als abgeschlossen dokumentieren.
2. **ABGESCHLOSSEN – Funktions- und Sicherheitsprüfung des erreichten Stands:** echte Bugs in Filtern, Rapportansicht, Demo, Mobile-Navigation und Statusworkflow beheben. Demo vollständig von Live-APIs isoliert halten. Demo-PDF sichtbar als Muster kennzeichnen. Aktuelle README und Projektstand synchronisieren. Tests ergänzen nur bei tatsächlichem Fehlerrisiko.
3. **ABGESCHLOSSEN – Betriebsvorbereitung und morgendlicher Review:** eine konkrete Übersicht der erledigten Änderungen, bestandenen Prüfungen und verbleibenden Blocker in `PRUEFSTAND.md` aktualisieren und über den Projektstand zugänglich machen. Bestehende Implementierung auf dem aktuellen privaten Site veröffentlichen, Link zu Startseite, Demo und Dashboard berichten. Eigene Auth, echtes Kunden-Onboarding, öffentliches Landing-Hosting, Backups und echte Kontentests als offen benennen, soweit nicht nachweislich erledigt. Keine fiktionalen Tests/Ergebnisse.

Bei einem fehlgeschlagenen Schritt bestehende gute Änderungen sichern, Ursache beheben, begrenzte Wiederholung. Keine Freigaben umgehen. Wenn Umgebung, Account-Verbindung oder ein finaler Auth-/Hosting-Entscheid blockiert, den genauen offenen Punkt dokumentieren und mit unabhängigen Arbeiten fortfahren. Keine automatischen weiteren Aufgaben anlegen oder Zeitpläne verlängern. Verfügbare Revisionskonflikte korrekt lösen, niemals fremde Änderungen überschreiben.

## Ergebnis Abschnitt 1 am 31.10.2026

Manager-Verwaltung eigener Filialleiter ist implementiert. API prüft gespeicherte und gewünschte Zuordnung, Rollen-/Firmen-/Owner-Grenzen, aktive Manager-Berechtigung und Revision beim tatsächlichen SQL-Schreiben. Unternehmensregister Filialleiter, mobil Team, mit Erfassung/Bearbeitung und Aktivierung/Deaktivierung. Demo-Zuordnungen sind lokal isoliert. Neuer realer SQLite-Test `tests/team.cjs` und bisherige API-Tests sind auszuführen; konkrete Ergebnisse stehen in PRUEFSTAND.md. Nächster Lauf: Abschnitt 2, keine erneute Implementierung von Abschnitt 1. Keine echte Site-Freigabe oder Kundenzuordnung wurde geändert.

## Ergebnis Abschnitt 2 am 31.10.2026

Konkrete Fehler behoben: Statusworkflow prüft aktive Zugangszuordnung beim SQL-Schreiben erneut; offene Formulare behalten die angezeigte Auftragsrevision; asynchrone Ergebnisse schliessen keine neueren Dialoge. Foto-Bereinigung berücksichtigt unklare Datenbankantworten und erhält bereits referenzierte Bilder. Demo-Workflow aus den gleichen Regeln wie die Serverlogik erzeugt, statt abweichender lokaler Regeln. Zusätzliche SQLite-API- und isolierte Formular-/Demo-Regressionstests; echte Ergebnisse und Grenzen in PRUEFSTAND.md. Filter und Druckansicht geprüft; vorhandene Normalisierung und Demo-Wasserzeichen bleiben erhalten. Keine Sicherheitszertifizierung oder Betriebsreife behaupten. Nächster Lauf: ausschliesslich Abschnitt 3, verständlicher morgendlicher Review und Betriebsvorbereitung.

## Ergebnis Abschnitt 3 am 31.10.2026

Morgendlicher Rundgang mit konkreten Schritten, erwarteten Ergebnissen und direkten Einstiegen in PRUEFSTAND.md und im Superadmin-Projektstand ergänzt. BETRIEB.md dokumentiert Auth-/Hosting-Entscheidungen, echte Rollen-/Gerätetests, Backup und Wiederherstellung, Überwachung, Datenlebenszyklus und Fehlerbehandlung. Diese Betriebsarbeiten werden als offen ausgewiesen; Dokumentation ist kein Ausführungsnachweis. Design, Bindungen, private Freigabe und echte Kundendaten bleiben erhalten. Aktuelle Prüfergebnisse stehen in PRUEFSTAND.md.

Alle drei vorgesehenen Abschnitte sind abgeschlossen. Keine weiteren automatischen Produktänderungen oder neuen Zeitpläne anlegen. Weitere Arbeit erst mit einem neuen konkreten Auftrag; vor Kundenbetrieb die offenen Punkte in BETRIEB.md abarbeiten.
