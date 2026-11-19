function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (data.secret !== PropertiesService.getScriptProperties().getProperty('SECRET')) {
      return jsonResponse({ ok: false, error: 'Chiave non valida' });
    }

    // Gmail ha un limite giornaliero di destinatari: superato quello, il backend deve saperlo.
    // "reserve" tiene da parte gli ultimi invii (le mail di conferma ne lasciano 10 al recupero password)
    const reserve = Math.max(0, Number(data.reserve) || 0);
    if (MailApp.getRemainingDailyQuota() <= reserve) {
      return jsonResponse({ ok: false, error: 'Limite giornaliero di email raggiunto' });
    }

    const logo = Utilities.newBlob(Utilities.base64Decode(data.logo), 'image/png', 'marvelist-logo.png');

    MailApp.sendEmail({
      to: data.to,
      subject: data.subject,
      htmlBody: data.html,
      name: 'MARVEList',
      inlineImages: { marvelistLogo: logo }
    });

    return jsonResponse({ ok: true, remaining: MailApp.getRemainingDailyQuota() });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function jsonResponse(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}
