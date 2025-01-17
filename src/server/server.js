const fs = require("fs");
const https = require("https");
const express = require("express");
const mariaDB = require("mysql2/promise");
const { v4 : uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');

require('dotenv').config();

const secretKey = process.env.JWT_SECRET_KEY;

const app = express();
app.use(express.json());

const cors = require("cors");
app.use(cors({
    origin: 'http://localhost:8080',
    credentials: true
}));

//https 인증서 위치
const options = {
    key : fs.readFileSync(process.env.HTTPS_KEY),
    cert : fs.readFileSync(process.env.HTTPS_CERT),
    ca : fs.readFileSync(process.env.HTTPS_CA),
};

const db = mariaDB.createPool({
    host : process.env.DB_HOST,
    port : process.env.DB_PORT,
    user : process.env.DB_USER,
    password : process.env.DB_PASSWORD,
    database : process.env.DB_SCHEMA
});

const nodemailler = require('nodemailer');

const transporter = nodemailler.createTransport({
    host : "smtp.gmail.com",
    port : 587,
    secure : false,
    auth : {
        user : process.env.EMAIL_ID,
        pass : process.env.EMAIL_PASSWORD
    }
});

const sendEmail = async (to, subject, text) => {
    try {
        const info = await transporter.sendMail({
            from : `'쇼핑몰' <${process.env.EMAIL_ID}>`,
            to,
            subject,
            text
        });

        console.log("이메일 발송 성공 : ", info.messageId);
    } catch (error) {
        console.error("이메일 발송 실패 : ", error);
    }
};

app.post( '/sessionCheck', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const { userId } = req.body;

    if(!token) return res.status(401).json({success : false, message : "정상적이지못한 세션입니다."});
    
    jwt.verify(token, secretKey, async (err) => {
        const [ session ] = await db.query('SELECT * FROM SHOPPING_LOGIN_SESSION WHERE USER_ID = ?', [userId]);

        if( session.length === 0 || session[0].SESSION_ID !== token || err){
            await db.query("DELETE FROM SHOPPING_LOGIN_SESSION WHERE USER_ID = ? AND SESSION_ID = ?",[userId, token]);
            return res.status(401).json({ success : false, message : "세션이 만료되어 안전을 위해 로그아웃했습니다."});
        }

        const newToken = jwt.sign({userId}, secretKey, {expiresIn: "1h"});

        await db.query("UPDATE SHOPPING_LOGIN_SESSION SET SESSION_ID = ? WHERE USER_ID = ?",[userId, userId]);

        res.status(200).json({ success : true, session : newToken });
    });
});

app.post("/signUp", async (req, res) => {
    const {userId, password, nickname, email} = req.body;

    try{
        const [idRows] = await db.query('SELECT * FROM SHOPPING_USER_INFORMATION WHERE USER_ID = ?', [userId]);
        if(idRows.length > 0) return res.status(400).json({success : false, message : "이미 사용중인 아이디입니다."});

        const [existingUser] = await db.query('SELECT * FROM SHOPPING_USER_INFORMATION WHERE EMAIL = ?', [email]);
        if(existingUser.length > 0) return res.status(400).json({success : false, message : "이미 사용중인 이메일입니다."});

        const token = uuidv4();
        const tokenExpiration = new Date(Date.now() + 30 * 60 * 1000); // 30분 유효

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query('INSERT INTO SHOPPING_USER_INFORMATION(USER_ID, PASSWORD, NICKNAME, EMAIL) VALUES (?, ?, ?, ?)', [userId, hashedPassword, nickname, email]);
        await db.query('INSERT INTO USER_TOKEN(USER_ID, EMAIL, TOKEN, TOKEN_EXPIRATION) VALUES (?, ?, ?, ?)', [userId, email, token, tokenExpiration]);

        const verificationLink = `https://localhost:8080/verify-email?token=${token}`;

        await sendEmail(
            email,
            "회원가입 인증 요청",
            `회원가입을 완료하시려면 다음 링크를 클릭해주세요 : ${verificationLink}`
        );

        console.log(`${userId} 회원가입`);

        return res.status(201).json({success : true, message : "회원가입이 완료되었습니다.\n인증 메일을 확인해주세요."});
    } catch(err){
        console.error("회원가입 오류 : ", err);
        return res.status(500).json({success : false, message : "회원가입에 실패했습니다."});
    }
});

