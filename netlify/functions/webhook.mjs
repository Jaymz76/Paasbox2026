import { createMollieClient } from '@mollie/api-client';
import { getStore } from '@netlify/blobs';

const mollie = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const params = new URLSearchParams(event.body);
  const id = params.get('id');

  if (!id) {
    return { statusCode: 400, body: 'Geen payment ID ontvangen' };
  }

  try {
    const payment = await mollie.payments.get(id);

    if (payment.status !== 'paid') {
      return { statusCode: 200, body: '' };
    }

    const m = payment.metadata;

    // Sla bestelling op in Netlify Blobs
    const store = getStore({
      name: 'bestellingen',
      siteID: process.env.NETLIFY_SITE_ID || '073b8f4e-de2d-4490-aa5e-6a96ddef7e5a',
      token: process.env.NETLIFY_API_TOKEN
    });
    const bestelling = {
      id: m.bestellingId,
      naam: m.naam,
      email: m.email,
      telefoon: m.telefoon || '',
      aantal: m.aantal,
      leveringType: m.leveringType,
      locatie: m.locatie || '',
      adres: m.adres || '',
      bedrag: m.bedrag,
      status: 'betaald',
      mollieId: id,
      timestamp: new Date().toISOString()
    };
    await store.setJSON(m.bestellingId, bestelling);

    await stuurMail({
      naar: m.email,
      onderwerp: `Bevestiging Paasbrunch Box #${m.bestellingId} — Ateliercuisine Rosier`,
      html: bevestigingsmailHtml(m),
      tekst: bevestigingsmailTekst(m)
    });

    await stuurMail({
      naar: process.env.ADMIN_EMAIL,
      onderwerp: `🥚 Nieuwe bestelling #${m.bestellingId} — ${m.naam}`,
      html: adminMailHtml(m),
      tekst: adminMailTekst(m)
    });

    return { statusCode: 200, body: '' };

  } catch (err) {
    console.error('Webhook fout:', err);
    return { statusCode: 500, body: err.message };
  }
};

async function stuurMail({ naar, onderwerp, html, tekst }) {
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: 'Ateliercuisine Rosier <paasbox2026@nielsrosier.nl>',
      to: [naar],
      subject: onderwerp,
      html: html,
      text: tekst
    })
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error('Resend fout: ' + txt);
  }
}

