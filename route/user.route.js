import express from "express";
import {
  userRegister,
  userLogin,
  userProfile,
  userProfileUpdate,
  userDelete,
  getAllUsers,
  getSingleUser,
  updateSingleUser,
  deleteSingleUser,
} from "../controller/user.controller.js";
import { authCheck } from "../middleware/auth.middleware.js";

const userRouter = express.Router();

userRouter.post("/register", userRegister);
userRouter.post("/login", userLogin);
userRouter.get("/profile", authCheck, userProfile);
userRouter.put("/profile/update", authCheck, userProfileUpdate);
userRouter.delete("/profile/delete", authCheck, userDelete);

userRouter.get("/all-users", getAllUsers);
userRouter.get("/get-single-user/:id", authCheck, getSingleUser);
userRouter.put("/update-single-user/:id", authCheck, updateSingleUser);
userRouter.delete("/delete-single-user/:id", authCheck, deleteSingleUser);

export default userRouter;
