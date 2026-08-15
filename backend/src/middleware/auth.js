import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  // 1. Read the Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  // 2. Extract the token (strip the "Bearer " prefix)
  const token = authHeader.split(' ')[1];

  try {
    // 3. Verify the signature and decode the payload
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Attach the user id to the request for controllers to use
    req.userId = payload.userId;

    // 5. Let the request proceed to the controller
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}