app.get("/verify-email", async (req, res) => {
    const { token } = req.query;

    try {
        const [ rows ] = await db.query(
            'SELECT * FROM USER_TOKEN WHERE TOKEN = ? AND TOKEN_EXPIRATION > NOW()',
            [token]
        );

        if(rows.length === 0) return res.status(400).json({success : false, message : "유효하지 않거나 만료된 토큰입니다."});

        await db.query(
            "UPDATE SHOPPING_USER_INFORMATION SET USR_YN = 1 WHERE USER_ID = ?",
            [rows[0].USER_ID]
        );

        await db.query(
            'DELETE FROM USER_TOKEN WHERE USER_ID = ?',
            [rows[0].USER_ID]
        );
        
        console.log(rows[0].USER_ID, "님 이메일 인증 완료");
        res.status(200).send({success : true, message : "이메일 인증이 완료되었습니다."});
    } catch (error) {
        console.error("이메일 인증 오류 : ", error);
        res.status(500).json({success : false, message : "이메일 인증에 실패했습니다.\n다시 시도해주세요"});
    }
});

app.post("/login", async (req, res) => {
    const { userId, password } = req.body;

    try {
        const [rows] = await db.query("SELECT * FROM SHOPPING_USER_INFORMATION WHERE USER_ID = ? AND USR_YN = 1", [userId]);
        if(rows.length === 0) return res.status(404).json({success : false, message : "사용자를 찾을 수 없습니다."});

        const [ token_rows ] = await db.query("SELECT * FROM USER_TOKEN WHERE USER_ID = ?", [userId]);
        if(token_rows.length !== 0) return res.status(401).json({success : false, message : "이메일 인증이 완료되지않았습니다."});

        const user = rows[0];

        if(user.FAIL_COUNT >= 5) return res.status(401).json({success : false, message : "비밀번호를 5회 이상 틀리셨습니다.\n 비밀번호 변경 후 이용해주시길 바랍니다."});

        const isPasswordValid = await bcrypt.compare(password, user.PASSWORD);

        if(!isPasswordValid) {
            await db.query("UPDATE SHOPPING_USER_INFORMATION SET FAIL_COUNT = ? WHERE USER_ID = ?", [user.FAIL_COUNT + 1, userId]);
            return res.status(401).json({success : false, message : "아이디나 비밀번호가 일치하지않습니다."});
        }

        const [ session ] = await db.query("SELECT * FROM SHOPPING_LOGIN_SESSION WHERE USER_ID = ?", [userId]);
        const token = jwt.sign({userId}, secretKey, {expiresIn: "1h"});

        if(session.length === 0) await db.query("INSERT INTO SHOPPING_LOGIN_SESSION(USER_ID, SESSION_ID) VALUES (?, ?)", [userId, token]);
        else await db.query("UPDATE SHOPPING_LOGIN_SESSION SET SESSION_ID = ? WHERE USER_ID = ?", [token, userId]);

        await db.query("UPDATE SHOPPING_USER_INFORMATION SET FAIL_COUNT = ? WHERE USER_ID = ?", [0, userId]);

        console.log(`${userId} 로그인`);

        return res.status(200).json({success : true, message : `${userId}님 환영합니다.`, nickname : user.NICKNAME , admin : user.ADMIN, session : token});


    }catch (err){
        console.error(err);
        return res.status(500).json({success : false, message : "로그인이 실패했습니다.\n잠시 후에 다시 시도해주세요."});
    }
});

app.post("/logout", async (req, res) => {
    const { userId, session } = req.body;

    try {
        await db.query("DELETE FROM SHOPPING_LOGIN_SESSION WHERE USER_ID = ? AND SESSION_ID = ?", [userId, session]);

        console.log(`${userId} 로그아웃`);
        return res.status(200).json({success : true, message : '정상적으로 로그아웃되었습니다.'});
    }catch(err){
        console.error(err);
        return res.status(500).json({success : false, message : "로그아웃에 실패했습니다."});
    }
});

app.post("/sessionCheck", async (req, res) => {
    const {userId, session} = req.body;

    try{
        const [rows] = await db.query("SELECT * FROM SHOPPING_LOGIN_SESSION WHERE USER_ID = ? AND SESSION_ID = ?", [userId, session]);
        if(rows.length === 0) return res.status(200).json({success : true, message : `다른 곳에서 로그인이 시도되어 로그아웃되었습니다.`});

    }catch (err) {
        console.error(err);
        res.status(500).json({success : false, message : "세션 체크에 실패했습니다.\n잠시 뒤 다시 체크합니다."});
    }
});

