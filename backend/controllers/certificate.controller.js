import Certificate from "../models/Certificate.js";
import User from "../models/User.js";
import Course from "../models/Course.js";
import PDFDocument from "pdfkit";

const formatIssueDate = (date) =>
  new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date(date));

const fitTextSize = (doc, text, maxWidth, maxSize, minSize, fontName) => {
  let size = maxSize;
  doc.font(fontName);

  while (size > minSize) {
    if (doc.widthOfString(text, { size }) <= maxWidth) return size;
    size -= 1;
  }

  return minSize;
};

const drawSeal = (doc, centerX, centerY) => {
  doc.save();
  doc.lineWidth(2.2).strokeColor("#C89B3C");
  doc.circle(centerX, centerY, 48).stroke();
  doc.circle(centerX, centerY, 41).stroke();

  doc.fillColor("#0F2D5C").font("Helvetica-Bold").fontSize(9);
  doc.text("VERIFIED", centerX - 22, centerY - 9, { width: 44, align: "center" });

  doc.font("Helvetica").fontSize(8).fillColor("#57627A");
  doc.text("LMS CERT", centerX - 22, centerY + 6, { width: 44, align: "center" });
  doc.restore();
};

const drawSignatureBlock = (doc, x, y, label, name) => {
  doc
    .moveTo(x, y)
    .lineTo(x + 170, y)
    .lineWidth(1)
    .strokeColor("#98A2B3")
    .stroke();

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("#0F2D5C")
    .text(name, x, y + 8, { width: 170, align: "left" });

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#6B7280")
    .text(label, x, y + 22, { width: 170, align: "left" });
};

// Get all certificates for logged-in user
export const getMyCertificates = async (req, res) => {
  try {
    const certs = await Certificate.find({ userId: req.user.id }).populate(
      "courseId",
      "title description thumbnail"
    );
    res.json(certs);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch certificates" });
  }
};

