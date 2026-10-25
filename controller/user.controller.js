const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../models");

const User = db.users;
const BCRYPT_ROUNDS = 12;
// Pre-computed hash compared against when the email is unknown, so sign-in
// takes similar time whether or not the account exists.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", BCRYPT_ROUNDS);

const tokenTtlSeconds = () => Number(process.env.JWT_EXPIRES_IN) || 3600;

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
});

const publicUser = (u) => ({ id: u.id, email: u.email, createdAt: u.createdAt });

const signup = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "User already exists" });
    }

    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    try {
      const user = await User.create({ email, password: hash });
      return res.status(201).json(publicUser(user));
    } catch (err) {
      // Lost a race with a concurrent signup for the same email.
      if (err.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({ error: "User already exists" });
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

const signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    const ok = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);
    // Same response for unknown email and wrong password (no user enumeration).
    if (!user || !ok) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const ttl = tokenTtlSeconds();
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      algorithm: "HS256",
      expiresIn: ttl,
    });
    res.cookie("token", token, { ...cookieOptions(), maxAge: ttl * 1000 });
    return res.status(200).json({ ...publicUser(user), token });
  } catch (err) {
    next(err);
  }
};

const getAllUser = async (req, res, next) => {
  try {
    const users = await User.findAll({ attributes: ["id", "email", "createdAt"] });
    return res.status(200).json({ users });
  } catch (err) {
    next(err);
  }
};

const logout = (req, res) => {
  res.clearCookie("token", cookieOptions());
  return res.status(200).json({ message: "User logged out successfully" });
};

module.exports = { signup, signin, getAllUser, logout };
