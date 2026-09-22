import jwt from "jsonwebtoken";

const genToken = async (userId) => {
  try {
    const secret = process.env.JWT_SECRET || "instructoplus_jwt_secret_development_key_123";
    const token = await jwt.sign({ userId }, secret, {
      expiresIn: "7d",
    });
    return token;
  } catch (error) {
    console.log("token error", error);
  }
};

export default genToken