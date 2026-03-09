import { getStore } from '@netlify/blobs';

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const adminKey = event.queryStringParameters?.key;
  if (adminKey !== process.env.ADMIN_KEY) {
    return { statusCode: 401, body: 'Unauthorized' };
  }

  try {
    const store = getStore({
      name: 'bestellingen',
      siteID: process.env.NETLIFY_SITE_ID || '073b8f4e-de2d-4490-aa5e-6a96ddef7e5a',
      token: process.env.NETLIFY_API_TOKEN
    });

    const { blobs } = await store.list();
    const bestellingen = await Promise.all(
      blobs.map(async (blob) => {
        const data = await store.get(blob.key, { type: 'json' });
        return data;
      })
    );

    bestellingen.sort((a, b) => String(a.id).localeCompare(String(b.id)));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bestellingen)
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
