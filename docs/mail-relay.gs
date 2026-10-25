function doPost(e) {
  const data = JSON.parse(e.postData.contents);

  if (data.secret !== PropertiesService.getScriptProperties().getProperty('SECRET')) {
    return jsonResponse({ ok: false, error: 'Chiave non valida' });
  }

  const logo = Utilities.newBlob(Utilities.base64Decode(data.logo), 'image/png', 'marvelist-logo.png');

  MailApp.sendEmail({
    to: data.to,
    subject: data.subject,
    htmlBody: data.html,
    name: 'MARVEList',
    inlineImages: { marvelistLogo: logo }
  });

  return jsonResponse({ ok: true });
}

function jsonResponse(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}
