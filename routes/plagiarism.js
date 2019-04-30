const router = require('express').Router();

const Plagiarism = require('../models/plagiarism');

const unhandledRejection = require("unhandled-rejection");

const path = require('path');

const config = require('../config');

const checkJWT = require('../middlewares/check-jwt');

const Project = require('../models/project');

const clProps = {};
 
// let rejectionEmitter = unhandledRejection({
//     timeout: 20
// });
 
// rejectionEmitter.on("unhandledRejection", (error, promise) => {
//     console.log('An error was unhandled');
//     if(typeof error == "object") {
//         error = JSON.stringify(error);
//     }
//     if(error.indexOf('{') >= 0) {
//         let e = error.substr(error.indexOf('Message') - 2, error.length);
//         e = JSON.parse(e);
//         console.log(`Message: ${e.Message}`);
//         if(e.Message && e.Message.match(/supported/g)) {
//             console.log('DOCUMENT NOT SUPPORTED!!!');
//             clearInterval(pStatus);
//         }
//     } else {
//         console.log(error);
//     }
// });

router.route('/begin-check')
.post([checkJWT], (request, response, next) => {
    Project.findById(request.body.id, (err, project) => {
        if(err) {
            return response.json({
                status: false,
                message: 'No such project exists. Make sure you\'re not trying to scan a deleted file!'
            })
        } else {
            let file = fullPath(project.project);
            beginPlagiarismChecker(file); 
            return response.json({
                status: true,
                message: 'Your request has been sent to the background.'
            })
        }
    })
});
function fullPath(file) {
    let l = path.resolve(file).split(path.sep);
    let f = '';
    last = l[l.length - 1];
    l.forEach(l => {
        if (l != last) {
            f += l + '/';
        } else {
            f += l;
        }
    });
    return f;
}

process.on('unhandledRejection', error => {
    // Prints "unhandledRejection woops!"
    console.log('unhandledRejection caught.', error);
});

async function copyLeaksLogin() {
    await config.clCloud.login(config.clEmail, config.clApiKey, config.clConfig.E_PRODUCT.Businesses, (resp) => {
        let r = JSON.parse(resp);
        if(r.access_token) {
            clProps.status = 1;
            clProps.token = r.access_token;
            console.log('Successfully logged on to CopyLeaks Cloud Servers');
        }
    })
}

async function checkClCredit() {
    try {
        await config.clCloud.getCreditBalance( function(resp) {
            if(resp && resp.Amount) {
                clProps.balance = resp.Amount;
                console.log(`Remaining Credits: ${clProps.balance}`);
            } else {
                console.log('No balance was returned.');
            }
        });
    } catch(err) {
        console.log(`Unable to get remaining balance: ${err}`); 
    }
}

async function beginPlagiarismChecker(f) {
    try {
        copyLeaksLogin();
        checkClCredit();
        if(clProps.balance > 0) {
            await config.clCloud.createByFile(f, config.clHeaders, function(resp,err){
                console.log('Creating process by file...');
                if(err) {
                    console.log(`Error = ${err}`);
                }
                if(resp && resp.ProcessId){
                    console.log('API: create-by-file');
                    console.log('Process has been created: '+resp.ProcessId);
                    clProps.pid = resp.ProcessId;
                }
                if(!isNaN(err)) {
                    console.log('Error: ' + err);
                }
            });
        } else {
            console.log('Unable to process request. You are out of credit.');
        }
    } catch(err) {
        console.log(err);
    }
}