const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination : (req, file, cb) => {
        const uploadDir = path.join(__dirname, "../web/uploads");

        if(!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive : true});
        cb(null, uploadDir);
    },

    filename : (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

app.post("/product/merge", upload.array("images"), async (req, res) => {
    const { TITLE, DESCRIPTION, SKILLS } = req.body;
    const skill = Array.isArray(SKILLS) ? SKILLS : SKILLS ? [SKILLS] : [];
    const imagePaths = req.files.map((file) => `/uploads/${file.filename}`);
    try {

        const [result] = await db.query(
            "INSERT INTO SHOPPING_PRODUCT(TITLE, DESCRIPTION, SKILLS, IMAGES) VALUES (?, ?, ?, ?)",
            [TITLE, DESCRIPTION, JSON.stringify(skill), JSON.stringify(imagePaths)]
        );

        console.log("상품 등록 : ", result.insertId);

        res.status(201).json({success : true, message : "상품이 성공적으로 등록되었습니다.", productId : result.insertId});

    } catch (error) {
        console.error("상품 등록 실패 : ", error);
        res.status(500).json({success : false, message : "상품 등록에 실패했습니다."});
    }
});

app.put("/product/merge/:id", upload.array("images"), async (req, res) => {
    const { TITLE, DESCRIPTION, SKILLS, images } = req.body;
    const skill = Array.isArray(SKILLS) ? SKILLS : SKILLS ? [SKILLS] : [];
    const imagePaths = req.files.map((file) => `/uploads/${file.filename}`);
    const productId = req.params.id;
    if(typeof images != "undefined") typeof images == "string" ? imagePaths.push([images]) : imagePaths.push(...images);
    try {
        const [rows] = await db.query(
            "SELECT IMAGES FROM SHOPPING_PRODUCT WHERE ID = ?",
            [productId]
        );

        JSON.parse(rows[0].IMAGES).forEach((image) => {
            if(!imagePaths.includes(image)) {
                const filePath = path.join(__dirname, "../web/uploads", path.basename(image));

                if(fs.existsSync(filePath)){
                    try{
                        fs.unlinkSync(filePath);
                    }catch(error){
                        console.error("이미지 삭제 오류 : ", image, error);
                    }
                }
            }
        });

        const [ result ] = await db.query(
            "UPDATE SHOPPING_PRODUCT SET TITLE = ?, DESCRIPTION = ?, SKILLS = ?, IMAGES = ? WHERE ID = ?",
            [TITLE, DESCRIPTION, JSON.stringify(skill), JSON.stringify(imagePaths), productId]
        );

        console.log("상품 수정 : ", result);

        res.status(201).json({success : true, message : "상품이 성공적으로 수정되었습니다.", productId : productId});
    } catch (error) {
        console.error("상품 수정 실패 : ", error);
        res.status(500).json({success : false, message : "상품 수정에 실패했습니다."});
    }
});

app.get("/product/:id", async (req, res) => {
    const productId = req.params.id;

    try {
        const [rows] = await db.query("SELECT * FROM SHOPPING_PRODUCT WHERE ID = ?", [productId]);

        if( rows.length === 0 ) {
            console.log(`${productId} 상품이 없습니다.`);
            return res.status(404).json({success : false, message : "상품을 찾을 수 없습니다."});
        }
        console.log(`${rows[0].TITLE} 상품 조회`);
        res.status(200).json({success : true, product : rows[0]});
    } catch (error) {
        console.log("상품 상세 조회 오류 : ", error);
        res.status(500).json({success : false, message : "상품 상세 조회하는데 실패했습니다."});
    }
});

app.get("/products", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT ID, TITLE FROM SHOPPING_PRODUCT");

        console.log(`${rows.length} 건의 상품이 발견되었습니다.`);

        res.status(200).json({success : true, products : rows});
    } catch (error) {
        console.error("상품 목록 조회 오류 : ". error);
        res.status(500).json({success : false, message : "상품 목록을 조회하는데 실패했습니다."})
    }
});

