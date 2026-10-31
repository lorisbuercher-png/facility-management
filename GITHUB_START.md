# Facility Management – F&B Spezialbau

## Auf GitHub hochladen

1. Ein neues **privates**, leeres Repository `facility-management` erstellen.
2. Dieses ZIP entpacken. Den **Inhalt** des Ordners `facility-management` hochladen, nicht das ZIP selbst und nicht nur den Ordner als eine zusätzliche Ebene. `package.json` muss oben im Repository liegen.
3. Auch `.github`, `.gitignore`, `.npmrc` und `.openai` übernehmen. Sie können im Finder ausgeblendet sein (Cmd + Shift + Punkt).
4. Änderungen committen. Unter GitHub «Actions» laufen Tests, TypeScript und Build. Die Prüfung veröffentlicht keine Website.

Alternativ im entpackten Ordner:

```sh
git init -b main
git add .
git commit -m "Facility Management: aktueller Stand"
git remote add origin <URL_DES_PRIVATEN_REPOSITORIES>
git push -u origin main
```

## Lokal anschauen

Node.js 22 (mindestens 22.13) und pnpm gemäss `packageManager` in package.json verwenden.

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm test
pnpm typecheck
pnpm dev
```

Die lokale URL wird im Terminal angezeigt, normalerweise http://localhost:5173. Unter `/demo.html` lassen sich die vier Rollen mit getrennten Beispieldaten ausprobieren. Diese Demo braucht keine Live-Kundendaten und erlaubt bewusst keine echten Foto-Uploads.

Für lokale Serverversuche `.dev.vars.example` nach `.dev.vars` kopieren und die SQL-Migrationen aus `drizzle/` auf die lokale D1-Entwicklungsdatenbank anwenden. Der mitgelieferte Entwicklungs-Login simuliert `seedy@sites.test`. Er ist keine produktive Anmeldung. Für den ersten Blick die Browserdemo verwenden.

```sh
pnpm build
```

## Inhalt und Abgrenzung

Das Paket enthält Quellcode, Bilder der Oberfläche, SQL-Migrationen, 13 Testsuiten, GitHub-Prüfung und Dokumentation. Es enthält keine Git-Historie, Zugangsdaten, lokale Laufzeitverzeichnisse oder exportierten Kundendaten/Fotos. Die interne Sites-Projekt-ID ist entfernt; DB- und BUCKET-Bindings sind als Vorlage erhalten. Quellbasis ist Commit 039304e6d6f314343f0c401b687c4c766a5e8c79 plus die neue Sprachauswahl.

## Sprache

Sprachauswahl Deutsch / Français / Italiano auf Startseite, Demo und Dashboard mit lokaler Speicherung der Auswahl. Der Katalog enthält 328 übersetzte Texte je Sprache für Kernnavigation, Status, Formulare und häufige Hinweise. Kundeneingaben bleiben in der Originalsprache. Die internen Statuswerte und Datenbankwerte bleiben Deutsch, damit Freigaben und Filter stabil funktionieren.

**Die vollständige Übersetzung ist noch nicht abgeschlossen:** Längere technische Projektstand-/Betriebshinweise und einzelne zusammengesetzte Texte können noch Deutsch anzeigen. Diese Texte sowie die sprachliche Sichtprüfung gehören vor den mehrsprachigen Kundenstart auf die Restliste. Übersetzungen werden in `public/i18n/catalog.json` gepflegt; `public/language.js` enthält die ausgelieferte Kopie mit Laufzeitlogik. Bei Katalogänderungen die Kopie mit `node scripts/build-language.mjs` aktualisieren.

## Hosting-Wechsel

Dies ist weiterhin eine Vinext-/Cloudflare-Workers-Anwendung mit D1 und R2, keine Express-Anwendung und kein GitHub-Pages-Projekt. Nur GitHub hochladen macht die Software noch nicht auf einer eigenen Domain lauffähig.

Vor eigenem Hosting:

1. D1/R2-Ressourcen erstellen und `DB`/`BUCKET` sowie Migrationen konfigurieren.
2. Eigenständige Anmeldung und vertrauenswürdige Identitätsprüfung implementieren. Die aktuellen Serverrouten vertrauen bisher dem Sites-Gateway. Ohne Gateway oder gleichwertige Middleware dürfen Client-Identitätsheader niemals vertraut werden.
3. Runtime-Geheimnisse nur im Hosting hinterlegen.
4. Firmendaten und hochgeladene Fotos gesondert migrieren.
5. Echte Rollenkonten, Backups und Wiederherstellung sowie Betrieb prüfen.

Die bisherige Website wird durch diesen Export oder einen GitHub-Upload nicht verändert. Sie enthält noch nicht die neue Sprachversion aus diesem Paket. Die zuletzt gezeigten neuen Designbilder bleiben Entwürfe.