async function getProgressReport() {
    await config.clCloud.getProcessList(function(resp,err){
        if(resp && resp.length > 0){
            console.log('API: processes list');
            console.log('There are '+resp.length+' processes running:');
            _.forIn(resp,function(pval,pk){
                console.log(pval.ProcessId);
            });
        }
        if(!isNaN(err)) {
            console.log('Error: ' + err);
        }
    });
}
async function statusCallback(ppid) {
    //     /* Get process status exmaple */
    console.log(`Called to get process status for process: ${ppid}`);
    await config.clCloud.getProcessStatus(ppid,function(resp,err){
        console.log(resp);
        if(!isNaN(err)) {
            console.log('Error: ' + err);
        }
    });
        
    //     /* Get process results example */
    config.clCloud.getProcessResults(ppid,function(resp,err){
        console.log(`Response from getProcessResults: `);
        console.log(resp);
        if(isNaN(err)) {
            console.log('Error: ' + err);
        }
        /* Get the raw text the process and the first result, and the comparison report between them. */
        var result = resp[0];
        config.clCloud.getProcessRawText(ppid,function(resp,err){
            console.log('Process raw text: ' + resp);
            if(!isNaN(err))
                console.log('Error: ' + err);
        });
        config.clCloud.getResultRawText(result.CachedVersion,function(resp,err){
            console.log('Result raw text: ' + resp);
            if(!isNaN(err))
                console.log('Error: ' + err);
        });
        config.clCloud.getComparisonReport(result.ComparisonReport,function(resp,err){
            console.log('Comparison report: ' + resp);
            if(!isNaN(err))
                console.log('Error: ' + err);
        });
    });
}

// clCloud.loginToken.validateToken();

// function callback(resp,err) {
//     console.log(`Error: ${err.message}`);
//     //CHECK CREDIT BALANCE FOR YOUR ACCOUNT
//     clCloud.getCreditBalance(function(resp, err){
//         //check if we have credits
//         if(resp && resp.Amount){
//             console.log('You have this amount of credits left: '+resp.Amount);
//         }
//     });

//         /* Optional Request Headers - for more information see - https://api.copyleaks.com/GeneralDocumentation/RequestHeaders */
//     var _customHeaders = {};
//     _customHeaders[config.SANDBOX_MODE_HEADER] = true;
//     _customHeaders[config.HTTP_CALLBACK] = 'http://your.website.com/callbacks/'
//     //_customHeaders[config.IN_PROGRESS_RESULT] = 'http://your.website.com/callback/results/'
//     //_customHeaders[config.EMAIL_CALLBACK] = 'myemail@company.com'
//     //_customHeaders[config.PARTIAL_SCAN_HEADER] = true;
//     //_customHeaders[config.COMPARE_ONLY] = true; // Compare files in between - available only on createByFiles
//     //_customHeaders[config.IMPORT_FILE_TO_DATABASE] = true; // Import your file to our database only


//     // See more custom-options @ https://api.copyleaks.com/Documentation/RequestHeaders
    
//     /* Create a process using a URL */
//     var url = 'https://copyleaks.com'; // URL to scan
//     // clCloud.createByURL(url,_customHeaders,function(resp,err){
//     //     if(resp && resp.ProcessId){
//     //         console.log('API: create-by-url');
//     //         console.log('Process has been created: ' + resp.ProcessId);
//     //     }
//     //     if(!isNaN(err))
//     //         console.log('Error: ' + err);
//     // });
    
//     /* Create a process using a file - to get full list of supported file types use the example bellow */
//     //    var _file = 'YOUR_FILE_LOCATION';
//     //    clCloud.createByFile(_file,_customHeaders,function(resp,err){
//     //    	if(resp && resp.ProcessId){
//     //    		console.log('API: create-by-file');
//     //    		console.log('Process has been created: '+resp.ProcessId);
//     //    	}
//     //		if(!isNaN(err))
//     //			console.log('Error: ' + err);
//     //    });

//     /* Create a process using a file - to get full list of supported file types use the example bellow */
// //    var _files = [first_file_path, second_file_path];
// //    clCloud.createByFiles(_files,_customHeaders,function(resp,err){
// //    	if(resp){
// //				if(resp.Success.length != 0){
// //					console.log('API: create-by-file with multiple files');
// //					console.log('Processes that has been created successfully: ');
// //					for(i = 0; i < resp.Success.length; i++)
// //						console.log(resp.Success[i].ProcessId);
// //				}
// //				if(resp.Errors.length != 0){
// //					console.log('Errors happend: ');
// //					for(i = 0; i < resp.Errors.length; i++)
// //						console.log(resp.Errors[i]);
// //				}
// //    	}
// //		if(!isNaN(err))
// //			console.log('Error: ' + err);
// //    });
        
