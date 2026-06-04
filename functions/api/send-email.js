export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const data = await request.json();
    
    // Extrahieren der Felder aus dem JSON Payload
    const {
      name,
      email,
      phone,
      date,
      location,
      eventType,
      hours,
      guests,
      addons,
      estimatedPrice,
      message
    } = data;
    
    // Pflichtfelder validieren
    if (!name || !email || !date) {
      return new Response(
        JSON.stringify({ success: false, message: "Name, E-Mail und Datum sind Pflichtfelder." }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // HTML-Inhalt im Retro-Brutalist-Look (identisch mit dem alten PHP-Template)
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: monospace; line-height: 1.6; color: #121212; background-color: #fcfaf2; padding: 20px; }
        .card { background-color: #ffffff; border: 3px solid #121212; padding: 25px; box-shadow: 6px 6px 0px #121212; }
        h2 { border-bottom: 2px dashed #121212; padding-bottom: 10px; text-transform: uppercase; margin-top: 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        td { padding: 8px 0; border-bottom: 1px dashed rgba(18, 18, 18, 0.1); }
        td.label { font-weight: bold; width: 35%; text-transform: uppercase; }
        .price { font-size: 1.2em; font-weight: bold; background-color: #ffde00; display: inline-block; padding: 2px 8px; border: 1px solid #121212; }
        .message-box { background-color: #f0f0f0; border: 1px solid #121212; padding: 15px; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class='card'>
        <h2>// NEUE DJ-ANFRAGE EMPFANGEN</h2>
        <table>
          <tr><td class='label'>Name:</td><td>${name}</td></tr>
          <tr><td class='label'>E-Mail:</td><td><a href='mailto:${email}'>${email}</a></td></tr>
          <tr><td class='label'>Telefon:</td><td>${phone || 'Nicht angegeben'}</td></tr>
          <tr><td class='label'>Datum:</td><td>${date}</td></tr>
          <tr><td class='label'>Ort / Location:</td><td>${location || 'Nicht angegeben'}</td></tr>
          <tr><td class='label'>Anlass:</td><td>${eventType || 'Nicht angegeben'}</td></tr>
          <tr><td class='label'>Spielzeit:</td><td>${hours || 'Nicht angegeben'} ${typeof hours === 'number' ? 'Stunden' : ''}</td></tr>
          <tr><td class='label'>Gästeanzahl:</td><td>${guests || 'Nicht angegeben'}</td></tr>
          <tr><td class='label'>Zusatzpakete:</td><td>${addons || 'Keine'}</td></tr>
          <tr><td class='label'>Preisschätzung:</td><td><span class='price'>${estimatedPrice || '0 €'}</span></td></tr>
        </table>
        
        <h3>Nachricht / Ergänzungen:</h3>
        <div class='message-box'>
          ${message ? message.replace(/\n/g, '<br>') : "Keine Nachricht hinterlassen."}
        </div>
      </div>
    </body>
    </html>
    `;

    // Resend API Key aus den Umgebungsvariablen von Cloudflare Pages holen
    const resendApiKey = env.RESEND_API_KEY;
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ success: false, message: "Server-Konfigurationsfehler: E-Mail API Key fehlt." }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // HTTP-POST an die Resend API senden
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Kieler-DJ Terminal <anfrage@kieler-dj.de>', // Verifizierte Domain in Resend vorausgesetzt
        to: ['matthias.gawlich@gmail.com'],
        subject: `Neue DJ-Anfrage: ${eventType || 'Allgemein'} am ${date}`,
        html: htmlContent,
        reply_to: `${name} <${email}>`
      })
    });

    if (resendResponse.ok) {
      const responseData = await resendResponse.json();
      return new Response(
        JSON.stringify({ success: true, id: responseData.id }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } else {
      const errorData = await resendResponse.text();
      return new Response(
        JSON.stringify({ success: false, message: `E-Mail-Versand über Resend fehlgeschlagen: ${errorData}` }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: `Interner Serverfehler: ${error.message}` }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// OPTIONS preflight-Requests für CORS abfangen (falls nötig)
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    }
  });
}
