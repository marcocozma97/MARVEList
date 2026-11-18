function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (data.secret !== PropertiesService.getScriptProperties().getProperty('SECRET')) {
      return jsonResponse({ ok: false, error: 'Chiave non valida' });
    }

    // Gmail ha un limite giornaliero di destinatari: superato quello, il backend deve saperlo
    if (MailApp.getRemainingDailyQuota() < 1) {
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
