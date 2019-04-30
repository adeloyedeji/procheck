const nodemailer = require('nodemailer');

const copyLeaks = require('plagiarism-checker');

const clCloud = new copyLeaks();

let clConfig = clCloud.getConfig();

transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587, 
    auth: {
        user: 'zdr76cllzs4zmfvk@ethereal.email',
        pass: 'yeTyFhyGspYNkkbJJV'
    }
});

var _customHeaders = {};
// _customHeaders[clConfig.SANDBOX_MODE_HEADER] = true;
// _customHeaders[clConfig.HTTP_CALLBACK] = 'http://your.website.com/callbacks/'
// _customHeaders[clConfig.IN_PROGRESS_RESULT] = 'http://your.website.com/callback/results/'
_customHeaders[clConfig.EMAIL_CALLBACK] = 'adeloyedeji@gmail.com';
_customHeaders[clConfig.PARTIAL_SCAN_HEADER] = true;
// _customHeaders[clConfig.COMPARE_ONLY] = true; // Compare files in between - available only on createByFiles
// _customHeaders[clConfig.IMPORT_FILE_TO_DATABASE] = true; // Import your file to our database only

module.exports = {
    host: 'http://localhost:5050',
    client_host: 'http://localhost:82',
    database: 'mongodb://127.0.0.1:27017/procheck',
    port: 5050,
    secret: 'Procheck!@#qaz123456(*_*)',
    transporter:  transporter,
    clEmail: 'adeloyedeji@gmail.com',
    clApiKey: 'D88B1AA7-98E0-460F-A1D4-F0FF89172F5C',
    clHeaders: _customHeaders,
    clCloud: clCloud,
    clConfig: clConfig,
}