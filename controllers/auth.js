
const {StatusCodes} = require('http-status-codes');
const Player = require('../models/Player');
const UnverifiedUsers = require('../models/Unverified-Users');
const PasswordReset = require('../models/Password-Reset');
const Otp = require('../models/Otp');
const {BadRequestError, UnauthenticatedError} = require('../errors');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const otpGenerator = require('otp-generator');
const bcrypt = require('bcryptjs');
const maskEmail = (email) => {
    const atIndex = email.indexOf('@');
    if (atIndex <= 2) return email; 

    const firstPart = email.slice(0, 2);
    const lastPart = email.slice(atIndex - 2, atIndex);
    const domain = email.slice(atIndex);

    const masked = `${firstPart}${'*'.repeat(atIndex - 4)}${lastPart}${domain}`;
    return masked;
};

const GenerateOtp  = async(req, res) =>{
    try{
        const otp =  otpGenerator.generate('8', { upperCaseAlphabets: false, specialChars: false });
        const {name} = req.body;
        const player = await Player.findOne({name : name});
        if(!player) throw new BadRequestError("User doesnt exist!");
        const otpEntry = new Otp({
            otp : otp,
            issuedFor: name,
        });
        await otpEntry.save();
        const transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.MAIL_ID,
                pass: process.env.MAIL_PASSWORD,
            },
        });
        const info = await transport.sendMail({
            from: process.env.MAIL_ID,
            to: player.email,
            subject: 'Forget Password - OTP Verification',
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2>Hello ${name},</h2>
                    <p>We received a request to reset your password for your account at <strong>WordleApp</strong>.</p>
                    <p>Your One-Time Password (OTP) for verification is:</p>
                    <p style="text-align: center; font-size: 24px; font-weight: bold;">${otp}</p>
                    <p>Please use this OTP to complete the password reset process. Note that this OTP is valid for 10 minutes.</p>
                    <p>If you did not request this OTP, please ignore this email.</p>
                    <p>Thank you for being a part of the WordleApp community. We are excited to have you on board!</p>
                    <p>Best regards,</p>
                    <p>The WordleApp Team</p>
                </div>
            `,
        });
        console.log('Otp sent successfully!');
        const token = jwt.sign({ id: player._id, name: player.name, email: player.email }, process.env.JWT_SECRET, { expiresIn: process.env.VERIFY_TOKEN_VALIDTY });
        const maskedEmail = maskEmail(player.email);
        res.status(StatusCodes.OK).json({
            msg: `An OTP has been sent to ${maskedEmail}\n Please check your inbox to verify and complete password-reset.`, token : token
        });
    }
    catch(err){
        console.log(err);
        throw new BadRequestError("OTP couldn't be generated try after some time!");
    }
}


const RegenerateOtp = async (req, res) => {
    try {
        const { token } = req.body;
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const { id, name, email } = payload;
        const player = await Player.findOne({ _id: id, name: name, email: email });
        if (!player) throw new BadRequestError("Invalid token! User doesn't exist.");
        const otp = otpGenerator.generate(8, { upperCaseAlphabets: false, specialChars: false });
        const otpEntry = new Otp({
            otp: otp,
            issuedFor: name,
        });
        await otpEntry.save();
        const transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.MAIL_ID,
                pass: process.env.MAIL_PASSWORD,
            },
        });
        const info = await transport.sendMail({
            from: process.env.MAIL_ID,
            to: player.email,
            subject: 'OTP Regeneration - WordleApp',
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2>Hello ${name},</h2>
                    <p>Your One-Time Password (OTP) for verification is:</p>
                    <p style="text-align: center; font-size: 24px; font-weight: bold;">${otp}</p>
                    <p>Please use this OTP to complete the password reset process. Note that this OTP is valid for 10 minutes.</p>
                    <p>If you did not request this OTP, please ignore this email.</p>
                    <p>Thank you for being a part of the WordleApp community. We are excited to have you on board!</p>
                    <p>Best regards,</p>
                    <p>The WordleApp Team</p>
                </div>
            `,
        });
        const maskedEmail = maskEmail(player.email);
        res.status(StatusCodes.OK).json({
            msg: `A new OTP has been sent to ${maskedEmail}\n Please check your inbox to verify and complete password-reset.`,
            token: token
        });
    } catch (err) {
        console.error(err);
        res.status(StatusCodes.BAD_REQUEST).json({ msg: "Invalid or expired token! Please try again." });
    }
}