function bevestigingsmailHtml(m) {
  const levering = m.leveringType === 'bezorg'
    ? `Thuisbezorging naar: ${m.adres}`
    : `Ophalen bij: ${m.locatie}`;

  return `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;max-width:600px;">
        <tr>
          <td style="padding:0;text-align:center;background:#1a2e1a;">
            <img src="https://paasbox2026.netlify.app/AI_tafel_3.jpeg" width="600" style="display:block;width:100%;max-width:600px;height:220px;object-fit:cover;" alt="" />
            <div style="margin-top:-80px;padding-bottom:24px;position:relative;">
              <img src="https://paasbox2026.netlify.app/logo.webp" width="140" style="display:inline-block;height:auto;" alt="Ateliercuisine Rosier" />
            </div>
          </td>
        </tr>
        <tr><td style="padding:40px;">
          <p style="color:#4a3728;font-size:16px;margin:0 0 24px;">Beste ${m.naam},</p>
          <p style="color:#4a3728;font-size:16px;margin:0 0 32px;">Bedankt voor je bestelling! We kijken ernaar uit om jou een heerlijke Paasbrunch te bezorgen.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f6f0;border-radius:6px;padding:24px;margin-bottom:32px;">
            <tr><td style="padding-bottom:16px;"><p style="margin:0;color:#8b6914;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;">Jouw bestelling</p></td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #e8dcc8;"><table width="100%"><tr><td style="color:#666;font-size:14px;font-family:Arial,sans-serif;">Bestelnummer</td><td align="right" style="color:#2d5016;font-weight:bold;font-family:Arial,sans-serif;">#${m.bestellingId}</td></tr></table></td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #e8dcc8;"><table width="100%"><tr><td style="color:#666;font-size:14px;font-family:Arial,sans-serif;">Aantal boxen</td><td align="right" style="color:#333;font-size:14px;font-family:Arial,sans-serif;">${m.aantal} × Paasbrunch Box (voor 2 personen)</td></tr></table></td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #e8dcc8;"><table width="100%"><tr><td style="color:#666;font-size:14px;font-family:Arial,sans-serif;">Levering</td><td align="right" style="color:#333;font-size:14px;font-family:Arial,sans-serif;">${levering}</td></tr></table></td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #e8dcc8;"><table width="100%"><tr><td style="color:#666;font-size:14px;font-family:Arial,sans-serif;">Datum</td><td align="right" style="color:#333;font-size:14px;font-family:Arial,sans-serif;">Paaszaterdag 4 april 2026</td></tr></table></td></tr>
            <tr><td style="padding:12px 0 0;"><table width="100%"><tr><td style="color:#2d5016;font-size:15px;font-weight:bold;font-family:Arial,sans-serif;">Totaal</td><td align="right" style="color:#2d5016;font-size:18px;font-weight:bold;font-family:Arial,sans-serif;">€ ${Number(m.bedrag).toLocaleString('nl-NL')} ✓</td></tr></table></td></tr>
          </table>
          <p style="color:#4a3728;font-size:15px;margin:0 0 8px;">Heb je vragen? Neem gerust contact op:</p>
          <p style="margin:0;"><a href="mailto:paasbox2026@nielsrosier.nl" style="color:#2d5016;font-size:15px;">paasbox2026@nielsrosier.nl</a></p>
        </td></tr>
        <tr><td style="background:#f9f6f0;padding:24px 40px;text-align:center;border-top:1px solid #e8dcc8;">
          <p style="margin:0;color:#999;font-size:12px;font-family:Arial,sans-serif;">Niels Rosier · Ateliercuisine Rosier · <a href="https://www.nielsrosier.nl" style="color:#999;">nielsrosier.nl</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function bevestigingsmailTekst(m) {
  const levering = m.leveringType === 'bezorg' ? `Thuisbezorging naar: ${m.adres}` : `Ophalen bij: ${m.locatie}`;
  return `Beste ${m.naam},\n\nBedankt voor je bestelling bij Ateliercuisine Rosier!\n\nBestelnummer: #${m.bestellingId}\nAantal: ${m.aantal} x Paasbrunch Box\n${levering}\nDatum: Paaszaterdag 4 april 2026\nTotaal: € ${Number(m.bedrag).toLocaleString('nl-NL')}\nStatus: Betaald\n\nVragen? paasbox2026@nielsrosier.nl\n\nMet vriendelijke groet,\nNiels Rosier\nAteliercuisine Rosier`;
}

function adminMailHtml(m) {
  const levering = m.leveringType === 'bezorg' ? `🚚 Bezorging → ${m.adres}` : `🏪 Ophalen → ${m.locatie}`;
  return `<html><body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;"><table width="560" style="background:#fff;border-radius:8px;padding:32px;"><tr><td><h2 style="color:#2d5016;margin:0 0 20px;">🥚 Nieuwe betaalde bestelling</h2><table width="100%" cellpadding="6"><tr style="background:#f9f6f0;"><td style="color:#666;font-size:13px;">Bestelnummer</td><td><b>#${m.bestellingId}</b></td></tr><tr><td style="color:#666;font-size:13px;">Naam</td><td>${m.naam}</td></tr><tr style="background:#f9f6f0;"><td style="color:#666;font-size:13px;">Email</td><td><a href="mailto:${m.email}">${m.email}</a></td></tr><tr><td style="color:#666;font-size:13px;">Telefoon</td><td>${m.telefoon || '—'}</td></tr><tr style="background:#f9f6f0;"><td style="color:#666;font-size:13px;">Aantal</td><td>${m.aantal}</td></tr><tr><td style="color:#666;font-size:13px;">Levering</td><td>${levering}</td></tr><tr style="background:#f9f6f0;"><td style="color:#666;font-size:13px;">Bedrag</td><td style="font-weight:bold;color:#2d5016;">€ ${Number(m.bedrag).toLocaleString('nl-NL')}</td></tr></table></td></tr></table></body></html>`;
}

function adminMailTekst(m) {
  const levering = m.leveringType === 'bezorg' ? `Bezorging → ${m.adres}` : `Ophalen → ${m.locatie}`;
  return `Nieuwe bestelling #${m.bestellingId} — ${m.naam}\nEmail: ${m.email}\nTelefoon: ${m.telefoon || '—'}\nBoxen: ${m.aantal}\n${levering}\nBedrag: € ${Number(m.bedrag).toLocaleString('nl-NL')}`;
}
