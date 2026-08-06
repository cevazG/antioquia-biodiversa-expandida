'use strict';
// Renderiza una URI otpauth:// como imagen QR en un data URL (PNG base64)
// para mostrarla directamente en <img src="..."> del panel admin, sin
// guardar el archivo en disco.
const QRCode = require('qrcode');

function generarDataUrl(uri) {
  return QRCode.toDataURL(uri);
}

module.exports = { generarDataUrl };
