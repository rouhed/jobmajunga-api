const PDFDocument = require('pdfkit');

class PDFService {
    static async generateCV(cvData, userData, res) {
        const doc = new PDFDocument({
            margin: 0,
            size: 'A4',
            info: { Title: `CV - ${userData?.first_name || ''} ${userData?.last_name || ''}` }
        });

        doc.pipe(res);

        // Parse color theme from cvData or use a default blue
        const themeColor = cvData.color_theme || '#2563EB';

        // Organize sections into a lookup map for easy access
        const sectionsMap = {};
        if (cvData.sections && Array.isArray(cvData.sections)) {
            cvData.sections.forEach(s => {
                sectionsMap[s.section_type] = s.content;
            });
        }

        const firstName = userData?.first_name || '';
        const lastName = userData?.last_name || '';
        const email = userData?.email || '';
        const phone = userData?.phone || '';
        const location = userData?.location || '';
        
        // title: Use the user's title, not the CV document's filename title
        const title = userData?.title || '';
        const photoUrl = userData?.photo_url || '';
        const bio = userData?.bio || '';

        // Choose layout based on template
        if (cvData.template_id === 'classic' || cvData.template_name === 'classic') {
            this._drawClassicLayout(doc, { firstName, lastName, title, email, phone, location, themeColor, sectionsMap, photoUrl, bio });
        } else {
            // 'modern' and 'creative' both use the 2-column Canva layout
            this._drawModernLayout(doc, { firstName, lastName, title, email, phone, location, themeColor, sectionsMap, photoUrl, bio });
        }

        doc.end();
    }

