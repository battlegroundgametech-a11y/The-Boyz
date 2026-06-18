const crypto = require("crypto");

function verifyToken(token) {
  const secret = process.env.VERIFICATION_SECRET;
  const [encoded, signature] = String(token || "").split(".");

  if (!encoded || !signature) return null;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(encoded)
    .digest("base64url");

  if (signature !== expected) return null;

  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));

  if (Date.now() > payload.exp) return null;

  return payload;
}

module.exports = async function handler(req, res) {
  const payload = verifyToken(req.query.token);

  res.setHeader("Content-Type", "text/html");

  if (!payload) {
    res.statusCode = 400;
    return res.end("<h1>Verification failed</h1><p>Invalid or expired link.</p>");
  }

  return res.end(`
    <h1>Email verified</h1>
    <p>Your email ${payload.email} has been verified successfully.</p>
    <a href="/">Back to site</a>
  `);
};
