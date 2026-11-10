# OSCD · Onsite Control Desk – Domains und Betrieb

**Produktmarke:** OSCD – Onsite Control Desk  
**Unternehmen hinter dem Produkt:** FB Spezialbau  
**Neue Hauptdomain des Betreibers:** `oscd.ch` (vom Betreiber gekauft, DNS-Anbindung noch nicht bestätigt)

## Zielstruktur

| Adresse | Zweck | Öffentlichkeit |
|---|---|---|
| `https://oscd.ch` | Marketing- und Akquise-Landingpage von OSCD | Öffentlich, nur statische Informationen |
| `https://www.oscd.ch` | Weiterleitung auf die Hauptdomain | Öffentlich |
| `https://app.oscd.ch` | Kundenportal, Manager und Filialleitung, Superadmin nach Rolle | Geschützte Anmeldung |
| `https://team.oscd.ch` | Direktzugang für FB Spezialbau und ausführende Mitarbeiter | Geschützte Anmeldung |

`team.oscd.ch` ist **kein zweiter Datenbestand**: beide Login-Adressen verwenden dieselbe geschützte Anwendung, dieselbe rollen- und mandantengeprüfte Datenbank und denselben Auftragsverlauf. Die Anmeldung und die **serverseitig** durchgesetzten Rollen bestimmen die sichtbare Ansicht; kein Mitarbeiter erhält allein durch einen anderen URL-Parameter Zugriff auf Kunden- oder Administratordaten.

## Nächste DNS-Schritte für die Landingpage

Die derzeitige GitHub-Pages-Adresse ist `https://lorisbuercher-png.github.io/facility-management/`. Der öffentlich veröffentlichte Build enthält nur Marketing-HTML, CSS, eine generische Gebäudegrafik und eine 404-Seite.

1. Zuerst unter GitHub → `lorisbuercher-png/facility-management` → **Settings → Pages → Custom domain** `oscd.ch` eintragen und speichern. Wenn möglich die Domain zuvor im GitHub-Konto verifizieren. Da GitHub Pages mittels GitHub Actions veröffentlicht wird, wird **keine CNAME-Datei** im Repository benötigt.
2. Im DNS-Panel des tatsächlichen DNS-Betreibers (falls Hostpoint weiterhin autoritativ ist: Hostpoint DNS) für die Hauptdomain `@` die folgenden **vier A-Records** zu GitHub Pages konfigurieren:
   - `185.199.108.153`
   - `185.199.109.153`
   - `185.199.110.153`
   - `185.199.111.153`
3. Für `www` einen **CNAME** auf `lorisbuercher-png.github.io` einrichten. Keine DNS-Wildcards wie `*.oscd.ch` anlegen.
4. Nach der DNS-Aktualisierung die GitHub-Pages-Domainprüfung, Weiterleitung und **Enforce HTTPS** kontrollieren.
5. Die konkreten bisherigen DNS-Einträge sind vor dem Ändern zu prüfen, damit keine bestehenden Mail-/TXT-/MX-Einstellungen oder fremde Dienste beschädigt werden.

Diese Schritte sind eine **Betriebsanleitung**, keine Bestätigung, dass OSCD bereits über `oscd.ch` erreichbar ist. Domains, DNS-Zone und HTTPS sind erst nach realen Checks produktiv.

Quelle für GitHub-Pages-Einstellungen und IP-Adressen: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site

## Geschützte App-/Mitarbeiter-Subdomains

Die Subdomains `app` und `team` **nicht** auf die öffentliche GitHub-Pages-Demo zeigen lassen. Vor dem Einrichten sind ein echter, geschützter App-Host, Authentifizierung, Zugriffsrechte, Einladungen, Mandantentrennung, Datenbankmigrationen und eine eigene Betriebs-/Sicherheitsprüfung erforderlich. Die aktuelle private Entwicklungs-App ist **noch nicht** für produktiven Kundeneinsatz freigegeben.

Der GitHub-Quellcode des aktuellen Repositorys ist weiterhin öffentlich, auch wenn GitHub Pages nur ausgewählte Marketing-Dateien ausliefert. Vor dem SaaS-Launch sollte die private Applikation in ein **privates Repository** getrennt werden, die öffentliche Domain kann mit einer separaten Marketing-Veröffentlichung betrieben werden.

E-Mail-Anfragen der OSCD-Seite gehen weiterhin an das vorhandene, bekannte Geschäftspostfach `info@fb-spezialbau.ch`. Keine unbestätigten Adressen wie `info@oscd.ch` verwenden. Eine separate OSCD-Maildomain lässt sich später mit verifizierten Mail-DNS-Einträgen einrichten.
