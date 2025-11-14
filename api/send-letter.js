import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const ALEX_EMAIL = process.env.ALEX_EMAIL || 'amonterubio@medaskca.com';

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

    console.log('Received payload:', { refCode, filename, referee });

    // Validate required fields
    if (!filename || !pdfBase64 || !referee || !referee.name || !referee.email) {
      console.error('Missing fields:', { filename: !!filename, pdfBase64: !!pdfBase64, referee, refereeName: referee?.name, refereeEmail: referee?.email });
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
      <div style="text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #e5e7eb;">
        <img src="https://github.com/MEDASKCA/OPS/raw/refs/heads/main/logo-medaskca.png" alt="MEDASKCA" style="height: 50px; width: auto; display: inline-block;"/>
        <div style="font-size: 11px; color: #6b7280; margin-top: 6px; letter-spacing: 1px; font-weight: 400;">Reimagined</div>
      </div>

      <p>Dear ${referee.name},</p>

      <p>Thank you for providing your letter of support for my application to the NHS Clinical Entrepreneur Programme.</p>

      <p>Please find the signed letter attached as a PDF. A copy has also been sent to me for submission.</p>

      <p>I am hopeful that my innovation will be accepted into the programme, and I look forward to the possibility of collaborating with you in the future as the work continues to progress.</p>

      ${refCode ? `<p><strong>Reference Code:</strong> ${refCode}</p>` : ''}

      <p>If you have any questions, please feel free to contact me at ${ALEX_EMAIL}.</p>

      <p>With sincere appreciation,<br/>
      <strong>Alex Monterubio</strong><br/>
      NHS Clinical Entrepreneur Programme Candidate / Executive MBA Student<br/>
      Founder, <a href="https://medaskca.com" target="_blank" style="color: #2563eb; text-decoration: none;">MEDASKCA™</a></p>
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
    console.log('Sending email to referee:', referee.email);
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

    console.log('Email sent to referee successfully:', refereeEmailResult);

    // Send email to Alex
    console.log('Sending email to Alex:', ALEX_EMAIL);
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

    console.log('Email sent to Alex successfully:', alexEmailResult);

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
