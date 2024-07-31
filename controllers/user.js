const { hashPassword, comparePassword } = require("../helper/hashPassword");
const User = require("../models/user");
const Folder = require("../models/folder");
const JWT = require("jsonwebtoken");

const registerController = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const usernameRegex = /^[A-Za-z\s]+$/;
    const passwordRegex =
      /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (
      !username ||
      !email ||
      !password ||
      !usernameRegex.test(username.trim()) ||
      !emailRegex.test(email.trim()) ||
      !passwordRegex.test(password.trim())
    ) {
      return res.status(400).send({ errorMessage: "Bad request" });
    }
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.status(409).send({ errorMessage: "User already exists" });
    }
    const hashedPassword = await hashPassword(password.trim());
    const generalFolder = new Folder({ name: "General" });
    await generalFolder.save();
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      general: generalFolder._id,
    });
    await newUser.save();

    generalFolder.creator = newUser._id;
    await generalFolder.save();
    res.status(201).send({ message: "Register Successfully" });
  } catch (err) {
    return res.status(500).json({ errorMessage: "Internal Server Error" });
  }
};

const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).send({ errorMessage: "Bad request" });
    }

    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(409).send({ errorMessage: "User doesn't exists" });
    }
    const check = await comparePassword(password.trim(), user.password);
    if (!check) {
      return res.status(401).send({ errorMessage: "Invalid credentials" });
    }
    const token = JWT.sign({ userId: user._id }, process.env.SECRET_KEY, {
      expiresIn: "60h",
    });
    res.status(200).send({
      message: "Login successfully",
      token,
      name: user.username,
      userId: user._id,
      generalId: user.general,
    });
  } catch (error) {
    return res.status(500).json({ errorMessage: "Internal Server Error" });
  }
};

const updateController = async (req, res) => {
  try {
    const data = req.body;
    const creator = req.creator;
    const nameRegex = /^[A-Za-z\s]+$/;
    const passwordRegex =
      /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!data) {
      return res.status(400).send({ errorMessage: "Bad request" });
    }
    if (data.name) {
      if (!nameRegex.test(data.name.trim())) {
        return res.status(400).send({ errorMessage: "Bad request" });
      } else {
        const updateName = await User.findByIdAndUpdate(
          creator,
          { $set: { username: data.name } },
          { new: true, runValidators: true }
        );
        return res
          .status(201)
          .send({
            name: data.name.trim(),
            message: "Name updated successfully",
          });
      }
    } else if (data.email) {
      if (!emailRegex.test(data.email.trim())) {
        return res.status(400).send({ errorMessage: "Bad request" });
      } else {
        const existingUser = await User.findOne({ email: data.email });
        if (existingUser) {
          return res.status(409).send({ errorMessage: "Email already exists" });
        }
        const updateEmail = await User.findByIdAndUpdate(
          creator,
          { $set: { email: data.email } },
          { new: true, runValidators: true }
        );
        return res
          .status(201)
          .send({ logout: true, message: "Email updated successfully" });
      }
    } else if (data.oldPassword && data.password) {
      if (!passwordRegex.test(data.password)) {
        return res.status(400).send({ errorMessage: "Bad request" });
      }
      const existingUser = await User.findById(creator);
      const check1 = await comparePassword(
        data.oldPassword.trim(),
        existingUser?.password
      );
      const check2 = await comparePassword(
        data.password.trim(),
        existingUser?.password
      );

      if (!existingUser) {
        return res.status(400).send({ errorMessage: "User Not Found" });
      }
      if (!check1) {
        return res.status(400).send({ errorMessage: "Old password not match" });
      }
      if (check2) {
        return res
          .status(400)
          .send({ errorMessage: "New password and old password are same" });
      }
      const hashedPassword = await hashPassword(data.password.trim());
      const updatePassword = await User.findByIdAndUpdate(
        creator,
        { $set: { password: hashedPassword } },
        { new: true, runValidators: true }
      );
      return res
        .status(201)
        .send({ logout: true, message: "Password updated successfully" });
    } else {
      return res.status(400).send({ errorMessage: "Bad request" });
    }
  } catch (err) {
    return res.status(500).json({ errorMessage: "Internal Server Error" });
  }
};

module.exports = {
  registerController,
  loginController,
  updateController,
};