    // =========================================================================
    //  MODERN / CREATIVE - 2 Column "Canva" Layout
    // =========================================================================
    static _drawModernLayout(doc, data) {
        const { firstName, lastName, title, email, phone, location, themeColor, sectionsMap } = data;
        const pageW = doc.page.width;   // 595
        const pageH = doc.page.height;  // 842
        const sidebarW = 210;

        // --- Left Sidebar Background ---
        doc.rect(0, 0, sidebarW, pageH).fill(themeColor);

        // --- Top Header Band (behind name) ---
        doc.rect(sidebarW, 0, pageW - sidebarW, 100).fill(this._lightenColor(themeColor, 0.85));

        // ===================== LEFT COLUMN =====================
        let leftY = 40;
        const leftX = 25;
        const leftW = sidebarW - 50;

        // --- Photo (If available) ---
        if (data.photoUrl) {
            try {
                let base64str = data.photoUrl;
                if (base64str.startsWith('data:image/')) {
                    base64str = base64str.split(',')[1];
                }
                const imgBuffer = Buffer.from(base64str, 'base64');
                const photoSize = 100;
                const photoX = leftX + (leftW - photoSize) / 2;
                
                doc.save();
                doc.circle(photoX + photoSize/2, leftY + photoSize/2, photoSize/2).clip();
                doc.image(imgBuffer, photoX, leftY, { width: photoSize, height: photoSize });
                doc.restore();
                leftY += photoSize + 20;
            } catch (err) {
                console.error("Error rendering PDF photo:", err.message);
            }
        }

        // --- CONTACT ---
        leftY = this._drawSidebarSectionTitle(doc, 'CONTACT', leftX, leftY);
        if (phone) { leftY = this._drawSidebarLine(doc, `Tél:  ${phone}`, leftX, leftY, leftW); }
        if (email) { leftY = this._drawSidebarLine(doc, `Email:  ${email}`, leftX, leftY, leftW); }
        if (location) { leftY = this._drawSidebarLine(doc, `Adresse:  ${location}`, leftX, leftY, leftW); }
        leftY += 20;

        // --- LANGUES ---
        const languages = sectionsMap['languages'];
        if (languages && Array.isArray(languages) && languages.length > 0) {
            leftY = this._drawSidebarSectionTitle(doc, 'LANGUES', leftX, leftY);
            languages.forEach(lang => {
                leftY = this._drawSidebarBullet(doc, lang, leftX, leftY, leftW);
            });
            leftY += 20;
        }

        // --- COMPETENCES ---
        const skills = sectionsMap['skills'];
        if (skills && Array.isArray(skills) && skills.length > 0) {
            leftY = this._drawSidebarSectionTitle(doc, 'COMPÉTENCES', leftX, leftY);
            skills.forEach(skill => {
                leftY = this._drawSidebarBullet(doc, skill, leftX, leftY, leftW);
            });
            leftY += 20;
        }

        // --- CENTRES D'INTERET ---
        const interests = sectionsMap['interests'];
        if (interests && Array.isArray(interests) && interests.length > 0) {
            leftY = this._drawSidebarSectionTitle(doc, "CENTRES D'INTÉRÊT", leftX, leftY);
            interests.forEach(interest => {
                leftY = this._drawSidebarBullet(doc, interest, leftX, leftY, leftW);
            });
        }

        // ===================== RIGHT COLUMN =====================
        let rightY = 25;
        const rightX = sidebarW + 25;
        const rightW = pageW - sidebarW - 50;

        // --- Large Name Header ---
        doc.fillColor('#1E293B').fontSize(26).font('Helvetica-Bold')
            .text(`${firstName} ${lastName}`, rightX, rightY, { width: rightW });
        rightY += doc.heightOfString(`${firstName} ${lastName}`, { width: rightW, fontSize: 26 }) + 5;
        doc.fontSize(12).font('Helvetica').fillColor('#475569')
            .text(title, rightX, rightY, { width: rightW });
        rightY += 30;

        // Separator line
        rightY = Math.max(rightY, 110);
        doc.moveTo(rightX, rightY).lineTo(rightX + rightW, rightY).lineWidth(0.5).strokeColor('#CBD5E1').stroke();
        rightY += 20;

        // --- PROFIL ---
        const summary = sectionsMap['summary'] || data.bio;
        if (summary && typeof summary === 'string' && summary.trim()) {
            rightY = this._drawMainSectionTitle(doc, 'PROFIL', rightX, rightY, themeColor);
            doc.fontSize(10).font('Helvetica').fillColor('#475569')
                .text(summary, rightX, rightY, { width: rightW, lineGap: 3 });
            rightY += doc.heightOfString(summary, { width: rightW }) + 20;
        }

        // --- EXPERIENCES ---
        const experiences = sectionsMap['experiences'];
        if (experiences && Array.isArray(experiences) && experiences.length > 0) {
            rightY = this._drawMainSectionTitle(doc, 'EXPÉRIENCES PROFESSIONNELLES', rightX, rightY, themeColor);
            experiences.forEach(exp => {
                const company = exp.company || exp.title || '';
                const subtitle = exp.subtitle || '';
                const description = exp.description || '';

                doc.fontSize(12).font('Helvetica-Bold').fillColor('#1E293B')
                    .text(company, rightX, rightY, { width: rightW });
                rightY += doc.heightOfString(company, { width: rightW }) + 2;

                if (subtitle) {
                    doc.fontSize(10).font('Helvetica-Oblique').fillColor('#64748B')
                        .text(subtitle, rightX, rightY, { width: rightW });
                    rightY += doc.heightOfString(subtitle, { width: rightW }) + 3;
                }
                if (description) {
                    doc.fontSize(9).font('Helvetica').fillColor('#475569')
                        .text(description, rightX + 10, rightY, { width: rightW - 10, lineGap: 2 });
                    rightY += doc.heightOfString(description, { width: rightW - 10 }) + 10;
                }
                rightY += 5;
            });
            rightY += 10;
        }

        // --- FORMATIONS ---
        const formations = sectionsMap['formations'];
        if (formations && Array.isArray(formations) && formations.length > 0) {
            rightY = this._drawMainSectionTitle(doc, 'FORMATION', rightX, rightY, themeColor);
            formations.forEach(edu => {
                const school = edu.school || edu.title || '';
                const degree = edu.degree || edu.subtitle || '';
                const description = edu.description || '';

                doc.fontSize(12).font('Helvetica-Bold').fillColor('#1E293B')
                    .text(school, rightX, rightY, { width: rightW });
                rightY += doc.heightOfString(school, { width: rightW }) + 2;

                if (degree) {
                    doc.fontSize(10).font('Helvetica-Oblique').fillColor('#64748B')
                        .text(degree, rightX, rightY, { width: rightW });
                    rightY += doc.heightOfString(degree, { width: rightW }) + 3;
                }
                if (description) {
                    doc.fontSize(9).font('Helvetica').fillColor('#475569')
                        .text(description, rightX + 10, rightY, { width: rightW - 10, lineGap: 2 });
                    rightY += doc.heightOfString(description, { width: rightW - 10 }) + 10;
                }
                rightY += 5;
            });
        }
    }

