var PDFDocument = require('pdfkit');
doc = new PDFDocument();

doc.info['Title'] = 'Test Document';
doc.info['Author'] = 'ICG Consulting';


//Title Page
doc.font('Times-Roman')

doc.fontSize(25).text('Loves Release Document', 106, 200, {width:400, align:'center'});

doc.fontSize(9).text('Repository:   Loves', 400, 600);
doc.fontSize(9).text('Environment:  Prod');
doc.fontSize(9).text('From Date:  2011-09-01');
doc.fontSize(9).text('To Date:  2011-09-01');


//summary
doc.addPage();
doc.fontSize(18).fillColor('#274567').text('Release Summary');
doc.moveDown();

doc.fontSize(12).fillColor('#000000').text('Database Scripts: 22');
doc.moveDown();

doc.fontSize(14).fillColor('#000000').text('Server: OKCDOCD01');
doc.moveDown();

var lineY = doc.y
doc.fontSize(10).fillColor('#274567').text('Application', 80, lineY, {width:70});
doc.fontSize(10).fillColor('#274567').text('Release Path', 155, lineY, {width:200});
doc.fontSize(10).fillColor('#274567').text('App Path', 360, lineY, {width:200});

lineY = doc.y
doc.fontSize(10).fillColor('#000000').text('AP Exception', 80, lineY, {width:70});
doc.fontSize(10).fillColor('#000000').text('C:\\Program Files\\ICGConsulting\\APExcept', 155, lineY, {width:200});
doc.fontSize(10).fillColor('#000000').text('C:\\Program Files\\ICGConsulting\\APExcept', 360, lineY, {width:200});

lineY = doc.y
doc.fontSize(10).fillColor('#000000').text('RM Exception', 80, lineY, {width:70});
doc.fontSize(10).fillColor('#000000').text('C:\\Program Files\\ICGConsulting\\RMExcept', 155  , lineY, {width:200});
doc.fontSize(10).fillColor('#000000').text('C:\\Program Files\\ICGConsulting\\RMExcept', 360  , lineY, {width:200});


//Applications
doc.addPage();
doc.fontSize(18).fillColor('#274567').text('Application Name');

doc.fontSize(12).fillColor('#000000').text('Application Description.');

doc.moveDown(2);

doc.fontSize(14).fillColor('#4f81bd').text('Database Information');

lineY = doc.y
doc.fontSize(10).fillColor('#000000').text('Server', 80, lineY, {width:170});
doc.fontSize(10).fillColor('#000000').text('OKCDOCDB', 155, lineY, {width:200});

lineY = doc.y
doc.fontSize(10).fillColor('#000000').text('Database', 80, lineY, {width:170});
doc.fontSize(10).fillColor('#000000').text('ICG_RPM', 155, lineY, {width:200});

doc.moveDown();


doc.fontSize(14).fillColor('#4f81bd').text('Deployment Target(s)', 72);

lineY = doc.y
doc.fontSize(10).fillColor('#000000').text('OKCDOCD03', 80, lineY, {width:170});
doc.fontSize(10).fillColor('#000000').text('C:\\Program Files\\ICGConsulting\\APExcept', 155, lineY, {width:200});


doc.write('output/loves.pdf');

