import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).send("Missing url parameter");
  }

  try {
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream'
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    response.data.pipe(res);
  } catch (error: any) {
    console.error("Proxy Error:", error.message);
    res.status(500).send("Failed to fetch audio");
  }
}