    // =========================================================================
    //  CLASSIC - Single Column Layout
    // =========================================================================
    static _drawClassicLayout(doc, data) {
        const { firstName, lastName, title, email, phone, location, themeColor, sectionsMap } = data;

        // Header
        doc.rect(0, 0, doc.page.width, 90).fill(themeColor);
        doc.fillColor('#FFFFFF').fontSize(24).font('Helvetica-Bold')
            .text(`${firstName} ${lastName}`, 50, 25, { width: 400 });
        doc.fontSize(12).font('Helvetica')
            .text(title, 50, 55, { width: 400 });

        // --- Photo (If available) ---
        if (data.photoUrl) {
            try {
                let base64str = data.photoUrl;
                if (base64str.startsWith('data:image/')) {
                    base64str = base64str.split(',')[1];
                }
                const imgBuffer = Buffer.from(base64str, 'base64');
                const photoSize = 70;
                const photoX = doc.page.width - 50 - photoSize;
                
                doc.save();
                doc.circle(photoX + photoSize/2, 10 + photoSize/2, photoSize/2).clip();
                doc.image(imgBuffer, photoX, 10, { width: photoSize, height: photoSize });
                doc.restore();
            } catch (err) {
                console.error("Error rendering PDF photo:", err.message);
            }
        }

        // Contact bar
        doc.fillColor('#475569').fontSize(9).font('Helvetica')
            .text(`${email}  |  ${phone}  |  ${location}`, 50, 105, { width: 500, align: 'center' });

        doc.moveTo(50, 125).lineTo(545, 125).lineWidth(0.5).strokeColor('#CBD5E1').stroke();

        let y = 140;
        const x = 50;
        const w = 495;

        // Summary
        const summary = sectionsMap['summary'] || data.bio;
        if (summary && typeof summary === 'string' && summary.trim()) {
            y = this._drawMainSectionTitle(doc, 'PROFIL', x, y, themeColor);
            doc.fontSize(10).font('Helvetica').fillColor('#475569')
                .text(summary, x, y, { width: w, lineGap: 3 });
            y += doc.heightOfString(summary, { width: w }) + 20;
        }

        // Experiences
        const experiences = sectionsMap['experiences'];
        if (experiences && Array.isArray(experiences) && experiences.length > 0) {
            y = this._drawMainSectionTitle(doc, 'EXPÉRIENCES', x, y, themeColor);
            experiences.forEach(exp => {
                doc.fontSize(11).font('Helvetica-Bold').fillColor('#1E293B')
                    .text(exp.company || exp.title || '', x, y, { width: w });
                y += 15;
                if (exp.subtitle) {
                    doc.fontSize(9).font('Helvetica-Oblique').fillColor('#64748B').text(exp.subtitle, x, y, { width: w });
                    y += 13;
                }
                if (exp.description) {
                    doc.fontSize(9).font('Helvetica').fillColor('#475569').text(exp.description, x + 10, y, { width: w - 10 });
                    y += doc.heightOfString(exp.description, { width: w - 10 }) + 10;
                }
                y += 5;
            });
            y += 10;
        }

        // Formations
        const formations = sectionsMap['formations'];
        if (formations && Array.isArray(formations) && formations.length > 0) {
            y = this._drawMainSectionTitle(doc, 'FORMATION', x, y, themeColor);
            formations.forEach(edu => {
                doc.fontSize(11).font('Helvetica-Bold').fillColor('#1E293B')
                    .text(edu.school || edu.title || '', x, y, { width: w });
                y += 15;
                if (edu.degree || edu.subtitle) {
                    doc.fontSize(9).font('Helvetica-Oblique').fillColor('#64748B').text(edu.degree || edu.subtitle, x, y, { width: w });
                    y += 13;
                }
                y += 5;
            });
            y += 10;
        }

        // Skills
        const skills = sectionsMap['skills'];
        if (skills && Array.isArray(skills) && skills.length > 0) {
            y = this._drawMainSectionTitle(doc, 'COMPÉTENCES', x, y, themeColor);
            doc.fontSize(10).font('Helvetica').fillColor('#475569')
                .text(skills.join('  •  '), x, y, { width: w });
            y += doc.heightOfString(skills.join('  •  '), { width: w }) + 15;
        }

        // Languages
        const languages = sectionsMap['languages'];
        if (languages && Array.isArray(languages) && languages.length > 0) {
            y = this._drawMainSectionTitle(doc, 'LANGUES', x, y, themeColor);
            doc.fontSize(10).font('Helvetica').fillColor('#475569')
                .text(languages.join('  •  '), x, y, { width: w });
            y += doc.heightOfString(languages.join('  •  '), { width: w }) + 15;
        }

        // Interests
        const interests = sectionsMap['interests'];
        if (interests && Array.isArray(interests) && interests.length > 0) {
            y = this._drawMainSectionTitle(doc, "CENTRES D'INTÉRÊT", x, y, themeColor);
            doc.fontSize(10).font('Helvetica').fillColor('#475569')
                .text(interests.join('  •  '), x, y, { width: w });
        }
    }

