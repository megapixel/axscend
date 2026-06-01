/**
 * Cloudflare Worker — SendGrid contact form relay
 *
 * Deploy:
 *   npm install -g wrangler
 *   wrangler login
 *   wrangler deploy
 *   wrangler secret put SENDGRID_API_KEY   # paste your SendGrid API key
 *
 * In Cloudflare dashboard:
 *   Workers & Pages → your worker → Settings → Triggers
 *   Add custom domain: form.axscend.ai
 *
 * SendGrid prerequisite:
 *   Verify "noreply@axscend.ai" as a Single Sender in SendGrid before deploying.
 */

const ALLOWED_ORIGINS = ['https://axscend.ai', 'https://www.axscend.ai'];
const TO_EMAIL = 'calvert@axscend.ai';
const FROM_EMAIL = 'noreply@axscend.ai';
const FROM_NAME = 'Axscend Website';

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);
    if (url.pathname !== '/contact' || request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Parse body
    let data;
    try {
      data = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const { name, email, company, service, message } = data;

    // Validate required fields
    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 422,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email' }), {
        status: 422,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const subject = service
      ? `Axscend enquiry: ${service} — ${name}`
      : `Axscend enquiry from ${name}`;

    const textBody = [
      `Name: ${name}`,
      `Email: ${email}`,
      company ? `Company: ${company}` : null,
      service ? `Interest: ${service}` : null,
      '',
      message,
    ].filter(Boolean).join('\n');

    const htmlBody = `
      <p><strong>Name:</strong> ${esc(name)}</p>
      <p><strong>Email:</strong> ${esc(email)}</p>
      ${company ? `<p><strong>Company:</strong> ${esc(company)}</p>` : ''}
      ${service ? `<p><strong>Interest:</strong> ${esc(service)}</p>` : ''}
      <hr>
      <p style="white-space:pre-wrap">${esc(message)}</p>
    `;

    const payload = {
      personalizations: [{ to: [{ email: TO_EMAIL }] }],
      from: { email: FROM_EMAIL, name: FROM_NAME },
      reply_to: { email: email, name: name },
      subject: subject,
      content: [
        { type: 'text/plain', value: textBody },
        { type: 'text/html', value: htmlBody },
      ],
    };

    const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (sgRes.status === 202) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const sgErr = await sgRes.text();
    console.error('SendGrid error', sgRes.status, sgErr);
    return new Response(JSON.stringify({ error: 'Email delivery failed' }), {
      status: 502,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  },
};

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
