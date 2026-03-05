# 🥚 Paasbox Rosier — Setup Handleiding

## Wat je nodig hebt
- [Vercel](https://vercel.com) account (gratis)
- [Mollie](https://mollie.com) account (gratis, commissie per betaling)
- [Formspree](https://formspree.io) account (gratis tot 50 mails/maand)

---

## Stap 1 — Mollie instellen

1. Ga naar [mollie.com](https://mollie.com) en maak een account aan
2. Doorloop de verificatie (KVK, bankrekening)
3. Ga naar **Developers → API-sleutels**
4. Kopieer je **Test API-sleutel** (begint met `test_`) om te testen
5. Later gebruik je de **Live API-sleutel** (begint met `live_`) voor echte betalingen

---

## Stap 2 — Formspree instellen

1. Ga naar [formspree.io](https://formspree.io) en maak een account aan
2. Klik **+ New Form**
3. Naam: *Paasbox Bevestiging*, e-mail: jouw e-mailadres
4. Kopieer het **Form ID** (bijv. `xpwzabcd`)

---

## Stap 3 — Deployen op Vercel

### 3a. Vercel CLI installeren
```bash
npm install -g vercel
```

### 3b. Inloggen
```bash
vercel login
```

### 3c. Project deployen
```bash
cd paasbox
vercel
```
Volg de stappen — kies een projectnaam, bijv. `paasbox-rosier`.

### 3d. Environment variables instellen
Ga naar je project op [vercel.com](https://vercel.com) → **Settings → Environment Variables** en voeg toe:

| Naam | Waarde |
|------|--------|
| `MOLLIE_API_KEY` | `test_xxxxxxxxxxxx` (of `live_...` voor productie) |
| `FORMSPREE_ID` | `xpwzabcd` (jouw Formspree Form ID) |
| `SITE_URL` | `https://jouw-project.vercel.app` |
| `ADMIN_EMAIL` | `info@ateliercuisinerosier.nl` |

### 3e. Opnieuw deployen na env vars
```bash
vercel --prod
```

---

## Stap 4 — Mollie webhook instellen

In Mollie dashboard → **Developers → Webhooks**:
- Webhook URL: `https://jouw-project.vercel.app/api/webhook`

---

## De betaalflow

```
Klant vult formulier in
        ↓
POST /api/betaling  →  Mollie maakt betaling aan
        ↓
Redirect naar Mollie iDEAL pagina
        ↓
Klant betaalt via bank
        ↓
Mollie stuurt POST naar /api/webhook
        ↓
Webhook verifieert betaling + stuurt mails:
  • Bevestigingsmail → klant
  • Notificatie → jij (admin)
        ↓
Klant wordt doorgestuurd naar /betaling-verwerkt
```

---

## Testen

Gebruik in Mollie de **testmodus** (test_ API key).  
Test-iDEAL betaling: kies "ING" en selecteer "Paid" als uitkomst.

---

## Bestanden overzicht

```
paasbox/
├── index.html              ← De bestelpagina
├── betaling-verwerkt.html  ← Pagina na Mollie redirect
├── vercel.json             ← Vercel routing config
├── package.json            ← Dependencies
└── api/
    ├── betaling.js         ← Betaling aanmaken bij Mollie
    ├── betaling-status.js  ← Betaalstatus opvragen
    └── webhook.js          ← Mollie webhook + mails versturen
```
