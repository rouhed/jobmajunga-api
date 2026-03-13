const PDFDocument = require('pdfkit');

class PDFService {
    static async generateCV(cvData, userData, res) {
        const doc = new PDFDocument({
            margin: 0,
            size: 'A4',
            info: { Title: `CV - ${userData.first_name} ${userData.last_name}` }
        });

        doc.pipe(res);

        if (cvData.template_name === 'classic') {
            this.drawClassic(doc, cvData, userData);
        } else if (cvData.template_name === 'creative') {
            this.drawCreative(doc, cvData, userData);
        } else {
            this.drawModern(doc, cvData, userData);
        }

        doc.end();
    }

    static drawModern(doc, cvData, userData) {
        // --- Sidebar (Canva Style) ---
        doc.rect(0, 0, 200, doc.page.height).fill('#F1F5F9');

        // --- Header in Sidebar ---
        doc.fillColor('#1E293B').fontSize(22).font('Helvetica-Bold')
            .text(`${userData.first_name} ${userData.last_name}`, 30, 50, { width: 140 });

        doc.fontSize(12).font('Helvetica')
            .text(userData.title || 'Candidat', 30, 100, { width: 140 });

        // --- Contact ---
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#0EA5E9').text('Contact', 30, 160);
        doc.fontSize(10).font('Helvetica').fillColor('#334155').text(userData.email, 30, 180);
        doc.text(userData.phone || '', 30, 195);
        doc.text(userData.location || 'Mahajanga', 30, 210);

        // --- Main Content ---
        let y = 50;
        const mainX = 230;
        const mainWidth = 330;

        cvData.sections.forEach(section => {
            doc.fontSize(16).font('Helvetica-Bold').fillColor('#1E293B').text(section.section_type.toUpperCase(), mainX, y);
            y += 25;

            doc.fontSize(10).font('Helvetica').fillColor('#475569');

            if (Array.isArray(section.content)) {
                section.content.forEach(item => {
                    const title = item.title || item.company || item.school;
                    if (title) {
                        doc.font('Helvetica-Bold').text(title, mainX, y);
                        y += 15;
                    }
                    if (item.subtitle || item.degree) {
                        doc.font('Helvetica-Oblique').text(item.subtitle || item.degree, mainX, y);
                        y += 15;
                    }
                    if (item.description) {
                        doc.font('Helvetica').text(item.description, mainX, y, { width: mainWidth });
                        y += doc.heightOfString(item.description, { width: mainWidth }) + 10;
                    }
                    y += 5;
                });
            } else {
                doc.text(section.content.text || '', mainX, y, { width: mainWidth });
                y += doc.heightOfString(section.content.text || '', { width: mainWidth }) + 20;
            }
            y += 20;
        });
    }

    static drawClassic(doc, cvData, userData) {
        doc.fillColor('#000000').fontSize(24).font('Helvetica-Bold')
            .text(`${userData.first_name} ${userData.last_name}`, 50, 50);

        doc.fontSize(14).font('Helvetica').text(userData.title || '', 50, 80);
        doc.fontSize(10).text(`${userData.email} | ${userData.phone || ''} | ${userData.location || ''}`, 50, 100);

        doc.moveDown();
        doc.moveTo(50, 115).lineTo(550, 115).stroke();

        let y = 140;
        cvData.sections.forEach(section => {
            doc.fontSize(14).font('Helvetica-Bold').text(section.section_type.toUpperCase(), 50, y);
            y += 20;

            doc.fontSize(10).font('Helvetica');
            if (Array.isArray(section.content)) {
                section.content.forEach(item => {
                    doc.font('Helvetica-Bold').text(item.title || item.company || '', 50, y);
                    y += 15;
                    doc.font('Helvetica').text(item.description || '', 70, y, { width: 480 });
                    y += doc.heightOfString(item.description || '', { width: 480 }) + 15;
                });
            } else {
                doc.text(section.content.text || '', 50, y, { width: 500 });
                y += doc.heightOfString(section.content.text || '', { width: 500 }) + 20;
            }
        });
    }

    static drawCreative(doc, cvData, userData) {
        // Similar to drawModern but different colors/layout
        this.drawModern(doc, cvData, userData);
    }
}

module.exports = PDFService;
