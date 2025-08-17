const { Shipper,Transporter} = require("../models/index");
const nodemailer = require('nodemailer');

exports.getUserModel = (userType) => {
  if (userType === 'shipper') return Shipper;
  if (userType === 'transporter') return Transporter;
  throw new Error('Invalid userType');
}

const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: process.env.EMAIL_USER,     // e.g., your gmail
    pass: process.env.EMAIL_PASS      // app password (not your Gmail password)
  }
});

exports.sendEmail = async({ to, subject, html }) => {
  const mailOptions = {
    from: `${process.env.EMAIL_USER}`,
    to,
    subject,
    html
  };

  await transporter.sendMail(mailOptions);
}