app.delete("/product/delete/:id", async (req, res) => {
    const productId = req.params.id;

    try {
        const [rows] = await db.query(
            "SELECT IMAGES FROM SHOPPING_PRODUCT WHERE ID = ?",
            [productId]
        );

        JSON.parse(rows[0].IMAGES).forEach((image) => {
            const filePath = path.join(__dirname, "../web/uploads", path.basename(image));

            if(fs.existsSync(filePath)){
                try{
                    fs.unlinkSync(filePath);
                }catch(error){
                    console.error("이미지 삭제 오류 : ", image, error);
                }
            }
        });

        const [result] = await db.query("DELETE FROM SHOPPING_PRODUCT WHERE ID = ?", [productId]);

        if(result.affectedRows === 0) return res.status(404).json({success : false, message : "상품을 찾을 수 없어 삭제할 수 없습니다."});

        console.log(`${productId} 상품이 삭제되었습니다.`);
        res.status(200).json({success : true, message : "상품이 삭제되었습니다."});
    } catch (error) {
        console.error("상품 삭제 오류 : ", error);

        res.status(500).json({success : false, message : "상품을 삭제하는데 실패했습니다."});
    }
});

app.delete("/deleteAccount", async (req, res) => {
    const {userId, password} = req.body;

    try{
        const [ rows ] = await db.query(
            "SELECT PASSWORD FROM SHOPPING_USER_INFORMATION WHERE USER_ID = ?",
            [userId]
        );

        if(rows.length === 0){
            console.log("사용자를 찾을 수 없습니다.");
            return res.status(404).json({success : false, message : "사용자를 찾을 수 없습니다."});
        }

        const user = rows[0];

        const isMatch = await bcrypt.compare(password, user.PASSWORD);

        if(!isMatch){
            console.log("비밀번호가 일치하지않습니다.");
            return res.status(401).json({success : false, message : "비밀번호가 일치하지않습니다."});
        }

        await db.query("DELETE FROM SHOPPING_USER_INFORMATION WHERE USER_ID = ?", [userId]);

        console.log(`${userId}의 아이디가 삭제되었습니다.`);
        return res.status(200).json({success : true, message : "계정이 성공적으로 삭제되었습니다."});
    }catch (error) {
        console.error("회원탈퇴 오류 : ", error);
        return res.status(500).json({success : false, message : "서버 오류가 발생했습니다."});
    }
});

app.put("/changePassword", async (req, res) => {
    const { userId, currentPassword, newPassword } = req.body;

    try {
        const [ rows ] = await db.query(
            "SELECT PASSWORD FROM SHOPPING_USER_INFORMATION WHERE USER_ID = ?",
            [userId]
        );

        if(rows.length === 0){
            console.log("사용자를 찾을 수 없습니다.");
            return res.status(404).json({success : false, message : "사용자를 찾을 수 없습니다."});
        }

        const user = rows[0];

        const isMatch = await bcrypt.compare(currentPassword, user.PASSWORD);

        if(!isMatch){
            console.log("비밀번호가 일치하지않습니다.");
            return res.status(401).json({success : false, message : "현재 비밀번호가 일치하지않습니다."});
        }

        await db.query("UPDATE SHOPPING_USER_INFORMATION SET PASSWORD = ? WHERE USER_ID = ?", [newPassword, userId]);

        console.log(`${userId}님 비밀번호 변경 성공`);

        return res.status(200).json({success : true, message : "비밀번호가 성공적으로 변경되었습니다."});
    }catch (error) {
        console.error("비밀번호 변경 오류 : ", error);
        return res.status(500).json({success : false, message : "서버 오류가 발생했습니다."});
    }
});

app.post("/checkPassword", async (req, res) => {
    const { userId, password } = req.body;

    try {
        const [ rows ] = await db.query(
            "SELECT USER_ID, EMAIL, NICKNAME, PASSWORD FROM SHOPPING_USER_INFORMATION WHERE USER_ID = ?",
            [userId]
        );

        if(rows.length === 0){
            console.log("사용자를 찾을 수 없습니다.");
            return res.status(404).json({success : false, message : "사용자를 찾을 수 없습니다."});
        }

        const user = rows[0];

        const isMatch = await bcrypt.compare(password, user.PASSWORD);

        if(!isMatch) {
            console.log("비밀번호가 일치하지않습니다.");
            return res.status(401).json({success: false, message: "비밀번호가 일치하지않습니다."});
        }else{
            console.log("사용자 인증이 성공하였습니다.");
            return res.status(200).json({success : true, user : user, message : "사용자 인증에 성공하였습니다."});
        }
    }catch (error) {
        console.error("비밀번호 변경 오류 : ", error);
        return res.status(500).json({success : false, message : "비밀번호 변경 오류"});
    }
})

//app.listen(3333, () => console.log("서버가 연결되었습니다."));

https.createServer(options, app).listen(3333, () => console.log("서버가 연결되었습니다."));