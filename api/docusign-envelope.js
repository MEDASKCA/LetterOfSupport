const docusign = require('docusign-esign');

// Helper to get JWT access token
async function getJWTToken() {
  const apiClient = new docusign.ApiClient();
  // IMPORTANT: Use demo auth server for developer/demo accounts
  apiClient.setBasePath('https://account-d.docusign.com');

  // Handle private key - replace escaped newlines with actual newlines
  let privateKey = process.env.DOCUSIGN_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('DOCUSIGN_PRIVATE_KEY environment variable is not set');
  }

  // If the key was pasted with literal \n, replace them
  privateKey = privateKey.replace(/\\n/g, '\n');

  // Ensure key has proper header/footer
  if (!privateKey.includes('BEGIN RSA PRIVATE KEY')) {
    throw new Error('Invalid private key format - missing BEGIN RSA PRIVATE KEY header');
  }

  try {
    // Set OAuth base path explicitly for demo environment
    apiClient.setOAuthBasePath('account-d.docusign.com');

    const results = await apiClient.requestJWTUserToken(
      process.env.DOCUSIGN_INTEGRATION_KEY,
      process.env.DOCUSIGN_USER_ID,
      ['signature', 'impersonation'],
      privateKey,
      3600
    );

    return results.body.access_token;
  } catch (error) {
    console.error('JWT Token Error:', error.message);
    throw new Error(`Failed to get JWT token: ${error.message}`);
  }
}

// Create and send DocuSign envelope
async function createEnvelope(accessToken, pdfBase64, referee, filename) {
  const apiClient = new docusign.ApiClient();
  apiClient.setBasePath(process.env.DOCUSIGN_BASE_PATH);
  apiClient.addDefaultHeader('Authorization', 'Bearer ' + accessToken);

  const envelopesApi = new docusign.EnvelopesApi(apiClient);
  const accountId = process.env.DOCUSIGN_ACCOUNT_ID;

  // Create the envelope definition
  const envelope = new docusign.EnvelopeDefinition();
  envelope.emailSubject = 'NHS CEP Letter of Support - Please Sign';
  envelope.emailBlurb = `Dear ${referee.name},\n\nPlease review and sign this letter of support for Alex Monterubio's NHS Clinical Entrepreneur Programme application.\n\nThank you for your endorsement.\n\n— MEDASKCA Team`;

  // Add the PDF document
  const doc = new docusign.Document();
  doc.documentBase64 = pdfBase64;
  doc.name = filename;
  doc.fileExtension = 'pdf';
  doc.documentId = '1';
  envelope.documents = [doc];

  // Add the signer (referee)
  const signer = new docusign.Signer();
  signer.email = referee.email;
  signer.name = referee.name;
  signer.recipientId = '1';
  signer.routingOrder = '1';

  // Add signature tab
  const signHere = new docusign.SignHere();
  signHere.documentId = '1';
  signHere.pageNumber = '1';
  signHere.recipientId = '1';
  signHere.tabLabel = 'SignatureTab';
  signHere.xPosition = '100';
  signHere.yPosition = '700';

  signer.tabs = new docusign.Tabs();
  signer.tabs.signHereTabs = [signHere];

  // Add recipients
  envelope.recipients = new docusign.Recipients();
  envelope.recipients.signers = [signer];
  envelope.status = 'sent'; // Send immediately

  // Create the envelope
  const results = await envelopesApi.createEnvelope(accountId, {
    envelopeDefinition: envelope
  });

  return results;
}

// Main handler
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pdfBase64, referee, filename } = req.body;

    if (!pdfBase64 || !referee || !referee.email || !referee.name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get JWT access token
    const accessToken = await getJWTToken();

    // Create and send envelope
    const envelope = await createEnvelope(accessToken, pdfBase64, referee, filename);

    return res.status(200).json({
      success: true,
      envelopeId: envelope.envelopeId,
      status: envelope.status,
      message: `DocuSign envelope sent to ${referee.email}`
    });

  } catch (error) {
    console.error('DocuSign error:', error);
    return res.status(500).json({
      error: 'Failed to send DocuSign envelope',
      details: error.message
    });
  }
}
