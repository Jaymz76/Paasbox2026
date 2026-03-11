import { createMollieClient } from '@mollie/api-client';

const mollie = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Ongeldige JSON' }) };
  } }
  const { naam, email, telefoon, aantal, leveringType, locatie, adres, bedrag, bestellingId } = body;

  if (!naam || !email || !bedrag || !bestellingId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Verplichte velden ontbreken' }) };
  }

  try {
    const payment = await mollie.payments.create({
      amount: { currency: 'EUR', value: Number(bedrag).toFixed(2) },
      description: `Paasbrunch Box #${bestellingId} — Ateliercuisine Rosier`,
      redirectUrl: `${process.env.SITE_URL}/betaling-verwerkt?id=${bestellingId}`,
      webhookUrl: `${process.env.SITE_URL}/.netlify/functions/webhook`,
      method: 'ideal',
      metadata: { bestellingId, naam, email, telefoon: telefoon || '', aantal, leveringType, locatie: locatie || '', adres: adres || '', bedrag }
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkoutUrl: payment.getCheckoutUrl(), mollieId: payment.id, bestellingId })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Betaling aanmaken mislukt', details: err.message }) };
  }
};
