import { createMollieClient } from "@mollie/api-client";

const mollie = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });

export const handler = async (event) => {
  const mollieId = event.queryStringParameters && event.queryStringParameters.mollieId;

  if (!mollieId) {
    return { statusCode: 400, body: JSON.stringify({ error: "Geen mollieId opgegeven" }) };
  }

  try {
    const payment = await mollie.payments.get(mollieId);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: payment.status })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