    // =========================================================================
    //  HELPER METHODS
    // =========================================================================

    static _drawSidebarSectionTitle(doc, title, x, y) {
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#FFFFFF')
            .text(title, x, y);
        y += 16;
        // Underline
        doc.moveTo(x, y).lineTo(x + 50, y).lineWidth(1.5).strokeColor('#FFFFFFAA').stroke();
        y += 10;
        return y;
    }

    static _drawSidebarLine(doc, text, x, y, w) {
        doc.fontSize(9).font('Helvetica').fillColor('#FFFFFFDD')
            .text(text, x, y, { width: w });
        y += doc.heightOfString(text, { width: w }) + 5;
        return y;
    }

    static _drawSidebarBullet(doc, text, x, y, w) {
        doc.fontSize(9).font('Helvetica').fillColor('#FFFFFFDD')
            .text(`•  ${text}`, x, y, { width: w });
        y += doc.heightOfString(`•  ${text}`, { width: w }) + 4;
        return y;
    }

    static _drawMainSectionTitle(doc, title, x, y, themeColor) {
        doc.fontSize(13).font('Helvetica-Bold').fillColor(themeColor || '#1E293B')
            .text(title, x, y);
        y += 18;
        return y;
    }

    // Attempt to lighten a hex color for the header band
    static _lightenColor(hex, factor) {
        try {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            const lr = Math.round(r + (255 - r) * factor);
            const lg = Math.round(g + (255 - g) * factor);
            const lb = Math.round(b + (255 - b) * factor);
            return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`;
        } catch (e) {
            return '#F1F5F9';
        }
    }
}

module.exports = PDFService;
