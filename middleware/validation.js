const { check, validationResult } = require('express-validator')

exports.login = [
    check('username').trim().not().isEmpty().withMessage('Username is required!!!'),
    check('password').trim().not().isEmpty().withMessage('password is required!!!')
]

exports.checkUser = [
    check('firstName').trim().not().isEmpty().withMessage('Please enter firstName!!!'),
    check('lastName').trim().not().isEmpty().withMessage('Please enter lastName!!!'),
    check('email').trim().not().isEmpty().withMessage('Please enter email!!!').isEmail().withMessage("Please enter proper emailid!!"),
    check('mobileNo').trim().not().isEmpty().withMessage('Please enter mobile number!!!'),
]

exports.resetPassword = [
    check('currpassword').trim().not().isEmpty().withMessage('Current password is required!!!'),
    check('password').trim().not().isEmpty().withMessage('password is required!!!')
]

exports.Email = [
    check('email').trim().not().isEmpty().withMessage('Please enter email!!!').isEmail().withMessage("Please enter proper emailid!!"),
]

exports.Password = [
    check('password').trim().not().isEmpty().withMessage('password is required!!!')
]


exports.valResult = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = errors.array()[0].msg;
        return res.status(422).json({ success: false, error: error })
    }
    next();
};