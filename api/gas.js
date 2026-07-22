export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
    }

    const GAS_URL = 'https://script.google.com/macros/s/AKfycbzre0bIZGUHMaXZpEDwduRnDrtYbb6zprcGYsjxXPdovLq1lGm_lA5bZPK6c2HnlIU/exec';

    try {
        const bodyParams = new URLSearchParams();
        if (req.body && typeof req.body === 'object') {
            for (const key in req.body) {
                bodyParams.append(key, req.body[key]);
            }
        } else if (typeof req.body === 'string') {
            const params = new URLSearchParams(req.body);
            for (const [key, value] of params.entries()) {
                bodyParams.append(key, value);
            }
        }

        const response = await fetch(GAS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: bodyParams.toString()
        });

        const text = await response.text();

        try {
            const data = JSON.parse(text);
            res.status(200).json(data);
        } catch (parseError) {
            console.error('Failed to parse GAS response:', text);
            res.status(502).json({
                status: 'error',
                message: 'Backend Google Apps Script mengembalikan respons HTML.',
                html: text.substring(0, 500)
            });
        }
    } catch (error) {
        console.error('Fetch to GAS failed:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
}
