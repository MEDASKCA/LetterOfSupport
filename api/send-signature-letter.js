import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const ALEX_EMAIL = 'alexmonterubio@live.com';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      refCode,
      filename,
      pdfBase64,
      referee
    } = req.body;

    // Validate required fields
    if (!filename || !pdfBase64 || !referee || !referee.name || !referee.email) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['filename', 'pdfBase64', 'referee.name', 'referee.email']
      });
    }

    // Convert base64 to Buffer
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');

    // Email subject
    const emailSubject = `NHS CEP Letter of Support – ${referee.name}${refCode ? ` – Ref: ${refCode}` : ''}`;

    // Email to referee
    const refereeEmailBody = `
      <p>Dear ${referee.name},</p>

      <p>Thank you for providing your letter of support for Alex Monterubio's application to the NHS Clinical Entrepreneurs Programme.</p>

      <p>Please find the signed letter attached as a PDF. A copy has also been sent to Alex Monterubio for submission.</p>

      ${refCode ? `<p><strong>Reference Code:</strong> ${refCode}</p>` : ''}

      <p>This letter was generated through the NHS CEP Digital Endorsement Form developed by Alex Monterubio.</p>

      <p>If you have any questions, please contact Alex at ${ALEX_EMAIL}.</p>

      <p>With appreciation,<br/>
      Alex Monterubio</p>
    `;

    // Email to Alex
    const alexEmailBody = `
      <p>Dear Alex,</p>

      <p>A new letter of support has been submitted by <strong>${referee.name}</strong> (${referee.role || 'Role not specified'}).</p>

      <p>The signed letter is attached as a PDF. A copy has also been sent to the referee at ${referee.email}.</p>

      ${refCode ? `<p><strong>Reference Code:</strong> ${refCode}</p>` : ''}
      ${referee.phone ? `<p><strong>Contact:</strong> ${referee.phone}</p>` : ''}

      <p>Best regards,<br/>
      Your NHS CEP Letter System</p>
    `;

    // Send email to referee
    const refereeEmailResult = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
      to: referee.email,
      subject: emailSubject,
      html: refereeEmailBody,
      attachments: [
        {
          filename: filename,
          content: pdfBuffer,
        },
      ],
    });

    console.log('Email sent to referee:', refereeEmailResult);

    // Send email to Alex
    const alexEmailResult = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
      to: ALEX_EMAIL,
      subject: emailSubject,
      html: alexEmailBody,
      attachments: [
        {
          filename: filename,
          content: pdfBuffer,
        },
      ],
    });

    console.log('Email sent to Alex:', alexEmailResult);

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Emails sent successfully',
      refereeEmailId: refereeEmailResult.data?.id,
      alexEmailId: alexEmailResult.data?.id
    });

  } catch (error) {
    console.error('Error sending emails:', error);
    return res.status(500).json({
      error: 'Failed to send emails',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