//     /* Create a process using image of text - to get full list of ocr languages or supported file types use the examples bellow */
// //    var language = 'en';
// //    var _ocrFile = 'YOUR_PHOTO_LOCATION';
// //    clCloud.createByFileOCR(_ocrFile,_customHeaders,language,function(resp,err){
// //    
// //    	if(resp && resp.ProcessId){
// //    		console.log('API: create-by-file-ocr');
// //    		console.log('Process has been created: '+resp.ProcessId);
// //    	}
// //		if(!isNaN(err))
// //			console.log('Error: ' + err);
// //    });

//     /* Create a process using raw text */
// //    clCloud.createByText('<PUT YOUR TEXT HERE>',_customHeaders,function(resp,err){
// //    	if(resp && resp.ProcessId){
// //    		console.log('API: create-by-text');
// //    		console.log('Process has been created: '+resp.ProcessId);
// //    	}
// //		if(!isNaN(err))
// //			console.log('Error: ' + err);
// //		});

//     /*Get list of your processes*/
// //    clCloud.getProcessList(function(resp,err){
// //    	
// //    	if(resp && resp.length > 0){
// //    		console.log('API: processes list');
// //    		console.log('There are '+resp.length+' processes running:');
// //    		_.forIn(resp,function(pval,pk){
// //    			console.log(pval.ProcessId);
// //    		});
// //    	}
// //		if(!isNaN(err))
// //			console.log('Error: ' + err);
// //    });


//     /*example for process getStatus,getResults & delete*/
// //	  var _pid = '<YOUR_PID_HERE>';
    
//     /* Get process status exmaple */
// //    clCloud.getProcessStatus(_pid,function(resp,err){
// //    	console.log(resp);
// //		if(!isNaN(err))
// //			console.log('Error: ' + err);
// //    });
    
//     /* Get process results example */
// //    clCloud.getProcessResults(_pid,function(resp,err){
// //    		console.log(resp);
// //			if(isNaN(err))
// //				console.log('Error: ' + err);
// //			/* Get the raw text the process and the first result, and the comparison report between them. */
// //			//var result = resp[0];
// //			//clCloud.getProcessRawText(_pid,function(resp,err){
// //			//	console.log('Process raw text: ' + resp);
// //			//	if(!isNaN(err))
// //			//		console.log('Error: ' + err);
// //			//});
// //			//clCloud.getResultRawText(result.CachedVersion,function(resp,err){
// //			//	console.log('Result raw text: ' + resp);
// //			//	if(!isNaN(err))
// //			//		console.log('Error: ' + err);
// //			//});
// //			//clCloud.getComparisonReport(result.ComparisonReport,function(resp,err){
// //			//	console.log('Comparison report: ' + resp);
// //			//	if(!isNaN(err))
// //			//		console.log('Error: ' + err);
// //			//});
// //    });
    
//     /* Delete process example */
// //    clCloud.deleteProcess(_pid,function(resp,err){
// //			if(isNaN(err))
// //				console.log("Process deleted");
// //			else
// //				console.log('Error: ' + err);
// //    });

//     /* Get Supported file types - https://api.copyleaks.com/GeneralDocumentation/SupportedFileTypes */
// //    clCloud.getSupportedFileTypes(function(resp,err){
// //    		console.log(resp);
// //			if(!isNaN(err))
// //					console.log('Error: ' + err);
// //    });

//         /* Get OCR supported languages list - https://api.copyleaks.com/GeneralDocumentation/OcrLanguagesList */
// //    clCloud.getOcrSupportedLanguages(function(resp,err){
// //    		console.log(resp);
// //			if(!isNaN(err))
// //					console.log('Error: ' + err);
// //    });
// }

// clCloud.getSupportedFileTypes(data => {
//     console.log(data);
// });

module.exports = router;