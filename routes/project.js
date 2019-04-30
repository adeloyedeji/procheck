const router = require('express').Router();

const Project = require('../models/project');

const multer = require('multer');

const checkJWT = require('../middlewares/check-jwt');

const crypto = require('crypto');

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/projects')
    }, 
    filename: function(req, file, cb) {
        crypto.pseudoRandomBytes(16, function(err, raw) {
            // cb(null, raw.toString('hex') + Date.now() + '.' + mime.getExtension(file.mimetype))
            cb(null, raw.toString('hex') + Date.now() + '.' + file.originalname)
        })
    }
});

const upload = multer({
    storage: storage
});

router.route('/projects')
.get((request, response, next) => {
    Project.find({}, (err, projects) => {
        if(err) {
            throw err
        }
        response.json({
            success: true,
            projects: projects,
            message: 'Success.'
        })
    })
})

router.route('/project')
.get((request, response, next) => {
    Project.find({ title: new RegExp('^'+request.query.title+'$', "i") })
    .populate('owner')
    .exec((err, project) => {
        if(err) {
            throw err;
        }
        if(!project) {
            response.json({
                success: false,
                message: `Unfortunately, we couldn\'t find any project that matches '${request.query.title}'`
            })
        } else {
            response.json({
                success: true,
                projects: project,
                message: 'Found!'
            })
        }
    })
})
.post([checkJWT, upload.single('project_file')], (request, response, next) => {
    let project         = new Project();
    project.owner       = request.decoded.user._id;
    project.title       = request.body.title;
    project.abstract    = request.body.abstract;
    project.avatar      = request.body.avatar;
    project.project     = request.file.path;

    Project.findOne({ title: request.body.title }, (err, existingProject) => {
        if(err) {
            throw err;
        }

        if(existingProject) {
            response.json({
                success: false,
                message: 'Possible Duplicate: A project already exists with this title!'
            })
        } else {
            project.save();

            response.json({
                success: true,
                id: project._id,
                message: 'Success. Your project was successfully saved.'
            })
        }
    })
})

router.route('/plagiarism-project')
.get([checkJWT], (request, response, next) => {
    Project.findById(request.query.id)
    .populate('owner')
    .exec((err, project) => {
        if(err) {
            throw err;
        }

        if(!project) {
            response.json({
                success: false,
                message: 'Something must have happened along the way. We couldn\'t find your project.'
            });
        } else {
            response.json({
                success: true,
                project: project,
                message: 'Success.'
            });
        }
    })
})
.post((request, response, next) => {

})

module.exports = router;
