const sgMail = require('@sendgrid/mail');

const sender = 'sourabhpatil678@gmail.com';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (name, email) => {
    console.log(name, email);
    const msg = {
        to: email,
        from: sender,
        subject: 'Thank you for joining us',
        text: `Hello, ${name}. Welcome on board...you can share your app experience here`
    }
    sgMail.send(msg);
}

const sendCancellationEmail = (name, email) => {
    const msg = {
        to: email,
        from: sender,
        subject: `Goodbye, ${name}`,
        text: `Goodbye, ${name}. You can tell how we can improve ourselves, So we will be able serve you better next time.`
    };
    sgMail.send(msg);
}

module.exports = {
    sendWelcomeEmail,
    sendCancellationEmail
}