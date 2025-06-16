import mongoose from "mongoose";

import userModel from "../model/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

// Create a new user
export const userRegister = async (req, res) => {
  try {
    const { fname, lname, email, password, age, dob, phone } = req.body;

    //check if user already exists;
    const userExists = await userModel.find({ email });
    if (userExists.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    //hash password

    const hashedPassword = await bcrypt.hash(password, 10);

    //create new User

    const user = await userModel.create({
      fname,
      lname,
      fullName: `${fname} ${lname}`,
      email,
      password: hashedPassword,
      age,
      dob,
      phone,
    });

    return res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    res.status(500).json({
      message: "User registration failed",
      error: error.message,
    });
  }
};

export const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    //check if user exists
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User does not exist" });
    }

    //check if password is correct
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res
        .status(400)
        .json({ message: "Either email or password is incorrect" });
    }

    // generate a token

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "User logged in successfully",

      token,
    });
  } catch (error) {
    res.status(500).json({
      message: "User login failed",
      error: error.message,
    });
  }
};

export const userProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    //check if user exists
    const user = await userModel.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User profile fetched successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "User profile fetch failed",
      error: error.message,
    });
  }
};

export const userProfileUpdate = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res
        .status(400)
        .json({ message: "please login to update your profile" });
    }

    let { fname, lname, email, age, dob, phone, password } = req.body;

    //check if user exists
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    //check if email is already taken by another user
    const emailExists = await userModel.findOne({ email });
    if (emailExists && emailExists._id.toString() !== userId) {
      return res.status(400).json({ message: "Email already exists" });
    }

    //hash password if provided
    let hashedPassword;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    if (!fname) {
      fname = user.fname;
    }
    if (!lname) {
      lname = user.lname;
    }
    if (!email) {
      email = user.email;
    }
    if (!age) {
      age = user.age;
    }
    if (!dob) {
      dob = user.dob;
    }
    if (!phone) {
      phone = user.phone;
    }

    //update user profile
    const updatedUser = await userModel
      .findByIdAndUpdate(
        userId,
        {
          fname,
          lname,
          fullName: `${fname} ${lname}`,
          email,
          age,
          dob,
          phone,
          password: hashedPassword || user.password, // use existing password if not provided
        },
        { new: true }
      )
      .select("-password");

    return res.status(200).json({
      message: "User profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      message: "User profile update failed",
      error: error.message,
    });
  }
};

export const userDelete = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res
        .status(400)
        .json({ message: "Please login to delete your account" });
    }

    //check if user exists
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    //delete user
    const deletedUser = await userModel.findByIdAndDelete(userId);
    return res.status(200).json({
      message: "User deleted successfully",
      user: deletedUser,
    });
  } catch (error) {
    res.status(500).json({
      message: "User deletion failed",
      error: error.message,
    });
  }
};

// i want to build a controller for user to filter users by age and dob , sort users by age and fullname in ascending and descending order,search the user by fullname, phone, email and paginate the results.

export const getAllUsers = async (req, res) => {
  try {
    const {
      minAge,
      maxAge,

      startDate,
      endDate,
      search,
      sortBy,
      sortorder,
      page,
      limit,
    } = req.query;

    const query = {};

    //search by fullname, phone, email
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    //filter by age and dob

    if (minAge && maxAge) {
      query.age = { $gte: minAge, $lte: maxAge };
    }

    if (startDate && endDate) {
      query.dob = { $gte: startDate, $lte: endDate };
    }

    //sort by  age and fullname
    let sort = {};

    if (sortBy === "age") {
      sort.age = sortorder === "asc" ? 1 : -1;
    } else if (sortBy === "fullname") {
      sort.fullName = sortorder === "asc" ? 1 : -1;
    }

    //paginate the results
    const pageNumber = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 10;
    const skip = (pageNumber - 1) * pageSize;

    const users = await userModel
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(pageSize);
    const totalUsers = await userModel.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / pageSize);

    return res.status(200).json({
      message: "Users fetched successfully",
      users,
      total: totalUsers,
      limit: pageSize,
      totalPages,
      currentPage: pageNumber,
    });
  } catch (error) {
    res.status(500).json({
      message: "User filter failed",
      error: error.message,
    });
  }
};


export const getSingleUser = async (req, res) => {
  try {
    const userId = req.params.id;

    //check if user exists
    const user = await userModel.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User fetched successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "User fetch failed",
      error: error.message,
    });
  }
}

export const updateSingleUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { fname, lname, email, age, dob, phone ,password} = req.body;

    //check if user exists
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    //check if email is already taken by another user
    const emailExists = await userModel.findOne({ email });
    if (emailExists && emailExists._id.toString() !== userId) {
      return res.status(400).json({ message: "Email already exists" });
    }

    //hash password if provided
    let hashedPassword;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    //update user profile
    const updatedUser = await userModel
      .findByIdAndUpdate(
        userId,
        {
          fname,
          lname,
          fullName: `${fname} ${lname}`,
          email,
          age,
          dob,
          phone,
          password: hashedPassword || user.password, // use existing password if not provided
        },
        { new: true }
      )
      .select("-password");

    return res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      message: "User update failed",
      error: error.message,
    });
  }
};


export const deleteSingleUser = async (req, res) => {
  try {
    const userId = req.params.id;

    //check if user exists
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    //delete user
    const deletedUser = await userModel.findByIdAndDelete(userId);
    return res.status(200).json({
      message: "User deleted successfully",
      user: deletedUser,
    });
  } catch (error) {
    res.status(500).json({
      message: "User deletion failed",
      error: error.message,
    });
  }
};