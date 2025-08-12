module.exports = {
    UserModel: require('./user.model'),
    OtpModel: require('./otp.model'),
    RoleModel: require('./role.model'),
    ...require('./token.model')
};