const Register = async(req, res)=>{
    try{
    const {name, password, email} = req.body;
    const user = await UnverifiedUsers.create({name : name , password : password, email : email});
    const token = user.createJwt();
        const transport = nodemailer.createTransport(
            { 
                service:'gmail',
                auth:{
                    user:process.env.MAIL_ID,
                    pass:process.env.MAIL_PASSWORD
                }
            }
        );
        
        const info = await transport.sendMail({
            from: process.env.MAIL_ID,
            to: email,
            subject: 'Account Verification - WordleApp',
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2>Hello ${name},</h2>
                    <p>Thank you for registering with <strong>WordleApp</strong>!</p>
                    <p>To complete your registration and verify your email address, please click the following link:</p>
                    <p style="text-align: center;">
                        <a 
                            href="${process.env.FRONT_END_URL}/verify-link/${token}" 
                            style="display: inline-block; padding: 10px 20px; color: white; background-color: #007BFF; text-decoration: none; border-radius: 5px;"
                        >
                            Verify Account
                        </a>
                    </p>
                    <p>Please note, this link is only valid for ${process.env.VERIFICATION_LINK_VALIDITY}.</p>
                    <p>If the button above doesn't work, please copy and paste the following URL into your web browser:</p>
                    <p><a href="${process.env.FRONT_END_URL}/verify-link/${token}">${process.env.FRONT_END_URL}/verify-link/${token}</a></p>
                    <p>If you did not create an account with us, please ignore this email.</p>
                    <p>Thank you for joining the WordleApp community. We are excited to have you on board!</p>
                    <p>Best regards,</p>
                    <p>The WordleApp Team</p>
                </div>
            `,
        });
        
    console.log('Mail sent successfully !');
    const maskedEmail = maskEmail(email);
    res.status(StatusCodes.OK).json({
        msg: `A verification link has been sent to ${maskedEmail}\nPlease check your inbox to verify and complete registeration.`
    });
    }
    catch(err){
        console.log(err);
        throw new BadRequestError('Something went wrong ... Try again later !');
    }
} 

const Login = async(req, res)=>{
    const {name, password} = req.body;
    const user = await Player.findOne({name});
    if(!user)
    {
        throw new BadRequestError('User does not exist');
    }
    const isSame = await user.comparePassword(password);
    if(!isSame){
        throw new UnauthenticatedError('Invalid Password !!');
    }
    const token = user.createJwt();
    res.status(StatusCodes.OK).json({player : {playerId : user._id, playerName : user.name}, token});
}  


const VerifyToken = (req, res)=>{
    res.status(StatusCodes.OK).json({status : "OK"});
}


const VerifyLink = async(req, res)=>{
    const {token} = req.body;
    try{
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const { playerName, playerEmail, playerId } = payload;
        let player = await Player.findOne({ name: playerName });
        if (player) {
            throw new BadRequestError("Someone has already registered with that username!");
        }
        player = await Player.findOne({ email: playerEmail });
        if (player) {
            throw new BadRequestError("Someone has already registered with that email!");
        }

        let unverifiedPlayer = await UnverifiedUsers.findOne({ name: playerName, email: playerEmail, _id: playerId });
        if (!unverifiedPlayer) {
            throw new UnauthenticatedError("Link is invalid or has expired!");
        }
        const { password } = unverifiedPlayer;
        const newPlayer = new Player({
            name: playerName,
            email: playerEmail,
            password: password
        });
        await newPlayer.save();
        await UnverifiedUsers.deleteOne({ _id: playerId });
        res.status(200).json({ msg: 'Link verified .... Your registration is completed!' });
    }
    catch(err)
    {   
        throw new UnauthenticatedError("Link is invalid or has expired!");   
    }
}
const checkUserName = async (req, res) => {
    const { new_name } = req.body;
    const playerName = new_name;
    const playerWithName = await Player.findOne({ name: playerName });

    if (playerWithName) {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Username is already taken!" });
    } else {
        if(playerName.length < 5 )  return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Username is too short!" });
        return res.status(StatusCodes.OK).json({ msg: "Username is available" });
    }
}


const checkUserEmail = async (req, res) => {
    const { new_email } = req.body;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(new_email)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Invalid email format!" });
    }
    const playerEmail = new_email;
    const playerWithEmail = await Player.findOne({ email: playerEmail });
    if (playerWithEmail) {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Email is already in use!" });
    } else {
        return res.status(StatusCodes.OK).json({ msg: "Email is available" });
    }
}



const verifyOtp = async (req, res) => {
    try {
      const { otp, token } = req.body;
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const playerName = payload.name;
    //  console.log({otp, token});
      const fetchedOtp = await Otp.findOne({ issuedFor: playerName });
      if (!fetchedOtp) throw new BadRequestError("OTP has expired!");
      
      const isValid = await fetchedOtp.isValidOtp(otp);
      if (!isValid) throw new BadRequestError("Invalid OTP!");
  
      const newPasstoken = jwt.sign(
        { id: payload.id, name: payload.name, email: payload.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.PASSWORD_SET_VALIDITY }
      );
  
      await PasswordReset.create({ token: newPasstoken });
  
      res.status(200).json({
        msg: `OTP verified! You have ${process.env.PASSWORD_SET_VALIDITY_IN_WORDS} to reset the password!`,
        token: newPasstoken
      });
      console.log('Otp has been verified');
    } catch (err) {
        throw new BadRequestError("Invalid Request!");
     
    }
  };


const PasswordSet = async (req, res) => {
  try {
    const { token, password } = req.body;
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const fetchedToken = await PasswordReset.findOne({ token: token });
    if (!fetchedToken) throw new UnverifiedUsers("Invalid Request!");

    await PasswordReset.deleteOne({ token: token });

    const player = await Player.findOne({ name: payload.name });
    if (!player) throw new UnverifiedUsers("Player not found!");

    const hashedPassword = await bcrypt.hash(password, 10);
    player.password = hashedPassword;
    await player.save();
    console.log('password reset successful!');
    res.status(200).send({ msg: "Password updated successfully!" });
  } catch (err) {
    console.error(err);
    res.status(400).send({ msg: "Invalid Request... User Not Verified!" });
  }
};

module.exports = {Register, Login, VerifyToken, checkUserEmail, checkUserName, VerifyLink, GenerateOtp,verifyOtp, PasswordSet, RegenerateOtp};