import { getStore } from '@netlify/blobs';

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const adminKey = event.queryStringParameters?.key;
  if (adminKey !== process.env.ADMIN_KEY) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Niet geautoriseerd' }) };
  }

  try {
    const store = getStore('bestellingen');
    const { blobs } = await store.list();

    const bestellingen = await Promise.all(
      blobs.map(blob => store.get(blob.key, { type: 'json' }))
    );

    bestellingen.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bestellingen)
    };

  } catch (err) {
    console.error('Bestellingen fout:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
