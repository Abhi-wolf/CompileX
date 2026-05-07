import express from "express";
import { validateRequestBody } from "../../validators";
import { AuthFactory } from "../../factory/auth.factory";
import {
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  updateUserSchema,
} from "../../validators/auth.validator";
import { authorize } from "../../middlewares/authorization.middleware";
import { verifyHAMCSignature } from "../../middlewares/verifyHMACSignature";

const authController = AuthFactory.getAuthController();

const authRouter = express.Router();

authRouter.use(verifyHAMCSignature);

authRouter.post(
  "/register",
  validateRequestBody(registerSchema),
  authController.register,
);
authRouter.post(
  "/login",
  validateRequestBody(loginSchema),
  authController.login,
);

// TODO: remove this or make it a authorized route with proper validation and remove the deleteAccountSchema
// Only for development purposes
// authRouter.delete(
//   "/deleteAccount",
//   validateRequestBody(deleteAccountSchema),
//   authController.deleteAccount,
// );

authRouter.put(
  "/refreshToken",
  validateRequestBody(refreshTokenSchema),
  authController.refreshToken,
);

authRouter.get("/me", authorize, authController.getMe);

authRouter.patch(
  "/:id",
  authorize,
  validateRequestBody(updateUserSchema),
  authController.updateUser,
);


export default authRouter;
