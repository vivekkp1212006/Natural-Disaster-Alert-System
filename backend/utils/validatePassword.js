const validatePassword = (password) => {
    if(!password) {
        return {
            valid: false,
            message: "Password required"
        };
    }
    if( typeof password != 'string') {
        return {
            valid: false,
            message: "Bad request"
        };
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasSpecialChar = /[^a-zA-Z0-9]/.test(password);

    if(password.length < 8) {
        return {
            valid: false,
            message: "Minimum 8 characters required"
        };
    }
    if(!hasUpperCase) {
        return {
            valid: false,
            message: "Atleast one upper case character required"
        };
    }
    if(!hasLowerCase) {
        return {
            valid: false,
            message: "Atleast one lower case character required"
        };
    }
    if(!hasSpecialChar) {
        return {
            valid: false,
            message: "Atleast one special character required"
        };
    }

    return {
        valid: true
    };
}
module.exports = validatePassword;