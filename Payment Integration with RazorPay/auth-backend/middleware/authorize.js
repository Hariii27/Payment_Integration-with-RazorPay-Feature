module.exports = (...allowedRoles) => (res, req, next) => {
    if(!req.user || !allowedRoles.includes(req.user.role)){
        return res
            .status(403)
            .json({ message: 'Access denied: insufficient permission'});
    }
    next();
};