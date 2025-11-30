# Custom Domain Setup - fyrk.no

## Steg 1: Legg til CNAME fil (allerede gjort)
CNAME filen er lagt til i `public/CNAME` med innholdet `fyrk.no`

## Steg 2: Konfigurer GitHub Pages

1. Gå til repository settings:
   https://github.com/carlfrankalbert/nettside_fyrk/settings/pages

2. Under "Custom domain", skriv inn: `fyrk.no`

3. Huk av "Enforce HTTPS" (anbefalt)

4. Lagre

## Steg 3: Konfigurer DNS

Du må konfigurere DNS hos din domeneleverandør. Legg til følgende DNS records:

### Alternativ 1: CNAME (anbefalt)
```
Type: CNAME
Name: @ (eller root domain)
Value: carlfrankalbert.github.io
TTL: 3600 (eller standard)
```

### Alternativ 2: A Records (hvis CNAME ikke støttes)
```
Type: A
Name: @
Value: 185.199.108.153
TTL: 3600

Type: A
Name: @
Value: 185.199.109.153
TTL: 3600

Type: A
Name: @
Value: 185.199.110.153
TTL: 3600

Type: A
Name: @
Value: 185.199.111.153
TTL: 3600
```

### For www subdomain (valgfritt):
```
Type: CNAME
Name: www
Value: carlfrankalbert.github.io
TTL: 3600
```

## Steg 4: Vent på DNS propagation

- DNS endringer kan ta opptil 24-48 timer å propagere
- Vanligvis tar det 1-4 timer
- Du kan sjekke med: `dig fyrk.no` eller `nslookup fyrk.no`

## Steg 5: SSL sertifikat

GitHub Pages vil automatisk generere et SSL sertifikat når DNS er konfigurert riktig. Dette kan ta noen minutter til noen timer.

## Verifisering

1. Etter DNS er propagert, gå tilbake til GitHub Pages settings
2. Du skal se en grønn checkmark ved "Custom domain"
3. SSL sertifikat status vil vises
4. Når alt er grønt, besøk https://fyrk.no

## Troubleshooting

### Domain ikke verifisert
- Vent lenger på DNS propagation
- Sjekk at DNS records er riktig konfigurert
- Prøv å fjerne og legge til domenet igjen i GitHub Pages settings

### SSL sertifikat ikke generert
- Vent noen timer
- Sjekk at DNS peker riktig
- Prøv å deaktivere og aktivere "Enforce HTTPS" igjen

### Nettsiden vises ikke
- Sjekk at GitHub Actions workflow har kjørt og er vellykket
- Sjekk at CNAME filen er i `public/` mappen
- Sjekk at `astro.config.mjs` har `site: 'https://fyrk.no'`

