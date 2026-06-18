const crypto = require("crypto");

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

function createToken(payload) {
  const secret = process.env.VERIFICATION_SECRET;
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");

  const signature = crypto
    .createHmac("sha256", secret)
    .update(encoded)
    .digest("base64url");

  return `${encoded}.${signature}`;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed" });
  }

  const { name = "", email = "" } = req.body || {};
  const cleanEmail = String(email).trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return json(res, 400, { error: "Enter a valid email address." });
  }

  const token = createToken({
    email: cleanEmail,
    name,
    exp: Date.now() + 24 * 60 * 60 * 1000,
  });

  const baseUrl = process.env.APP_URL;
  const verifyUrl = `${baseUrl}/api/verify?token=${encodeURIComponent(token)}`;

  const senderResponse = await fetch("https://api.sender.net/v2/message/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SENDER_API_TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      from: {
        email: process.env.SENDER_FROM_EMAIL,
        name: process.env.SENDER_FROM_NAME || "Website",
      },
      to: {
        email: cleanEmail,
        name: name || cleanEmail,
      },
      subject: "Verify your account",
      text: `Verify your account here: ${verifyUrl}`,
      html: `
        <h2>Verify your account</h2>
        <p>Click the link below:</p>
        <p><a href="${verifyUrl}">Verify Email</a></p>
        <p>This link expires in 24 hours.</p>
      `,
    }),
  });

  if (!senderResponse.ok) {
    const errorText = await senderResponse.text();
    return json(res, 500, { error: errorText });
  }

  return json(res, 200, {
    ok: true,
    message: "Verification email sent.",
  });
};
