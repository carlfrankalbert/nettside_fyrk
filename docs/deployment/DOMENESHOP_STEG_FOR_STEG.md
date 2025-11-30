# Domeneshop DNS - Steg for steg instruksjoner

## Hva du ser i skjermbildet:

Du har to eksisterende DNS-pekere:
- `fyrk.no → (webhosting)`
- `www.fyrk.no → (webhosting)`

Disse må endres til å peke til GitHub Pages.

## Steg 1: Fjern eller endre eksisterende pekere

### For `fyrk.no`:
1. Finn raden med `fyrk.no → (webhosting)`
2. Klikk på den (eller søk etter en "rediger" eller "slett" knapp)
3. **Alternativ A:** Slett denne pekeren
4. **Alternativ B:** Endre verdien fra `(webhosting)` til `carlfrankalbert.github.io`

### For `www.fyrk.no`:
1. Finn raden med `www.fyrk.no → (webhosting)`
2. Endre verdien fra `(webhosting)` til `carlfrankalbert.github.io`

## Steg 2: Legg til nye DNS-pekere (hvis du slettet de gamle)

I input-feltet nederst på siden:

### For root domain (fyrk.no):
1. I **venstre felt** (før `.fyrk.no →`): Skriv **ingenting** eller la stå tomt (for root domain)
   - Eller skriv bare `@` hvis det er det som kreves
2. I **høyre felt** (etter `→`): Skriv: `carlfrankalbert.github.io`
3. Klikk på **pluss-ikonet (+)** for å legge til

### For www subdomain (hvis ikke allerede endret):
1. I **venstre felt**: Skriv `www`
2. I **høyre felt**: Skriv: `carlfrankalbert.github.io`
3. Klikk på **pluss-ikonet (+)** for å legge til

## Steg 3: Lagre endringene

1. Se etter en "Lagre" eller "Oppdater" knapp
2. Klikk på den for å lagre endringene

## Viktig: Hvis Domeneshop ikke tillater CNAME på root domain

Hvis du får en feilmelding om at CNAME ikke kan brukes på root domain (`@`), må du bruke **A records** i stedet:

### A Records (4 stk):

**Record 1:**
- **Venstre felt:** La stå tomt eller skriv `@`
- **Type:** Velg "A" (ikke CNAME)
- **Høyre felt:** `185.199.108.153`

**Record 2:**
- **Venstre felt:** La stå tomt eller skriv `@`
- **Type:** Velg "A"
- **Høyre felt:** `185.199.109.153`

**Record 3:**
- **Venstre felt:** La stå tomt eller skriv `@`
- **Type:** Velg "A"
- **Høyre felt:** `185.199.110.153`

**Record 4:**
- **Venstre felt:** La stå tomt eller skriv `@`
- **Type:** Velg "A"
- **Høyre felt:** `185.199.111.153`

## Eksempel på hva det skal se ut som:

**Etter endringene skal du ha:**

```
fyrk.no → carlfrankalbert.github.io
www.fyrk.no → carlfrankalbert.github.io
```

**ELLER (hvis A records):**

```
fyrk.no → 185.199.108.153 (A record)
fyrk.no → 185.199.109.153 (A record)
fyrk.no → 185.199.110.153 (A record)
fyrk.no → 185.199.111.153 (A record)
www.fyrk.no → carlfrankalbert.github.io (CNAME)
```

## Neste steg etter DNS er konfigurert:

1. Gå til: https://github.com/carlfrankalbert/nettside_fyrk/settings/pages
2. Under "Custom domain", skriv: `fyrk.no`
3. Huk av "Enforce HTTPS"
4. Lagre

## Vent på DNS propagation

- Vanligvis 1-4 timer
- Kan ta opptil 24 timer
- GitHub vil automatisk generere SSL sertifikat

