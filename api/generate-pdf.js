import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { formData, signatureDataURL } = req.body;

    // Validate required fields
    if (!formData) {
      return res.status(400).json({
        error: 'Missing required field: formData'
      });
    }

    // Launch Puppeteer with chromium
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    // Build the complete HTML document
    const html = buildCompleteHTML(formData, signatureDataURL);

    // Set page content
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Generate PDF with A4 size
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      }
    });

    await browser.close();

    // Convert PDF to base64
    const pdfBase64 = pdfBuffer.toString('base64');

    // Generate filename
    const effectiveRole = (formData.refRole === "Other" && formData.refRoleOther)
      ? formData.refRoleOther
      : formData.refRole;
    const filename = `Letter_of_Support_${(effectiveRole || 'Referee').replace(/\s+/g,'_')}_Alex_Monterubio.pdf`;

    // Return PDF as base64
    return res.status(200).json({
      success: true,
      pdfBase64,
      filename
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return res.status(500).json({
      error: 'Failed to generate PDF',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Build complete HTML document for PDF generation
function buildCompleteHTML(data, signatureDataURL) {
  const letterHTML = buildLetterHTML(data, signatureDataURL);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
* { box-sizing: border-box; }
body {
  margin: 0;
  padding: 0;
  font-family: Arial, sans-serif;
}
.paper {
  width: 210mm;
  min-height: 297mm;
  background: #fff;
  margin: 0;
  padding: 0;
}
.paper .page {
  padding: 20mm 20mm 20mm 20mm;
  font-family: Arial, sans-serif;
  color: #1f2937;
  line-height: 1.5;
  font-size: 11pt;
}

.sender-block {
  font-family: Arial, sans-serif;
  font-size: 14px;
  line-height: 1.4;
  text-align: left;
  margin: 0 0 4px 0;
}
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.header-block {
  display: flex;
  justify-content: flex-end;
  padding: 0;
  font-family: Arial, sans-serif;
}
.trust-header { text-align: right; }

.nhs-logo-img {
  display: block;
  width: 72px;
  height: auto;
  margin-left: auto;
}

.trust-header .trust-name {
  font-size: 18px;
  font-weight: bold;
  margin-top: 6px;
  color: #000;
}
.trust-header .trust-sub {
  font-size: 12px;
  font-weight: bold;
  color: #1D8FDB;
}
.trust-header .trust-hospital {
  font-size: 14px;
  font-weight: 600;
  color: #000;
  margin-top: 10px;
}
.trust-header .trust-address {
  font-size: 14px;
  font-weight: 400;
  color: #000;
  margin-top: 6px;
  line-height: 1.4;
}

.letter-date {
  font-size: 12pt;
  margin-top: 12px;
  margin-bottom: 12px;
  text-align: left;
}

.recipient-block {
  margin-bottom: 8px;
}
.recipient-subject {
  font-weight: bold;
  margin-bottom: 12px;
}

.letter-body p {
  margin: 0 0 9pt;
}
.letter-body p.sal {
  margin-top: 10pt;
  font-weight: 500;
}
.letter-closing { margin-top: 14pt; }
.letter-sign { margin-top: 10pt; height: 60px; }
.letter-sign img { max-height: 60px; }
.letter-signoff { margin: 8pt 0 0; }
.letter-signoff .name { font-weight: 700; }
</style>
</head>
<body>
${letterHTML}
</body>
</html>
  `.trim();
}

// Opening paragraphs by role
const openingsByRole = {
  "Chief Executive Officer": "As Chief Executive Officer of our organisation, I am pleased to provide this letter of support for Alex Monterubio, who previously worked as a Senior Team Leader in Theatres at the Royal London Hospital, Barts Health NHS Trust.",
  "Chief Nurse": "In my capacity as Chief Nurse, I am pleased to provide this letter of support for Alex Monterubio, who previously worked as a Senior Team Leader in Theatres at the Royal London Hospital, Barts Health NHS Trust.",
  "Medical Director": "In my role as Medical Director, I am pleased to provide this letter of support for Alex Monterubio, who previously worked as a Senior Team Leader in Theatres at the Royal London Hospital, Barts Health NHS Trust.",
  "Director of Nursing": "As Director of Nursing, I am pleased to provide this letter of support for Alex Monterubio, who previously worked as a Senior Team Leader in Theatres at the Royal London Hospital, Barts Health NHS Trust.",
  "Chief Operating Officer (COO)": "In my capacity as Chief Operating Officer (COO), I am pleased to provide this letter of support for Alex Monterubio, who previously worked as a Senior Team Leader in Theatres at the Royal London Hospital, Barts Health NHS Trust.",
  "Chief Information Officer (CIO)": "As Chief Information Officer (CIO) for our organisation, I am pleased to provide this letter of support for Alex Monterubio, who previously worked as a Senior Team Leader in Theatres at the Royal London Hospital, Barts Health NHS Trust.",
  "Chief Nursing Information Officer (CNIO)": "In my capacity as Chief Nursing Information Officer (CNIO), I am pleased to provide this letter of support for Alex Monterubio, who previously worked as a Senior Team Leader in Theatres at the Royal London Hospital, Barts Health NHS Trust.",
  "Chief Clinical Information Officer (CCIO)": "As Chief Clinical Information Officer (CCIO), I am pleased to support Alex Monterubio, who previously worked as a Senior Team Leader in Theatres at the Royal London Hospital, Barts Health NHS Trust.",
  "Chief Digital Information Officer (CDIO)": "In my role as Chief Digital Information Officer (CDIO), I am pleased to provide this letter of support for Alex Monterubio, who previously worked as a Senior Team Leader in Theatres at the Royal London Hospital, Barts Health NHS Trust.",
  "Divisional Operations Director": "As Divisional Operations Director, I am pleased to provide this letter of support for Alex Monterubio, who previously worked as a Senior Team Leader in Theatres at the Royal London Hospital, Barts Health NHS Trust.",
  "Divisional General Manager": "As Divisional General Manager, I am pleased to provide this letter of support for Alex Monterubio, who previously worked as a Senior Team Leader in Theatres at the Royal London Hospital, Barts Health NHS Trust.",
  "Divisional/Clinical Director": "In my capacity as Divisional/Clinical Director, I am pleased to provide this letter of support for Alex Monterubio, who previously worked as a Senior Team Leader in Theatres at the Royal London Hospital, Barts Health NHS Trust.",
  "Divisional Nurse Director": "As Divisional Nurse Director, I am pleased to support Alex Monterubio, who previously worked as a Senior Team Leader in Theatres at the Royal London Hospital, Barts Health NHS Trust.",
  "General Manager": "As General Manager for the service, I am pleased to provide this letter of support for Alex Monterubio, who previously worked as a Senior Team Leader in Theatres at the Royal London Hospital, Barts Health NHS Trust.",
  "Deputy General Manager": "As Deputy General Manager, I am pleased to support Alex Monterubio, who previously worked as a Senior Team Leader in Theatres at the Royal London Hospital, Barts Health NHS Trust.",
  "Service Manager": "As Service Manager for the department, I am pleased to provide a letter of support for Alex Monterubio, who previously worked as a Senior Team Leader in Theatres at the Royal London Hospital, Barts Health NHS Trust.",
  "Associate Service Manager": "In my role as Associate Service Manager, I am pleased to provide this letter of support for Alex Monterubio, who previously worked as a Senior Team Leader in Theatres at the Royal London Hospital, Barts Health NHS Trust.",
  "Service Delivery Manager": "In my role as Service Delivery Manager for Theatres at the Royal London Hospital, Barts Health NHS Trust, I am pleased to provide this letter of support for Alex Monterubio, who previously worked as a Senior Team Leader within the department.",
  "Head of Perioperative Services": "As Head of Perioperative Services at the Royal London Hospital, Barts Health NHS Trust, I am pleased to provide this letter of support for Alex Monterubio, who previously worked as a Senior Team Leader in Theatres.",
  "Perioperative Services Manager": "In my role as Perioperative Services Manager, I am pleased to support Alex Monterubio, who previously worked as a Senior Team Leader in Theatres at the Royal London Hospital, Barts Health NHS Trust.",
  "Operations Manager": "As Operations Manager for perioperative services, I am pleased to support Alex Monterubio, who previously worked as a Senior Team Leader in Theatres at the Royal London Hospital, Barts Health NHS Trust.",
  "Deputy Operations Manager": "In my role as Deputy Operations Manager, I am pleased to provide this letter of support for Alex Monterubio, who previously worked as a Senior Team Leader in Theatres at the Royal London Hospital, Barts Health NHS Trust.",
  "Site Manager": "As Site Manager, I am pleased to provide this letter of support for Alex Monterubio, who previously worked as a Senior Team Leader in Theatres at the Royal London Hospital, Barts Health NHS Trust.",
  "Associate Director of Nursing": "In my capacity as Associate Director of Nursing, I am pleased to provide a letter of support for Alex Monterubio, who previously worked as a Senior Team Leader in Theatres at the Royal London Hospital, Barts Health NHS Trust.",
  "Head of Nursing": "As Head of Nursing, I am pleased to provide this letter of support for Alex Monterubio, who previously worked as a Senior Team Leader in Theatres at the Royal London Hospital, Barts Health NHS Trust.",
  "Matron": "As Matron for the Theatre Department, I am pleased to provide a letter of support for Alex Monterubio, who previously worked as a Senior Team Leader in Theatres at the Royal London Hospital, Barts Health NHS Trust.",
  "Deputy Matron": "In my role as Deputy Matron, I am pleased to provide this letter of support for Alex Monterubio, who previously worked as a Senior Team Leader in Theatres at the Royal London Hospital, Barts Health NHS Trust.",
  "Practice Development Nurse": "In my role as Practice Development Nurse, I am pleased to provide a letter of support for Alex Monterubio, who previously worked as a Senior Team Leader in Theatres at the Royal London Hospital, Barts Health NHS Trust.",
  "Senior Team Leader": "In my capacity as a Senior Team Leader in theatres, I am pleased to provide a letter of support for Alex Monterubio, who previously worked as a Senior Team Leader in Theatres at the Royal London Hospital, Barts Health NHS Trust.",
  "Associate Team Leader": "As an Associate Team Leader within the perioperative service, I am pleased to provide this letter of support for Alex Monterubio, who previously worked as a Senior Team Leader in Theatres at the Royal London Hospital, Barts Health NHS Trust.",
  "Consultant Anaesthetist": "I am pleased to provide a letter of support for Alex Monterubio, with whom I worked during theatre sessions at the Royal London Hospital, Barts Health NHS Trust, where Alex previously held the position of Senior Team Leader in Theatres.",
  "Consultant Surgeon": "As a Consultant Surgeon at the Royal London Hospital, Barts Health NHS Trust, I am pleased to provide this letter of support for Alex Monterubio, who previously worked as a Senior Team Leader in Theatres.",
  "Senior Registrar": "I am pleased to provide a letter of support for Alex Monterubio, whom I had the opportunity to work with during surgical lists at the Royal London Hospital, Barts Health NHS Trust, where Alex previously worked as a Senior Team Leader in Theatres.",
  "Surgical Fellow": "As a Surgical Fellow working within the theatre environment, I am pleased to provide this letter of support for Alex Monterubio, who previously worked as a Senior Team Leader in Theatres at the Royal London Hospital, Barts Health NHS Trust.",
  "Anaesthetic Fellow": "As an Anaesthetic Fellow, I am pleased to provide this letter of support for Alex Monterubio, who previously worked as a Senior Team Leader in Theatres at the Royal London Hospital, Barts Health NHS Trust.",
  "Specialty Doctor / SAS Doctor": "As a Specialty (SAS) Doctor working regularly in theatres, I am pleased to provide this letter of support for Alex Monterubio, who previously worked as a Senior Team Leader in Theatres at the Royal London Hospital, Barts Health NHS Trust."
};

function splitTrust(orgValue) {
  if (!orgValue) return { main: "", sub: "" };
  const v = orgValue.trim();
  const idx = v.indexOf(" NHS");
  if (idx === -1) {
    return { main: v, sub: "" };
  }
  return {
    main: v.slice(0, idx).trim(),
    sub: v.slice(idx + 1).trim()
  };
}

function toUKLong(dateISO) {
  try {
    const d = new Date(dateISO);
    if (isNaN(d)) return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) {
    return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }
}

function buildLetterHTML(data, signatureDataURL) {
  const {
    refName,
    refRole,
    refRoleOther,
    org,
    email,
    phone,
    dateLine,
    hospitalName,
    hospitalAddr1,
    hospitalAddr2,
    hospitalCity,
    hospitalPostcode,
    qDurationSelect,
    qDurationDetail,
    qCapacitySelect,
    qCapacityOther,
    qCapacityDetail,
    strengthsSelected = [],
    qStrengthsOther,
    qProfessionalism,
    qTeamwork,
    qSuitabilitySelect,
    qSuitabilityDetail
  } = data;

  const effectiveRole = (refRole === "Other" && refRoleOther) ? refRoleOther : refRole;

  const opening = openingsByRole[effectiveRole] ||
    "I am pleased to provide a letter of support for Alex Monterubio, who previously worked as a Senior Team Leader in Theatres at the Royal London Hospital, Barts Health NHS Trust.";

  const dateStr = dateLine ? toUKLong(dateLine) : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const hospital = hospitalName || "";
  const { main: trustMain, sub: trustSub } = splitTrust(org || "");

  const addressHTML = (hospitalAddr1 || hospitalAddr2 || hospitalCity || hospitalPostcode)
    ? `
      <div class="trust-address">
        ${hospitalAddr1 ? hospitalAddr1 + "<br/>" : ""}
        ${hospitalAddr2 ? hospitalAddr2 + "<br/>" : ""}
        ${(hospitalCity || hospitalPostcode)
          ? `${hospitalCity || ""}${hospitalCity && hospitalPostcode ? ", " : ""}${hospitalPostcode || ""}`
          : ""
        }
      </div>
    `
    : "";

  // Use base64 encoded NHS logo to avoid file path issues
  const nhsLogoBase64 = "data:image/png;base64,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";

  const headerHTML = `
    <div class="header-block">
      <div class="trust-header">
        <img src="${nhsLogoBase64}" alt="NHS logo" class="nhs-logo-img"/>
        ${trustMain ? `<div class="trust-name">${trustMain}</div>` : ""}
        ${trustSub ? `<div class="trust-sub">${trustSub}</div>` : ""}
        ${hospital ? `<div class="trust-hospital">${hospital}</div>` : ""}
        ${addressHTML}
      </div>
    </div>
  `;

  const senderHTML = `
    <div class="sender-block">
      <div>${refName || "[Referee Name]"}</div>
      <div>${effectiveRole || "[Role]"}</div>
      ${phone ? `<div>Tel: ${phone}</div>` : ""}
      ${email ? `<div>Email: ${email}</div>` : ""}
    </div>
  `;

  const recipientHTML = `
    <div class="recipient-block">
      <div>NHS Clinical Entrepreneur Team</div>
      <div>c/o Anglia Ruskin University</div>
      <div>Bishop Hall Lane</div>
      <div>Chelmsford</div>
      <div>Essex</div>
      <div>CM1 1SQ</div>
    </div>
    <div class="recipient-subject">
      Re: Letter of Support for Alex Monterubio – NHS Clinical Entrepreneur Programme Application
    </div>
  `;

  const salutationHTML = `<p class="sal">Dear NHS Clinical Entrepreneur Team,</p>`;

  const narrativeParts = [];

  // Duration phrase
  let durationPhrase = "";
  if (qDurationSelect) {
    if (qDurationSelect === "other" && qDurationDetail) {
      durationPhrase = qDurationDetail;
    } else {
      switch (qDurationSelect) {
        case "less than six months":
          durationPhrase = "";
          break;
        case "between six and twelve months":
          durationPhrase = "the past six to twelve months";
          break;
        case "between one and three years":
          durationPhrase = "the past one to three years";
          break;
        case "more than three years":
          durationPhrase = "a period of more than three years";
          break;
        default:
          durationPhrase = qDurationSelect;
      }
      if (qDurationDetail && qDurationSelect !== "less than six months") {
        durationPhrase += ` (${qDurationDetail})`;
      }
    }
  }

  // Capacity
  let capacityBase = "";
  if (qCapacitySelect === "other" && qCapacityOther) {
    capacityBase = qCapacityOther;
  } else if (qCapacitySelect) {
    capacityBase = qCapacitySelect;
  }
  let capacityDetail = "";
  if (qCapacityDetail) {
    capacityDetail = qCapacityDetail;
  }

  // Relationship sentence
  let relationshipSentence = "";
  if (qDurationSelect || capacityBase) {
    if (qDurationSelect === "less than six months") {
      relationshipSentence = "Although my time working with Alex has been relatively short";
    } else {
      relationshipSentence = "Over ";
      relationshipSentence += durationPhrase ? durationPhrase : "the time that Alex worked within our service";
    }

    relationshipSentence += ", I have known Alex";

    if (capacityBase) {
      relationshipSentence += ` in my capacity as ${capacityBase.toLowerCase()}`;
    }

    if (capacityDetail) {
      relationshipSentence += `, with specific responsibility for ${capacityDetail}`;
    }

    relationshipSentence += ", and have been able to observe their practice in a busy perioperative environment.";
  }

  let intro = opening;
  if (relationshipSentence) {
    intro += " " + relationshipSentence;
  }
  narrativeParts.push(`<p>${intro}</p>`);

  // Strengths
  let strengthsSentence = "";
  if (strengthsSelected.length || qStrengthsOther) {
    const pieces = [...strengthsSelected];
    if (qStrengthsOther) {
      pieces.push(qStrengthsOther);
    }

    const verbPhrases = pieces.map(p =>
      p.charAt(0).toLowerCase() + p.slice(1)
    );

    let strengthsPhrase = "";
    if (verbPhrases.length === 1) {
      strengthsPhrase = verbPhrases[0];
      strengthsSentence = `In day-to-day practice, Alex ${strengthsPhrase}.`;
    } else {
      const last = verbPhrases.pop();
      strengthsPhrase = verbPhrases.join("; ") + "; and " + last;
      strengthsSentence = `In day-to-day practice, Alex: ${strengthsPhrase}.`;
    }
  }

  // Professionalism / safety
  let professionalismSentence = "";
  if (qProfessionalism) {
    professionalismSentence = ` In terms of professionalism and patient safety, I would highlight the following example: ${qProfessionalism}`;
  }

  // Teamwork / leadership
  let teamworkSentence = "";
  if (qTeamwork) {
    teamworkSentence = ` Regarding teamwork and leadership within theatres, an illustrative example is: ${qTeamwork}`;
  }

  let middlePara = "";
  if (strengthsSentence) {
    middlePara += strengthsSentence;
  }
  if (professionalismSentence) {
    middlePara += professionalismSentence;
  }
  if (teamworkSentence) {
    middlePara += teamworkSentence;
  }
  if (middlePara) {
    narrativeParts.push(`<p>${middlePara}</p>`);
  }

  // Suitability + MBA
  let suitabilitySentence = "";
  if (qSuitabilitySelect || qSuitabilityDetail) {
    const reasons = [];
    if (qSuitabilitySelect) {
      reasons.push(qSuitabilitySelect);
    }
    if (qSuitabilityDetail) {
      reasons.push(qSuitabilityDetail);
    }

    let reasonsPhrase = "";
    if (reasons.length === 1) {
      reasonsPhrase = reasons[0];
    } else if (reasons.length === 2) {
      reasonsPhrase = reasons.join(" and ");
    } else {
      reasonsPhrase = reasons.slice(0, -1).join(", ") + ", and " + reasons[reasons.length - 1];
    }

    suitabilitySentence = `On the basis of the above, and my experience of working with Alex, I consider them well suited to the NHS Clinical Entrepreneur Programme because of ${reasonsPhrase}.`;
  } else {
    suitabilitySentence = "On the basis of the above, and my experience of working with Alex, I consider them well suited to the NHS Clinical Entrepreneur Programme and capable of contributing positively to innovation within the NHS.";
  }

  const mbaSentence = "Alex is currently undertaking an Executive MBA, further developing their leadership, strategic and innovation skills, qualities that align closely with the objectives of the NHS Clinical Entrepreneur Programme.";
  narrativeParts.push(`<p>${mbaSentence} ${suitabilitySentence}</p>`);

  narrativeParts.push(
    `<p>This letter is provided as a professional endorsement of Alex Monterubio's suitability for the NHS Clinical Entrepreneur Programme. It does not imply financial sponsorship.</p>`
  );

  const sigHTML = signatureDataURL
    ? `<div class="letter-sign"><img src="${signatureDataURL}" alt="Signature"/></div>`
    : "";

  const bodyHTML = narrativeParts.join("");

  return `
    <div class="paper" id="paper">
      <div class="page">
        <div class="header-row">
          ${senderHTML}
          ${headerHTML}
        </div>
        <div class="letter-date">Date: ${dateStr}</div>
        ${recipientHTML}
        <div class="letter-body">
          ${salutationHTML}
          ${bodyHTML}
          <div class="letter-closing">
            <p>Yours faithfully,</p>
            ${sigHTML}
            <div class="letter-signoff">
              <div class="name">${refName || "[Name]"}</div>
              <div>${effectiveRole || "[Role]"}</div>
              <div>${org || "Barts Health NHS Trust"}</div>
              <div>${email ? `Contact: ${email}` : ""}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
