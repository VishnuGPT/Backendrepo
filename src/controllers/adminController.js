const Admin = require( '../models/admin');
const jwt = require('jsonwebtoken');

exports.SignIn = async (req, res) => {
    const body = req.body;
    try {
        const admin = await Admin.findOne({ where: { email: body.email } });
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        if (admin.password !== body.password) {
            return res.status(401).json({ message: 'Invalid password' });
        }
        const token = jwt.sign({
            id: admin.id,
            email: admin.email,
            userType: 'admin'
        }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ message: 'Sign in successful', token });
    } catch (error) {
        console.error('Error signing in:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};