// Get specific certificate by ID
export const getCertificateById = async (req, res) => {
  try {
    let cert = await Certificate.findById(req.params.id)
      .populate("userId", "name email")
      .populate("courseId", "title");

    // Fallback: If not found by certificate ID, try finding by course ID for this user
    if (!cert) {
      cert = await Certificate.findOne({
        courseId: req.params.id,
        userId: req.user.id
      })
        .populate("userId", "name email")
        .populate("courseId", "title");
    }

    if (!cert) return res.status(404).json({ message: "Certificate not found" });
    res.json(cert);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get certificate by course ID (for logged-in user)
export const getCertificateByCourse = async (req, res) => {
  try {
    const cert = await Certificate.findOne({
      userId: req.user.id,
      courseId: req.params.courseId
    }).populate("courseId", "title");

    if (!cert) {
      return res.status(404).json({ message: "Certificate not found for this course" });
    }

    res.json(cert);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Download certificate as PDF
export const downloadCertificate = async (req, res) => {
  try {
    const cert = await Certificate.findById(req.params.id);
    if (!cert) return res.status(404).json({ message: "Certificate not found" });

    const [user, course] = await Promise.all([
      User.findById(cert.userId),
      Course.findById(cert.courseId)
    ]);

    if (!user || !course) {
      return res.status(404).json({ message: "Certificate data is incomplete" });
    }

    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 0 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=certificate-${cert._id}.pdf`
    );

    doc.pipe(res);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    // Background layers
    doc.rect(0, 0, pageWidth, pageHeight).fill("#0B1022");
    doc.fillColor("#11214A").opacity(0.28).circle(110, 70, 110).fill();
    doc.fillColor("#11214A").opacity(0.22).circle(pageWidth - 90, pageHeight - 40, 120).fill();
    doc.opacity(1);

    const outerX = 26;
    const outerY = 26;
    const outerW = pageWidth - 52;
    const outerH = pageHeight - 52;

    const innerX = 44;
    const innerY = 44;
    const innerW = pageWidth - 88;
    const innerH = pageHeight - 88;

    doc.roundedRect(outerX, outerY, outerW, outerH, 18).fill("#E8EEF8");
    doc
      .roundedRect(outerX + 6, outerY + 6, outerW - 12, outerH - 12, 14)
      .lineWidth(2)
      .strokeColor("#C89B3C")
      .stroke();

    doc.roundedRect(innerX, innerY, innerW, innerH, 12).fill("#FDFEFF");
    doc
      .roundedRect(innerX + 8, innerY + 8, innerW - 16, innerH - 16, 10)
      .lineWidth(1.2)
      .strokeColor("#CED6E4")
      .stroke();

    // Header strip
    doc.roundedRect(innerX + 28, innerY + 24, innerW - 56, 48, 8).fill("#102A57");
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("#D9E6FF")
      .text("DYNAMIX LMS", innerX + 42, innerY + 34, { width: 160, align: "left" });
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#B8C8E9")
      .text("Professional Learning Credential", innerX + 42, innerY + 49, {
        width: 230,
        align: "left"
      });

    const certCode = `CERT-${String(cert._id).slice(-10).toUpperCase()}`;
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#D9E6FF")
      .text(certCode, innerX + innerW - 180, innerY + 41, { width: 140, align: "right" });

    // Main title area
    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor("#7B879C")
      .text("CERTIFICATE", 0, innerY + 96, { align: "center" });

    doc
      .font("Helvetica-Bold")
      .fontSize(44)
      .fillColor("#0F2D5C")
      .text("OF ACHIEVEMENT", 0, innerY + 112, { align: "center" });

    doc
      .moveTo(innerX + 200, innerY + 171)
      .lineTo(innerX + innerW - 200, innerY + 171)
      .lineWidth(1.2)
      .strokeColor("#C89B3C")
      .stroke();

    doc
      .font("Helvetica")
      .fontSize(17)
      .fillColor("#4B5563")
      .text("This certifies that", 0, innerY + 188, { align: "center" });

    const learnerName = user.name || "Learner";
    const nameMaxWidth = pageWidth - 220;
    const nameSize = fitTextSize(doc, learnerName, nameMaxWidth, 48, 28, "Helvetica-Bold");

    doc
      .font("Helvetica-Bold")
      .fontSize(nameSize)
      .fillColor("#0A3A83")
      .text(learnerName, 0, innerY + 214, { align: "center" });

    doc
      .moveTo(innerX + 240, innerY + 275)
      .lineTo(innerX + innerW - 240, innerY + 275)
      .lineWidth(1)
      .strokeColor("#D7DEEB")
      .stroke();

    doc
      .font("Helvetica")
      .fontSize(16)
      .fillColor("#4B5563")
      .text("has successfully completed", 0, innerY + 292, { align: "center" });

    const courseTitle = course.title || "Course";
    const courseMaxWidth = pageWidth - 220;
    const courseSize = fitTextSize(doc, courseTitle, courseMaxWidth, 33, 20, "Helvetica-Bold");

    doc
      .font("Helvetica-Bold")
      .fontSize(courseSize)
      .fillColor("#102A57")
      .text(courseTitle, 0, innerY + 316, { align: "center" });

    // Meta and verification details
    doc
      .font("Helvetica")
      .fontSize(12)
      .fillColor("#6B7280")
      .text(`Issued on ${formatIssueDate(cert.issuedAt || new Date())}`, innerX + 52, innerY + innerH - 96, {
        width: 220,
        align: "left"
      });

    const sigY = innerY + innerH - 72;
    drawSignatureBlock(doc, innerX + 52, sigY, "Program Director", "Academic Council");
    drawSignatureBlock(doc, innerX + innerW - 230, sigY, "Authorized Signatory", "LMS Administration");
    drawSeal(doc, pageWidth / 2, sigY + 2);

    doc
      .font("Helvetica")
      .fontSize(8.7)
      .fillColor("#8A94A6")
      .text("This certificate is digitally generated and verified by Dynamix LMS.", 0, pageHeight - 46, {
        align: "center"
      });

    doc.end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  }
};
