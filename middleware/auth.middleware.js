import jwt from "jsonwebtoken";

export const authCheck = (req, res, next) => {
  const token =
    req.headers.authorization?.split(" ")[1] ||
    req.cookies.token ||
    req.query.token ||
    req.body.token;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized access" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user info to request object
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
