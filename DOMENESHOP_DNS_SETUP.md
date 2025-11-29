# DNS Konfigurasjon for Domeneshop - fyrk.no

## Steg 1: Logg inn på Domeneshop

1. Gå til: https://www.domeneshop.no/
2. Logg inn med ditt brukernavn og passord
3. Gå til "Mine domener" eller "Domener"

## Steg 2: Velg fyrk.no

1. Klikk på domenet `fyrk.no`
2. Gå til "DNS-innstillinger" eller "DNS Management"

## Steg 3: Konfigurer DNS Records

### Alternativ 1: CNAME (Anbefalt - enklest)

1. **Fjern eksisterende A records** for root domain (hvis de finnes)
2. **Legg til CNAME record:**
   - **Type:** CNAME
   - **Navn/Host:** `@` eller `fyrk.no` (root domain)
   - **Verdi/Points to:** `carlfrankalbert.github.io`
   - **TTL:** 3600 (eller standard)

**Viktig:** Noen DNS-leverandører tillater ikke CNAME på root domain. Hvis Domeneshop ikke tillater dette, bruk Alternativ 2.

### Alternativ 2: A Records (Hvis CNAME ikke fungerer)

Legg til følgende 4 A records:

**Record 1:**
- **Type:** A
- **Navn/Host:** `@` eller `fyrk.no`
- **Verdi/IP:** `185.199.108.153`
- **TTL:** 3600

**Record 2:**
- **Type:** A
- **Navn/Host:** `@` eller `fyrk.no`
- **Verdi/IP:** `185.199.109.153`
- **TTL:** 3600

**Record 3:**
- **Type:** A
- **Navn/Host:** `@` eller `fyrk.no`
- **Verdi/IP:** `185.199.110.153`
- **TTL:** 3600

**Record 4:**
- **Type:** A
- **Navn/Host:** `@` eller `fyrk.no`
- **Verdi/IP:** `185.199.111.153`
- **TTL:** 3600

### Valgfritt: Legg til www subdomain

Hvis du vil at `www.fyrk.no` også skal fungere:

- **Type:** CNAME
- **Navn/Host:** `www`
- **Verdi/Points to:** `carlfrankalbert.github.io`
- **TTL:** 3600

## Steg 4: Lagre endringene

1. Klikk "Lagre" eller "Oppdater DNS"
2. Endringene kan ta noen minutter til noen timer å propagere

## Steg 5: Konfigurer GitHub Pages

1. Gå til: https://github.com/carlfrankalbert/nettside_fyrk/settings/pages
2. Under "Source", velg: **GitHub Actions** (hvis ikke allerede valgt)
3. Under "Custom domain", skriv inn: `fyrk.no`
4. Huk av "Enforce HTTPS"
5. Lagre

## Steg 6: Vent på DNS Propagation

- DNS endringer kan ta **1-4 timer** å propagere
- I noen tilfeller kan det ta opptil 24-48 timer
- Du kan sjekke status med:
  ```bash
  dig fyrk.no
  # eller
  nslookup fyrk.no
  ```

## Steg 7: SSL Sertifikat

GitHub Pages vil automatisk generere et SSL sertifikat når DNS er konfigurert riktig. Dette kan ta:
- Noen minutter (hvis alt er riktig)
- Opptil noen timer

## Verifisering

1. Etter DNS er propagert, gå tilbake til GitHub Pages settings
2. Du skal se en **grønn checkmark** ved "Custom domain"
3. SSL sertifikat status vil vises
4. Når alt er grønt, besøk **https://fyrk.no**

## Troubleshooting

### Domain ikke verifisert i GitHub
- Vent lenger på DNS propagation (kan ta opptil 24 timer)
- Sjekk at DNS records er riktig konfigurert i Domeneshop
- Verifiser at records peker til `carlfrankalbert.github.io` (for CNAME) eller GitHub Pages IP-adresser (for A records)
- Prøv å fjerne og legge til domenet igjen i GitHub Pages settings

### SSL sertifikat ikke generert
- Vent noen timer etter DNS er propagert
- Sjekk at DNS peker riktig
- Prøv å deaktivere og aktivere "Enforce HTTPS" igjen i GitHub Pages settings

### Nettsiden vises ikke
- Sjekk at GitHub Actions workflow har kjørt og er vellykket
- Gå til: https://github.com/carlfrankalbert/nettside_fyrk/actions
- Sjekk at CNAME filen er i `public/` mappen (allerede gjort)
- Sjekk at `astro.config.mjs` har `site: 'https://fyrk.no'` (allerede gjort)

### Sjekk DNS status
Du kan sjekke om DNS er propagert med:
```bash
# I terminal:
dig fyrk.no
nslookup fyrk.no

# Eller bruk online verktøy:
# https://dnschecker.org/
# https://www.whatsmydns.net/
```

## Kontakt Domeneshop support

Hvis du har problemer med DNS-konfigurasjonen, kan du kontakte Domeneshop support:
- Email: support@domeneshop.no
- Telefon: Se deres support-side

