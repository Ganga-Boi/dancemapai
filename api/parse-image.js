// Vercel Serverless Function - Claude Vision Proxy
// API-nøgle er SIKKER som environment variable

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb' // Tillad store billeder
    }
  }
};

export default async function handler(req, res) {
  // Kun POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ 
      success: false, 
      error: 'ANTHROPIC_API_KEY not configured in Vercel' 
    });
  }

  try {
    const { image, mediaType } = req.body;

    if (!image) {
      return res.status(400).json({ success: false, error: 'No image provided' });
    }

    // Fjern data URL prefix hvis det er der
    let imageData = image;
    if (imageData.includes(',')) {
      imageData = imageData.split(',')[1];
    }

    const prompt = `Du er en dansk event-parser. Analyser dette billede og udtræk event-information.

Returner KUN valid JSON (ingen anden tekst):
{
  "dato": "YYYY-MM-DD",
  "navn": "Event navn",
  "starttid": "HH:MM",
  "sluttid": "HH:MM",
  "dansetype": "Salsa|Bachata|Kizomba|Zouk|Tango|Swing|Latin",
  "sted": "Venue navn",
  "adresse": "Gade og nummer",
  "by": "By",
  "pris": "Pris info",
  "confidence": 0.95
}

Regler:
- Dato i ISO format (YYYY-MM-DD), brug ${new Date().getFullYear()} hvis årstal mangler
- Tider i 24-timers format (HH:MM)
- Hvis sluttid mangler: sociale +4 timer, workshop +2 timer
- Tom streng "" hvis værdi ikke findes

Kendte venues:
- Kedelhallen → Nyelandsvej 75A, Frederiksberg
- Kaffesalonen → Peblinge Dossering 7, København
- Copenhagen Salsa Academy/CSA → Kastanie Allé 20, Vanløse
- DGI-byen → Tietgensgade 65, København
- Kulturhuset Islands Brygge → Islands Brygge 18, København
- Spejlsalen → Birkevej 3, Hundested`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            { 
              type: 'image', 
              source: { 
                type: 'base64', 
                media_type: mediaType || 'image/png', 
                data: imageData 
              } 
            },
            { type: 'text', text: prompt }
          ]
        }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Claude API error:', response.status, errText);
      return res.status(response.status).json({ 
        success: false, 
        error: `Claude API error: ${response.status}` 
      });
    }

    const result = await response.json();
    let content = result.content[0].text;

    // Parse JSON fra Claude's svar
    if (content.includes('```json')) {
      content = content.split('```json')[1].split('```')[0];
    } else if (content.includes('```')) {
      content = content.split('```')[1].split('```')[0];
    }

    const parsed = JSON.parse(content.trim());

    return res.status(200).json({
      success: true,
      data: parsed,
      confidence: parsed.confidence || 0.8
    });

  } catch (err) {
    console.error('Parse image error:', err);
    return res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
}
