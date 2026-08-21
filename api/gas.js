export const config = {
  api: {
    bodyParser: false, // Matikan auto-parser agar kita baca raw body sendiri
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
  }

  const GAS_URL = 'https://script.google.com/macros/s/AKfycbx7zUao5wg2xWMT4JNFonvsNPa-ywT7OWfWHl_UJ6n_fAn6tRBPdG7UkH0xbfF3r54/exec';

  try {
    // Baca raw body stream
    const rawBody = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => { data += chunk.toString(); });
      req.on('end', () => resolve(data));
      req.on('error', reject);
    });

    if (!rawBody) {
      return res.status(400).json({ status: 'error', message: 'Request body kosong.' });
    }

    // Kirim ke GAS dengan format persis sama seperti yang dikirim client (form-urlencoded)
    const gasResponse = await fetchWithRetry(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: rawBody,
    });

    const text = await gasResponse.text();

    try {
      const data = JSON.parse(text);
      return res.status(200).json(data);
    } catch (parseError) {
      console.error('[gas proxy] GAS returned non-JSON. Status:', gasResponse.status, 'Body prefix:', text.substring(0, 300));
      return res.status(502).json({
        status: 'error',
        message: 'Backend Google Apps Script mengembalikan respons tidak valid (bukan JSON). Kemungkinan GAS belum di-deploy atau sedang error.',
        detail: text.substring(0, 200),
      });
    }
  } catch (error) {
    console.error('[gas proxy] Fetch error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Proxy error: ' + error.message });
  }
}

// Helper: retry 1x jika request gagal (misal timeout network)
async function fetchWithRetry(url, options, retries = 1) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000); // 55 detik timeout
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeout);
    return response;
  } catch (err) {
    clearTimeout(timeout);
    if (retries > 0 && (err.name === 'AbortError' || err.name === 'FetchError')) {
      console.warn('[gas proxy] Retry after error:', err.message);
      return fetchWithRetry(url, options, retries - 1);
    }
    throw err;
  }
}
