import nodemailer from 'nodemailer';

export async function sendOtpEmail(toEmail,otpCode){
 const user=process.env.SMTP_USER;const pass=process.env.SMTP_PASS;
 if(!user||!pass)throw Error('SMTP credentials missing');
 const transport=nodemailer.createTransport({host:'smtp.gmail.com',port:465,secure:true,auth:{user,pass},connectionTimeout:10000,greetingTimeout:10000,socketTimeout:15000});
 return transport.sendMail({from:{name:"Marketing @ NoBroker Loans",address:user},to:toEmail,subject:'Your NoBroker Loans verification code',
 text:`Your NoBroker Loans verification code is ${otpCode}. It expires in 5 minutes. If you did not request this, ignore this email.`,
 html:`<div style="font-family:Arial,sans-serif;color:#181818;max-width:520px"><h2>NoBroker Loans</h2><p>Your verification code is:</p><p style="font-size:32px;font-weight:bold;letter-spacing:6px;color:#D80000">${otpCode}</p><p>It expires in 5 minutes. If you did not request this, ignore this email.</p></div>`});
}
