import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send("Method Not Allowed");

  const { nama, discordid } = req.body;

  if (!nama || !discordid) return res.status(400).send("Nama dan Discord ID wajib diisi.");
  if (nama.length > 20) return res.status(400).send("Nama terlalu panjang.");

  const toxicPath = path.resolve('./toxic.json');
  const data = await fs.readFile(toxicPath, 'utf8');
  const toxicWords = JSON.parse(data);
  const isToxic = toxicWords.some(word => nama.toLowerCase().includes(word.toLowerCase()));
  if (isToxic) return res.status(400).send("Nama mengandung kata terlarang.");

  try {
    const conn = await mysql.createConnection({
      host: "159.65.7.144",
      user: "u51_MHnAX6uJAz",
      password: "plG8BR!zf=yz28.eZTtol+Zw",
      database: "s51_Vallmorra",
      ssl: { rejectUnauthorized: false } // ← FALSE karena ini IP VPS, bukan PlanetScale
    });

    const [rows] = await conn.execute('SELECT * FROM ucp WHERE ucp_name = ?', [nama]);
    if (rows.length > 0) return res.status(400).send("Nama sudah digunakan.");

    const pin_code = Math.floor(1000 + Math.random() * 9000);
    await conn.execute(
      'INSERT INTO ucp (ucp_name, discordid, pin_code) VALUES (?, ?, ?)',
      [nama, discordid, pin_code]
    );

    await conn.end();

    return res.status(200).send(`
      <strong>Pendaftaran berhasil!</strong><br>
      Nama: ${nama}<br>
      Discord ID: ${discordid}<br>
      PIN: ${pin_code}
    `);
  } catch (err) {
    console.error("Koneksi Gagal:", err);
    return res.status(500).send("Gagal menyambung ke database.");
  }
}